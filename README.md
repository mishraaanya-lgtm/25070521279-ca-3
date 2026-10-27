# FLEXI — Your study space

FLEXI is a full-stack study planner built with React, Vite, Express, Node.js, and MongoDB. Each student's account, subjects, topics, study plans, focus sessions, and goals are stored in MongoDB. Email/password signup and sign-in issue JWTs; protected API routes return only the signed-in student's data.

## Requirements

- Node.js 20 or newer and npm
- MongoDB Community Server running locally, or a MongoDB Atlas cluster
- MongoDB Compass is optional. Compass connects to a MongoDB server; it does not run a database server itself.

## Configure MongoDB

1. Copy the environment templates:

   ```powershell
   Copy-Item client/.env.example client/.env
   Copy-Item server/.env.example server/.env
   ```

2. Start MongoDB Community Server locally, or create a database user and allow your IP address in the Atlas Network Access settings.
3. Set `MONGODB_URI` in `server/.env` to the connection string for your MongoDB server. The local default is `mongodb://127.0.0.1:27017/flexi`; for Atlas, use the connection string Atlas gives you and replace its database name with `flexi` if desired.
4. Set `JWT_SECRET` in `server/.env` to a unique random secret. For example, run `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"` and copy the output into the file.
5. In MongoDB Compass, connect with the same `MONGODB_URI`. After you create an account in FLEXI, Compass will show the `flexi` database and its collections.

Keep `.env` files private. Do not commit database credentials or your JWT secret.

## Install and run

From the project root:

```bash
npm install
npm run dev
```

Open `http://localhost:5173`. Vite forwards `/api` requests to the backend at `http://localhost:4000`.

Check the API and MongoDB connection at `http://localhost:4000/api/health`. It returns `200` when the database is connected and `503` otherwise. The server requires both `MONGODB_URI` and `JWT_SECRET`, and will report a clear startup error if either is missing or the database cannot be reached.

For a production frontend build, run `npm run build`; Vite writes it to `client/dist`. Set `VITE_API_URL` to the deployed API's `/api` URL and configure `CLIENT_ORIGIN` on the API to the frontend's origin.

## Features

- Account signup and sign-in with bcrypt password hashing and seven-day JWTs
- Private subject library with exam dates, difficulty, and editable topic progress
- Weekly study plan generation, with a built-in planner when `OPENAI_API_KEY` is unset
- Daily and weekly study goals
- Focus timer with sessions saved to the database
- Progress summary, study streak, and backlog risk

## API

All routes use the `/api` prefix. `/api/health`, `/api/auth/signup`, and `/api/auth/login` are public. The subject, goal, plan, focus session, analytics, and calendar routes require `Authorization: Bearer <token>`.

See [docs/api-routes.md](docs/api-routes.md) for the route list and [docs/database-schema.md](docs/database-schema.md) for MongoDB collections and ownership fields.
