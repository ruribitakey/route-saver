'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, Loader2 } from 'lucide-react';
import { LocationPoint } from '@/types/route';
import { fetchCurrentLocationPoint } from '@/lib/geolocation';

interface PlaceAutocompleteInputProps {
  value: string;
  onChange: (point: LocationPoint) => void;
  placeholder?: string;
  className?: string;
  badgeLabel?: string;
  badgeColorClass?: string;
  showLocationButton?: boolean;
}

// Preset locations for Kansai / Osaka drive fallback
const DEMO_PRESETS: { [key: string]: { lat: number; lng: number } } = {
  大阪駅: { lat: 34.702485, lng: 135.495951 },
  洲本温泉: { lat: 34.3411, lng: 134.9015 },
  明石海峡大橋: { lat: 34.6163, lng: 135.0221 },
  神戸三宮駅: { lat: 34.6946, lng: 135.1952 },
  京都駅: { lat: 34.985849, lng: 135.758767 },
  難波駅: { lat: 34.6656, lng: 135.5014 },
  淡路島ハイウェイオアシス: { lat: 34.5878, lng: 135.0116 },
};

export const PlaceAutocompleteInput: React.FC<PlaceAutocompleteInputProps> = ({
  value,
  onChange,
  placeholder = '場所・住所・施設名を入力...',
  className = '',
  badgeLabel,
  badgeColorClass = 'bg-blue-500/20 text-blue-400 border-blue-500/40',
  showLocationButton = true,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const [inputText, setInputText] = useState(value || '');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  useEffect(() => {
    setInputText(value || '');
  }, [value]);

  // Setup Google Places Autocomplete when API is loaded
  useEffect(() => {
    if (!window.google?.maps?.places || !inputRef.current) return;

    try {
      autocompleteRef.current = new window.google.maps.places.Autocomplete(
        inputRef.current,
        {
          types: ['geocode', 'establishment'],
          componentRestrictions: { country: 'jp' },
        }
      );

      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current.getPlace();
        if (place && place.geometry && place.geometry.location) {
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          const name = place.name || place.formatted_address || inputText;
          setInputText(name);
          onChange({
            name,
            lat,
            lng,
            placeId: place.place_id,
          });
        }
      });
    } catch (e) {
      console.warn('Google Places Autocomplete initialization warning', e);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setInputText(text);

    const preset = DEMO_PRESETS[text];
    onChange({
      name: text,
      lat: preset ? preset.lat : 34.702485,
      lng: preset ? preset.lng : 135.495951,
    });

    if (!window.google?.maps?.places) {
      if (text.trim().length > 0) {
        const matches = Object.keys(DEMO_PRESETS).filter((k) =>
          k.toLowerCase().includes(text.toLowerCase())
        );
        setSuggestions(matches);
        setShowSuggestions(matches.length > 0);
      } else {
        setShowSuggestions(false);
      }
    }
  };

  const handleSelectSuggestion = (suggestion: string) => {
    const preset = DEMO_PRESETS[suggestion];
    setInputText(suggestion);
    setShowSuggestions(false);
    onChange({
      name: suggestion,
      lat: preset ? preset.lat : 34.702485,
      lng: preset ? preset.lng : 135.495951,
    });
  };

  // Fetch Current GPS Location
  const handleFetchCurrentLocation = async () => {
    setIsLoadingLocation(true);
    try {
      const point = await fetchCurrentLocationPoint();
      setInputText(point.name);
      onChange(point);
    } catch (error: any) {
      alert(error.message || '位置情報の取得に失敗しました。ブラウザの位置情報を許可してください。');
    } finally {
      setIsLoadingLocation(false);
    }
  };

  return (
    <div className={`relative flex items-center space-x-2 w-full ${className}`}>
      {badgeLabel && (
        <div
          className={`w-7 h-7 rounded-full border flex items-center justify-center font-bold text-xs shrink-0 ${badgeColorClass}`}
        >
          {badgeLabel}
        </div>
      )}

      <div className="relative flex-1 flex items-center">
        <input
          ref={inputRef}
          type="text"
          value={inputText}
          onChange={handleInputChange}
          onFocus={() => {
            if (!window.google?.maps?.places && inputText) {
              const matches = Object.keys(DEMO_PRESETS).filter((k) =>
                k.toLowerCase().includes(inputText.toLowerCase())
              );
              setSuggestions(matches);
              setShowSuggestions(matches.length > 0);
            }
          }}
          onBlur={() => {
            setTimeout(() => setShowSuggestions(false), 200);
          }}
          placeholder={placeholder}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-4 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
        />

        {/* Current Location Quick Button */}
        {showLocationButton && (
          <button
            type="button"
            onClick={handleFetchCurrentLocation}
            disabled={isLoadingLocation}
            title="GPSから現在地を取得"
            className="absolute right-2 text-slate-400 hover:text-blue-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            {isLoadingLocation ? (
              <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
            ) : (
              <Navigation className="h-4 w-4 text-blue-400" />
            )}
          </button>
        )}

        {/* Demo Autocomplete Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden">
            <div className="px-3 py-1.5 bg-slate-950 border-b border-slate-800 text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>関西ドライブ候補 (Presets)</span>
              <span className="text-blue-400">Places API</span>
            </div>
            {suggestions.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => handleSelectSuggestion(item)}
                className="w-full px-4 py-2.5 text-left text-sm text-slate-200 hover:bg-slate-800 hover:text-white flex items-center space-x-2 border-b border-slate-800/50 last:border-0 transition-colors"
              >
                <MapPin className="h-4 w-4 text-blue-400 shrink-0" />
                <span>{item}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
