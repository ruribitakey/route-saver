export interface LocationPoint {
  name: string;
  lat: number;
  lng: number;
  placeId?: string;
}

export type TravelModeType = 'DRIVING' | 'WALKING' | 'BICYCLING' | 'TRANSIT';

export type TollModeType = 'HIGHWAY' | 'SMART_SAVINGS' | 'FREE_ROADS';

export interface SavedRoute {
  id?: string;
  userId: string;
  title: string;
  description: string;
  tags: string[];
  origin: LocationPoint;
  destination: LocationPoint;
  waypoints: LocationPoint[];
  travelMode: TravelModeType;
  tollMode?: TollModeType;
  maxTollAmount?: number;
  isNightSafeMode?: boolean;
  encodedPolyline?: string;
  distanceMeters?: number;
  durationSeconds?: number;
  isPublic?: boolean;
  createdAt?: string | number | Date;
  updatedAt?: string | number | Date;
}
