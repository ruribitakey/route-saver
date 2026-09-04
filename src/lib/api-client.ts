/**
 * Client helper to call Cloud Functions API proxy (/api/calculateRoute)
 */
export async function calculateRouteViaProxy(payload: {
  origin: string;
  destination: string;
  waypoints?: string[];
  travelMode?: string;
}) {
  const functionUrl =
    process.env.NEXT_PUBLIC_FUNCTIONS_URL || '/api/calculateRoute';

  try {
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`API Proxy error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.warn('Cloud Functions Proxy call failed or not deployed, using local client calculation', error);
    return null;
  }
}
