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

export default function Home() {
  // Auth State
  const [user, setUser] = useState<User | null>(null);

  // Tab State
  const [activeTab, setActiveTab] = useState<'create' | 'list'>('create');

  // Form State initialized for Kansai / Sumoto Onsen Drive
  const [origin, setOrigin] = useState<LocationPoint>({
    name: '大阪駅',
    lat: 34.702485,
    lng: 135.495951,
  });

  const [destination, setDestination] = useState<LocationPoint>({
    name: '洲本温泉',
    lat: 34.3411,
    lng: 134.9015,
  });

  const [waypoints, setWaypoints] = useState<LocationPoint[]>([
    {
      name: '明石海峡大橋',
      lat: 34.6163,
      lng: 135.0221,
    },
  ]);

  const [travelMode, setTravelMode] = useState<TravelModeType>('DRIVING');
  const [tollMode, setTollMode] = useState<TollModeType>('SMART_SAVINGS');
  const [maxTollAmount, setMaxTollAmount] = useState<number>(300);
  const [calcTrigger, setCalcTrigger] = useState<number>(0);

  const [title, setTitle] = useState<string>('大阪発 明石海峡大橋ドライブ＆洲本温泉旅');
  const [description, setDescription] = useState<string>(
    '大阪を出発し、明石海峡大橋を渡って風光明媚な淡路島・洲本温泉へ向かう快適ドライブコースです。'
  );
  const [tagsString, setTagsString] = useState<string>('ドライブ, 温泉, 淡路島, 明石海峡大橋, スマート節約');

  // Calculated Route Details
  const [calculatedData, setCalculatedData] = useState<{
    encodedPolyline: string;
    distanceMeters: number;
    durationSeconds: number;
  } | null>(null);

  // Saved Routes List
  const [savedRoutes, setSavedRoutes] = useState<SavedRoute[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Auto-fetch GPS Current Location on mount
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
      // Default Initial Demo Item (Sumoto Onsen)
      const demoRoutes: SavedRoute[] = [
        {
          id: 'demo-kansai-1',
          userId: 'demo-user',
          title: '大阪発 明石海峡大橋ドライブ＆洲本温泉旅',
          description: '明石海峡大橋を渡り、淡路島・洲本温泉でゆったり海を眺める温泉旅コース',
          tags: ['ドライブ', '温泉', '淡路島', '明石海峡大橋', 'スマート節約'],
          origin: { name: '大阪駅', lat: 34.702485, lng: 135.495951 },
          destination: { name: '洲本温泉', lat: 34.3411, lng: 134.9015 },
          waypoints: [{ name: '明石海峡大橋', lat: 34.6163, lng: 135.0221 }],
          travelMode: 'DRIVING',
          tollMode: 'SMART_SAVINGS',
          maxTollAmount: 300,
          distanceMeters: 105000,
          durationSeconds: 7800,
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

  // Calculate Route Trigger
  const handleCalculateRoute = () => {
    if (!origin.name || !destination.name) {
      alert('出発地と目的地を入力してください。');
      return;
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
      encodedPolyline: calculatedData?.encodedPolyline || 'demo_polyline',
      distanceMeters: calculatedData?.distanceMeters || 105000,
      durationSeconds: calculatedData?.durationSeconds || 7800,
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
    setTollMode(route.tollMode || 'SMART_SAVINGS');
    setMaxTollAmount(route.maxTollAmount || 300);
    setTitle(route.title);
    setDescription(route.description || '');
    setTagsString((route.tags || []).join(', '));
    setActiveTab('create');
    setCalcTrigger((prev) => prev + 1);
  };

  // Build current route data object for exporter
  const currentRouteData: SavedRoute = {
    userId: user ? user.uid : 'demo-user',
    title,
    description,
    tags: tagsString.split(',').map((t) => t.trim()).filter(Boolean),
    origin,
    destination,
    waypoints,
    travelMode,
    tollMode,
    maxTollAmount,
    encodedPolyline: calculatedData?.encodedPolyline || 'demo_polyline',
    distanceMeters: calculatedData?.distanceMeters || 105000,
    durationSeconds: calculatedData?.durationSeconds || 7800,
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
                title={title}
                setTitle={setTitle}
                description={description}
                setDescription={setDescription}
                tagsString={tagsString}
                setTagsString={setTagsString}
                onCalculateRoute={handleCalculateRoute}
                onSaveRoute={handleSaveRoute}
                currentRouteData={currentRouteData}
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
