import { describe, expect, test } from "bun:test";
import { createInitialState, tick, reconstructStateAt } from "@/lib/sim";

describe("createInitialState", () => {
  test("creates valid initial state", () => {
    const state = createInitialState();
    expect(state.tick).toBe(0);
    expect(state.running).toBe(false);
    expect(state.speed).toBe(500);
    expect(state.scheduler).toBe("fcfs");
    expect(state.processes).toHaveLength(3);
    expect(state.terminal.output.length).toBeGreaterThan(0);
    expect(state.memory.frames).toHaveLength(256);
    expect(state.disk.blocks).toHaveLength(128);
    expect(state.disk.inodes).toHaveLength(4);
    expect(state.deadlockedPids).toEqual([]);
    expect(state.stats.contextSwitches).toBe(0);
    expect(state.stats.pageFaults).toBe(0);
  });

  test("seeds 3 demo processes", () => {
    const state = createInitialState();
    const pids = state.processes.map(p => p.pid);
    expect(pids).toEqual([1, 2, 3]);
    expect(state.processes[0].totalTicks).toBe(10);
    expect(state.processes[1].totalTicks).toBe(8);
    expect(state.processes[2].totalTicks).toBe(15);
  });

  test("nextPid starts after seeded processes", () => {
    const state = createInitialState();
    expect(state.nextPid).toBe(4);
  });
});

describe("tick", () => {
  test("increments tick counter", () => {
    const state = createInitialState();
    const next = tick(state);
    expect(next.tick).toBe(1);
  });

  test("does not mutate original state", () => {
    const state = createInitialState();
    const next = tick(state);
    expect(state.tick).toBe(0);
    expect(next.tick).toBe(1);
    expect(next).not.toBe(state);
  });

  test("has viewTick defaulting to -1", () => {
    const state = createInitialState();
    expect(state.viewTick).toBe(-1);
  });
  test("preserves all other fields", () => {
    const state = createInitialState();
    const next = tick(state);
    expect(next.speed).toBe(state.speed);
    expect(next.scheduler).toBe(state.scheduler);
    expect(next.processes).toHaveLength(state.processes.length);
  });
});

describe("createInitialMemoryState", () => {
  test("creates 256 frames all free", () => {
    const state = createInitialState();
    const freeCount = state.memory.frames.filter(f => f.pid === null).length;
    expect(freeCount).toBe(256);
    expect(state.memory.algorithm).toBe("first-fit");
  });
});

describe("reconstructStateAt", () => {
  test("returns initial state for tick 0 with no history", () => {
    const state = createInitialState();
    const reconstructed = reconstructStateAt(state, [], 0);
    expect(reconstructed.tick).toBe(0);
    expect(reconstructed.viewTick).toBe(0);
    expect(reconstructed.running).toBe(false);
  });

  test("returns initial state for negative tick", () => {
    const state = createInitialState();
    const reconstructed = reconstructStateAt(state, [], -1);
    expect(reconstructed.viewTick).toBe(-1);
  });

  test("reconstructs a terminated process from history", () => {
    const state = createInitialState();
    const history = [
      { tick: 0, pid: 1, event: "scheduled" as const },
      { tick: 10, pid: 1, event: "terminated" as const, duration: 10 },
    ];
    const reconstructed = reconstructStateAt(state, history, 10);
    expect(reconstructed.processes.find(p => p.pid === 1)?.state).toBe("TERMINATED");
    expect(reconstructed.tick).toBe(10);
  });
});

describe("createInitialDiskState", () => {
  test("creates 128 blocks with correct types", () => {
    const state = createInitialState();
    const blocks = state.disk.blocks;
    expect(blocks).toHaveLength(128);
    expect(blocks[0].type).toBe("BOOT");
    expect(blocks[1].type).toBe("SUPERBLOCK");
    for (let i = 2; i <= 5; i++) expect(blocks[i].type).toBe("INODE_TABLE");
    for (let i = 6; i < 128; i++) expect(blocks[i].type).toBe("DATA");
  });
});
