import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { WaypointAction } from '../types/Mission';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';

interface WaypointMarkerProps {
  id: string;
  index: number;
  coordinates: [number, number];
  altitude: number;
  action: WaypointAction;
  onHeightChange: (height: number) => void;
  onDelete: () => void;
  onDragEnd: (id: string, newCoords: [number, number]) => void;
  isDraggable: boolean;
}

const WaypointMarker: React.FC<WaypointMarkerProps> = ({
  id,
  index,
  coordinates,
  altitude,
  action,
  onHeightChange,
  onDelete,
  onDragEnd,
  isDraggable
}) => {
  const [lastTap, setLastTap] = useState(0);
  const doubleTapDelay = 300; // milliseconds

  const handleTap = () => {
    const now = Date.now();
    if (lastTap && (now - lastTap) < doubleTapDelay) {
      // Double tap detected
      if (index !== 0) { // Don't delete takeoff point
        onDelete();
      }
    }
    setLastTap(now);
  };

  // Create label content
  const labelContent = `
    <div class="waypoint-label">
      <div>Lat: ${coordinates[0].toFixed(6)}°</div>
      <div>Long: ${coordinates[1].toFixed(6)}°</div>
      <div>Alt: ${altitude}m</div>
      <div>${action.type}</div>
    </div>
  `;

  // Use the same icon style for all waypoints
  const waypointIcon = L.divIcon({
    className: 'custom-div-icon',
    html: `
      ${labelContent}
      <div class='marker-pin bg-blue-500'>
        <span class='text-white font-bold'>${index + 1}</span>
      </div>
    `,
    iconSize: [30, 42],
    iconAnchor: [15, 42],
    popupAnchor: [0, -42]
  });

  return (
    <Marker
      position={coordinates}
      icon={waypointIcon}
      draggable={isDraggable}
      eventHandlers={{
        dragend: (e) => {
          const marker = e.target;
          const position = marker.getLatLng();
          onDragEnd(id, [position.lat, position.lng]);
        },
        click: handleTap,
        dragstart: () => {
          // Optional: Add visual feedback when dragging starts
          const el = document.querySelector(`[data-waypoint-id="${id}"]`);
          if (el) el.classList.add('dragging');
        },
        dragend: (e) => {
          const marker = e.target;
          const position = marker.getLatLng();
          onDragEnd(id, [position.lat, position.lng]);
          // Optional: Remove visual feedback
          const el = document.querySelector(`[data-waypoint-id="${id}"]`);
          if (el) el.classList.remove('dragging');
        }
      }}
    >
      <Popup className="waypoint-popup">
        <div className="p-3">
          <div className="flex justify-between items-center mb-2">
            <div className="font-bold text-lg">Waypoint {index + 1}</div>
            <button
              onClick={onDelete}
              className="p-1 hover:bg-red-500 hover:text-white rounded transition-colors"
              title="Delete waypoint"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-semibold">Lat:</span> {coordinates[0].toFixed(6)}°
            </div>
            <div>
              <span className="font-semibold">Long:</span> {coordinates[1].toFixed(6)}°
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">Height:</span>
              <input
                type="number"
                value={altitude}
                onChange={(e) => onHeightChange(parseInt(e.target.value))}
                className="w-20 px-2 py-1 border rounded"
                min="0"
                max="1000"
              /> m
            </div>
            <div>
              <span className="font-semibold">Action:</span> {action.type}
              {action.duration && <span> ({action.duration}s)</span>}
            </div>
          </div>
        </div>
      </Popup>
    </Marker>
  );
};

export default WaypointMarker; 