# Avatar: Master the Elements

A retro, pixel-art turn-based strategy game inspired by Avatar: The Last Airbender. Master elemental abilities, exploit type advantages, and compete in multiple game modes!

## 📋 Table of Contents

- [Features](#features)
- [Game Modes](#game-modes)
- [Characters & Abilities](#characters--abilities)
- [Combat System](#combat-system)
- [How to Play](#how-to-play)
- [Project Structure](#project-structure)
- [Technical Details](#technical-details)
- [Customization Guide](#customization-guide)
- [Testing](#testing)
- [Browser Compatibility](#browser-compatibility)

## ✨ Features

- **Three Game Modes:** Single Match, Endless Mode, and Local 1v1 Multiplayer
- **Five Playable Characters:** Each with unique abilities and stats
- **Elemental Advantage System:** Type-matching combat with 1.5x / 0.5x damage modifiers
- **Strategic Cooldown Management:** Different skills have varying cooldown periods
- **Status Effects System:** Burn, Stun, and Evade mechanics for tactical depth
- **Dynamic Difficulty:** Endless mode scales enemy strength progressively
- **Retro Aesthetics:** NES.css styling with pixel art sprites and animations
- **Sound Design:** Web Audio API integration with contextual sound effects
- **Pause/Resume:** Full game state management with pause menu
- **Battle Arena:** Multiple iconic battlegrounds with themed backgrounds
- **Visual Feedback:** Health bars, status indicators, attack animations, and projectile effects

## 🎮 Game Modes

### Single Match

- **Objective:** Defeat one opponent and win the battle.
- **Difficulty:** CPU uses basic AI strategy.
- **Ideal for:** Quick matches and learning the game mechanics.

### Endless Mode

- **Objective:** Defeat as many consecutive opponents as possible.
- **Scaling Difficulty:** Each new opponent gains 15% additional Max HP.
- **Health Persistence:** You regain 30% of your Max HP after each victory.
- **Full Reset:** All cooldowns and negative status effects clear between rounds.
- **Ideal for:** Testing endurance and maximizing your win streak.

### 1v1 Local Multiplayer

- **Objective:** Two players compete on the same device (hotseat mode).
- **Takes Turns:** Players alternate control on each turn.
- **No AI:** Both players make decisions directly.
- **Ideal for:** Head-to-head competitive play.

## 👥 Characters & Abilities

### Water Master

- **HP:** 100
- **Role:** Healer / Support
- **Special Ability:** Heal 25% of Max HP
- **Type Advantages:** Beats Fire (1.5x damage)
- **Type Disadvantages:** Weak to Earth (0.5x damage)

### Fire Lord

- **HP:** 100
- **Role:** Aggressive / Status Effect
- **Special Ability:** Inferno – Deal 20 burst damage + inflict Burn for 5 turns
- **Type Advantages:** Beats Air (1.5x damage)
- **Type Disadvantages:** Weak to Water & Earth (0.5x damage)

### Earth Guard

- **HP:** 120 (Tankiest character)
- **Role:** Tank / Control
- **Special Ability:** Stun – Disable opponent for 2 turns
- **Type Advantages:** Beats Fire (1.5x damage)
- **Type Disadvantages:** Weak to Air (0.5x damage)

### Air Monk

- **HP:** 90 (Fragilest character)
- **Role:** Evasive / High-Risk
- **Special Ability:** Evade – Activate 80% miss chance for 4 turns
- **Type Advantages:** Beats Earth (1.5x damage)
- **Type Disadvantages:** Weak to Fire (0.5x damage)

### The Avatar

- **HP:** 110
- **Role:** Versatile / Master
- **Special Feature:** Switch between all elements during battle
- **Passive Advantage:** Can adapt to any matchup dynamically
- **Strategy:** Use element switching to counter opponent tactics

## ⚔️ Combat System

### Attack Types

| Attack | Base Damage | Cooldown | Use Case |
|--------|-------------|----------|----------|
| Light  | 10          | None     | Safe option, always available |
| Mid    | 20          | 2 turns  | Balanced damage with moderate wait |
| Heavy  | 30          | 3 turns  | Maximum single-hit damage |
| Special| Variable    | 4 turns  | Elemental-specific effects |

### Type Advantages Matrix

```
Water  → Beats Fire (1.5x)
Earth  → Beats Fire (1.5x)
Air    → Beats Earth (1.5x)
Fire   → Beats Air (1.5x)
```

### Status Effects

- **Burn (DOT):** Takes damage each turn for duration. Applied by Fire special.
- **Stun:** Skip next turn completely. Applied by Earth special.
- **Evade:** 80% chance to dodge attacks. Applied by Air special.

### Damage Calculation

```
Base Damage × Type Modifier (0.5x, 1.0x, or 1.5x) = Final Damage
```

## 🎯 How to Play

### Getting Started

1. **Open the Game:** Launch `index.html` in a modern web browser
2. **Click "Start Game"** on the welcome screen

### Gameplay Steps

1. **Character Selection:** Choose from 5 unique elements or the Avatar
2. **Battleground Selection:** Pick from 4 iconic locations:
   - Air Temple
   - Fire Nation Ship
   - Earth Kingdom
   - Water Tribe
3. **Game Mode Selection:** Pick your preferred game mode
4. **Battle Phase:**
   - View your and opponent's health bars
   - Read the battle log for action outcomes
   - Press buttons to execute moves:
     - **Light:** No cooldown, instant use
     - **Mid:** 2-turn cooldown after activation
     - **Heavy:** 3-turn cooldown after activation
     - **Special:** 4-turn cooldown, unique per element
   - If stunned, your turn is automatically skipped
   - If burned, you take damage automatically
   - If evading, incoming attacks have 80% miss chance

### Winning

- Reduce opponent's HP to 0 before yours reaches 0
- In Single Match mode: Victory ends the game
- In Endless Mode: Continue to the next opponent
- In 1v1 Mode: Other player wins

### Game Menu

- Click **MENU** button during battle to pause
- Options: Resume, Mute audio, or Quit to main menu

## 📁 Project Structure

```
Avatar/
├── index.html          # Main game interface and GUI
├── game.js              # Core game logic and state management (817 lines)
├── sound.js             # Web Audio API sound effects (128 lines)
├── style.css            # NES.css styling and custom CSS
├── test_game.js         # Unit tests for game mechanics
├── package.json         # Project metadata
├── README.md            # This file
├── characters/          # Character sprite images
│   ├── Water bender.jpg
│   ├── Fire bender.jpg
│   ├── Earth bender.jpg
│   ├── Air bender.jpg
│   └── Avatar.jpg
└── background/          # Battleground background images
    ├── Water Tribe.jpg
    ├── Fire Nation.jpg
    ├── Earth Kingdom.jpg
    └── Air Temple.jpg
```

### File Responsibilities

**game.js** - Main Application Logic

- Character and skill definitions
- Game state management (player, CPU, turn tracking)
- Battle execution (move resolution, damage calculation)
- AI logic for CPU opponent
- DOM manipulation and UI updates
- Game mode management
- Type advantage calculations
- Cooldown tracking and status effect handling

**sound.js** - Audio System

- Web Audio API context initialization
- Tone generation (sine, square, triangle, sawtooth)
- Noise generation for impact effects
- Sound effects: hover, click, attack, damage, win
- Mute toggle functionality
- Dynamic audio based on move type

**index.html** - User Interface

- Multi-screen navigation (Start, Character Select, Map Select, Mode Select, Battle)
- Health bar UI components
- Character sprite displays
- Battle log messages
- Control buttons (Light, Mid, Heavy, Special)
- Avatar element switching panel
- Pause menu modal
- Uses NES.css for retro styling
- Responsive layout with flexbox

**style.css** - Styling & Visual Design

- Character sprite styling and positioning
- Background image assets
- Battle arena layout
- Health bar appearance
- Status effect indicators
- Button styling and animations
- Responsive design for different screen sizes

**test_game.js** - Quality Assurance

- Unit tests for game logic
- Type modifier calculations
- Damage calculations
- Fighter creation and stat tracking
- Test pass/fail reporting

## 🔧 Technical Details

### Technologies Used

- **HTML5** – Semantic structure
- **CSS3** – Styling with custom properties
- **Vanilla JavaScript (ES6+)** – Pure JS, no frameworks
- **Web Audio API** – Browser-native sound generation
- **NES.css** – Retro 8-bit UI framework

### Dependencies

- `nes.css` – CDN-hosted retro CSS library
- `Press Start 2P` – Google Font for pixel font aesthetic

### Game Architecture

- **State Machine:** Screens transition between Start → Character → Map → Mode → Battle
- **Turn-Based Logic:** Alternating player/CPU actions with proper state validation
- **Event-Driven:** Button clicks trigger move execution
- **DOM-Driven Updates:** Game state reflected in real-time health bars and status displays
- **AI System:** CPU opponent uses weighted random strategy selection

## 🎨 Customization Guide

### Changing Character Images

To use custom character sprites:

1. Save your images in the `characters/` folder (e.g., `custom-aang.png`)
2. Open `style.css`
3. Find the `/* IMAGE ASSETS */` section
4. Update the URL for the character class:

   ```css
    .water-bender {
        background-image: url('./characters/Water bender.jpg');
    }
    .fire-bender {
        background-image: url('./characters/Fire bender.jpg');
    }
    /* ...and so on for other elements */
    ```

### Changing Background Images

To use custom battleground backgrounds:

1. Save your background images in the `background/` folder
2. Open `game.js`
3. Find the `startGame()` function and locate the background image mapping
4. Update the URL paths:

   ```javascript
   if (map.includes('Water')) 
     arena.style.backgroundImage = "url('./background/my-water-bg.jpg')";
   ```

### Modifying Game Balance

Edit character stats and damage values in `game.js`:

```javascript
const CHARACTERS = {
    water: { name: 'Water Master', hp: 100, element: 'water' },
    // Adjust HP values for difficulty tuning
};

const SKILLS = {
    light: { dmg: 10, name: "Light Atk" },
    // Adjust damage values for combat balance
};
```

### Adjusting Sound

Mute/unmute is player-controlled via the pause menu. To disable sound globally, comment out the `SoundManager.init()` call in the main startup sequence.

## 🧪 Testing

### Running Tests

The project includes `test_game.js` for validating core game mechanics:

```bash
node test_game.js
```

Tests cover:

- Type modifier calculations
- Damage calculations with modifiers
- Fighter creation and stat initialization
- Special ability behavior

### Test Results

Run the test file to see PASS/FAIL results for all game logic validations.

## 🌐 Browser Compatibility

### Supported Browsers

- ✅ Chrome/Chromium (v80+)
- ✅ Firefox (v75+)
- ✅ Safari (v13+)
- ✅ Edge (v80+)

### Required Features

- ES6+ JavaScript support
- Web Audio API (for sound)
- CSS Grid and Flexbox
- LocalStorage (if persistence features added)

### Browser Limitations

- Web Audio API may have restrictions on autoplay/muted contexts
- Mobile browsers may require user interaction to start audio

## 🚀 Setup & Installation

### Quick Start

1. Clone or download the repository
2. Open `index.html` directly in your browser (no build step required)
3. Play!

### Development Server (Optional)

For a better development experience with auto-reload:

```bash
npm run dev
# Runs 'npx -y serve' which serves the project on http://localhost:3000
```

### Requirements

- Modern web browser (see Browser Compatibility section)
- No Node.js or build tools required for gameplay
- Node.js + npm only needed for running the dev server

## 📊 Game Statistics & Balance

### HP Values

- Water: 100 (Balanced)
- Fire: 100 (Balanced)
- Earth: 120 (Tanky)
- Air: 90 (Fragile)
- Avatar: 110 (Versatile)

### Damage Output Per Type

- Light: 10 DMG (no cooldown)
- Mid: 20 DMG (2-turn cooldown)
- Heavy: 30 DMG (3-turn cooldown)
- Special: Varies by element (4-turn cooldown)

### Type Coverage

```
Water  beats Fire
Fire   beats Air
Air    beats Earth
Earth  beats Fire
```

*Note: Each element beats exactly one other element and loses to exactly one other.*

## 🎭 Avatar Special Mechanic

The Avatar character has a unique advantage: ability to **switch elements mid-battle**.

### How Avatar Switching Works

- Avatar starts with Water element
- During battle, click element buttons in the Avatar Switch Panel
- Change elements instantly at any time
- Elements only limit special ability appearance, not Light/Mid/Heavy attacks
- Perfect for:
  - Countering opponent's element
  - Using different status effects
  - Forcing tactical decisions on opponents

## 💡 Strategy Tips

### For Each Character

- **Water:** Use healing strategically when HP is below 50%; combo Light attacks for chip damage
- **Fire:** Build up to Inferno special for sustained DOT damage; combo with Burn for lock-down
- **Earth:** Use Stun to disable opponents during their high-damage turns; tank damage with extra HP
- **Air:** Activate Evade early to negate incoming Heavy/Special bursts; reset status effects to your advantage
- **Avatar:** Adapt element to matchup; exploit opponent's element weaknesses

### Cooldown Management

- Bank Light attacks for guaranteed damage when Mid/Heavy are on cooldown
- Plan Special ability usage 4 turns in advance
- Use downtime to predict opponent's next move

### Endless Mode Survival

- Prioritize healing with Water when possible
- Build Burn stacks for passive damage
- Reset negatives effects between rounds for fresh starts
- Identify when to play aggressively vs. conservatively

## 📝 Credits

**Development:** Built with vanilla HTML5, CSS3, and JavaScript
**Styling:** [NES.css](https://nostalgic-css.github.io/NES.css/) by BcRikko
**Font:** Press Start 2P from Google Fonts
**Inspiration:** Avatar: The Last Airbender by Michael Dante Martin & Bryan Konietzko

## 📄 License

ISC License - See `package.json` for details

---

**Enjoy the game! Master the elements and become the ultimate Avatar!** 🌊🔥⛰️💨
