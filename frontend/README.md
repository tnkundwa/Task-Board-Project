# Frontend

Next.js application that provides the user interface for managing teams, tasks, and notifications.

## Tech stack

- **Next.js 16** with App Router
- **TypeScript**
- **Zustand** for state management
- **Tailwind CSS** for styling

## Architecture

### Pages

| Route | Description |
|-------|-------------|
| `/` | Dashboard — overview of teams and tasks |
| `/teams` | List all teams |
| `/teams/[teamId]` | Team details and tasks |
| `/teams/[teamId]/tasks` | Task board for a team |
| `/teams/[teamId]/members` | Member management |
| `/teams/[teamId]/settings` | Team settings |
| `/notifications` | Notification history |

### Data flow

The frontend uses a repository → store → component pattern:

```
Component ──reads──▶ Store ──calls──▶ Repository ──HTTP──▶ API Gateway
                                        │
                                        └── transforms backend JSON to frontend models
```

**Repositories** (`src/lib/data/*.repository.ts`):
- Call the API Gateway via the Next.js proxy (`/api/*` → `http://localhost:8080`)
- Transform backend JSON responses into frontend-friendly shapes
- Inject sensible defaults for fields the backend does not return (priority, dueDate, avatarUrl)

**Stores** (`src/stores/*.store.ts`):
- Zustand stores that hold UI state
- Expose actions that call repository methods
- Manage optimistic updates and loading/error states

**Components** (`src/components/`):
- Read-only UI components that receive data from stores
- No direct API calls

### Proxy configuration

The Next.js config (`next.config.mjs`) rewrites `/api/*` requests to the API Gateway:

```ts
async rewrites() {
  return [
    {
      source: '/api/:path*',
      destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/:path*`,
    },
  ];
}
```

This avoids CORS issues during development — the browser sees same-origin requests. The proxy destination is configurable via the `NEXT_PUBLIC_API_URL` environment variable.

### Notifications

The notification bell polls the API every 10 seconds for new notifications (`startPolling` in the notifications store). Notifications appear in a dropdown from the top bar and on the `/notifications` page.

## Local development

```bash
pnpm install
pnpm dev
# Opens http://localhost:3000
# API requests go to http://localhost:8080 (API Gateway must be running)
```

## Production build

```bash
pnpm build
pnpm start
```

The production build outputs static files (via `next build`) that can be served by any HTTP server. The Docker image uses nginx to serve them with proper cache headers and client-side routing support.
