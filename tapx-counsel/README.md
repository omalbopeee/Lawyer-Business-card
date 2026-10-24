# TAPX Counsel

A responsive implementation of the supplied ten-screen business profile design. Built with HTML, CSS and JavaScript, with no runtime dependencies or build step.

## Run locally

Requires Node.js 20 or newer. From this directory:

```sh
npm run dev
```

Open **http://localhost:5173**. You can also run the same command from the parent workspace directory. Use `PORT` to choose a different port.

## Included

- The lawyer’s jacket card opens in 3D to reveal the digital profile. Select **Meet A. Perera** to enter.
- Profile, Practice and Forum tabs support touch and mouse swipes. Drag any non-interactive part of a tab horizontally. Vertical scrolling stays native.
- Contact details export as a `.vcf` file, ready to import into a contacts app.
- Consultation forms validate contact details and the preferred date, retain edits while navigating, and prepare a downloadable request. An email draft option becomes available after configuring real contact details.
- The forum includes search, category filters, discussions, replies, and local persistence. Example discussions are identified in their detail view. New content stays in the current browser.
- Document selection displays a filename; file contents are never uploaded or stored. A selected consultation document must be attached separately when sending an email.
- Keyboard navigation, visible focus, accessible labels, and reduced-motion support are included. On the bottom navigation, use the arrow keys, Home, or End.

## Personalise

Edit **`dist/profile-config.js`** to change the name, initials, title, location, address, practice areas and languages. Add real phone, WhatsApp, email and website details, then set `isDemo` to `false` to enable email links. Phone numbers should include the country code. Website URLs must begin with `https://` or `http://`.

The starting values, including **A. Perera** and **lawyer@example.com**, come from the reference design. Unconfigured contact actions explain that the profile is a sample instead of contacting a fictitious number.

## Production connections

This is a complete interactive frontend. Consultation requests are prepared locally and are never labelled as sent. Download a request or, after configuring a real email address, open an email draft to send it yourself. Request data stays in memory and is cleared on page reload.

The forum uses localStorage and has no shared membership, authentication or server database. A shared community needs those services connected before real use. Files are only selected locally, and only their filenames are retained with local forum posts.

## Verify and host

```sh
npm run check
```

This checks all JavaScript files for syntax errors. Upload the contents of **`dist/`** to any static web host. Hash-based navigation needs no server rewrite rules. The included local server binds only to `127.0.0.1`.

The build also passed 20 DOM interaction checks covering the jacket introduction, contact export, navigation, consultation validation and draft retention, request downloads, search, category filters, local posts and replies, HTML escaping, simulated horizontal swipes, and invalid-route recovery. These checks do not verify physical device performance or visual layout.

The repository includes an automated GitHub Pages workflow at **`.github/workflows/deploy-pages.yml`**. It publishes only **`tapx-counsel/dist/`** after JavaScript checks pass. Set the repository's Pages publishing source to **GitHub Actions**. Future pushes to `main` trigger deployment automatically.

Visual browser QA was unavailable in the build environment. Review the profile on a phone before release, particularly the opening animation and horizontal gestures.
