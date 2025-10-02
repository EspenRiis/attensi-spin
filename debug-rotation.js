#!/usr/bin/env node

/**
 * Debug script - manually trace through the rotation calculation
 */

console.log('DEBUG: Understanding the rotation calculation\n');
console.log('='.repeat(60));

// Example: 2 segments, want to land segment 0 at top
const numberOfSegments = 2;
const targetWinner = 0;
const anglePerSegment = 360 / numberOfSegments; // 180°

console.log(`Number of segments: ${numberOfSegments}`);
console.log(`Angle per segment: ${anglePerSegment}°`);
console.log(`Target winner: ${targetWinner}\n`);

// When rotation = 0, which segment is at the top?
console.log('When rotation = 0°:');
console.log(`  Segment 0 starts at: 0° * ${anglePerSegment} = 0°`);
console.log(`  Segment 1 starts at: 1° * ${anglePerSegment} = ${anglePerSegment}°`);
console.log(`  → Segment at top (0-${anglePerSegment}°): Segment 0\n`);

// When rotation = 180°, which segment is at the top?
console.log(`When rotation = ${anglePerSegment}°:`);
console.log(`  Normalized rotation: ${anglePerSegment}°`);
console.log(`  Which segment? floor(${anglePerSegment} / ${anglePerSegment}) = ${Math.floor(anglePerSegment / anglePerSegment)}`);
console.log(`  → Segment at top: Segment 1\n`);

// So the logic is: segmentAtTop = floor(normalizedRotation / anglePerSegment)
console.log('Formula: segmentAtTop = floor(normalizedRotation / anglePerSegment)\n');

console.log('='.repeat(60));
console.log('Testing the algorithm:\n');

// Start at rotation = 0
let currentRotation = 0;
console.log(`Starting rotation: ${currentRotation}°`);
console.log(`Current segment at top: ${Math.floor(currentRotation / anglePerSegment)}`);

// Want to land on segment 1
const desiredWinner = 1;
console.log(`\nWant to land on segment: ${desiredWinner}`);

// Calculate target
const currentNormalized = ((currentRotation % 360) + 360) % 360;
const targetAngle = desiredWinner * anglePerSegment;
let angleToRotate = targetAngle - currentNormalized;
if (angleToRotate < 0) angleToRotate += 360;

const centerOffset = anglePerSegment / 2;
const finalRotation = currentRotation + angleToRotate + centerOffset;
const finalNormalized = ((finalRotation % 360) + 360) % 360;

console.log(`\nCalculations:`);
console.log(`  Current normalized: ${currentNormalized}°`);
console.log(`  Target angle for winner: ${targetAngle}°`);
console.log(`  Angle to rotate: ${angleToRotate}°`);
console.log(`  Center offset: ${centerOffset}°`);
console.log(`  Final rotation: ${finalRotation}°`);
console.log(`  Final normalized: ${finalNormalized}°`);

const actualWinner = Math.floor(finalNormalized / anglePerSegment) % numberOfSegments;
console.log(`\nActual segment at top: ${actualWinner}`);
console.log(`Expected: ${desiredWinner}`);
console.log(`Match: ${actualWinner === desiredWinner ? '✅ YES' : '❌ NO'}`);

// Let's think about this differently
console.log('\n' + '='.repeat(60));
console.log('ALTERNATIVE APPROACH:\n');

console.log('The drawing code (Wheel.jsx line 64):');
console.log('  startAngle = index * anglePerSegment - 90° + rotation');
console.log('');
console.log('Segment 0 when rotation=0: starts at -90° (top)');
console.log('Segment 1 when rotation=0: starts at -90° + 180° = 90° (right)');
console.log('');
console.log('After rotating 180°:');
console.log('Segment 0: starts at -90° + 180° = 90° (right)');
console.log('Segment 1: starts at -90° + 180° + 180° = 270° (left) → wraps to -90° (top)');
console.log('');
console.log('So to get segment N at top, rotate by N * anglePerSegment degrees');
console.log('This matches our algorithm!');

console.log('\n' + '='.repeat(60));
console.log('ISSUE FOUND: The center offset might be pushing into next segment!');
console.log('');
console.log(`With centerOffset = ${centerOffset}°:`);
console.log(`  Segment 1 target: ${targetAngle}°`);
console.log(`  Plus center offset: ${targetAngle + centerOffset}°`);
console.log(`  Which segment? floor(${targetAngle + centerOffset} / ${anglePerSegment}) = ${Math.floor((targetAngle + centerOffset) / anglePerSegment)}`);
console.log('');
console.log('✅ The center offset is correct - it keeps us within the target segment');
