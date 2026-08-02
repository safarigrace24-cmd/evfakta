import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";

const ROOT = join(process.cwd());

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (
      name === "node_modules" ||
      name === ".next" ||
      name === ".git" ||
      name === "agent-transcripts"
    ) {
      continue;
    }
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (/\.(tsx?|jsx?|mjs|cjs)$/.test(name)) out.push(full);
  }
  return out;
}

describe("Secret exposure guards", () => {
  it("does not reference server AI/NOBIL keys in client components", () => {
    const clientRoots = [
      join(ROOT, "components"),
      join(ROOT, "app"),
    ];
    const forbidden = ["NOBIL_API_KEY", "GOOGLE_AI_API_KEY", "OPENAI_API_KEY"];
    const offenders: string[] = [];

    for (const root of clientRoots) {
      for (const file of walk(root)) {
        const text = readFileSync(file, "utf8");
        // Server modules and route handlers may reference server env names.
        if (
          file.includes("/api/") ||
          file.endsWith("page.tsx") ||
          file.endsWith("layout.tsx") ||
          file.endsWith("route.ts") ||
          text.includes('"use server"') ||
          text.includes("server-only")
        ) {
          // page.tsx for ladekart is server component — OK to mention config absence
          // but must not embed actual secret values (covered below).
          if (file.includes("/components/") && text.includes('"use client"')) {
            for (const key of forbidden) {
              if (text.includes(key)) offenders.push(`${file} :: ${key}`);
            }
          }
          continue;
        }
        if (text.includes('"use client"')) {
          for (const key of forbidden) {
            if (text.includes(key)) offenders.push(`${file} :: ${key}`);
          }
        }
      }
    }

    assert.deepEqual(offenders, []);
  });

  it("keeps Maps key as NEXT_PUBLIC only for maps loader", () => {
    const mapClient = readFileSync(
      join(ROOT, "components/charging/charging-map-client.tsx"),
      "utf8",
    );
    assert.equal(mapClient.includes("NOBIL_API_KEY"), false);
    assert.equal(mapClient.includes("GOOGLE_AI_API_KEY"), false);
    assert.equal(mapClient.includes("OPENAI_API_KEY"), false);
    assert.equal(mapClient.includes("process.env.NOBIL"), false);
  });

  it(".gitignore ignores .env.local", () => {
    const gitignore = readFileSync(join(ROOT, ".gitignore"), "utf8");
    assert.match(gitignore, /^\.env\.local$/m);
  });

  it(".env.local.example has placeholders only", () => {
    const example = readFileSync(join(ROOT, ".env.local.example"), "utf8");
    assert.match(example, /GOOGLE_AI_API_KEY=/);
    assert.match(example, /OPENAI_API_KEY=/);
    assert.match(example, /NOBIL_API_KEY=/);
    assert.match(example, /NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=/);
    assert.match(example, /GOOGLE_AI_IMAGES_ENABLED=false/);
    assert.match(example, /GOOGLE_AI_TEXT_ENABLED=false/);
    assert.match(example, /CHARGING_MAP_ENABLED=false/);
    assert.doesNotMatch(example, /AIza[0-9A-Za-z_-]{10,}/);
    assert.doesNotMatch(example, /sk-[a-zA-Z0-9]{10,}/);
  });
});
