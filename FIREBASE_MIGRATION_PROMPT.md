# Firebase Migration Prompt for PawnPilots

Copy everything below the line and paste it into Gemini 3.1 Pro (high).

---

You are helping me migrate my static website **PawnPilots** (pawnpilots.com) from a JSONBin-backed static site on GitHub Pages to Firebase (Auth + Firestore + optionally Firebase Hosting). I'll walk you through everything about the current architecture so you have full context. Do NOT skip steps or assume things — read all of this carefully.

## Who I Am

I'm Himanshu, a 2195-rated FIDE chess coach. PawnPilots is my online chess coaching business for kids aged 5-15. I have 4 students right now: Aarvi, Ianna, Abhi, and Bhavik. The site is deployed on GitHub Pages from `master` branch at `github.com/repeller/pawnpilots.git`. I code casually and prefer direct, no-fluff communication.

## Current Architecture (What We're Migrating FROM)

### Tech Stack
- **Hosting**: GitHub Pages (static HTML/CSS/JS, no build step, no framework)
- **Database**: A single JSONBin.io bin (ID: `69b859a2aa77b81da9ee0ccc`) stores ALL data as one JSON blob
- **Auth**: There is no real auth. The admin (me) enters the JSONBin Master API Key into localStorage via the admin attendance page. Student dashboards are accessed via URL tokens like `?t=aarvi-mn9s`
- **CSS**: Tailwind CDN + custom inline styles. Design language uses a warm walnut/gold/green palette
- **Fonts**: Plus Jakarta Sans, Inter, Baloo 2, Outfit, Material Symbols Outlined

### JSONBin Data Structure

The entire database is a single JSON object:

```json
{
  "students": [
    {
      "token": "aarvi-mn9s",
      "name": "Aarvi",
      "days": [2, 4],
      "time": "18:00",
      "timezone": "America/Chicago",
      "lichessUsername": "Aarvi-CT",
      "chesscomUsername": "",
      "stats": {
        "lichess": { "rapid": 1200, "blitz": 1100, "puzzle": 1300 },
        "chesscom": {},
        "history": [
          { "date": "2026-01-15", "lichessRapid": 1150 },
          { "date": "2026-02-10", "lichessRapid": 1200 }
        ]
      },
      "recaps": [
        {
          "date": "2026-03-20",
          "title": "Tactical Patterns",
          "mood": "great",
          "bullets": ["Learned pin tactics", "Solved 5 puzzles"]
        }
      ],
      "puzzles": [
        { "id": "002GQ", "rating": 654, "theme": "Fork", "solved": false, "fen": "", "moves": "" }
      ],
      "puzzleSolves": [
        { "id": "002GQ", "theme": "Fork", "xp": 30, "attempts": 0, "time": 45, "date": "2026-03-20" }
      ],
      "puzzleLog": [],
      "badges": [
        { "id": "first_login", "name": "First Steps", "icon": "👣", "desc": "Visited your dashboard", "earnedAt": "2026-03-15" }
      ],
      "plan": {
        "title": "Road to 1400",
        "pace": "2 classes/week",
        "months": [
          {
            "name": "Tactical Foundations",
            "goal": "Master basic tactics",
            "weeks": [
              {
                "label": "Week 1",
                "classes": [
                  { "topic": "Forks & Double Attacks", "date": "2026-04-01", "done": false },
                  { "topic": "Pins & Skewers", "date": "2026-04-03", "done": false }
                ],
                "homework": { "text": "Solve 10 fork puzzles on Lichess", "done": false },
                "links": [
                  { "text": "Lichess Forks", "url": "https://lichess.org/training/fork" }
                ]
              }
            ]
          }
        ]
      },
      "h2h": {
        "opponent": "repeller69",
        "opponentLabel": "Coach Himanshu",
        "studentScore": 137.5,
        "opponentScore": 726.5,
        "wins": 118,
        "draws": 39,
        "losses": 707,
        "totalGames": 864
      },
      "attendance": {}
    }
  ],
  "attendance": {
    "aarvi-mn9s": {
      "2026-03-18": { "status": "Present", "topic": "Tactics" },
      "2026-03-20": { "status": "Present", "topic": "Endgames" }
    }
  }
}
```

### Student Tokens (Current)
- Aarvi: `aarvi-mn9s` (Lichess: `Aarvi-CT`)
- Ianna: `ianna-73mh` (Lichess: `Ianna-pw`)
- Abhi: `abhi-zlgw`
- Bhavik: `bhavik-d4rm` (Chess.com: `I_Bang_the_Drum`)

### File Structure

```
site/
├── index.html                    # Landing page (public)
├── styles.css                    # Main site styles
├── coach/index.html              # Coach profile page (public)
├── levels/index.html             # Course levels page (public)
├── enroll/index.html             # Enrollment/WhatsApp CTA (public)
├── roadmap/index.html            # Learning roadmap (public)
├── attendance/index.html         # Parent-facing attendance view (reads JSONBin public)
├── monitor/index.html            # Server monitor page
├── admin/
│   └── attendance/index.html     # ADMIN panel — auth via localStorage API key, full CRUD on JSONBin
├── dashboard/
│   ├── index.html                # THE BIG FILE — student dashboard (1480 lines, all-in-one HTML/CSS/JS)
│   ├── seed.html                 # One-time data seeder for Aarvi
│   ├── seed-puzzles.html         # Puzzle seeder
│   ├── add-abhi-plan.html        # One-time seeder for Abhi's plan
│   ├── add-ianna-plan.html       # One-time seeder for Ianna's plan + lichess username
│   ├── add-bhavik.html           # One-time seeder for Bhavik's full profile
│   └── generate-puzzles.js       # Puzzle generation helper
└── private/
    ├── ads.html
    └── monitor-ui.html
```

### How the Current System Works

**Admin Flow (me, the coach):**
1. I go to `/admin/attendance/` and enter my JSONBin Bin ID + Master API Key
2. These get stored in `localStorage` as `att_binId` and `att_apiKey`
3. The admin page fetches the entire JSONBin blob, renders all students with attendance grids
4. I mark attendance (Present/Absent/Cancelled/Rescheduled), add session topics, and hit "Save to Database"
5. Save does a PUT to JSONBin with the entire updated JSON blob
6. To add student data (recaps, puzzles, plans), I currently run one-time HTML seed files like `add-bhavik.html`

**Student/Parent Flow:**
1. I send parents a link like `pawnpilots.com/dashboard/?t=aarvi-mn9s`
2. The dashboard reads JSONBin (public read, no key needed) to get student data
3. Dashboard renders: session recaps, flight plan (curriculum), interactive puzzles, stats (fetched live from Lichess/Chess.com APIs), badges, attendance summary, parent summary card, rating altitude chart
4. For puzzle solving, the dashboard fetches puzzle data from Lichess API, renders an interactive chess board, and tracks solves
5. Puzzle solves are saved to localStorage AND synced to JSONBin (if `SYNC_KEY` exists in localStorage)

**Cross-device puzzle sync (recently added):**
- On load, merges `puzzleSolves` from JSONBin (cloud) + localStorage (local), deduplicated by puzzle ID
- On solve, pushes to localStorage AND calls `syncSolveToCloud()` which reads the full bin, finds the student, appends the solve, and PUTs the entire bin back
- The API key for writes comes from localStorage (`att_apiKey`), delivered to parent devices via a one-time `?k=APIKEY` URL parameter that stores and strips itself

**Attendance page (`/attendance/`):**
- Public-facing page for parents
- Reads JSONBin (public read), shows attendance calendar per student
- Filtered by `?t=TOKEN` parameter

### Security Problems with Current Setup
1. JSONBin Master API Key is stored in localStorage and passed via URL — anyone who gets it can read/write ALL data
2. Student tokens are simple strings in URLs — guessable, no access control
3. No per-student data isolation — the entire database is one blob
4. Concurrent writes can corrupt data (two devices syncing at once = last write wins)
5. No server-side validation — any client with the key can PUT anything

## What We're Migrating TO

### Firebase Services Needed
1. **Firebase Auth** — Email/password authentication
2. **Cloud Firestore** — Document database (replaces JSONBin)
3. **Firebase Hosting** — Optional, can stay on GitHub Pages if easier

### User Roles
1. **Coach (me)** — Full read/write access to everything. Only one coach account.
2. **Parent** — Read-only access to their linked student(s). Coach creates their account.

### Proposed Firestore Schema

```
/students/{token}
  name: "Aarvi"
  token: "aarvi-mn9s"
  days: [2, 4]
  time: "18:00"
  timezone: "America/Chicago"
  lichessUsername: "Aarvi-CT"
  chesscomUsername: ""
  stats: { lichess: {...}, chesscom: {...}, history: [...] }
  recaps: [...]
  puzzles: [...]
  puzzleSolves: [...]
  badges: [...]
  plan: { title: "...", months: [...] }
  h2h: { opponent: "...", ... }

/students/{token}/attendance/{date}
  status: "Present"
  topic: "Tactics"
  notes: ""

/users/{uid}
  email: "parent@email.com"
  role: "coach" | "parent"
  displayName: "Aarvi's Mom"
  studentTokens: ["aarvi-mn9s"]
  createdAt: timestamp
```

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Users collection
    match /users/{uid} {
      allow read: if request.auth != null && request.auth.uid == uid;
      allow write: if isCoach();
    }

    // Students collection
    match /students/{token} {
      allow read, write: if isCoach();
      allow read: if isLinkedParent(token);
    }

    // Attendance subcollection
    match /students/{token}/attendance/{date} {
      allow read, write: if isCoach();
      allow read: if isLinkedParent(token);
    }

    // Helper functions
    function isCoach() {
      return request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == "coach";
    }

    function isLinkedParent(token) {
      return request.auth != null &&
        token in get(/databases/$(database)/documents/users/$(request.auth.uid)).data.studentTokens;
    }
  }
}
```

## Migration Plan — What I Need You To Build

### Phase 1: Firebase Setup + Auth System

**1a. Create a login page at `/login/index.html`**
- Clean login form matching PawnPilots design (warm walnut/gold/green palette, Baloo 2 + Outfit fonts)
- Email + password fields, login button
- Error handling (wrong password, no account, etc.)
- On successful login:
  - If coach role → redirect to `/admin/attendance/`
  - If parent role → redirect to `/dashboard/?t={their student token}`
- Include Firebase SDK via CDN `<script>` tags (keep it simple, no npm/build step)
- Use Firebase Auth `signInWithEmailAndPassword`

**1b. Create a shared Firebase config file at `/firebase-config.js`**
- Export/expose the Firebase config object
- Initialize Firebase app, Auth, and Firestore
- All pages will include this via `<script src="/firebase-config.js">`
- Use the modular compat SDK (the `firebase/compat` version that works with simple script tags)
- Leave the config values as placeholders like `YOUR_API_KEY` etc — I'll fill them in after creating my Firebase project

**1c. Add auth guards to protected pages**
- `/admin/attendance/index.html` — Must be logged in as coach. If not, redirect to `/login/`
- `/dashboard/index.html` — Must be logged in as parent (linked to this student token) OR coach. If not, redirect to `/login/`
- `/attendance/index.html` — Must be logged in. Parents see only their student.

### Phase 2: Migrate Dashboard to Firestore

**2a. Update `dashboard/index.html`**

Replace the JSONBin fetch with Firestore read:

Currently:
```javascript
var BIN='69b859a2aa77b81da9ee0ccc';
fetch('https://api.jsonbin.io/v3/b/'+BIN+'/latest')
.then(function(r){return r.json()})
.then(function(j){
  var db=j.record||j;
  var s=db.students.find(function(x){return x.token.toLowerCase()===token.toLowerCase()});
  // ... build student object ...
});
```

Replace with:
```javascript
firebase.firestore().collection('students').doc(token).get()
.then(function(doc){
  if(!doc.exists){showError('Not found','...');return}
  var s=doc.data();
  // ... build student object (same structure) ...
});
```

**Key changes needed:**
- Remove `BIN` variable and all `fetch('https://api.jsonbin.io/...')` calls
- Remove `SYNC_KEY` variable and `k=` URL parameter handling
- Replace `syncSolveToCloud()` with a Firestore update:
  ```javascript
  function syncSolveToCloud(solveEntry){
    var ref=firebase.firestore().collection('students').doc(token);
    ref.update({
      puzzleSolves: firebase.firestore.FieldValue.arrayUnion(solveEntry)
    });
  }
  ```
- Replace `syncAllToCloud()` similarly
- Remove the entire cross-device merge logic (Firestore IS the single source of truth now, no localStorage/cloud merge needed)
- Keep localStorage as a cache/fallback for offline, but Firestore is primary
- The `?t=TOKEN` parameter stays — it identifies which student to load. But now the auth check confirms the logged-in user has access to that token.
- Keep ALL the existing UI rendering code (recaps, puzzles, plan, stats, badges, chart, h2h) — only change the data source from JSONBin to Firestore
- Keep ALL the Lichess/Chess.com API integrations as-is (they're client-side fetches, nothing to change)
- Keep the puzzle board, chess.js integration, confetti, everything — just change where data comes from and goes to

**2b. Update attendance system**

Update `/attendance/index.html`:
- Replace JSONBin read with Firestore read
- Auth guard: must be logged in, can only see their own student's attendance

Update `/admin/attendance/index.html`:
- Replace JSONBin read/write with Firestore read/write
- Remove the "Setup Database" screen (Bin ID + API Key entry) — replaced by Firebase Auth login
- Remove localStorage-based auth (`att_binId`, `att_apiKey`) — replaced by Firebase Auth
- Keep the same UI (month navigation, student cards, attendance grid, status dropdowns)
- Adding a student now also creates a `/users/` doc for parent (if email provided) + sends Firebase Auth invite

### Phase 3: Coach Admin Panel Upgrade

**3a. Add student management to admin page**

Currently adding students requires running one-time HTML seed files. Replace with:
- "Add Student" form: name, chess.com username, lichess username, parent email, session days/time/timezone
- Creates Firestore doc in `/students/{token}` (auto-generate token)
- Creates parent account in Firebase Auth + `/users/{uid}` doc
- "Edit Student" — update any field
- "Add Recap" form — title, date, mood, bullet points → appends to student's `recaps` array
- "Update Curriculum" — edit plan months/weeks/classes

**3b. Data migration script**

Create a one-time migration page at `/admin/migrate.html`:
- Reads the current JSONBin data (using stored API key from localStorage)
- For each student, creates a Firestore document at `/students/{token}`
- For each student's attendance, creates subcollection docs at `/students/{token}/attendance/{date}`
- Creates coach user doc at `/users/{coachUid}`
- Logs progress and any errors
- This only needs to run once

## CRITICAL CONSTRAINTS

1. **No build step, no npm, no framework.** Keep it as plain HTML/CSS/JS with CDN script tags. This is how the entire site works now and I want to keep it that way.

2. **Do not change the visual design.** Keep the same Tailwind classes, color palette, fonts, and component styles. The dashboard especially — don't touch the UI, only the data layer.

3. **Use Firebase compat SDK** (not the modular v9+ tree-shaking SDK). The compat SDK works with simple `<script>` tags:
   ```html
   <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js"></script>
   <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js"></script>
   <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js"></script>
   ```

4. **Keep the `?t=TOKEN` URL pattern** for student dashboards. The token is still how we identify which student to load. Auth just adds access control on top.

5. **Don't delete the JSONBin code yet.** Comment it out with a note. I want to be able to fall back if something breaks.

6. **Keep all puzzle/chess functionality identical.** The chess board, Lichess API puzzle fetching, chess.js move validation, confetti, hints, solution playback — don't touch any of it. Only change where puzzle solves get persisted.

7. **Keep all external API integrations.** Lichess user stats, Lichess rating history, Chess.com stats, Chess.com game archives for rating history — all stay as-is.

8. **Preserve the dashboard's `render()` function chain.** After data loads from Firestore, call the same `render()` → `renderRecaps()` → `renderPlan()` → `renderPuzzlesPanel()` → `renderStatsPanel()` → `renderBadges()` chain.

## Work Order

Please tackle this in order. For each phase, give me the complete modified files (full file contents, not diffs — I'll replace files wholesale). Explain what changed and why.

1. **First**: `firebase-config.js` + `login/index.html` + Firestore security rules
2. **Second**: Updated `dashboard/index.html` (JSONBin → Firestore, auth guard, updated sync)
3. **Third**: Updated `admin/attendance/index.html` (JSONBin → Firestore, auth guard, add recap/plan forms)
4. **Fourth**: Updated `attendance/index.html` (JSONBin → Firestore, auth guard)
5. **Fifth**: `admin/migrate.html` (one-time migration script)

Before you start coding, confirm you understand the current architecture and ask me any clarifying questions. Then proceed phase by phase.
