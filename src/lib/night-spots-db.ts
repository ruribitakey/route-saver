import { LocationPoint } from '@/types/route';

export interface NightSafeSpot extends LocationPoint {
  category: 'SA' | 'PA' | 'MICHI_NO_EKI' | 'JUNCTION';
  region: 'KANSAI' | 'CHUBU' | 'KANTO' | 'CHUGOKU';
  description: string;
}

export const NIGHT_SAFE_SPOTS: NightSafeSpot[] = [
  // Kansai / Tokai / Chubu Major 24h Rest Stops
  {
    name: '御在所サービスエリア (EXPASA御在所)',
    lat: 35.0112,
    lng: 136.5256,
    category: 'SA',
    region: 'CHUBU',
    description: '新名神/東名阪 24時間ガソリンスタンド・フードコート完備',
  },
  {
    name: '土山サービスエリア',
    lat: 34.9392,
    lng: 136.2736,
    category: 'SA',
    region: 'KANSAI',
    description: '新名神 24時間コンビニ・給油所併設の大型SA',
  },
  {
    name: '大津サービスエリア',
    lat: 34.9922,
    lng: 135.8895,
    category: 'SA',
    region: 'KANSAI',
    description: '名神高速 琵琶湖が一望できる明るい24h大型SA',
  },
  {
    name: '草津パーキングエリア',
    lat: 34.9815,
    lng: 135.9542,
    category: 'PA',
    region: 'KANSAI',
    description: '名神高速 24時間シャワー施設・シャワーステーション完備',
  },
  {
    name: '宝塚サービスエリア (EXPASA宝塚)',
    lat: 34.8458,
    lng: 135.3347,
    category: 'SA',
    region: 'KANSAI',
    description: '新名神 西日本最大級の24h明るい巨大SA',
  },
  {
    name: '吹田サービスエリア',
    lat: 34.7733,
    lng: 135.5342,
    category: 'SA',
    region: 'KANSAI',
    description: '名神高速 近畿圏の主要分岐点近くの大型24h施設',
  },
  {
    name: '刈谷ハイウェイオアシス',
    lat: 35.0211,
    lng: 137.0392,
    category: 'SA',
    region: 'CHUBU',
    description: '伊勢湾岸道 24時間利用可能・日本有数の超大型オアシス',
  },
  {
    name: '湾岸長島パーキングエリア',
    lat: 35.0319,
    lng: 136.7261,
    category: 'PA',
    region: 'CHUBU',
    description: '伊勢湾岸道 足湯や24時間売店完備',
  },
  {
    name: '多賀サービスエリア (EXPASA多賀)',
    lat: 35.2195,
    lng: 136.2917,
    category: 'SA',
    region: 'KANSAI',
    description: '名神高速 宿泊・レストイン＆24時間お風呂完備',
  },
  {
    name: '養老サービスエリア',
    lat: 35.2975,
    lng: 136.5658,
    category: 'SA',
    region: 'CHUBU',
    description: '名神高速 東海・関西を繋ぐ主要24h給油所併設SA',
  },
  {
    name: '道の駅 針テラス',
    lat: 34.6192,
    lng: 135.9619,
    category: 'MICHI_NO_EKI',
    region: 'KANSAI',
    description: '名阪国道 西日本最大級の道の駅・温泉＆24hコンビニ併設',
  },
  {
    name: '道の駅 藤川宿',
    lat: 34.9082,
    lng: 137.2185,
    category: 'MICHI_NO_EKI',
    region: 'CHUBU',
    description: '国道1号沿い 明るい24時間休憩・コンビニ併設スポット',
  },
];
