import { SavedRoute, LocationPoint } from '@/types/route';

/**
 * Encoded Polyline algorithm decoder
 */
export function decodePolyline(encoded: string): { lat: number; lng: number }[] {
  if (!encoded) return [];
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
 * Export route to GPX XML format
 */
export function generateGPX(route: SavedRoute): string {
  const points = route.encodedPolyline ? decodePolyline(route.encodedPolyline) : [];

  const escapeXml = (str: string) =>
    str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');

  const title = escapeXml(route.title || 'Saved Route');
  const description = escapeXml(route.description || '');

  let gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Google Maps Route Saver" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>${title}</name>
    <desc>${description}</desc>
  </metadata>
  <rte>
    <name>${title}</name>
    <desc>${description}</desc>
    <rtept lat="${route.origin.lat}" lon="${route.origin.lng}">
      <name>${escapeXml(route.origin.name || 'Origin')}</name>
    </rtept>
`;

  route.waypoints.forEach((wp, idx) => {
    gpx += `    <rtept lat="${wp.lat}" lon="${wp.lng}">
      <name>${escapeXml(wp.name || `Waypoint ${idx + 1}`)}</name>
    </rtept>\n`;
  });

  gpx += `    <rtept lat="${route.destination.lat}" lon="${route.destination.lng}">
      <name>${escapeXml(route.destination.name || 'Destination')}</name>
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
  const points = route.encodedPolyline ? decodePolyline(route.encodedPolyline) : [];

  const escapeXml = (str: string) =>
    str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');

  const title = escapeXml(route.title || 'Saved Route');
  const description = escapeXml(route.description || '');

  let kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${title}</name>
    <description>${description}</description>
    <Placemark>
      <name>出発地: ${escapeXml(route.origin.name || 'Origin')}</name>
      <Point>
        <coordinates>${route.origin.lng},${route.origin.lat},0</coordinates>
      </Point>
    </Placemark>\n`;

  route.waypoints.forEach((wp, idx) => {
    kml += `    <Placemark>
      <name>経由地 ${idx + 1}: ${escapeXml(wp.name || `Waypoint ${idx + 1}`)}</name>
      <Point>
        <coordinates>${wp.lng},${wp.lat},0</coordinates>
      </Point>
    </Placemark>\n`;
  });

  kml += `    <Placemark>
      <name>目的地: ${escapeXml(route.destination.name || 'Destination')}</name>
      <Point>
        <coordinates>${route.destination.lng},${route.destination.lat},0</coordinates>
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
