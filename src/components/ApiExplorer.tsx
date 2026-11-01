import React, { useState } from 'react';
import {
  Terminal,
  Play,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  Code2,
} from 'lucide-react';
import { apiClient } from '../services/api';

export const ApiExplorer: React.FC = () => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('/api/health');
  const [loading, setLoading] = useState<boolean>(false);
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseLatency, setResponseLatency] = useState<number | null>(null);
  const [responseData, setResponseData] = useState<unknown>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const endpoints = [
    {
      method: 'GET',
      path: '/api/health',
      desc: 'Probes overall application health and executes SELECT 1 against the database engine.',
    },
    {
      method: 'GET',
      path: '/api/info',
      desc: 'Retrieves architecture metadata, current active phase, and available module links.',
    },
    {
      method: 'GET',
      path: '/api/routes',
      desc: 'Lists all registered route endpoints in the FastAPI app instance.',
    },
    {
      method: 'GET',
      path: '/',
      desc: 'Root welcome greeting and documentation index links.',
    },
  ];

  const handleTestEndpoint = async () => {
    setLoading(true);
    const start = performance.now();
    try {
      const res = await apiClient.get(selectedEndpoint);
      const elapsed = Math.round(performance.now() - start);
      setResponseStatus(res.status);
      setResponseLatency(elapsed);
      setResponseData(res.data);
    } catch (err: any) {
      const elapsed = Math.round(performance.now() - start);
      setResponseLatency(elapsed);
      if (err.response) {
        setResponseStatus(err.response.status);
        setResponseData(err.response.data);
      } else {
        setResponseStatus(500);
        setResponseData({ error: err.message || 'Network request failed' });
      }
    } finally {
      setLoading(false);
    }
  };

  const curlCommand = `curl -X GET "http://localhost:8000${selectedEndpoint}" -H "Accept: application/json"`;

  const copyCurl = () => {
    navigator.clipboard?.writeText(curlCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-[#17212B] tracking-tight flex items-center gap-2">
            <Terminal className="w-5 h-5 text-brand-600" />
            FastAPI Live REST API Tester (Phase 1)
          </h2>
          <p className="text-xs text-slate-500">
            Interactive client communicating directly with the FastAPI backend on port 8000.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg bg-brand-50 text-brand-700 hover:bg-brand-100 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-brand-200"
          >
            <span>Open Swagger UI</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <a
            href="/redoc"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-200"
          >
            <span>ReDoc Spec</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Endpoint Selector */}
        <div className="lg:col-span-5 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Select Endpoint to Probe
          </h3>
          <div className="space-y-2">
            {endpoints.map((ep) => (
              <div
                key={ep.path}
                onClick={() => setSelectedEndpoint(ep.path)}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                  selectedEndpoint === ep.path
                    ? 'bg-brand-50/80 border-brand-500 shadow-xs ring-1 ring-brand-500'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-brand-100 text-brand-800 text-[10px] font-bold px-2 py-0.5 rounded">
                    {ep.method}
                  </span>
                  <span className="font-mono text-xs font-semibold text-[#17212B]">
                    {ep.path}
                  </span>
                </div>
                <p className="text-xs text-slate-500 line-clamp-2">{ep.desc}</p>
              </div>
            ))}
          </div>

          {/* cURL Snippet for Postman / Terminal testing */}
          <div className="mt-4 p-3 bg-slate-900 rounded-xl text-slate-300 text-xs">
            <div className="flex items-center justify-between mb-2 text-slate-400 text-[11px]">
              <span className="flex items-center gap-1 font-mono">
                <Code2 className="w-3.5 h-3.5 text-amber-400" /> Terminal / Postman cURL
              </span>
              <button
                onClick={copyCurl}
                className="text-brand-400 hover:text-brand-300 flex items-center gap-1 cursor-pointer"
              >
                <Copy className="w-3 h-3" />
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
            <code className="font-mono text-[11px] block overflow-x-auto text-brand-400 bg-slate-950 p-2 rounded">
              {curlCommand}
            </code>
          </div>
        </div>

        {/* Request Execution & JSON Viewer */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 font-mono text-xs">
                <span className="bg-brand-100 text-brand-800 font-bold px-2 py-0.5 rounded">
                  GET
                </span>
                <span className="font-semibold text-[#17212B]">{selectedEndpoint}</span>
              </div>

              <button
                onClick={handleTestEndpoint}
                disabled={loading}
                className="px-4 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
              >
                <Play className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>{loading ? 'Sending...' : 'Send Request'}</span>
              </button>
            </div>

            {/* Execution Metrics */}
            <div className="flex items-center gap-4 py-2 text-xs text-slate-500 border-b border-slate-100 mb-3">
              <span>
                Status:{' '}
                {responseStatus ? (
                  <strong
                    className={
                      responseStatus >= 200 && responseStatus < 300
                        ? 'text-brand-600 font-mono'
                        : 'text-rose-600 font-mono'
                    }
                  >
                    {responseStatus} OK
                  </strong>
                ) : (
                  'Not Sent Yet'
                )}
              </span>
              <span>•</span>
              <span>
                Latency:{' '}
                {responseLatency !== null ? (
                  <strong className="text-slate-800 font-mono">{responseLatency} ms</strong>
                ) : (
                  '—'
                )}
              </span>
              <span>•</span>
              <span>Format: <strong className="text-slate-800">application/json</strong></span>
            </div>

            {/* Response Console */}
            <div className="relative">
              <pre className="bg-slate-950 text-slate-100 p-3.5 rounded-lg text-xs font-mono overflow-auto max-h-[380px] leading-relaxed">
                {responseData
                  ? JSON.stringify(responseData, null, 2)
                  : `// Click "Send Request" to test ${selectedEndpoint}\n// The FastAPI backend will handle the route and return live data.`}
              </pre>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-brand-500" />
              FastAPI Route Handler Active
            </span>
            <span>College Project Module 1</span>
          </div>
        </div>
      </div>
    </div>
  );
};
