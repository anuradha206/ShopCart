import React, { useState, useRef, useEffect } from 'react';
import {
  ShoppingCart,
  Heart,
  Search,
  ChevronDown,
  User,
  ShieldCheck,
  Package,
  Activity,
  LogOut,
  Sparkles,
  LogIn,
  X,
  ArrowRight,
  Star,
} from 'lucide-react';
import { Product } from '../types';
import { formatINR } from '../utils/currency';

interface NavbarProps {
  onSearchChange: (query: string) => void;
  searchQuery: string;
  activeNav: 'home' | 'products' | 'orders' | 'admin';
  setActiveNav: (nav: 'home' | 'products' | 'orders' | 'admin') => void;
  cartCount: number;
  wishlistCount: number;
  onOpenCart: () => void;
  onOpenWishlist: () => void;
  onOpenAuth: (initialMode?: 'customer_login' | 'register' | 'admin_login') => void;
  onOpenOrders: () => void;
  currentUser: { name: string; email: string; role: 'customer' | 'admin' } | null;
  onLogout: () => void;
  products?: Product[];
  onSelectProduct?: (product: Product) => void;
  onSearchSubmit?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onSearchChange,
  searchQuery,
  activeNav,
  setActiveNav,
  cartCount,
  wishlistCount,
  onOpenCart,
  onOpenWishlist,
  onOpenAuth,
  onOpenOrders,
  currentUser,
  onLogout,
  products = [],
  onSelectProduct,
  onSearchSubmit,
}) => {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const userInitial = currentUser ? currentUser.name.charAt(0).toUpperCase() : 'U';

  // Popular search keywords
  const popularKeywords = ['Headphones', 'MacBook', 'Shoes', 'Denim', 'Watch', 'Espresso'];

  // Live matching products
  const liveMatches = searchQuery.trim()
    ? products
        .filter((p) => {
          const q = searchQuery.toLowerCase();
          return (
            p.name.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q) ||
            p.brand.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q)
          );
        })
        .slice(0, 5)
    : [];

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setSearchFocused(false);
      if (onSearchSubmit) {
        onSearchSubmit();
      }
    } else if (e.key === 'Escape') {
      setSearchFocused(false);
      inputRef.current?.blur();
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-100 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4 lg:gap-6">
          {/* Left Group: Brand + authenticated navigation */}
          <div className="flex items-center gap-6 shrink-0">
            <button
              onClick={() => {
                setActiveNav('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              aria-label="ShopCart home"
              className="flex items-center gap-3 cursor-pointer select-none group text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-[#16718A] flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
                <ShoppingCart className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-extrabold tracking-tight text-[#17212B] group-hover:text-brand-600 transition-colors leading-none">
                  ShopCart
                </span>
                <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400 mt-1">
                  PREMIUM STORE
                </span>
              </div>
            </button>

            {/* Shopping navigation is available after sign in */}
            <nav className="hidden md:flex items-center gap-2">
              {currentUser && <button
                onClick={() => {
                  setActiveNav('products');
                  if (onSearchSubmit) onSearchSubmit();
                }}
                className={`px-3 py-2 text-sm font-medium transition-all cursor-pointer ${
                  activeNav === 'products'
                    ? 'text-[#16718A] font-semibold'
                    : 'text-[#475569] hover:text-[#1e293b]'
                }`}
              >
                Products
              </button>}
              {currentUser && <button
                onClick={() => {
                  setActiveNav('orders');
                  onOpenOrders();
                }}
                className={`px-3 py-2 text-sm font-medium transition-all cursor-pointer ${
                  activeNav === 'orders'
                    ? 'text-[#16718A] font-semibold'
                    : 'text-[#475569] hover:text-[#1e293b]'
                }`}
              >
                My Orders
              </button>}

              {currentUser?.role === 'admin' && (
                <button
                  onClick={() => setActiveNav('admin')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ml-2 ${
                    activeNav === 'admin'
                      ? 'bg-brand-600 text-white shadow-xs'
                      : 'bg-brand-50 text-brand-700 hover:bg-brand-100'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Admin</span>
                </button>
              )}
            </nav>
          </div>

          {/* Center Search Bar: Pill Shaped with Icon (Matching Screenshot Exactly) */}
          <div ref={searchContainerRef} className="flex-1 max-w-xl relative mx-1 sm:mx-2">
            <div className="relative w-full flex items-center">
              <div className="w-full flex items-center bg-[#F0F4F1] hover:bg-[#EAF3EF] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#16718A] rounded-full px-4 py-2.5 transition-all">
                <Search className="w-4 h-4 text-[#94a3b8] stroke-[1.8] shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onFocus={() => setSearchFocused(true)}
                  onChange={(e) => {
                    onSearchChange(e.target.value);
                    setSearchFocused(true);
                    if (activeNav === 'admin') {
                      setActiveNav('home');
                    }
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Search products, brands, categories..."
                  className="bg-transparent border-0 outline-none text-[#1e293b] placeholder-[#94a3b8] w-full text-sm pl-3 pr-2"
                />

                {/* Clear button when query is present */}
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      onSearchChange('');
                      setSearchFocused(false);
                      inputRef.current?.focus();
                    }}
                    className="text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-200 transition-colors cursor-pointer"
                    title="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Smart Search Flyout Menu (Module 13) */}
            {searchFocused && (
              <div className="absolute top-13 left-0 right-0 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 text-xs animate-in fade-in slide-in-from-top-2 duration-150">
                {searchQuery.trim() ? (
                  <div>
                    <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-slate-500 font-semibold">
                      <span>Matching Products ({liveMatches.length})</span>
                      <button
                        onClick={() => {
                          setSearchFocused(false);
                          if (onSearchSubmit) onSearchSubmit();
                        }}
                        className="text-brand-600 hover:underline flex items-center gap-1 cursor-pointer font-bold"
                      >
                        <span>See All Results</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>

                    {liveMatches.length === 0 ? (
                      <div className="p-6 text-center text-slate-500">
                        <p className="font-semibold text-slate-800">
                          No products found matching "{searchQuery}"
                        </p>
                        <p className="text-[11px] mt-1 text-slate-400">
                          Try searching for "Headphones", "MacBook", "Shoes", or "Denim".
                        </p>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                        {liveMatches.map((p) => (
                          <div
                            key={p.id}
                            onClick={() => {
                              if (onSelectProduct) {
                                onSelectProduct(p);
                              }
                              setSearchFocused(false);
                            }}
                            className="p-3 hover:bg-slate-50 flex items-center justify-between gap-3 cursor-pointer transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <img
                                src={p.image_url}
                                alt={p.name}
                                className="w-10 h-10 rounded-lg object-cover bg-slate-100 shrink-0 border border-slate-200"
                              />
                              <div className="min-w-0">
                                <p className="font-bold text-[#17212B] truncate">{p.name}</p>
                                <p className="text-[11px] text-slate-400">
                                  {p.brand} • <span className="text-brand-600 font-medium">{p.category}</span>
                                </p>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <span className="font-bold text-[#17212B] font-sans">
                                {formatINR(p.price)}
                              </span>
                              <div className="flex items-center justify-end gap-1 text-[10px] text-amber-500 mt-0.5">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                <span>{p.average_rating.toFixed(1)}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 space-y-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                      ⚡ Quick Search Suggestions:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {popularKeywords.map((kw) => (
                        <button
                          key={kw}
                          type="button"
                          onClick={() => {
                            onSearchChange(kw);
                            setSearchFocused(false);
                            if (onSearchSubmit) onSearchSubmit();
                          }}
                          className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-brand-50 hover:text-brand-600 text-slate-700 font-medium transition-colors cursor-pointer text-xs"
                        >
                          {kw}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Action Icons: Wishlist, Cart & User Profile */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            {currentUser && <>
            {/* Wishlist Icon with Counter Badge */}
            <button
              onClick={onOpenWishlist}
              className="relative p-2 text-slate-700 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer group"
              title="View Wishlist (Module 6)"
            >
              <Heart className={`w-5 h-5 stroke-[2] ${wishlistCount > 0 ? 'text-rose-500 fill-rose-500/20' : ''}`} />
              {wishlistCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-rose-500 text-white font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* Cart Icon with Counter Badge */}
            <button
              onClick={onOpenCart}
              className="relative p-2 text-slate-700 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-colors cursor-pointer"
              title="Shopping Cart (Module 7)"
            >
              <ShoppingCart className="w-5 h-5 stroke-[2]" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-brand-600 text-white font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center shadow-xs animate-pulse">
                  {cartCount}
                </span>
              )}
            </button>
            </>}

            {/* User Profile Pill / Dropdown OR Sign-In Button */}
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2.5 p-1 rounded-full hover:bg-slate-50 transition-colors cursor-pointer text-left"
                >
                  <div className={`w-8 h-8 rounded-full font-bold flex items-center justify-center text-xs shadow-2xs border ${
                    currentUser.role === 'admin'
                      ? 'bg-brand-100 text-brand-700 border-brand-200'
                      : 'bg-brand-100 text-brand-700 border-brand-200'
                  }`}>
                    {userInitial}
                  </div>
                  <div className="hidden sm:flex items-center gap-1 text-slate-800 text-xs font-semibold">
                    <span className="max-w-[120px] truncate">{currentUser.name}</span>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${profileDropdownOpen ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {/* Profile Menu Dropdown */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-50">
                    <div className="px-3.5 py-2.5 border-b border-slate-100 text-xs">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-[#17212B]">{currentUser.name}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                          currentUser.role === 'admin'
                            ? 'bg-brand-100 text-brand-700'
                            : 'bg-brand-100 text-brand-700'
                        }`}>
                          {currentUser.role}
                        </span>
                      </div>
                      <p className="text-slate-400 text-[11px] truncate mt-0.5">{currentUser.email}</p>
                    </div>

                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        onOpenWishlist();
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-rose-50 hover:text-rose-600 flex items-center justify-between cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Heart className="w-3.5 h-3.5 text-rose-500" />
                        <span>Saved Wishlist</span>
                      </span>
                      <span className="bg-rose-100 text-rose-700 font-bold px-1.5 py-0.5 rounded text-[10px]">
                        {wishlistCount}
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        onOpenOrders();
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-brand-50 hover:text-brand-600 flex items-center gap-2 cursor-pointer"
                    >
                      <Package className="w-3.5 h-3.5 text-slate-500" />
                      <span>My Orders & Tracking</span>
                    </button>

                    {currentUser.role === 'admin' && <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        setActiveNav('admin');
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs text-brand-700 font-medium hover:bg-brand-50 flex items-center gap-2 cursor-pointer"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-brand-600" />
                      <span>Admin Management Dashboard</span>
                    </button>}

                    <div className="border-t border-slate-100 my-1"></div>

                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        onOpenAuth('customer_login');
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs text-slate-600 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>Switch User Account</span>
                    </button>

                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        onLogout();
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenAuth('customer_login')}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 flex items-center gap-1.5 cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
                <button
                  onClick={() => onOpenAuth('register')}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#16718A] hover:bg-brand-600 text-white shadow-xs cursor-pointer"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

