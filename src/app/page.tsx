'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { RouteForm } from '@/components/RouteForm';
import { MapContainer } from '@/components/MapContainer';
import { SavedRoutesList } from '@/components/SavedRoutesList';
import { LocationPoint, TravelModeType, TollModeType, SavedRoute } from '@/types/route';
import { auth, db, googleProvider } from '@/lib/firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore';
import { fetchCurrentLocationPoint } from '@/lib/geolocation';

import { generateRouteDescriptionWithGemini, suggestNightSafeWaypointsWithGemini } from '@/lib/gemini';

export default function Home() {
  // Auth State
  const [user, setUser] = useState<User | null>(null);

  // Tab State
  const [activeTab, setActiveTab] = useState<'create' | 'list'>('create');

  // Form State initialized for Nagoya Station Destination
  const [origin, setOrigin] = useState<LocationPoint>({
    name: '大阪駅',
    lat: 34.702485,
    lng: 135.495951,
  });

  const [destination, setDestination] = useState<LocationPoint>({
    name: '名古屋駅',
    lat: 35.170915,
    lng: 136.881537,
  });

  const [waypoints, setWaypoints] = useState<LocationPoint[]>([]);

  const [travelMode, setTravelMode] = useState<TravelModeType>('DRIVING');
  const [tollMode, setTollMode] = useState<TollModeType>('HIGHWAY'); // Default HIGHWAY (高速優先)
  const [maxTollAmount, setMaxTollAmount] = useState<number>(300);
  const [isNightSafeMode, setIsNightSafeMode] = useState<boolean>(true); // Default true for safe night driving
  const [isAnalyzingNightRoute, setIsAnalyzingNightRoute] = useState<boolean>(false);
  const [calcTrigger, setCalcTrigger] = useState<number>(0);

  const [title, setTitle] = useState<string>('関西発 名古屋行きドライブ旅');
  const [description, setDescription] = useState<string>(
    '現在地を出発し、サービスエリアに立ち寄りながら名古屋駅を目指す快適ドライブコースです。'
  );
  const [tagsString, setTagsString] = useState<string>('ドライブ, 名古屋駅, 観光, 高速優先, 夜間安心');

  // Calculated Route Details
  const [calculatedData, setCalculatedData] = useState<{
    encodedPolyline: string;
    distanceMeters: number;
    durationSeconds: number;
  } | null>(null);

  // Saved Routes List
  const [savedRoutes, setSavedRoutes] = useState<SavedRoute[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Try fetching GPS Current Location on mount for Origin
  useEffect(() => {
    fetchCurrentLocationPoint()
      .then((loc) => {
        setOrigin(loc);
      })
      .catch((e) => {
        console.log('Using default Osaka Station origin', e);
      });
  }, []);

  // Listen to Auth State
  useEffect(() => {
    try {
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
      });
      return () => unsubscribe();
    } catch (e) {
      console.warn('Firebase Auth demo mode fallback', e);
    }
  }, []);

  // Fetch Saved Routes (Firestore or LocalStorage fallback)
  const fetchRoutes = async () => {
    if (user) {
      try {
        const q = query(collection(db, 'routes'), where('userId', '==', user.uid));
        const querySnapshot = await getDocs(q);
        const fetched: SavedRoute[] = [];
        querySnapshot.forEach((docSnap) => {
          fetched.push({ id: docSnap.id, ...docSnap.data() } as SavedRoute);
        });
        setSavedRoutes(fetched);
        return;
      } catch (e) {
        console.warn('Firestore fetch error, falling back to LocalStorage', e);
      }
    }

    // LocalStorage Fallback
    const local = localStorage.getItem('demo_saved_routes');
    if (local) {
      try {
        setSavedRoutes(JSON.parse(local));
      } catch (err) {
        console.error(err);
      }
    } else {
      // Default Initial Demo Item (Nagoya Station Destination)
      const demoRoutes: SavedRoute[] = [
        {
          id: 'demo-nagoya-dest-1',
          userId: 'demo-user',
          title: '関西発 名古屋行きドライブ旅',
          description: '現在地を出発し、御在所SAで休憩しながら名古屋駅へ向かう快適ドライブコース',
          tags: ['ドライブ', '名古屋駅', '観光', '高速優先', '夜間安心'],
          origin: { name: '大阪駅', lat: 34.702485, lng: 135.495951 },
          destination: { name: '名古屋駅', lat: 35.170915, lng: 136.881537 },
          waypoints: [{ name: '御在所サービスエリア', lat: 35.0112, lng: 136.5256 }],
          travelMode: 'DRIVING',
          tollMode: 'HIGHWAY',
          maxTollAmount: 300,
          isNightSafeMode: true,
          distanceMeters: 175000,
          durationSeconds: 8400,
          createdAt: new Date().toISOString(),
        },
      ];
      setSavedRoutes(demoRoutes);
      localStorage.setItem('demo_saved_routes', JSON.stringify(demoRoutes));
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, [user]);

  // Handle Login
  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      console.warn('Google Signin Popup error, using demo auth mode', e);
      setUser({
        uid: 'demo-user-123',
        displayName: 'デモユーザー (Demo User)',
        email: 'demo@example.com',
        photoURL: null,
      } as any);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn(e);
    }
    setUser(null);
  };

  // Calculate Route Trigger (Auto-invokes Gemini AI when isNightSafeMode is active)
  const handleCalculateRoute = async () => {
    if (!origin.name || !destination.name) {
      alert('出発地と目的地を入力してください。');
      return;
    }

    if (isNightSafeMode) {
      setIsAnalyzingNightRoute(true);
      try {
        const aiWaypoints = await suggestNightSafeWaypointsWithGemini(
          origin,
          destination,
          tollMode,
          maxTollAmount
        );
        if (aiWaypoints && aiWaypoints.length > 0) {
          const newPoints = aiWaypoints.map((aiW) => ({
            name: aiW.name,
            lat: aiW.lat,
            lng: aiW.lng,
          }));
          setWaypoints(newPoints);
        }
      } catch (e) {
        console.warn('AI Night Waypoints failed', e);
      } finally {
        setIsAnalyzingNightRoute(false);
      }
    }

    setCalcTrigger((prev) => prev + 1);
  };

  // Save Route
  const handleSaveRoute = async () => {
    if (!title) {
      alert('ルートのタイトルを入力してください。');
      return;
    }

    setIsSaving(true);
    const tagsArr = tagsString
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const newRoute: SavedRoute = {
      userId: user ? user.uid : 'demo-user',
      title,
      description,
      tags: tagsArr,
      origin,
      destination,
      waypoints,
      travelMode,
      tollMode,
      maxTollAmount,
      isNightSafeMode,
      encodedPolyline: calculatedData?.encodedPolyline || 'demo_polyline',
      distanceMeters: calculatedData?.distanceMeters || 175000,
      durationSeconds: calculatedData?.durationSeconds || 8400,
      createdAt: new Date().toISOString(),
    };

    if (user) {
      try {
        const docRef = await addDoc(collection(db, 'routes'), newRoute);
        newRoute.id = docRef.id;
      } catch (e) {
        console.warn('Firestore save error, saving to LocalStorage', e);
        newRoute.id = 'demo-' + Date.now();
      }
    } else {
      newRoute.id = 'demo-' + Date.now();
    }

    const updated = [newRoute, ...savedRoutes];
    setSavedRoutes(updated);
    localStorage.setItem('demo_saved_routes', JSON.stringify(updated));

    setIsSaving(false);
    alert('ルートを保存しました！');
  };

  // Delete Route
  const handleDeleteRoute = async (routeId: string) => {
    if (!confirm('この保存済みルートを削除してもよろしいですか？')) return;

    if (user && !routeId.startsWith('demo-')) {
      try {
        await deleteDoc(doc(db, 'routes', routeId));
      } catch (e) {
        console.warn('Firestore delete error', e);
      }
    }

    const updated = savedRoutes.filter((r) => r.id !== routeId);
    setSavedRoutes(updated);
    localStorage.setItem('demo_saved_routes', JSON.stringify(updated));
  };

  // Load Route into Form & Map
  const handleSelectRoute = (route: SavedRoute) => {
    setOrigin(route.origin);
    setDestination(route.destination);
    setWaypoints(route.waypoints || []);
    setTravelMode(route.travelMode || 'DRIVING');
    setTollMode(route.tollMode || 'HIGHWAY');
    setMaxTollAmount(route.maxTollAmount || 300);
    setIsNightSafeMode(route.isNightSafeMode ?? true);
    setTitle(route.title);
    setDescription(route.description || '');
    setTagsString((route.tags || []).join(', '));
    setActiveTab('create');
    setCalcTrigger((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col antialiased">
      {/* Header Navigation */}
      <Header
        user={user}
        onLogin={handleLogin}
        onLogout={handleLogout}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        savedRoutesCount={savedRoutes.length}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'create' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Input Form */}
            <div className="lg:col-span-5">
              <RouteForm
                origin={origin}
                setOrigin={setOrigin}
                destination={destination}
                setDestination={setDestination}
                waypoints={waypoints}
                setWaypoints={setWaypoints}
                travelMode={travelMode}
                setTravelMode={setTravelMode}
                tollMode={tollMode}
                setTollMode={setTollMode}
                maxTollAmount={maxTollAmount}
                setMaxTollAmount={setMaxTollAmount}
                isNightSafeMode={isNightSafeMode}
                setIsNightSafeMode={setIsNightSafeMode}
                isAnalyzingNightRoute={isAnalyzingNightRoute}
                title={title}
                setTitle={setTitle}
                description={description}
                setDescription={setDescription}
                tagsString={tagsString}
                setTagsString={setTagsString}
                onCalculateRoute={handleCalculateRoute}
                onSaveRoute={handleSaveRoute}
                isSaving={isSaving}
              />
            </div>

            {/* Right Column: Interactive Map */}
            <div className="lg:col-span-7">
              <MapContainer
                origin={origin}
                destination={destination}
                waypoints={waypoints}
                travelMode={travelMode}
                tollMode={tollMode}
                maxTollAmount={maxTollAmount}
                isNightSafeMode={isNightSafeMode}
                calcTrigger={calcTrigger}
                onRouteCalculated={setCalculatedData}
              />
            </div>
          </div>
        ) : (
          <SavedRoutesList
            routes={savedRoutes}
            onSelectRoute={handleSelectRoute}
            onDeleteRoute={handleDeleteRoute}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <p>Google Maps Route Saver • Built with Next.js, Firebase & Tailwind CSS</p>
      </footer>
    </div>
  );
}
