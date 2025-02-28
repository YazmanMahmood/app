import { useState, useCallback } from 'react';
import FlightLogCard from '../components/FlightLogCard';
import { FlightLog } from '../types/FlightLog';
import { X } from 'lucide-react';

const MOCK_LOGS: FlightLog[] = [
  {
    id: '1',
    missionName: 'Test Mission 1',
    videoUrl: '/videos/test-mission.mp4',
    thumbnailUrl: '/images/test-mission-thumb.jpg',
    startTime: '2024-01-16 14:30',
    endTime: '2024-01-16 15:45',
    duration: '1h 15m',
    metrics: {
      personsDetected: 12,
      intrudersDetected: 1,
      issuesDetected: 2,
      averageAltitude: 45,
      maxSpeed: 12.5,
      averageSpeed: 8.3
    }
  },
  {
    id: '2',
    missionName: 'Perimeter Check',
    videoUrl: '/videos/perimeter.mp4',
    thumbnailUrl: '/images/perimeter-thumb.jpg',
    startTime: '2024-01-16 16:00',
    endTime: '2024-01-16 17:00',
    duration: '1h',
    metrics: {
      personsDetected: 8,
      intrudersDetected: 0,
      issuesDetected: 1,
      averageAltitude: 40,
      maxSpeed: 10.2,
      averageSpeed: 7.5
    }
  },
  {
    id: '3',
    missionName: 'Night Patrol',
    videoUrl: '/videos/night-patrol.mp4',
    thumbnailUrl: '/images/night-patrol-thumb.jpg',
    startTime: '2024-01-16 22:00',
    endTime: '2024-01-16 23:30',
    duration: '1h 30m',
    metrics: {
      personsDetected: 3,
      intrudersDetected: 2,
      issuesDetected: 1,
      averageAltitude: 50,
      maxSpeed: 15.0,
      averageSpeed: 9.2
    }
  },
  {
    id: '4',
    missionName: 'Morning Survey',
    videoUrl: '/videos/morning-survey.mp4',
    thumbnailUrl: '/images/morning-survey-thumb.jpg',
    startTime: '2024-01-17 06:00',
    endTime: '2024-01-17 07:15',
    duration: '1h 15m',
    metrics: {
      personsDetected: 15,
      intrudersDetected: 0,
      issuesDetected: 3,
      averageAltitude: 35,
      maxSpeed: 11.8,
      averageSpeed: 6.9
    }
  },
  {
    id: '5',
    missionName: 'Facility Inspection',
    videoUrl: '/videos/facility.mp4',
    thumbnailUrl: '/images/facility-thumb.jpg',
    startTime: '2024-01-17 10:00',
    endTime: '2024-01-17 11:00',
    duration: '1h',
    metrics: {
      personsDetected: 20,
      intrudersDetected: 1,
      issuesDetected: 4,
      averageAltitude: 30,
      maxSpeed: 9.5,
      averageSpeed: 5.8
    }
  },
  {
    id: '6',
    missionName: 'Emergency Response Test',
    videoUrl: '/videos/emergency.mp4',
    thumbnailUrl: '/images/emergency-thumb.jpg',
    startTime: '2024-01-17 14:00',
    endTime: '2024-01-17 14:45',
    duration: '45m',
    metrics: {
      personsDetected: 6,
      intrudersDetected: 3,
      issuesDetected: 2,
      averageAltitude: 55,
      maxSpeed: 18.5,
      averageSpeed: 12.3
    }
  }
];

const FlightLogs = () => {
  const [selectedLog, setSelectedLog] = useState<FlightLog | null>(null);

  const handleClose = useCallback(() => {
    setSelectedLog(null);
  }, []);

  const handleModalClick = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).classList.contains('modal-overlay')) {
      handleClose();
    }
  }, [handleClose]);

  return (
    <div className="p-6 bg-gray-900 min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-white">Flight Logs</h1>
      
      <div className="space-y-4">
        {MOCK_LOGS.map(log => (
          <FlightLogCard 
            key={log.id} 
            log={log} 
            onClick={() => setSelectedLog(log)}
          />
        ))}
      </div>

      {selectedLog && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-start justify-center p-6 modal-overlay overflow-y-auto"
          onClick={handleModalClick}
        >
          <div className="bg-gray-800 rounded-lg w-full max-w-6xl my-8">
            <div className="sticky top-0 bg-gray-800 z-10 flex justify-between items-center p-4 border-b border-gray-700">
              <h2 className="text-xl font-bold text-white">{selectedLog.missionName}</h2>
              <button 
                className="text-gray-400 hover:text-white"
                onClick={handleClose}
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <video 
              controls 
              className="w-full aspect-video"
              src={selectedLog.videoUrl}
            />
            
            <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-gray-300 border-t border-gray-700">
              <div>
                <h3 className="font-semibold mb-2">Time Details</h3>
                <p>Start: {selectedLog.startTime}</p>
                <p>End: {selectedLog.endTime}</p>
                <p>Duration: {selectedLog.duration}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Detections</h3>
                <p>Persons: {selectedLog.metrics.personsDetected}</p>
                <p>Intruders: {selectedLog.metrics.intrudersDetected}</p>
                <p>Issues: {selectedLog.metrics.issuesDetected}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Flight Metrics</h3>
                <p>Avg. Altitude: {selectedLog.metrics.averageAltitude}m</p>
                <p>Max Speed: {selectedLog.metrics.maxSpeed} m/s</p>
                <p>Avg Speed: {selectedLog.metrics.averageSpeed} m/s</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FlightLogs; 