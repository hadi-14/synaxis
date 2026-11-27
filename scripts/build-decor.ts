// Generates static decor files from code: npm run decor:build
import { writeFileSync, mkdirSync } from "node:fs";
import { skylineSvg, SKYLINE_RED, SKYLINE_NIGHT } from "../src/components/decor/skyline-art";
mkdirSync("public/decor", { recursive: true });
writeFileSync("public/decor/skyline-red.svg", skylineSvg(SKYLINE_RED));
writeFileSync("public/decor/skyline-night.svg", skylineSvg(SKYLINE_NIGHT));
console.log("wrote public/decor/skyline-{red,night}.svg");
