const fs = require('fs');
const content = fs.readFileSync('c:\\Users\\HP\\Desktop\\HomesPH-Official\\components\\listings\\PublicListingsPage.tsx', 'utf8');

let stack = [];
let lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
  let line = lines[i];
  
  line = line.replace(/\{\/\*.*?\*\/\}/g, '');
  line = line.replace(/<!--.*?-->/g, '');
  
  const opens = (line.match(/<div(?=[\s>])/g) || []).length;
  const selfClosing = (line.match(/<div[^>]*\/>/g) || []).length;
  const closes = (line.match(/<\/div>/g) || []).length;
  
  let actualOpens = opens - selfClosing;
  
  for(let j=0; j<actualOpens; j++) stack.push(i + 1);
  for(let j=0; j<closes; j++) {
    if(stack.length > 0) stack.pop();
  }
}

console.log('Unclosed divs opened at lines:', stack);
