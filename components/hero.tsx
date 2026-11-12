"use client";

import { useEffect, useReducer } from "react";
import {
  heroModes,
  serviceNames,
  servicePaths,
  type Interest,
  type Mode,
} from "@/lib/site-config";
import Link from "next/link";
import { track } from "@/lib/analytics";
import { Arrow } from "./icons";
import { useEnquiry } from "./enquiry-provider";

import {
  heroSequence as sequence,
  heroCanRotate,
  heroReducer,
  initialHeroState,
} from "@/lib/hero-machine";
export function Hero({
  onInterest,
}: {
  onInterest: (value: Interest) => void;
}) {
  const { heroPreference, setHeroPreference } = useEnquiry();
  const [state, dispatch] = useReducer(
    heroReducer,
    heroPreference,
    initialHeroState,
  );
  const { mode } = state;
  const running = state.intent === "running" && state.motion !== "unresolved";
  const reduced = state.motion !== "standard";
  const rotating = heroCanRotate(state);
  const content = heroModes[mode === "X" ? "AI" : mode];
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => dispatch({ type: "MOTION", reduced: media.matches });
    change();
    media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
  }, []);
  useEffect(() => {
    if (!rotating) return;
    const timer = window.setInterval(() => dispatch({ type: "TICK" }), 3900);
    return () => clearInterval(timer);
  }, [rotating]);
  const select = (next: Mode) => {
    dispatch({ type: "SELECT", mode: next });
    setHeroPreference({ mode: next, paused: true });
    onInterest(heroModes[next].interest as Interest);
  };
  return (
    <section className="hero container" aria-labelledby="hero-heading">
      <div className="hero-eyebrow">
        <p className="eyebrow">
          <span className="status-dot" /> AI DEVELOPMENT. LEARNING. DEVELOPER
          SOURCING.
        </p>
        <span className="hero-location">
          Independent expertise. Remote delivery.
        </span>
      </div>
      <h1 id="hero-heading" className="sr-only">
        BuildMyX: AI development, education and career support, and developer
        sourcing.
      </h1>
      <div
        className="hero-wordmark"
        aria-hidden="true"
        data-reduced-motion={reduced}
      >
        <span className="fixed-word">BuildMy</span>
        <span className="suffix-stage">
          <span className="suffix-reserve">Career</span>
          {sequence.map((word) => (
            <span
              key={word}
              className={`suffix ${mode === word ? "is-active" : ""}`}
            >
              {word}
              <span className="suffix-period">.</span>
            </span>
          ))}
        </span>
      </div>
      <div
        className="hero-controls"
        onMouseEnter={() => dispatch({ type: "HOVER", value: true })}
        onMouseLeave={() => dispatch({ type: "HOVER", value: false })}
        onFocus={() => dispatch({ type: "FOCUS", value: true })}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node))
            dispatch({ type: "FOCUS", value: false });
        }}
      >
        <div
          className="mode-buttons"
          role="group"
          aria-label="Choose a service"
        >
          {(["AI", "Career", "Team"] as Mode[]).map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={mode === item}
              onClick={() => select(item)}
            >
              <span className="mode-dot" />
              {item}
            </button>
          ))}
        </div>
        <p className="suffix-explanation">
          The X changes with what you want to build.
        </p>
        <button
          type="button"
          className="rotation-control"
          aria-label={running ? "Pause word rotation" : "Resume word rotation"}
          onClick={() => {
            const next = heroReducer(state, { type: "TOGGLE" });
            dispatch({ type: "TOGGLE" });
            setHeroPreference({ mode, paused: next.intent === "paused" });
          }}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            aria-hidden="true"
          >
            {running ? (
              <path d="M4 2v8m4-8v8" stroke="currentColor" strokeWidth="1.2" />
            ) : (
              <path d="m3 1 8 5-8 5V1Z" stroke="currentColor" strokeWidth="1" />
            )}
          </svg>
          {running ? "Pause" : "Resume"}
        </button>
      </div>
      <div className="hero-bottom">
        <div className="hero-pitch">
          <p className="hero-support">{content.sentence}</p>
          <a
            className="button"
            href="#enquire"
            onMouseEnter={() => dispatch({ type: "HOVER", value: true })}
            onMouseLeave={() => dispatch({ type: "HOVER", value: false })}
            onFocus={() => dispatch({ type: "FOCUS", value: true })}
            onBlur={() => dispatch({ type: "FOCUS", value: false })}
            onClick={() => {
              dispatch({ type: "PAUSE" });
              setHeroPreference({ mode, paused: true });
              onInterest(content.interest as Interest);
              track("cta_click", {
                interest: content.interest as Interest,
                placement: "hero",
              });
            }}
          >
            {content.cta}
            <Arrow diagonal />
          </a>
          <Link
            className="text-link hero-detail-link"
            href={
              mode === "X" || mode === "AI"
                ? "/projects/reporting-pipeline/"
                : servicePaths[mode]
            }
            onMouseEnter={() => dispatch({ type: "HOVER", value: true })}
            onMouseLeave={() => dispatch({ type: "HOVER", value: false })}
            onFocus={() => dispatch({ type: "FOCUS", value: true })}
            onBlur={() => dispatch({ type: "FOCUS", value: false })}
          >
            {mode === "Career"
              ? "Explore future learning"
              : mode === "Team"
                ? "How developer sourcing works"
                : "Try a working reporting example"}
            <Arrow />
          </Link>
        </div>
        <div className="hero-intro">
          <span className="small-label">ONE NAME. THREE WAYS TO BUILD.</span>
          <p>
            We build AI tools for businesses, help people grow in data and AI,
            and connect teams with developers.
          </p>
          <nav className="hero-directory" aria-label="Explore our services">
            {(["AI", "Career", "Team"] as Mode[]).map((item) => (
              <Link href={servicePaths[item]} key={item}>
                <strong>{serviceNames[item]}</strong>
                <span>
                  {item === "AI"
                    ? "For your business"
                    : item === "Career"
                      ? "For your next step"
                      : "For your team"}
                </span>
                <Arrow />
              </Link>
            ))}
          </nav>
        </div>
      </div>
      <div className="hero-index">
        <span>GOOD WORK STARTS WITH A CLEAR GOAL.</span>
        <a href="#services">
          EXPLORE WHAT WE DO <Arrow className="arrow-down" />
        </a>
      </div>
    </section>
  );
}
