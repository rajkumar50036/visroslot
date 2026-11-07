const fs = require('fs');
const assert = require('assert');

console.log("=========================================");
console.log("   NETLIFY BADGE REMOVAL VERIFICATION   ");
console.log("=========================================\n");

let passed = 0;
let total = 0;

function test(name, fn) {
  total++;
  try {
    fn();
    console.log(`  [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  [FAIL] ${name}`);
    console.error(`         ${err.message}`);
  }
}

// 1. Verify globals.css rules
test("globals.css: Contains #nl-badge-frame and Netlify iframe suppression styles", () => {
  const css = fs.readFileSync("src/app/globals.css", "utf8");
  assert.ok(css.includes("#nl-badge-frame"), "Missing #nl-badge-frame selector");
  assert.ok(css.includes("#nl-hud-frame"), "Missing #nl-hud-frame selector");
  assert.ok(css.includes("display: none !important"), "Missing display: none !important");
  assert.ok(css.includes("visibility: hidden !important"), "Missing visibility: hidden !important");
});

// 2. Verify NetlifyBadgeSuppressor component exists
test("NetlifyBadgeSuppressor.tsx: Defines early-exit dummy blockers and MutationObserver", () => {
  const comp = fs.readFileSync("src/components/brand/NetlifyBadgeSuppressor.tsx", "utf8");
  assert.ok(comp.includes('id="nl-badge-frame"'), "Missing id='nl-badge-frame' blocker element");
  assert.ok(comp.includes('id="nl-hud-frame"'), "Missing id='nl-hud-frame' blocker element");
  assert.ok(comp.includes("MutationObserver"), "Missing MutationObserver");
  assert.ok(comp.includes("purgeNetlifyBadge"), "Missing purge logic");
});

// 3. Verify layout.tsx integrates NetlifyBadgeSuppressor and head script
test("RootLayout (layout.tsx): Injects early-execution script and NetlifyBadgeSuppressor component", () => {
  const layout = fs.readFileSync("src/app/layout.tsx", "utf8");
  assert.ok(layout.includes("<NetlifyBadgeSuppressor />"), "Missing <NetlifyBadgeSuppressor /> in layout body");
  assert.ok(layout.includes("MutationObserver"), "Missing synchronous head blocker script in layout head");
});

console.log(`\nResults: ${passed} / ${total} tests passed.`);
if (passed === total) {
  console.log(">>> ALL BADGE REMOVAL TESTS PASSED! <<<\n");
} else {
  process.exit(1);
}
