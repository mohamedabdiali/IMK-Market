import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PRODUCT_ROOT = path.join(__dirname, "..", "public", "assets", "products");
const TARGET_COUNT = 8;
const MIN_TARGET_BYTES = 10 * 1024;
const MIN_SOURCE_BYTES = 20 * 1024;

const hashString = (value) => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
};

const collectSourceImages = () => {
  if (!fs.existsSync(PRODUCT_ROOT)) return [];
  const files = [];
  const entries = fs.readdirSync(PRODUCT_ROOT, { withFileTypes: true });
  entries.forEach((entry) => {
    if (!entry.isDirectory()) return;
    const dir = path.join(PRODUCT_ROOT, entry.name);
    const images = fs.readdirSync(dir).filter((file) => file.toLowerCase().endsWith(".jpg"));
    images.forEach((file) => {
      const fullPath = path.join(dir, file);
      try {
        const stats = fs.statSync(fullPath);
        if (stats.isFile() && stats.size >= MIN_SOURCE_BYTES) {
          files.push(fullPath);
        }
      } catch {
        // ignore
      }
    });
  });
  return files;
};

const ensureImages = (productId, sourceImages) => {
  const dir = path.join(PRODUCT_ROOT, productId);
  if (!fs.existsSync(dir)) return;
  for (let index = 1; index <= TARGET_COUNT; index += 1) {
    const target = path.join(dir, `image-${index}.jpg`);
    let needsReplace = true;
    if (fs.existsSync(target)) {
      try {
        const stats = fs.statSync(target);
        if (stats.isFile() && stats.size >= MIN_TARGET_BYTES) {
          needsReplace = false;
        }
      } catch {
        needsReplace = true;
      }
    }
    if (!needsReplace) continue;
    if (!sourceImages.length) continue;
    const pickIndex = hashString(`${productId}-${index}`) % sourceImages.length;
    const source = sourceImages[pickIndex];
    fs.copyFileSync(source, target);
  }
};

const main = () => {
  if (!fs.existsSync(PRODUCT_ROOT)) {
    console.error("Missing public/assets/products");
    process.exit(1);
  }
  const sourceImages = collectSourceImages();
  if (!sourceImages.length) {
    console.error("No usable source images found.");
    process.exit(1);
  }
  const productDirs = fs.readdirSync(PRODUCT_ROOT, { withFileTypes: true }).filter((entry) => entry.isDirectory());
  productDirs.forEach((entry) => ensureImages(entry.name, sourceImages));
  console.log("✅ Product images normalized with local assets.");
};

main();
