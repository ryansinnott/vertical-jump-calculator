const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..');
const destDir = path.join(__dirname, '..', 'www');

// Files to copy to www
const filesToCopy = [
    'index.html',
    'styles.css',
    'app.js',
    'sw.js',
    'manifest.json'
];

// Directories to copy
const dirsToCopy = [
    'icons'
];

// Ensure www directory exists
if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
}

// Copy files
filesToCopy.forEach(file => {
    const src = path.join(srcDir, file);
    const dest = path.join(destDir, file);

    if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
        console.log(`Copied: ${file}`);
    } else {
        console.warn(`Warning: ${file} not found`);
    }
});

// Copy directories recursively
function copyDir(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }

    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

dirsToCopy.forEach(dir => {
    const src = path.join(srcDir, dir);
    const dest = path.join(destDir, dir);

    if (fs.existsSync(src)) {
        copyDir(src, dest);
        console.log(`Copied directory: ${dir}`);
    } else {
        console.warn(`Warning: ${dir} directory not found`);
    }
});

console.log('\nBuild complete! Files copied to www/');
