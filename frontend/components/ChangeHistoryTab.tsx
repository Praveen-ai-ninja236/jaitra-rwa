"use client";

import React, { useState, useEffect } from "react";
import { AuditLogEntry } from "../lib/types";
import * as api from "../lib/api";
import {
  History,
  Search,
  Plus,
  Pencil,
  Trash2,
  Filter,
  RefreshCw,
  User,
  Shield,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface ChangeHistoryTabProps {
  userRole?: string;
}

const ACTION_STYLES: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  CREATE: {
    bg: "bg-emerald-950/60 border-emerald-800/60",
    text: "text-emerald-300",
    icon: <Plus className="w-3 h-3" />,
  },
  UPDATE: {
    bg: "bg-amber-950/60 border-amber-800/60",
    text: "text-amber-300",
    icon: <Pencil className="w-3 h-3" />,
  },
  DELETE: {
    bg: "bg-rose-950/60 border-rose-800/60",
    text: "text-rose-300",
    icon: <Trash2 className="w-3 h-3" />,
  },
};

const ENTITY_LABELS: Record<string, string> = {
  cultural_event: "Cultural Event",
  festival: "Festival",
  festival_collection: "Festival Collection",
  festival_expense: "Festival Expense",
  meeting: "GBM Meeting",
  issue: "Community Issue",
  ado_task: "ADO Task",
  ado_comment: "ADO Comment",
  ado_attachment: "ADO Attachment",
  team_member: "Team Member",
  vendor_contract: "Vendor Contract",
  dropdown_option: "Dropdown Option",
  auth_user: "User Account",
};

export default function ChangeHistoryTab({ userRole = "User" }: ChangeHistoryTabProps) {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("All");
  const [entityFilter, setEntityFilter] = useState("All");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const data = await api.getAuditLogs(500);
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchSearch =
      log.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entity_label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entity_type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchAction = actionFilter === "All" || log.action === actionFilter;
    const matchEntity = entityFilter === "All" || log.entity_type === entityFilter;
    return matchSearch && matchAction && matchEntity;
  });

  const uniqueEntityTypes = Array.from(new Set(logs.map((l) => l.entity_type))).sort();

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return "";
    }
  };

  const actionCounts = {
    CREATE: logs.filter((l) => l.action === "CREATE").length,
    UPDATE: logs.filter((l) => l.action === "UPDATE").length,
    DELETE: logs.filter((l) => l.action === "DELETE").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-3 h-3 rounded-full bg-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.8)]" />
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Change History &amp; Audit Trail
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Complete log of all database changes across the Jaitra portal. Every create, update, and delete is tracked.
          </p>
        </div>
        <button
          onClick={fetchLogs}
          disabled={isLoading}
          className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl border border-slate-700 transition"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-sky-400" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-emerald-950/40 border border-emerald-800/50 rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1.5 text-emerald-400 mb-1">
            <Plus className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase">Created</span>
          </div>
          <p className="text-lg font-extrabold text-emerald-300">{actionCounts.CREATE}</p>
        </div>
        <div className="bg-amber-950/40 border border-amber-800/50 rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1.5 text-amber-400 mb-1">
            <Pencil className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase">Updated</span>
          </div>
          <p className="text-lg font-extrabold text-amber-300">{actionCounts.UPDATE}</p>
        </div>
        <div className="bg-rose-950/40 border border-rose-800/50 rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1.5 text-rose-400 mb-1">
            <Trash2 className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase">Deleted</span>
          </div>
          <p className="text-lg font-extrabold text-rose-300">{actionCounts.DELETE}</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl shadow-md flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by user, entity, or details..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500 bg-slate-800/80 text-white placeholder-slate-400"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 text-xs">
            <Filter className="w-3.5 h-3.5 text-violet-400" />
            <span className="text-slate-400 font-medium">Action:</span>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="bg-transparent font-bold text-white focus:outline-none cursor-pointer"
            >
              <option value="All">All</option>
              <option value="CREATE">Created</option>
              <option value="UPDATE">Updated</option>
              <option value="DELETE">Deleted</option>
            </select>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 text-xs">
            <span className="text-slate-400 font-medium">Entity:</span>
            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="bg-transparent font-bold text-white focus:outline-none cursor-pointer max-w-[160px] truncate"
            >
              <option value="All">All Types</option>
              {uniqueEntityTypes.map((et) => (
                <option key={et} value={et} className="bg-slate-900 text-white">
                  {ENTITY_LABELS[et] || et}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Log Entries */}
      <div className="space-y-2">
        {isLoading && logs.length === 0 ? (
          <div className="bg-slate-900/60 rounded-2xl p-12 text-center border border-slate-800 shadow-md">
            <History className="w-12 h-12 text-slate-600 mx-auto mb-3 animate-pulse" />
            <h3 className="text-base font-bold text-slate-300">Loading audit trail...</h3>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="bg-slate-900/60 rounded-2xl p-12 text-center border border-slate-800 shadow-md">
            <History className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-300">No changes recorded yet</h3>
            <p className="text-xs text-slate-500 mt-1">
              Changes will appear here as users create, update, or delete records.
            </p>
          </div>
        ) : (
          filteredLogs.map((log) => {
            const style = ACTION_STYLES[log.action] || ACTION_STYLES.UPDATE;
            const isExpanded = expandedId === log.id;

            return (
              <div
                key={log.id}
                className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-all duration-200"
              >
                <div
                  className="flex items-start gap-3 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : log.id)}
                >
                  {/* Action Badge */}
                  <div
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-black uppercase shrink-0 ${style.bg} ${style.text}`}
                  >
                    {style.icon}
                    {log.action}
                  </div>

                  {/* Main Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-white">
                        {ENTITY_LABELS[log.entity_type] || log.entity_type}
                      </span>
                      {log.entity_label && (
                        <span className="text-xs text-slate-400">
                          &mdash; <span className="text-sky-300 font-semibold">{log.entity_label}</span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span className="font-semibold text-slate-300">{log.user_name || "System"}</span>
                        {log.user_role && (
                          <span className="px-1.5 py-0.5 bg-slate-800 rounded text-[9px] font-mono text-slate-500">
                            {log.user_role}
                          </span>
                        )}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(log.created_at)} {formatTime(log.created_at)}
                      </span>
                    </div>
                  </div>

                  {/* Expand Toggle */}
                  <button className="text-slate-400 hover:text-white shrink-0 p-1">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>

                {/* Expanded Details */}
                {isExpanded && log.details && (
                  <div className="mt-3 pt-3 border-t border-slate-800 ml-[72px]">
                    <div className="bg-slate-950/60 rounded-lg p-3 border border-slate-800">
                      <p className="text-[11px] font-semibold text-slate-400 mb-1">Change Details:</p>
                      <p className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                        {log.details}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
