import { describe, expect, test } from "bun:test";
import { processColor, blockColor } from "@/lib/colors";

describe("processColor", () => {
  test("returns consistent color for same PID", () => {
    expect(processColor(1)).toBe(processColor(1));
  });

  test("cycles palette for different PIDs", () => {
    const colors = new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(processColor));
    expect(colors.size).toBeGreaterThan(5);
  });

  test("wraps around for PID > palette length", () => {
    expect(processColor(0)).toBe(processColor(10));
    expect(processColor(5)).toBe(processColor(15));
  });

  test("returns string starting with #", () => {
    for (let i = 0; i < 20; i++) {
      expect(processColor(i)).toMatch(/^#[0-9a-f]{6}$/);
    }
  });
});

describe("blockColor", () => {
  test("returns red for BOOT", () => {
    const block = { id: 0, type: "BOOT" as const, used: true, pid: null, fileId: null };
    expect(blockColor(block)).toBe("#e53935");
  });

  test("returns gold for SUPERBLOCK", () => {
    const block = { id: 1, type: "SUPERBLOCK" as const, used: true, pid: null, fileId: null };
    expect(blockColor(block)).toBe("#ffb300");
  });

  test("returns blue for INODE_TABLE", () => {
    const block = { id: 2, type: "INODE_TABLE" as const, used: true, pid: null, fileId: null };
    expect(blockColor(block)).toBe("#1e88e5");
  });

  test("returns bright green for used DATA", () => {
    const block = { id: 10, type: "DATA" as const, used: true, pid: null, fileId: "test.txt" };
    expect(blockColor(block)).toBe("#4caf50");
  });

  test("returns dark green for free DATA", () => {
    const block = { id: 10, type: "DATA" as const, used: false, pid: null, fileId: null };
    expect(blockColor(block)).toBe("#2d4a2d");
  });
});
