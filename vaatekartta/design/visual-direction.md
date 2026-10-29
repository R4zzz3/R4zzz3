# Vaatekartta: visual direction

**Idea: raw indigo and the care label.** The dark theme is unwashed raw denim; the light theme is the same cloth
bleached to chambray. Shipping info, the thing this page exists for, is always shown as the **care label** sewn
into each brand. Everything else stays quiet: no decoration, no shadows except the one bottom sheet, sentence case,
no emoji, no `·`-joined meta strings, no `→` on links, no all-caps labels.

## Palette (tokens on `:root`; dark via the media query + `[data-theme="dark"]`)

| token | light | dark | use |
|---|---|---|---|
| `--bg` | `#DCE3EC` | `#121B2D` | page, map sea, `body` background |
| `--surface` | `#F4F6F9` | `#1A2540` | sheet, panels, table, map land |
| `--surface-2` | `#E8EDF3` | `#22304F` | table header, chip hover, pressed |
| `--ink` | `#15203A` | `#E9EDF4` | text, selected chip fill, main button (12.5 / 14.7 : 1 on bg) |
| `--ink-2` | `#48546D` | `#A4B0C6` | secondary text (≥ 5.9 : 1 on every surface) |
| `--line` | `#B4C0D0` | `#34446A` | hairlines, country borders, chip outline |
| `--label` / `--label-ink` | `#FFFFFF` / `#15203A` | `#D9DEE7` / `#15203A` | care label tape stays pale in both themes (16.2 / 12.0 : 1) |
| `--focus` | `#2449C9` | `#8FB0FF` | 2px focus ring, 2px offset, on everything focusable |
| `--fast` `--mid` `--slow` | `#1F6B45` `#8F5B00` `#A3263A` | `#5FC48C` `#E3B04B` `#F07A8A` | delivery scale; `--like` = `--slow` |

Feed stage tint: `color-mix(in oklab, var(--surface) 86%, <product colour>)`, garment from `garmentSVG(type, colour)`.

## Delivery-time scale: stitches, not just hues

Tier from `ship.days[1]` (worst case). Each tier differs in hue, stroke pattern and weight, so it survives colour
blindness and greyscale. The patterns are stitches: lockstitch, running stitch, tack.

| tier | stroke | contrast vs sea / land (light, dark) |
|---|---|---|
| `1–3 pv` `--fast` (spruce) | solid, 2.5px | 5.0/6.0, 8.0/6.8 |
| `4–6 pv` `--mid` (mustard) | dashed `7 4`, 2px | 4.4/5.3, 8.7/7.4 |
| `7+ pv` `--slow` (lingonberry) | dotted `0.1 4.5`, round cap, 2px | 5.6/6.7, 6.4/5.5 |

The same 24px stitch swatch appears in the map legend, on the care label's delivery line and in the list.
The label is pale in both themes, so `.care-label` pins the light tier values (`--fast:#1F6B45` etc.) in dark mode too.

## Type

`https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..800&family=Spline+Sans+Mono:wght@500&display=swap`

One variable family in three widths; width changes the role, like a leather patch vs a woven label.
- **Display**: Archivo `font-stretch:125%` 750, tracking −0.01em: brand and product names, prices.
- **Body**: Archivo 100% 400/600. **Label**: Archivo 75% 500: care label text only.
- **Mono**: Spline Sans Mono 500: coupon codes only (text the user types at checkout).
- Fallbacks: `Archivo, "Helvetica Neue", Arial, sans-serif`; label adds `"Arial Narrow"` first; mono `ui-monospace, Menlo, monospace`.
- Scale (1.25, rem): 0.8125, 0.875, 1, 1.25, 1.5625, `clamp(1.5625rem, 4vw, 2.44rem)` (feed product name).
  Body line-height 1.45, display 1.1. `font-variant-numeric: tabular-nums` on prices, costs, days.

## App shell

```
phone (<900px)                         desktop (>=900px)
+----------------------+               +------------------------------------------------+
| Vaatekartta       ◐  |  48px bar,    | Vaatekartta  Kartta Selaa Lista            ◐   |
|                      |  hidden in    +------------------------------------+-----------+
|   view pane          |  Selaa        |  map / feed / table                | brand     |
|   height:100%        |               |  (left-aligned on the gutter)      | panel 360 |
+----------------------+               |                                    | (Kartta)  |
| Kartta  Selaa  Lista |  56px + safe  +------------------------------------+-----------+
+----------------------+  area, fixed
```
Tabs: 20px line icon + word; active = `--ink` + a 2px dashed `4 3` "stitched" underline. Desktop Selaa: each snap
card splits into stage (left 55%) and text column (max 26rem). Lista: max 60rem, left-aligned.
Radius by role: care label 2px, buttons 8px, chips pill, sheet 12px top corners only.

## Components

- **Map marker + route**: origin dot r 5px, `--surface` fill, 2px ring in tier colour, invisible 22px-radius hit
  target; shared cities merge into one dot with a count. Route = quadratic arc to Helsinki bowing north (control
  offset 18% of length), `vector-effect: non-scaling-stroke`, opacity .85. Selected: its route 1, others .2, dot r 7.
  Finland: `--ink` dot r 4 with a ring r 8. Legend bottom-left: three stitch swatches + `1–3 pv`, `4–6 pv`, `7+ pv`.
- **Care label (the subject detail)**: `--label` tape, 1px `--line`, radius 2px, padding 12px 12px 10px, max 15rem,
  a dashed stitch line (`--ink-2` 45%, `3 2`) 5px below the top edge as the sewn fold. Archivo 75%, 0.875rem/1.35,
  left-aligned, one fact per line, max 4: `Toimitus 4,95 €` / `Ilmainen yli 100 €` / [swatch] `2–5 arkipäivää` /
  `Lähtee Ruotsista` (the label's "Made in"). Non-EU replaces the last line: `ioss`/`ddp` → `ALV maksetaan
  kassalla`; `buyer` → **`ALV ja tulli maksetaan perillä`** (700, the only bold line on the page).
- **Brand card**: phone = bottom sheet above the tab bar, max 65% of the pane, grab handle, the page's one shadow;
  desktop = right panel. Content only: brand (display 1.25rem) + city in `--ink-2`, care label, best coupon (deal in
  one line, code in mono + `Kopioi` → `Kopioitu`), full-width `--ink` button `Avaa kauppa`. Close: 44px ✕ (SVG).
- **Feed card**: pane-high, `scroll-snap-align:start`. Top row: brand (1rem 600) left, like button 44px right
  (outline heart → filled `--like`). Stage flexes (min 45%), full-bleed, no radius, garment centred in it. Below,
  left-aligned: product name (display), price (display 1.25rem), `why` one line in `--ink-2` with ellipsis, a
  2-line care label (`4,95 €, ilmainen yli 100 €` / [swatch] `2–5 pv`), coupon one line if any, `Avaa kauppa`.
- **Filter chips**: 36px tall (44px hit), pill, 1px `--line`, body 0.875rem 500; selected = `--ink` fill, `--bg`
  text, no tick. One row that scrolls inside itself (fade mask on the right); `Maa` is a chip-styled native `<select>`
  first, then `Kaikki` + the 8 types.
- **List table**: `Merkki | Posti | Toimitus | Hinta`. Brand 600 with city below in `--ink-2` 0.8125rem; non-EU
  country code in a 1px outlined box. Numbers right-aligned, tabular. Posti: `4,95 €` over `0 € yli 100`.
  Toimitus: swatch + `2–5`. Hinta: `alk. 89 €`. Sticky `--surface-2` header of sort buttons (active = `--ink` 700 +
  arrow SVG). 56px rows, hairlines, no zebra. Tapping a row expands care label, coupon and link inline (one open).
- **Motion**: only in answer to a tap: sheet slide 200ms ease-out, like-pop 150ms. `prefers-reduced-motion` → none.
