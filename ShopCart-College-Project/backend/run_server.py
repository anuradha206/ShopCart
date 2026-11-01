"""
ShopCart Backend API Server & SQLite Bridge
Provides complete RESTful endpoints on port 8001 connected to SQLite database backend/cartcraft.db.
Features atomic transactions, trusted database price calculations, stock decrement, authentication,
wishlist & cart persistence, and product search/filtering in Indian Rupees (INR - ₹).
"""

import os
import json
import sqlite3
import hashlib
import hmac
import base64
import secrets
import time
import re
import urllib.error
import urllib.request
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
from datetime import datetime, timezone

DB_PATH = os.path.join(os.path.dirname(__file__), 'cartcraft.db')
PORT = 8001
TOKEN_SECRET = secrets.token_bytes(32)
PASSWORD_ITERATIONS = 310_000
FAQ_PATH = os.path.join(os.path.dirname(__file__), 'faqs.json')

def normalize_indian_phone(value):
    """Normalize a 10-digit Indian mobile number to +91 plus ten digits."""
    text = str(value or '').strip()
    if not text or not re.fullmatch(r'[+\d\s()\-]+', text):
        return None
    compact = re.sub(r'[\s()\-]', '', text)
    local = compact[3:] if compact.startswith('+91') else compact
    return '+91' + local if re.fullmatch(r'[6-9]\d{9}', local) else None

def _assistant_reply(message, products):
    """Return (reply, SQLite product rows, handled_product_question)."""
    text = message.lower()
    available_only = bool(re.search(r'\bavailable\b|\bin stock\b|\bcan i buy\b|\bready to ship\b', text))
    compare_intent = any(term in text for term in ('compare', 'comparison', 'difference between'))
    budget_match = re.search(
        r'(?:under|below|less than|up to|upto|within|budget(?: of)?)\s*(?:₹|rs\.?\s*)?([\d,]+(?:\.\d+)?)|₹\s*([\d,]+(?:\.\d+)?)',
        text,
    )
    budget = float((budget_match.group(1) or budget_match.group(2)).replace(',', '')) if budget_match else None
    categories = sorted({str(p.get('category') or '') for p in products if p.get('category')}, key=len, reverse=True)
    category = None if compare_intent else next((name for name in categories if name.lower() in text), None)
    candidates = list(products)
    if category:
        candidates = [p for p in candidates if str(p.get('category', '')).lower() == category.lower()]
    if budget is not None:
        candidates = [p for p in candidates if float(p.get('price') or 0) <= budget and int(p.get('stock_quantity') or 0) > 0]
    if available_only:
        candidates = [p for p in candidates if int(p.get('stock_quantity') or 0) > 0]

    stop_words = {
        'find', 'show', 'search', 'look', 'looking', 'for', 'me', 'a', 'an', 'the', 'some', 'product', 'products',
        'item', 'items', 'under', 'below', 'less', 'than', 'up', 'to', 'within', 'budget', 'of', 'rs', 'in', 'stock',
        'available', 'compare', 'comparison', 'between', 'and', 'please', 'recommend', 'recommendation', 'something',
        'best', 'cheapest', 'cheap', 'lowest', 'price', 'priced', 'what', 'is', 'are', 'can', 'i', 'buy', 'currently',
        'category', 'by', 'with', 'my', 'want', 'need', 'get', 'good', 'options', 'suggest', 'suggestion', 'on', 'or',
        'how', 'do', 'place', 'order', 'add', 'cart', 'update', 'remove', 'login', 'log', 'register', 'sign',
        'account', 'view', 'track', 'unavailable', 'out', 'what', 'should', 'if', 'when', 'why', 'this', 'quantity',
    }
    tokens = [t for t in re.findall(r'[a-z0-9]+', text) if t not in stop_words and not t.isdigit() and len(t) > 1]
    if category:
        category_tokens = set(re.findall(r'[a-z0-9]+', category.lower()))
        tokens = [t for t in tokens if t not in category_tokens]

    cheap_intent = any(term in text for term in ('cheapest', 'lowest price', 'least expensive', 'cheap'))
    recommendation_intent = any(term in text for term in ('recommend', 'suggest', 'something for me', 'best'))
    product_intent = budget is not None or available_only or compare_intent or cheap_intent or recommendation_intent or bool(category)
    if tokens:
        scored = []
        for product in candidates:
            name = str(product.get('name') or '').lower()
            brand = str(product.get('brand') or '').lower()
            cat = str(product.get('category') or '').lower()
            description = str(product.get('description') or '').lower()
            score = sum((4 if t in name else 0) + (3 if t in brand else 0) + (2 if t in cat else 0) + (1 if t in description else 0) for t in tokens)
            if score:
                scored.append((score, product))
        if scored:
            candidates = [p for _, p in sorted(scored, key=lambda item: (-item[0], float(item[1].get('price') or 0)))]
        elif not category and budget is None and not available_only and not cheap_intent and not recommendation_intent and not compare_intent:
            candidates = []
        else:
            product_intent = True

    if not product_intent and any(term in text for term in ('find ', 'search ', 'show ', 'browse ', 'look for ')):
        product_intent = True

    if cheap_intent:
        candidates = sorted((p for p in candidates if int(p.get('stock_quantity') or 0) > 0), key=lambda p: float(p.get('price') or 0))[:1]
    elif recommendation_intent:
        in_stock = [p for p in candidates if int(p.get('stock_quantity') or 0) > 0]
        candidates = sorted(in_stock, key=lambda p: (-float(p.get('average_rating') or 0), -int(p.get('review_count') or 0), float(p.get('price') or 0)))[:4]
    elif compare_intent:
        candidates = sorted(candidates, key=lambda p: (-float(p.get('average_rating') or 0), float(p.get('price') or 0)))[:4] if candidates else sorted(
            (p for p in products if int(p.get('stock_quantity') or 0) > 0),
            key=lambda p: (-float(p.get('average_rating') or 0), float(p.get('price') or 0)),
        )[:3]
    else:
        candidates = candidates[:5]

    if budget is not None:
        if candidates:
            reply = f"Here are in-stock catalogue matches at or under ₹{budget:,.0f}."
        else:
            closest = sorted((p for p in products if int(p.get('stock_quantity') or 0) > 0), key=lambda p: float(p.get('price') or 0))
            candidates = closest[:1]
            if closest:
                reply = f"There are no in-stock products at or under ₹{budget:,.0f}. The lowest-priced in-stock item is {closest[0].get('name')} at ₹{float(closest[0].get('price') or 0):,.0f}; I’ve included it as a close alternative."
            else:
                reply = f"There are no in-stock catalogue products at or under ₹{budget:,.0f} right now."
    elif cheap_intent:
        reply = 'Here is the lowest-priced in-stock match in the current catalogue.' if candidates else 'I could not find an in-stock match for that search.'
    elif compare_intent:
        reply = 'Compare these catalogue matches by current price, rating, category, and stock.' if candidates else 'Tell me the names of the products you would like to compare.'
    elif available_only:
        reply = 'These matching products are currently listed as in stock.' if candidates else 'There are no in-stock products matching that search right now.'
    elif recommendation_intent:
        reply = 'Here are some well-rated, in-stock picks from the catalogue. Share a category or budget to narrow them down.' if candidates else 'I could not find an in-stock recommendation for those preferences.'
    elif category:
        reply = f'Here are catalogue products in {category}.' if candidates else f"I couldn't find a matching product in {category}."
    elif tokens:
        reply = 'Here are the closest matches from the current catalogue.' if candidates else 'I could not find a matching product in the current catalogue. Try a product name, brand, or category.'
    else:
        reply = 'I can find products by name, brand, or category; filter by budget or stock; compare catalogue items; and explain the cart and checkout steps.'
        if tokens and not candidates:
            product_intent = True
    return reply, candidates, product_intent


def _find_faq(message):
    """Match a customer help question to the maintained FAQ configuration."""
    try:
        with open(FAQ_PATH, 'r', encoding='utf-8-sig') as faq_file:
            faqs = json.load(faq_file)
    except (OSError, json.JSONDecodeError):
        return None
    normalize = lambda value: ' '.join(re.findall(r'[a-z0-9]+', str(value).lower()))
    query = normalize(message)
    query_tokens = set(query.split())
    best = None
    best_score = 0.0
    for faq in faqs if isinstance(faqs, list) else []:
        score = 0.0
        for phrase in [faq.get('question', ''), *faq.get('aliases', [])]:
            normalized = normalize(phrase)
            phrase_tokens = set(normalized.split())
            if normalized == query:
                score = 1.0
                break
            overlap = len(query_tokens & phrase_tokens)
            if overlap:
                score = max(score, overlap / max(1, len(query_tokens)), overlap / max(1, len(phrase_tokens)))
        if score > best_score:
            best, best_score = faq, score
    return best if best_score >= 0.5 and best.get('answer') else None


def _assistant_ai_reply(message):
    """Optional OpenAI-compatible chat provider; credentials remain server-side."""
    api_key = os.environ.get('SHOPCART_AI_API_KEY', '').strip()
    if not api_key:
        return None
    endpoint = os.environ.get('SHOPCART_AI_API_URL', 'https://api.openai.com/v1/chat/completions').strip()
    model = os.environ.get('SHOPCART_AI_MODEL', 'gpt-4o-mini').strip()
    if not endpoint.lower().startswith('https://'):
        return None
    payload = {
        'model': model,
        'temperature': 0.2,
        'max_tokens': 120,
        'messages': [
            {'role': 'system', 'content': 'You are ShopCart Assistant. Reply briefly about using this demo store. Do not state or invent product names, prices, ratings, stock, or availability; verified product cards are shown separately. For personal order or cart information, tell the customer to sign in and use ShopCart pages; never claim access to their account.'},
            {'role': 'user', 'content': f'Customer question: {message}\nThe application displays verified product results separately. Give only general shopping guidance and do not mention product facts.'},
        ],
    }
    request = urllib.request.Request(endpoint, data=json.dumps(payload).encode('utf-8'), headers={
        'Authorization': f'Bearer {api_key}', 'Content-Type': 'application/json',
    }, method='POST')
    try:
        with urllib.request.urlopen(request, timeout=5) as response:
            data = json.loads(response.read(512_000).decode('utf-8'))
        answer = data.get('choices', [{}])[0].get('message', {}).get('content', '')
        return answer.strip()[:600] if isinstance(answer, str) and answer.strip() else None
    except (urllib.error.URLError, TimeoutError, ValueError, KeyError, IndexError, TypeError):
        return None


def hash_password(password):
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, PASSWORD_ITERATIONS)
    return f"pbkdf2_sha256${PASSWORD_ITERATIONS}${base64.urlsafe_b64encode(salt).decode()}${base64.urlsafe_b64encode(digest).decode()}"

def verify_password(stored, password):
    if stored.startswith('pbkdf2_sha256$'):
        try:
            _, rounds, salt_text, digest_text = stored.split('$', 3)
            salt = base64.urlsafe_b64decode(salt_text)
            expected = base64.urlsafe_b64decode(digest_text)
            actual = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, int(rounds))
            return hmac.compare_digest(actual, expected), False
        except (ValueError, TypeError):
            return False, False
    legacy = hashlib.sha256(password.encode('utf-8')).hexdigest()
    return hmac.compare_digest(stored, legacy), True

def issue_token(user_id):
    payload = base64.urlsafe_b64encode(json.dumps({
        'sub': int(user_id),
        'exp': int(time.time()) + 60 * 60 * 12,
    }, separators=(',', ':')).encode()).decode().rstrip('=')
    signature = hmac.new(TOKEN_SECRET, payload.encode(), hashlib.sha256).digest()
    return f"{payload}.{base64.urlsafe_b64encode(signature).decode().rstrip('=')}"

def read_token(token):
    try:
        payload, signature = token.split('.', 1)
        expected = hmac.new(TOKEN_SECRET, payload.encode(), hashlib.sha256).digest()
        supplied = base64.urlsafe_b64decode(signature + '=' * (-len(signature) % 4))
        if not hmac.compare_digest(expected, supplied):
            return None
        payload_bytes = base64.urlsafe_b64decode(payload + '=' * (-len(payload) % 4))
        data = json.loads(payload_bytes)
        if int(data['exp']) <= int(time.time()):
            return None
        return int(data['sub'])
    except (ValueError, TypeError, KeyError, json.JSONDecodeError):
        return None

def get_db():
    con = sqlite3.connect(DB_PATH)
    con.row_factory = sqlite3.Row
    return con

def init_db():
    con = get_db()
    cur = con.cursor()
    # Create tables if not present
    cur.execute('''
        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            slug TEXT NOT NULL UNIQUE,
            description TEXT,
            item_count INTEGER DEFAULT 0,
            icon TEXT
        )
    ''')
    cur.execute('''
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            price REAL NOT NULL,
            original_price REAL,
            category_id INTEGER,
            category TEXT NOT NULL,
            brand TEXT NOT NULL,
            stock_quantity INTEGER NOT NULL DEFAULT 0,
            image_url TEXT,
            average_rating REAL DEFAULT 0,
            review_count INTEGER DEFAULT 0,
            is_featured INTEGER DEFAULT 0,
            is_popular INTEGER DEFAULT 0,
            is_recommended INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    cur.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            hashed_password TEXT NOT NULL,
            phone TEXT,
            address TEXT,
            role TEXT NOT NULL DEFAULT 'customer',
            is_active INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    cur.execute('''
        CREATE TABLE IF NOT EXISTS orders (
            id TEXT PRIMARY KEY,
            user_name TEXT NOT NULL,
            user_email TEXT NOT NULL,
            total_amount REAL NOT NULL,
            status TEXT NOT NULL DEFAULT 'Pending',
            delivery_address TEXT NOT NULL,
            payment_method TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    cur.execute('''
        CREATE TABLE IF NOT EXISTS order_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id TEXT NOT NULL,
            product_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            price REAL NOT NULL,
            quantity INTEGER NOT NULL,
            image_url TEXT,
            FOREIGN KEY(order_id) REFERENCES orders(id)
        )
    ''')
    cur.execute('''
        CREATE TABLE IF NOT EXISTS cart_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_email TEXT NOT NULL,
            product_id INTEGER NOT NULL,
            quantity INTEGER NOT NULL DEFAULT 1,
            UNIQUE(user_email, product_id)
        )
    ''')
    cur.execute('''
        CREATE TABLE IF NOT EXISTS wishlist_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_email TEXT NOT NULL,
            product_id INTEGER NOT NULL,
            UNIQUE(user_email, product_id)
        )
    ''')

    # Disable shipped demo accounts that used public, guessable passwords.
    cur.execute("UPDATE users SET is_active = 0 WHERE email = 'pandeyanuradha404@gmail.com'")
    admin_password = os.environ.get('SHOPCART_ADMIN_PASSWORD', '')
    if len(admin_password) >= 12:
        admin_hash = hash_password(admin_password)
        cur.execute('''
            INSERT INTO users (name, email, hashed_password, role, is_active)
            VALUES ('ShopCart Administrator', 'admin@shopcart.store', ?, 'admin', 1)
            ON CONFLICT(email) DO UPDATE SET
                name = excluded.name,
                hashed_password = excluded.hashed_password,
                role = 'admin',
                is_active = 1
        ''', (admin_hash,))
    else:
        cur.execute("UPDATE users SET is_active = 0 WHERE email = 'admin@shopcart.store'")

    con.commit()
    con.close()

class ApiHandler(BaseHTTPRequestHandler):
    def _set_headers(self, status=200, content_type='application/json'):
        self.send_response(status)
        self.send_header('Content-Type', content_type)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept')
        self.end_headers()

    def do_OPTIONS(self):
        self._set_headers(204)

    def _read_json(self):
        content_len = int(self.headers.get('Content-Length', 0))
        if content_len > 0:
            body = self.rfile.read(content_len)
            try:
                return json.loads(body.decode('utf-8'))
            except Exception:
                return {}
        return {}

    def _reply(self, status, payload):
        self._set_headers(status)
        self.wfile.write(json.dumps(payload).encode('utf-8'))

    def _current_user(self, cur, admin_only=False):
        authorization = self.headers.get('Authorization', '')
        if not authorization.startswith('Bearer '):
            self._reply(401, {"error": "Sign in is required"})
            return None
        user_id = read_token(authorization[7:].strip())
        if user_id is None:
            self._reply(401, {"error": "Your session is invalid or expired. Please sign in again."})
            return None
        row = cur.execute(
            'SELECT id, name, email, phone, address, role, is_active, created_at FROM users WHERE id = ?',
            (user_id,),
        ).fetchone()
        if not row or not row['is_active']:
            self._reply(401, {"error": "This account is inactive or no longer exists"})
            return None
        user = dict(row)
        if admin_only and user['role'] != 'admin':
            self._reply(403, {"error": "Administrator access is required"})
            return None
        return user

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path
        query = parse_qs(parsed.query)

        con = get_db()
        cur = con.cursor()

        try:
            # 1. Health check
            if path in ['/api/health', '/health']:
                cur.execute('SELECT 1')
                prod_count = cur.execute('SELECT COUNT(*) FROM products').fetchone()[0]
                resp = {
                    "status": "ok",
                    "app_name": "ShopCart Online Shopping System",
                    "version": "1.0.0",
                    "currency": "INR (₹)",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "database": {
                        "status": "connected",
                        "database_type": "sqlite",
                        "url": "cartcraft.db",
                        "product_count": prod_count
                    }
                }
                self._set_headers(200)
                self.wfile.write(json.dumps(resp).encode('utf-8'))
                return

            # 2. System Info
            if path in ['/api/info', '/info']:
                resp = {
                    "project_name": "ShopCart Online Shopping System",
                    "version": "1.0.0",
                    "currency": "INR",
                    "phase": "Full-Stack E-Commerce Architecture",
                    "modules_ready": [
                        "Product Catalog with INR (₹) Pricing",
                        "Persistent Shopping Cart (SQLite)",
                        "Atomic Transaction Checkout & Order Placement",
                        "Visual Order Tracking Pipeline",
                        "Customer & Admin Role Authentication",
                        "Admin Inventory & Price Management",
                        "Wishlist SQLite Synchronization",
                        "Health & Database Diagnostics"
                    ],
                    "endpoints": {
                        "products": "/api/products",
                        "categories": "/api/categories",
                        "orders": "/api/orders",
                        "cart": "/api/cart",
                        "wishlist": "/api/wishlist",
                        "health": "/api/health"
                    }
                }
                self._set_headers(200)
                self.wfile.write(json.dumps(resp).encode('utf-8'))
                return

            # 3. Categories
            if path in ['/api/categories', '/categories']:
                rows = cur.execute('SELECT * FROM categories ORDER BY id ASC').fetchall()
                categories = [dict(r) for r in rows]
                self._set_headers(200)
                self.wfile.write(json.dumps(categories).encode('utf-8'))
                return

            # 4. Products list with search, category & sort
            if path in ['/api/products', '/products']:
                sql = 'SELECT * FROM products WHERE 1=1'
                params = []

                cat = query.get('category', [None])[0]
                if cat and cat.lower() != 'all':
                    sql += ' AND LOWER(category) = LOWER(?)'
                    params.append(cat)

                q = query.get('q', [None])[0]
                if q:
                    search_str = f"%{q.strip().lower()}%"
                    sql += ' AND (LOWER(name) LIKE ? OR LOWER(description) LIKE ? OR LOWER(brand) LIKE ? OR LOWER(category) LIKE ?)'
                    params.extend([search_str, search_str, search_str, search_str])

                sort = query.get('sort', ['relevance'])[0]
                if sort == 'price-low':
                    sql += ' ORDER BY price ASC'
                elif sort == 'price-high':
                    sql += ' ORDER BY price DESC'
                elif sort == 'rating':
                    sql += ' ORDER BY average_rating DESC'
                else:
                    sql += ' ORDER BY id ASC'

                rows = cur.execute(sql, params).fetchall()
                products = [dict(r) for r in rows]
                self._set_headers(200)
                self.wfile.write(json.dumps(products).encode('utf-8'))
                return

            if path in ['/api/auth/me', '/auth/me']:
                user = self._current_user(cur)
                if user:
                    self._reply(200, user)
                return

            # 5. Orders list
            if path in ['/api/orders', '/orders']:
                user = self._current_user(cur)
                if not user:
                    return
                if user['role'] == 'admin':
                    orders_rows = cur.execute('SELECT * FROM orders ORDER BY created_at DESC').fetchall()
                else:
                    orders_rows = cur.execute('SELECT * FROM orders WHERE user_email = ? ORDER BY created_at DESC', (user['email'],)).fetchall()

                orders = []
                for o_row in orders_rows:
                    o = dict(o_row)
                    items_rows = cur.execute('SELECT * FROM order_items WHERE order_id = ?', (o['id'],)).fetchall()
                    o['items'] = [dict(it) for it in items_rows]
                    orders.append(o)

                self._set_headers(200)
                self.wfile.write(json.dumps(orders).encode('utf-8'))
                return

            # 6. Cart items
            if path in ['/api/cart', '/cart']:
                user = self._current_user(cur)
                if not user:
                    return
                rows = cur.execute('''
                    SELECT c.product_id, c.quantity, p.name, p.price, p.image_url, p.stock_quantity, p.category, p.brand
                    FROM cart_items c
                    JOIN products p ON c.product_id = p.id
                    WHERE c.user_email = ?
                ''', (user['email'],)).fetchall()
                items = [dict(r) for r in rows]
                self._set_headers(200)
                self.wfile.write(json.dumps(items).encode('utf-8'))
                return

            # 7. Wishlist items
            if path in ['/api/wishlist', '/wishlist']:
                user = self._current_user(cur)
                if not user:
                    return
                rows = cur.execute('SELECT product_id FROM wishlist_items WHERE user_email = ?', (user['email'],)).fetchall()
                ids = [r['product_id'] for r in rows]
                self._set_headers(200)
                self.wfile.write(json.dumps(ids).encode('utf-8'))
                return

            # 8. Users list (admin)
            if path in ['/api/users', '/users']:
                user = self._current_user(cur, admin_only=True)
                if not user:
                    return
                rows = cur.execute('SELECT id, name, email, phone, address, role, is_active, created_at FROM users').fetchall()
                users = [dict(r) for r in rows]
                self._set_headers(200)
                self.wfile.write(json.dumps(users).encode('utf-8'))
                return

            # 404
            self._set_headers(404)
            self.wfile.write(json.dumps({"error": "Endpoint not found"}).encode('utf-8'))

        finally:
            con.close()

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path
        body = self._read_json()

        con = get_db()
        cur = con.cursor()

        try:
            # Public shopping helper. Reads public catalogue fields only; it does not access customer data.
            if path in ['/api/assistant/chat', '/assistant/chat']:
                message = str(body.get('message') or '').strip()
                if not message or len(message) > 500:
                    self._reply(400, {"error": "Enter a question of 1 to 500 characters."})
                    return
                rows = cur.execute('''SELECT id, name, description, price, original_price, category, brand, stock_quantity, image_url, average_rating, review_count FROM products ORDER BY id ASC''').fetchall()
                catalogue = [dict(row) for row in rows]
                fallback, recommendations, product_question = _assistant_reply(message, catalogue)
                faq = None if product_question else _find_faq(message)
                ai_answer = None if (product_question or faq) else _assistant_ai_reply(message)
                answer = fallback if product_question else faq['answer'] if faq else ai_answer or 'I’m not sure about that yet. Please rephrase your question, or ask me about products, your cart, checkout, or orders.'
                self._reply(200, {
                    "reply": answer,
                    "mode": "products" if product_question else "faq" if faq else "ai" if ai_answer else "rules",
                    "products": recommendations if product_question else [],
                })
                return

            # 1. User Login
            if path in ['/api/auth/login', '/auth/login']:
                email = body.get('email', '').strip().lower()
                password = body.get('password', '')

                user_row = cur.execute('SELECT * FROM users WHERE LOWER(email) = ?', (email,)).fetchone()
                if not user_row:
                    self._set_headers(401)
                    self.wfile.write(json.dumps({"error": "Invalid email or password"}).encode('utf-8'))
                    return

                user = dict(user_row)
                password_ok, is_legacy_hash = verify_password(user['hashed_password'], password)
                if not password_ok:
                    self._set_headers(401)
                    self.wfile.write(json.dumps({"error": "Invalid email or password"}).encode('utf-8'))
                    return

                if not user['is_active']:
                    self._set_headers(403)
                    self.wfile.write(json.dumps({"error": "Account is disabled. Please contact administrator."}).encode('utf-8'))
                    return

                if is_legacy_hash:
                    cur.execute('UPDATE users SET hashed_password = ? WHERE id = ?', (hash_password(password), user['id']))
                    con.commit()

                del user['hashed_password']
                user['is_active'] = bool(user['is_active'])
                self._set_headers(200)
                self.wfile.write(json.dumps({"message": "Login successful", "user": user, "token": issue_token(user['id'])}).encode('utf-8'))
                return

            # 2. User Register
            if path in ['/api/auth/register', '/auth/register']:
                name = body.get('name', '').strip()
                email = body.get('email', '').strip().lower()
                password = body.get('password', '')
                phone = body.get('phone', '')
                address = body.get('address', '')

                normalized_phone = normalize_indian_phone(phone)
                if not normalized_phone:
                    self._reply(400, {"error": "Enter a valid 10-digit Indian mobile number beginning with 6 to 9. You may include +91."})
                    return

                if not name or not email or '@' not in email or len(password) < 8:
                    self._set_headers(400)
                    self.wfile.write(json.dumps({"error": "Enter a name, valid email, and password of at least 8 characters"}).encode('utf-8'))
                    return

                existing = cur.execute('SELECT id FROM users WHERE LOWER(email) = ?', (email,)).fetchone()
                if existing:
                    self._set_headers(400)
                    self.wfile.write(json.dumps({"error": "Email is already registered"}).encode('utf-8'))
                    return

                hashed = hash_password(password)
                cur.execute('''
                    INSERT INTO users (name, email, hashed_password, phone, address, role, is_active)
                    VALUES (?, ?, ?, ?, ?, 'customer', 1)
                ''', (name, email, hashed, normalized_phone, address))
                con.commit()

                user_id = cur.lastrowid
                user = {
                    "id": user_id,
                    "name": name,
                    "email": email,
                    "phone": normalized_phone,
                    "address": address,
                    "role": "customer",
                    "is_active": True
                }
                self._set_headers(201)
                self.wfile.write(json.dumps({"message": "Registration successful", "user": user}).encode('utf-8'))
                return

            # 3. Create Order (ATOMIC TRANSACTION with stock validation & trusted server prices)
            if path in ['/api/orders', '/orders']:
                user = self._current_user(cur)
                if not user:
                    return
                user_name = user['name']
                user_email = user['email']
                delivery_address = body.get('delivery_address', '').strip()
                phone = normalize_indian_phone(body.get('phone', ''))
                payment_method = body.get('payment_method', 'Cash on Delivery (COD)')
                cart_items = body.get('items', [])

                if not user_name or not user_email or not delivery_address:
                    self._set_headers(400)
                    self.wfile.write(json.dumps({"error": "Customer name, email, and delivery address are required"}).encode('utf-8'))
                    return

                if not phone:
                    self._set_headers(400)
                    self.wfile.write(json.dumps({"error": "Enter a valid 10-digit Indian mobile number beginning with 6 to 9. You may include +91."}).encode('utf-8'))
                    return

                if not cart_items:
                    self._set_headers(400)
                    self.wfile.write(json.dumps({"error": "Cannot place an empty order"}).encode('utf-8'))
                    return

                try:
                    cur.execute('BEGIN TRANSACTION')

                    total_calculated = 0.0
                    validated_items = []

                    for it in cart_items:
                        prod_id = int(it.get('product_id'))
                        qty = int(it.get('quantity', 1))

                        if qty <= 0:
                            raise ValueError(f"Invalid quantity {qty} for item")

                        # Validate against actual SQLite database record
                        p_row = cur.execute('SELECT * FROM products WHERE id = ?', (prod_id,)).fetchone()
                        if not p_row:
                            raise ValueError(f"Product ID {prod_id} does not exist in store")

                        prod = dict(p_row)
                        if prod['stock_quantity'] < qty:
                            raise ValueError(f"Insufficient stock for '{prod['name']}'. Only {prod['stock_quantity']} units available.")

                        # Calculate using TRUSTED database price in INR
                        item_total = prod['price'] * qty
                        total_calculated += item_total

                        # Decrement product stock in SQLite
                        new_stock = prod['stock_quantity'] - qty
                        cur.execute('UPDATE products SET stock_quantity = ? WHERE id = ?', (new_stock, prod_id))

                        validated_items.append({
                            "product_id": prod_id,
                            "name": prod['name'],
                            "price": prod['price'],
                            "quantity": qty,
                            "image_url": prod['image_url']
                        })

                    # Generate Order ID
                    order_id = f"ORD-2026-{datetime.now().strftime('%M%S')}"

                    cur.execute('''
                        INSERT INTO orders (id, user_name, user_email, total_amount, status, delivery_address, payment_method)
                        VALUES (?, ?, ?, ?, 'Pending', ?, ?)
                    ''', (order_id, user_name, user_email, round(total_calculated, 2), delivery_address, payment_method))

                    for v_item in validated_items:
                        cur.execute('''
                            INSERT INTO order_items (order_id, product_id, name, price, quantity, image_url)
                            VALUES (?, ?, ?, ?, ?, ?)
                        ''', (order_id, v_item['product_id'], v_item['name'], v_item['price'], v_item['quantity'], v_item['image_url']))

                    # Clear user cart in SQLite
                    cur.execute('DELETE FROM cart_items WHERE user_email = ?', (user_email,))

                    con.commit()

                    response_order = {
                        "id": order_id,
                        "user_name": user_name,
                        "user_email": user_email,
                        "total_amount": round(total_calculated, 2),
                        "status": "Pending",
                        "delivery_address": delivery_address,
                        "payment_method": payment_method,
                        "created_at": datetime.now().strftime('%Y-%m-%d %H:%M'),
                        "items": validated_items
                    }

                    self._set_headers(201)
                    self.wfile.write(json.dumps({"message": "Order created successfully", "order": response_order}).encode('utf-8'))
                    return

                except Exception as tx_err:
                    con.rollback()
                    self._set_headers(400)
                    self.wfile.write(json.dumps({"error": str(tx_err)}).encode('utf-8'))
                    return

            # 4. Sync Cart Item
            if path in ['/api/cart', '/cart']:
                user = self._current_user(cur)
                if not user:
                    return
                user_email = user['email']
                product_id = int(body.get('product_id'))
                quantity = int(body.get('quantity', 1))

                # Check stock in database
                prod = cur.execute('SELECT stock_quantity FROM products WHERE id = ?', (product_id,)).fetchone()
                if not prod:
                    self._set_headers(404)
                    self.wfile.write(json.dumps({"error": "Product not found"}).encode('utf-8'))
                    return

                if quantity > prod['stock_quantity']:
                    self._set_headers(400)
                    self.wfile.write(json.dumps({"error": f"Quantity exceeds available stock ({prod['stock_quantity']})"}).encode('utf-8'))
                    return

                if quantity <= 0:
                    cur.execute('DELETE FROM cart_items WHERE user_email = ? AND product_id = ?', (user_email, product_id))
                else:
                    cur.execute('''
                        INSERT INTO cart_items (user_email, product_id, quantity)
                        VALUES (?, ?, ?)
                        ON CONFLICT(user_email, product_id) DO UPDATE SET quantity = excluded.quantity
                    ''', (user_email, product_id, quantity))

                con.commit()
                self._set_headers(200)
                self.wfile.write(json.dumps({"message": "Cart updated", "product_id": product_id, "quantity": quantity}).encode('utf-8'))
                return

            # 5. Toggle Wishlist Item
            if path in ['/api/wishlist', '/wishlist']:
                user = self._current_user(cur)
                if not user:
                    return
                user_email = user['email']
                product_id = int(body.get('product_id'))

                existing = cur.execute('SELECT id FROM wishlist_items WHERE user_email = ? AND product_id = ?', (user_email, product_id)).fetchone()
                if existing:
                    cur.execute('DELETE FROM wishlist_items WHERE user_email = ? AND product_id = ?', (user_email, product_id))
                    is_saved = False
                else:
                    cur.execute('INSERT OR IGNORE INTO wishlist_items (user_email, product_id) VALUES (?, ?)', (user_email, product_id))
                    is_saved = True

                con.commit()
                self._set_headers(200)
                self.wfile.write(json.dumps({"message": "Wishlist updated", "product_id": product_id, "is_saved": is_saved}).encode('utf-8'))
                return

            self._set_headers(404)
            self.wfile.write(json.dumps({"error": "Endpoint not found"}).encode('utf-8'))

        finally:
            con.close()

    def do_PUT(self):
        parsed = urlparse(self.path)
        path = parsed.path
        body = self._read_json()

        con = get_db()
        cur = con.cursor()

        try:
            if not self._current_user(cur, admin_only=True):
                return
            # 1. Update order status: /api/orders/<id>/status
            if '/orders/' in path and path.endswith('/status'):
                order_id = path.split('/orders/')[1].split('/status')[0]
                new_status = body.get('status', 'Confirmed')

                cur.execute('UPDATE orders SET status = ? WHERE id = ?', (new_status, order_id))
                con.commit()

                self._set_headers(200)
                self.wfile.write(json.dumps({"message": f"Order {order_id} status updated to {new_status}"}).encode('utf-8'))
                return

            # 2. Update product stock / price (Admin): /api/products/<id>
            if '/products/' in path:
                prod_id = int(path.split('/products/')[1])
                updates = []
                params = []

                if 'stock_quantity' in body:
                    updates.append("stock_quantity = ?")
                    params.append(int(body['stock_quantity']))
                if 'price' in body:
                    updates.append("price = ?")
                    params.append(float(body['price']))

                if updates:
                    params.append(prod_id)
                    cur.execute(f"UPDATE products SET {', '.join(updates)} WHERE id = ?", params)
                    con.commit()

                self._set_headers(200)
                self.wfile.write(json.dumps({"message": "Product updated successfully"}).encode('utf-8'))
                return

            # 3. Toggle user active status: /api/users/<id>/status
            if '/users/' in path and path.endswith('/status'):
                user_id = int(path.split('/users/')[1].split('/status')[0])
                is_active = int(body.get('is_active', 1))

                cur.execute('UPDATE users SET is_active = ? WHERE id = ?', (is_active, user_id))
                con.commit()

                self._set_headers(200)
                self.wfile.write(json.dumps({"message": "User status updated"}).encode('utf-8'))
                return

            self._set_headers(404)
            self.wfile.write(json.dumps({"error": "Endpoint not found"}).encode('utf-8'))

        finally:
            con.close()

    def do_DELETE(self):
        parsed = urlparse(self.path)
        path = parsed.path
        query = parse_qs(parsed.query)

        con = get_db()
        cur = con.cursor()

        try:
            user = self._current_user(cur)
            if not user:
                return
            # 1. Clear or remove from cart: /api/cart?product_id=...&user_email=...
            if path in ['/api/cart', '/cart']:
                user_email = user['email']
                product_id = query.get('product_id', [None])[0]
                if product_id:
                    cur.execute('DELETE FROM cart_items WHERE user_email = ? AND product_id = ?', (user_email, int(product_id)))
                else:
                    cur.execute('DELETE FROM cart_items WHERE user_email = ?', (user_email,))
                con.commit()
                self._set_headers(200)
                self.wfile.write(json.dumps({"message": "Cart item removed"}).encode('utf-8'))
                return

            # 2. Remove from wishlist: /api/wishlist?product_id=...&user_email=...
            if path in ['/api/wishlist', '/wishlist']:
                user_email = user['email']
                product_id = query.get('product_id', [None])[0]
                if product_id:
                    cur.execute('DELETE FROM wishlist_items WHERE user_email = ? AND product_id = ?', (user_email, int(product_id)))
                else:
                    cur.execute('DELETE FROM wishlist_items WHERE user_email = ?', (user_email,))
                con.commit()
                self._set_headers(200)
                self.wfile.write(json.dumps({"message": "Wishlist item removed"}).encode('utf-8'))
                return

            self._set_headers(404)
            self.wfile.write(json.dumps({"error": "Endpoint not found"}).encode('utf-8'))

        finally:
            con.close()

def run_server():
    init_db()
    server_address = ('0.0.0.0', PORT)
    HTTPServer.allow_reuse_address = True
    httpd = HTTPServer(server_address, ApiHandler)
    print(f"ShopCart Backend API Server running on port {PORT} with SQLite database {DB_PATH}")
    httpd.serve_forever()

if __name__ == '__main__':
    run_server()
