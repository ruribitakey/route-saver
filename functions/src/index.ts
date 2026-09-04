import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

/**
 * Cloud Function HTTPS API Proxy for Google Maps Directions API
 * Keeps API Key hidden safely on backend server.
 */
export const calculateRoute = functions.https.onRequest(async (req, res) => {
  // CORS Headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    const { origin, destination, waypoints, travelMode } = req.body || {};

    if (!origin || !destination) {
      res.status(400).json({ error: 'Origin and destination are required.' });
      return;
    }

    const apiKey = process.env.GOOGLE_MAPS_SERVER_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    // Fallback Demo Response if no server API key configured yet
    if (!apiKey || apiKey.includes('demo')) {
      res.status(200).json({
        status: 'OK',
        demoMode: true,
        distanceMeters: 98500,
        durationSeconds: 6300,
        overviewPolyline: 'a~l~Ffs~vO_@_@...demo_polyline',
        message: 'Calculated via Cloud Functions Demo Proxy',
      });
      return;
    }

    // Prepare Directions API URL
    const waypointsParam = Array.isArray(waypoints) && waypoints.length > 0
      ? `&waypoints=${encodeURIComponent(waypoints.join('|'))}`
      : '';

    const modeParam = travelMode ? travelMode.toLowerCase() : 'driving';
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(
      origin
    )}&destination=${encodeURIComponent(
      destination
    )}${waypointsParam}&mode=${modeParam}&key=${apiKey}`;

    const apiRes = await fetch(url);
    const data = await apiRes.json();

    res.status(200).json(data);
  } catch (error: any) {
    console.error('Error calculating route in Cloud Functions:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});
