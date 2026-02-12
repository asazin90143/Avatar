/* --- GAME CONFIGURATION --- */
const CHARACTERS = {
    water: { name: 'Water Master', hp: 100, element: 'water' },
    fire: { name: 'Fire Lord', hp: 100, element: 'fire' },
    earth: { name: 'Earth Guard', hp: 120, element: 'earth' }, // Tankier
    air: { name: 'Air Monk', hp: 90, element: 'air' }, // Fragile/Evasive
    avatar: { name: ' The Avatar', hp: 110, element: 'avatar' }
};

const SKILLS = {
    light: { dmg: 10, name: "Light Atk" },
    mid: { dmg: 20, name: "Mid Atk" },
    heavy: { dmg: 30, name: "Heavy Atk" }
};

/* --- STATE MANAGEMENT --- */
const state = {
    player: null,
    cpu: null,
    turn: 'player', // 'player' or 'cpu'
    isOver: false,
    map: null
};

/* --- DOM ELEMENTS --- */
let screens = {};
let logs = null;
let restartBtn = null;
let ui = {};

/* --- INITIALIZATION --- */
function initDom() {
    logDebug("Initializing DOM elements...");
    try {
        screens = {
            select: document.getElementById('char-select-screen'),
            map: document.getElementById('map-select-screen'),
            battle: document.getElementById('battle-screen')
        };

        logs = document.getElementById('battle-log');
        restartBtn = document.getElementById('restart-btn');

        ui = {
            p1: {
                bar: document.getElementById('p1-health'),
                sprite: document.getElementById('p1-sprite'),
                status: document.getElementById('p1-status'),
                name: document.getElementById('p1-name'),
                hpText: document.getElementById('p1-hp-text')
            },
            p2: {
                bar: document.getElementById('p2-health'),
                sprite: document.getElementById('p2-sprite'),
                status: document.getElementById('p2-status'),
                name: document.getElementById('p2-name'),
                hpText: document.getElementById('p2-hp-text')
            }
        };

        if (!screens.select) throw new Error("Missing Select Screen div");

        // Setup Menu Button Listener Explicitly
        const menuBtn = document.getElementById('menu-btn');
        if (menuBtn) {
            menuBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // prevent bubbling issues
                togglePause();
            });
            logDebug("Menu button listener attached.");
        } else {
            logError("Menu button element not found!");
        }

        logDebug("DOM Initialized Successfully");
    } catch (e) {
        logError("Failed to init DOM: " + e.message);
    }
}

function init() {
    initDom();

    const grid = document.getElementById('char-grid');
    if (!grid) {
        logError("Character Grid element missing!");
        return;
    }

    // Clear existing buttons to prevent duplicates on potential re-runs
    grid.innerHTML = '';

    Object.keys(CHARACTERS).forEach(key => {
        const btn = document.createElement('button');
        btn.className = `nes-btn char-card`;
        // Capitalize first letter
        const displayKey = key.charAt(0).toUpperCase() + key.slice(1);
        btn.innerText = displayKey;

        // Color coding buttons (nes.css classes)
        if (key === 'water') btn.classList.add('is-primary');
        if (key === 'fire') btn.classList.add('is-error');
        if (key === 'earth') btn.classList.add('is-success');
        if (key === 'air') btn.classList.add('is-warning');

        /* 
           Crucial: Adding inline style for basic visibility if nes.css fails 
           (though style.css handles this too now)
        */
        if (!document.querySelector('link[href*="nes.css"]')) {
            btn.style.border = "1px solid white";
            btn.style.margin = "5px";
        }

        btn.onclick = () => selectCharacter(key);
        grid.appendChild(btn);
    });

    logDebug("Character buttons generated.");
}

function selectCharacter(key) {
    logDebug(`Selected character: ${key}`);

    // Player Setup
    state.player = createFighter(key, false);

    // CPU Setup (Random, but not Avatar to keep it simple)
    const keys = ['water', 'fire', 'earth', 'air'];
    const cpuKey = keys[Math.floor(Math.random() * keys.length)];
    state.cpu = createFighter(cpuKey, true);

    // Update Sprites
    if (ui.p1 && ui.p1.sprite) ui.p1.sprite.className = `sprite ${key}-bender`;
    if (ui.p2 && ui.p2.sprite) ui.p2.sprite.className = `sprite ${cpuKey}-bender`;

    // Switch to Map Screen
    if (screens.select) {
        screens.select.classList.remove('active');
        screens.select.classList.add('hidden');
    }
    if (screens.map) {
        screens.map.classList.remove('hidden');
        screens.map.classList.add('active');
    }
    logDebug("Switched to Map Selection screen");
}

function createFighter(key, isCpu) {
    const template = CHARACTERS[key];
    return {
        ...template,
        maxHp: template.hp,
        currentHp: template.hp,
        isAvatar: (key === 'avatar'),
        effects: { stun: 0, burn: 0, evade: 0 },
        cooldowns: { mid: 0, heavy: 0, special: 0 } // Track cooldowns
    };
}

function startGame(mapName) {
    logDebug(`Starting game on map: ${mapName}`);
    state.map = mapName;

    if (screens.map) {
        screens.map.classList.remove('active');
        screens.map.classList.add('hidden');
    }
    if (screens.battle) {
        screens.battle.classList.remove('hidden');
        screens.battle.classList.add('active');
    }

    // Set Background Images from local files
    const arena = document.getElementById('arena-bg');
    if (arena) {
        arena.style.backgroundSize = 'cover';
        arena.style.backgroundPosition = 'center';
        if (mapName.includes('Water')) arena.style.backgroundImage = "url('./background/Water Tribe.jpg')";
        if (mapName.includes('Fire')) arena.style.backgroundImage = "url('./background/Fire Nation.jpg')";
        if (mapName.includes('Earth')) arena.style.backgroundImage = "url('./background/Earth Kingdom.jpg')";
        if (mapName.includes('Air')) arena.style.backgroundImage = "url('./background/Air Temple.jpg')";
    }

    if (ui.p1 && ui.p1.name) ui.p1.name.innerText = state.player.name;
    if (ui.p2 && ui.p2.name) ui.p2.name.innerText = state.cpu.name;

    updateHealthUI();

    // If Player is Avatar, show Switch Panel
    if (state.player.isAvatar) {
        const switchPanel = document.getElementById('avatar-switch-panel');
        if (switchPanel) switchPanel.classList.remove('hidden');
        state.player.element = 'water'; // Default start element
        log("Avatar State Active! Choose your element.");
    } else {
        log(`Battle Start! ${state.player.name} vs ${state.cpu.name}`);
    }
}

/* --- BATTLE LOGIC --- */
function executeMove(moveType) {
    if (state.turn !== 'player' || state.isOver) return;

    // Check Stun
    if (state.player.effects.stun > 0) {
        log("You are STUNNED and cannot move!");
        state.player.effects.stun--;
        endTurn();
        return;
    }

    // Check Cooldown
    if (state.player.cooldowns[moveType] > 0) {
        log(`${moveType.toUpperCase()} is on cooldown! (${state.player.cooldowns[moveType]} turns left)`);
        return;
    }

    // Apply Cooldown
    if (moveType === 'mid') state.player.cooldowns.mid = 2; // Can use again after 1 turn (sets to 2, decrements start of next turn = 1 turn wait?)
    // Wait, let's clarify "1 turn cooldown".
    // Usually means: Use turn 1. Turn 2 (blocked). Turn 3 (available).
    // If I set to 2: 
    //   Turn 1 (Use): Sets to 2. End turn.
    //   CPU Turn. 
    //   Turn 2 (Start): Decrement -> 1. Still > 0. Blocked. End turn.
    //   CPU Turn.
    //   Turn 3 (Start): Decrement -> 0. Available.
    // So for "1 turn wait", we need:
    // Light: 0
    // Mid: 2 (blocked next turn)
    // Heavy: 3 (blocked next 2 turns)
    // Special: 4 (blocked next 3 turns)

    // Request says: Mid - 1 turn, Heavy - 2 turns, Special - 3 turns.
    // Let's assume standard game terms:
    // 1 turn CD = skip 1 turn.

    if (moveType === 'mid') state.player.cooldowns.mid = 2;
    if (moveType === 'heavy') state.player.cooldowns.heavy = 3;
    if (moveType === 'special') state.player.cooldowns.special = 4;

    // Execute Player Move
    performAttack(state.player, state.cpu, moveType);

    updateHealthUI();
    checkWinCondition();

    if (!state.isOver) {
        endTurn();
    }
}

function performAttack(attacker, defender, moveType) {
    triggerAttackVisuals(attacker, defender);

    if (moveType === 'special') {
        handleSpecial(attacker, defender);
    } else {
        let dmg = SKILLS[moveType].dmg;

        // Power Scaling
        const modifier = getTypeModifier(attacker.element, defender.element);
        dmg = Math.floor(dmg * modifier);

        // Apply Damage (Check Evade inside)
        const actualDmg = applyDamage(defender, dmg);

        // Log Construction
        let msg = `${attacker === state.player ? "You" : "CPU"} used ${moveType}!`;
        if (modifier > 1) msg += " It's Super Effective!";
        if (modifier < 1) msg += " Not very effective...";
        if (actualDmg === 0) msg = `${defender.name} EVADED the attack!`;
        log(msg);
    }
}

function handleSpecial(attacker, defender) {
    const el = attacker.element;
    const name = attacker === state.player ? "You" : "CPU";

    if (el === 'water') {
        const healAmt = Math.floor(attacker.maxHp * 0.25);
        attacker.currentHp = Math.min(attacker.maxHp, attacker.currentHp + healAmt);
        log(`${name} healed for ${healAmt} HP!`);
    }
    else if (el === 'fire') {
        // Fire special: Immediate burst + strong Burn DOT
        const burstDmg = 20;
        defender.currentHp -= burstDmg;
        if (defender.currentHp < 0) defender.currentHp = 0;
        defender.effects.burn = 5; // 5 turns of burn
        log(`${name} used INFERNO! ${burstDmg} dmg + BURN for 5 turns!`);
    }
    else if (el === 'earth') {
        defender.effects.stun = 2; // Skips 2 turns
        log(`${name} used STUN! Enemy stunned for 2 turns.`);
    }
    else if (el === 'air') {
        attacker.effects.evade = 4;
        log(`${name} used EVADE! 80% miss chance.`);
    }
}

function getTypeModifier(atkEl, defEl) {
    // === STRENGTHS (1.5x) ===
    // Water beats Fire
    if (atkEl === 'water' && defEl === 'fire') return 1.5;
    // Earth beats Fire
    if (atkEl === 'earth' && defEl === 'fire') return 1.5;
    // Air beats Earth
    if (atkEl === 'air' && defEl === 'earth') return 1.5;
    // Fire beats Air
    if (atkEl === 'fire' && defEl === 'air') return 1.5;

    // === WEAKNESSES (0.5x - Inverse of strengths per PRD) ===
    if (atkEl === 'fire' && defEl === 'water') return 0.5;
    if (atkEl === 'fire' && defEl === 'earth') return 0.5;
    if (atkEl === 'earth' && defEl === 'air') return 0.5;
    if (atkEl === 'air' && defEl === 'fire') return 0.5;

    return 1.0;
}

function applyDamage(target, amount) {
    // Check Evade Chance
    if (target.effects.evade > 0) {
        if (Math.random() < 0.8) { // 80% chance to miss
            return 0; // No damage
        }
    }
    target.currentHp -= amount;
    if (target.currentHp < 0) target.currentHp = 0;
    return amount;
}

/* --- TURN HANDLING --- */
function endTurn() {
    state.turn = 'cpu';

    // Process CPU Status Effects (Burn/Evade)
    processStatusEffects(state.cpu, "CPU");
    if (state.cpu.currentHp <= 0) { checkWinCondition(); return; }

    setTimeout(() => {
        cpuTurn();
    }, 1500);
}

function cpuTurn() {
    if (state.isOver) return;

    // Check Stun
    if (state.cpu.effects.stun > 0) {
        log("CPU is STUNNED!");
        state.cpu.effects.stun--;
        state.turn = 'player';
        processStatusEffects(state.player, "Player");
        return;
    }

    // AI Logic
    const moves = ['light', 'mid', 'heavy', 'special'];
    // 25% chance to use special
    const move = moves[Math.floor(Math.random() * moves.length)];

    performAttack(state.cpu, state.player, move);

    updateHealthUI();
    checkWinCondition();

    if (!state.isOver) {
        // Process Player Logic for next turn
        processStatusEffects(state.player, "Player");
        if (state.player.currentHp <= 0) {
            checkWinCondition();
            return;
        }

        // Cooldown Management
        ['mid', 'heavy', 'special'].forEach(m => {
            if (state.player.cooldowns[m] > 0) state.player.cooldowns[m]--;
        });

        // Update UI to reflect cooldown changes
        updateHealthUI();

        state.turn = 'player';
        log("Your Turn!"); // Visual cue
    }
}

function processStatusEffects(char, name) {
    // Burn - Enhanced: 8% max HP per turn
    if (char.effects.burn > 0) {
        const burnDmg = Math.floor(char.maxHp * 0.08);
        char.currentHp -= burnDmg;
        if (char.currentHp < 0) char.currentHp = 0;
        char.effects.burn--;
        log(`${name} took ${burnDmg} BURN damage!`);
        updateHealthUI();
    }
    // Evade Decay
    if (char.effects.evade > 0) char.effects.evade--;
}

function avatarSwitch(newElement) {
    if (!state.player.isAvatar) return;
    if (state.turn !== 'player') {
        log("Wait for your turn!");
        return;
    }

    state.player.element = newElement;

    // Visual feedback (Log only, keep sprite as Avatar)
    log(`Avatar switched to ${newElement.toUpperCase()}!`);
}

/* --- UTILS --- */
function updateHealthUI() {
    if (ui.p1 && ui.p1.bar) {
        ui.p1.bar.value = state.player.currentHp;
        ui.p1.bar.max = state.player.maxHp;
        if (ui.p1.hpText) ui.p1.hpText.innerText = `${state.player.currentHp}/${state.player.maxHp}`;
    }
    if (ui.p2 && ui.p2.bar) {
        ui.p2.bar.value = state.cpu.currentHp;
        ui.p2.bar.max = state.cpu.maxHp;
        if (ui.p2.hpText) ui.p2.hpText.innerText = `${state.cpu.currentHp}/${state.cpu.maxHp}`;
    }

    // Status Text
    let p1Status = "";
    if (state.player.effects.burn > 0) p1Status += "BURNED ";
    if (state.player.effects.stun > 0) p1Status += "STUNNED ";
    if (state.player.effects.evade > 0) p1Status += "EVASIVE ";
    if (ui.p1 && ui.p1.status) ui.p1.status.innerText = p1Status;

    let p2Status = "";
    if (state.cpu.effects.burn > 0) p2Status += "BURNED ";
    if (state.cpu.effects.stun > 0) p2Status += "STUNNED ";
    if (state.cpu.effects.evade > 0) p2Status += "EVASIVE ";
    if (ui.p2 && ui.p2.status) ui.p2.status.innerText = p2Status;

    updateCooldownsUI();
}

function updateCooldownsUI() {
    if (!state.player) return;

    const moves = ['mid', 'heavy', 'special'];
    moves.forEach(move => {
        const btn = document.getElementById(`btn-${move}`);
        if (btn) {
            const cd = state.player.cooldowns[move];
            if (cd > 0) {
                btn.classList.add('is-disabled');
                btn.style.opacity = '0.5';
                btn.style.cursor = 'not-allowed';
                btn.innerText = `${move.charAt(0).toUpperCase() + move.slice(1)} (${cd})`;
            } else {
                btn.classList.remove('is-disabled');
                btn.style.opacity = '1';
                btn.style.cursor = 'pointer';
                btn.innerText = move.charAt(0).toUpperCase() + move.slice(1);
            }
        }
    });
}

function checkWinCondition() {
    if (state.player.currentHp <= 0) {
        log("You Lost! The Fire Nation wins...");
        state.isOver = true;
        if (restartBtn) restartBtn.classList.remove('hidden');
    } else if (state.cpu.currentHp <= 0) {
        log("You Win! The world is saved.");
        state.isOver = true;
        document.getElementById('restart-btn').classList.remove('hidden');
    }
}

function triggerAttackVisuals(attacker, defender) {
    const isPlayerAttacking = (attacker === state.player);
    const projectile = document.getElementById('projectile');
    const targetSprite = isPlayerAttacking ? ui.p2.sprite : ui.p1.sprite;

    if (projectile && targetSprite) {
        // RESET & CONFIG
        projectile.style.display = 'block';
        projectile.className = `projectile projectile-${attacker.element}`;
        projectile.style.transition = 'none';

        // START POSITION (Approximate to match sprites)
        // Arena height 550px. Sprites at bottom. 
        // 65% is roughly aligned with sprite center vertically.
        projectile.style.top = '65%';
        projectile.style.left = isPlayerAttacking ? '20%' : '80%';

        // FORCE REFLOW
        void projectile.offsetWidth;

        // ANIMATE MOVEMENT
        projectile.style.transition = 'left 0.4s ease-in';
        projectile.style.left = isPlayerAttacking ? '75%' : '25%';

        // IMPACT & SHAKE
        setTimeout(() => {
            projectile.style.display = 'none';

            // Add Shake
            targetSprite.classList.add('shake-anim');
            // Remove Shake after animation completes (0.5s CSS)
            setTimeout(() => targetSprite.classList.remove('shake-anim'), 500);

        }, 400); // 0.4s matches transition duration
    }
}

function log(msg) {
    if (logs) logs.innerText = msg;
    logDebug(msg);
}

// Debug Logger
function logError(msg) {
    const consoleDiv = document.getElementById('debug-console');
    const list = document.getElementById('debug-list');
    if (consoleDiv && list) {
        consoleDiv.style.display = 'block';
        const li = document.createElement('li');
        li.innerText = `[ERROR] ${msg}`;
        list.appendChild(li);
    }
    console.error(msg);
}

function logDebug(msg) {
    const consoleDiv = document.getElementById('debug-console');
    const list = document.getElementById('debug-list');
    if (consoleDiv && list) {
        // Show all logs for debugging
        const li = document.createElement('li');
        li.style.color = '#2ecc71';
        li.innerText = `[INFO] ${msg}`;
        list.appendChild(li);
    }
    console.log(msg);
}

window.onerror = function (message, source, lineno, colno, error) {
    logError(`${message} at ${source}:${lineno}:${colno}`);
};

/* --- PAUSE / MENU --- */
/* --- PAUSE / MENU --- */
window.togglePause = function () {
    console.log("togglePause invoked");

    const dialog = document.getElementById('pause-menu');
    if (dialog) {
        if (dialog.open) {
            dialog.close();
        } else {
            try {
                dialog.showModal();
            } catch (e) {
                console.error("Dialog error:", e);
                // Fallback
                if (confirm("Game Paused. return to main menu?")) {
                    location.reload();
                }
            }
        }
    } else {
        console.warn("Pause dialog missing, using fallback.");
        if (confirm("Game Paused. Return to main menu?")) {
            location.reload();
        }
    }
};

window.quitGame = function () {
    // No confirmation needed inside the menu since they clicked 'Quit'
    location.reload();
};

// Start
document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log("Game script starting...");
        init();
    } catch (e) {
        logError(e.message);
    }
});