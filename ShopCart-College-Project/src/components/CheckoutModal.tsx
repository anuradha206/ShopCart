import React, { useEffect, useState } from 'react';
import {
  X,
  ShieldCheck,
  Truck,
  CreditCard,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShoppingBag,
  RotateCcw,
} from 'lucide-react';
import { Product, Order } from '../types';
import { formatINR } from '../utils/currency';
import { api } from '../services/api';
import { normalizeIndianPhone, PHONE_VALIDATION_MESSAGE } from '../utils/phone';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: { [productId: number]: number };
  products: Product[];
  currentUser: { name: string; email: string; role: string } | null;
  onOrderSuccess: (order: Order) => void;
  onOpenOrders: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  cart,
  products,
  currentUser,
  onOrderSuccess,
  onOpenOrders,
}) => {
  const [fullName, setFullName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'UPI' | 'Card' | 'NetBanking'>('COD');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.name);
      setEmail(currentUser.email);
    }
  }, [currentUser]);

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
  const freeShippingThreshold = 999;
  const shipping = subtotal >= freeShippingThreshold || subtotal === 0 ? 0 : 99;
  const total = subtotal + shipping;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Form validation
    if (!fullName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    const normalizedPhone = normalizeIndianPhone(phone);
    if (!normalizedPhone) {
      setErrorMessage(PHONE_VALIDATION_MESSAGE);
      return;
    }
    if (!address.trim()) {
      setErrorMessage('Please provide your street or campus delivery address.');
      return;
    }
    if (!city.trim() || !pincode.trim()) {
      setErrorMessage('Please specify city and PIN code.');
      return;
    }

    if (cartItems.length === 0) {
      setErrorMessage('Your cart is empty. Add items before placing an order.');
      return;
    }

    // Verify stock availability
    for (const item of cartItems) {
      if (item.quantity > item.product.stock_quantity) {
        setErrorMessage(
          `Insufficient stock for "${item.product.name}". Only ${item.product.stock_quantity} units available.`
        );
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const fullDeliveryAddress = `${address}, ${city}, ${state} - ${pincode} (Ph: ${normalizedPhone})`;
      const paymentDisplay =
        paymentMethod === 'COD'
          ? 'Cash on Delivery (COD)'
          : paymentMethod === 'UPI'
          ? 'UPI (Google Pay / PhonePe)'
          : paymentMethod === 'Card'
          ? 'Credit / Debit Card (RuPay/Visa)'
          : 'Net Banking';

      const payload = {
        user_name: fullName.trim(),
        user_email: email.trim().toLowerCase(),
        delivery_address: fullDeliveryAddress,
        phone: normalizedPhone,
        payment_method: paymentDisplay,
        items: cartItems.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
        })),
      };

      const res = await api.createOrder(payload);
      setPlacedOrder(res.order);
      onOrderSuccess(res.order);
    } catch (err: any) {
      const backendError =
        err?.response?.data?.error || err?.message || 'Failed to place order. Please try again.';
      setErrorMessage(backendError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setPlacedOrder(null);
    setErrorMessage(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-brand-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#17212B]">
                {placedOrder ? 'Order Confirmed' : 'Checkout'}
              </h2>
              <p className="text-xs text-slate-400">
                {placedOrder
                  ? 'Your order is confirmed'
                  : 'Review your delivery details and payment choice'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        {placedOrder ? (
          /* Order Confirmation View */
          <div className="p-8 overflow-y-auto text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <span className="text-xs font-semibold text-brand-600 uppercase tracking-wider bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
                Order Placed Successfully
              </span>
              <h3 className="text-2xl font-black text-[#17212B] tracking-tight mt-2">
                Thank You for Your Order!
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                Your order <strong className="text-slate-800 font-mono">{placedOrder.id}</strong> has been placed. You can review its status in My Orders.
              </p>
            </div>

            {/* Order Details Card */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 text-left max-w-lg mx-auto space-y-4">
              <div className="flex justify-between items-center text-xs pb-3 border-b border-slate-200">
                <span className="text-slate-500">Order Reference:</span>
                <span className="font-mono font-bold text-brand-600">{placedOrder.id}</span>
              </div>
              <div className="flex justify-between items-center text-xs pb-3 border-b border-slate-200">
                <span className="text-slate-500">Customer:</span>
                <span className="font-semibold text-[#17212B]">{placedOrder.user_name} ({placedOrder.user_email})</span>
              </div>
              <div className="flex justify-between items-center text-xs pb-3 border-b border-slate-200">
                <span className="text-slate-500">Payment Mode:</span>
                <span className="font-semibold text-[#17212B]">{placedOrder.payment_method}</span>
              </div>
              <div className="flex justify-between items-start text-xs pb-3 border-b border-slate-200">
                <span className="text-slate-500 shrink-0 mr-2">Delivery Address:</span>
                <span className="font-medium text-slate-800 text-right">{placedOrder.delivery_address}</span>
              </div>
              <div className="flex justify-between items-center text-xs pb-3 border-b border-slate-200">
                <span className="text-slate-500">Estimated Delivery:</span>
                <span className="font-bold text-brand-600">2-3 Business Days</span>
              </div>

              {/* Items List */}
              <div className="space-y-2 pt-1">
                <span className="text-xs font-bold text-slate-700">Ordered Items:</span>
                {placedOrder.items.map((it, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs text-slate-600">
                    <span className="truncate max-w-[260px]">
                      {it.quantity}x {it.name}
                    </span>
                    <span className="font-semibold text-[#17212B] font-sans">{formatINR(it.price * it.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center text-sm font-black text-[#17212B] pt-3 border-t border-slate-200">
                <span>Grand Total:</span>
                <span className="text-base text-brand-600 font-sans">{formatINR(placedOrder.total_amount)}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={() => {
                  handleClose();
                  onOpenOrders();
                }}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <Truck className="w-4 h-4" />
                <span>Track Order in My Orders</span>
              </button>

              <button
                onClick={handleClose}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs cursor-pointer"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        ) : (
          /* Checkout Form & Summary Grid */
          <form onSubmit={handlePlaceOrder} className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left 7 Columns: Delivery & Payment Details */}
            <div className="lg:col-span-7 space-y-6">
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Delivery Details Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#17212B] uppercase tracking-wider">
                  <MapPin className="w-4 h-4 text-brand-600" />
                  <span>1. Delivery Information</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Anuradha Pandey"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[#17212B] focus:bg-white focus:ring-2 focus:ring-brand-600 focus:border-transparent outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Mobile Number (10 digits) *</label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => { setPhone(e.target.value); setPhoneError(null); }}
                      onBlur={() => setPhoneError(normalizeIndianPhone(phone) ? null : PHONE_VALIDATION_MESSAGE)}
                      aria-invalid={Boolean(phoneError)}
                      aria-describedby={phoneError ? 'checkout-phone-error' : undefined}
                      placeholder="e.g. 9876543210"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[#17212B] focus:bg-white focus:ring-2 focus:ring-brand-600 focus:border-transparent outline-none transition-all"
                    />
                    {phoneError && <p id="checkout-phone-error" role="alert" className="mt-1 text-[11px] text-rose-600">{phoneError}</p>}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-600 font-medium mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[#17212B] focus:bg-white focus:ring-2 focus:ring-brand-600 focus:border-transparent outline-none transition-all"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-600 font-medium mb-1">Street / Hostel / Campus Address *</label>
                    <textarea
                      required
                      rows={2}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Flat, House no., Building, Company, Apartment, Hostel room"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[#17212B] focus:bg-white focus:ring-2 focus:ring-brand-600 focus:border-transparent outline-none transition-all resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">City *</label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Mumbai"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[#17212B] focus:bg-white focus:ring-2 focus:ring-brand-600 focus:border-transparent outline-none transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">State *</label>
                      <input
                        type="text"
                        required
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        placeholder="Maharashtra"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[#17212B] focus:bg-white focus:ring-2 focus:ring-brand-600 focus:border-transparent outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 font-medium mb-1">PIN Code *</label>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                        placeholder="400076"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[#17212B] focus:bg-white focus:ring-2 focus:ring-brand-600 focus:border-transparent outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Method Section */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2 text-xs font-bold text-[#17212B] uppercase tracking-wider">
                  <CreditCard className="w-4 h-4 text-brand-600" />
                  <span>2. Payment Option</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <label
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      paymentMethod === 'COD'
                        ? 'border-brand-600 bg-brand-50/50 shadow-2xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === 'COD'}
                        onChange={() => setPaymentMethod('COD')}
                        className="text-brand-600 focus:ring-brand-600 cursor-pointer"
                      />
                      <div>
                        <div className="font-bold text-[#17212B]">Cash on Delivery (COD)</div>
                        <div className="text-[10px] text-slate-500">Pay cash or UPI upon delivery</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded">
                      Popular
                    </span>
                  </label>

                  <label
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      paymentMethod === 'UPI'
                        ? 'border-brand-600 bg-brand-50/50 shadow-2xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === 'UPI'}
                        onChange={() => setPaymentMethod('UPI')}
                        className="text-brand-600 focus:ring-brand-600 cursor-pointer"
                      />
                      <div>
                        <div className="font-bold text-[#17212B]">Instant UPI Payment</div>
                        <div className="text-[10px] text-slate-500">Google Pay, PhonePe, Paytm</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded">
                      Instant
                    </span>
                  </label>

                  <label
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      paymentMethod === 'Card'
                        ? 'border-brand-600 bg-brand-50/50 shadow-2xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === 'Card'}
                        onChange={() => setPaymentMethod('Card')}
                        className="text-brand-600 focus:ring-brand-600 cursor-pointer"
                      />
                      <div>
                        <div className="font-bold text-[#17212B]">Debit / Credit Card</div>
                        <div className="text-[10px] text-slate-500">RuPay, Visa, Mastercard</div>
                      </div>
                    </div>
                  </label>

                  <label
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      paymentMethod === 'NetBanking'
                        ? 'border-brand-600 bg-brand-50/50 shadow-2xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === 'NetBanking'}
                        onChange={() => setPaymentMethod('NetBanking')}
                        className="text-brand-600 focus:ring-brand-600 cursor-pointer"
                      />
                      <div>
                        <div className="font-bold text-[#17212B]">Net Banking</div>
                        <div className="text-[10px] text-slate-500">SBI, HDFC, ICICI, Axis & more</div>
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Right 5 Columns: Order Items & Pricing Breakdown */}
            <div className="lg:col-span-5 bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <h3 className="text-xs font-bold text-[#17212B] uppercase tracking-wider flex items-center gap-1.5">
                    <ShoppingBag className="w-3.5 h-3.5 text-brand-600" />
                    <span>Order Summary</span>
                  </h3>
                  <span className="text-xs font-semibold text-slate-500">
                    {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
                  </span>
                </div>

                {/* Items list */}
                <div className="max-h-52 overflow-y-auto py-3 space-y-2.5 pr-1">
                  {cartItems.map(({ product, quantity, subtotal }) => (
                    <div key={product.id} className="flex items-center gap-2.5 text-xs">
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-10 h-10 rounded-md object-cover bg-white border border-slate-200 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[#17212B] truncate" title={product.name}>
                          {product.name}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Qty: {quantity} × {formatINR(product.price)}
                        </p>
                      </div>
                      <span className="font-bold text-slate-800 shrink-0 font-sans">
                        {formatINR(subtotal)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Pricing Math */}
                <div className="space-y-1.5 text-xs text-slate-600 pt-3 border-t border-slate-200">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-semibold text-[#17212B] font-sans">{formatINR(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Fee</span>
                    <span className="font-semibold text-brand-600 font-sans">
                      {shipping === 0 ? 'FREE' : formatINR(shipping)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400 text-[11px]">
                    <span>GST / Sales Tax</span>
                    <span>Included in price</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-[#17212B] pt-2 border-t border-slate-200">
                    <span>Total Amount</span>
                    <span className="text-base text-brand-600 font-black font-sans">{formatINR(total)}</span>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="space-y-2 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || cartItems.length === 0}
                  className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:bg-slate-300 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-brand-600/30 transition-transform hover:scale-[1.01] cursor-pointer"
                >
                  {isSubmitting ? (
                    <span>Processing Order...</span>
                  ) : (
                    <>
                      <span>Place Order • {formatINR(total)}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-brand-500" />
                  <span>Your order is submitted for processing</span>
                </div>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
