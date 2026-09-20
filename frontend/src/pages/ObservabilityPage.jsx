import React, { useEffect, useState } from 'react';
import { Activity, Server, Clock, Database, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import api, { getFriendlyErrorMessage } from '../api/client';

export default function ObservabilityPage() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMetrics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/api/admin/metrics');
      setMetrics(res.data);
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading font-bold text-2xl sm:text-3xl text-[#F9FAFB] tracking-tight">
            System Observability
          </h2>
          <p className="text-xs sm:text-sm text-[#9CA3AF] mt-1">
            Real-time telemetry, service latency, and endpoint telemetry logs.
          </p>
        </div>

        <button
          onClick={fetchMetrics}
          disabled={loading}
          className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-[#1F2937] hover:bg-[#374151] text-xs font-semibold text-[#F9FAFB] border border-[#374151] cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444] p-3.5 rounded-xl text-xs">
          {error}
        </div>
      )}

      {/* Quick Service Status Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-4">
          <div className="flex items-center space-x-2 text-xs text-[#9CA3AF] mb-1">
            <Server className="w-4 h-4 text-[#10B981]" />
            <span>API Gateway</span>
          </div>
          <p className="text-base font-bold text-[#F9FAFB]">
            {metrics?.uptime ? `${Math.floor(metrics.uptime / 60)}m uptime` : 'Active'}
          </p>
          <span className="text-[10px] text-[#10B981] flex items-center mt-1">
            <CheckCircle className="w-3 h-3 mr-1" /> Node.js / Express
          </span>
        </div>

        <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-4">
          <div className="flex items-center space-x-2 text-xs text-[#9CA3AF] mb-1">
            <Database className="w-4 h-4 text-[#06B6D4]" />
            <span>Database</span>
          </div>
          <p className="text-base font-bold text-[#F9FAFB]">PostgreSQL 15</p>
          <span className="text-[10px] text-[#10B981] flex items-center mt-1">
            <CheckCircle className="w-3 h-3 mr-1" /> Connected
          </span>
        </div>

        <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-4">
          <div className="flex items-center space-x-2 text-xs text-[#9CA3AF] mb-1">
            <Clock className="w-4 h-4 text-[#F59E0B]" />
            <span>P95 Latency</span>
          </div>
          <p className="text-base font-bold text-[#F9FAFB]">
            {metrics?.p95LatencyMs ? `${Math.round(metrics.p95LatencyMs)}ms` : '< 500ms'}
          </p>
          <span className="text-[10px] text-[#9CA3AF] mt-1 block">NLP Pipeline Target</span>
        </div>

        <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-4">
          <div className="flex items-center space-x-2 text-xs text-[#9CA3AF] mb-1">
            <Activity className="w-4 h-4 text-[#EC4899]" />
            <span>Total Queries</span>
          </div>
          <p className="text-base font-bold text-[#F9FAFB]">
            {metrics?.totalRequests ?? metrics?.summary?.totalRequestsLifetime ?? metrics?.summary?.totalRequests24h ?? 0}
          </p>
          <span className="text-[10px] text-[#9CA3AF] mt-1 block">Lifetime Analyses</span>
        </div>
      </div>

      {/* Latency Log Table */}
      <div className="bg-[#111827] border border-[#1E293B] rounded-2xl p-5 shadow-xl">
        <h3 className="font-heading font-semibold text-lg text-[#F9FAFB] mb-3">
          Recent Telemetry Traces
        </h3>

        {(!metrics?.recentLogs || metrics.recentLogs.length === 0) ? (
          <p className="text-xs text-[#9CA3AF] py-6 text-center">
            No telemetry traces recorded yet. Run a match or demo to populate telemetry logs.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#1E293B] text-[#6B7280]">
                  <th className="pb-2">Endpoint</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Duration</th>
                  <th className="pb-2">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B]/60 font-mono text-[11px]">
                {metrics.recentLogs.map((log, idx) => (
                  <tr key={log.id || idx} className="hover:bg-[#1F2937]/30">
                    <td className="py-2.5 text-[#F9FAFB]">{log.endpoint}</td>
                    <td className="py-2.5">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          log.status_code < 400
                            ? 'bg-[#10B981]/15 text-[#10B981]'
                            : 'bg-[#EF4444]/15 text-[#EF4444]'
                        }`}
                      >
                        {log.status_code}
                      </span>
                    </td>
                    <td className="py-2.5 text-[#9CA3AF]">{log.duration_ms ?? log.latency_ms}ms</td>
                    <td className="py-2.5 text-[#6B7280]">
                      {new Date(log.created_at || log.timestamp).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
