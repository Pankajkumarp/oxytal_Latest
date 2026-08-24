"use client";

import { useEffect, useReducer, useRef } from "react";
import type { Dispatch } from "react";
import { Bricolage_Grotesque, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { cx } from "@/app/lib/cx";
import styles from "./AIPipelineDemo.module.css";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-bricolage",
});
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
});
const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-sans",
});

type StageAgent = "agent" | "human";

interface StageDef {
  name: string;
  sub: string;
  agent: StageAgent;
  ms: number;
  log: string[];
}

/**
 * Static content, verbatim from `Refrence/oxytal-ai-section.html`'s own
 * `STAGES` array — this demo panel isn't Contentful-driven, per the
 * request this was built for ("static data, same animation, same work").
 */
const STAGES: StageDef[] = [
  {
    name: "Requirement intake parsed",
    sub: "Tickets, email and spec docs normalised",
    agent: "agent",
    ms: 1500,
    log: ["intake.parse — 43 items ingested", "classifier — 41 routed, 2 flagged"],
  },
  {
    name: "Architecture & test plan drafted",
    sub: "Against your existing service topology",
    agent: "agent",
    ms: 1700,
    log: ["plan.draft — 6 components mapped", "tests.plan — 248 cases proposed"],
  },
  {
    name: "Implementation generated",
    sub: "Reviewed against your coding standards",
    agent: "agent",
    ms: 1900,
    log: ["codegen — 14 files, 1,206 lines", "lint + typecheck — clean"],
  },
  {
    name: "Security & compliance scan",
    sub: "SAST, dependency and licence checks",
    agent: "agent",
    ms: 1500,
    log: ["sast — 0 high, 2 low", "deps — no known CVEs"],
  },
  {
    name: "Release approval",
    sub: "Pipeline holds here until a person decides",
    agent: "human",
    ms: 0,
    log: [],
  },
  {
    name: "Deploy to production",
    sub: "Blue-green, automatic rollback armed",
    agent: "agent",
    ms: 1600,
    log: ["deploy — blue/green cutover", "healthcheck — 200 OK across 4 nodes"],
  },
  {
    name: "Audit record sealed",
    sub: "Immutable, exportable, timestamped",
    agent: "agent",
    ms: 1200,
    log: ["audit — 38 actions signed"],
  },
];

const MODELS = ["Claude", "GPT", "Gemini"] as const;

interface StageRuntime {
  on: boolean;
  done: boolean;
  gate: boolean;
  gateWait: boolean;
}

const IDLE_STAGE: StageRuntime = { on: false, done: false, gate: false, gateWait: false };

interface LogLine {
  id: number;
  t: string;
  text: string;
  cls?: "h" | "d";
}

interface PipelineState {
  model: string;
  stages: StageRuntime[];
  logs: LogLine[];
  steps: number;
  decisions: number;
  elapsedText: string;
  running: boolean;
}

function createInitialState(): PipelineState {
  return {
    model: MODELS[0],
    stages: STAGES.map(() => IDLE_STAGE),
    logs: [],
    steps: 0,
    decisions: 0,
    elapsedText: "0.0s",
    running: false,
  };
}

type PipelineAction =
  | { type: "reset" }
  | { type: "start" }
  | { type: "stop" }
  | { type: "tick"; elapsedText: string }
  | { type: "stagePatch"; index: number; patch: Partial<StageRuntime> }
  | { type: "log"; line: LogLine }
  | { type: "stepDone" }
  | { type: "decision" }
  | { type: "model"; model: string }
  | { type: "finished" };

/**
 * Pure state transitions for the pipeline — every field the panel
 * renders from lives here, updated through one `dispatch` call per
 * event (see `createPipelineEngine` below for what actually drives
 * those dispatches). Kept as a single reducer rather than several
 * independent `useState`s specifically so each event is one state
 * update instead of several back-to-back ones.
 */
function pipelineReducer(state: PipelineState, action: PipelineAction): PipelineState {
  switch (action.type) {
    case "reset":
      return { ...createInitialState(), model: state.model };
    case "start":
      return { ...state, running: true };
    case "stop":
      return { ...state, running: false };
    case "tick":
      return { ...state, elapsedText: action.elapsedText };
    case "stagePatch":
      return {
        ...state,
        stages: state.stages.map((s, i) => (i === action.index ? { ...s, ...action.patch } : s)),
      };
    case "log": {
      const logs = [...state.logs, action.line];
      return { ...state, logs: logs.length > 9 ? logs.slice(logs.length - 9) : logs };
    }
    case "stepDone":
      return { ...state, steps: state.steps + 1 };
    case "decision":
      return { ...state, decisions: state.decisions + 1 };
    case "model":
      return { ...state, model: action.model };
    case "finished":
      return {
        model: state.model,
        stages: STAGES.map((s) => ({ on: false, done: true, gate: s.agent === "human", gateWait: false })),
        logs: [
          "intake.parse — 43 items ingested",
          "plan.draft — 6 components mapped",
          "codegen — 14 files, 1,206 lines",
          "sast — 0 high, 2 low",
          "approved by you — Claude on your keys",
          "deploy — blue/green cutover",
          "audit — 38 actions signed",
        ].map((text, i) => ({
          id: i,
          t: (1.4 * (i + 1)).toFixed(1),
          text,
          cls: i === 4 ? ("h" as const) : undefined,
        })),
        steps: 6,
        decisions: 1,
        elapsedText: "9.4s",
        running: false,
      };
    default:
      return state;
  }
}

/**
 * Everything time-based (timers, the elapsed-time interval, `performance
 * .now()` timestamps) lives here instead of in the component itself —
 * this is a plain factory function, not a component or hook, so React's
 * "components and hooks must be pure" rule (which flags calls to
 * impure APIs like `performance.now` written directly in a component)
 * doesn't apply to it. It only ever talks back to React through the
 * `dispatch` it's given; the reducer above stays the single source of
 * truth for everything rendered.
 */
function createPipelineEngine(dispatch: Dispatch<PipelineAction>) {
  let model: string = MODELS[0];
  let t0 = 0;
  let logId = 0;
  let timers: ReturnType<typeof setTimeout>[] = [];
  let tick: ReturnType<typeof setInterval> | null = null;

  function log(text: string, cls?: "h" | "d") {
    const t = ((performance.now() - t0) / 1000).toFixed(1);
    dispatch({ type: "log", line: { id: logId++, t, text, cls } });
  }

  function clearTimers() {
    timers.forEach(clearTimeout);
    timers = [];
    if (tick) {
      clearInterval(tick);
      tick = null;
    }
  }

  function runFrom(i: number) {
    if (i >= STAGES.length) {
      clearTimers();
      dispatch({ type: "stop" });
      log("pipeline complete", "d");
      return;
    }

    const stage = STAGES[i];

    if (stage.agent === "human") {
      dispatch({ type: "stagePatch", index: i, patch: { on: true, gate: true, gateWait: true } });
      log("gate — awaiting human approval", "h");
      return; // Waits for approve()/reject() below.
    }

    dispatch({ type: "stagePatch", index: i, patch: { on: true } });

    stage.log.forEach((line, k) => {
      const delay = (stage.ms * (k + 1)) / (stage.log.length + 1);
      timers.push(
        setTimeout(() => {
          log(line.includes("codegen") ? line.replace("codegen", `codegen (${model})`) : line);
        }, delay)
      );
    });

    timers.push(
      setTimeout(() => {
        dispatch({ type: "stagePatch", index: i, patch: { on: false, done: true } });
        dispatch({ type: "stepDone" });
        runFrom(i + 1);
      }, stage.ms)
    );
  }

  function startClock() {
    t0 = performance.now();
    dispatch({ type: "start" });
    tick = setInterval(() => {
      dispatch({ type: "tick", elapsedText: ((performance.now() - t0) / 1000).toFixed(1) + "s" });
    }, 100);
  }

  function start() {
    startClock();
    runFrom(0);
  }

  function reset() {
    clearTimers();
    dispatch({ type: "reset" });
  }

  return {
    start,
    reset,
    approve(i: number) {
      dispatch({ type: "stagePatch", index: i, patch: { gateWait: false, done: true } });
      dispatch({ type: "decision" });
      log(`approved by you — ${model} on your keys`, "h");
      runFrom(i + 1);
    },
    reject(i: number) {
      dispatch({ type: "stagePatch", index: i, patch: { gateWait: false } });
      log("changes requested — returned to build", "h");
      if (tick) {
        clearInterval(tick);
        tick = null;
      }
      dispatch({ type: "stop" });
      timers.push(
        setTimeout(() => {
          reset();
          start();
        }, 1400)
      );
    },
    setModel(name: string) {
      model = name;
      dispatch({ type: "model", model: name });
      log(`model switched to ${name} — same keys, same tenancy`);
    },
    finished() {
      dispatch({ type: "finished" });
    },
    destroy() {
      clearTimers();
    },
  };
}

/** The reference's own inline SVG check mark, ported 1:1. */
function CheckIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

/** The reference's own inline SVG "hand" icon (the human-decision mark), ported 1:1. */
function HandIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0116 0z" />
    </svg>
  );
}

/**
 * The "Forge · delivery pipeline" live demo panel from
 * `Refrence/oxytal-ai-section.html` — a self-running, entirely static
 * (non-Contentful) simulation of an agentic delivery pipeline, appended
 * as-is at the bottom of `HomeAI` per the request this was built for.
 * `HomeAI`'s own Contentful-driven intro/groups/proof/footer are
 * untouched; this component owns nothing above it.
 *
 * Ported faithfully rather than rebuilt in Tailwind (see
 * `AIPipelineDemo.module.css`'s own doc comment) — same behavior as the
 * reference's vanilla-JS version:
 *
 * - 7 stages run in sequence, each either "agent" (auto-completes after
 *   its own duration, dropping a couple of audit-log lines partway
 *   through) or "human" (a gate that pauses the whole pipeline — pulsing
 *   amber — until "Approve release" or "Request changes" is clicked)
 * - the model chips (Claude/GPT/Gemini) just relabel future "codegen"
 *   log lines and log the switch itself; they don't change timing
 * - "Replay" resets every stage/log/counter and restarts from stage 0
 * - "Request changes" logs the rejection, pauses ~1.4s, then auto-resets
 *   and restarts the whole run (same as the reference)
 * - the whole thing only starts once the panel is actually scrolled into
 *   view (an `IntersectionObserver`, `threshold: 0.3`, exactly like the
 *   reference), and under `prefers-reduced-motion` it never animates at
 *   all — it jumps straight to a fixed "finished" resting state (all
 *   stages done, a fixed audit trail, "9.4s" elapsed) instead
 */
export default function AIPipelineDemo() {
  const [state, dispatch] = useReducer(pipelineReducer, undefined, createInitialState);
  const demoRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<ReturnType<typeof createPipelineEngine> | null>(null);

  if (engineRef.current === null) {
    engineRef.current = createPipelineEngine(dispatch);
  }
  const engine = engineRef.current;

  /* =========================================================
     Starts once the panel actually scrolls into view (same
     IntersectionObserver + threshold as the reference), unless
     prefers-reduced-motion — then it jumps straight to the fixed
     resting state and never animates.
  ========================================================= */
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      engine.finished();
      return;
    }

    if (!demoRef.current || typeof IntersectionObserver === "undefined") {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          observer.disconnect();
          engine.start();
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(demoRef.current);

    return () => {
      observer.disconnect();
      engine.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once on mount, same as the reference's own IIFE; `engine` is a stable ref.
  }, []);

  const { model, stages, logs, steps, decisions, elapsedText, running } = state;

  return (
    <div
      ref={demoRef}
      className={cx(
        styles.demo,
        bricolage.variable,
        plexMono.variable,
        plexSans.variable,
        running && styles.running
      )}
    >
      <div className={styles.bar}>
        <span className={styles.title}>
          <span className={styles.dot} />
          Forge · delivery pipeline
        </span>
        <span className={styles.spacer} />
        <span className={styles.models}>
          <span className={styles.lbl}>Model</span>
          {MODELS.map((m) => (
            <button
              key={m}
              type="button"
              className={cx(styles.chip, model === m && styles.chipActive)}
              aria-pressed={model === m}
              onClick={() => engine.setModel(m)}
            >
              {m}
            </button>
          ))}
        </span>
        <button
          type="button"
          className={styles.replay}
          onClick={() => {
            engine.reset();
            engine.start();
          }}
        >
          Replay
        </button>
      </div>

      <div className={styles.split}>
        <div className={styles.rail}>
          {STAGES.map((stage, i) => {
            const runtime = stages[i];

            return (
              <div
                key={stage.name}
                className={cx(
                  styles.stage,
                  runtime.on && styles.stageOn,
                  runtime.done && styles.stageDone,
                  runtime.gate && styles.stageGate,
                  runtime.gateWait && styles.stageGateWait
                )}
              >
                <div className={styles.mark}>
                  {stage.agent === "human" ? (
                    <HandIcon />
                  ) : (
                    <>
                      <span className={styles.spin} />
                      <CheckIcon />
                    </>
                  )}
                </div>
                <div>
                  <div className={styles.name}>{stage.name}</div>
                  <div className={styles.sub}>{stage.sub}</div>
                </div>
                <span className={styles.tag}>{stage.agent === "human" ? "You" : "Agent"}</span>

                {stage.agent === "human" && (
                  <div className={styles.decide} hidden={!runtime.gateWait}>
                    <button
                      type="button"
                      className={cx(styles.btn, styles.btnGo)}
                      onClick={() => engine.approve(i)}
                    >
                      Approve release
                    </button>
                    <button
                      type="button"
                      className={cx(styles.btn, styles.btnNo)}
                      onClick={() => engine.reject(i)}
                    >
                      Request changes
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <aside className={styles.log}>
          <h4>Audit trail</h4>
          <div className={styles.lines}>
            {logs.map((l) => (
              <div
                key={l.id}
                className={cx(
                  styles.line,
                  l.cls === "h" && styles.lineHuman,
                  l.cls === "d" && styles.lineDone
                )}
              >
                <span className={styles.t}>{l.t}s</span>
                <span>{l.text}</span>
              </div>
            ))}
          </div>
          <div className={styles.tally}>
            <div>
              <div className={styles.n}>{steps}</div>
              <div className={styles.k}>Steps automated</div>
            </div>
            <div className={styles.tallyHuman}>
              <div className={styles.n}>{decisions}</div>
              <div className={styles.k}>Your decisions</div>
            </div>
            <div>
              <div className={styles.n}>{elapsedText}</div>
              <div className={styles.k}>Elapsed</div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
