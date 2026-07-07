# Phase 15 — Shell ↔ Kernel Wiring

## Goal
Wire every shell command to the real kernel subsystem. Add error handling and styled output per message type.

## Tasks

### 1. Command dispatcher
- `processCommand(input)`:
  - Trim, split on whitespace: `[cmd, ...args]`
  - Switch on `cmd`:
    - `help` → show command list
    - `fork` → `fork(parseInt(args[0]), parseInt(args[1]))`
    - `kill` → `kill(parseInt(args[0]))`
    - `alloc` → `alloc(parseInt(args[0]), parseInt(args[1]))`
    - `free` → `freeMem(parseInt(args[0]))`
    - `pfault` → `simulatePageFault(parseInt(args[0]), parseInt(args[1]))`
    - `create` → `create(args[0], parseInt(args[1]))`
    - `rm` → `rmFile(args[0])`
    - `ls` → `ls()`
    - `ps` → `ps()`
    - `df` → `df()`
    - `speed` → `setSpeed(parseInt(args[0]))`
    - `pause` → `pause()`
    - `resume` → `resume()`
    - `clear` → `clearTerminal()`
    - default → `"Unknown command: ${cmd}. Type 'help' for available commands."`

### 2. Output styling
- Each terminal output line gets a CSS class:
  - `.line.info` — white text (default output)
  - `.line.success` — green text (command succeeded, e.g. "Created PID 5")
  - `.line.error` — red text (errors, e.g. "Error: unknown PID")
  - `.line.warning` — yellow text (warnings, e.g. "Memory pressure high")
- Format all kernel function return values into these styled lines

### 3. `help` command
- Print formatted list of all commands:
  ```
  Available commands:
    fork <ticks> <priority>  — Create a process
    kill <pid>               — Terminate a process
    ...
  ```

### 4. Error handling
- Every kernel function validates its inputs:
  - Missing/invalid args → `"Usage: fork <ticks> <priority>"`
  - Bad PID → `"Error: unknown PID ${pid}"`
  - Out of memory → `"Error: insufficient memory"`
  - Disk full → `"Error: disk full"`
  - File exists → `"Error: ${fileName} already exists"`
- Catch and display any unexpected exceptions

### 5. Input sanitisation
- Non-numeric args to numeric fields → show usage error, not crash
- Whitespace trimming
- Max command length: 200 chars

### 6. Verify
- Every command from the help list works end-to-end
- `fork abc` → usage error
- `kill 9999` → "unknown PID"
- `alloc 1 500` → "insufficient memory" (if > 256 KB)
- Output is colour-coded: green for success, red for errors
