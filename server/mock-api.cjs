require('dotenv').config();

const express = require('express');
const cors = require('cors');
const app = express();
const BODY_LIMIT = process.env.API_BODY_LIMIT || '25mb';
app.use(cors());
app.use(express.json({ limit: BODY_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: BODY_LIMIT }));

const PORT = Number(process.env.API_PORT || process.env.PORT || 5050);

const categories = [
  { id: 'c1', name: 'Electronics', image: '📱' },
  { id: 'c2', name: 'Fashion', image: '👗' },
  { id: 'c3', name: 'Home', image: '🏠' },
];

const products = [
  { id: '1', name: 'Wireless Headphones', description: 'Comfortable over-ear headphones with noise cancellation', price: 79.99, originalPrice: 99.99, image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop', images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop', 'https://images.unsplash.com/photo-1484704849700-f032a568e945?w=400&h=400&fit=crop'], videos: [], categoryId: 'c1', rating: 4.5, reviewCount: 12, inStock: true, freeShipping: true, badge: 'Popular', status: 'active', createdAt: new Date().toISOString() },
  { id: '2', name: 'Running Shoes', description: 'Lightweight running shoes for comfort', price: 89.99, originalPrice: 129.99, image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop', images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop'], videos: [], categoryId: 'c2', rating: 4.8, reviewCount: 34, inStock: true, freeShipping: false, badge: 'Bestseller', status: 'active', createdAt: new Date().toISOString() },
  { id: '3', name: 'Desk Lamp', description: 'Modern LED desk lamp with adjustable brightness', price: 34.99, originalPrice: 49.99, image: 'https://images.unsplash.com/photo-1565636192335-14f7bb2ce841?w=400&h=400&fit=crop', images: ['https://images.unsplash.com/photo-1565636192335-14f7bb2ce841?w=400&h=400&fit=crop', 'https://images.unsplash.com/photo-1565636192335-14f7bb2ce841?w=400&h=400&fit=crop'], videos: [], categoryId: 'c3', rating: 4.2, reviewCount: 8, inStock: true, freeShipping: true, badge: null, status: 'active', createdAt: new Date().toISOString() },
  { id: '4', name: 'Phone Case', description: 'Durable protective phone case', price: 19.99, image: 'https://images.unsplash.com/photo-1614043666235-7df60b5b5e0f?w=400&h=400&fit=crop', images: ['https://images.unsplash.com/photo-1614043666235-7df60b5b5e0f?w=400&h=400&fit=crop', 'https://images.unsplash.com/photo-1614043666235-7df60b5b5e0f?w=400&h=400&fit=crop'], videos: [], categoryId: 'c1', rating: 4.3, reviewCount: 20, inStock: true, freeShipping: false, badge: null, status: 'active', createdAt: new Date().toISOString() },
  { id: '5', name: 'Designer T-Shirt', description: '100% cotton premium designer t-shirt', price: 49.99, originalPrice: 79.99, image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop', images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop'], videos: [], categoryId: 'c2', rating: 4.6, reviewCount: 15, inStock: true, freeShipping: false, badge: null, status: 'active', createdAt: new Date().toISOString() },
  { id: '6', name: 'Coffee Maker', description: 'Premium automatic coffee maker machine', price: 129.99, originalPrice: 179.99, image: 'https://images.unsplash.com/photo-1517668808822-9ebb02ae2a0e?w=400&h=400&fit=crop', images: ['https://images.unsplash.com/photo-1517668808822-9ebb02ae2a0e?w=400&h=400&fit=crop', 'https://images.unsplash.com/photo-1517668808822-9ebb02ae2a0e?w=400&h=400&fit=crop'], videos: [], categoryId: 'c3', rating: 4.7, reviewCount: 9, inStock: true, freeShipping: true, badge: 'Top Rated', status: 'active', createdAt: new Date().toISOString() },
];

const flashDeals = {
  title: 'Flash Deals',
  subtitle: 'Limited time offers - up to 30% off.',
  endsAt: null,
  productIds: [],
  cards: [],
};

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.get('/api/categories', (req, res) => {
  const categoryImages = {
    'c1': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&h=200&fit=crop',
    'c2': 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&h=200&fit=crop',
    'c3': 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=200&h=200&fit=crop'
  };
  const result = categories.map(c => ({
    id: c.id,
    name: c.name,
    image: categoryImages[c.id] || c.image,
    video: null,
    productCount: products.filter(p => p.categoryId === c.id).length
  }));
  res.json(result);
});

app.get('/api/flash-deals', (_req, res) => {
  res.json(flashDeals);
});

app.get('/api/flash-ads', (_req, res) => {
  res.json({ ads: [] });
});

app.get('/api/products', (req, res) => {
  const { category, q, sort } = req.query;
  let result = products.slice();
  if (category) {
    result = result.filter(p => {
      const cat = categories.find(c => c.id === p.categoryId);
      return (cat && cat.name === category) || p.categoryId === category;
    });
  }
  if (q) {
    const qq = q.toString().toLowerCase();
    result = result.filter(p => p.name.toLowerCase().includes(qq) || p.description.toLowerCase().includes(qq));
  }
  if (sort === 'price-low') result.sort((a,b)=>a.price-b.price);
  if (sort === 'price-high') result.sort((a,b)=>b.price-a.price);
  if (sort === 'rating') result.sort((a,b)=>b.rating-a.rating);
  res.json(result.map(p=>({ id: p.id, name: p.name, description: p.description, price: p.price, originalPrice: p.originalPrice, image: p.image, images: p.images.length? p.images : [p.image], videos: p.videos || [], category: categories.find(c=>c.id===p.categoryId)?.name || 'Uncategorized', rating: p.rating, reviewCount: p.reviewCount, inStock: p.inStock, freeShipping: p.freeShipping, badge: p.badge })));
});

app.get('/api/products/:id', (req, res) => {
  const p = products.find(x => x.id === req.params.id);
  if (!p) return res.status(404).json({ error: 'Not found' });
  res.json({ id: p.id, name: p.name, description: p.description, price: p.price, originalPrice: p.originalPrice, image: p.image, images: p.images.length? p.images : [p.image], videos: p.videos || [], category: categories.find(c=>c.id===p.categoryId)?.name || 'Uncategorized', rating: p.rating, reviewCount: p.reviewCount, inStock: p.inStock, freeShipping: p.freeShipping, badge: p.badge });
});

app.post('/api/orders', (req, res) => {
  const id = 'ORD-' + Math.random().toString(36).slice(2,9).toUpperCase();
  return res.json({ id, total: 0, status: 'pending' });
});

app.post('/api/payments/initiate', (req, res) => {
  return res.json({ id: 'PAY-FAKE', status: 'initialized', redirectUrl: null });
});

if (require.main === module) {
  app.listen(PORT, () => console.log('Mock API listening on', PORT));
}
