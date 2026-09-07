const fs = require('fs');
const path = require('path');

const filePath = path.join(
  __dirname,
  '..',
  'node_modules',
  '@codetrix-studio',
  'capacitor-google-auth',
  'android',
  'build.gradle'
);

if (!fs.existsSync(filePath)) {
  console.log('[google-auth patch] Package not installed, skipping.');
  process.exit(0);
}

let content = fs.readFileSync(filePath, 'utf8');
const original = content;

// Gradle 9+ no longer supports jcenter()
content = content.replace(/\bjcenter\(\)/g, 'mavenCentral()');

// Gradle 9+ no longer supports the old default ProGuard config
content = content.replace(
  /getDefaultProguardFile\(['"]proguard-android\.txt['"]\)/g,
  "getDefaultProguardFile('proguard-android-optimize.txt')"
);

if (content === original) {
  console.log('[google-auth patch] Already patched.');
} else {
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('[google-auth patch] Applied successfully.');
}