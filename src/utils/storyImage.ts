import { calcDiff } from '../hooks/useCounter';

export interface StoryImageColors {
  bg: string;
  bgCard: string;
  ink: string;
  ink2: string;
  terra: string;
  terraLight: string;
}

export interface StoryImageInput {
  personOneName: string;
  personTwoName: string;
  startDate: string;
  sinceText?: string | null;
  photoUrl?: string | null;
  pageUrl: string;
  colors: StoryImageColors;
}

const W = 1080;
const H = 1920;
const CX = W / 2;

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function fitFontSize(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  startSize: number,
  minSize: number,
  fontFor: (size: number) => string
): number {
  let size = startSize;
  while (size > minSize) {
    ctx.font = fontFor(size);
    if (ctx.measureText(text).width <= maxWidth) break;
    size -= 2;
  }
  return size;
}

function ellipsize(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let truncated = text;
  while (truncated.length > 1 && ctx.measureText(`${truncated}…`).width > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return `${truncated}…`;
}

function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const scale = Math.max(w / img.width, h / img.height);
  const sw = w / scale;
  const sh = h / scale;
  const sx = (img.width - sw) / 2;
  const sy = (img.height - sh) / 2;
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

export async function generateStoryImage(input: StoryImageInput): Promise<Blob | null> {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  await document.fonts?.ready?.catch(() => {});

  const { colors } = input;

  // ── background ───────────────────────────────────────────────
  const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
  bgGrad.addColorStop(0, colors.bg);
  bgGrad.addColorStop(1, colors.bgCard);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  const blobA = ctx.createRadialGradient(940, 220, 0, 940, 220, 420);
  blobA.addColorStop(0, `${colors.terraLight}55`);
  blobA.addColorStop(1, `${colors.terraLight}00`);
  ctx.fillStyle = blobA;
  ctx.fillRect(0, 0, W, H);

  const blobB = ctx.createRadialGradient(80, 1500, 0, 80, 1500, 460);
  blobB.addColorStop(0, `${colors.terra}33`);
  blobB.addColorStop(1, `${colors.terra}00`);
  ctx.fillStyle = blobB;
  ctx.fillRect(0, 0, W, H);

  // ── brand mark ───────────────────────────────────────────────
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = colors.terra;
  ctx.font = '600 30px "DM Sans", sans-serif';
  try { (ctx as unknown as { letterSpacing: string }).letterSpacing = '5px'; } catch { /* unsupported */ }
  ctx.fillText('♥  SOMOS ETERNOS', CX, 170);
  try { (ctx as unknown as { letterSpacing: string }).letterSpacing = '0px'; } catch { /* unsupported */ }

  // ── photo / centerpiece ──────────────────────────────────────
  const frameX = 140, frameY = 250, frameW = 800, frameH = 840;
  let nextY = frameY + frameH + 130;

  const img = input.photoUrl ? await loadImage(input.photoUrl) : null;
  ctx.save();
  ctx.shadowColor = 'rgba(20,12,12,.25)';
  ctx.shadowBlur = 60;
  ctx.shadowOffsetY = 30;
  roundedRect(ctx, frameX, frameY, frameW, frameH, 28);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.restore();

  if (img) {
    ctx.save();
    roundedRect(ctx, frameX + 24, frameY + 24, frameW - 48, frameH - 48, 20);
    ctx.clip();
    drawCover(ctx, img, frameX + 24, frameY + 24, frameW - 48, frameH - 48);
    ctx.restore();
  } else {
    ctx.save();
    ctx.beginPath();
    ctx.arc(frameX + frameW / 2, frameY + frameH / 2, 200, 0, Math.PI * 2);
    ctx.fillStyle = colors.bg;
    ctx.fill();
    ctx.lineWidth = 14;
    ctx.strokeStyle = colors.terra;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const hx = frameX + frameW / 2, hy = frameY + frameH / 2;
    ctx.beginPath();
    ctx.moveTo(hx, hy + 70);
    ctx.bezierCurveTo(hx - 150, hy - 30, hx - 90, hy - 160, hx, hy - 60);
    ctx.bezierCurveTo(hx + 90, hy - 160, hx + 150, hy - 30, hx, hy + 70);
    ctx.stroke();
    ctx.restore();
  }

  // ── names ────────────────────────────────────────────────────
  const maxNameWidth = 880;
  const fullNames = `${input.personOneName} & ${input.personTwoName}`;
  const nameSize = fitFontSize(
    ctx, fullNames, maxNameWidth, 88, 44,
    (s) => `700 ${s}px "Playfair Display", Georgia, serif`
  );
  ctx.font = `700 ${nameSize}px "Playfair Display", Georgia, serif`;
  const ampFont = `italic 500 ${nameSize}px "Playfair Display", Georgia, serif`;
  const w1 = ctx.measureText(input.personOneName).width;
  ctx.font = ampFont;
  const wAmp = ctx.measureText(' & ').width;
  ctx.font = `700 ${nameSize}px "Playfair Display", Georgia, serif`;
  const w2 = ctx.measureText(input.personTwoName).width;
  const totalW = w1 + wAmp + w2;
  let nx = CX - totalW / 2;
  ctx.textAlign = 'left';
  ctx.fillStyle = colors.ink;
  ctx.font = `700 ${nameSize}px "Playfair Display", Georgia, serif`;
  ctx.fillText(input.personOneName, nx, nextY);
  nx += w1;
  ctx.fillStyle = colors.terra;
  ctx.font = ampFont;
  ctx.fillText(' & ', nx, nextY);
  nx += wAmp;
  ctx.fillStyle = colors.ink;
  ctx.font = `700 ${nameSize}px "Playfair Display", Georgia, serif`;
  ctx.fillText(input.personTwoName, nx, nextY);
  ctx.textAlign = 'center';
  nextY += nameSize * 0.6 + 30;

  if (input.sinceText) {
    ctx.font = 'italic 400 34px "Playfair Display", Georgia, serif';
    ctx.fillStyle = colors.ink2;
    ctx.fillText(ellipsize(ctx, input.sinceText, 860), CX, nextY);
    nextY += 90;
  } else {
    nextY += 20;
  }

  // ── counter ──────────────────────────────────────────────────
  const { days } = calcDiff(new Date(input.startDate));
  ctx.font = '600 24px "DM Sans", sans-serif';
  ctx.fillStyle = colors.terra;
  try { (ctx as unknown as { letterSpacing: string }).letterSpacing = '3px'; } catch { /* unsupported */ }
  ctx.fillText('JUNTOS HÁ', CX, nextY);
  try { (ctx as unknown as { letterSpacing: string }).letterSpacing = '0px'; } catch { /* unsupported */ }
  nextY += 150;
  ctx.font = '700 150px "Playfair Display", Georgia, serif';
  ctx.fillStyle = colors.ink;
  ctx.fillText(days.toLocaleString('pt-BR'), CX, nextY);
  nextY += 56;
  ctx.font = '600 28px "DM Sans", sans-serif';
  ctx.fillStyle = colors.ink2;
  try { (ctx as unknown as { letterSpacing: string }).letterSpacing = '3px'; } catch { /* unsupported */ }
  ctx.fillText('DIAS', CX, nextY);
  try { (ctx as unknown as { letterSpacing: string }).letterSpacing = '0px'; } catch { /* unsupported */ }

  // ── footer ───────────────────────────────────────────────────
  const footerY = 1720;
  ctx.fillStyle = colors.ink;
  ctx.beginPath();
  ctx.moveTo(0, footerY + 40);
  ctx.arcTo(0, footerY, 40, footerY, 40);
  ctx.lineTo(W - 40, footerY);
  ctx.arcTo(W, footerY, W, footerY + 40, 40);
  ctx.lineTo(W, H);
  ctx.lineTo(0, H);
  ctx.closePath();
  ctx.fill();

  ctx.textAlign = 'center';
  ctx.font = '500 22px "DM Sans", sans-serif';
  ctx.fillStyle = colors.terraLight;
  try { (ctx as unknown as { letterSpacing: string }).letterSpacing = '3px'; } catch { /* unsupported */ }
  ctx.fillText('A NOSSA HISTÓRIA CONTINUA EM', CX, footerY + 68);
  try { (ctx as unknown as { letterSpacing: string }).letterSpacing = '0px'; } catch { /* unsupported */ }

  const urlText = input.pageUrl.replace(/^https?:\/\//, '');
  const urlSize = fitFontSize(ctx, urlText, W - 120, 38, 22, (s) => `700 ${s}px "DM Sans", sans-serif`);
  ctx.font = `700 ${urlSize}px "DM Sans", sans-serif`;
  ctx.fillStyle = '#fff';
  ctx.fillText(urlText, CX, footerY + 148);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png', 0.95);
  });
}
