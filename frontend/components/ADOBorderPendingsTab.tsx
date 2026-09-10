"use client";

import React, { useState, useMemo } from "react";
import {
  ADOTask,
  ADOTaskCreate,
  ADOCommentCreate,
  ADOAttachmentCreate,
  UserRole,
  DropdownCategoryMap,
  TeamMember,
} from "../lib/types";
import {
  Kanban,
  Plus,
  Search,
  Filter,
  ArrowRight,
  AlertOctagon,
  Clock,
  Calendar,
  User,
  CheckCircle2,
  Trash2,
  Building,
  Shield,
  Layers,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Flame,
  CheckSquare,
  MessageSquare,
  Paperclip,
  Send,
  Edit3,
  ExternalLink,
  FileText,
  FileCheck2,
  Table,
  ArrowUpDown,
  Edit,
  Eye,
} from "lucide-react";
import Modal from "./Modal";
import DynamicSelect from "./DynamicSelect";
import FileUploadInput from "./FileUploadInput";
import DocumentPreviewModal from "./DocumentPreviewModal";

interface ADOBorderPendingsTabProps {
  tasks: ADOTask[];
  onAddTask: (task: ADOTaskCreate) => Promise<void>;
  onUpdateTask: (id: number, task: Partial<ADOTaskCreate>) => Promise<void>;
  onUpdateStatus: (id: number, status: string, progress?: number, blockers?: string) => Promise<void>;
  onDeleteTask: (id: number) => Promise<void>;
  onAddComment: (taskId: number, comment: ADOCommentCreate) => Promise<void>;
  onAddAttachment: (taskId: number, attachment: ADOAttachmentCreate) => Promise<void>;
  onDeleteAttachment: (attachmentId: number) => Promise<void>;
  isLoading: boolean;
  userRole?: UserRole;
  dropdownMap?: DropdownCategoryMap;
  teamMembers?: TeamMember[];
}

export default function ADOBorderPendingsTab({
  tasks,
  onAddTask,
  onUpdateTask,
  onUpdateStatus,
  onDeleteTask,
  onAddComment,
  onAddAttachment,
  onDeleteAttachment,
  isLoading,
  userRole = "Super Admin",
  dropdownMap = {},
  teamMembers = [],
}: ADOBorderPendingsTabProps) {
  const canEdit = userRole === "Super Admin" || userRole === "Admin";
  const teamMemberNames = teamMembers.map((m) => m.name).filter(Boolean);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEntity, setSelectedEntity] = useState<string>("All");
  const [selectedPriority, setSelectedPriority] = useState("All");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");

  // Table Sort State
  const [sortField, setSortField] = useState<"task_code" | "title" | "assigned_to" | "status" | "priority" | "due_date" | "progress">("due_date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<ADOTask | null>(null);
  const [activeTaskDetail, setActiveTaskDetail] = useState<ADOTask | null>(null);
  const [taskDetailTab, setTaskDetailTab] = useState<"discussion" | "evidence" | "edit">("discussion");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<{ url: string; title: string } | null>(null);

  // New ADO Task Form State
  const [formData, setFormData] = useState<ADOTaskCreate>({
    task_code: "",
    title: "",
    assigned_to: "Builder",
    entity_type: "Builder",
    category: "Seepage & Waterproofing",
    status: "New",
    priority: "High",
    assignee_name: "Er. K. Verma (Builder Project Head)",
    due_date: "2026-09-30",
    sla_days: 14,
    blockers: "",
    description: "",
    completion_percentage: 0,
    tags: "Handover, Structural, Warranty",
  });

  // Comment Form State
  const [commentText, setCommentText] = useState("");
  const [commentAuthor, setCommentAuthor] = useState("Vikram Patel");
  const [commentRole, setCommentRole] = useState("Treasurer / MC Member");

  // Attachment Form State
  const [attData, setAttData] = useState<ADOAttachmentCreate>({
    file_name: "",
    file_url: "",
    description: "",
    uploaded_by: "Karthik Venkatesh (MC Maintenance)",
  });

  const columns: Array<{
    id: ADOTask["status"];
    title: string;
    headerBorder: string;
    badgeBg: string;
    dotColor: string;
  }> = [
    { id: "New", title: "New / Backlog", headerBorder: "border-slate-700", badgeBg: "bg-slate-800 text-slate-300 border border-slate-700", dotColor: "bg-slate-400" },
    { id: "Active", title: "Active / In Progress", headerBorder: "border-sky-500/40", badgeBg: "bg-sky-950 text-sky-300 border border-sky-700/60", dotColor: "bg-sky-400" },
    { id: "Resolved", title: "Resolved / Inspection", headerBorder: "border-emerald-500/40", badgeBg: "bg-emerald-950 text-emerald-300 border border-emerald-700/60", dotColor: "bg-emerald-400" },
    { id: "Closed", title: "Closed & Signed-off", headerBorder: "border-indigo-500/40", badgeBg: "bg-indigo-950 text-indigo-300 border border-indigo-700/60", dotColor: "bg-indigo-400" },
  ];

  const defaultCategories = dropdownMap["ado_categories"]?.length ? dropdownMap["ado_categories"] : ["Seepage & Waterproofing", "Fire NOC & Compliance", "STP & WTP Operations", "Lifts & Elevators", "Solar & Electrical Grid", "CCTV & Gate Automation", "Clubhouse & Amenities", "Landscaping & Boundary"];

  const defaultEntities = dropdownMap["ado_entities"]?.length ? dropdownMap["ado_entities"] : ["Builder", "IGS", "Joint Taskforce", "Association Oversight"];
  const defaultPriorities = ["Critical", "High", "Medium", "Low"];
  const defaultStatuses = ["New", "Active", "Resolved", "Closed"];

  // Filtered Tasks
  const filteredTasks = useMemo(() => {
    return tasks
      .filter((t) => {
        const matchSearch =
          t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.task_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (t.assignee_name && t.assignee_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (t.category && t.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (t.tags && t.tags.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchEntity =
          selectedEntity === "All" ||
          t.assigned_to.toLowerCase().includes(selectedEntity.toLowerCase()) ||
          t.entity_type === selectedEntity;

        const matchPriority = selectedPriority === "All" || t.priority === selectedPriority;
        const matchCategory = selectedCategory === "All" || t.category === selectedCategory;

        return matchSearch && matchEntity && matchPriority && matchCategory;
      })
      .sort((a, b) => {
        if (sortField === "progress") {
          return sortOrder === "asc"
            ? a.completion_percentage - b.completion_percentage
            : b.completion_percentage - a.completion_percentage;
        }
        if (sortField === "due_date") {
          const dA = a.due_date ? new Date(a.due_date).getTime() : 0;
          const dB = b.due_date ? new Date(b.due_date).getTime() : 0;
          return sortOrder === "asc" ? dA - dB : dB - dA;
        }
        let valA = a[sortField] || "";
        let valB = b[sortField] || "";
        return sortOrder === "asc"
          ? String(valA).localeCompare(String(valB))
          : String(valB).localeCompare(String(valA));
      });
  }, [tasks, searchTerm, selectedEntity, selectedPriority, selectedCategory, sortField, sortOrder]);

  const currentTask = useMemo(() => {
    if (!activeTaskDetail) return null;
    return tasks.find((t) => t.id === activeTaskDetail.id) || activeTaskDetail;
  }, [tasks, activeTaskDetail]);

  const currentComments = currentTask?.comments || [];
  const currentAttachments = currentTask?.attachments || [];

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;
    setIsSubmitting(true);
    try {
      await onAddTask(formData);
      setIsAddModalOpen(false);
      setFormData({
        task_code: "",
        title: "",
        assigned_to: "Builder",
        entity_type: "Builder",
        category: "Seepage & Waterproofing",
        status: "New",
        priority: "High",
        assignee_name: "Er. K. Verma (Builder Project Head)",
        due_date: "2026-09-30",
        sla_days: 14,
        blockers: "",
        description: "",
        completion_percentage: 0,
        tags: "Handover, Structural, Warranty",
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;
    setIsSubmitting(true);
    try {
      await onUpdateTask(editingTask.id, editingTask);
      setEditingTask(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTask || !commentText.trim()) return;
    try {
      await onAddComment(currentTask.id, {
        author_name: commentAuthor,
        author_role: commentRole,
        comment_text: commentText.trim(),
        created_at: new Date().toLocaleString(),
      });
      setCommentText("");
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddAttachmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTask || !attData.file_name || !attData.file_url) return;
    try {
      await onAddAttachment(currentTask.id, attData);
      setAttData({
        file_name: "",
        file_url: "",
        description: "",
        uploaded_by: "Karthik Venkatesh (MC Maintenance)",
      });
    } catch (err) {
      console.error(err);
    }
  };

  const getNextStatus = (currentStatus: string): ADOTask["status"] | null => {
    if (currentStatus === "New") return "Active";
    if (currentStatus === "Active") return "Resolved";
    if (currentStatus === "Resolved") return "Closed";
    return null;
  };

  const getPrevStatus = (currentStatus: string): ADOTask["status"] | null => {
    if (currentStatus === "Closed") return "Resolved";
    if (currentStatus === "Resolved") return "Active";
    if (currentStatus === "Active") return "New";
    return null;
  };

  return (
    <div className="space-y-6">
      {/* ADO Board Header */}
      <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.8)]" />
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              5. Pendings List with Builder &amp; IGS (ADO Board)
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Azure DevOps-style board tracking handover deliverables, discussions, and evidence audit attachments.
          </p>
        </div>

        {/* Entity Switcher & View Switcher & Add Button */}
        <div className="flex flex-wrap items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode("kanban")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                viewMode === "kanban"
                  ? "bg-slate-800 text-white shadow-md border border-slate-700"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                viewMode === "table"
                  ? "bg-slate-800 text-white shadow-md border border-slate-700"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
          </div>

          {/* Add Work Item Button (Admin / Super Admin Only) */}
          {canEdit && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs sm:text-sm font-extrabold px-4 py-2.5 rounded-xl shadow-lg shadow-amber-500/20 transition transform active:scale-95 hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4 text-slate-950" />
              <span>New ADO Work Item</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl shadow-md flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search ADO code (e.g. ADO-101), engineer, title, tag..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 bg-slate-800/80 text-white placeholder-slate-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Entity Filter */}
          <select
            value={selectedEntity}
            onChange={(e) => setSelectedEntity(e.target.value)}
            className="bg-slate-800 text-white border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-bold focus:outline-none"
          >
            <option value="All">All Entities</option>
            <option value="Builder">Builder (Praneeth KKR)</option>
            <option value="IGS">IGS (Facility)</option>
            <option value="Joint">Joint Taskforce</option>
          </select>

          {/* Priority Filter */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="bg-slate-800 text-white border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-bold focus:outline-none"
          >
            <option value="All">All Priorities</option>
            {defaultPriorities.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-800 text-white border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-bold focus:outline-none"
          >
            <option value="All">All Categories</option>
            {defaultCategories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* VIEW 1: KANBAN BOARD */}
      {viewMode === "kanban" && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
          {columns.map((col) => {
            const colTasks = filteredTasks.filter((t) => t.status === col.id);

            return (
              <div
                key={col.id}
                className="bg-slate-950/70 rounded-2xl p-4 border border-slate-800/90 min-h-[480px] flex flex-col shadow-lg"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${col.dotColor}`} />
                    <span className="text-xs font-extrabold text-slate-200 tracking-wider uppercase">
                      {col.title}
                    </span>
                  </div>
                  <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full ${col.badgeBg}`}>
                    {colTasks.length}
                  </span>
                </div>

                {/* Task Cards Column Body */}
                <div className="space-y-3 flex-1">
                  {colTasks.length === 0 ? (
                    <div className="h-36 flex flex-col items-center justify-center text-center p-4 border border-dashed border-slate-800 rounded-xl bg-slate-900/30">
                      <CheckSquare className="w-6 h-6 text-slate-700 mb-1" />
                      <p className="text-xs text-slate-500 font-medium">No items in this state</p>
                    </div>
                  ) : (
                    colTasks.map((task) => {
                      const isBuilder =
                        task.assigned_to.includes("Builder") || task.entity_type === "Builder";
                      const nextSt = getNextStatus(task.status);
                      const prevSt = getPrevStatus(task.status);
                      const commentCount = task.comments?.length || 0;
                      const attCount = task.attachments?.length || 0;

                      return (
                        <div
                          key={task.id}
                          className="bg-slate-900/90 rounded-xl p-4 border border-slate-800 shadow-md hover:border-slate-700 hover:shadow-xl transition-all duration-200 group"
                        >
                          {/* Top ID, Entity Pill, Edit & Delete */}
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="font-mono text-[11px] font-extrabold text-sky-400 bg-sky-950/90 border border-sky-800 px-2 py-0.5 rounded-md">
                              {task.task_code || `ADO-${task.id}`}
                            </span>

                            <div className="flex items-center gap-1.5">
                              <span
                                className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${
                                  isBuilder
                                    ? "bg-orange-950 text-orange-300 border-orange-700/60"
                                    : "bg-purple-950 text-purple-300 border-purple-700/60"
                                }`}
                              >
                                {task.assigned_to}
                              </span>

                              {canEdit && (
                                <>
                                  <button
                                    onClick={() => setEditingTask(task)}
                                    title="Edit ADO Item"
                                    className="text-slate-500 hover:text-amber-300 p-0.5 transition"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    onClick={() => {
                                      if (confirm(`Delete deliverable "${task.title}"?`)) {
                                        onDeleteTask(task.id);
                                      }
                                    }}
                                    title="Delete ADO Item"
                                    className="text-slate-500 hover:text-rose-400 p-0.5 transition"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Title - Click to open discussion / evidence modal */}
                          <h4
                            onClick={() => {
                              setActiveTaskDetail(task);
                              setTaskDetailTab("discussion");
                            }}
                            className="text-xs sm:text-sm font-bold text-white leading-snug cursor-pointer group-hover:text-amber-300 transition"
                          >
                            {task.title}
                          </h4>

                          {/* Category tag */}
                          <div className="mt-2 flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                            <Layers className="w-3 h-3 text-slate-500" />
                            <span className="truncate">{task.category}</span>
                          </div>

                          {/* Progress Bar */}
                          <div className="mt-3">
                            <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono mb-1">
                              <span>Resolution Progress</span>
                              <span className="font-bold text-slate-200">{task.completion_percentage}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  task.completion_percentage === 100
                                    ? "bg-emerald-400"
                                    : task.completion_percentage > 50
                                    ? "bg-sky-400"
                                    : "bg-amber-400"
                                }`}
                                style={{ width: `${task.completion_percentage}%` }}
                              />
                            </div>
                          </div>

                          {/* Blockers Alert */}
                          {task.blockers && task.status !== "Closed" && (
                            <div className="mt-2.5 p-2 bg-rose-950/60 rounded-lg border border-rose-800/60 flex items-start gap-1.5 text-[11px] text-rose-200">
                              <AlertOctagon className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                              <p className="line-clamp-2 leading-tight font-medium">{task.blockers}</p>
                            </div>
                          )}

                          {/* Discussion & Evidence Pill Counters */}
                          <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-[11px]">
                            <button
                              onClick={() => {
                                setActiveTaskDetail(task);
                                setTaskDetailTab("discussion");
                              }}
                              className="flex items-center gap-1 text-slate-400 hover:text-sky-300 transition"
                            >
                              <MessageSquare className="w-3 h-3 text-sky-400" />
                              <span>{commentCount} Discussions</span>
                            </button>

                            <button
                              onClick={() => {
                                setActiveTaskDetail(task);
                                setTaskDetailTab("evidence");
                              }}
                              className="flex items-center gap-1 text-slate-400 hover:text-amber-300 transition"
                            >
                              <Paperclip className="w-3 h-3 text-amber-400" />
                              <span>{attCount} Proofs</span>
                            </button>
                          </div>

                          {/* Assignee & Due Date */}
                          <div className="mt-2.5 flex flex-col gap-1 text-[11px] text-slate-400">
                            {task.assignee_name && (
                              <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
                                <User className="w-3 h-3 text-slate-500 shrink-0" />
                                <span className="truncate">{task.assignee_name}</span>
                              </div>
                            )}

                            <div className="flex items-center justify-between gap-1 text-slate-400">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-slate-500" />
                                <span>{task.due_date || "No date"}</span>
                              </div>

                              <span
                                className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded border ${
                                  task.priority === "Critical"
                                    ? "bg-rose-950 text-rose-300 border-rose-600"
                                    : task.priority === "High"
                                    ? "bg-amber-950 text-amber-300 border-amber-600"
                                    : "bg-slate-800 text-slate-300 border-slate-700"
                                }`}
                              >
                                {task.priority}
                              </span>
                            </div>
                          </div>

                          {/* Navigation Buttons (Admin / Super Admin Only) */}
                          {canEdit && (
                            <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between gap-1">
                              {prevSt ? (
                                <button
                                  onClick={() => onUpdateStatus(task.id, prevSt)}
                                  className="text-[10px] font-semibold text-slate-400 hover:text-white flex items-center gap-0.5 px-2 py-1 rounded hover:bg-slate-800 transition"
                                >
                                  <ChevronLeft className="w-3 h-3" />
                                  <span>{prevSt}</span>
                                </button>
                              ) : (
                                <div />
                              )}

                              {nextSt && (
                                <button
                                  onClick={() => onUpdateStatus(task.id, nextSt)}
                                  className="text-[10px] font-bold text-sky-300 hover:text-white hover:bg-sky-500/20 flex items-center gap-0.5 px-2.5 py-1 rounded border border-sky-400/30 transition ml-auto"
                                >
                                  <span>Move to {nextSt}</span>
                                  <ChevronRight className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 2: DETAILED TABLE VIEW */}
      {viewMode === "table" && (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase font-bold border-b border-slate-800">
                <tr>
                  <th
                    onClick={() => {
                      setSortField("task_code");
                      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                    }}
                    className="p-3 cursor-pointer hover:text-white"
                  >
                    <div className="flex items-center gap-1">
                      Code <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    onClick={() => {
                      setSortField("title");
                      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                    }}
                    className="p-3 cursor-pointer hover:text-white"
                  >
                    <div className="flex items-center gap-1">
                      Title &amp; Category <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    onClick={() => {
                      setSortField("assigned_to");
                      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                    }}
                    className="p-3 cursor-pointer hover:text-white"
                  >
                    <div className="flex items-center gap-1">
                      Entity &amp; Engineer <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    onClick={() => {
                      setSortField("priority");
                      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                    }}
                    className="p-3 cursor-pointer hover:text-white"
                  >
                    <div className="flex items-center gap-1">
                      Priority <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    onClick={() => {
                      setSortField("status");
                      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                    }}
                    className="p-3 cursor-pointer hover:text-white"
                  >
                    <div className="flex items-center gap-1">
                      Status <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    onClick={() => {
                      setSortField("progress");
                      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                    }}
                    className="p-3 cursor-pointer hover:text-white"
                  >
                    <div className="flex items-center gap-1">
                      Progress <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    onClick={() => {
                      setSortField("due_date");
                      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                    }}
                    className="p-3 cursor-pointer hover:text-white"
                  >
                    <div className="flex items-center gap-1">
                      Target Due Date <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500 italic">
                      No ADO work items match filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-3 font-mono font-bold text-sky-400 whitespace-nowrap">
                        {t.task_code || `ADO-${t.id}`}
                      </td>
                      <td className="p-3">
                        <p
                          onClick={() => {
                            setActiveTaskDetail(t);
                            setTaskDetailTab("discussion");
                          }}
                          className="font-bold text-white hover:text-amber-300 cursor-pointer"
                        >
                          {t.title}
                        </p>
                        <p className="text-[11px] text-slate-400">{t.category}</p>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-800 text-slate-200 border border-slate-700">
                          {t.assigned_to}
                        </span>
                        {t.assignee_name && (
                          <p className="text-[11px] text-slate-400 mt-0.5">{t.assignee_name}</p>
                        )}
                      </td>
                      <td className="p-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            t.priority === "Critical"
                              ? "bg-rose-950 text-rose-300 border border-rose-700"
                              : t.priority === "High"
                              ? "bg-amber-950 text-amber-300 border border-amber-700"
                              : "bg-slate-800 text-slate-300"
                          }`}
                        >
                          {t.priority}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">
                          {t.status}
                        </span>
                      </td>
                      <td className="p-3 font-mono font-bold text-slate-200">
                        {t.completion_percentage}%
                      </td>
                      <td className="p-3 font-mono text-slate-400">{t.due_date || "-"}</td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setActiveTaskDetail(t);
                              setTaskDetailTab("discussion");
                            }}
                            className="p-1 text-slate-400 hover:text-sky-300"
                            title="View Discussions & Proofs"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                          {canEdit && (
                            <>
                              <button
                                onClick={() => setEditingTask(t)}
                                className="p-1 text-slate-400 hover:text-amber-300"
                                title="Edit Deliverable"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Delete deliverable "${t.title}"?`)) {
                                    onDeleteTask(t.id);
                                  }
                                }}
                                className="p-1 text-slate-400 hover:text-rose-400"
                                title="Delete Deliverable"
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

      {/* Interactive ADO Work Item Detail / Discussion & Evidence Modal */}
      {currentTask && (
        <Modal
          isOpen={Boolean(currentTask)}
          onClose={() => setActiveTaskDetail(null)}
          title={`${currentTask.task_code || "ADO"}: ${currentTask.title}`}
          subtitle="Work Item Discussion, Audit Evidence Proofs & SLA Details"
          maxWidth="2xl"
        >
          <div className="space-y-5">
            {/* Sub-tab Navigation */}
            <div className="flex space-x-2 border-b border-slate-800 pb-2">
              <button
                onClick={() => setTaskDetailTab("discussion")}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
                  taskDetailTab === "discussion"
                    ? "bg-sky-600 text-white"
                    : "text-slate-400 hover:text-white bg-slate-800"
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Discussion Thread ({currentComments.length})</span>
              </button>

              <button
                onClick={() => setTaskDetailTab("evidence")}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
                  taskDetailTab === "evidence"
                    ? "bg-amber-600 text-slate-950 font-extrabold"
                    : "text-slate-400 hover:text-white bg-slate-800"
                }`}
              >
                <Paperclip className="w-3.5 h-3.5" />
                <span>Evidence &amp; Test Proofs ({currentAttachments.length})</span>
              </button>

              {canEdit && (
                <button
                  onClick={() => {
                    setEditingTask(currentTask);
                    setActiveTaskDetail(null);
                  }}
                  className="px-3.5 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 text-slate-400 hover:text-white bg-slate-800"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Work Item</span>
                </button>
              )}
            </div>

            {/* TAB 1: DISCUSSION THREAD */}
            {taskDetailTab === "discussion" && (
              <div className="space-y-4">
                {/* Discussion Log List */}
                <div className="space-y-3 max-h-64 overflow-y-auto p-1">
                  {currentComments.length === 0 ? (
                    <p className="text-center text-slate-500 py-6 text-xs italic">
                      No discussion comments yet. Post the first update below.
                    </p>
                  ) : (
                    currentComments.map((c) => (
                      <div
                        key={c.id}
                        className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700 text-xs"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white">{c.author_name}</span>
                            <span className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded font-semibold">
                              {c.author_role}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">{c.created_at}</span>
                        </div>
                        <p className="text-slate-200 leading-relaxed">{c.comment_text}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Comment Box */}
                <form
                  onSubmit={handleAddCommentSubmit}
                  className="p-3.5 bg-slate-950 rounded-xl border border-sky-900/40 space-y-2.5"
                >
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 mb-1">Your Name</label>
                      <DynamicSelect
                        value={commentAuthor}
                        onChange={setCommentAuthor}
                        options={teamMemberNames.length ? teamMemberNames : ["Vikram Patel", "Rajesh Sharma", "Karthik Venkatesh"]}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 mb-1">Role / Designation</label>
                      <input
                        type="text"
                        value={commentRole}
                        onChange={(e) => setCommentRole(e.target.value)}
                        className="w-full text-xs p-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <textarea
                      rows={2}
                      required
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Write comment / minutes on inspection update with Builder & IGS..."
                      className="w-full text-xs p-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Post Comment to Discussion in Live DB</span>
                  </button>
                </form>
              </div>
            )}

            {/* TAB 2: EVIDENCE ATTACHMENTS */}
            {taskDetailTab === "evidence" && (
              <div className="space-y-4">
                {/* Upload Evidence Form (Admin / Super Admin Only) */}
                {canEdit ? (
                  <form
                    onSubmit={handleAddAttachmentSubmit}
                    className="p-4 bg-slate-950 rounded-xl border border-amber-900/40 space-y-3"
                  >
                    <h4 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                      <Paperclip className="w-3.5 h-3.5" />
                      <span>Attach Inspection Report / Defect Photo / Test Certificate</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-400 mb-1">Document / Proof Title *</label>
                        <input
                          type="text"
                          required
                          value={attData.file_name}
                          onChange={(e) => setAttData({ ...attData, file_name: e.target.value })}
                          placeholder="e.g. PU_Injection_Test_Report_B2.pdf"
                          className="w-full text-xs p-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-400 mb-1">Uploaded By</label>
                        <input
                          type="text"
                          value={attData.uploaded_by}
                          onChange={(e) => setAttData({ ...attData, uploaded_by: e.target.value })}
                          className="w-full text-xs p-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                        />
                      </div>
                    </div>

                    {/* File Upload Input */}
                    <FileUploadInput
                      label="Upload File / Document Proof"
                      value={attData.file_url}
                      onChange={(dataUrl, name) =>
                        setAttData({
                          ...attData,
                          file_url: dataUrl,
                          file_name: attData.file_name || name,
                        })
                      }
                    />

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 mb-1">Description / Summary</label>
                      <input
                        type="text"
                        value={attData.description || ""}
                        onChange={(e) => setAttData({ ...attData, description: e.target.value })}
                        placeholder="e.g. Signed inspection report with Builder engineers"
                        className="w-full text-xs p-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl transition shadow-md"
                    >
                      + Attach Evidence Document in Database
                    </button>
                  </form>
                ) : (
                  <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs text-slate-400">
                    <span>Resident View Only Mode: Inspection reports, defect photos, and test certificates are available below.</span>
                  </div>
                )}

                {/* Evidence List */}
                <div className="space-y-2.5 max-h-60 overflow-y-auto">
                  {currentAttachments.length === 0 ? (
                    <p className="text-center text-slate-500 py-4 text-xs italic">No evidence proofs attached yet.</p>
                  ) : (
                    currentAttachments.map((att) => (
                      <div
                        key={att.id}
                        className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <FileText className="w-4 h-4 text-amber-400 shrink-0" />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white">{att.file_name}</span>
                              <button
                                type="button"
                                onClick={() =>
                                  setPreviewDoc({
                                    url: att.file_url,
                                    title: `Evidence Document: ${att.file_name}`,
                                  })
                                }
                                className="inline-flex items-center gap-1 text-[11px] font-black text-amber-400 hover:text-amber-300 bg-amber-950/80 hover:bg-amber-900 border border-amber-600/80 px-2 py-0.5 rounded-lg transition"
                                title="View Attached Evidence / Inspection Report"
                              >
                                <Eye className="w-3 h-3" />
                                <span>View Document</span>
                              </button>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              {att.description || "Evidence attachment"} • Uploaded by {att.uploaded_by} on {att.created_at}
                            </p>
                          </div>
                        </div>

                        {canEdit && (
                          <button
                            onClick={() => onDeleteAttachment(att.id)}
                            className="text-slate-500 hover:text-rose-400 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Add Task Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Create New ADO Punchlist Work Item"
        subtitle="Assign critical handover deliverables to Builder or IGS Facility team"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateTask} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Work Item Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., STP Odor Filter Media Replacement & BOD Certification"
              className="w-full text-xs p-2.5 border rounded-xl bg-slate-800 border-slate-700 text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <DynamicSelect
                label="Assigned Entity"
                required
                value={formData.assigned_to}
                onChange={(val) =>
                  setFormData({
                    ...formData,
                    assigned_to: val,
                    entity_type: val.includes("IGS") ? "IGS" : "Builder",
                  })
                }
                options={defaultEntities}
              />
            </div>

            <div>
              <DynamicSelect
                label="Category"
                required
                value={formData.category}
                onChange={(val) => setFormData({ ...formData, category: val })}
                options={defaultCategories}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <DynamicSelect
                label="Status"
                value={formData.status}
                onChange={(val) => setFormData({ ...formData, status: val })}
                options={defaultStatuses}
              />
            </div>

            <div>
              <DynamicSelect
                label="Priority"
                value={formData.priority}
                onChange={(val) => setFormData({ ...formData, priority: val })}
                options={defaultPriorities}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">SLA (Days)</label>
              <input
                type="number"
                value={formData.sla_days}
                onChange={(e) => setFormData({ ...formData, sla_days: parseInt(e.target.value) || 7 })}
                className="w-full text-xs p-2.5 border rounded-xl bg-slate-800 border-slate-700 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <DynamicSelect
                label="Assignee Name"
                value={formData.assignee_name || ""}
                onChange={(val) => setFormData({ ...formData, assignee_name: val })}
                options={teamMemberNames.length ? teamMemberNames : ["Er. K. Verma", "Mr. D. Srinivasan", "Mr. Suresh R.", "Kishore N."]}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Target Due Date</label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="w-full text-xs p-2.5 border rounded-xl bg-slate-800 border-slate-700 text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Description &amp; Handover Criteria</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Outline specific technical deliverables, test reports needed..."
              className="w-full text-xs p-2.5 border rounded-xl bg-slate-800 border-slate-700 text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Blockers / Dependencies (if any)</label>
            <input
              type="text"
              value={formData.blockers}
              onChange={(e) => setFormData({ ...formData, blockers: e.target.value })}
              placeholder="e.g., Awaiting spare parts from OEM Bengaluru"
              className="w-full text-xs p-2.5 border rounded-xl bg-slate-800 border-slate-700 text-white"
            />
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
              {isSubmitting ? "Creating..." : "Add to ADO Board in DB"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Task Modal */}
      {editingTask && (
        <Modal
          isOpen={Boolean(editingTask)}
          onClose={() => setEditingTask(null)}
          title={`Edit Work Item: ${editingTask.task_code || "ADO"}`}
          subtitle="Update deliverable scope, assigned engineer, progress or priority"
          maxWidth="lg"
        >
          <form onSubmit={handleUpdateTaskSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Work Item Title *</label>
              <input
                type="text"
                required
                value={editingTask.title}
                onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                className="w-full text-xs p-2.5 border rounded-xl bg-slate-800 border-slate-700 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <DynamicSelect
                  label="Assigned Entity"
                  value={editingTask.assigned_to}
                  onChange={(val) =>
                    setEditingTask({
                      ...editingTask,
                      assigned_to: val,
                      entity_type: val.includes("IGS") ? "IGS" : "Builder",
                    })
                  }
                  options={defaultEntities}
                />
              </div>

              <div>
                <DynamicSelect
                  label="Category"
                  value={editingTask.category}
                  onChange={(val) => setEditingTask({ ...editingTask, category: val })}
                  options={defaultCategories}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <DynamicSelect
                  label="Status"
                  value={editingTask.status}
                  onChange={(val) => setEditingTask({ ...editingTask, status: val })}
                  options={defaultStatuses}
                />
              </div>

              <div>
                <DynamicSelect
                  label="Priority"
                  value={editingTask.priority}
                  onChange={(val) => setEditingTask({ ...editingTask, priority: val })}
                  options={defaultPriorities}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Progress (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={editingTask.completion_percentage}
                  onChange={(e) =>
                    setEditingTask({
                      ...editingTask,
                      completion_percentage: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full text-xs p-2.5 border rounded-xl bg-slate-800 border-slate-700 text-white font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <DynamicSelect
                  label="Assignee Name"
                  value={editingTask.assignee_name || ""}
                  onChange={(val) => setEditingTask({ ...editingTask, assignee_name: val })}
                  options={teamMemberNames.length ? teamMemberNames : ["Er. K. Verma", "Mr. D. Srinivasan", "Mr. Suresh R.", "Kishore N."]}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Target Due Date</label>
                <input
                  type="date"
                  value={editingTask.due_date || ""}
                  onChange={(e) => setEditingTask({ ...editingTask, due_date: e.target.value })}
                  className="w-full text-xs p-2.5 border rounded-xl bg-slate-800 border-slate-700 text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Blockers</label>
              <input
                type="text"
                value={editingTask.blockers || ""}
                onChange={(e) => setEditingTask({ ...editingTask, blockers: e.target.value })}
                className="w-full text-xs p-2.5 border rounded-xl bg-slate-800 border-slate-700 text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
              <textarea
                rows={3}
                value={editingTask.description || ""}
                onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                className="w-full text-xs p-2.5 border rounded-xl bg-slate-800 border-slate-700 text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingTask(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl shadow-md transition"
              >
                Save Work Item Changes to Live DB
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Reusable Evidence & Document Preview Modal */}
      <DocumentPreviewModal
        isOpen={Boolean(previewDoc)}
        onClose={() => setPreviewDoc(null)}
        url={previewDoc?.url}
        title={previewDoc?.title}
      />
    </div>
  );
}
