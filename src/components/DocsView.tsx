import React from 'react';
import {
  BookOpen,
  Terminal,
  Database,
  Layers,
  CheckCircle2,
  Cpu,
  ArrowRight,
  Shield,
  Code,
} from 'lucide-react';

export const DocsView: React.FC<{ onOpenPhaseGuide: () => void }> = ({ onOpenPhaseGuide }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Overview Card */}
      <div className="bg-gradient-to-r from-slate-900 to-brand-950 rounded-2xl p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-semibold mb-3">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Phase 1 Milestone Completed</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Phase 1: Project Setup & Core Scaffolding Guide
            </h1>
            <p className="text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
              Complete student tutorial explaining why each technology was selected, how the folder structure is organized, and how to verify both frontend and backend modules.
            </p>
          </div>
          <button
            onClick={onOpenPhaseGuide}
            className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg shrink-0"
          >
            <span>Review Full 18 Phases</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Why Each Library Was Chosen */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-[#17212B] flex items-center gap-2">
          <Cpu className="w-5 h-5 text-brand-600" />
          1. Why Each Library Was Selected (Viva Knowledge)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs">
            <h3 className="font-bold text-sm text-[#17212B] mb-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-brand-500"></span> FastAPI (Python)
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Provides blazing-fast asynchronous REST APIs with automatic OpenAPI (Swagger) documentation, request validation via Pydantic, and native dependency injection for database sessions.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs">
            <h3 className="font-bold text-sm text-[#17212B] mb-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-brand-500"></span> PostgreSQL & SQLAlchemy 2.0
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              PostgreSQL delivers enterprise-grade ACID transactions crucial for stock validation and checkout. SQLAlchemy ORM maps Python objects cleanly to SQL tables with connection pooling.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs">
            <h3 className="font-bold text-sm text-[#17212B] mb-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span> Alembic Migrations
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Tracks schema alterations over time like git for database tables. Allows auto-generating migrations directly by inspecting SQLAlchemy models without manual CREATE TABLE scripts.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs">
            <h3 className="font-bold text-sm text-[#17212B] mb-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-brand-500"></span> React + Vite + Tailwind
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Vite offers instant ES module bundling and fast refresh. React enables component-driven UI for cart and filters. Tailwind provides utility-first responsive styling without external CSS bloat.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs">
            <h3 className="font-bold text-sm text-[#17212B] mb-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span> JWT & Bcrypt (Phase 3)
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Stateless token authentication allows the frontend to include Bearer tokens in headers. Bcrypt provides secure, salted password hashing to protect user credentials.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs">
            <h3 className="font-bold text-sm text-[#17212B] mb-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-brand-500"></span> Pydantic Schemas
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Guarantees strict runtime data validation for incoming JSON payloads, auto-generating clear 422 error responses if required fields are missing.
            </p>
          </div>
        </div>
      </div>

      {/* How to Run Locally */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-[#17212B] flex items-center gap-2">
          <Terminal className="w-5 h-5 text-brand-600" />
          2. Step-by-Step Terminal Commands (For Your Computer / VS Code)
        </h2>

        <div className="bg-slate-900 text-slate-200 rounded-xl p-5 font-mono text-xs space-y-4">
          <div>
            <span className="text-slate-400 block mb-1"># Step A: Install Backend Python Requirements</span>
            <code className="text-brand-400 block bg-slate-950 p-2.5 rounded">
              cd backend<br />
              python -m venv venv<br />
              source venv/bin/activate  # On Windows: venv\Scripts\activate<br />
              pip install -r requirements.txt
            </code>
          </div>

          <div>
            <span className="text-slate-400 block mb-1"># Step B: Configure Environment Variables</span>
            <code className="text-brand-400 block bg-slate-950 p-2.5 rounded">
              cp .env.example .env<br />
              # Edit .env with your PostgreSQL credentials or keep SQLite default
            </code>
          </div>

          <div>
            <span className="text-slate-400 block mb-1"># Step C: Start the FastAPI Backend</span>
            <code className="text-brand-400 block bg-slate-950 p-2.5 rounded">
              uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
            </code>
          </div>

          <div>
            <span className="text-slate-400 block mb-1"># Step D: Start the React Frontend (in root folder)</span>
            <code className="text-brand-400 block bg-slate-950 p-2.5 rounded">
              npm install<br />
              npm run dev
            </code>
          </div>
        </div>
      </div>

      {/* Next Step Preview */}
      <div className="p-5 rounded-xl bg-brand-50 border border-brand-200">
        <div className="flex items-center gap-2 text-brand-900 font-bold mb-2">
          <Database className="w-5 h-5 text-brand-600" />
          <span>Ready for PHASE 2: PostgreSQL Database & SQLAlchemy Models</span>
        </div>
        <p className="text-xs text-brand-800 leading-relaxed">
          In Phase 2, we will define the complete normalized relational database schema in <code className="bg-brand-100 px-1 py-0.5 rounded font-mono">backend/app/models/</code>:
          <strong> User</strong>, <strong>Category</strong>, <strong>Product</strong>, <strong>Wishlist</strong>, <strong>Cart</strong>, <strong>Order</strong>, and <strong>Review</strong> with foreign key relationships, unique constraints, and indexes. Then we will generate the initial Alembic migration!
        </p>
      </div>
    </div>
  );
};
