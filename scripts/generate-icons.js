// Simple script to create placeholder PNG icons
// Run: node scripts/generate-icons.js

const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

const svgTemplate = (size) => `
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#3b82f6" rx="20"/>
  <text x="50%" y="50%" font-size="${size * 0.5}" text-anchor="middle" dy=".35em" fill="white" font-family="Arial, sans-serif">🚴</text>
</svg>
`;

const publicDir = path.join(__dirname, '..', 'public');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

sizes.forEach(size => {
  const svg = svgTemplate(size);
  const filename = `icon-${size}.svg`;
  fs.writeFileSync(path.join(publicDir, filename), svg.trim());
  console.log(`Created ${filename}`);
});

console.log('\n✅ All icon placeholders created!');
console.log('\n📝 To create proper PNG icons:');
console.log('1. Design your icon (512x512)');
console.log('2. Use https://favicon.io or https://realfavicongenerator.net');
console.log('3. Replace the SVG files with PNG files\n');
