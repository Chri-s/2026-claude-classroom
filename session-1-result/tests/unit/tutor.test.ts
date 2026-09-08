// @vitest-environment node
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, afterEach, expect, test, vi } from "vitest";

// `server-only` throws outside Next's react-server condition, so the marker is
// stubbed rather than the module under test.
vi.mock("server-only", () => ({}));

// lib/tutor.ts opens Mastra's store on import, so point it at a throwaway file
// before the import rather than at DATABASE_URL. No model call happens here.
const dir = await mkdtemp(join(tmpdir(), "ai-tutor-tutor-"));
process.env.DATABASE_URL = `file:${join(dir, "tutor.db")}`;

const tutor = await import("@/lib/tutor");
const agent = tutor.mastra.getAgent(tutor.TUTOR_AGENT_ID);

// Stand-in for a hot reload: `next dev` re-evaluates lib/tutor.ts, which
// republishes the edited prompt onto the same global slot.
const reevaluateWith = (edited: string) => {
  (globalThis as { tutorInstructions?: string }).tutorInstructions = edited;
};

afterEach(async () => {
  vi.resetModules();
  await import("@/lib/tutor");
});

afterAll(async () => {
  await rm(dir, { recursive: true, force: true });
});

test("serves the butler prompt", async () => {
  expect(await agent.getInstructions()).toContain("Bartholomew");
});

test("picks up an edited prompt without rebuilding the agent", async () => {
  reevaluateWith("You are a lighthouse keeper.");

  expect(await agent.getInstructions()).toBe("You are a lighthouse keeper.");
});

test("re-evaluating the module reuses the cached instance", async () => {
  vi.resetModules();
  const reloaded = await import("@/lib/tutor");

  // Same Mastra, so the reload neither reopened the libSQL connection nor lost
  // the agent's memory store — only the prompt above is refreshed.
  expect(reloaded.mastra).toBe(tutor.mastra);
  expect(await agent.getInstructions()).toContain("Bartholomew");
});
