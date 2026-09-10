"use client";

import React from "react";
import { SocietyStats, AppUser } from "../lib/types";
import {
  Calendar,
  Sparkles,
  Users,
  AlertTriangle,
  Kanban,
  FileText,
  Building,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  Coins,
  FileSpreadsheet,
  Briefcase,
} from "lucide-react";

interface HeroBannerProps {
  stats: SocietyStats | null;
  onSelectTab: (tabId: string) => void;
  onOpenAuditReport?: () => void;
  currentUser?: AppUser | null;
}

export default function HeroBanner({ stats, onSelectTab, onOpenAuditReport, currentUser }: HeroBannerProps) {
  return (
    <div className="bg-gradient-to-br from-[#03132e] via-[#072454] to-[#0c4a9e] text-white shadow-xl relative overflow-hidden border-b border-sky-900/40">
      {/* Background glowing orbs */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-24 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:20px_20px]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          {/* Main Title & Description */}
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-400/15 text-sky-300 text-xs font-bold uppercase tracking-wider mb-3 border border-sky-400/30 backdrop-blur-md shadow-xs">
              <Building className="w-3.5 h-3.5 text-sky-400" />
              <span>Gated Community Association</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight drop-shadow-sm">
              Jaitra Residents Welfare Association
            </h1>

            <p className="text-sky-100/90 text-sm sm:text-base mt-2.5 leading-relaxed font-normal">
              Official governance hub managing{" "}
              <strong className="font-semibold text-white">Cultural Events &amp; Enrolments</strong>,{" "}
              <strong className="font-semibold text-white">Festival Audit &amp; Approvals</strong>,{" "}
              <strong className="font-semibold text-white">GBM Minutes</strong>,{" "}
              <strong className="font-semibold text-white">Tower Issues (Towers A–F, G+14 Floors)</strong>, and{" "}
              <strong className="font-semibold text-amber-300">ADO Builder Deliverables</strong> with Praneeth
              KKR &amp; IGS.
            </p>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 mt-6">
              <button
                onClick={() => onSelectTab("ado-board")}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 text-xs sm:text-sm font-extrabold px-4 py-2.5 rounded-xl shadow-lg shadow-amber-500/20 transition transform active:scale-95 hover:scale-[1.02]"
              >
                <Kanban className="w-4 h-4 text-slate-950" />
                <span>Open ADO Board</span>
                <span className="bg-slate-950/20 text-slate-950 px-1.5 py-0.5 rounded text-[11px] font-mono font-black">
                  {stats?.active_ado_tasks ?? 0} Pending
                </span>
              </button>

              {/* Financial Audit Report - Only visible to authenticated users */}
              {currentUser && (
                <button
                  onClick={() => {
                    if (onOpenAuditReport) {
                      onOpenAuditReport();
                    } else {
                      onSelectTab("festivals");
                    }
                  }}
                  className="inline-flex items-center gap-2 bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl border border-emerald-500/40 backdrop-blur transition shadow-md shadow-emerald-600/20"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Financial Audit Report</span>
                </button>
              )}

              <button
                onClick={() => onSelectTab("vendor-management")}
                className="inline-flex items-center gap-2 bg-teal-600/90 hover:bg-teal-500 text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl border border-teal-500/40 backdrop-blur transition shadow-md shadow-teal-600/20"
              >
                <Briefcase className="w-4 h-4" />
                <span>Vendors &amp; AMCs</span>
              </button>

              <button
                onClick={() => onSelectTab("issues")}
                className="inline-flex items-center gap-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl border border-rose-500/40 backdrop-blur transition"
              >
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>Tower Issues</span>
              </button>
            </div>
          </div>

          {/* Quick Interactive KPI Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full lg:w-auto lg:min-w-[440px]">
            {/* Stat 1: Culture & Festivals */}
            <div
              onClick={() => onSelectTab("culture-events")}
              className="bg-slate-800/60 hover:bg-slate-800/90 cursor-pointer border border-slate-700/70 hover:border-sky-400/50 rounded-2xl p-4 backdrop-blur-md transition-all duration-200 group shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-sky-300 font-semibold uppercase tracking-wider">
                  Events &amp; Fests
                </span>
                <Sparkles className="w-4 h-4 text-amber-400 group-hover:scale-125 transition" />
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold text-white mt-1.5 font-sans">
                {(stats?.cultural_events_count ?? 0) + (stats?.festivals_count ?? 0)}
              </p>
              <p className="text-[11px] text-sky-300/80 mt-0.5 font-medium">Programs with Audits</p>
            </div>

            {/* Stat 2: ADO Tasks */}
            <div
              onClick={() => onSelectTab("ado-board")}
              className="bg-amber-950/40 hover:bg-amber-950/60 cursor-pointer border border-amber-800/60 hover:border-amber-400/70 rounded-2xl p-4 backdrop-blur-md transition-all duration-200 group shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-amber-300 font-semibold uppercase tracking-wider">
                  ADO Deliverables
                </span>
                <Kanban className="w-4 h-4 text-amber-400 group-hover:scale-125 transition" />
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold text-amber-300 mt-1.5 font-mono">
                {stats?.total_ado_tasks ?? 0}
              </p>
              <p className="text-[11px] text-amber-200/80 mt-0.5 font-medium">
                {stats?.builder_tasks_count ?? 0} Builder • {stats?.igs_tasks_count ?? 0} IGS
              </p>
            </div>

            {/* Stat 3: Community Issues */}
            <div
              onClick={() => onSelectTab("issues")}
              className="bg-rose-950/40 hover:bg-rose-950/60 cursor-pointer border border-rose-800/60 hover:border-rose-400/70 rounded-2xl p-4 backdrop-blur-md transition-all duration-200 group shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-rose-300 font-semibold uppercase tracking-wider">
                  Tower Tickets
                </span>
                <ShieldAlert className="w-4 h-4 text-rose-400 group-hover:scale-125 transition" />
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold text-rose-300 mt-1.5 font-mono">
                {stats?.open_issues_count ?? 0}
              </p>
              <p className="text-[11px] text-rose-200/80 mt-0.5 font-medium">across Towers A to F</p>
            </div>

            {/* Stat 4: GBM Records */}
            <div
              onClick={() => onSelectTab("gbm")}
              className="bg-slate-800/60 hover:bg-slate-800/90 cursor-pointer border border-slate-700/70 hover:border-sky-400/50 rounded-2xl p-4 backdrop-blur-md transition-all duration-200 group shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-sky-300 font-semibold uppercase tracking-wider">
                  GBM Meetings
                </span>
                <FileText className="w-4 h-4 text-sky-400 group-hover:scale-125 transition" />
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold text-white mt-1.5 font-sans">
                {stats?.meetings_count ?? 0}
              </p>
              <p className="text-[11px] text-sky-300/80 mt-0.5 font-medium">Resolutions &amp; Minutes</p>
            </div>

            {/* Stat 5: Vendor Contracts */}
            <div
              onClick={() => onSelectTab("vendor-management")}
              className="bg-teal-950/40 hover:bg-teal-950/60 cursor-pointer border border-teal-800/60 hover:border-teal-400/70 rounded-2xl p-4 backdrop-blur-md transition-all duration-200 group shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-teal-300 font-semibold uppercase tracking-wider">
                  Vendors &amp; AMCs
                </span>
                <Briefcase className="w-4 h-4 text-teal-400 group-hover:scale-125 transition" />
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold text-teal-300 mt-1.5 font-mono">
                {stats?.vendors_count ?? 6}
              </p>
              <p className="text-[11px] text-teal-200/80 mt-0.5 font-medium">EV Hub, Lifts, STP &amp; AMCs</p>
            </div>

            {/* Stat 6: Committee */}
            <div
              onClick={() => onSelectTab("team")}
              className="bg-indigo-950/40 hover:bg-indigo-950/60 cursor-pointer border border-indigo-800/60 hover:border-indigo-400/70 rounded-2xl p-4 backdrop-blur-md transition-all duration-200 group shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-indigo-300 font-semibold uppercase tracking-wider">
                  Committee
                </span>
                <Users className="w-4 h-4 text-indigo-400 group-hover:scale-125 transition" />
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold text-white mt-1.5 font-mono">
                {stats?.team_members_count ?? 10}
              </p>
              <p className="text-[11px] text-indigo-200/80 mt-0.5 font-medium">Elected Office Bearers</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
