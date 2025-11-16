import GIFEncoder from 'gifencoder';
import * as THREE from 'three';
import fs from 'fs';
// @ts-ignore - headless-gl package doesn't have types
import createContext from 'headless-gl';
import { SceneData } from './generate3D.js';

/**
 * Render GIF animation of 3D contribution graph using WebGL
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

  // Create headless WebGL context
  const glContext = createContext(width, height, {
    preserveDrawingBuffer: true
  });

  // Create renderer with headless GL context
  const renderer = new THREE.WebGLRenderer({
    context: glContext as any,
    antialias: true
  });
  renderer.setSize(width, height);
  renderer.setClearColor(0x0d1117, 1);

  // Create GIF encoder
  const encoder = new GIFEncoder(width, height);
  const stream = fs.createWriteStream(outputPath);

  encoder.createReadStream().pipe(stream);
  encoder.start();
  encoder.setRepeat(0); // 0 for infinite loop
  encoder.setDelay(delay); // Frame delay in ms
  encoder.setQuality(10); // Image quality (1-20, lower is better)

  // Render each frame
  for (let i = 0; i < frames; i++) {
    const rotation = (i / frames) * Math.PI * 2; // Full 360-degree rotation
    barGroup.rotation.y = rotation;

    // Render the scene
    renderer.render(scene, camera);

    // Read pixels from WebGL context
    const pixels = new Uint8Array(width * height * 4);
    glContext.readPixels(0, 0, width, height, glContext.RGBA, glContext.UNSIGNED_BYTE, pixels);

    // Flip image vertically (WebGL coordinates are bottom-up)
    const flippedPixels = new Uint8Array(width * height * 4);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const srcIdx = (y * width + x) * 4;
        const dstIdx = ((height - 1 - y) * width + x) * 4;
        flippedPixels[dstIdx] = pixels[srcIdx];
        flippedPixels[dstIdx + 1] = pixels[srcIdx + 1];
        flippedPixels[dstIdx + 2] = pixels[srcIdx + 2];
        flippedPixels[dstIdx + 3] = pixels[srcIdx + 3];
      }
    }

    // Add frame to GIF
    encoder.addFrame(flippedPixels);

    if ((i + 1) % 10 === 0 || i === frames - 1) {
      console.log(`Rendering frame ${i + 1}/${frames}`);
    }
  }

  encoder.finish();

  // Clean up
  renderer.dispose();
  (glContext as any).getExtension('STACKGL_destroy_context')?.destroy();

  return new Promise<void>((resolve, reject) => {
    stream.on('finish', () => {
      console.log(`GIF saved to ${outputPath}`);
      resolve();
    });
    stream.on('error', reject);
  });
}
