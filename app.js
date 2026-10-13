/* QR_Infinity: browser-based QR generation with bundled, local encoder. */
(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const ALL_TYPES = ['url', 'text', 'wifi', 'email', 'phone', 'sms', 'contact'];
  const state = { type: 'url', logoData: '', logoImage: null, qr: null, payload: '', valid: false, error: '' };
  const canvas = $('qr-canvas');
  const ctx = canvas.getContext('2d');
  let toastTimer;
  let updateTimer;

  const monitored = [
    'url-input', 'text-input', 'wifi-ssid', 'wifi-encryption', 'wifi-password', 'wifi-hidden',
    'email-to', 'email-subject', 'email-body', 'phone-input', 'sms-to', 'sms-body',
    'contact-name', 'contact-org', 'contact-phone', 'contact-email', 'contact-website',
    'foreground-color', 'background-color', 'dot-style', 'code-size', 'error-correction'
  ];
  for (const id of monitored) {
    $(id).addEventListener('input', () => scheduleUpdate());
    $(id).addEventListener('change', () => scheduleUpdate());
  }

  function toast(message) {
    const el = $('toast');
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 3000);
  }

  function scheduleUpdate() {
    $('foreground-hex').textContent = $('foreground-color').value.toUpperCase();
    $('background-hex').textContent = $('background-color').value.toUpperCase();
    $('qr-dimensions').textContent = `${$('code-size').value} × ${$('code-size').value} px`;
    $('wifi-password-field').hidden = $('wifi-encryption').value === 'nopass';
    clearTimeout(updateTimer);
    updateTimer = setTimeout(updateQR, 90);
  }

  document.querySelectorAll('[data-type]').forEach(tab => {
    tab.addEventListener('click', () => {
      state.type = tab.dataset.type;
      document.querySelectorAll('[data-type]').forEach(t => {
        const active = t === tab;
        t.classList.toggle('active', active);
        t.setAttribute('aria-selected', String(active));
        t.tabIndex = active ? 0 : -1;
      });
      document.querySelectorAll('[data-panel]').forEach(panel => {
        const active = panel.dataset.panel === state.type;
        panel.hidden = !active;
        panel.classList.toggle('active', active);
      });
      scheduleUpdate();
    });
  });
  // Accessible arrow-key movement in the tab bar.
  document.querySelector('.tab-strip').addEventListener('keydown', e => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
    e.preventDefault();
    const tabs = [...document.querySelectorAll('[data-type]')];
    const index = tabs.findIndex(t => t.dataset.type === state.type);
    const next = e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : (index + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    tabs[next].click();
    tabs[next].focus();
  });

  function escapeWifi(v) { return v.replace(/([\\;,:"])/g, '\\$1'); }
  function escapeVcard(v) { return v.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;'); }
  function getPayload() {
    switch (state.type) {
      case 'url': {
        const raw = $('url-input').value.trim();
        if (!raw) return '';
        if (/^[a-z][a-z\d+.-]*:\/\//i.test(raw) && !/^https?:\/\//i.test(raw)) throw new Error('Links must start with http:// or https://.');
        const expanded = /^https?:\/\//i.test(raw) ? raw : 'https://' + raw;
        try {
          const parsed = new URL(expanded);
          if (!['http:', 'https:'].includes(parsed.protocol) || !parsed.hostname) throw Error();
          return parsed.href;
        } catch { throw new Error('Enter a valid website address.'); }
      }
      case 'text': return $('text-input').value;
      case 'wifi': {
        const ssid = $('wifi-ssid').value;
        if (!ssid) return '';
        const security = $('wifi-encryption').value;
        if (security !== 'nopass' && !$('wifi-password').value) return '';
        const password = security === 'nopass' ? '' : $('wifi-password').value;
        return `WIFI:T:${security};S:${escapeWifi(ssid)};P:${escapeWifi(password)};H:${$('wifi-hidden').checked ? 'true' : 'false'};;`;
      }
      case 'email': {
        const email = $('email-to').value.trim();
        if (!email) return '';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Enter a valid email address.');
        const params = new URLSearchParams();
        if ($('email-subject').value) params.set('subject', $('email-subject').value);
        if ($('email-body').value) params.set('body', $('email-body').value);
        return `mailto:${email}${params.toString() ? '?' + params.toString() : ''}`;
      }
      case 'phone': {
        const phone = $('phone-input').value.trim();
        if (!phone) return '';
        if (!/^[+()\d\s.\-]{3,40}$/.test(phone)) throw new Error('Enter a valid phone number.');
        return `tel:${phone.replace(/[^\d+]/g, '')}`;
      }
      case 'sms': {
        const phone = $('sms-to').value.trim();
        if (!phone) return '';
        if (!/^[+()\d\s.\-]{3,40}$/.test(phone)) throw new Error('Enter a valid mobile number.');
        return `SMSTO:${phone.replace(/[^\d+]/g, '')}:${$('sms-body').value}`;
      }
      case 'contact': {
        const name = $('contact-name').value.trim();
        if (!name) return '';
        const pieces = ['BEGIN:VCARD', 'VERSION:3.0', 'FN:' + escapeVcard(name)];
        if ($('contact-org').value) pieces.push('ORG:' + escapeVcard($('contact-org').value));
        if ($('contact-phone').value) pieces.push('TEL:' + escapeVcard($('contact-phone').value));
        if ($('contact-email').value) pieces.push('EMAIL:' + escapeVcard($('contact-email').value));
        if ($('contact-website').value) pieces.push('URL:' + escapeVcard($('contact-website').value));
        return pieces.concat('END:VCARD').join('\r\n');
      }
      default: return '';
    }
  }

  function makeMatrix() {
    const payload = getPayload();
    if (!payload.trim()) { state.payload = ''; return null; }
    // 8-bit byte-mode QR codes support at most ~2953 bytes at level L; at H much less.
    if (new TextEncoder().encode(payload).length > 2200) throw new Error('This content is too long. Try a shorter message or link.');
    const correction = state.logoImage ? 'H' : $('error-correction').value;
    const qr = window.QRInfinityMatrix(payload, correction);
    state.payload = payload;
    return qr;
  }

  function hexRgb(value) {
    return [1, 3, 5].map(i => parseInt(value.slice(i, i + 2), 16) / 255).map(v => v <= .04045 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4));
  }
  function contrastRatio(f, b) {
    const a = hexRgb(f), c = hexRgb(b);
    const l1 = .2126*a[0] + .7152*a[1] + .0722*a[2];
    const l2 = .2126*c[0] + .7152*c[1] + .0722*c[2];
    return (Math.max(l1, l2) + .05) / (Math.min(l1, l2) + .05);
  }
  const withinFinder = (r, c, n) => (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7);

  function paintQR(target, size, qr) {
    target.width = size;
    target.height = size;
    const context = target.getContext('2d');
    const fore = $('foreground-color').value;
    const back = $('background-color').value;
    context.fillStyle = back;
    context.fillRect(0, 0, size, size);
    const n = qr.getModuleCount();
    const quiet = 4;
    const cell = size / (n + quiet * 2);
    const rounded = $('dot-style').value === 'rounded';
    context.fillStyle = fore;
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        if (!qr.isDark(y, x)) continue;
        const xx = (x + quiet) * cell, yy = (y + quiet) * cell;
        if (rounded && !withinFinder(y, x, n)) {
          const r = cell * .25;
          context.beginPath();
          context.roundRect(xx, yy, cell + .02, cell + .02, r);
          context.fill();
        } else context.fillRect(xx, yy, cell + .05, cell + .05);
      }
    }
    if (state.logoImage) {
      const logoSize = n * cell * .18;
      const boxSize = logoSize + cell * 1.8;
      const bx = (size - boxSize) / 2, by = (size - boxSize) / 2;
      context.fillStyle = back;
      context.beginPath();
      context.roundRect(bx, by, boxSize, boxSize, cell * .65);
      context.fill();
      const im = state.logoImage;
      const scale = Math.min(logoSize / im.naturalWidth, logoSize / im.naturalHeight);
      const w = im.naturalWidth * scale, h = im.naturalHeight * scale;
      context.drawImage(im, (size - w) / 2, (size - h) / 2, w, h);
    }
  }

  function svgQR(size, qr) {
    const n = qr.getModuleCount(), quiet = 4, cell = size / (n + quiet * 2);
    const rounded = $('dot-style').value === 'rounded';
    const fore = $('foreground-color').value, back = $('background-color').value;
    const out = [`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">`, `<rect width="${size}" height="${size}" fill="${back}"/>`, `<g fill="${fore}">`];
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        if (!qr.isDark(y, x)) continue;
        const xx = ((x + quiet)*cell).toFixed(4), yy = ((y + quiet)*cell).toFixed(4);
        const rad = rounded && !withinFinder(y,x,n) ? ` rx="${(cell*.25).toFixed(4)}"` : '';
        out.push(`<rect x="${xx}" y="${yy}" width="${(cell+.025).toFixed(4)}" height="${(cell+.025).toFixed(4)}"${rad}/>`);
      }
    }
    out.push('</g>');
    if (state.logoImage) {
      const logoSize = n * cell * .18, boxSize = logoSize + cell * 1.8;
      const bx = (size - boxSize)/2, by = bx, im = state.logoImage;
      const scale = Math.min(logoSize / im.naturalWidth, logoSize / im.naturalHeight);
      const w = im.naturalWidth * scale, h = im.naturalHeight * scale;
      out.push(`<rect x="${bx}" y="${by}" width="${boxSize}" height="${boxSize}" rx="${cell*.65}" fill="${back}"/>`);
      out.push(`<image x="${(size-w)/2}" y="${(size-h)/2}" width="${w}" height="${h}" href="${state.logoData}"/>`);
    }
    out.push('</svg>');
    return out.join('');
  }

  function updateQR() {
    try {
      state.qr = makeMatrix();
      state.valid = Boolean(state.qr);
      state.error = state.valid ? '' : 'Add content to begin';
      if (state.valid) paintQR(canvas, 520, state.qr);
    } catch (e) {
      state.qr = null;
      state.valid = false;
      state.error = /code length overflow|overflow|illegal length|invalid length/i.test(e.message) ? 'Too much data for this QR code. Try shorter content.' : e.message;
    }
    $('qr-canvas').hidden = !state.valid;
    $('preview-empty').hidden = state.valid;
    $('download-png').disabled = !state.valid;
    $('download-svg').disabled = !state.valid;
    $('copy-image').disabled = !state.valid;
    const s = $('qr-status');
    s.classList.toggle('invalid', !state.valid);
    s.textContent = state.valid ? 'Ready to scan' : state.error;
    const dot = document.createElement('span');
    dot.className = 'status-dot';
    s.prepend(dot);
    const contrast = contrastRatio($('foreground-color').value, $('background-color').value);
    $('contrast-warning').hidden = !state.valid || contrast >= 4.5;
  }

  async function saveFile(blob, name) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1200);
  }
  function createExportCanvas() {
    if (!state.valid) throw new Error('Enter content first.');
    const out = document.createElement('canvas');
    paintQR(out, Number($('code-size').value), state.qr);
    return out;
  }
  $('download-png').addEventListener('click', () => {
    try {
      const out = createExportCanvas();
      out.toBlob(blob => {
        if (blob) { saveFile(blob, 'QR_Infinity.png'); toast('PNG downloaded!'); }
        else toast('Could not create PNG. Try a smaller size.');
      }, 'image/png');
    } catch (e) { toast(e.message); }
  });
  $('download-svg').addEventListener('click', () => {
    if (!state.valid) return;
    const svg = svgQR(Number($('code-size').value), state.qr);
    saveFile(new Blob([svg], {type: 'image/svg+xml;charset=utf-8'}), 'QR_Infinity.svg');
    toast('SVG downloaded!');
  });
  $('copy-image').addEventListener('click', async () => {
    if (!state.valid) return;
    if (!navigator.clipboard || !window.ClipboardItem) { toast('Image copying is not supported in this browser. Download PNG instead.'); return; }
    try {
      const blob = await new Promise((resolve, reject) => createExportCanvas().toBlob(b => b ? resolve(b) : reject(new Error('PNG conversion failed')), 'image/png'));
      await navigator.clipboard.write([new ClipboardItem({'image/png': blob})]);
      toast('QR image copied to clipboard!');
    } catch { toast('Clipboard unavailable. Try Download PNG instead.'); }
  });
  $('advanced-toggle').addEventListener('click', () => {
    const shown = $('advanced-options').hidden;
    $('advanced-options').hidden = !shown;
    $('advanced-toggle').setAttribute('aria-expanded', String(shown));
    $('advanced-chevron').textContent = shown ? '⌃' : '⌄';
  });

  $('logo-upload').addEventListener('change', async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/png','image/jpeg','image/webp'].includes(file.type)) { toast('Choose a PNG, JPG or WebP image.'); e.target.value=''; return; }
    if (file.size > 2*1024*1024) { toast('Choose an image smaller than 2 MB.'); e.target.value=''; return; }
    try {
      const data = await new Promise((resolve,reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Could not read file'));
        reader.readAsDataURL(file);
      });
      const image = await new Promise((resolve,reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Invalid image'));
        img.src = data;
      });
      state.logoData = data;
      state.logoImage = image;
      $('logo-filename').textContent = file.name;
      $('logo-added').hidden = false;
      toast('Logo added. Scan-test your code after downloading.');
      scheduleUpdate();
    } catch { toast('This image could not be loaded.'); }
  });
  $('remove-logo').addEventListener('click', () => {
    state.logoImage = null;
    state.logoData = '';
    $('logo-upload').value = '';
    $('logo-added').hidden = true;
    scheduleUpdate();
  });
  $('reset-button').addEventListener('click', () => {
    $('foreground-color').value = '#24213a';
    $('background-color').value = '#ffffff';
    $('dot-style').value = 'rounded';
    $('code-size').value = '1024';
    $('error-correction').value = 'M';
    state.logoImage = null;
    state.logoData = '';
    $('logo-upload').value = '';
    $('logo-added').hidden = true;
    scheduleUpdate();
    toast('Design settings reset.');
  });
  scheduleUpdate();
})();
