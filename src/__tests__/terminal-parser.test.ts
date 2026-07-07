import { describe, expect, test } from "bun:test";
import { parseCommand, addLine } from "@/lib/terminal-parser";

describe("parseCommand", () => {
  test("parses simple command", () => {
    const { cmd, args } = parseCommand("fork 10 2");
    expect(cmd).toBe("fork");
    expect(args).toEqual(["10", "2"]);
  });

  test("lowercases command", () => {
    const { cmd } = parseCommand("FORK 10 2");
    expect(cmd).toBe("fork");
  });

  test("handles whitespace", () => {
    const { cmd, args } = parseCommand("   ps   ");
    expect(cmd).toBe("ps");
    expect(args).toEqual([]);
  });

  test("returns empty for empty input", () => {
    const { cmd, args } = parseCommand("");
    expect(cmd).toBe("");
    expect(args).toEqual([]);
  });

  test("returns empty for whitespace-only", () => {
    const { cmd } = parseCommand("   ");
    expect(cmd).toBe("");
  });

  test("handles command with many args", () => {
    const { cmd, args } = parseCommand("create myfile.txt 42");
    expect(cmd).toBe("create");
    expect(args).toEqual(["myfile.txt", "42"]);
  });

  test("handles nullish/undefined", () => {
    const { cmd, args } = parseCommand("");
    expect(cmd).toBe("");
    expect(args).toEqual([]);
  });
});

describe("addLine", () => {
  test("appends line with correct type", () => {
    const output = addLine([], "hello", "info");
    expect(output).toHaveLength(1);
    expect(output[0].text).toBe("hello");
    expect(output[0].type).toBe("info");
    expect(output[0].id).toBeGreaterThan(0);
  });

  test("preserves existing lines", () => {
    const one = addLine([], "first", "info");
    const two = addLine(one, "second", "error");
    expect(two).toHaveLength(2);
  });

  test("defaults to info type", () => {
    const output = addLine([], "hello");
    expect(output[0].type).toBe("info");
  });

  test("increments IDs", () => {
    const one = addLine([], "a");
    const two = addLine(one, "b");
    expect(two[1].id).toBeGreaterThan(one[0].id);
  });
});
