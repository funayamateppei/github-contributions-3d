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

  // Drawing parameters
  const PADDING = 5;
  const HEIGHT_SCALE = 3;
  const BAR_WIDTH_RATIO = 0.9;
  const ROTATION = (45 * Math.PI) / 180;
  const DEPTH_PROJECTION_FACTOR = 0.5;

  // Calculate rotated positions for all contributions
  const tempSorted = contributions.map(c => {
    const x = c.week;
    const z = c.day;
    const rotatedX = x * Math.cos(ROTATION) - z * Math.sin(ROTATION);
    const rotatedZ = x * Math.sin(ROTATION) + z * Math.cos(ROTATION);
    return { rotatedX, rotatedZ, count: c.count };
  });

  // Calculate bounds
  const minX = Math.min(...tempSorted.map(c => c.rotatedX));
  const maxX = Math.max(...tempSorted.map(c => c.rotatedX));
  const minZ = Math.min(...tempSorted.map(c => c.rotatedZ));

  // Calculate scale based on width
  const graphWidth = maxX - minX;
  const scale = (width - PADDING * 2) / (graphWidth + BAR_WIDTH_RATIO);
  const boxDepth = scale * BAR_WIDTH_RATIO;

  // Calculate screen Y positions for all bars to determine canvas height
  const screenYPositions = tempSorted.map(({ rotatedZ, count }) => {
    const barHeight = count * 0.1;
    const barVisualHeight = barHeight * scale * HEIGHT_SCALE;
    const topY = (rotatedZ - minZ) * scale * DEPTH_PROJECTION_FACTOR - barVisualHeight;
    const bottomY = (rotatedZ - minZ) * scale * DEPTH_PROJECTION_FACTOR;
    return { topY, bottomY };
  });

  const minTopY = Math.min(...screenYPositions.map(p => p.topY - boxDepth));
  const maxBottomY = Math.max(...screenYPositions.map(p => p.bottomY));

  // Calculate exact canvas dimensions
  const canvasWidth = Math.ceil((graphWidth + BAR_WIDTH_RATIO) * scale + PADDING * 2);
  const canvasHeight = Math.ceil(maxBottomY - minTopY + PADDING * 2);

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
  const centerX = PADDING;
  const centerY = PADDING - minTopY; // Offset to make top align with padding

  // Precompute sorted contributions with rotated positions
  const sorted = contributions
    .map(c => {
      const x = c.week;
      const z = c.day;
      const rotatedX = x * Math.cos(ROTATION) - z * Math.sin(ROTATION);
      const rotatedZ = x * Math.sin(ROTATION) + z * Math.cos(ROTATION);
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
      const screenY = centerY - barHeight * scale * HEIGHT_SCALE + (rotatedZ - offsetZ) * scale * DEPTH_PROJECTION_FACTOR;

      // Color based on contribution count
      let color: string;
      if (count === 0) color = '#161b22';
      else if (count < 5) color = '#0e4429';
      else if (count < 10) color = '#006d32';
      else if (count < 15) color = '#26a641';
      else color = '#39d353';

      // Draw isometric 3D box with ROTATION applied
      const boxWidth = scale * BAR_WIDTH_RATIO;
      const boxDepth = scale * BAR_WIDTH_RATIO;
      const barVisualHeight = barHeight * scale * HEIGHT_SCALE;

      if (barVisualHeight > 0) {
        // Calculate isometric projection offsets based on ROTATION
        // For a box viewed from above with ROTATION angle:
        // - Left/Right edges go along rotated X axis (±90° from view direction)
        // - Depth edges go along rotated Z axis (parallel to view direction)
        const leftOffsetX = -boxWidth / 2 * Math.cos(ROTATION - Math.PI / 2);
        const leftOffsetY = -boxWidth / 2 * Math.sin(ROTATION - Math.PI / 2) * DEPTH_PROJECTION_FACTOR;
        const rightOffsetX = boxWidth / 2 * Math.cos(ROTATION - Math.PI / 2);
        const rightOffsetY = boxWidth / 2 * Math.sin(ROTATION - Math.PI / 2) * DEPTH_PROJECTION_FACTOR;
        const depthOffsetX = boxDepth * Math.cos(ROTATION);
        const depthOffsetY = boxDepth * Math.sin(ROTATION) * DEPTH_PROJECTION_FACTOR;

        // Left face (darker)
        ctx.fillStyle = adjustBrightness(color, 0.6);
        ctx.beginPath();
        ctx.moveTo(screenX, screenY + barVisualHeight);
        ctx.lineTo(screenX + leftOffsetX, screenY + barVisualHeight + leftOffsetY);
        ctx.lineTo(screenX + leftOffsetX, screenY + leftOffsetY);
        ctx.lineTo(screenX, screenY);
        ctx.closePath();
        ctx.fill();

        // Right face (medium)
        ctx.fillStyle = adjustBrightness(color, 0.8);
        ctx.beginPath();
        ctx.moveTo(screenX, screenY + barVisualHeight);
        ctx.lineTo(screenX + rightOffsetX, screenY + barVisualHeight + rightOffsetY);
        ctx.lineTo(screenX + rightOffsetX, screenY + rightOffsetY);
        ctx.lineTo(screenX, screenY);
        ctx.closePath();
        ctx.fill();

        // Top face (lightest)
        ctx.fillStyle = adjustBrightness(color, 1.2);
        ctx.beginPath();
        ctx.moveTo(screenX, screenY);
        ctx.lineTo(screenX + leftOffsetX, screenY + leftOffsetY);
        ctx.lineTo(screenX + leftOffsetX + depthOffsetX, screenY + leftOffsetY + depthOffsetY);
        ctx.lineTo(screenX + rightOffsetX + depthOffsetX, screenY + rightOffsetY + depthOffsetY);
        ctx.lineTo(screenX + rightOffsetX, screenY + rightOffsetY);
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
