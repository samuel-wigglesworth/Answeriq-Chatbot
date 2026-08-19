"""
AWS Lambda handler for AnswerIQ evaluation API.
Deploy with SAM template.yaml or as a Lambda Function URL.
"""

from __future__ import annotations

import json
import os
from typing import Any

from evaluate import evaluate_answer

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Access-Control-Allow-Methods": "OPTIONS,POST",
    "Content-Type": "application/json",
}


def _response(status: int, body: dict[str, Any]) -> dict[str, Any]:
    return {
        "statusCode": status,
        "headers": CORS_HEADERS,
        "body": json.dumps(body),
    }


def handler(event: dict[str, Any], context: Any) -> dict[str, Any]:
    method = event.get("requestContext", {}).get("http", {}).get("method") or event.get("httpMethod", "POST")

    if method == "OPTIONS":
        return {"statusCode": 204, "headers": CORS_HEADERS, "body": ""}

    try:
        raw = event.get("body") or "{}"
        if event.get("isBase64Encoded"):
            import base64
            raw = base64.b64decode(raw).decode("utf-8")
        payload = json.loads(raw) if isinstance(raw, str) else raw
    except json.JSONDecodeError:
        return _response(400, {"error": "Invalid JSON body."})

    question = payload.get("question", "")
    reference = payload.get("reference_answer", "")
    user_answer = payload.get("user_answer_1", "")
    gemini_key = payload.get("gemini_api_key") or os.environ.get("GEMINI_API_KEY")

    try:
        result = evaluate_answer(question, reference, user_answer, gemini_key)
        return _response(200, result)
    except ValueError as exc:
        return _response(400, {"error": str(exc)})
    except Exception as exc:  # noqa: BLE001 — Lambda must return JSON errors
        return _response(500, {"error": f"Evaluation failed: {exc}"})
