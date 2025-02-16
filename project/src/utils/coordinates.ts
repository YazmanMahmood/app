export const formatCoordinates = (lat: number, lng: number): string => {
  return `${lat.toFixed(6)}°N, ${lng.toFixed(6)}°E`;
};

export const getWaypointLabel = (index: number): string => {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  return index < alphabet.length ? alphabet[index] : `W${index + 1}`;
};