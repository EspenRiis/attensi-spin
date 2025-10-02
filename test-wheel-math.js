#!/usr/bin/env node

/**
 * Test script to validate the wheel rotation calculations
 * This simulates the spinWheel logic and verifies winners land at the top
 */

// Simulate the drawing logic from Wheel.jsx line 64:
// startAngle = index * anglePerSegment - Math.PI / 2 + (rotation * Math.PI) / 180
// When rotation = 0, segment 1 (not 0!) is at the top due to the -90° offset

function getSegmentAtTop(rotation, numberOfSegments) {
  // Normalize rotation to 0-360
  const normalizedRotation = ((rotation % 360) + 360) % 360;

  // Calculate angle per segment
  const anglePerSegment = 360 / numberOfSegments;

  // The drawing starts with -90° offset, so segment 1 is at top when rotation=0
  // We need to add anglePerSegment/2 to account for this offset
  const adjustedRotation = normalizedRotation + (anglePerSegment / 2);

  // Calculate which segment
  const segmentIndex = Math.floor(adjustedRotation / anglePerSegment) % numberOfSegments;

  return segmentIndex;
}

function simulateSpin(currentRotation, names, targetWinnerIndex) {
  const anglePerSegment = 360 / names.length;
  const numberOfSpins = 5 + Math.random() * 5;
  const fullSpins = numberOfSpins * 360;

  // This is our actual algorithm from Wheel.jsx
  const currentNormalizedRotation = ((currentRotation % 360) + 360) % 360;

  // Key insight: when rotation=0, segment 1 (not 0) is at top
  // So to get segment N at top: rotation = N * anglePerSegment - anglePerSegment/2
  const targetRotationForWinner = targetWinnerIndex * anglePerSegment - (anglePerSegment / 2);

  let angleToRotate = targetRotationForWinner - currentNormalizedRotation;

  // Ensure forward rotation
  while (angleToRotate <= 0) {
    angleToRotate += 360;
  }

  const newTarget = currentRotation + fullSpins + angleToRotate;

  return newTarget;
}

function runTest(testName, numberOfNames, numberOfSpins) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`TEST: ${testName}`);
  console.log(`Names: ${numberOfNames}, Spins: ${numberOfSpins}`);
  console.log('='.repeat(60));

  const names = Array.from({ length: numberOfNames }, (_, i) => `Person ${i}`);
  let currentRotation = 0;
  let allPassed = true;

  for (let spin = 1; spin <= numberOfSpins; spin++) {
    // Pick random winner
    const targetWinner = Math.floor(Math.random() * numberOfNames);

    // Simulate spin
    const finalRotation = simulateSpin(currentRotation, names, targetWinner);

    // Check which segment landed at top
    const actualWinner = getSegmentAtTop(finalRotation, numberOfNames);

    const passed = actualWinner === targetWinner;
    const status = passed ? '✅ PASS' : '❌ FAIL';

    const normalized = ((finalRotation % 360) + 360) % 360;

    console.log(`\nSpin ${spin}:`);
    console.log(`  Target Winner: ${targetWinner} (${names[targetWinner]})`);
    console.log(`  Start Rotation: ${currentRotation.toFixed(2)}°`);
    console.log(`  Final Rotation: ${finalRotation.toFixed(2)}°`);
    console.log(`  Normalized: ${normalized.toFixed(2)}°`);
    console.log(`  Actual Winner: ${actualWinner} (${names[actualWinner]})`);
    console.log(`  ${status}`);

    if (!passed) {
      allPassed = false;
      console.log(`  ⚠️  ERROR: Expected ${targetWinner} but got ${actualWinner}`);
    }

    // Update rotation for next spin
    currentRotation = finalRotation;
  }

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`Overall: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  console.log('─'.repeat(60));

  return allPassed;
}

// Run comprehensive tests
console.log('\n🎯 WHEEL ROTATION ALGORITHM TEST SUITE\n');

const results = [];

// Test with different segment counts
results.push(runTest('2 Segments (50/50)', 2, 10));
results.push(runTest('3 Segments (Equal thirds)', 3, 10));
results.push(runTest('4 Segments (Quarters)', 4, 10));
results.push(runTest('5 Segments (Pentagon)', 5, 10));
results.push(runTest('8 Segments (Octagon)', 8, 10));
results.push(runTest('12 Segments (Many names)', 12, 10));

// Edge case: many segments
results.push(runTest('20 Segments (Crowded wheel)', 20, 5));

// Summary
console.log('\n' + '='.repeat(60));
console.log('FINAL SUMMARY');
console.log('='.repeat(60));

const totalPassed = results.filter(r => r).length;
const totalTests = results.length;

console.log(`Total Test Suites: ${totalTests}`);
console.log(`Passed: ${totalPassed}`);
console.log(`Failed: ${totalTests - totalPassed}`);

if (totalPassed === totalTests) {
  console.log('\n🎉 ALL TESTS PASSED! The algorithm is working correctly!');
  process.exit(0);
} else {
  console.log('\n❌ SOME TESTS FAILED. The algorithm needs adjustment.');
  process.exit(1);
}
