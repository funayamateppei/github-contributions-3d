# GitHub Contributions 3D

**Turn your GitHub contribution graph into an animated 3D GIF for your profile README.**
Regenerated daily by GitHub Actions, published on GitHub Pages, and never committed to your repository.

![3D Contribution Graph](https://funayamateppei.github.io/github-contributions-3d/contribution-graph.gif)

> **TL;DR** — Use this template (or fork) → enable Actions and Pages → run the workflow once → paste one image URL into your profile README. No local setup, no bot commits, no binary files in your repo.

## ✨ Features

- 🎨 **3D bar graph** representation of GitHub contributions
- 🎬 **Animated GIF** with bars growing from bottom to top
- ⚙️ **Automatic daily updates** via GitHub Actions
- 🔒 **Private repository support**
- 🌈 **Color-coded** based on contribution count (GitHub's default color scheme)
- 🔗 **Direct GIF URL** for embedding in profile README
- 🧹 **Clean history**: the GIF is a GitHub Pages artifact, never a commit

## 🆚 How is this different from github-profile-3d-contrib?

[yoshi389111/github-profile-3d-contrib](https://github.com/yoshi389111/github-profile-3d-contrib) is the most popular 3D contribution calendar and a great choice. This project takes a different approach:

|                               | **github-contributions-3d** (this project)              | github-profile-3d-contrib                     |
| ----------------------------- | ------------------------------------------------------- | --------------------------------------------- |
| Output format                 | Animated **GIF** (bars grow up from the ground)         | SVG (static, plus some animated variants)     |
| Where the image is stored     | **GitHub Pages** artifact                               | Committed to your repository                  |
| Bot commits in your history   | **None**                                                | Yes, the Action commits the generated image   |
| How you install it            | Template repository / fork                              | `uses:` step in your own workflow             |
| Customization                 | Edit the TypeScript renderer ([src/renderGif.ts](src/renderGif.ts)) | Built-in themes (green, season, night, …) |

Choose **this project** if you want an animated GIF and a commit history free of generated files.
Choose **github-profile-3d-contrib** if you prefer SVG output and a drop-in GitHub Action.

## 🚀 Quick Start (No Local Setup Required!)

**Just 4 steps to get your 3D contribution graph:**

### Step 1: Create Your Copy of this Repository

#### Option A: Use this template (Recommended)

1. Click the green **"Use this template"** button at the top of this page → **Create a new repository**
2. Name it `github-contributions-3d` so the GIF URL matches the examples below (any name works; just adjust the URL)

#### Option B: Fork

1. Click the **Fork** button at the top right of this page
2. This creates a copy of the repository in your GitHub account

#### Option C: Clone and push to your own repository

```bash
git clone https://github.com/funayamateppei/github-contributions-3d.git
cd github-contributions-3d
# Change remote to your own repository
git remote set-url origin https://github.com/YOUR-USERNAME/your-repo-name.git
git push -u origin main
```

### Step 2: Enable GitHub Actions and Pages

**Note:** If you forked the repository, GitHub Actions is disabled by default.

1. Go to the **Actions** tab in your repository
2. If you see a message: "Workflows aren't being run on this forked repository", click **"I understand my workflows, go ahead and enable them"**

Then enable GitHub Pages, which is where the generated GIF is published:

1. Go to **Settings** → **Pages**
2. Under **Build and deployment**, set **Source** to **GitHub Actions**

**Note:** Pages requires the repository to be **public** (or a GitHub Pro account for private repositories).

### Step 3: Run the Workflow

#### Option A: Manual Run (Recommended for first time)

1. Stay in the **Actions** tab
2. Click **"Generate 3D Contribution Graph"** in the left sidebar
3. Click **"Run workflow"** dropdown → **"Run workflow"** button
4. Wait 2-3 minutes for the workflow to complete
5. Open `https://YOUR-USERNAME.github.io/github-contributions-3d/` to see your generated GIF!

#### Option B: Automatic Daily Updates

Once you've run the workflow manually once, it will automatically run **daily at 00:00 UTC (9:00 AM JST)** to keep your graph up to date.

### Step 4: Add to Your Profile README

Add the following to your GitHub profile README (`YOUR-USERNAME/YOUR-USERNAME/README.md`):

```markdown
### 📊 My 3D Contribution Graph

![My 3D Contribution Graph](https://YOUR-USERNAME.github.io/github-contributions-3d/contribution-graph.gif)
```

**Replace `YOUR-USERNAME` with your actual GitHub username.**

> **Note:** The GIF is published to GitHub Pages as a build artifact and is never committed to the repository. A ~4MB GIF is binary, so it barely compresses between revisions — committing one daily would pile up in the history and make clones heavy. Publishing it through Pages keeps the repository history free of it entirely, and no `github-actions[bot]` commits are created.

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
│   └── contribution-graph.gif # Generated GIF (git-ignored; published via Pages)
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
6. **Publish:** GitHub Actions uploads `public/` as a Pages artifact and deploys it

## ❓ FAQ

**Does it include private contributions?**
Yes, as long as your GitHub profile is set to *Include private contributions on my profile* (Settings → Public profile → Contributions & Activity). Counts come from the GitHub GraphQL API, which respects that setting.

**Will it add commits to my repository?**
No. The GIF is uploaded as a GitHub Pages artifact, so your commit history stays clean and the repository never grows.

**How often is the GIF updated?**
Once a day at 00:00 UTC, plus on every push to `main`. You can also trigger it manually from the Actions tab.

**Can I use it on a private repository?**
GitHub Pages on private repositories requires GitHub Pro, Team, or Enterprise. On the Free plan, keep the repository public. The GIF only shows contribution counts, not code.

**Do I need a personal access token?**
Not in GitHub Actions. The workflow uses the automatically provided `GITHUB_TOKEN`. A token is only needed for local runs, to avoid API rate limits.

**Can I change colors, size, or animation speed?**
Yes. Everything is in [src/renderGif.ts](src/renderGif.ts). See [Customization](#customization).

## 🇯🇵 日本語

GitHub のコントリビューショングラフ（いわゆる「草」）を、3D の棒グラフが伸び上がるアニメーション GIF に変換して、プロフィール README に貼れるようにするツールです。GitHub Actions が毎日自動で再生成し、GitHub Pages に配信します。GIF をリポジトリにコミットしないので、履歴が肥大化しません。

- 導入手順（日本語の解説記事）: [【GitHub Actionsで自動更新】GitHubプロフィールを「3Dアニメーションの草」でリッチにする方法](https://zenn.dev/funayamateppei/articles/dfceeb419d3f1a)
- ローカル環境は不要です。Use this template（または Fork）→ Actions と Pages を有効化 → ワークフローを 1 回実行 → README に画像 URL を貼るだけです。

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
