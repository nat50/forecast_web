import os
import json
from typing import List, Dict, Any

try:
    import google.generativeai as genai
except ImportError:
    genai = None

class RecommendationService:
    """
    Service to generate personalized health recommendations using Google Gemini.
    """
    def __init__(self, api_key: str = None):
        # User provided key with potential syntax error fixed (added quotes)
        self.api_key = api_key or "AIzaSyCJax066-yYW8rQp1lnpHMcgc_xjWohJ14" or os.environ.get("GEMINI_API_KEY")
        self.model = None
        
        if self.api_key and genai:
            try:
                genai.configure(api_key=self.api_key)
                self.model = genai.GenerativeModel('gemini-2.5-flash')
            except Exception as e:
                print(f"Error configuring Gemini: {e}")
        else:
            print("Warning: Gemini API key not found or google-generativeai package not installed.")

    def generate_recommendations(self, user_data: Dict[str, Any], prediction_result: Dict[str, Any]) -> List[str]:
        """
        Generate personalized recommendations based on user data and model predictions.
        """
        if not self.model:
            return self._get_fallback_recommendations(prediction_result.get('risk_level', 'Low Risk'))

        prompt = self._construct_prompt(user_data, prediction_result)

        try:
            response = self.model.generate_content(prompt)
            content = response.text
            return self._parse_response(content)
            
        except Exception as e:
            print(f"Error generating recommendations: {e}")
            return self._get_fallback_recommendations(prediction_result.get('risk_level', 'Low Risk'))

    def _construct_prompt(self, user_data: Dict[str, Any], prediction_result: Dict[str, Any]) -> str:
        """Construct a detailed prompt for the LLM."""
        
        # Extract key information
        risk_level = prediction_result.get('risk_level', 'Unknown')
        probability = prediction_result.get('probability', 0)
        risk_factors = prediction_result.get('risk_factors', [])
        
        # Format risk factors (SHAP values)
        factors_text = ""
        for factor in risk_factors:
            factors_text += f"- {factor['name']} (Impact: {factor['impact']})\n"
            
        prompt = f"""
        Generate 3 to 5 personalized health recommendations for a user based on the following analysis of Dry Eye Disease risk.
        
        User Profile:
        - Age: {user_data.get('Age')}
        - Gender: {user_data.get('Gender', 'N/A')}
        - Screen Time: {user_data.get('Average screen time')} hours/day
        - Sleep: {user_data.get('Sleep duration')} hours (Quality: {user_data.get('Sleep quality')}/5)
        - Eye Symptoms: {', '.join([k for k, v in user_data.items() if k in ['Discomfort Eye-strain', 'Redness in eye', 'Itchiness/Irritation in eye'] and v == 'Y'])}
        
        Prediction Model Results (XGBoost):
        - Risk Level: {risk_level} (Probability: {probability:.1%})
        
        Key Risk Factors (based on SHAP values):
        {factors_text}
        
        Requirements:
        1. Recommendations must be actionable and specific to the user's risk factors.
        2. If 'Screen Time' is a high risk factor, suggest specific breaks or adjustments.
        3. If 'Sleep' is an issue, suggest hygiene tips.
        4. Focus on immediate actions they can take.
        5. Output ONLY a valid JSON array of strings, for example: ["Action 1", "Action 2", "Action 3"]. Do not include markdown formatting like ```json or any other text.
        """
        return prompt

    def _parse_response(self, content: str) -> List[str]:
        """Parse the LLM response into a list of strings."""
        try:
            # Clean up potential markdown formatting
            cleaned_content = content.replace("```json", "").replace("```", "").strip()
            recommendations = json.loads(cleaned_content)
            if isinstance(recommendations, list):
                return recommendations
            else:
                return [str(recommendations)]
        except json.JSONDecodeError:
            # Fallback if not valid JSON, try to split by newlines
            lines = [line.strip().lstrip('- ').strip() for line in content.split('\n') if line.strip()]
            return [l for l in lines if l][:5]

    def generate_detailed_plan(self, recommendation_text: str, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate a detailed implementation plan for a specific recommendation.
        """
        if not self.model:
            return {
                "type": "immediate",
                "title": "Action Details",
                "content": "Service unavailable. Please consult a healthcare provider."
            }
            
        prompt = f"""
        Analyze this health recommendation: "{recommendation_text}"
        
        User Context:
        - Age: {user_data.get('Age')}
        - Screen Time: {user_data.get('Average screen time', 'N/A')} hours
        - Symptoms: {', '.join([k for k, v in user_data.items() if k in ['Discomfort Eye-strain', 'Redness in eye', 'Itchiness/Irritation in eye'] and v == 'Y'])}

        Task:
        1. Classify the recommendation as either "Immediate" (quick fix/technique) or "Long-term" (habit/lifestyle change).
        2. If "Immediate": Provide specific step-by-step instructions on how to do it RIGHT NOW, and list 2-3 search queries to find tutorials.
        3. If "Long-term": Create a mini-roadmap (e.g., Week 1, Week 2) on how to build this habit.
        
        Output format: JSON ONLY
        {{
            "type": "immediate" OR "long_term",
            "title": "A catchy title for the plan",
            "content": "The detailed instructions or roadmap as a string (can use markdown for bullet points)",
            "resources": ["Search Query 1", "Search Query 2"]
        }}
        """
        
        try:
            response = self.model.generate_content(prompt)
            content = response.text.replace("```json", "").replace("```", "").strip()
            return json.loads(content)
        except Exception as e:
            print(f"Error generating details: {e}")
            return {
                "type": "immediate", 
                "title": "Details",
                "content": "Could not generate details. Try searching for: " + recommendation_text
            }

    def _get_fallback_recommendations(self, risk_level: str) -> List[str]:
        """Return static recommendations if API fails."""
        if risk_level in ['Very High Risk', 'High Risk']:
            return [
                "Schedule an eye examination with an ophthalmologist immediately.",
                "Strictly follow the 20-20-20 rule: Every 20 mins, look 20 ft away for 20 sec.",
                "Use artificial tears to lubricate your eyes.",
                "Reduce screen time significantly below 6 hours."
            ]
        elif risk_level == 'Moderate Risk':
            return [
                "Take regular breaks every 45-60 minutes.",
                "Consider a warm compress for your eyes in the evening.",
                "Adjust medical/lifestyle factors like hydration and sleep.",
                "Blink more often when using screens."
            ]
        else:
            return [
                "Maintain your good habits.",
                "Stay hydrated.",
                "Ensure generic eye hygiene when using screens."
            ]
