import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

interface MapControllerProps {
  isLocked: boolean;
}

export const MapController = ({ isLocked }: MapControllerProps) => {
  const map = useMap();
  
  useEffect(() => {
    if (isLocked) {
      map.dragging.disable();
      map.touchZoom.disable();
      map.doubleClickZoom.disable();
      map.scrollWheelZoom.disable();
      map.boxZoom.disable();
      map.keyboard.disable();
    } else {
      map.dragging.enable();
      map.touchZoom.enable();
      map.doubleClickZoom.enable();
      map.scrollWheelZoom.enable();
      map.boxZoom.enable();
      map.keyboard.enable();
    }
  }, [isLocked, map]);

  return null;
};