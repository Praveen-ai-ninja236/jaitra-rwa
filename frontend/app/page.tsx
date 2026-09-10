"use client";

import React, { useState, useEffect, useCallback } from "react";
import Navbar from "../components/Navbar";
import HeroBanner from "../components/HeroBanner";
import TabNav from "../components/TabNav";
import CulturalEventsTab from "../components/CulturalEventsTab";
import FestivalCelebrationsTab from "../components/FestivalCelebrationsTab";
import GeneralBodyMeetingsTab from "../components/GeneralBodyMeetingsTab";
import IssuesTrackerTab from "../components/IssuesTrackerTab";
import ADOBorderPendingsTab from "../components/ADOBorderPendingsTab";
import TeamListTab from "../components/TeamListTab";
import VendorManagementTab from "../components/VendorManagementTab";
import ChangeHistoryTab from "../components/ChangeHistoryTab";
import FlatSummaryTab from "../components/FlatSummaryTab";
import AuditReportModal from "../components/AuditReportModal";
import {
  CulturalEvent,
  CulturalEventCreate,
  CulturalParticipantCreate,
  CulturalAgendaCreate,
  FestivalCelebration,
  FestivalCelebrationCreate,
  FestivalCollectionCreate,
  FestivalExpenseCreate,
  GeneralBodyMeeting,
  GeneralBodyMeetingCreate,
  CommunityIssue,
  CommunityIssueCreate,
  ADOTask,
  ADOTaskCreate,
  ADOCommentCreate,
  ADOAttachmentCreate,
  TeamMember,
  TeamMemberCreate,
  SocietyStats,
  AuditTransaction,
  AppUser,
  VendorContract,
  VendorContractCreate,
  DropdownCategoryMap,
} from "../lib/types";
import * as api from "../lib/api";
import {
  Building2,
  Phone,
  MapPin,
  ShieldCheck,
  Heart,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Shield,
} from "lucide-react";

export default function JaitraPortal() {
  const [activeTab, setActiveTab] = useState<string>("ado-board");
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Core Data States
  const [stats, setStats] = useState<SocietyStats | null>(null);
  const [culturalEvents, setCulturalEvents] = useState<CulturalEvent[]>([]);
  const [festivals, setFestivals] = useState<FestivalCelebration[]>([]);
  const [meetings, setMeetings] = useState<GeneralBodyMeeting[]>([]);
  const [issues, setIssues] = useState<CommunityIssue[]>([]);
  const [adoTasks, setAdoTasks] = useState<ADOTask[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [vendors, setVendors] = useState<VendorContract[]>([]);
  const [dropdownMap, setDropdownMap] = useState<DropdownCategoryMap>({});
  const [users, setUsers] = useState<AppUser[]>([]);

  // User & Auth State (Defaults to null -> strict View Only for unauthenticated visitors)
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);

  // Audit Report State
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [auditTransactions, setAuditTransactions] = useState<AuditTransaction[]>([]);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const logChange = async (
    action: "CREATE" | "UPDATE" | "DELETE",
    entityType: string,
    entityId?: number | null,
    entityLabel?: string,
    details?: string
  ) => {
    try {
      await api.createAuditLog({
        user_name: currentUser?.name || "Anonymous",
        user_role: currentUser?.role || "User",
        action,
        entity_type: entityType,
        entity_id: entityId || null,
        entity_label: entityLabel || "",
        details: details || "",
      });
    } catch (e) {
      console.warn("Audit log failed:", e);
    }
  };

  // Restore session from localStorage and sync hash from URL on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("jaitra_auth_user");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.email) {
            setCurrentUser(parsed);
          }
        }
      } catch (e) {}

      const hash = window.location.hash.replace("#", "");
      const allTabs = ["culture-events", "festivals", "gbm", "issues", "ado-board", "team", "vendor-management", "change-history", "flat-summary"];
      if (allTabs.includes(hash)) {
        setActiveTab(hash);
      }
    }
  }, []);

  // Redirect to public tab if on a restricted tab without auth or if unauthorized role visits protected tab
  useEffect(() => {
    if (!currentUser) {
      const restrictedTabs = ["issues", "ado-board", "team", "vendor-management", "change-history", "flat-summary"];
      if (restrictedTabs.includes(activeTab)) {
        setActiveTab("culture-events");
        if (typeof window !== "undefined") {
          window.location.hash = "culture-events";
        }
      }
    } else if (currentUser.role === "Staff") {
      const staffAllowedTabs = ["culture-events", "issues"];
      if (!staffAllowedTabs.includes(activeTab)) {
        setActiveTab("culture-events");
        if (typeof window !== "undefined") {
          window.location.hash = "culture-events";
        }
      }
    } else if (currentUser.role === "User") {
      // Regular User cannot access Admin-only flat-summary tab
      if (activeTab === "flat-summary") {
        setActiveTab("culture-events");
        if (typeof window !== "undefined") {
          window.location.hash = "culture-events";
        }
      }
    }
  }, [currentUser, activeTab]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    if (typeof window !== "undefined") {
      window.location.hash = tabId;
    }
  };

  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [
        statsData,
        eventsData,
        festivalsData,
        meetingsData,
        issuesData,
        tasksData,
        teamData,
        vendorsData,
        auditData,
        dropdownData,
        usersData,
      ] = await Promise.all([
        api.getStats().catch(() => null),
        api.getCulturalEvents().catch(() => []),
        api.getFestivals().catch(() => []),
        api.getMeetings().catch(() => []),
        api.getIssues().catch(() => []),
        api.getADOTasks().catch(() => []),
        api.getTeam().catch(() => []),
        api.getVendorContracts().catch(() => []),
        api.getAuditTransactions().catch(() => []),
        api.getDropdownSettingsMap().catch(() => ({})),
        api.getUsers().catch(() => []),
      ]);

      if (statsData) setStats(statsData);
      setCulturalEvents(eventsData);
      setFestivals(festivalsData);
      setMeetings(meetingsData);
      setIssues(issuesData);
      setAdoTasks(tasksData);
      setTeamMembers(teamData);
      setVendors(vendorsData);
      setAuditTransactions(auditData);
      setDropdownMap(dropdownData);
      setUsers(usersData);
      setIsBackendConnected(true);
    } catch (err) {
      console.warn("Backend fetch failed, running with local state", err);
      setIsBackendConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const handleOpenAuditReport = async () => {
    try {
      const transactions = await api.getAuditTransactions();
      setAuditTransactions(transactions);
    } catch (e) {
      console.error(e);
    }
    setIsAuditModalOpen(true);
  };

  // 1. Cultural Events Handlers
  const handleAddCulturalEvent = async (eventData: CulturalEventCreate) => {
    try {
      const newEvent = await api.createCulturalEvent(eventData);
      setCulturalEvents([newEvent, ...culturalEvents]);
      showToast("Cultural event scheduled in database!");
      logChange("CREATE", "cultural_event", newEvent.id, eventData.title, "Created cultural event: " + eventData.title);
      fetchAllData();
    } catch (err) {
      showToast("Failed to create event: " + (err as Error).message, "error");
    }
  };

  const handleUpdateCulturalEvent = async (id: number, eventData: Partial<CulturalEventCreate>) => {
    try {
      const updated = await api.updateCulturalEvent(id, eventData);
      setCulturalEvents(culturalEvents.map((e) => (e.id === id ? updated : e)));
      showToast("Cultural event details updated in live database!");
      logChange("UPDATE", "cultural_event", id, eventData.title || "Event", "Updated cultural event");
      fetchAllData();
    } catch (err) {
      showToast("Failed to update event: " + (err as Error).message, "error");
    }
  };

  const handleDeleteCulturalEvent = async (id: number) => {
    try {
      await api.deleteCulturalEvent(id);
      setCulturalEvents(culturalEvents.filter((e) => e.id !== id));
      showToast("Event removed from database.");
      logChange("DELETE", "cultural_event", id, "Event", "Deleted cultural event");
      fetchAllData();
    } catch (err) {
      showToast("Failed to delete event: " + (err as Error).message, "error");
    }
  };

  const handleAddParticipant = async (eventId: number, partData: CulturalParticipantCreate) => {
    try {
      await api.addCulturalParticipant(eventId, partData);
      showToast(`${partData.participant_name} enrolled for ${partData.activity_category}!`);
      logChange("CREATE", "cultural_event", eventId || null, partData.participant_name, "Added participant: " + partData.participant_name);
      fetchAllData();
    } catch (err) {
      showToast("Failed to add participant: " + (err as Error).message, "error");
    }
  };

  const handleUpdateParticipant = async (participantId: number, partData: Partial<CulturalParticipantCreate>) => {
    try {
      await api.updateCulturalParticipant(participantId, partData);
      showToast("Participant updates saved to DB!");
      logChange("UPDATE", "cultural_event", null, "Participant", "Updated participant details");
      fetchAllData();
    } catch (err) {
      showToast("Failed to update participant: " + (err as Error).message, "error");
    }
  };

  const handleDeleteParticipant = async (participantId: number) => {
    try {
      await api.deleteCulturalParticipant(participantId);
      showToast("Participant entry removed.");
      logChange("DELETE", "cultural_event", null, "Participant", "Deleted participant");
      fetchAllData();
    } catch (err) {
      showToast("Failed to delete participant: " + (err as Error).message, "error");
    }
  };

  const handleAddAgenda = async (eventId: number, agendaData: CulturalAgendaCreate) => {
    try {
      await api.addCulturalAgenda(eventId, agendaData);
      showToast("Agenda slot added!");
      logChange("CREATE", "cultural_event", eventId || null, agendaData.activity_topic, "Added agenda slot");
      fetchAllData();
    } catch (err) {
      showToast("Failed to add agenda: " + (err as Error).message, "error");
    }
  };

  const handleUpdateAgenda = async (agendaId: number, agendaData: Partial<CulturalAgendaCreate>) => {
    try {
      await api.updateCulturalAgenda(agendaId, agendaData);
      showToast("Agenda slot updated in DB!");
      logChange("UPDATE", "cultural_event", null, "Agenda", "Updated agenda slot");
      fetchAllData();
    } catch (err) {
      showToast("Failed to update agenda: " + (err as Error).message, "error");
    }
  };

  const handleDeleteAgenda = async (agendaId: number) => {
    try {
      await api.deleteCulturalAgenda(agendaId);
      showToast("Agenda slot removed.");
      logChange("DELETE", "cultural_event", null, "Agenda", "Deleted agenda slot");
      fetchAllData();
    } catch (err) {
      showToast("Failed to delete agenda: " + (err as Error).message, "error");
    }
  };

  // 2. Festival Handlers (Collections, Expenses, Approver)
  const handleAddFestival = async (festData: FestivalCelebrationCreate) => {
    try {
      const newFest = await api.createFestival(festData);
      setFestivals([newFest, ...festivals]);
      showToast("Festival program created in DB!");
      logChange("CREATE", "festival", newFest.id, festData.festival_name, "Created festival: " + festData.festival_name);
      fetchAllData();
    } catch (err) {
      showToast("Failed to save festival: " + (err as Error).message, "error");
    }
  };

  const handleUpdateFestival = async (id: number, festData: Partial<FestivalCelebrationCreate>) => {
    try {
      const updated = await api.updateFestival(id, festData);
      setFestivals(festivals.map((f) => (f.id === id ? updated : f)));
      showToast("Festival details updated in Neon DB!");
      logChange("UPDATE", "festival", id, festData.festival_name || "Festival", "Updated festival");
      fetchAllData();
    } catch (err) {
      showToast("Failed to update festival: " + (err as Error).message, "error");
    }
  };

  const handleDeleteFestival = async (id: number) => {
    try {
      await api.deleteFestival(id);
      setFestivals(festivals.filter((f) => f.id !== id));
      showToast("Festival record removed.");
      logChange("DELETE", "festival", id, "Festival", "Deleted festival");
      fetchAllData();
    } catch (err) {
      showToast("Failed to delete festival: " + (err as Error).message, "error");
    }
  };

  const handleAddCollection = async (festivalId: number, collData: FestivalCollectionCreate) => {
    try {
      await api.addFestivalCollection(festivalId, collData);
      showToast(`Collection of ₹${collData.amount} recorded for ${collData.tower}-${collData.flat_no}!`);
      logChange("CREATE", "festival_collection", null, collData.donor_name, "Recorded collection of Rs." + collData.amount + " from " + collData.donor_name);
      fetchAllData();
    } catch (err) {
      showToast("Failed to record collection: " + (err as Error).message, "error");
    }
  };

  const handleUpdateCollection = async (collectionId: number, collData: Partial<FestivalCollectionCreate>) => {
    try {
      await api.updateFestivalCollection(collectionId, collData);
      showToast("Collection record updated in database!");
      logChange("UPDATE", "festival_collection", collectionId, "Collection", "Updated collection record");
      fetchAllData();
    } catch (err) {
      showToast("Failed to update collection: " + (err as Error).message, "error");
    }
  };

  const handleDeleteCollection = async (collectionId: number) => {
    try {
      await api.deleteFestivalCollection(collectionId);
      showToast("Collection record removed.");
      logChange("DELETE", "festival_collection", collectionId, "Collection", "Deleted collection record");
      fetchAllData();
    } catch (err) {
      showToast("Failed to delete collection: " + (err as Error).message, "error");
    }
  };

  const handleAddExpense = async (festivalId: number, expData: FestivalExpenseCreate) => {
    try {
      await api.addFestivalExpense(festivalId, expData);
      showToast(`Expense bill ₹${expData.amount} submitted for audit approval in DB!`);
      logChange("CREATE", "festival_expense", null, expData.title, "Submitted expense bill: " + expData.title + " Rs." + expData.amount);
      fetchAllData();
    } catch (err) {
      showToast("Failed to add expense: " + (err as Error).message, "error");
    }
  };

  const handleUpdateExpense = async (expenseId: number, expData: Partial<FestivalExpenseCreate>) => {
    try {
      await api.updateFestivalExpense(expenseId, expData);
      showToast("Expense voucher updated in database!");
      logChange("UPDATE", "festival_expense", expenseId, "Expense", "Updated expense voucher");
      fetchAllData();
    } catch (err) {
      showToast("Failed to update expense: " + (err as Error).message, "error");
    }
  };

  const handleUpdateExpenseStatus = async (expenseId: number, status: string, approverName?: string) => {
    try {
      await api.updateFestivalExpenseStatus(expenseId, status, approverName);
      showToast(`Expense voucher marked ${status}!`);
      logChange("UPDATE", "festival_expense", expenseId, "Expense Status", "Changed status to " + status);
      fetchAllData();
    } catch (err) {
      showToast("Failed to update expense status: " + (err as Error).message, "error");
    }
  };

  const handleDeleteExpense = async (expenseId: number) => {
    try {
      await api.deleteFestivalExpense(expenseId);
      showToast("Expense entry deleted.");
      logChange("DELETE", "festival_expense", expenseId, "Expense", "Deleted expense voucher");
      fetchAllData();
    } catch (err) {
      showToast("Failed to delete expense: " + (err as Error).message, "error");
    }
  };

  // 3. GBM Meeting Handlers
  const handleAddMeeting = async (meetingData: GeneralBodyMeetingCreate) => {
    try {
      const newM = await api.createMeeting(meetingData);
      setMeetings([newM, ...meetings]);
      showToast("GBM meeting record saved in DB!");
      logChange("CREATE", "meeting", newM.id, meetingData.meeting_title, "Created meeting: " + meetingData.meeting_title);
      fetchAllData();
    } catch (err) {
      showToast("Failed to record meeting: " + (err as Error).message, "error");
    }
  };

  const handleUpdateMeeting = async (id: number, meetingData: Partial<GeneralBodyMeetingCreate>) => {
    try {
      const updated = await api.updateMeeting(id, meetingData);
      setMeetings(meetings.map((m) => (m.id === id ? updated : m)));
      showToast("GBM minutes & resolutions updated in DB!");
      logChange("UPDATE", "meeting", id, meetingData.meeting_title || "Meeting", "Updated meeting");
      fetchAllData();
    } catch (err) {
      showToast("Failed to update meeting: " + (err as Error).message, "error");
    }
  };

  const handleDeleteMeeting = async (id: number) => {
    try {
      await api.deleteMeeting(id);
      setMeetings(meetings.filter((m) => m.id !== id));
      showToast("Meeting record removed.");
      logChange("DELETE", "meeting", id, "Meeting", "Deleted meeting");
      fetchAllData();
    } catch (err) {
      showToast("Failed to delete meeting: " + (err as Error).message, "error");
    }
  };

  // 4. Community Issues Handlers (Tower A-F)
  const handleAddIssue = async (issueData: CommunityIssueCreate) => {
    try {
      const newIssue = await api.createIssue(issueData);
      setIssues([newIssue, ...issues]);
      showToast(`Maintenance issue logged (${newIssue.issue_code || "ISS"}) in ${newIssue.tower}`);
      logChange("CREATE", "issue", newIssue.id, issueData.title, "Created issue: " + issueData.title);
      fetchAllData();
    } catch (err) {
      showToast("Failed to log issue: " + (err as Error).message, "error");
    }
  };

  const handleUpdateIssue = async (id: number, issueData: Partial<CommunityIssueCreate>) => {
    try {
      const updated = await api.updateIssue(id, issueData);
      setIssues(issues.map((i) => (i.id === id ? updated : i)));
      showToast(`Ticket ${updated.issue_code || id} updated in DB!`);
      logChange("UPDATE", "issue", id, issueData.title || "Issue", "Updated issue");
      fetchAllData();
    } catch (err) {
      showToast("Failed to update issue: " + (err as Error).message, "error");
    }
  };

  const handleDeleteIssue = async (id: number) => {
    try {
      await api.deleteIssue(id);
      setIssues(issues.filter((i) => i.id !== id));
      showToast("Issue ticket deleted.");
      logChange("DELETE", "issue", id, "Issue", "Deleted issue");
      fetchAllData();
    } catch (err) {
      showToast("Failed to delete issue: " + (err as Error).message, "error");
    }
  };

  // 5. ADO Tasks Handlers (Comments, Evidence Attachments)
  const handleAddADOTask = async (taskData: ADOTaskCreate) => {
    try {
      const newTask = await api.createADOTask(taskData);
      setAdoTasks([...adoTasks, newTask]);
      showToast(`Work item ${newTask.task_code || "ADO"} added to board in DB!`);
      logChange("CREATE", "ado_task", newTask.id, taskData.title, "Created ADO task: " + taskData.title);
      fetchAllData();
    } catch (err) {
      showToast("Failed to create ADO task: " + (err as Error).message, "error");
    }
  };

  const handleUpdateADOTask = async (id: number, taskData: Partial<ADOTaskCreate>) => {
    try {
      const updated = await api.updateADOTask(id, taskData);
      setAdoTasks(adoTasks.map((t) => (t.id === id ? updated : t)));
      showToast(`ADO deliverable ${updated.task_code} updated in DB!`);
      logChange("UPDATE", "ado_task", id, taskData.title || "Task", "Updated ADO task");
      fetchAllData();
    } catch (err) {
      showToast("Failed to update ADO task: " + (err as Error).message, "error");
    }
  };

  const handleUpdateADOTaskStatus = async (
    id: number,
    status: string,
    progress?: number,
    blockers?: string
  ) => {
    try {
      const updated = await api.updateADOTaskStatus(id, status, progress, blockers);
      setAdoTasks(adoTasks.map((t) => (t.id === id ? updated : t)));
      showToast(`Work item ${updated.task_code} moved to ${status}`);
      logChange("UPDATE", "ado_task", id, "Task Status", "Changed status to " + status);
      fetchAllData();
    } catch (err) {
      showToast("Failed to update ADO task: " + (err as Error).message, "error");
    }
  };

  const handleDeleteADOTask = async (id: number) => {
    try {
      await api.deleteADOTask(id);
      setAdoTasks(adoTasks.filter((t) => t.id !== id));
      showToast("ADO work item removed.");
      logChange("DELETE", "ado_task", id, "Task", "Deleted ADO task");
      fetchAllData();
    } catch (err) {
      showToast("Failed to delete task: " + (err as Error).message, "error");
    }
  };

  const handleAddADOComment = async (taskId: number, commentData: ADOCommentCreate) => {
    try {
      await api.addADOComment(taskId, commentData);
      showToast("Discussion update posted to work item in DB!");
      logChange("CREATE", "ado_comment", null, "Comment", "Added discussion comment");
      fetchAllData();
    } catch (err) {
      showToast("Failed to add comment: " + (err as Error).message, "error");
    }
  };

  const handleAddADOAttachment = async (taskId: number, attData: ADOAttachmentCreate) => {
    try {
      await api.addADOAttachment(taskId, attData);
      showToast("Evidence proof attached to work item in DB!");
      logChange("CREATE", "ado_attachment", null, "Attachment", "Attached evidence document");
      fetchAllData();
    } catch (err) {
      showToast("Failed to attach evidence: " + (err as Error).message, "error");
    }
  };

  const handleDeleteADOAttachment = async (attachmentId: number) => {
    try {
      await api.deleteADOAttachment(attachmentId);
      showToast("Evidence attachment removed.");
      logChange("DELETE", "ado_attachment", attachmentId, "Attachment", "Deleted attachment");
      fetchAllData();
    } catch (err) {
      showToast("Failed to delete attachment: " + (err as Error).message, "error");
    }
  };

  // 6. Team Member Handlers
  const handleAddTeamMember = async (memberData: TeamMemberCreate) => {
    try {
      const newMember = await api.addTeamMember(memberData);
      setTeamMembers([...teamMembers, newMember]);
      showToast(`${newMember.name} added to Jaitra Association committee in DB!`);
      logChange("CREATE", "team_member", newMember.id, newMember.name, "Added team member: " + newMember.name);
      fetchAllData();
    } catch (err) {
      showToast("Failed to add member: " + (err as Error).message, "error");
    }
  };

  const handleUpdateTeamMember = async (id: number, memberData: Partial<TeamMemberCreate>) => {
    try {
      const updated = await api.updateTeamMember(id, memberData);
      setTeamMembers(teamMembers.map((m) => (m.id === id ? updated : m)));
      showToast(`${updated.name} updates saved to DB!`);
      logChange("UPDATE", "team_member", id, updated.name || "Member", "Updated team member");
      fetchAllData();
    } catch (err) {
      showToast("Failed to update member: " + (err as Error).message, "error");
    }
  };

  const handleDeleteTeamMember = async (id: number) => {
    try {
      await api.deleteTeamMember(id);
      setTeamMembers(teamMembers.filter((m) => m.id !== id));
      showToast("Member removed from committee directory.");
      logChange("DELETE", "team_member", id, "Member", "Deleted team member");
      fetchAllData();
    } catch (err) {
      showToast("Failed to delete member: " + (err as Error).message, "error");
    }
  };

  // 7. Vendor Management Handlers
  const handleAddVendor = async (vendorData: VendorContractCreate) => {
    try {
      const newV = await api.createVendorContract(vendorData);
      setVendors([...vendors, newV]);
      showToast(`Vendor contract for "${newV.vendor_name}" added to database!`);
      logChange("CREATE", "vendor_contract", newV.id, newV.vendor_name, "Added vendor: " + newV.vendor_name);
      fetchAllData();
    } catch (err) {
      showToast("Failed to save vendor contract: " + (err as Error).message, "error");
    }
  };

  const handleUpdateVendor = async (id: number, vendorData: Partial<VendorContractCreate>) => {
    try {
      const updated = await api.updateVendorContract(id, vendorData);
      setVendors(vendors.map((v) => (v.id === id ? updated : v)));
      showToast(`Contract for "${updated.vendor_name}" updated in DB!`);
      logChange("UPDATE", "vendor_contract", id, updated.vendor_name || "Vendor", "Updated vendor contract");
      fetchAllData();
    } catch (err) {
      showToast("Failed to update vendor contract: " + (err as Error).message, "error");
    }
  };

  const handleDeleteVendor = async (id: number) => {
    try {
      await api.deleteVendorContract(id);
      setVendors(vendors.filter((v) => v.id !== id));
      showToast("Vendor contract removed from database.");
      logChange("DELETE", "vendor_contract", id, "Vendor", "Deleted vendor contract");
      fetchAllData();
    } catch (err) {
      showToast("Failed to delete vendor contract: " + (err as Error).message, "error");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-sky-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        isBackendConnected={isBackendConnected}
        onRefresh={fetchAllData}
        isLoading={isLoading}
        currentUser={currentUser}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          try {
            localStorage.setItem("jaitra_auth_user", JSON.stringify(user));
          } catch (e) {}
          showToast(`Welcome, ${user.name} (${user.role})!`);
        }}
        onLogout={() => {
          setCurrentUser(null);
          try {
            localStorage.removeItem("jaitra_auth_user");
          } catch (e) {}
          showToast("Signed out. Switched to View Only (Resident) mode.");
        }}
      />

      {/* Guest Login Prompt Banner */}
      {!currentUser && (
        <div className="bg-gradient-to-r from-indigo-950/80 via-slate-900 to-indigo-950/80 border-b border-indigo-800/50 py-3 px-4 text-center">
          <p className="text-xs sm:text-sm text-slate-300">
            <span className="font-bold text-indigo-300">Limited View</span> — Sign in to access all tabs, financial details, and admin features.
          </p>
        </div>
      )}

      {/* Hero Header Banner with Stats */}
      <HeroBanner
        stats={stats}
        onSelectTab={handleTabChange}
        onOpenAuditReport={handleOpenAuditReport}
        currentUser={currentUser}
      />

      {/* Sticky Tabs Navigation */}
      <TabNav
        activeTab={activeTab}
        onTabChange={handleTabChange}
        currentUser={currentUser}
        badgeCounts={{
          events: culturalEvents.length,
          festivals: festivals.length,
          meetings: meetings.length,
          issues: issues.filter((i) => i.status !== "Resolved" && i.status !== "Closed").length,
          adoTasks: adoTasks.filter((t) => t.status !== "Closed").length,
          team: teamMembers.length,
          vendors: vendors.length,
        }}
      />

      {/* Main Tab Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "culture-events" && (
          <CulturalEventsTab
            events={culturalEvents}
            onAddEvent={handleAddCulturalEvent}
            onUpdateEvent={handleUpdateCulturalEvent}
            onDeleteEvent={handleDeleteCulturalEvent}
            onAddParticipant={handleAddParticipant}
            onUpdateParticipant={handleUpdateParticipant}
            onDeleteParticipant={handleDeleteParticipant}
            onAddAgenda={handleAddAgenda}
            onUpdateAgenda={handleUpdateAgenda}
            onDeleteAgenda={handleDeleteAgenda}
            isLoading={isLoading}
            userRole={currentUser?.role || "User"}
            isGuest={!currentUser}
            dropdownMap={dropdownMap}
            teamMembers={teamMembers}
          />
        )}

        {activeTab === "festivals" && (
          <FestivalCelebrationsTab
            festivals={festivals}
            onAddFestival={handleAddFestival}
            onUpdateFestival={handleUpdateFestival}
            onDeleteFestival={handleDeleteFestival}
            onAddCollection={handleAddCollection}
            onUpdateCollection={handleUpdateCollection}
            onDeleteCollection={handleDeleteCollection}
            onAddExpense={handleAddExpense}
            onUpdateExpense={handleUpdateExpense}
            onUpdateExpenseStatus={handleUpdateExpenseStatus}
            onDeleteExpense={handleDeleteExpense}
            onOpenAuditReport={handleOpenAuditReport}
            isLoading={isLoading}
            userRole={currentUser?.role || "User"}
            isGuest={!currentUser}
            dropdownMap={dropdownMap}
            teamMembers={teamMembers}
          />
        )}

        {activeTab === "gbm" && (
          <GeneralBodyMeetingsTab
            meetings={meetings}
            onAddMeeting={handleAddMeeting}
            onUpdateMeeting={handleUpdateMeeting}
            onDeleteMeeting={handleDeleteMeeting}
            isLoading={isLoading}
            userRole={currentUser?.role || "User"}
            isGuest={!currentUser}
            dropdownMap={dropdownMap}
          />
        )}

        {activeTab === "issues" && (
          <IssuesTrackerTab
            issues={issues}
            onAddIssue={handleAddIssue}
            onUpdateIssue={handleUpdateIssue}
            onDeleteIssue={handleDeleteIssue}
            isLoading={isLoading}
            userRole={currentUser?.role || "User"}
            dropdownMap={dropdownMap}
            teamMembers={teamMembers}
          />
        )}

        {activeTab === "ado-board" && (
          <ADOBorderPendingsTab
            tasks={adoTasks}
            onAddTask={handleAddADOTask}
            onUpdateTask={handleUpdateADOTask}
            onUpdateStatus={handleUpdateADOTaskStatus}
            onDeleteTask={handleDeleteADOTask}
            onAddComment={handleAddADOComment}
            onAddAttachment={handleAddADOAttachment}
            onDeleteAttachment={handleDeleteADOAttachment}
            isLoading={isLoading}
            userRole={currentUser?.role || "User"}
            dropdownMap={dropdownMap}
            teamMembers={teamMembers}
          />
        )}

        {activeTab === "team" && (
          <TeamListTab
            team={teamMembers}
            onAddMember={handleAddTeamMember}
            onUpdateMember={handleUpdateTeamMember}
            onDeleteMember={handleDeleteTeamMember}
            isLoading={isLoading}
            userRole={currentUser?.role || "User"}
            dropdownMap={dropdownMap}
          />
        )}

        {activeTab === "vendor-management" && (
          <VendorManagementTab
            vendors={vendors}
            onAddVendor={handleAddVendor}
            onUpdateVendor={handleUpdateVendor}
            onDeleteVendor={handleDeleteVendor}
            isLoading={isLoading}
            userRole={currentUser?.role || "User"}
            dropdownMap={dropdownMap}
          />
        )}

        {activeTab === "change-history" && (
          <ChangeHistoryTab userRole={currentUser?.role || "User"} />
        )}

        {activeTab === "flat-summary" && (
          <FlatSummaryTab
            festivals={festivals}
            issues={issues}
            culturalEvents={culturalEvents}
            gbmMeetings={meetings}
            users={users}
            userRole={currentUser?.role || "User"}
            currentUser={currentUser}
          />
        )}
      </main>

      {/* Audit Report Modal */}
      <AuditReportModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        transactions={auditTransactions}
      />

      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl border text-xs sm:text-sm font-bold backdrop-blur-md ${
              notification.type === "success"
                ? "bg-slate-900/95 text-white border-emerald-500/50 shadow-emerald-500/10"
                : "bg-rose-950/95 text-white border-rose-500 shadow-rose-500/20"
            }`}
          >
            {notification.type === "success" ? (
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400" />
            )}
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 mt-12 py-6 px-4 sm:px-6 lg:px-8 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-sky-400" />
            <span className="font-extrabold text-slate-200">Jaitra Residents Welfare Association</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Powered by Next.js 14, React, TypeScript &amp; Neon Serverless PostgreSQL Database
          </p>
        </div>
      </footer>
    </div>
  );
}
