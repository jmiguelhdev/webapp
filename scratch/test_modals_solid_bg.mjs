import fs from 'fs';
import assert from 'assert';

console.log("🧪 Testing Modal Dialog Opacity & CSS Variable Definitions...");

// 1. Verify variables.css
const varCss = fs.readFileSync('./src/frameworks/css/variables.css', 'utf-8');
assert(varCss.includes('--modal-bg: #ffffff;'), 'variables.css should define --modal-bg in :root');
assert(varCss.includes('--modal-bg: #181920;'), 'variables.css should define --modal-bg in body.dark');
assert(varCss.includes('--bg-dark: #181920;'), 'variables.css should define --bg-dark in body.dark');
assert(varCss.includes('--card-bg-solid: #ffffff;'), 'variables.css should define --card-bg-solid in :root');
assert(varCss.includes('--card-bg-solid: #181920;'), 'variables.css should define --card-bg-solid in body.dark');
console.log("✅ CSS Variables test passed!");

// 2. Verify components.css
const compCss = fs.readFileSync('./src/frameworks/css/components.css', 'utf-8');
assert(compCss.includes('.modal-overlay'), 'components.css should style .modal-overlay');
assert(compCss.includes('.modal-backdrop'), 'components.css should style .modal-backdrop');
assert(compCss.includes('opacity: 1 !important;'), 'components.css should enforce opacity 1 on modal dialogs');
assert(compCss.includes('background: #16171d !important;'), 'components.css should enforce dark solid bg for modals');
assert(compCss.includes('background: #ffffff !important;'), 'components.css should enforce light solid bg for modals');
console.log("✅ Modal base CSS test passed!");

// 3. Verify ConsumptionModals.js
const consModals = fs.readFileSync('./src/frameworks/ui/components/ConsumptionModals.js', 'utf-8');
assert(!consModals.includes('style: \'background: var(--bg-dark);'), 'ConsumptionModals.js should not have raw background: var(--bg-dark)');
assert(consModals.includes('--modal-bg'), 'ConsumptionModals.js should use --modal-bg');
console.log("✅ ConsumptionModals.js opacity test passed!");

console.log("🎉 ALL MODAL TRANSPARENCY AUDIT TESTS PASSED!");
