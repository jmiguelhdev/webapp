const fs = require('fs');

const path = 'src/style.css';
let content = fs.readFileSync(path, 'utf8');

// 1. Update font and variables
const oldVars = `/* webApp/src/style.css */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

:root {
  --primary: #841d1d;
  --primary-glow: rgba(132, 29, 29, 0.4);
  --success: #10b981;
  --danger: #ef4444;
  --warning: #f59e0b;
  
  /* Light Theme (Derived from Maroon/Silver) */
  --bg-main: #f8fafc;
  --sidebar-bg: #ffffff;
  --card-bg: #ffffff;
  --text-main: #18181b;
  --text-muted: #71717a;
  --border: rgba(132, 29, 29, 0.1);
  --glass: rgba(132, 29, 29, 0.03);
  --header-bg: rgba(255, 255, 255, 0.9);
  --input-bg: #ffffff;
  --transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

body.dark {
  --bg-main: #0c0c0e;
  --sidebar-bg: #151518;
  --card-bg: rgba(21, 21, 24, 0.7);
  --text-main: #f4f4f5;
  --text-muted: #a1a1aa;
  --border: rgba(132, 29, 29, 0.2);
  --glass: rgba(132, 29, 29, 0.05);
  --header-bg: rgba(12, 12, 14, 0.95);
  --input-bg: rgba(12, 12, 14, 0.5);
}`;

const newVars = `/* webApp/src/style.css */
@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');

:root {
  --primary: #8f0014;
  --on-primary: #ffffff;
  --primary-container: #ffdcd8;
  --on-primary-container: #3b0003;
  
  --success: #10b981;
  --danger: #ba1a1a;
  --on-danger: #ffffff;
  --warning: #f59e0b;
  
  /* M3 Light Surface */
  --bg-main: #fff8f7;
  --sidebar-bg: #fff8f7;
  --card-bg: #f5eae9; /* Surface Container */
  --text-main: #231918;
  --text-muted: #554341;
  --border: #e7dbd9; 
  --outline: #887270;
  --glass: #f5eae9; /* Fallback for glass to solid */
  --header-bg: #fff8f7;
  --input-bg: #fff8f7;
  --transition: all 0.2s cubic-bezier(0.2, 0, 0, 1); /* M3 Standard */

  /* Elevations */
  --elevation-1: 0px 1px 2px 0px rgba(0, 0, 0, 0.3), 0px 1px 3px 1px rgba(0, 0, 0, 0.15);
  --elevation-2: 0px 1px 2px 0px rgba(0, 0, 0, 0.3), 0px 2px 6px 2px rgba(0, 0, 0, 0.15);
  --elevation-3: 0px 1px 3px 0px rgba(0, 0, 0, 0.3), 0px 4px 8px 3px rgba(0, 0, 0, 0.15);
}

body.dark {
  --primary: #ffb4aa;
  --on-primary: #550007;
  --primary-container: #77000d;
  --on-primary-container: #ffdcd8;
  
  --danger: #ffb4ab;
  --on-danger: #690005;
  
  /* M3 Dark Surface */
  --bg-main: #1a1110;
  --sidebar-bg: #1a1110;
  --card-bg: #271d1c; /* Surface container */
  --text-main: #f1dfdc;
  --text-muted: #d8c1be;
  --border: #554341;
  --outline: #a08c8a;
  --glass: #271d1c;
  --header-bg: #1a1110;
  --input-bg: #1a1110;
  
  --elevation-1: 0px 1px 2px 0px rgba(0, 0, 0, 0.3), 0px 1px 3px 1px rgba(0, 0, 0, 0.15);
}`;

content = content.replace(oldVars, newVars);

// 2. Change font-family
content = content.replace(/font-family: 'Inter', sans-serif;/g, `font-family: 'Roboto', sans-serif;`);

// 3. Update top bar
content = content.replace(/backdrop-filter: blur\([^)]*\);/g, ''); // Remove glass blur

// 4. Update Header Logo
content = content.replace(/filter: drop-shadow\(0 0 8px var\(--primary-glow\)\);/g, `box-shadow: var(--elevation-2); transform: scale(1.02);`);

// 5. Update .modal, .card
content = content.replace(/\.modal \{ background: var\(--card-bg\); width: 90%; max-width: 500px; padding: 2\.5rem; border-radius: 28px; border: 1px solid var\(--border\); box-shadow: 0 20px 50px rgba\(0,0,0,0\.3\); \}/, `.modal { background: var(--card-bg); width: 90%; max-width: 500px; padding: 2rem; border-radius: 28px; border: none; box-shadow: var(--elevation-3); }`);

// 6. Update Primary Button
const oldBtnPrimary = `.btn-primary { \n  background: var(--primary); color: white; border: none; padding: 0.85rem; \n  border-radius: 12px; font-weight: 600; cursor: pointer; width: 100%; margin-top: 1rem;\n}`;
const newBtnPrimary = `.btn-primary { \n  background: var(--primary); color: var(--on-primary); border: none; padding: 0.65rem 1.5rem; \n  border-radius: 100px; font-weight: 500; font-size: 0.875rem; letter-spacing: 0.1px; cursor: pointer; width: 100%; margin-top: 1rem; transition: var(--transition); box-shadow: var(--elevation-1);\n}\n.btn-primary:hover { box-shadow: var(--elevation-2); opacity: 0.9; }`;
content = content.replace(oldBtnPrimary, newBtnPrimary);

// 7. Update Outline Button
const oldBtnOutline = `.btn-outline { background: none; border: 1px solid var(--border); color: var(--text-main); padding: 0.85rem; border-radius: 12px; font-weight: 600; cursor: pointer; flex: 1; }\n.btn-outline:hover { background: var(--glass); }`;
const newBtnOutline = `.btn-outline { background: transparent; border: 1px solid var(--outline); color: var(--primary); padding: 0.65rem 1.5rem; border-radius: 100px; font-weight: 500; font-size: 0.875rem; letter-spacing: 0.1px; cursor: pointer; flex: 1; transition: var(--transition); }\n.btn-outline:hover { background: var(--primary-container); border-color: var(--primary); color: var(--on-primary-container); }`;
content = content.replace(oldBtnOutline, newBtnOutline);

// 8. Update Cards (Solid, no glass) 
content = content.replace(/\.glass-card \{ background: var\(--card-bg\); border: 1px solid var\(--border\); padding: 2rem; border-radius: 24px; \}/g, `.glass-card { background: var(--card-bg); border: none; padding: 1.5rem; border-radius: 16px; box-shadow: var(--elevation-1); }`);
content = content.replace(/\.travel-card-full \{.*?box-shadow:.*?;/gs, (match) => {
    return `.travel-card-full {\n  background: var(--card-bg);\n  border: none;\n  padding: 1.5rem;\n  border-radius: 16px;\n  animation: fadeIn 0.4s ease-out;\n  box-shadow: var(--elevation-1);`;
});

// 9. Update Inputs (Outlined Text Fields)
const oldInput = `.form-group input:not([type="checkbox"]) {\n  background: var(--input-bg); border: 1px solid var(--border); padding: 0.75rem 1rem;\n  border-radius: 12px; color: var(--text-main); outline: none;\n}`;
const newInput = `.form-group input:not([type="checkbox"]), .form-input, select, textarea {\n  background: transparent; border: 1px solid var(--outline); padding: 1rem;\n  border-radius: 4px; color: var(--text-main); outline: none; transition: var(--transition); font-size: 1rem;\n}\n.form-group input:focus, .form-input:focus, select:focus, textarea:focus {\n  border-color: var(--primary); border-width: 2px; padding: calc(1rem - 1px);\n}`;
content = content.replace(oldInput, newInput);
// Additional rule for .form-input to ensure it catches globally if used
if(!content.includes('.form-input:focus')) {
   content += `\n\n.form-input {\n  background: transparent; border: 1px solid var(--outline); padding: 1rem;\n  border-radius: 4px; color: var(--text-main); outline: none; transition: var(--transition); font-size: 1rem;\n}\n.form-input:focus {\n  border-color: var(--primary); border-width: 2px; padding: calc(1rem - 1px);\n}`;
}

// 10. Chips
const oldChips = `.category-chip {.*?outline: none;\n}`;
const newChips = `.category-chip {\n  background: var(--card-bg);\n  border: 1px solid var(--outline);\n  color: var(--text-main);\n  padding: 0.5rem 1rem;\n  border-radius: 8px;\n  cursor: pointer;\n  font-size: 0.875rem;\n  font-weight: 500;\n  transition: var(--transition);\n  outline: none;\n}`;
content = content.replace(new RegExp(oldChips.replace(/\n/g, '\\n').replace(/\./g, '\\.').replace(/\{.*?\}/s, '\\{.*?\\}'), 's'), newChips);

const oldChipHoverActive = /\.category-chip:hover \{.*?\}.*?\.category-chip\.active \{.*?\}/s;
const newChipHoverActive = `.category-chip:hover {\n  background: var(--primary-container);\n  color: var(--on-primary-container);\n  border-color: var(--primary-container);\n}\n.category-chip.active {\n  background: var(--primary-container);\n  color: var(--on-primary-container);\n  border-color: var(--primary-container);\n  font-weight: 700;\n}`;
content = content.replace(oldChipHoverActive, newChipHoverActive);

// Write back
fs.writeFileSync(path, content, 'utf8');
console.log('Styles updated with M3 principles successfully.');
