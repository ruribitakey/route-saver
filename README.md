# 🗺️ Route Saver (ルートセイバー)

**Route Saver** は、Next.js (TypeScript, App Router) と Google Maps JS SDK、そして Google Gemini AI を組み合わせた AIドライブナビゲーション＆ルート保存 Web アプリケーションです。

所要時間にぴったり合わせたドライブBGMの選曲や、夜間でも安全に走れるバイパス自動経由、料金設定に応じた有料道路・一般道フィルタリングなど、ドライブや旅行を快適にするスマートな機能を提供します。

![Firebase Hosting Ready](https://img.shields.io/badge/Deployed-Firebase_Hosting-039BE5?style=flat-square&logo=firebase)
![Next.js 16](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=nextdotjs)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)
![Gemini AI](https://img.shields.io/badge/AI-Google_Gemini-8E75B2?style=flat-square&logo=googlegemini)

🌐 **本本番デプロイURL**: [https://route-saver-fc97a.web.app](https://route-saver-fc97a.web.app)

---

## ✨ 主な機能

### 1. 🧭 スマート・ルートナビ検索 & 移動手段切り替え
- **ドライブ (DRIVING)**・**自転車 (BICYCLING)**・**徒歩 (WALKING)** の3つの移動手段に対応。
- 地点入力時の Google Places Autocomplete 補完および GPS による現在地自動取得。
- インタラクティブな Google Maps JS SDK 連動（マーカー、ポリライン、ルート描画）。

### 2. 🚗 高速・一般道・スマート節約（バイパス指定）
- **高速優先**: 高速道路や有料道路を積極的に使用する最速ルート。
- **スマート節約**: 指定した上限金額（100円 / 300円 / 500円）以下の格安有料バイパスを優先。
- **完全一般道**: 高速・有料道路を一切使用しない快適下道ルート。

### 3. 🌙 Gemini AI 搭載機能
- **🌙 夜間安心モード**: Gemini AIが夜間でも明るく見通しの良い主要バイパスや大型交差点・ICを経由地として自動選定・ルート修正。
- **🎵 ドライブBGM プレイリスト生成 (`🧪 試験中`)**:
  - ドライブの予想所要時間（例: 1時間50分 ➔ 約28曲）にぴったりの曲数でプレイリストを自動構成。
  - **Spotify** および **YouTube Music** へのワンタップ直接検索リンクを出力。
- **✨ AIルートメモ＆タグ自動生成**: 出発地・目的地・経由地をもとに、旅の魅力や立ち寄りスポット情報をAIが自動文章化。

### 4. 🔄 1タップ復路（帰り道）作成
- 出発地と目的地をワンタップで反転し、経由地順序も自動逆順にして帰り道のルートを即座に作成。

### 5. ☁️ クラウド保存 & デモモード対応
- **Firebase Auth (Google ログイン)** および **Firestore** によるクラウド保存。
- 未ログイン時でも LocalStorage によるスムーズなデモ利用が可能。

---

## 🛠️ 技術スタック

| 分野 | テクノロジー |
|---|---|
| **フロントエンド** | Next.js 16 (App Router / Turbopack), React 19, TypeScript |
| **スタイリング** | Tailwind CSS v4, Lucide React (アイコン) |
| **マップ & 位置情報** | Google Maps JS SDK (`@vis.gl/react-google-maps`), Places API, Geolocation API |
| **人工知能 (AI)** | Google Gemini API (REST API / Gemini Flash 2.5) |
| **バックエンド・データベース** | Firebase Authentication, Cloud Firestore, Firebase Hosting |

---

## 🚀 開発環境の構築と起動方法

### 1. リポジトリの取得
```bash
git clone https://github.com/your-username/route-saver.git
cd route-saver
```

### 2. パッケージのインストール
```bash
npm install
```

### 3. 環境変数の設定 (`.env.local`)
プロジェクトルート直下に `.env.local` を作成し、必要なAPIキーを設定します。

```env
# Google Maps API Key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Google Gemini API Key
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 4. ローカルサーバーの起動
```bash
npm run dev
```
ブラウザで [http://localhost:3000](http://localhost:3000) を開くと動作を確認できます。

---

## 📦 ビルド & デプロイ

### 本番ビルドの確認
```bash
npm run build
```

### Firebase Hosting へのデプロイ
```bash
npx firebase deploy --only hosting,firestore
```

---

## 📄 ライセンス
MIT License
