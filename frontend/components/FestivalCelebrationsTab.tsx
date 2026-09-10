"use client";

import React, { useState, useMemo } from "react";
import {
  FestivalCelebration,
  FestivalCelebrationCreate,
  FestivalCollection,
  FestivalCollectionCreate,
  FestivalExpense,
  FestivalExpenseCreate,
  UserRole,
  DropdownCategoryMap,
  TeamMember,
} from "../lib/types";
import {
  Sparkles,
  Calendar,
  MapPin,
  User,
  Plus,
  Search,
  IndianRupee,
  Trash2,
  Edit,
  Tag,
  Flame,
  CheckCircle,
  Coins,
  Receipt,
  FileCheck2,
  FileText,
  Building,
  CheckCircle2,
  CreditCard,
  Download,
  Paperclip,
  ExternalLink,
  ChevronRight,
  Filter,
  ArrowUpDown,
  FileSpreadsheet,
  Eye,
} from "lucide-react";
import Modal from "./Modal";
import DynamicSelect from "./DynamicSelect";
import FileUploadInput from "./FileUploadInput";
import DocumentPreviewModal from "./DocumentPreviewModal";

interface FestivalCelebrationsTabProps {
  festivals: FestivalCelebration[];
  onAddFestival: (fest: FestivalCelebrationCreate) => Promise<void>;
  onUpdateFestival: (id: number, fest: Partial<FestivalCelebrationCreate>) => Promise<void>;
  onDeleteFestival: (id: number) => Promise<void>;
  onAddCollection: (festivalId: number, coll: FestivalCollectionCreate) => Promise<void>;
  onUpdateCollection: (collectionId: number, coll: Partial<FestivalCollectionCreate>) => Promise<void>;
  onDeleteCollection: (collectionId: number) => Promise<void>;
  onAddExpense: (festivalId: number, exp: FestivalExpenseCreate) => Promise<void>;
  onUpdateExpense: (expenseId: number, exp: Partial<FestivalExpenseCreate>) => Promise<void>;
  onUpdateExpenseStatus: (expenseId: number, status: string, approverName?: string) => Promise<void>;
  onDeleteExpense: (expenseId: number) => Promise<void>;
  onOpenAuditReport: () => void;
  isLoading: boolean;
  userRole?: UserRole;
  isGuest?: boolean;
  dropdownMap?: DropdownCategoryMap;
  teamMembers?: TeamMember[];
}

export default function FestivalCelebrationsTab({
  festivals,
  onAddFestival,
  onUpdateFestival,
  onDeleteFestival,
  onAddCollection,
  onUpdateCollection,
  onDeleteCollection,
  onAddExpense,
  onUpdateExpense,
  onUpdateExpenseStatus,
  onDeleteExpense,
  onOpenAuditReport,
  isLoading,
  userRole = "Super Admin",
  isGuest = false,
  dropdownMap = {},
  teamMembers = [],
}: FestivalCelebrationsTabProps) {
  const teamMemberNames = teamMembers.map((m) => m.name).filter(Boolean);
  const canEdit = userRole === "Super Admin" || userRole === "Admin";
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingFestival, setEditingFestival] = useState<FestivalCelebration | null>(null);
  const [activeFestivalDetail, setActiveFestivalDetail] = useState<FestivalCelebration | null>(null);
  const [detailActiveTab, setDetailActiveTab] = useState<"overview" | "collections" | "expenses">("overview");

  const [editingCollection, setEditingCollection] = useState<FestivalCollection | null>(null);
  const [editingExpense, setEditingExpense] = useState<FestivalExpense | null>(null);
  const [previewDoc, setPreviewDoc] = useState<{ url: string; title: string } | null>(null);

  // Table Filters & Sorting within Detail View
  const [collSearch, setCollSearch] = useState("");
  const [collTowerFilter, setCollTowerFilter] = useState("All");
  const [collPaymentFilter, setCollPaymentFilter] = useState("All");
  const [collSortField, setCollSortField] = useState<"date" | "amount" | "donor">("date");
  const [collSortOrder, setCollSortOrder] = useState<"asc" | "desc">("desc");

  const [expSearch, setExpSearch] = useState("");
  const [expCategoryFilter, setExpCategoryFilter] = useState("All");
  const [expStatusFilter, setExpStatusFilter] = useState("All");
  const [expSortField, setExpSortField] = useState<"date" | "amount" | "title">("date");
  const [expSortOrder, setExpSortOrder] = useState<"asc" | "desc">("desc");

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form States
  const [formData, setFormData] = useState<FestivalCelebrationCreate>({
    festival_name: "",
    start_date: "",
    end_date: "",
    location: "Clubhouse Central Mandapam",
    description: "",
    lead_organizer: "",
    estimated_budget: "₹ 2,50,000",
    collected_funds: "₹ 0",
    status: "Active",
    highlights: "Pooja & Aarti, Cultural Stage Performances, Maha-Prasadam Distribution, Kids Games",
  });

  const [collData, setCollData] = useState<FestivalCollectionCreate>({
    tower: "Tower A",
    flat_no: "101",
    donor_name: "",
    amount: 1000,
    payment_mode: "UPI",
    transaction_ref: "",
    collected_date: new Date().toISOString().split("T")[0],
    receipt_url: "",
    notes: "",
  });

  const [expData, setExpData] = useState<FestivalExpenseCreate>({
    title: "",
    category: "Decor",
    amount: 5000,
    vendor_name: "",
    bill_date: new Date().toISOString().split("T")[0],
    invoice_url: "",
    audit_evidence_notes: "",
    approver_name: "Vikram Patel",
    approver_role: "Treasurer",
    approval_status: "Approved",
    payment_mode: "UPI",
    transaction_ref: "",
  });

  const defaultTowers = dropdownMap["towers"]?.length ? dropdownMap["towers"] : ["Tower A", "Tower B", "Tower C", "Tower D", "Tower E", "Tower F", "Jaitra Management"];
  const defaultPaymentModes = dropdownMap["payment_modes"]?.length ? dropdownMap["payment_modes"] : ["UPI", "Cash", "Cheque", "Net Banking", "Card"];
  const defaultExpenseCategories = dropdownMap["expense_categories"]?.length ? dropdownMap["expense_categories"] : ["Decor", "Pooja", "Sound & Light", "Food/Prasadam", "Security", "Priest Dakshina", "Logistics & Stage", "Awards/Gifts", "Printing & Flex"];

  // Filtered Festivals
  const filteredFestivals = useMemo(() => {
    return festivals.filter((fest) => {
      const matchSearch =
        fest.festival_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fest.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fest.lead_organizer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fest.highlights?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = selectedStatus === "All" || fest.status === selectedStatus;
      return matchSearch && matchStatus;
    });
  }, [festivals, searchTerm, selectedStatus]);

  // Synchronize activeFestivalDetail with latest props
  const currentFestival = useMemo(() => {
    if (!activeFestivalDetail) return null;
    return festivals.find((f) => f.id === activeFestivalDetail.id) || activeFestivalDetail;
  }, [festivals, activeFestivalDetail]);

  const currentCollections = currentFestival?.collections || [];
  const currentExpenses = currentFestival?.expenses || [];

  const totalCollectionsAmount = currentCollections.reduce((sum, c) => sum + (c.amount || 0), 0);
  const totalApprovedExpensesAmount = currentExpenses
    .filter((e) => e.approval_status === "Approved")
    .reduce((sum, e) => sum + (e.amount || 0), 0);
  const netSurplusDeficit = totalCollectionsAmount - totalApprovedExpensesAmount;

  // Filtered & Sorted Collections
  const filteredCollections = useMemo(() => {
    return currentCollections
      .filter((c) => {
        if (collTowerFilter !== "All" && c.tower !== collTowerFilter) return false;
        if (collPaymentFilter !== "All" && c.payment_mode !== collPaymentFilter) return false;
        if (collSearch.trim()) {
          const s = collSearch.toLowerCase();
          const match =
            c.donor_name.toLowerCase().includes(s) ||
            c.flat_no.toLowerCase().includes(s) ||
            (c.transaction_ref && c.transaction_ref.toLowerCase().includes(s));
          if (!match) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (collSortField === "amount") {
          return collSortOrder === "asc" ? a.amount - b.amount : b.amount - a.amount;
        }
        if (collSortField === "donor") {
          return collSortOrder === "asc"
            ? a.donor_name.localeCompare(b.donor_name)
            : b.donor_name.localeCompare(a.donor_name);
        }
        return collSortOrder === "asc"
          ? new Date(a.collected_date).getTime() - new Date(b.collected_date).getTime()
          : new Date(b.collected_date).getTime() - new Date(a.collected_date).getTime();
      });
  }, [currentCollections, collTowerFilter, collPaymentFilter, collSearch, collSortField, collSortOrder]);

  // Filtered & Sorted Expenses
  const filteredExpenses = useMemo(() => {
    return currentExpenses
      .filter((e) => {
        if (expCategoryFilter !== "All" && e.category !== expCategoryFilter) return false;
        if (expStatusFilter !== "All" && e.approval_status !== expStatusFilter) return false;
        if (expSearch.trim()) {
          const s = expSearch.toLowerCase();
          const match =
            e.title.toLowerCase().includes(s) ||
            (e.vendor_name && e.vendor_name.toLowerCase().includes(s)) ||
            (e.approver_name && e.approver_name.toLowerCase().includes(s));
          if (!match) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (expSortField === "amount") {
          return expSortOrder === "asc" ? a.amount - b.amount : b.amount - a.amount;
        }
        if (expSortField === "title") {
          return expSortOrder === "asc"
            ? a.title.localeCompare(b.title)
            : b.title.localeCompare(a.title);
        }
        return expSortOrder === "asc"
          ? new Date(a.bill_date).getTime() - new Date(b.bill_date).getTime()
          : new Date(b.bill_date).getTime() - new Date(a.bill_date).getTime();
      });
  }, [currentExpenses, expCategoryFilter, expStatusFilter, expSearch, expSortField, expSortOrder]);

  // Handle Create Festival
  const handleCreateFestival = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.festival_name || !formData.start_date || !formData.lead_organizer) return;
    setIsSubmitting(true);
    try {
      await onAddFestival(formData);
      setIsAddModalOpen(false);
      setFormData({
        festival_name: "",
        start_date: "",
        end_date: "",
        location: "Clubhouse Central Mandapam",
        description: "",
        lead_organizer: "",
        estimated_budget: "₹ 2,50,000",
        collected_funds: "₹ 0",
        status: "Active",
        highlights: "Pooja & Aarti, Cultural Stage Performances, Maha-Prasadam Distribution, Kids Games",
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Update Festival
  const handleUpdateFestivalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFestival) return;
    setIsSubmitting(true);
    try {
      await onUpdateFestival(editingFestival.id, editingFestival);
      setEditingFestival(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Add Collection
  const handleAddCollectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentFestival || !collData.donor_name || collData.amount <= 0) return;
    try {
      await onAddCollection(currentFestival.id, collData);
      setCollData({
        tower: "Tower A",
        flat_no: "101",
        donor_name: "",
        amount: 1000,
        payment_mode: "UPI",
        transaction_ref: "",
        collected_date: new Date().toISOString().split("T")[0],
        receipt_url: "",
        notes: "",
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Update Collection
  const handleUpdateCollectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCollection) return;
    try {
      await onUpdateCollection(editingCollection.id, editingCollection);
      setEditingCollection(null);
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Add Expense
  const handleAddExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentFestival || !expData.title || expData.amount <= 0) return;
    try {
      await onAddExpense(currentFestival.id, expData);
      setExpData({
        title: "",
        category: "Decor",
        amount: 5000,
        vendor_name: "",
        bill_date: new Date().toISOString().split("T")[0],
        invoice_url: "",
        audit_evidence_notes: "",
        approver_name: "Vikram Patel",
        approver_role: "Treasurer",
        approval_status: "Approved",
        payment_mode: "UPI",
        transaction_ref: "",
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Update Expense
  const handleUpdateExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense) return;
    try {
      await onUpdateExpense(editingExpense.id, editingExpense);
      setEditingExpense(null);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.8)]" />
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">2. Festival Celebrations</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Ganesh Chaturthi, Diwali Deepotsav, Sankranti, collections, expenses, bill proofs &amp; complete audit trail.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Download Audit Report Button */}
          {!isGuest && (
            <button
              onClick={onOpenAuditReport}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-extrabold px-3.5 sm:px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-600/20 transition transform active:scale-95"
              title="Download Comprehensive Society Audit Statement"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Download Audit Report</span>
            </button>
          )}

          {/* Add Festival Button */}
          {canEdit && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs sm:text-sm font-extrabold px-4 py-2.5 rounded-xl shadow-lg shadow-amber-500/20 transition transform active:scale-95 hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4 text-slate-950" />
              <span>Add Festival</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl shadow-md flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search festivals, organizers, highlights..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 bg-slate-800/80 text-white placeholder-slate-400"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-xs font-semibold">Status:</span>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-800 text-white border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-bold focus:outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Planning">Planning</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Festival Cards Grid */}
      {filteredFestivals.length === 0 ? (
        <div className="bg-slate-900/60 rounded-2xl p-12 text-center border border-slate-800 shadow-md">
          <Sparkles className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-300">No festival celebrations found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Click &quot;Add Festival&quot; above to log an event with budget and expense approval workflows.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredFestivals.map((fest) => {
            const highlightsList = fest.highlights
              ? fest.highlights.split(",").map((h) => h.trim()).filter(Boolean)
              : [];
            const colList = fest.collections || [];
            const expList = fest.expenses || [];
            const totalCol = colList.reduce((s, c) => s + (c.amount || 0), 0);
            const totalExp = expList
              .filter((e) => e.approval_status === "Approved")
              .reduce((s, e) => s + (e.amount || 0), 0);

            return (
              <div
                key={fest.id}
                className="bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-900 rounded-2xl border border-amber-500/30 shadow-lg hover:border-amber-400/60 transition-all duration-200 overflow-hidden flex flex-col justify-between group"
              >
                <div className="p-6">
                  {/* Top Status & Edit / Delete Controls */}
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      <Flame className="w-3.5 h-3.5 text-amber-400" />
                      <span>{fest.status === "Active" ? "Ongoing Celebration" : fest.status}</span>
                    </div>

                    {canEdit && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingFestival(fest);
                          }}
                          title="Edit Festival"
                          className="text-slate-400 hover:text-amber-300 p-1.5 bg-slate-800/80 hover:bg-slate-800 rounded-lg border border-slate-700 transition"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Are you sure you want to delete "${fest.festival_name}"?`)) {
                              onDeleteFestival(fest.id);
                            }
                          }}
                          title="Delete Festival"
                          className="text-slate-400 hover:text-rose-400 p-1.5 bg-slate-800/80 hover:bg-slate-800 rounded-lg border border-slate-700 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Title & Description */}
                  <h3
                    onClick={() => {
                      if (isGuest) return;
                      setActiveFestivalDetail(fest);
                      setDetailActiveTab("overview");
                    }}
                    className={`text-lg sm:text-xl font-extrabold text-white leading-snug transition flex items-center justify-between ${
                      isGuest ? "cursor-default" : "cursor-pointer group-hover:text-amber-300"
                    }`}
                  >
                    <span>{fest.festival_name}</span>
                    {!isGuest && <ChevronRight className="w-5 h-5 text-amber-400 opacity-80 group-hover:translate-x-1 transition" />}
                  </h3>
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">{fest.description}</p>

                  {/* Date & Location Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-4 p-3.5 bg-slate-900/90 rounded-xl border border-slate-800 text-xs">
                    <div className="flex items-center gap-2 text-slate-300">
                      <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Duration</p>
                        <p className="font-bold text-white">
                          {fest.start_date} {fest.end_date && fest.end_date !== fest.start_date ? `to ${fest.end_date}` : ""}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-slate-300">
                      <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Mandapam / Venue</p>
                        <p className="font-bold text-white truncate">{fest.location}</p>
                      </div>
                    </div>
                  </div>

                  {/* Highlights Tags */}
                  {highlightsList.length > 0 && (
                    <div className="mt-4">
                      <p className="text-[11px] font-bold text-amber-300/90 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Tag className="w-3 h-3 text-amber-400" />
                        <span>Key Highlights</span>
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {highlightsList.map((tag, idx) => (
                          <span
                            key={idx}
                            className="text-[11px] font-semibold bg-amber-950/60 text-amber-200 border border-amber-700/60 px-2.5 py-0.5 rounded-lg"
                          >
                            ✦ {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Collections vs Expenses Mini Bar */}
                  {!isGuest && (
                    <div className="mt-4 p-3.5 bg-slate-950/80 rounded-xl border border-amber-800/40 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Resident Collections</span>
                        <p className="font-extrabold text-emerald-300 font-mono mt-0.5 text-sm">
                          ₹ {totalCol.toLocaleString("en-IN")}{" "}
                          <span className="text-slate-500 font-normal text-xs">({colList.length} donors)</span>
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-rose-400 font-bold uppercase tracking-wider">Approved Expenses</span>
                        <p className="font-extrabold text-rose-300 font-mono mt-0.5 text-sm">
                          ₹ {totalExp.toLocaleString("en-IN")}{" "}
                          <span className="text-slate-500 font-normal text-xs">({expList.length} bills)</span>
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Action Button */}
                <div className="p-4 bg-slate-950/60 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="text-xs text-slate-400">
                    Lead: <strong className="text-slate-200">{fest.lead_organizer}</strong>
                  </div>

                  {isGuest ? (
                    <span className="text-[11px] text-slate-500 italic">Sign in to view financials</span>
                  ) : (
                    <button
                      onClick={() => {
                        setActiveFestivalDetail(fest);
                        setDetailActiveTab("collections");
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-300 hover:text-slate-950 bg-amber-500/20 hover:bg-amber-400 px-3.5 py-1.5 rounded-xl border border-amber-400/40 transition shadow-sm"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      <span>View Financials &amp; Audit</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail & Financial Audit Tracker Modal */}
      {currentFestival && (
        <Modal
          isOpen={Boolean(currentFestival)}
          onClose={() => setActiveFestivalDetail(null)}
          title={`${currentFestival.festival_name} — Financial Audit & Tracker`}
          subtitle="Resident Collections, Verified Invoices, Audit Proofs & Approvals"
          maxWidth="2xl"
        >
          <div className="space-y-5">
            {/* Financial Overview Metrics Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-950 rounded-2xl border border-slate-800 text-center">
              <div className="p-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Collections</span>
                <p className="text-xl font-extrabold text-emerald-400 font-mono mt-1">
                  ₹ {totalCollectionsAmount.toLocaleString("en-IN")}
                </p>
                <span className="text-[10px] text-emerald-500/80">{currentCollections.length} Contributions</span>
              </div>

              <div className="p-2 border-y sm:border-y-0 sm:border-x border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Approved Expenses</span>
                <p className="text-xl font-extrabold text-rose-400 font-mono mt-1">
                  ₹ {totalApprovedExpensesAmount.toLocaleString("en-IN")}
                </p>
                <span className="text-[10px] text-rose-400/80">{currentExpenses.length} Vouchers</span>
              </div>

              <div className="p-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Net Surplus / Balance</span>
                <p className={`text-xl font-extrabold font-mono mt-1 ${netSurplusDeficit >= 0 ? "text-sky-400" : "text-amber-400"}`}>
                  ₹ {netSurplusDeficit.toLocaleString("en-IN")}
                </p>
                <span className={`text-[10px] font-bold ${netSurplusDeficit >= 0 ? "text-sky-400" : "text-amber-400"}`}>
                  {netSurplusDeficit >= 0 ? "Surplus in Escrow" : "Deficit (Pending Funding)"}
                </span>
              </div>
            </div>

            {/* Inner Tabs for Detail View */}
            <div className="flex space-x-2 border-b border-slate-800 pb-2">
              <button
                onClick={() => setDetailActiveTab("overview")}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition ${
                  detailActiveTab === "overview"
                    ? "bg-amber-500 text-slate-950"
                    : "text-slate-400 hover:text-white bg-slate-800"
                }`}
              >
                Event Details &amp; Plan
              </button>
              <button
                onClick={() => setDetailActiveTab("collections")}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
                  detailActiveTab === "collections"
                    ? "bg-emerald-500 text-slate-950"
                    : "text-slate-400 hover:text-white bg-slate-800"
                }`}
              >
                <Coins className="w-3.5 h-3.5" />
                <span>Collections Tracker ({currentCollections.length})</span>
              </button>
              <button
                onClick={() => setDetailActiveTab("expenses")}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
                  detailActiveTab === "expenses"
                    ? "bg-rose-500 text-white"
                    : "text-slate-400 hover:text-white bg-slate-800"
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Expense Audit &amp; Approver ({currentExpenses.length})</span>
              </button>
            </div>

            {/* TAB 1: OVERVIEW */}
            {detailActiveTab === "overview" && (
              <div className="space-y-4 text-xs">
                <div className="p-4 bg-slate-800/60 rounded-xl border border-slate-700">
                  <h4 className="font-bold text-white mb-1">Celebration Overview</h4>
                  <p className="text-slate-300 leading-relaxed">{currentFestival.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700">
                    <span className="text-slate-400 font-semibold">Lead Organizer</span>
                    <p className="text-white font-bold mt-0.5">{currentFestival.lead_organizer}</p>
                  </div>
                  <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700">
                    <span className="text-slate-400 font-semibold">Mandapam Location</span>
                    <p className="text-white font-bold mt-0.5">{currentFestival.location}</p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: COLLECTIONS TRACKER */}
            {detailActiveTab === "collections" && (
              <div className="space-y-4">
                {/* Add Collection Form (Admin / Super Admin Only) */}
                {canEdit ? (
                  <form
                    onSubmit={handleAddCollectionSubmit}
                    className="p-4 bg-slate-950 rounded-xl border border-emerald-900/50 space-y-3"
                  >
                    <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <Plus className="w-3.5 h-3.5" />
                      <span>Record Resident Contribution / Donation</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                      <div>
                        <DynamicSelect
                          label="Tower"
                          required
                          value={collData.tower}
                          onChange={(val) => setCollData({ ...collData, tower: val })}
                          options={defaultTowers}
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-400 mb-1">Flat No *</label>
                        <input
                          type="text"
                          required
                          value={collData.flat_no}
                          onChange={(e) => setCollData({ ...collData, flat_no: e.target.value })}
                          placeholder="e.g. G01, 101, 705, 1403 (Ground + 14 Floors)"
                          className="w-full text-xs p-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-semibold text-slate-400 mb-1">Donor Resident Name *</label>
                        <input
                          type="text"
                          required
                          value={collData.donor_name}
                          onChange={(e) => setCollData({ ...collData, donor_name: e.target.value })}
                          placeholder="e.g. S. Venkat Rao"
                          className="w-full text-xs p-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-400 mb-1">Amount (₹) *</label>
                        <input
                          type="number"
                          required
                          value={collData.amount}
                          onChange={(e) => setCollData({ ...collData, amount: parseFloat(e.target.value) || 0 })}
                          className="w-full text-xs p-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono"
                        />
                      </div>

                      <div>
                        <DynamicSelect
                          label="Payment Mode"
                          required
                          value={collData.payment_mode}
                          onChange={(val) => setCollData({ ...collData, payment_mode: val })}
                          options={defaultPaymentModes}
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-400 mb-1">Transaction Ref / Cheque No</label>
                        <input
                          type="text"
                          value={collData.transaction_ref}
                          onChange={(e) => setCollData({ ...collData, transaction_ref: e.target.value })}
                          placeholder="UPI-Ref / Cheque #"
                          className="w-full text-xs p-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                        />
                      </div>
                    </div>

                    {/* Receipt Upload */}
                    <FileUploadInput
                      label="Attach Receipt / Contribution Proof (Optional)"
                      value={collData.receipt_url}
                      onChange={(dataUrl) => setCollData({ ...collData, receipt_url: dataUrl })}
                    />

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition shadow-md"
                    >
                      + Record Collection in Live Database
                    </button>
                  </form>
                ) : (
                  <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
                    <span>Resident View Only Mode: Verified donor records and receipts are listed below.</span>
                  </div>
                )}

                {/* Collections Table Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-slate-900 rounded-xl border border-slate-800 text-xs">
                  <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                    <Search className="w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={collSearch}
                      onChange={(e) => setCollSearch(e.target.value)}
                      placeholder="Search donor or flat..."
                      className="bg-transparent text-xs text-white focus:outline-none w-full"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={collTowerFilter}
                      onChange={(e) => setCollTowerFilter(e.target.value)}
                      className="bg-slate-800 text-slate-200 px-2 py-1 rounded text-xs border border-slate-700"
                    >
                      <option value="All">All Towers</option>
                      {defaultTowers.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>

                    <select
                      value={collPaymentFilter}
                      onChange={(e) => setCollPaymentFilter(e.target.value)}
                      className="bg-slate-800 text-slate-200 px-2 py-1 rounded text-xs border border-slate-700"
                    >
                      <option value="All">All Modes</option>
                      {defaultPaymentModes.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Collections Table */}
                <div className="overflow-x-auto max-h-60 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-800 text-slate-400 uppercase font-bold sticky top-0">
                      <tr>
                        <th className="p-2.5">Tower &amp; Flat</th>
                        <th className="p-2.5">Donor</th>
                        <th
                          onClick={() => {
                            setCollSortField("amount");
                            setCollSortOrder(collSortOrder === "asc" ? "desc" : "asc");
                          }}
                          className="p-2.5 cursor-pointer hover:text-white"
                        >
                          <div className="flex items-center gap-1">
                            Amount <ArrowUpDown className="w-3 h-3" />
                          </div>
                        </th>
                        <th className="p-2.5">Mode &amp; Ref</th>
                        <th
                          onClick={() => {
                            setCollSortField("date");
                            setCollSortOrder(collSortOrder === "asc" ? "desc" : "asc");
                          }}
                          className="p-2.5 cursor-pointer hover:text-white"
                        >
                          <div className="flex items-center gap-1">
                            Date <ArrowUpDown className="w-3 h-3" />
                          </div>
                        </th>
                        <th className="p-2.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      {filteredCollections.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-4 text-center text-slate-500 italic">
                            No collections match filter criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredCollections.map((col) => (
                          <tr key={col.id} className="hover:bg-slate-800/40">
                            <td className="p-2.5 font-bold text-white">
                              {col.tower} - {col.flat_no}
                            </td>
                            <td className="p-2.5">{col.donor_name}</td>
                            <td className="p-2.5 font-mono font-bold text-emerald-400">
                              ₹ {col.amount.toLocaleString("en-IN")}
                            </td>
                            <td className="p-2.5 font-mono text-[11px] text-slate-400">
                              <span className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-300 mr-1">
                                {col.payment_mode}
                              </span>
                              {col.transaction_ref && <span>{col.transaction_ref}</span>}
                            </td>
                            <td className="p-2.5 text-slate-400">{col.collected_date}</td>
                            <td className="p-2.5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {col.receipt_url && (
                                  <button
                                    onClick={() =>
                                      setPreviewDoc({
                                        url: col.receipt_url!,
                                        title: `Collection Receipt: ${col.donor_name} (Flat ${col.flat_no})`,
                                      })
                                    }
                                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/80 text-emerald-300 rounded-lg text-xs font-bold transition shadow-xs"
                                    title="View Attached Receipt / Proof"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>View Receipt</span>
                                  </button>
                                )}

                                {canEdit && (
                                  <>
                                    <button
                                      onClick={() => setEditingCollection(col)}
                                      className="text-slate-400 hover:text-amber-300 p-1"
                                      title="Edit Collection"
                                    >
                                      <Edit className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (confirm(`Delete collection entry for ${col.donor_name}?`)) {
                                          onDeleteCollection(col.id);
                                        }
                                      }}
                                      className="text-slate-400 hover:text-rose-400 p-1"
                                      title="Delete Collection"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 3: EXPENSES & AUDIT APPROVER TRACKER */}
            {detailActiveTab === "expenses" && (
              <div className="space-y-4">
                {/* Add Expense Form (Admin / Super Admin Only) */}
                {canEdit ? (
                  <form
                    onSubmit={handleAddExpenseSubmit}
                    className="p-4 bg-slate-950 rounded-xl border border-rose-900/50 space-y-3"
                  >
                    <h4 className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Expense Voucher for Treasurer / MC Audit Approval</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-semibold text-slate-400 mb-1">Expense Title / Item *</label>
                        <input
                          type="text"
                          required
                          value={expData.title}
                          onChange={(e) => setExpData({ ...expData, title: e.target.value })}
                          placeholder="e.g. Mandapam Sound System & Mic Rental"
                          className="w-full text-xs p-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                        />
                      </div>

                      <div>
                        <DynamicSelect
                          label="Category"
                          required
                          value={expData.category}
                          onChange={(val) => setExpData({ ...expData, category: val })}
                          options={defaultExpenseCategories}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-400 mb-1">Amount (₹) *</label>
                        <input
                          type="number"
                          required
                          value={expData.amount}
                          onChange={(e) => setExpData({ ...expData, amount: parseFloat(e.target.value) || 0 })}
                          className="w-full text-xs p-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-400 mb-1">Vendor / Contractor</label>
                        <input
                          type="text"
                          value={expData.vendor_name}
                          onChange={(e) => setExpData({ ...expData, vendor_name: e.target.value })}
                          placeholder="e.g. Sri Balaji Lights"
                          className="w-full text-xs p-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                        />
                      </div>

                      <div>
                        <DynamicSelect
                          label="Payment Mode"
                          value={expData.payment_mode || "UPI"}
                          onChange={(val) => setExpData({ ...expData, payment_mode: val })}
                          options={defaultPaymentModes}
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-400 mb-1">Bill Date</label>
                        <input
                          type="date"
                          value={expData.bill_date}
                          onChange={(e) => setExpData({ ...expData, bill_date: e.target.value })}
                          className="w-full text-xs p-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                        />
                      </div>
                    </div>

                    {/* Invoice / Bill Upload */}
                    <FileUploadInput
                      label="Attach Invoice / Bill Proof (Audit Evidence)"
                      value={expData.invoice_url}
                      onChange={(dataUrl) => setExpData({ ...expData, invoice_url: dataUrl })}
                    />

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <DynamicSelect
                          label="Designated Approver"
                          value={expData.approver_name}
                          onChange={(val) => setExpData({ ...expData, approver_name: val })}
                          options={teamMemberNames.length ? teamMemberNames : ["Vikram Patel", "Rajesh Sharma", "Ananya Roy"]}
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-400 mb-1">Audit Verification Notes</label>
                        <input
                          type="text"
                          value={expData.audit_evidence_notes}
                          onChange={(e) => setExpData({ ...expData, audit_evidence_notes: e.target.value })}
                          placeholder="GST Verified & Goods Inspected"
                          className="w-full text-xs p-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition shadow-md"
                    >
                      + Submit Expense Bill for Audit in Database
                    </button>
                  </form>
                ) : (
                  <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs text-slate-400">
                    <span>Resident View Only Mode: Audited expense bills and invoice proofs are listed below.</span>
                  </div>
                )}

                {/* Expenses Table Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-slate-900 rounded-xl border border-slate-800 text-xs">
                  <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                    <Search className="w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={expSearch}
                      onChange={(e) => setExpSearch(e.target.value)}
                      placeholder="Search bill item or vendor..."
                      className="bg-transparent text-xs text-white focus:outline-none w-full"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={expCategoryFilter}
                      onChange={(e) => setExpCategoryFilter(e.target.value)}
                      className="bg-slate-800 text-slate-200 px-2 py-1 rounded text-xs border border-slate-700"
                    >
                      <option value="All">All Categories</option>
                      {defaultExpenseCategories.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>

                    <select
                      value={expStatusFilter}
                      onChange={(e) => setExpStatusFilter(e.target.value)}
                      className="bg-slate-800 text-slate-200 px-2 py-1 rounded text-xs border border-slate-700"
                    >
                      <option value="All">All Statuses</option>
                      <option value="Approved">Approved</option>
                      <option value="Pending">Pending</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                </div>

                {/* Expenses List */}
                <div className="space-y-2.5 max-h-64 overflow-y-auto">
                  {filteredExpenses.length === 0 ? (
                    <p className="text-center text-slate-500 py-4 text-xs italic">No expense vouchers match filters.</p>
                  ) : (
                    filteredExpenses.map((exp) => (
                      <div
                        key={exp.id}
                        className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white">{exp.title}</span>
                            <span className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded font-semibold">
                              {exp.category}
                            </span>
                            <span
                              className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
                                exp.approval_status === "Approved"
                                  ? "bg-emerald-950 text-emerald-300 border border-emerald-700"
                                  : exp.approval_status === "Rejected"
                                  ? "bg-rose-950 text-rose-300 border border-rose-700"
                                  : "bg-amber-950 text-amber-300 border border-amber-700"
                              }`}
                            >
                              {exp.approval_status}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 mt-1 text-[11px] text-slate-400">
                            <span>
                              Vendor: <strong className="text-slate-300">{exp.vendor_name || "Direct Purchase"}</strong>
                            </span>
                            <span>•</span>
                            <span>
                              Mode: <strong className="text-slate-300">{exp.payment_mode || "UPI"}</strong>
                            </span>
                            <span>•</span>
                            <span>
                              Approver:{" "}
                              <strong className="text-slate-300">
                                {exp.approver_name} ({exp.approver_role || "Treasurer"})
                              </strong>
                            </span>
                            {exp.invoice_url && (
                              <>
                                <span>•</span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPreviewDoc({
                                      url: exp.invoice_url!,
                                      title: `Expense Invoice: ${exp.title} (₹${exp.amount.toLocaleString("en-IN")})`,
                                    })
                                  }
                                  className="inline-flex items-center gap-1 text-sky-400 hover:text-sky-300 font-bold hover:underline"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>View Bill / Proof</span>
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 self-end sm:self-center">
                          {exp.invoice_url && (
                            <button
                              type="button"
                              onClick={() =>
                                setPreviewDoc({
                                  url: exp.invoice_url!,
                                  title: `Expense Invoice: ${exp.title} (₹${exp.amount.toLocaleString("en-IN")})`,
                                })
                              }
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-sky-950/80 hover:bg-sky-900 border border-sky-600/80 text-sky-300 rounded-lg text-xs font-bold transition shadow-xs"
                              title="View Attached Invoice / Bill"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View Bill</span>
                            </button>
                          )}

                          <span className="font-mono font-bold text-rose-400 text-sm">
                            ₹ {exp.amount.toLocaleString("en-IN")}
                          </span>

                          {/* Approval Controls (Admin / Super Admin Only) */}
                          {canEdit && exp.approval_status !== "Approved" && (
                            <button
                              onClick={() => onUpdateExpenseStatus(exp.id, "Approved", "Vikram Patel (Treasurer)")}
                              className="text-[10px] font-bold bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700 px-2 py-1 rounded"
                            >
                              Approve
                            </button>
                          )}

                          {canEdit && (
                            <>
                              <button
                                onClick={() => setEditingExpense(exp)}
                                className="text-slate-400 hover:text-amber-300 p-1"
                                title="Edit Expense"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => {
                                  if (confirm(`Delete expense bill "${exp.title}"?`)) {
                                    onDeleteExpense(exp.id);
                                  }
                                }}
                                className="text-slate-400 hover:text-rose-400 p-1"
                                title="Delete Expense"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Add Festival Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Create New Festival Celebration"
        subtitle="Schedule a community festival, budget, and celebration plan"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateFestival} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Festival Name *</label>
            <input
              type="text"
              required
              value={formData.festival_name}
              onChange={(e) => setFormData({ ...formData, festival_name: e.target.value })}
              placeholder="e.g., Ganesh Chaturthi 5-Day Grand Fest 2026"
              className="w-full text-xs p-2.5 border rounded-xl bg-slate-800 border-slate-700 text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Start Date *</label>
              <input
                type="date"
                required
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full text-xs p-2.5 border rounded-xl bg-slate-800 border-slate-700 text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">End Date</label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="w-full text-xs p-2.5 border rounded-xl bg-slate-800 border-slate-700 text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <DynamicSelect
                label="Mandapam Location"
                required
                value={formData.location}
                onChange={(val) => setFormData({ ...formData, location: val })}
                options={["Clubhouse Central Mandapam", "Main Boulevard", "Amphitheatre", "Sports Arena"]}
              />
            </div>
            <div>
              <DynamicSelect
                label="Status"
                required
                value={formData.status}
                onChange={(val) => setFormData({ ...formData, status: val })}
                options={["Active", "Planning", "Completed"]}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Outline daily pooja schedule, cultural nights, laddu auction..."
              className="w-full text-xs p-2.5 border rounded-xl bg-slate-800 border-slate-700 text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Highlights (comma separated)</label>
            <input
              type="text"
              value={formData.highlights}
              onChange={(e) => setFormData({ ...formData, highlights: e.target.value })}
              placeholder="e.g., Maha Laddu Auction, Cultural stage, Food stalls, Dhol-Tasha Visarjan"
              className="w-full text-xs p-2.5 border rounded-xl bg-slate-800 border-slate-700 text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Lead Organizer *</label>
              <input
                type="text"
                required
                value={formData.lead_organizer}
                onChange={(e) => setFormData({ ...formData, lead_organizer: e.target.value })}
                placeholder="e.g., Sanjay Rao"
                className="w-full text-xs p-2.5 border rounded-xl bg-slate-800 border-slate-700 text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Estimated Budget</label>
              <input
                type="text"
                value={formData.estimated_budget}
                onChange={(e) => setFormData({ ...formData, estimated_budget: e.target.value })}
                placeholder="e.g., ₹ 3,50,000"
                className="w-full text-xs p-2.5 border rounded-xl bg-slate-800 border-slate-700 text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl shadow-md transition disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Save Festival"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Festival Modal */}
      {editingFestival && (
        <Modal
          isOpen={Boolean(editingFestival)}
          onClose={() => setEditingFestival(null)}
          title="Edit Festival Celebration"
          subtitle="Update festival details, schedule, or organizers"
          maxWidth="lg"
        >
          <form onSubmit={handleUpdateFestivalSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Festival Name *</label>
              <input
                type="text"
                required
                value={editingFestival.festival_name}
                onChange={(e) =>
                  setEditingFestival({ ...editingFestival, festival_name: e.target.value })
                }
                className="w-full text-xs p-2.5 border rounded-xl bg-slate-800 border-slate-700 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Start Date *</label>
                <input
                  type="date"
                  required
                  value={editingFestival.start_date}
                  onChange={(e) => setEditingFestival({ ...editingFestival, start_date: e.target.value })}
                  className="w-full text-xs p-2.5 border rounded-xl bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">End Date</label>
                <input
                  type="date"
                  value={editingFestival.end_date}
                  onChange={(e) => setEditingFestival({ ...editingFestival, end_date: e.target.value })}
                  className="w-full text-xs p-2.5 border rounded-xl bg-slate-800 border-slate-700 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <DynamicSelect
                  label="Location"
                  value={editingFestival.location}
                  onChange={(val) => setEditingFestival({ ...editingFestival, location: val })}
                  options={["Clubhouse Central Mandapam", "Main Boulevard", "Amphitheatre", "Sports Arena"]}
                />
              </div>
              <div>
                <DynamicSelect
                  label="Status"
                  value={editingFestival.status}
                  onChange={(val) => setEditingFestival({ ...editingFestival, status: val })}
                  options={["Active", "Planning", "Completed"]}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
              <textarea
                rows={3}
                value={editingFestival.description || ""}
                onChange={(e) => setEditingFestival({ ...editingFestival, description: e.target.value })}
                className="w-full text-xs p-2.5 border rounded-xl bg-slate-800 border-slate-700 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Lead Organizer</label>
                <input
                  type="text"
                  value={editingFestival.lead_organizer}
                  onChange={(e) =>
                    setEditingFestival({ ...editingFestival, lead_organizer: e.target.value })
                  }
                  className="w-full text-xs p-2.5 border rounded-xl bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Estimated Budget</label>
                <input
                  type="text"
                  value={editingFestival.estimated_budget || ""}
                  onChange={(e) =>
                    setEditingFestival({ ...editingFestival, estimated_budget: e.target.value })
                  }
                  className="w-full text-xs p-2.5 border rounded-xl bg-slate-800 border-slate-700 text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingFestival(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl shadow-md transition"
              >
                {isSubmitting ? "Updating..." : "Save Changes"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Collection Modal */}
      {editingCollection && (
        <Modal
          isOpen={Boolean(editingCollection)}
          onClose={() => setEditingCollection(null)}
          title="Edit Resident Collection"
          subtitle="Modify contribution amount, donor details, or payment mode"
          maxWidth="md"
        >
          <form onSubmit={handleUpdateCollectionSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <DynamicSelect
                  label="Tower"
                  value={editingCollection.tower}
                  onChange={(val) => setEditingCollection({ ...editingCollection, tower: val })}
                  options={defaultTowers}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Flat No</label>
                <input
                  type="text"
                  value={editingCollection.flat_no}
                  onChange={(e) => setEditingCollection({ ...editingCollection, flat_no: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Donor Name</label>
              <input
                type="text"
                value={editingCollection.donor_name}
                onChange={(e) => setEditingCollection({ ...editingCollection, donor_name: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Amount (₹)</label>
                <input
                  type="number"
                  value={editingCollection.amount}
                  onChange={(e) =>
                    setEditingCollection({ ...editingCollection, amount: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full text-xs p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono"
                />
              </div>
              <div>
                <DynamicSelect
                  label="Payment Mode"
                  value={editingCollection.payment_mode}
                  onChange={(val) => setEditingCollection({ ...editingCollection, payment_mode: val })}
                  options={defaultPaymentModes}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Transaction Ref</label>
              <input
                type="text"
                value={editingCollection.transaction_ref || ""}
                onChange={(e) =>
                  setEditingCollection({ ...editingCollection, transaction_ref: e.target.value })
                }
                className="w-full text-xs p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
              />
            </div>

            {/* Receipt Upload in Edit */}
            <FileUploadInput
              label="Receipt / Proof Document"
              value={editingCollection.receipt_url}
              onChange={(dataUrl) => setEditingCollection({ ...editingCollection, receipt_url: dataUrl })}
            />

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingCollection(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl"
              >
                Save Collection Updates
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Expense Modal */}
      {editingExpense && (
        <Modal
          isOpen={Boolean(editingExpense)}
          onClose={() => setEditingExpense(null)}
          title="Edit Expense Voucher"
          subtitle="Update bill item, amount, category, or approver"
          maxWidth="md"
        >
          <form onSubmit={handleUpdateExpenseSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Expense Title</label>
              <input
                type="text"
                value={editingExpense.title}
                onChange={(e) => setEditingExpense({ ...editingExpense, title: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <DynamicSelect
                  label="Category"
                  value={editingExpense.category}
                  onChange={(val) => setEditingExpense({ ...editingExpense, category: val })}
                  options={defaultExpenseCategories}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Amount (₹)</label>
                <input
                  type="number"
                  value={editingExpense.amount}
                  onChange={(e) =>
                    setEditingExpense({ ...editingExpense, amount: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full text-xs p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Vendor Name</label>
                <input
                  type="text"
                  value={editingExpense.vendor_name || ""}
                  onChange={(e) => setEditingExpense({ ...editingExpense, vendor_name: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
                />
              </div>
              <div>
                <DynamicSelect
                  label="Payment Mode"
                  value={editingExpense.payment_mode || "UPI"}
                  onChange={(val) => setEditingExpense({ ...editingExpense, payment_mode: val })}
                  options={defaultPaymentModes}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Approval Status</label>
                <select
                  value={editingExpense.approval_status}
                  onChange={(e) =>
                    setEditingExpense({ ...editingExpense, approval_status: e.target.value })
                  }
                  className="w-full text-xs p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
                >
                  <option value="Approved">Approved</option>
                  <option value="Pending">Pending</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
              <div>
                <DynamicSelect
                  label="Designated Approver"
                  value={editingExpense.approver_name}
                  onChange={(val) => setEditingExpense({ ...editingExpense, approver_name: val })}
                  options={teamMemberNames.length ? teamMemberNames : ["Vikram Patel", "Rajesh Sharma", "Ananya Roy"]}
                />
              </div>
            </div>

            {/* Bill Upload in Edit */}
            <FileUploadInput
              label="Attached Invoice / Bill (Audit Evidence)"
              value={editingExpense.invoice_url}
              onChange={(dataUrl) => setEditingExpense({ ...editingExpense, invoice_url: dataUrl })}
            />

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingExpense(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl"
              >
                Save Expense Updates
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Reusable Document & Receipt Preview Modal */}
      <DocumentPreviewModal
        isOpen={Boolean(previewDoc)}
        onClose={() => setPreviewDoc(null)}
        url={previewDoc?.url}
        title={previewDoc?.title}
      />
    </div>
  );
}
