import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

interface VercelConfig {
  framework?: string;
  installCommand?: string;
  buildCommand?: string;
  outputDirectory?: string;
}

describe("Vercel deployment config", () => {
  it("targets Vite static output with npm ci", () => {
    const config = JSON.parse(
      readFileSync(new URL("../vercel.json", import.meta.url), "utf8"),
    ) as VercelConfig;

    expect(config.framework).toBe("vite");
    expect(config.installCommand).toBe("npm ci");
    expect(config.buildCommand).toBe("npm run build");
    expect(config.outputDirectory).toBe("dist");
  });
});
