import React from 'react';
import {
  CheckCircle2,
  Circle,
  X,
  Database,
  Server,
  Layers,
  Terminal,
  FileCode,
  ShieldCheck,
  Cpu,
} from 'lucide-react';

interface PhaseGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PHASES = [
  {
    num: 1,
    name: 'Project Setup & Core Scaffolding',
    status: 'completed',
    desc: 'FastAPI, PostgreSQL/SQLAlchemy, Alembic, Vite/React, folder structure, Health API',
  },
  {
    num: 2,
    name: 'PostgreSQL Database & SQLAlchemy Models',
    status: 'upcoming',
    desc: 'Users, Categories, Products, Cart, Orders, Reviews, Wishlist tables with constraints',
  },
  {
    num: 3,
    name: 'User Registration, Login & JWT Auth',
    status: 'upcoming',
    desc: 'Bcrypt password hashing, JWT token issuance, protected route dependencies, profile API',
  },
  {
    num: 4,
    name: 'Product & Category Catalog Management',
    status: 'upcoming',
    desc: 'CRUD operations, image URLs, stock validation, admin authorizations',
  },
  {
    num: 5,
    name: 'React Frontend & Authentication Flow',
    status: 'upcoming',
    desc: 'Auth context, JWT storage, login/signup forms, protected client routes',
  },
  {
    num: 6,
    name: 'Product Browsing, Smart Search & Filters',
    status: 'upcoming',
    desc: 'Real-time debounced search, category filtering, sort by price/rating/stock',
  },
  {
    num: 7,
    name: 'Wishlist Module',
    status: 'upcoming',
    desc: 'Add/remove items, view wishlist, move item from wishlist to cart',
  },
  {
    num: 8,
    name: 'Shopping Cart Module',
    status: 'upcoming',
    desc: 'Cart items, quantity modifier, subtotal calculation, stock availability validation',
  },
  {
    num: 9,
    name: 'Checkout & Atomic Order Processing',
    status: 'upcoming',
    desc: 'Transactional stock decrement, order creation, demo COD / card payments',
  },
  {
    num: 10,
    name: 'Order Management & Visual Tracking',
    status: 'upcoming',
    desc: 'Status pipeline (Pending -> Shipped -> Delivered) with visual stepper indicator',
  },
  {
    num: 11,
    name: 'Verified Customer Reviews & Ratings',
    status: 'upcoming',
    desc: '1-5 star reviews limited to purchasers, automated average rating computation',
  },
  {
    num: 12,
    name: 'Admin Analytics Dashboard',
    status: 'upcoming',
    desc: 'Revenue, orders, inventory alerts, Recharts graphical sales breakdowns',
  },
  {
    num: 13,
    name: 'Smart Search Enhancement',
    status: 'upcoming',
    desc: 'Multi-field search across title, description, category, and brand with auto-suggestions',
  },
  {
    num: 14,
    name: 'Similar Products Engine',
    status: 'upcoming',
    desc: 'Rule-based matching on category, brand, and price tier on product detail pages',
  },
  {
    num: 15,
    name: 'Rule-Based Product Recommendations',
    status: 'upcoming',
    desc: 'Personalized recommendations from past orders, wishlist, and cart history',
  },
  {
    num: 16,
    name: 'Customer & Admin Purchase Analysis',
    status: 'upcoming',
    desc: 'Spending statistics, favorite categories, average order values and trend lines',
  },
  {
    num: 17,
    name: 'Testing, Validation & Bug Fixing',
    status: 'upcoming',
    desc: 'Postman test suites, boundary condition tests, stock race condition safeguards',
  },
  {
    num: 18,
    name: 'Final UI Polish, Responsive Audit & Documentation',
    status: 'upcoming',
    desc: 'Complete README, ER diagram, viva preparation notes, submission package',
  },
];

export const PhaseGuideModal: React.FC<PhaseGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
              <Layers className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold">College Project Blueprint & Phase Roadmap</h2>
              <p className="text-xs text-slate-400">
                18-Phase Step-by-Step Architecture for Viva & Demonstration
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-700">
          {/* Phase 1 Completion Summary */}
          <div className="p-4 rounded-xl bg-brand-50 border border-brand-200">
            <div className="flex items-center gap-2 text-brand-900 font-bold mb-2">
              <CheckCircle2 className="w-5 h-5 text-brand-600" />
              <span>PHASE 1 (COMPLETED): Core Project Foundation & Backend Scaffolding</span>
            </div>
            <p className="text-xs text-brand-800 mb-3">
              The application structure, FastAPI engine, SQLAlchemy connection pool, Alembic migration environment, and React client are fully set up and verified.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="bg-white/80 p-2 rounded border border-brand-100 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                <span>FastAPI 0.114 with Uvicorn server on port 8000</span>
              </div>
              <div className="bg-white/80 p-2 rounded border border-brand-100 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                <span>SQLAlchemy 2.0 with connection pooling</span>
              </div>
              <div className="bg-white/80 p-2 rounded border border-brand-100 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                <span>Alembic migration runner initialized</span>
              </div>
              <div className="bg-white/80 p-2 rounded border border-brand-100 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                <span>Configured .env & .env.example with PG/SQLite dual-mode</span>
              </div>
              <div className="bg-white/80 p-2 rounded border border-brand-100 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                <span>Health Check probe API (/api/health) verified</span>
              </div>
              <div className="bg-white/80 p-2 rounded border border-brand-100 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                <span>Vite Reverse Proxy routing /api to port 8000</span>
              </div>
            </div>
          </div>

          {/* Codebase Folder Structure */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
              <FileCode className="w-4 h-4 text-brand-600" />
              <span>Project Directory Structure</span>
            </h3>
            <pre className="bg-slate-900 text-slate-200 p-3 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed">
{`ecommerce-cart-system/
├── backend/
│   ├── alembic/              # Database migration scripts
│   │   ├── env.py            # Reads models and DATABASE_URL
│   │   └── script.py.mako    # Migration template
│   ├── app/
│   │   ├── main.py           # FastAPI entry point, CORS, routers
│   │   ├── config.py         # Pydantic BaseSettings & env parser
│   │   ├── database.py       # SQLAlchemy engine & SessionLocal
│   │   ├── models/           # ORM entities (User, Product, Cart...)
│   │   ├── schemas/          # Pydantic validation schemas
│   │   ├── routers/          # API route controllers (health, auth...)
│   │   ├── services/         # Business logic layer
│   │   └── utils/            # Hashing & helper utilities
│   ├── alembic.ini           # Alembic tool config
│   ├── requirements.txt      # Python dependencies
│   ├── .env.example          # Environment template
│   └── .env                  # Active credentials
├── src/                      # React Frontend
│   ├── components/           # Navbar, Hero, HealthMonitor, Cards...
│   ├── services/             # Axios client (/api)
│   ├── types/                # TypeScript interfaces
│   └── App.tsx               # Main frontend container
└── server.ts                 # Full-stack orchestrator`}
            </pre>
          </div>

          {/* 18 Phases Roadmap */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-brand-600" />
              <span>Complete 18-Phase Implementation Plan</span>
            </h3>
            <div className="space-y-2">
              {PHASES.map((p) => (
                <div
                  key={p.num}
                  className={`p-3 rounded-lg border flex items-start gap-3 transition-colors ${
                    p.status === 'completed'
                      ? 'bg-brand-50/60 border-brand-200'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="mt-0.5">
                    {p.status === 'completed' ? (
                      <CheckCircle2 className="w-4 h-4 text-brand-600" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-[#17212B]">
                        Phase {p.num}: {p.name}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                          p.status === 'completed'
                            ? 'bg-brand-100 text-brand-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {p.status === 'completed' ? 'Completed' : 'Upcoming'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
