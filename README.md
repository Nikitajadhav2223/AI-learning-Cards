# AI Learning Card Generator

A minimal full-stack web app that streams AI-generated learning cards in real time over WebSocket.

---

## Getting Started

You need **Node.js** installed (v18+). That's it.

### 1 — Clone and install

```bash
git clone <your-repo-url>
cd ai-learning-cards
```

### 2 — Set up the server

```bash
cd server
npm install
cp .env.example .env
```

Open `.env` and add your **Gemini API key**:

```
GEMINI_API_KEY=your_key_here
```

Get a free key at: https://aistudio.google.com/app/apikey

### 3 — Start the server

```bash
node index.js
```

You should see: `WebSocket server running on ws://localhost:3001`

### 4 — Set up and start the client (new terminal)

```bash
cd client
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## How to Use

1. Type a topic (e.g. "Photosynthesis", "Newton's Laws", "Black Holes")
2. Pick a test mode:
   - **✓ Success** — all 3 cards generate and stream in cleanly
   - **✕ Failure** — Cards 1 & 2 succeed, Card 3 deliberately fails mid-generation
3. Click **Generate →**
4. Watch cards appear one by one as they stream in
5. In failure mode, use the **↺ Retry** button on Card 3 — it re-uses the same WebSocket connection and succeeds

---

## WebSocket Architecture

### Why WebSocket over REST polling?

Cards are generated sequentially by the AI. WebSocket lets the server **push** each card the moment it's ready, rather than the client polling repeatedly. This results in genuinely progressive rendering — Card 1 appears while Cards 2 and 3 are still being generated.

### Message protocol (server → client)

| Type | Payload | Meaning |
|---|---|---|
| `start` | `{ topic }` | Generation session started |
| `card_start` | `{ cardIndex }` | Server began generating this card — show skeleton |
| `card_complete` | `{ cardIndex, card }` | Card data ready — render it |
| `card_error` | `{ cardIndex, error }` | This card failed — show error state |
| `done` | — | All cards finished (success or partial) |
| `retry_done` | `{ cardIndex }` | Retry completed |

### Message protocol (client → server)

| Type | Payload | Meaning |
|---|---|---|
| `generate` | `{ topic, mode }` | Start a new generation run |
| `retry_card` | `{ cardIndex, topic }` | Retry a single failed card |

### Connection lifecycle

A single `WebSocket` instance is created on the first `Generate` click and **reused** for retries within the same session. The `useCardWebSocket` hook holds the socket in a `useRef` so it's stable across re-renders and the connection is never unnecessarily closed and reopened.

---

## Error Handling

The failure scenario is triggered by selecting **Failure mode** before clicking Generate. The server simulates a failure on Card 3 (first attempt only):

- Cards 1 and 2 stream normally
- Card 3 returns a `card_error` message after a short delay
- The UI shows an isolated error state on Card 3 only — Cards 1 and 2 are completely unaffected
- A **Retry** button appears on the failed card
- Clicking Retry sends a `retry_card` message over the **same WebSocket connection**
- The retry always succeeds (the failure flag applies only to the initial run)
- Cards 1 and 2 are never touched during retry

---

## Stack

- **Frontend**: React 18 + Vite
- **Backend**: Node.js + `ws` library
- **AI**: Google Gemini 1.5 Flash (`@google/generative-ai`)
- **Real-time**: WebSocket (native browser API + `ws` on server)

---

## Project Structure

```
ai-learning-cards/
├── server/
│   ├── index.js          # WebSocket server + Gemini integration
│   ├── .env.example      # Environment variable template
│   └── package.json
└── client/
    ├── src/
    │   ├── App.jsx                        # Main component + state
    │   ├── hooks/useCardWebSocket.js      # WS connection hook
    │   ├── components/LearningCard.jsx    # Card component (all states)
    │   ├── index.css                      # Global styles
    │   └── main.jsx                       # React entry point
    ├── index.html
    ├── vite.config.js
    └── package.json
```
