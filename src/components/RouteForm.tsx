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
  Download,
  FileCode,
  Tag,
  FileText,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { LocationPoint, TravelModeType, SavedRoute } from '@/types/route';
import { generateGPX, generateKML, downloadFile } from '@/lib/gpx-kml-exporter';
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
  title: string;
  setTitle: (title: string) => void;
  description: string;
  setDescription: (desc: string) => void;
  tagsString: string;
  setTagsString: (tags: string) => void;
  onCalculateRoute: () => void;
  onSaveRoute: () => void;
  currentRouteData: SavedRoute | null;
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
  title,
  setTitle,
  description,
  setDescription,
  tagsString,
  setTagsString,
  onCalculateRoute,
  onSaveRoute,
  currentRouteData,
  isSaving,
}) => {
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  // Waypoint Helpers
  const addWaypoint = () => {
    setWaypoints((prev) => [
      ...prev,
      { name: '', lat: 35.681236, lng: 139.767125 },
    ]);
  };

  const updateWaypointPoint = (index: number, point: LocationPoint) => {
    setWaypoints((prev) => {
      const copy = [...prev];
      copy[index] = point;
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

  const handleExportGPX = () => {
    if (!currentRouteData) {
      alert('先にルートを検索・作成してください。');
      return;
    }
    const xml = generateGPX(currentRouteData);
    const safeTitle = (title || 'route').replace(/[^a-zA-Z0-9_-]/g, '_');
    downloadFile(xml, `${safeTitle}.gpx`, 'application/gpx+xml');
  };

  const handleExportKML = () => {
    if (!currentRouteData) {
      alert('先にルートを検索・作成してください。');
      return;
    }
    const xml = generateKML(currentRouteData);
    const safeTitle = (title || 'route').replace(/[^a-zA-Z0-9_-]/g, '_');
    downloadFile(xml, `${safeTitle}.kml`, 'application/vnd.google-earth.kml+xml');
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl text-slate-100 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h2 className="text-lg font-bold flex items-center space-x-2 text-white">
          <Navigation className="h-5 w-5 text-blue-500" />
          <span>ルート作成・検索</span>
        </h2>
        <span className="text-xs text-slate-400 bg-slate-800 px-2.5 py-1 rounded-full border border-slate-700">
          経由地: {waypoints.length}箇所
        </span>
      </div>

      {/* Travel Mode Selector */}
      <div className="grid grid-cols-3 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
        <button
          type="button"
          onClick={() => setTravelMode('DRIVING')}
          className={`flex items-center justify-center space-x-2 py-2 rounded-lg text-sm font-medium transition-all ${
            travelMode === 'DRIVING'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Car className="h-4 w-4" />
          <span>ドライブ</span>
        </button>
        <button
          type="button"
          onClick={() => setTravelMode('BICYCLING')}
          className={`flex items-center justify-center space-x-2 py-2 rounded-lg text-sm font-medium transition-all ${
            travelMode === 'BICYCLING'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Bike className="h-4 w-4" />
          <span>自転車</span>
        </button>
        <button
          type="button"
          onClick={() => setTravelMode('WALKING')}
          className={`flex items-center justify-center space-x-2 py-2 rounded-lg text-sm font-medium transition-all ${
            travelMode === 'WALKING'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Footprints className="h-4 w-4" />
          <span>徒歩</span>
        </button>
      </div>

      {/* Origin, Waypoints, Destination Inputs with Places Autocomplete */}
      <div className="space-y-3">
        {/* Origin */}
        <PlaceAutocompleteInput
          value={origin.name}
          onChange={setOrigin}
          placeholder="出発地を検索・選択 (例: 東京駅)"
          badgeLabel="発"
          badgeColorClass="bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
        />

        {/* Waypoints List */}
        {waypoints.map((wp, idx) => (
          <div key={idx} className="flex items-center space-x-2 pl-4 border-l-2 border-slate-800">
            <PlaceAutocompleteInput
              value={wp.name}
              onChange={(pt) => updateWaypointPoint(idx, pt)}
              placeholder={`経由地 ${idx + 1} を検索・選択 (例: 芦ノ湖)`}
              badgeLabel={`経${idx + 1}`}
              badgeColorClass="bg-amber-500/20 text-amber-400 border-amber-500/40"
            />
            <div className="flex items-center space-x-1 shrink-0">
              <button
                type="button"
                onClick={() => moveWaypoint(idx, 'up')}
                disabled={idx === 0}
                className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => moveWaypoint(idx, 'down')}
                disabled={idx === waypoints.length - 1}
                className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400"
              >
                <ArrowDown className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => removeWaypoint(idx)}
                className="p-1.5 text-slate-400 hover:text-red-400 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}

        {/* Add Waypoint Button */}
        <button
          type="button"
          onClick={addWaypoint}
          className="w-full py-2 bg-slate-800/60 hover:bg-slate-800 border border-dashed border-slate-700 rounded-xl text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center justify-center space-x-1.5 transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>＋ 経由地を追加</span>
        </button>

        {/* Destination */}
        <PlaceAutocompleteInput
          value={destination.name}
          onChange={setDestination}
          placeholder="目的地を検索・選択 (例: 箱根湯本駅)"
          badgeLabel="着"
          badgeColorClass="bg-rose-500/20 text-rose-400 border-rose-500/40"
        />
      </div>

      {/* Search Route Button */}
      <button
        type="button"
        onClick={onCalculateRoute}
        className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-sm shadow-lg shadow-blue-600/30 flex items-center justify-center space-x-2 transition-all"
      >
        <Navigation className="h-4 w-4" />
        <span>ルートを計算・描画</span>
      </button>

      {/* Save Details & Gemini AI Section */}
      <div className="border-t border-slate-800 pt-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-300 flex items-center space-x-2">
            <FileText className="h-4 w-4 text-blue-400" />
            <span>ルート情報の保存</span>
          </h3>

          {/* Gemini AI Generate Button */}
          <button
            type="button"
            onClick={handleGenerateAI}
            disabled={isGeneratingAI}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-lg shadow-md shadow-purple-600/30 transition-all disabled:opacity-50"
          >
            {isGeneratingAI ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            )}
            <span>{isGeneratingAI ? 'AI生成中...' : '✨ Geminiでメモを自動生成'}</span>
          </button>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">ルートのタイトル</label>
          <input
            type="text"
            placeholder="例: 箱根温泉日帰りドライブ"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">メモ / 説明</label>
          <textarea
            placeholder="立ち寄りスポットや注意事項など"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center space-x-1">
            <Tag className="h-3 w-3 text-slate-400" />
            <span>タグ (カンマ区切り)</span>
          </label>
          <input
            type="text"
            placeholder="例: ドライブ, 温泉, 週末"
            value={tagsString}
            onChange={(e) => setTagsString(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col space-y-2 pt-2">
          <button
            type="button"
            onClick={onSaveRoute}
            disabled={isSaving}
            className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-semibold text-sm shadow-lg shadow-emerald-600/30 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            <span>{isSaving ? '保存中...' : 'クラウドにルートを保存'}</span>
          </button>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={handleExportGPX}
              className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-medium flex items-center justify-center space-x-1.5 transition-colors"
            >
              <Download className="h-3.5 w-3.5 text-emerald-400" />
              <span>GPXを出力</span>
            </button>
            <button
              type="button"
              onClick={handleExportKML}
              className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-medium flex items-center justify-center space-x-1.5 transition-colors"
            >
              <FileCode className="h-3.5 w-3.5 text-blue-400" />
              <span>KMLを出力</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
