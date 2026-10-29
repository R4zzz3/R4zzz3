(() => {
  const D = window.VK;
  const SVGNS = 'http://www.w3.org/2000/svg';
  const $ = (sel, el = document) => el.querySelector(sel);

  const COUNTRY = {
    SE: 'Ruotsi', DK: 'Tanska', NO: 'Norja', FI: 'Suomi', IS: 'Islanti', FR: 'Ranska', BE: 'Belgia',
    NL: 'Alankomaat', LU: 'Luxemburg', DE: 'Saksa', AT: 'Itävalta', CH: 'Sveitsi', IT: 'Italia',
    ES: 'Espanja', PT: 'Portugali', PL: 'Puola', CZ: 'Tšekki', SK: 'Slovakia', HU: 'Unkari',
    EE: 'Viro', LV: 'Latvia', LT: 'Liettua', GB: 'Iso-Britannia', UK: 'Iso-Britannia', IE: 'Irlanti',
    GR: 'Kreikka', HR: 'Kroatia', SI: 'Slovenia', RO: 'Romania', BG: 'Bulgaria', UA: 'Ukraina',
  };
  const TYPE = {
    farkut: 'Farkut', housut: 'Housut', neuleet: 'Neuleet', paidat: 'Paidat', 't-paidat': 'T-paidat',
    collegit: 'Collegit', takit: 'Takit', asusteet: 'Asusteet',
  };
  const VAT = {
    eu: null,
    ioss: 'EU:n ulkopuolelta. ALV peritään kassalla, perillä ei lisämaksuja.',
    ddp: 'EU:n ulkopuolelta. Tullit ja ALV maksetaan kassalla.',
    buyer: 'EU:n ulkopuolelta. ALV 25,5 % ja Postin käsittelymaksu maksetaan perillä.',
  };
  const SPEED = { fast: '1–4 pv', mid: '5–7 pv', slow: 'yli 7 pv', unknown: 'ei tietoa' };

  const brands = D.brands;
  const byId = new Map(brands.map((b) => [b.id, b]));
  const allProducts = brands.flatMap((b) => b.products.map((p, i) => ({ ...p, brand: b, key: `${b.id}:${i}` })));

  // ---------- state ----------
  const state = { type: 'all', euOnly: false, likedOnly: false, sort: { key: 'name', dir: 1 } };
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
        /* storage unavailable: likes live for this visit only */
      }
    },
  };
  const likes = new Set(store.get('vk-likes', []));

  // ---------- formatting ----------
  const nf = new Intl.NumberFormat('fi-FI', { maximumFractionDigits: 2 });
  const eur = (n) => (n == null ? '–' : n === 0 ? '0 €' : `${nf.format(n)} €`);
  const days = (d) => (!d ? 'ei tietoa' : d[0] === d[1] ? `${d[0]} pv` : `${d[0]}–${d[1]} pv`);
  const country = (c) => COUNTRY[c] ?? c;
  const esc = (s) =>
    String(s ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
  const shipLine = (b) => {
    const cost = b.ship.cost === 0 ? 'ilmainen toimitus' : b.ship.cost == null ? 'postikulut ei tiedossa' : eur(b.ship.cost);
    return `${days(b.ship.days)} · ${cost}`;
  };
  const freeLine = (b) => (b.ship.freeOver ? `ilmainen yli ${eur(b.ship.freeOver)}` : '');
  const bestCoupon = (b) => b.coupons[0] ?? null;
  const priceRange = (b) => {
    const ps = b.products.map((p) => p.price);
    const lo = Math.min(...ps);
    const hi = Math.max(...ps);
    return lo === hi ? eur(lo) : `${lo}–${hi} €`;
  };

  // ---------- filters ----------
  const brandVisible = (b) => (state.type === 'all' || b.tags.includes(state.type)) && (!state.euOnly || b.ship.vat === 'eu');
  const productVisible = (p) =>
    (state.type === 'all' || p.type === state.type) &&
    (!state.euOnly || p.brand.ship.vat === 'eu') &&
    (!state.likedOnly || likes.has(p.key));

  function renderFilters() {
    const types = Object.keys(TYPE).filter((t) => brands.some((b) => b.tags.includes(t)));
    const chips = [['all', 'Kaikki'], ...types.map((t) => [t, TYPE[t]])]
      .map(
        ([v, label]) =>
          `<button type="button" class="chip" data-type="${v}" aria-pressed="${state.type === v}">${label}</button>`
      )
      .join('');
    $('#filters').innerHTML =
      `<div class="chips" role="group" aria-label="Tuotetyyppi">${chips}</div>` +
      `<div class="toggles">` +
      `<button type="button" class="chip chip-toggle" data-toggle="euOnly" aria-pressed="${state.euOnly}">Vain EU</button>` +
      `<button type="button" class="chip chip-toggle feed-only" data-toggle="likedOnly" aria-pressed="${state.likedOnly}">` +
      `${heartIcon()}<span>Tykätyt</span> <span class="count" id="like-count">${likes.size}</span></button>` +
      `</div>`;
  }

  $('#filters').addEventListener('click', (e) => {
    const chip = e.target.closest('button');
    if (!chip) return;
    if (chip.dataset.type) state.type = chip.dataset.type;
    if (chip.dataset.toggle) state[chip.dataset.toggle] = !state[chip.dataset.toggle];
    renderFilters();
    renderAll();
  });

  // ---------- icons ----------
  function heartIcon(filled = false) {
    return `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-9.3-9.4C1.4 7.6 3.6 4 7.2 4c2 0 3.6 1.1 4.8 2.8C13.2 5.1 14.8 4 16.8 4c3.6 0 5.8 3.6 4.5 7.1-1.8 4.8-9.3 9.4-9.3 9.4z" ${filled ? 'class="fill"' : ''}/></svg>`;
  }
  const arrowIcon = `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg>`;
  const pinIcon = `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/></svg>`;

  // ---------- map ----------
  const svg = $('#map');
  const routesG = $('#routes');
  const dotsG = $('#dots');
  const [VW, VH] = D.view;
  const dest = D.dest;
  let vb = [0, 0, VW, VH];

  function clusters() {
    const groups = new Map();
    for (const b of brands) {
      if (!b.ship.xy || !brandVisible(b)) continue;
      const key = `${Math.round(b.ship.xy[0] / 8)}:${Math.round(b.ship.xy[1] / 8)}`;
      if (!groups.has(key)) groups.set(key, { xy: b.ship.xy, brands: [] });
      groups.get(key).brands.push(b);
    }
    return [...groups.values()];
  }

  const SPEED_RANK = { fast: 0, mid: 1, slow: 2, unknown: 3 };
  function routePath([x1, y1], [x2, y2]) {
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy) || 1;
    const bend = Math.min(80, len * 0.18);
    return `M${x1},${y1} Q${mx + (dy / len) * bend},${my - (dx / len) * bend} ${x2},${y2}`;
  }

  function renderMap() {
    const cs = clusters();
    const k = vb[2] / VW;
    routesG.innerHTML = '';
    dotsG.innerHTML = '';
    // draw slow routes first so fast ones sit on top
    const ordered = cs
      .map((c) => ({ ...c, speed: c.brands.map((b) => b.ship.speed).sort((a, b) => SPEED_RANK[a] - SPEED_RANK[b])[0] }))
      .sort((a, b) => SPEED_RANK[b.speed] - SPEED_RANK[a.speed]);
    for (const c of ordered) {
      const path = document.createElementNS(SVGNS, 'path');
      path.setAttribute('d', routePath(c.xy, dest));
      path.setAttribute('class', `route s-${c.speed}`);
      routesG.appendChild(path);
    }
    for (const c of ordered) {
      const g = document.createElementNS(SVGNS, 'g');
      g.setAttribute('class', `dot s-${c.speed}`);
      g.setAttribute('transform', `translate(${c.xy[0]},${c.xy[1]}) scale(${k})`);
      g.setAttribute('tabindex', '0');
      g.setAttribute('role', 'button');
      const names = c.brands.map((b) => b.name).join(', ');
      g.setAttribute('aria-label', `${names}: ${c.brands[0].city ?? ''} ${country(c.brands[0].country)}`);
      const n = c.brands.length;
      g.innerHTML =
        `<circle class="hit" r="16"/><circle class="pin" r="${n > 1 ? 9 : 6}"/>` +
        (n > 1 ? `<text class="n" dy="3.5">${n}</text>` : '');
      g.addEventListener('click', () => openCluster(c.brands));
      g.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openCluster(c.brands);
        }
      });
      dotsG.appendChild(g);
    }
    const home = $('#dest');
    home.setAttribute('transform', `translate(${dest[0]},${dest[1]}) scale(${k})`);
    $('#map-count').textContent = `${cs.reduce((n, c) => n + c.brands.length, 0)} kauppaa`;
  }

  function setViewBox(next) {
    const minW = VW / 8;
    let [x, y, w, h] = next;
    if (w < minW) {
      const s = minW / w;
      x -= ((s - 1) * w) / 2;
      y -= ((s - 1) * h) / 2;
      w = minW;
      h *= s;
    }
    if (w > VW * 1.2) return;
    vb = [x, y, w, h];
    svg.setAttribute('viewBox', vb.join(' '));
    renderMap();
  }

  function fitTo(points, pad = 60) {
    const xs = points.map((p) => p[0]);
    const ys = points.map((p) => p[1]);
    let x0 = Math.min(...xs) - pad;
    let y0 = Math.min(...ys) - pad;
    let w = Math.max(...xs) + pad - x0;
    let h = Math.max(...ys) + pad - y0;
    const box = svg.getBoundingClientRect();
    const aspect = box.width && box.height ? box.width / box.height : VW / VH;
    if (w / h > aspect) {
      const nh = w / aspect;
      y0 -= (nh - h) / 2;
      h = nh;
    } else {
      const nw = h * aspect;
      x0 -= (nw - w) / 2;
      w = nw;
    }
    setViewBox([x0, y0, w, h]);
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
    const s = Math.max(vb[2] / r.width, vb[3] / r.height);
    // preserveAspectRatio xMidYMid meet: content is centred inside the box
    const offX = (r.width - vb[2] / s) / 2;
    const offY = (r.height - vb[3] / s) / 2;
    return [vb[0] + (clientX - r.left - offX) * s, vb[1] + (clientY - r.top - offY) * s];
  }

  svg.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault();
      const [mx, my] = clientToMap(e.clientX, e.clientY);
      zoom(e.deltaY > 0 ? 1.18 : 1 / 1.18, mx, my);
    },
    { passive: false }
  );

  const pointers = new Map();
  let pinchStart = null;
  let dragged = false;
  svg.addEventListener('pointerdown', (e) => {
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    dragged = false;
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinchStart = { dist: Math.hypot(a.x - b.x, a.y - b.y), vb: [...vb] };
    }
  });
  svg.addEventListener('pointermove', (e) => {
    const prev = pointers.get(e.pointerId);
    if (!prev) return;
    const cur = { x: e.clientX, y: e.clientY };
    pointers.set(e.pointerId, cur);
    const r = svg.getBoundingClientRect();
    const s = Math.max(vb[2] / r.width, vb[3] / r.height);
    if (pointers.size === 1) {
      const dx = cur.x - prev.x;
      const dy = cur.y - prev.y;
      if (Math.abs(dx) + Math.abs(dy) > 2) {
        dragged = true;
        svg.setPointerCapture?.(e.pointerId);
      }
      if (dragged) setViewBox([vb[0] - dx * s, vb[1] - dy * s, vb[2], vb[3]]);
    } else if (pointers.size === 2 && pinchStart) {
      dragged = true;
      const [a, b] = [...pointers.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const f = pinchStart.dist / (dist || 1);
      const [x, y, w, h] = pinchStart.vb;
      const cx = x + w / 2;
      const cy = y + h / 2;
      setViewBox([cx - (w * f) / 2, cy - (h * f) / 2, w * f, h * f]);
    }
  });
  const endPointer = (e) => {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinchStart = null;
  };
  svg.addEventListener('pointerup', endPointer);
  svg.addEventListener('pointercancel', endPointer);
  svg.addEventListener(
    'click',
    (e) => {
      if (dragged) {
        e.stopPropagation();
        dragged = false;
      }
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
    lastFocus = document.activeElement;
    sheetBody.innerHTML = html;
    sheet.hidden = false;
    sheetBody.scrollTop = 0;
    $('#sheet-close').focus({ preventScroll: true });
  }
  function closeSheet() {
    sheet.hidden = true;
    lastFocus?.focus?.({ preventScroll: true });
  }
  $('#sheet-close').addEventListener('click', closeSheet);
  sheet.addEventListener('click', (e) => {
    if (e.target === sheet) closeSheet();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !sheet.hidden) closeSheet();
  });

  function couponHTML(c) {
    if (!c) return '';
    const code = c.code
      ? `<button type="button" class="code" data-copy="${esc(c.code)}" title="Kopioi koodi">${esc(c.code)}</button>`
      : '';
    return `<div class="coupon"><span class="deal">${esc(c.deal)}</span>${code}</div>`;
  }

  function brandHTML(b) {
    const vat = VAT[b.ship.vat];
    const rows = [
      ['Postikulut', `${b.ship.cost == null ? 'ei tiedossa' : eur(b.ship.cost)}${b.ship.freeOver ? ` · ilmainen yli ${eur(b.ship.freeOver)}` : ''}`],
      ['Toimitus', `${days(b.ship.days)}${b.ship.from ? ` · ${esc(b.ship.from)}` : ''}`],
      b.ship.returns ? ['Palautus', esc(b.ship.returns)] : null,
    ].filter(Boolean);
    const products = b.products
      .map(
        (p, i) =>
          `<li><button type="button" class="pline" data-goto="${b.id}:${i}">` +
          `<span class="swatch" style="--c:${p.color}"></span><span class="pname">${esc(p.name)}</span>` +
          `<span class="pprice">${eur(p.price)}</span></button></li>`
      )
      .join('');
    return (
      `<header class="bh"><p class="eyebrow">${esc(b.city ? `${b.city}, ` : '')}${country(b.country)}${b.parent ? ` · ${esc(b.parent)}` : ''}</p>` +
      `<h2 id="sheet-title">${esc(b.name)}</h2><p class="style">${esc(b.style)}</p></header>` +
      `<dl class="label">${rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>` +
      (vat ? `<p class="vat">${vat}</p>` : '') +
      couponHTML(bestCoupon(b)) +
      `<ul class="plist">${products}</ul>` +
      `<a class="shop" href="${esc(b.url)}" target="_blank" rel="noopener">Kauppaan ${arrowIcon}</a>`
    );
  }

  function openBrand(b) {
    openSheet(brandHTML(b));
  }

  function openCluster(list) {
    if (list.length === 1) return openBrand(list[0]);
    const items = list
      .map(
        (b) =>
          `<li><button type="button" class="bline" data-brand="${b.id}"><span class="bname">${esc(b.name)}</span>` +
          `<span class="bmeta">${shipLine(b)}</span></button></li>`
      )
      .join('');
    openSheet(
      `<header class="bh"><p class="eyebrow">${esc(list[0].city ?? '')}, ${country(list[0].country)}</p>` +
        `<h2 id="sheet-title">${list.length} kauppaa</h2></header><ul class="blist">${items}</ul>`
    );
  }

  sheetBody.addEventListener('click', (e) => {
    const brandBtn = e.target.closest('[data-brand]');
    if (brandBtn) return openBrand(byId.get(brandBtn.dataset.brand));
    const go = e.target.closest('[data-goto]');
    if (go) {
      closeSheet();
      state.likedOnly = false;
      state.type = 'all';
      renderFilters();
      renderAll();
      location.hash = 'selaa';
      requestAnimationFrame(() => scrollFeedTo(go.dataset.goto));
    }
  });

  // copy buttons work anywhere on the page
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-copy]');
    if (!btn) return;
    const text = btn.dataset.copy;
    try {
      await navigator.clipboard.writeText(text);
      toast(`Koodi ${text} kopioitu`);
    } catch {
      const range = document.createRange();
      range.selectNodeContents(btn);
      const sel = getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      toast('Koodi valittu, kopioi se');
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

  // Interleave brands so the same shop never shows twice in a row; signature pieces lead.
  function feedOrder() {
    let seed = 20261029;
    const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
    const queues = brands.map((b) =>
      allProducts.filter((p) => p.brand === b).sort((a, c) => Number(c.sig) - Number(a.sig))
    );
    for (let i = queues.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [queues[i], queues[j]] = [queues[j], queues[i]];
    }
    const out = [];
    while (queues.some((q) => q.length)) for (const q of queues) if (q.length) out.push(q.shift());
    return out;
  }
  const ordered = feedOrder();

  function art(p) {
    const ill = window.garmentSVG ? window.garmentSVG(p.type, p.color) : '';
    const img = p.image
      ? `<img src="${esc(p.image)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()" onload="this.parentNode.classList.add('has-img')">`
      : '';
    return `<div class="art" style="--c:${p.color}"><div class="ill">${ill}</div>${img}</div>`;
  }

  function cardHTML(p) {
    const b = p.brand;
    const liked = likes.has(p.key);
    const c = bestCoupon(b);
    return (
      `<article class="card" data-key="${p.key}" aria-label="${esc(b.name)}: ${esc(p.name)}, ${eur(p.price)}">` +
      art(p) +
      `<span class="tag" aria-hidden="true"><span>${p.price}</span>€</span>` +
      `<div class="meta">` +
      `<p class="eyebrow">${esc(b.name)} · ${country(b.country)}</p>` +
      `<h3>${esc(p.name)}</h3>` +
      (p.why ? `<p class="why">${esc(p.why)}</p>` : '') +
      `<p class="ship">Suomeen ${shipLine(b)}${b.ship.vat !== 'eu' ? ' · <span class="warn">EU:n ulkop.</span>' : ''}</p>` +
      (c ? `<p class="cp">${esc(c.deal)}${c.code ? ` <button type="button" class="code" data-copy="${esc(c.code)}">${esc(c.code)}</button>` : ''}</p>` : '') +
      `</div>` +
      `<div class="rail">` +
      `<button type="button" class="act like" data-like="${p.key}" aria-pressed="${liked}" aria-label="Tykkää">${heartIcon(true)}</button>` +
      `<button type="button" class="act" data-brand-open="${b.id}" aria-label="${esc(b.name)}: toimitustiedot">${pinIcon}</button>` +
      `<a class="act shop-act" href="${esc(p.url)}" target="_blank" rel="noopener" aria-label="Avaa tuote kaupassa">${arrowIcon}</a>` +
      `</div></article>`
    );
  }

  function renderFeed() {
    const items = ordered.filter(productVisible);
    feed.innerHTML = items.length
      ? items.map(cardHTML).join('')
      : `<div class="empty"><p>${state.likedOnly ? 'Et ole vielä tykännyt mistään. Napauta sydäntä tai kaksoisnapauta kuvaa.' : 'Ei tuotteita näillä suodattimilla.'}</p></div>`;
    feed.scrollTop = 0;
    updateCounter();
  }

  function scrollFeedTo(key) {
    const el = feed.querySelector(`[data-key="${CSS.escape(key)}"]`);
    if (el) feed.scrollTo({ top: el.offsetTop, behavior: 'instant' in window ? 'instant' : 'auto' });
  }

  function updateCounter() {
    const cards = feed.querySelectorAll('.card');
    const i = Math.round(feed.scrollTop / (feed.clientHeight || 1));
    $('#feed-count').textContent = cards.length ? `${Math.min(i + 1, cards.length)} / ${cards.length}` : '';
  }
  feed.addEventListener('scroll', () => requestAnimationFrame(updateCounter), { passive: true });

  function toggleLike(key, btn) {
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
    if (like) return toggleLike(like.dataset.like, like);
    const bo = e.target.closest('[data-brand-open]');
    if (bo) return openBrand(byId.get(bo.dataset.brandOpen));
  });
  feed.addEventListener('dblclick', (e) => {
    const card = e.target.closest('.card');
    if (!card || !e.target.closest('.art')) return;
    const key = card.dataset.key;
    if (!likes.has(key)) toggleLike(key);
    card.classList.remove('pop');
    void card.offsetWidth;
    card.classList.add('pop');
  });

  document.addEventListener('keydown', (e) => {
    if (currentView() !== 'selaa' || !sheet.hidden) return;
    if (['ArrowDown', 'j', 'PageDown'].includes(e.key) || ['ArrowUp', 'k', 'PageUp'].includes(e.key)) {
      if (e.target.closest('input, textarea')) return;
      e.preventDefault();
      const dir = ['ArrowDown', 'j', 'PageDown'].includes(e.key) ? 1 : -1;
      feed.scrollBy({ top: dir * feed.clientHeight, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    }
  });

  // ---------- list ----------
  const SORTS = {
    name: (b) => b.name.toLowerCase(),
    price: (b) => Math.min(...b.products.map((p) => p.price)),
    cost: (b) => b.ship.cost ?? 999,
    days: (b) => b.ship.days?.[1] ?? 999,
  };

  function renderList() {
    const rows = brands
      .filter(brandVisible)
      .sort((a, b) => {
        const ka = SORTS[state.sort.key](a);
        const kb = SORTS[state.sort.key](b);
        return (ka > kb ? 1 : ka < kb ? -1 : 0) * state.sort.dir;
      });
    const th = (key, label, cls = '') => {
      const active = state.sort.key === key;
      const aria = active ? (state.sort.dir === 1 ? 'ascending' : 'descending') : 'none';
      return `<th scope="col" class="${cls}" aria-sort="${aria}"><button type="button" data-sort="${key}">${label}<span class="dir" aria-hidden="true">${active ? (state.sort.dir === 1 ? '↑' : '↓') : ''}</span></button></th>`;
    };
    $('#list').innerHTML =
      `<table><thead><tr>${th('name', 'Merkki')}${th('price', 'Hinnat', 'num')}${th('cost', 'Postikulut', 'num')}${th('days', 'Toimitus', 'num')}<th scope="col" class="cp-col">Etu</th></tr></thead><tbody>` +
      rows
        .map((b) => {
          const c = bestCoupon(b);
          return (
            `<tr data-row="${b.id}" tabindex="0">` +
            `<td><span class="bname">${esc(b.name)}</span><span class="sub">${country(b.country)}${b.ship.vat !== 'eu' ? ' · <span class="warn">EU:n ulkop.</span>' : ''}</span></td>` +
            `<td class="num">${priceRange(b)}</td>` +
            `<td class="num">${eur(b.ship.cost)}<span class="sub">${freeLine(b)}</span></td>` +
            `<td class="num">${days(b.ship.days)}</td>` +
            `<td class="cp-col">${c ? esc(c.deal) : '–'}</td></tr>`
          );
        })
        .join('') +
      `</tbody></table>`;
  }

  $('#list').addEventListener('click', (e) => {
    const s = e.target.closest('[data-sort]');
    if (s) {
      const key = s.dataset.sort;
      state.sort = { key, dir: state.sort.key === key ? -state.sort.dir : 1 };
      return renderList();
    }
    const row = e.target.closest('[data-row]');
    if (row) openBrand(byId.get(row.dataset.row));
  });
  $('#list').addEventListener('keydown', (e) => {
    const row = e.target.closest('[data-row]');
    if (row && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      openBrand(byId.get(row.dataset.row));
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
    if (v === 'kartta') requestAnimationFrame(fitData);
    if (v === 'selaa') updateCounter();
  }
  addEventListener('hashchange', showView);

  function renderAll() {
    renderMap();
    renderFeed();
    renderList();
    if (currentView() === 'kartta') fitData();
  }

  $('#meta').textContent = `${brands.length} merkkiä · ${allProducts.length} vaatetta · tarkistettu ${D.checked.split('-').reverse().map(Number).join('.')}`;
  renderFilters();
  renderMap();
  renderFeed();
  renderList();
  showView();
  addEventListener('resize', () => {
    if (currentView() === 'kartta') fitData();
  });
})();
