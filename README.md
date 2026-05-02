# RentMaster AI 🏠

A production-ready, offline-first rental property management system with MongoDB Atlas cloud backup.

## Features

- 🏠 **Room Management** — Add/remove rooms, track occupancy status
- 👤 **Tenant Management** — Full tenant profiles with Aadhar, mobile, move-in/out history
- 💰 **Bill Tracking** — Monthly rent, electric, water bills with paid/unpaid status
- 🔔 **Smart Reminders** — Auto-alerts when rent is due each month
- 📊 **Revenue Statistics** — Monthly/yearly charts and breakdowns
- 📤 **Export** — Export data to Excel (.xlsx) or CSV with filters
- ☁️ **Offline-First** — Works without internet; silently syncs to MongoDB Atlas when connected
- 🔄 **Auto Cloud Sync** — Background sync every 2 minutes when online

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite |
| Backend | Node.js + Express |
| Local DB | SQLite (better-sqlite3) |
| Cloud DB | MongoDB Atlas (Mongoose) |
| Charts | Recharts |
| Export | SheetJS (xlsx) |
| Icons | Lucide React |

## Getting Started

### 1. Clone the repo
```bash
git clone https://github.com/aryy005/rent-manager.git
cd rent-manager
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
```bash
cp .env.example .env
```
Edit `.env` and add your MongoDB Atlas connection string:
```
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/rentmaster
PORT=3001
```

> **Note:** The app works fully offline without MongoDB. The `.env` is optional — if `MONGO_URI` is missing, data is stored locally only.

### 4. Start the backend
```bash
node server/index.js
```

### 5. Start the frontend (new terminal)
```bash
npm run dev
```

Open **http://localhost:3005** in your browser.

## Project Structure

```
rent-manager/
├── server/
│   ├── index.js          # Express API server
│   ├── db.js             # SQLite setup (local database)
│   ├── syncService.js    # Background MongoDB Atlas sync
│   └── models/
│       ├── Room.js
│       ├── Tenant.js
│       └── Bill.js
├── src/
│   ├── components/
│   │   ├── RoomDetailModal.jsx
│   │   ├── StatusToggleModal.jsx
│   │   ├── PendingRentBanner.jsx
│   │   ├── StatsPanel.jsx
│   │   ├── AddRoomModal.jsx
│   │   └── ExportModal.jsx
│   ├── utils/
│   │   ├── api.js
│   │   ├── helpers.js
│   │   └── toast.js
│   ├── App.jsx
│   └── index.css
├── .env.example
└── package.json
```

## MongoDB Atlas Setup

1. Create a free cluster at [cloud.mongodb.com](https://cloud.mongodb.com)
2. Go to **Network Access** → Add IP `0.0.0.0/0` (allow from anywhere)
3. Create a database user and copy the connection string into `.env`

The app will automatically sync local SQLite data to Atlas whenever connected.

## License

MIT
