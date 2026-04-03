# Plan: Cosmic Quest — Point-and-Click Space Adventure

## Context

A Zack McKracken-style point-and-click adventure game with a space/sci-fi theme. Players explore different rooms/locations, solve interconnected puzzles, collect items, and progress through a narrative-driven adventure. Built with Phaser.js for rich 2D graphics including parallax backgrounds, particle effects, and atmospheric lighting.

## Progress

- [x] Phase 1: Project Setup & Core Engine
- [ ] Phase 2: Room System & Navigation
- [ ] Phase 3: Inventory & Interaction System
- [ ] Phase 4: Puzzle Engine & Game Logic
- [ ] Phase 5: Graphics & Visual Effects
- [ ] Phase 6: Audio & Atmosphere
- [ ] Phase 7: Content & Levels
- [ ] Phase 8: Polish & Deployment

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Phaser 3.60+ (2D Game Engine) |
| Language | TypeScript |
| Build Tool | Vite |
| Graphics | Phaser Renderer + Custom Shaders |
| Audio | Phaser Audio + Web Audio API |
| State Management | Custom Game State Manager |
| Asset Pipeline | Vite static assets |
| Deployment | Vercel or GitHub Pages |

---

## Project Structure

```
cosmic-quest/
├── public/
│   ├── assets/
│   │   ├── backgrounds/     # Room background images
│   │   ├── characters/      # Character sprites
│   │   ├── items/           # Inventory item icons
│   │   ├── particles/       # Particle effect sprites
│   │   ├── ui/              # UI elements
│   │   └── effects/         # Visual effect sprites
│   └── audio/
│       ├── music/           # Background music
│       ├── sfx/             # Sound effects
│       └── ambient/         # Ambient soundscapes
├── src/
│   ├── main.ts              # Game entry point
│   ├── config.ts            # Phaser game configuration
│   ├── scenes/
│   │   ├── BootScene.ts     # Asset loading scene
│   │   ├── MenuScene.ts     # Main menu scene
│   │   ├── GameScene.ts     # Main gameplay scene
│   │   ├── PuzzleScene.ts   # Puzzle-specific scenes
│   │   ├── InventoryScene.ts # Inventory overlay
│   │   └── DialogScene.ts   # Dialog/conversation scene
│   ├── systems/
│   │   ├── RoomManager.ts   # Room navigation & state
│   │   ├── InventorySystem.ts # Item collection & usage
│   │   ├── PuzzleEngine.ts  # Puzzle state & validation
│   │   ├── DialogSystem.ts  # NPC conversations
│   │   └── SaveSystem.ts    # Game save/load
│   ├── entities/
│   │   ├── Player.ts        # Player character
│   │   ├── NPC.ts           # Non-player characters
│   │   ├── Item.ts          # Interactive items
│   │   └── Hotspot.ts       # Clickable room areas
│   ├── data/
│   │   ├── rooms.json       # Room definitions
│   │   ├── items.json       # Item definitions
│   │   ├── puzzles.json     # Puzzle definitions
│   │   └── dialogs.json     # Dialog trees
│   ├── effects/
│   │   ├── ParticleEffects.ts # Custom particle systems
│   │   ├── Lighting.ts      # Dynamic lighting effects
│   │   └── PostProcessing.ts # Screen effects
│   └── utils/
│       ├── helpers.ts       # Utility functions
│       └── constants.ts     # Game constants
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## Game Data Schema

### Room Definition (rooms.json)
```json
{
  "id": "ship_bridge",
  "name": "Starship Bridge",
  "background": "assets/backgrounds/bridge.png",
  "exits": [
    { "direction": "left", "target": "corridor", "hotspot": { "x": 50, "y": 400, "width": 100, "height": 200 } }
  ],
  "items": ["keycard"],
  "npcs": ["captain"],
  "hotspots": [
    { "id": "console", "x": 400, "y": 300, "width": 200, "height": 150, "action": "examine_console" }
  ],
  "ambient": "ambient_spaceship",
  "parallaxLayers": [
    { "image": "stars_far", "speed": 0.1 },
    { "image": "stars_near", "speed": 0.3 }
  ]
}
```

### Item Definition (items.json)
```json
{
  "id": "keycard",
  "name": "Security Keycard",
  "icon": "assets/items/keycard.png",
  "description": "A blue keycard with clearance level 3",
  "usable": true,
  "useTargets": ["door_locked"]
}
```

### Puzzle Definition (puzzles.json)
```json
{
  "id": "console_puzzle",
  "type": "sequence",
  "trigger": "examine_console",
  "state": "locked",
  "steps": ["enter_code", "verify_access"],
  "rewards": ["ship_logs"],
  "effects": { "unlock": "corridor_b" }
}
```

---

## Environment Variables

```bash
# Not required for local development
# Optional: Analytics
VITE_ANALYTICS_ID=xxx  # For deployment tracking
```

---

## Implementation Checklist

### Phase 1: Project Setup & Core Engine
- [ ] Initialize project with Vite + TypeScript + Phaser 3
- [ ] Configure `vite.config.ts` for asset handling
- [ ] Create `src/config.ts` with Phaser game configuration (1920x1080, WebGL renderer)
- [ ] Implement `BootScene.ts` with asset loading and progress bar
- [ ] Implement `MenuScene.ts` with animated title screen and start button
- [ ] Create base `GameScene.ts` with scene lifecycle methods
- [ ] Set up project structure and TypeScript paths

### Phase 2: Room System & Navigation
- [ ] Create `data/rooms.json` with initial room definitions (5+ rooms)
- [ ] Implement `RoomManager.ts` to load and manage room state
- [ ] Build room background rendering with parallax scrolling
- [ ] Create clickable exit hotspots with visual feedback
- [ ] Implement room transition animations (fade, slide)
- [ ] Add room state persistence (visited, items collected)
- [ ] Create minimap/room navigation UI

### Phase 3: Inventory & Interaction System
- [ ] Create `data/items.json` with item definitions (15+ items)
- [ ] Implement `InventorySystem.ts` with add/remove/use operations
- [ ] Build inventory UI overlay with drag-and-drop
- [ ] Create item tooltip with description on hover
- [ ] Implement item combination logic
- [ ] Add item use on room hotspots
- [ ] Create `Hotspot.ts` entity for interactive room elements
- [ ] Implement context-sensitive cursor (look, use, talk)

### Phase 4: Puzzle Engine & Game Logic
- [ ] Create `data/puzzles.json` with puzzle definitions (8+ puzzles)
- [ ] Implement `PuzzleEngine.ts` with state machine
- [ ] Build sequence puzzles (enter codes in order)
- [ ] Build inventory puzzles (use item X on location Y)
- [ ] Build dialog puzzles (get information from NPCs)
- [ ] Build environment puzzles (manipulate room objects)
- [ ] Implement puzzle validation and completion rewards
- [ ] Create `DialogSystem.ts` with branching dialog trees
- [ ] Create `data/dialogs.json` with NPC conversations
- [ ] Implement `SaveSystem.ts` with localStorage save/load

### Phase 5: Graphics & Visual Effects
- [ ] Create starfield parallax backgrounds (3+ layers)
- [ ] Implement `ParticleEffects.ts` for:
  - [ ] Sparkle effects on item pickup
  - [ ] Explosion effects for puzzle completion
  - [ ] Ambient floating particles in rooms
  - [ ] Engine glow effects on interactive elements
- [ ] Implement `Lighting.ts` with:
  - [ ] Dynamic light sources per room
  - [ ] Flickering lights for atmosphere
  - [ ] Glow effects on important objects
- [ ] Implement `PostProcessing.ts` for:
  - [ ] Bloom/glow post-processing
  - [ ] Screen shake for events
  - [ ] Color grading per room mood
  - [ ] Vignette effect
- [ ] Create animated character sprites (idle, walk, interact)
- [ ] Build UI components with sci-fi styling (borders, glow)
- [ ] Add animated transitions between scenes

### Phase 6: Audio & Atmosphere
- [ ] Add background music tracks (3+ ambient space tracks)
- [ ] Implement room-specific ambient soundscapes
- [ ] Add sound effects for:
  - [ ] Item pickup/usage
  - [ ] Room transitions
  - [ ] Puzzle interactions
  - [ ] UI clicks and hovers
- [ ] Implement audio fade between rooms
- [ ] Add volume controls to settings

### Phase 7: Content & Levels
- [ ] Design and create 8+ detailed room backgrounds
- [ ] Create 20+ interactive items with icons
- [ ] Write 5+ NPC characters with dialog trees
- [ ] Design 10+ interconnected puzzles
- [ ] Create puzzle dependency graph
- [ ] Write game narrative and story progression
- [ ] Add multiple puzzle solution hints system
- [ ] Implement game completion sequence and credits

### Phase 8: Polish & Deployment
- [ ] Add settings menu (volume, fullscreen, quality)
- [ ] Implement keyboard shortcuts (ESC for inventory, I for items)
- [ ] Add loading screen with tips
- [ ] Implement achievement tracking
- [ ] Add game statistics (time played, puzzles solved)
- [ ] Optimize asset loading with sprite sheets
- [ ] Add responsive scaling for different screen sizes
- [ ] Test on multiple browsers (Chrome, Firefox, Safari)
- [ ] Deploy to Vercel or GitHub Pages
- [ ] Create README with game instructions

---

## Key Design Decisions

### Graphics Approach
- Use pre-rendered background images for rooms (can be AI-generated or hand-drawn)
- Phaser's built-in particle system for effects
- Custom WebGL shaders for advanced lighting/bloom
- Sprite sheets for animated characters

### Puzzle Design
- Puzzles are state-driven and tracked in `PuzzleEngine`
- Each puzzle has prerequisites (items, dialog, other puzzles)
- Multiple solution paths where appropriate
- Hint system that activates after time threshold

### Save System
- Full game state serialized to localStorage
- Multiple save slots (3 slots)
- Auto-save on puzzle completion
- Save includes: room state, inventory, puzzle states, flags

### Performance
- Lazy load room assets on first visit
- Use texture atlases for sprites
- Limit active particle systems per room
- Preload critical assets in boot scene
