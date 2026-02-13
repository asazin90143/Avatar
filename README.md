# Avatar: Master the Elements

A retro, pixel-art turn-based strategy game based on Avatar: The Last Airbender.

## Features
- **Two Game Modes:**
  - **Single Match:** A classic 1v1 duel against the CPU.
  - **Endless Mode:** Fight wave after wave of enemies. Enemies get stronger each round!
- **Dynamic Combat:**
  - **Cooldown System:** Manage your powerful abilities with strategic cooldowns.
  - **Elemental Advantages:** Water beats Fire, Fire beats Air, etc.
- **Pause Menu:** Pause the action anytime via the HUD to resume or quit to the main menu.
- **Enhanced Visuals:** Attack animations, projectile effects, and damage shake feedback.

## How to Play
1.  **Open `index.html`** in any modern web browser.
2.  **Select your Class:**
    * **Water:** Healer (Special: Heal 25% HP)
    * **Fire:** Aggressive (Special: Burn DOT)
    * **Earth:** Tank (Special: Stun 2 turns)
    * **Air:** Evasive (Special: 80% Evade chance)
    * **Avatar:** Master (Can switch elements mid-fight)
3.  **Choose a Battleground:** Select from iconic locations like the Air Temple or Fire Nation Ship.
4.  **Select Game Mode:**
    * **Single Match:** Win one battle to save the world.
    * **Endless Mode:** Test your endurance against infinite waves.
5.  **Battle:**
    * Use **Light**, **Mid**, or **Heavy** attacks to deal damage.
    * **Cooldowns:**
        * **Mid:** 1 Turn Cooldown
        * **Heavy:** 2 Turn Cooldown
        * **Special:** 3 Turn Cooldown
    * Watch out for type advantages (e.g., Water deals 1.5x damage to Fire).
    * Reduce opponent HP to 0 to win.

## Endless Mode Mechanics
- **Scaling Difficulty:** Enemies gain **15% Max HP** every round.
- **Survival:** You heal for **30% of your Max HP** after winning a round.
- **Full Refresh:** All skill cooldowns and negative status effects (Burn, Stun) are **fully reset** at the start of a new round.

## Credits & Customization
This game uses standard HTML/CSS/JS.

### Changing Character Images
If you want to use your own downloaded pixel art:
1.  Save your images (e.g., `my-aang.png`) in the `characters/` folder.
2.  Open `style.css`.
3.  Find the `/* IMAGE ASSETS */` section.
4.  Change the URL to your filename:
    ```css
    .avatar-bender {
        background-image: url('./characters/my-aang.png');
    }
    ```