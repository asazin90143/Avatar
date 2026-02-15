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
    map: null,
    streak: 0,
    gameMode: 'single', // 'single', 'endless', '1v1'
    setupPhase: 'p1' // 'p1', 'p2'
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
            mode: document.getElementById('mode-select-screen'),
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

/* --- 1v1 SETUP --- */
function start1v1Setup() {
    state.gameMode = '1v1';
    state.setupPhase = 'p2';
    logDebug("1v1 Mode Selected. Player 2 choosing character.");

    // Switch to Char Select Screen
    if (screens.mode) {
        screens.mode.classList.remove('active');
        screens.mode.classList.add('hidden');
    }
    if (screens.select) {
        screens.select.classList.remove('hidden');
        screens.select.classList.add('active');
    }

    // Update Title
    const title = document.querySelector('#char-select-screen .title');
    if (title) title.innerText = "Player 2: Choose Your Element!";
}

function selectCharacter(key) {
    logDebug(`Selected character: ${key} (Phase: ${state.setupPhase})`);

    if (state.setupPhase === 'p1') {
        // Player 1 Setup
        state.player = createFighter(key, false);
        state.player.name = "Player 1";

        // Default CPU logic (for single/endless preview)
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
    else if (state.gameMode === '1v1' && state.setupPhase === 'p2') {
        // Player 2 Setup
        state.cpu = createFighter(key, false); // isCpu = false
        state.cpu.name = "Player 2";

        // Update Sprites
        if (ui.p2 && ui.p2.sprite) ui.p2.sprite.className = `sprite ${key}-bender`;

        // Start Game
        // Hide Select Screen handled in startGame
        if (screens.select) {
            screens.select.classList.remove('active');
            screens.select.classList.add('hidden');
        }
        startGame('1v1');
    }
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

/* --- MAP & MODE SELECTION --- */
function selectMap(mapName) {
    state.map = mapName;
    logDebug(`Map Selected: ${mapName}`);

    // Switch to Mode Screen
    if (screens.map) {
        screens.map.classList.remove('active');
        screens.map.classList.add('hidden');
    }
    if (screens.mode) {
        screens.mode.classList.remove('hidden');
        screens.mode.classList.add('active');
    }
}

function startGame(mode) {
    logDebug(`Starting game in ${mode} mode`);
    state.gameMode = mode;
    state.streak = 0;

    // Switch to Battle Screen
    if (screens.mode) {
        screens.mode.classList.remove('active');
        screens.mode.classList.add('hidden');
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
        const map = state.map;
        if (map.includes('Water')) arena.style.backgroundImage = "url('./background/Water Tribe.jpg')";
        else if (map.includes('Fire')) arena.style.backgroundImage = "url('./background/Fire Nation Ship.jpg')";
        else if (map.includes('Earth')) arena.style.backgroundImage = "url('./background/Earth Kingdom.jpg')";
        else arena.style.backgroundImage = "url('./background/Air Temple.jpg')";
    }

    // Setup UI
    if (ui.p1 && ui.p1.name) ui.p1.name.innerText = state.player.name;
    if (ui.p2 && ui.p2.name) ui.p2.name.innerText = state.cpu.name;

    updateHealthUI();
    updateCooldownsUI();

    // Reset Turn
    state.isOver = false;
    state.turn = 'player';

    // Avatar text/panel logic (moved from old startGame)
    if (state.player.isAvatar) {
        const switchPanel = document.getElementById('avatar-switch-panel');
        if (switchPanel) switchPanel.classList.remove('hidden');
        state.player.element = 'water';
        log("Avatar State: Choose element! " + (mode === 'endless' ? "Defeat as many as you can!" : "Defeat the enemy!"));
    } else {
        log(`Battle Start! ${state.player.name} vs ${state.cpu.name}` + (mode === 'endless' ? " (Endless Mode)" : ""));
    }
}

/* --- BATTLE LOGIC --- */
/* --- BATTLE LOGIC --- */
function executeMove(moveType) {
    if (state.isOver) return;

    let actor = state.player;
    let target = state.cpu;

    // Determine Turn
    if (state.turn === 'player') {
        // P1 acting
    } else if (state.turn === 'cpu') {
        if (state.gameMode === '1v1') {
            actor = state.cpu; // P2 acting
            target = state.player;
        } else {
            return; // Ignore clicks during AI turn
        }
    }

    // Check Stun
    if (actor.effects.stun > 0) {
        log(`${actor.name} is STUNNED and cannot move!`);
        actor.effects.stun--;
        endTurn();
        return;
    }

    // Check Cooldown
    if (actor.cooldowns[moveType] > 0) {
        log(`${moveType.toUpperCase()} is on cooldown! (${actor.cooldowns[moveType]} turns left)`);
        return;
    }

    // Apply Cooldown
    if (moveType === 'mid') actor.cooldowns.mid = 2;
    if (moveType === 'heavy') actor.cooldowns.heavy = 3;
    if (moveType === 'special') actor.cooldowns.special = 4;

    // Execute Move
    performAttack(actor, target, moveType);

    updateHealthUI();
    checkWinCondition();

    if (!state.isOver) {
        endTurn();
    }
}

function performAttack(attacker, defender, moveType) {
    if (SoundManager) SoundManager.playAttack(moveType);
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
        if (typeof SoundManager !== 'undefined') SoundManager.playDamage();
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

    if (amount > 0 && typeof SoundManager !== 'undefined') {
        SoundManager.playDamage();
    }

    target.currentHp -= amount;
    if (target.currentHp < 0) target.currentHp = 0;
    return amount;
}

/* --- TURN HANDLING --- */
function endTurn() {
    if (state.turn === 'player') {
        // Player 1 finished turn -> Switch to CPU/P2
        state.turn = 'cpu';
        const name = (state.gameMode === '1v1') ? "Player 2" : "CPU";

        // Cooldowns for CPU/P2 need to tick down at start of their turn
        ['mid', 'heavy', 'special'].forEach(m => {
            if (state.cpu.cooldowns[m] > 0) state.cpu.cooldowns[m]--;
        });

        processStatusEffects(state.cpu, name);
        if (state.cpu.currentHp <= 0) { checkWinCondition(); return; }

        if (state.gameMode !== '1v1') {
            setTimeout(() => {
                cpuTurn();
            }, 1500);
        } else {
            log("Player 2's Turn!");
            updateCooldownsUI();
        }
    } else {
        // Player 2 finished turn -> Switch to Player 1
        state.turn = 'player';

        // Cooldowns for P1 tick down
        ['mid', 'heavy', 'special'].forEach(m => {
            if (state.player.cooldowns[m] > 0) state.player.cooldowns[m]--;
        });

        processStatusEffects(state.player, "Player 1");
        if (state.player.currentHp <= 0) { checkWinCondition(); return; }

        log("Player 1's Turn!");
        updateCooldownsUI();
    }
}

function cpuTurn() {
    if (state.isOver) return;

    // Check Stun
    if (state.cpu.effects.stun > 0) {
        log("CPU is STUNNED!");
        state.cpu.effects.stun--;

        // Skip turn -> Back to Player
        state.turn = 'player';
        ['mid', 'heavy', 'special'].forEach(m => {
            if (state.player.cooldowns[m] > 0) state.player.cooldowns[m]--;
        });
        updateCooldownsUI();
        processStatusEffects(state.player, "Player");
        log("Your Turn!");
        return;
    }
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
    let actor = state.player;
    if (state.gameMode === '1v1' && state.turn === 'cpu') {
        actor = state.cpu;
    }

    if (!actor) return;

    const moves = ['mid', 'heavy', 'special'];
    moves.forEach(move => {
        const btn = document.getElementById(`btn-${move}`);
        if (btn) {
            const cd = actor.cooldowns[move];
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

    // Update Avatar Switch Panel Visibility based on active player
    const switchPanel = document.getElementById('avatar-switch-panel');
    if (switchPanel) {
        if (actor.isAvatar) {
            switchPanel.classList.remove('hidden');
        } else {
            switchPanel.classList.add('hidden');
        }
    }
}

function checkWinCondition() {
    if (state.player.currentHp <= 0) {
        if (state.gameMode === '1v1') {
            log("Player 2 WINS!");
            if (typeof SoundManager !== 'undefined') SoundManager.playWin();
        } else {
            log("You Lost! The Fire Nation wins...");
            if (typeof SoundManager !== 'undefined') SoundManager.playLose();
        }
        state.isOver = true;
        document.getElementById('restart-btn').classList.remove('hidden');
    } else if (state.cpu.currentHp <= 0) {
        if (state.gameMode === 'endless') {
            log("Enemy Defeated! Next round starting...");
            if (typeof SoundManager !== 'undefined') SoundManager.playWin();
            state.isOver = true; // Briefly pause
            setTimeout(() => {
                state.isOver = false;
                nextRound();
            }, 1000);
        } else {
            if (state.gameMode === '1v1') {
                log("Player 1 WINS!");
            } else {
                log("You Win! The world is saved.");
            }
            state.isOver = true;
            if (typeof SoundManager !== 'undefined') SoundManager.playWin();
            document.getElementById('restart-btn').classList.remove('hidden');
        }
    }
}

function nextRound() {
    state.streak++;

    // Heal Player (30%)
    const bonusHp = Math.floor(state.player.maxHp * 0.3);
    const oldHp = state.player.currentHp;
    state.player.currentHp = Math.min(state.player.maxHp, state.player.currentHp + bonusHp);
    const healedAmount = state.player.currentHp - oldHp;

    // Refresh Stats & Abilities
    state.player.cooldowns = { mid: 0, heavy: 0, special: 0 };
    state.player.effects = { stun: 0, burn: 0, evade: 0 };

    // Create New CPU
    const keys = ['water', 'fire', 'earth', 'air'];
    const cpuKey = keys[Math.floor(Math.random() * keys.length)];
    state.cpu = createFighter(cpuKey, true);

    // Scale CPU Difficulty (+15% HP per round)
    const scaling = 1 + (state.streak * 0.15);
    state.cpu.maxHp = Math.floor(state.cpu.maxHp * scaling);
    state.cpu.currentHp = state.cpu.maxHp;

    // Update CPU UI
    if (ui.p2 && ui.p2.sprite) ui.p2.sprite.className = `sprite ${cpuKey}-bender`;
    if (ui.p2 && ui.p2.name) ui.p2.name.innerText = `${state.cpu.name} (R${state.streak + 1})`;

    // Reset Turn
    state.turn = 'player';

    // Update visuals
    updateHealthUI();
    updateCooldownsUI();

    log(`Round ${state.streak + 1}! A new level ${state.streak + 1} ${state.cpu.name} appears! (+${healedAmount} HP)`);
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

window.toggleMute = function () {
    const isMuted = SoundManager.toggleMute();
    const btn = document.getElementById('mute-btn-dialog');
    if (btn) {
        btn.innerText = isMuted ? "Unmute" : "Mute";
        btn.classList.toggle('is-disabled', isMuted);
    }
};

// Start
document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log("Game script starting...");
        SoundManager.init(); // Init audio context
        init();

        // Resume Audio context on first click anywhere (browser policy)
        document.body.addEventListener('click', () => {
            if (SoundManager.ctx && SoundManager.ctx.state === 'suspended') {
                SoundManager.ctx.resume();
            }
        }, { once: true });

    } catch (e) {
        logError(e.message);
    }
});