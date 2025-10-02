// Generate colors based on Attensi brand palette
const baseColors = [
  '#00D9FF', // Cyan bright
  '#0099CC', // Darker cyan
  '#00FFAA', // Green-cyan
  '#0088FF', // Bright blue
  '#00BBDD', // Medium cyan
  '#00FF88', // Neon green
  '#0077BB', // Deep blue
  '#00CCFF', // Sky blue
];

export const generateSegmentColors = (count) => {
  const colors = [];
  for (let i = 0; i < count; i++) {
    colors.push(baseColors[i % baseColors.length]);
  }
  return colors;
};

export const getRandomColor = () => {
  return baseColors[Math.floor(Math.random() * baseColors.length)];
};
