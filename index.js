import fs from "fs";
import { Readable } from "stream";
import { spawnSync } from "child_process";
import { migrate } from "@maplibre/maplibre-gl-style-spec";

import buildVBMPStyles from "./vbmp.js";
import buildHenricoStyles from "./henrico.js";
import buildEsriStyle from "./esri.js";

fs.mkdirSync("public/sprites", { recursive: true });

const styles = {
  "osm-bright":
    "https://openmaptiles.github.io/osm-bright-gl-style/style-cdn.json",
  "maptiler-basic":
    "https://openmaptiles.github.io/maptiler-basic-gl-style/style-cdn.json",
  positron: "https://openmaptiles.github.io/positron-gl-style/style-cdn.json",
  "dark-matter":
    "https://openmaptiles.github.io/dark-matter-gl-style/style-cdn.json",
  "fiord-color":
    "https://openmaptiles.github.io/fiord-color-gl-style/style-cdn.json",
  "maptiler-toner":
    "https://openmaptiles.github.io/maptiler-toner-gl-style/style-cdn.json",
  "maptiler-3d":
    "https://openmaptiles.github.io/maptiler-3d-gl-style/style-cdn.json",
  "osm-liberty": "https://maputnik.github.io/osm-liberty/style.json",
};

const download = async (url, path) =>
  Readable.fromWeb((await fetch(url)).body).pipe(fs.createWriteStream(path));

function fixTextFont(layers, styleName) {
  for (const i in layers) {
    if (layers[i].layout && layers[i].layout["text-font"]) {
      const font = layers[i].layout["text-font"];
      const str = JSON.stringify(font);
      const newStr = str
        // Strip Klokantech prefix (for 'Klokantech Noto Sans *' fonts)
        .replace(/Klokantech /g, "")
        // Change Nunito to Nunito Sans
        .replace(/Nunito/g, "Nunito Sans")
        // Fix casing of Open Sans Semibold
        .replace(/Open Sans Semibold/g, "Open Sans SemiBold")
        // Remove space from Semi/Extra Bold for Noto Sans & Nunito Sans
        .replace(/(Noto|Nunito) Sans (Semi|Extra) Bold/g, "$1 Sans $2Bold")
      layers[i].layout["text-font"] = JSON.parse(newStr);
    }
  }
}

function setDefaultView(style) {
  style.center = [-77.4429, 37.5312];
  style.zoom = 11;
}

async function buildRemoteStyles() {
  for (const [styleName, url] of Object.entries(styles)) {
    let style = await (await fetch(url)).json();
    style = migrate(style);
    style.sources.openmaptiles.url =
      "https://tiles.openstreetmap.us/vector/openmaptiles.json";
    style.sources.openmaptiles.attribution =
      'Tiles by <a href="https://tiles.openstreetmap.us">OSM US</a> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://openmaptiles.org">OpenMapTiles</a>';
    style.glyphs =
      "https://tiles.openstreetmap.us/fonts/{fontstack}/{range}.pbf";
    if (style.sprite) {
      await download(
        style.sprite + ".json",
        `public/sprites/${styleName}.json`,
      );
      await download(style.sprite + ".png", `public/sprites/${styleName}.png`);
      await download(
        style.sprite + "@2x.json",
        `public/sprites/${styleName}@2x.json`,
      );
      await download(
        style.sprite + "@2x.png",
        `public/sprites/${styleName}@2x.png`,
      );
    }
    style.sprite = `https://styles.maprva.org/sprites/${styleName}`;
    fixTextFont(style.layers, styleName);
    setDefaultView(style);
    fs.writeFileSync(`public/${styleName}.json`, JSON.stringify(style));
  }
}

function buildOpenMapTilesStyle() {
  spawnSync("make", ["-C", "openmaptiles", "build-style"], {
    stdio: "inherit",
  });

  let style = JSON.parse(
    fs.readFileSync("openmaptiles/build/style/style.json"),
  );
  style = migrate(style);
  setDefaultView(style);
  style.sources.openmaptiles.url =
    "https://tiles.openstreetmap.us/vector/openmaptiles.json";
  style.sources.openmaptiles.attribution =
    'Tiles by <a href="https://tiles.openstreetmap.us">OSM US</a> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://openmaptiles.org">OpenMapTiles</a>';
  style.glyphs = "https://tiles.openstreetmap.us/fonts/{fontstack}/{range}.pbf";
  style.sprite = "https://styles.maprva.org/sprites/openmaptiles-osm";
  fixTextFont(style.layers, "openmaptiles-osm");

  fs.writeFileSync("public/openmaptiles-osm.json", JSON.stringify(style));
  fs.copyFileSync(
    "openmaptiles/build/style/sprite.png",
    "public/sprites/openmaptiles-osm.png",
  );
  fs.copyFileSync(
    "openmaptiles/build/style/sprite@2x.png",
    "public/sprites/openmaptiles-osm@2x.png",
  );
  fs.copyFileSync(
    "openmaptiles/build/style/sprite.json",
    "public/sprites/openmaptiles-osm.json",
  );
  fs.copyFileSync(
    "openmaptiles/build/style/sprite@2x.json",
    "public/sprites/openmaptiles-osm@2x.json",
  );
}

async function build() {
  await buildRemoteStyles();
  if (!fs.existsSync("openmaptiles")) {
    console.error(
      "Missing 'openmaptiles' directory. Fetch the submodule with:",
    );
    console.error("  git submodule update --init --depth 1");
    process.exit(1);
  }
  buildOpenMapTilesStyle();
  await buildVBMPStyles();
  await buildHenricoStyles();
  buildEsriStyle();
}

build();
