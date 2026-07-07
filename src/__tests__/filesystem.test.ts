import { describe, expect, test } from "bun:test";
import { createInitialDiskState } from "@/lib/sim";
import { createFile, deleteFile, ls, df, diskFragPct, BLOCK_SIZE } from "@/lib/filesystem";

describe("createFile", () => {
  test("creates a file with specified blocks", () => {
    const disk = createInitialDiskState();
    const { disk: next, message } = createFile(disk, "test.txt", 5);
    expect(message).toContain("Created 'test.txt'");
    expect(message).toContain("5 blocks");
    const inode = next.inodes.find(i => i.fileName === "test.txt");
    expect(inode).toBeDefined();
    expect(inode?.blocks).toHaveLength(5);
    expect(inode?.size).toBe(5 * BLOCK_SIZE);
  });

  test("allocates data blocks on disk", () => {
    const disk = createInitialDiskState();
    const { disk: next } = createFile(disk, "test.txt", 5);
    const fileBlocks = next.blocks.filter(b => b.fileId === "test.txt");
    expect(fileBlocks).toHaveLength(5);
    fileBlocks.forEach(b => expect(b.used).toBe(true));
  });

  test("fails for duplicate filename", () => {
    const disk = createInitialDiskState();
    const { disk: after } = createFile(disk, "test.txt", 3);
    const { message } = createFile(after, "test.txt", 3);
    expect(message).toContain("already exists");
  });

  test("fails when disk is full", () => {
    const disk = createInitialDiskState();
    const { message } = createFile(disk, "big.txt", 200);
    expect(message).toContain("disk full");
  });

  test("fails with empty filename", () => {
    const disk = createInitialDiskState();
    const { message } = createFile(disk, "", 3);
    expect(message).toContain("invalid filename");
  });

  test("fails when all inodes used", () => {
    let disk = createInitialDiskState();
    disk = createFile(disk, "a.txt", 1).disk;
    disk = createFile(disk, "b.txt", 1).disk;
    disk = createFile(disk, "c.txt", 1).disk;
    disk = createFile(disk, "d.txt", 1).disk;
    const { message } = createFile(disk, "e.txt", 1);
    expect(message).toContain("no free inodes");
  });
});

describe("deleteFile", () => {
  test("removes a file and frees its blocks", () => {
    let disk = createInitialDiskState();
    disk = createFile(disk, "test.txt", 5).disk;
    const { disk: next, message } = deleteFile(disk, "test.txt");
    expect(message).toContain("Deleted 'test.txt'");
    expect(message).toContain("5 blocks");
    // Find the inode by id (fileName is nulled after delete)
    const inode = next.inodes[0];
    expect(inode.used).toBe(false);
    expect(inode.fileName).toBeNull();
    // Blocks should be freed
    const fileBlocks = next.blocks.filter(b => b.fileId === "test.txt");
    expect(fileBlocks).toHaveLength(0);
  });

  test("fails for non-existent file", () => {
    const disk = createInitialDiskState();
    const { message } = deleteFile(disk, "nonexistent.txt");
    expect(message).toContain("not found");
  });
});

describe("ls", () => {
  test("returns 'No files.' for empty disk", () => {
    const disk = createInitialDiskState();
    expect(ls(disk)).toBe("No files.");
  });

  test("lists created files", () => {
    let disk = createInitialDiskState();
    disk = createFile(disk, "a.txt", 3).disk;
    disk = createFile(disk, "b.txt", 5).disk;
    const output = ls(disk);
    expect(output).toContain("a.txt");
    expect(output).toContain("b.txt");
    expect(output).toContain("size=");
  });
});

describe("df", () => {
  test("shows disk usage stats", () => {
    const disk = createInitialDiskState();
    const output = df(disk);
    expect(output).toContain("0/122");
    expect(output).toContain("0%");
  });

  test("shows used blocks after file creation", () => {
    let disk = createInitialDiskState();
    disk = createFile(disk, "test.txt", 10).disk;
    const output = df(disk);
    expect(output).toContain("10/122");
  });
});

describe("diskFragPct", () => {
  test("returns 0 for clean disk", () => {
    const disk = createInitialDiskState();
    expect(diskFragPct(disk.blocks)).toBe(0);
  });

  test("increases after creates and deletes", () => {
    let disk = createInitialDiskState();
    disk = createFile(disk, "a.txt", 10).disk;
    disk = createFile(disk, "b.txt", 15).disk;
    disk = deleteFile(disk, "a.txt").disk;
    disk = createFile(disk, "c.txt", 8).disk;
    const result = diskFragPct(disk.blocks);
    expect(result).toBeGreaterThan(0);
  });
});
