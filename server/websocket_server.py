import asyncio
import websockets
import cv2
import base64
import logging
import signal
from websockets.legacy.server import WebSocketServer, serve

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def stream_camera(websocket):
    rtsp_url = 'rtsp://admin:admin123456@192.168.137.50:8554/profile0?tcp'
    cap = cv2.VideoCapture(rtsp_url)

    if not cap.isOpened():
        logger.error("Failed to open RTSP stream")
        return

    try:
        await websocket.send("Connected to camera stream")
        
        while True:
            ret, frame = cap.read()
            if not ret:
                logger.error("Failed to read frame")
                break
            
            _, buffer = cv2.imencode('.jpg', frame)
            jpg_as_text = base64.b64encode(buffer).decode('utf-8')
            
            try:
                await websocket.send(jpg_as_text)
                await asyncio.sleep(0.033)
            except websockets.exceptions.ConnectionClosed:
                logger.info("Client disconnected")
                break
    finally:
        cap.release()
        logger.info("Stream closed")

async def main():
    stop = asyncio.Future()
    
    def shutdown(signal, frame):
        stop.set_result(None)
        
    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)
    
    async with websockets.server.WebSocketServer(
        stream_camera,
        "localhost",
        8765,
        process_request=lambda p, r: None
    ) as server:
        logger.info("WebSocket server started on ws://localhost:8765")
        await stop

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Server stopped by user")
    except Exception as e:
        logger.error(f"Server error: {e}")