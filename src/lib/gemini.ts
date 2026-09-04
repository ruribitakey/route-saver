import { LocationPoint, TravelModeType } from '@/types/route';

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
