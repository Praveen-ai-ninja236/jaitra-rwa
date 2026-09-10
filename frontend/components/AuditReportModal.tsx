"use client";

import React, { useState, useMemo } from "react";
import {
  X,
  FileSpreadsheet,
  Printer,
  Download,
  Filter,
  ArrowUpDown,
  Search,
  CheckCircle2,
  Calendar,
  Building,
  CreditCard,
  Layers,
  Eye,
} from "lucide-react";
import { AuditTransaction } from "@/lib/types";
import DocumentPreviewModal from "./DocumentPreviewModal";

interface AuditReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: AuditTransaction[];
}

export default function AuditReportModal({ isOpen, onClose, transactions }: AuditReportModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [paymentModeFilter, setPaymentModeFilter] = useState("All");
  const [sortField, setSortField] = useState<"date" | "amount" | "type" | "particulars">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [previewDoc, setPreviewDoc] = useState<{ url: string; title: string } | null>(null);

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((t) => {
        if (typeFilter !== "All" && t.type !== typeFilter) return false;
        if (paymentModeFilter !== "All" && t.payment_mode !== paymentModeFilter) return false;
        if (searchTerm.trim()) {
          const s = searchTerm.toLowerCase();
          const match =
            t.particulars.toLowerCase().includes(s) ||
            t.festival_or_event.toLowerCase().includes(s) ||
            t.payer_or_vendor.toLowerCase().includes(s) ||
            t.transaction_ref.toLowerCase().includes(s) ||
            t.category.toLowerCase().includes(s);
          if (!match) return false;
        }
        return true;
      })
      .sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];
        if (sortField === "amount") {
          return sortOrder === "asc" ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
        }
        if (sortField === "date") {
          const dateA = new Date(valA as string).getTime();
          const dateB = new Date(valB as string).getTime();
          return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
        }
        return sortOrder === "asc"
          ? String(valA).localeCompare(String(valB))
          : String(valB).localeCompare(String(valA));
      });
  }, [transactions, typeFilter, paymentModeFilter, searchTerm, sortField, sortOrder]);

  const totalCollections = useMemo(
    () =>
      filteredTransactions
        .filter((t) => t.type === "Collection")
        .reduce((sum, t) => sum + t.amount, 0),
    [filteredTransactions]
  );

  const totalExpenses = useMemo(
    () =>
      filteredTransactions
        .filter((t) => t.type === "Expense")
        .reduce((sum, t) => sum + t.amount, 0),
    [filteredTransactions]
  );

  const netBalance = totalCollections - totalExpenses;

  if (!isOpen) return null;

  // Export to CSV Function
  const exportToCSV = () => {
    const headers = [
      "Transaction ID",
      "Type",
      "Festival / Event",
      "Date",
      "Category",
      "Particulars / Donor / Vendor",
      "Tower / Flat",
      "Payment Mode",
      "Transaction Ref",
      "Amount (INR)",
      "Status",
      "Approver / Notes",
    ];

    const rows = filteredTransactions.map((t) => [
      `"${t.id}"`,
      `"${t.type}"`,
      `"${t.festival_or_event}"`,
      `"${t.date}"`,
      `"${t.category}"`,
      `"${t.particulars.replace(/"/g, '""')}"`,
      `"${t.tower_flat}"`,
      `"${t.payment_mode}"`,
      `"${t.transaction_ref}"`,
      t.amount,
      `"${t.status}"`,
      `"${t.approver || ""}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Jaitra_Audit_Report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Friendly Statement
  const handlePrint = () => {
    window.print();
  };

  const handleSort = (field: "date" | "amount" | "type" | "particulars") => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-4 sm:p-6 border-b border-slate-700/80 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
                JAITRA RWA - Financial Audit Report
                <span className="text-[11px] bg-emerald-950 text-emerald-300 border border-emerald-700/80 px-2 py-0.5 rounded-full font-mono">
                  Live DB Audited
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Complete verifiable transaction register & voucher trail for all festivals & community funds
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportToCSV}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-emerald-600/30"
              title="Download CSV for Excel"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export Excel / CSV</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-bold transition"
              title="Print Audit Statement"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Summary Financial Metric Cards */}
        <div className="grid grid-cols-3 gap-3 p-4 sm:p-5 bg-slate-950/60 border-b border-slate-800 shrink-0">
          <div className="bg-slate-900/90 border border-emerald-800/40 rounded-xl p-3 sm:p-4">
            <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Total Collections</p>
            <p className="text-base sm:text-xl font-extrabold text-emerald-300 font-mono mt-1">
              ₹ {totalCollections.toLocaleString("en-IN")}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {filteredTransactions.filter((t) => t.type === "Collection").length} recorded donor contributions
            </p>
          </div>

          <div className="bg-slate-900/90 border border-red-800/40 rounded-xl p-3 sm:p-4">
            <p className="text-[11px] font-bold text-red-400 uppercase tracking-wider">Total Expenses</p>
            <p className="text-base sm:text-xl font-extrabold text-red-300 font-mono mt-1">
              ₹ {totalExpenses.toLocaleString("en-IN")}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {filteredTransactions.filter((t) => t.type === "Expense").length} verified voucher payouts
            </p>
          </div>

          <div
            className={`bg-slate-900/90 border rounded-xl p-3 sm:p-4 ${
              netBalance >= 0 ? "border-sky-800/40" : "border-amber-800/40"
            }`}
          >
            <p className="text-[11px] font-bold text-sky-400 uppercase tracking-wider">Net Festival Surplus / Corpus</p>
            <p
              className={`text-base sm:text-xl font-extrabold font-mono mt-1 ${
                netBalance >= 0 ? "text-sky-300" : "text-amber-300"
              }`}
            >
              ₹ {netBalance.toLocaleString("en-IN")}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">Audited closing cash & bank balance</p>
          </div>
        </div>

        {/* Filters & Search Toolbar */}
        <div className="p-3 sm:p-4 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 flex-1 min-w-[240px]">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search donor, vendor, bill item, transaction ref..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="text-xs text-slate-400 hover:text-slate-200"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 font-medium focus:outline-none"
            >
              <option value="All">All Types</option>
              <option value="Collection">Collections (Inflow)</option>
              <option value="Expense">Expenses (Outflow)</option>
            </select>

            {/* Payment Mode Filter */}
            <select
              value={paymentModeFilter}
              onChange={(e) => setPaymentModeFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 font-medium focus:outline-none"
            >
              <option value="All">All Payment Modes</option>
              <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
              <option value="Cash">Cash at Office</option>
              <option value="Cheque">Cheque</option>
              <option value="NetBanking">Net Banking (NEFT/RTGS)</option>
              <option value="Card">Card</option>
            </select>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="flex-1 overflow-auto p-4">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400 bg-slate-950/40 sticky top-0 backdrop-blur-md">
                <th
                  onClick={() => handleSort("date")}
                  className="py-2.5 px-3 font-semibold cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    Date <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("type")}
                  className="py-2.5 px-3 font-semibold cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    Type <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-2.5 px-3 font-semibold">Festival / Particulars</th>
                <th className="py-2.5 px-3 font-semibold">Tower / Flat / Vendor</th>
                <th className="py-2.5 px-3 font-semibold">Payment Mode</th>
                <th className="py-2.5 px-3 font-semibold">Ref / Voucher ID</th>
                <th
                  onClick={() => handleSort("amount")}
                  className="py-2.5 px-3 font-semibold text-right cursor-pointer hover:text-white"
                >
                  <div className="flex items-center justify-end gap-1">
                    Amount (₹) <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-2.5 px-3 font-semibold text-center">Status / Approver</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No transactions match your search/filter criteria.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-2.5 px-3 font-mono text-slate-300 whitespace-nowrap">{tx.date}</td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          tx.type === "Collection"
                            ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                            : "bg-red-950 text-red-300 border border-red-800"
                        }`}
                      >
                        {tx.type === "Collection" ? "+ Collection" : "- Expense"}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-bold text-white text-xs">{tx.particulars}</p>
                          <p className="text-[11px] text-slate-400">{tx.festival_or_event}</p>
                        </div>
                        {tx.evidence_url && (
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewDoc({
                                url: tx.evidence_url!,
                                title: `Audit Evidence: ${tx.particulars} (₹${tx.amount.toLocaleString("en-IN")})`,
                              })
                            }
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-sky-950/90 hover:bg-sky-900 border border-sky-600/80 text-sky-300 rounded-lg text-[10px] font-black transition shrink-0 shadow-xs"
                            title="View Attached Audit Proof / Bill"
                          >
                            <Eye className="w-3 h-3 text-sky-400" />
                            <span>View Proof</span>
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">
                      {tx.tower_flat !== "-" ? tx.tower_flat : tx.payer_or_vendor}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-800 text-slate-300 rounded-md text-[11px] font-medium border border-slate-700">
                        <CreditCard className="w-3 h-3 text-sky-400" />
                        {tx.payment_mode}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400">{tx.transaction_ref}</td>
                    <td
                      className={`py-2.5 px-3 text-right font-mono font-bold text-xs ${
                        tx.type === "Collection" ? "text-emerald-400" : "text-red-400"
                      }`}
                    >
                      {tx.type === "Collection" ? "+" : "-"} ₹ {tx.amount.toLocaleString("en-IN")}
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-800 text-emerald-300 text-[10px] font-bold rounded border border-emerald-900/60">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        {tx.status}
                      </span>
                      {tx.approver && (
                        <p className="text-[10px] text-slate-400 mt-0.5">By {tx.approver}</p>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <p>
            Showing <strong className="text-white">{filteredTransactions.length}</strong> audited entries
          </p>
          <p className="font-mono text-[11px]">Certified by Jaitra RWA Treasury Cell</p>
        </div>
      </div>

      {/* Audit Evidence Document Preview Modal */}
      <DocumentPreviewModal
        isOpen={Boolean(previewDoc)}
        onClose={() => setPreviewDoc(null)}
        url={previewDoc?.url}
        title={previewDoc?.title}
      />
    </div>
  );
}
