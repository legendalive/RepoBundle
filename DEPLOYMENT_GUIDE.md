# Complete Step-by-Step GitHub Pages Deployment Guide for RepoBundle

> **Confirmation:** **YES, EXACTLY!** Exporting the ZIP archive from Google AI Studio, extracting it on your computer, and uploading/copying the files to GitHub is the fastest, easiest, and official way to get started. You do **not** need any command line (CLI), coding software, or Notepad. Everything can be done entirely in your regular web browser.

---

## Step 0: How to Obtain the Code Files for this App (Exporting the ZIP)

Before going to GitHub, you need to download your project files from Google AI Studio. Here is exactly how to do it:

1. **Locate the Export Button in Google AI Studio**:
   - In your Google AI Studio Build window (the screen where you are talking to this assistant and seeing the app preview), look at the top-right toolbar.
   - Click the **Export** or **Download** icon (often shown as a downward arrow with a tray, or found under the three vertical dots `⋮` menu).
   - Select **"Download project as ZIP"** (or **"Export ZIP"**).
2. **Find the Downloaded File**:
   - Open your computer's **Downloads** folder.
   - You will see a file such as `repobundle.zip` (or your project archive name).
3. **Unzip (Extract) the Folder**:
   - **On Windows**: Right-click the `.zip` file and select **"Extract All..."**, then click **Extract**.
   - **On Mac**: Simply double-click the `.zip` file.
   - You now have a normal folder containing all the project files ready to use!

---

## Overview: How GitHub Pages Works

This application is a **pure client-side web application**. That means all the code runs directly in any web browser and does not need a paid server or database.

GitHub provides a free feature called **GitHub Pages** that will automatically build your app and give you a free, public website link (such as `https://your-username.github.io/repobundle/`).

---

## Step 1: Create a New Repository on GitHub

1. Open your web browser and go to: [https://github.com/new](https://github.com/new)
   *(If you are not signed in, sign in to your GitHub account first).*
2. Under **Repository name**, type:
   ```text
   repobundle
   ```
3. Under Choose visibility, select **Public**.
4. Check the box that says **"Add a README file"**.
   *(This creates the initial main branch so you can start adding files right away).*
5. Click the green button at the bottom that says **"Create repository"**.

---

## Step 2: Upload or Create Your Files in GitHub

Now that you have unzipped your app folder from Step 0, you have two simple ways to get your files into GitHub:

### Option A: The Fastest Way (Drag & Drop Folder Upload)
1. In your newly created GitHub repository, click the **Add file** button near the top right.
2. Select **Upload files**.
3. Open your extracted unzipped folder on your computer.
4. Drag and drop all the files and folders (e.g., `package.json`, `index.html`, `vite.config.ts`, `src/`, etc.) into the GitHub upload area in your browser.
5. Scroll down to the bottom, type "Initial commit" in the message box, and click the green button **"Commit changes"**.

### Option B: Using the Web Editor (Copy & Paste)
If you prefer creating or copying files individually in the browser:
1. Click **Add file > Create new file**.
2. **The Folder Slash Trick**: In the **"Name your file..."** box, type folder names with a slash `/` (for example, typing `src/` automatically creates the `src` folder!). Then type the file name (e.g., `App.tsx`).
3. Paste the file code into the main editor box.
4. Scroll down and click **Commit changes...**.
5. Repeat for the files listed in Step 3.

---

## Step 3: Complete List of Every File & Its Exact Folder Path

Every file must exist in your repository with this exact relative path:

| # | Complete Folder Path | What This File Does |
| :--- | :--- | :--- |
| 1 | `package.json` | Project setup, dependencies, and build commands |
| 2 | `vite.config.ts` | Configures the web builder to use relative paths for web hosting |
| 3 | `tsconfig.json` | TypeScript compiler rules |
| 4 | `index.html` | The main HTML webpage entry point and fonts |
| 5 | `.github/workflows/deploy.yml` | **The automated deployment workflow** (builds and publishes your site) |
| 6 | `src/main.tsx` | Starts the React app |
| 7 | `src/index.css` | Styles, fonts, and luxury color palette |
| 8 | `src/App.tsx` | Main application screen, layout, and upload flow |
| 9 | `src/types/bundler.ts` | Data structures for zip files, folders, and bundles |
| 10 | `src/utils/commentDelimiters.ts` | Adds clean comment headers between concatenated files |
| 11 | `src/utils/treeGenerator.ts` | Generates the ASCII visual tree and `FILE_TREE.md` report |
| 12 | `src/utils/zipBundler.ts` | Processes uploaded zip archives and packages the downloadable zip |
| 13 | `src/components/Header.tsx` | Top navigation bar |
| 14 | `src/components/Dropzone.tsx` | File drag-and-drop area and sample test buttons |
| 15 | `src/components/StatsOverview.tsx` | Summary boxes showing file counts and extension groups |
| 16 | `src/components/FileTreeViewer.tsx` | Searchable, expandable directory tree explorer |
| 17 | `src/components/BundlePreview.tsx` | Code preview tabs with copy buttons and zip downloads |
| 18 | `src/components/HowToUseSection.tsx` | 4-step workflow guide with OS compression & bundling instructions |

---

## Step 4: The Deployment Workflow File (`.github/workflows/deploy.yml`)

Make sure your repository contains this file. It instructs GitHub to automatically build and launch your website whenever you update code.

### File Path:
```text
.github/workflows/deploy.yml
```

*(Note: When creating this in the web editor, in the filename box type `.github/` then `workflows/` then `deploy.yml`)*

### Content of `.github/workflows/deploy.yml`:
```yaml
name: Deploy RepoBundle to GitHub Pages

on:
  push:
    branches: ["main"]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Build static site
        run: npm run build

      - name: Upload GitHub Pages artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

---

## Step 5: Turn On GitHub Pages (3 Simple Clicks)

Once your files are uploaded to GitHub:

1. Click on the **Settings** tab near the top of your repository (with the gear icon).
2. In the left-hand menu, click on **Pages** (under the "Code and automation" section).
3. Look at the section labeled **Build and deployment**:
   - Under **Source**, click the dropdown menu that currently says *"Deploy from a branch"*.
   - Change it to: **GitHub Actions**.

**That is all!** There is no save button needed — selecting GitHub Actions immediately activates the automated build.

---

## Step 6: See Your Live Website

1. Click on the **Actions** tab at the top of your repository.
2. You will see a workflow running called **"Deploy RepoBundle to GitHub Pages"** with a yellow spinning circle.
3. Wait about 1 to 2 minutes until it turns into a green checkmark.
4. Go back to **Settings > Pages**:
   - At the top of the page, GitHub will show:
     > *"Your site is live at https://<your-username>.github.io/repobundle/"*
5. Click that link to open your live web application!

---

## What to Do with This Guide File

- This file (`DEPLOYMENT_GUIDE.md`) contains no runtime code and has no dependencies.
- You can keep it in your repository as a reference, rename it to `README.md` if you want it displayed on the front page of your repository, or delete it once your app is live.
