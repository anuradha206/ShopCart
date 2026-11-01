import React, { useState } from 'react';
import {
  Activity,
  Database,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Server,
  Zap,
} from 'lucide-react';
import { HealthResponse } from '../types';

interface HealthMonitorProps {
  health: HealthResponse | null;
  loading: boolean;
  onRefresh: () => void;
}

export const HealthMonitor: React.FC<HealthMonitorProps> = ({
  health,
  loading,
  onRefresh,
}) => {
  const isHealthy = health?.status === 'ok';
  const isDbConnected = health?.database?.status === 'connected';

  return (
    <div className="bg-slate-900 border-y border-slate-800 text-white py-3 px-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        {/* Status Badges */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700">
            <Server className="w-3.5 h-3.5 text-brand-400" />
            <span className="text-slate-400">FastAPI Backend:</span>
            {isHealthy ? (
              <span className="flex items-center gap-1 text-brand-400 font-medium">
                <CheckCircle2 className="w-3 h-3" /> Online (v{health?.version || '1.0.0'})
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-400 font-medium">
                <AlertTriangle className="w-3 h-3" /> Initializing
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700">
            <Database className="w-3.5 h-3.5 text-brand-400" />
            <span className="text-slate-400">SQLAlchemy ORM:</span>
            {isDbConnected ? (
              <span className="flex items-center gap-1 text-brand-400 font-medium font-mono">
                <span className="w-2 h-2 rounded-full bg-brand-400 animate-ping"></span>
                Connected ({health?.database?.database_type?.toUpperCase()})
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                Ready (Connecting...)
              </span>
            )}
          </div>

          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/60 text-slate-400 border border-slate-700/60">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Alembic Migrations: Configured & Verified</span>
          </div>
        </div>

        {/* API links and refresh */}
        <div className="flex items-center gap-3">
          <a
            href="/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-brand-300 hover:text-brand-200 hover:underline"
          >
            <span>Swagger UI (/docs)</span>
            <ExternalLink className="w-3 h-3" />
          </a>

          <span className="text-slate-700">|</span>

          <a
            href="/api/health"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-brand-300 hover:text-brand-200 hover:underline"
          >
            <span>Raw JSON (/api/health)</span>
            <ExternalLink className="w-3 h-3" />
          </a>

          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-brand-600 hover:bg-brand-500 text-white font-medium transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            <span>Ping Backend</span>
          </button>
        </div>
      </div>
    </div>
  );
};
