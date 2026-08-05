import { createCanvas } from 'canvas';
import * as fs from 'fs';
import * as path from 'path';

// Define dimensions for cards (portrait ratio 2:3, scaled for crisp rendering)
const WIDTH = 400;
const HEIGHT = 600;
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'cards');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function drawSlimeBody(ctx: any, cx: number, cy: number, rx: number, ry: number) {
  ctx.beginPath();
  // Draw organic slightly wobbly body using beziers
  ctx.moveTo(cx - rx, cy);
  ctx.bezierCurveTo(cx - rx, cy - ry * 1.2, cx + rx, cy - ry * 1.2, cx + rx, cy);
  ctx.bezierCurveTo(cx + rx, cy + ry * 0.9, cx - rx, cy + ry * 0.9, cx - rx, cy);
  ctx.closePath();
}

function drawMouth(ctx: any, cx: number, cy: number, style: 'angry' | 'cheerful' | 'confused' | 'sleepy' | 'naughty') {
  ctx.save();
  ctx.fillStyle = '#000000';
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#000000';
  
  if (style === 'angry') {
    // Open screaming mouth with one tooth
    ctx.beginPath();
    ctx.arc(cx, cy + 10, 15, 0, Math.PI, false);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // Tooth
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(cx - 5, cy + 10);
    ctx.lineTo(cx, cy + 18);
    ctx.lineTo(cx + 5, cy + 10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (style === 'cheerful') {
    // Happy open mouth
    ctx.beginPath();
    ctx.arc(cx, cy + 10, 16, 0, Math.PI, false);
    ctx.closePath();
    ctx.fill();
    
    // Tongue
    ctx.fillStyle = '#ff758c';
    ctx.beginPath();
    ctx.arc(cx, cy + 20, 8, 0, Math.PI, true);
    ctx.fill();
  } else if (style === 'confused') {
    // Small squiggly mouth
    ctx.beginPath();
    ctx.moveTo(cx - 10, cy + 12);
    ctx.bezierCurveTo(cx - 5, cy + 8, cx, cy + 16, cx + 10, cy + 12);
    ctx.stroke();
  } else if (style === 'sleepy') {
    // Little o mouth yawning
    ctx.beginPath();
    ctx.arc(cx, cy + 12, 6, 0, Math.PI * 2);
    ctx.fill();
  } else if (style === 'naughty') {
    // Wide cheeky smirk
    ctx.beginPath();
    ctx.arc(cx, cy + 5, 20, 0.1 * Math.PI, 0.9 * Math.PI, false);
    ctx.stroke();
  }
  ctx.restore();
}

function drawEyes(ctx: any, cx: number, cy: number, style: 'angry' | 'cheerful' | 'confused' | 'sleepy' | 'naughty') {
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 3;

  if (style === 'angry') {
    // Slanted angry eyes
    // Left eye
    ctx.beginPath();
    ctx.arc(cx - 20, cy - 15, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Right eye
    ctx.beginPath();
    ctx.arc(cx + 20, cy - 15, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Pupils
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(cx - 18, cy - 13, 4, 0, Math.PI * 2);
    ctx.arc(cx + 18, cy - 13, 4, 0, Math.PI * 2);
    ctx.fill();

    // Angry brows
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cx - 32, cy - 26);
    ctx.lineTo(cx - 10, cy - 18);
    ctx.moveTo(cx + 32, cy - 26);
    ctx.lineTo(cx + 10, cy - 18);
    ctx.stroke();
  } else if (style === 'cheerful') {
    // Big happy eyes with sparkles
    ctx.beginPath();
    ctx.arc(cx - 22, cy - 15, 12, 0, Math.PI * 2);
    ctx.arc(cx + 22, cy - 15, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Big pupils
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(cx - 22, cy - 15, 7, 0, Math.PI * 2);
    ctx.arc(cx + 22, cy - 15, 7, 0, Math.PI * 2);
    ctx.fill();

    // White sparkles
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx - 24, cy - 17, 3, 0, Math.PI * 2);
    ctx.arc(cx + 20, cy - 17, 3, 0, Math.PI * 2);
    ctx.fill();
  } else if (style === 'confused') {
    // Uneven eyes
    ctx.beginPath();
    ctx.arc(cx - 20, cy - 15, 13, 0, Math.PI * 2); // Left big
    ctx.arc(cx + 20, cy - 15, 8, 0, Math.PI * 2);  // Right small
    ctx.fill();
    ctx.stroke();

    // Pupils
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(cx - 20, cy - 15, 4, 0, Math.PI * 2);
    ctx.arc(cx + 20, cy - 15, 3, 0, Math.PI * 2);
    ctx.fill();
  } else if (style === 'sleepy') {
    // Closed curved sleepy eyes
    ctx.beginPath();
    ctx.arc(cx - 20, cy - 10, 10, Math.PI, 0, false);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx + 20, cy - 10, 10, Math.PI, 0, false);
    ctx.stroke();
  } else if (style === 'naughty') {
    // Winking / mischievous eyes
    // Left eye winking (curved line)
    ctx.beginPath();
    ctx.arc(cx - 20, cy - 10, 10, 0.2 * Math.PI, 0.8 * Math.PI, false);
    ctx.stroke();

    // Right eye wide
    ctx.beginPath();
    ctx.arc(cx + 20, cy - 15, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(cx + 18, cy - 13, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawBackgroundCardPattern(ctx: any, colorHex: string) {
  // Border frame
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  
  ctx.lineWidth = 14;
  ctx.strokeStyle = colorHex;
  ctx.strokeRect(7, 7, WIDTH - 14, HEIGHT - 14);

  ctx.lineWidth = 3;
  ctx.strokeStyle = '#000000';
  ctx.strokeRect(14, 14, WIDTH - 28, HEIGHT - 28);
}

function generateCardArt(
  filename: string,
  color: 'red' | 'yellow' | 'green' | 'blue' | 'wild',
  faceStyle: 'angry' | 'cheerful' | 'confused' | 'sleepy' | 'naughty'
) {
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');

  const palette = {
    red: { body: '#ef4444', bg: '#fee2e2', border: '#b91c1c' },
    yellow: { body: '#eab308', bg: '#fef9c3', border: '#a16207' },
    green: { body: '#22c55e', bg: '#dcfce7', border: '#15803d' },
    blue: { body: '#3b82f6', bg: '#dbeafe', border: '#1d4ed8' },
    wild: { body: '#71717a', bg: '#3f3f46', border: '#18181b' },
  };

  const colors = palette[color];

  // 1. Draw card border and background
  drawBackgroundCardPattern(ctx, colors.border);
  
  // Fill inner background
  ctx.fillStyle = colors.bg;
  ctx.fillRect(16, 16, WIDTH - 32, HEIGHT - 32);

  // Decorative vector rays in background
  ctx.save();
  ctx.translate(WIDTH / 2, HEIGHT / 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
  for (let i = 0; i < 12; i++) {
    ctx.rotate(Math.PI / 6);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-20, -350);
    ctx.lineTo(20, -350);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // 2. Draw playfull slime monster body
  const cx = WIDTH / 2;
  const cy = HEIGHT / 2;

  ctx.save();
  // Draw shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 90, 80, 20, 0, 0, Math.PI * 2);
  ctx.fill();

  // Draw main body
  ctx.fillStyle = colors.body;
  if (color === 'wild') {
    // Rainbow stripes for wild
    ctx.save();
    drawSlimeBody(ctx, cx, cy, 95, 100);
    ctx.clip();
    const stripeColors = ['#ef4444', '#3b82f6', '#eab308', '#22c55e'];
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = stripeColors[i];
      ctx.fillRect(cx - 150 + i * 75, cy - 150, 75, 300);
    }
    ctx.restore();
  } else {
    drawSlimeBody(ctx, cx, cy, 95, 100);
    ctx.fill();
  }

  // Draw body outline
  ctx.lineWidth = 6;
  ctx.strokeStyle = '#000000';
  drawSlimeBody(ctx, cx, cy, 95, 100);
  ctx.stroke();

  // Draw face
  drawEyes(ctx, cx, cy, faceStyle);
  drawMouth(ctx, cx, cy, faceStyle);

  ctx.restore();

  // Export file
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(OUTPUT_DIR, filename), buffer);
}

function generateCardBack() {
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#18181b';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.lineWidth = 14;
  ctx.strokeStyle = '#27272a';
  ctx.strokeRect(7, 7, WIDTH - 14, HEIGHT - 14);

  ctx.lineWidth = 3;
  ctx.strokeStyle = '#000000';
  ctx.strokeRect(14, 14, WIDTH - 28, HEIGHT - 28);

  // Center swirls
  const cx = WIDTH / 2;
  const cy = HEIGHT / 2;

  ctx.save();
  ctx.translate(cx, cy);
  const colors = ['#ef4444', '#3b82f6', '#eab308', '#22c55e'];
  
  for (let i = 0; i < 30; i++) {
    ctx.rotate(0.15);
    ctx.scale(0.95, 0.95);
    ctx.strokeStyle = colors[i % 4];
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.arc(0, 0, 180, 0, Math.PI / 2);
    ctx.stroke();
  }
  ctx.restore();

  // Slime silhouette
  ctx.fillStyle = '#09090b';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 4;
  
  ctx.save();
  drawSlimeBody(ctx, cx, cy, 80, 85);
  ctx.fill();
  ctx.stroke();
  
  // Text logo "TUMPUK!" in center
  ctx.fillStyle = '#ffffff';
  ctx.font = 'black 42px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 6;
  ctx.strokeStyle = '#000000';
  ctx.strokeText('TUMPUK!', cx, cy);
  ctx.fillText('TUMPUK!', cx, cy);
  ctx.restore();

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(OUTPUT_DIR, 'card_back.png'), buffer);
}

// Generate the suite of card base images
console.log('Generating procedural card art assets...');
generateCardArt('red_base.png', 'red', 'angry');
generateCardArt('yellow_base.png', 'yellow', 'cheerful');
generateCardArt('green_base.png', 'green', 'confused');
generateCardArt('blue_base.png', 'blue', 'sleepy');
generateCardArt('wild_base.png', 'wild', 'naughty');
generateCardBack();
console.log('Card art generation completed successfully.');
