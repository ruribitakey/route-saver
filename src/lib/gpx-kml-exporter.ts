import { SavedRoute, LocationPoint } from '@/types/route';

/**
 * Encoded Polyline algorithm decoder
 */
export function decodePolyline(encoded: string): { lat: number; lng: number }[] {
  if (!encoded || encoded.includes('demo')) return [];
  const points: { lat: number; lng: number }[] = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b: number;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }

  return points;
}

/**
 * Helper to ensure a valid track line exists connecting points if polyline is unavailable
 */
function getTrackPoints(route: SavedRoute): { lat: number; lng: number }[] {
  const decoded = route.encodedPolyline ? decodePolyline(route.encodedPolyline) : [];
  if (decoded.length > 0) return decoded;

  // Fallback track points: Connect Origin -> Waypoints -> Destination
  const fallbackPoints: { lat: number; lng: number }[] = [];
  if (route.origin?.lat && route.origin?.lng) {
    fallbackPoints.push({ lat: route.origin.lat, lng: route.origin.lng });
  }

  if (Array.isArray(route.waypoints)) {
    route.waypoints.forEach((wp) => {
      if (wp.lat && wp.lng) {
        fallbackPoints.push({ lat: wp.lat, lng: wp.lng });
      }
    });
  }

  if (route.destination?.lat && route.destination?.lng) {
    fallbackPoints.push({ lat: route.destination.lat, lng: route.destination.lng });
  }

  return fallbackPoints;
}

/**
 * Export route to GPX XML format
 */
export function generateGPX(route: SavedRoute): string {
  const points = getTrackPoints(route);

  const escapeXml = (str: string) =>
    (str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');

  const title = escapeXml(route.title || 'ドライブ・ルート');
  const description = escapeXml(route.description || 'Google Maps Route Saver で作成されたルート');

  const originName = escapeXml(route.origin?.name || '出発地');
  const destName = escapeXml(route.destination?.name || '目的地');
  const originLat = route.origin?.lat || 35.681236;
  const originLng = route.origin?.lng || 139.767125;
  const destLat = route.destination?.lat || 35.170915;
  const destLng = route.destination?.lng || 136.881537;

  let gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Google Maps Route Saver" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>${title}</name>
    <desc>${description}</desc>
  </metadata>
  <rte>
    <name>${title}</name>
    <desc>${description}</desc>
    <rtept lat="${originLat}" lon="${originLng}">
      <name>${originName}</name>
    </rtept>
`;

  if (Array.isArray(route.waypoints)) {
    route.waypoints.forEach((wp, idx) => {
      const wpLat = wp.lat || originLat;
      const wpLng = wp.lng || originLng;
      gpx += `    <rtept lat="${wpLat}" lon="${wpLng}">
      <name>${escapeXml(wp.name || `経由地 ${idx + 1}`)}</name>
    </rtept>\n`;
    });
  }

  gpx += `    <rtept lat="${destLat}" lon="${destLng}">
      <name>${destName}</name>
    </rtept>
  </rte>\n`;

  if (points.length > 0) {
    gpx += `  <trk>
    <name>${title}</name>
    <trkseg>\n`;
    points.forEach((pt) => {
      gpx += `      <trkpt lat="${pt.lat}" lon="${pt.lng}" />\n`;
    });
    gpx += `    </trkseg>
  </trk>\n`;
  }

  gpx += `</gpx>`;
  return gpx;
}

/**
 * Export route to KML XML format
 */
export function generateKML(route: SavedRoute): string {
  const points = getTrackPoints(route);

  const escapeXml = (str: string) =>
    (str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');

  const title = escapeXml(route.title || 'ドライブ・ルート');
  const description = escapeXml(route.description || 'Google Maps Route Saver で作成されたルート');

  const originName = escapeXml(route.origin?.name || '出発地');
  const destName = escapeXml(route.destination?.name || '目的地');
  const originLat = route.origin?.lat || 35.681236;
  const originLng = route.origin?.lng || 139.767125;
  const destLat = route.destination?.lat || 35.170915;
  const destLng = route.destination?.lng || 136.881537;

  let kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${title}</name>
    <description>${description}</description>
    <Placemark>
      <name>出発地: ${originName}</name>
      <Point>
        <coordinates>${originLng},${originLat},0</coordinates>
      </Point>
    </Placemark>\n`;

  if (Array.isArray(route.waypoints)) {
    route.waypoints.forEach((wp, idx) => {
      const wpLat = wp.lat || originLat;
      const wpLng = wp.lng || originLng;
      kml += `    <Placemark>
      <name>経由地 ${idx + 1}: ${escapeXml(wp.name || `経由地 ${idx + 1}`)}</name>
      <Point>
        <coordinates>${wpLng},${wpLat},0</coordinates>
      </Point>
    </Placemark>\n`;
    });
  }

  kml += `    <Placemark>
      <name>目的地: ${destName}</name>
      <Point>
        <coordinates>${destLng},${destLat},0</coordinates>
      </Point>
    </Placemark>\n`;

  if (points.length > 0) {
    const coordsStr = points.map((p) => `${p.lng},${p.lat},0`).join(' ');
    kml += `    <Placemark>
      <name>ルート軌跡</name>
      <LineString>
        <tessellate>1</tessellate>
        <coordinates>${coordsStr}</coordinates>
      </LineString>
    </Placemark>\n`;
  }

  kml += `  </Document>
</kml>`;
  return kml;
}

/**
 * Generate smart default filename with date
 */
export function getSmartFilename(title: string, extension: 'gpx' | 'kml'): string {
  const dateStr = new Date().toISOString().split('T')[0]; // e.g. 2026-09-12
  const cleanTitle = (title || 'route')
    .replace(/[^a-zA-Z0-9あ-んア-ン一-龠_-]/g, '_')
    .substring(0, 30);
  return `${cleanTitle}_${dateStr}.${extension}`;
}

/**
 * Trigger file download in browser
 */
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
