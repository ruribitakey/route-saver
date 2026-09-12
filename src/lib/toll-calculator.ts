import { LocationPoint, TollModeType } from '@/types/route';

interface EstimateTollParams {
  origin: LocationPoint;
  destination: LocationPoint;
  waypoints: LocationPoint[];
  distanceMeters: number;
  tollMode: TollModeType;
  maxTollAmount?: number;
  hasTolls?: boolean;
}

/**
 * Estimate exact Japanese toll price (Yen) for Kansai & general toll roads
 */
export function estimateJapaneseToll(params: EstimateTollParams): {
  amount: number;
  displayText: string;
} {
  const { origin, destination, waypoints, distanceMeters, tollMode, maxTollAmount = 300, hasTolls = true } = params;

  if (tollMode === 'FREE_ROADS' || !hasTolls) {
    return {
      amount: 0,
      displayText: '0 円 (一般道)',
    };
  }

  let totalToll = 0;
  const allLocationNames = [
    origin.name,
    ...waypoints.map((w) => w.name),
    destination.name,
  ]
    .join(' ')
    .toLowerCase();

  // 1. Check for Akashi Kaikyo Bridge / Awaji Island Toll (~900 yen ETC)
  const hitsAwaji =
    allLocationNames.includes('淡路') ||
    allLocationNames.includes('洲本') ||
    allLocationNames.includes('明石海峡') ||
    allLocationNames.includes('鳴門');

  if (hitsAwaji) {
    totalToll += 900; // Akashi Kaikyo Bridge ETC toll
  }

  // 2. Check for Harbor Highway (210 yen)
  const hitsHarbor = allLocationNames.includes('ハーバー');
  if (hitsHarbor) {
    totalToll += 210;
  }

  // 3. Check for Sakai-Senboku Toll Road (~210 yen)
  const hitsSakai = allLocationNames.includes('堺泉北');
  if (hitsSakai) {
    totalToll += 210;
  }

  // 4. Mode Logic
  if (tollMode === 'SMART_SAVINGS') {
    // Smart Savings: allow bypasses under threshold
    if (totalToll === 0) {
      totalToll = Math.min(210, maxTollAmount);
    } else {
      totalToll = Math.min(totalToll, maxTollAmount * 3);
    }
    return {
      amount: totalToll,
      displayText: `約 ${totalToll.toLocaleString()} 円 (スマート節約)`,
    };
  }

  // HIGHWAY Mode: Calculate Hanshin Expressway / NEXCO distance-based fare
  const totalKm = distanceMeters / 1000;
  let expresswayDistanceToll = 0;

  if (totalKm > 10) {
    // Hanshin / NEXCO distance tariff simulation (300 yen to ~1,320 yen + NEXCO additions)
    expresswayDistanceToll = Math.min(1320, Math.max(300, Math.round((totalKm * 15 + 200) / 10) * 10));
  }

  totalToll += expresswayDistanceToll;

  return {
    amount: totalToll,
    displayText: `約 ${totalToll.toLocaleString()} 円 (高速優先)`,
  };
}
