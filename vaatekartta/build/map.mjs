// Builds a pre-projected Europe map (SVG path strings) so the page needs no map library.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { geoAzimuthalEqualArea, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import { presimplify, simplify, quantile } from 'topojson-simplify';

const require = createRequire(import.meta.url);
const atlasPath = require.resolve('world-atlas/countries-50m.json');

// Map frame: Iceland to the Urals' edge, Gibraltar to Lapland.
const FRAME = { west: -25, east: 36, south: 34.5, north: 71.5 };
const WIDTH = 1000;

function frameOutline() {
  const pts = [];
  for (let lng = FRAME.west; lng <= FRAME.east; lng += 1) pts.push([lng, FRAME.south], [lng, FRAME.north]);
  for (let lat = FRAME.south; lat <= FRAME.north; lat += 1) pts.push([FRAME.west, lat], [FRAME.east, lat]);
  return { type: 'MultiPoint', coordinates: pts };
}

export function buildMap() {
  // Lambert azimuthal equal-area centred on Europe (same idea as EPSG:3035).
  const projection = geoAzimuthalEqualArea().rotate([-10, -52]);
  const outline = frameOutline();
  projection.fitWidth(WIDTH, outline);
  const [[x0, y0], [x1, y1]] = geoPath(projection).bounds(outline);
  const height = Math.ceil(y1 - y0);
  projection.translate([projection.translate()[0] - x0, projection.translate()[1] - y0]);
  projection.clipExtent([[-2, -2], [WIDTH + 2, height + 2]]);

  let topo = JSON.parse(readFileSync(atlasPath, 'utf8'));
  topo = presimplify(topo);
  topo = simplify(topo, quantile(topo, 0.42));
  const countries = feature(topo, topo.objects.countries).features;

  const path = geoPath(projection).digits(1);
  const paths = [];
  for (const f of countries) {
    const d = path(f);
    if (!d) continue;
    paths.push({ id: f.id ?? '', name: f.properties?.name ?? '', d });
  }

  const project = (lng, lat) => {
    const p = projection([lng, lat]);
    return p ? [Math.round(p[0] * 10) / 10, Math.round(p[1] * 10) / 10] : null;
  };

  return { width: WIDTH, height, paths, project };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const m = buildMap();
  const bytes = m.paths.reduce((n, p) => n + p.d.length, 0);
  console.log(`countries: ${m.paths.length}, viewBox 0 0 ${m.width} ${m.height}, path bytes: ${bytes}`);
  console.log('Helsinki', m.project(24.94, 60.17), 'Lisbon', m.project(-9.14, 38.72), 'Reykjavik', m.project(-21.9, 64.1));
}
