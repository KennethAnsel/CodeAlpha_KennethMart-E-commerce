// Detect environment and set API URL
const isGitHubPages = window.location.hostname.includes('github.io');

function resolveApiUrl() {
    const urlOverride = new URLSearchParams(window.location.search).get('apiUrl');

    if (urlOverride) {
        return urlOverride.replace(/\/$/, '');
    }

    if (window.API_URL) {
        return String(window.API_URL).replace(/\/$/, '');
    }

    if (window.location.protocol === 'file:') {
        return 'http://localhost:5000/api';
    }

    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        if (window.location.port && window.location.port !== '5000') {
            return 'http://localhost:5000/api';
        }
    }

    return `${window.location.origin}/api`;
}

const API_URL = resolveApiUrl();

function resolvePageUrl(pageName) {
    const currentPath = window.location.pathname;
    const pathPrefix = currentPath.endsWith('/')
        ? currentPath
        : currentPath.slice(0, currentPath.lastIndexOf('/') + 1);

    return `${window.location.origin}${pathPrefix}${pageName}`;
}

const CART_KEY = 'kenneth_mart_cart';
const USER_KEY = 'kenneth_mart_user';

let cart = JSON.parse(localStorage.getItem(CART_KEY)) || [];
let currentUser = JSON.parse(localStorage.getItem(USER_KEY)) || null;

document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
    updateCartUI();

    if (document.getElementById('products-container')) {
        if (isGitHubPages) {
            document.getElementById('products-container').innerHTML = '<p class="message error">GitHub Pages cannot run the backend server. This demo works locally only. To run locally:<br><br>1. Clone: git clone https://github.com/KennethAnsel/CodeAlpha_KennethMart-E-commerce.git<br>2. Install: cd backend && npm install<br>3. Start: npm start<br>4. Visit: http://localhost:5000</p>';
        } else {
            fetchProducts();
            bindAuthForms();
        }
    }

    const detailsContainer = document.getElementById('details-container');
    if (detailsContainer) {
        if (isGitHubPages) {
            detailsContainer.innerHTML = '<p class="message error">GitHub Pages requires the backend to run locally.</p>';
        } else {
            const productId = new URLSearchParams(window.location.search).get('id');
            productId ? fetchProductDetail(productId) : showProductError('Product ID missing.');
        }
    }
});

// Loading all products from backend
async function fetchProducts() {
    const container = document.getElementById('products-container');

    try {
        const res = await fetch(`${API_URL}/products`);
        const products = await res.json();

        container.innerHTML = products.map(product => `
            <div class="card">
                <span class="product-tag">Best Deal</span>
                <img src="${product.image}" alt="${product.name}">
                <h3>${product.name}</h3>
                <p class="card-desc">${product.description}</p>
                <p class="price">${formatPrice(product.price)}</p>
                <div class="card-actions">
                    <button onclick="viewDetails(${product.id})">View Details</button>
                    <button class="success-btn" onclick="addToCart(${product.id}, '${escapeText(product.name)}')">Add to Cart</button>
                </div>
            </div>
        `).join('');
    } catch (err) {
        container.innerHTML = '<p class="message error">Unable to load products. Start the backend server first.</p>';
    }
}

function viewDetails(id) {
    window.location.href = `${resolvePageUrl('product.html')}?id=${id}`;
}

function goToStore() {
    window.location.href = resolvePageUrl('index.html');
}

// Loading one product for the details page
async function fetchProductDetail(id) {
    try {
        const res = await fetch(`${API_URL}/products/${id}`);

        if (!res.ok) {
            showProductError('Product not found.');
            return;
        }

        const product = await res.json();
        document.getElementById('details-container').innerHTML = `
            <img src="${product.image}" alt="${product.name}">
            <div>
                <h2>${product.name}</h2>
                <p class="price detail-price">${formatPrice(product.price)}</p>
                <p class="detail-description">${product.description}</p>
                <div class="detail-points">
                    <span>Free delivery</span>
                    <span>7 day replacement</span>
                    <span>Secure payment</span>
                </div>
                <button class="success-btn" onclick="addToCart(${product.id}, '${escapeText(product.name)}')">Add to Cart</button>
            </div>
        `;
    } catch (err) {
        showProductError('Unable to load product details.');
    }
}

function showProductError(message) {
    const container = document.getElementById('details-container');
    container.innerHTML = `<p class="message error">${message}</p>`;
}

function addToCart(id, name) {
    const existing = cart.find(item => item.id === id);

    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ id, name, quantity: 1 });
    }

    saveCart();
    updateCartUI();
    showMessage(`${name} added to cart.`);
}

function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    saveCart();
    updateCartUI();
}

function changeQuantity(id, amount) {
    const item = cart.find(cartItem => cartItem.id === id);
    if (!item) return;

    item.quantity += amount;

    if (item.quantity < 1) {
        removeFromCart(id);
        return;
    }

    saveCart();
    updateCartUI();
}

function saveCart() {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

async function updateCartUI() {
    const cartItemsDiv = document.getElementById('cart-items');
    const cartTotalSpan = document.getElementById('cart-total');
    const cartCountSpan = document.getElementById('cart-count');

    if (cartCountSpan) {
        cartCountSpan.innerText = cart.reduce((sum, item) => sum + item.quantity, 0);
    }

    if (!cartItemsDiv || !cartTotalSpan) return;

    if (cart.length === 0) {
        cartItemsDiv.innerHTML = '<p class="empty-cart">Your cart is empty.</p>';
        cartTotalSpan.innerText = formatPrice(0);
        return;
    }

    try {
        const res = await fetch(`${API_URL}/products`);
        const products = await res.json();
        let total = 0;

        cartItemsDiv.innerHTML = cart.map(item => {
            const product = products.find(productItem => productItem.id === item.id);
            const price = product ? product.price : 0;
            const subtotal = price * item.quantity;
            total += subtotal;

            return `
                <div class="cart-item">
                    <div>
                        <strong>${item.name}</strong>
                        <p>${formatPrice(price)} each</p>
                    </div>
                    <div class="quantity-controls">
                        <button onclick="changeQuantity(${item.id}, -1)">-</button>
                        <span>${item.quantity}</span>
                        <button onclick="changeQuantity(${item.id}, 1)">+</button>
                        <button class="danger-btn" onclick="removeFromCart(${item.id})">Remove</button>
                    </div>
                </div>
            `;
        }).join('');

        cartTotalSpan.innerText = formatPrice(total);
    } catch (err) {
        cartItemsDiv.innerHTML = '<p class="message error">Unable to calculate cart total.</p>';
    }
}

async function checkout() {
    if (!currentUser) {
        showMessage('Please login or register before placing an order.', 'error');
        return;
    }

    if (cart.length === 0) {
        showMessage('Your cart is empty.', 'error');
        return;
    }

    const selectedPayment = document.querySelector('input[name="payment-method"]:checked');
    const paymentMethod = selectedPayment ? selectedPayment.value : '';

    if (!paymentMethod) {
        showMessage('Please select a payment method.', 'error');
        return;
    }

    try {
        const res = await fetch(`${API_URL}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUser.id, cartItems: cart, paymentMethod })
        });
        const data = await res.json();

        if (!res.ok) {
            showMessage(data.message || 'Order failed.', 'error');
            return;
        }

        showMessage(`Order placed successfully. Order ID: #${String(data.order.id).padStart(4, '0')} | Payment: ${data.order.paymentMethod}`);
        cart = [];
        saveCart();
        updateCartUI();
    } catch (err) {
        showMessage('Unable to place order. Please check if the backend server is running.', 'error');
    }
}

function bindAuthForms() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    loginForm.addEventListener('submit', async event => {
        event.preventDefault();
        await authenticate('login', {
            email: document.getElementById('login-email').value,
            password: document.getElementById('login-password').value
        });
    });

    registerForm.addEventListener('submit', async event => {
        event.preventDefault();
        await authenticate('register', {
            name: document.getElementById('register-name').value,
            email: document.getElementById('register-email').value,
            password: document.getElementById('register-password').value
        });
    });
}

async function authenticate(mode, payload) {
    try {
        const res = await fetch(`${API_URL}/${mode}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();

        if (!res.ok) {
            showMessage(data.message || 'Authentication failed.', 'error');
            return;
        }

        currentUser = data.user;
        localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
        updateAuthUI();
        showMessage(data.message);
    } catch (err) {
        showMessage('Login/Register failed. Please check if the backend server is running.', 'error');
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem(USER_KEY);
    updateAuthUI();
}

function updateAuthUI() {
    const authStatus = document.getElementById('auth-status');
    const logoutBtn = document.getElementById('logout-btn');
    const authForms = document.getElementById('auth-forms');

    if (authStatus) {
        authStatus.innerText = currentUser ? `Logged in as ${currentUser.name}` : 'Not logged in';
    }

    if (logoutBtn) {
        logoutBtn.hidden = !currentUser;
    }

    if (authForms) {
        authForms.hidden = Boolean(currentUser);
    }
}

function escapeText(text) {
    return String(text).replaceAll("'", "\\'");
}

function formatPrice(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(amount);
}

function showMessage(message, type = 'success') {
    const notification = document.getElementById('notification');
    if (!notification) return;

    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.hidden = false;

    setTimeout(() => {
        notification.hidden = true;
    }, 3500);
}
