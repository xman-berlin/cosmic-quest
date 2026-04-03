# AGENTS.md — Cosmic Quest

## Project Overview

A Zack McKracken-style point-and-click space adventure game built with **Phaser 3**, **TypeScript**, and **Vite**.

## Commands

### Development

```bash
npm install          # Install dependencies
npm run dev          # Start Vite dev server (http://localhost:5173)
```

### Build

```bash
npx vite build       # Production build → dist/
npx vite preview     # Preview production build locally
```

### Testing

No test framework is configured yet. When adding tests, prefer **Vitest** (integrates with Vite):

```bash
npm install -D vitest
npx vitest           # Run all tests
npx vitest path/to/file.test.ts  # Run a single test file
npx vitest --ui      # Interactive UI mode
```

### Type Checking

```bash
npx tsc --noEmit     # Type-check without emitting files
```

## Code Style

### TypeScript

- **Strict mode** enabled (`strict: true` in tsconfig.json)
- **Module system**: `nodenext` with `verbatimModuleSyntax`
- **Indexed access**: `noUncheckedIndexedAccess` — always handle `undefined`
- **Optional properties**: `exactOptionalPropertyTypes` — `undefined` is not assignable to optional props
- **JSX**: `react-jsx` (configured but not currently used)

### Imports

- Use ES module syntax (`import`/`export`)
- `isolatedModules: true` — every file must be a valid module
- Group imports: external libraries → internal modules → relative imports
- Use `type` imports for type-only imports: `import type { Foo } from './foo'`

### Naming Conventions

| Kind | Convention | Example |
|------|-----------|---------|
| Classes | PascalCase | `BootScene`, `RoomManager` |
| Interfaces | PascalCase (I-prefix optional) | `IRoomDef` or `RoomDef` |
| Functions | camelCase | `loadAssets`, `handleClick` |
| Variables | camelCase | `playerScore`, `currentRoom` |
| Constants | UPPER_SNAKE_CASE | `SCREEN_WIDTH`, `MAX_ITEMS` |
| Files | PascalCase for classes, camelCase for utilities | `BootScene.ts`, `helpers.ts` |
| Private members | `#` prefix (native private) or `_` prefix | `#state`, `_temp` |

### Phaser Scenes

- Extend `Phaser.Scene`
- Implement `preload()`, `create()`, `update()` lifecycle methods
- Scene keys should be lowercase strings: `'boot'`, `'menu'`, `'game'`

### Error Handling

- Use `try/catch` for async operations and external data loading
- Throw `Error` with descriptive messages for invalid game state
- Never silently swallow errors — log with `console.error` at minimum
- Validate JSON data from `data/*.json` files on load

### Formatting

- Use 2-space indentation (Vite default)
- Semicolons: follow TypeScript compiler defaults (optional but be consistent)
- Line length: 120 characters max
- Trailing commas: prefer in multi-line structures

## Project Structure

```
src/
├── main.ts              # Game entry point
├── config.ts            # Phaser game configuration
├── scenes/              # Phaser Scene classes
├── systems/             # Game logic managers (RoomManager, InventorySystem, etc.)
├── entities/            # Game entities (Player, NPC, Item, Hotspot)
├── data/                # JSON data files (rooms, items, puzzles, dialogs)
├── effects/             # Visual effects (particles, lighting, post-processing)
└── utils/               # Helpers and constants
public/
├── assets/              # Images, sprites, textures
└── audio/               # Music, SFX, ambient sounds
```

## Key Conventions

1. **Data-driven design**: Room/item/puzzle definitions live in JSON under `src/data/`
2. **State persistence**: Use `localStorage` via `SaveSystem.ts` for game saves
3. **Asset loading**: All assets preloaded in `BootScene` with progress bar
4. **Scene transitions**: Use Phaser's built-in scene management with fade animations
5. **No framework beyond Phaser**: Custom game state manager, no React/Vue/etc.

## Git

- Commits only on explicit user request
- Run `npx tsc --noEmit` before committing to ensure type safety
- Follow conventional commit messages: `feat:`, `fix:`, `chore:`, etc.

## Lessons

- This project is in early setup phase — src/ directories are scaffolded but empty
- Always verify commands work before documenting them
- When adding new systems, follow the plan in `plan.md` for implementation order
