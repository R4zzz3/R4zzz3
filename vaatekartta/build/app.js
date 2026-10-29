(() => {
  const D = window.VK;
  const SVGNS = 'http://www.w3.org/2000/svg';
  const $ = (sel, el = document) => el.querySelector(sel);

  const COUNTRY = {
    SE: ['Ruotsi', 'Ruotsista'], DK: ['Tanska', 'Tanskasta'], NO: ['Norja', 'Norjasta'], FI: ['Suomi', 'Suomesta'],
    IS: ['Islanti', 'Islannista'], FR: ['Ranska', 'Ranskasta'], BE: ['Belgia', 'Belgiasta'], NL: ['Alankomaat', 'Alankomaista'],
    LU: ['Luxemburg', 'Luxemburgista'], DE: ['Saksa', 'Saksasta'], AT: ['Itävalta', 'Itävallasta'], CH: ['Sveitsi', 'Sveitsistä'],
    IT: ['Italia', 'Italiasta'], ES: ['Espanja', 'Espanjasta'], PT: ['Portugali', 'Portugalista'], PL: ['Puola', 'Puolasta'],
    CZ: ['Tšekki', 'Tšekistä'], EE: ['Viro', 'Virosta'], LV: ['Latvia', 'Latviasta'], LT: ['Liettua', 'Liettuasta'],
    GB: ['Iso-Britannia', 'Isosta-Britanniasta'], UK: ['Iso-Britannia', 'Isosta-Britanniasta'], IE: ['Irlanti', 'Irlannista'],
    GR: ['Kreikka', 'Kreikasta'], HU: ['Unkari', 'Unkarista'], SK: ['Slovakia', 'Slovakiasta'], SI: ['Slovenia', 'Sloveniasta'],
    HR: ['Kroatia', 'Kroatiasta'], RO: ['Romania', 'Romaniasta'], BG: ['Bulgaria', 'Bulgariasta'],
  };
  const TYPE = {
    farkut: 'Farkut', housut: 'Housut', neuleet: 'Neuleet', paidat: 'Paidat', takit: 'Takit',
    collegit: 'Collegit', 't-paidat': 'T-paidat', asusteet: 'Asusteet',
  };
  const TYPE_ONE = {
    farkut: 'farkut', housut: 'housut', neuleet: 'neule', paidat: 'paita', takit: 'takki',
    collegit: 'college', 't-paidat': 't-paita', asusteet: 'asuste',
  };

  const brands = D.brands;
  const byId = new Map(brands.map((b) => [b.id, b]));
  const allProducts = brands.flatMap((b) => b.products.map((p, i) => ({ ...p, brand: b, key: `${b.id}:${i}` })));

  // ---------- state ----------
  const store = {
    get(key, fallback) {
      try {
        const v = localStorage.getItem(key);
        return v == null ? fallback : JSON.parse(v);
      } catch {
        return fallback;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {
        /* storage blocked: the choice lasts for this visit */
      }
    },
  };
  const state = { type: 'all', country: 'all', likedOnly: false, sort: { key: 'name', dir: 1 }, open: null };
  const likes = new Set(store.get('vk-likes', []));

  // ---------- theme ----------
  const savedTheme = store.get('vk-theme', null);
  if (savedTheme) document.documentElement.dataset.theme = savedTheme;
  $('#theme').addEventListener('click', () => {
    const dark =
      document.documentElement.dataset.theme === 'dark' ||
      (!document.documentElement.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches);
    const next = dark ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    store.set('vk-theme', next);
  });

  // ---------- formatting ----------
  const nf = new Intl.NumberFormat('fi-FI', { maximumFractionDigits: 2 });
  const eur = (n) => (n == null ? null : `${nf.format(n)} €`);
  const dayRange = (d) => (!d ? null : d[0] === d[1] ? `${d[0]}` : `${d[0]}–${d[1]}`);
  const countryName = (c) => COUNTRY[c]?.[0] ?? c;
  const countryFrom = (c) => COUNTRY[c]?.[1] ?? c;
  const esc = (s) =>
    String(s ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
  const nonEu = (b) => b.ship.vat !== 'eu';
  const bestCoupon = (b) => b.coupons[0] ?? null;
  const minPrice = (b) => Math.min(...b.products.map((p) => p.price));

  const stitch = (speed) =>
    `<svg class="stitch s-${speed}" viewBox="0 0 24 8" aria-hidden="true"><line x1="${speed === 'slow' ? 2 : 1}" y1="4" x2="23" y2="4"/></svg>`;
  const SPEED_WORD = { fast: '1–3 pv', mid: '4–6 pv', slow: '7+ pv', unknown: 'ei tietoa' };

  function costText(b) {
    if (b.ship.cost === 0) return 'Toimitus ilmainen';
    if (b.ship.cost == null) return 'Toimitus: hinta kassalla';
    return `Toimitus ${eur(b.ship.cost)}`;
  }
  function vatText(b) {
    if (b.ship.vat === 'ioss' || b.ship.vat === 'ddp') return 'ALV ja tulli maksetaan kassalla';
    if (b.ship.vat === 'buyer') return '<b>ALV ja tulli maksetaan perillä</b>';
    return null;
  }

  // The care label: max four facts, "Made in" becomes where the parcel leaves from.
  function careLabel(b, compact = false) {
    const d = dayRange(b.ship.days);
    const lines = compact
      ? [
          `<span>${costText(b)}${b.ship.freeOver ? `, ilmainen yli ${eur(b.ship.freeOver)}` : ''}</span>`,
          `<span>${stitch(b.ship.speed)}${d ? `${d} pv Suomeen` : 'Toimitusaika ei tiedossa'}</span>`,
        ]
      : [
          `<span>${costText(b)}</span>`,
          b.ship.freeOver ? `<span>Ilmainen yli ${eur(b.ship.freeOver)}</span>` : null,
          `<span>${stitch(b.ship.speed)}${d ? `${d} arkipäivää` : 'Toimitusaika ei tiedossa'}</span>`,
          `<span>${vatText(b) ?? `Lähtee ${countryFrom(b.ship.fromCountry)}`}</span>`,
        ];
    if (compact && vatText(b)) lines.push(`<span>${vatText(b)}</span>`);
    return `<div class="care${compact ? ' compact' : ''}">${lines.filter(Boolean).join('')}</div>`;
  }

  function couponHTML(c, cls = 'coupon') {
    if (!c) return '';
    const code = c.code
      ? `<button type="button" class="code" data-copy="${esc(c.code)}">${esc(c.code)} <em>Kopioi</em></button>`
      : '';
    return `<div class="${cls}"><span class="deal">${esc(c.deal)}</span>${code}</div>`;
  }

  // ---------- icons ----------
  const heart = `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-9.3-9.4C1.4 7.6 3.6 4 7.2 4c2 0 3.6 1.1 4.8 2.8C13.2 5.1 14.8 4 16.8 4c3.6 0 5.8 3.6 4.5 7.1-1.8 4.8-9.3 9.4-9.3 9.4z"/></svg>`;
  const heartPop = `<svg class="heart-pop" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-9.3-9.4C1.4 7.6 3.6 4 7.2 4c2 0 3.6 1.1 4.8 2.8C13.2 5.1 14.8 4 16.8 4c3.6 0 5.8 3.6 4.5 7.1-1.8 4.8-9.3 9.4-9.3 9.4z"/></svg>`;
  const ext = `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>`;
  const sortIco = (dir) =>
    `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="${dir === 1 ? 'M12 19V5M6 11l6-6 6 6' : 'M12 5v14M6 13l6 6 6-6'}"/></svg>`;

  // ---------- filters ----------
  const passCountry = (b) =>
    state.country === 'all' || (state.country === 'eu' ? !nonEu(b) : b.country === state.country);
  const brandVisible = (b) => (state.type === 'all' || b.tags.includes(state.type)) && passCountry(b);
  const productVisible = (p) =>
    (state.type === 'all' || p.type === state.type) && passCountry(p.brand) && (!state.likedOnly || likes.has(p.key));

  const countries = [...new Set(brands.map((b) => b.country))].sort((a, b) => countryName(a).localeCompare(countryName(b), 'fi'));

  function renderFilters() {
    const types = Object.keys(TYPE).filter((t) => brands.some((b) => b.tags.includes(t)));
    const opts = [['all', 'Kaikki maat'], ['eu', 'Vain EU, ei tullia'], ...countries.map((c) => [c, countryName(c)])]
      .map(([v, l]) => `<option value="${v}"${state.country === v ? ' selected' : ''}>${l}</option>`)
      .join('');
    const chips = [['all', 'Kaikki'], ...types.map((t) => [t, TYPE[t]])]
      .map(([v, l]) => `<button type="button" class="chip" data-type="${v}" aria-pressed="${state.type === v}">${l}</button>`)
      .join('');
    $('#filters').innerHTML =
      `<div class="chips" role="group" aria-label="Suodata">` +
      `<button type="button" class="chip feed-only" data-liked aria-pressed="${state.likedOnly}">${heart}Tykätyt <span class="count" id="like-count">${likes.size}</span></button>` +
      `<select class="chip${state.country === 'all' ? '' : ' on'}" id="country" aria-label="Maa">${opts}</select>` +
      chips +
      `</div>`;
  }

  $('#filters').addEventListener('click', (e) => {
    const chip = e.target.closest('button');
    if (!chip) return;
    if (chip.dataset.type) state.type = chip.dataset.type;
    if ('liked' in chip.dataset) state.likedOnly = !state.likedOnly;
    state.open = null;
    renderFilters();
    renderAll(true);
  });
  $('#filters').addEventListener('change', (e) => {
    if (e.target.id !== 'country') return;
    state.country = e.target.value;
    state.open = null;
    renderFilters();
    renderAll(true);
  });

  // ---------- map ----------
  const svg = $('#map');
  const routesG = $('#routes');
  const dotsG = $('#dots');
  const [VW, VH] = D.view;
  const dest = D.dest;
  let vb = [0, 0, VW, VH];
  let selected = null;

  const SPEED_RANK = { fast: 0, mid: 1, slow: 2, unknown: 3 };
  // Shops closer than 16 screen pixels share one marker, so dots never overlap at any zoom.
  function clusters() {
    const reach = unitsPerPx() * 16;
    const groups = [];
    for (const b of brands) {
      if (!b.ship.xy || !brandVisible(b)) continue;
      const near = groups.find((g) => Math.hypot(g.xy[0] - b.ship.xy[0], g.xy[1] - b.ship.xy[1]) < reach);
      if (near) near.brands.push(b);
      else groups.push({ key: b.id, xy: b.ship.xy, brands: [b] });
    }
    return groups.map((c) => ({
      ...c,
      speed: c.brands.map((b) => b.ship.speed).sort((a, b) => SPEED_RANK[a] - SPEED_RANK[b])[0],
    }));
  }

  const placeOf = (c) =>
    [...new Set(c.brands.map((b) => b.ship.from || countryName(b.country)))].slice(0, 3).join('; ');

  function routePath([x1, y1], [x2, y2]) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy) || 1;
    const bend = len * 0.18;
    // perpendicular that points north (negative y)
    let nx = dy / len;
    let ny = -dx / len;
    if (ny > 0) {
      nx = -nx;
      ny = -ny;
    }
    return `M${x1},${y1} Q${(x1 + x2) / 2 + nx * bend},${(y1 + y2) / 2 + ny * bend} ${x2},${y2}`;
  }

  function unitsPerPx() {
    const r = svg.getBoundingClientRect();
    if (!r.width || !r.height) return vb[2] / VW;
    return Math.max(vb[2] / r.width, vb[3] / r.height);
  }

  function renderMap() {
    const cs = clusters().sort((a, b) => SPEED_RANK[b.speed] - SPEED_RANK[a.speed]);
    const k = unitsPerPx();
    svg.classList.toggle('has-sel', Boolean(selected));
    routesG.innerHTML = cs
      .map((c) => `<path class="route s-${c.speed}${selected === c.key ? ' sel' : ''}" d="${routePath(c.xy, dest)}"/>`)
      .join('');
    dotsG.innerHTML = '';
    for (const c of cs) {
      const g = document.createElementNS(SVGNS, 'g');
      g.setAttribute('class', `dot s-${c.speed}${selected === c.key ? ' sel' : ''}`);
      g.setAttribute('transform', `translate(${c.xy[0]},${c.xy[1]}) scale(${k})`);
      g.setAttribute('tabindex', '0');
      g.setAttribute('role', 'button');
      const names = c.brands.map((b) => b.name).join(', ');
      g.setAttribute('aria-label', `${names}, ${placeOf(c)}`);
      const n = c.brands.length;
      const r = selected === c.key ? 7 : n > 1 ? 9 : 5;
      g.innerHTML =
        `<title>${esc(names)}</title><circle class="hit" r="22"/><circle class="pin" r="${n > 1 ? Math.max(r, 9) : r}"/>` +
        (n > 1 ? `<text class="n" dy="3.5">${n}</text>` : '');
      g.addEventListener('click', () => openCluster(c));
      g.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openCluster(c);
        }
      });
      dotsG.appendChild(g);
    }
    $('#dest').setAttribute('transform', `translate(${dest[0]},${dest[1]}) scale(${k})`);
    const shown = cs.reduce((n, c) => n + c.brands.length, 0);
    $('#map-count').textContent = `${shown} kauppaa kartalla`;
  }

  function setViewBox(next) {
    let [x, y, w, h] = next;
    const minW = VW / 10;
    if (w < minW) {
      const s = minW / w;
      x -= ((s - 1) * w) / 2;
      y -= ((s - 1) * h) / 2;
      w = minW;
      h *= s;
    }
    if (w > VW * 1.6) return;
    vb = [x, y, w, h];
    svg.setAttribute('viewBox', vb.map((v) => v.toFixed(1)).join(' '));
    renderMap();
  }

  function fitTo(points, pad = 50) {
    const box = svg.getBoundingClientRect();
    if (!box.width || !box.height || !points.length) return;
    const xs = points.map((p) => p[0]);
    const ys = points.map((p) => p[1]);
    // leave room for the legend (bottom-left) and zoom buttons (bottom-right)
    const padPx = { top: 24, right: 24, bottom: 150, left: 24 }; // zoom buttons sit inside the bottom strip
    const w0 = Math.max(...xs) - Math.min(...xs) + pad * 2;
    const h0 = Math.max(...ys) - Math.min(...ys) + pad * 2;
    const s = Math.max(w0 / (box.width - padPx.left - padPx.right), h0 / (box.height - padPx.top - padPx.bottom));
    const w = box.width * s;
    const h = box.height * s;
    const x = Math.min(...xs) - pad - padPx.left * s - ((box.width - padPx.left - padPx.right) * s - w0) / 2;
    const y = Math.min(...ys) - pad - padPx.top * s - ((box.height - padPx.top - padPx.bottom) * s - h0) / 2;
    setViewBox([x, y, w, h]);
  }

  function fitData() {
    const pts = brands.filter((b) => b.ship.xy && brandVisible(b)).map((b) => b.ship.xy);
    fitTo(pts.concat([dest]));
  }

  function zoom(factor, cx, cy) {
    const [x, y, w, h] = vb;
    const px = cx ?? x + w / 2;
    const py = cy ?? y + h / 2;
    setViewBox([px - (px - x) * factor, py - (py - y) * factor, w * factor, h * factor]);
  }

  function clientToMap(clientX, clientY) {
    const r = svg.getBoundingClientRect();
    const s = unitsPerPx();
    const offX = (r.width - vb[2] / s) / 2;
    const offY = (r.height - vb[3] / s) / 2;
    return [vb[0] + (clientX - r.left - offX) * s, vb[1] + (clientY - r.top - offY) * s];
  }

  svg.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault();
      const [mx, my] = clientToMap(e.clientX, e.clientY);
      zoom(e.deltaY > 0 ? 1.15 : 1 / 1.15, mx, my);
    },
    { passive: false }
  );

  const pointers = new Map();
  let pinch = null;
  let moved = 0;
  svg.addEventListener('pointerdown', (e) => {
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 1) moved = 0;
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      const mid = clientToMap((a.x + b.x) / 2, (a.y + b.y) / 2);
      pinch = { dist: Math.hypot(a.x - b.x, a.y - b.y), vb: [...vb], mid };
    }
  });
  svg.addEventListener('pointermove', (e) => {
    const prev = pointers.get(e.pointerId);
    if (!prev) return;
    const cur = { x: e.clientX, y: e.clientY };
    pointers.set(e.pointerId, cur);
    if (pointers.size === 1) {
      const dx = cur.x - prev.x;
      const dy = cur.y - prev.y;
      moved += Math.abs(dx) + Math.abs(dy);
      if (moved > 6) {
        const s = unitsPerPx();
        setViewBox([vb[0] - dx * s, vb[1] - dy * s, vb[2], vb[3]]);
      }
    } else if (pointers.size === 2 && pinch) {
      moved = 99;
      const [a, b] = [...pointers.values()];
      const f = pinch.dist / (Math.hypot(a.x - b.x, a.y - b.y) || 1);
      const [x, y, w, h] = pinch.vb;
      const [mx, my] = pinch.mid;
      setViewBox([mx - (mx - x) * f, my - (my - y) * f, w * f, h * f]);
    }
  });
  const endPointer = (e) => {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinch = null;
  };
  svg.addEventListener('pointerup', endPointer);
  svg.addEventListener('pointercancel', endPointer);
  svg.addEventListener('pointerleave', endPointer);
  // a drag that ends on a dot is not a tap
  svg.addEventListener(
    'click',
    (e) => {
      if (moved > 6) {
        e.stopPropagation();
        e.preventDefault();
      }
      moved = 0;
    },
    true
  );

  $('#zoom-in').addEventListener('click', () => zoom(1 / 1.5));
  $('#zoom-out').addEventListener('click', () => zoom(1.5));
  $('#zoom-fit').addEventListener('click', fitData);

  // ---------- brand sheet ----------
  const sheet = $('#sheet');
  const sheetBody = $('#sheet-body');
  let lastFocus = null;

  function openSheet(html) {
    if (sheet.hidden) lastFocus = document.activeElement;
    sheetBody.innerHTML = html;
    sheet.hidden = false;
    sheet.querySelector('.sheet-card').scrollTop = 0;
    $('#sheet-close').focus({ preventScroll: true });
  }
  function closeSheet() {
    sheet.hidden = true;
    if (selected) {
      selected = null;
      renderMap();
    }
    lastFocus?.focus?.({ preventScroll: true });
  }
  $('#sheet-close').addEventListener('click', closeSheet);
  sheet.addEventListener('click', (e) => {
    if (e.target === sheet) closeSheet();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !sheet.hidden) closeSheet();
  });

  function picksHTML(b) {
    return (
      `<ul class="picks" aria-label="Tunnetuimmat vaatteet">` +
      b.products
        .map(
          (p, i) =>
            `<li><button type="button" class="pline" data-goto="${b.id}:${i}">` +
            `<span class="swatch" style="--c:${p.color}"></span><span class="pn">${esc(p.name)}</span>` +
            `<span class="pt">${TYPE_ONE[p.type]}</span><span class="pp">${eur(p.price)}</span></button></li>`
        )
        .join('') +
      `</ul>`
    );
  }

  function brandHTML(b) {
    const where = [b.city, countryName(b.country)].filter(Boolean).join(', ');
    return (
      `<header class="bh"><h2 id="sheet-title">${esc(b.name)}</h2><p>${esc(where)}${b.parent ? `, osa ${esc(b.parent)}-konsernia` : ''}</p>` +
      (b.style ? `<p class="style">${esc(b.style)}</p>` : '') +
      `</header>` +
      careLabel(b) +
      (b.ship.returns ? `<p class="ret">Palautus: ${esc(b.ship.returns)}</p>` : '') +
      b.coupons.slice(0, 3).map((c) => couponHTML(c)).join('') +
      picksHTML(b) +
      `<a class="btn" href="${esc(b.url)}" target="_blank" rel="noopener">Avaa kauppa ${ext}</a>`
    );
  }

  function openBrand(b) {
    openSheet(brandHTML(b));
  }

  function openCluster(c) {
    selected = c.key;
    renderMap();
    if (c.brands.length === 1) return openBrand(c.brands[0]);
    const items = c.brands
      .map((b) => {
        const d = dayRange(b.ship.days);
        return (
          `<li><button type="button" class="bline" data-brand="${b.id}"><span class="bn">${esc(b.name)}</span>` +
          `<span class="bm">${stitch(b.ship.speed)}${d ? `${d} pv` : 'aika ei tiedossa'}, ${b.ship.cost == null ? 'postikulut kassalla' : eur(b.ship.cost)}</span></button></li>`
        );
      })
      .join('');
    openSheet(
      `<header class="bh"><h2 id="sheet-title">${c.brands.length} kauppaa</h2><p>${esc(placeOf(c))}</p></header><ul class="blist">${items}</ul>`
    );
  }

  sheetBody.addEventListener('click', (e) => {
    const brandBtn = e.target.closest('[data-brand]');
    if (brandBtn) return openBrand(byId.get(brandBtn.dataset.brand));
    const go = e.target.closest('[data-goto]');
    if (go) {
      closeSheet();
      if (state.likedOnly || state.type !== 'all' || state.country !== 'all') {
        Object.assign(state, { likedOnly: false, type: 'all', country: 'all' });
        renderFilters();
        renderAll(false);
      }
      location.hash = 'selaa';
      requestAnimationFrame(() => requestAnimationFrame(() => scrollFeedTo(go.dataset.goto)));
    }
  });

  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-copy]');
    if (!btn) return;
    const text = btn.dataset.copy;
    const label = btn.querySelector('em');
    try {
      await navigator.clipboard.writeText(text);
      if (label) label.textContent = 'Kopioitu';
      toast(`Koodi ${text} kopioitu`);
    } catch {
      const range = document.createRange();
      range.selectNodeContents(btn.firstChild?.nodeType === 3 ? btn : btn);
      const sel = getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      toast('Koodi valittu. Kopioi se itse.');
    }
  });

  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (t.hidden = true), 2200);
  }

  // ---------- feed ----------
  const feed = $('#feed');

  // Shops take turns so the same one never shows twice in a row; each shop's best-known piece comes first.
  function feedOrder() {
    let seed = 20261029;
    const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
    const queues = brands.map((b) => allProducts.filter((p) => p.brand === b).sort((a, c) => Number(c.sig) - Number(a.sig)));
    for (let i = queues.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [queues[i], queues[j]] = [queues[j], queues[i]];
    }
    // within each round, autumn pieces (jeans, knits, jackets, shirts) come before tees and accessories
    const light = new Set(['t-paidat', 'asusteet']);
    const out = [];
    while (queues.some((q) => q.length)) {
      const round = queues.filter((q) => q.length).map((q) => q.shift());
      out.push(...round.filter((p) => !light.has(p.type)), ...round.filter((p) => light.has(p.type)));
    }
    return out;
  }
  const ordered = feedOrder();

  function stage(p) {
    const ill = window.garmentSVG ? window.garmentSVG(p.type, p.color) : '';
    const img = p.image
      ? `<img src="${esc(p.image)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()" onload="this.parentNode.classList.add('has-img')">`
      : '';
    return `<div class="stage" style="--c:${p.color}"><div class="ill">${ill}</div>${img}${heartPop}</div>`;
  }

  function cardHTML(p) {
    const b = p.brand;
    const c = bestCoupon(b);
    return (
      `<article class="card" data-key="${p.key}" aria-label="${esc(b.name)}, ${esc(p.name)}, ${eur(p.price)}">` +
      stage(p) +
      `<div class="side-col">` +
      `<div class="card-top"><button type="button" class="brand-btn" data-brand-open="${b.id}">${esc(b.name)} <small>${countryName(b.country)}</small></button>` +
      `<button type="button" class="like" data-like="${p.key}" aria-pressed="${likes.has(p.key)}" aria-label="Tykkää: ${esc(p.name)}">${heart}</button></div>` +
      `<div class="info">` +
      `<div class="pname-row"><h3>${esc(p.name)}</h3><span class="price">${eur(p.price)}</span></div>` +
      (p.why ? `<p class="why">${esc(p.why)}</p>` : '') +
      careLabel(b, true) +
      (c ? couponHTML(c, 'cp-line') : '') +
      `<div class="info-row"><a class="btn" href="${esc(p.url)}" target="_blank" rel="noopener">Avaa kauppa ${ext}</a></div>` +
      `</div></div></article>`
    );
  }

  function renderFeed() {
    const items = ordered.filter(productVisible);
    feed.innerHTML = items.length
      ? items.map(cardHTML).join('')
      : `<div class="empty"><p>${
          state.likedOnly
            ? 'Et ole vielä tykännyt mistään. Napauta sydäntä tai kaksoisnapauta vaatetta.'
            : 'Näillä suodattimilla ei löydy vaatteita. Valitse toinen tuotetyyppi tai maa.'
        }</p></div>`;
    feed.scrollTop = 0;
    updateCounter();
  }

  function scrollFeedTo(key) {
    const el = feed.querySelector(`[data-key="${CSS.escape(key)}"]`);
    if (el) feed.scrollTop = el.offsetTop;
    updateCounter();
  }

  function updateCounter() {
    const n = feed.querySelectorAll('.card').length;
    const i = Math.round(feed.scrollTop / (feed.clientHeight || 1));
    $('#feed-count').textContent = n ? `${Math.min(i + 1, n)} / ${n}` : '';
  }
  feed.addEventListener('scroll', () => requestAnimationFrame(updateCounter), { passive: true });

  function toggleLike(key) {
    if (likes.has(key)) likes.delete(key);
    else likes.add(key);
    store.set('vk-likes', [...likes]);
    const on = likes.has(key);
    feed.querySelectorAll(`[data-like="${CSS.escape(key)}"]`).forEach((b) => b.setAttribute('aria-pressed', on));
    const lc = $('#like-count');
    if (lc) lc.textContent = likes.size;
    return on;
  }

  feed.addEventListener('click', (e) => {
    const like = e.target.closest('[data-like]');
    if (like) return toggleLike(like.dataset.like);
    const bo = e.target.closest('[data-brand-open]');
    if (bo) return openBrand(byId.get(bo.dataset.brandOpen));
  });
  feed.addEventListener('dblclick', (e) => {
    const card = e.target.closest('.card');
    if (!card || !e.target.closest('.stage')) return;
    if (!likes.has(card.dataset.key)) toggleLike(card.dataset.key);
    card.classList.remove('pop');
    void card.offsetWidth;
    card.classList.add('pop');
  });

  document.addEventListener('keydown', (e) => {
    if (currentView() !== 'selaa' || !sheet.hidden || e.target.closest?.('select, input, textarea')) return;
    const down = ['ArrowDown', 'j', 'PageDown'].includes(e.key);
    const up = ['ArrowUp', 'k', 'PageUp'].includes(e.key);
    if (!down && !up) return;
    e.preventDefault();
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    feed.scrollBy({ top: (down ? 1 : -1) * feed.clientHeight, behavior: reduce ? 'auto' : 'smooth' });
  });

  // ---------- list ----------
  const SORTS = {
    name: (b) => b.name.toLowerCase(),
    cost: (b) => (b.ship.cost == null ? 999 : b.ship.cost),
    days: (b) => b.ship.days?.[1] ?? 999,
    price: (b) => minPrice(b),
  };

  function renderList() {
    const rows = brands.filter(brandVisible).sort((a, b) => {
      const ka = SORTS[state.sort.key](a);
      const kb = SORTS[state.sort.key](b);
      return (ka > kb ? 1 : ka < kb ? -1 : 0) * state.sort.dir;
    });
    const th = (key, label, cls = '') => {
      const active = state.sort.key === key;
      const aria = active ? (state.sort.dir === 1 ? 'ascending' : 'descending') : 'none';
      return `<th scope="col" class="${cls}" aria-sort="${aria}"><button type="button" data-sort="${key}">${label}${active ? sortIco(state.sort.dir) : ''}</button></th>`;
    };
    const body = rows
      .map((b) => {
        const open = state.open === b.id;
        const d = dayRange(b.ship.days);
        const row =
          `<tr class="row" data-row="${b.id}" tabindex="0" aria-expanded="${open}">` +
          `<td><span class="bname">${esc(b.name)}${nonEu(b) ? `<span class="cc" title="EU:n ulkopuolella">${b.country}</span>` : ''}</span>` +
          `<span class="sub">${esc(b.city ?? countryName(b.country))}</span></td>` +
          `<td class="num">${b.ship.cost == null ? '<span class="sub">kassalla</span>' : eur(b.ship.cost)}${b.ship.freeOver ? `<span class="sub">0 € yli ${nf.format(b.ship.freeOver)}</span>` : ''}</td>` +
          `<td class="num"><span class="days">${stitch(b.ship.speed)}${d ?? '–'}</span></td>` +
          `<td class="num">alk. ${eur(minPrice(b))}</td></tr>`;
        const detail = open
          ? `<tr class="open-detail"><td colspan="4"><div class="detail">${careLabel(b)}<div class="side">` +
            (b.style ? `<p class="style">${esc(b.style)}</p>` : '') +
            couponHTML(bestCoupon(b)) +
            `<div><a class="btn" href="${esc(b.url)}" target="_blank" rel="noopener">Avaa kauppa ${ext}</a></div></div></div></td></tr>`
          : '';
        return row + detail;
      })
      .join('');
    $('#list').innerHTML =
      `<table><thead><tr>${th('name', 'Merkki')}${th('cost', 'Posti', 'num')}${th('days', 'Toimitus', 'num')}${th('price', 'Hinta', 'num')}</tr></thead>` +
      `<tbody>${body || '<tr><td colspan="4">Ei kauppoja näillä suodattimilla.</td></tr>'}</tbody></table>` +
      `<p class="list-note">Postikulut ja toimitusajat Suomeen vakiotoimituksella, tarkistettu ${fiDate(D.checked)}. ` +
      `EU:n ulkopuolelta (merkitty maakoodilla) tilatessa maksetaan Suomen ALV 25,5 % ja 1.7.2026 alkaen 3 €:n tulli tuotelajia kohden. ` +
      `Osa kaupoista perii ne kassalla, osa jättää ne maksettavaksi perillä.</p>`;
  }

  const fiDate = (iso) => iso.split('-').reverse().map(Number).join('.');

  $('#list').addEventListener('click', (e) => {
    if (e.target.closest('a, [data-copy]')) return;
    const s = e.target.closest('[data-sort]');
    if (s) {
      const key = s.dataset.sort;
      state.sort = { key, dir: state.sort.key === key ? -state.sort.dir : 1 };
      return renderList();
    }
    const row = e.target.closest('[data-row]');
    if (row) {
      state.open = state.open === row.dataset.row ? null : row.dataset.row;
      renderList();
      $(`#list [data-row="${CSS.escape(row.dataset.row)}"]`)?.focus({ preventScroll: true });
    }
  });
  $('#list').addEventListener('keydown', (e) => {
    const row = e.target.closest('[data-row]');
    if (row && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      row.click();
    }
  });

  // ---------- views ----------
  const VIEWS = ['kartta', 'selaa', 'lista'];
  const currentView = () => (VIEWS.includes(location.hash.slice(1)) ? location.hash.slice(1) : 'kartta');

  function showView() {
    const v = currentView();
    document.body.dataset.view = v;
    for (const id of VIEWS) $(`#v-${id}`).hidden = id !== v;
    document.querySelectorAll('[data-nav]').forEach((a) => a.setAttribute('aria-current', a.dataset.nav === v ? 'page' : 'false'));
    if (!sheet.hidden && v !== 'kartta') closeSheet();
    if (v === 'kartta') requestAnimationFrame(fitData);
    if (v === 'selaa') requestAnimationFrame(updateCounter);
  }
  addEventListener('hashchange', showView);

  function renderAll(refit) {
    renderMap();
    renderFeed();
    renderList();
    if (refit && currentView() === 'kartta') fitData();
  }

  $('#meta').textContent = `${brands.length} merkkiä ja ${allProducts.length} vaatetta, hinnat 50–150 €. Tarkistettu ${fiDate(D.checked)}.`;
  renderFilters();
  renderAll(false);
  showView();
  let resizeTimer;
  addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => (currentView() === 'kartta' ? fitData() : renderMap()), 120);
  });
})();
