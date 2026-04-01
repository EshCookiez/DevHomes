const fs = require('fs');
const content = fs.readFileSync('c:\\Users\\HP\\Desktop\\HomesPH-Official\\components\\listings\\PublicListingsPage.tsx', 'utf8');

// A simple regex to count un-commented, non-self-closing divs
let openDivs = 0;
let lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
  let line = lines[i];
  
  // ignoring multi-line comments for simplicity since this file mostly has line comments or JSX comments
  line = line.replace(/\{\/\*.*?\*\/\}/g, ''); // replace JSX comments
  line = line.replace(/<!--.*?-->/g, '');      // replace HTML comments
  
  const opens = (line.match(/<div(?=[\s>])/g) || []).length;
  const selfClosing = (line.match(/<div[^>]*\/>/g) || []).length;
  const closes = (line.match(/<\/div>/g) || []).length;
  
  openDivs += (opens - selfClosing - closes);
  
  if (opens - selfClosing - closes !== 0) {
    // console.log(`Line ${i + 1}: open=${opens}, selfClose=${selfClosing}, close=${closes}, totalBalance=${openDivs}`);
  }
}

console.log('Final open div balance:', openDivs);
