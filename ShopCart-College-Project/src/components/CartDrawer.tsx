import React from 'react';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { Product } from '../types';
import { formatINR } from '../utils/currency';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: { [productId: number]: number };
  products: Product[];
  onUpdateQty: (productId: number, newQty: number) => void;
  onProceedToCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  products,
  onUpdateQty,
  onProceedToCheckout,
}) => {
  if (!isOpen) return null;

  const cartProductIds = Object.keys(cart).map(Number).filter((id) => cart[id] > 0);
  const cartItems = cartProductIds
    .map((id) => {
      const product = products.find((p) => p.id === id);
      if (!product) return null;
      return {
        product,
        quantity: cart[id],
        subtotal: product.price * cart[id],
      };
    })
    .filter((item): item is { product: Product; quantity: number; subtotal: number } => Boolean(item));

  const subtotal = cartItems.reduce((sum, item) => sum + item.subtotal, 0);
  // Free delivery for orders over ₹999 in India
  const freeShippingThreshold = 999;
  const shipping = subtotal >= freeShippingThreshold || subtotal === 0 ? 0 : 99;
  const total = subtotal + shipping;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#17212B]">Your Shopping Bag</h2>
              <p className="text-xs text-slate-400">
                {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} selected
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Item List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-4">
              <div className="w-16 h-16 rounded-2xl bg-brand-50 text-brand-400 flex items-center justify-center mb-4">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h3 className="text-sm font-bold text-[#17212B]">Your cart is empty</h3>
              <p className="text-xs text-slate-500 max-w-xs mt-1 leading-relaxed">
                Explore our curated catalog and add products to your shopping bag to place an order.
              </p>
              <button
                onClick={onClose}
                className="mt-4 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            cartItems.map(({ product, quantity, subtotal }) => (
              <div
                key={product.id}
                className="flex items-center gap-3.5 p-3 rounded-xl border border-slate-100 bg-slate-50/50"
              >
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-16 h-16 rounded-lg object-cover bg-white border border-slate-200 shrink-0"
                />

                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-[#17212B] truncate" title={product.name}>
                    {product.name}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">
                    {formatINR(product.price)} each
                  </p>

                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => onUpdateQty(product.id, quantity - 1)}
                      className="w-6 h-6 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 cursor-pointer"
                      title="Decrease quantity"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-bold text-[#17212B] px-1 font-mono">
                      {quantity}
                    </span>
                    <button
                      onClick={() => onUpdateQty(product.id, quantity + 1)}
                      disabled={quantity >= product.stock_quantity}
                      className="w-6 h-6 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      title={quantity >= product.stock_quantity ? `Max available: ${product.stock_quantity}` : 'Increase quantity'}
                    >
                      <Plus className="w-3 h-3" />
                    </button>

                    {quantity >= product.stock_quantity && (
                      <span className="text-[10px] text-amber-600 font-semibold ml-1">Max stock</span>
                    )}

                    <button
                      onClick={() => onUpdateQty(product.id, 0)}
                      className="ml-auto text-slate-400 hover:text-rose-500 p-1 cursor-pointer"
                      title="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-bold text-[#17212B] font-sans">
                    {formatINR(subtotal)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer with Calculations & Checkout in INR */}
        {cartItems.length > 0 && (
          <div className="p-6 border-t border-slate-100 bg-slate-50/70 space-y-3 text-xs">
            {subtotal < freeShippingThreshold && (
              <div className="bg-brand-50 border border-brand-100 text-brand-700 px-3 py-1.5 rounded-lg text-[11px] flex items-center justify-between">
                <span>Add {formatINR(freeShippingThreshold - subtotal)} more for <strong>FREE Delivery</strong></span>
              </div>
            )}

            <div className="space-y-1.5 text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-[#17212B]">{formatINR(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Charges</span>
                <span className="font-semibold text-brand-600">
                  {shipping === 0 ? 'FREE' : formatINR(shipping)}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold text-[#17212B] pt-2 border-t border-slate-200">
                <span>Total Amount</span>
                <span className="text-base text-brand-600 font-extrabold">{formatINR(total)}</span>
              </div>
            </div>

            <button
              onClick={() => {
                onClose();
                onProceedToCheckout();
              }}
              className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-brand-600/30 transition-transform hover:scale-[1.01] cursor-pointer"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
