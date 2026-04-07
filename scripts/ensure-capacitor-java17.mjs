import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const targets = [
  path.join(root, 'android/app/capacitor.build.gradle'),
  path.join(root, 'node_modules/@capacitor/android/capacitor/build.gradle'),
];

for (const file of targets) {
  if (!existsSync(file)) continue;

  const source = readFileSync(file, 'utf8');
  const next = source.replaceAll('JavaVersion.VERSION_21', 'JavaVersion.VERSION_17');

  if (next !== source) {
    writeFileSync(file, next, 'utf8');
    console.log(`Patched Java 17 compatibility in ${path.relative(root, file)}`);
  }
}
