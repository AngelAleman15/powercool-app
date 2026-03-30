// Necesitarás instalar sharp: npm install sharp

async function createIcons() {
  const sharpModule = await import('sharp')
  const sharp = sharpModule.default
  const svgBuffer = Buffer.from(`
    <svg width="192" height="192" xmlns="http://www.w3.org/2000/svg">
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
    </svg>
  `);

  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile('./public/icon-192.png');

  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile('./public/icon-512.png');

  console.log('✅ Íconos PNG creados con éxito');
}

createIcons().catch(console.error);
