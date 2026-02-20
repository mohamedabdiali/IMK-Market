import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_DIR = path.join(__dirname, '..', 'public', 'assets', 'products');
const IMAGE_COUNT_PER_PRODUCT = 8;
const PRODUCT_COUNT = 100;
const VIDEO_URL = 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'; // More reliable sample video

async function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => { });
            reject(err);
        });
    });
}

async function generateAssets() {
    console.log(`🚀 Starting asset generation for ${PRODUCT_COUNT} products...`);

    if (!fs.existsSync(BASE_DIR)) {
        fs.mkdirSync(BASE_DIR, { recursive: true });
    }

    for (let i = 1; i <= PRODUCT_COUNT; i++) {
        const productId = `new-prod-${i.toString().padStart(3, '0')}`;
        const productDir = path.join(BASE_DIR, productId);

        if (!fs.existsSync(productDir)) {
            fs.mkdirSync(productDir, { recursive: true });
        }

        console.log(`📦 Generating assets for ${productId}...`);

        // Download 8 images from Unsplash
        for (let j = 1; j <= IMAGE_COUNT_PER_PRODUCT; j++) {
            const imgUrl = `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 1000000000)}?w=800&q=80`;
            const imgPath = path.join(productDir, `image-${j}.jpg`);
            try {
                await downloadFile(imgUrl, imgPath);
            } catch (e) {
                console.error(`❌ Failed to download image ${j} for ${productId}`);
            }
        }

        // "Download" 1 video (using a placeholder)
        const videoPath = path.join(productDir, 'video.mp4');
        try {
            await downloadFile(VIDEO_URL, videoPath);
        } catch (e) {
            console.error(`❌ Failed to download video for ${productId}`);
        }
    }

    console.log('✅ Asset generation complete!');
}

generateAssets().catch(console.error);
