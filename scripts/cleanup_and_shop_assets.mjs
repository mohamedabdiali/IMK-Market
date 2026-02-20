import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_PATH = path.join(__dirname, '..', 'data', 'imk-market.json');
const ASSETS_DIR = path.join(__dirname, '..', 'public', 'assets', 'categories', 'shop');
const VIDEO_URL = 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

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

async function cleanupAndAddShopAssets() {
    console.log('🧹 Starting cleanup and Shop category media addition...');

    // 1. Cleanup imk-market.json
    const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
    const initialProductCount = data.products.length;

    // Filter products: must have at least one image or video
    // Note: Some images are base64 strings or URLs. 
    // We check if 'image' or 'images' (array) or 'videos' (array) exists and is not empty.
    data.products = data.products.filter(p => {
        const hasMainImage = p.image && String(p.image).trim().length > 0;
        const hasExtraImages = Array.isArray(p.images) && p.images.length > 0;
        const hasVideos = Array.isArray(p.videos) && p.videos.length > 0;
        return hasMainImage || hasExtraImages || hasVideos;
    });

    console.log(`✅ Deleted ${initialProductCount - data.products.length} products without media.`);

    // 2. Ensure Shop category exists and has media
    let shopCategory = data.categories.find(c => c.name === 'Shop');
    const shopId = shopCategory ? shopCategory.id : 'shop-cat-001';

    if (!shopCategory) {
        console.log('📦 Creating "Shop" category...');
        shopCategory = {
            id: shopId,
            name: 'Shop',
            image: '/assets/categories/shop/image-1.jpg',
            createdAt: new Date().toISOString()
        };
        data.categories.push(shopCategory);
    } else {
        shopCategory.image = '/assets/categories/shop/image-1.jpg';
    }

    // 3. Download Shop assets
    if (!fs.existsSync(ASSETS_DIR)) {
        fs.mkdirSync(ASSETS_DIR, { recursive: true });
    }

    console.log('📥 Downloading Shop category images...');
    for (let i = 1; i <= 2; i++) {
        const imgUrl = `https://images.unsplash.com/photo-${1600000000000 + Math.floor(Math.random() * 1000000000)}?w=800&q=80`;
        await downloadFile(imgUrl, path.join(ASSETS_DIR, `image-${i}.jpg`));
    }

    console.log('📥 Downloading Shop category video...');
    try {
        await downloadFile(VIDEO_URL, path.join(ASSETS_DIR, 'video.mp4'));
    } catch (e) {
        console.error('❌ Failed to download Shop category video.');
    }

    // Save data
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
    console.log('✨ Cleanup and asset addition complete!');
}

cleanupAndAddShopAssets().catch(console.error);
