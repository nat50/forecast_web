# Healthcatchers - Health Assessment Platform

Web application for comprehensive health assessment including dry eye disease prediction, BMI analysis, blood pressure monitoring, sleep quality, and lifestyle evaluation.

## Features

- **Multi-health Assessment**: One form, multiple health reports
- **AI-powered Dry Eye Prediction**: XGBoost model trained on 20,000+ samples
- **BMI Analysis**: Body mass index calculation and classification
- **Blood Pressure Monitoring**: Hypertension risk detection
- **Sleep Health Evaluation**: Sleep duration and quality assessment
- **Lifestyle Analysis**: Activity, habits, and risk factor scoring

## Project Structure
 
```
forecast_web/
├── server.py                    # Main web server
├── requirements.txt             # Python dependencies
├── services/
│   ├── __init__.py
│   └── health_analyzer.py       # Multi-health analysis service
├── model/
│   ├── predict_explain.py       # Dry eye prediction API
│   ├── dry_eye_xgboost.ipynb    # Model training notebook
│   ├── xgboost_dry_eye_model.joblib
│   └── Dry Eye Disease/         # Training dataset
└── static/
    ├── index.html               # Main SPA
    ├── css/style.css            # Styles
    └── js/app.js                # Frontend logic
```

## Setup

### 1. Create Virtual Environment

```bash
# Windows
python -m venv venv
.\venv\Scripts\activate

# Linux/macOS
python3 -m venv venv
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Train Model (Optional)

If you need to retrain the model, open and run the Jupyter notebook:

```bash
# Install Jupyter if not installed
pip install jupyter

# Run notebook
jupyter notebook model/dry_eye_xgboost.ipynb
```

Run all cells in the notebook. The trained model will be saved as `model/xgboost_dry_eye_model.joblib`.

### 4. Run Web Server

```bash
# With venv activated
python server.py

# Or specify host and port
python server.py --server-ip 0.0.0.0 --server-port 9000
```

### 5. Access Web Application

Open browser and navigate to:

```
http://127.0.0.1:9000
```

## Technology Stack

- **Backend**: Python, aiohttp, WebSocket
- **ML Model**: XGBoost, scikit-learn, SHAP
- **Frontend**: HTML5, CSS3, JavaScript

## Medical Disclaimer

This AI-powered assessment is for **reference purposes only** and should not be used as a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider for any health concerns.

## License

MIT License - Free for educational and research purposes
