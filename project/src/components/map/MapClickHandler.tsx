import { useMapEvents } from 'react-leaflet';

interface MapClickHandlerProps {
  onPointSelect: (lat: number, lng: number) => void;
  isActive: boolean;
}

export const MapClickHandler = ({ onPointSelect, isActive }: MapClickHandlerProps) => {
  useMapEvents({
    click(e) {
      if (isActive) {
        onPointSelect(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
};