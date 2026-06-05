const fs = require('fs');
const path = require('path');

const DEFAULT_DATA = {
    products: [
        {
            id: 1,
            name: 'boAt Rockerz Wireless Headphones',
            price: 1999,
            image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
            description: 'Comfortable wireless headphones with clear bass, Bluetooth support, and long battery backup.'
        },
        {
            id: 2,
            name: 'Fastrack Analog Watch',
            price: 2499,
            image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',
            description: 'Stylish everyday watch with a clean dial, strong strap, and premium casual look.'
        },
        {
            id: 3,
            name: 'RGB Mechanical Keyboard',
            price: 3499,
            image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500',
            description: 'Mechanical keyboard with tactile keys, RGB lights, and a strong build for gaming and study.'
        },
        {
            id: 4,
            name: 'Samsung Galaxy Backpack',
            price: 1299,
            image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500',
            description: 'Lightweight backpack with laptop space, bottle holder, and daily college-friendly storage.'
        },
        {
            id: 5,
            name: 'Noise Smart Watch',
            price: 2799,
            image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500',
            description: 'Smart watch with fitness tracking, call alerts, heart-rate monitoring, and modern display.'
        },
        {
            id: 6,
            name: 'Portronics Fast Charger',
            price: 899,
            image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=500',
            description: 'Compact fast charger suitable for phones, tablets, and daily travel use.'
        }
    ],
    users: [
        { id: 1, name: 'Kenneth', email: 'test@user.com', password: 'password123' }
    ],
    orders: []
};

function loadSeedData() {
    try {
        const dbPath = path.join(__dirname, '..', 'backend', 'db.json');
        const fileContents = fs.readFileSync(dbPath, 'utf8');
        const parsed = JSON.parse(fileContents);

        return {
            products: Array.isArray(parsed.products) ? parsed.products : DEFAULT_DATA.products,
            users: Array.isArray(parsed.users) ? parsed.users : DEFAULT_DATA.users,
            orders: Array.isArray(parsed.orders) ? parsed.orders : DEFAULT_DATA.orders
        };
    } catch (error) {
        return JSON.parse(JSON.stringify(DEFAULT_DATA));
    }
}

const store = global.__KENNETH_MART_STORE__ || (global.__KENNETH_MART_STORE__ = loadSeedData());

function clone(value) {
    return JSON.parse(JSON.stringify(value));
}

function getNextId(items) {
    return items.length ? Math.max(...items.map(item => item.id)) + 1 : 1;
}

function sendJson(res, statusCode, payload) {
    res.statusCode = statusCode;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.end(JSON.stringify(payload));
}

function handleOptions(res) {
    res.statusCode = 204;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.end();
}

async function readBody(req) {
    const chunks = [];

    for await (const chunk of req) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }

    if (chunks.length === 0) {
        return {};
    }

    try {
        return JSON.parse(Buffer.concat(chunks).toString('utf8'));
    } catch (error) {
        return null;
    }
}

function handleGetProducts(res) {
    sendJson(res, 200, clone(store.products));
}

function handleGetProductById(res, id) {
    const product = store.products.find(item => item.id === Number(id));

    if (!product) {
        sendJson(res, 404, { success: false, message: 'Product not found' });
        return;
    }

    sendJson(res, 200, clone(product));
}

function handleRegister(res, body) {
    const { name, email, password } = body || {};

    if (!name || !email || !password) {
        sendJson(res, 400, { success: false, message: 'Name, email, and password are required.' });
        return;
    }

    const existingUser = store.users.find(user => user.email.toLowerCase() === String(email).toLowerCase());

    if (existingUser) {
        sendJson(res, 409, { success: false, message: 'Email is already registered.' });
        return;
    }

    const user = {
        id: getNextId(store.users),
        name: String(name).trim(),
        email: String(email).trim().toLowerCase(),
        password: String(password)
    };

    store.users.push(user);

    sendJson(res, 201, {
        success: true,
        message: 'Registration successful.',
        user: { id: user.id, name: user.name, email: user.email }
    });
}

function handleLogin(res, body) {
    const { email, password } = body || {};
    const user = store.users.find(item => item.email === String(email || '').toLowerCase() && item.password === password);

    if (!user) {
        sendJson(res, 401, { success: false, message: 'Invalid email or password.' });
        return;
    }

    sendJson(res, 200, {
        success: true,
        message: 'Logged in successfully.',
        user: { id: user.id, name: user.name, email: user.email }
    });
}

function handleOrder(res, body) {
    const { userId, cartItems, paymentMethod } = body || {};
    const allowedPaymentMethods = ['UPI', 'Card', 'Cash on Delivery'];

    if (!userId) {
        sendJson(res, 401, { success: false, message: 'Please login before placing an order.' });
        return;
    }

    if (!Array.isArray(cartItems) || cartItems.length === 0) {
        sendJson(res, 400, { success: false, message: 'Cart is empty.' });
        return;
    }

    if (!allowedPaymentMethods.includes(paymentMethod)) {
        sendJson(res, 400, { success: false, message: 'Please select a valid payment method.' });
        return;
    }

    const user = store.users.find(item => item.id === Number(userId));

    if (!user) {
        sendJson(res, 404, { success: false, message: 'User not found.' });
        return;
    }

    const items = cartItems.map(cartItem => {
        const product = store.products.find(item => item.id === Number(cartItem.id));
        const quantity = Number(cartItem.quantity);

        if (!product || !Number.isInteger(quantity) || quantity < 1) {
            return null;
        }

        return {
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity,
            subtotal: Number((product.price * quantity).toFixed(2))
        };
    });

    if (items.some(item => item === null)) {
        sendJson(res, 400, { success: false, message: 'Cart contains an invalid product.' });
        return;
    }

    const total = Number(items.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2));
    const order = {
        id: getNextId(store.orders),
        userId: user.id,
        items,
        total,
        paymentMethod,
        paymentStatus: paymentMethod === 'Cash on Delivery' ? 'Pending' : 'Paid',
        date: new Date().toISOString()
    };

    store.orders.push(order);

    sendJson(res, 201, { success: true, message: 'Order placed successfully.', order });
}

function handleGetOrders(res) {
    sendJson(res, 200, clone(store.orders));
}

async function handleRequest(req, res, pathname) {
    const normalizedPath = pathname.replace(/\/$/, '');

    if (req.method === 'OPTIONS') {
        handleOptions(res);
        return;
    }

    if (normalizedPath === '/api' || normalizedPath === '/api/') {
        sendJson(res, 200, {
            message: 'Kenneth Mart API is working',
            routes: ['/api/products', '/api/register', '/api/login', '/api/orders']
        });
        return;
    }

    if (normalizedPath === '/api/products' && req.method === 'GET') {
        handleGetProducts(res);
        return;
    }

    if (normalizedPath.startsWith('/api/products/') && req.method === 'GET') {
        const id = normalizedPath.split('/').pop();
        handleGetProductById(res, id);
        return;
    }

    if (normalizedPath === '/api/register' && req.method === 'POST') {
        const body = await readBody(req);

        if (body === null) {
            sendJson(res, 400, { success: false, message: 'Invalid JSON body.' });
            return;
        }

        handleRegister(res, body);
        return;
    }

    if (normalizedPath === '/api/login' && req.method === 'POST') {
        const body = await readBody(req);

        if (body === null) {
            sendJson(res, 400, { success: false, message: 'Invalid JSON body.' });
            return;
        }

        handleLogin(res, body);
        return;
    }

    if (normalizedPath === '/api/orders' && req.method === 'POST') {
        const body = await readBody(req);

        if (body === null) {
            sendJson(res, 400, { success: false, message: 'Invalid JSON body.' });
            return;
        }

        handleOrder(res, body);
        return;
    }

    if (normalizedPath === '/api/orders' && req.method === 'GET') {
        handleGetOrders(res);
        return;
    }

    sendJson(res, 404, { success: false, message: 'Route not found' });
}

module.exports = { handleRequest };