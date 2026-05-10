import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { theme, fonts } from "../theme";
import { SceneChrome } from "../components/SceneChrome";

const NODES = [
  { id: "n1", x: 180, y: 360, label: "fetch_metrics" },
  { id: "n2", x: 420, y: 240, label: "compile_plan" },
  { id: "n3", x: 420, y: 480, label: "spawn_sandbox" },
  { id: "n4", x: 680, y: 360, label: "run_canary" },
  { id: "n5", x: 940, y: 240, label: "verify_p95" },
  { id: "n6", x: 940, y: 480, label: "rollout_50" },
  { id: "n7", x: 1200, y: 360, label: "ship_v2" },
];

const EDGES: [string, string][] = [
  ["n1", "n2"], ["n1", "n3"], ["n2", "n4"], ["n3", "n4"],
  ["n4", "n5"], ["n4", "n6"], ["n5", "n7"], ["n6", "n7"],
];

const LOG = [
  "TASK_STARTED · fetch_metrics",
  "COMMAND_EXECUTED · compile_plan",
  "SANDBOX_SPAWNED · session_4f7a",
  "TASK_STARTED · run_canary",
  "BUILD_COMPLETED · verify_p95",
  "STATE_PROJECTED · rollout_50",
];

const idMap = Object.fromEntries(NODES.map((n) => [n.id, n]));

export const S5DAG = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const activeNode = Math.min(NODES.length, Math.floor(frame / 12));

  return (
    <SceneChrome
      act="ACT 03 / EXECUTION"
      title="Sandbox DAG executes and emits receipts"
      subtitle="Live event stream confirms deterministic completion"
      progress={0.71}
    >
      <AbsoluteFill style={{ background: theme.bg, padding: "90px 60px 130px 60px" }}>
        <div style={{ display: "flex", gap: 24, height: "100%" }}>
          <div style={{ flex: 1, position: "relative", border: `1px solid ${theme.border}`, background: theme.panel }}>
            <div style={{ position: "absolute", top: 18, left: 22, fontFamily: fonts.mono, fontSize: 12, color: theme.dim, letterSpacing: "0.16em" }}>
              EXECUTION_GRAPH · pricing-v2
            </div>
            <svg width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
              {EDGES.map(([a, b], i) => {
                const A = idMap[a], B = idMap[b];
                const prog = interpolate(frame, [10 + i * 6, 30 + i * 6], [0, 1], { extrapolateRight: "clamp" });
                const dash = 400;
                return (
                  <line
                    key={i}
                    x1={A.x} y1={A.y} x2={B.x} y2={B.y}
                    stroke={theme.violet}
                    strokeOpacity={0.6}
                    strokeWidth={1.5}
                    strokeDasharray={dash}
                    strokeDashoffset={dash * (1 - prog)}
                  />
                );
              })}
            </svg>
            {NODES.map((n, i) => {
              const inProg = spring({ frame: frame - i * 8, fps, config: { damping: 200 } });
              const status = i < activeNode ? "DONE" : i === activeNode ? "RUNNING" : "PENDING";
              const bg = status === "DONE" ? "rgba(0,212,255,0.10)" : status === "RUNNING" ? "rgba(124,92,255,0.18)" : "rgba(0,0,0,0.45)";
              const stroke = status === "DONE" ? theme.cyan : status === "RUNNING" ? theme.violet : theme.border;
              return (
                <div
                  key={n.id}
                  style={{
                    position: "absolute",
                    left: n.x - 85,
                    top: n.y - 28,
                    width: 170,
                    opacity: inProg,
                    background: bg,
                    border: `1px solid ${stroke}`,
                    padding: "10px 12px",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontFamily: fonts.mono, fontSize: 11, color: theme.text }}>
                    {n.label}
                  </div>
                  <div style={{ fontFamily: fonts.mono, fontSize: 9, color: status === "RUNNING" ? theme.violet : status === "DONE" ? theme.cyan : theme.dim, letterSpacing: "0.16em", marginTop: 4 }}>
                    ● {status}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ width: 380, border: `1px solid ${theme.border}`, background: theme.panel, padding: 22 }}>
            <div style={{ fontFamily: fonts.mono, fontSize: 12, color: theme.dim, letterSpacing: "0.16em", marginBottom: 16 }}>
              EVENT_LOG · live
            </div>
            {LOG.map((l, i) => {
              const inProg = spring({ frame: frame - 10 - i * 12, fps, config: { damping: 200 } });
              return (
                <div
                  key={i}
                  style={{
                    opacity: inProg,
                    transform: `translateY(${(1 - inProg) * 6}px)`,
                    fontFamily: fonts.mono,
                    fontSize: 11,
                    color: theme.text,
                    borderLeft: `2px solid ${theme.violet}`,
                    background: "rgba(0,0,0,0.4)",
                    padding: "8px 10px",
                    marginBottom: 6,
                  }}
                >
                  <div style={{ color: theme.dim, fontSize: 9 }}>seq #{231 + i}</div>
                  {l}
                </div>
              );
            })}
          </div>
        </div>
      </AbsoluteFill>
    </SceneChrome>
  );
};
