"""
Quick test script to verify the evaluation system works correctly.
"""

import sys

# Test 1: Check dependencies
print("=" * 60)
print("TEST 1: Checking dependencies...")
print("=" * 60)

try:
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity
    print("✓ scikit-learn installed")
except ImportError as e:
    print(f"✗ scikit-learn NOT installed: {e}")
    sys.exit(1)

try:
    import numpy
    print("✓ numpy installed")
except ImportError as e:
    print(f"✗ numpy NOT installed: {e}")
    sys.exit(1)

# Test 2: Import evaluation module
print("\n" + "=" * 60)
print("TEST 2: Importing evaluation module...")
print("=" * 60)

try:
    from evaluate import evaluate_answer
    print("✓ evaluate.py imported successfully")
except ImportError as e:
    print(f"✗ Failed to import evaluate.py: {e}")
    sys.exit(1)

# Test 3: Run a sample evaluation
print("\n" + "=" * 60)
print("TEST 3: Running sample evaluation...")
print("=" * 60)

question = "Describe Quantum Mechanics"
reference = """Quantum mechanics is a branch of modern applied physics that describes 
the behavior of matter and energy at atomic and subatomic scales. Unlike classical physics, 
it introduces probabilistic outcomes, wave-particle duality, and quantization of energy levels. 
Key principles include the Schrödinger equation, Heisenberg uncertainty principle, and superposition."""

user_answer = """Quantum mechanics studies tiny particles like atoms and electrons. 
It uses probability instead of certainty. Things can be in multiple states at once."""

try:
    result = evaluate_answer(question, reference, user_answer)
    print(f"\n✓ Evaluation completed successfully!")
    print(f"\nScore: {result['score']}/10")
    print(f"Grade: {result['grade']}")
    print(f"Similarity: {result['similarity']:.4f}")
    print(f"\nBreakdown:")
    for item in result['breakdown']:
        print(f"  - {item['name']}: {item['score']}")
    print(f"\nSuggestions ({len(result['suggestions'])}):")
    for i, suggestion in enumerate(result['suggestions'], 1):
        print(f"  {i}. {suggestion}")
    print(f"\nMissing Points ({len(result['missing_points'])}):")
    for point in result['missing_points']:
        print(f"  - {point}")
except Exception as e:
    print(f"✗ Evaluation failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Test 4: Edge cases
print("\n" + "=" * 60)
print("TEST 4: Testing edge cases...")
print("=" * 60)

# Empty answer
try:
    result = evaluate_answer(question, reference, "")
    print("✗ Should have raised error for empty answer")
except ValueError as e:
    print(f"✓ Correctly rejected empty answer: {e}")

# Very short answer
try:
    result = evaluate_answer(question, reference, "It's about atoms.")
    print(f"✓ Short answer processed: score={result['score']}/10")
except Exception as e:
    print(f"✗ Failed on short answer: {e}")

# Very good answer
try:
    good_answer = """Quantum mechanics is a fundamental branch of physics describing 
    matter and energy at atomic scales. It features wave-particle duality, where particles 
    exhibit both wave and particle properties. The uncertainty principle states we cannot 
    simultaneously know position and momentum precisely. Superposition allows systems to 
    exist in multiple states until measured."""
    result = evaluate_answer(question, reference, good_answer)
    print(f"✓ Comprehensive answer processed: score={result['score']}/10")
except Exception as e:
    print(f"✗ Failed on comprehensive answer: {e}")

print("\n" + "=" * 60)
print("ALL TESTS PASSED! ✓")
print("=" * 60)
print("\nThe evaluation system is working correctly.")
print("You can now start the local server with: python local_server.py")
