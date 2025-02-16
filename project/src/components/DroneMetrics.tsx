import React, { useEffect, useState, useCallback } from 'react';

interface DroneMetrics {
  Battery: number;
  Status: string;
  Altitude: number;
  Signal: number;
  Speed: number;
  Heading: number;
}

const DroneMetrics: React.FC = () => {
  const [metrics, setMetrics] = useState<DroneMetrics>({
    Battery: 0,
    Status: 'Disconnected',
    Altitude: 0,
    Signal: 0,
    Speed: 0,
    Heading: 0
  });
  const [wsConnected, setWsConnected] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 5;
  const RETRY_INTERVAL = 3000;

  const connectWebSocket = useCallback(() => {
    const ws = new WebSocket('ws://localhost:8765');
    
    ws.onopen = () => {
      console.log('WebSocket Connected');
      setWsConnected(true);
      setRetryCount(0);
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setMetrics(data);
      } catch (error) {
        console.error('Failed to parse data:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setWsConnected(false);
    };

    ws.onclose = () => {
      setWsConnected(false);
      if (retryCount < MAX_RETRIES) {
        console.log(`Reconnecting... Attempt ${retryCount + 1}/${MAX_RETRIES}`);
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          connectWebSocket();
        }, RETRY_INTERVAL);
      }
    };

    return ws;
  }, [retryCount]);

  useEffect(() => {
    const ws = connectWebSocket();
    return () => {
      ws.close();
    };
  }, [connectWebSocket]);

  return (
    <div className="bg-gray-800 p-6 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-white">Drone Status</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">
            {wsConnected ? 'Connected' : 'Disconnected'}
          </span>
          <div className={`h-3 w-3 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-red-500'}`} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-700 p-3 rounded">
          <span className="text-gray-400">Battery</span>
          <div className="text-2xl text-white">{metrics.Battery}%</div>
        </div>
        <div className="bg-gray-700 p-3 rounded">
          <span className="text-gray-400">Status</span>
          <div className="text-2xl text-white">{metrics.Status}</div>
        </div>
        <div className="bg-gray-700 p-3 rounded">
          <span className="text-gray-400">Altitude</span>
          <div className="text-2xl text-white">{metrics.Altitude}m</div>
        </div>
        <div className="bg-gray-700 p-3 rounded">
          <span className="text-gray-400">Signal</span>
          <div className="text-2xl text-white">{metrics.Signal}%</div>
        </div>
        <div className="bg-gray-700 p-3 rounded">
          <span className="text-gray-400">Speed</span>
          <div className="text-2xl text-white">{metrics.Speed}m/s</div>
        </div>
        <div className="bg-gray-700 p-3 rounded">
          <span className="text-gray-400">Heading</span>
          <div className="text-2xl text-white">{metrics.Heading}°</div>
        </div>
      </div>
    </div>
  );
};

export default DroneMetrics;