---
name: x-for-you-patterns
description: Coding patterns from X For You project - Vue 3 + Node.js Twitter client
version: 1.0.0
source: local-git-analysis
analyzed_commits: 20
---

# X For You Patterns

## Project Overview
X.com For You page viewer with local filtering and auto-refresh. Privacy-first design with local data processing.

## Commit Conventions

This project uses **conventional commits** with Chinese descriptions:
- `feat:` - New features (e.g., feat: Add Korean text filtering)
- `fix:` - Bug fixes (e.g., fix: Remove top-level await causing build failure)
- `refactor:` - Code refactoring (e.g., refactor: Remove queryConfig.js)
- `docs:` - Documentation updates (e.g., docs: Update CLAUDE.md)
- `security:` - Security improvements (e.g., security: Add API Key authentication)

## Code Architecture

```
xueqiu_crx/
├── backend/                    # Express API
│   ├── src/
│   │   ├── config/            # Configuration (auth.js, settingsConfig.js)
│   │   ├── db/                # Database (sqlite.js, supabase.js)
│   │   ├── routes/            # API endpoints (tweets.js, settings.js)
│   │   ├── services/          # Business logic (xService.js)
│   │   └── index.js           # Entry point
│   ├── scripts/               # Dev scripts
│   └── tests/                # Unit tests
├── frontend/                   # Vue 3 SPA
│   ├── src/
│   │   ├── api/               # API calls (tweets.js)
│   │   ├── components/        # Vue components (PascalCase)
│   │   ├── views/             # Page views (HomeView.vue, EmbedView.vue)
│   │   ├── router/            # Vue Router
│   │   └── utils/             # Utilities
│   └── vite.config.js
├── supabase/                   # Database migrations
└── CLAUDE.md                   # Project documentation
```

## Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Vue components | PascalCase | `TweetCard.vue` |
| JavaScript files | camelCase | `xService.js` |
| API endpoints | kebab-case | `/mark-read` |
| Database tables | snake_case | `read_posts` |
| Environment variables | UPPER_SNAKE | `X_AUTH_TOKEN` |

## Backend Patterns

### API Route Structure
```javascript
// backend/src/routes/tweets.js
router.get('/endpoint-name', async (req, res) => {
  try {
    const data = await serviceMethod();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
```

### Service Layer Pattern
```javascript
// backend/src/services/xService.js
async function fetchTweets() {
  const response = await axios.get(X_API_URL, { headers });
  return processTweets(response.data);
}
```

### Database Abstraction
- **Development**: SQLite with better-sqlite3
- **Production**: Supabase (auto-detected via SUPABASE_URL env var)
- Switch logic in `backend/src/db/index.js`

## Frontend Patterns

### Vue 3 Composition API
```javascript
// API call
import { ref, onMounted } from 'vue';
import { fetchTweets, markRead } from '@/api/tweets';

const tweets = ref([]);
onMounted(async () => {
  const result = await fetchTweets();
  tweets.value = result.data;
});
```

### Component Props
- Use `defineProps` with TypeScript-like comments
- Emit events with `defineEmits`

### Auto-Refresh Pattern
- 15-second interval for fetching new tweets
- URL cache busting: `?t=${Date.now()}`

### Read Status Sync
- Triple-click to toggle read status
- Auto-sync every 5 seconds to handle multi-client

## Testing Patterns

- Test files in `backend/tests/` directory
- Use Vitest for testing
- Test structure:
  ```javascript
  import { describe, it, expect } from 'vitest';
  describe('module', () => {
    it('should work', () => {
      expect(actual).toBe(expected);
    });
  });
  ```

## Deployment Patterns

### Backend (Render)
- `render.yaml` for Blueprint deployment
- Auto-detect Supabase based on env vars

### Frontend (Vercel)
- `vercel.json` configuration
- Environment variables in `.env.production`

## Filtering Logic

All filtering happens on backend:
1. Fetch from X API
2. Language filter (Japanese/Korean detection)
3. Already-rendered filter (query SQLite)
4. Return filtered results

## Security Patterns

- API Key auth for sensitive endpoints (settings)
- Block browser access to internal APIs
- Environment variables for secrets (never commit .env)

## Common Workflows

### Adding New API Endpoint
1. Add route in `backend/src/routes/tweets.js`
2. Add service method in `backend/src/services/xService.js`
3. Add frontend API call in `frontend/src/api/tweets.js`
4. Use in Vue component

### Database Schema Change
1. Create Supabase migration in `supabase/migrations/`
2. Update `backend/src/db/supabase.js` if needed
3. Test locally with SQLite

### Token Refresh
1. Login to x.com in browser
2. F12 → Application → Cookies → x.com
3. Copy `auth_token` and `ct0`
4. Update `backend/.env`

## Error Handling

**Backend**:
```javascript
{ success: true, data: {...} }  // Success
{ success: false, error: 'msg' } // Failure
```

**Frontend**: API layer catches errors, shows user-friendly messages

## Related Files

- `CLAUDE.md` - Full project documentation
- `.claude/skills/前端功能/SKILL.md` - Frontend details
- `.claude/skills/后端功能/SKILL.md` - Backend details
- `.claude/skills/supabase部署/SKILL.md` - Deployment guide
