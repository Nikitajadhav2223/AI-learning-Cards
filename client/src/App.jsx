import React, { useState, useCallback, useRef } from "react";
import { useCardWebSocket } from "./hooks/useCardWebSocket";
import { LearningCard } from "./components/LearningCard";

const INITIAL_CARDS = [
  { status: "idle", card: null, error: null },
  { status: "idle", card: null, error: null },
  { status: "idle", card: null, error: null },
];

export default function App() {
  const [topic, setTopic] = useState("");
  const [mode, setMode] = useState("success"); // "success" | "failure"
  const [cards, setCards] = useState(INITIAL_CARDS);
  const [appStatus, setAppStatus] = useState("idle"); // idle | connecting | running | done
  const [wsStatus, setWsStatus] = useState("disconnected");
  const currentTopicRef = useRef("");

  const updateCard = (index, patch) => {
    setCards((prev) =>
      prev.map((c, i) => (i === index ? { ...c, ...patch } : c))
    );
  };

  const handleMessage = useCallback((data) => {
    switch (data.type) {
      case "start":
        setAppStatus("running");
        break;

      case "card_start":
        updateCard(data.cardIndex, { status: "loading", card: null, error: null });
        break;

      case "card_complete":
        updateCard(data.cardIndex, { status: "complete", card: data.card, error: null });
        break;

      case "card_error":
        updateCard(data.cardIndex, { status: "error", error: data.error, card: null });
        break;

      case "done":
      case "retry_done":
        setAppStatus("done");
        break;

      default:
        break;
    }
  }, []);

  const { connect, send } = useCardWebSocket({
    onMessage: handleMessage,
    onOpen: () => setWsStatus("connected"),
    onClose: () => setWsStatus("disconnected"),
    onError: () => setWsStatus("error"),
  });

  const handleGenerate = () => {
    if (!topic.trim()) return;
    currentTopicRef.current = topic.trim();
    setCards(INITIAL_CARDS);
    setAppStatus("connecting");

    const ws = connect();

    // Wait for open if not yet connected
    if (ws.readyState === WebSocket.OPEN) {
      send({ type: "generate", topic: topic.trim(), mode });
    } else {
      ws.addEventListener(
        "open",
        () => send({ type: "generate", topic: topic.trim(), mode }),
        { once: true }
      );
    }
  };

  const handleRetry = (cardIndex) => {
    updateCard(cardIndex, { status: "retrying", error: null });
    connect(); // reuses open connection
    send({ type: "retry_card", cardIndex, topic: currentTopicRef.current });
  };

  const allDone = cards.every((c) => c.status === "complete");
  const anyError = cards.some((c) => c.status === "error");
  const isRunning = appStatus === "running" || appStatus === "connecting";

  return (
    <div className="app">
      {/* Background decoration */}
      <div className="bg-orb bg-orb--1" />
      <div className="bg-orb bg-orb--2" />

      <header className="header">
        <div className="header__logo">
          <span className="header__logo-mark">A</span>
          <span className="header__logo-text">ainstein</span>
        </div>
        <div className={`header__ws-badge ws-badge--${wsStatus}`}>
          <span className="ws-dot" />
          {wsStatus === "connected" ? "WS Connected" : wsStatus === "disconnected" ? "WS Idle" : "WS Error"}
        </div>
      </header>

      <main className="main">
        <section className="hero">
          <h1 className="hero__title">
            AI Learning<br />
            <span className="hero__title-accent">Card Generator</span>
          </h1>
          <p className="hero__subtitle">
            Enter any topic and watch 3 learning cards stream in — one by one — powered by Gemini AI.
          </p>
        </section>

        {/* Input form */}
        <div className="form-card">
          <div className="form-row">
            <input
              className="topic-input"
              type="text"
              placeholder="e.g. Photosynthesis, Newton's Laws, Black Holes…"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !isRunning && handleGenerate()}
              disabled={isRunning}
            />
            <button
              className="generate-btn"
              onClick={handleGenerate}
              disabled={isRunning || !topic.trim()}
            >
              {isRunning ? (
                <>
                  <span className="btn-spinner" />
                  Generating
                </>
              ) : (
                "Generate →"
              )}
            </button>
          </div>

          {/* Mode toggle */}
          <div className="mode-row">
            <span className="mode-label">Test Mode:</span>
            <div className="mode-toggle">
              <button
                className={`mode-btn ${mode === "success" ? "mode-btn--active mode-btn--success" : ""}`}
                onClick={() => setMode("success")}
                disabled={isRunning}
              >
                ✓ Success
              </button>
              <button
                className={`mode-btn ${mode === "failure" ? "mode-btn--active mode-btn--failure" : ""}`}
                onClick={() => setMode("failure")}
                disabled={isRunning}
              >
                ✕ Failure (Card 3 fails)
              </button>
            </div>
            <span className="mode-hint">
              {mode === "failure" ? "Cards 1 & 2 succeed · Card 3 errors with retry" : "All 3 cards generate cleanly"}
            </span>
          </div>
        </div>

        {/* Cards grid */}
        {appStatus !== "idle" && (
          <div className="cards-grid">
            {cards.map((c, i) => (
              <LearningCard
                key={i}
                cardIndex={i}
                status={c.status}
                card={c.card}
                error={c.error}
                onRetry={() => handleRetry(i)}
              />
            ))}
          </div>
        )}

        {/* Status banner */}
        {appStatus === "done" && allDone && (
          <div className="status-banner status-banner--success">
            🎉 All 3 cards generated successfully!
          </div>
        )}
        {appStatus === "done" && anyError && (
          <div className="status-banner status-banner--partial">
            ⚠ Some cards failed. Use the Retry button on failed cards.
          </div>
        )}
      </main>
    </div>
  );
}
