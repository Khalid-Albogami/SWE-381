# ⚽ Golato — Soccer Stadium Reservation

A web app that connects **stadium owners** with **match organizers**. Owners list pitches with photos, define availability for the next 7 days, view a live reservation grid, and chat with users. Users browse stadiums by city or time, see the 7-day schedule at a glance, and reserve in two clicks.

Built for SWE-381.

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | React (Vite) + Tailwind v4 + React Router v6 + Axios |
| Charts | Chart.js (`react-chartjs-2`) |
| Backend | Node.js + Express |
| Database | MongoDB (Atlas) + Mongoose |
| Auth | JWT in `localStorage` + bcrypt password hashing |
| Uploads | Multer → `server/uploads/stadiums/` served as static files |
| Messaging | REST endpoints + 5 s client-side polling |

## Project layout

```
Golato/
├── client/                  # Vite React app
│   ├── src/
│   │   ├── api/             # axios instance + endpoint wrappers
│   │   ├── components/      # Navbar, Carousel, SlotGrid, ChatBox, feedback (toasts/confirm), ...
│   │   ├── context/         # AuthContext
│   │   ├── hooks/           # useMessagePoll
│   │   └── pages/
│   │       ├── auth/        # Login, Register
│   │       ├── owner/       # OwnerDashboard, AddStadium, ManageStadium, Statistics, OwnerMessages
│   │       ├── user/        # StadiumDetails, MyReservations, UserMessages
│   │       └── shared/      # Inbox (used by both roles)
│   └── .env                 # VITE_API_URL
└── server/
    ├── config/db.js
    ├── middleware/          # auth (JWT + role gate), upload (multer)
    ├── models/              # User, Stadium, Slot, Message
    ├── routes/              # auth, stadium, slot, reservation, message, stats
    ├── controllers/
    ├── uploads/stadiums/    # photo storage (gitignored)
    └── .env                 # MONGO_URI, JWT_SECRET, PORT
```

## Getting started

### 1. Prerequisites
- Node 18+ and npm
- A MongoDB connection string (Atlas free tier works; local Docker mongo also supported)

### 2. Backend
```bash
cd server
cp .env.example .env       # if you don't already have one
# edit .env: set MONGO_URI and JWT_SECRET
npm install
npm run dev                # nodemon, listens on PORT (default 5001)
```

Required `server/.env`:
```
PORT=5001
MONGO_URI=mongodb+srv://<user>:<pass>@<cluster>/golato
JWT_SECRET=<random-long-string>
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=http://localhost:5173
```

### 3. Frontend
```bash
cd client
npm install
npm run dev                # http://localhost:5173
```

Required `client/.env`:
```
VITE_API_URL=http://localhost:5001
```

### Optional: local MongoDB via Docker
A `docker-compose.yml` is included for a local Mongo instance:
```bash
docker compose up -d mongo
# then point server/.env at: mongodb://localhost:27017/golato
```

## Features

### Public
- Browse all stadiums on the home page (city / date / time filters)
- View any stadium's 7-day availability grid, gallery carousel, and address (with optional Google Maps link)

### Match organizers (user role)
- Sign up, sign in, sign out (role chosen at registration)
- Search stadiums by location and slot availability
- Reserve an available slot (atomic — no double-booking)
- Cancel your own reservations
- Chat with the stadium owner (5 s polling)

### Stadium owners (owner role)
- Create stadiums with multi-photo upload (up to 8 per upload, 10 MB each)
- Add or delete individual photos after the fact
- Manage slots on a clickable 24 h × 7 d grid
- View statistics — reservations per day (bar chart), slot status breakdown (pie chart), occupancy per stadium
- Chat with users

## REST API

All routes are under `/api`. Authenticated endpoints require `Authorization: Bearer <token>`.

### Auth
- `POST /auth/register` — `{ name, email, password, role }`
- `POST /auth/login` — `{ email, password }` → `{ token, user }`
- `GET /auth/me`

### Stadiums
- `GET /stadiums?city=&date=&startTime=`
- `GET /stadiums/:id`
- `GET /stadiums/owner/mine` *(owner)*
- `POST /stadiums` *(owner, multipart)*
- `PUT /stadiums/:id` *(owner, multipart — appends photos)*
- `DELETE /stadiums/:id/photos/:filename` *(owner)*
- `DELETE /stadiums/:id` *(owner)*

### Slots
- `GET /slots/stadium/:stadiumId` — returns the next 7 days
- `POST /slots` *(owner)*
- `POST /slots/bulk` *(owner)*
- `DELETE /slots/:id` *(owner, only if not reserved)*

### Reservations
- `POST /reservations/:slotId` *(user, atomic)*
- `DELETE /reservations/:slotId` *(user, own only)*
- `GET /reservations/mine` *(user)*

### Messages
- `POST /messages` — `{ receiverId, stadiumId, content }`
- `GET /messages/thread/:otherUserId/:stadiumId`
- `GET /messages/inbox`

### Stats
- `GET /stats/owner` *(owner)*

## Concurrency

Reservations use an atomic `findOneAndUpdate({ _id, status: 'available' }, ...)` against the `slots` collection. If two users hit "Reserve" on the same slot simultaneously, the database guarantees that exactly one succeeds — the other gets a `409 Conflict` with a friendly toast.

## Notes

- `.env` files are gitignored — never commit credentials.
- Uploaded photos live on the server's filesystem (`server/uploads/stadiums/`). They are *not* portable across deployments. For production, swap multer's disk storage for S3 / Cloudinary / Cloudflare R2.
- Atlas free tier (512 MB) is enough for documents but not for photo storage in the DB.

## Testing manually

1. Register two accounts — one **owner**, one **user**.
2. As owner: add a stadium with photos → confirm photos render. Add slots for tomorrow.
3. As user: browse the home page, open the stadium, reserve a slot. Open a second browser → try to reserve the same slot → second attempt should fail with a 409 toast.
4. Cancel the reservation → slot turns green again.
5. Send a message about a stadium → the recipient sees it within 5 s.
6. Check the owner's `Statistics` page — counts and charts reflect the activity.
