# TAPX Counsel business profile

The website is in **`tapx-counsel/`**. Opening the website immediately shows the business profile, without an introduction or an **Open profile** button.

Run **`npm run dev`** from this workspace, then open **http://localhost:5173**.

See [the project guide](tapx-counsel/README.md) for personalisation, features, and hosting instructions.

## GitHub Pages

The deployment workflow in `.github/workflows/deploy-pages.yml` checks the JavaScript and publishes **`tapx-counsel/dist/`** whenever changes are pushed to `main`. It can also be started manually from GitHub Actions.

In the repository's **Settings → Pages**, the publishing source must be **GitHub Actions**.

The profile uses relative asset URLs and hash-based navigation, so it works under the repository's GitHub Pages path without a build step.
