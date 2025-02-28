from flask import Flask, Response
from flask_cors import CORS
import cv2
import numpy as np
import time
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# RTSP URL for the camera - Using TCP transport
RTSP_URL = 'rtsp://admin:admin123456@192.168.27.234:8554/profile0?tcp'

def generate_frames():
    """Generate camera frames"""
    frame_received = False
    while True:
        try:
            cap = cv2.VideoCapture(RTSP_URL)
            
            if not cap.isOpened():
                logger.error("Failed to open RTSP stream")
                # Create "No Signal" frame
                frame = np.zeros((480, 640, 3), dtype=np.uint8)
                cv2.putText(frame, 
                          "No Video Signal", 
                          (160, 240),
                          cv2.FONT_HERSHEY_SIMPLEX, 
                          1.5,
                          (255, 255, 255),
                          2)
                ret, buffer = cv2.imencode('.jpg', frame)
                frame_bytes = buffer.tobytes()
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
                time.sleep(1)
                continue

            logger.info("RTSP stream opened successfully")
            while True:
                ret, frame = cap.read()
                if not ret:
                    logger.error("Failed to read frame")
                    break

                # Resize frame to reduce bandwidth
                frame = cv2.resize(frame, (640, 480))
                ret, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
                frame_bytes = buffer.tobytes()
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

        except Exception as e:
            logger.error(f"Camera error: {e}")
            # Create error message frame
            frame = np.zeros((480, 640, 3), dtype=np.uint8)
            cv2.putText(frame, 
                      "Camera Error", 
                      (200, 240),
                      cv2.FONT_HERSHEY_SIMPLEX, 
                      1.5,
                      (255, 255, 255),
                      2)
            ret, buffer = cv2.imencode('.jpg', frame)
            frame_bytes = buffer.tobytes()
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
            time.sleep(1)
        finally:
            if 'cap' in locals():
                cap.release()

@app.route('/video_feed')
def video_feed():
    """Video streaming route"""
    logger.info("Video feed requested")
    return Response(
        generate_frames(),
        mimetype='multipart/x-mixed-replace; boundary=frame',
        headers={
            'Cache-Control': 'no-cache',
            'Access-Control-Allow-Origin': '*'
        }
    )

@app.route('/health')
def health_check():
    """Health check endpoint"""
    return {'status': 'ok'}

if __name__ == '__main__':
    logger.info(f"Starting camera server with RTSP URL: {RTSP_URL}")
    app.run(host='0.0.0.0', port=5000, threaded=True) 