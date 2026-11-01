import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Boxes,
  Check,
  CheckCircle2,
  ClipboardList,
  Edit2,
  LayoutDashboard,
  Package,
  Tags,
  Users,
  Warehouse,
  X,
} from 'lucide-react';
import type { Category, Order, OrderStatus, Product, User } from '../types';
import { api } from '../services/api';
import { formatINR } from '../utils/currency';

interface AdminDashboardProps {
  products: Product[];
  onUpdateProductStock: (productId: number, newStock: number) => void;
  onUpdateProductPrice: (productId: number, newPrice: number) => void;
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, newStatus: OrderStatus) => void;
}

type DashboardSection = 'dashboard' | 'products' | 'categories' | 'orders' | 'customers' | 'inventory';

const orderStatuses: OrderStatus[] = [
  'Pending', 'Confirmed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled',
];

const sectionLabels: Record<DashboardSection, string> = {
  dashboard: 'Dashboard',
  products: 'Products',
  categories: 'Categories',
  orders: 'Orders',
  customers: 'Customers',
  inventory: 'Inventory',
};

const sectionIcons = {
  dashboard: LayoutDashboard,
  products: Package,
  categories: Tags,
  orders: ClipboardList,
  customers: Users,
  inventory: Warehouse,
};

const panelClass = 'rounded-2xl border border-[#dce5df] bg-white shadow-sm';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  products,
  onUpdateProductStock,
  onUpdateProductPrice,
  orders,
  onUpdateOrderStatus,
}) => {
  const [section, setSection] = useState<DashboardSection>('dashboard');
  const [usersList, setUsersList] = useState<User[]>([]);
  const [categoryList, setCategoryList] = useState<Category[]>([]);
  const [editingPriceId, setEditingPriceId] = useState<number | null>(null);
  const [newPriceValue, setNewPriceValue] = useState('');

  useEffect(() => {
    api.getUsers().then(setUsersList);
    api.getCategories().then(setCategoryList);
  }, []);

  const customers = usersList.filter((user) => user.role === 'customer');
  const lowStockProducts = products.filter((product) => product.stock_quantity > 0 && product.stock_quantity < 10);
  const outOfStockCount = products.filter((product) => product.stock_quantity <= 0).length;
  const totalRevenue = orders
    .filter((order) => order.status !== 'Cancelled')
    .reduce((sum, order) => sum + order.total_amount, 0);

  const toggleCustomerStatus = async (userId: number) => {
    const target = usersList.find((user) => user.id === userId);
    if (!target || target.role !== 'customer') return;
    const nextStatus = !target.is_active;
    setUsersList((current) => current.map((user) => user.id === userId ? { ...user, is_active: nextStatus } : user));
    try {
      await api.updateUserStatus(userId, nextStatus);
    } catch {
      setUsersList((current) => current.map((user) => user.id === userId ? { ...user, is_active: target.is_active } : user));
    }
  };

  const categoryRows = categoryList.length
    ? categoryList.map((category) => ({
        ...category,
        productCount: products.filter((product) => product.category.toLowerCase() === category.name.toLowerCase()).length,
      }))
    : Array.from(new Set(products.map((product) => product.category))).sort().map((name) => ({
        id: name,
        name,
        slug: name.toLowerCase().replace(/\s+/g, '-'),
        description: '',
        item_count: 0,
        icon: '',
        productCount: products.filter((product) => product.category === name).length,
      }));

  const metricCards = [
    { label: 'Total revenue', value: formatINR(totalRevenue), detail: 'Excludes cancelled orders', icon: '₹', tone: 'teal' },
    { label: 'Total orders', value: orders.length, detail: 'All customer orders', icon: ClipboardList, tone: 'teal' },
    { label: 'Total customers', value: customers.length, detail: 'Registered customer accounts', icon: Users, tone: 'teal' },
    { label: 'Total products', value: products.length, detail: 'Products in the catalogue', icon: Package, tone: 'teal' },
    { label: 'Low stock', value: lowStockProducts.length, detail: 'Between 1 and 9 units', icon: AlertTriangle, tone: 'amber' },
    { label: 'Out of stock', value: outOfStockCount, detail: 'Items needing restock', icon: Boxes, tone: 'rose' },
  ] as const;

  const renderProductsTable = (inventoryOnly = false) => {
    const listedProducts = inventoryOnly ? [...products].sort((a, b) => a.stock_quantity - b.stock_quantity) : products;
    return (
      <div className={`${panelClass} overflow-hidden`}>
        <div className="border-b border-[#e6ece8] px-5 py-4 sm:px-6">
          <h3 className="font-semibold text-[#17212B]">{inventoryOnly ? 'Inventory levels' : 'Product catalogue'}</h3>
          <p className="mt-1 text-xs text-slate-500">{inventoryOnly ? 'Review stock and make quick adjustments.' : 'Update product pricing and stock.'}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-xs">
            <thead className="bg-[#f7f9f7] text-[10px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Product</th><th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Price</th><th className="px-5 py-3">Stock</th>
                {!inventoryOnly && <th className="px-5 py-3 text-right">Quick actions</th>}
                {inventoryOnly && <th className="px-5 py-3 text-right">Restock</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edf1ee]">
              {listedProducts.map((product) => (
                <tr key={product.id} className="hover:bg-[#fafcfa]">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <img src={product.image_url} alt="" className="h-10 w-10 rounded-lg bg-slate-100 object-cover" />
                      <div className="min-w-0"><p className="max-w-xs truncate font-semibold text-[#17212B]">{product.name}</p><p className="text-[11px] text-slate-500">{product.brand}</p></div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-slate-600">{product.category}</td>
                  <td className="px-5 py-3.5 font-semibold text-[#17212B]">
                    {inventoryOnly ? formatINR(product.price) : editingPriceId === product.id ? (
                      <div className="flex items-center gap-1">
                        <input aria-label={`Price for ${product.name}`} type="number" min="0.01" step="0.01" value={newPriceValue} onChange={(event) => setNewPriceValue(event.target.value)} className="w-24 rounded border border-[#b1d2da] px-2 py-1 outline-none focus:ring-2 focus:ring-brand-200" />
                        <button aria-label="Save price" onClick={() => { const price = Number(newPriceValue); if (price > 0) onUpdateProductPrice(product.id, price); setEditingPriceId(null); }} className="rounded p-1 text-brand-700 hover:bg-brand-50"><Check className="h-4 w-4" /></button>
                        <button aria-label="Cancel price edit" onClick={() => setEditingPriceId(null)} className="rounded p-1 text-slate-500 hover:bg-slate-100"><X className="h-4 w-4" /></button>
                      </div>
                    ) : (
                      <button onClick={() => { setEditingPriceId(product.id); setNewPriceValue(String(product.price)); }} className="inline-flex items-center gap-1.5 hover:text-brand-700" title="Edit price">
                        {formatINR(product.price)}<Edit2 className="h-3 w-3" />
                      </button>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`rounded-full px-2.5 py-1 font-semibold ${product.stock_quantity <= 0 ? 'bg-rose-50 text-rose-700' : product.stock_quantity < 10 ? 'bg-amber-50 text-amber-700' : 'bg-brand-50 text-brand-700'}`}>
                      {product.stock_quantity <= 0 ? 'Out of stock' : `${product.stock_quantity} units`}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <button onClick={() => onUpdateProductStock(product.id, Math.max(0, product.stock_quantity - 5))} className="rounded-lg border border-slate-200 px-2.5 py-1.5 font-medium text-slate-600 hover:bg-slate-50">−5</button>
                      <button onClick={() => onUpdateProductStock(product.id, product.stock_quantity + 10)} className="rounded-lg bg-brand-600 px-2.5 py-1.5 font-semibold text-white hover:bg-brand-700">+10</button>
                    </div>
                  </td>
                </tr>
              ))}
              {!listedProducts.length && <tr><td colSpan={5} className="px-5 py-10 text-center text-slate-500">No products found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="mx-auto grid max-w-7xl grid-cols-1 gap-5 px-4 py-6 sm:px-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:px-8 lg:py-8">
      <aside className="h-fit rounded-2xl border border-[#dce5df] bg-white p-3 shadow-sm lg:sticky lg:top-24">
        <p className="px-3 pb-2 pt-1 text-[10px] font-bold uppercase tracking-[.14em] text-slate-400">Store management</p>
        <nav aria-label="Admin dashboard sections" className="flex gap-1 overflow-x-auto lg:flex-col">
          {(Object.keys(sectionLabels) as DashboardSection[]).map((key) => {
            const Icon = sectionIcons[key];
            return (
              <button key={key} onClick={() => setSection(key)} aria-current={section === key ? 'page' : undefined}
                className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors lg:w-full ${section === key ? 'bg-brand-50 text-brand-800' : 'text-slate-600 hover:bg-[#f5f8f5] hover:text-[#17212B]'}`}>
                <Icon className="h-4 w-4" /><span>{sectionLabels[key]}</span>
                {key === 'orders' && <span className="ml-auto text-xs text-slate-400">{orders.length}</span>}
                {key === 'customers' && <span className="ml-auto text-xs text-slate-400">{customers.length}</span>}
                {key === 'inventory' && lowStockProducts.length > 0 && <span className="ml-auto rounded-full bg-amber-100 px-1.5 text-[10px] text-amber-800">{lowStockProducts.length}</span>}
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="min-w-0 space-y-5">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold text-brand-700">ShopCart · Admin</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#17212B]">{sectionLabels[section]}</h2>
            <p className="mt-1 text-sm text-slate-500">Manage your catalogue, orders, customers, and stock.</p>
          </div>
          <span className="text-xs text-slate-500">Store data from SQLite</span>
        </div>

        {section === 'dashboard' && <>
          <section aria-label="Store overview" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {metricCards.map(({ label, value, detail, icon: Icon, tone }) => (
              <article key={label} className={`${panelClass} p-4 sm:p-5`}>
                <div className="flex items-start justify-between gap-3">
                  <div><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold tracking-tight text-[#17212B]">{value}</p></div>
                  <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tone === 'amber' ? 'bg-amber-50 text-amber-700' : tone === 'rose' ? 'bg-rose-50 text-rose-700' : 'bg-brand-50 text-brand-700'}`}>
                    {typeof Icon === 'string' ? Icon : <Icon className="h-4 w-4" />}
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-500">{detail}</p>
              </article>
            ))}
          </section>

          <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <div className={`${panelClass} p-5`}>
              <div className="mb-4 flex items-center justify-between gap-3">
                <div><h3 className="font-semibold text-[#17212B]">Inventory Watchlist</h3><p className="mt-1 text-xs text-slate-500">Products with fewer than 10 units remaining.</p></div>
                <button onClick={() => setSection('inventory')} className="text-xs font-semibold text-brand-700 hover:underline">View inventory</button>
              </div>
              <div className="space-y-2">
                {lowStockProducts.slice(0, 5).map((product) => (
                  <div key={product.id} className="flex items-center justify-between gap-3 rounded-xl border border-[#edf1ee] p-3">
                    <div className="flex min-w-0 items-center gap-3"><img src={product.image_url} alt="" className="h-10 w-10 rounded-lg object-cover" /><div className="min-w-0"><p className="truncate text-sm font-medium text-[#17212B]">{product.name}</p><p className="text-xs text-slate-500">{product.category} · {formatINR(product.price)}</p></div></div>
                    <span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">{product.stock_quantity} left</span>
                  </div>
                ))}
                {!lowStockProducts.length && <p className="rounded-xl bg-[#f7f9f7] px-4 py-6 text-center text-sm text-slate-500">No low-stock products right now.</p>}
              </div>
            </div>

            <div className={`${panelClass} p-5`}>
              <div className="mb-4 flex items-center justify-between gap-3"><div><h3 className="font-semibold text-[#17212B]">Recent Customer Orders</h3><p className="mt-1 text-xs text-slate-500">Latest activity from your store.</p></div><button onClick={() => setSection('orders')} className="text-xs font-semibold text-brand-700 hover:underline">All orders</button></div>
              <div className="space-y-2">
                {orders.slice(0, 5).map((order) => (
                  <div key={order.id} className="flex items-center justify-between gap-3 rounded-xl border border-[#edf1ee] p-3">
                    <div className="min-w-0"><p className="font-semibold text-[#17212B]">{order.id}</p><p className="mt-0.5 truncate text-xs text-slate-500">{order.user_name} · {order.items.length} items</p></div>
                    <div className="shrink-0 text-right"><p className="font-semibold text-[#17212B]">{formatINR(order.total_amount)}</p><p className="mt-0.5 text-[11px] text-brand-700">{order.status}</p></div>
                  </div>
                ))}
                {!orders.length && <p className="rounded-xl bg-[#f7f9f7] px-4 py-6 text-center text-sm text-slate-500">No customer orders yet.</p>}
              </div>
            </div>
          </section>
        </>}

        {section === 'products' && renderProductsTable()}

        {section === 'inventory' && renderProductsTable(true)}

        {section === 'categories' && <section className={`${panelClass} overflow-hidden`}>
          <div className="border-b border-[#e6ece8] px-5 py-4 sm:px-6"><h3 className="font-semibold text-[#17212B]">Product categories</h3><p className="mt-1 text-xs text-slate-500">Category data from the existing store database.</p></div>
          <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
            {categoryRows.map((category) => <article key={category.id} className="rounded-xl border border-[#e6ece8] bg-[#fbfcfb] p-4">
              <div className="flex items-start justify-between"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700"><Tags className="h-4 w-4" /></div><span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">{category.productCount} products</span></div>
              <h4 className="mt-3 font-semibold text-[#17212B]">{category.name}</h4><p className="mt-1 line-clamp-2 text-xs text-slate-500">{category.description || 'Products grouped in this store category.'}</p>
            </article>)}
            {!categoryRows.length && <p className="p-6 text-sm text-slate-500">No categories found.</p>}
          </div>
        </section>}

        {section === 'orders' && <section className={`${panelClass} overflow-hidden`}>
          <div className="border-b border-[#e6ece8] px-5 py-4 sm:px-6"><h3 className="font-semibold text-[#17212B]">Customer orders</h3><p className="mt-1 text-xs text-slate-500">Review order details and update fulfilment status.</p></div>
          <div className="divide-y divide-[#edf1ee]">
            {orders.map((order) => <article key={order.id} className="flex flex-col justify-between gap-4 p-5 md:flex-row md:items-center sm:px-6">
              <div className="min-w-0 space-y-1"><p className="font-semibold text-[#17212B]">{order.id} <span className="font-normal text-slate-400">· {order.created_at}</span></p><p className="text-sm text-slate-600">{order.user_name} <span className="text-slate-400">({order.user_email})</span></p><p className="text-xs text-slate-500">{order.items.length} items · {order.payment_method} · {order.delivery_address}</p></div>
              <div className="flex items-center justify-between gap-5 md:justify-end"><p className="font-bold text-[#17212B]">{formatINR(order.total_amount)}</p><select aria-label={`Status for order ${order.id}`} value={order.status} onChange={(event) => onUpdateOrderStatus(order.id, event.target.value as OrderStatus)} className="rounded-lg border border-[#dce5df] bg-white px-3 py-2 text-xs font-semibold text-[#17212B] outline-none focus:ring-2 focus:ring-brand-200">{orderStatuses.map((status) => <option key={status} value={status}>{status}</option>)}</select></div>
            </article>)}
            {!orders.length && <p className="p-8 text-center text-sm text-slate-500">No customer orders yet.</p>}
          </div>
        </section>}

        {section === 'customers' && <section className={`${panelClass} overflow-hidden`}>
          <div className="border-b border-[#e6ece8] px-5 py-4 sm:px-6"><h3 className="font-semibold text-[#17212B]">Customer accounts</h3><p className="mt-1 text-xs text-slate-500">Manage access for registered customers. Passwords are never displayed.</p></div>
          <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-left text-xs">
            <thead className="bg-[#f7f9f7] text-[10px] uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Customer</th><th className="px-5 py-3">Phone</th><th className="px-5 py-3">Address</th><th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Access</th></tr></thead>
            <tbody className="divide-y divide-[#edf1ee]">{customers.map((customer) => <tr key={customer.id} className="hover:bg-[#fafcfa]"><td className="px-5 py-3.5"><p className="font-semibold text-[#17212B]">{customer.name}</p><p className="mt-0.5 text-[11px] text-slate-500">{customer.email}</p></td><td className="px-5 py-3.5 text-slate-600">{customer.phone || '—'}</td><td className="max-w-xs truncate px-5 py-3.5 text-slate-600">{customer.address || '—'}</td><td className="px-5 py-3.5">{customer.is_active ? <span className="inline-flex items-center gap-1 text-brand-700"><CheckCircle2 className="h-3.5 w-3.5" />Active</span> : <span className="inline-flex items-center gap-1 text-rose-700"><X className="h-3.5 w-3.5" />Disabled</span>}</td><td className="px-5 py-3.5 text-right"><button onClick={() => toggleCustomerStatus(customer.id)} className={`rounded-lg px-3 py-1.5 font-semibold ${customer.is_active ? 'bg-rose-50 text-rose-700 hover:bg-rose-100' : 'bg-brand-50 text-brand-700 hover:bg-brand-100'}`}>{customer.is_active ? 'Disable' : 'Activate'}</button></td></tr>)}
              {!customers.length && <tr><td colSpan={5} className="p-8 text-center text-slate-500">No customer accounts found.</td></tr>}
            </tbody>
          </table></div>
        </section>}
      </main>
    </div>
  );
};
