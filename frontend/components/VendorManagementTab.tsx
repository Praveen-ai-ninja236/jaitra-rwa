"use client";

import React, { useState, useMemo } from "react";
import { VendorContract, VendorContractCreate, UserRole, DropdownCategoryMap } from "../lib/types";
import {
  Briefcase,
  Zap,
  Building,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Search,
  Plus,
  Filter,
  Phone,
  Mail,
  User,
  Calendar,
  FileText,
  Paperclip,
  ExternalLink,
  Edit,
  Trash2,
  Star,
  Award,
  DollarSign,
  Layers,
  ChevronRight,
  Eye,
  Check,
  Wrench,
  Flame,
  LayoutGrid,
  List,
  ArrowUpDown,
} from "lucide-react";
import Modal from "./Modal";
import DynamicSelect from "./DynamicSelect";
import FileUploadInput from "./FileUploadInput";
import DocumentPreviewModal from "./DocumentPreviewModal";

interface VendorManagementTabProps {
  vendors: VendorContract[];
  onAddVendor: (vendor: VendorContractCreate) => Promise<void>;
  onUpdateVendor: (id: number, vendor: Partial<VendorContractCreate>) => Promise<void>;
  onDeleteVendor: (id: number) => Promise<void>;
  isLoading: boolean;
  userRole?: UserRole;
  dropdownMap?: DropdownCategoryMap;
}

export default function VendorManagementTab({
  vendors,
  onAddVendor,
  onUpdateVendor,
  onDeleteVendor,
  isLoading,
  userRole = "Super Admin",
  dropdownMap = {},
}: VendorManagementTabProps) {
  const canEdit = userRole === "Super Admin" || userRole === "Admin";
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedFunctionalStatus, setSelectedFunctionalStatus] = useState("All");
  const [selectedVerificationStatus, setSelectedVerificationStatus] = useState("All");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<VendorContract | null>(null);
  const [activeVendorDetail, setActiveVendorDetail] = useState<VendorContract | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<{ url: string; title: string } | null>(null);

  // Sorting
  const [sortField, setSortField] = useState<"vendor_name" | "category" | "end_date" | "rating">("vendor_name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Form State
  const [formData, setFormData] = useState<VendorContractCreate>({
    vendor_name: "",
    category: "Amenities & EV Charging",
    service_type: "Lease & Bidding Winner",
    contact_person: "",
    contact_phone: "",
    contact_email: "",
    contract_start_date: new Date().toISOString().split("T")[0],
    contract_end_date: "",
    contract_value: "₹ 1,50,000 / year",
    functional_status: "Operational",
    verification_status: "Verified & Compliant",
    rating: 4.8,
    feedback_summary: "",
    scope_of_work: "",
    contract_doc_url: "",
    certificate_url: "",
    bidding_notes: "",
  });

  const defaultCategories = dropdownMap["ado_categories"]?.length ? dropdownMap["ado_categories"] : ["Amenities & EV Charging", "Lifts & Elevators AMC", "STP & WTP Operations", "Security & Surveillance", "Fire Safety & Compliance", "Solar & Power Infrastructure", "Housekeeping & Facility", "Plumbing & Civil Works", "Gym & Fitness Equipment", "Landscaping & Horticulture"];

  const defaultFunctionalStatuses = ["Operational", "Under Maintenance", "Degraded", "Pending Parts"];
  const defaultVerificationStatuses = ["Verified & Compliant", "Pending Inspection", "Non-Compliant"];

  const filteredVendors = useMemo(() => {
    return vendors
      .filter((v) => {
        const matchSearch =
          v.vendor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          v.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
          v.service_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (v.contact_person && v.contact_person.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (v.bidding_notes && v.bidding_notes.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchCat = selectedCategory === "All" || v.category.toLowerCase().includes(selectedCategory.toLowerCase());
        const matchFunc = selectedFunctionalStatus === "All" || v.functional_status === selectedFunctionalStatus;
        const matchVer = selectedVerificationStatus === "All" || v.verification_status === selectedVerificationStatus;

        return matchSearch && matchCat && matchFunc && matchVer;
      })
      .sort((a, b) => {
        if (sortField === "rating") {
          return sortOrder === "asc" ? (a.rating || 0) - (b.rating || 0) : (b.rating || 0) - (a.rating || 0);
        }
        if (sortField === "end_date") {
          const dA = a.contract_end_date ? new Date(a.contract_end_date).getTime() : 0;
          const dB = b.contract_end_date ? new Date(b.contract_end_date).getTime() : 0;
          return sortOrder === "asc" ? dA - dB : dB - dA;
        }
        let valA = a[sortField] || "";
        let valB = b[sortField] || "";
        return sortOrder === "asc"
          ? String(valA).localeCompare(String(valB))
          : String(valB).localeCompare(String(valA));
      });
  }, [vendors, searchTerm, selectedCategory, selectedFunctionalStatus, selectedVerificationStatus, sortField, sortOrder]);

  const currentDetailVendor = useMemo(() => {
    if (!activeVendorDetail) return null;
    return vendors.find((v) => v.id === activeVendorDetail.id) || activeVendorDetail;
  }, [vendors, activeVendorDetail]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vendor_name || !formData.category) return;
    setIsSubmitting(true);
    try {
      await onAddVendor(formData);
      setIsAddModalOpen(false);
      setFormData({
        vendor_name: "",
        category: "Amenities & EV Charging",
        service_type: "Lease & Bidding Winner",
        contact_person: "",
        contact_phone: "",
        contact_email: "",
        contract_start_date: new Date().toISOString().split("T")[0],
        contract_end_date: "",
        contract_value: "₹ 1,50,000 / year",
        functional_status: "Operational",
        verification_status: "Verified & Compliant",
        rating: 4.8,
        feedback_summary: "",
        scope_of_work: "",
        contract_doc_url: "",
        certificate_url: "",
        bidding_notes: "",
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVendor) return;
    setIsSubmitting(true);
    try {
      await onUpdateVendor(editingVendor.id, editingVendor);
      setEditingVendor(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    if (category.includes("EV") || category.includes("Charging")) return Zap;
    if (category.includes("Lift")) return Building;
    if (category.includes("STP") || category.includes("Water")) return Wrench;
    if (category.includes("Security")) return ShieldCheck;
    if (category.includes("Fire")) return Flame;
    if (category.includes("Solar")) return Zap;
    return Briefcase;
  };

  return (
    <div className="space-y-6">
      {/* Header & Overview */}
      <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-3 h-3 rounded-full bg-teal-500 shadow-[0_0_10px_rgba(20,184,166,0.8)]" />
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              7. Vendor &amp; Society Contract Management
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Amenities bidding winners (EV charging), AMC contracts (Lifts, STP, Fire Safety, Solar), security agencies, and vendor compliance records.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* View Switcher */}
          <div className="inline-flex bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode("cards")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                viewMode === "cards"
                  ? "bg-slate-800 text-white shadow-md border border-slate-700"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Cards</span>
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                viewMode === "table"
                  ? "bg-slate-800 text-white shadow-md border border-slate-700"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
          </div>

          {canEdit && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-teal-500/20 transition transform active:scale-95 hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4" />
              <span>Add Vendor / Contract</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/90 border border-teal-800/40 rounded-2xl p-4 shadow-md">
          <span className="text-[10px] font-bold text-teal-400 uppercase tracking-wider">Total Contracts</span>
          <p className="text-xl sm:text-2xl font-extrabold text-white mt-1 font-mono">{vendors.length}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Active Amenities &amp; AMCs</p>
        </div>

        <div className="bg-slate-900/90 border border-emerald-800/40 rounded-2xl p-4 shadow-md">
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Operational Status</span>
          <p className="text-xl sm:text-2xl font-extrabold text-emerald-300 mt-1 font-mono">
            {vendors.filter((v) => v.functional_status === "Operational").length} / {vendors.length}
          </p>
          <p className="text-[11px] text-emerald-400/80 mt-0.5">100% SLA uptime</p>
        </div>

        <div className="bg-slate-900/90 border border-sky-800/40 rounded-2xl p-4 shadow-md">
          <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider">Verified Vendors</span>
          <p className="text-xl sm:text-2xl font-extrabold text-sky-300 mt-1 font-mono">
            {vendors.filter((v) => v.verification_status.includes("Verified")).length}
          </p>
          <p className="text-[11px] text-sky-400/80 mt-0.5">Statutory &amp; Insurance valid</p>
        </div>

        <div className="bg-slate-900/90 border border-amber-800/40 rounded-2xl p-4 shadow-md">
          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Bidding Concessions</span>
          <p className="text-xl sm:text-2xl font-extrabold text-amber-300 mt-1 font-mono">
            {vendors.filter((v) => v.category.includes("EV") || v.service_type.includes("Bidding")).length}
          </p>
          <p className="text-[11px] text-amber-400/80 mt-0.5">EV Charging &amp; Commercial</p>
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
            placeholder="Search vendor name, EV charging, lifts, STP, contact..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 bg-slate-800/80 text-white placeholder-slate-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Category */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-800 text-white border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-bold focus:outline-none"
          >
            <option value="All">All Categories</option>
            {defaultCategories.map((c) => (
              <option key={c} value={c} className="bg-slate-900 text-white">
                {c}
              </option>
            ))}
          </select>

          {/* Functional Status */}
          <select
            value={selectedFunctionalStatus}
            onChange={(e) => setSelectedFunctionalStatus(e.target.value)}
            className="bg-slate-800 text-white border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-bold focus:outline-none"
          >
            <option value="All">All Operational States</option>
            {defaultFunctionalStatuses.map((s) => (
              <option key={s} value={s} className="bg-slate-900 text-white">
                {s}
              </option>
            ))}
          </select>

          {/* Verification Status */}
          <select
            value={selectedVerificationStatus}
            onChange={(e) => setSelectedVerificationStatus(e.target.value)}
            className="bg-slate-800 text-white border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-bold focus:outline-none"
          >
            <option value="All">All Verifications</option>
            {defaultVerificationStatuses.map((v) => (
              <option key={v} value={v} className="bg-slate-900 text-white">
                {v}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* VIEW 1: MULTI-CARDS GRID */}
      {viewMode === "cards" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredVendors.length === 0 ? (
            <div className="col-span-full bg-slate-900/60 rounded-2xl p-12 text-center border border-slate-800 shadow-md">
              <Briefcase className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-300">No vendor contracts found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No vendors match your search and filter criteria.
              </p>
            </div>
          ) : (
            filteredVendors.map((vendor) => {
              const Icon = getCategoryIcon(vendor.category);

              return (
                <div
                  key={vendor.id}
                  onClick={() => setActiveVendorDetail(vendor)}
                  className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 hover:border-teal-500/50 shadow-lg hover:shadow-2xl transition-all duration-200 cursor-pointer flex flex-col justify-between group"
                >
                  <div>
                    {/* Top Badges */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="px-2.5 py-0.5 text-[10px] font-extrabold rounded-full bg-teal-950/80 text-teal-300 border border-teal-700/60 truncate">
                        {vendor.category}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            vendor.functional_status === "Operational"
                              ? "bg-emerald-950 text-emerald-300 border-emerald-700/60"
                              : "bg-amber-950 text-amber-300 border-amber-700/60"
                          }`}
                        >
                          {vendor.functional_status}
                        </span>

                        {canEdit && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1 ml-1"
                          >
                            <button
                              onClick={() => setEditingVendor(vendor)}
                              className="p-1 text-slate-400 hover:text-amber-300"
                              title="Edit Vendor"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Delete vendor contract for "${vendor.vendor_name}"?`)) {
                                  onDeleteVendor(vendor.id);
                                }
                              }}
                              className="p-1 text-slate-400 hover:text-rose-400"
                              title="Delete Vendor"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Vendor Name & Service Type */}
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-teal-400 shrink-0 shadow-md">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm sm:text-base font-extrabold text-white leading-tight group-hover:text-teal-300 transition truncate">
                          {vendor.vendor_name}
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{vendor.service_type}</p>
                      </div>
                    </div>

                    {/* Contract Value & Period */}
                    <div className="mt-4 p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-slate-400 font-semibold">Contract Value:</span>
                        <span className="font-mono font-bold text-emerald-400 text-xs truncate">
                          {vendor.contract_value || "—"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 font-semibold">Valid Till:</span>
                        <span className="font-mono text-slate-200">{vendor.contract_end_date || "Ongoing"}</span>
                      </div>
                    </div>

                    {/* Rating & Verification */}
                    <div className="mt-3 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1 text-amber-400 font-bold text-xs">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{vendor.rating || 4.5}</span>
                        <span className="text-[10px] text-slate-400 font-normal">/ 5.0</span>
                      </div>

                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{vendor.verification_status}</span>
                      </span>
                    </div>
                  </div>

                  {/* Card Footer: Contact POC & Document View */}
                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                    <div className="flex items-center gap-2 truncate">
                      <span className="truncate">
                        POC: <strong className="text-slate-200">{vendor.contact_person || "Contact Desk"}</strong>
                      </span>
                      {vendor.contract_doc_url && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewDoc({
                              url: vendor.contract_doc_url!,
                              title: `Contract Agreement: ${vendor.vendor_name}`,
                            });
                          }}
                          className="inline-flex items-center gap-1 text-[10px] font-black text-teal-300 hover:text-white bg-teal-950/80 hover:bg-teal-900 border border-teal-700/80 px-2 py-0.5 rounded-lg transition"
                          title="View Attached Contract Agreement"
                        >
                          <Eye className="w-3 h-3 text-teal-400" />
                          <span>View SLA</span>
                        </button>
                      )}
                    </div>
                    <span className="text-teal-400 font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition shrink-0">
                      View Details <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* VIEW 2: TABLE VIEW */}
      {viewMode === "table" && (
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800 text-slate-400 uppercase font-bold text-[11px]">
                <tr>
                  <th
                    onClick={() => {
                      setSortField("vendor_name");
                      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                    }}
                    className="p-3 cursor-pointer hover:text-white"
                  >
                    <div className="flex items-center gap-1">
                      Vendor / Company <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="p-3">Category &amp; Scope</th>
                  <th className="p-3">Contract Value</th>
                  <th className="p-3">Contact Person &amp; Phone</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Rating</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {filteredVendors.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500 italic">
                      No vendor contracts found.
                    </td>
                  </tr>
                ) : (
                  filteredVendors.map((vendor) => (
                    <tr key={vendor.id} className="hover:bg-slate-800/40">
                      <td className="p-3 font-bold text-white">
                        <p
                          onClick={() => setActiveVendorDetail(vendor)}
                          className="hover:text-teal-300 cursor-pointer"
                        >
                          {vendor.vendor_name}
                        </p>
                        <p className="text-[10px] text-slate-400">{vendor.service_type}</p>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700 text-[10px] font-semibold">
                          {vendor.category}
                        </span>
                      </td>
                      <td className="p-3 font-mono font-bold text-emerald-400 text-xs">
                        {vendor.contract_value}
                      </td>
                      <td className="p-3">
                        <p className="text-slate-200 font-semibold">{vendor.contact_person || "—"}</p>
                        <p className="font-mono text-[11px] text-sky-400">{vendor.contact_phone || "—"}</p>
                      </td>
                      <td className="p-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            vendor.functional_status === "Operational"
                              ? "bg-emerald-950 text-emerald-300 border-emerald-700"
                              : "bg-amber-950 text-amber-300 border-amber-700"
                          }`}
                        >
                          {vendor.functional_status}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-amber-400 flex items-center gap-1">
                        <Star className="w-3 h-3 fill-amber-400" />
                        <span>{vendor.rating || 4.5}</span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {vendor.contract_doc_url && (
                            <button
                              onClick={() =>
                                setPreviewDoc({
                                  url: vendor.contract_doc_url!,
                                  title: `Contract SLA: ${vendor.vendor_name}`,
                                })
                              }
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-teal-950/80 hover:bg-teal-900 border border-teal-700/80 text-teal-300 rounded-lg text-xs font-bold transition shadow-xs"
                              title="View Contract Agreement"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View SLA</span>
                            </button>
                          )}
                          <button
                            onClick={() => setActiveVendorDetail(vendor)}
                            className="p-1 text-slate-400 hover:text-sky-300"
                            title="View Full Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {canEdit && (
                            <>
                              <button
                                onClick={() => setEditingVendor(vendor)}
                                className="p-1 text-slate-400 hover:text-amber-300"
                                title="Edit Contract"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Delete contract for "${vendor.vendor_name}"?`)) {
                                    onDeleteVendor(vendor.id);
                                  }
                                }}
                                className="p-1 text-slate-400 hover:text-rose-400"
                                title="Delete Contract"
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

      {/* Interactive Vendor Detail Modal */}
      {currentDetailVendor && (
        <Modal
          isOpen={Boolean(currentDetailVendor)}
          onClose={() => setActiveVendorDetail(null)}
          title={`${currentDetailVendor.vendor_name}`}
          subtitle={`${currentDetailVendor.category} • ${currentDetailVendor.service_type}`}
          maxWidth="xl"
        >
          <div className="space-y-4 text-xs">
            {/* Top Status Strip */}
            <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-700 font-bold rounded-full text-[11px] flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {currentDetailVendor.verification_status}
                </span>
                <span className="px-2.5 py-0.5 bg-slate-800 text-slate-200 border border-slate-700 font-semibold rounded-full text-[11px]">
                  {currentDetailVendor.functional_status}
                </span>
              </div>

              <div className="flex items-center gap-1 text-amber-400 font-bold text-xs bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <span>Performance Rating: {currentDetailVendor.rating || 4.8} / 5.0</span>
              </div>
            </div>

            {/* Scope of Work */}
            <div className="p-4 bg-slate-800/60 rounded-xl border border-slate-700">
              <h4 className="font-bold text-white mb-1">Scope of Work &amp; SLA Terms</h4>
              <p className="text-slate-200 leading-relaxed">
                {currentDetailVendor.scope_of_work || currentDetailVendor.service_type}
              </p>
            </div>

            {/* Bidding & Tender Notes */}
            {currentDetailVendor.bidding_notes && (
              <div className="p-3.5 bg-amber-950/30 rounded-xl border border-amber-800/40">
                <h4 className="font-bold text-amber-300 mb-1 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-amber-400" /> Bidding Winner &amp; Tender Background
                </h4>
                <p className="text-amber-100/90 leading-relaxed">
                  {currentDetailVendor.bidding_notes}
                </p>
              </div>
            )}

            {/* Financials & Contact Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 bg-slate-800/60 rounded-xl border border-slate-700 space-y-1">
                <span className="text-slate-400 font-semibold text-[11px]">Contract Value &amp; Term</span>
                <p className="text-sm font-bold text-emerald-400 font-mono">{currentDetailVendor.contract_value}</p>
                <p className="text-[11px] text-slate-300">
                  Duration: {currentDetailVendor.contract_start_date || "—"} to {currentDetailVendor.contract_end_date || "Ongoing"}
                </p>
              </div>

              <div className="p-3.5 bg-slate-800/60 rounded-xl border border-slate-700 space-y-1">
                <span className="text-slate-400 font-semibold text-[11px]">Authorized Vendor Contact</span>
                <p className="text-xs font-bold text-white">{currentDetailVendor.contact_person || "Contact Desk"}</p>
                <p className="font-mono text-xs text-sky-400 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" /> {currentDetailVendor.contact_phone || "—"}
                </p>
                {currentDetailVendor.contact_email && (
                  <p className="text-[11px] text-slate-400 flex items-center gap-1 truncate">
                    <Mail className="w-3 h-3 text-slate-400" /> {currentDetailVendor.contact_email}
                  </p>
                )}
              </div>
            </div>

            {/* Document Attachments (Contract & Certificates) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentDetailVendor.contract_doc_url ? (
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-teal-400 shrink-0" />
                    <span className="font-semibold text-slate-200 truncate">Contract Agreement</span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setPreviewDoc({
                        url: currentDetailVendor.contract_doc_url!,
                        title: `Contract SLA: ${currentDetailVendor.vendor_name}`,
                      })
                    }
                    className="px-2.5 py-1 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-sm"
                  >
                    <Eye className="w-3.5 h-3.5" /> View SLA
                  </button>
                </div>
              ) : null}

              {currentDetailVendor.certificate_url ? (
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="font-semibold text-slate-200 truncate">Compliance Certificate</span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setPreviewDoc({
                        url: currentDetailVendor.certificate_url!,
                        title: `Compliance Certificate: ${currentDetailVendor.vendor_name}`,
                      })
                    }
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-sm"
                  >
                    <Eye className="w-3.5 h-3.5" /> View Proof
                  </button>
                </div>
              ) : null}
            </div>

            {/* Resident & MC Feedback */}
            {currentDetailVendor.feedback_summary && (
              <div className="p-3.5 bg-slate-800/40 rounded-xl border border-slate-700 text-xs">
                <h4 className="font-bold text-slate-300 mb-1">Feedback &amp; Performance Review</h4>
                <p className="text-slate-300 leading-relaxed italic">
                  &quot;{currentDetailVendor.feedback_summary}&quot;
                </p>
              </div>
            )}

            {/* Actions for Super Admin / Admin */}
            {canEdit && (
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  onClick={() => {
                    setEditingVendor(currentDetailVendor);
                    setActiveVendorDetail(null);
                  }}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 rounded-xl text-xs font-bold transition flex items-center gap-1"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Edit Contract</span>
                </button>

                <button
                  onClick={() => {
                    if (confirm(`Delete contract for "${currentDetailVendor.vendor_name}"?`)) {
                      onDeleteVendor(currentDetailVendor.id);
                      setActiveVendorDetail(null);
                    }
                  }}
                  className="px-3.5 py-1.5 bg-red-950 hover:bg-red-900 border border-red-700 text-red-300 rounded-xl text-xs font-bold transition flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Add Vendor Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Vendor / Society Contract"
        subtitle="Record amenities lease winners (EV charging), AMC contracts, or facility vendors"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Vendor / Company Name *</label>
            <input
              type="text"
              required
              value={formData.vendor_name}
              onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })}
              placeholder="e.g. Bolt.Earth EV Infrastructure / Schindler Lifts"
              className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <DynamicSelect
                label="Contract Category"
                required
                value={formData.category}
                onChange={(val) => setFormData({ ...formData, category: val })}
                options={defaultCategories}
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Service Type / Scope *</label>
              <input
                type="text"
                required
                value={formData.service_type}
                onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
                placeholder="e.g. 10-Bay EV Hub Bidding Winner"
                className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Contract Value</label>
              <input
                type="text"
                value={formData.contract_value}
                onChange={(e) => setFormData({ ...formData, contract_value: e.target.value })}
                placeholder="e.g. ₹ 14,40,000 / year"
                className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono"
              />
            </div>

            <div>
              <DynamicSelect
                label="Operational Status"
                value={formData.functional_status}
                onChange={(val) => setFormData({ ...formData, functional_status: val })}
                options={defaultFunctionalStatuses}
              />
            </div>

            <div>
              <DynamicSelect
                label="Verification"
                value={formData.verification_status}
                onChange={(val) => setFormData({ ...formData, verification_status: val })}
                options={defaultVerificationStatuses}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Contact Person</label>
              <input
                type="text"
                value={formData.contact_person}
                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                placeholder="e.g. Siddharth Verma"
                className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Phone Number</label>
              <input
                type="text"
                value={formData.contact_phone}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                placeholder="+91 98450 44332"
                className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Email Address</label>
              <input
                type="email"
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                placeholder="support@vendor.com"
                className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Contract Start Date</label>
              <input
                type="date"
                value={formData.contract_start_date}
                onChange={(e) => setFormData({ ...formData, contract_start_date: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Contract End Date / Renewal</label>
              <input
                type="date"
                value={formData.contract_end_date}
                onChange={(e) => setFormData({ ...formData, contract_end_date: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
              />
            </div>
          </div>

          {/* Document Uploads */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FileUploadInput
              label="Attach Contract / Lease Agreement (PDF)"
              value={formData.contract_doc_url}
              onChange={(dataUrl) => setFormData({ ...formData, contract_doc_url: dataUrl })}
            />

            <FileUploadInput
              label="Attach Compliance Certificate / Insurance"
              value={formData.certificate_url}
              onChange={(dataUrl) => setFormData({ ...formData, certificate_url: dataUrl })}
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Scope of Work &amp; SLA Details</label>
            <textarea
              rows={2}
              value={formData.scope_of_work}
              onChange={(e) => setFormData({ ...formData, scope_of_work: e.target.value })}
              placeholder="Outline maintenance frequency, 24x7 helpline, response times..."
              className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Bidding &amp; Tender Background Notes</label>
            <input
              type="text"
              value={formData.bidding_notes}
              onChange={(e) => setFormData({ ...formData, bidding_notes: e.target.value })}
              placeholder="e.g. Won competitive tender among 4 vendors in AGM 2025"
              className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 text-slate-400 hover:text-white rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl shadow-md transition disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Save Contract in Database"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Vendor Modal */}
      {editingVendor && (
        <Modal
          isOpen={Boolean(editingVendor)}
          onClose={() => setEditingVendor(null)}
          title={`Edit Vendor Contract: ${editingVendor.vendor_name}`}
          subtitle="Update service scope, contract value, dates, or upload certificates"
          maxWidth="lg"
        >
          <form onSubmit={handleUpdateSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Vendor / Company Name *</label>
              <input
                type="text"
                required
                value={editingVendor.vendor_name}
                onChange={(e) => setEditingVendor({ ...editingVendor, vendor_name: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <DynamicSelect
                  label="Category"
                  value={editingVendor.category}
                  onChange={(val) => setEditingVendor({ ...editingVendor, category: val })}
                  options={defaultCategories}
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Service Type / Scope</label>
                <input
                  type="text"
                  value={editingVendor.service_type}
                  onChange={(e) => setEditingVendor({ ...editingVendor, service_type: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Contract Value</label>
                <input
                  type="text"
                  value={editingVendor.contract_value || ""}
                  onChange={(e) => setEditingVendor({ ...editingVendor, contract_value: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono"
                />
              </div>

              <div>
                <DynamicSelect
                  label="Operational Status"
                  value={editingVendor.functional_status}
                  onChange={(val) => setEditingVendor({ ...editingVendor, functional_status: val })}
                  options={defaultFunctionalStatuses}
                />
              </div>

              <div>
                <DynamicSelect
                  label="Verification"
                  value={editingVendor.verification_status}
                  onChange={(val) => setEditingVendor({ ...editingVendor, verification_status: val })}
                  options={defaultVerificationStatuses}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Contact Person</label>
                <input
                  type="text"
                  value={editingVendor.contact_person || ""}
                  onChange={(e) => setEditingVendor({ ...editingVendor, contact_person: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={editingVendor.contact_phone || ""}
                  onChange={(e) => setEditingVendor({ ...editingVendor, contact_phone: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Email</label>
                <input
                  type="email"
                  value={editingVendor.contact_email || ""}
                  onChange={(e) => setEditingVendor({ ...editingVendor, contact_email: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Contract End Date</label>
                <input
                  type="date"
                  value={editingVendor.contract_end_date || ""}
                  onChange={(e) => setEditingVendor({ ...editingVendor, contract_end_date: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Rating (1 to 5)</label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="5"
                  value={editingVendor.rating || 4.5}
                  onChange={(e) => setEditingVendor({ ...editingVendor, rating: parseFloat(e.target.value) || 4.5 })}
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono"
                />
              </div>
            </div>

            {/* Document Uploads in Edit */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FileUploadInput
                label="Contract Agreement Document (PDF)"
                value={editingVendor.contract_doc_url}
                onChange={(dataUrl) => setEditingVendor({ ...editingVendor, contract_doc_url: dataUrl })}
              />

              <FileUploadInput
                label="Compliance Certificate / Fitness Proof"
                value={editingVendor.certificate_url}
                onChange={(dataUrl) => setEditingVendor({ ...editingVendor, certificate_url: dataUrl })}
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Scope of Work</label>
              <textarea
                rows={2}
                value={editingVendor.scope_of_work || ""}
                onChange={(e) => setEditingVendor({ ...editingVendor, scope_of_work: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Feedback Notes</label>
              <textarea
                rows={2}
                value={editingVendor.feedback_summary || ""}
                onChange={(e) => setEditingVendor({ ...editingVendor, feedback_summary: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingVendor(null)}
                className="px-4 py-2 text-slate-400 hover:text-white rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl shadow-md transition disabled:opacity-50"
              >
                {isSubmitting ? "Updating..." : "Save Contract Updates"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Reusable Document & Contract Preview Modal */}
      <DocumentPreviewModal
        isOpen={Boolean(previewDoc)}
        onClose={() => setPreviewDoc(null)}
        url={previewDoc?.url}
        title={previewDoc?.title}
      />
    </div>
  );
}
