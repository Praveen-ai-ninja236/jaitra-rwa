"use client";

import React from "react";
import {
  Calendar,
  Sparkles,
  FileText,
  AlertTriangle,
  Kanban,
  Users,
  Briefcase,
  History,
  Building2,
} from "lucide-react";
import { AppUser } from "../lib/types";

export interface TabItem {
  id: string;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  badge?: number | string;
  authRequired?: boolean;
  adminOnly?: boolean;
  activeClass: string;
  inactiveClass: string;
  activeBadgeClass: string;
  inactiveBadgeClass: string;
  activeIconClass: string;
  inactiveIconClass: string;
}

interface TabNavProps {
  activeTab: string;
  onTabChange: (id: string) => void;
  badgeCounts: {
    events?: number;
    festivals?: number;
    meetings?: number;
    issues?: number;
    adoTasks?: number;
    team?: number;
    vendors?: number;
    history?: number;
  };
  currentUser?: AppUser | null;
}

export default function TabNav({ activeTab, onTabChange, badgeCounts, currentUser }: TabNavProps) {
  const isAuthenticated = Boolean(currentUser);

  const allTabs: TabItem[] = [
    {
      id: "culture-events",
      label: "1. Cultural Events",
      shortLabel: "Culture Events",
      icon: Calendar,
      badge: badgeCounts.events,
      activeClass:
        "bg-gradient-to-r from-indigo-600 via-indigo-500 to-blue-600 text-white shadow-xl shadow-indigo-600/35 border-2 border-indigo-300 ring-2 ring-indigo-400/50 scale-[1.02]",
      inactiveClass:
        "bg-slate-900/90 text-indigo-200/90 hover:text-white hover:bg-indigo-950/60 border border-indigo-900/50 hover:border-indigo-600/70",
      activeBadgeClass: "bg-white/25 text-white border border-white/40 shadow-inner",
      inactiveBadgeClass: "bg-indigo-950/90 text-indigo-300 border border-indigo-700/80",
      activeIconClass: "text-white",
      inactiveIconClass: "text-indigo-400",
    },
    {
      id: "festivals",
      label: "2. Festival Celebrations",
      shortLabel: "Festivals",
      icon: Sparkles,
      badge: badgeCounts.festivals,
      activeClass:
        "bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500 text-slate-950 font-black shadow-xl shadow-amber-500/35 border-2 border-amber-200 ring-2 ring-amber-300/50 scale-[1.02]",
      inactiveClass:
        "bg-slate-900/90 text-amber-200/90 hover:text-white hover:bg-amber-950/60 border border-amber-900/50 hover:border-amber-600/70",
      activeBadgeClass: "bg-slate-950/30 text-slate-950 font-black border border-slate-950/40 shadow-inner",
      inactiveBadgeClass: "bg-amber-950/90 text-amber-300 border border-amber-700/80",
      activeIconClass: "text-slate-950",
      inactiveIconClass: "text-amber-400",
    },
    {
      id: "gbm",
      label: "3. General Body Meetings (GBM)",
      shortLabel: "GBM Meetings",
      icon: FileText,
      badge: badgeCounts.meetings,
      activeClass:
        "bg-gradient-to-r from-sky-600 via-sky-500 to-cyan-600 text-white shadow-xl shadow-sky-600/35 border-2 border-sky-300 ring-2 ring-sky-400/50 scale-[1.02]",
      inactiveClass:
        "bg-slate-900/90 text-sky-200/90 hover:text-white hover:bg-sky-950/60 border border-sky-900/50 hover:border-sky-600/70",
      activeBadgeClass: "bg-white/25 text-white border border-white/40 shadow-inner",
      inactiveBadgeClass: "bg-sky-950/90 text-sky-300 border border-sky-700/80",
      activeIconClass: "text-white",
      inactiveIconClass: "text-sky-400",
    },
    {
      id: "issues",
      label: "4. Community Issues",
      shortLabel: "Tower Issues",
      icon: AlertTriangle,
      badge: badgeCounts.issues,
      authRequired: true,
      activeClass:
        "bg-gradient-to-r from-rose-600 via-rose-500 to-red-600 text-white shadow-xl shadow-rose-600/35 border-2 border-rose-300 ring-2 ring-rose-400/50 scale-[1.02]",
      inactiveClass:
        "bg-slate-900/90 text-rose-200/90 hover:text-white hover:bg-rose-950/60 border border-rose-900/50 hover:border-rose-600/70",
      activeBadgeClass: "bg-white/25 text-white border border-white/40 shadow-inner",
      inactiveBadgeClass: "bg-rose-950/90 text-rose-300 border border-rose-700/80",
      activeIconClass: "text-white",
      inactiveIconClass: "text-rose-400",
    },
    {
      id: "ado-board",
      label: "5. Pendings with Builder & IGS",
      shortLabel: "ADO Board",
      icon: Kanban,
      badge: badgeCounts.adoTasks,
      authRequired: true,
      activeClass:
        "bg-gradient-to-r from-orange-600 via-orange-500 to-amber-600 text-white shadow-xl shadow-orange-600/35 border-2 border-orange-300 ring-2 ring-orange-400/50 scale-[1.02]",
      inactiveClass:
        "bg-slate-900/90 text-orange-200/90 hover:text-white hover:bg-orange-950/60 border border-orange-900/50 hover:border-orange-600/70",
      activeBadgeClass: "bg-white/25 text-white border border-white/40 shadow-inner",
      inactiveBadgeClass: "bg-orange-950/90 text-orange-300 border border-orange-700/80",
      activeIconClass: "text-white",
      inactiveIconClass: "text-orange-400",
    },
    {
      id: "team",
      label: "6. Jaitra Team List",
      shortLabel: "Team List",
      icon: Users,
      badge: badgeCounts.team,
      authRequired: true,
      activeClass:
        "bg-gradient-to-r from-emerald-600 via-emerald-500 to-green-600 text-white shadow-xl shadow-emerald-600/35 border-2 border-emerald-300 ring-2 ring-emerald-400/50 scale-[1.02]",
      inactiveClass:
        "bg-slate-900/90 text-emerald-200/90 hover:text-white hover:bg-emerald-950/60 border border-emerald-900/50 hover:border-emerald-600/70",
      activeBadgeClass: "bg-white/25 text-white border border-white/40 shadow-inner",
      inactiveBadgeClass: "bg-emerald-950/90 text-emerald-300 border border-emerald-700/80",
      activeIconClass: "text-white",
      inactiveIconClass: "text-emerald-400",
    },
    {
      id: "vendor-management",
      label: "7. Vendor & AMC Contracts",
      shortLabel: "Vendors & AMCs",
      icon: Briefcase,
      badge: badgeCounts.vendors,
      authRequired: true,
      activeClass:
        "bg-gradient-to-r from-teal-600 via-teal-500 to-cyan-600 text-white shadow-xl shadow-teal-600/35 border-2 border-teal-300 ring-2 ring-teal-400/50 scale-[1.02]",
      inactiveClass:
        "bg-slate-900/90 text-teal-200/90 hover:text-white hover:bg-teal-950/60 border border-teal-900/50 hover:border-teal-600/70",
      activeBadgeClass: "bg-white/25 text-white border border-white/40 shadow-inner",
      inactiveBadgeClass: "bg-teal-950/90 text-teal-300 border border-teal-700/80",
      activeIconClass: "text-white",
      inactiveIconClass: "text-teal-400",
    },
    {
      id: "change-history",
      label: "8. Change History",
      shortLabel: "Change History",
      icon: History,
      badge: badgeCounts.history,
      authRequired: true,
      activeClass:
        "bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 text-white shadow-xl shadow-violet-600/35 border-2 border-violet-300 ring-2 ring-violet-400/50 scale-[1.02]",
      inactiveClass:
        "bg-slate-900/90 text-violet-200/90 hover:text-white hover:bg-violet-950/60 border border-violet-900/50 hover:border-violet-600/70",
      activeBadgeClass: "bg-white/25 text-white border border-white/40 shadow-inner",
      inactiveBadgeClass: "bg-violet-950/90 text-violet-300 border border-violet-700/80",
      activeIconClass: "text-white",
      inactiveIconClass: "text-violet-400",
    },
    {
      id: "flat-summary",
      label: "9. Flat Directory & Summary",
      shortLabel: "Flat Summary",
      icon: Building2,
      badge: "585",
      authRequired: true,
      adminOnly: true,
      activeClass:
        "bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white shadow-xl shadow-indigo-600/35 border-2 border-indigo-300 ring-2 ring-indigo-400/50 scale-[1.02]",
      inactiveClass:
        "bg-slate-900/90 text-indigo-200/90 hover:text-white hover:bg-indigo-950/60 border border-indigo-900/50 hover:border-indigo-600/70",
      activeBadgeClass: "bg-white/25 text-white border border-white/40 shadow-inner",
      inactiveBadgeClass: "bg-indigo-950/90 text-indigo-300 border border-indigo-700/80",
      activeIconClass: "text-white",
      inactiveIconClass: "text-indigo-400",
    },
  ];

  const tabs = React.useMemo(() => {
    if (!isAuthenticated) {
      return allTabs.filter((t) => !t.authRequired && !t.adminOnly);
    }
    const isAdmin = currentUser?.role === "Super Admin" || currentUser?.role === "Admin";
    if (currentUser?.role === "Staff") {
      // Staff role has access strictly to Cultural Events and Community Issues
      return allTabs.filter((t) => t.id === "culture-events" || t.id === "issues");
    }
    if (!isAdmin) {
      return allTabs.filter((t) => !t.adminOnly);
    }
    return allTabs;
  }, [isAuthenticated, currentUser, allTabs]);

  return (
    <div className="bg-slate-950/95 border-b border-slate-800 sticky top-16 z-30 shadow-2xl backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <nav
          className="flex space-x-2 sm:space-x-3 overflow-x-auto py-3.5 sm:py-4 scrollbar-none items-center"
          aria-label="Tabs"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`group relative flex items-center gap-2 sm:gap-2.5 px-3.5 sm:px-5 py-2.5 sm:py-3 rounded-2xl font-extrabold text-xs sm:text-sm whitespace-nowrap transition-all duration-200 transform active:scale-95 ${
                  isActive ? tab.activeClass : tab.inactiveClass
                }`}
              >
                <Icon
                  className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:scale-110 shrink-0 ${
                    isActive ? tab.activeIconClass : tab.inactiveIconClass
                  }`}
                />
                <span className="hidden sm:inline tracking-tight font-black">{tab.label}</span>
                <span className="sm:hidden tracking-tight font-black">{tab.shortLabel}</span>

                {tab.badge !== undefined && (typeof tab.badge === "number" ? tab.badge > 0 : Boolean(tab.badge)) && (
                  <span
                    className={`ml-1 px-2 sm:px-2.5 py-0.5 text-xs sm:text-sm font-mono font-black rounded-xl leading-none transition shrink-0 ${
                      isActive ? tab.activeBadgeClass : tab.inactiveBadgeClass
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
