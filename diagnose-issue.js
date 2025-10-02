#!/usr/bin/env node

console.log('Diagnosing the issue\n');
console.log('='.repeat(60));

// We have 4 names: A=0, B=1, C=2, D=3
// User says: D should win but B was announced
// That's off by 2 positions

const names = ['A', 'B', 'C', 'D'];
const anglePerSegment = 360 / 4; // 90°

console.log('Setup: 4 segments (A=0, B=1, C=2, D=3)');
console.log(`Angle per segment: ${anglePerSegment}°\n`);

console.log('Drawing logic (from Wheel.jsx line 64):');
console.log('startAngle = index * anglePerSegment - 90° + rotation\n');

console.log('When rotation = 0°:');
for (let i = 0; i < 4; i++) {
  const startAngle = i * anglePerSegment - 90;
  const endAngle = startAngle + anglePerSegment;
  console.log(`  ${names[i]} (index ${i}): ${startAngle}° to ${endAngle}°`);
  if (startAngle <= 0 && endAngle > 0) {
    console.log(`    ✓ This segment contains 0° (pointer position)`);
  }
}

console.log('\n' + '='.repeat(60));
console.log('\nOur algorithm says:');
console.log('To land winner at pointer: rotation = index * anglePerSegment + anglePerSegment/2');
console.log('\nFor D (index 3): rotation = 3 * 90 + 45 = 315°\n');

console.log('Let\'s check where D would be at rotation = 315°:');
const rotation = 315;
for (let i = 0; i < 4; i++) {
  const startAngle = i * anglePerSegment - 90 + rotation;
  const endAngle = startAngle + anglePerSegment;
  const normalizedStart = ((startAngle % 360) + 360) % 360;
  const normalizedEnd = ((endAngle % 360) + 360) % 360;
  console.log(`  ${names[i]}: ${startAngle}° to ${endAngle}° (normalized: ${normalizedStart}° to ${normalizedEnd}°)`);
  if ((normalizedStart <= 0 || normalizedStart >= 350) || (normalizedEnd >= 0 && normalizedEnd <= 10)) {
    console.log(`    ✓ Near 0° (pointer)`);
  }
}

console.log('\n' + '='.repeat(60));
console.log('\nLet me check: if D should be at pointer, what rotation do we actually need?\n');

// D is index 3
// startAngle = 3 * 90 - 90 + rotation = 180 + rotation
// We want startAngle to be -45 (so center is at 0)
// -45 = 180 + rotation
// rotation = -225 = 135°

console.log('D starts at: 3 * 90 - 90 + rotation = 180 + rotation');
console.log('For D to be centered at 0°, we need: 180 + rotation = -45');
console.log('Solving: rotation = -225° = 135°\n');

console.log('Checking rotation = 135°:');
const testRotation = 135;
for (let i = 0; i < 4; i++) {
  const startAngle = i * anglePerSegment - 90 + testRotation;
  const centerAngle = startAngle + anglePerSegment / 2;
  const normalizedCenter = ((centerAngle % 360) + 360) % 360;
  console.log(`  ${names[i]}: center at ${centerAngle}° (normalized: ${normalizedCenter}°)`);
  if (Math.abs(normalizedCenter) < 5 || Math.abs(normalizedCenter - 360) < 5) {
    console.log(`    ✓ CENTER IS AT 0° (pointer)! This is the winner!`);
  }
}

console.log('\n' + '='.repeat(60));
console.log('\n❌ WRONG FORMULA: rotation = index * anglePerSegment + anglePerSegment/2');
console.log('✅ CORRECT FORMULA: rotation = (index - 1) * anglePerSegment + anglePerSegment/2');
console.log('\nOR simplified: rotation = index * anglePerSegment - anglePerSegment/2');
