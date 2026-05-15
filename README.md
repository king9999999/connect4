# Connect4 Arena

A beginner-friendly full-stack multiplayer Connect 4 starter built with Next.js, TypeScript, Tailwind CSS, Express, Socket.IO, and Supabase.

## Features

- Supabase signup and login
- Ranked and unranked matchmaking
- Server-authoritative real-time games
- Elo rating updates for ranked matches
- Bot games with simple heuristic AI
- Match history and leaderboard
- Responsive Chess.com-inspired interface

## Project Structure

```text
connect4-arena/
  apps/
    server/              Express, Socket.IO, matchmaking, Elo, Supabase admin access
    web/                 Next.js app router frontend
  packages/
    shared/              Shared TypeScript types and pure Connect 4 rules
  supabase/
    schema.sql           Tables, indexes, triggers, and RLS policies
```

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a Supabase project, then run `supabase/schema.sql` in the Supabase SQL editor.

3. Copy `.env.example` into both app folders:

```bash
cp .env.example apps/server/.env
cp .env.example apps/web/.env.local
```

4. Fill in your Supabase URL, anon key, and service role key. Keep the service role key in `apps/server/.env` only.

5. Start both apps:

```bash
npm run dev
```

Web: `http://localhost:3000`

API and Socket.IO: `http://localhost:4000`

## How Real-Time Games Work

1. The browser signs in with Supabase and sends the access token to Socket.IO.
2. The server verifies the token with Supabase.
3. Players join ranked, unranked, or bot queues.
4. The server creates the match, owns the board state, validates every move, and broadcasts updates.
5. Ranked matches update both players' Elo ratings when the game ends.

## Useful Commands

```bash
npm run dev
npm run build
npm run typecheck
npm run lint
```

## Environment Variables

See `.env.example` for all required values.
