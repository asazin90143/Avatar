/* --- GAME STATE --- */
const state = {
    player: null,
    cpu: null,
    turn: 'player', // 'player' or 'cpu'
    isOver: false,
    map: null
};

/* --- DATA --- */
const CHARACTERS = {
    water: { name: 'Water Tribe', hp: 100, element: 'water', color: '#3498db' },
    fire: { name: 'Fire Nation', hp: 100, element: 'fire', color: '#e74c3c' },
    earth: { name: 'Earth Kingdom', hp: 120, element: 'earth', color: '#27ae60' }, // Tankier
    air: { name: 'Air Nomads', hp: 90, element: 'air', color: '#f1c40f' }, // Fragile
    avatar: { name: ' The Avatar', hp: 110, element: 'avatar', color: 'purple' }
};

const SKILLS = {
    light: { dmg: 10, name: "Light Atk" },
    mid: { dmg: 20, name: "Mid Atk" },
    heavy: { dmg: 30, name: "Heavy Atk" }
};

/* --- DOM ELEMENTS --- */
const screens = {
    select: document.getElementById('char-select-screen'),
    map: document.getElementById('map-select-screen'),
    battle: document.getElementById('battle-screen')
};

const logs = document.getElementById('battle-log');
const p1Ui = { bar: document.getElementById('p1-health'), sprite: document.getElementById('p1-sprite'), status: document.getElementById('p1-status') };
const p2Ui = { bar: document.getElementById('p2-health'), sprite: document.getElementById('p2-sprite'), status: document.getElementById('p2-status') };

/* --- INITIALIZATION --- */
function init() {
    const grid = document.getElementById('char-grid');
    Object.keys(CHARACTERS).forEach(key => {
        const btn = document.createElement('button');
        btn.className = `nes-btn char-card`;
        btn.innerText = CHARACTERS[key].name;
        btn.onclick = () => selectCharacter(key);
        grid.appendChild(btn);
    });
}

function selectCharacter(key) {
    // Player Setup
    state.player = { ...CHARACTERS[key], maxHp: CHARACTERS[key].hp, currentHp: CHARACTERS[key].hp, effects: {} };
    state.player.isAvatar = (key === 'avatar');

    // CPU Setup (Random)
    const keys = ['water', 'fire', 'earth', 'air'];
    const cpuKey = keys[Math.floor(Math.random() * keys.length)];
    state.cpu = { ...CHARACTERS[cpuKey], maxHp: CHARACTERS[cpuKey].hp, currentHp: CHARACTERS[cpuKey].hp, effects: {} };

    // Update UI Sprites
    p1Ui.sprite.className = `sprite ${key}-bender`;
    p2Ui.sprite.className = `sprite ${cpuKey}-bender`;

    // Switch Screen
    screens.select.classList.remove('active');
    screens.map.classList.add('active');
}

function startGame(mapName) {
    state.map = mapName;
    screens.map.classList.remove('active');
    screens.battle.classList.add('active');

    // Set Background (Simple Color Logic for MVP, replace with URL for images)
    const arena = document.getElementById('arena-bg');
    if (mapName.includes('Water')) arena.style.backgroundColor = '#003366';
    if (mapName.includes('Fire')) arena.style.backgroundColor = '#660000';
    if (mapName.includes('Earth')) arena.style.backgroundColor = '#3e2723';
    if (mapName.includes('Air')) arena.style.backgroundColor = '#81d4fa';

    document.getElementById('p1-name').innerText = state.player.name;
    document.getElementById('p2-name').innerText = state.cpu.name;

    updateHealthUI();

    // If Player is Avatar, show Switch Panel
    if (state.player.isAvatar) {
        document.getElementById('avatar-switch-panel').classList.remove('hidden');
        state.player.element = 'water'; // Default
    }

    log(`Battle Start! ${state.player.name} vs ${state.cpu.name}`);
}

/* --- COMBAT LOGIC --- */
function executeMove(moveType) {
    if (state.turn !== 'player' || state.isOver) return;

    // Handle Stun
    if (state.player.effects.stun > 0) {
        log("You are stunned and cannot move!");
        state.player.effects.stun--;
        endTurn();
        return;
    }

    let dmg = 0;

    // 1. Calculate Base Damage
    if (moveType === 'special') {
        handleSpecial(state.player, state.cpu); // Special Logic
    } else {
        dmg = SKILLS[moveType].dmg;

        // 2. Power Scaling (Type Matchup)
        const modifier = getTypeModifier(state.player.element, state.cpu.element);
        dmg = Math.floor(dmg * modifier);

        // 3. Apply Damage
        applyDamage(state.cpu, dmg);

        let msg = `You used ${moveType}!`;
        if (modifier > 1) msg += " It's Super Effective!";
        if (modifier < 1) msg += " It's not very effective...";
        log(msg);
    }

    updateHealthUI();
    checkWinCondition();

    if (!state.isOver) {
        endTurn();
    }
}

function handleSpecial(attacker, defender) {
    const el = attacker.element;

    if (el === 'water') {
        // Heal
        const healAmt = Math.floor(attacker.maxHp * 0.25); // 25%
        attacker.currentHp = Math.min(attacker.maxHp, attacker.currentHp + healAmt);
        log(`${attacker.name} healed for ${healAmt} HP!`);
    }
    else if (el === 'fire') {
        // Burn (Applied to defender)
        defender.effects.burn = 4;
        log(`${attacker.name} burned the enemy!`);
    }
    else if (el === 'earth') {
        // Stun
        defender.effects.stun = 2;
        log(`${attacker.name} STUNNED the enemy!`);
    }
    else if (el === 'air') {
        // Evade
        attacker.effects.evade = 4;
        log(`${attacker.name} is evading attacks!`);
    }
}

function getTypeModifier(atkEl, defEl) {
    if (atkEl === 'water' && defEl === 'fire') return 1.5;
    if (atkEl === 'earth' && defEl === 'fire') return 1.5; // As per prompt
    if (atkEl === 'air' && defEl === 'earth') return 1.5;
    if (atkEl === 'fire' && defEl === 'air') return 1.5;
    // Inverse (Weaknesses) - Optional but good for balance
    if (atkEl === 'fire' && defEl === 'water') return 0.5;
    return 1.0;
}

function applyDamage(target, amount) {
    // Check Evade
    if (target.effects.evade > 0) {
        if (Math.random() < 0.8) { // 80% chance
            log(`${target.name} evaded the attack!`);
            return;
        }
    }
    target.currentHp -= amount;
    if (target.currentHp < 0) target.currentHp = 0;
}

/* --- TURN MANAGEMENT --- */
function endTurn() {
    state.turn = 'cpu';

    // Process End of Turn Effects (Burn) for CPU
    processStatusEffects(state.cpu);

    setTimeout(() => {
        cpuTurn();
    }, 1500);
}

function cpuTurn() {
    if (state.isOver) return;

    // Check Stun
    if (state.cpu.effects.stun > 0) {
        log("CPU is stunned!");
        state.cpu.effects.stun--;
        state.turn = 'player';
        return;
    }

    // AI Logic: Random Move
    const moves = ['light', 'mid', 'heavy', 'special'];
    // Simple AI: Don't use special if already active? (Skipped for MVP simplicity)
    const move = moves[Math.floor(Math.random() * moves.length)];

    if (move === 'special') {
        handleSpecial(state.cpu, state.player);
    } else {
        let dmg = SKILLS[move].dmg;
        const mod = getTypeModifier(state.cpu.element, state.player.element);
        dmg = Math.floor(dmg * mod);
        applyDamage(state.player, dmg);
        log(`CPU used ${move}! Dealt ${dmg} dmg.`);
    }

    updateHealthUI();
    checkWinCondition();

    if (!state.isOver) {
        processStatusEffects(state.player); // Process Player burns
        state.turn = 'player';
    }
}

function processStatusEffects(char) {
    // Burn Damage
    if (char.effects.burn > 0) {
        const burnDmg = Math.floor(char.maxHp * 0.05);
        char.currentHp -= burnDmg;
        char.effects.burn--;
        log(`${char.name} took ${burnDmg} burn damage!`);
        updateHealthUI();
    }
    // Evade Decay
    if (char.effects.evade > 0) char.effects.evade--;
}

function avatarSwitch(newElement) {
    if (!state.player.isAvatar) return;
    state.player.element = newElement;

    // Update Sprite Color
    const sprite = document.getElementById('p1-sprite');
    sprite.className = `sprite ${newElement}-bender`;

    log(`Avatar switched to ${newElement}!`);
}

/* --- UTILS --- */
function updateHealthUI() {
    p1Ui.bar.value = state.player.currentHp;
    p1Ui.bar.max = state.player.maxHp;
    p2Ui.bar.value = state.cpu.currentHp;
    p2Ui.bar.max = state.cpu.maxHp;
}

function checkWinCondition() {
    if (state.player.currentHp <= 0) {
        log("You Lost! Refresh to play again.");
        state.isOver = true;
    } else if (state.cpu.currentHp <= 0) {
        log("You Won! Refresh to play again.");
        state.isOver = true;
    }
}

function log(msg) {
    logs.innerText = msg;
    console.log(msg);
}

// Start
init();