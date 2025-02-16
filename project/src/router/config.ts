import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { useState } from 'react';

// Configure future flags
const router = createBrowserRouter(
  [
    // Your routes here
  ],
  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true
    }
  }
);

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8765';

const [wsStatus, setWsStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');

export default router;

{wsStatus !== 'connected' && (
  <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative mb-4">
    <span className="block sm:inline">
      {wsStatus === 'connecting' ? 'Connecting to drone...' : 'Disconnected from drone'}
    </span>
  </div>
)} 