import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app  = express();
const PORT = 5000;
const DB_PATH       = path.join(__dirname, 'db.json');
const FRONTEND_PATH = path.join(__dirname, '..', 'frontend');

const defaultData = {
  products: [
    { id: 1, name: 'boAt Rockerz Wireless Headphones', price: 1999, image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500', description: 'Comfortable wireless headphones with clear bass, Bluetooth support, and long battery backup.' },
    { id: 2, name: 'Fastrack Analog Watch', price: 2499, image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500', description: 'Stylish everyday watch with a clean dial, strong strap, and premium casual look.' },
    { id: 3, name: 'RGB Mechanical Keyboard', price: 3499, image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500', description: 'Mechanical keyboard with tactile keys, RGB lights, and a strong build for gaming and study.' },
    { id: 4, name: 'Samsung Galaxy Backpack', price: 1299, image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500', description: 'Lightweight backpack with laptop space, bottle holder, and daily college-friendly storage.' },
    { id: 5, name: 'Noise Smart Watch', price: 2799, image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500', description: 'Smart watch with fitness tracking, call alerts, heart-rate monitoring, and modern display.' },
    { id: 6, name: 'Portronics Fast Charger', price: 899, image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=500', description: 'Compact fast charger suitable for phones, tablets, and daily travel use.' }
  ],
  users:  [{ id: 1, name: 'Kenneth', email: 'test@user.com', password: 'password123' }],
  orders: []
};

function ensureDatabase() { if (!fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH, JSON.stringify(defaultData, null, 2)); }
function readDb()      { ensureDatabase(); return JSON.parse(fs.readFileSync(DB_PATH, 'utf8')); }
function writeDb(data) { fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2)); }
function nextId(arr)   { return arr.length ? Math.max(...arr.map(i => i.id)) + 1 : 1; }

app.use(cors());
app.use(express.json());
app.use(express.static(FRONTEND_PATH));

app.get('/api', (req, res) => res.json({ message: 'Kenneth Mart API is running' }));
app.get('/api/products', (req, res) => res.json(readDb().products));
app.get('/api/products/:id', (req, res) => {
  const p = readDb().products.find(p => p.id === Number(req.params.id));
  if (!p) return res.status(404).json({ success: false, message: 'Product not found.' });
  res.json(p);
});
app.post('/api/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ success: false, message: 'All fields are required.' });
  const db = readDb();
  if (db.users.find(u => u.email.toLowerCase() === email.toLowerCase()))
    return res.status(409).json({ success: false, message: 'Email already registered.' });
  const user = { id: nextId(db.users), name: name.trim(), email: email.trim().toLowerCase(), password };
  db.users.push(user); writeDb(db);
  res.status(201).json({ success: true, user: { id: user.id, name: user.name, email: user.email } });
});
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const user = readDb().users.find(u => u.email === email?.toLowerCase() && u.password === password);
  if (!user) return res.status(401).json({ success: false, message: 'Invalid email or password.' });
  res.json({ success: true, user: { id: user.id, name: user.name, email: user.email } });
});
app.post('/api/orders', (req, res) => {
  const { userId, cartItems, paymentMethod } = req.body;
  if (!userId) return res.status(401).json({ success: false, message: 'Please login first.' });
  if (!Array.isArray(cartItems) || !cartItems.length) return res.status(400).json({ success: false, message: 'Cart is empty.' });
  if (!['UPI', 'Card', 'Cash on Delivery'].includes(paymentMethod)) return res.status(400).json({ success: false, message: 'Invalid payment method.' });
  const db = readDb();
  const user = db.users.find(u => u.id === Number(userId));
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
  const items = cartItems.map(ci => {
    const prod = db.products.find(p => p.id === Number(ci.id));
    const qty = Number(ci.quantity);
    if (!prod || qty < 1) return null;
    return { productId: prod.id, name: prod.name, price: prod.price, quantity: qty, subtotal: prod.price * qty };
  });
  if (items.some(i => !i)) return res.status(400).json({ success: false, message: 'Invalid product in cart.' });
  const order = { id: nextId(db.orders), userId: user.id, items, total: items.reduce((s,i) => s+i.subtotal,0), paymentMethod, paymentStatus: paymentMethod === 'Cash on Delivery' ? 'Pending' : 'Paid', date: new Date().toISOString() };
  db.orders.push(order); writeDb(db);
  res.status(201).json({ success: true, order });
});
app.get('/api/orders', (req, res) => res.json(readDb().orders));
app.get('*', (req, res) => res.sendFile(path.join(FRONTEND_PATH, 'index.html')));

app.listen(PORT, () => { ensureDatabase(); console.log(`\n  Kenneth Mart → http://localhost:${PORT}\n`); });