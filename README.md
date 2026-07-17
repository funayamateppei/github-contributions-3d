# GitHub Contributions 3D

Transform your GitHub contribution graph into an animated 3D visualization!

![3D Contribution Graph](https://raw.githubusercontent.com/funayamateppei/github-contributions-3d/assets/contribution-graph.gif)

## ✨ Features

- 🎨 **3D bar graph** representation of GitHub contributions
- 🎬 **Animated GIF** with bars growing from bottom to top
- ⚙️ **Automatic daily updates** via GitHub Actions
- 🔒 **Private repository support**
- 🌈 **Color-coded** based on contribution count (GitHub's default color scheme)
- 🔗 **Direct GIF URL** for embedding in profile README

## 🚀 Quick Start (No Local Setup Required!)

**Just 3 steps to get your 3D contribution graph:**

### Step 1: Clone or Fork this Repository

#### Option A: Clone (Recommended)

1. Click the **"Use this template"** button or clone this repository
2. Create a new repository in your GitHub account

```bash
git clone https://github.com/funayamateppei/github-contributions-3d.git
cd github-contributions-3d
# Change remote to your own repository
git remote set-url origin https://github.com/YOUR-USERNAME/your-repo-name.git
git push -u origin main
```

#### Option B: Fork

1. Click the **Fork** button at the top right of this page
2. This creates a copy of the repository in your GitHub account

### Step 2: Enable GitHub Actions

**Note:** If you forked the repository, GitHub Actions is disabled by default.

1. Go to the **Actions** tab in your repository
2. If you see a message: "Workflows aren't being run on this forked repository", click **"I understand my workflows, go ahead and enable them"**

### Step 3: Run the Workflow

#### Option A: Manual Run (Recommended for first time)

1. Stay in the **Actions** tab
2. Click **"Generate 3D Contribution Graph"** in the left sidebar
3. Click **"Run workflow"** dropdown → **"Run workflow"** button
4. Wait 2-3 minutes for the workflow to complete
5. Check the **Code** tab, switch to the `assets` branch to see your generated GIF!

#### Option B: Automatic Daily Updates

Once you've run the workflow manually once, it will automatically run **daily at 00:00 UTC (9:00 AM JST)** to keep your graph up to date.

### Step 4: Add to Your Profile README

Add the following to your GitHub profile README (`YOUR-USERNAME/YOUR-USERNAME/README.md`):

```markdown
### 📊 My 3D Contribution Graph

![My 3D Contribution Graph](https://raw.githubusercontent.com/YOUR-USERNAME/github-contributions-3d/assets/contribution-graph.gif)
```

**Replace `YOUR-USERNAME` with your actual GitHub username.**

> **Note:** The GIF is stored in an orphan `assets` branch to keep your main branch clean. Commits by `github-actions[bot]` won't affect your contribution graph. The branch is force-pushed as a single commit on every run, so the GIF history never accumulates and clones stay small.

## 💻 Local Development

Want to customize the visualization or run it locally? Follow these steps:

### Prerequisites

- **Node.js 20 or higher**
- **npm** (comes with Node.js)
- **Git**

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/YOUR-USERNAME/github-contributions-3d.git
   cd github-contributions-3d
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

   **Note:** The `canvas` package uses pre-built binaries for most platforms (macOS x64/ARM64, Windows, Linux), so additional system dependencies are usually **not required**. However, if you encounter installation errors, you may need to install native dependencies:

   <details>
   <summary><b>macOS (only if installation fails)</b></summary>

   ```bash
   brew install pkg-config cairo pango libpng jpeg giflib librsvg
   ```

   </details>

   <details>
   <summary><b>Ubuntu/Debian (only if installation fails)</b></summary>

   ```bash
   sudo apt-get update
   sudo apt-get install -y libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev
   ```

   </details>

   <details>
   <summary><b>Windows</b></summary>

   No additional dependencies needed. `npm install` should work out of the box.
   </details>

### Running Locally

1. **Set environment variables:**

   Create a `.env` file in the project root:

   ```bash
   GITHUB_USERNAME=your-github-username
   GITHUB_TOKEN=your-github-personal-access-token  # optional, but recommended
   ```

   - `GITHUB_USERNAME`: Your GitHub username (required)
   - `GITHUB_TOKEN`: GitHub Personal Access Token (optional, but recommended to avoid rate limits)
     - To create a token: GitHub Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token
     - Required scope: `read:user` (for accessing public contribution data)

2. **Generate the GIF:**

   ```bash
   npm run generate
   ```

   This will:

   - Compile TypeScript to JavaScript
   - Fetch your contribution data from GitHub
   - Generate the 3D visualization
   - Save it to `public/contribution-graph.gif`

3. **For development with auto-compilation:**
   ```bash
   npm run dev
   ```

### Customization

You can customize the visualization by editing [src/renderGif.ts](src/renderGif.ts):

- **Colors:** Modify the color scheme (lines 112-116)
- **Animation:** Adjust frames, speed, or animation style (lines 14-16)
- **Rotation angle:** Change the isometric view angle (line 24)
- **Bar dimensions:** Adjust height scale and width ratio (lines 22-23)

After making changes, run `npm run generate` to regenerate the GIF.

## 📁 Project Structure

```
github-contributions-3d/
├── src/
│   ├── index.ts              # Main entry point
│   ├── fetchContributions.ts # Fetch data from GitHub API
│   └── renderGif.ts          # Render GIF animation with 3D projection
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

## 🛠 Technologies

- **TypeScript** - Type-safe development
- **node-canvas** - Canvas 2D API with isometric 3D projection
- **gifencoder** - GIF animation generation
- **@octokit/rest** - GitHub API client for fetching contribution data
- **GitHub Actions** - Automated daily updates

## 🎨 How It Works

1. **Fetch Data:** Uses GitHub's GraphQL API to retrieve your contribution data for the past year
2. **Transform Data:** Processes the raw data into daily contribution counts
3. **Render 3D:** Creates an isometric 3D projection using Canvas 2D API
4. **Animate:** Generates multiple frames showing bars growing from bottom to top
5. **Encode GIF:** Combines all frames into a single animated GIF file
6. **Auto-commit:** GitHub Actions commits the GIF to the `assets` branch

## 🤝 Contributing

Contributions are welcome! If you have ideas for improvements or find bugs:

1. **Fork** this repository
2. **Create** a new branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add some amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

Or simply open an **Issue** to discuss your ideas!

## ⭐ Show Your Support

If you find this project useful, please consider giving it a star on GitHub! It helps others discover the project and motivates further development.

## 📝 License

MIT - feel free to use this project for your own GitHub profile!

## 🙏 Acknowledgments

- Inspired by GitHub's contribution graph
- Built with TypeScript and node-canvas
- Automated with GitHub Actions
