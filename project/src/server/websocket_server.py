import os
import json
import random
import logging
import asyncio
import threading
import subprocess
import webbrowser
from dataclasses import dataclass
from typing import Optional
from http.server import HTTPServer, SimpleHTTPRequestHandler
import websockets
import signal
import cv2
from flask import Flask, Response
from flask_cors import CORS
from .database import DroneDB

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DEFAULT_HOME = [31.482080, 74.302944]

@dataclass
class WaypointAction:
    """Represents an action to be performed at a waypoint"""
    action_type: str  # 'waypoint', 'takeoff', 'land', 'loiter', 'rtl'
    altitude: float   # meters
    duration: Optional[float] = None  # seconds for loiter
    
    def __post_init__(self):
        """Validate action parameters"""
        valid_types = {'waypoint', 'takeoff', 'land', 'loiter', 'rtl'}
        if self.action_type not in valid_types:
            raise ValueError(f"Invalid action type. Must be one of {valid_types}")
        
        if self.altitude < 0:
            raise ValueError("Altitude must be non-negative")
            
        if self.action_type == 'loiter' and (self.duration is None or self.duration <= 0):
            raise ValueError("Loiter action requires positive duration")

# Global state
DRONE_STATE = {
    'Battery': 100,
    'Status': 'Connected',
    'Altitude': 0,
    'Signal': 100,
    'Speed': 0,
    'Heading': 0,
    'Location': DEFAULT_HOME,
    'HomeLocation': DEFAULT_HOME
}

class CustomHandler(SimpleHTTPRequestHandler):
    def guess_type(self, path):
        """Override MIME type guessing"""
        if path.endswith('.js') or path.endswith('.mjs') or path.endswith('.tsx'):
            return 'application/javascript'
        elif path.endswith('.css'):
            return 'text/css'
        elif path.endswith('.html'):
            return 'text/html'
        elif path.endswith('.svg'):
            return 'image/svg+xml'
        elif path.endswith('.json'):
            return 'application/json'
        return super().guess_type(path)

    def end_headers(self):
        """Add CORS and caching headers"""
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        SimpleHTTPRequestHandler.end_headers(self)

class DroneSystem:
    def __init__(self):
        self.web_app_dir = os.path.join(os.getcwd(), 'project', 'dist')
        self.host = '0.0.0.0'  # Listen on all network interfaces
        self.websocket_port = 8765
        self.http_port = 5173
        self.clients = set()
        self._shutdown_flag = False
        self.app = Flask(__name__)
        CORS(self.app, resources={
            r"/*": {
                "origins": ["*"]  # Be more restrictive in production
            }
        })
        self.rtsp_url = 'rtsp://admin:admin123456@192.168.167.234:8554/profile0?tcp'
        self.db = DroneDB()
        
        # Initialize DRONE_STATE from database
        latest_metrics = self.db.get_latest_metrics()
        if latest_metrics:
            DRONE_STATE.update(latest_metrics)

        self.setup_routes()

    def setup_routes(self):
        """Setup Flask routes"""
        @self.app.route('/video_feed')
        def video_feed():
            return Response(self.generate_frames(),
                          mimetype='multipart/x-mixed-replace; boundary=frame')

    def generate_frames(self):
        """Generate camera frames"""
        cap = cv2.VideoCapture(self.rtsp_url)
        while True:
            success, frame = cap.read()
            if not success:
                break
            else:
                # Encode frame to JPEG
                ret, buffer = cv2.imencode('.jpg', frame)
                frame = buffer.tobytes()
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
        cap.release()

    def start_web_app(self):
        """Build and serve web app"""
        try:
            # Build React app
            subprocess.run('npm run build', shell=True, cwd=os.path.join(os.getcwd(), 'project'))
            
            # Change to dist directory
            os.chdir(self.web_app_dir)
            
            # Start HTTP server
            httpd = HTTPServer((self.host, self.http_port), CustomHandler)
            server_thread = threading.Thread(target=httpd.serve_forever, daemon=True)
            server_thread.start()
            
            # Open browser
            webbrowser.open(f'http://localhost:{self.http_port}')

            # Start Flask server for video stream
            flask_thread = threading.Thread(
                target=lambda: self.app.run(host=self.host, port=5000, threaded=True),
                daemon=True
            )
            flask_thread.start()
            logger.info(f"Flask video server started on {self.host}:5000")

            return True
            
        except Exception as e:
            logger.error(f"Failed to start web app: {e}")
            return False

    async def update_metrics(self):
        while not self._shutdown_flag:
            try:
                DRONE_STATE.update({
                    'Battery': max(0, min(100, DRONE_STATE['Battery'] + random.randint(-5, 3))),
                    'Altitude': max(0, min(100, DRONE_STATE['Altitude'] + random.randint(-2, 2))),
                    'Signal': max(0, min(100, DRONE_STATE['Signal'] + random.randint(-10, 10))),
                    'Speed': max(0, min(30, DRONE_STATE['Speed'] + random.randint(-3, 3))),
                    'Heading': (DRONE_STATE['Heading'] + random.randint(-10, 10)) % 360
                })

                # Store metrics in database
                self.db.update_metrics(DRONE_STATE)

                if self.clients:
                    message = json.dumps(DRONE_STATE)
                    await asyncio.gather(*[
                        client.send(message)
                        for client in self.clients
                    ])

                await asyncio.sleep(1)
            except Exception as e:
                logger.error(f"Error updating metrics: {e}")

    async def websocket_handler(self, websocket, path):
        try:
            self.clients.add(websocket)
            logger.info(f"Client connected. Total clients: {len(self.clients)}")
            
            async for message in websocket:
                await websocket.send(json.dumps(DRONE_STATE))
                
        except websockets.exceptions.ConnectionClosed:
            pass
        finally:
            self.clients.remove(websocket)
            logger.info(f"Client disconnected. Remaining clients: {len(self.clients)}")

    async def run(self):
        if not self.start_web_app():
            return

        async with websockets.serve(self.websocket_handler, self.host, self.websocket_port):
            await self.update_metrics()

    def shutdown(self):
        self._shutdown_flag = True
        logger.info("Shutting down...")

def main():
    drone_system = DroneSystem()

    def signal_handler(sig, frame):
        drone_system.shutdown()

    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    try:
        asyncio.run(drone_system.run())
    except KeyboardInterrupt:
        drone_system.shutdown()

if __name__ == "__main__":
    main()