import { LocationPoint, TravelModeType, TollModeType } from '@/types/route';

export interface GeminiRouteSuggestion {
  title: string;
  description: string;
  tags: string;
}

/**
 * Call Gemini API to generate intelligent travel title, description, and tags
 */
export async function generateRouteDescriptionWithGemini(
  origin: LocationPoint,
  destination: LocationPoint,
  waypoints: LocationPoint[],
  travelMode: TravelModeType
): Promise<GeminiRouteSuggestion> {
  const apiKey =
    process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const waypointsStr =
    waypoints.filter((w) => w.name).map((w) => w.name).join(' → ') || 'なし';

  const modeText =
    travelMode === 'DRIVING' ? 'ドライブ' : travelMode === 'BICYCLING' ? 'サイクリング' : '徒歩散策';

  // Fallback demo response if no API key or in demo mode
  if (!apiKey || apiKey.includes('demo')) {
    await new Promise((res) => setTimeout(res, 1200)); // Simulate AI thinking time
    return {
      title: `${origin.name || '出発地'}から${destination.name || '目的地'}へ行くおすすめ${modeText}コース`,
      description: `${origin.name || '出発地'}を出発し、${
        waypointsStr !== 'なし' ? `途中で${waypointsStr}に立ち寄りながら` : ''
      }${destination.name || '目的地'}を目指す${modeText}ルートです。四季折々の景色や立ち寄りスポットをのんびり楽しめます！`,
      tags: `${modeText}, 日帰り, 絶景スポット, 観光`,
    };
  }

  const prompt = `あなたは旅行やドライブプランのスペシャリストです。以下のルート情報を元に、旅の魅力を伝えるタイトル、立ち寄りアドバイスや見どころを含む説明文、およびカンマ区切りのタグ3〜5個をJSON形式で生成してください。

【ルート情報】
・出発地: ${origin.name || '未設定'}
・経由地: ${waypointsStr}
・目的地: ${destination.name || '未設定'}
・移動手段: ${modeText}

【出力形式】
JSONオブジェクトのみを出力してください。キーは "title", "description", "tags" です。
例:
{
  "title": "絶景の富士山と温泉を満喫！箱根日帰りドライブ",
  "description": "東京を出発し、途中で芦ノ湖の美しい湖畔景色を鑑賞。箱根湯本でゆったり温泉とグルメを楽しむおすすめコースです。",
  "tags": "ドライブ, 温泉, 富士山, 日帰り"
}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API Error: ${response.statusText}`);
    }

    const data = await response.json();
    const textResponse =
      data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    const parsed: GeminiRouteSuggestion = JSON.parse(textResponse);
    return {
      title: parsed.title || '',
      description: parsed.description || '',
      tags: parsed.tags || '',
    };
  } catch (error) {
    console.warn('Gemini API call failed, using fallback suggestion', error);
    return {
      title: `${origin.name || '出発地'}〜${destination.name || '目的地'} ${modeText}ルート`,
      description: `${origin.name}を出発して${waypointsStr !== 'なし' ? `経由地(${waypointsStr})を経て` : ''}${destination.name}へ至る快適な${modeText}コースです。`,
      tags: `${modeText}, 旅行, ルート`,
    };
  }
}

export interface GeminiNightSafeWaypoint {
  name: string;
  lat: number;
  lng: number;
  reason: string;
}

function getSmartFallbackNightWaypoints(
  origin: LocationPoint,
  destination: LocationPoint
): GeminiNightSafeWaypoint[] {
  const text = ((origin.name || '') + ' ' + (destination.name || '')).toLowerCase();

  if (text.includes('香里園') || text.includes('寝屋川') || text.includes('枚方') || text.includes('奈良')) {
    return [
      {
        name: '第二阪奈道路 壱分IC',
        lat: 34.6853,
        lng: 135.7001,
        reason: '生駒トンネル経由・街灯が多く夜間も安全な主要バイパス',
      },
    ];
  }

  if (text.includes('名古屋') || text.includes('三重') || text.includes('四日市')) {
    return [
      {
        name: '御在所サービスエリア',
        lat: 35.0112,
        lng: 136.5256,
        reason: '新名神/東名阪 24h明るい大型SA・街灯あり',
      },
    ];
  }

  return [];
}

/**
 * Call Gemini API to recommend 1-2 major arterial waypoints (IC, major intersection, 24h SA)
 * to avoid dark narrow mountain/shortcut roads during night driving.
 */
export async function suggestNightSafeWaypointsWithGemini(
  origin: LocationPoint,
  destination: LocationPoint,
  tollMode: TollModeType = 'HIGHWAY',
  maxTollAmount: number = 300
): Promise<GeminiNightSafeWaypoint[]> {
  const apiKey =
    process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey || apiKey.includes('demo')) {
    await new Promise((res) => setTimeout(res, 600));
    return getSmartFallbackNightWaypoints(origin, destination);
  }

  let modeInstruction = '';
  if (tollMode === 'FREE_ROADS') {
    modeInstruction = '高速道路を使わない完全一般道ルートにおいて、街灯が少なく暗い山道・酷道・険道・狭い裏道へのショートカットを完全に遮断し、片側多車線や車線幅が広く街灯・店舗の明かりが多い【主要な国道交差点・大通りバイパスIC】';
  } else if (tollMode === 'SMART_SAVINGS') {
    modeInstruction = `スマート節約モード（許容区間料金上限: ${maxTollAmount}円以下）において、料金が${maxTollAmount}円以下に収まる格安バイパス（名阪国道・堺泉北有料道路・ハーバーハイウェイ等）や24時間道の駅・主要国道交差点の中から、暗い山道を回避し安く安全に走れる中継ポイント`;
  } else {
    modeInstruction = '高速道路・有料道路を優先するルートにおいて、深夜でも明るく休憩・給油が可能な【24時間営業の大型SA/PAまたは主要ジャンクション/IC】';
  }

  const prompt = `あなたは日本の道路交通およびカーナビゲーションの専門家です。
出発地「${origin.name}」から目的地「${destination.name}」へ向かう夜間ドライブにおいて、暗い細道・危険な山道（酷道・険道）や狭い抜け道への迂回を完全に遮断するため、${modeInstruction}の中から、最も効果的な中継ポイント（経由地）を1〜2箇所選定してください。

【出力形式】
JSONオブジェクトのみを出力してください。キーは "waypoints" です。
例:
{
  "waypoints": [
    {
      "name": "名阪国道 針IC",
      "lat": 34.6192,
      "lng": 135.9619,
      "reason": "名阪国道の主要インターチェンジ。街灯が多く片側2車線で安心。"
    }
  ]
}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    if (!response.ok) throw new Error(`Gemini API Error: ${response.statusText}`);

    const data = await response.json();
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const parsed = JSON.parse(textResponse);
    return parsed.waypoints || [];
  } catch (error) {
    console.warn('Gemini night waypoints suggestion failed, using smart fallback', error);
    return getSmartFallbackNightWaypoints(origin, destination);
  }
}
