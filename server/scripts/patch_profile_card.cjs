const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', '..', 'client', 'src', 'components', 'ProfileCard.jsx');
let content = fs.readFileSync(file, 'utf-8');

// Find the nationalityFlag line and insert after it
const marker = "profile.nationality] || ";
const idx = content.indexOf(marker);
if (idx === -1) {
  console.error('Marker not found!');
  process.exit(1);
}
const lineEnd = content.indexOf('\n', idx);
const insertPos = lineEnd + 1;

const insertion = `
  // Clean display name — show actual name or fallback to nationality + gender label
  const isGenericName = /^(IG-|NPF-)[\\S]*\\s*\\((Bride|Groom)\\)/i.test((profile.name || '').trim());
  const displayName = isGenericName
    ? (profile.nationality ? profile.nationality + ' ' : '') + (profile.gender === 'male' ? 'Groom' : 'Bride')
    : (profile.name || (profile.gender === 'male' ? 'Groom' : 'Bride'));

`;

content = content.slice(0, insertPos) + insertion + content.slice(insertPos);

// Also replace the name display in the fallback placeholder
content = content.replace(
  '{profile.name}\n             </div>',
  '{displayName}\n             </div>'
);

fs.writeFileSync(file, content, 'utf-8');
console.log('Done! Patched ProfileCard.jsx');
