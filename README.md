# QR_Infinity

**Create once. Scan anytime.**

[**Open the QR generator →**](https://mdzisan23.github.io/QR_Infinity/)

QR_Infinity is a free, open-source QR code generator. Make a code for a website, Wi-Fi network, message, or contact, customize it, and download it in seconds. No account, watermark, subscription, or advertising.

## What you can create

| QR type | What it does |
| --- | --- |
| Link | Opens a website or online resource |
| Text | Displays a short message or information |
| Wi-Fi | Helps guests connect to a Wi-Fi network |
| Email | Opens a new email, with optional subject and body |
| Phone | Opens a dialer with a phone number |
| SMS | Prepares a text message |
| Contact | Shares a vCard with contact details |

Choose a foreground and background color, switch between classic and rounded modules, or add a small center logo. Export as **PNG** (512, 1024, or 2048 pixels) or **SVG**, or copy the QR image where supported.

## Why use it?

- **Free to use.** No fees, accounts, or download limits imposed by the app.
- **Private by design.** The QR content is encoded in your browser; it isn't sent to a QR-generation service. GitHub Pages may log ordinary website requests.
- **Works offline after loading.** QR encoding code is stored in the repository, not fetched from an external CDN.
- **Yours to keep.** Downloaded static QR codes don't depend on this site remaining online.

### Do the QR codes expire?

**No.** Static QR codes have no built-in expiration date. A QR code containing a URL will still need that destination website to remain available. Unlike an editable or dynamic QR service, the encoded contents **cannot be changed** after creation.

To ensure scan reliability, test customized codes before printing. Low contrast and large center logos can make a QR code harder to scan. QR codes containing private contact details or Wi-Fi passwords should be shared carefully.

## Publish this website on GitHub Pages

This ZIP is ready for the existing **[mdzisan23/QR_Infinity](https://github.com/mdzisan23/QR_Infinity)** repository. No build tools or backend required.

1. **Extract** the `QR_Infinity_Complete_Website.zip` file on your computer. Don't upload the ZIP itself.
2. Open [your GitHub repository](https://github.com/mdzisan23/QR_Infinity) and select **Add file → Upload files**.
3. Upload **everything inside** the extracted folder to the **repository root**. Replace the old `index.html`, `app.js`, `styles.css`, and `README.md` when prompted. Include both the `vendor` and `assets` folders.
4. Click **Commit changes**.
5. If needed, open **Settings → Pages → Build and deployment**. Select **Deploy from a branch**, **main**, and **/ (root)**, then **Save**.
6. After publishing, visit **https://mdzisan23.github.io/QR_Infinity/**. Allow a few minutes for updates, then hard-refresh (`Ctrl + Shift + R`) if needed.

**Required file location:** `vendor/qr-code.js` must be directly inside the `vendor/` folder in the repository root. If that file isn't uploaded, QR generation will fail.

Your repository root should contain:

```text
QR_Infinity/
├── index.html
├── styles.css
├── app.js
├── README.md
├── LICENSE
├── .nojekyll
├── vendor/
│   ├── qr-code.js
│   └── LICENSE.txt
└── assets/
    └── favicon.svg
```

## Run it locally

Open `index.html` in a modern browser, or serve it with:

```bash
python -m http.server 8000
```

Then open [http://localhost:8000](http://localhost:8000). Clipboard image copying requires a secure context (such as HTTPS or localhost) and may not work in every browser.

## Contribute

Found a bug or have a suggestion? [Open an issue](https://github.com/mdzisan23/QR_Infinity/issues) or submit a pull request.

## License

Website code and styling: MIT License (`LICENSE`). Bundled QR encoding library: Kazuhiko Arase's QRCode for JavaScript, MIT (`vendor/LICENSE.txt`).

---

**QR_Infinity** — a useful tool, free for everyone.
