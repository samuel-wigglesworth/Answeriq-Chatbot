"""
Subjective answer evaluator using scikit-learn for semantic context matching.
Compares the user's answer to a reference answer via TF-IDF cosine similarity,
then derives sub-scores, missing concepts, and improvement suggestions.
"""

from __future__ import annotations

import json
import re
import urllib.error
import urllib.request
from dataclasses import dataclass
from typing import Any

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# ─── Helpers ────────────────────────────────────────────────────────────────

WORD_RE = re.compile(r"[a-zA-Z][a-zA-Z0-9\-']{1,}")
STOPWORDS = {
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of",
    "is", "are", "was", "were", "be", "been", "being", "have", "has", "had",
    "do", "does", "did", "will", "would", "could", "should", "may", "might",
    "this", "that", "these", "those", "it", "its", "they", "them", "their",
    "with", "from", "by", "as", "if", "when", "where", "which", "who", "whom",
    "what", "how", "why", "can", "not", "no", "so", "also", "than", "then",
    "into", "about", "over", "such", "through", "during", "before", "after",
    "above", "below", "between", "under", "again", "further", "once", "here",
    "there", "all", "each", "few", "more", "most", "other", "some", "any",
    "both", "same", "own", "only", "very", "just", "because", "while", "although",
}


def _normalize(text: str) -> str:
    return re.sub(r"\s+", " ", text.strip().lower())


def _tokenize(text: str) -> set[str]:
    return {w.lower() for w in WORD_RE.findall(text) if w.lower() not in STOPWORDS and len(w) > 2}


def _clamp(value: float, lo: float = 0.0, hi: float = 10.0) -> float:
    return max(lo, min(hi, value))


def _grade_from_score(score: int) -> str:
    if score >= 9:
        return "Excellent"
    if score >= 7:
        return "Good"
    if score >= 5:
        return "Satisfactory"
    if score >= 3:
        return "Needs Improvement"
    return "Poor"


def _semantic_similarity(reference: str, user_answer: str) -> float:
    """TF-IDF cosine similarity — primary context-matching signal."""
    if not reference.strip() or not user_answer.strip():
        return 0.0
    vectorizer = TfidfVectorizer(
        stop_words="english",
        ngram_range=(1, 2),
        min_df=1,
        sublinear_tf=True,
    )
    matrix = vectorizer.fit_transform([reference, user_answer])
    return float(cosine_similarity(matrix[0:1], matrix[1:2])[0][0])


def _coverage_ratio(reference: str, user_answer: str) -> float:
    """Share of reference key terms present in the user's answer."""
    ref_terms = _tokenize(reference)
    if not ref_terms:
        return 1.0
    user_terms = _tokenize(user_answer)
    return len(ref_terms & user_terms) / len(ref_terms)


def _clarity_score(user_answer: str) -> float:
    """Heuristic clarity based on length, sentences, and structure."""
    text = user_answer.strip()
    if not text:
        return 0.0
    sentences = [s.strip() for s in re.split(r"[.!?]+", text) if s.strip()]
    words = WORD_RE.findall(text)
    word_count = len(words)
    if word_count < 8:
        return 2.0
    score = 5.0
    if 2 <= len(sentences) <= 8:
        score += 2.0
    elif len(sentences) > 1:
        score += 1.0
    avg_len = word_count / max(len(sentences), 1)
    if 8 <= avg_len <= 30:
        score += 2.0
    if any(c in text for c in (",", ";", ":")):
        score += 1.0
    return _clamp(score)


def _depth_score(user_answer: str, reference: str) -> float:
    """Depth approximated by unique terms relative to reference richness."""
    user_terms = _tokenize(user_answer)
    ref_terms = _tokenize(reference)
    if not user_terms:
        return 0.0
    if not ref_terms:
        return _clamp(len(user_terms) / 5.0)
    ratio = len(user_terms) / max(len(ref_terms), 1)
    return _clamp(ratio * 7.0 + (2.0 if len(user_terms) >= 12 else 0.0))


def _top_missing_phrases(reference: str, user_answer: str, limit: int = 6) -> list[str]:
    """Important reference n-grams absent from the user's answer."""
    if not reference.strip():
        return []
    vectorizer = TfidfVectorizer(
        stop_words="english",
        ngram_range=(1, 2),
        min_df=1,
        max_features=40,
    )
    try:
        matrix = vectorizer.fit_transform([reference])
    except ValueError:
        return []
    user_norm = _normalize(user_answer)
    features = vectorizer.get_feature_names_out()
    scores = matrix.toarray()[0]
    ranked = sorted(zip(features, scores), key=lambda x: x[1], reverse=True)
    missing: list[str] = []
    for phrase, _ in ranked:
        if phrase not in user_norm and phrase.replace(" ", "") not in user_norm.replace(" ", ""):
            missing.append(phrase)
        if len(missing) >= limit:
            break
    return missing


def _build_suggestions(
    question: str,
    reference: str,
    user_answer: str,
    missing: list[str],
    breakdown: list[dict[str, str]],
    similarity: float,
) -> list[str]:
    """Rule-based AI suggestions for improving the user's answer."""
    suggestions: list[str] = []

    # Get individual scores
    completeness = next((b for b in breakdown if b["name"] == "Completeness"), None)
    accuracy = next((b for b in breakdown if b["name"] == "Accuracy"), None)
    clarity = next((b for b in breakdown if b["name"] == "Clarity"), None)
    depth = next((b for b in breakdown if b["name"] == "Depth"), None)

    completeness_score = int(completeness["score"].split("/")[0]) if completeness else 10
    accuracy_score = int(accuracy["score"].split("/")[0]) if accuracy else 10
    clarity_score = int(clarity["score"].split("/")[0]) if clarity else 10
    depth_score = int(depth["score"].split("/")[0]) if depth else 10

    # Prioritize suggestions based on weakest areas
    if completeness_score < 7 and missing:
        suggestions.append(
            f"✓ Add missing key concepts: {', '.join(missing[:4])}. These are central to the reference answer."
        )

    if accuracy_score < 6:
        suggestions.append(
            "✓ Improve factual accuracy by aligning your core definitions and statements with the reference answer."
        )

    if similarity < 0.5:
        suggestions.append(
            "✓ Your answer covers a different aspect. Review the question carefully and focus on the main concepts from the reference."
        )

    if clarity_score < 7:
        suggestions.append(
            "✓ Structure your answer better: start with a clear definition, then elaborate with 2-3 supporting points."
        )

    if depth_score < 7:
        suggestions.append(
            "✓ Add more depth with specific examples, mechanisms, or real-world applications to strengthen your explanation."
        )

    if len(user_answer.split()) < 20:
        suggestions.append(
            "✓ Your answer is too brief. Aim for at least 3-4 complete sentences with detailed explanations."
        )

    # High-performing answer suggestions
    if accuracy_score >= 8 and completeness_score >= 8:
        if missing:
            suggestions.append(
                f"✓ Excellent work! To perfect your answer, consider mentioning: {', '.join(missing[:2])}."
            )
        else:
            suggestions.append(
                "✓ Outstanding answer! Your response comprehensively covers all key concepts from the reference."
            )

    # Ensure at least one suggestion
    if not suggestions:
        suggestions.append(
            "✓ Good answer overall. Polish by using more precise terminology from the reference answer."
        )

    return suggestions[:5]


def _summary(score: int, question: str) -> str:
    if score >= 8:
        return f"Your answer demonstrates solid understanding of “{question[:80]}”. Minor refinements could make it excellent."
    if score >= 5:
        return f"Your answer covers part of “{question[:80]}” but misses important concepts from the reference."
    return f"Your answer needs significant improvement to match the expected response for “{question[:80]}”."


def _maybe_gemini_suggestions(
    question: str,
    reference: str,
    user_answer: str,
    api_key: str | None,
) -> list[str] | None:
    if not api_key:
        return None

    prompt = f"""You are an academic tutor. A student answered a subjective question.
Return ONLY a JSON array of 3 short, specific improvement suggestions (strings).
No markdown, no extra text.

QUESTION: {question}
REFERENCE ANSWER: {reference}
STUDENT ANSWER: {user_answer}
"""

    url = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        f"gemini-2.0-flash:generateContent?key={api_key}"
    )
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.4, "maxOutputTokens": 512},
    }
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=25) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        text = data["candidates"][0]["content"]["parts"][0]["text"]
        clean = re.sub(r"```json\s*|```", "", text).strip()
        parsed = json.loads(clean)
        if isinstance(parsed, list) and all(isinstance(x, str) for x in parsed):
            return parsed[:4]
    except (urllib.error.URLError, KeyError, json.JSONDecodeError, IndexError, TimeoutError):
        return None
    return None


@dataclass
class EvaluationResult:
    score: int
    grade: str
    summary: str
    breakdown: list[dict[str, str]]
    suggestions: list[str]
    missing_points: list[str]
    similarity: float

    def to_dict(self) -> dict[str, Any]:
        return {
            "score": self.score,
            "grade": self.grade,
            "summary": self.summary,
            "breakdown": self.breakdown,
            "suggestions": self.suggestions,
            "missing_points": self.missing_points,
            "similarity": round(self.similarity, 4),
        }


def evaluate_answer(
    question: str,
    reference: str,
    user_answer: str,
    gemini_api_key: str | None = None,
) -> dict[str, Any]:
    """
    Score a subjective user answer against a reference using sklearn context matching.
    Returns a dict suitable for JSON API responses.
    """
    question = question.strip()
    reference = reference.strip()
    user_answer = user_answer.strip()

    if not question:
        raise ValueError("Question (A) is required.")
    if not reference:
        raise ValueError("Reference answer (B) is required.")
    if not user_answer:
        raise ValueError("User answer is required.")

    similarity = _semantic_similarity(reference, user_answer)
    coverage = _coverage_ratio(reference, user_answer)
    clarity = _clarity_score(user_answer)
    depth = _depth_score(user_answer, reference)

    # Weighted composite → integer score out of 10
    accuracy_raw = similarity * 10.0
    completeness_raw = coverage * 10.0
    composite = (
        accuracy_raw * 0.40
        + completeness_raw * 0.30
        + clarity * 0.15
        + depth * 0.15
    )
    score = int(round(_clamp(composite)))

    breakdown = [
        {"name": "Accuracy", "score": f"{int(round(_clamp(accuracy_raw)))}/10"},
        {"name": "Completeness", "score": f"{int(round(_clamp(completeness_raw)))}/10"},
        {"name": "Clarity", "score": f"{int(round(clarity))}/10"},
        {"name": "Depth", "score": f"{int(round(depth))}/10"},
    ]

    missing = _top_missing_phrases(reference, user_answer)
    suggestions = _build_suggestions(question, reference, user_answer, missing, breakdown, similarity)

    ai_suggestions = _maybe_gemini_suggestions(question, reference, user_answer, gemini_api_key)
    if ai_suggestions:
        suggestions = ai_suggestions

    result = EvaluationResult(
        score=score,
        grade=_grade_from_score(score),
        summary=_summary(score, question),
        breakdown=breakdown,
        suggestions=suggestions,
        missing_points=missing,
        similarity=similarity,
    )
    return result.to_dict()
