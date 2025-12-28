# DryEye Predict - Dry Eye Disease Risk Assessment

Web application for dry eye disease risk prediction using XGBoost machine learning model.

## Features

- Real-time risk assessment through web interface
- 25-field health questionnaire with flexible input
- 4-level risk classification (Low, Moderate, High, Very High)
- Professional medical-themed UI

## Project Structure

```
forecast_web/
├── server.py                    # Web server
├── requirements.txt             # Dependencies
├── model/
│   ├── dry_eye_xgboost.ipynb   # Training notebook
│   ├── predict_explain.py       # Prediction API
│   ├── xgboost_dry_eye_model.joblib
│   └── Dry Eye Disease/Dry_Eye_Dataset.csv
└── static/
    ├── index.html
    ├── css/style.css
    └── js/app.js
```

## Quick Start

**Install dependencies:**
```bash
pip install -r requirements.txt
```

**Run the web application:**
```bash
python server.py
```

Open browser: `http://127.0.0.1:9000`

**Custom server configuration:**
```bash
python server.py --server-ip 0.0.0.0 --server-port 8080
```

## Training Model

**Open training notebook:**
```bash
cd model
jupyter notebook dry_eye_xgboost.ipynb
```

The notebook includes data exploration, feature engineering, model training, evaluation, and SHAP analysis. After training, the new model file `xgboost_dry_eye_model.joblib` will be used automatically by the web app.

## Technology Stack

- **Backend**: Python, aiohttp, WebSocket
- **ML**: XGBoost, scikit-learn, pandas, SHAP
- **Frontend**: HTML5/CSS3/JavaScript

## Model Details

See [model/README_Dry_Eye.md](model/README_Dry_Eye.md) for technical documentation.
- WebSocket API client
- Responsive design

## ⚠️ Medical Disclaimer

This tool is for **informational and educational purposes only**. It should not be used as a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified eye care specialist for:
- Comprehensive eye examinations
- Accurate diagnosis of eye conditions
- Personalized treatment recommendations
- Management of dry eye disease

## 📖 Documentation

- [Main README](README.md) - This file, project overview
- [Model Documentation](model/README_Dry_Eye.md) - Detailed model information, features, and variables

## 📄 License

MIT License - Free for educational and research purposes

## 🤝 Contributing

This is an educational project. Feel free to:
- Experiment with different ML models
- Improve the web interface
- Add new features or visualizations
- Enhance model interpretability

## 📧 Support

For issues or questions about:
- **Running the application** - Check the Quick Start section
- **Training the model** - See the Jupyter notebook comments
- **Understanding features** - Review the model documentation


