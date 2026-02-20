import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_PATH = path.join(__dirname, '..', 'data', 'imk-market.json');
const PRODUCT_COUNT = 100;

function generateProducts() {
    const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
    const categories = data.categories.map(c => c.id);

    console.log(`🚀 Adding ${PRODUCT_COUNT} products to imk-market.json...`);

    const newProducts = [];
    const now = new Date().toISOString();

    for (let i = 1; i <= PRODUCT_COUNT; i++) {
        const id = `new-prod-${i.toString().padStart(3, '0')}`;
        const catId = categories[Math.floor(Math.random() * categories.length)];

        const product = {
            id: id,
            name: `Premium Product ${i}`,
            description: `This is a high-quality product description for Premium Product ${i}. It features exceptional durability and modern design.`,
            price: Math.floor(Math.random() * 500) + 20,
            originalPrice: Math.floor(Math.random() * 700) + 100,
            image: `/assets/products/${id}/image-1.jpg`,
            images: Array.from({ length: 8 }, (_, j) => `/assets/products/${id}/image-${j + 1}.jpg`),
            videos: [`/assets/products/${id}/video.mp4`],
            categoryId: catId,
            rating: (Math.random() * 1.5 + 3.5).toFixed(1),
            reviewCount: Math.floor(Math.random() * 500) + 10,
            inStock: true,
            freeShipping: Math.random() > 0.3,
            badge: i % 10 === 0 ? "Best Seller" : (i % 5 === 0 ? "New Arrival" : null),
            createdAt: now,
            sku: `IMK-NEW-${i.toString().padStart(4, '0')}`,
            stock: Math.floor(Math.random() * 100) + 5,
            lowStockThreshold: 10,
            lastRestocked: now,
            status: "active"
        };
        newProducts.push(product);
    }

    data.products = data.products.concat(newProducts);
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
    console.log('✅ Successfully updated imk-market.json!');
}

generateProducts();
