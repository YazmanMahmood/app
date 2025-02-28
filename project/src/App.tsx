import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import MissionPlanner from './pages/MissionPlanner';
import Sites from './pages/Sites';
import WebcamComponent from './components/WebcamComponents'; // Import the WebcamComponent
import CameraView from './pages/CameraView'; // Import the CameraView
import DemoMission from './pages/DemoMission';
import FlightLogs from './pages/FlightLogs';

function App() {
  return (
    <Router>
      <div className="flex h-screen bg-gray-900 text-gray-100">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<Navigate to="/mission-planner" replace />} />
            <Route path="/mission-planner" element={<MissionPlanner />} />
            <Route path="/sites" element={<Sites />} />
            {/* Add a new route for testing the webcam */}
            <Route path="/webcam" element={<WebcamComponent />} />
            {/* Add a new route for the camera view */}
            <Route path="/camera" element={<CameraView />} />
            <Route path="/demo-mission" element={<DemoMission />} />
            <Route path="/flight-logs" element={<FlightLogs />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;