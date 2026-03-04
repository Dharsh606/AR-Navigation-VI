# AR-NAV-VI Backend

## 1. Install and run

```bash
cd backend
npm install
npm start
```

Server runs at **http://localhost:3000**.

## 2. Connect the mobile app

The app uses `EXPO_PUBLIC_API_URL` to reach the backend.

### Option A: Environment variable (recommended)

Create a file **`mobile-app/.env`** (in the mobile-app folder) with:

```env
# Use your computer's IP when testing on a real phone (not localhost)
EXPO_PUBLIC_API_URL=http://localhost:3000
```

- **Android emulator:** use `http://10.0.2.2:3000`
- **iOS simulator:** `http://localhost:3000` works
- **Physical device (phone/tablet):** use your PC’s IP, e.g. `http://192.168.1.5:3000`

To get your IP:
- Windows: `ipconfig` → look for IPv4 (e.g. 192.168.1.5)
- Mac/Linux: `ifconfig` or `ip addr`

Then in `.env`:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.5:3000
```

Restart Expo after changing `.env` (`npx expo start`).

### Option B: No .env (Expo 49+)

You can set the variable when starting Expo:

```bash
cd mobile-app
EXPO_PUBLIC_API_URL=http://192.168.1.5:3000 npx expo start
```

## 3. Check connection

1. Start backend: `cd backend && npm start`
2. Start app: `cd mobile-app && npx expo start`
3. In the app, trigger **Emergency** (button or voice). Backend terminal should log `EMERGENCY: { ... }`.
4. Open **http://localhost:3000/api/analytics/summary** in a browser to see session/emergency counts.

## API endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | /api/sessions | Log navigation session |
| POST | /api/heatmap | Log obstacle point |
| POST | /api/emergency | Emergency alert (GPS, time) |
| GET | /api/routes/frequent | Frequent routes |
| GET | /api/risk-zones | Risk zones |
| GET | /api/analytics/summary | Counts (sessions, heatmap, emergencies) |
