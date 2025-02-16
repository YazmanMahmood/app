import { useEffect, useRef } from 'react';

const WebcamComponent = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const enableStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (err) {
        console.error('Error accessing webcam:', err);
      }
    };

    enableStream();

    return () => {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return <video ref={videoRef} autoPlay playsInline style={{ width: '100%' }} />;
};

export default WebcamComponent;