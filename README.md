# OpenQR Studio — Free QR Code Generator

An attractive, open-source, **100% browser-based QR code generator** that can be hosted on GitHub Pages. No paid APIs, hosting subscriptions, accounts, databases, frameworks, or build tools required.

## Features

- QR content types: **link, text, Wi-Fi, email, phone, SMS, contact (vCard)**
- QR color, background color, and square/rounded patterns
- Optional center logo (PNG, JPG, WebP, max 2 MB)
- Download as **PNG** (512, 1024, or 2048 pixels), **SVG** (scalable), or copy a PNG to clipboard (browser permission required)
- Live preview, error correction, contrast warning, responsive layout
- Privacy-minded: no ads, login, analytics, cookies, remote calls, or QR-generation servers
- All third-party code **included locally**, so the published site does not rely on a CDN

## Publish on GitHub Pages (no coding required)

1. Sign in to [github.com](https://github.com) and select **New repository**.
2. Name it `qr-generator` (or any name you prefer), choose **Public**, and create it.
3. **Extract the ZIP file** on your computer. On your repository page, click **Add file → Upload files**, and upload **the contents of the extracted folder**, not the ZIP itself. Keep `index.html`, `styles.css`, `app.js`, and the `assets` and `vendor` folders in the repository root.
4. Click **Commit changes**.
5. Open repository **Settings → Pages**. Under **Build and deployment**, choose **Deploy from a branch**. Set **Branch: main** and **Folder: / (root)**, then **Save**.
6. After GitHub deploys, click **Visit site**, or open `https://YOUR-USERNAME.github.io/qr-generator/`.

GitHub Free requires your repository to be public for GitHub Pages. GitHub Pages is subject to GitHub's terms, limits, and policies; free availability cannot be guaranteed permanently.

Official GitHub instructions: https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site

### Want the shortest web address?

Name the repository `YOUR-USERNAME.github.io` instead. Then the site lives at `https://YOUR-USERNAME.github.io/`.

## Run on your computer

Open `index.html` in a modern browser. Most features work as a local file. The copy-image feature is safest on HTTPS or `localhost`. To test with a local server:

```sh
python -m http.server 8000
```

Then open `http://localhost:8000/`.

## Change the website name

Search for **OpenQR Studio** and **openqrstudio** in `index.html`, and edit the page `<title>`, logo branding, metadata, and footer to match your preferred project name. Change accent colors through CSS variables in `styles.css`.

## Important notes

- These are **static QR codes**. A QR code doesn't expire by itself, but URLs can become unavailable. The encoded URL **cannot be edited** after the QR code is created.
- A QR code can expose Wi-Fi passwords or contact details to anyone who scans it. Share sensitive codes carefully.
- Color contrast, logos, and unusual styling can reduce scan reliability; scan-test downloaded images on multiple devices before printing or distributing.
- No backend API, redirect hosting, QR tracking, or analytics included.
- Website visits may still be logged by the hosting provider (GitHub Pages), but the application does not transmit the QR text to a server.

## Project files

```
index.html           Main website UI
styles.css           Theme and responsive styles
app.js               QR logic, previews and downloads
vendor/qr-code.js    Local MIT QR encoding algorithm
vendor/LICENSE.txt   Upstream license and attribution
assets/favicon.svg   Browser tab icon
.nojekyll            Turns off Jekyll file processing
LICENSE              License for the site source code
```

## License

Site code and styling: MIT (see `LICENSE`). QR encoder: Kazuhiko Arase, MIT (see `vendor/LICENSE.txt`).
