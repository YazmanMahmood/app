import { useState, useEffect } from 'react';
import './CameraView.css';

const CameraView: React.FC = () => {
  const [error, setError] = useState(false);
  const [connecting, setConnecting] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  const getStreamUrl = () => {
    return `http://${window.location.hostname}:5000/video_feed?t=${Date.now()}`;
  };

  const checkServer = async () => {
    try {
      const response = await fetch(`http://${window.location.hostname}:5000/health`);
      return response.ok;
    } catch {
      return false;
    }
  };

  const handleRetry = async () => {
    setConnecting(true);
    setError(false);
    setRetryCount(prev => prev + 1);
    
    const serverRunning = await checkServer();
    if (!serverRunning) {
      setError(true);
    }
    setConnecting(false);
  };

  useEffect(() => {
    handleRetry();
  }, []);

  if (connecting) {
    return (
      <div className="camera-view">
        <div className="loading">
          <div className="spinner"></div>
          <div>Connecting to camera...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="camera-view">
      {error ? (
        <div className="error">
          <div>Camera Server Not Available</div>
          <div>Please make sure the camera server is running</div>
          <button onClick={handleRetry}>
            Retry Connection
          </button>
        </div>
      ) : (
        <img
          key={retryCount}
          src={getStreamUrl()}
          alt="Drone Camera"
          onError={() => setError(true)}
        />
      )}
    </div>
  );
};

export default CameraView;