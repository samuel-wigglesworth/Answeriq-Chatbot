/**
 * Cloudflare Worker for AnswerIQ evaluation API
 * JavaScript port of the Python scikit-learn evaluation system
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'OPTIONS, POST',
  'Content-Type': 'application/json',
};

// English stopwords for text processing
const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of',
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
  'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
  'this', 'that', 'these', 'those', 'it', 'its', 'they', 'them', 'their',
  'with', 'from', 'by', 'as', 'if', 'when', 'where', 'which', 'who', 'whom',
  'what', 'how', 'why', 'can', 'not', 'no', 'so', 'also', 'than', 'then',
  'into', 'about', 'over', 'such', 'through', 'during', 'before', 'after',
  'above', 'below', 'between', 'under', 'again', 'further', 'once', 'here',
  'there', 'all', 'each', 'few', 'more', 'most', 'other', 'some', 'any',
  'both', 'same', 'own', 'only', 'very', 'just', 'because', 'while', 'although',
]);

export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: CORS_HEADERS,
      });
    }

    // Only accept POST requests
    if (request.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed' }, 405);
    }

    try {
      const payload = await request.json();
      const { question, reference_answer, user_answer_1, gemini_api_key } = payload;

      // Use Gemini API key from environment or request (optional)
      const apiKey = gemini_api_key || env?.GEMINI_API_KEY;

      // Call the evaluation logic
      const result = await evaluateAnswer(
        question,
        reference_answer,
        user_answer_1,
        apiKey
      );

      return jsonResponse(result, 200);
    } catch (error) {
      console.error('Evaluation error:', error);
      return jsonResponse({
        error: error.message || 'Evaluation failed',
      }, error.message.includes('required') ? 400 : 500);
    }
  },
};

// ─── Main Evaluation Logic ──────────────────────────────────────────

async function evaluateAnswer(question, referenceAnswer, userAnswer, apiKey) {
  question = (question || '').trim();
  referenceAnswer = (referenceAnswer || '').trim();
  userAnswer = (userAnswer || '').trim();

  if (!question) throw new Error('Question (A) is required.');
  if (!referenceAnswer) throw new Error('Reference answer (B) is required.');
  if (!userAnswer) throw new Error('User answer is required.');

  // Calculate TF-IDF similarity (replaces scikit-learn)
  const similarity = semanticSimilarity(referenceAnswer, userAnswer);
  const coverage = coverageRatio(referenceAnswer, userAnswer);
  const clarity = clarityScore(userAnswer);
  const depth = depthScore(userAnswer, referenceAnswer);

  // Weighted composite score
  const accuracyRaw = similarity * 10.0;
  const completenessRaw = coverage * 10.0;
  const composite = (
    accuracyRaw * 0.40 +
    completenessRaw * 0.30 +
    clarity * 0.15 +
    depth * 0.15
  );
  const score = Math.round(clamp(composite, 0, 10));

  const breakdown = [
    { name: 'Accuracy', score: `${Math.round(clamp(accuracyRaw, 0, 10))}/10` },
    { name: 'Completeness', score: `${Math.round(clamp(completenessRaw, 0, 10))}/10` },
    { name: 'Clarity', score: `${Math.round(clarity)}/10` },
    { name: 'Depth', score: `${Math.round(depth)}/10` },
  ];

  const missing = topMissingPhrases(referenceAnswer, userAnswer, 6);
  let suggestions = buildSuggestions(
    question,
    referenceAnswer,
    userAnswer,
    missing,
    breakdown,
    similarity
  );

  // Try to get AI-powered suggestions from Gemini (optional)
  if (apiKey) {
    const aiSuggestions = await maybeGeminiSuggestions(
      question,
      referenceAnswer,
      userAnswer,
      apiKey
    );
    if (aiSuggestions && aiSuggestions.length > 0) {
      suggestions = aiSuggestions;
    }
  }

  return {
    score,
    grade: gradeFromScore(score),
    summary: buildSummary(score, question),
    breakdown,
    suggestions,
    missing_points: missing,
    similarity: Math.round(similarity * 10000) / 10000, // 4 decimal places
  };
}

// ─── Text Processing Helpers ────────────────────────────────────────

function normalize(text) {
  return text.trim().toLowerCase().replace(/\s+/g, ' ');
}

function tokenize(text) {
  const words = text.toLowerCase().match(/[a-zA-Z][a-zA-Z0-9\-']{1,}/g) || [];
  return words.filter(w => !STOPWORDS.has(w) && w.length > 2);
}

function tokenizeSet(text) {
  return new Set(tokenize(text));
}

function clamp(value, min = 0, max = 10) {
  return Math.max(min, Math.min(max, value));
}

function gradeFromScore(score) {
  if (score >= 9) return 'Excellent';
  if (score >= 7) return 'Good';
  if (score >= 5) return 'Satisfactory';
  if (score >= 3) return 'Needs Improvement';
  return 'Poor';
}

// ─── TF-IDF & Similarity (replaces scikit-learn) ────────────────────

function semanticSimilarity(reference, userAnswer) {
  if (!reference.trim() || !userAnswer.trim()) return 0.0;

  const refTokens = tokenize(reference);
  const userTokens = tokenize(userAnswer);

  if (refTokens.length === 0 && userTokens.length === 0) return 1.0;
  if (refTokens.length === 0 || userTokens.length === 0) return 0.0;

  // Build vocabulary
  const vocab = new Set([...refTokens, ...userTokens]);
  const vocabArray = Array.from(vocab);

  // Compute TF-IDF vectors (simplified - using TF with IDF approximation)
  const refVector = computeTfidfVector(refTokens, vocabArray, [refTokens, userTokens]);
  const userVector = computeTfidfVector(userTokens, vocabArray, [refTokens, userTokens]);

  // Cosine similarity
  return cosineSimilarity(refVector, userVector);
}

function computeTfidfVector(tokens, vocab, allDocs) {
  const vector = [];
  const termFreq = {};
  
  // Calculate term frequency
  tokens.forEach(token => {
    termFreq[token] = (termFreq[token] || 0) + 1;
  });

  // Calculate TF-IDF for each vocab term
  vocab.forEach(term => {
    const tf = (termFreq[term] || 0) / tokens.length;
    
    // Calculate IDF (inverse document frequency)
    const docsWithTerm = allDocs.filter(doc => doc.includes(term)).length;
    const idf = Math.log((allDocs.length + 1) / (docsWithTerm + 1)) + 1;
    
    vector.push(tf * idf);
  });

  return vector;
}

function cosineSimilarity(vec1, vec2) {
  if (vec1.length !== vec2.length) return 0;

  let dotProduct = 0;
  let mag1 = 0;
  let mag2 = 0;

  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    mag1 += vec1[i] * vec1[i];
    mag2 += vec2[i] * vec2[i];
  }

  if (mag1 === 0 || mag2 === 0) return 0;
  return dotProduct / (Math.sqrt(mag1) * Math.sqrt(mag2));
}

// ─── Scoring Components ─────────────────────────────────────────────

function coverageRatio(reference, userAnswer) {
  const refTerms = tokenizeSet(reference);
  if (refTerms.size === 0) return 1.0;
  
  const userTerms = tokenizeSet(userAnswer);
  const intersection = new Set([...refTerms].filter(t => userTerms.has(t)));
  
  return intersection.size / refTerms.size;
}

function clarityScore(userAnswer) {
  const text = userAnswer.trim();
  if (!text) return 0.0;

  const sentences = text.split(/[.!?]+/).filter(s => s.trim()).length;
  const words = tokenize(text);
  const wordCount = words.length;

  if (wordCount < 8) return 2.0;

  let score = 5.0;

  // Good sentence count
  if (sentences >= 2 && sentences <= 8) score += 2.0;
  else if (sentences > 1) score += 1.0;

  // Average sentence length
  const avgLen = wordCount / Math.max(sentences, 1);
  if (avgLen >= 8 && avgLen <= 30) score += 2.0;

  // Punctuation variety (indicates structure)
  if (/[,;:]/.test(text)) score += 1.0;

  return clamp(score);
}

function depthScore(userAnswer, reference) {
  const userTerms = tokenizeSet(userAnswer);
  const refTerms = tokenizeSet(reference);

  if (userTerms.size === 0) return 0.0;
  if (refTerms.size === 0) return clamp(userTerms.size / 5.0);

  const ratio = userTerms.size / Math.max(refTerms.size, 1);
  return clamp(ratio * 7.0 + (userTerms.size >= 12 ? 2.0 : 0.0));
}

// ─── Missing Concepts Detection ─────────────────────────────────────

function topMissingPhrases(reference, userAnswer, limit = 6) {
  if (!reference.trim()) return [];

  const refTokens = tokenize(reference);
  const userNorm = normalize(userAnswer);

  // Generate unigrams and bigrams from reference
  const ngrams = [];
  
  // Unigrams
  refTokens.forEach(token => {
    ngrams.push({ phrase: token, count: 1 });
  });

  // Bigrams
  for (let i = 0; i < refTokens.length - 1; i++) {
    ngrams.push({ phrase: `${refTokens[i]} ${refTokens[i + 1]}`, count: 2 });
  }

  // Count frequency and filter
  const phraseFreq = {};
  ngrams.forEach(({ phrase }) => {
    phraseFreq[phrase] = (phraseFreq[phrase] || 0) + 1;
  });

  // Sort by frequency and filter out phrases present in user answer
  const missing = Object.entries(phraseFreq)
    .sort((a, b) => b[1] - a[1])
    .map(([phrase]) => phrase)
    .filter(phrase => {
      const cleanPhrase = phrase.replace(/\s+/g, '');
      const cleanUser = userNorm.replace(/\s+/g, '');
      return !userNorm.includes(phrase) && !cleanUser.includes(cleanPhrase);
    })
    .slice(0, limit);

  return missing;
}

// ─── Suggestions Builder ────────────────────────────────────────────

function buildSuggestions(question, reference, userAnswer, missing, breakdown, similarity) {
  const suggestions = [];

  // Extract scores from breakdown
  const getScore = (name) => {
    const item = breakdown.find(b => b.name === name);
    return item ? parseInt(item.score.split('/')[0]) : 10;
  };

  const completenessScore = getScore('Completeness');
  const accuracyScore = getScore('Accuracy');
  const clarityScore = getScore('Clarity');
  const depthScore = getScore('Depth');

  // Prioritized suggestions based on weakest areas
  if (completenessScore < 7 && missing.length > 0) {
    suggestions.push(
      `✓ Add missing key concepts: ${missing.slice(0, 4).join(', ')}. These are central to the reference answer.`
    );
  }

  if (accuracyScore < 6) {
    suggestions.push(
      '✓ Improve factual accuracy by aligning your core definitions and statements with the reference answer.'
    );
  }

  if (similarity < 0.5) {
    suggestions.push(
      '✓ Your answer covers a different aspect. Review the question carefully and focus on the main concepts from the reference.'
    );
  }

  if (clarityScore < 7) {
    suggestions.push(
      '✓ Structure your answer better: start with a clear definition, then elaborate with 2-3 supporting points.'
    );
  }

  if (depthScore < 7) {
    suggestions.push(
      '✓ Add more depth with specific examples, mechanisms, or real-world applications to strengthen your explanation.'
    );
  }

  if (userAnswer.split(/\s+/).length < 20) {
    suggestions.push(
      '✓ Your answer is too brief. Aim for at least 3-4 complete sentences with detailed explanations.'
    );
  }

  // High-performing answer suggestions
  if (accuracyScore >= 8 && completenessScore >= 8) {
    if (missing.length > 0) {
      suggestions.push(
        `✓ Excellent work! To perfect your answer, consider mentioning: ${missing.slice(0, 2).join(', ')}.`
      );
    } else {
      suggestions.push(
        '✓ Outstanding answer! Your response comprehensively covers all key concepts from the reference.'
      );
    }
  }

  // Ensure at least one suggestion
  if (suggestions.length === 0) {
    suggestions.push(
      '✓ Good answer overall. Polish by using more precise terminology from the reference answer.'
    );
  }

  return suggestions.slice(0, 5);
}

function buildSummary(score, question) {
  const shortQuestion = question.length > 80 ? question.slice(0, 80) + '…' : question;
  
  if (score >= 8) {
    return `Your answer demonstrates solid understanding of "${shortQuestion}". Minor refinements could make it excellent.`;
  }
  if (score >= 5) {
    return `Your answer covers part of "${shortQuestion}" but misses important concepts from the reference.`;
  }
  return `Your answer needs significant improvement to match the expected response for "${shortQuestion}".`;
}

// ─── Gemini AI Integration (Optional) ───────────────────────────────

async function maybeGeminiSuggestions(question, reference, userAnswer, apiKey) {
  if (!apiKey) return null;

  const prompt = `You are an academic tutor. A student answered a subjective question.
Return ONLY a JSON array of 3 short, specific improvement suggestions (strings).
No markdown, no extra text.

QUESTION: ${question}
REFERENCE ANSWER: ${reference}
STUDENT ANSWER: ${userAnswer}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 512,
          },
        }),
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Clean up markdown formatting
    const clean = text.replace(/```json\s*|```/g, '').trim();
    const parsed = JSON.parse(clean);

    if (Array.isArray(parsed) && parsed.every(x => typeof x === 'string')) {
      return parsed.slice(0, 4);
    }
  } catch (error) {
    console.warn('Gemini API call failed:', error.message);
    return null;
  }

  return null;
}

// ─── Response Helper ────────────────────────────────────────────────

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: CORS_HEADERS,
  });
}
