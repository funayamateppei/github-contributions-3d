// Load .env file if it exists (for local development)
import { config } from 'dotenv';
config();

import { fetchContributions } from './fetchContributions.js';
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

    // Render animated GIF
    console.log('Rendering 3D contribution graph animation...');
    const outputPath = './public/contribution-graph.gif';

    // Ensure public directory exists
    const fs = await import('fs');
    if (!fs.existsSync('./public')) {
      fs.mkdirSync('./public', { recursive: true });
    }

    await renderGif(contributionData, outputPath, 800, 600, 30, 100);

    console.log('Done! GIF generated successfully.');
  } catch (error) {
    console.error('Error generating 3D contribution graph:', error);
    process.exit(1);
  }
}

main();
