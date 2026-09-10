"use client";

import React, { useState, useMemo } from "react";
import {
  Building2,
  Search,
  Filter,
  Download,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sparkles,
  Users,
  FileText,
  Eye,
  IndianRupee,
  Layers,
  ArrowUpDown,
  Lock,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Receipt,
  HelpCircle,
  Plus,
  Minus,
  Maximize2,
  Minimize2,
} from "lucide-react";
import {
  FestivalCelebration,
  CommunityIssue,
  CulturalEvent,
  GeneralBodyMeeting,
  AppUser,
  FlatSummaryItem,
  UserRole,
} from "../lib/types";
import Modal from "./Modal";

interface FlatSummaryTabProps {
  festivals: FestivalCelebration[];
  issues: CommunityIssue[];
  culturalEvents: CulturalEvent[];
  gbmMeetings: GeneralBodyMeeting[];
  users: AppUser[];
  userRole?: UserRole;
  currentUser?: AppUser | null;
}

// Generate the complete inventory of 585 residential flats (Ground + 14 Floors) + Jaitra Management
function generateAllFlats(): Array<{
  tower: string;
  floor: number | string;
  flat_no: string;
  display_label: string;
}> {
  const units: Array<{
    tower: string;
    floor: number | string;
    flat_no: string;
    display_label: string;
  }> = [];

  // 1. Tower A & B: Ground Floor + 14 Floors, 5 Flats per floor = 75 flats each
  ["Tower A", "Tower B"].forEach((tower) => {
    const prefix = tower === "Tower A" ? "A" : "B";
    for (let floor = 0; floor <= 14; floor++) {
      for (let unit = 1; unit <= 5; unit++) {
        const flatNo = floor === 0 ? `G0${unit}` : `${floor}${unit < 10 ? "0" + unit : unit}`;
        units.push({
          tower,
          floor: floor === 0 ? "Ground" : floor,
          flat_no: flatNo,
          display_label: `${prefix}-${flatNo}`,
        });
      }
    }
  });

  // 2. Tower C & D: Ground Floor + 14 Floors, 8 Flats per floor = 120 flats each
  ["Tower C", "Tower D"].forEach((tower) => {
    const prefix = tower === "Tower C" ? "C" : "D";
    for (let floor = 0; floor <= 14; floor++) {
      for (let unit = 1; unit <= 8; unit++) {
        const flatNo = floor === 0 ? `G0${unit}` : `${floor}${unit < 10 ? "0" + unit : unit}`;
        units.push({
          tower,
          floor: floor === 0 ? "Ground" : floor,
          flat_no: flatNo,
          display_label: `${prefix}-${flatNo}`,
        });
      }
    }
  });

  // 3. Tower E: Ground Floor + 14 Floors, 7 Flats per floor = 105 flats
  for (let floor = 0; floor <= 14; floor++) {
    for (let unit = 1; unit <= 7; unit++) {
      const flatNo = floor === 0 ? `G0${unit}` : `${floor}${unit < 10 ? "0" + unit : unit}`;
      units.push({
        tower: "Tower E",
        floor: floor === 0 ? "Ground" : floor,
        flat_no: flatNo,
        display_label: `E-${flatNo}`,
      });
    }
  }

  // 4. Tower F: Ground Floor + 14 Floors, 6 Flats per floor = 90 flats
  for (let floor = 0; floor <= 14; floor++) {
    for (let unit = 1; unit <= 6; unit++) {
      const flatNo = floor === 0 ? `G0${unit}` : `${floor}${unit < 10 ? "0" + unit : unit}`;
      units.push({
        tower: "Tower F",
        floor: floor === 0 ? "Ground" : floor,
        flat_no: flatNo,
        display_label: `F-${flatNo}`,
      });
    }
  }

  // 5. Jaitra Management (Single consolidated entity, no subdivisions)
  units.push({
    tower: "Jaitra Management",
    floor: "Management",
    flat_no: "Jaitra Management",
    display_label: "Jaitra Management (Common Infrastructure)",
  });

  return units;
}

// Helpers for robust matching
function matchTower(t1?: string, t2?: string): boolean {
  if (!t1 || !t2) return false;
  const a = t1.trim().toLowerCase();
  const b = t2.trim().toLowerCase();
  if (a === b) return true;
  if ((a.includes("common") || a.includes("management") || a.includes("jaitra") || a.includes("clubhouse")) &&
      (b.includes("common") || b.includes("management") || b.includes("jaitra") || b.includes("clubhouse"))) {
    return true;
  }
  if (a.includes("tower a") && b.includes("tower a")) return true;
  if (a.includes("tower b") && b.includes("tower b")) return true;
  if (a.includes("tower c") && b.includes("tower c")) return true;
  if (a.includes("tower d") && b.includes("tower d")) return true;
  if (a.includes("tower e") && b.includes("tower e")) return true;
  if (a.includes("tower f") && b.includes("tower f")) return true;
  return false;
}

function matchFlat(recordFlat?: string, targetFlat?: string, targetTower?: string): boolean {
  if (targetTower === "Jaitra Management") return true;
  if (!recordFlat || !targetFlat) return false;
  const a = String(recordFlat).trim().toLowerCase();
  const b = String(targetFlat).trim().toLowerCase();
  if (a === b) return true;

  const d1 = a.replace(/\D/g, "");
  const d2 = b.replace(/\D/g, "");
  if (d1 && d2 && d1 === d2) return true;
  if (a.includes(b) || b.includes(a)) return true;
  return false;
}

export default function FlatSummaryTab({
  festivals,
  issues,
  culturalEvents,
  gbmMeetings,
  users,
  userRole = "User",
  currentUser,
}: FlatSummaryTabProps) {
  const isAdminOrSuperAdmin = userRole === "Super Admin" || userRole === "Admin";

  // Filter States
  const [selectedTower, setSelectedTower] = useState<string>("All");
  const [selectedFloor, setSelectedFloor] = useState<string>("All");
  const [donationFilter, setDonationFilter] = useState<"All" | "Done" | "NotDone">("All");
  const [issuesFilter, setIssuesFilter] = useState<"All" | "HasIssues" | "OpenOnly" | "ResolvedOnly" | "Clean">("All");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [sortField, setSortField] = useState<"flat_no" | "donations" | "issues" | "floor">("flat_no");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Expand / Collapse Multiple Festival Columns (+/- view toggle)
  const [showFestivalColumns, setShowFestivalColumns] = useState<boolean>(true);

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(25);

  // Detail Modal State
  const [activeFlatDetail, setActiveFlatDetail] = useState<FlatSummaryItem | null>(null);

  // Flatten all collections from all festivals
  const allCollections = useMemo(() => {
    return festivals.flatMap((f) => (f.collections || []).map((c) => ({ ...c, festival_name: f.festival_name })));
  }, [festivals]);

  // Flatten all cultural participants
  const allParticipants = useMemo(() => {
    return culturalEvents.flatMap((e) =>
      (e.participants || []).map((p) => ({
        ...p,
        event_title: e.title,
      }))
    );
  }, [culturalEvents]);

  // Build Master Flat Summary List
  const flatSummaryList: FlatSummaryItem[] = useMemo(() => {
    const rawUnits = generateAllFlats();

    return rawUnits.map((unit) => {
      const id = `${unit.tower}-${unit.flat_no}`;

      // 1. Registered App User
      const matchedUser = users.find(
        (u) => matchTower(u.tower, unit.tower) && matchFlat(u.flat_no, unit.flat_no, unit.tower)
      );

      // 2. Festival Collections & Status by Festival (with total amount and count per festival)
      const matchedCollections = allCollections.filter(
        (c) => matchTower(c.tower, unit.tower) && matchFlat(c.flat_no, unit.flat_no, unit.tower)
      );

      const totalDonations = matchedCollections.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
      const donorNames = Array.from(new Set(matchedCollections.map((c) => c.donor_name).filter(Boolean)));

      const festivalsStatus: Record<number, any> = {};
      festivals.forEach((f) => {
        const festCollections = (f.collections || []).filter(
          (c) => matchTower(c.tower, unit.tower) && matchFlat(c.flat_no, unit.flat_no, unit.tower)
        );
        const festAmount = festCollections.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
        const festCount = festCollections.length;
        if (festCount > 0) {
          festivalsStatus[f.id] = {
            festival_id: f.id,
            festival_name: f.festival_name,
            status: "Done",
            amount: festAmount,
            donations_count: festCount,
            transactions: festCollections,
            date: festCollections[0]?.collected_date,
            mode: festCollections[0]?.payment_mode,
            receipt_url: festCollections[0]?.receipt_url,
          };
        } else {
          festivalsStatus[f.id] = {
            festival_id: f.id,
            festival_name: f.festival_name,
            status: "Not Done",
            amount: 0,
            donations_count: 0,
            transactions: [],
          };
        }
      });

      // 3. Community Complaints / Issues
      const matchedIssues = issues.filter(
        (iss) =>
          matchTower(iss.tower, unit.tower) &&
          (matchFlat(iss.flat_no, unit.flat_no, unit.tower) || (iss.flat_or_location && iss.flat_or_location.includes(unit.flat_no)))
      );

      const openCount = matchedIssues.filter((i) => i.status === "Open").length;
      const inProgressCount = matchedIssues.filter((i) => i.status === "In Progress" || i.status === "Under Inspection").length;
      const resolvedCount = matchedIssues.filter((i) => i.status === "Resolved" || i.status === "Closed").length;

      // 4. Cultural Events Participation
      const matchedParticipants = allParticipants.filter((p) => {
        const pFlat = p.flat_no || "";
        const pTower = p.tower || "";
        const towerMatch = matchTower(pTower, unit.tower);
        const flatMatch = matchFlat(pFlat, unit.flat_no, unit.tower);
        return towerMatch && flatMatch;
      });

      const eventsList = matchedParticipants.map((p) => ({
        event_id: p.event_id,
        event_title: p.event_title || "Cultural Event",
        participant_name: p.participant_name,
        activity_category: p.activity_category || p.age_group,
        registration_date: p.registration_date,
      }));

      // Resident Display Name
      const primaryResident =
        matchedUser?.name ||
        (donorNames.length > 0 ? donorNames.join(", ") : undefined) ||
        (eventsList.length > 0 ? eventsList[0].participant_name : undefined);

      return {
        id,
        tower: unit.tower,
        floor: unit.floor,
        flat_no: unit.flat_no,
        display_label: unit.display_label,
        resident_name: primaryResident,
        resident_email: matchedUser?.email,
        resident_phone: matchedUser?.phone,
        resident_role: matchedUser?.role,
        is_registered_user: Boolean(matchedUser),
        total_donations: totalDonations,
        donations_count: matchedCollections.length,
        festivals_status: festivalsStatus,
        total_complaints: matchedIssues.length,
        open_complaints: openCount,
        in_progress_complaints: inProgressCount,
        resolved_complaints: resolvedCount,
        complaints_list: matchedIssues,
        total_events_participated: eventsList.length,
        events_list: eventsList,
        total_gbm_attended: gbmMeetings.length,
      };
    });
  }, [allCollections, allParticipants, festivals, gbmMeetings.length, issues, users]);

  // Pre-calculate Festival Totals for Table Header, Cards & Summary
  const festivalTotals = useMemo(() => {
    const totals: Record<number, { totalAmount: number; totalDonations: number; contributingFlatsCount: number }> = {};
    festivals.forEach((f) => {
      const collections = f.collections || [];
      const totalAmount = collections.reduce((acc, c) => acc + (Number(c.amount) || 0), 0);
      const totalDonations = collections.length;
      const contributingFlats = new Set(
        flatSummaryList.filter((flat) => flat.festivals_status[f.id]?.status === "Done").map((flat) => flat.id)
      );
      totals[f.id] = {
        totalAmount,
        totalDonations,
        contributingFlatsCount: contributingFlats.size,
      };
    });
    return totals;
  }, [festivals, flatSummaryList]);

  // Filtered & Sorted Flat Summaries
  const filteredFlats = useMemo(() => {
    return flatSummaryList
      .filter((flat) => {
        // Tower Filter
        if (selectedTower !== "All" && flat.tower !== selectedTower) {
          return false;
        }

        // Floor Filter
        if (selectedFloor !== "All" && String(flat.floor) !== selectedFloor) {
          return false;
        }

        // Donation Status Filter
        if (donationFilter === "Done" && flat.total_donations <= 0) return false;
        if (donationFilter === "NotDone" && flat.total_donations > 0) return false;

        // Issues Filter
        if (issuesFilter === "HasIssues" && flat.total_complaints === 0) return false;
        if (issuesFilter === "OpenOnly" && flat.open_complaints === 0 && flat.in_progress_complaints === 0) return false;
        if (issuesFilter === "ResolvedOnly" && (flat.resolved_complaints === 0 || flat.open_complaints > 0 || flat.in_progress_complaints > 0)) return false;
        if (issuesFilter === "Clean" && flat.total_complaints > 0) return false;

        // Search Filter
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchFlatNo = flat.flat_no.toLowerCase().includes(q);
          const matchLabel = flat.display_label.toLowerCase().includes(q);
          const matchTowerName = flat.tower.toLowerCase().includes(q);
          const matchResident = (flat.resident_name || "").toLowerCase().includes(q);
          const matchEmail = (flat.resident_email || "").toLowerCase().includes(q);
          const matchIssues = flat.complaints_list.some((iss) => iss.title.toLowerCase().includes(q));
          if (!matchFlatNo && !matchLabel && !matchTowerName && !matchResident && !matchEmail && !matchIssues) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        let compare = 0;
        if (sortField === "donations") {
          compare = a.total_donations - b.total_donations;
        } else if (sortField === "issues") {
          compare = a.total_complaints - b.total_complaints;
        } else if (sortField === "floor") {
          const fA = typeof a.floor === "number" ? a.floor : 999;
          const fB = typeof b.floor === "number" ? b.floor : 999;
          compare = fA - fB;
        } else {
          // flat_no default
          const dA = parseInt(a.flat_no.replace(/\D/g, "")) || 0;
          const dB = parseInt(b.flat_no.replace(/\D/g, "")) || 0;
          compare = dA !== dB ? dA - dB : a.flat_no.localeCompare(b.flat_no);
        }
        return sortOrder === "asc" ? compare : -compare;
      });
  }, [flatSummaryList, selectedTower, selectedFloor, donationFilter, issuesFilter, searchTerm, sortField, sortOrder]);

  // Pagination Slice
  const totalPages = Math.ceil(filteredFlats.length / itemsPerPage) || 1;
  const paginatedFlats = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredFlats.slice(start, start + itemsPerPage);
  }, [filteredFlats, currentPage, itemsPerPage]);

  // Overall Statistics for KPI Cards
  const stats = useMemo(() => {
    const totalFlatsCount = flatSummaryList.length;
    const residentialCount = 585;
    const contributingFlats = flatSummaryList.filter((f) => f.total_donations > 0).length;
    const totalAmount = flatSummaryList.reduce((acc, f) => acc + f.total_donations, 0);
    const flatsWithIssues = flatSummaryList.filter((f) => f.total_complaints > 0).length;
    const flatsWithOpenIssues = flatSummaryList.filter((f) => f.open_complaints > 0 || f.in_progress_complaints > 0).length;
    const registeredUsersCount = flatSummaryList.filter((f) => f.is_registered_user).length;
    const totalParticipants = flatSummaryList.reduce((acc, f) => acc + f.total_events_participated, 0);

    return {
      totalFlatsCount,
      residentialCount,
      contributingFlats,
      totalAmount,
      flatsWithIssues,
      flatsWithOpenIssues,
      registeredUsersCount,
      totalParticipants,
      participationRate: ((contributingFlats / residentialCount) * 100).toFixed(1),
    };
  }, [flatSummaryList]);

  // Export Table to CSV
  const handleExportCSV = () => {
    const headers = [
      "Tower",
      "Floor",
      "Flat/Unit No",
      "Display Tag",
      "Resident / User",
      "Registered App Role",
      "Email",
      "Phone",
      "Total Donations (INR)",
      "Total Donation Transactions",
      ...festivals.map((f) => `${f.festival_name} Status`),
      ...festivals.map((f) => `${f.festival_name} Donations Count`),
      ...festivals.map((f) => `${f.festival_name} Amount (INR)`),
      "Total Complaints Logged",
      "Open Complaints",
      "In Progress Complaints",
      "Resolved Complaints",
      "Cultural Events Participated",
      "GBM Record Status",
    ];

    const rows = filteredFlats.map((flat) => {
      const festivalStatuses = festivals.map((f) => flat.festivals_status[f.id]?.status || "Not Done");
      const festivalCounts = festivals.map((f) => flat.festivals_status[f.id]?.donations_count || 0);
      const festivalAmounts = festivals.map((f) => flat.festivals_status[f.id]?.amount || 0);

      return [
        `"${flat.tower}"`,
        `"${flat.floor}"`,
        `"${flat.flat_no}"`,
        `"${flat.display_label}"`,
        `"${flat.resident_name || "Unregistered"}"`,
        `"${flat.resident_role || "N/A"}"`,
        `"${flat.resident_email || ""}"`,
        `"${flat.resident_phone || ""}"`,
        flat.total_donations,
        flat.donations_count,
        ...festivalStatuses.map((s) => `"${s}"`),
        ...festivalCounts,
        ...festivalAmounts,
        flat.total_complaints,
        flat.open_complaints,
        flat.in_progress_complaints,
        flat.resolved_complaints,
        flat.total_events_participated,
        `"GBM Quorum Met"`,
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Jaitra_Flats_Master_Summary_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // If not Admin or Super Admin, render Protected Access View
  if (!isAdminOrSuperAdmin) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-10 shadow-2xl backdrop-blur-xl">
          <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-rose-950/60 border border-rose-800/80 flex items-center justify-center text-rose-400 shadow-xl shadow-rose-950/50">
            <Lock className="w-10 h-10 animate-pulse" />
          </div>
          <h2 className="text-2xl font-black text-white mb-3">Admin & Super Admin Restricted Tab</h2>
          <p className="text-sm text-slate-400 max-w-lg mx-auto mb-6 leading-relaxed">
            The <strong className="text-amber-300 font-semibold">Flat-wise Master Summary & Directory</strong> contains confidential society-wide financial contributions, resident audit profiles, and complaint history across all 585 flats.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs font-mono text-slate-300">
            <span>Current Role:</span>
            <span className="font-bold text-amber-400">{currentUser ? currentUser.role : "Unauthenticated Guest"}</span>
          </div>
        </div>
      </div>
    );
  }

  const towerTabs = [
    { id: "All", label: "All Units", count: 586, color: "from-slate-700 to-slate-800" },
    { id: "Tower A", label: "Tower A (G+14)", count: 75, color: "from-blue-600 to-cyan-600" },
    { id: "Tower B", label: "Tower B (G+14)", count: 75, color: "from-amber-600 to-yellow-600" },
    { id: "Tower C", label: "Tower C (G+14)", count: 120, color: "from-indigo-600 to-blue-600" },
    { id: "Tower D", label: "Tower D (G+14)", count: 120, color: "from-teal-600 to-emerald-600" },
    { id: "Tower E", label: "Tower E (G+14)", count: 105, color: "from-rose-600 to-pink-600" },
    { id: "Tower F", label: "Tower F (G+14)", count: 90, color: "from-purple-600 to-violet-600" },
    { id: "Jaitra Management", label: "Jaitra Management", count: 1, color: "from-violet-600 to-indigo-600" },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 border border-indigo-900/60 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/90 border border-indigo-700/60 text-indigo-300 text-xs font-mono font-bold tracking-wide">
              <Building2 className="w-3.5 h-3.5" />
              <span>9. FLAT-WISE MASTER DIRECTORY &amp; AUDIT</span>
              <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-sans font-bold">
                Admin Exclusive
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Tower &amp; Flat 360° Master Summary
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Real-time audit across <strong className="text-white font-semibold">Towers A–F (585 flats across Ground &amp; 14 Floors)</strong> &amp; Jaitra Management. Filter contributions, track unresolved maintenance tickets, and audit resident activity.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setShowFestivalColumns(!showFestivalColumns)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs shadow-lg transition-all transform active:scale-95 border ${
                showFestivalColumns
                  ? "bg-indigo-900/80 hover:bg-indigo-800 text-indigo-200 border-indigo-500/50"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
              }`}
              title={showFestivalColumns ? "Collapse multiple festival columns into summary view" : "Expand all festival event columns"}
            >
              {showFestivalColumns ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              <span>{showFestivalColumns ? "Collapse Festivals View" : `Expand All Festivals (${festivals.length})`}</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/50 transition-all transform active:scale-95 border border-emerald-400/40"
            >
              <Download className="w-4 h-4" />
              <span>Export Master CSV</span>
            </button>
          </div>
        </div>

        {/* Top KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Total Units</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-white">
              {stats.totalFlatsCount} <span className="text-xs font-normal text-slate-400">({stats.residentialCount} Flats)</span>
            </div>
            <div className="text-[11px] text-indigo-300 font-medium mt-0.5">
              Towers A-F + Jaitra Management
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <IndianRupee className="w-3.5 h-3.5 text-amber-400" />
              <span>Total Donations</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-300">
              ₹ {stats.totalAmount.toLocaleString("en-IN")}
            </div>
            <div className="text-[11px] text-amber-400/80 font-medium mt-0.5">
              {stats.contributingFlats} Flats ({stats.participationRate}% participation)
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>Community Issues</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-rose-300">
              {issues.length} <span className="text-xs font-normal text-slate-400">({stats.flatsWithOpenIssues} Active)</span>
            </div>
            <div className="text-[11px] text-rose-400/80 font-medium mt-0.5">
              {stats.flatsWithIssues} flats have logged tickets
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Cultural &amp; GBM</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-purple-300">
              {culturalEvents.length} Events • {gbmMeetings.length} GBMs
            </div>
            <div className="text-[11px] text-purple-300/80 font-medium mt-0.5">
              {stats.totalParticipants} resident participations
            </div>
          </div>
        </div>

        {/* Festival Events Donation Breakdown (Counts & Amounts by Festival) */}
        {festivals.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-800/80">
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Festival Events Donation Breakdown (Total Counts &amp; Amounts)</span>
              </div>
              <button
                onClick={() => setShowFestivalColumns(!showFestivalColumns)}
                className="text-[11px] text-indigo-300 hover:text-white font-bold flex items-center gap-1 bg-indigo-950/60 px-2.5 py-1 rounded-lg border border-indigo-800/60"
              >
                {showFestivalColumns ? (
                  <>
                    <Minus className="w-3 h-3 text-indigo-400" />
                    <span>Collapse Table Columns</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3 h-3 text-indigo-400" />
                    <span>Expand Table Columns ({festivals.length})</span>
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {festivals.map((f) => {
                const fTotal = festivalTotals[f.id] || { totalAmount: 0, totalDonations: 0, contributingFlatsCount: 0 };
                const pct = ((fTotal.contributingFlatsCount / 546) * 100).toFixed(1);
                return (
                  <div
                    key={f.id}
                    className="bg-slate-950/80 border border-amber-900/40 hover:border-amber-600/60 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-md transition-all"
                  >
                    <div className="space-y-0.5">
                      <div className="text-xs font-black text-white truncate max-w-[200px]" title={f.festival_name}>
                        {f.festival_name.split("(")[0].trim()}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        <strong className="text-amber-300">{fTotal.contributingFlatsCount} Flats</strong> Contributed ({pct}%)
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-black text-amber-300 font-mono">
                        ₹ {fTotal.totalAmount.toLocaleString("en-IN")}
                      </div>
                      <div className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800/60 inline-block mt-0.5">
                        {fTotal.totalDonations} {fTotal.totalDonations === 1 ? "Donation" : "Donations"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Tower Selector Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {towerTabs.map((tab) => {
          const isActive = selectedTower === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setSelectedTower(tab.id);
                setCurrentPage(1);
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-extrabold whitespace-nowrap transition-all duration-150 transform active:scale-95 ${
                isActive
                  ? "bg-gradient-to-r " + tab.color + " text-white shadow-lg shadow-indigo-950/40 border border-white/30 scale-[1.02]"
                  : "bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                  isActive ? "bg-black/30 text-white" : "bg-slate-800 text-slate-400"
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Box */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search Flat No (e.g. 705, 101), Resident, Donor, Keyword..."
              className="w-full text-xs pl-9 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Floor Selector */}
          <div>
            <select
              value={selectedFloor}
              onChange={(e) => {
                setSelectedFloor(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs px-3 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="All">🏢 All Floors (Ground + 1–14)</option>
              <option value="Ground">Ground Floor</option>
              {Array.from({ length: 14 }, (_, i) => i + 1).map((floor) => (
                <option key={floor} value={String(floor)}>
                  Floor {floor}
                </option>
              ))}
              <option value="Management">Jaitra Management</option>
            </select>
          </div>

          {/* Donation Status Filter */}
          <div>
            <select
              value={donationFilter}
              onChange={(e) => {
                setDonationFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full text-xs px-3 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="All">💰 Donations: All Status</option>
              <option value="Done">✓ Contributed / Done Only</option>
              <option value="NotDone">✕ Not Done / Pending Only</option>
            </select>
          </div>

          {/* Issues Filter */}
          <div>
            <select
              value={issuesFilter}
              onChange={(e) => {
                setIssuesFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full text-xs px-3 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="All">⚠️ Issues: All Units</option>
              <option value="HasIssues">Units with Issues Logged</option>
              <option value="OpenOnly">Active / Open Issues Only</option>
              <option value="ResolvedOnly">All Issues Resolved</option>
              <option value="Clean">Clean (0 Issues)</option>
            </select>
          </div>
        </div>

        {/* Filter Count & Sort Info */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 pt-2 border-t border-slate-800/60">
          <div className="flex items-center gap-2">
            <span>
              Showing <strong className="text-white font-semibold">{filteredFlats.length}</strong> of{" "}
              <strong className="text-white font-semibold">{flatSummaryList.length}</strong> units
            </span>
            {(selectedTower !== "All" || selectedFloor !== "All" || donationFilter !== "All" || issuesFilter !== "All" || searchTerm) && (
              <button
                onClick={() => {
                  setSelectedTower("All");
                  setSelectedFloor("All");
                  setDonationFilter("All");
                  setIssuesFilter("All");
                  setSearchTerm("");
                  setCurrentPage(1);
                }}
                className="text-indigo-400 hover:text-indigo-300 font-bold underline ml-2"
              >
                Reset Filters
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span>Sort by:</span>
              <select
                value={sortField}
                onChange={(e) => setSortField(e.target.value as any)}
                className="bg-slate-950/80 border border-slate-800 rounded-lg px-2 py-1 text-slate-200 text-xs"
              >
                <option value="flat_no">Flat No</option>
                <option value="donations">Total Donated (₹)</option>
                <option value="issues">Total Complaints</option>
                <option value="floor">Floor</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                className="p-1 rounded-lg bg-slate-950/80 border border-slate-800 hover:bg-slate-800 text-slate-300"
                title={`Sort ${sortOrder === "asc" ? "Ascending" : "Descending"}`}
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <span>Per page:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-slate-950/80 border border-slate-800 rounded-lg px-2 py-1 text-slate-200 text-xs"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={600}>All ({filteredFlats.length})</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* The Master Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/90 text-slate-400 font-extrabold uppercase tracking-wider border-b border-slate-800 text-[11px]">
              <tr>
                <th className="px-4 py-3.5">Tower &amp; Floor</th>
                <th className="px-4 py-3.5">Flat / Unit</th>
                <th className="px-4 py-3.5">Resident / User</th>
                <th className="px-4 py-3.5 text-right">Total Donated</th>

                {/* Expanded Festival Columns vs Collapsed Single Column */}
                {showFestivalColumns ? (
                  festivals.map((f) => {
                    const fTotal = festivalTotals[f.id] || { totalAmount: 0, totalDonations: 0, contributingFlatsCount: 0 };
                    return (
                      <th key={f.id} className="px-4 py-3 text-center whitespace-nowrap bg-indigo-950/30 border-x border-indigo-900/30">
                        <div className="flex items-center justify-center gap-1.5">
                          <span className="font-extrabold text-slate-200">{f.festival_name.split("(")[0].trim()}</span>
                          <button
                            onClick={() => setShowFestivalColumns(false)}
                            className="p-0.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                            title="Collapse festival columns (-)"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="text-[10px] text-amber-300 font-mono font-bold mt-0.5">
                          {fTotal.totalDonations} {fTotal.totalDonations === 1 ? "donation" : "donations"} • ₹{fTotal.totalAmount.toLocaleString("en-IN")}
                        </div>
                        <div className="text-[9px] text-slate-400 font-normal">
                          {fTotal.contributingFlatsCount} flats ({((fTotal.contributingFlatsCount / 546) * 100).toFixed(1)}%)
                        </div>
                      </th>
                    );
                  })
                ) : (
                  <th className="px-4 py-3.5 text-center whitespace-nowrap bg-indigo-950/40 border-x border-indigo-900/40">
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="font-extrabold text-indigo-300">Festivals Status</span>
                      <button
                        onClick={() => setShowFestivalColumns(true)}
                        className="p-1 rounded-md bg-indigo-900/80 hover:bg-indigo-800 text-white font-bold flex items-center gap-1 text-[10px]"
                        title="Expand all festival event columns (+)"
                      >
                        <Plus className="w-3 h-3 text-amber-400" />
                        <span>Expand ({festivals.length})</span>
                      </button>
                    </div>
                    <div className="text-[10px] text-amber-300 font-mono mt-0.5">
                      {festivals.reduce((acc, f) => acc + (festivalTotals[f.id]?.totalDonations || 0), 0)} Total Donations • ₹{stats.totalAmount.toLocaleString("en-IN")}
                    </div>
                  </th>
                )}

                <th className="px-4 py-3.5 text-center">Complaints</th>
                <th className="px-4 py-3.5 text-center">Events Conducted</th>
                <th className="px-4 py-3.5 text-center">GBM Records</th>
                <th className="px-4 py-3.5 text-center">360° View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {paginatedFlats.length === 0 ? (
                <tr>
                  <td colSpan={showFestivalColumns ? 8 + festivals.length : 9} className="px-6 py-12 text-center text-slate-500">
                    <div className="max-w-sm mx-auto space-y-2">
                      <HelpCircle className="w-8 h-8 text-slate-600 mx-auto" />
                      <p className="font-semibold text-slate-400 text-sm">No Flats Found</p>
                      <p className="text-xs text-slate-500">Try adjusting your search query or filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedFlats.map((flat) => {
                  const hasDonated = flat.total_donations > 0;
                  const hasIssues = flat.total_complaints > 0;
                  const hasOpenIssues = flat.open_complaints > 0 || flat.in_progress_complaints > 0;

                  // Count of festivals contributed by this flat
                  const festivalsDoneCount = festivals.filter((f) => flat.festivals_status[f.id]?.status === "Done").length;

                  return (
                    <tr
                      key={flat.id}
                      className="hover:bg-slate-800/60 transition-colors duration-150 group"
                    >
                      {/* Tower & Floor */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                              flat.tower === "Tower A"
                                ? "bg-blue-950 text-blue-300 border border-blue-800/60"
                                : flat.tower === "Tower B"
                                ? "bg-amber-950 text-amber-300 border border-amber-800/60"
                                : flat.tower === "Tower C"
                                ? "bg-indigo-950 text-indigo-300 border border-indigo-800/60"
                                : flat.tower === "Tower D"
                                ? "bg-teal-950 text-teal-300 border border-teal-800/60"
                                : flat.tower === "Tower E"
                                ? "bg-rose-950 text-rose-300 border border-rose-800/60"
                                : flat.tower === "Tower F"
                                ? "bg-purple-950 text-purple-300 border border-purple-800/60"
                                : "bg-violet-950 text-violet-300 border border-violet-800/60"
                            }`}
                          >
                            {flat.tower}
                          </span>
                          <span className="text-slate-400 text-[11px]">
                            {typeof flat.floor === "number" ? `Fl. ${flat.floor}` : flat.floor}
                          </span>
                        </div>
                      </td>

                      {/* Flat No */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-mono font-bold text-white text-xs bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800 inline-block">
                          {flat.flat_no}
                        </div>
                      </td>

                      {/* Resident / User */}
                      <td className="px-4 py-3">
                        <div className="max-w-[180px] truncate">
                          {flat.resident_name ? (
                            <div>
                              <div className="font-bold text-slate-200 truncate flex items-center gap-1.5">
                                <span>{flat.resident_name}</span>
                                {flat.is_registered_user && (
                                  <span className="px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-700/60 text-[9px] font-sans">
                                    {flat.resident_role || "User"}
                                  </span>
                                )}
                              </div>
                              {flat.resident_email && (
                                <div className="text-[10px] text-slate-500 truncate">{flat.resident_email}</div>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-500 italic text-[11px]">—</span>
                          )}
                        </div>
                      </td>

                      {/* Total Donated */}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {hasDonated ? (
                          <div>
                            <span className="font-black text-amber-300 font-mono text-xs">
                              ₹ {flat.total_donations.toLocaleString("en-IN")}
                            </span>
                            <div className="text-[10px] text-emerald-400 font-semibold">
                              {flat.donations_count} {flat.donations_count === 1 ? "donation" : "donations"}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-500 font-mono text-[11px]">₹ 0</span>
                        )}
                      </td>

                      {/* Festival Donation Columns (Expanded vs Collapsed) */}
                      {showFestivalColumns ? (
                        festivals.map((f) => {
                          const festStat = flat.festivals_status[f.id];
                          const isDone = festStat?.status === "Done";
                          const count = festStat?.donations_count || 0;
                          const amount = festStat?.amount || 0;
                          return (
                            <td key={f.id} className="px-4 py-3 text-center whitespace-nowrap bg-indigo-950/10 border-x border-slate-800/40">
                              {isDone ? (
                                <div className="inline-flex flex-col items-center">
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-950/80 text-emerald-300 border border-emerald-700/70 text-[11px] font-bold shadow-sm">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                    <span>Done: ₹{amount.toLocaleString("en-IN")}</span>
                                  </span>
                                  <span className="text-[10px] text-amber-300/90 font-mono font-semibold mt-0.5">
                                    {count} {count === 1 ? "donation" : "donations"}
                                  </span>
                                </div>
                              ) : (
                                <div className="inline-flex flex-col items-center">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-950/60 text-slate-500 border border-slate-800 text-[10px] font-medium">
                                    <XCircle className="w-3 h-3 text-slate-500" />
                                    <span>Not Done</span>
                                  </span>
                                  <span className="text-[9px] text-slate-600 font-mono mt-0.5">
                                    0 donations • ₹0
                                  </span>
                                </div>
                              )}
                            </td>
                          );
                        })
                      ) : (
                        <td className="px-4 py-3 text-center whitespace-nowrap bg-indigo-950/20 border-x border-slate-800/60">
                          {festivalsDoneCount > 0 ? (
                            <div className="inline-flex flex-col items-center">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-950/80 text-emerald-300 border border-emerald-700/70 text-[11px] font-bold">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                <span>{festivalsDoneCount}/{festivals.length} Festivals Done</span>
                              </span>
                              <span className="text-[10px] text-amber-300 font-mono font-bold mt-0.5">
                                ₹ {flat.total_donations.toLocaleString("en-IN")} ({flat.donations_count} gifts)
                              </span>
                            </div>
                          ) : (
                            <div className="inline-flex flex-col items-center">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-950/60 text-slate-500 border border-slate-800 text-[10px] font-medium">
                                <XCircle className="w-3 h-3 text-slate-500" />
                                <span>0/{festivals.length} Done</span>
                              </span>
                              <span className="text-[9px] text-slate-600 font-mono mt-0.5">₹ 0</span>
                            </div>
                          )}
                        </td>
                      )}

                      {/* Total Complains / Issues */}
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        {hasIssues ? (
                          <div className="inline-flex flex-col items-center">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[11px] font-extrabold ${
                                hasOpenIssues
                                  ? "bg-rose-950 text-rose-300 border border-rose-800/80"
                                  : "bg-teal-950 text-teal-300 border border-teal-800/80"
                              }`}
                            >
                              {flat.total_complaints} {flat.total_complaints === 1 ? "Issue" : "Issues"}
                            </span>
                            <span className="text-[10px] text-slate-400 mt-0.5">
                              {flat.open_complaints > 0 && `${flat.open_complaints} Open `}
                              {flat.in_progress_complaints > 0 && `${flat.in_progress_complaints} Active `}
                              {flat.resolved_complaints > 0 && `${flat.resolved_complaints} Solved`}
                            </span>
                          </div>
                        ) : (
                          <span className="text-emerald-400/80 text-[11px] font-semibold">0 Clean</span>
                        )}
                      </td>

                      {/* Events Participated */}
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        {flat.total_events_participated > 0 ? (
                          <span className="px-2 py-0.5 rounded-md bg-purple-950 text-purple-300 border border-purple-800/60 text-[11px] font-bold">
                            {flat.total_events_participated} {flat.total_events_participated === 1 ? "Event" : "Events"}
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[11px]">—</span>
                        )}
                      </td>

                      {/* GBM Records */}
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md bg-sky-950/70 text-sky-300 border border-sky-800/60 text-[10px] font-medium">
                          Quorum Met ({gbmMeetings.length} GBMs)
                        </span>
                      </td>

                      {/* 360° Profile Button */}
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <button
                          onClick={() => setActiveFlatDetail(flat)}
                          className="px-2.5 py-1 rounded-xl bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-700/60 hover:border-indigo-500 font-bold text-xs inline-flex items-center gap-1.5 transition-all"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>360° Audit</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="bg-slate-950/90 border-t border-slate-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
          <div>
            Showing{" "}
            <strong className="text-white font-semibold">
              {filteredFlats.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}
            </strong>{" "}
            to{" "}
            <strong className="text-white font-semibold">
              {Math.min(currentPage * itemsPerPage, filteredFlats.length)}
            </strong>{" "}
            of <strong className="text-white font-semibold">{filteredFlats.length}</strong> flats
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 font-bold"
            >
              «
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 font-bold flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Prev</span>
            </button>

            <span className="px-3 py-1 bg-slate-950 border border-slate-800 rounded-lg text-white font-bold font-mono">
              Page {currentPage} / {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 font-bold flex items-center gap-1"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 font-bold"
            >
              »
            </button>
          </div>
        </div>
      </div>

      {/* Flat 360° Profile Modal */}
      {activeFlatDetail && (
        <Modal
          isOpen={Boolean(activeFlatDetail)}
          onClose={() => setActiveFlatDetail(null)}
          title={`Flat 360° Audit: ${activeFlatDetail.tower} - ${activeFlatDetail.flat_no}`}
          subtitle={`Full history of contributions, complaints, events, and resident account`}
          maxWidth="2xl"
        >
          <div className="space-y-6">
            {/* Flat Summary Banner */}
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950/70 border border-indigo-900/50 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded-lg bg-indigo-950 text-indigo-300 border border-indigo-700 font-bold text-xs">
                    {activeFlatDetail.tower}
                  </span>
                  <span className="text-slate-400 text-xs">
                    {typeof activeFlatDetail.floor === "number" ? `Floor ${activeFlatDetail.floor}` : activeFlatDetail.floor}
                  </span>
                  <span className="text-slate-500">•</span>
                  <span className="font-mono font-bold text-white text-xs">Flat {activeFlatDetail.flat_no}</span>
                </div>
                <div className="text-lg font-black text-white">
                  {activeFlatDetail.resident_name || "Unregistered Occupant"}
                </div>
                {activeFlatDetail.resident_email && (
                  <div className="text-xs text-indigo-300 mt-0.5">{activeFlatDetail.resident_email}</div>
                )}
              </div>

              <div className="text-right sm:border-l sm:border-slate-800 sm:pl-4">
                <div className="text-[11px] text-slate-400 font-bold uppercase">Total Donations</div>
                <div className="text-xl font-black text-amber-300 font-mono">
                  ₹ {activeFlatDetail.total_donations.toLocaleString("en-IN")}
                </div>
                <div className="text-[10px] text-emerald-400 font-semibold">{activeFlatDetail.donations_count} total contributions</div>
              </div>
            </div>

            {/* 1. Festival Contributions Section (Itemized Breakdown with Counts & Receipts) */}
            <div className="space-y-3">
              <h3 className="text-sm font-black text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Festival Events Contributions Breakdown</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {festivals.map((f) => {
                  const stat = activeFlatDetail.festivals_status[f.id];
                  const isDone = stat?.status === "Done";
                  const count = stat?.donations_count || 0;
                  const amount = stat?.amount || 0;
                  const transactions: any[] = stat?.transactions || [];

                  return (
                    <div
                      key={f.id}
                      className={`p-3.5 rounded-2xl border ${
                        isDone
                          ? "bg-emerald-950/30 border-emerald-800/60"
                          : "bg-slate-900/60 border-slate-800"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-xs font-bold text-white">{f.festival_name}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{f.start_date}</div>
                        </div>
                        {isDone ? (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-700 text-[10px] font-bold">
                            ✓ Done ({count})
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-rose-950 text-rose-300 border border-rose-800 text-[10px] font-bold">
                            ✕ Not Done
                          </span>
                        )}
                      </div>

                      {isDone ? (
                        <div className="mt-3 pt-2 border-t border-emerald-800/40 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-mono font-black text-amber-300 text-sm">
                              ₹ {amount.toLocaleString("en-IN")}
                            </span>
                            <span className="text-[11px] text-emerald-400 font-bold">
                              {count} {count === 1 ? "Donation" : "Donations"}
                            </span>
                          </div>

                          {/* Individual Gifts / Receipts */}
                          {transactions.length > 0 && (
                            <div className="space-y-1.5 pt-1">
                              {transactions.map((tx: any, tIdx: number) => (
                                <div
                                  key={tx.id || tIdx}
                                  className="p-2 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-[11px]"
                                >
                                  <div>
                                    <div className="font-bold text-slate-200">
                                      ₹ {Number(tx.amount || 0).toLocaleString("en-IN")} • {tx.payment_mode || "UPI"}
                                    </div>
                                    <div className="text-[10px] text-slate-400">
                                      {tx.collected_date} {tx.donor_name ? `• Donor: ${tx.donor_name}` : ""}
                                    </div>
                                  </div>
                                  {tx.receipt_url && (
                                    <a
                                      href={tx.receipt_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="px-2 py-1 rounded bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-800 text-[10px] font-bold inline-flex items-center gap-1"
                                    >
                                      <Receipt className="w-3 h-3" />
                                      <span>Receipt</span>
                                    </a>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="mt-2 text-[11px] text-slate-500 italic">
                          No donation recorded for this event.
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. Community Complaints Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-black text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>Logged Complaints &amp; Maintenance Tickets ({activeFlatDetail.total_complaints})</span>
              </h3>

              {activeFlatDetail.complaints_list.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 text-center text-xs text-slate-400">
                  ✓ No maintenance complaints logged for this flat.
                </div>
              ) : (
                <div className="space-y-2">
                  {activeFlatDetail.complaints_list.map((iss) => (
                    <div
                      key={iss.id}
                      className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-amber-400">{iss.issue_code}</span>
                          <span className="font-bold text-white">{iss.title}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1">
                          Category: {iss.category} • Priority: <span className="text-rose-300 font-semibold">{iss.priority}</span> • Logged: {iss.created_at}
                        </div>
                        {iss.description && (
                          <p className="text-[11px] text-slate-300 mt-1 italic">&ldquo;{iss.description}&rdquo;</p>
                        )}
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 ${
                          iss.status === "Open"
                            ? "bg-rose-950 text-rose-300 border border-rose-800"
                            : iss.status === "In Progress"
                            ? "bg-amber-950 text-amber-300 border border-amber-800"
                            : "bg-emerald-950 text-emerald-300 border border-emerald-800"
                        }`}
                      >
                        {iss.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Cultural Events Participation */}
            <div className="space-y-3">
              <h3 className="text-sm font-black text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                <Users className="w-4 h-4 text-purple-400" />
                <span>Cultural Event Participations ({activeFlatDetail.total_events_participated})</span>
              </h3>

              {activeFlatDetail.events_list.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 text-center text-xs text-slate-400">
                  No cultural registrations recorded for this flat.
                </div>
              ) : (
                <div className="space-y-2">
                  {activeFlatDetail.events_list.map((ev, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-white">{ev.event_title}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Participant: <strong className="text-slate-200">{ev.participant_name}</strong> • Role/Category: {ev.activity_category}
                        </div>
                      </div>
                      {ev.registration_date && (
                        <span className="text-[10px] text-slate-500">{ev.registration_date}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
