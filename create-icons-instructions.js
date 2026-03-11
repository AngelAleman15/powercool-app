const fs = require('fs');
const path = require('path');

// Crear un SVG simple que Chrome pueda usar
const icon192SVG = `<svg width="192" height="192" xmlns="http://www.w3.org/2000/svg">
  <rect width="192" height="192" fill="#0a0a0a"/>
  <rect x="48" y="48" width="96" height="96" rx="12" fill="white"/>
  <g stroke="#0a0a0a" stroke-width="4" stroke-linecap="round">
    <line x1="72" y1="60" x2="72" y2="68"/>
    <line x1="120" y1="60" x2="120" y2="68"/>
    <line x1="72" y1="124" x2="72" y2="132"/>
    <line x1="120" y1="124" x2="120" y2="132"/>
    <line x1="60" y1="72" x2="52" y2="72"/>
    <line x1="60" y1="120" x2="52" y2="120"/>
    <line x1="140" y1="72" x2="132" y2="72"/>
    <line x1="140" y1="120" x2="132" y2="120"/>
    <rect x="80" y="84" width="32" height="24" fill="none" stroke="#0a0a0a" stroke-width="3"/>
  </g>
</svg>`;

const icon512SVG = icon192SVG.replace(/192/g, '512').replace(/48/g, '128').replace(/96/g, '256')
  .replace(/72/g, '192').replace(/120/g, '320').replace(/60/g, '160').replace(/68/g, '180')
  .replace(/124/g, '332').replace(/132/g, '352').replace(/52/g, '140').replace(/140/g, '372')
  .replace(/80/g, '192').replace(/84/g, '192').replace(/32/g, '128').replace(/24/g, '96');

console.log('Archivos SVG creados. Para Android, necesitas convertirlos a PNG.');
console.log('');
console.log('Solución rápida:');  
console.log('1. Ve a: https://svgtopng.com/');
console.log('2. Sube public/icon-192.svg y descarga como PNG (192x192)');
console.log('3. Sube public/icon-512.svg y descarga como PNG (512x512)');
console.log('4. Guarda los PNG en public/ como icon-192.png e icon-512.png');
