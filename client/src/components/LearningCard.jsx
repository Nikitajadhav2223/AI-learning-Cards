import React from "react";

const CARD_COLORS = [
  { accent: "#f97316", light: "#fff7ed", num: "#fed7aa" },
  { accent: "#8b5cf6", light: "#f5f3ff", num: "#ddd6fe" },
  { accent: "#06b6d4", light: "#ecfeff", num: "#a5f3fc" },
];

export function LearningCard({ cardIndex, status, card, error, onRetry }) {
  const colors = CARD_COLORS[cardIndex] || CARD_COLORS[0];
  const num = cardIndex + 1;

  // ── SKELETON ──────────────────────────────────────────────────────────────
  if (status === "loading") {
    return (
      <div className="card card--loading" style={{ "--accent": colors.accent, "--light": colors.light, "--num-bg": colors.num }}>
        <div className="card__number">{num}</div>
        <div className="skeleton skeleton--title" />
        <div className="skeleton skeleton--line" />
        <div className="skeleton skeleton--line skeleton--short" />
        <div className="skeleton skeleton--fact" />
        <div className="card__loading-label">
          <span className="pulse-dot" />
          Generating…
        </div>
      </div>
    );
  }

  // ── ERROR ─────────────────────────────────────────────────────────────────
  if (status === "error") {
    return (
      <div className="card card--error" style={{ "--accent": "#ef4444", "--light": "#fef2f2", "--num-bg": "#fecaca" }}>
        <div className="card__number">{num}</div>
        <div className="card__error-icon">⚠</div>
        <h3 className="card__error-title">Card {num} failed</h3>
        <p className="card__error-msg">{error || "Something went wrong generating this card."}</p>
        <button className="card__retry-btn" onClick={onRetry}>
          ↺ Retry Card {num}
        </button>
      </div>
    );
  }

  // ── RETRYING ──────────────────────────────────────────────────────────────
  if (status === "retrying") {
    return (
      <div className="card card--loading" style={{ "--accent": colors.accent, "--light": colors.light, "--num-bg": colors.num }}>
        <div className="card__number">{num}</div>
        <div className="skeleton skeleton--title" />
        <div className="skeleton skeleton--line" />
        <div className="skeleton skeleton--line skeleton--short" />
        <div className="skeleton skeleton--fact" />
        <div className="card__loading-label">
          <span className="pulse-dot" />
          Retrying…
        </div>
      </div>
    );
  }

  // ── COMPLETE ──────────────────────────────────────────────────────────────
  if (status === "complete" && card) {
    return (
      <div className="card card--complete" style={{ "--accent": colors.accent, "--light": colors.light, "--num-bg": colors.num }}>
        <div className="card__number">{num}</div>
        <h2 className="card__title">{card.title}</h2>
        <div className="card__section-label">Key Concept</div>
        <p className="card__concept">{card.concept}</p>
        <div className="card__fun-fact">
          <span className="card__fun-fact-icon">✦</span>
          <div>
            <div className="card__fun-fact-label">Fun Fact</div>
            <p className="card__fun-fact-text">{card.funFact}</p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
