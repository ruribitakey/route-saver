import { LocationPoint, TravelModeType, TollModeType } from '@/types/route';

/**
 * Google Maps Universal Links (Navigation URL) generator
 * Formats a Google Maps directions URL with turn-by-turn navigation enabled.
 */
export function generateGoogleMapsNavigationUrl(params: {
  origin: LocationPoint;
  destination: LocationPoint;
  waypoints?: LocationPoint[];
  travelMode?: TravelModeType;
  tollMode?: TollModeType;
}): string {
  const baseUrl = 'https://www.google.com/maps/dir/?api=1';

  const formatPoint = (point: LocationPoint) => {
    if (point.lat && point.lng) {
      return `${point.lat},${point.lng}`;
    }
    return encodeURIComponent(point.name || '');
  };

  const originParam = formatPoint(params.origin);
  const destParam = formatPoint(params.destination);

  let url = `${baseUrl}&origin=${originParam}&destination=${destParam}`;

  if (params.waypoints && params.waypoints.length > 0) {
    const validWaypoints = params.waypoints.filter((wp) => wp.name || (wp.lat && wp.lng));
    if (validWaypoints.length > 0) {
      const wpStr = validWaypoints.map((wp) => formatPoint(wp)).join('|');
      url += `&waypoints=${wpStr}`;
    }
  }

  const modeMap: Record<string, string> = {
    DRIVING: 'driving',
    WALKING: 'walking',
    BICYCLING: 'bicycling',
    TRANSIT: 'transit',
  };

  const mode = modeMap[params.travelMode || 'DRIVING'] || 'driving';
  url += `&travelmode=${mode}`;

  if ((params.travelMode || 'DRIVING') === 'DRIVING' && params.tollMode === 'FREE_ROADS') {
    url += `&avoid=tolls|highways`;
  }

  url += `&dir_action=navigate`;

  return url;
}
