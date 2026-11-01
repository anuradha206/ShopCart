import React from 'react';
import {
  ShoppingCart,
  CreditCard,
  Headphones,
} from 'lucide-react';

interface FooterProps {
  onCategoryClick: (categoryName: string) => void;
  onOpenCart: () => void;
  onOpenOrders: () => void;
  onOpenAdmin: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onCategoryClick,
  onOpenCart,
  onOpenOrders,
  onOpenAdmin,
}) => {
  return (
    <footer className="bg-[#030712] text-slate-400 border-t border-slate-900 text-xs mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Column 1: Brand & Badges */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-md shadow-brand-600/30">
                <ShoppingCart className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span className="text-xl font-extrabold text-white tracking-tight">
                ShopCart
              </span>
            </div>

            <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
              Browse everyday products, manage your shopping cart and place orders with ShopCart.
            </p>

            <div className="flex items-center gap-3 pt-2 text-xs">
              <div className="flex items-center gap-1.5 text-brand-400 font-medium">
                <CreditCard className="w-4 h-4 stroke-[2]" />
                <span>Prices shown in INR</span>
              </div>
            </div>
          </div>

          {/* Column 2: SHOP & EXPLORE */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Shop & Explore
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onCategoryClick('All')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  All Catalog Products
                </button>
              </li>
              <li>
                <button
                  onClick={() => onCategoryClick('Electronics')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Electronics & Gadgets
                </button>
              </li>
              <li>
                <button
                  onClick={() => onCategoryClick('Clothing')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Clothing & Apparel
                </button>
              </li>
              <li>
                <button
                  onClick={() => onCategoryClick('Books')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Books & Literature
                </button>
              </li>
              <li>
                <button
                  onClick={() => onCategoryClick('Home & Kitchen')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Home & Kitchen
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: CUSTOMER CARE */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Customer Care
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={onOpenCart}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  View Shopping Bag
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenOrders}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Track Your Order
                </button>
              </li>
              <li>
                <button
                  onClick={() => onCategoryClick('All')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Browse products
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenOrders}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Order history
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: WHY CHOOSE SHOPCART */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Why Choose ShopCart
            </h4>
            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-2.5">
                <CreditCard className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span className="leading-snug">
                  Choose from the payment options available at checkout.
                </span>
              </div>

              <div className="flex items-start gap-2.5">
                <Headphones className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span className="leading-snug">
                  Save products to your wishlist.
                </span>
              </div>

              <div className="flex items-start gap-2.5">
                <ShoppingCart className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span className="leading-snug">
                  Product availability is shown on each product card.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <p>ShopCart · Prices shown in Indian rupees</p>

          <div className="flex items-center gap-6">
            <button
              onClick={onOpenAdmin}
              className="text-brand-400 hover:text-brand-300 transition-colors font-medium cursor-pointer"
            >
              Admin Portal
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
