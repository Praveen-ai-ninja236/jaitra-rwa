"use client";

import React, { useState, useMemo, useEffect } from "react";
import * as XLSX from "xlsx";
import {
  DLGroup,
  DLGroupCreate,
  DLMember,
  DLMemberCreate,
  DLMemberStatus,
  BroadcastNotification,
  BroadcastNotificationCreate,
  BroadcastTargetSummary,
  GeneralBodyMeeting,
  FestivalCelebration,
  CulturalEvent,
  UserRole,
  AppUser,
} from "../lib/types";
import * as api from "../lib/api";
import {
  Mail,
  Send,
  Users,
  UserPlus,
  FileSpreadsheet,
  Download,
  Upload,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle,
  Sparkles,
  Phone,
  MessageSquare,
  Copy,
  ExternalLink,
  Trash2,
  Edit2,
  RefreshCw,
  Clock,
  Shield,
  Layers,
  ChevronRight,
  Eye,
  Check,
  Smartphone,
  Calendar,
  Building2,
  Plus,
  AlertTriangle,
  Info,
  Share2,
} from "lucide-react";
import Modal from "./Modal";

interface DLNotificationGroupsTabProps {
  userRole?: UserRole;
  isGuest?: boolean;
  currentUser?: AppUser | null;
  gbmMeetings?: GeneralBodyMeeting[];
  festivals?: FestivalCelebration[];
  culturalEvents?: CulturalEvent[];
  onShowToast?: (message: string, type?: "success" | "error") => void;
}

export default function DLNotificationGroupsTab({
  userRole = "Super Admin",
  isGuest = false,
  currentUser = null,
  gbmMeetings = [],
  festivals = [],
  culturalEvents = [],
  onShowToast,
}: DLNotificationGroupsTabProps) {
  const canEdit = userRole === "Super Admin" || userRole === "Admin";

  // Data states
  const [groups, setGroups] = useState<DLGroup[]>([]);
  const [members, setMembers] = useState<DLMember[]>([]);
  const [broadcastHistory, setBroadcastHistory] = useState<BroadcastNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters and selections
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null); // null = All Groups
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All"); // All | Active | Inactive
  const [towerFilter, setTowerFilter] = useState<string>("All"); // All | Tower A-F | Clubhouse
  const [roleTagFilter, setRoleTagFilter] = useState<string>("All"); // All | Owner | Tenant | Committee
  const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([]);

  // Modals
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [isEditGroupModalOpen, setIsEditGroupModalOpen] = useState(false);
  const [groupToEdit, setGroupToEdit] = useState<DLGroup | null>(null);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [isEditMemberModalOpen, setIsEditMemberModalOpen] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState<DLMember | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isWhatsAppQueueModalOpen, setIsWhatsAppQueueModalOpen] = useState(false);

  // Forms
  const [groupForm, setGroupForm] = useState<DLGroupCreate>({
    group_name: "",
    group_code: "",
    description: "",
    category: "General",
    sender_email: "jaitra-association-hyd@googlegroups.com",
  });

  const [memberForm, setMemberForm] = useState<DLMemberCreate>({
    name: "",
    tower: "Tower A",
    flat_no: "",
    email: "",
    phone: "+91 ",
    status: "Active",
    role_tag: "Owner",
    notes: "",
  });
  const [memberFormGroupId, setMemberFormGroupId] = useState<number>(1);

  // Upload state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadTargetGroupId, setUploadTargetGroupId] = useState<number>(1);
  const [uploadMode, setUploadMode] = useState<"append" | "replace">("append");
  const [parsedPreviewRows, setParsedPreviewRows] = useState<any[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isParsingUpload, setIsParsingUpload] = useState(false);

  // Broadcast Composer Form
  const [broadcastForm, setBroadcastForm] = useState<{
    subject: string;
    category: string;
    channel: "Email" | "WhatsApp" | "SMS" | "Multi-Channel";
    sender_email: string;
    sender_name: string;
    targetGroupIds: number[];
    targetTower: string;
    message_body: string;
    event_or_meeting_ref: string;
    doc_link: string;
  }>({
    subject: "",
    category: "GBM Meeting",
    channel: "Email",
    sender_email: "jaitra-association-hyd@googlegroups.com",
    sender_name: "Jaitra Residents Welfare Association",
    targetGroupIds: [],
    targetTower: "All",
    message_body: "",
    event_or_meeting_ref: "",
    doc_link: "",
  });

  // Target summary calculation for broadcast
  const [targetSummary, setTargetSummary] = useState<BroadcastTargetSummary | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [activePreviewTab, setActivePreviewTab] = useState<"email" | "whatsapp" | "recipients">("email");

  // Load initial data
  const fetchData = async () => {
    try {
      setIsRefreshing(true);
      const [groupsData, membersData, historyData] = await Promise.all([
        api.getDLGroups().catch(() => []),
        api.getDLMembers().catch(() => []),
        api.getBroadcastHistory(50).catch(() => []),
      ]);
      setGroups(groupsData);
      setMembers(membersData);
      setBroadcastHistory(historyData);

      if (groupsData.length > 0 && !selectedGroupId) {
        // Set first group id as default for form
        setMemberFormGroupId(groupsData[0].id);
        setUploadTargetGroupId(groupsData[0].id);
      }
    } catch (err) {
      console.error("Error loading DL data:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toast = (msg: string, type: "success" | "error" = "success") => {
    if (onShowToast) onShowToast(msg, type);
  };

  // Copy helper
  const copyToClipboard = (text: string, label: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedType(label);
      toast(`Copied ${label} to clipboard!`);
      setTimeout(() => setCopiedType(null), 2500);
    }
  };

  // Filtered members
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      if (selectedGroupId && m.group_id !== selectedGroupId) return false;
      if (statusFilter !== "All" && m.status !== statusFilter) return false;
      if (towerFilter !== "All" && m.tower !== towerFilter) return false;
      if (roleTagFilter !== "All" && m.role_tag !== roleTagFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = m.name.toLowerCase().includes(q);
        const matchesEmail = m.email.toLowerCase().includes(q);
        const matchesPhone = m.phone.toLowerCase().includes(q);
        const matchesFlat = m.flat_no.toLowerCase().includes(q);
        const matchesTower = m.tower.toLowerCase().includes(q);
        if (!matchesName && !matchesEmail && !matchesPhone && !matchesFlat && !matchesTower) {
          return false;
        }
      }
      return true;
    });
  }, [members, selectedGroupId, statusFilter, towerFilter, roleTagFilter, searchQuery]);

  // Overall Statistics
  const overallStats = useMemo(() => {
    const totalMembers = members.length;
    const activeMembers = members.filter((m) => m.status === "Active").length;
    const inactiveMembers = members.filter((m) => m.status === "Inactive").length;
    const totalGroups = groups.length;
    return { totalMembers, activeMembers, inactiveMembers, totalGroups };
  }, [members, groups]);

  // Current selected group
  const currentGroup = useMemo(() => {
    if (!selectedGroupId) return null;
    return groups.find((g) => g.id === selectedGroupId) || null;
  }, [groups, selectedGroupId]);

  // Update target summary whenever broadcast modal selections change
  useEffect(() => {
    if (!isBroadcastModalOpen) return;

    const groupIdsToTarget =
      broadcastForm.targetGroupIds.length > 0
        ? broadcastForm.targetGroupIds
        : groups.map((g) => g.id);

    setIsLoadingSummary(true);
    api
      .getActiveRecipientsSummary(groupIdsToTarget, broadcastForm.targetTower)
      .then((summary) => {
        setTargetSummary(summary);
      })
      .catch((err) => {
        console.error("Error computing recipients summary:", err);
      })
      .finally(() => {
        setIsLoadingSummary(false);
      });
  }, [isBroadcastModalOpen, broadcastForm.targetGroupIds, broadcastForm.targetTower, groups]);

  // ----------------- GROUP HANDLERS -----------------
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupForm.group_name.trim()) {
      toast("Please enter a group name", "error");
      return;
    }
    try {
      const created = await api.createDLGroup(groupForm);
      setGroups([...groups, created]);
      setIsCreateGroupModalOpen(false);
      setGroupForm({
        group_name: "",
        group_code: "",
        description: "",
        category: "General",
        sender_email: "jaitra-association-hyd@googlegroups.com",
      });
      toast(`DL Group "${created.group_name}" created successfully!`);
      fetchData();
    } catch (err: any) {
      toast(err.message || "Failed to create DL group", "error");
    }
  };

  const handleUpdateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupToEdit) return;
    try {
      const updated = await api.updateDLGroup(groupToEdit.id, {
        group_name: groupToEdit.group_name,
        group_code: groupToEdit.group_code,
        description: groupToEdit.description,
        category: groupToEdit.category,
        sender_email: groupToEdit.sender_email,
      });
      setGroups(groups.map((g) => (g.id === updated.id ? updated : g)));
      setIsEditGroupModalOpen(false);
      setGroupToEdit(null);
      toast(`DL Group "${updated.group_name}" updated!`);
      fetchData();
    } catch (err: any) {
      toast(err.message || "Failed to update DL group", "error");
    }
  };

  const handleDeleteGroup = async (group: DLGroup) => {
    if (group.is_system) {
      toast("System default DL groups cannot be deleted.", "error");
      return;
    }
    if (!window.confirm(`Are you sure you want to delete DL Group "${group.group_name}" and its members?`)) {
      return;
    }
    try {
      await api.deleteDLGroup(group.id);
      setGroups(groups.filter((g) => g.id !== group.id));
      if (selectedGroupId === group.id) setSelectedGroupId(null);
      toast(`DL Group "${group.group_name}" deleted.`);
      fetchData();
    } catch (err: any) {
      toast(err.message || "Failed to delete DL group", "error");
    }
  };

  // ----------------- MEMBER HANDLERS -----------------
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberForm.name.trim() || !memberForm.email.trim()) {
      toast("Name and Email are required", "error");
      return;
    }
    try {
      const created = await api.createDLMember(memberFormGroupId, memberForm);
      setMembers([...members, created]);
      setIsAddMemberModalOpen(false);
      setMemberForm({
        name: "",
        tower: "Tower A",
        flat_no: "",
        email: "",
        phone: "+91 ",
        status: "Active",
        role_tag: "Owner",
        notes: "",
      });
      toast(`Added ${created.name} (${created.tower}-${created.flat_no}) to DL Group!`);
      fetchData();
    } catch (err: any) {
      toast(err.message || "Failed to add member", "error");
    }
  };

  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberToEdit) return;
    try {
      const updated = await api.updateDLMember(memberToEdit.id, {
        name: memberToEdit.name,
        tower: memberToEdit.tower,
        flat_no: memberToEdit.flat_no,
        email: memberToEdit.email,
        phone: memberToEdit.phone,
        status: memberToEdit.status,
        role_tag: memberToEdit.role_tag,
        notes: memberToEdit.notes,
        group_id: memberToEdit.group_id,
      });
      setMembers(members.map((m) => (m.id === updated.id ? updated : m)));
      setIsEditMemberModalOpen(false);
      setMemberToEdit(null);
      toast(`Updated details for ${updated.name}`);
      fetchData();
    } catch (err: any) {
      toast(err.message || "Failed to update member", "error");
    }
  };

  const handleToggleMemberStatus = async (member: DLMember) => {
    const newStatus: DLMemberStatus = member.status === "Active" ? "Inactive" : "Active";
    try {
      const updated = await api.updateDLMember(member.id, { status: newStatus });
      setMembers(members.map((m) => (m.id === updated.id ? { ...m, status: newStatus } : m)));
      toast(
        `${member.name} is now ${newStatus === "Active" ? "ACTIVE (will receive broadcasts)" : "INACTIVE (excluded from broadcasts)"}`
      );
      fetchData();
    } catch (err: any) {
      toast(err.message || "Failed to toggle status", "error");
    }
  };

  const handleDeleteMember = async (member: DLMember) => {
    if (!window.confirm(`Remove ${member.name} (${member.email}) from DL group?`)) return;
    try {
      await api.deleteDLMember(member.id);
      setMembers(members.filter((m) => m.id !== member.id));
      setSelectedMemberIds(selectedMemberIds.filter((id) => id !== member.id));
      toast(`Removed ${member.name} from DL group`);
      fetchData();
    } catch (err: any) {
      toast(err.message || "Failed to delete member", "error");
    }
  };

  // ----------------- BULK MEMBER ACTIONS -----------------
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedMemberIds(filteredMembers.map((m) => m.id));
    } else {
      setSelectedMemberIds([]);
    }
  };

  const handleSelectMember = (id: number) => {
    if (selectedMemberIds.includes(id)) {
      setSelectedMemberIds(selectedMemberIds.filter((mId) => mId !== id));
    } else {
      setSelectedMemberIds([...selectedMemberIds, id]);
    }
  };

  const handleBulkStatusChange = async (status: DLMemberStatus) => {
    if (selectedMemberIds.length === 0) return;
    try {
      await api.bulkUpdateDLMembersStatus(selectedMemberIds, status);
      setMembers(
        members.map((m) =>
          selectedMemberIds.includes(m.id) ? { ...m, status } : m
        )
      );
      toast(`Marked ${selectedMemberIds.length} members as ${status}`);
      setSelectedMemberIds([]);
      fetchData();
    } catch (err: any) {
      toast(err.message || "Bulk status update failed", "error");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedMemberIds.length === 0) return;
    if (!window.confirm(`Delete ${selectedMemberIds.length} selected member records permanently?`)) return;
    try {
      await api.bulkDeleteDLMembers(selectedMemberIds);
      setMembers(members.filter((m) => !selectedMemberIds.includes(m.id)));
      toast(`Deleted ${selectedMemberIds.length} members`);
      setSelectedMemberIds([]);
      fetchData();
    } catch (err: any) {
      toast(err.message || "Bulk delete failed", "error");
    }
  };

  // ----------------- EXCEL / CSV FILE IMPORT & EXPORT -----------------
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFile(file);
    setUploadError(null);
    setIsParsingUpload(true);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const rawData: any[] = XLSX.utils.sheet_to_json(ws);

        if (!rawData || rawData.length === 0) {
          setUploadError("The uploaded file appears to be empty.");
          setIsParsingUpload(false);
          return;
        }

        // Normalize columns
        const normalized = rawData.map((row: any, idx: number) => {
          const keys = Object.keys(row);
          const findKey = (patterns: string[]) => {
            return keys.find((k) =>
              patterns.some((p) => k.toLowerCase().replace(/[^a-z]/g, "").includes(p))
            );
          };

          const nameKey = findKey(["name", "resident", "member", "fullname"]);
          const towerKey = findKey(["tower", "wing", "block"]);
          const flatKey = findKey(["flat", "flatno", "unit", "door", "apt"]);
          const emailKey = findKey(["email", "mail", "emailid"]);
          const phoneKey = findKey(["phone", "mobile", "contact", "cell", "tel"]);
          const statusKey = findKey(["status", "active", "state"]);
          const roleKey = findKey(["role", "tag", "type", "occupant"]);

          const nameVal = nameKey ? String(row[nameKey]).trim() : `Resident ${idx + 1}`;
          let towerVal = towerKey ? String(row[towerKey]).trim() : "Tower A";
          if (!towerVal.toLowerCase().includes("tower") && !towerVal.toLowerCase().includes("clubhouse")) {
            if (/^[A-F]$/i.test(towerVal)) towerVal = `Tower ${towerVal.toUpperCase()}`;
          }
          const flatVal = flatKey ? String(row[flatKey]).trim() : "";
          const emailVal = emailKey ? String(row[emailKey]).trim().toLowerCase() : "";
          let phoneVal = phoneKey ? String(row[phoneKey]).trim() : "";
          if (phoneVal && !phoneVal.startsWith("+")) {
            phoneVal = phoneVal.startsWith("91") ? `+${phoneVal}` : `+91 ${phoneVal}`;
          }
          let statusVal: DLMemberStatus = "Active";
          if (statusKey) {
            const s = String(row[statusKey]).toLowerCase().trim();
            if (s === "inactive" || s === "no" || s === "0" || s === "false") {
              statusVal = "Inactive";
            }
          }
          const roleVal = roleKey ? String(row[roleKey]).trim() : "Owner";

          const isValid = Boolean(nameVal && emailVal && emailVal.includes("@"));

          return {
            name: nameVal,
            tower: towerVal || "Tower A",
            flat_no: flatVal,
            email: emailVal,
            phone: phoneVal || "+91 ",
            status: statusVal,
            role_tag: roleVal || "Owner",
            notes: "Imported via Excel/CSV",
            isValid,
          };
        });

        setParsedPreviewRows(normalized);
      } catch (err: any) {
        setUploadError(`Failed to parse file: ${err.message}`);
      } finally {
        setIsParsingUpload(false);
      }
    };
    reader.onerror = () => {
      setUploadError("File read error occurred.");
      setIsParsingUpload(false);
    };
    reader.readAsBinaryString(file);
  };

  const handleConfirmImport = async () => {
    const validRows = parsedPreviewRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      toast("No valid rows found in file (requires Name and valid Email)", "error");
      return;
    }
    try {
      const res = await api.bulkUploadDLMembers(uploadTargetGroupId, validRows, uploadMode);
      toast(
        `Successfully imported ${res.insertedCount} residents to DL Group!`,
        "success"
      );
      setIsUploadModalOpen(false);
      setUploadedFile(null);
      setParsedPreviewRows([]);
      fetchData();
    } catch (err: any) {
      toast(err.message || "Failed to import rows", "error");
    }
  };

  const handleDownloadSampleTemplate = () => {
    const sampleData = [
      {
        "Name": "Rajesh Sharma",
        "Tower": "Tower A",
        "Flat_No": "101",
        "Email": "rajesh.sharma@example.com",
        "Mobile": "+91 9845012345",
        "Status": "Active",
        "Role": "Owner"
      },
      {
        "Name": "Priya Varma",
        "Tower": "Tower B",
        "Flat_No": "402",
        "Email": "priya.varma@example.com",
        "Mobile": "+91 9845067890",
        "Status": "Active",
        "Role": "Tenant"
      },
      {
        "Name": "Anand Kulkarni",
        "Tower": "Tower C",
        "Flat_No": "1204",
        "Email": "anand.k@example.com",
        "Mobile": "+91 9741123456",
        "Status": "Inactive",
        "Role": "Owner"
      }
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "DL_Members_Sample");
    XLSX.writeFile(wb, "Jaitra_DL_Members_Sample_Template.xlsx");
    toast("Downloaded Jaitra DL Sample Template (.xlsx)");
  };

  const handleExportDL = () => {
    const dataToExport = filteredMembers.map((m) => ({
      "Name": m.name,
      "Tower": m.tower,
      "Flat_No": m.flat_no,
      "Email": m.email,
      "Mobile": m.phone,
      "Status": m.status,
      "Role": m.role_tag || "Owner",
      "Notes": m.notes || "",
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    const sheetTitle = currentGroup ? currentGroup.group_code : "All_DL_Members";
    XLSX.utils.book_append_sheet(wb, ws, sheetTitle);
    XLSX.writeFile(wb, `Jaitra_${sheetTitle}_Members.xlsx`);
    toast(`Exported ${dataToExport.length} members to Excel!`);
  };

  // ----------------- QUICK TEMPLATE POPULATORS FOR BROADCAST -----------------
  const handleApplyTemplate = (type: "gbm" | "festival" | "cultural" | "maintenance" | "emergency", item?: any) => {
    if (type === "gbm") {
      const gbm = item || gbmMeetings[0];
      if (gbm) {
        setBroadcastForm({
          ...broadcastForm,
          subject: `[GBM NOTICE] ${gbm.meeting_title} - ${gbm.meeting_date}`,
          category: "GBM Meeting",
          event_or_meeting_ref: `GBM: ${gbm.meeting_title} (${gbm.meeting_date})`,
          doc_link: gbm.doc_link || "",
          message_body: `Dear Jaitra Resident,\n\nYou are cordially invited to attend the upcoming ${gbm.meeting_type}: "${gbm.meeting_title}".\n\n📅 Date: ${gbm.meeting_date}\n⏰ Time: ${gbm.time}\n📍 Venue: ${gbm.venue}\n\n📋 Key Agenda:\n${gbm.key_agenda || "1. Financial Review\n2. Maintenance Updates\n3. Resident Questions"}\n\n📄 Quorum & Documents:\n${gbm.doc_link ? `Agenda Document Link: ${gbm.doc_link}` : "Documents shared on Association portal."}\n\nYour active participation and timely presence is kindly requested.\n\nWarm regards,\nManaging Committee\nJaitra Residents Welfare Association\nEmail: jaitra-association-hyd@googlegroups.com`,
        });
        toast("Loaded GBM meeting template!");
      } else {
        setBroadcastForm({
          ...broadcastForm,
          subject: "[GBM NOTICE] General Body Meeting Notification",
          category: "GBM Meeting",
          message_body: `Dear Jaitra Resident,\n\nPlease note that the General Body Meeting (GBM) has been scheduled.\n\n📅 Date: Upcoming Sunday\n⏰ Time: 10:30 AM\n📍 Venue: Clubhouse Grand Hall\n\nPlease find the agenda items on the portal.\n\nWarm regards,\nJaitra Residents Welfare Association\njaitra-association-hyd@googlegroups.com`,
        });
      }
    } else if (type === "festival") {
      const fest = item || festivals[0];
      if (fest) {
        setBroadcastForm({
          ...broadcastForm,
          subject: `🎉 [CELEBRATION] ${fest.festival_name} at Jaitra - ${fest.start_date}`,
          category: "Festival Celebration",
          event_or_meeting_ref: `Festival: ${fest.festival_name}`,
          message_body: `Dear Jaitra Family,\n\nWe are delighted to invite all residents to celebrate "${fest.festival_name}" in our community!\n\n📅 Dates: ${fest.start_date} to ${fest.end_date}\n📍 Location: ${fest.location}\n👤 Lead Coordinator: ${fest.lead_organizer}\n\n✨ Festival Highlights & Schedule:\n${fest.highlights || fest.description || "Grand Puja, cultural evening, food stalls, and community prasadam distribution."}\n\n💰 Voluntary Festival Contribution:\nResidents who wish to contribute towards puja and celebration expenses can do so via UPI / Association Desk.\n\nLet us come together to make this celebration memorable!\n\nWarm regards,\nFestival Organizing Committee\nJaitra Residents Welfare Association\njaitra-association-hyd@googlegroups.com`,
        });
        toast("Loaded Festival celebration template!");
      }
    } else if (type === "cultural") {
      const ce = item || culturalEvents[0];
      if (ce) {
        setBroadcastForm({
          ...broadcastForm,
          subject: `🎭 [CULTURAL EVENT] Registrations Open: ${ce.title} (${ce.category})`,
          category: "Cultural Event",
          event_or_meeting_ref: `Cultural Event: ${ce.title}`,
          message_body: `Dear Residents,\n\nWe are excited to announce our upcoming cultural program: "${ce.title}"!\n\n📅 Event Date: ${ce.event_date}\n⏰ Time: ${ce.time}\n📍 Venue: ${ce.venue}\n🎭 Category: ${ce.category}\n👤 Coordinator: ${ce.coordinator} (${ce.coordinator_contact || "Staff Desk"})\n\n📝 Details:\n${ce.description || "Registrations are open for dance, singing, games and stage performances."}\n\nResidents and children wishing to perform or volunteer, please register your participation on the Jaitra Portal.\n\nWarm regards,\nCultural Committee\nJaitra Residents Welfare Association\njaitra-association-hyd@googlegroups.com`,
        });
        toast("Loaded Cultural Event template!");
      }
    } else if (type === "maintenance") {
      setBroadcastForm({
        ...broadcastForm,
        subject: `⚠️ [MAINTENANCE ADVISORY] Planned Maintenance Notice`,
        category: "Maintenance Alert",
        message_body: `Dear Residents,\n\nPlease take note of the scheduled maintenance activity across our society.\n\n⚙️ Activity: Overhead Water Tank Cleaning & Elevator Servicing\n📅 Scheduled Date: Tomorrow\n⏰ Time Window: 10:00 AM - 04:00 PM\n🏢 Affected Areas: Towers A, B, C, D, E, F\n\n🚰 Advisory:\nPlease store sufficient water in advance. Inconvenience is deeply regretted.\n\nFor emergencies, contact Facility Desk: +91 98450 00111.\n\nFacility Management Team\nJaitra Residents Welfare Association\njaitra-association-hyd@googlegroups.com`,
      });
      toast("Loaded Maintenance alert template!");
    } else if (type === "emergency") {
      setBroadcastForm({
        ...broadcastForm,
        subject: `🚨 [URGENT NOTICE] Important Community Announcement`,
        category: "Emergency Alert",
        channel: "Multi-Channel",
        message_body: `🚨 URGENT COMMUNITY ALERT 🚨\n\nDear Jaitra Residents,\n\nPlease take immediate note of this priority update from the Association.\n\n[Please enter emergency details, power/water backup status, or security advisory here]\n\nEmergency Helpline: +91 98450 71001 / Security Gate: Ext 100\n\nJaitra Residents Welfare Association\njaitra-association-hyd@googlegroups.com`,
      });
      toast("Loaded Urgent Emergency template!");
    }
  };

  // ----------------- DISPATCH BROADCAST ACTIONS -----------------
  const handleOpenGmailWeb = () => {
    if (!targetSummary || targetSummary.emailsList.length === 0) {
      toast("No active recipients to send to!", "error");
      return;
    }
    const bccList = targetSummary.emailsList.join(",");
    const toEmail = encodeURIComponent("jaitra-association-hyd@googlegroups.com");
    const subject = encodeURIComponent(broadcastForm.subject);
    const body = encodeURIComponent(broadcastForm.message_body);
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${toEmail}&bcc=${encodeURIComponent(bccList)}&su=${subject}&body=${body}`;
    window.open(gmailUrl, "_blank");
    toast("Opened Gmail Web Compose with active BCC recipients!");
  };

  const handleOpenMailto = () => {
    if (!targetSummary || targetSummary.emailsList.length === 0) {
      toast("No active recipients to send to!", "error");
      return;
    }
    const bccList = targetSummary.emailsList.join(",");
    const toEmail = "jaitra-association-hyd@googlegroups.com";
    const subject = encodeURIComponent(broadcastForm.subject);
    const body = encodeURIComponent(broadcastForm.message_body);
    const mailtoUrl = `mailto:${toEmail}?bcc=${encodeURIComponent(bccList)}&subject=${subject}&body=${body}`;
    window.location.href = mailtoUrl;
    toast("Triggered system email client with active BCC recipients!");
  };

  const handleOpenMobileSMS = () => {
    if (!targetSummary || targetSummary.phonesList.length === 0) {
      toast("No active mobile numbers available", "error");
      return;
    }
    const phoneList = targetSummary.phonesList.map((p) => p.replace(/\s+/g, "")).join(",");
    const body = encodeURIComponent(`${broadcastForm.subject}\n\n${broadcastForm.message_body}`);
    const smsUrl = `sms:${phoneList}?body=${body}`;
    window.location.href = smsUrl;
    toast("Triggered Mobile SMS sender!");
  };

  const handleSaveAndBroadcast = async () => {
    if (!broadcastForm.subject.trim()) {
      toast("Please enter a subject line", "error");
      return;
    }
    if (!broadcastForm.message_body.trim()) {
      toast("Please enter the message body", "error");
      return;
    }
    if (!targetSummary || targetSummary.activeRecipientsCount === 0) {
      toast("There are 0 active recipients in the selected DL groups.", "error");
      return;
    }

    try {
      const selectedGNames = groups
        .filter((g) =>
          broadcastForm.targetGroupIds.length === 0
            ? true
            : broadcastForm.targetGroupIds.includes(g.id)
        )
        .map((g) => g.group_name)
        .join(", ");

      const payload: BroadcastNotificationCreate = {
        subject: broadcastForm.subject.trim(),
        category: broadcastForm.category,
        channel: broadcastForm.channel,
        sender_email: broadcastForm.sender_email || "jaitra-association-hyd@googlegroups.com",
        sender_name: broadcastForm.sender_name || "Jaitra Residents Welfare Association",
        group_ids: broadcastForm.targetGroupIds.join(","),
        group_names: selectedGNames,
        target_tower: broadcastForm.targetTower,
        active_recipients_count: targetSummary.activeRecipientsCount,
        total_target_count: targetSummary.totalTargetMembers,
        message_body: broadcastForm.message_body.trim(),
        event_or_meeting_ref: broadcastForm.event_or_meeting_ref,
        doc_link: broadcastForm.doc_link,
        sent_by: currentUser?.name || "Admin",
        status: "Dispatched",
      };

      const res = await api.sendBroadcastNotification(payload);
      toast(res.message || "Broadcast logged and dispatched successfully!", "success");
      setIsBroadcastModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast(err.message || "Failed to broadcast notification", "error");
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* ----------------- TOP CONTROLS & STATS BAR ----------------- */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-gradient-to-tr from-sky-600 to-indigo-600 rounded-2xl shadow-lg shadow-sky-600/30 text-white">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  Distribution Lists (DL) &amp; Notification Broadcaster
                </h1>
                <p className="text-xs sm:text-sm text-slate-400">
                  Manage resident mailing lists, bulk upload excel rosters &amp; dispatch notifications via{" "}
                  <span className="text-sky-300 font-mono font-bold bg-sky-950/80 px-2 py-0.5 rounded border border-sky-800/80">
                    jaitra-association-hyd@googlegroups.com
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {canEdit && (
              <>
                <button
                  onClick={() => {
                    handleApplyTemplate("gbm");
                    setIsBroadcastModalOpen(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm rounded-2xl shadow-lg shadow-emerald-600/30 border border-emerald-400/40 transition transform active:scale-95"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Broadcast / Notification</span>
                </button>

                <button
                  onClick={() => setIsUploadModalOpen(true)}
                  className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-sky-300 hover:text-white font-bold text-xs rounded-2xl border border-sky-800/50 shadow-md transition"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <span>Upload Excel / CSV</span>
                </button>

                <button
                  onClick={() => setIsAddMemberModalOpen(true)}
                  className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-2xl border border-slate-700 shadow-md transition"
                >
                  <UserPlus className="w-4 h-4 text-sky-400" />
                  <span>Add Member</span>
                </button>

                <button
                  onClick={() => setIsCreateGroupModalOpen(true)}
                  className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-2xl border border-slate-700 shadow-md transition"
                >
                  <Plus className="w-4 h-4 text-amber-400" />
                  <span>New DL Group</span>
                </button>
              </>
            )}

            <button
              onClick={() => setIsHistoryModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-2xl border border-slate-700 transition"
              title="View past notification logs"
            >
              <Clock className="w-4 h-4 text-violet-400" />
              <span>Broadcast History ({broadcastHistory.length})</span>
            </button>

            <button
              onClick={fetchData}
              disabled={isRefreshing}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl border border-slate-700 transition"
              title="Refresh DL Data"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-sky-400" : ""}`} />
            </button>
          </div>
        </div>

        {/* Live Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-800">
          <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total DL Groups</p>
              <p className="text-xl font-black text-white">{overallStats.totalGroups}</p>
            </div>
            <Layers className="w-6 h-6 text-sky-400/70" />
          </div>

          <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Registered</p>
              <p className="text-xl font-black text-slate-200">{overallStats.totalMembers}</p>
            </div>
            <Users className="w-6 h-6 text-indigo-400/70" />
          </div>

          <div className="bg-emerald-950/40 p-3 rounded-2xl border border-emerald-800/50 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Active in DL (Targeted)</p>
              <p className="text-xl font-black text-emerald-300">{overallStats.activeMembers}</p>
            </div>
            <CheckCircle className="w-6 h-6 text-emerald-400" />
          </div>

          <div className="bg-rose-950/30 p-3 rounded-2xl border border-rose-900/40 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-rose-400 uppercase tracking-wider">Inactive (Excluded)</p>
              <p className="text-xl font-black text-rose-300">{overallStats.inactiveMembers}</p>
            </div>
            <XCircle className="w-6 h-6 text-rose-400/70" />
          </div>
        </div>
      </div>

      {/* ----------------- DL GROUPS CAROUSEL / CARDS ----------------- */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-sky-400" />
            <span>Select DL Group / Distribution List</span>
          </h2>
          <span className="text-xs text-slate-400">
            {selectedGroupId ? "Showing members of selected group" : "Showing all DL members"}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {/* All Groups Card */}
          <button
            onClick={() => setSelectedGroupId(null)}
            className={`p-3.5 rounded-2xl text-left border transition-all duration-200 relative overflow-hidden flex flex-col justify-between ${
              selectedGroupId === null
                ? "bg-gradient-to-br from-indigo-900/90 via-slate-900 to-slate-950 border-indigo-400/70 shadow-lg shadow-indigo-600/20 ring-1 ring-indigo-400/40"
                : "bg-slate-900/80 hover:bg-slate-800/90 border-slate-800 text-slate-300"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="px-2 py-0.5 text-[10px] font-black rounded-lg bg-indigo-950 text-indigo-300 border border-indigo-800">
                  ALL GROUPS
                </span>
                <span className="text-xs font-mono font-bold text-slate-400">
                  {overallStats.totalMembers} total
                </span>
              </div>
              <p className="font-extrabold text-sm text-white">All Distribution Lists Combined</p>
              <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                Full roster of all society members across towers A-F
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                {overallStats.activeMembers} Active
              </span>
              <span className="text-slate-400 text-[11px]">Click to view all</span>
            </div>
          </button>

          {/* Individual DL Group Cards */}
          {groups.map((group) => {
            const isSelected = selectedGroupId === group.id;
            const activeCnt = group.active_members ?? 0;
            const totalCnt = group.total_members ?? 0;
            const pct = totalCnt > 0 ? Math.round((activeCnt / totalCnt) * 100) : 0;

            return (
              <div
                key={group.id}
                onClick={() => setSelectedGroupId(group.id)}
                className={`p-3.5 rounded-2xl text-left border transition-all duration-200 cursor-pointer relative flex flex-col justify-between group ${
                  isSelected
                    ? "bg-gradient-to-br from-sky-950/90 via-slate-900 to-slate-950 border-sky-400/80 shadow-lg shadow-sky-600/20 ring-1 ring-sky-400/40"
                    : "bg-slate-900/80 hover:bg-slate-800/90 border-slate-800 text-slate-300"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="px-2 py-0.5 text-[10px] font-black rounded-lg bg-sky-950 text-sky-300 border border-sky-800 font-mono">
                      {group.group_code}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-bold">
                      {group.category}
                    </span>
                  </div>
                  <p className="font-extrabold text-sm text-white group-hover:text-sky-300 transition line-clamp-1">
                    {group.group_name}
                  </p>
                  <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                    {group.description || "Active members list"}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-800/80">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      {activeCnt} Active ({pct}%)
                    </span>
                    <span className="text-slate-400 font-mono text-[11px]">
                      {totalCnt} total
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  {/* Group Action Buttons (Edit / Delete) */}
                  {canEdit && (
                    <div className="flex items-center justify-end gap-1.5 mt-2 pt-1 border-t border-slate-800/60">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setBroadcastForm({
                            ...broadcastForm,
                            targetGroupIds: [group.id],
                          });
                          setIsBroadcastModalOpen(true);
                        }}
                        className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 hover:bg-emerald-900 transition flex items-center gap-1 border border-emerald-800/60"
                        title="Broadcast strictly to active members of this group"
                      >
                        <Send className="w-2.5 h-2.5" />
                        <span>Send to DL</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setGroupToEdit(group);
                          setIsEditGroupModalOpen(true);
                        }}
                        className="p-1 hover:text-sky-300 text-slate-400 transition"
                        title="Edit group details"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>

                      {!group.is_system && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteGroup(group);
                          }}
                          className="p-1 hover:text-rose-400 text-slate-400 transition"
                          title="Delete group"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ----------------- MEMBERS TABLE & TOOLBAR ----------------- */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
        {/* Table Filter Toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, mobile, flat (e.g. 101, 1204)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Filters: Status, Tower, Role */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-slate-200 focus:outline-none focus:border-sky-500"
            >
              <option value="All">Status: All</option>
              <option value="Active">Status: Active Only</option>
              <option value="Inactive">Status: Inactive Only</option>
            </select>

            {/* Tower Filter */}
            <select
              value={towerFilter}
              onChange={(e) => setTowerFilter(e.target.value)}
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-slate-200 focus:outline-none focus:border-sky-500"
            >
              <option value="All">Tower: All Towers</option>
              <option value="Tower A">Tower A</option>
              <option value="Tower B">Tower B</option>
              <option value="Tower C">Tower C</option>
              <option value="Tower D">Tower D</option>
              <option value="Tower E">Tower E</option>
              <option value="Tower F">Tower F</option>
              <option value="Clubhouse">Clubhouse</option>
              <option value="Common Space">Common Space</option>
            </select>

            {/* Role Filter */}
            <select
              value={roleTagFilter}
              onChange={(e) => setRoleTagFilter(e.target.value)}
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-slate-200 focus:outline-none focus:border-sky-500"
            >
              <option value="All">Role: All</option>
              <option value="Owner">Owner</option>
              <option value="Tenant">Tenant</option>
              <option value="Committee">Committee</option>
              <option value="Volunteer">Volunteer</option>
            </select>

            {/* Export DL to Excel */}
            <button
              onClick={handleExportDL}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 transition"
              title="Download filtered members list to Excel"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Bulk Action Bar (when members are selected) */}
        {selectedMemberIds.length > 0 && canEdit && (
          <div className="bg-indigo-950/70 border border-indigo-700/60 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-2 animate-fadeIn">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-black text-xs flex items-center justify-center">
                {selectedMemberIds.length}
              </span>
              <span className="text-xs font-bold text-indigo-200">
                members selected for bulk operations
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBulkStatusChange("Active")}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow transition flex items-center gap-1"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Mark Active</span>
              </button>

              <button
                onClick={() => handleBulkStatusChange("Inactive")}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-rose-300 text-xs font-bold rounded-xl border border-rose-900/60 transition flex items-center gap-1"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Mark Inactive</span>
              </button>

              <button
                onClick={() => {
                  const selectedActive = members.filter(
                    (m) => selectedMemberIds.includes(m.id) && m.status === "Active"
                  );
                  const emails = selectedActive.map((m) => m.email).join(",");
                  copyToClipboard(emails, `${selectedActive.length} Selected Active Emails`);
                }}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs font-bold rounded-xl border border-slate-700 transition flex items-center gap-1"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Active Emails</span>
              </button>

              <button
                onClick={handleBulkDelete}
                className="px-3 py-1.5 bg-rose-900/80 hover:bg-rose-800 text-rose-200 text-xs font-bold rounded-xl transition flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Selected</span>
              </button>
            </div>
          </div>
        )}

        {/* Member List Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950 text-slate-400 font-extrabold border-b border-slate-800">
                {canEdit && (
                  <th className="p-3 w-10 text-center">
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={
                        filteredMembers.length > 0 &&
                        selectedMemberIds.length === filteredMembers.length
                      }
                      className="rounded border-slate-700 text-sky-500 focus:ring-0"
                    />
                  </th>
                )}
                <th className="p-3 font-extrabold text-slate-200">Resident Name</th>
                <th className="p-3 font-extrabold text-slate-200">Tower &amp; Flat</th>
                <th className="p-3 font-extrabold text-slate-200">Email ID (DL Address)</th>
                <th className="p-3 font-extrabold text-slate-200">Mobile Phone</th>
                <th className="p-3 font-extrabold text-slate-200">Status (Active / Inactive)</th>
                <th className="p-3 font-extrabold text-slate-200">Role Tag</th>
                <th className="p-3 text-right font-extrabold text-slate-200">Direct Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    <div className="max-w-md mx-auto space-y-2">
                      <Users className="w-8 h-8 text-slate-600 mx-auto" />
                      <p className="font-bold text-slate-400">No members match your criteria</p>
                      <p className="text-xs text-slate-500">
                        Try clearing filters or add members via manual form / Excel upload.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => {
                  const isSelected = selectedMemberIds.includes(member.id);
                  const isActive = member.status === "Active";

                  return (
                    <tr
                      key={member.id}
                      className={`hover:bg-slate-800/50 transition-colors ${
                        isSelected ? "bg-indigo-950/30" : ""
                      }`}
                    >
                      {canEdit && (
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectMember(member.id)}
                            className="rounded border-slate-700 text-sky-500 focus:ring-0"
                          />
                        </td>
                      )}

                      {/* Name & Avatar */}
                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-indigo-800 to-slate-900 border border-indigo-700 flex items-center justify-center text-white font-black text-xs shadow-xs">
                            {member.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-100">{member.name}</p>
                            {member.notes && (
                              <p className="text-[10px] text-slate-500 line-clamp-1">{member.notes}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Tower & Flat */}
                      <td className="p-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold bg-slate-950 border border-slate-800 text-slate-200">
                          <Building2 className="w-3 h-3 text-sky-400" />
                          <span>
                            {member.tower} {member.flat_no ? `• Flat ${member.flat_no}` : ""}
                          </span>
                        </span>
                      </td>

                      {/* Email ID */}
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-slate-300 selection:bg-sky-500">
                            {member.email}
                          </span>
                          <button
                            onClick={() => copyToClipboard(member.email, member.email)}
                            className="p-1 hover:text-sky-300 text-slate-500 transition"
                            title="Copy email"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </td>

                      {/* Mobile */}
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-slate-300">{member.phone || "—"}</span>
                          {member.phone && (
                            <button
                              onClick={() => copyToClipboard(member.phone, member.phone)}
                              className="p-1 hover:text-emerald-300 text-slate-500 transition"
                              title="Copy mobile number"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Status Toggle Button */}
                      <td className="p-3">
                        {canEdit ? (
                          <button
                            type="button"
                            onClick={() => handleToggleMemberStatus(member)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold border transition shadow-xs cursor-pointer ${
                              isActive
                                ? "bg-emerald-950 text-emerald-300 border-emerald-700/80 hover:bg-emerald-900"
                                : "bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-900"
                            }`}
                            title="Click to toggle Active / Inactive"
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${
                                isActive ? "bg-emerald-400 animate-pulse" : "bg-slate-600"
                              }`}
                            />
                            <span>{isActive ? "Active (Receives Mails)" : "Inactive (Skipped)"}</span>
                          </button>
                        ) : (
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                              isActive
                                ? "bg-emerald-950 text-emerald-300 border-emerald-700"
                                : "bg-slate-950 text-slate-400 border-slate-800"
                            }`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${
                                isActive ? "bg-emerald-400" : "bg-slate-600"
                              }`}
                            />
                            <span>{member.status}</span>
                          </span>
                        )}
                      </td>

                      {/* Role Tag */}
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                          {member.role_tag || "Owner"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* WhatsApp Direct */}
                          {member.phone && (
                            <a
                              href={`https://wa.me/${member.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                                `Hello ${member.name}, Greetings from Jaitra Residents Welfare Association.`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-400 rounded-lg border border-emerald-800/80 transition"
                              title="Chat on WhatsApp"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </a>
                          )}

                          {/* Email Direct */}
                          <a
                            href={`mailto:${member.email}?subject=Jaitra%20Residents%20Association`}
                            className="p-1.5 bg-sky-950/80 hover:bg-sky-900 text-sky-400 rounded-lg border border-sky-800/80 transition"
                            title="Send Email"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </a>

                          {/* Edit / Delete */}
                          {canEdit && (
                            <>
                              <button
                                onClick={() => {
                                  setMemberToEdit(member);
                                  setIsEditMemberModalOpen(true);
                                }}
                                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition"
                                title="Edit member details"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handleDeleteMember(member)}
                                className="p-1.5 bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 rounded-lg border border-slate-700 transition"
                                title="Delete member"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ----------------- BROADCAST NOTIFICATION COMPOSER MODAL ----------------- */}
      <Modal
        isOpen={isBroadcastModalOpen}
        onClose={() => setIsBroadcastModalOpen(false)}
        title="Dispatch Notification & Broadcast"
        maxWidth="2xl"
      >
        <div className="space-y-5 text-xs text-slate-200 max-h-[80vh] overflow-y-auto pr-1">
          {/* Official Sender Banner */}
          <div className="bg-gradient-to-r from-sky-950/90 via-slate-900 to-indigo-950/90 border border-sky-700/60 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
            <div>
              <p className="text-[11px] font-bold text-sky-300 uppercase tracking-wider">Official Sender Mail ID</p>
              <p className="text-sm font-mono font-black text-white flex items-center gap-1.5 mt-0.5">
                <Mail className="w-4 h-4 text-sky-400" />
                <span>jaitra-association-hyd@googlegroups.com</span>
              </p>
            </div>
            <div className="px-3 py-1 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-300">
              <span className="text-slate-400">Sender Alias: </span>
              <span className="font-bold text-white">Jaitra Residents Welfare Association</span>
            </div>
          </div>

          {/* Quick Template Selector */}
          <div className="space-y-2">
            <label className="font-extrabold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Quick-Load Content Templates (1-Click Auto Fill)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleApplyTemplate("gbm")}
                className="px-3 py-1.5 rounded-xl bg-sky-950 hover:bg-sky-900 text-sky-200 border border-sky-700/80 font-bold transition flex items-center gap-1"
              >
                <Calendar className="w-3.5 h-3.5 text-sky-400" />
                <span>GBM Meeting Notice</span>
              </button>

              <button
                type="button"
                onClick={() => handleApplyTemplate("festival")}
                className="px-3 py-1.5 rounded-xl bg-amber-950 hover:bg-amber-900 text-amber-200 border border-amber-700/80 font-bold transition flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Festival Celebration</span>
              </button>

              <button
                type="button"
                onClick={() => handleApplyTemplate("cultural")}
                className="px-3 py-1.5 rounded-xl bg-indigo-950 hover:bg-indigo-900 text-indigo-200 border border-indigo-700/80 font-bold transition flex items-center gap-1"
              >
                <Users className="w-3.5 h-3.5 text-indigo-400" />
                <span>Cultural Event Notice</span>
              </button>

              <button
                type="button"
                onClick={() => handleApplyTemplate("maintenance")}
                className="px-3 py-1.5 rounded-xl bg-teal-950 hover:bg-teal-900 text-teal-200 border border-teal-700/80 font-bold transition flex items-center gap-1"
              >
                <Building2 className="w-3.5 h-3.5 text-teal-400" />
                <span>Maintenance Advisory</span>
              </button>

              <button
                type="button"
                onClick={() => handleApplyTemplate("emergency")}
                className="px-3 py-1.5 rounded-xl bg-rose-950 hover:bg-rose-900 text-rose-200 border border-rose-700/80 font-bold transition flex items-center gap-1"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span>Urgent Emergency</span>
              </button>
            </div>
          </div>

          {/* Target DL Groups & Active Audience Box */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="font-extrabold text-slate-200 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-400" />
                <span>Target Distribution Lists (Strict Active Filter)</span>
              </label>

              {/* Tower Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 text-[11px]">Tower Filter:</span>
                <select
                  value={broadcastForm.targetTower}
                  onChange={(e) =>
                    setBroadcastForm({ ...broadcastForm, targetTower: e.target.value })
                  }
                  className="px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                >
                  <option value="All">All Towers (A-F)</option>
                  <option value="Tower A">Tower A Only</option>
                  <option value="Tower B">Tower B Only</option>
                  <option value="Tower C">Tower C Only</option>
                  <option value="Tower D">Tower D Only</option>
                  <option value="Tower E">Tower E Only</option>
                  <option value="Tower F">Tower F Only</option>
                </select>
              </div>
            </div>

            {/* Group Selection Checkboxes */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {groups.map((group) => {
                const isChecked =
                  broadcastForm.targetGroupIds.length === 0 ||
                  broadcastForm.targetGroupIds.includes(group.id);

                return (
                  <label
                    key={group.id}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-xs cursor-pointer transition ${
                      isChecked
                        ? "bg-indigo-950/50 border-indigo-600/70 text-white"
                        : "bg-slate-900 border-slate-800 text-slate-400"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={broadcastForm.targetGroupIds.includes(group.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setBroadcastForm({
                            ...broadcastForm,
                            targetGroupIds: [...broadcastForm.targetGroupIds, group.id],
                          });
                        } else {
                          setBroadcastForm({
                            ...broadcastForm,
                            targetGroupIds: broadcastForm.targetGroupIds.filter((id) => id !== group.id),
                          });
                        }
                      }}
                      className="rounded border-slate-700 text-indigo-500"
                    />
                    <span className="font-bold truncate">{group.group_name}</span>
                  </label>
                );
              })}
            </div>

            {/* Target Audience Result Pill */}
            {isLoadingSummary ? (
              <div className="p-3 bg-slate-900 rounded-xl flex items-center justify-center gap-2 text-slate-400">
                <RefreshCw className="w-4 h-4 animate-spin text-sky-400" />
                <span>Computing active recipient count...</span>
              </div>
            ) : targetSummary ? (
              <div className="bg-emerald-950/60 border border-emerald-700/70 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <p className="font-extrabold text-emerald-200">
                      Targeting <span className="text-white text-sm font-black">{targetSummary.activeRecipientsCount} Active</span> Members
                    </p>
                    <p className="text-[11px] text-emerald-400/80">
                      {targetSummary.inactiveExcludedCount} Inactive members automatically excluded from broadcast
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(targetSummary.emailsList.join(", "), "All Active BCC Emails")
                    }
                    className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-sky-300 font-bold rounded-lg border border-slate-700 flex items-center gap-1"
                    title="Copy comma-separated active email IDs"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copy Emails</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(targetSummary.phonesList.join(", "), "All Active Mobile Phones")
                    }
                    className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-emerald-300 font-bold rounded-lg border border-slate-700 flex items-center gap-1"
                    title="Copy comma-separated active phone numbers"
                  >
                    <Phone className="w-3 h-3" />
                    <span>Copy Phones</span>
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          {/* Subject & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <label className="font-bold text-slate-300">Email Subject / Message Title *</label>
              <input
                type="text"
                value={broadcastForm.subject}
                onChange={(e) => setBroadcastForm({ ...broadcastForm, subject: e.target.value })}
                placeholder="e.g. [GBM MEETING NOTICE] Annual General Body Meeting 2025"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500 font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-300">Category</label>
              <select
                value={broadcastForm.category}
                onChange={(e) => setBroadcastForm({ ...broadcastForm, category: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-bold"
              >
                <option value="GBM Meeting">GBM Meeting</option>
                <option value="Festival Celebration">Festival Celebration</option>
                <option value="Cultural Event">Cultural Event</option>
                <option value="Maintenance Alert">Maintenance Alert</option>
                <option value="General Notice">General Notice</option>
                <option value="Emergency Alert">Emergency Alert</option>
              </select>
            </div>
          </div>

          {/* Message Body Composer */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-300">Message Body (Email &amp; WhatsApp Formatted) *</label>
              <span className="text-[11px] text-slate-500">Supports emojis, line breaks, bullet points</span>
            </div>
            <textarea
              rows={8}
              value={broadcastForm.message_body}
              onChange={(e) => setBroadcastForm({ ...broadcastForm, message_body: e.target.value })}
              placeholder="Type notification message here..."
              className="w-full p-3.5 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-slate-100 font-sans leading-relaxed focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Document / Link Attachment */}
          <div className="space-y-1">
            <label className="font-bold text-slate-300">Attachment / Document Link (Optional)</label>
            <input
              type="text"
              value={broadcastForm.doc_link}
              onChange={(e) => setBroadcastForm({ ...broadcastForm, doc_link: e.target.value })}
              placeholder="https://drive.google.com/... or PDF document circular link"
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono"
            />
          </div>

          {/* Multi-Channel Provision Dispatch Buttons */}
          <div className="pt-3 border-t border-slate-800 space-y-3">
            <p className="font-extrabold text-xs text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Share2 className="w-4 h-4 text-sky-400" />
              <span>Multi-Channel Dispatch Provisions</span>
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* 1. Gmail Web Provision */}
              <button
                type="button"
                onClick={handleOpenGmailWeb}
                className="p-3 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-600/20 border border-red-400/40 transition active:scale-95"
              >
                <Mail className="w-4 h-4" />
                <span>Open in Gmail Web (BCC)</span>
              </button>

              {/* 2. WhatsApp Mobile Dispatcher Queue */}
              <button
                type="button"
                onClick={() => setIsWhatsAppQueueModalOpen(true)}
                className="p-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 border border-emerald-400/40 transition active:scale-95"
              >
                <MessageSquare className="w-4 h-4" />
                <span>WhatsApp Dispatcher Queue</span>
              </button>

              {/* 3. Mobile SMS Sender */}
              <button
                type="button"
                onClick={handleOpenMobileSMS}
                className="p-3 rounded-2xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-600/20 border border-sky-400/40 transition active:scale-95"
              >
                <Smartphone className="w-4 h-4" />
                <span>Mobile SMS Dispatcher</span>
              </button>
            </div>

            {/* Save & Log to Database Button */}
            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={handleOpenMailto}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl border border-slate-700 transition"
              >
                Open Default Mail Client
              </button>

              <button
                type="button"
                onClick={handleSaveAndBroadcast}
                className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black rounded-2xl shadow-lg shadow-indigo-600/30 border border-indigo-400/50 transition flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Record Broadcast Log &amp; Complete</span>
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* ----------------- WHATSAPP SENDER QUEUE MODAL ----------------- */}
      <Modal
        isOpen={isWhatsAppQueueModalOpen}
        onClose={() => setIsWhatsAppQueueModalOpen(false)}
        title="WhatsApp Mobile Sender Dispatcher"
        maxWidth="xl"
      >
        <div className="space-y-4 text-xs text-slate-200 max-h-[75vh] overflow-y-auto">
          <div className="p-3 bg-emerald-950/60 border border-emerald-800/70 rounded-2xl flex items-center justify-between gap-3">
            <div>
              <p className="font-extrabold text-emerald-200">WhatsApp 1-Click Mobile Dispatcher</p>
              <p className="text-[11px] text-emerald-400/80">
                Click "Send" next to each active resident to dispatch directly via WhatsApp Web or Phone.
              </p>
            </div>

            <button
              onClick={() =>
                copyToClipboard(
                  `*${broadcastForm.subject}*\n\n${broadcastForm.message_body}`,
                  "WhatsApp Formatted Text"
                )
              }
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl shadow flex items-center gap-1.5 shrink-0"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Message</span>
            </button>
          </div>

          <div className="space-y-2">
            {!targetSummary || targetSummary.activeRecipients.length === 0 ? (
              <p className="text-center py-6 text-slate-500">No active mobile recipients found.</p>
            ) : (
              targetSummary.activeRecipients
                .filter((r) => r.phone && r.phone.replace(/[^0-9]/g, "").length >= 10)
                .map((r, idx) => {
                  const cleanPhone = r.phone.replace(/[^0-9]/g, "");
                  const msg = `*${broadcastForm.subject}*\n\nDear ${r.name} (${r.tower} ${r.flat_no}),\n\n${broadcastForm.message_body}`;
                  const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;

                  return (
                    <div
                      key={idx}
                      className="p-3 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between gap-3 hover:border-emerald-700/60 transition"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-slate-800 font-mono text-slate-400 flex items-center justify-center text-[10px] font-bold">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="font-bold text-white">
                            {r.name}{" "}
                            <span className="text-slate-400 font-normal">
                              ({r.tower} {r.flat_no ? `• ${r.flat_no}` : ""})
                            </span>
                          </p>
                          <p className="text-[11px] font-mono text-emerald-400">{r.phone}</p>
                        </div>
                      </div>

                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 shadow transition"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Send WhatsApp</span>
                      </a>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      </Modal>

      {/* ----------------- EXCEL / CSV UPLOAD MODAL ----------------- */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Upload Resident List via Excel (.xlsx) / CSV Sheet"
        maxWidth="xl"
      >
        <div className="space-y-4 text-xs text-slate-200">
          {/* Instructions & Template Download */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="font-bold text-white">Required Sheet Columns:</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                <span className="font-mono text-sky-300 font-bold">Name, Tower, Flat_No, Email, Mobile, Status, Role</span>
              </p>
            </div>
            <button
              type="button"
              onClick={handleDownloadSampleTemplate}
              className="px-3.5 py-2 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 font-bold rounded-xl border border-emerald-800/80 flex items-center gap-1.5 shadow shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>Download Sample Template (.xlsx)</span>
            </button>
          </div>

          {/* Target Group & Mode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-300">Target DL Group *</label>
              <select
                value={uploadTargetGroupId}
                onChange={(e) => setUploadTargetGroupId(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-bold"
              >
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.group_name} ({g.group_code})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-300">Import Mode</label>
              <select
                value={uploadMode}
                onChange={(e) => setUploadMode(e.target.value as any)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-bold"
              >
                <option value="append">Append to existing members</option>
                <option value="replace">Replace all members in group</option>
              </select>
            </div>
          </div>

          {/* File Drag & Drop Dropzone */}
          <div className="border-2 border-dashed border-slate-700 hover:border-sky-500 rounded-2xl p-6 text-center bg-slate-950/60 transition cursor-pointer">
            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload-dl"
            />
            <label htmlFor="file-upload-dl" className="cursor-pointer block space-y-2">
              <Upload className="w-8 h-8 text-sky-400 mx-auto" />
              <p className="font-bold text-sm text-white">
                {uploadedFile ? uploadedFile.name : "Click or drag Excel / CSV file here"}
              </p>
              <p className="text-[11px] text-slate-500">Supports .xlsx, .xls, .csv sheets up to 10MB</p>
            </label>
          </div>

          {uploadError && (
            <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400" />
              <span>{uploadError}</span>
            </div>
          )}

          {/* Parsed Preview Table */}
          {parsedPreviewRows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-400">
                  ✓ Found {parsedPreviewRows.filter((r) => r.isValid).length} valid rows
                </span>
                <span className="text-slate-400">
                  Total rows in file: {parsedPreviewRows.length}
                </span>
              </div>

              <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950">
                <table className="w-full text-left text-[11px]">
                  <thead>
                    <tr className="bg-slate-900 border-b border-slate-800 text-slate-400">
                      <th className="p-2">Name</th>
                      <th className="p-2">Tower</th>
                      <th className="p-2">Flat</th>
                      <th className="p-2">Email</th>
                      <th className="p-2">Mobile</th>
                      <th className="p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {parsedPreviewRows.slice(0, 15).map((row, idx) => (
                      <tr key={idx} className={row.isValid ? "" : "bg-rose-950/20 text-rose-300"}>
                        <td className="p-2 font-bold">{row.name}</td>
                        <td className="p-2">{row.tower}</td>
                        <td className="p-2 font-mono">{row.flat_no}</td>
                        <td className="p-2 font-mono">{row.email}</td>
                        <td className="p-2 font-mono">{row.phone}</td>
                        <td className="p-2">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              row.status === "Active"
                                ? "bg-emerald-950 text-emerald-300"
                                : "bg-slate-800 text-slate-400"
                            }`}
                          >
                            {row.status}
                          </span>
                        </td>
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
              onClick={() => setIsUploadModalOpen(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={parsedPreviewRows.length === 0}
              onClick={handleConfirmImport}
              className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs rounded-xl shadow disabled:opacity-50"
            >
              Confirm &amp; Import to DL Group
            </button>
          </div>
        </div>
      </Modal>

      {/* ----------------- ADD MEMBER MODAL ----------------- */}
      <Modal
        isOpen={isAddMemberModalOpen}
        onClose={() => setIsAddMemberModalOpen(false)}
        title="Add Resident to Distribution List (DL)"
        maxWidth="md"
      >
        <form onSubmit={handleAddMember} className="space-y-4 text-xs text-slate-200">
          <div className="space-y-1">
            <label className="font-bold text-slate-300">Target DL Group *</label>
            <select
              value={memberFormGroupId}
              onChange={(e) => setMemberFormGroupId(parseInt(e.target.value, 10))}
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-bold"
            >
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.group_name} ({g.group_code})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-300">Resident Name *</label>
            <input
              type="text"
              required
              value={memberForm.name}
              onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
              placeholder="e.g. Rajesh Sharma"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-300">Tower *</label>
              <select
                value={memberForm.tower}
                onChange={(e) => setMemberForm({ ...memberForm, tower: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
              >
                <option value="Tower A">Tower A</option>
                <option value="Tower B">Tower B</option>
                <option value="Tower C">Tower C</option>
                <option value="Tower D">Tower D</option>
                <option value="Tower E">Tower E</option>
                <option value="Tower F">Tower F</option>
                <option value="Clubhouse">Clubhouse</option>
                <option value="Common Space">Common Space</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-300">Flat No (e.g. 101, 1204)</label>
              <input
                type="text"
                value={memberForm.flat_no}
                onChange={(e) => setMemberForm({ ...memberForm, flat_no: e.target.value })}
                placeholder="101"
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-300">Email ID (DL Recipient) *</label>
              <input
                type="email"
                required
                value={memberForm.email}
                onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
                placeholder="rajesh@example.com"
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-300">Mobile Phone (WhatsApp)</label>
              <input
                type="text"
                value={memberForm.phone}
                onChange={(e) => setMemberForm({ ...memberForm, phone: e.target.value })}
                placeholder="+91 98450 12345"
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-300">Status *</label>
              <select
                value={memberForm.status}
                onChange={(e) => setMemberForm({ ...memberForm, status: e.target.value as any })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-emerald-400"
              >
                <option value="Active">Active (Receives Broadcasts)</option>
                <option value="Inactive">Inactive (Excluded)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-300">Role Tag</label>
              <select
                value={memberForm.role_tag}
                onChange={(e) => setMemberForm({ ...memberForm, role_tag: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
              >
                <option value="Owner">Owner</option>
                <option value="Tenant">Tenant</option>
                <option value="Committee">Committee</option>
                <option value="Volunteer">Volunteer</option>
                <option value="Resident">Resident</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-300">Notes (Optional)</label>
            <input
              type="text"
              value={memberForm.notes}
              onChange={(e) => setMemberForm({ ...memberForm, notes: e.target.value })}
              placeholder="e.g. Registered via Flat survey"
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddMemberModalOpen(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-xl shadow"
            >
              Add to DL Group
            </button>
          </div>
        </form>
      </Modal>

      {/* ----------------- EDIT MEMBER MODAL ----------------- */}
      {memberToEdit && (
        <Modal
          isOpen={isEditMemberModalOpen}
          onClose={() => setIsEditMemberModalOpen(false)}
          title={`Edit DL Member: ${memberToEdit.name}`}
          maxWidth="md"
        >
          <form onSubmit={handleUpdateMember} className="space-y-4 text-xs text-slate-200">
            <div className="space-y-1">
              <label className="font-bold text-slate-300">Resident Name *</label>
              <input
                type="text"
                required
                value={memberToEdit.name}
                onChange={(e) => setMemberToEdit({ ...memberToEdit, name: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-300">Tower *</label>
                <select
                  value={memberToEdit.tower}
                  onChange={(e) => setMemberToEdit({ ...memberToEdit, tower: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                >
                  <option value="Tower A">Tower A</option>
                  <option value="Tower B">Tower B</option>
                  <option value="Tower C">Tower C</option>
                  <option value="Tower D">Tower D</option>
                  <option value="Tower E">Tower E</option>
                  <option value="Tower F">Tower F</option>
                  <option value="Clubhouse">Clubhouse</option>
                  <option value="Common Space">Common Space</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">Flat No</label>
                <input
                  type="text"
                  value={memberToEdit.flat_no}
                  onChange={(e) => setMemberToEdit({ ...memberToEdit, flat_no: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-300">Email ID *</label>
                <input
                  type="email"
                  required
                  value={memberToEdit.email}
                  onChange={(e) => setMemberToEdit({ ...memberToEdit, email: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">Mobile Phone</label>
                <input
                  type="text"
                  value={memberToEdit.phone}
                  onChange={(e) => setMemberToEdit({ ...memberToEdit, phone: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-300">Status *</label>
                <select
                  value={memberToEdit.status}
                  onChange={(e) =>
                    setMemberToEdit({ ...memberToEdit, status: e.target.value as any })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-emerald-400"
                >
                  <option value="Active">Active (Receives Mails)</option>
                  <option value="Inactive">Inactive (Excluded)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">Role Tag</label>
                <select
                  value={memberToEdit.role_tag || "Owner"}
                  onChange={(e) => setMemberToEdit({ ...memberToEdit, role_tag: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                >
                  <option value="Owner">Owner</option>
                  <option value="Tenant">Tenant</option>
                  <option value="Committee">Committee</option>
                  <option value="Volunteer">Volunteer</option>
                  <option value="Resident">Resident</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsEditMemberModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-xl shadow"
              >
                Save Changes
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ----------------- CREATE / EDIT GROUP MODALS ----------------- */}
      <Modal
        isOpen={isCreateGroupModalOpen}
        onClose={() => setIsCreateGroupModalOpen(false)}
        title="Create New Distribution List (DL Group)"
        maxWidth="md"
      >
        <form onSubmit={handleCreateGroup} className="space-y-4 text-xs text-slate-200">
          <div className="space-y-1">
            <label className="font-bold text-slate-300">Group Name *</label>
            <input
              type="text"
              required
              value={groupForm.group_name}
              onChange={(e) => setGroupForm({ ...groupForm, group_name: e.target.value })}
              placeholder="e.g. Cultural Dance Performers DL"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-300">Group Code (e.g. DL-DANCE)</label>
              <input
                type="text"
                value={groupForm.group_code}
                onChange={(e) => setGroupForm({ ...groupForm, group_code: e.target.value })}
                placeholder="DL-CUSTOM"
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-300">Category</label>
              <select
                value={groupForm.category}
                onChange={(e) => setGroupForm({ ...groupForm, category: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
              >
                <option value="All Society">All Society</option>
                <option value="Tower Specific">Tower Specific</option>
                <option value="Events & Cultural">Events &amp; Cultural</option>
                <option value="GBM & Governance">GBM &amp; Governance</option>
                <option value="Committee">Committee</option>
                <option value="Emergency">Emergency</option>
                <option value="Custom">Custom</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-300">Default Sender Mail ID</label>
            <input
              type="email"
              value={groupForm.sender_email}
              onChange={(e) => setGroupForm({ ...groupForm, sender_email: e.target.value })}
              placeholder="jaitra-association-hyd@googlegroups.com"
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-sky-300 font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-300">Description</label>
            <textarea
              rows={3}
              value={groupForm.description}
              onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
              placeholder="Purpose and target audience of this DL group..."
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsCreateGroupModalOpen(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-xl shadow"
            >
              Create DL Group
            </button>
          </div>
        </form>
      </Modal>

      {/* ----------------- BROADCAST HISTORY MODAL ----------------- */}
      <Modal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title="Broadcast Notification History & Logs"
        maxWidth="xl"
      >
        <div className="space-y-3 text-xs text-slate-200 max-h-[75vh] overflow-y-auto">
          {broadcastHistory.length === 0 ? (
            <p className="text-center py-8 text-slate-500">No previous notifications dispatched yet.</p>
          ) : (
            broadcastHistory.map((item) => (
              <div
                key={item.id}
                className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2 hover:border-slate-700 transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-sky-950 text-sky-300 border border-sky-800">
                      {item.category}
                    </span>
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      {item.active_recipients_count} Active Sent
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {new Date(item.sent_at).toLocaleString()}
                  </span>
                </div>

                <p className="font-extrabold text-sm text-white">{item.subject}</p>
                <p className="text-slate-300 line-clamp-3 bg-slate-900 p-2.5 rounded-xl text-[11px] whitespace-pre-wrap font-sans">
                  {item.message_body}
                </p>

                <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-900">
                  <span>
                    Sender: <strong className="text-slate-200">{item.sender_email}</strong> ({item.sent_by})
                  </span>
                  <span>
                    Target: <strong className="text-slate-200">{item.group_names || "All DL"}</strong>
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>
    </div>
  );
}
