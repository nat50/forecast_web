
import sys
import os

# Add project root to path
sys.path.insert(0, ".")
sys.path.insert(0, "./services")

try:
    from services.recommendation_service import RecommendationService
    import google.generativeai as genai
    print("Successfully imported RecommendationService and google.generativeai")
except ImportError as e:
    print(f"Failed to import: {e}")
    sys.exit(1)

# Mock data
user_data = {
    "Age": 30,
    "Gender": "M",
    "Average screen time": 8,
    "Sleep duration": 6,
    "Sleep quality": 3,
    "Discomfort Eye-strain": "Y"
}

prediction_result = {
    "probability": 0.85,
    "risk_level": "High Risk",
    "risk_factors": [
        {"name": "Screen Time", "impact": "high"},
        {"name": "Sleep", "impact": "medium"}
    ]
}

# Test instantiation
try:
    print("Initializing RecommendationService...")
    service = RecommendationService()
    
    if service.model:
        print("Gemini model initialized successfully.")
    else:
        print("Warning: Gemini model NOT initialized (Key missing or invalid).")

    print("Generating recommendations...")
    # Note: This might fail if the dummy key provided by user is actually invalid for Gemini (though structure looks right).
    # But we want to test that the code runs without syntax error.
    recs = service.generate_recommendations(user_data, prediction_result)
    
    print(f"Generated {len(recs)} recommendations")
    print("Recommendations:", recs)
    
except Exception as e:
    print(f"Error during test: {e}")
    import traceback
    traceback.print_exc()
