"""
Dry Eye Disease Prediction Platform
Single Python server serving static files + WebSocket API.

Usage:
    python server.py --server-ip 0.0.0.0 --server-port 9000

AI Integration:
    Uses XGBoost model for dry eye disease prediction.
"""

import argparse
import asyncio
import json
import os
import sys
from pathlib import Path

from aiohttp import web
import aiofiles
import pandas as pd

# Add model directory to path
MODEL_DIR = Path(__file__).parent / "model"
sys.path.insert(0, str(MODEL_DIR))

from predict_explain import DryEyePredictor

# Initialize predictor
predictor = None

def get_predictor():
    global predictor
    if predictor is None:
        predictor = DryEyePredictor(model_dir=str(MODEL_DIR))
    return predictor


# Get the directory where this script is located
BASE_DIR = Path(__file__).parent
STATIC_DIR = BASE_DIR / "static"


async def handle_index(request):
    """Serve the main index.html page."""
    return web.FileResponse(STATIC_DIR / "index.html")


async def handle_static(request):
    """Serve static files (CSS, JS, images)."""
    file_path = STATIC_DIR / request.match_info["path"]
    
    if file_path.exists() and file_path.is_file():
        return web.FileResponse(file_path)
    
    return web.Response(status=404, text="File not found")


async def handle_websocket(request):
    """
    WebSocket handler for real-time data communication.
    
    Handles dry eye disease prediction requests.
    """
    ws = web.WebSocketResponse()
    await ws.prepare(request)
    
    print("WebSocket client connected")
    
    async for msg in ws:
        if msg.type == web.WSMsgType.TEXT:
            try:
                data = json.loads(msg.data)
                action = data.get("action", "")
                
                # Handle different actions
                if action == "predict_dry_eye":
                    try:
                        # Get input data from request
                        input_data = data.get("data", {})
                        
                        # Create DataFrame with single row
                        df = pd.DataFrame([input_data])
                        
                        # Get predictor and make prediction
                        pred = get_predictor()
                        results = pred.predict(df)
                        
                        response = {
                            "action": "prediction_result",
                            "data": results[0]
                        }
                    except Exception as e:
                        response = {
                            "action": "error",
                            "data": {"message": f"Prediction error: {str(e)}"}
                        }
                
                else:
                    response = {
                        "action": "error",
                        "data": {"message": f"Unknown action: {action}"}
                    }
                
                await ws.send_json(response)
                
            except json.JSONDecodeError:
                await ws.send_json({
                    "action": "error",
                    "data": {"message": "Invalid JSON"}
                })
        
        elif msg.type == web.WSMsgType.ERROR:
            print(f"WebSocket error: {ws.exception()}")
    
    print("WebSocket client disconnected")
    return ws


def create_app():
    """Create and configure the aiohttp application."""
    app = web.Application()
    
    # Routes
    app.router.add_get("/", handle_index)
    app.router.add_get("/ws", handle_websocket)
    app.router.add_get("/{path:.*}", handle_static)
    
    return app


def main():
    """Main entry point with CLI argument parsing."""
    parser = argparse.ArgumentParser(
        description="Dry Eye Disease Prediction Platform Server"
    )
    parser.add_argument(
        "--server-ip",
        default="127.0.0.1",
        help="Server IP address (default: 127.0.0.1 for localhost)"
    )
    parser.add_argument(
        "--server-port",
        type=int,
        default=9000,
        help="Server port (default: 9000)"
    )
    
    args = parser.parse_args()
    
    # Ensure static directory exists
    if not STATIC_DIR.exists():
        print(f"Warning: Static directory not found at {STATIC_DIR}")
        print("Creating static directory...")
        STATIC_DIR.mkdir(parents=True, exist_ok=True)
    
    # Pre-load the model
    print("Loading dry eye prediction model...")
    get_predictor()
    print("Model loaded successfully!")
    
    app = create_app()
    
    print(f"\n{'='*50}")
    print("  Dry Eye Disease Prediction Platform")
    print(f"{'='*50}")
    print(f"  Server: http://{args.server_ip}:{args.server_port}")
    print(f"  WebSocket: ws://{args.server_ip}:{args.server_port}/ws")
    print(f"  Static files: {STATIC_DIR}")
    print(f"{'='*50}\n")
    
    web.run_app(app, host=args.server_ip, port=args.server_port)


if __name__ == "__main__":
    main()
