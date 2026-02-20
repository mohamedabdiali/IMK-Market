import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_PATH = path.join(__dirname, '..', 'data', 'imk-market.json');
const ASSETS_DIR = path.join(__dirname, '..', 'public', 'assets', 'categories', 'shop');
const VIDEO_URL = 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

async function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;
        client.get(url, (response) => {
            if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                return downloadFile(response.headers.location, dest).then(resolve).catch(reject);
            }
            if (response.statusCode !== 200) {
                return reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
            }
            const file = fs.createWriteStream(dest);
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

async function fixAssetsAndData() {
    console.log('🚀 Fixing missing images and improving data structure...');

    // 1. Update imk-market.json to use high-quality Unsplash URLs for main images
    // and local paths for extra images (which we will re-download carefully)
    const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));

    console.log('📝 Updating imk-market.json product images...');
    data.products.forEach(p => {
        if (p.id.startsWith('new-prod-')) {
            // Ensure main image is a direct Unsplash URL for reliability
            const randomId = 1500000000000 + Math.floor(Math.random() * 1000000000);
            p.image = `https://images.unsplash.com/photo-${randomId}?w=800&q=80`;

            // Re-map extra images to local paths but prefix them with /
            p.images = p.images.map(img => img.startsWith('/') ? img : '/' + img);
            p.videos = p.videos.map(v => v.startsWith('/') ? v : '/' + v);
        }
    });

    // Ensure Shop category uses a reliable image
    let shopCategory = data.categories.find(c => c.name === 'Shop');
    if (shopCategory) {
        shopCategory.image = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80';
    }

    // 2. Clear corrupted assets and re-download
    if (!fs.existsSync(ASSETS_DIR)) {
        fs.mkdirSync(ASSETS_DIR, { recursive: true });
    }

    console.log('📥 Re-downloading Shop category images...');
    const images = [
        'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80',
        'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=800&q=80'
    ];

    for (let i = 0; i < images.length; i++) {
        try {
            await downloadFile(images[i], path.join(ASSETS_DIR, `image-${i + 1}.jpg`));
            console.log(`✅ Downloaded shop image ${i + 1}`);
        } catch (e) {
            console.error(`❌ Failed to download shop image ${i + 1}: ${e.message}`);
        }
    }

    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
    console.log('✨ Fix complete and imk-market.json updated!');
}

fixAssetsAndData().catch(console.error);
