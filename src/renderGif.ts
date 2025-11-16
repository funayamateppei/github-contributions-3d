import GIFEncoder from 'gifencoder';
import { createCanvas } from 'canvas';
import fs from 'fs';
import { ContributionData } from './fetchContributions.js';

/**
 * Render animated GIF of 3D contribution graph with bars growing from bottom to top
 * Fixed viewpoint, animating bar heights
 */
export async function renderGif(
  contributionData: ContributionData,
  outputPath: string,
  width: number = 800,
  height: number = 600,
  frames: number = 30,
  delay: number = 100
): Promise<void> {
  const { contributions } = contributionData;

  // Isometric view angle (similar to the reference image)
  const rotation = -Math.PI / 6; // -30 degrees for left-to-right diagonal view

  // Calculate the bounds of the graph first to determine canvas size
  const tempSorted = contributions.map(c => {
    const x = c.week;
    const z = c.day;
    // Isometric projection
    const rotatedX = x * Math.cos(rotation) - z * Math.sin(rotation);
    const rotatedZ = x * Math.sin(rotation) + z * Math.cos(rotation);
    return { rotatedX, rotatedZ, count: c.count };
  });

  const minX = Math.min(...tempSorted.map(c => c.rotatedX));
  const maxX = Math.max(...tempSorted.map(c => c.rotatedX));
  const minZ = Math.min(...tempSorted.map(c => c.rotatedZ));
  const maxZ = Math.max(...tempSorted.map(c => c.rotatedZ));
  const maxHeight = Math.max(...contributions.map(c => c.count)) * 0.1;

  // Drawing parameters
  const padding = 5;
  const heightScale = 3;
  const barWidthRatio = 0.9;

  // Calculate dimensions
  const graphWidth = maxX - minX;
  const graphDepth = maxZ - minZ;

  // Calculate scale based on width
  const scale = (width - padding * 2) / (graphWidth + barWidthRatio);

  // Calculate all screen positions to find actual bounds
  const boxWidth = scale * barWidthRatio;
  const boxDepth = scale * barWidthRatio;

  // Calculate screen Y positions for all bars
  const screenPositions = tempSorted.map(({ rotatedX, rotatedZ, count }) => {
    const barHeight = count * 0.1;
    const barVisualHeight = barHeight * scale * heightScale;

    // Y position at the top of the bar (without barDepth offset for top face)
    const topY = (rotatedZ - minZ) * scale * 0.5 - barVisualHeight;
    // Y position at the bottom of the bar
    const bottomY = (rotatedZ - minZ) * scale * 0.5;

    return { topY, bottomY, barVisualHeight };
  });

  const minTopY = Math.min(...screenPositions.map(p => p.topY - boxDepth));
  const maxBottomY = Math.max(...screenPositions.map(p => p.bottomY));

  const canvasWidth = Math.ceil((graphWidth + barWidthRatio) * scale + padding * 2);
  const canvasHeight = Math.ceil(maxBottomY - minTopY + padding * 2);

  // Create canvas with exact size
  const canvas = createCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext('2d');

  // Create GIF encoder
  const encoder = new GIFEncoder(canvasWidth, canvasHeight);
  const stream = fs.createWriteStream(outputPath);

  encoder.createReadStream().pipe(stream);
  encoder.start();
  encoder.setRepeat(0); // 0 for infinite loop
  encoder.setDelay(delay); // Frame delay in ms
  encoder.setQuality(10); // Image quality (1-20, lower is better)

  // Position graph - align top to padding
  const offsetX = minX;
  const offsetZ = minZ;
  const centerX = padding;
  const centerY = padding - minTopY; // Offset to make top align with padding

  // Precompute sorted contributions with rotated positions
  const sorted = contributions
    .map(c => {
      const x = c.week;
      const z = c.day;
      // Isometric projection
      const rotatedX = x * Math.cos(rotation) - z * Math.sin(rotation);
      const rotatedZ = x * Math.sin(rotation) + z * Math.cos(rotation);
      return { ...c, rotatedX, rotatedZ };
    })
    .sort((a, b) => a.rotatedZ - b.rotatedZ); // Front to back for proper depth

  // Render each frame with growing bars
  for (let frame = 0; frame < frames; frame++) {
    const progress = (frame + 1) / frames; // 0 to 1

    // Clear canvas with dark background
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Draw each bar with animated height
    sorted.forEach(({ count, rotatedX, rotatedZ }) => {
      const targetBarHeight = Math.max(0.1, count * 0.1);
      const barHeight = targetBarHeight * progress; // Animate from 0 to target height

      // Calculate screen position with isometric projection
      const screenX = centerX + (rotatedX - offsetX) * scale;
      const screenY = centerY - barHeight * scale * heightScale + (rotatedZ - offsetZ) * scale * 0.5;

      // Color based on contribution count
      let color: string;
      if (count === 0) color = '#161b22';
      else if (count < 5) color = '#0e4429';
      else if (count < 10) color = '#006d32';
      else if (count < 15) color = '#26a641';
      else color = '#39d353';

      // Draw isometric 3D box
      const boxWidth = scale * barWidthRatio;
      const boxDepth = scale * barWidthRatio;
      const barVisualHeight = barHeight * scale * heightScale;

      if (barVisualHeight > 0) {
        // Left face (darker)
        ctx.fillStyle = adjustBrightness(color, 0.6);
        ctx.beginPath();
        ctx.moveTo(screenX, screenY + barVisualHeight);
        ctx.lineTo(screenX - boxWidth / 2, screenY + barVisualHeight - boxDepth / 2);
        ctx.lineTo(screenX - boxWidth / 2, screenY - boxDepth / 2);
        ctx.lineTo(screenX, screenY);
        ctx.closePath();
        ctx.fill();

        // Right face (medium)
        ctx.fillStyle = adjustBrightness(color, 0.8);
        ctx.beginPath();
        ctx.moveTo(screenX, screenY + barVisualHeight);
        ctx.lineTo(screenX + boxWidth / 2, screenY + barVisualHeight - boxDepth / 2);
        ctx.lineTo(screenX + boxWidth / 2, screenY - boxDepth / 2);
        ctx.lineTo(screenX, screenY);
        ctx.closePath();
        ctx.fill();

        // Top face (lightest)
        ctx.fillStyle = adjustBrightness(color, 1.2);
        ctx.beginPath();
        ctx.moveTo(screenX, screenY);
        ctx.lineTo(screenX - boxWidth / 2, screenY - boxDepth / 2);
        ctx.lineTo(screenX, screenY - boxDepth);
        ctx.lineTo(screenX + boxWidth / 2, screenY - boxDepth / 2);
        ctx.closePath();
        ctx.fill();
      }
    });

    // Add frame to GIF
    encoder.addFrame(ctx.getImageData(0, 0, canvasWidth, canvasHeight).data);

    if ((frame + 1) % 10 === 0 || frame === frames - 1) {
      console.log(`Rendering frame ${frame + 1}/${frames}`);
    }
  }

  encoder.finish();

  return new Promise<void>((resolve, reject) => {
    stream.on('finish', () => {
      console.log(`GIF saved to ${outputPath}`);
      resolve();
    });
    stream.on('error', reject);
  });
}

/**
 * Adjust color brightness
 */
function adjustBrightness(hex: string, factor: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  const newR = Math.min(255, Math.floor(r * factor));
  const newG = Math.min(255, Math.floor(g * factor));
  const newB = Math.min(255, Math.floor(b * factor));

  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
}
