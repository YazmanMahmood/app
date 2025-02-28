export interface FlightLog {
  id: string;
  missionName: string;
  videoUrl: string;
  thumbnailUrl: string;
  startTime: string;
  endTime: string;
  duration: string;
  metrics: {
    personsDetected: number;
    intrudersDetected: number;
    issuesDetected: number;
    averageAltitude: number;
    maxSpeed: number;
    averageSpeed: number;
  };
} 