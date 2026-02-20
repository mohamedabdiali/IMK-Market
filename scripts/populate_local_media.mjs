import fs from "fs";
import path from "path";
import https from "https";
import http from "http";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_PATH = path.join(__dirname, "..", "data", "imk-market.json");
const ASSET_ROOT = path.join(__dirname, "..", "public", "assets");
const PRODUCT_ROOT = path.join(ASSET_ROOT, "products");
const CATEGORY_ROOT = path.join(ASSET_ROOT, "categories");

const MIN_IMAGES = 8;
const MAX_VIDEOS = 2;
const MIN_FILE_SIZE = 5 * 1024; // treat smaller files as placeholders

const FORCE = process.argv.includes("--force");
const SKIP_VIDEOS = process.argv.includes("--skip-videos");
const SKIP_CATEGORIES = process.argv.includes("--skip-categories");

const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);
const VIDEO_EXTS = new Set([".mp4", ".webm", ".mov", ".m4v"]);

const isRemoteUrl = (value) => typeof value === "string" && /^https?:\/\//i.test(value);
const isDataUrl = (value) => typeof value === "string" && value.startsWith("data:");

const ensureDir = (dir) => fs.mkdirSync(dir, { recursive: true });

const urlExtension = (url, fallback) => {
  try {
    const pathname = new URL(url).pathname;
    const ext = path.extname(pathname);
    if (ext) return ext.toLowerCase();
  } catch {
    // ignore
  }
  return fallback;
};

const mimeToExt = (mime, fallback) => {
  const lower = (mime || "").toLowerCase();
  if (lower.includes("jpeg") || lower.includes("jpg")) return ".jpg";
  if (lower.includes("png")) return ".png";
  if (lower.includes("webp")) return ".webp";
  if (lower.includes("gif")) return ".gif";
  if (lower.includes("mp4")) return ".mp4";
  if (lower.includes("webm")) return ".webm";
  if (lower.includes("mov")) return ".mov";
  return fallback;
};

const fileIsUsable = (filePath) => {
  if (!fs.existsSync(filePath)) return false;
  const stats = fs.statSync(filePath);
  if (!stats.isFile()) return false;
  return stats.size >= MIN_FILE_SIZE || FORCE;
};

const listLocalFiles = (dir, extensions) => {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((file) => extensions.has(path.extname(file).toLowerCase()))
    .sort((a, b) => a.localeCompare(b))
    .map((file) => path.join(dir, file));
};

const findFallbackImages = () => {
  if (!fs.existsSync(PRODUCT_ROOT)) return [];
  const entries = fs.readdirSync(PRODUCT_ROOT, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const dir = path.join(PRODUCT_ROOT, entry.name);
    const images = listLocalFiles(dir, IMAGE_EXTS);
    const usable = images.filter((img) => fileIsUsable(img));
    if (usable.length >= 1) return usable;
  }
  return [];
};

const downloadFile = (url, dest) =>
  new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;
    const request = client.get(url, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        return downloadFile(response.headers.location, dest).then(resolve).catch(reject);
      }
      if (response.statusCode !== 200) {
        return reject(new Error(`Failed to download ${url} (${response.statusCode})`));
      }
      const file = fs.createWriteStream(dest);
      response.pipe(file);
      file.on("finish", () => {
        file.close();
        resolve();
      });
    });
    request.on("error", (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });

const writeDataUrl = (dataUrl, dest, fallbackExt) => {
  const match = dataUrl.match(/^data:([^;]+);base64,(.*)$/);
  if (!match) return false;
  const mime = match[1];
  const buffer = Buffer.from(match[2], "base64");
  const ext = mimeToExt(mime, fallbackExt);
  const finalPath = dest.endsWith(ext) ? dest : dest.replace(path.extname(dest), ext);
  fs.writeFileSync(finalPath, buffer);
  return true;
};

const slugify = (value) =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "category";

const ensureImages = async ({ sources, targetDir, targetPrefix, fallbackImages }) => {
  ensureDir(targetDir);
  const resolvedSources = sources.filter((src) => !!src);
  const output = [];
  for (let index = 0; index < MIN_IMAGES; index += 1) {
    const fileName = `${targetPrefix}-${index + 1}.jpg`;
    const dest = path.join(targetDir, fileName);
    const src = resolvedSources[index] || resolvedSources[0];
    if (fileIsUsable(dest)) {
      output.push(dest);
      continue;
    }
    if (src && isDataUrl(src)) {
      const ok = writeDataUrl(src, dest, ".jpg");
      if (ok) {
        output.push(dest);
        continue;
      }
    }
    if (src && isRemoteUrl(src)) {
      const ext = urlExtension(src, ".jpg");
      const finalDest = dest.replace(path.extname(dest), ext);
      try {
        await downloadFile(src, finalDest);
        output.push(finalDest);
        continue;
      } catch (err) {
        console.error(`Failed to download image ${src}: ${err.message}`);
      }
    }
    if (fallbackImages.length) {
      const fallback = fallbackImages[index % fallbackImages.length];
      const ext = path.extname(fallback) || ".jpg";
      const finalDest = dest.replace(path.extname(dest), ext);
      fs.copyFileSync(fallback, finalDest);
      output.push(finalDest);
      continue;
    }
    output.push(dest);
  }
  return output;
};

const ensureVideos = async ({ sources, targetDir }) => {
  ensureDir(targetDir);
  const output = [];
  if (SKIP_VIDEOS) return output;
  const resolvedSources = sources.filter((src) => !!src).slice(0, MAX_VIDEOS);
  for (let index = 0; index < resolvedSources.length; index += 1) {
    const src = resolvedSources[index];
    const fileName = index === 0 ? "video.mp4" : `video-${index + 1}.mp4`;
    const dest = path.join(targetDir, fileName);
    if (fileIsUsable(dest)) {
      output.push(dest);
      continue;
    }
    if (src && isDataUrl(src)) {
      const ok = writeDataUrl(src, dest, ".mp4");
      if (ok) {
        output.push(dest);
        continue;
      }
    }
    if (src && isRemoteUrl(src)) {
      const ext = urlExtension(src, ".mp4");
      const finalDest = dest.replace(path.extname(dest), ext);
      try {
        await downloadFile(src, finalDest);
        output.push(finalDest);
        continue;
      } catch (err) {
        console.error(`Failed to download video ${src}: ${err.message}`);
      }
    }
  }
  return output;
};

const normalizeToPublic = (absolutePath) =>
  absolutePath.replace(ASSET_ROOT, "").split(path.sep).join("/") || "";

const main = async () => {
  if (!fs.existsSync(DATA_PATH)) {
    console.error("Missing data/imk-market.json");
    process.exit(1);
  }
  const data = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
  const fallbackImages = findFallbackImages();
  if (!fallbackImages.length) {
    console.warn("No fallback images found under public/assets/products.");
  }

  if (!SKIP_CATEGORIES && Array.isArray(data.categories)) {
    for (const category of data.categories) {
      const slug = slugify(category.id || category.name || "category");
      const targetDir = path.join(CATEGORY_ROOT, slug);
      const sources = [];
      if (category.image) sources.push(category.image);
      const images = await ensureImages({
        sources,
        targetDir,
        targetPrefix: "image",
        fallbackImages,
      });
      if (images.length) {
        category.image = `/assets/categories/${slug}/${path.basename(images[0])}`;
      }
    }
  }

  if (Array.isArray(data.products)) {
    for (const product of data.products) {
      const id = product.id || `prod-${Math.random().toString(36).slice(2, 8)}`;
      product.id = id;
      const targetDir = path.join(PRODUCT_ROOT, id);
      const sources = [];
      if (Array.isArray(product.images)) {
        product.images.forEach((img) => sources.push(img));
      }
      if (product.image) sources.unshift(product.image);

      const images = await ensureImages({
        sources,
        targetDir,
        targetPrefix: "image",
        fallbackImages,
      });
      const videos = await ensureVideos({
        sources: Array.isArray(product.videos) ? product.videos : product.video ? [product.video] : [],
        targetDir,
      });

      product.images = images.map((img) => `/assets/products/${id}/${path.basename(img)}`);
      product.image = product.images[0];
      if (videos.length) {
        product.videos = videos.map((vid) => `/assets/products/${id}/${path.basename(vid)}`);
      } else {
        product.videos = [];
      }
    }
  }

  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
  console.log("✅ Local media populated and imk-market.json updated.");
};

main().catch((err) => {
  console.error("❌ Failed to populate local media:", err.message);
  process.exit(1);
});
