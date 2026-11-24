// Compiles the video's CSS with the project's own Tailwind (v4) compiler,
// using the video markup as the only content source.
// Run: node brag-output/work/build-css.mjs   (from the repo root)
import { createRequire } from "node:module";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const project = resolve(here, "../../puja-dashboard");
const require = createRequire(resolve(project, "package.json"));
const { compile } = require("@tailwindcss/node");
const { Scanner } = require("@tailwindcss/oxide");

const compositionDir = resolve(here, "composition");
const input = '@import "tailwindcss" source(none);\n@theme inline { --font-sans: "Geist", system-ui, sans-serif; --font-mono: "Geist Mono", ui-monospace, monospace; }\n';

const compiler = await compile(input, { base: project, onDependency() {} });
const scanner = new Scanner({ sources: [{ base: compositionDir, pattern: "index.html", negated: false }] });
const candidates = scanner.scan();
const css = compiler.build(candidates);
writeFileSync(resolve(compositionDir, "app.css"), css);
console.log(`app.css: ${css.length} bytes from ${candidates.length} candidates`);
// sanity: a few classes the video relies on
const html = readFileSync(resolve(compositionDir, "index.html"), "utf8");
for (const cls of ["bg-linear-to-br", "ring-amber-200", "max-w-md", "shadow-2xl", "bg-rose-50\\/50", "text-\\[132px\\]"]) {
  if (!css.includes(`.${cls}`)) console.log("MISSING:", cls);
}
void html;
