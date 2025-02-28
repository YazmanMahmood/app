import { FC } from 'react';
import { FlightLog } from '../types/FlightLog';
import { Clock, Users, AlertTriangle, AlertOctagon, Gauge, ArrowUp, Play } from 'lucide-react';

interface FlightLogCardProps {
  log: FlightLog;
  onClick: () => void;
}

const FlightLogCard: FC<FlightLogCardProps> = ({ log, onClick }) => {
  return (
    <div 
      className="bg-gray-800 rounded-lg p-4 flex items-center gap-4 hover:bg-gray-700 transition-colors cursor-pointer"
      onClick={onClick}
    >
      {/* Thumbnail with play button overlay */}
      <div className="relative w-48 h-32 flex-shrink-0">
        <img 
          src={log.thumbnailUrl} 
          alt={log.missionName}
          className="w-full h-full object-cover rounded"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 hover:bg-opacity-50 transition-opacity">
          <Play className="w-10 h-10 text-white" />
        </div>
      </div>

      {/* Mission name and time */}
      <div className="flex-1">
        <h3 className="text-xl font-bold text-white mb-2">{log.missionName}</h3>
        <div className="flex items-center gap-4 text-gray-300">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>{log.startTime}</span>
          </div>
          <span>→</span>
          <span>{log.endTime}</span>
          <span>•</span>
          <span>{log.duration}</span>
        </div>
      </div>

      {/* Metrics */}
      <div className="flex gap-6 text-gray-300">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4" />
          <span>{log.metrics.personsDetected}</span>
        </div>
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          <span>{log.metrics.intrudersDetected}</span>
        </div>
        <div className="flex items-center gap-2">
          <AlertOctagon className="w-4 h-4" />
          <span>{log.metrics.issuesDetected}</span>
        </div>
        <div className="flex items-center gap-2">
          <Gauge className="w-4 h-4" />
          <span>{log.metrics.averageSpeed}m/s</span>
        </div>
        <div className="flex items-center gap-2">
          <ArrowUp className="w-4 h-4" />
          <span>{log.metrics.averageAltitude}m</span>
        </div>
      </div>
    </div>
  );
};

export default FlightLogCard; 