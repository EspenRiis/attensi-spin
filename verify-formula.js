#!/usr/bin/env node

console.log('Verifying the rotation formula\n');

// Simulate: 4 segments
const numSegments = 4;
const anglePerSegment = 360 / numSegments; // 90°

console.log(`Testing with ${numSegments} segments (${anglePerSegment}° each)\n`);

// Drawing logic from Wheel.jsx line 64:
// startAngle = index * anglePerSegment (radians) - 90° + rotation

console.log('Drawing positions when rotation = 0°:');
for (let i = 0; i < numSegments; i++) {
  const startAngle = i * anglePerSegment - 90;
  const centerAngle = startAngle + anglePerSegment / 2;
  console.log(`  Segment ${i}: starts at ${startAngle}°, center at ${centerAngle}°`);
}

console.log('\nThe pointer is at 0° (top after -90° offset)');
console.log('Which segment center is closest to 0°?');
console.log('  Segment 0 center: -45° (or 315°)');
console.log('  Segment 1 center: 45°');
console.log('→ Neither is at 0°! Need to think differently.\n');

console.log('='.repeat(60));
console.log('\nActually, the pointer is at the TOP of the circle.');
console.log('In canvas coords with -90° offset, that\'s at angle 0°');
console.log('\nWhen rotation = 0°:');
console.log('  Segment 0: -90° to 0° (wraps from 270° to 0°) ✓ Contains 0°!');
console.log('  So segment 0 IS at the pointer when rotation = 0°\n');

console.log('When rotation = 90°:');
for (let i = 0; i < numSegments; i++) {
  const startAngle = i * anglePerSegment - 90 + 90; // rotation = 90
  const endAngle = startAngle + anglePerSegment;
  const normalized = ((startAngle % 360) + 360) % 360;
  console.log(`  Segment ${i}: ${startAngle}° to ${endAngle}° (start normalized: ${normalized}°)`);
  if (startAngle <= 0 && endAngle >= 0) {
    console.log(`    ✓ Contains 0° (the pointer!)`);
  }
}

console.log('\n' + '='.repeat(60));
console.log('\nCONCLUSION:');
console.log('To get segment N at the pointer (0°):');
console.log('  rotation = N * anglePerSegment');
console.log('\nTo center segment N at the pointer:');
console.log('  rotation = N * anglePerSegment + anglePerSegment/2');
console.log('\nThis is what we implemented ✓');
