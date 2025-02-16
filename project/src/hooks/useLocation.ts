import { useState, useEffect } from 'react';

export const useLocation = () => {
  const [location, setLocation] = useState<GeolocationPosition | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      return;
    }

    const handleSuccess = (position: GeolocationPosition) => {
      setLocation(position);
      setError('');
    };

    const handleError = (error: GeolocationPositionError) => {
      switch (error.code) {
        case error.PERMISSION_DENIED:
          setError('Please enable location services to use this feature');
          break;
        case error.POSITION_UNAVAILABLE:
          setError('Location information unavailable');
          break;
        case error.TIMEOUT:
          setError('Location request timed out');
          break;
        default:
          setError('An unknown error occurred');
      }
    };

    const watchId = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return { location, error };
};