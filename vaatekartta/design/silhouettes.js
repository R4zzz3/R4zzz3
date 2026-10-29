/* Vaatekartta: flat-lay garment illustrations.
 * Plain browser script. Usage: el.innerHTML = window.garmentSVG('farkut', '#1c2433');
 * Types: farkut, housut, neuleet, paidat, t-paidat, collegit, takit, asusteet.
 * Every tone (seams, shadow, outline) is derived from the one product colour, so a
 * garment reads on both light and dark backgrounds. No ids or defs: safe to repeat.
 */
(function () {
  'use strict';

  var THREAD = '#d9a441';   // classic gold denim topstitch
  var METAL = '#b8925a';    // rivets and shank button
  var ECRU = [233, 228, 214]; // undyed weft, inside of denim
  var DEFAULTS = { farkut: '#22304d', housut: '#b49a6e', neuleet: '#d8cfbd', paidat: '#6b4a3a',
    't-paidat': '#e9e6df', collegit: '#8a9099', takit: '#1f2a3d', asusteet: '#5d6a3a' };

  /* ---------- colour ---------- */
  function rgb(c) {
    var m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(c || '').trim());
    if (!m) return null;
    var h = m[1].length === 3 ? m[1].replace(/(.)/g, '$1$1') : m[1];
    return [0, 2, 4].map(function (i) { return parseInt(h.substr(i, 2), 16); });
  }
  function hex(a) {
    return '#' + a.map(function (v) {
      return ('0' + Math.round(Math.max(0, Math.min(255, v))).toString(16)).slice(-2);
    }).join('');
  }
  function mix(a, b, t) { return a.map(function (v, i) { return v + (b[i] - v) * t; }); }
  function lum(a) {
    var c = a.map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }
  function tones(color, type) {
    var c = rgb(color) || rgb(DEFAULTS[type] || '#8a9099');
    var L = lum(c), dark = L < 0.09, K = [0, 0, 0], W = [255, 255, 255];
    return {
      base: hex(c),
      seam: hex(dark ? mix(c, W, 0.24) : mix(c, K, 0.3)),          // seams, ribs, stitching
      deep: hex(mix(c, K, dark ? 0.4 : 0.42)),                       // openings, pocket bags
      hi: hex(mix(c, W, dark ? 0.3 : 0.24)),                         // buttons, pressed creases
      line: hex(L > 0.3 ? mix(c, K, 0.5) : mix(c, W, dark ? 0.4 : 0.32)), // outer outline
      inside: hex(mix(c, ECRU, 0.62))                                // turned-up cuff
    };
  }

  /* ---------- drawing helpers ---------- */
  function attrs(stroke, w, dash, op) {
    return (stroke ? ' stroke="' + stroke + '" stroke-width="' + (w || 1.3) + '" stroke-linecap="round" stroke-linejoin="round"' : '') +
      (dash ? ' stroke-dasharray="' + dash + '"' : '') + (op ? ' opacity="' + op + '"' : '');
  }
  function fillp(d, fill, stroke, w, op) { return '<path d="' + d + '" fill="' + fill + '"' + attrs(stroke, w, null, op) + '/>'; }
  function line(d, stroke, w, dash, op) { return '<path d="' + d + '" fill="none"' + attrs(stroke, w, dash, op) + '/>'; }
  function dot(x, y, r, fill, stroke, w) { return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + fill + '"' + attrs(stroke, w) + '/>'; }
  function mirror(s) { return s + '<g transform="matrix(-1 0 0 1 200 0)">' + s + '</g>'; }
  function lerp(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; }
  function q(p0, p1, p2, t) { var u = 1 - t; return [u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]]; }
  function f(p) { return p[0].toFixed(1) + ' ' + p[1].toFixed(1); }
  /* rib lines between edge a-b and edge d-c (quad a,b,c,d) */
  function ribs(a, b, c, d, n, stroke, op) {
    var s = '';
    for (var i = 1; i < n; i++) { var t = i / n; s += 'M' + f(lerp(a, b, t)) + 'L' + f(lerp(d, c, t)); }
    return line(s, stroke, 0.9, null, op || 0.7);
  }
  /* ribbed band that follows two quadratic curves (necklines) */
  function curveRibs(inner, outer, n, stroke) {
    var s = '';
    for (var i = 1; i < n; i++) { var t = i / n; s += 'M' + f(q(inner[0], inner[1], inner[2], t)) + 'L' + f(q(outer[0], outer[1], outer[2], t)); }
    return line(s, stroke, 0.9, null, 0.7);
  }
  /* soft cast shadow + flat fill; the crisp outline is drawn last by outline() */
  function base(d, t) { return fillp(d, '#000', null, 0, 0.13).replace('<path', '<path transform="translate(3 5)"') + fillp(d, t.base); }
  function outline(d, t) { return line(d, t.line, 1.6); }
  function wrap(inner) {
    return '<svg class="garment" viewBox="0 0 200 240" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" preserveAspectRatio="xMidYMid meet">' + inner + '</svg>';
  }

  /* ---------- garments ---------- */
  var draw = {};

  /* raw denim, five-pocket, cuffed to show the selvedge ID */
  draw.farkut = function (t) {
    var D = 'M50 20H150C153 70 155 140 157 226H108L100 102L92 226H43C45 140 47 70 50 20Z';
    var side = fillp('M43.5 210H93L92 226H43Z', t.inside, t.seam, 1) +                       // turned-up cuff
      fillp('M44 210.5h4v15h-4.6Z', '#f2efe6') + line('M46.2 211V225', '#c8323c', 1.3) +       // selvedge ID
      line('M66 34C67 52 61 62 51 67', t.seam, 1.4) +                                        // scoop pocket
      line('M70 34C71 55 63 67 51.5 71.5', THREAD, 1, '3 2.4') +
      line('M93 92Q80 86 68 86M93 98Q81 94 70 96.5M94 104Q85 102 75 106', t.hi, 2, null, 0.35) + // whiskers
      dot(66.5, 35.5, 1.7, METAL) + dot(51.8, 67.5, 1.7, METAL);
    return wrap(base(D, t) + mirror(side) +
      line('M56 38H69V51', THREAD, 1, '2.6 2.2') +                                           // coin pocket
      line('M50.5 34H149.5', t.seam, 1.4) + line('M51 23.6H149M51 30.6H149', THREAD, 1, '3 2.4') +
      line('M100 34V100', t.seam, 1.2) + line('M111 35V80Q111 93 100 97', THREAD, 1, '3 2.4') + // fly + J-stitch
      mirror(fillp('M60 16.5h6v19h-6Z', t.base, t.seam, 1)) +                                  // belt loops
      dot(100, 27, 4, METAL, '#7d6236', 1) + outline(D, t));
  };

  /* chinos: tonal, slant pockets, pressed crease */
  draw.housut = function (t) {
    var D = 'M54 20H146C148 80 150 150 151 226H107L100 100L93 226H49C50 150 52 80 54 20Z';
    var side = line('M66 33L56 72', t.seam, 1.4) + line('M77 38L71 222', t.hi, 1.3, null, 0.75) +
      line('M49.4 214H93.8', t.seam, 1, '2.2 2', 0.8) + fillp('M63 16.5h6v18h-6Z', t.base, t.seam, 1);
    return wrap(base(D, t) + mirror(side) + line('M54.4 33H145.6', t.seam, 1.3) +
      line('M100 33V96', t.seam, 1.2) + line('M109 34V79Q109 89 100 93', t.seam, 1, '2.2 2') +
      dot(100, 26.5, 3.4, t.hi, t.seam, 1) + outline(D, t));
  };

  /* crewneck knit: ribbed collar, cuffs and hem, centre cable */
  draw.neuleet = function (t) {
    var D = 'M80 28Q100 42 120 28L146 38Q158 44 160 58L184 184L163 191L144 92L146 198L143 216H57L54 198L56 92L37 191L16 184L40 58Q42 44 54 38Z';
    var cuffQ = [[159.6, 173.2], [180.6, 166.4], [184, 184], [163, 191]];
    var cuff = fillp('M' + cuffQ.map(f).join('L') + 'Z', t.base, t.seam, 1) +
      ribs(cuffQ[0], cuffQ[1], cuffQ[2], cuffQ[3], 7, t.seam) + line('M144 92L150 125', t.seam, 1, null, 0.5);
    var cable = 'M93 58', cable2 = 'M107 58';
    for (var y = 58; y < 192; y += 22) {
      var a = (y - 58) / 22 % 2 ? 93 : 107, b = a === 93 ? 107 : 93;
      cable += 'C' + (200 - a) + ' ' + (y + 11) + ' ' + a + ' ' + (y + 11) + ' ' + a + ' ' + (y + 22);
      cable2 += 'C' + (200 - b) + ' ' + (y + 11) + ' ' + b + ' ' + (y + 11) + ' ' + b + ' ' + (y + 22);
    }
    return wrap(base(D, t) + fillp('M80 28Q100 20 120 28Q100 42 80 28Z', t.deep) +
      fillp('M75 29.9Q100 54 125 29.9L120 28Q100 42 80 28Z', t.base, t.seam, 1) +
      curveRibs([[80, 28], [100, 42], [120, 28]], [[75, 29.9], [100, 54], [125, 29.9]], 18, t.seam) +
      line(cable, t.seam, 2.2, null, 0.75) + line(cable2, t.hi, 2.2, null, 0.6) +
      line('M85 56V196M115 56V196', t.seam, 1, null, 0.55) +
      fillp('M54 198H146L143 216H57Z', t.base, t.seam, 1) + ribs([54, 198], [146, 198], [143, 216], [57, 216], 26, t.seam) +
      mirror(cuff) + outline(D, t));
  };

  /* crewneck sweatshirt: raglan seams, V-insert, ribbed trims */
  draw.collegit = function (t) {
    var D = 'M80 28Q100 42 120 28L150 42Q160 48 162 60L184 182L164 190L146 96L147 200L145 216H55L53 200L54 96L36 190L16 182L38 60Q40 48 50 42Z';
    var cuffQ = [[161.6, 175.6], [181.5, 168.5], [184, 182], [164, 190]];
    var side = line('M80 29.5L54 96', t.seam, 1.3) + line('M84 31L57.5 97', t.seam, 1, '2 2', 0.8) +
      fillp('M' + cuffQ.map(f).join('L') + 'Z', t.base, t.seam, 1) + ribs(cuffQ[0], cuffQ[1], cuffQ[2], cuffQ[3], 6, t.seam);
    return wrap(base(D, t) + fillp('M80 28Q100 20 120 28Q100 42 80 28Z', t.deep) + mirror(side) +
      fillp('M76 29.5Q100 51 124 29.5L120 28Q100 42 80 28Z', t.base, t.seam, 1) +
      curveRibs([[80, 28], [100, 42], [120, 28]], [[76, 29.5], [100, 51], [124, 29.5]], 16, t.seam) +
      fillp('M93.5 39.6L106.5 39.6L100 56Z', t.base, t.seam, 1) + line('M97 40.5L100 49M103 40.5L100 49', t.seam, 0.9, null, 0.7) +
      fillp('M53 202H147L145 216H55Z', t.base, t.seam, 1) + ribs([53, 202], [147, 202], [145, 216], [55, 216], 24, t.seam) +
      outline(D, t));
  };

  /* tee: rib collar, coverstitched hems */
  draw['t-paidat'] = function (t) {
    var D = 'M82 28Q100 42 118 28L146 36L182 78L162 100L144 86L145 214H55L56 86L38 100L18 78L54 36Z';
    var side = line('M178.3 74.6L158.4 96.3', t.seam, 1, '2.4 2') + line('M144 86L145 120', t.seam, 1, null, 0.4);
    return wrap(base(D, t) + fillp('M82 28Q100 21 118 28Q100 42 82 28Z', t.deep) +
      fillp('M78.5 29.6Q100 49 121.5 29.6L118 28Q100 42 82 28Z', t.base, t.seam, 1) +
      line('M77 31.5Q100 53 123 31.5', t.seam, 1, '2.2 2') +
      mirror(side) + line('M55.2 206H144.8', t.seam, 1, '2.4 2') + outline(D, t));
  };

  /* overshirt: point collar, placket, flap chest pockets, cuffs */
  draw.paidat = function (t) {
    var D = 'M84 26H116L148 38Q160 44 162 58L184 188L163 195L146 96L147 222H53L54 96L37 195L16 188L38 58Q40 44 52 38Z';
    var collar = 'M84 26L100 43L87 58Q79 42 84 26Z';
    var side = fillp('M62 74H88V104L75 109L62 104Z', t.base, t.seam, 1.1) +
      line('M65 78H85V102L75 105.5L65 102', t.seam, 0.9, '2 1.8', 0.7) +
      fillp('M61 69H89V80L75 85L61 80Z', t.base, t.seam, 1.1) + dot(75, 79.5, 2.4, t.hi, t.seam, 0.8) +
      fillp('M160.3 179.2L181.4 172.4L184 188L163 195Z', t.base, t.seam, 1) + dot(172.6, 185.4, 1.9, t.hi, t.seam, 0.7) +
      fillp(collar, t.base, t.line, 1.3) + line('M86 31L97 43L88.5 53.5', t.seam, 0.9, '2 1.8', 0.8);
    var buttons = '';
    [66, 96, 126, 156, 188].forEach(function (y) { buttons += dot(100, y, 2.9, t.hi, t.seam, 0.9); });
    return wrap(base(D, t) + fillp('M84 26Q100 18 116 26L113 32Q100 27 87 32Z', t.deep) +
      line('M95 43V222M105 43V222', t.seam, 1.1) + buttons +
      line('M53.2 215H146.8', t.seam, 1, '2.2 2', 0.8) + mirror(side) + outline(D, t));
  };

  /* peacoat: double-breasted, wide notch lapels, slash pockets */
  draw.takit = function (t) {
    var D = 'M84 24H116L152 36Q165 42 167 58L187 206L165 212L151 100L155 230H45L49 100L35 212L13 206L33 58Q35 42 48 36Z';
    var side = fillp('M88 26L55 42L67 52L48 63L100 102Z', t.base, t.line, 1.3) +
      line('M67 52L83 39', t.seam, 1.1) + line('M85 31L60 43.5M63 59L95 95.5', t.seam, 0.9, '2 1.8', 0.6) +
      line('M51 65L98 105', t.deep, 2.5, null, 0.35) +                                     // lapel roll shadow
      fillp('M57 152L63.5 150L70 196L63.5 198Z', t.deep, t.seam, 0.9) + line('M163 196L184.8 190', t.seam, 1.2);
    var buttons = '';
    [118, 148, 178].forEach(function (y) {
      [78, 122].forEach(function (x) { buttons += dot(x, y, 5, t.deep, t.hi, 1.2) + dot(x, y, 2.3, 'none', t.hi, 0.7); });
    });
    return wrap(base(D, t) + fillp('M84 24Q100 16 116 24L114 31Q100 26 86 31Z', t.deep) +
      fillp('M88 26H112L100 100Z', t.deep) + line('M100 102L105 230', t.seam, 1.4) +
      mirror(side) + buttons + outline(D, t));
  };

  /* accessories: ribbed fisherman beanie with a woven label */
  draw.asusteet = function (t) {
    var crown = 'M44 146C44 92 66 58 100 58C134 58 156 92 156 146Z';
    var cuff = 'M39 138H161Q166 138 166 143V189Q166 196 159 196H41Q34 196 34 189V143Q34 138 39 138Z';
    var r = '', x;
    for (x = 52; x <= 148; x += 8) r += 'M' + x + ' 140Q' + (100 + (x - 100) * 1.02).toFixed(1) + ' 86 ' + (100 + (x - 100) * 0.18).toFixed(1) + ' 62';
    var cr = '';
    for (x = 40; x <= 160; x += 5) cr += 'M' + x + ' 141V193';
    return wrap(base(crown, t) + base(cuff, t) + line(r, t.seam, 1, null, 0.6) + outline(crown, t) +
      fillp(cuff, t.base) + line(cr, t.seam, 0.9, null, 0.65) + line('M35 143.5H165', t.seam, 1.2) +
      fillp('M88 156h24v16H88Z', '#f3f1ea', t.line, 0.8) + line('M92 162H108M94 166.5H106', '#9a948a', 1, null, 0.9) +
      outline(cuff, t));
  };

  window.garmentSVG = function (type, color) {
    var key = draw[type] ? type : 't-paidat';
    return draw[key](tones(color, key));
  };
  window.garmentSVG.types = Object.keys(draw);
})();
