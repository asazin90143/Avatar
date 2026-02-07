# Avatar

A retro, pixel-art turn-based strategy game based on Avatar: The Last Airbender.

## How to Play
1.  **Open `index.html`** in any modern web browser.
2.  **Select your Class:**
    * **Water:** Healer (Special: Heal 25% HP)
    * **Fire:** Aggressive (Special: Burn DOT)
    * **Earth:** Tank (Special: Stun 2 turns)
    * **Air:** Evasive (Special: 80% Evade chance)
    * **Avatar:** Master (Can switch elements mid-fight)
3.  **Battle:**
    * Use Light/Mid/Heavy attacks.
    * Watch out for type advantages (e.g., Water deals 1.5x damage to Fire).
    * Reduce opponent HP to 0 to win.

## Credits & Customization
This game uses standard HTML/CSS/JS.

### Changing Character Images
If you want to use your own downloaded pixel art:
1.  Save your images (e.g., `my-aang.png`) in the same folder.
2.  Open `style.css`.
3.  Find the section `/* IMAGE ASSETS */`.
4.  Change the URL to your filename:
    ```css
    .avatar-bender {
        background-image: url('my-aang.png');
    }
    ```