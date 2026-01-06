export const raster = (tiles, tileSize = 512) => ({
  version: 8,
  layers: [{ type: "raster", id: "raster", source: "raster" }],
  sources: { raster: { type: "raster", tiles, tileSize } },
});
export default raster;
