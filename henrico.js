import fs from "fs";
import raster from "./raster.js";

const center = (style) => {
  style.center = [-77.4192, 37.5257];
  style.zoom = 10;
};

export default async () => {
  const resp = await fetch(
    "https://portal.henrico.gov/mapping/rest/services/Imagery/AerialPhotosAll/MapServer?f=json",
  );
  let { layers } = await resp.json();

  let max = 0;
  let maxID;
  for (const { id } of layers) {
    if (id > max) {
      max = id;
      maxID = id;
    }
    const style = raster([
      `https://portal.henrico.gov/mapping/rest/services/Imagery/AerialPhotosAll/MapServer/export?bbox={bbox-epsg-3857}&bboxSR=3857&imageSR=3857&size=512,512&dpi=96&format=png&transparent=true&f=image&layers=show:${id}`,
    ]);
    center(style);
    fs.writeFileSync(
      `public/henrico-aerial-imagery-${id}.json`,
      JSON.stringify(style),
    );
  }
  const style = raster([
    `https://portal.henrico.gov/mapping/rest/services/Imagery/AerialPhotosAll/MapServer/export?bbox={bbox-epsg-3857}&bboxSR=3857&imageSR=3857&size=512,512&dpi=96&format=png&transparent=true&f=image&layers=show:${maxID}`,
  ]);
  center(style);
  fs.writeFileSync(
    `public/henrico-aerial-imagery-latest.json`,
    JSON.stringify(style),
  );
};
