import * as THREE from 'three';
import { ContributionData } from './fetchContributions.js';

export interface SceneData {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  barGroup: THREE.Group;
}

/**
 * Create 3D scene with contribution graph
 */
export function create3DScene(
  contributionData: ContributionData,
  width: number = 800,
  height: number = 600
): SceneData {
  const { contributions, weeks } = contributionData;

  // Create scene
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0d1117);

  // Create camera
  const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
  camera.position.set(weeks * 0.6, 8, 12);
  camera.lookAt(weeks * 0.4, 0, 0);

  // Add lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(10, 10, 5);
  scene.add(directionalLight);

  // Create contribution bars
  const barGroup = new THREE.Group();

  contributions.forEach(({ week, day, count }) => {
    const barHeight = Math.max(0.1, count * 0.1); // Scale height based on contribution count
    const geometry = new THREE.BoxGeometry(0.8, barHeight, 0.8);

    // Color based on contribution count
    let color: number;
    if (count === 0) {
      color = 0x161b22;
    } else if (count < 5) {
      color = 0x0e4429;
    } else if (count < 10) {
      color = 0x006d32;
    } else if (count < 15) {
      color = 0x26a641;
    } else {
      color = 0x39d353;
    }

    const material = new THREE.MeshStandardMaterial({
      color: color,
      metalness: 0.3,
      roughness: 0.4
    });

    const cube = new THREE.Mesh(geometry, material);
    cube.position.set(week, barHeight / 2, day);

    barGroup.add(cube);
  });

  // Center the graph
  const box = new THREE.Box3().setFromObject(barGroup);
  const center = box.getCenter(new THREE.Vector3());
  barGroup.position.sub(center);

  scene.add(barGroup);

  return {
    scene,
    camera,
    barGroup
  };
}

/**
 * Render a single frame at a specific rotation
 */
export function renderFrame(
  scene: THREE.Scene,
  camera: THREE.Camera,
  barGroup: THREE.Group,
  renderer: THREE.WebGLRenderer,
  rotation: number
): void {
  barGroup.rotation.y = rotation;
  renderer.render(scene, camera);
}
