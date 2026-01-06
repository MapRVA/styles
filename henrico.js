import fs from "fs";
import raster from "./raster.js";

export default async () => {
  const resp = await fetch(
    "https://portal.henrico.gov/mapping/rest/services/Imagery/AerialPhotosAll/MapServer?f=json",
  );
  let { layers } = await resp.json();

  layers = layers.filter(
    ({ name, parentLayerId }) =>
      parentLayerId === -1 && 1900 < parseInt(name) && parseInt(name) < 3000,
  );

  let max = 0;
  let maxID;
  for (const { id, name } of layers) {
    const year = parseInt(name);
    if (year > max) {
      max = year;
      maxID = id;
    }
    const style = raster([
      `https://portal.henrico.gov/mapping/rest/services/Imagery/AerialPhotosAll/MapServer/export?bbox={bbox-epsg-3857}&bboxSR=3857&imageSR=3857&size=512,512&dpi=96&format=png&transparent=true&f=image&layers=show:${id}`,
    ]);
    fs.writeFileSync(
      `public/henrico-aerial-imagery-${year}.json`,
      JSON.stringify(style),
    );
  }
  const style = raster([
    `https://portal.henrico.gov/mapping/rest/services/Imagery/AerialPhotosAll/MapServer/export?bbox={bbox-epsg-3857}&bboxSR=3857&imageSR=3857&size=512,512&dpi=96&format=png&transparent=true&f=image&layers=show:${maxID}`,
  ]);
  fs.writeFileSync(
    `public/henrico-aerial-imagery-latest.json`,
    JSON.stringify(style),
  );
};
