import fs from "fs";

const dir = process.argv[2] || "./public";

const fonts = new Set();
for (const f of fs.readdirSync(dir)) {
  if (!f.endsWith(".json")) continue;
  for (const l of JSON.parse(fs.readFileSync(`${dir}/${f}`)).layers) {
    if (l.layout && l.layout["text-font"]) fonts.add(JSON.stringify(l.layout["text-font"]));
  }
}

console.log(fonts)
