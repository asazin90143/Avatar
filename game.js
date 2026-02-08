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
                name: document.getElementById('p1-name')
            },
            p2: {
                bar: document.getElementById('p2-health'),
                sprite: document.getElementById('p2-sprite'),
                status: document.getElementById('p2-status'),
                name: document.getElementById('p2-name')
            }
        };

        if (!screens.select) throw new Error("Missing Select Screen div");

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
        effects: { stun: 0, burn: 0, evade: 0 }
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

    // Set Background Colors (Replace with URL in CSS if desired)
    const arena = document.getElementById('arena-bg');
    if (arena) {
        if (mapName.includes('Water')) arena.style.background = 'linear-gradient(to bottom, #001f3f, #0074D9)';
        if (mapName.includes('Fire')) arena.style.background = 'linear-gradient(to bottom, #85144b, #FF4136)';
        if (mapName.includes('Earth')) arena.style.background = 'linear-gradient(to bottom, #3D9970, #2ECC40)';
        if (mapName.includes('Air')) arena.style.background = 'linear-gradient(to bottom, #7FDBFF, #39CCCC)';
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

    // Execute Player Move
    performAttack(state.player, state.cpu, moveType);

    updateHealthUI();
    checkWinCondition();

    if (!state.isOver) {
        endTurn();
    }
}

function performAttack(attacker, defender, moveType) {
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
        const burstDmg = 15;
        defender.currentHp -= burstDmg;
        if (defender.currentHp < 0) defender.currentHp = 0;
        defender.effects.burn = 5; // 5 turns of burn
        log(`${name} used INFERNO! ${burstDmg} dmg + BURN for 5 turns!`);
    }
    else if (el === 'earth') {
        defender.effects.stun = 2; // Skips 2 turns
        log(`${name} used STUN! Enemy frozen for 2 turns.`);
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
        // Process Player Status Effects before giving control back
        processStatusEffects(state.player, "Player");
        if (state.player.currentHp <= 0) {
            checkWinCondition();
            return;
        }
        state.turn = 'player';
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

    // Update Sprite Color/Effect visual
    const sprite = document.getElementById('p1-sprite');

    // Reset classes
    sprite.className = 'sprite';
    // Add specific class
    sprite.classList.add(`${newElement}-bender`);

    // Visual feedback
    log(`Avatar switched to ${newElement.toUpperCase()}!`);
}

/* --- UTILS --- */
function updateHealthUI() {
    if (ui.p1 && ui.p1.bar) {
        ui.p1.bar.value = state.player.currentHp;
        ui.p1.bar.max = state.player.maxHp;
    }
    if (ui.p2 && ui.p2.bar) {
        ui.p2.bar.value = state.cpu.currentHp;
        ui.p2.bar.max = state.cpu.maxHp;
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
}

function checkWinCondition() {
    if (state.player.currentHp <= 0) {
        log("You Lost! The Fire Nation wins...");
        state.isOver = true;
        if (restartBtn) restartBtn.classList.remove('hidden');
    } else if (state.cpu.currentHp <= 0) {
        log("You Won! Balance is restored.");
        state.isOver = true;
        if (restartBtn) restartBtn.classList.remove('hidden');
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

// Start
document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log("Game script starting...");
        init();
    } catch (e) {
        logError(e.message);
    }
});