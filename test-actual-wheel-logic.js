#!/usr/bin/env node

/**
 * Test the ACTUAL production wheel logic from Wheel.jsx
 * This simulates exactly what happens when the wheel spins
 */

// This is the ACTUAL calculation from Wheel.jsx lines 267-285
function calculateWinnerFromRotation(finalRotation, names) {
  const finalNormalized = ((finalRotation % 360) + 360) % 360;
  const anglePerSegment = 360 / names.length;

  // This is the exact formula from production code (line 284-285)
  const segmentsRotated = finalNormalized / anglePerSegment;
  const calculatedWinnerIndex = (names.length - Math.floor(segmentsRotated) - 1 + names.length) % names.length;

  return calculatedWinnerIndex;
}

// This is the ACTUAL drawing logic from Wheel.jsx line 158
function getVisualWinnerAtPointer(finalRotation, names) {
  const anglePerSegment = 360 / names.length;

  // The pointer is at 0° (top center)
  // Segments are drawn starting at -90° + rotation
  // We need to find which segment contains the 0° position

  for (let index = 0; index < names.length; index++) {
    // Convert to radians for exact match with drawing code
    const rotationRad = (finalRotation * Math.PI) / 180;
    const startAngle = index * (anglePerSegment * Math.PI / 180) - Math.PI / 2 + rotationRad;
    const endAngle = startAngle + (anglePerSegment * Math.PI / 180);

    // Normalize angles to 0-2π
    const normalizeAngle = (angle) => {
      const normalized = angle % (2 * Math.PI);
      return normalized < 0 ? normalized + 2 * Math.PI : normalized;
    };

    const normStart = normalizeAngle(startAngle);
    const normEnd = normalizeAngle(endAngle);

    // Pointer is at 0° (0 radians)
    // Check if 0 is within this segment's range
    const pointerAngle = 0;

    // Handle wrap-around case
    if (normStart > normEnd) {
      // Segment wraps around 0
      if (pointerAngle >= normStart || pointerAngle <= normEnd) {
        return index;
      }
    } else {
      // Normal case
      if (pointerAngle >= normStart && pointerAngle <= normEnd) {
        return index;
      }
    }
  }

  // Fallback - should never reach here
  return 0;
}

function runTest(numberOfNames, numberOfSpins) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`TEST: ${numberOfNames} participants, ${numberOfSpins} spins`);
  console.log('='.repeat(70));

  const names = Array.from({ length: numberOfNames }, (_, i) => `Person ${i}`);
  let currentRotation = 0;
  let mismatches = 0;
  const mismatchDetails = [];

  for (let spin = 1; spin <= numberOfSpins; spin++) {
    // Simulate the actual spin logic from Wheel.jsx line 222-229
    const numberOfSpinRotations = 5 + Math.random() * 5;
    const extraDegrees = Math.random() * 360;
    const totalRotation = numberOfSpinRotations * 360 + extraDegrees;
    const finalRotation = currentRotation + totalRotation;

    // Calculate winner using production algorithm
    const calculatedWinner = calculateWinnerFromRotation(finalRotation, names);

    // Find visual winner (what actually appears at the pointer)
    const visualWinner = getVisualWinnerAtPointer(finalRotation, names);

    const match = calculatedWinner === visualWinner;
    const normalized = ((finalRotation % 360) + 360) % 360;

    if (!match) {
      mismatches++;
      mismatchDetails.push({
        spin,
        calculated: calculatedWinner,
        visual: visualWinner,
        rotation: normalized.toFixed(2),
        calculatedName: names[calculatedWinner],
        visualName: names[visualWinner]
      });

      console.log(`\n❌ MISMATCH in Spin ${spin}:`);
      console.log(`   Final Rotation: ${normalized.toFixed(2)}°`);
      console.log(`   Calculated Winner: [${calculatedWinner}] ${names[calculatedWinner]}`);
      console.log(`   Visual Winner:     [${visualWinner}] ${names[visualWinner]}`);
    } else if (spin <= 3 || spin % 100 === 0) {
      // Show some passing examples
      console.log(`✅ Spin ${spin}: Winner [${calculatedWinner}] ${names[calculatedWinner]} (${normalized.toFixed(2)}°)`);
    }

    currentRotation = finalRotation;
  }

  console.log(`\n${'-'.repeat(70)}`);
  console.log(`Results: ${numberOfSpins - mismatches}/${numberOfSpins} matches (${((numberOfSpins - mismatches) / numberOfSpins * 100).toFixed(1)}%)`);
  console.log(`Mismatches: ${mismatches}`);

  if (mismatches > 0) {
    console.log(`\nMismatch Rate: ${(mismatches / numberOfSpins * 100).toFixed(1)}%`);
  }

  return { mismatches, total: numberOfSpins, details: mismatchDetails };
}

console.log('\n🎯 PRODUCTION WHEEL LOGIC VALIDATION TEST');
console.log('Testing for mismatches between calculated winner and visual winner\n');

const results = [];

// Test with different participant counts
results.push({ name: '5 participants', ...runTest(5, 1000) });
results.push({ name: '10 participants', ...runTest(10, 1000) });
results.push({ name: '20 participants', ...runTest(20, 1000) });
results.push({ name: '55 participants (Norefjell)', ...runTest(55, 1000) });

// Summary
console.log('\n' + '='.repeat(70));
console.log('FINAL SUMMARY');
console.log('='.repeat(70));

let totalMismatches = 0;
let totalSpins = 0;

results.forEach(result => {
  totalMismatches += result.mismatches;
  totalSpins += result.total;
  const accuracy = ((result.total - result.mismatches) / result.total * 100).toFixed(2);
  console.log(`${result.name}: ${result.mismatches}/${result.total} mismatches (${accuracy}% accurate)`);
});

console.log(`\nOverall: ${totalMismatches}/${totalSpins} mismatches`);
console.log(`Accuracy: ${((totalSpins - totalMismatches) / totalSpins * 100).toFixed(2)}%`);

if (totalMismatches === 0) {
  console.log('\n✅ PERFECT! No mismatches found. The algorithm is correct!');
  process.exit(0);
} else {
  console.log(`\n❌ BUG CONFIRMED! Found ${totalMismatches} cases where calculated winner ≠ visual winner`);
  console.log('\nThe announced winner does not match who appears at the pointer.');
  process.exit(1);
}
