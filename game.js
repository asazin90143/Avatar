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
const screens = {
    select: document.getElementById('char-select-screen'),
    map: document.getElementById('map-select-screen'),
    battle: document.getElementById('battle-screen')
};

const logs = document.getElementById('battle-log');
const restartBtn = document.getElementById('restart-btn');

// UI Helpers
const ui = {
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

/* --- INITIALIZATION --- */
function init() {
    const grid = document.getElementById('char-grid');
    Object.keys(CHARACTERS).forEach(key => {
        const btn = document.createElement('button');
        btn.className = `nes-btn char-card`;
        // Capitalize first letter
        const displayKey = key.charAt(0).toUpperCase() + key.slice(1);
        btn.innerText = displayKey;

        // Color coding buttons
        if (key === 'water') btn.classList.add('is-primary');
        if (key === 'fire') btn.classList.add('is-error');
        if (key === 'earth') btn.classList.add('is-success');
        if (key === 'air') btn.classList.add('is-warning');

        btn.onclick = () => selectCharacter(key);
        grid.appendChild(btn);
    });
}

function selectCharacter(key) {
    // Player Setup
    state.player = createFighter(key, false);

    // CPU Setup (Random, but not Avatar to keep it simple)
    const keys = ['water', 'fire', 'earth', 'air'];
    const cpuKey = keys[Math.floor(Math.random() * keys.length)];
    state.cpu = createFighter(cpuKey, true);

    // Update Sprites
    ui.p1.sprite.className = `sprite ${key}-bender`;
    ui.p2.sprite.className = `sprite ${cpuKey}-bender`;

    // Switch to Map Screen
    screens.select.classList.remove('active');
    screens.map.classList.add('active');
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
    state.map = mapName;
    screens.map.classList.remove('active');
    screens.battle.classList.add('active');

    // Set Background Colors (Replace with URL in CSS if desired)
    const arena = document.getElementById('arena-bg');
    if (mapName.includes('Water')) arena.style.background = 'linear-gradient(to bottom, #001f3f, #0074D9)';
    if (mapName.includes('Fire')) arena.style.background = 'linear-gradient(to bottom, #85144b, #FF4136)';
    if (mapName.includes('Earth')) arena.style.background = 'linear-gradient(to bottom, #3D9970, #2ECC40)';
    if (mapName.includes('Air')) arena.style.background = 'linear-gradient(to bottom, #7FDBFF, #39CCCC)';

    ui.p1.name.innerText = state.player.name;
    ui.p2.name.innerText = state.cpu.name;

    updateHealthUI();

    // If Player is Avatar, show Switch Panel
    if (state.player.isAvatar) {
        document.getElementById('avatar-switch-panel').classList.remove('hidden');
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
        defender.effects.burn = 4;
        log(`${name} used BURN! Enemy will take dmg.`);
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
    // Water beats Fire
    if (atkEl === 'water' && defEl === 'fire') return 1.5;
    // Earth beats Fire
    if (atkEl === 'earth' && defEl === 'fire') return 1.5;
    // Air beats Earth
    if (atkEl === 'air' && defEl === 'earth') return 1.5;
    // Fire beats Air
    if (atkEl === 'fire' && defEl === 'air') return 1.5;

    // Weaknesses (Optional balance)
    if (atkEl === 'fire' && defEl === 'water') return 0.5;
    if (atkEl === 'fire' && defEl === 'earth') return 0.5;

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
        state.turn = 'player';
    }
}

function processStatusEffects(char, name) {
    // Burn
    if (char.effects.burn > 0) {
        const burnDmg = Math.floor(char.maxHp * 0.05);
        char.currentHp -= burnDmg;
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
    ui.p1.bar.value = state.player.currentHp;
    ui.p1.bar.max = state.player.maxHp;
    ui.p2.bar.value = state.cpu.currentHp;
    ui.p2.bar.max = state.cpu.maxHp;

    // Status Text
    let p1Status = "";
    if (state.player.effects.burn > 0) p1Status += "BURNED ";
    if (state.player.effects.stun > 0) p1Status += "STUNNED ";
    if (state.player.effects.evade > 0) p1Status += "EVASIVE ";
    ui.p1.status.innerText = p1Status;

    let p2Status = "";
    if (state.cpu.effects.burn > 0) p2Status += "BURNED ";
    if (state.cpu.effects.stun > 0) p2Status += "STUNNED ";
    if (state.cpu.effects.evade > 0) p2Status += "EVASIVE ";
    ui.p2.status.innerText = p2Status;
}

function checkWinCondition() {
    if (state.player.currentHp <= 0) {
        log("You Lost! The Fire Nation wins...");
        state.isOver = true;
        restartBtn.classList.remove('hidden');
    } else if (state.cpu.currentHp <= 0) {
        log("You Won! Balance is restored.");
        state.isOver = true;
        restartBtn.classList.remove('hidden');
    }
}

function log(msg) {
    logs.innerText = msg;
    console.log(msg);
}

// Start
init();