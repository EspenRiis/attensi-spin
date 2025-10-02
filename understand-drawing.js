#!/usr/bin/env node

/**
 * Understanding the canvas drawing logic
 */

console.log('Understanding Canvas Drawing Logic\n');
console.log('='.repeat(60));

// From Wheel.jsx line 64:
// startAngle = index * anglePerSegment - Math.PI / 2 + (rotation * Math.PI) / 180
//
// In degrees:
// startAngle = index * anglePerSegment - 90° + rotation

console.log('\nDrawing formula:');
console.log('startAngle = index * anglePerSegment - 90° + rotation\n');

console.log('Example: 4 segments, rotation = 0°');
console.log('Pointer at top (0° in canvas, which is 3 o\'clock)');
console.log('But we offset by -90°, so pointer is effectively at -90° (12 o\'clock)\n');

const numSegments = 4;
const anglePerSegment = 360 / numSegments;

for (let i = 0; i < numSegments; i++) {
  const startAngle = i * anglePerSegment - 90 + 0; // rotation = 0
  const endAngle = startAngle + anglePerSegment;
  const normalizedStart = ((startAngle % 360) + 360) % 360;
  const normalizedEnd = ((endAngle % 360) + 360) % 360;

  console.log(`Segment ${i}:`);
  console.log(`  Start: ${startAngle}° (normalized: ${normalizedStart}°)`);
  console.log(`  End: ${endAngle}° (normalized: ${normalizedEnd}°)`);
  console.log(`  Range: ${normalizedStart}° - ${normalizedEnd}°`);

  if (normalizedStart <= 0 || (normalizedStart > 270 && normalizedEnd <= 90)) {
    console.log(`  ✓ This segment is at the TOP (pointer at 0°/-90°)`);
  }
}

console.log('\n' + '='.repeat(60));
console.log('\nAfter rotating 90°:');

for (let i = 0; i < numSegments; i++) {
  const startAngle = i * anglePerSegment - 90 + 90; // rotation = 90
  const endAngle = startAngle + anglePerSegment;
  const normalizedStart = ((startAngle % 360) + 360) % 360;
  const normalizedEnd = ((endAngle % 360) + 360) % 360;

  console.log(`Segment ${i}:`);
  console.log(`  Start: ${startAngle}° (normalized: ${normalizedStart}°)`);
  console.log(`  End: ${endAngle}° (normalized: ${normalizedEnd}°)`);
  console.log(`  Range: ${normalizedStart}° - ${normalizedEnd}°`);

  if (normalizedStart <= 0 || (normalizedStart >= 270)) {
    console.log(`  ✓ This segment is at the TOP`);
  }
}

console.log('\n' + '='.repeat(60));
console.log('\nKEY INSIGHT:');
console.log('When rotation = 0°:');
console.log('  Segment 0 starts at -90° (top of wheel)');
console.log('  Segment 0 is at the pointer!\n');

console.log('When rotation = 90°:');
console.log('  Segment 0 starts at 0°');
console.log('  Segment 1 starts at 0° (top of wheel)');
console.log('  Segment 1 is at the pointer!\n');

console.log('So: To get segment N at the pointer:');
console.log('  rotation = N * anglePerSegment\n');

console.log('BUT! The pointer in our drawing is at the TOP.');
console.log('Canvas coordinates: 0° is RIGHT (3 o\'clock)');
console.log('We offset by -90° to make 0° be TOP (12 o\'clock)');
console.log('\nSo when we say "rotation = 90°", segment 1 is at the top.');
