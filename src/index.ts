import { fetchContributions } from './fetchContributions.js';
import { create3DScene } from './generate3D.js';
import { renderGif } from './renderGif.js';

/**
 * Main function to generate 3D contribution graph
 */
async function main(): Promise<void> {
  try {
    // Get username and token from environment variables
    const username = process.env.GITHUB_USERNAME || 'octocat';
    const token = process.env.GITHUB_TOKEN || null;

    console.log(`Fetching contributions for ${username}...`);

    // Fetch contribution data
    const contributionData = await fetchContributions(username, token);
    console.log(`Total contributions: ${contributionData.totalContributions}`);
    console.log(`Weeks of data: ${contributionData.weeks}`);

    // Create 3D scene
    console.log('Creating 3D scene...');
    const sceneData = create3DScene(contributionData, 800, 600);

    // Render GIF
    console.log('Rendering GIF animation...');
    const outputPath = './public/contribution-graph.gif';
    await renderGif(sceneData, outputPath, 800, 600, 60, 50);

    console.log('Done! GIF generated successfully.');
  } catch (error) {
    console.error('Error generating 3D contribution graph:', error);
    process.exit(1);
  }
}

main();
