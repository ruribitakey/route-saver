'use client';

import React, { useEffect, useState, useRef } from 'react';
import { LocationPoint, TravelModeType, TollModeType, SavedRoute } from '@/types/route';
import { MapPin, Navigation, Clock, Compass, Coins } from 'lucide-react';

interface MapContainerProps {
  origin: LocationPoint;
  destination: LocationPoint;
  waypoints: LocationPoint[];
  travelMode: TravelModeType;
  tollMode?: TollModeType;
  maxTollAmount?: number;
  calcTrigger?: number;
  onRouteCalculated?: (data: {
    encodedPolyline: string;
    distanceMeters: number;
    durationSeconds: number;
  }) => void;
  selectedRoute?: SavedRoute | null;
}

export const MapContainer: React.FC<MapContainerProps> = ({
  origin,
  destination,
  waypoints,
  travelMode,
  tollMode = 'SMART_SAVINGS',
  maxTollAmount = 300,
  calcTrigger = 0,
  onRouteCalculated,
  selectedRoute,
}) => {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const isDemoKey = !apiKey || apiKey.includes('demo');

  const [routeInfo, setRouteInfo] = useState<{
    distanceText: string;
    durationText: string;
    estimatedTollText?: string;
  } | null>(null);

  const [isMapLoaded, setIsMapLoaded] = useState(false);

  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<any>(null);
  const directionsRendererRef = useRef<any>(null);

  // Dynamically load Google Maps JS SDK script tag
  useEffect(() => {
    if (isDemoKey || typeof window === 'undefined') return;

    if (window.google?.maps) {
      setIsMapLoaded(true);
      return;
    }

    const existingScript = document.getElementById('google-maps-sdk');
    if (!existingScript) {
      const script = document.createElement('script');
      script.id = 'google-maps-sdk';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
      script.async = true;
      script.onload = () => {
        setIsMapLoaded(true);
      };
      script.onerror = (e) => {
        console.error('Failed to load Google Maps script:', e);
      };
      document.head.appendChild(script);
    } else {
      existingScript.addEventListener('load', () => setIsMapLoaded(true));
    }
  }, [apiKey, isDemoKey]);

  // Initialize Map object
  useEffect(() => {
    if (!isMapLoaded || !window.google?.maps || !mapRef.current) return;

    if (!googleMapRef.current) {
      const center = { lat: origin.lat || 34.702485, lng: origin.lng || 135.495951 };
      googleMapRef.current = new window.google.maps.Map(mapRef.current, {
        center,
        zoom: 10,
      });

      directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
        map: googleMapRef.current,
        suppressMarkers: false,
      });
    }
  }, [isMapLoaded, origin.lat, origin.lng]);

  // Calculate route considering Toll Mode and Max Toll Threshold
  useEffect(() => {
    if (isDemoKey || !window.google?.maps) {
      if (origin.name && destination.name) {
        const estToll =
          tollMode === 'SMART_SAVINGS'
            ? `約 210 円 (${maxTollAmount}円以下パス許可)`
            : tollMode === 'HIGHWAY'
            ? '約 1,820 円'
            : '0 円 (一般道)';

        setRouteInfo({
          distanceText: '約 105.0 km',
          durationText: '約 1時間 50分',
          estimatedTollText: estToll,
        });

        if (onRouteCalculated) {
          onRouteCalculated({
            encodedPolyline: 'a~l~Ffs~vO_@_@...demo_polyline',
            distanceMeters: 105000,
            durationSeconds: 6600,
          });
        }
      }
      return;
    }

    if (!googleMapRef.current || !directionsRendererRef.current) return;

    if (origin.name && destination.name) {
      const directionsService = new window.google.maps.DirectionsService();

      const originLocation = origin.lat && origin.lng ? { lat: origin.lat, lng: origin.lng } : origin.name;
      const destinationLocation = destination.lat && destination.lng ? { lat: destination.lat, lng: destination.lng } : destination.name;

      const waypointsReq = waypoints
        .filter((wp) => wp.name)
        .map((wp) => ({
          location: wp.lat && wp.lng ? { lat: wp.lat, lng: wp.lng } : wp.name,
          stopover: true,
        }));

      // Toll avoidance strategy
      const avoidTolls = tollMode === 'FREE_ROADS' || (tollMode === 'SMART_SAVINGS' && maxTollAmount < 150);

      directionsService.route(
        {
          origin: originLocation,
          destination: destinationLocation,
          waypoints: waypointsReq,
          travelMode: window.google.maps.TravelMode[travelMode] || window.google.maps.TravelMode.DRIVING,
          avoidTolls: avoidTolls,
          avoidHighways: avoidTolls,
        },
        (result: any, status: any) => {
          if (status === 'OK' && result) {
            directionsRendererRef.current.setDirections(result);
            const route = result.routes[0];
            if (route && route.legs) {
              let totalDistance = 0;
              let totalDuration = 0;
              route.legs.forEach((leg: any) => {
                totalDistance += leg.distance.value;
                totalDuration += leg.duration.value;
              });

              const km = (totalDistance / 1000).toFixed(1);
              const mins = Math.round(totalDuration / 60);
              const hrs = Math.floor(mins / 60);
              const remMins = mins % 60;
              const durationStr = hrs > 0 ? `${hrs}時間 ${remMins}分` : `${mins}分`;

              const estTollText =
                tollMode === 'SMART_SAVINGS'
                  ? `格安バイパス優先 (${maxTollAmount}円以下)`
                  : tollMode === 'HIGHWAY'
                  ? '全有料道路許可'
                  : '0円 (完全一般道)';

              setRouteInfo({
                distanceText: `${km} km`,
                durationText: durationStr,
                estimatedTollText: estTollText,
              });

              if (onRouteCalculated) {
                onRouteCalculated({
                  encodedPolyline: route.overview_polyline || '',
                  distanceMeters: totalDistance,
                  durationSeconds: totalDuration,
                });
              }
            }
          } else {
            console.warn('Google Maps Directions status:', status);
          }
        }
      );
    }
  }, [
    origin,
    destination,
    waypoints,
    travelMode,
    tollMode,
    maxTollAmount,
    calcTrigger,
    isDemoKey,
    isMapLoaded,
  ]);

  return (
    <div className="relative w-full h-[600px] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950 flex flex-col">
      {/* Route Info Overlay Bar */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl px-4 py-2.5 shadow-xl text-white flex items-center space-x-5 pointer-events-auto">
          <div className="flex items-center space-x-2">
            <Compass className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">総距離</p>
              <p className="text-sm font-bold text-slate-100">
                {routeInfo ? routeInfo.distanceText : '---'}
              </p>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-800" />

          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-amber-500" />
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">予想所要時間</p>
              <p className="text-sm font-bold text-slate-100">
                {routeInfo ? routeInfo.durationText : '---'}
              </p>
            </div>
          </div>

          {routeInfo?.estimatedTollText && (
            <>
              <div className="h-6 w-px bg-slate-800" />
              <div className="flex items-center space-x-2">
                <Coins className="h-5 w-5 text-emerald-400" />
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">有料道路モード</p>
                  <p className="text-xs font-bold text-emerald-300">
                    {routeInfo.estimatedTollText}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {isDemoKey && (
          <div className="bg-amber-500/90 backdrop-blur-md text-slate-950 font-semibold px-3 py-1.5 rounded-lg text-xs shadow-lg flex items-center space-x-1.5 pointer-events-auto">
            <Navigation className="h-3.5 w-3.5" />
            <span>デモ表示モード</span>
          </div>
        )}
      </div>

      {/* Map Container Element */}
      <div ref={mapRef} className="w-full h-full bg-slate-900 flex items-center justify-center relative">
        {(isDemoKey || !isMapLoaded) && (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 flex flex-col items-center justify-center p-6 text-center z-0">
            <div className="w-24 h-24 rounded-full bg-blue-600/10 border border-blue-500/30 flex items-center justify-center mb-4 shadow-2xl relative">
              <MapPin className="h-10 w-10 text-blue-500 animate-bounce" />
              <div className="absolute w-16 h-16 rounded-full border border-blue-500/40 animate-ping" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              {isDemoKey ? 'Google Maps プレビュー' : 'Google Maps 読み込み中...'}
            </h3>
            <p className="text-sm text-slate-400 max-w-md mb-4">
              {isDemoKey
                ? '`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` を設定すると、実マップが描画されます。'
                : 'マップAPIをロードしています。しばらくお待ちください。'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
