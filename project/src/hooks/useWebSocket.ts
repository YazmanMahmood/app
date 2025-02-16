import { useState, useEffect, useCallback } from 'react';

export const useWebSocket = (url: string) => {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 5;

  const connect = useCallback(() => {
    const socket = new WebSocket(url);

    socket.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      setRetryCount(0);
    };

    socket.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
      if (retryCount < MAX_RETRIES) {
        setTimeout(() => {
          console.log(`Attempting to reconnect (${retryCount + 1}/${MAX_RETRIES})...`);
          setRetryCount(prev => prev + 1);
          connect();
        }, 3000);
      }
    };

    setWs(socket);
    return socket;
  }, [url, retryCount]);

  useEffect(() => {
    const socket = connect();
    return () => socket.close();
  }, [connect]);

  return { ws, isConnected };
};