import { describe, expect, test } from "bun:test";
import { createInitialState } from "@/lib/sim";
import { exportState, importState, loadPreset } from "@/lib/presets";

describe("exportState", () => {
  test("produces valid JSON string", () => {
    const state = createInitialState();
    const json = exportState(state);
    expect(() => JSON.parse(json)).not.toThrow();
    const parsed = JSON.parse(json);
    expect(parsed.version).toBe(1);
    expect(parsed.tick).toBe(0);
    expect(parsed.processes).toBeDefined();
  });
});

describe("importState", () => {
  test("restores state from valid JSON", () => {
    const state = createInitialState();
    const json = exportState(state);
    const result = importState(json);
    expect(result.state).not.toBeNull();
    expect(result.error).toBeNull();
    expect(result.state!.tick).toBe(0);
    expect(result.state!.processes).toHaveLength(3);
  });

  test("returns error for invalid JSON string", () => {
    const result = importState("not json");
    expect(result.state).toBeNull();
    expect(result.error).toBe("Invalid JSON");
  });

  test("returns error for malformed state", () => {
    const result = importState(JSON.stringify({ foo: "bar" }));
    expect(result.state).toBeNull();
    expect(result.error).toBe("Invalid state file");
  });
});

describe("loadPreset", () => {
  test("empty preset returns clean state", () => {
    const state = createInitialState();
    const loaded = loadPreset(state, "empty");
    expect(loaded.tick).toBe(0);
    expect(loaded.processes).toHaveLength(3); // seeded processes
  });

  test("cpu-demo preset creates 6 processes with RR", () => {
    const state = createInitialState();
    const loaded = loadPreset(state, "cpu-demo");
    expect(loaded.processes.length).toBeGreaterThanOrEqual(6);
    expect(loaded.scheduler).toBe("rr");
    expect(loaded.quantum).toBe(3);
    expect(loaded.running).toBe(true);
  });

  test("memory-pressure preset allocates ~80% of frames", () => {
    const state = createInitialState();
    const loaded = loadPreset(state, "memory-pressure");
    const usedFrames = loaded.memory.frames.filter(f => f.pid !== null).length;
    expect(usedFrames).toBeGreaterThan(200); // ~80% of 256
    expect(loaded.running).toBe(true);
  });

  test("disk-frag preset has fragmented files", () => {
    const state = createInitialState();
    const loaded = loadPreset(state, "disk-frag");
    const files = loaded.disk.inodes.filter(i => i.used);
    expect(files.length).toBeGreaterThan(0);
  });

  test("deadlock preset sets up blocked processes", () => {
    const state = createInitialState();
    const loaded = loadPreset(state, "deadlock");
    const blocked = loaded.processes.filter(p => p.state === "BLOCKED");
    expect(blocked.length).toBeGreaterThanOrEqual(2);
  });
});
