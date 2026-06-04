import { useMemo } from "react";
import { CanvasSmokeScene } from "./CanvasSmokeScene";
import { useHarnessStore } from "../state/harnessStore";

export function App() {
  const environment = useHarnessStore((state) => state.environment);
  const checks = useMemo(
    () => [
      ["React", "mounted"],
      ["Zustand", environment],
      ["PixiJS", "declarative scene"],
      ["Vercel", "static build"],
    ],
    [environment],
  );

  return (
    <main className="app-shell">
      <section className="workspace" aria-labelledby="workspace-title">
        <div className="workspace__copy">
          <p className="workspace__label">LoreCanvas F-00</p>
          <h1 id="workspace-title">Theatrical VTT Engine Harness</h1>
          <p className="workspace__summary">
            React, Zustand, PixiJS, Vitest, and Vercel are wired for the first
            production deployable baseline.
          </p>
          <dl className="status-grid" aria-label="Environment status">
            {checks.map(([label, value]) => (
              <div className="status-grid__item" key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <CanvasSmokeScene />
      </section>
    </main>
  );
}
