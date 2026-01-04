import fs from "fs";
import { Readable } from "stream";

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
async function build() {
  for (const [styleName, url] of Object.entries(styles)) {
    const style = await (await fetch(url)).json();
    style.sources.openmaptiles.url = "https://tiles.openfreemap.org/planet";
    style.sources.openmaptiles.attribution =
      '<a href="https://openfreemap.org//" target="_blank">OpenFreeMap</a><a href="https://www.openmaptiles.org/" target="_blank">&copy; OpenMapTiles</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>';
    style.glyphs = "https://styles.trailsta.sh/fonts/{fontstack}/{range}.pbf";
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
    style.sprite = `https://styles.trailsta.sh/sprites/${styleName}`;
    for (const i in style.layers) {
      if (styleName === "maptiler-toner") {
        if (style.layers[i].layout && style.layers[i].layout["text-font"]) {
          const str = JSON.stringify(style.layers[i].layout["text-font"]);
          const newStr = str
            .replace(/Nunito/g, "Open Sans")
            .replace(/Noto/g, "Open")
            .replace(/Semi Bold/g, "Semibold");
          style.layers[i].layout["text-font"] = JSON.parse(newStr);
        }
      } else if (
        style.layers[i].layout &&
        style.layers[i].layout["text-font"] &&
        style.layers[i].layout["text-font"].length > 1
      ) {
        style.layers[i].layout["text-font"] =
          style.layers[i].layout["text-font"].slice(1);
      }
    }
    fs.mkdirSync("public", { recursive: true });
    fs.writeFileSync(`public/${styleName}.json`, JSON.stringify(style));
  }
}
build();
