# GitHub Contributions 3D

A 3D visualization of GitHub contribution activity, automatically generated daily via GitHub Actions.

![3D Contribution Graph](./public/contribution-graph.gif)

## Features

- 3D bar graph representation of GitHub contributions
- Animated GIF showing 360-degree rotation
- Automatic daily updates via GitHub Actions
- Private repository support
- Color-coded based on contribution count
- Direct GIF URL for embedding in profile README

## Usage in GitHub Profile README

You can embed the generated GIF directly in your GitHub profile README (works with both public and private repositories):

```markdown
![GitHub Contributions 3D](https://raw.githubusercontent.com/your-username/repository-name/assets/contribution-graph.gif)
```

Replace `your-username` and `repository-name` with your actual GitHub username and repository name.

**Note**: This uses an orphan `assets` branch to store the GIF, keeping your main branch history clean. The raw content URL works even for private repositories when you're logged in to GitHub.

## Setup

### Prerequisites

- Node.js 20 or higher
- GitHub account

### Installation

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Local Development

**Note**: Local development may have issues with native module compilation (`gl` package). The project is designed to run primarily in GitHub Actions (Ubuntu environment).

To generate the 3D contribution graph locally (if your environment supports it):

```bash
# Set your GitHub username (optional: set GITHUB_TOKEN for higher rate limits)
export GITHUB_USERNAME=your-github-username
export GITHUB_TOKEN=your-github-token  # optional

# Generate the GIF
npm run generate
```

The generated GIF will be saved to `public/contribution-graph.gif`.

**If you encounter build errors**: This is expected on some systems (especially macOS/Windows). The code will work perfectly in GitHub Actions (Ubuntu).

### GitHub Setup

1. **Create/Use a GitHub repository** (can be public or private)

2. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

3. **Run the workflow**:
   - Go to the "Actions" tab in your repository
   - Select "Generate 3D Contribution Graph"
   - Click "Run workflow" → "Run workflow"
   - Wait for the workflow to complete (about 2-3 minutes)

4. **Use the GIF in your profile**:
   - The GIF will be committed to the `assets` branch as `contribution-graph.gif`
   - Use the raw GitHub URL in your profile README:
   ```markdown
   ![GitHub Contributions 3D](https://raw.githubusercontent.com/your-username/repository-name/assets/contribution-graph.gif)
   ```

The workflow automatically:
- Generates the 3D contribution graph as a GIF
- Commits it to the `assets` orphan branch (keeps main branch clean)
- Runs daily at 00:00 UTC
- Can be manually triggered anytime
- Works with private repositories (GIF visible only to you when logged in)

## Project Structure

```
github-contributions-3d/
├── src/
│   ├── index.ts              # Main entry point
│   ├── fetchContributions.ts # Fetch data from GitHub API
│   ├── generate3D.ts         # Create 3D scene with Three.js
│   └── renderGif.ts          # Render GIF animation
├── dist/                     # Compiled JavaScript (generated)
├── public/
│   ├── index.html            # GitHub Pages landing page
│   └── contribution-graph.gif # Generated GIF (auto-updated)
├── .github/
│   └── workflows/
│       └── generate.yml      # Daily generation workflow
├── package.json
├── tsconfig.json
└── README.md
```

## Technologies

- **TypeScript** - Type-safe development
- **Three.js** - 3D graphics
- **gl** - Hardware-accelerated WebGL in Node.js
- **gifencoder** - GIF generation
- **@octokit/rest** - GitHub API client

## License

MIT
