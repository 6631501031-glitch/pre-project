#!/usr/bin/env node
/**
 * Copies the MediaPipe Wasm runtime out of node_modules into public/mediapipe/wasm
 * so the face scan page can load it from the app itself instead of a CDN.
 *
 * The Wasm binaries are ~35MB, so they are generated (and git ignored) instead of
 * being committed. Runs automatically before `npm run serve` / `npm run build`.
 */
const fs = require('fs');
const path = require('path');

const SOURCE_DIR = path.resolve(__dirname, '..', 'node_modules', '@mediapipe', 'tasks-vision', 'wasm');
const TARGET_DIR = path.resolve(__dirname, '..', 'public', 'mediapipe', 'wasm');
const BUNDLE_SOURCE = path.resolve(__dirname, '..', 'node_modules', '@mediapipe', 'tasks-vision', 'vision_bundle.mjs');
const BUNDLE_TARGET = path.resolve(__dirname, '..', 'public', 'mediapipe', 'vision_bundle.mjs');

function copyIfChanged(fileName) {
  const source = path.join(SOURCE_DIR, fileName);
  const target = path.join(TARGET_DIR, fileName);
  const sourceStat = fs.statSync(source);
  if (fs.existsSync(target)) {
    const targetStat = fs.statSync(target);
    if (targetStat.size === sourceStat.size && targetStat.mtimeMs >= sourceStat.mtimeMs) return false;
  }
  fs.copyFileSync(source, target);
  return true;
}

function main() {
  if (!fs.existsSync(SOURCE_DIR)) {
    console.warn('[mediapipe] @mediapipe/tasks-vision is not installed; the face scan page will fall back to the CDN.');
    return;
  }

  fs.mkdirSync(TARGET_DIR, { recursive: true });

  const files = fs.readdirSync(SOURCE_DIR).filter(name => /\.(js|wasm)$/.test(name));
  let copied = 0;
  files.forEach(name => {
    if (copyIfChanged(name)) copied += 1;
  });

  if (fs.existsSync(BUNDLE_SOURCE)) {
    const sourceStat = fs.statSync(BUNDLE_SOURCE);
    const targetStat = fs.existsSync(BUNDLE_TARGET) ? fs.statSync(BUNDLE_TARGET) : null;
    if (!targetStat || sourceStat.size !== targetStat.size || sourceStat.mtimeMs > targetStat.mtimeMs) {
      fs.copyFileSync(BUNDLE_SOURCE, BUNDLE_TARGET);
    }
  }

  console.log(`[mediapipe] ${copied} of ${files.length} Wasm asset(s) copied to public/mediapipe/wasm`);
}

try {
  main();
} catch (error) {
  // A failed copy must not break the dev server: the runtime falls back to the CDN.
  console.warn('[mediapipe] copying Wasm assets failed:', error && error.message ? error.message : error);
}
