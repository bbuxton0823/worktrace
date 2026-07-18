import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const templateRoot = new URL("../", import.meta.url);

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the cinematic WorkTrace prototype", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>WorkTrace \| Physical Intelligence Prototype<\/title>/i);
  assert.match(html, /THE WORLD IS ALREADY TEACHING ROBOTS/);
  assert.match(html, /Turn physical work into/);
  assert.match(html, /Cedar House 014/);
  assert.match(html, /Vacant-home staging/);
  assert.match(html, /WORKING PROTOTYPE/);
  assert.match(html, /No real workers, homes, or customer operations are shown/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
  assert.doesNotMatch(html, /—/);
});

test("keeps prototype interactions, field hardware, and rights controls in source", async () => {
  const [page, layout, css, shader] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../app/ShaderField.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(page, /data-testid="start-capture"/);
  assert.match(page, /data-testid="exclude-privacy"/);
  assert.match(page, /data-testid="generate-package"/);
  assert.match(page, /data-testid="economics-calculator"/);
  assert.match(page, /data-testid="increase-raw-hours"/);
  assert.match(page, /data-testid="mobile-capture-prototype"/);
  assert.match(page, /data-testid="starter-equipment-kit"/);
  assert.match(page, /ELP 1080P 100 degree UVC camera/);
  assert.match(page, /GoPro hat clip mount/);
  assert.match(page, /3M Dual Lock tape/);
  assert.match(page, /A \$45 to \$58 core kit/);
  assert.match(page, /not a certified breakaway safety mount/i);
  assert.match(page, /web prototype simulates USB capture/i);
  assert.match(page, /data-testid="view-regions"/);
  assert.match(page, /data-testid="watch-explainer"/);
  assert.match(page, /data-testid="explainer-video"/);
  assert.match(page, /worktrace-demo-explainer\.mp4/);
  assert.match(page, /region-\$\{region\.id\}/);
  assert.match(page, /Never build the model on wage arbitrage/i);
  assert.match(page, /normal skilled-work pay plus a recording premium/i);
  assert.match(page, /Separate worker opt-in/i);
  assert.match(layout, /WorkTrace \| Physical Intelligence Prototype/);
  assert.match(css, /@property --trace-angle/);
  assert.match(css, /animation-timeline: scroll\(root\)/);
  assert.match(css, /animation-timeline: view\(\)/);
  assert.match(css, /color-mix\(in oklch/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(shader, /getContext\("webgl2"/);
  assert.match(shader, /gl_VertexID/);
  assert.match(shader, /webglcontextlost/);
  assert.match(shader, /devicePixelRatio/);
  assert.doesNotMatch(`${page}\n${layout}\n${css}\n${shader}`, /—/);
  await access(new URL("../public/demo/worktrace-demo-explainer.mp4", import.meta.url));
  await access(new URL("../public/demo/worktrace-explainer.vtt", import.meta.url));
  await assert.rejects(access(new URL("../app/_sites-preview", import.meta.url)));
  await assert.rejects(access(new URL("node_modules/react-loading-skeleton", templateRoot)));
});
