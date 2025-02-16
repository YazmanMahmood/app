import { useEffect, useState } from 'react';
import './CameraView.css';

const CameraView: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set loading to false after ensuring the image starts loading
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="camera-view">
      {loading && <div>Loading camera...</div>}
      {error && <div className="error">{error}</div>}
      <img 
        src={`http://${window.location.hostname}:5000/video_feed`}
        alt="RTSP Stream"
        style={{ maxWidth: '100%', height: 'auto' }}
        onError={() => setError('Failed to connect to camera stream')}
      />
    </div>
  );
};

export default CameraView;