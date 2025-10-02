#!/usr/bin/env node

/**
 * Simple test - manually verify 3 consecutive spins
 */

function getSegmentAtTop(rotation, numberOfSegments) {
  const normalizedRotation = ((rotation % 360) + 360) % 360;
  const anglePerSegment = 360 / numberOfSegments;
  const segmentIndex = Math.floor(normalizedRotation / anglePerSegment) % numberOfSegments;
  return segmentIndex;
}

function spin(currentRotation, numSegments, targetWinner) {
  const anglePerSegment = 360 / numSegments;
  const fullSpins = 1800; // Fixed for testing

  const currentNormalized = ((currentRotation % 360) + 360) % 360;
  const targetAngle = targetWinner * anglePerSegment;

  let angleToRotate = targetAngle - currentNormalized;
  if (angleToRotate < 0) angleToRotate += 360;

  const centerOffset = anglePerSegment / 2;
  const newTarget = currentRotation + fullSpins + angleToRotate + centerOffset;

  return newTarget;
}

console.log('Simple Test: 4 segments, 3 spins\n');
console.log('='.repeat(60));

const numSegments = 4;
let rotation = 0;

// Spin 1: Target segment 2
console.log('\nSpin 1: Target segment 2');
console.log(`  Current rotation: ${rotation}°`);
console.log(`  Current normalized: ${((rotation % 360) + 360) % 360}°`);
console.log(`  Current segment at top: ${getSegmentAtTop(rotation, numSegments)}`);

rotation = spin(rotation, numSegments, 2);
console.log(`  New rotation: ${rotation}°`);
console.log(`  New normalized: ${((rotation % 360) + 360) % 360}°`);
console.log(`  Segment at top: ${getSegmentAtTop(rotation, numSegments)}`);
console.log(`  ✓ Expected: 2, Got: ${getSegmentAtTop(rotation, numSegments)}`);

// Spin 2: Target segment 0
console.log('\nSpin 2: Target segment 0');
console.log(`  Current rotation: ${rotation}°`);
console.log(`  Current normalized: ${((rotation % 360) + 360) % 360}°`);
console.log(`  Current segment at top: ${getSegmentAtTop(rotation, numSegments)}`);

rotation = spin(rotation, numSegments, 0);
console.log(`  New rotation: ${rotation}°`);
console.log(`  New normalized: ${((rotation % 360) + 360) % 360}°`);
console.log(`  Segment at top: ${getSegmentAtTop(rotation, numSegments)}`);
console.log(`  ✓ Expected: 0, Got: ${getSegmentAtTop(rotation, numSegments)}`);

// Spin 3: Target segment 3
console.log('\nSpin 3: Target segment 3');
console.log(`  Current rotation: ${rotation}°`);
console.log(`  Current normalized: ${((rotation % 360) + 360) % 360}°`);
console.log(`  Current segment at top: ${getSegmentAtTop(rotation, numSegments)}`);

rotation = spin(rotation, numSegments, 3);
console.log(`  New rotation: ${rotation}°`);
console.log(`  New normalized: ${((rotation % 360) + 360) % 360}°`);
console.log(`  Segment at top: ${getSegmentAtTop(rotation, numSegments)}`);
console.log(`  ✓ Expected: 3, Got: ${getSegmentAtTop(rotation, numSegments)}`);

console.log('\n' + '='.repeat(60));
console.log('Results:');
console.log('All spins should land on the target segment!');
