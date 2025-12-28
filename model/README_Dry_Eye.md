# Dry Eye Disease Prediction Model

XGBoost model for dry eye disease risk prediction trained on 20,001 clinical samples.

## Model Overview

- **Algorithm**: XGBoost Binary Classifier
- **Training Data**: 20,001 samples, ages 18-45
- **Features**: 28 total (25 input + 3 engineered)
- **Output**: Binary classification with probability and 4-level risk (Low/Moderate/High/Very High)
- **Special Features**: Handles missing values with defaults, SHAP-explainable

---

## Input Features (25 Total)

**Demographic (4)**: Gender, Age, Height, Weight

**Cardiovascular (2)**: Blood pressure, Heart rate

**Sleep Health (5)**: Sleep duration, Sleep quality, Sleep disorder, Wake up during night, Feel sleepy during day

**Lifestyle (6)**: Stress level, Daily steps, Physical activity, Caffeine consumption, Alcohol consumption, Smoking

**Medical History (2)**: Medical issue, Ongoing medication

**Digital Usage (3)**: Smart device before bed, Average screen time, Blue-light filter

**Eye Symptoms (3)**: Discomfort Eye-strain, Redness in eye, Itchiness/Irritation in eye

---

## Feature Engineering (3 Engineered)

**BMI**: `Weight / (Height)²` - Body composition indicator

**BP_Systolic / BP_Diastolic**: Split blood pressure "120/80" into components

**Eye_Load**: `(Screen time / Sleep duration) × Blue-light factor` - Digital strain metric

---

## Usage

```python
from predict_explain import DryEyePredictor
import pandas as pd

predictor = DryEyePredictor(model_dir=".")

data = pd.DataFrame([{
    'Gender': 'F',
    'Age': 28,
    'Height': 165,
    'Weight': 58,
    'Blood pressure': '118/75',
    'Sleep duration': 6.5,
    'Average screen time': 9,
    # ... other fields optional
}])

result = predictor.predict(data)[0]
print(result)
# Output: {'prediction': 'Dry Eye Disease', 'probability': 0.62, 'risk_level': 'High Risk'}
```

**Risk Levels**: Low (<30%), Moderate (30-50%), High (50-70%), Very High (≥70%)

**Default Values**: Age=30, Height=165cm, Weight=70kg, BP=120/80, Heart rate=75bpm, Sleep=7h, etc.

---

## Files

- `xgboost_dry_eye_model.joblib` - Trained model
- `predict_explain.py` - Prediction API with SHAP
- `dry_eye_xgboost.ipynb` - Training notebook
- `Dry_Eye_Dataset.csv` - Training data (20,001 samples)
