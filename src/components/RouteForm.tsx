'use client';

import React, { useState } from 'react';
import {
  Navigation,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Car,
  Bike,
  Footprints,
  Save,
  Tag,
  FileText,
  Sparkles,
  Loader2,
  Coins,
  Zap,
  ShieldCheck,
  Moon,
  Music,
  Headphones,
  ExternalLink,
  RotateCcw,
} from 'lucide-react';
import { LocationPoint, TravelModeType, TollModeType } from '@/types/route';
import { PlaceAutocompleteInput } from '@/components/PlaceAutocompleteInput';
import { generateRouteDescriptionWithGemini } from '@/lib/gemini';

interface RouteFormProps {
  origin: LocationPoint;
  setOrigin: (point: LocationPoint) => void;
  destination: LocationPoint;
  setDestination: (point: LocationPoint) => void;
  waypoints: LocationPoint[];
  setWaypoints: React.Dispatch<React.SetStateAction<LocationPoint[]>>;
  travelMode: TravelModeType;
  setTravelMode: (mode: TravelModeType) => void;
  tollMode: TollModeType;
  setTollMode: (mode: TollModeType) => void;
  maxTollAmount: number;
  setMaxTollAmount: (amount: number) => void;
  isNightSafeMode: boolean;
  setIsNightSafeMode: (val: boolean) => void;
  isAnalyzingNightRoute?: boolean;
  title: string;
  setTitle: (title: string) => void;
  description: string;
  setDescription: (desc: string) => void;
  tagsString: string;
  setTagsString: (tags: string) => void;
  playlistTitle?: string;
  setPlaylistTitle?: (val: string) => void;
  playlistDescription?: string;
  setPlaylistDescription?: (val: string) => void;
  playlistUrl?: string;
  setPlaylistUrl?: (val: string) => void;
  onGeneratePlaylist?: () => void;
  isGeneratingPlaylist?: boolean;
  onCreateSimpleReturnRoute?: () => void;
  onCreateScenicReturnRoute?: () => void;
  isGeneratingScenicReturn?: boolean;
  onCalculateRoute: () => void;
  onSaveRoute: () => void;
  isSaving: boolean;
}

export const RouteForm: React.FC<RouteFormProps> = ({
  origin,
  setOrigin,
  destination,
  setDestination,
  waypoints,
  setWaypoints,
  travelMode,
  setTravelMode,
  tollMode,
  setTollMode,
  maxTollAmount,
  setMaxTollAmount,
  isNightSafeMode,
  setIsNightSafeMode,
  isAnalyzingNightRoute = false,
  title,
  setTitle,
  description,
  setDescription,
  tagsString,
  setTagsString,
  playlistTitle = '',
  setPlaylistTitle,
  playlistDescription = '',
  setPlaylistDescription,
  playlistUrl = '',
  setPlaylistUrl,
  onGeneratePlaylist,
  isGeneratingPlaylist = false,
  onCreateSimpleReturnRoute,
  onCreateScenicReturnRoute,
  isGeneratingScenicReturn = false,
  onCalculateRoute,
  onSaveRoute,
  isSaving,
}) => {
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  // Waypoint Helpers
  const addWaypoint = () => {
    setWaypoints((prev) => [
      ...prev,
      { name: '', lat: 34.702485, lng: 135.495951, isAiGenerated: false },
    ]);
  };

  const updateWaypointPoint = (index: number, point: LocationPoint) => {
    setWaypoints((prev) => {
      const copy = [...prev];
      copy[index] = { ...point, isAiGenerated: false };
      return copy;
    });
  };

  const removeWaypoint = (index: number) => {
    setWaypoints((prev) => prev.filter((_, i) => i !== index));
  };

  const moveWaypoint = (index: number, direction: 'up' | 'down') => {
    setWaypoints((prev) => {
      const copy = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= copy.length) return prev;
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  };

  // Trigger Gemini AI Description Generation
  const handleGenerateAI = async () => {
    if (!origin.name || !destination.name) {
      alert('AI生成を行う前に、出発地と目的地を入力してください。');
      return;
    }

    setIsGeneratingAI(true);
    try {
      const res = await generateRouteDescriptionWithGemini(
        origin,
        destination,
        waypoints,
        travelMode
      );

      if (res.title) setTitle(res.title);
      if (res.description) setDescription(res.description);
      if (res.tags) setTagsString(res.tags);
    } catch (e) {
      console.error('Gemini AI generation failed:', e);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl text-slate-100 space-y-6">
      {/* Header Title */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <h2 className="text-base font-bold flex items-center space-x-2 text-white">
          <Navigation className="h-4 w-4 text-blue-500" />
          <span>ルート検索・作成</span>
        </h2>
        <span className="text-xs text-slate-400 bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800">
          経由地: {waypoints.length}箇所
        </span>
      </div>

      {/* Travel Mode Segmented Control */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-400">移動手段</label>
        <div className="grid grid-cols-3 gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setTravelMode('DRIVING')}
            className={`flex items-center justify-center space-x-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              travelMode === 'DRIVING'
                ? 'bg-blue-600 text-white shadow-sm font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Car className="h-3.5 w-3.5" />
            <span>ドライブ</span>
          </button>
          <button
            type="button"
            onClick={() => setTravelMode('BICYCLING')}
            className={`flex items-center justify-center space-x-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              travelMode === 'BICYCLING'
                ? 'bg-blue-600 text-white shadow-sm font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bike className="h-3.5 w-3.5" />
            <span>自転車</span>
          </button>
          <button
            type="button"
            onClick={() => setTravelMode('WALKING')}
            className={`flex items-center justify-center space-x-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              travelMode === 'WALKING'
                ? 'bg-blue-600 text-white shadow-sm font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Footprints className="h-3.5 w-3.5" />
            <span>徒歩</span>
          </button>
        </div>
      </div>

      {/* Toll Road & Night Mode Section */}
      {travelMode === 'DRIVING' && (
        <div className="space-y-4 pt-2 border-t border-slate-800/80">
          {/* Toll Mode Segment */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center space-x-1 font-semibold text-slate-300">
                <Coins className="h-3.5 w-3.5 text-blue-400" />
                <span>有料道路の優先度</span>
              </span>
              <span className="text-[11px] text-slate-400">
                {tollMode === 'SMART_SAVINGS'
                  ? `格安バイパス優先 (${maxTollAmount}円以下)`
                  : tollMode === 'HIGHWAY'
                  ? '高速道路優先'
                  : '完全一般道'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setTollMode('HIGHWAY')}
                className={`py-1.5 px-2 rounded-lg text-xs font-medium flex items-center justify-center space-x-1 transition-all ${
                  tollMode === 'HIGHWAY'
                    ? 'bg-slate-800 text-white font-bold border border-slate-700 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Zap className="h-3.5 w-3.5 text-amber-400" />
                <span>高速優先</span>
              </button>

              <button
                type="button"
                onClick={() => setTollMode('SMART_SAVINGS')}
                className={`py-1.5 px-2 rounded-lg text-xs font-medium flex items-center justify-center space-x-1 transition-all ${
                  tollMode === 'SMART_SAVINGS'
                    ? 'bg-slate-800 text-emerald-400 font-bold border border-slate-700 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Coins className="h-3.5 w-3.5 text-emerald-400" />
                <span>スマート節約</span>
              </button>

              <button
                type="button"
                onClick={() => setTollMode('FREE_ROADS')}
                className={`py-1.5 px-2 rounded-lg text-xs font-medium flex items-center justify-center space-x-1 transition-all ${
                  tollMode === 'FREE_ROADS'
                    ? 'bg-slate-800 text-blue-400 font-bold border border-slate-700 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
                <span>完全一般道</span>
              </button>
            </div>

            {/* Smart Savings Presets */}
            {tollMode === 'SMART_SAVINGS' && (
              <div className="pt-2 flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-400 shrink-0">上限料金:</span>
                <div className="grid grid-cols-3 gap-1.5 flex-1">
                  {[
                    { amt: 100, label: '100円' },
                    { amt: 300, label: '300円' },
                    { amt: 500, label: '500円' },
                  ].map((preset) => (
                    <button
                      key={preset.amt}
                      type="button"
                      onClick={() => setMaxTollAmount(preset.amt)}
                      className={`py-1 px-2 rounded-lg text-xs font-medium transition-all ${
                        maxTollAmount === preset.amt
                          ? 'bg-blue-600 text-white font-bold shadow-sm'
                          : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Night Safe Mode Toggle */}
          <div className="flex items-center justify-between py-2 px-3 bg-slate-950 rounded-xl border border-slate-800">
            <label className="flex items-center space-x-2.5 cursor-pointer">
              <Moon className={`h-4 w-4 ${isNightSafeMode ? 'text-blue-400' : 'text-slate-500'}`} />
              <div>
                <span className="text-xs font-semibold text-slate-200">🌙 夜間安心モード</span>
                <p className="text-[10px] text-slate-400">Gemini AIが主要バイパス・ICを経由地に挿入</p>
              </div>
            </label>
            <button
              type="button"
              onClick={() => setIsNightSafeMode(!isNightSafeMode)}
              className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors ${
                isNightSafeMode ? 'bg-blue-600 justify-end' : 'bg-slate-800 justify-start'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
            </button>
          </div>
        </div>
      )}

      {/* Origin, Waypoints, Destination Inputs */}
      <div className="space-y-3 pt-2 border-t border-slate-800/80">
        <PlaceAutocompleteInput
          value={origin.name}
          onChange={setOrigin}
          placeholder="出発地を検索・選択 (例: 大阪駅)"
          badgeLabel="発"
          badgeColorClass="bg-slate-800 text-emerald-400 border-slate-700"
        />

        {waypoints.map((wp, idx) => (
          <div key={idx} className="flex items-center space-x-2 pl-3 border-l-2 border-slate-800">
            <PlaceAutocompleteInput
              value={wp.name}
              onChange={(pt) => updateWaypointPoint(idx, pt)}
              placeholder={`経由地 ${idx + 1} を検索・選択`}
              badgeLabel={wp.isAiGenerated ? '✨AI' : `経${idx + 1}`}
              badgeColorClass={
                wp.isAiGenerated
                  ? 'bg-blue-950 text-blue-300 border-blue-800 font-semibold'
                  : 'bg-slate-800 text-amber-400 border-slate-700'
              }
            />
            <div className="flex items-center space-x-1 shrink-0">
              <button
                type="button"
                onClick={() => moveWaypoint(idx, 'up')}
                disabled={idx === 0}
                className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
              >
                <ArrowUp className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => moveWaypoint(idx, 'down')}
                disabled={idx === waypoints.length - 1}
                className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
              >
                <ArrowDown className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => removeWaypoint(idx)}
                className="p-1 text-slate-400 hover:text-red-400 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addWaypoint}
          className="w-full py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center justify-center space-x-1.5 transition-all"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>＋ 経由地を追加</span>
        </button>

        <PlaceAutocompleteInput
          value={destination.name}
          onChange={setDestination}
          placeholder="目的地を検索・選択 (例: 名古屋駅)"
          badgeLabel="着"
          badgeColorClass="bg-slate-800 text-rose-400 border-slate-700"
        />

        {/* Return Route & Scenic Round Trip Actions */}
        {(onCreateSimpleReturnRoute || onCreateScenicReturnRoute) && (
          <div className="pt-2.5 border-t border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-slate-300 flex items-center space-x-1">
                <RotateCcw className="h-3.5 w-3.5 text-blue-400" />
                <span>復路（帰り道）・周遊ルート作成</span>
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {onCreateSimpleReturnRoute && (
                <button
                  type="button"
                  onClick={onCreateSimpleReturnRoute}
                  className="py-2 px-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-slate-200 flex items-center justify-center space-x-1.5 transition-all"
                >
                  <RotateCcw className="h-3.5 w-3.5 text-blue-400" />
                  <span>反転・単純復路</span>
                </button>
              )}

              {onCreateScenicReturnRoute && (
                <button
                  type="button"
                  onClick={onCreateScenicReturnRoute}
                  disabled={isGeneratingScenicReturn}
                  className="py-2 px-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center justify-center space-x-1.5 transition-all disabled:opacity-50"
                >
                  {isGeneratingScenicReturn ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-400" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                  )}
                  <span>{isGeneratingScenicReturn ? '周遊解析中...' : '✨ 周遊・別ルート復路'}</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Calculate Route Primary Action Button */}
      <button
        type="button"
        onClick={onCalculateRoute}
        disabled={isAnalyzingNightRoute}
        className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs shadow-sm flex items-center justify-center space-x-2 transition-all disabled:opacity-60"
      >
        {isAnalyzingNightRoute ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin text-amber-300" />
            <span>✨ Gemini AIが安全交差点を解析中...</span>
          </>
        ) : (
          <>
            <Navigation className="h-4 w-4" />
            <span>ルートを計算・描画</span>
          </>
        )}
      </button>

      {/* Drive Playlist Section */}
      <div className="border-t border-slate-800/80 pt-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
            <Music className="h-4 w-4 text-blue-400" />
            <span>🎵 ドライブBGM プレイリスト</span>
          </h3>
          {onGeneratePlaylist && (
            <button
              type="button"
              onClick={onGeneratePlaylist}
              disabled={isGeneratingPlaylist}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium flex items-center space-x-1 transition-all disabled:opacity-50"
            >
              {isGeneratingPlaylist ? (
                <Loader2 className="h-3 w-3 animate-spin text-blue-400" />
              ) : (
                <Sparkles className="h-3 w-3 text-amber-300" />
              )}
              <span>{isGeneratingPlaylist ? '選曲中...' : 'AIでBGM選曲'}</span>
            </button>
          )}
        </div>

        {playlistTitle && (
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
            <p className="text-xs font-bold text-slate-200 flex items-center space-x-1.5">
              <Headphones className="h-3.5 w-3.5 text-blue-400" />
              <span>{playlistTitle}</span>
            </p>
            {playlistDescription && (
              <p className="text-[11px] text-slate-400 leading-relaxed">{playlistDescription}</p>
            )}

            <div className="flex items-center space-x-2 pt-1">
              <a
                href={`https://open.spotify.com/search/${encodeURIComponent(playlistTitle)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-1.5 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-emerald-400 rounded-lg text-[11px] font-semibold flex items-center justify-center space-x-1 transition-all"
              >
                <span>Spotify</span>
                <ExternalLink className="h-3 w-3" />
              </a>
              <a
                href={`https://music.youtube.com/search?q=${encodeURIComponent(playlistTitle)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-1.5 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-rose-400 rounded-lg text-[11px] font-semibold flex items-center justify-center space-x-1 transition-all"
              >
                <span>YouTube Music</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Save Route Form Section */}
      <div className="border-t border-slate-800/80 pt-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
            <FileText className="h-4 w-4 text-blue-400" />
            <span>ルート情報の保存メモ</span>
          </h3>

          <button
            type="button"
            onClick={handleGenerateAI}
            disabled={isGeneratingAI}
            className="flex items-center space-x-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg border border-slate-700 transition-all disabled:opacity-50"
          >
            {isGeneratingAI ? (
              <Loader2 className="h-3 w-3 animate-spin text-blue-400" />
            ) : (
              <Sparkles className="h-3 w-3 text-amber-300" />
            )}
            <span>{isGeneratingAI ? '生成中...' : '✨ AIメモ生成'}</span>
          </button>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-slate-400 mb-1">ルートタイトル</label>
          <input
            type="text"
            placeholder="例: 大阪〜名古屋 快適ドライブ"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <div>
          <label className="block text-[11px] font-medium text-slate-400 mb-1">説明 / メモ</label>
          <textarea
            placeholder="立ち寄りスポットや注意事項"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <div>
          <label className="block text-[11px] font-medium text-slate-400 mb-1 flex items-center space-x-1">
            <Tag className="h-3 w-3 text-slate-400" />
            <span>タグ (カンマ区切り)</span>
          </label>
          <input
            type="text"
            placeholder="例: ドライブ, 観光, 高速優先"
            value={tagsString}
            onChange={(e) => setTagsString(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <button
          type="button"
          onClick={onSaveRoute}
          disabled={isSaving}
          className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs shadow-sm flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          <span>{isSaving ? '保存中...' : 'クラウドにルートを保存'}</span>
        </button>
      </div>
    </div>
  );
};
