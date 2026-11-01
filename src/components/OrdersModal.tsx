import React, { useState } from 'react';
import { X, Package, CheckCircle2, Truck } from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { formatINR } from '../utils/currency';

interface OrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
}

export const OrdersModal: React.FC<OrdersModalProps> = ({ isOpen, onClose, orders }) => {
  if (!isOpen) return null;

  const [selectedOrderId, setSelectedOrderId] = useState<string>(orders[0]?.id || '');
  const selectedOrder = orders.find((o) => o.id === selectedOrderId) || orders[0];

  const statusPipeline: { title: OrderStatus; desc: string }[] = [
    { title: 'Pending', desc: 'Order received' },
    { title: 'Confirmed', desc: 'Verified & Accepted' },
    { title: 'Packed', desc: 'Package prepared' },
    { title: 'Shipped', desc: 'In transit to hub' },
    { title: 'Out for Delivery', desc: 'With courier agent' },
    { title: 'Delivered', desc: 'Delivered successfully' },
  ];

  const getStepState = (stepStatus: OrderStatus, currentStatus: OrderStatus) => {
    const orderIndex = statusPipeline.findIndex((s) => s.title === currentStatus);
    const stepIndex = statusPipeline.findIndex((s) => s.title === stepStatus);

    if (currentStatus === 'Cancelled') {
      return { done: false, current: false, cancelled: true };
    }

    if (stepIndex < orderIndex) {
      return { done: true, current: false };
    } else if (stepIndex === orderIndex) {
      return { done: true, current: true };
    } else {
      return { done: false, current: false };
    }
  };

  const getProgressPercentage = (status: OrderStatus) => {
    switch (status) {
      case 'Pending':
        return 10;
      case 'Confirmed':
        return 28;
      case 'Packed':
        return 48;
      case 'Shipped':
        return 68;
      case 'Out for Delivery':
        return 88;
      case 'Delivered':
        return 100;
      case 'Cancelled':
        return 0;
      default:
        return 50;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-6 relative border border-slate-200 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#17212B]">
                My Orders & Delivery Tracking
              </h3>
              <p className="text-xs text-slate-400">
                Track live status, delivery address, and SQLite order history
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

        {/* Content */}
        <div className="py-4 overflow-y-auto flex-1 space-y-6">
          {/* Order Selector Tabs */}
          {orders.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              {orders.map((o) => (
                <button
                  key={o.id}
                  onClick={() => setSelectedOrderId(o.id)}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    selectedOrder?.id === o.id
                      ? 'bg-brand-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {o.id} ({o.status})
                </button>
              ))}
            </div>
          )}

          {selectedOrder ? (
            <div className="space-y-6">
              {/* Order Meta Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400">Order ID: </span>
                  <strong className="text-[#17212B] font-mono">{selectedOrder.id}</strong>
                  <span className="text-slate-300 mx-2">•</span>
                  <span className="text-slate-500">{selectedOrder.created_at}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Live Status:</span>
                  <span className="bg-brand-600 text-white font-bold px-2.5 py-0.5 rounded-full text-[11px] shadow-2xs">
                    {selectedOrder.status}
                  </span>
                </div>
              </div>

              {/* Visual Stepper / Progress Indicator */}
              <div className="px-2 sm:px-6 py-4">
                <div className="flex items-center justify-between relative">
                  {/* Connecting Line */}
                  <div className="absolute top-4 left-4 right-4 h-1 bg-slate-100 -z-0">
                    <div
                      className="h-full bg-brand-500 transition-all duration-500"
                      style={{ width: `${getProgressPercentage(selectedOrder.status)}%` }}
                    />
                  </div>

                  {statusPipeline.map((step, idx) => {
                    const state = getStepState(step.title, selectedOrder.status);
                    return (
                      <div key={step.title} className="flex flex-col items-center relative z-10 text-center">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                            state.current
                              ? 'bg-brand-600 text-white ring-4 ring-brand-100 scale-110 shadow-md'
                              : state.done
                              ? 'bg-brand-500 text-white'
                              : 'bg-slate-200 text-slate-500'
                          }`}
                        >
                          {state.done ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                        </div>
                        <span className="text-[11px] font-bold text-[#17212B] mt-2">
                          {step.title}
                        </span>
                        <span className="text-[10px] text-slate-400 hidden sm:block">
                          {step.desc}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Items Purchased */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Ordered Products ({selectedOrder.items.length})
                </h4>
                <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="p-3 bg-white flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-12 h-12 rounded-lg object-cover bg-slate-50 border border-slate-200 shrink-0"
                        />
                        <div>
                          <p className="font-bold text-[#17212B]">{item.name}</p>
                          <p className="text-slate-500 mt-0.5 font-sans">
                            {formatINR(item.price)} × {item.quantity} {item.quantity === 1 ? 'unit' : 'units'}
                          </p>
                        </div>
                      </div>

                      <div className="font-bold text-[#17212B] font-sans">
                        {formatINR(item.price * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery & Payment details in INR */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="font-bold text-[#17212B] block mb-1">
                    Delivery Address
                  </span>
                  <p className="text-slate-600 leading-relaxed">
                    {selectedOrder.delivery_address}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
                  <div>
                    <span className="font-bold text-[#17212B] block mb-1">
                      Payment Method
                    </span>
                    <p className="text-slate-600">
                      {selectedOrder.payment_method}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-slate-200/60 flex justify-between font-bold text-[#17212B]">
                    <span>Total Amount</span>
                    <span className="font-sans text-brand-600 text-sm font-extrabold">
                      {formatINR(selectedOrder.total_amount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-500 text-xs space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Package className="w-6 h-6" />
              </div>
              <p className="font-medium text-slate-700">No orders placed yet.</p>
              <p className="text-slate-400">Add products to your cart and place an order to track delivery here.</p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Browse Catalog
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
