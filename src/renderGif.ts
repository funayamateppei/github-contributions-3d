import { createCanvas, Canvas } from 'canvas';
import GIFEncoder from 'gifencoder';
import * as THREE from 'three';
import fs from 'fs';
import { SceneData } from './generate3D.js';

// Mock DOM elements for headless Three.js
function mockCanvas(canvas: Canvas): any {
  const mockElement = {
    ...canvas,
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true,
    style: {},
    clientWidth: canvas.width,
    clientHeight: canvas.height,
    getBoundingClientRect: () => ({
      left: 0,
      top: 0,
      width: canvas.width,
      height: canvas.height,
      right: canvas.width,
      bottom: canvas.height,
      x: 0,
      y: 0,
      toJSON: () => ({})
    })
  };
  return mockElement;
}

/**
 * Render GIF animation of 3D contribution graph using Canvas 2D
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

  // Create canvas for rendering
  const canvas = createCanvas(width, height);
  const mockedCanvas = mockCanvas(canvas);

  // Create WebGL context mock
  const gl = canvas.getContext('2d');

  // Use software renderer as fallback for headless environment
  // We'll render to 2D canvas by drawing simple projections
  const encoder = new GIFEncoder(width, height);
  const stream = fs.createWriteStream(outputPath);

  encoder.createReadStream().pipe(stream);
  encoder.start();
  encoder.setRepeat(0);
  encoder.setDelay(delay);
  encoder.setQuality(10);

  // Render each frame
  for (let i = 0; i < frames; i++) {
    const rotation = (i / frames) * Math.PI * 2;
    barGroup.rotation.y = rotation;

    // Clear canvas
    gl.fillStyle = '#0d1117';
    gl.fillRect(0, 0, width, height);

    // Manually project and draw 3D objects to 2D canvas
    drawScene(gl, scene, camera, width, height);

    // Get canvas data and add to GIF
    const context2d = canvas.getContext('2d');
    const imageData = context2d.getImageData(0, 0, width, height);
    encoder.addFrame(imageData.data);

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

/**
 * Draw 3D scene to 2D canvas
 */
function drawScene(
  ctx: any,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  width: number,
  height: number
): void {
  // Project 3D points to 2D
  const projectionMatrix = new THREE.Matrix4().multiplyMatrices(
    camera.projectionMatrix,
    camera.matrixWorldInverse
  );

  scene.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      const geometry = object.geometry;
      const material = object.material as THREE.MeshStandardMaterial;

      if (geometry instanceof THREE.BoxGeometry) {
        // Get world position
        const position = new THREE.Vector3();
        object.getWorldPosition(position);

        // Project to screen space
        position.project(camera);

        const x = (position.x + 1) * width / 2;
        const y = (-position.y + 1) * height / 2;
        const z = position.z;

        // Only draw if in front of camera
        if (z < 1 && z > -1) {
          // Get box size
          const scale = object.scale;
          const size = 20 * (1 - z * 0.5); // Perspective scaling

          // Get color
          const color = material.color;
          const hexColor = `#${color.getHexString()}`;

          // Draw as rectangle with simple lighting
          const brightness = Math.max(0.3, 1 - z * 0.3);
          ctx.fillStyle = hexColor;
          ctx.globalAlpha = brightness;

          // Draw box
          ctx.fillRect(x - size / 2, y - size / 2, size, size * scale.y);

          // Add simple edge for depth
          ctx.strokeStyle = '#000';
          ctx.lineWidth = 1;
          ctx.globalAlpha = 0.3;
          ctx.strokeRect(x - size / 2, y - size / 2, size, size * scale.y);

          ctx.globalAlpha = 1;
        }
      }
    }
  });
}
