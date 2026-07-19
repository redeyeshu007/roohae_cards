const fs = require('fs');
const path = require('path');
const dir = 'd:/JAVIX/Export/roohae/roohae_cards - Copy/apps/user/src/components/landing';

const mapping = {
  '4': '1',
  '8': '2',
  '12': '3',
  '16': '4',
  '24': '6',
  '32': '8',
  '48': '12',
  '64': '16',
  '96': '24',
  '128': '32'
};

const prefixes = ['p', 'px', 'py', 'pt', 'pb', 'pl', 'pr', 'm', 'mx', 'my', 'mt', 'mb', 'ml', 'mr', 'gap', 'gap-x', 'gap-y', 'w', 'h', 'top', 'bottom', 'left', 'right', 'inset', 'inset-x', 'inset-y'];

function processDir(currentDir) {
  const files = fs.readdirSync(currentDir);
  for (const file of files) {
    const fullPath = path.join(currentDir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      const prefixGroup = prefixes.join('|');
      const numGroup = Object.keys(mapping).join('|');
      
      const regex = new RegExp(`(-?(?:${prefixGroup})-)(?:(${numGroup})\\b)(?!-)`, 'g');
      
      let modified = content.replace(regex, (match, prefix, num) => {
        return prefix + mapping[num];
      });
      
      if (modified !== content) {
        console.log('Modified ' + fullPath);
        fs.writeFileSync(fullPath, modified);
      }
    }
  }
}

processDir(dir);
