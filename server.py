"""
Healthcatchers - Health Assessment Platform

Single Python server serving static files + WebSocket API.

Usage:
    python server.py --server-ip 0.0.0.0 --server-port 9000

Features:
    - Multi-health assessment (BMI, BP, Sleep, Stress, Lifestyle)
    - Dry eye disease prediction using XGBoost
"""

import argparse
import json
import sys
from pathlib import Path

from aiohttp import web
import pandas as pd

# Add directories to path
BASE_DIR = Path(__file__).parent
MODEL_DIR = BASE_DIR / "model"
SERVICES_DIR = BASE_DIR / "services"
STATIC_DIR = BASE_DIR / "static"

sys.path.insert(0, str(MODEL_DIR))
sys.path.insert(0, str(SERVICES_DIR))

from predict_explain import DryEyePredictor
from health_analyzer import HealthAnalyzer


class HealthcatchersServer:
    """Main server class for Healthcatchers platform."""

    def __init__(self):
        self.predictor: DryEyePredictor | None = None
        self.analyzer: HealthAnalyzer | None = None

    def initialize(self) -> None:
        """Initialize prediction and analysis services."""
        print("Loading services...")
        self.predictor = DryEyePredictor(model_dir=str(MODEL_DIR))
        self.analyzer = HealthAnalyzer()
        print("Services loaded successfully!")

    async def handle_index(self, request: web.Request) -> web.FileResponse:
        """Serve the main index.html page."""
        return web.FileResponse(STATIC_DIR / "index.html")

    async def handle_static(self, request: web.Request) -> web.Response:
        """Serve static files (CSS, JS, images)."""
        file_path = STATIC_DIR / request.match_info["path"]

        if file_path.exists() and file_path.is_file():
            return web.FileResponse(file_path)

        return web.Response(status=404, text="File not found")

    async def handle_websocket(self, request: web.Request) -> web.WebSocketResponse:
        """
        WebSocket handler for real-time health assessment.

        Supported actions:
            - health_check: Full health assessment
            - predict_dry_eye: Dry eye prediction only (legacy)
        """
        ws = web.WebSocketResponse()
        await ws.prepare(request)

        print("Client connected")

        async for msg in ws:
            if msg.type == web.WSMsgType.TEXT:
                response = await self._process_message(msg.data)
                await ws.send_json(response)
            elif msg.type == web.WSMsgType.ERROR:
                print(f"WebSocket error: {ws.exception()}")

        print("Client disconnected")
        return ws

    async def _process_message(self, message: str) -> dict:
        """Process incoming WebSocket message."""
        try:
            data = json.loads(message)
            action = data.get("action", "")
            input_data = data.get("data", {})

            if action == "health_check":
                return self._handle_health_check(input_data)
            elif action == "predict_dry_eye":
                return self._handle_dry_eye_prediction(input_data)
            else:
                return self._error_response(f"Unknown action: {action}")

        except json.JSONDecodeError:
            return self._error_response("Invalid JSON")
        except Exception as e:
            return self._error_response(f"Server error: {str(e)}")

    def _handle_health_check(self, data: dict) -> dict:
        """Handle full health assessment request."""
        try:
            health_results = self.analyzer.analyze(data)

            df = pd.DataFrame([data])
            dry_eye_results = self.predictor.predict_with_shap(df)

            return {
                "action": "health_result",
                "data": {
                    "health_analysis": health_results,
                    "dry_eye": dry_eye_results[0],
                    "user_data": {
                        "age": data.get("Age", 30),
                        "screen_time": data.get("Average screen time", 6),
                        "has_eye_strain": data.get("Discomfort Eye-strain") == "Y",
                        "has_redness": data.get("Redness in eye") == "Y",
                        "has_dryness": data.get("Itchiness/Irritation in eye") == "Y"
                    }
                }
            }
        except Exception as e:
            return self._error_response(f"Analysis error: {str(e)}")

    def _handle_dry_eye_prediction(self, data: dict) -> dict:
        """Handle dry eye prediction only (legacy support)."""
        try:
            df = pd.DataFrame([data])
            results = self.predictor.predict(df)

            return {
                "action": "prediction_result",
                "data": results[0]
            }
        except Exception as e:
            return self._error_response(f"Prediction error: {str(e)}")

    @staticmethod
    def _error_response(message: str) -> dict:
        """Create error response."""
        return {
            "action": "error",
            "data": {"message": message}
        }


def create_app(server: HealthcatchersServer) -> web.Application:
    """Create and configure the aiohttp application."""
    app = web.Application()

    app.router.add_get("/", server.handle_index)
    app.router.add_get("/ws", server.handle_websocket)
    app.router.add_get("/{path:.*}", server.handle_static)

    return app


def main() -> None:
    """Main entry point with CLI argument parsing."""
    parser = argparse.ArgumentParser(
        description="Healthcatchers - Health Assessment Platform"
    )
    parser.add_argument(
        "--server-ip",
        default="127.0.0.1",
        help="Server IP address (default: 127.0.0.1)"
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
        STATIC_DIR.mkdir(parents=True, exist_ok=True)

    # Initialize server
    server = HealthcatchersServer()
    server.initialize()

    app = create_app(server)

    print(f"\n{'=' * 50}")
    print("  Healthcatchers - Health Assessment Platform")
    print(f"{'=' * 50}")
    print(f"  Server: http://{args.server_ip}:{args.server_port}")
    print(f"  WebSocket: ws://{args.server_ip}:{args.server_port}/ws")
    print(f"{'=' * 50}\n")

    web.run_app(app, host=args.server_ip, port=args.server_port)


if __name__ == "__main__":
    main()
