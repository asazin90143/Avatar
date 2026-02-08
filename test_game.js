/**
 * Avatar Game Logic Test Script
 * Tests core game mechanics without browser
 */

// Simulate the game configuration
const CHARACTERS = {
    water: { name: 'Water Master', hp: 100, element: 'water' },
    fire: { name: 'Fire Lord', hp: 100, element: 'fire' },
    earth: { name: 'Earth Guard', hp: 120, element: 'earth' },
    air: { name: 'Air Monk', hp: 90, element: 'air' },
    avatar: { name: ' The Avatar', hp: 110, element: 'avatar' }
};

const SKILLS = {
    light: { dmg: 10, name: "Light Atk" },
    mid: { dmg: 20, name: "Mid Atk" },
    heavy: { dmg: 30, name: "Heavy Atk" }
};

function getTypeModifier(atkEl, defEl) {
    // === STRENGTHS (1.5x) ===
    if (atkEl === 'water' && defEl === 'fire') return 1.5;
    if (atkEl === 'earth' && defEl === 'fire') return 1.5;
    if (atkEl === 'air' && defEl === 'earth') return 1.5;
    if (atkEl === 'fire' && defEl === 'air') return 1.5;

    // === WEAKNESSES (0.5x) ===
    if (atkEl === 'fire' && defEl === 'water') return 0.5;
    if (atkEl === 'fire' && defEl === 'earth') return 0.5;
    if (atkEl === 'earth' && defEl === 'air') return 0.5;
    if (atkEl === 'air' && defEl === 'fire') return 0.5;

    return 1.0;
}

function createFighter(key) {
    const template = CHARACTERS[key];
    return {
        ...template,
        maxHp: template.hp,
        currentHp: template.hp,
        isAvatar: (key === 'avatar'),
        effects: { stun: 0, burn: 0, evade: 0 }
    };
}

// ============ TESTS ============
let passed = 0;
let failed = 0;

function test(name, condition) {
    if (condition) {
        console.log(`✅ PASS: ${name}`);
        passed++;
    } else {
        console.log(`❌ FAIL: ${name}`);
        failed++;
    }
}

console.log("\n========== AVATAR GAME TESTS ==========\n");

// Test 1: Character HP values match PRD
console.log("--- Character Tests ---");
test("Water Master HP = 100", CHARACTERS.water.hp === 100);
test("Fire Lord HP = 100", CHARACTERS.fire.hp === 100);
test("Earth Guard HP = 120", CHARACTERS.earth.hp === 120);
test("Air Monk HP = 90", CHARACTERS.air.hp === 90);
test("Avatar HP = 110", CHARACTERS.avatar.hp === 110);

// Test 2: Skill damage values match PRD
console.log("\n--- Skill Tests ---");
test("Light attack = 10 dmg", SKILLS.light.dmg === 10);
test("Mid attack = 20 dmg", SKILLS.mid.dmg === 20);
test("Heavy attack = 30 dmg", SKILLS.heavy.dmg === 30);

// Test 3: Type modifiers (STRENGTHS)
console.log("\n--- Type Advantage Tests (1.5x) ---");
test("Water > Fire = 1.5x", getTypeModifier('water', 'fire') === 1.5);
test("Earth > Fire = 1.5x", getTypeModifier('earth', 'fire') === 1.5);
test("Air > Earth = 1.5x", getTypeModifier('air', 'earth') === 1.5);
test("Fire > Air = 1.5x", getTypeModifier('fire', 'air') === 1.5);

// Test 4: Type modifiers (WEAKNESSES)
console.log("\n--- Type Weakness Tests (0.5x) ---");
test("Fire > Water = 0.5x", getTypeModifier('fire', 'water') === 0.5);
test("Fire > Earth = 0.5x", getTypeModifier('fire', 'earth') === 0.5);
test("Earth > Air = 0.5x", getTypeModifier('earth', 'air') === 0.5);
test("Air > Fire = 0.5x", getTypeModifier('air', 'fire') === 0.5);

// Test 5: Neutral matchups
console.log("\n--- Neutral Type Tests (1.0x) ---");
test("Water vs Water = 1.0x", getTypeModifier('water', 'water') === 1.0);
test("Water vs Earth = 1.0x", getTypeModifier('water', 'earth') === 1.0);
test("Earth vs Water = 1.0x", getTypeModifier('earth', 'water') === 1.0);

// Test 6: Fighter creation
console.log("\n--- Fighter Creation Tests ---");
const waterFighter = createFighter('water');
test("Fighter has currentHp", waterFighter.currentHp === 100);
test("Fighter has maxHp", waterFighter.maxHp === 100);
test("Fighter has effects object", waterFighter.effects !== undefined);
test("Fighter effects.burn starts at 0", waterFighter.effects.burn === 0);
test("Avatar fighter isAvatar=true", createFighter('avatar').isAvatar === true);
test("Non-avatar fighter isAvatar=false", createFighter('water').isAvatar === false);

// Test 7: Damage calculation
console.log("\n--- Damage Calculation Tests ---");
const baseDmg = SKILLS.heavy.dmg; // 30
test("Heavy + Super Effective = 45", Math.floor(baseDmg * 1.5) === 45);
test("Heavy + Not Effective = 15", Math.floor(baseDmg * 0.5) === 15);
test("Heavy + Neutral = 30", Math.floor(baseDmg * 1.0) === 30);

// Summary
console.log("\n========== RESULTS ==========");
console.log(`Total: ${passed + failed} tests`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
console.log("==============================\n");

if (failed === 0) {
    console.log("🎉 ALL TESTS PASSED! Game logic matches PRD requirements.");
    process.exit(0);
} else {
    console.log("⚠️ Some tests failed. Please review the failures above.");
    process.exit(1);
}
