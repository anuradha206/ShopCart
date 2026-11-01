import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { FeaturesBar } from './components/FeaturesBar';
import { CategoriesSection } from './components/CategoriesSection';
import { ProductCard } from './components/ProductCard';
import { PreFooterCta } from './components/PreFooterCta';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { WishlistModal } from './components/WishlistModal';
import { OrdersModal } from './components/OrdersModal';
import { CheckoutModal } from './components/CheckoutModal';
import { AuthModal } from './components/AuthModal';
import { AdminDashboard } from './components/AdminDashboard';
import { ShopCartAssistant } from './components/ShopCartAssistant';
import { api } from './services/api';
import { Product, Order, OrderStatus } from './types';
import { INITIAL_PRODUCTS } from './data/mockProducts';
import { formatINR } from './utils/currency';
import {
  TrendingUp,
  Award,
  X,
  Star,
  ShoppingCart,
  Heart,
  Check,
  Package,
  ShieldCheck,
  Search,
  SlidersHorizontal,
} from 'lucide-react';

export default function App() {
  const [activeNav, setActiveNav] = useState<'home' | 'products' | 'orders' | 'admin'>('home');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'relevance' | 'price-low' | 'price-high' | 'rating'>('relevance');

  // Dynamic Product State from SQLite backend
  const [productsList, setProductsList] = useState<Product[]>(INITIAL_PRODUCTS);
  const [isProductsLoading, setIsProductsLoading] = useState<boolean>(false);

  // User Authentication State
  const [currentUser, setCurrentUser] = useState<{
    name: string;
    email: string;
    role: 'customer' | 'admin';
  } | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  // Modals & Drawers state
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState<boolean>(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState<boolean>(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'customer_login' | 'register' | 'admin_login'>('customer_login');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Cart & Wishlist state
  const [cart, setCart] = useState<{ [productId: number]: number }>({});
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Orders created during this session are also saved by the backend.
  const [orders, setOrders] = useState<Order[]>([]);

  // Fetch storefront data on mount.
  const loadProducts = async () => {
    setIsProductsLoading(true);
    try {
      const prods = await api.getProducts();
      if (prods && prods.length > 0) {
        setProductsList(prods);
      }
    } catch (err) {
      console.warn('Initial data load notice:', err);
    } finally {
      setIsProductsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
    let active = true;
    api.getCurrentUser().then((user) => {
      if (active && user) setCurrentUser(user);
      if (active) setSessionLoading(false);
    });
    return () => { active = false; };
  }, []);

  // Load private customer data only after the server confirms this session.
  useEffect(() => {
    if (currentUser?.email) {
      let active = true;
      setCart({});
      setOrders([]);
      setWishlist([]);
      Promise.all([api.getOrders(), api.getWishlist(), api.getCart()]).then(([userOrders, userWish, userCart]) => {
        if (!active) return;
        setOrders(userOrders);
        setWishlist(userWish);
        setCart(Object.fromEntries(userCart.map((item) => [item.product_id, item.quantity])));
      });
      return () => { active = false; };
    } else {
      setCart({});
      setOrders([]);
      setWishlist([]);
    }
  }, [currentUser?.email]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Cart operations with stock limitation and immediate UI update
  const handleAddToCart = (product: Product) => {
    if (!currentUser) {
      openAuthWithMode('customer_login');
      return;
    }
    const currentQty = cart[product.id] || 0;
    if (currentQty >= product.stock_quantity) {
      showToast(`Cannot add more. Max stock available: ${product.stock_quantity}`);
      return;
    }

    const newQty = currentQty + 1;
    setCart((prev) => ({ ...prev, [product.id]: newQty }));
    showToast(`Added "${product.name}" to bag! (Qty: ${newQty})`);

    // Sync with SQLite backend
    api.syncCartItem(product.id, newQty);
  };

  const handleUpdateQty = (productId: number, newQty: number) => {
    if (!currentUser) return;
    const product = productsList.find((p) => p.id === productId);
    if (product && newQty > product.stock_quantity) {
      showToast(`Only ${product.stock_quantity} units available in stock.`);
      return;
    }

    setCart((prev) => {
      if (newQty <= 0) {
        const next = { ...prev };
        delete next[productId];
        showToast('Item removed from cart');
        return next;
      }
      return { ...prev, [productId]: newQty };
    });

    // Sync with SQLite backend
    api.syncCartItem(productId, newQty);
  };

  // Wishlist operations with SQLite synchronization
  const handleToggleWishlist = async (product: Product) => {
    if (!currentUser) {
      openAuthWithMode('customer_login');
      return;
    }
    const isCurrentlyWishlisted = wishlist.includes(product.id);
    if (isCurrentlyWishlisted) {
      setWishlist((prev) => prev.filter((id) => id !== product.id));
      showToast(`Removed "${product.name}" from wishlist`);
    } else {
      setWishlist((prev) => [...prev, product.id]);
      showToast(`Saved "${product.name}" to wishlist ❤️`);
    }

    await api.toggleWishlist(product.id);
  };

  const handleRemoveFromWishlist = async (productId: number) => {
    if (!currentUser) return;
    setWishlist((prev) => prev.filter((id) => id !== productId));
    showToast('Item removed from wishlist');
    await api.removeFromWishlist(productId);
  };

  const handleMoveToCart = (product: Product) => {
    handleAddToCart(product);
    handleRemoveFromWishlist(product.id);
    showToast(`Moved "${product.name}" to shopping cart!`);
  };

  const handleMoveAllToCart = () => {
    if (!currentUser) return;
    wishlist.forEach((id) => {
      const p = productsList.find((prod) => prod.id === id);
      if (p) {
        const nextQty = (cart[p.id] || 0) + 1;
        setCart((prev) => ({ ...prev, [p.id]: (prev[p.id] || 0) + 1 }));
        api.syncCartItem(p.id, nextQty);
        api.removeFromWishlist(p.id);
      }
    });
    setWishlist([]);
    showToast('Moved all saved items to shopping bag!');
  };

  // Order Confirmed Callback from CheckoutModal
  const handleOrderConfirmed = (newOrder: Order) => {
    // Clear cart immediately
    setCart({});
    setIsCartOpen(false);

    // Prepend to orders list
    setOrders((prev) => [newOrder, ...prev]);

    // Decrement stock in local state
    setProductsList((prev) =>
      prev.map((p) => {
        const boughtItem = newOrder.items.find((it) => it.product_id === p.id);
        if (boughtItem) {
          return {
            ...p,
            stock_quantity: Math.max(0, p.stock_quantity - boughtItem.quantity),
          };
        }
        return p;
      })
    );

    showToast(`Order ${newOrder.id} placed successfully in Indian Rupees (${formatINR(newOrder.total_amount)})!`);
  };

  // Admin inventory updates with backend persistence
  const handleUpdateProductStock = async (productId: number, newStock: number) => {
    setProductsList((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, stock_quantity: newStock } : p))
    );
    try {
      await api.updateProductStock(productId, newStock);
      showToast(`Stock updated to ${newStock} units in SQLite database`);
    } catch {
      showToast(`Stock updated locally`);
    }
  };

  const handleUpdateProductPrice = async (productId: number, newPrice: number) => {
    setProductsList((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, price: newPrice } : p))
    );
    try {
      await api.updateProductPrice(productId, newPrice);
      showToast(`Price updated to ${formatINR(newPrice)} in SQLite database`);
    } catch {
      showToast(`Price updated to ${formatINR(newPrice)} locally`);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
    try {
      await api.updateOrderStatus(orderId, newStatus);
      showToast(`Order ${orderId} status changed to "${newStatus}"`);
    } catch {
      showToast(`Order status updated to "${newStatus}"`);
    }
  };

  // Filter products by search and category
  const normalizedCategory = selectedCategory.trim().toLowerCase();
  const filteredProducts = productsList.filter((p) => {
    const matchesCategory = normalizedCategory === 'all' || p.category.trim().toLowerCase() === normalizedCategory;

    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q);

    return matchesCategory && matchesSearch;
  });

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'price-low') return a.price - b.price;
    if (sortBy === 'price-high') return b.price - a.price;
    if (sortBy === 'rating') return b.average_rating - a.average_rating;
    return 0; // relevance
  });

  const hasCatalogueFilters = normalizedCategory !== 'all' || Boolean(searchQuery.trim()) || sortBy !== 'relevance';

  const featuredProducts = productsList.filter((p) => p.is_featured);
  const featuredProductIds = new Set(featuredProducts.map((product) => product.id));
  const popularProducts = productsList.filter((p) => p.is_popular && !featuredProductIds.has(p.id));

  const totalCartCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0);

  const scrollToCatalog = () => {
    const el = document.getElementById('catalog-section');
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  const openAuthWithMode = (mode: 'customer_login' | 'register' | 'admin_login' = 'customer_login') => {
    setAuthModalMode(mode);
    setIsAuthOpen(true);
  };

  const openCart = () => currentUser ? setIsCartOpen(true) : openAuthWithMode('customer_login');
  const openWishlist = () => currentUser ? setIsWishlistOpen(true) : openAuthWithMode('customer_login');
  const openOrders = () => {
    if (!currentUser) return openAuthWithMode('customer_login');
    setActiveNav('orders');
    setIsOrdersOpen(true);
  };
  const setAuthenticatedNav = (nav: 'home' | 'products' | 'orders' | 'admin') => {
    if (nav !== 'home' && !currentUser) return openAuthWithMode('customer_login');
    if (nav === 'admin' && currentUser?.role !== 'admin') return;
    setActiveNav(nav);
  };

  return (
    <div aria-busy={sessionLoading} className="min-h-screen bg-[#F5F7F4] text-[#17212B] flex flex-col font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4 text-brand-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navbar with live Smart Search Dropdown, Wishlist & Cart badges */}
      <Navbar
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
        }}
        activeNav={activeNav}
        setActiveNav={setAuthenticatedNav}
        cartCount={currentUser ? totalCartCount : 0}
        wishlistCount={currentUser ? wishlist.length : 0}
        onOpenCart={openCart}
        onOpenWishlist={openWishlist}
        onOpenAuth={openAuthWithMode}
        onOpenOrders={openOrders}
        currentUser={currentUser}
        onLogout={() => {
          api.logout();
          setCurrentUser(null);
          setActiveNav('home');
          setIsCartOpen(false);
          setIsWishlistOpen(false);
          setIsOrdersOpen(false);
          setIsCheckoutOpen(false);
          setCart({});
          setOrders([]);
          setWishlist([]);
          showToast('Signed out successfully');
        }}
        products={productsList}
        onSelectProduct={setSelectedProduct}
        onSearchSubmit={scrollToCatalog}
      />

      {/* Main Content Area */}
      {activeNav === 'admin' && currentUser?.role === 'admin' ? (
        <div className="flex-1 bg-[#F5F7F4] pb-16">
          <div className="bg-slate-900 text-white py-4 px-6 border-b border-slate-800">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-brand-400" />
                  ShopCart Administrator Control Center
                </h1>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveNav('home')}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
                >
                  Return to Storefront
                </button>
              </div>
            </div>
          </div>

          {/* Admin Management Dashboard */}
          <AdminDashboard
            products={productsList}
            onUpdateProductStock={handleUpdateProductStock}
            onUpdateProductPrice={handleUpdateProductPrice}
            orders={orders}
            onUpdateOrderStatus={handleUpdateOrderStatus}
          />
        </div>
      ) : (
        <main className="flex-1">
          {/* Refined Hero Section */}
          <Hero
            onExploreCatalog={scrollToCatalog}
            onFeaturedGadgets={() => {
              setSelectedCategory('Electronics');
              scrollToCatalog();
            }}
          />

          {/* Floating Feature Bar */}
          <FeaturesBar />

          {/* Catalog Section */}
          <div id="catalog-section" className="pt-12 pb-6">
            {/* Category Bar */}
            <CategoriesSection
              products={productsList}
              selectedCategory={selectedCategory}
              onSelectCategory={(cat) => {
                setSelectedCategory(cat);
                if (cat === 'All') {
                  setSearchQuery('');
                  setSortBy('relevance');
                }
              }}
            />

            {/* Product Grids Container */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
              {/* Active Search & Category Feedback Bar with Sort Control */}
              {hasCatalogueFilters && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-brand-50/80 border border-brand-100 p-4 rounded-2xl gap-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-brand-950">
                    <span className="font-semibold text-slate-700">Filter:</span>
                    {searchQuery.trim() && (
                      <span className="bg-slate-900 text-white font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-xs">
                        <Search className="w-3 h-3 text-brand-400" />
                        "{searchQuery}"
                        <button
                          onClick={() => setSearchQuery('')}
                          className="hover:text-rose-400 ml-0.5 cursor-pointer"
                          title="Remove search"
                        >
                          ×
                        </button>
                      </span>
                    )}
                    {selectedCategory !== 'All' && (
                      <span className="bg-brand-600 text-white font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-xs">
                        Category: {selectedCategory}
                        <button
                          onClick={() => setSelectedCategory('All')}
                          className="hover:text-rose-300 ml-0.5 cursor-pointer"
                          title="Reset category"
                        >
                          ×
                        </button>
                      </span>
                    )}
                    <span className="text-slate-500 font-medium ml-1">
                      ({sortedProducts.length} {sortedProducts.length === 1 ? 'product' : 'products'} available)
                    </span>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-brand-600" />
                      <span className="font-semibold">Sort by:</span>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-brand-600 cursor-pointer shadow-2xs"
                      >
                        <option value="relevance">Relevance</option>
                        <option value="price-low">Price: Low to High</option>
                        <option value="price-high">Price: High to Low</option>
                        <option value="rating">Top Customer Rated</option>
                      </select>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedCategory('All');
                        setSearchQuery('');
                        setSortBy('relevance');
                      }}
                      className="text-xs text-brand-600 hover:text-brand-800 font-bold underline cursor-pointer"
                    >
                      Reset All
                    </button>
                  </div>
                </div>
              )}

              {/* IF SEARCH IS ACTIVE: Display Unified Search Results Grid */}
              {hasCatalogueFilters ? (
                <section className="space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h2 className="text-2xl font-extrabold text-[#17212B] tracking-tight flex items-center gap-2">
                        <Search className="w-5 h-5 text-brand-600" />
                        {searchQuery.trim() ? `Search Results for "${searchQuery}"` : normalizedCategory !== 'all' ? `${selectedCategory} Products` : 'Sorted Products'}
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Matched across titles, descriptions, categories, and brands
                      </p>
                    </div>
                    <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                      {sortedProducts.length} Results
                    </span>
                  </div>

                  {sortedProducts.length === 0 ? (
                    <div className="py-16 text-center bg-slate-50 rounded-2xl border border-slate-200/80 p-8 space-y-4">
                      <div className="w-16 h-16 rounded-2xl bg-brand-50 text-brand-400 flex items-center justify-center mx-auto">
                        <Search className="w-8 h-8" />
                      </div>
                      <h3 className="text-lg font-bold text-[#17212B]">
                        {searchQuery.trim() ? `No products found matching "${searchQuery}"` : 'No products match these filters'}
                      </h3>
                      <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                        We couldn't find products for this selection. Clear the filters to browse the full catalogue.
                      </p>

                      <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                        <span className="text-xs font-semibold text-slate-400">Popular:</span>
                        {['Headphones', 'MacBook', 'Shoes', 'Denim', 'Watch', 'Espresso'].map((kw) => (
                          <button
                            key={kw}
                            onClick={() => setSearchQuery(kw)}
                            className="px-3 py-1 bg-white hover:bg-brand-50 hover:text-brand-600 text-slate-700 text-xs font-semibold rounded-full border border-slate-200 transition-colors cursor-pointer"
                          >
                            {kw}
                          </button>
                        ))}
                      </div>

                      <div className="pt-2">
                        <button
                          onClick={() => {
                            setSearchQuery('');
                            setSelectedCategory('All');
                            setSortBy('relevance');
                          }}
                          className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
                        >
                          View All Store Products
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      {sortedProducts.map((product) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          onAddToCart={handleAddToCart}
                          onToggleWishlist={handleToggleWishlist}
                          isWishlisted={wishlist.includes(product.id)}
                          isInCart={(cart[product.id] || 0) > 0}
                          onSelectProduct={setSelectedProduct}
                        />
                      ))}
                    </div>
                  )}
                </section>
              ) : (
                /* Show separate featured and popular product groups */
                <>
                  {/* 1. Featured Products */}
                  <section className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-extrabold text-[#17212B] tracking-tight flex items-center gap-2">
                          <Award className="w-5 h-5 text-brand-600" />
                          Featured Products
                        </h2>
                        <p className="text-xs text-slate-500">
                          A few highlights from the catalogue
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-slate-500">
                        {featuredProducts.length} items
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      {featuredProducts.map((product) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          onAddToCart={handleAddToCart}
                          onToggleWishlist={handleToggleWishlist}
                          isWishlisted={wishlist.includes(product.id)}
                          isInCart={(cart[product.id] || 0) > 0}
                          onSelectProduct={setSelectedProduct}
                        />
                      ))}
                    </div>
                  </section>

                  {/* 2. Popular Products */}
                  <section className="space-y-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-extrabold text-[#17212B] tracking-tight flex items-center gap-2">
                          <TrendingUp className="w-5 h-5 text-brand-600" />
                          Popular Products
                        </h2>
                        <p className="text-xs text-slate-500">
                        Popular picks from the catalogue
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-slate-500">
                        {popularProducts.length} items
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      {popularProducts.map((product) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          onAddToCart={handleAddToCart}
                          onToggleWishlist={handleToggleWishlist}
                          isWishlisted={wishlist.includes(product.id)}
                          isInCart={(cart[product.id] || 0) > 0}
                          onSelectProduct={setSelectedProduct}
                        />
                      ))}
                    </div>
                  </section>

                </>
              )}
            </div>
          </div>

          {/* Pre-Footer CTA Card */}
          <PreFooterCta
            onBrowseAll={scrollToCatalog}
            onCreateAccount={() => openAuthWithMode('register')}
          />
        </main>
      )}

      {/* Global Footer */}
      <Footer
        onCategoryClick={(cat) => {
          setSelectedCategory(cat);
          setSearchQuery('');
          setSortBy('relevance');
          scrollToCatalog();
        }}
        onOpenCart={openCart}
        onOpenOrders={openOrders}
        onOpenAdmin={() => {
          if (currentUser?.role === 'admin') setActiveNav('admin');
          else openAuthWithMode('admin_login');
        }}
      />

      {/* Shopping Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen && Boolean(currentUser)}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        products={productsList}
        onUpdateQty={handleUpdateQty}
        onProceedToCheckout={() => currentUser && setIsCheckoutOpen(true)}
      />

      {/* Full-Featured Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen && Boolean(currentUser)}
        onClose={() => setIsCheckoutOpen(false)}
        cart={cart}
        products={productsList}
        currentUser={currentUser}
        onOrderSuccess={handleOrderConfirmed}
        onOpenOrders={openOrders}
      />

      {/* Saved Wishlist Modal */}
      <WishlistModal
        isOpen={isWishlistOpen && Boolean(currentUser)}
        onClose={() => setIsWishlistOpen(false)}
        wishlistIds={wishlist}
        products={productsList}
        onRemoveFromWishlist={handleRemoveFromWishlist}
        onMoveToCart={handleMoveToCart}
        onMoveAllToCart={handleMoveAllToCart}
        onClearWishlist={() => {
          setWishlist([]);
          api.clearWishlist();
          showToast('Wishlist cleared');
        }}
        onSelectProduct={setSelectedProduct}
      />

      {/* Order Tracking Modal */}
      <OrdersModal
        isOpen={isOrdersOpen && Boolean(currentUser)}
        onClose={() => setIsOrdersOpen(false)}
        orders={orders}
      />

      {/* Customer & Admin Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        initialMode={authModalMode}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          showToast(`Welcome, ${user.name}! (${user.role === 'admin' ? 'Admin Access Granted' : 'Customer Account'})`);
          setActiveNav('home');
        }}
      />

      {/* Product Details Modal with Indian Rupee Pricing */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 relative border border-slate-200 shadow-2xl">
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                <img
                  src={selectedProduct.image_url}
                  alt={selectedProduct.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-xs text-brand-600 font-bold uppercase mb-1">
                    <span>{selectedProduct.brand}</span>
                    <span className="text-slate-500">{selectedProduct.category}</span>
                  </div>
                  <h3 className="text-lg font-bold text-[#17212B] leading-snug">
                    {selectedProduct.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-2 text-xs">
                    <div className="flex items-center text-amber-500">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span className="font-bold text-slate-800 ml-1">
                        {selectedProduct.average_rating.toFixed(1)}
                      </span>
                    </div>
                    <span className="text-slate-400">({selectedProduct.review_count} reviews)</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-brand-600 font-semibold flex items-center gap-1">
                      <Package className="w-3.5 h-3.5" /> {selectedProduct.stock_quantity} In Stock
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {selectedProduct.description}
                </p>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="text-xl font-extrabold text-[#17212B] font-sans tracking-tight">
                      {formatINR(selectedProduct.price)}
                    </div>
                    {selectedProduct.original_price && selectedProduct.original_price > selectedProduct.price && (
                      <div className="text-xs text-slate-400 line-through">
                        {formatINR(selectedProduct.original_price)}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleWishlist(selectedProduct)}
                      className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                        wishlist.includes(selectedProduct.id)
                          ? 'bg-rose-50 border-rose-200 text-rose-600'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                      title="Wishlist"
                    >
                      <Heart className={`w-4 h-4 ${wishlist.includes(selectedProduct.id) ? 'fill-rose-500 text-rose-500' : ''}`} />
                    </button>
                    <button
                      onClick={() => {
                        handleAddToCart(selectedProduct);
                        setSelectedProduct(null);
                      }}
                      className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-xs"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span>Add to Bag</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeNav !== 'admin' && !isAuthOpen && (
        <ShopCartAssistant onSelectProduct={setSelectedProduct} />
      )}
    </div>
  );
}

