/* =============================================
   KENNETH MART — app.js
   Works on: localhost:5000, VS Code Live Server,
             Vercel deployment, any domain
   ============================================= */

// ── API URL — smart detection ─────────────────
function resolveApiUrl() {
  const h = window.location.hostname;
  const port = window.location.port;
  const proto = window.location.protocol;

  // file:// → must use local backend
  if (proto === 'file:') return 'http://localhost:5000/api';

  // Live Server default ports (5500, 5501, 3000, 8080, 8000) → proxy to backend
  const livePorts = ['5500', '5501', '3000', '8080', '8000', '4200'];
  if ((h === 'localhost' || h === '127.0.0.1') && livePorts.includes(port)) {
    return 'http://localhost:5000/api';
  }

  // Running on localhost:5000 (backend serves frontend directly)
  if ((h === 'localhost' || h === '127.0.0.1') && port === '5000') {
    return 'http://localhost:5000/api';
  }

  // Vercel or any other deployed domain → same origin /api
  return window.location.origin + '/api';
}

const API = resolveApiUrl();

// Storage keys
const CART_KEY = 'km_cart';
const USER_KEY = 'km_user';

// State
let cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
let user = JSON.parse(localStorage.getItem(USER_KEY) || 'null');

// ── Helpers ───────────────────────────────────
function fmt(n) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0
  }).format(n);
}

function pageUrl(name) {
  // Works whether pages are in /frontend/ (Vercel) or root (localhost:5000)
  const p = window.location.pathname;
  const dir = p.endsWith('/') ? p : p.slice(0, p.lastIndexOf('/') + 1);
  return window.location.origin + dir + name;
}

function notify(msg, type = 'success') {
  const el = document.getElementById('notification');
  if (!el) return;
  el.textContent = msg;
  el.className = 'notification ' + type;
  clearTimeout(window._nt);
  window._nt = setTimeout(() => { el.className = 'notification hidden'; }, 3500);
}

// ── Cart ──────────────────────────────────────
function saveCart() {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function addToCart(id, name) {
  const ex = cart.find(i => i.id === id);
  if (ex) ex.quantity += 1;
  else cart.push({ id, name, quantity: 1 });
  saveCart();
  renderCart();
  notify(name + ' added to cart!');
}

function removeFromCart(id) {
  cart = cart.filter(i => i.id !== id);
  saveCart();
  renderCart();
}

function changeQty(id, delta) {
  const it = cart.find(i => i.id === id);
  if (!it) return;
  it.quantity += delta;
  if (it.quantity < 1) { removeFromCart(id); return; }
  saveCart();
  renderCart();
}

async function renderCart() {
  const badge = document.getElementById('cart-count');
  const total = cart.reduce((s, i) => s + i.quantity, 0);
  if (badge) badge.textContent = total;

  const itemsEl = document.getElementById('cart-items');
  const totalEl = document.getElementById('cart-total');
  if (!itemsEl || !totalEl) return;

  if (cart.length === 0) {
    itemsEl.innerHTML = '<p class="cart-empty">Your cart is empty.</p>';
    totalEl.textContent = fmt(0);
    return;
  }

  try {
    const res = await fetch(API + '/products');
    const products = await res.json();
    let grandTotal = 0;

    itemsEl.innerHTML = cart.map(item => {
      const prod = products.find(p => p.id === item.id);
      const price = prod ? prod.price : 0;
      const sub = price * item.quantity;
      grandTotal += sub;
      return `
        <div class="cart-item">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-sub">${fmt(price)} × ${item.quantity} = ${fmt(sub)}</div>
          <div class="cart-item-row">
            <button class="qty-btn" onclick="changeQty(${item.id},-1)">−</button>
            <span class="qty-num">${item.quantity}</span>
            <button class="qty-btn" onclick="changeQty(${item.id},1)">+</button>
            <button class="remove-btn" onclick="removeFromCart(${item.id})">✕ Remove</button>
          </div>
        </div>`;
    }).join('');

    totalEl.textContent = fmt(grandTotal);
  } catch {
    itemsEl.innerHTML = '<p style="color:var(--red);font-size:.8rem">Could not load prices. Is the backend running?</p>';
  }
}

// ── Checkout ──────────────────────────────────
async function checkout() {
  if (!user) { notify('Please login before placing an order.', 'error'); return; }
  if (cart.length === 0) { notify('Your cart is empty.', 'error'); return; }

  const pm = document.querySelector('input[name="payment"]:checked');
  if (!pm) { notify('Please select a payment method.', 'error'); return; }

  const btn = document.getElementById('checkout-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Placing order...'; }

  try {
    const res = await fetch(API + '/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, cartItems: cart, paymentMethod: pm.value })
    });
    const data = await res.json();
    if (!res.ok) {
      notify(data.message || 'Order failed.', 'error');
    } else {
      notify('Order #' + String(data.order.id).padStart(4, '0') + ' placed! via ' + data.order.paymentMethod);
      cart = []; saveCart(); renderCart();
    }
  } catch {
    notify('Cannot reach server. Is the backend running?', 'error');
  }
  if (btn) { btn.disabled = false; btn.textContent = 'Place Order'; }
}

// ── Auth UI ───────────────────────────────────
function updateNavAuth() {
  const nameEl  = document.getElementById('nav-username');
  const loginA  = document.getElementById('nav-login');
  const regA    = document.getElementById('nav-register');
  const logoutB = document.getElementById('nav-logout');

  if (nameEl)  nameEl.textContent  = user ? 'Hi, ' + user.name.split(' ')[0] : '';
  if (loginA)  loginA.style.display  = user ? 'none' : '';
  if (regA)    regA.style.display    = user ? 'none' : '';
  if (logoutB) logoutB.style.display = user ? '' : 'none';
}

function logout() {
  user = null;
  localStorage.removeItem(USER_KEY);
  updateNavAuth();
  notify('Logged out successfully.');
}

// ── Index Page ────────────────────────────────
async function initIndex() {
  updateNavAuth();
  renderCart();
  await loadProducts();
}

async function loadProducts() {
  const el = document.getElementById('products-container');
  el.innerHTML = '<div class="msg">Loading products...</div>';
  try {
    const res = await fetch(API + '/products');
    if (!res.ok) throw new Error('bad response');
    const products = await res.json();

    el.innerHTML = products.map(p => `
      <div class="product-card">
        <div class="product-card-img">
          <img src="${p.image}" alt="${p.name}" loading="lazy">
          <span class="product-tag">Best Deal</span>
        </div>
        <div class="product-card-body">
          <h3>${p.name}</h3>
          <p class="product-card-desc">${p.description}</p>
          <div class="product-price">${fmt(p.price)}</div>
          <div class="card-btns">
            <button class="btn btn-ghost" onclick="goToProduct(${p.id})">Details</button>
            <button class="btn btn-success" onclick="addToCart(${p.id}, '${p.name.replace(/'/g, "\\'")}')">Add to Cart</button>
          </div>
        </div>
      </div>`).join('');
  } catch (err) {
    el.innerHTML = `
      <div class="msg error" style="grid-column:1/-1">
        <strong>Cannot connect to backend.</strong><br><br>
        If using VS Code Live Server, you also need to run the backend:<br>
        <code style="display:block;margin:8px 0;padding:8px;background:rgba(0,0,0,.3);border-radius:6px">cd backend &amp;&amp; node server.js</code>
        Then open <a href="http://localhost:5000" style="color:var(--accent2)">http://localhost:5000</a> instead of Live Server.
      </div>`;
  }
}

function goToProduct(id) {
  window.location.href = pageUrl('product.html') + '?id=' + id;
}

// ── Product Detail Page ───────────────────────
async function initProduct() {
  updateNavAuth();
  renderCart();

  const container = document.getElementById('details-container');
  const id = new URLSearchParams(window.location.search).get('id');
  if (!id) {
    container.innerHTML = '<div class="msg error">No product ID found in URL.</div>';
    return;
  }

  container.innerHTML = '<div class="msg">Loading product...</div>';
  try {
    const res = await fetch(API + '/products/' + id);
    if (!res.ok) throw new Error('not found');
    const p = await res.json();

    container.innerHTML = `
      <button class="back-btn" onclick="history.back()">← Back to store</button>
      <div class="detail-card">
        <img src="${p.image}" alt="${p.name}">
        <div class="detail-body">
          <h1>${p.name}</h1>
          <div class="detail-price">${fmt(p.price)}</div>
          <p class="detail-desc">${p.description}</p>
          <div class="detail-badges">
            <span class="badge">✓ Free delivery</span>
            <span class="badge">✓ 7-day replacement</span>
            <span class="badge">✓ Secure payment</span>
          </div>
          <button class="btn btn-success btn-full" onclick="addToCart(${p.id}, '${p.name.replace(/'/g, "\\'")}')">
            Add to Cart
          </button>
        </div>
      </div>`;
  } catch {
    container.innerHTML = '<div class="msg error">Product not found. <a href="index.html">Go back to store</a></div>';
  }
}

// ── Login Page ────────────────────────────────
function initLogin() {
  if (user) { window.location.href = pageUrl('index.html'); return; }

  document.getElementById('login-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    const btn = this.querySelector('button[type=submit]');
    const errEl = document.getElementById('form-error');
    errEl.style.display = 'none';
    btn.disabled = true;
    btn.textContent = 'Logging in...';

    const email    = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    try {
      const res  = await fetch(API + '/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        errEl.textContent = data.message || 'Login failed.';
        errEl.style.display = 'block';
        btn.disabled = false; btn.textContent = 'Log in';
        return;
      }
      user = data.user;
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      notify('Welcome back, ' + user.name + '!');
      setTimeout(() => window.location.href = pageUrl('index.html'), 500);
    } catch {
      errEl.textContent = 'Cannot connect to server. Run: cd backend && node server.js';
      errEl.style.display = 'block';
      btn.disabled = false; btn.textContent = 'Log in';
    }
  });
}

// ── Register Page ─────────────────────────────
function initRegister() {
  if (user) { window.location.href = pageUrl('index.html'); return; }

  document.getElementById('register-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    const btn = this.querySelector('button[type=submit]');
    const errEl = document.getElementById('form-error');
    errEl.style.display = 'none';

    const name     = document.getElementById('name').value.trim();
    const email    = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirm  = document.getElementById('confirm').value;

    if (password !== confirm) {
      errEl.textContent = 'Passwords do not match.';
      errEl.style.display = 'block'; return;
    }
    if (password.length < 6) {
      errEl.textContent = 'Password must be at least 6 characters.';
      errEl.style.display = 'block'; return;
    }

    btn.disabled = true; btn.textContent = 'Creating account...';

    try {
      const res  = await fetch(API + '/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        errEl.textContent = data.message || 'Registration failed.';
        errEl.style.display = 'block';
        btn.disabled = false; btn.textContent = 'Create account';
        return;
      }
      notify('Account created! Please log in.');
      setTimeout(() => window.location.href = pageUrl('login.html'), 600);
    } catch {
      errEl.textContent = 'Cannot connect to server. Run: cd backend && node server.js';
      errEl.style.display = 'block';
      btn.disabled = false; btn.textContent = 'Create account';
    }
  });
}

// ── Expose globals ────────────────────────────
window.addToCart      = addToCart;
window.removeFromCart = removeFromCart;
window.changeQty      = changeQty;
window.checkout       = checkout;
window.logout         = logout;
window.goToProduct    = goToProduct;
window.initIndex      = initIndex;
window.initProduct    = initProduct;
window.initLogin      = initLogin;
window.initRegister   = initRegister;