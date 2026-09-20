"use client";

import React, { useState, useMemo } from "react";
import * as XLSX from "xlsx";
import * as api from "../lib/api";
import { downloadExcelFile } from "../lib/exportUtils";
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
  Upload,
  Paperclip,
  ExternalLink,
  ChevronRight,
  Filter,
  ArrowUpDown,
  FileSpreadsheet,
  Eye,
  Send,
  Mail,
  AlertCircle,
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
  onBroadcastFestival?: (fest: FestivalCelebration) => void;
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
  onBroadcastFestival,
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

  // Excel / CSV Upload States for Collections
  const [isCollUploadOpen, setIsCollUploadOpen] = useState(false);
  const [collUploadRows, setCollUploadRows] = useState<any[]>([]);
  const [collFailedRows, setCollFailedRows] = useState<any[]>([]);
  const [isParsingColl, setIsParsingColl] = useState(false);
  const [isCollUploading, setIsCollUploading] = useState(false);
  const [collProgress, setCollProgress] = useState(0);
  const [collUploadError, setCollUploadError] = useState<string | null>(null);

  // Excel / CSV Upload States for Expenses
  const [isExpUploadOpen, setIsExpUploadOpen] = useState(false);
  const [expUploadRows, setExpUploadRows] = useState<any[]>([]);
  const [expFailedRows, setExpFailedRows] = useState<any[]>([]);
  const [isParsingExp, setIsParsingExp] = useState(false);
  const [isExpUploading, setIsExpUploading] = useState(false);
  const [expProgress, setExpProgress] = useState(0);
  const [expUploadError, setExpUploadError] = useState<string | null>(null);

  // Multi-Select for Collections and Expenses
  const [selectedCollIds, setSelectedCollIds] = useState<number[]>([]);
  const [selectedExpIds, setSelectedExpIds] = useState<number[]>([]);

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

  // ----------------- BULK MULTI-SELECT DELETION -----------------
  const handleBulkDeleteCollections = async () => {
    if (selectedCollIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedCollIds.length} selected collection records?`)) return;
    setIsSubmitting(true);
    try {
      for (const id of selectedCollIds) {
        await onDeleteCollection(id);
      }
      setSelectedCollIds([]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkDeleteExpenses = async () => {
    if (selectedExpIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedExpIds.length} selected expense vouchers?`)) return;
    setIsSubmitting(true);
    try {
      for (const id of selectedExpIds) {
        await onDeleteExpense(id);
      }
      setSelectedExpIds([]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ----------------- EXCEL / CSV BULK IMPORT & EXPORT FOR COLLECTIONS -----------------
  const handleCollectionsFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCollUploadError(null);
    setIsParsingColl(true);
    setCollProgress(20);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        setCollProgress(50);
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rawData: any[] = XLSX.utils.sheet_to_json(ws);

        if (!rawData || rawData.length === 0) {
          setCollUploadError("The uploaded file contains no rows.");
          setIsParsingColl(false);
          setCollProgress(0);
          return;
        }

        const good: any[] = [];
        const failed: any[] = [];

        rawData.forEach((row: any, idx: number) => {
          const keys = Object.keys(row);
          const findKey = (patterns: string[]) => keys.find((k) => patterns.some((p) => k.toLowerCase().replace(/[^a-z]/g, "").includes(p)));

          const towerKey = findKey(["tower", "wing", "block"]);
          const flatKey = findKey(["flat", "flatno", "unit", "door"]);
          const donorKey = findKey(["donor", "contributor", "name", "resident"]);
          const amountKey = findKey(["amount", "contribution", "rupees", "inr"]);
          const modeKey = findKey(["payment", "mode", "method", "paytype"]);
          const refKey = findKey(["transaction", "ref", "utr", "cheque", "refno"]);
          const dateKey = findKey(["date", "collected", "collecteddate"]);
          const notesKey = findKey(["notes", "remarks", "comment"]);

          let towerVal = towerKey ? String(row[towerKey]).trim() : "Tower A";
          if (!towerVal.toLowerCase().includes("tower") && /^[A-F]$/i.test(towerVal)) {
            towerVal = `Tower ${towerVal.toUpperCase()}`;
          }
          const flatVal = flatKey ? String(row[flatKey]).trim() : "101";
          const donorVal = donorKey ? String(row[donorKey]).trim() : "";
          const rawAmt = amountKey ? String(row[amountKey]).replace(/[^0-9.]/g, "") : "0";
          const amountVal = parseFloat(rawAmt) || 0;
          const modeVal = modeKey ? String(row[modeKey]).trim() : "UPI";
          const refVal = refKey ? String(row[refKey]).trim() : "";
          const dateVal = dateKey ? String(row[dateKey]).trim() : new Date().toISOString().split("T")[0];
          const notesVal = notesKey ? String(row[notesKey]).trim() : "Bulk Upload";

          const rec = {
            id: idx + 1,
            tower: towerVal,
            flat_no: flatVal,
            donor_name: donorVal,
            amount: amountVal,
            payment_mode: modeVal,
            transaction_ref: refVal,
            collected_date: dateVal,
            notes: notesVal,
          };

          if (!donorVal || amountVal <= 0) {
            let reason = "";
            if (!donorVal) reason = "Missing donor resident name";
            else if (amountVal <= 0) reason = "Amount must be greater than 0";
            failed.push({ ...rec, errorReason: reason });
          } else {
            good.push(rec);
          }
        });

        setCollUploadRows(good);
        setCollFailedRows(failed);
        setCollProgress(100);
      } catch (err: any) {
        setCollUploadError(`Failed to parse file: ${err.message}`);
        setCollProgress(0);
      } finally {
        setIsParsingColl(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleFixFailedCollRow = (rowId: number, field: string, val: any) => {
    setCollFailedRows((prev) =>
      prev.map((r) => {
        if (r.id === rowId) {
          const updated = { ...r, [field]: val };
          // Check if now valid
          if (updated.donor_name && updated.amount > 0) {
            updated.errorReason = "";
          }
          return updated;
        }
        return r;
      })
    );
  };

  const handleMoveFixedCollRowToGood = (rowId: number) => {
    const target = collFailedRows.find((r) => r.id === rowId);
    if (!target) return;
    if (!target.donor_name || target.amount <= 0) {
      alert("Please ensure both Donor Name and Amount (>0) are provided before moving to good records.");
      return;
    }
    setCollFailedRows((prev) => prev.filter((r) => r.id !== rowId));
    setCollUploadRows((prev) => [...prev, target]);
  };

  const handleConfirmCollectionsImport = async () => {
    if (!activeFestivalDetail) return;
    if (collUploadRows.length === 0) {
      alert("No valid collection records to import.");
      return;
    }
    setIsCollUploading(true);
    setCollProgress(30);
    try {
      setCollProgress(70);
      await api.bulkAddFestivalCollections(activeFestivalDetail.id, collUploadRows);
      setCollProgress(100);
      setTimeout(() => {
        setIsCollUploadOpen(false);
        setCollUploadRows([]);
        setCollFailedRows([]);
        setIsCollUploading(false);
        setCollProgress(0);
        window.location.reload();
      }, 500);
    } catch (err: any) {
      setCollUploadError(err.message || "Failed to import collections");
      setIsCollUploading(false);
    }
  };

  const handleDownloadSampleCollectionsTemplate = () => {
    const sample = [
      {
        "Tower": "Tower A",
        "Flat_No": "101",
        "Donor_Name": "Rajesh Sharma",
        "Amount": 1500,
        "Payment_Mode": "UPI",
        "Transaction_Ref": "UPI/48291039",
        "Collected_Date": new Date().toISOString().split("T")[0],
        "Notes": "Pooja & Annadanam sponsor",
      },
      {
        "Tower": "Tower B",
        "Flat_No": "502",
        "Donor_Name": "Priya Varma",
        "Amount": 2000,
        "Payment_Mode": "UPI",
        "Transaction_Ref": "UPI/98124012",
        "Collected_Date": new Date().toISOString().split("T")[0],
        "Notes": "Festival Contribution",
      },
      {
        "Tower": "Tower C",
        "Flat_No": "1204",
        "Donor_Name": "Vikram Patel",
        "Amount": 5000,
        "Payment_Mode": "Net Banking",
        "Transaction_Ref": "NEFT/882190",
        "Collected_Date": new Date().toISOString().split("T")[0],
        "Notes": "Maha Prasadam Sponsor",
      },
    ];
    downloadExcelFile(sample, "Jaitra_Festival_Collections_Template", "Collections_Template");
  };

  const handleExportCollections = (subset?: FestivalCollection[]) => {
    const target = subset && subset.length > 0 ? subset : filteredCollections;
    if (target.length === 0) {
      alert("No collection records to export.");
      return;
    }
    const festName = activeFestivalDetail ? activeFestivalDetail.festival_name : "Festival";
    const data = target.map((c) => ({
      "Tower": c.tower,
      "Flat No": c.flat_no,
      "Donor Resident Name": c.donor_name,
      "Contribution Amount (₹)": c.amount,
      "Payment Mode": c.payment_mode,
      "Transaction Ref / Cheque": c.transaction_ref || "-",
      "Collected Date": c.collected_date,
      "Attachment Available": c.receipt_url && c.receipt_url.trim().length > 0 ? "Yes" : "No",
      "Audit Notes": c.notes || "-",
    }));
    downloadExcelFile(data, `${festName.replace(/[^a-zA-Z0-9_-]/g, "_")}_Collections`, "Collections");
  };

  // ----------------- EXCEL / CSV BULK IMPORT & EXPORT FOR EXPENSES -----------------
  const handleExpensesFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setExpUploadError(null);
    setIsParsingExp(true);
    setExpProgress(20);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        setExpProgress(50);
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rawData: any[] = XLSX.utils.sheet_to_json(ws);

        if (!rawData || rawData.length === 0) {
          setExpUploadError("The uploaded file contains no rows.");
          setIsParsingExp(false);
          setExpProgress(0);
          return;
        }

        const good: any[] = [];
        const failed: any[] = [];

        rawData.forEach((row: any, idx: number) => {
          const keys = Object.keys(row);
          const findKey = (patterns: string[]) => keys.find((k) => patterns.some((p) => k.toLowerCase().replace(/[^a-z]/g, "").includes(p)));

          const titleKey = findKey(["expensetitle", "title", "item", "particulars", "description"]);
          const catKey = findKey(["category", "expensehead", "type"]);
          const amountKey = findKey(["amount", "cost", "total", "rupees", "inr"]);
          const vendorKey = findKey(["vendor", "contractor", "supplier", "payee"]);
          const modeKey = findKey(["paymentmode", "mode", "payment", "method"]);
          const dateKey = findKey(["billdate", "date", "invoicedate"]);
          const approverKey = findKey(["designatedapprover", "approver", "approvedby", "approvername"]);

          const titleVal = titleKey ? String(row[titleKey]).trim() : "";
          const catVal = catKey ? String(row[catKey]).trim() : "Decor";
          const rawAmt = amountKey ? String(row[amountKey]).replace(/[^0-9.]/g, "") : "0";
          const amountVal = parseFloat(rawAmt) || 0;
          const vendorVal = vendorKey ? String(row[vendorKey]).trim() : "";
          const modeVal = modeKey ? String(row[modeKey]).trim() : "UPI";
          const dateVal = dateKey ? String(row[dateKey]).trim() : new Date().toISOString().split("T")[0];
          const approverVal = approverKey ? String(row[approverKey]).trim() : "Treasurer";

          const rec = {
            id: idx + 1,
            title: titleVal,
            category: catVal,
            amount: amountVal,
            vendor_name: vendorVal,
            payment_mode: modeVal,
            bill_date: dateVal,
            approver_name: approverVal,
            approver_role: "Treasurer",
            approval_status: "Approved",
            audit_evidence_notes: "Bulk Uploaded via Excel",
          };

          if (!titleVal || amountVal <= 0) {
            let reason = "";
            if (!titleVal) reason = "Missing expense item title";
            else if (amountVal <= 0) reason = "Amount must be greater than 0";
            failed.push({ ...rec, errorReason: reason });
          } else {
            good.push(rec);
          }
        });

        setExpUploadRows(good);
        setExpFailedRows(failed);
        setExpProgress(100);
      } catch (err: any) {
        setExpUploadError(`Failed to parse file: ${err.message}`);
        setExpProgress(0);
      } finally {
        setIsParsingExp(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleFixFailedExpRow = (rowId: number, field: string, val: any) => {
    setExpFailedRows((prev) =>
      prev.map((r) => {
        if (r.id === rowId) {
          const updated = { ...r, [field]: val };
          if (updated.title && updated.amount > 0) {
            updated.errorReason = "";
          }
          return updated;
        }
        return r;
      })
    );
  };

  const handleMoveFixedExpRowToGood = (rowId: number) => {
    const target = expFailedRows.find((r) => r.id === rowId);
    if (!target) return;
    if (!target.title || target.amount <= 0) {
      alert("Please ensure both Expense Title and Amount (>0) are provided before moving to good records.");
      return;
    }
    setExpFailedRows((prev) => prev.filter((r) => r.id !== rowId));
    setExpUploadRows((prev) => [...prev, target]);
  };

  const handleConfirmExpensesImport = async () => {
    if (!activeFestivalDetail) return;
    if (expUploadRows.length === 0) {
      alert("No valid expense vouchers to import.");
      return;
    }
    setIsExpUploading(true);
    setExpProgress(30);
    try {
      setExpProgress(70);
      await api.bulkAddFestivalExpenses(activeFestivalDetail.id, expUploadRows);
      setExpProgress(100);
      setTimeout(() => {
        setIsExpUploadOpen(false);
        setExpUploadRows([]);
        setExpFailedRows([]);
        setIsExpUploading(false);
        setExpProgress(0);
        window.location.reload();
      }, 500);
    } catch (err: any) {
      setExpUploadError(err.message || "Failed to import expenses");
      setIsExpUploading(false);
    }
  };

  const handleDownloadSampleExpensesTemplate = () => {
    const sample = [
      {
        "Expense Title / Item *": "Mandapam Sound System & Mic Rental",
        "Category *": "Sound & Light",
        "Amount (₹) *": 12500,
        "Vendor / Contractor": "Sri Balaji Audio & Lights",
        "Payment Mode": "UPI",
        "Bill Date": new Date().toISOString().split("T")[0],
        "Designated Approver": "Vikram Patel",
      },
      {
        "Expense Title / Item *": "Flower Garland & Stage Pooja Decoration",
        "Category *": "Decor & Flowers",
        "Amount (₹) *": 18000,
        "Vendor / Contractor": "Ganesh Flower Decorators",
        "Payment Mode": "Bank Transfer",
        "Bill Date": new Date().toISOString().split("T")[0],
        "Designated Approver": "Treasurer",
      },
      {
        "Expense Title / Item *": "Pooja Samagri, Homa Fruits & Priest Dakshina",
        "Category *": "Pooja & Rituals",
        "Amount (₹) *": 15000,
        "Vendor / Contractor": "Sri Gayatri Pooja Stores",
        "Payment Mode": "Cash",
        "Bill Date": new Date().toISOString().split("T")[0],
        "Designated Approver": "Vikram Patel",
      },
    ];
    downloadExcelFile(sample, "Jaitra_Festival_Expenses_Template", "Expenses_Template");
  };

  const handleExportExpenses = (subset?: FestivalExpense[]) => {
    const target = subset && subset.length > 0 ? subset : filteredExpenses;
    if (target.length === 0) {
      alert("No expense records to export.");
      return;
    }
    const festName = activeFestivalDetail ? activeFestivalDetail.festival_name : "Festival";
    const data = target.map((e) => ({
      "Expense Title / Item *": e.title,
      "Category *": e.category,
      "Amount (₹) *": e.amount,
      "Vendor / Contractor": e.vendor_name || "-",
      "Payment Mode": e.payment_mode || "UPI",
      "Bill Date": e.bill_date,
      "Designated Approver": e.approver_name,
      "Approval Status": e.approval_status,
      "Audit Notes": e.audit_evidence_notes || "-",
    }));
    downloadExcelFile(data, `${festName.replace(/[^a-zA-Z0-9_-]/g, "_")}_Expenses_Audit`, "Expenses");
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

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Send Broadcast to DL Button */}
          {onBroadcastFestival && festivals.length > 0 && (
            <button
              onClick={() => onBroadcastFestival(festivals[0])}
              className="inline-flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs sm:text-sm font-extrabold px-3.5 sm:px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-600/20 border border-emerald-400/40 transition transform active:scale-95"
              title="Broadcast Festival Celebration Circular to DL Group"
            >
              <Send className="w-4 h-4" />
              <span>Broadcast to DL</span>
            </button>
          )}

          {/* Download Audit Report Button */}
          {!isGuest && (
            <button
              onClick={onOpenAuditReport}
              className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-bold px-3.5 sm:px-4 py-2.5 rounded-xl border border-slate-700 transition"
              title="Download Comprehensive Society Audit Statement"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Audit Report</span>
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
                        {onBroadcastFestival && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onBroadcastFestival(fest);
                            }}
                            title="Broadcast Festival to DL Groups"
                            className="text-emerald-400 hover:text-white p-1.5 bg-emerald-950/80 hover:bg-emerald-900 rounded-lg border border-emerald-800/80 transition flex items-center gap-1 text-[11px] font-bold"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Send to DL</span>
                          </button>
                        )}
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
                <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-900 rounded-xl border border-slate-800 text-xs">
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

                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={collTowerFilter}
                      onChange={(e) => setCollTowerFilter(e.target.value)}
                      className="bg-slate-800 text-slate-200 px-2.5 py-1.5 rounded-lg text-xs border border-slate-700"
                    >
                      <option value="All">All Towers</option>
                      {defaultTowers.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>

                    <select
                      value={collPaymentFilter}
                      onChange={(e) => setCollPaymentFilter(e.target.value)}
                      className="bg-slate-800 text-slate-200 px-2.5 py-1.5 rounded-lg text-xs border border-slate-700"
                    >
                      <option value="All">All Modes</option>
                      {defaultPaymentModes.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>

                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => setIsCollUploadOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 rounded-lg border border-emerald-700/80 font-bold transition shadow-xs"
                        title="Upload Collections from Excel / CSV Sheet"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Sheet</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleExportCollections()}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 font-bold transition shadow-xs"
                      title="Export all collections for this festival to Excel"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Export All</span>
                    </button>
                  </div>
                </div>

                {/* Multi-Select Collections Toolbar */}
                {selectedCollIds.length > 0 && canEdit && (
                  <div className="flex items-center justify-between p-2.5 bg-emerald-950/70 border border-emerald-700/60 rounded-xl animate-fadeIn text-xs">
                    <span className="font-bold text-emerald-200">
                      {selectedCollIds.length} collection record(s) selected
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleBulkDeleteCollections}
                        className="flex items-center gap-1 px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg transition shadow"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Selected ({selectedCollIds.length})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleExportCollections(
                            filteredCollections.filter((c) => selectedCollIds.includes(c.id))
                          )
                        }
                        className="flex items-center gap-1 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg border border-slate-700 transition"
                      >
                        <Download className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Export Selected</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Collections Table */}
                <div className="overflow-x-auto max-h-60 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-800 text-slate-400 uppercase font-bold sticky top-0">
                      <tr>
                        {canEdit && (
                          <th className="p-2.5 w-8 text-center">
                            <input
                              type="checkbox"
                              checked={
                                filteredCollections.length > 0 &&
                                selectedCollIds.length === filteredCollections.length
                              }
                              onChange={(e) => {
                                if (e.target.checked)
                                  setSelectedCollIds(filteredCollections.map((c) => c.id));
                                else setSelectedCollIds([]);
                              }}
                              className="rounded border-slate-700 text-emerald-500 focus:ring-0 cursor-pointer"
                            />
                          </th>
                        )}
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
                          <td colSpan={canEdit ? 7 : 6} className="p-4 text-center text-slate-500 italic">
                            No collections match filter criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredCollections.map((col) => (
                          <tr key={col.id} className="hover:bg-slate-800/40">
                            {canEdit && (
                              <td className="p-2.5 text-center">
                                <input
                                  type="checkbox"
                                  checked={selectedCollIds.includes(col.id)}
                                  onChange={() => {
                                    if (selectedCollIds.includes(col.id))
                                      setSelectedCollIds(
                                        selectedCollIds.filter((id) => id !== col.id)
                                      );
                                    else setSelectedCollIds([...selectedCollIds, col.id]);
                                  }}
                                  className="rounded border-slate-700 text-emerald-500 focus:ring-0 cursor-pointer"
                                />
                              </td>
                            )}
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
                <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-900 rounded-xl border border-slate-800 text-xs">
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

                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={expCategoryFilter}
                      onChange={(e) => setExpCategoryFilter(e.target.value)}
                      className="bg-slate-800 text-slate-200 px-2.5 py-1.5 rounded-lg text-xs border border-slate-700"
                    >
                      <option value="All">All Categories</option>
                      {defaultExpenseCategories.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>

                    <select
                      value={expStatusFilter}
                      onChange={(e) => setExpStatusFilter(e.target.value)}
                      className="bg-slate-800 text-slate-200 px-2.5 py-1.5 rounded-lg text-xs border border-slate-700"
                    >
                      <option value="All">All Statuses</option>
                      <option value="Approved">Approved</option>
                      <option value="Pending">Pending</option>
                      <option value="Rejected">Rejected</option>
                    </select>

                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => setIsExpUploadOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-950 hover:bg-rose-900 text-rose-300 rounded-lg border border-rose-700/80 font-bold transition shadow-xs"
                        title="Upload Expenses from Excel / CSV Sheet"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Sheet</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleExportExpenses()}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 font-bold transition shadow-xs"
                      title="Export all expenses for this festival to Excel"
                    >
                      <Download className="w-3.5 h-3.5 text-rose-400" />
                      <span>Export All</span>
                    </button>
                  </div>
                </div>

                {/* Multi-Select Expenses Toolbar */}
                {selectedExpIds.length > 0 && canEdit && (
                  <div className="flex items-center justify-between p-2.5 bg-rose-950/70 border border-rose-700/60 rounded-xl animate-fadeIn text-xs">
                    <span className="font-bold text-rose-200">
                      {selectedExpIds.length} expense voucher(s) selected
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleBulkDeleteExpenses}
                        className="flex items-center gap-1 px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg transition shadow"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Selected ({selectedExpIds.length})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleExportExpenses(
                            filteredExpenses.filter((e) => selectedExpIds.includes(e.id))
                          )
                        }
                        className="flex items-center gap-1 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg border border-slate-700 transition"
                      >
                        <Download className="w-3.5 h-3.5 text-rose-400" />
                        <span>Export Selected</span>
                      </button>
                    </div>
                  </div>
                )}

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
                        <div className="flex items-start gap-2.5">
                          {canEdit && (
                            <input
                              type="checkbox"
                              checked={selectedExpIds.includes(exp.id)}
                              onChange={(e) => {
                                e.stopPropagation();
                                if (selectedExpIds.includes(exp.id))
                                  setSelectedExpIds(selectedExpIds.filter((id) => id !== exp.id));
                                else setSelectedExpIds([...selectedExpIds, exp.id]);
                              }}
                              className="rounded border-slate-700 text-rose-500 focus:ring-0 cursor-pointer mt-0.5"
                            />
                          )}
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

      {/* ----------------- COLLECTIONS BULK UPLOAD MODAL ----------------- */}
      <Modal
        isOpen={isCollUploadOpen}
        onClose={() => {
          if (!isCollUploading) setIsCollUploadOpen(false);
        }}
        title={`Upload Collections via Excel / CSV: ${activeFestivalDetail?.festival_name || ""}`}
        maxWidth="xl"
      >
        <div className="space-y-4 text-xs text-slate-200">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="font-bold text-white">Expected Sheet Columns:</p>
              <p className="text-[11px] text-slate-400 mt-0.5 font-mono text-emerald-300">
                Tower, Flat_No, Donor_Name, Amount, Payment_Mode, Transaction_Ref, Collected_Date, Notes
              </p>
            </div>
            <button
              type="button"
              disabled={isCollUploading}
              onClick={handleDownloadSampleCollectionsTemplate}
              className="px-3.5 py-2 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 font-bold rounded-xl border border-emerald-800/80 flex items-center gap-1.5 shadow shrink-0 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>Download Template (.xlsx)</span>
            </button>
          </div>

          {/* Progress Bar & Lock Action Indicator */}
          {isCollUploading && (
            <div className="p-3.5 bg-emerald-950/80 border border-emerald-700/80 rounded-2xl space-y-2 animate-fadeIn">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-300">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Uploading and recording collections in live database... (Actions locked)
                </span>
                <span className="font-mono font-black">{collProgress}%</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-emerald-800">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-300"
                  style={{ width: `${collProgress}%` }}
                />
              </div>
            </div>
          )}

          <div
            className={`border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-2xl p-6 text-center bg-slate-950/60 transition cursor-pointer ${
              isCollUploading ? "opacity-50 pointer-events-none" : ""
            }`}
          >
            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              disabled={isCollUploading}
              onChange={handleCollectionsFileUpload}
              className="hidden"
              id="coll-file-upload"
            />
            <label htmlFor="coll-file-upload" className="cursor-pointer block space-y-2">
              <Upload className="w-8 h-8 text-emerald-400 mx-auto" />
              <p className="font-bold text-sm text-white">
                Click or drag Excel / CSV collections file here
              </p>
              <p className="text-[11px] text-slate-500">Supports .xlsx, .xls, .csv files</p>
            </label>
          </div>

          {collUploadError && (
            <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{collUploadError}</span>
            </div>
          )}

          {/* Failed Records Section with Interactive In-line Correction */}
          {collFailedRows.length > 0 && (
            <div className="space-y-2 p-3.5 bg-rose-950/40 border border-rose-800/80 rounded-2xl animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-xs font-black text-rose-300 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  {collFailedRows.length} record(s) failed validation — review and correct below:
                </span>
                <span className="text-[11px] text-slate-400">Fix name/amount and click &quot;Validate &amp; Add&quot;</span>
              </div>

              <div className="max-h-48 overflow-y-auto rounded-xl border border-rose-900/60 bg-slate-950">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-rose-950/60 text-rose-300 font-bold border-b border-rose-900/50 sticky top-0">
                    <tr>
                      <th className="p-2">Donor Name *</th>
                      <th className="p-2">Tower &amp; Flat</th>
                      <th className="p-2">Amount (₹) *</th>
                      <th className="p-2">Error Reason</th>
                      <th className="p-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rose-900/30">
                    {collFailedRows.map((r) => (
                      <tr key={r.id} className="hover:bg-rose-950/30">
                        <td className="p-1.5">
                          <input
                            type="text"
                            value={r.donor_name}
                            onChange={(e) => handleFixFailedCollRow(r.id, "donor_name", e.target.value)}
                            placeholder="Enter Donor Name"
                            className="w-full p-1 bg-slate-900 border border-slate-700 rounded text-white text-xs font-bold"
                          />
                        </td>
                        <td className="p-1.5">
                          <div className="flex gap-1">
                            <input
                              type="text"
                              value={r.tower}
                              onChange={(e) => handleFixFailedCollRow(r.id, "tower", e.target.value)}
                              placeholder="Tower"
                              className="w-16 p-1 bg-slate-900 border border-slate-700 rounded text-white text-xs"
                            />
                            <input
                              type="text"
                              value={r.flat_no}
                              onChange={(e) => handleFixFailedCollRow(r.id, "flat_no", e.target.value)}
                              placeholder="Flat"
                              className="w-14 p-1 bg-slate-900 border border-slate-700 rounded text-white text-xs"
                            />
                          </div>
                        </td>
                        <td className="p-1.5">
                          <input
                            type="number"
                            value={r.amount || ""}
                            onChange={(e) => handleFixFailedCollRow(r.id, "amount", parseFloat(e.target.value) || 0)}
                            placeholder="Amount"
                            className="w-24 p-1 bg-slate-900 border border-slate-700 rounded text-white text-xs font-mono font-bold"
                          />
                        </td>
                        <td className="p-1.5 text-rose-400 font-mono text-[10px]">{r.errorReason}</td>
                        <td className="p-1.5 text-right">
                          <button
                            type="button"
                            onClick={() => handleMoveFixedCollRowToGood(r.id)}
                            className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-[10px] font-bold shadow transition"
                          >
                            ✓ Validate &amp; Add
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Valid Good Records Table */}
          {collUploadRows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-400">
                  ✓ {collUploadRows.length} valid donor contribution records ready to import
                </span>
                <span className="text-slate-400 font-mono text-[11px]">
                  Total sum: ₹ {collUploadRows.reduce((sum, r) => sum + (r.amount || 0), 0).toLocaleString("en-IN")}
                </span>
              </div>

              <div className="max-h-44 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 sticky top-0">
                    <tr>
                      <th className="p-2">Tower &amp; Flat</th>
                      <th className="p-2">Donor Name</th>
                      <th className="p-2">Amount (₹)</th>
                      <th className="p-2">Payment Mode</th>
                      <th className="p-2">Transaction Ref</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {collUploadRows.slice(0, 15).map((row, idx) => (
                      <tr key={idx}>
                        <td className="p-2 font-mono">{row.tower} - {row.flat_no}</td>
                        <td className="p-2 font-bold">{row.donor_name}</td>
                        <td className="p-2 font-mono text-emerald-400 font-bold">₹ {Number(row.amount).toLocaleString("en-IN")}</td>
                        <td className="p-2">{row.payment_mode}</td>
                        <td className="p-2 font-mono text-slate-400">{row.transaction_ref || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              disabled={isCollUploading}
              onClick={() => setIsCollUploadOpen(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={collUploadRows.length === 0 || isCollUploading}
              onClick={handleConfirmCollectionsImport}
              className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs rounded-xl shadow disabled:opacity-50 flex items-center gap-1.5"
            >
              {isCollUploading && <Upload className="w-3.5 h-3.5 animate-bounce" />}
              <span>
                {isCollUploading
                  ? "Importing... Action Locked"
                  : `Import ${collUploadRows.length} Collections to Live Database`}
              </span>
            </button>
          </div>
        </div>
      </Modal>

      {/* ----------------- EXPENSES BULK UPLOAD MODAL ----------------- */}
      <Modal
        isOpen={isExpUploadOpen}
        onClose={() => {
          if (!isExpUploading) setIsExpUploadOpen(false);
        }}
        title={`Upload Expenses Audit Vouchers: ${activeFestivalDetail?.festival_name || ""}`}
        maxWidth="xl"
      >
        <div className="space-y-4 text-xs text-slate-200">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="font-bold text-white">Expected Columns (as per Association format):</p>
              <p className="text-[11px] text-slate-400 mt-0.5 font-mono text-rose-300">
                Expense Title / Item *, Category *, Amount (₹) *, Vendor / Contractor, Payment Mode, Bill Date, Designated Approver
              </p>
            </div>
            <button
              type="button"
              disabled={isExpUploading}
              onClick={handleDownloadSampleExpensesTemplate}
              className="px-3.5 py-2 bg-rose-950 hover:bg-rose-900 text-rose-300 font-bold rounded-xl border border-rose-800/80 flex items-center gap-1.5 shadow shrink-0 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>Download Template (.xlsx)</span>
            </button>
          </div>

          {/* Progress Bar & Lock Action Indicator */}
          {isExpUploading && (
            <div className="p-3.5 bg-rose-950/80 border border-rose-700/80 rounded-2xl space-y-2 animate-fadeIn">
              <div className="flex items-center justify-between text-xs font-bold text-rose-300">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
                  Uploading and recording expenses in live database... (Actions locked)
                </span>
                <span className="font-mono font-black">{expProgress}%</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-rose-800">
                <div
                  className="bg-gradient-to-r from-rose-500 to-red-400 h-full rounded-full transition-all duration-300"
                  style={{ width: `${expProgress}%` }}
                />
              </div>
            </div>
          )}

          <div
            className={`border-2 border-dashed border-slate-700 hover:border-rose-500 rounded-2xl p-6 text-center bg-slate-950/60 transition cursor-pointer ${
              isExpUploading ? "opacity-50 pointer-events-none" : ""
            }`}
          >
            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              disabled={isExpUploading}
              onChange={handleExpensesFileUpload}
              className="hidden"
              id="exp-file-upload"
            />
            <label htmlFor="exp-file-upload" className="cursor-pointer block space-y-2">
              <Upload className="w-8 h-8 text-rose-400 mx-auto" />
              <p className="font-bold text-sm text-white">
                Click or drag Excel / CSV expenses file here
              </p>
              <p className="text-[11px] text-slate-500">Supports .xlsx, .xls, .csv files</p>
            </label>
          </div>

          {expUploadError && (
            <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{expUploadError}</span>
            </div>
          )}

          {/* Failed Records Section with Interactive In-line Correction */}
          {expFailedRows.length > 0 && (
            <div className="space-y-2 p-3.5 bg-rose-950/40 border border-rose-800/80 rounded-2xl animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-xs font-black text-rose-300 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  {expFailedRows.length} record(s) failed validation — review and correct below:
                </span>
                <span className="text-[11px] text-slate-400">Fix item title/amount and click &quot;Validate &amp; Add&quot;</span>
              </div>

              <div className="max-h-48 overflow-y-auto rounded-xl border border-rose-900/60 bg-slate-950">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-rose-950/60 text-rose-300 font-bold border-b border-rose-900/50 sticky top-0">
                    <tr>
                      <th className="p-2">Expense Item Title *</th>
                      <th className="p-2">Category</th>
                      <th className="p-2">Amount (₹) *</th>
                      <th className="p-2">Vendor</th>
                      <th className="p-2">Error Reason</th>
                      <th className="p-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rose-900/30">
                    {expFailedRows.map((r) => (
                      <tr key={r.id} className="hover:bg-rose-950/30">
                        <td className="p-1.5">
                          <input
                            type="text"
                            value={r.title}
                            onChange={(e) => handleFixFailedExpRow(r.id, "title", e.target.value)}
                            placeholder="Enter Expense Title"
                            className="w-full p-1 bg-slate-900 border border-slate-700 rounded text-white text-xs font-bold"
                          />
                        </td>
                        <td className="p-1.5">
                          <select
                            value={r.category}
                            onChange={(e) => handleFixFailedExpRow(r.id, "category", e.target.value)}
                            className="p-1 bg-slate-900 border border-slate-700 rounded text-white text-xs"
                          >
                            {defaultExpenseCategories.map((c) => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </td>
                        <td className="p-1.5">
                          <input
                            type="number"
                            value={r.amount || ""}
                            onChange={(e) => handleFixFailedExpRow(r.id, "amount", parseFloat(e.target.value) || 0)}
                            placeholder="Amount"
                            className="w-24 p-1 bg-slate-900 border border-slate-700 rounded text-white text-xs font-mono font-bold"
                          />
                        </td>
                        <td className="p-1.5">
                          <input
                            type="text"
                            value={r.vendor_name}
                            onChange={(e) => handleFixFailedExpRow(r.id, "vendor_name", e.target.value)}
                            placeholder="Vendor"
                            className="w-28 p-1 bg-slate-900 border border-slate-700 rounded text-white text-xs"
                          />
                        </td>
                        <td className="p-1.5 text-rose-400 font-mono text-[10px]">{r.errorReason}</td>
                        <td className="p-1.5 text-right">
                          <button
                            type="button"
                            onClick={() => handleMoveFixedExpRowToGood(r.id)}
                            className="px-2.5 py-1 bg-rose-700 hover:bg-rose-600 text-white rounded text-[10px] font-bold shadow transition"
                          >
                            ✓ Validate &amp; Add
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Valid Good Records Table */}
          {expUploadRows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-rose-400">
                  ✓ {expUploadRows.length} valid expense vouchers ready to import
                </span>
                <span className="text-slate-400 font-mono text-[11px]">
                  Total sum: ₹ {expUploadRows.reduce((sum, r) => sum + (r.amount || 0), 0).toLocaleString("en-IN")}
                </span>
              </div>

              <div className="max-h-44 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 sticky top-0">
                    <tr>
                      <th className="p-2">Expense Title / Item</th>
                      <th className="p-2">Category</th>
                      <th className="p-2">Amount (₹)</th>
                      <th className="p-2">Vendor / Contractor</th>
                      <th className="p-2">Payment Mode</th>
                      <th className="p-2">Designated Approver</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {expUploadRows.slice(0, 15).map((row, idx) => (
                      <tr key={idx}>
                        <td className="p-2 font-bold">{row.title}</td>
                        <td className="p-2">{row.category}</td>
                        <td className="p-2 font-mono text-rose-400 font-bold">₹ {Number(row.amount).toLocaleString("en-IN")}</td>
                        <td className="p-2">{row.vendor_name || "—"}</td>
                        <td className="p-2">{row.payment_mode}</td>
                        <td className="p-2 font-bold text-slate-300">{row.approver_name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              disabled={isExpUploading}
              onClick={() => setIsExpUploadOpen(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={expUploadRows.length === 0 || isExpUploading}
              onClick={handleConfirmExpensesImport}
              className="px-5 py-2 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-extrabold text-xs rounded-xl shadow disabled:opacity-50 flex items-center gap-1.5"
            >
              {isExpUploading && <Upload className="w-3.5 h-3.5 animate-bounce" />}
              <span>
                {isExpUploading
                  ? "Importing... Action Locked"
                  : `Import ${expUploadRows.length} Expenses to Audit Roster`}
              </span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
