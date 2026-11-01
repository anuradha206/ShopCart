import React from 'react';
import { Star, ShoppingCart, Heart, Check, Sparkles } from 'lucide-react';
import { Product } from '../types';
import { formatINR } from '../utils/currency';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onToggleWishlist: (product: Product) => void;
  isWishlisted: boolean;
  isInCart: boolean;
  onSelectProduct: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  onToggleWishlist,
  isWishlisted,
  isInCart,
  onSelectProduct,
}) => {
  const isOutOfStock = product.stock_quantity <= 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-2xs hover:shadow-md transition-all group flex flex-col justify-between hover:border-brand-300">
      {/* Product Image Box */}
      <div
        className="relative aspect-square bg-slate-100 overflow-hidden cursor-pointer"
        onClick={() => onSelectProduct(product)}
      >
        <img
          src={product.image_url}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* Refined subtle badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10 pointer-events-none">
          {product.is_recommended && (
            <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" /> Recommended
            </span>
          )}
          {product.stock_quantity > 0 && product.stock_quantity <= 5 && (
            <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs">
              Only {product.stock_quantity} left
            </span>
          )}
          {isOutOfStock && (
            <span className="bg-slate-800 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs">
              Out of Stock
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleWishlist(product);
          }}
          className={`absolute top-2.5 right-2.5 p-2 rounded-full shadow-md transition-all cursor-pointer ${
            isWishlisted
              ? 'bg-rose-50 text-rose-600 border border-rose-200 scale-105'
              : 'bg-white/90 hover:bg-white text-slate-500 hover:text-rose-600 border border-slate-200'
          }`}
          title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-rose-500 text-rose-500' : ''}`} />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
            <span className="font-semibold text-brand-600 uppercase tracking-wider">{product.brand}</span>
            <span className="text-slate-400">{product.category}</span>
          </div>

          <h3
            onClick={() => onSelectProduct(product)}
            className="text-sm font-semibold text-[#17212B] group-hover:text-brand-600 transition-colors line-clamp-1 cursor-pointer"
            title={product.name}
          >
            {product.name}
          </h3>

          <p className="text-xs text-slate-500 line-clamp-2 mt-1 mb-2 leading-relaxed">
            {product.description}
          </p>
        </div>

        <div>
          {/* Rating & Stock */}
          <div className="flex items-center gap-1 mb-3 text-xs">
            <div className="flex items-center text-amber-500">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="font-bold text-slate-800 ml-1">{product.average_rating.toFixed(1)}</span>
            </div>
            <span className="text-slate-400 text-[11px]">({product.review_count})</span>
            <span className="text-slate-300 mx-1">•</span>
            {isOutOfStock ? (
              <span className="text-[11px] text-rose-600 font-medium">Out of stock</span>
            ) : (
              <span className="text-[11px] text-brand-600 font-medium">{product.stock_quantity} in stock</span>
            )}
          </div>

          {/* Pricing in Indian Rupees (₹) & Add to Cart */}
          <div className="flex items-center justify-between pt-2.5 border-t border-slate-100">
            <div>
              <span className="text-base font-extrabold text-[#17212B] font-sans tracking-tight">
                {formatINR(product.price)}
              </span>
              {product.original_price && product.original_price > product.price && (
                <span className="text-xs text-slate-400 line-through ml-1.5 font-normal">
                  {formatINR(product.original_price)}
                </span>
              )}
            </div>

            <button
              onClick={() => onAddToCart(product)}
              disabled={isOutOfStock}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                isOutOfStock
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                  : isInCart
                  ? 'bg-brand-50 text-brand-700 border border-brand-300 hover:bg-brand-100'
                  : 'bg-brand-600 hover:bg-brand-500 text-white shadow-xs hover:shadow-sm'
              }`}
            >
              {isInCart ? (
                <>
                  <Check className="w-3.5 h-3.5" /> In Cart
                </>
              ) : isOutOfStock ? (
                'Sold Out'
              ) : (
                <>
                  <ShoppingCart className="w-3.5 h-3.5" /> Add
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
