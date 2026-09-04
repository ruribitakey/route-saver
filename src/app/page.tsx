'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { RouteForm } from '@/components/RouteForm';
import { MapContainer } from '@/components/MapContainer';
import { SavedRoutesList } from '@/components/SavedRoutesList';
import { LocationPoint, TravelModeType, SavedRoute } from '@/types/route';
import { auth, db, googleProvider } from '@/lib/firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore';

export default function Home() {
  // Auth State
  const [user, setUser] = useState<User | null>(null);

  // Tab State
  const [activeTab, setActiveTab] = useState<'create' | 'list'>('create');

  // Form State
  const [origin, setOrigin] = useState<LocationPoint>({
    name: '東京駅',
    lat: 35.681236,
    lng: 139.767125,
  });

  const [destination, setDestination] = useState<LocationPoint>({
    name: '箱根湯本駅',
    lat: 35.233261,
    lng: 139.103758,
  });

  const [waypoints, setWaypoints] = useState<LocationPoint[]>([
    {
      name: '芦ノ湖',
      lat: 35.2012,
      lng: 139.0123,
    },
  ]);

  const [travelMode, setTravelMode] = useState<TravelModeType>('DRIVING');
  const [title, setTitle] = useState<string>('箱根日帰りドライブ温泉コース');
  const [description, setDescription] = useState<string>(
    '途中で芦ノ湖に立ち寄って美味しいランチと景色を楽しむお気に入りドライブコースです。'
  );
  const [tagsString, setTagsString] = useState<string>('ドライブ, 温泉, 休日');

  // Calculated Route Details
  const [calculatedData, setCalculatedData] = useState<{
    encodedPolyline: string;
    distanceMeters: number;
    durationSeconds: number;
  } | null>(null);

  // Saved Routes List
  const [savedRoutes, setSavedRoutes] = useState<SavedRoute[]>([]);
  const [isSaving, setIsSaving] = useState(false);

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
      // Default Initial Demo Item
      const demoRoutes: SavedRoute[] = [
        {
          id: 'demo-1',
          userId: 'demo-user',
          title: '箱根日帰り温泉ドライブ',
          description: '芦ノ湖でのランチと温泉を楽しむおすすめドライブコース',
          tags: ['ドライブ', '温泉', '休日'],
          origin: { name: '東京駅', lat: 35.681236, lng: 139.767125 },
          destination: { name: '箱根湯本駅', lat: 35.233261, lng: 139.103758 },
          waypoints: [{ name: '芦ノ湖', lat: 35.2012, lng: 139.0123 }],
          travelMode: 'DRIVING',
          distanceMeters: 98500,
          durationSeconds: 6300,
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

  // Calculate Route
  const handleCalculateRoute = () => {
    if (!origin.name || !destination.name) {
      alert('出発地と目的地を入力してください。');
      return;
    }
    alert(`ルートを再計算しました: ${origin.name} → ${destination.name}`);
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
      encodedPolyline: calculatedData?.encodedPolyline || 'demo_polyline',
      distanceMeters: calculatedData?.distanceMeters || 98500,
      durationSeconds: calculatedData?.durationSeconds || 6300,
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
    setTitle(route.title);
    setDescription(route.description || '');
    setTagsString((route.tags || []).join(', '));
    setActiveTab('create');
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
    encodedPolyline: calculatedData?.encodedPolyline || 'demo_polyline',
    distanceMeters: calculatedData?.distanceMeters || 98500,
    durationSeconds: calculatedData?.durationSeconds || 6300,
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
