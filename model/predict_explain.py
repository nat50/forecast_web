import pandas as pd
import numpy as np
import joblib
import shap
import matplotlib.pyplot as plt
from pathlib import Path
from sklearn.preprocessing import LabelEncoder


class DryEyePredictor:
    def __init__(self, model_dir: str = "."):
        self.model_dir = Path(model_dir)
        self.model = None
        self.explainer = None
        self._load_model()
        
    def _load_model(self):
        model_path = self.model_dir / "xgboost_dry_eye_model.joblib"
        
        if not model_path.exists():
            raise FileNotFoundError(f"Model file not found: {model_path}")
            
        self.model = joblib.load(model_path)
        self.explainer = shap.TreeExplainer(self.model)
        print("Model loaded successfully!")
        
    def preprocess_input(self, data: pd.DataFrame) -> pd.DataFrame:
        df = data.copy()
        
        # Fill missing values with median/mode from training data
        # Blood pressure - use median values if missing
        if 'Blood pressure' in df.columns:
            if df['Blood pressure'].isna().any() or df['Blood pressure'].eq('').any():
                df['Blood pressure'] = df['Blood pressure'].replace('', '120/80')
                df['Blood pressure'] = df['Blood pressure'].fillna('120/80')
            df[['BP_Systolic', 'BP_Diastolic']] = df['Blood pressure'].str.split('/', expand=True).astype(int)
        else:
            # If no blood pressure provided, use default
            df['BP_Systolic'] = 120
            df['BP_Diastolic'] = 80
        
        # Fill other numeric fields with reasonable defaults
        numeric_defaults = {
            'Age': 30,
            'Height': 165,
            'Weight': 70,
            'Heart rate': 75,
            'Sleep duration': 7,
            'Sleep quality': 3,
            'Stress level': 3,
            'Daily steps': 8000,
            'Physical activity': 30,
            'Average screen time': 6
        }
        
        for col, default_val in numeric_defaults.items():
            if col not in df.columns:
                df[col] = default_val
            else:
                df[col] = df[col].fillna(default_val)
        
        # Fill categorical fields with most common value
        categorical_defaults = {
            'Gender': 'M',
            'Sleep disorder': 'N',
            'Wake up during night': 'N',
            'Feel sleepy during day': 'N',
            'Caffeine consumption': 'Y',
            'Alcohol consumption': 'N',
            'Smoking': 'N',
            'Medical issue': 'N',
            'Ongoing medication': 'N',
            'Smart device before bed': 'Y',
            'Blue-light filter': 'N',
            'Discomfort Eye-strain': 'N',
            'Redness in eye': 'N',
            'Itchiness/Irritation in eye': 'N'
        }
        
        for col, default_val in categorical_defaults.items():
            if col not in df.columns:
                df[col] = default_val
            else:
                df[col] = df[col].fillna(default_val)
        
        # Calculate BMI
        if 'Height' in df.columns and 'Weight' in df.columns:
            df['BMI'] = df['Weight'] / ((df['Height'] / 100) ** 2)
        
        # Encode categorical variables
        le = LabelEncoder()
        cat_cols = df.select_dtypes(include=['object']).columns
        for col in cat_cols:
            if col != 'Blood pressure':
                df[col] = le.fit_transform(df[col])
        
        # Calculate engineered features
        df['Eye_Load'] = (df['Average screen time'] / (df['Sleep duration'] + 0.1)) * (1 + 0.5 * df['Blue-light filter'])
        df['Screen_to_Sleep_Ratio'] = df['Average screen time'] / (df['Sleep duration'] + 0.1)
        df['Stress_Metabolic'] = df['Stress level'] * df['BP_Systolic']
        
        feature_cols = self.model.feature_names_in_
        
        # Ensure all required features exist, fill missing with 0
        for col in feature_cols:
            if col not in df.columns:
                df[col] = 0
        
        return df[feature_cols]
    
    def predict(self, data: pd.DataFrame, threshold: float = 0.5) -> list:
        X = self.preprocess_input(data)
        
        probability = self.model.predict_proba(X)[:, 1]
        prediction = (probability >= threshold).astype(int)
        
        results = []
        for i in range(len(X)):
            results.append({
                'prediction': 'Dry Eye Disease' if prediction[i] == 1 else 'No Dry Eye Disease',
                'probability': float(probability[i]),
                'risk_level': self._get_risk_level(probability[i])
            })
        
        return results
    
    def _get_risk_level(self, prob: float) -> str:
        if prob < 0.3:
            return 'Low Risk'
        elif prob < 0.5:
            return 'Moderate Risk'
        elif prob < 0.7:
            return 'High Risk'
        else:
            return 'Very High Risk'
    
    def explain_prediction(self, data: pd.DataFrame, sample_idx: int = 0, plot: bool = True) -> dict:
        X = self.preprocess_input(data)
        
        shap_values = self.explainer.shap_values(X)
        sample_shap = shap_values[sample_idx]
        sample_features = X.iloc[sample_idx]
        
        contributions = pd.DataFrame({
            'Feature': X.columns.tolist(),
            'Value': sample_features.values,
            'SHAP_Value': sample_shap,
            'Contribution': ['Increases Risk' if s > 0 else 'Decreases Risk' for s in sample_shap]
        }).sort_values('SHAP_Value', key=abs, ascending=False)
        
        if plot:
            self._plot_explanation(X, shap_values, sample_idx)
        
        return {
            'top_risk_factors': contributions[contributions['SHAP_Value'] > 0].head(5).to_dict('records'),
            'top_protective_factors': contributions[contributions['SHAP_Value'] < 0].head(5).to_dict('records'),
            'all_contributions': contributions.to_dict('records')
        }
    
    def _plot_explanation(self, X: pd.DataFrame, shap_values: np.ndarray, sample_idx: int):
        fig, axes = plt.subplots(1, 2, figsize=(16, 6))
        
        plt.sca(axes[0])
        shap.waterfall_plot(
            shap.Explanation(
                values=shap_values[sample_idx],
                base_values=self.explainer.expected_value,
                data=X.iloc[sample_idx],
                feature_names=X.columns.tolist()
            ),
            max_display=15,
            show=False
        )
        axes[0].set_title('Feature Contributions (Waterfall Plot)')
        
        plt.sca(axes[1])
        contribution_df = pd.DataFrame({
            'Feature': X.columns.tolist(),
            'SHAP': shap_values[sample_idx]
        }).sort_values('SHAP', key=abs, ascending=True).tail(15)
        
        colors = ['#e74c3c' if v > 0 else '#2ecc71' for v in contribution_df['SHAP']]
        axes[1].barh(contribution_df['Feature'], contribution_df['SHAP'], color=colors)
        axes[1].axvline(x=0, color='black', linestyle='-', linewidth=0.5)
        axes[1].set_xlabel('SHAP Value (impact on prediction)')
        axes[1].set_title('Top 15 Feature Contributions')
        
        plt.tight_layout()
        plt.savefig('shap_explanation.png', dpi=150, bbox_inches='tight')
        plt.show()
        print("Explanation plot saved to: shap_explanation.png")
    
    def get_global_feature_importance(self, X_sample: pd.DataFrame = None, plot: bool = True) -> pd.DataFrame:
        importance_df = pd.DataFrame({
            'Feature': self.model.feature_names_in_,
            'Importance': self.model.feature_importances_
        }).sort_values('Importance', ascending=False)
        
        if plot and X_sample is not None:
            X_processed = self.preprocess_input(X_sample)
            shap_values = self.explainer.shap_values(X_processed)
            
            plt.figure(figsize=(12, 10))
            shap.summary_plot(shap_values, X_processed, feature_names=X_processed.columns.tolist(), show=False)
            plt.title('SHAP Summary Plot - Feature Importance')
            plt.tight_layout()
            plt.savefig('shap_summary.png', dpi=150, bbox_inches='tight')
            plt.show()
            print("Summary plot saved to: shap_summary.png")
        
        return importance_df


def create_sample_input() -> pd.DataFrame:
    return pd.DataFrame({
        'Gender': ['M'],
        'Age': [35],
        'Height': [175],
        'Weight': [80],
        'Blood pressure': ['130/85'],
        'Heart rate': [75],
        'Sleep duration': [6.5],
        'Sleep quality': [3],
        'Stress level': [4],
        'Daily steps': [5000],
        'Physical activity': [30],
        'Sleep disorder': ['N'],
        'Wake up during night': ['Y'],
        'Feel sleepy during day': ['Y'],
        'Caffeine consumption': ['Y'],
        'Alcohol consumption': ['N'],
        'Smoking': ['N'],
        'Medical issue': ['N'],
        'Ongoing medication': ['N'],
        'Smart device before bed': ['Y'],
        'Average screen time': [8.5],
        'Blue-light filter': ['N'],
        'Discomfort Eye-strain': ['Y'],
        'Redness in eye': ['N'],
        'Itchiness/Irritation in eye': ['Y']
    })


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Dry Eye Disease Prediction')
    parser.add_argument('--test', action='store_true', help='Run test prediction')
    parser.add_argument('--model-dir', type=str, default='.', help='Model directory')
    args = parser.parse_args()
    
    if args.test:
        print("=" * 60)
        print("DRY EYE DISEASE PREDICTION - TEST MODE")
        print("=" * 60)
        
        try:
            predictor = DryEyePredictor(model_dir=args.model_dir)
            
            sample = create_sample_input()
            print("\nSample Input:")
            print(sample.T)
            
            print("\nPrediction Results:")
            results = predictor.predict(sample)
            for i, result in enumerate(results):
                print(f"\n  Sample {i+1}:")
                print(f"    Prediction: {result['prediction']}")
                print(f"    Probability: {result['probability']:.2%}")
                print(f"    Risk Level: {result['risk_level']}")
            
            print("\nGenerating SHAP Explanation...")
            explanation = predictor.explain_prediction(sample, sample_idx=0, plot=True)
            
            print("\nTop Risk Factors:")
            for factor in explanation['top_risk_factors']:
                print(f"    - {factor['Feature']}: {factor['Value']:.2f} (SHAP: {factor['SHAP_Value']:.4f})")
            
            print("\nTop Protective Factors:")
            for factor in explanation['top_protective_factors']:
                print(f"    - {factor['Feature']}: {factor['Value']:.2f} (SHAP: {factor['SHAP_Value']:.4f})")
            
            print("\nFeature Importance:")
            importance = predictor.get_global_feature_importance(plot=False)
            print(importance.head(10).to_string(index=False))
            
            print("\n" + "=" * 60)
            print("TEST COMPLETED SUCCESSFULLY!")
            print("=" * 60)
            
        except FileNotFoundError as e:
            print(f"\nError: {e}")
            print("Please run the training notebook first to generate the model files.")
    else:
        print("Usage: python predict_explain.py --test")
        print("       python predict_explain.py --model-dir /path/to/model")

