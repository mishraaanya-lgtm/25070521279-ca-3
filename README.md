# FLEXI

FLEXI is a full-stack workspace dashboard for organizing projects and tasks. The React frontend in `client/` talks to the Express API in `server/`, and task records are stored in MongoDB through Mongoose.

## Requirements

- Node.js 18 or newer
- MongoDB Community Server running locally, or a MongoDB Atlas connection string

MongoDB Compass is a desktop interface for connecting to and inspecting MongoDB. Start a local MongoDB server first, then connect Compass to `mongodb://127.0.0.1:27017` to view the `flexi` database and its `tasks` collection.

## Run locally

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env` and set `MONGODB_URI` to your MongoDB connection string. For a local database, use `mongodb://127.0.0.1:27017/flexi`.
3. Start both applications with `npm run dev`.
4. Open the Vite URL printed in the terminal (usually `http://localhost:5173`). The API runs at `http://localhost:5000`.

For MongoDB Atlas, set `MONGODB_URI` to the connection string from your Atlas cluster. Keep `.env` private; it is excluded from Git.

## API

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/health` | API and database connection status |
| GET | `/api/tasks` | List tasks |
| POST | `/api/tasks` | Create a task |
| PATCH | `/api/tasks/:id` | Update task fields, including status |
| DELETE | `/api/tasks/:id` | Delete a task |

When the API or database is unavailable, the interface shows sample tasks so the dashboard can still be previewed. Changes made while MongoDB is disconnected are kept only for that browser session. Start MongoDB and reload to use persistent task storage.

## Build

Run `npm run build` to create the production frontend bundle in `client/dist/`.
