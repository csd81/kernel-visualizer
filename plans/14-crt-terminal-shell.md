# Phase 14 — CRT Terminal Shell

## Goal
Build the interactive terminal: green-on-black CRT aesthetic, scan-line overlay, blinking cursor, command history, typewriter output.

## Tasks

### 1. Terminal HTML structure
- In `#panel-terminal .panel-content`:
  ```html
  <div id="terminal">
    <div id="terminal-output"></div>
    <div id="terminal-input-line">
      <span id="terminal-prompt">$</span>
      <input type="text" id="terminal-input" autofocus />
    </div>
  </div>
  ```

### 2. CRT styling
- `#terminal`:
  - Background: `#0a0a0a`
  - Text: `#33ff33` (classic green)
  - Font: `'Courier New', monospace`, `font-size: 0.85rem`
  - `padding: 1rem`, `border-radius: 8px`, `height: 100%`, `overflow-y: auto`
  - `box-shadow: inset 0 0 30px rgba(0,255,0,0.05)` (inner glow)

### 3. Scan-line overlay
- Pseudo-element `#terminal::after`:
  - Fixed position overlay: `background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)`
  - `pointer-events: none` so it doesn't block input

### 4. Blinking cursor
- Use the `<input>` element's native cursor, styled: `caret-color: #33ff33`
- Or a simulated cursor if the native one is insufficient

### 5. Command input
- `<input>` captures keyboard input
- On `Enter`:
  1. Read value
  2. Echo input to terminal output: `<div class="line input"><span class="prompt">$</span> command</div>`
  3. Process command (call a `processCommand(cmd)` dispatcher — details in Phase 15)
  4. Display result: `<div class="line output">result</div>`
  5. Clear input, scroll output to bottom

### 6. Command history
- `sim.terminalHistory = []`, `historyIndex = -1`
- On `ArrowUp`: navigate back through history, populate input
- On `ArrowDown`: navigate forward
- Max history: 100 entries

### 7. Typewriter effect (optional, Phase 14 stretch)
- For long output, optionally stream characters one at a time with a 10–20ms delay
- Skip if output is very short (< 20 chars)
- Can be toggled off for performance

### 8. Clear command
- `clear`: empties `#terminal-output`

### 9. Verify
- Terminal looks like a CRT monitor: dark background, green text, subtle scan lines
- Type a command, press Enter → it echoes with `$` prompt prefix
- ArrowUp recalls previous commands
- `clear` empties the terminal
- Scroll follows new output automatically
