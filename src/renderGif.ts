import { createCanvas } from 'canvas';
import GIFEncoder from 'gifencoder';
import * as THREE from 'three';
import fs from 'fs';
import { SceneData } from './generate3D.js';

/**
 * Render GIF animation of 3D contribution graph
 */
export async function renderGif(
  sceneData: SceneData,
  outputPath: string,
  width: number = 800,
  height: number = 600,
  frames: number = 60,
  delay: number = 50
): Promise<void> {
  const { scene, camera, barGroup } = sceneData;

  // Create canvas for headless rendering
  const canvas = createCanvas(width, height);
  const context = (canvas as any).getContext('webgl2', {
    alpha: false,
    antialias: true
  });

  // Create renderer with canvas context
  const renderer = new THREE.WebGLRenderer({
    canvas: canvas as any,
    context: context,
    antialias: true
  });
  renderer.setSize(width, height);

  // Create GIF encoder
  const encoder = new GIFEncoder(width, height);
  const stream = fs.createWriteStream(outputPath);

  encoder.createReadStream().pipe(stream);
  encoder.start();
  encoder.setRepeat(0); // 0 for infinite loop
  encoder.setDelay(delay); // Frame delay in ms
  encoder.setQuality(10); // Image quality (1-20, lower is better)

  // Render frames
  for (let i = 0; i < frames; i++) {
    const rotation = (i / frames) * Math.PI * 2; // Full 360-degree rotation
    barGroup.rotation.y = rotation;

    renderer.render(scene, camera);

    // Get image data from canvas
    const imageData = context.getImageData(0, 0, width, height);
    encoder.addFrame(imageData.data);

    // Progress indicator
    if ((i + 1) % 10 === 0 || i === frames - 1) {
      console.log(`Rendering frame ${i + 1}/${frames}`);
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
