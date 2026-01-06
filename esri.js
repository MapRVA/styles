import fs from "fs";
import raster from "./raster.js";

export default () => {
  const style = raster(
    [
      `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}`,
    ],
    256,
  );
  style.sources.raster.attribution = `<a href="https://www.arcgis.com/home/item.html?id=10df2279f9684e4a9f6a7f08febac2a9">Esri World Imagery</a>`;
  fs.writeFileSync("public/esri-world-imagery.json", JSON.stringify(style));
};
