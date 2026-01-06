import fs from "fs";
import raster from "./raster.js";

export default async () => {
  const resp = await fetch(
    "https://vginmaps.vdem.virginia.gov/arcgis/rest/services/VBMP_Imagery/?f=json",
  );
  const { services } = await resp.json();

  for (const { name } of services) {
    let year;
    const match = name.match(/VBMP_Imagery\/VBMP([0-9][0-9][0-9][0-9])_WGS/);
    if (name === "VBMP_Imagery/MostRecentImagery_WGS") {
      year = "latest";
    } else if (match) {
      year = match[1];
    } else {
      continue;
    }
    const style = raster(
      [
        `https://vginmaps.vdem.virginia.gov/arcgis/rest/services/${name}/MapServer/tile/{z}/{y}/{x}`,
      ],
      256,
    );
    style.center = [-79.609, 38.026];
    style.zoom = 6;
    fs.writeFileSync(
      `public/vgin-vbmp-imagery-${year}.json`,
      JSON.stringify(style),
    );
  }
};
