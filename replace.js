const fs = require('fs');
const path = require('path');

function replaceBlueWithRed(dir) {
    fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            replaceBlueWithRed(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts') || fullPath.endsWith('.css')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes('blue-') || content.includes('from-blue') || content.includes('to-blue')) {
                // We'll globally replace 'blue-' with 'red-', but also map specific blue colors like text-blue-600 to text-red-600.
                let newContent = content.replace(/blue-/g, 'red-');
                
                // Special check for hex codes if we want, but tailwind classes are covered by 'blue-'
                if (newContent !== content) {
                    fs.writeFileSync(fullPath, newContent, 'utf8');
                    console.log(`Updated theme colors in: ${fullPath}`);
                }
            }
        }
    });
}

replaceBlueWithRed(path.join(process.cwd(), 'src'));
