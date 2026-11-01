import React from 'react';
import { X, Heart, ShoppingCart, Trash2, ArrowRight, Package } from 'lucide-react';
import { Product } from '../types';
import { formatINR } from '../utils/currency';

interface WishlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  wishlistIds: number[];
  products: Product[];
  onRemoveFromWishlist: (productId: number) => void;
  onMoveToCart: (product: Product) => void;
  onMoveAllToCart: () => void;
  onClearWishlist: () => void;
  onSelectProduct: (product: Product) => void;
}

export const WishlistModal: React.FC<WishlistModalProps> = ({
  isOpen,
  onClose,
  wishlistIds,
  products,
  onRemoveFromWishlist,
  onMoveToCart,
  onMoveAllToCart,
  onClearWishlist,
  onSelectProduct,
}) => {
  if (!isOpen) return null;

  const wishlistedProducts = products.filter((p) => wishlistIds.includes(p.id));

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Heart className="w-5 h-5 fill-rose-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#17212B]">Saved Wishlist</h2>
              <p className="text-xs text-slate-400">
                {wishlistedProducts.length} {wishlistedProducts.length === 1 ? 'item' : 'items'} saved for later
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {wishlistedProducts.length > 0 && (
              <button
                onClick={onClearWishlist}
                className="text-xs text-slate-400 hover:text-rose-600 font-medium px-2 py-1 rounded hover:bg-rose-50 transition-colors cursor-pointer"
              >
                Clear All
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Wishlist Items List */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3">
          {wishlistedProducts.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-400 flex items-center justify-center mb-4">
                <Heart className="w-8 h-8 stroke-[1.5]" />
              </div>
              <h3 className="text-base font-bold text-[#17212B]">Your wishlist is empty</h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1 mb-6 leading-relaxed">
                Click the heart icon on any product in the store to save it here for easy checkout later.
              </p>
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs flex items-center gap-2 shadow-md shadow-brand-600/20 cursor-pointer"
              >
                <span>Browse Store Catalog</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            wishlistedProducts.map((product) => (
              <div
                key={product.id}
                className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                {/* Product thumbnail & metadata */}
                <div
                  onClick={() => {
                    onSelectProduct(product);
                    onClose();
                  }}
                  className="flex items-center gap-3.5 cursor-pointer flex-1 min-w-0"
                >
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-16 h-16 rounded-xl object-cover bg-white border border-slate-200 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <span className="font-semibold text-brand-600 uppercase tracking-wider">
                        {product.brand}
                      </span>
                      <span>•</span>
                      <span>{product.category}</span>
                    </div>

                    <h4 className="text-xs font-bold text-[#17212B] truncate mt-0.5 hover:text-brand-600 transition-colors">
                      {product.name}
                    </h4>

                    <div className="flex items-center gap-2 mt-1.5 text-xs">
                      <span className="font-bold text-[#17212B] font-sans">
                        {formatINR(product.price)}
                      </span>
                      {product.original_price && product.original_price > product.price && (
                        <span className="text-[11px] text-slate-400 line-through font-normal">
                          {formatINR(product.original_price)}
                        </span>
                      )}
                      <span className="text-slate-300">•</span>
                      <span className="text-[11px] text-brand-600 font-medium flex items-center gap-1">
                        <Package className="w-3 h-3" /> {product.stock_quantity} In Stock
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions: Move to Cart & Remove */}
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60">
                  <button
                    onClick={() => onMoveToCart(product)}
                    className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>Move to Cart</span>
                  </button>

                  <button
                    onClick={() => onRemoveFromWishlist(product.id)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors cursor-pointer"
                    title="Remove from wishlist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {wishlistedProducts.length > 0 && (
          <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              Saved items are synced with your ShopCart account
            </span>
            <button
              onClick={onMoveAllToCart}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Move All to Cart</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
