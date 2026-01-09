// Kernel Density Estimation utilities for smooth distribution curves

/**
 * Gaussian kernel function
 * Returns the probability density at a given distance from the center
 */
const gaussianKernel = (x) => {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
};

/**
 * Calculate bandwidth using Scott's rule
 * h = 1.06 * σ * n^(-1/5)
 *
 * @param {Array} data - Array of {response_value, count} objects
 * @returns {number} - Optimal bandwidth for KDE
 */
export const calculateBandwidth = (data) => {
  if (!data || data.length === 0) return 5; // Default bandwidth

  // Expand data points based on count
  const allValues = data.flatMap(d => Array(d.count).fill(d.response_value));
  const n = allValues.length;

  if (n === 0) return 5;
  if (n === 1) return 5; // Single point, use default

  // Calculate mean
  const mean = allValues.reduce((sum, x) => sum + x, 0) / n;

  // Calculate variance
  const variance = allValues.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / n;
  const stdDev = Math.sqrt(variance);

  // Scott's rule: h = 1.06 * σ * n^(-1/5)
  const bandwidth = 1.06 * stdDev * Math.pow(n, -0.2);

  // Ensure bandwidth is not too small or too large
  return Math.max(2, Math.min(bandwidth, 15));
};

/**
 * Calculate Kernel Density Estimation
 * Generates a smooth curve from discrete data points
 *
 * @param {Array} data - Array of {response_value, count} objects
 * @param {number} bandwidth - KDE bandwidth (smoothness parameter)
 * @param {number} samplePoints - Number of points to sample along x-axis
 * @returns {Array} - Array of {x, y} points for the curve
 */
export const calculateKDE = (data, bandwidth, samplePoints = 101) => {
  if (!data || data.length === 0) {
    return Array.from({ length: samplePoints }, (_, i) => ({ x: i, y: 0 }));
  }

  // Expand data points based on count
  const allValues = data.flatMap(d => Array(d.count).fill(d.response_value));
  const n = allValues.length;

  if (n === 0) {
    return Array.from({ length: samplePoints }, (_, i) => ({ x: i, y: 0 }));
  }

  // Generate sample points from 0 to 100
  const points = Array.from({ length: samplePoints }, (_, i) => i);

  // Calculate density at each sample point
  const densities = points.map(x => {
    const density = allValues.reduce((sum, xi) => {
      return sum + gaussianKernel((x - xi) / bandwidth);
    }, 0) / (n * bandwidth);

    return { x, y: density };
  });

  return densities;
};

/**
 * Calculate distribution statistics
 *
 * @param {Array} data - Array of {response_value, count} objects
 * @returns {Object} - {mean, median, mode, stdDev, totalResponses}
 */
export const calculateStats = (data) => {
  if (!data || data.length === 0) {
    return {
      mean: 0,
      median: 0,
      mode: 0,
      stdDev: 0,
      totalResponses: 0,
    };
  }

  // Expand data points
  const allValues = data.flatMap(d => Array(d.count).fill(d.response_value));
  const n = allValues.length;

  if (n === 0) {
    return {
      mean: 0,
      median: 0,
      mode: 0,
      stdDev: 0,
      totalResponses: 0,
    };
  }

  // Mean
  const mean = allValues.reduce((sum, x) => sum + x, 0) / n;

  // Median (sort and find middle)
  const sorted = [...allValues].sort((a, b) => a - b);
  const median = n % 2 === 0
    ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
    : sorted[Math.floor(n / 2)];

  // Mode (most frequent value)
  const frequency = {};
  allValues.forEach(val => {
    frequency[val] = (frequency[val] || 0) + 1;
  });
  const mode = parseInt(
    Object.keys(frequency).reduce((a, b) =>
      frequency[a] > frequency[b] ? a : b
    )
  );

  // Standard deviation
  const variance = allValues.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / n;
  const stdDev = Math.sqrt(variance);

  return {
    mean: Math.round(mean * 10) / 10,
    median: Math.round(median * 10) / 10,
    mode,
    stdDev: Math.round(stdDev * 10) / 10,
    totalResponses: n,
  };
};

/**
 * Generate SVG path string from KDE points
 * Creates a smooth curve using the points
 *
 * @param {Array} points - Array of {x, y} KDE points
 * @param {number} width - SVG width
 * @param {number} height - SVG height
 * @returns {string} - SVG path d attribute
 */
export const generateSVGPath = (points, width, height) => {
  if (!points || points.length === 0) return '';

  // Find max y value for scaling
  const maxY = Math.max(...points.map(p => p.y), 0.001); // Avoid division by zero

  // Scale points to SVG dimensions
  const scaleX = width / 100; // 0-100 range
  const scaleY = height;

  // Start path
  let path = `M 0,${height}`; // Start at bottom left

  // Add curve points
  points.forEach(point => {
    const x = point.x * scaleX;
    const y = height - (point.y / maxY * scaleY);
    path += ` L ${x},${y}`;
  });

  // Close path at bottom right
  path += ` L ${width},${height} Z`;

  return path;
};

export default {
  calculateBandwidth,
  calculateKDE,
  calculateStats,
  generateSVGPath,
  gaussianKernel,
};
