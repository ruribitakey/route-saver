'use client';

import React, { useState } from 'react';
import { SavedRoute } from '@/types/route';
import {
  Bookmark,
  Search,
  Tag,
  Trash2,
  Download,
  FileCode,
  Car,
  Bike,
  Footprints,
  Calendar,
  Compass,
} from 'lucide-react';
import { generateGPX, generateKML, downloadFile, getSmartFilename } from '@/lib/gpx-kml-exporter';

interface SavedRoutesListProps {
  routes: SavedRoute[];
  onSelectRoute: (route: SavedRoute) => void;
  onDeleteRoute: (routeId: string) => void;
}

export const SavedRoutesList: React.FC<SavedRoutesListProps> = ({
  routes,
  onSelectRoute,
  onDeleteRoute,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Extract all unique tags
  const allTags = Array.from(
    new Set(routes.flatMap((r) => r.tags || []))
  ).filter(Boolean);

  // Filter routes by query and tag
  const filteredRoutes = routes.filter((route) => {
    const matchesQuery =
      !searchQuery ||
      route.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      route.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      route.origin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      route.destination.name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTag = !selectedTag || (route.tags && route.tags.includes(selectedTag));

    return matchesQuery && matchesTag;
  });

  const getTravelIcon = (mode: string) => {
    switch (mode) {
      case 'BICYCLING':
        return <Bike className="h-4 w-4 text-blue-400" />;
      case 'WALKING':
        return <Footprints className="h-4 w-4 text-emerald-400" />;
      default:
        return <Car className="h-4 w-4 text-amber-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Search & Tag Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Bookmark className="h-5 w-5 text-blue-500" />
            <h2 className="text-lg font-bold text-white">保存済みルート一覧</h2>
            <span className="bg-blue-600/20 text-blue-400 border border-blue-500/30 text-xs font-bold px-2.5 py-0.5 rounded-full">
              全 {routes.length} 件
            </span>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="ルート名、目的地、キーワードで検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        {/* Tag Filters */}
        {allTags.length > 0 && (
          <div className="flex items-center space-x-2 pt-2 border-t border-slate-800 overflow-x-auto pb-1">
            <span className="text-xs text-slate-400 flex items-center space-x-1 shrink-0">
              <Tag className="h-3.5 w-3.5" />
              <span>タグ検索:</span>
            </span>
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                selectedTag === null
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              すべて
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all shrink-0 ${
                  selectedTag === tag
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Routes Grid */}
      {filteredRoutes.length === 0 ? (
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-3">
          <Bookmark className="h-12 w-12 mx-auto text-slate-600" />
          <h3 className="text-base font-bold text-slate-300">ルートが見つかりません</h3>
          <p className="text-xs max-w-sm mx-auto">
            {searchQuery || selectedTag
              ? '条件に一致するルートがありません。検索キーワードを変更してください。'
              : 'まだ保存されたルートがありません。「ルート作成」タブから最初のルートを作成してみましょう！'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRoutes.map((route) => (
            <div
              key={route.id || route.title}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl hover:border-slate-700 transition-all flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3">
                {/* Header info */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 rounded-xl bg-slate-800 text-slate-300 border border-slate-700">
                      {getTravelIcon(route.travelMode)}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base group-hover:text-blue-400 transition-colors line-clamp-1">
                        {route.title || '無題のルート'}
                      </h3>
                      <p className="text-xs text-slate-400 flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {route.createdAt
                            ? new Date(route.createdAt).toLocaleDateString('ja-JP')
                            : '今日'}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {route.description && (
                  <p className="text-xs text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800/80 line-clamp-2">
                    {route.description}
                  </p>
                )}

                {/* Waypoints Flow */}
                <div className="space-y-1.5 text-xs bg-slate-950/60 p-3 rounded-xl border border-slate-800/50">
                  <div className="flex items-center space-x-2 text-slate-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                    <span className="truncate">{route.origin.name || '出発地'}</span>
                  </div>

                  {route.waypoints && route.waypoints.length > 0 && (
                    <div className="pl-1 text-amber-400/90 text-[11px] font-medium flex items-center space-x-1">
                      <span className="text-slate-600">└</span>
                      <span>経由 {route.waypoints.length} 箇所 ({route.waypoints.map(w=>w.name).join(' → ')})</span>
                    </div>
                  )}

                  <div className="flex items-center space-x-2 text-slate-300">
                    <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0" />
                    <span className="truncate">{route.destination.name || '目的地'}</span>
                  </div>
                </div>

                {/* Tags */}
                {route.tags && route.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {route.tags.map((tag) => (
                      <span
                        key={tag}
                        className="bg-slate-800 text-slate-300 text-[11px] px-2.5 py-0.5 rounded-md border border-slate-700"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => onSelectRoute(route)}
                  className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors"
                >
                  <Compass className="h-3.5 w-3.5" />
                  <span>マップに表示</span>
                </button>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => {
                      const xml = generateGPX(route);
                      const filename = getSmartFilename(route.title, 'gpx');
                      downloadFile(xml, filename, 'application/gpx+xml');
                    }}
                    title="GPXダウンロード"
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-xl border border-slate-700 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => {
                      const xml = generateKML(route);
                      const filename = getSmartFilename(route.title, 'kml');
                      downloadFile(
                        xml,
                        filename,
                        'application/vnd.google-earth.kml+xml'
                      );
                    }}
                    title="KMLダウンロード"
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded-xl border border-slate-700 transition-colors"
                  >
                    <FileCode className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => route.id && onDeleteRoute(route.id)}
                    title="削除"
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-red-400 rounded-xl border border-slate-700 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
