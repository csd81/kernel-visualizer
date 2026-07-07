export type BlockType = "BOOT" | "SUPERBLOCK" | "INODE_TABLE" | "DATA";

export interface DiskBlock {
  id: number;
  type: BlockType;
  used: boolean;
  pid: number | null;
  fileId: string | null;
}

export interface INode {
  id: number;
  used: boolean;
  fileName: string | null;
  size: number;
  blocks: number[];
  pid: number | null;
}

export interface DiskState {
  blocks: DiskBlock[];
  inodes: INode[];
}
