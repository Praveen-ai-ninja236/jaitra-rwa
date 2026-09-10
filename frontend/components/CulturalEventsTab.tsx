"use client";

import React, { useState, useMemo } from "react";
import {
  CulturalEvent,
  CulturalEventCreate,
  CulturalParticipant,
  CulturalParticipantCreate,
  CulturalAgenda,
  CulturalAgendaCreate,
  UserRole,
  DropdownCategoryMap,
  TeamMember,
} from "../lib/types";
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Phone,
  Plus,
  Search,
  Filter,
  Users,
  Trophy,
  CheckCircle2,
  Trash2,
  IndianRupee,
  Sparkles,
  Ticket,
  Mic,
  Music,
  Tv,
  Edit3,
  ListOrdered,
  UserPlus,
  ChevronRight,
  Edit,
} from "lucide-react";
import Modal from "./Modal";
import DynamicSelect from "./DynamicSelect";

interface CulturalEventsTabProps {
  events: CulturalEvent[];
  onAddEvent: (event: CulturalEventCreate) => Promise<void>;
  onUpdateEvent: (id: number, event: Partial<CulturalEventCreate>) => Promise<void>;
  onDeleteEvent: (id: number) => Promise<void>;
  onAddParticipant: (eventId: number, part: CulturalParticipantCreate) => Promise<void>;
  onUpdateParticipant: (participantId: number, part: Partial<CulturalParticipantCreate>) => Promise<void>;
  onDeleteParticipant: (participantId: number) => Promise<void>;
  onAddAgenda: (eventId: number, agenda: CulturalAgendaCreate) => Promise<void>;
  onUpdateAgenda: (agendaId: number, agenda: Partial<CulturalAgendaCreate>) => Promise<void>;
  onDeleteAgenda: (agendaId: number) => Promise<void>;
  isLoading: boolean;
  userRole?: UserRole;
  isGuest?: boolean;
  dropdownMap?: DropdownCategoryMap;
  teamMembers?: TeamMember[];
}

export default function CulturalEventsTab({
  events,
  onAddEvent,
  onUpdateEvent,
  onDeleteEvent,
  onAddParticipant,
  onUpdateParticipant,
  onDeleteParticipant,
  onAddAgenda,
  onUpdateAgenda,
  onDeleteAgenda,
  isLoading,
  userRole = "Super Admin",
  isGuest = false,
  dropdownMap = {},
  teamMembers = [],
}: CulturalEventsTabProps) {
  const teamMemberNames = teamMembers.map((m) => m.name).filter(Boolean);
  const canEdit = userRole === "Super Admin" || userRole === "Admin" || userRole === "Staff";
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CulturalEvent | null>(null);
  const [activeEventDetail, setActiveEventDetail] = useState<CulturalEvent | null>(null);
  const [detailTab, setDetailTab] = useState<"details" | "participants" | "agenda">("participants");

  const [editingParticipant, setEditingParticipant] = useState<CulturalParticipant | null>(null);
  const [editingAgenda, setEditingAgenda] = useState<CulturalAgenda | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Event Form State
  const [formData, setFormData] = useState<CulturalEventCreate>({
    title: "",
    category: "Sports",
    event_date: "",
    time: "07:00 AM - 01:00 PM",
    venue: "Clubhouse Indoor Arena",
    description: "",
    coordinator: "",
    coordinator_contact: "",
    status: "Upcoming",
    registered_count: 0,
    budget: "₹ 25,000",
  });

  // Participant Form State
  const [partData, setPartData] = useState<CulturalParticipantCreate>({
    tower: "Tower A",
    flat_no: "201",
    participant_name: "",
    age_group: "Adult (25-50)",
    activity_category: "Badminton Singles",
    contact_no: "",
    notes: "",
    registration_date: new Date().toISOString().split("T")[0],
  });

  // Agenda Form State
  const [agendaData, setAgendaData] = useState<CulturalAgendaCreate>({
    slot_time: "06:00 PM - 06:30 PM",
    performer_or_speaker: "",
    activity_topic: "",
    stage_coordinator: "",
    duration_mins: 30,
  });

  const defaultCategories = dropdownMap["cultural_categories"]?.length ? dropdownMap["cultural_categories"] : ["Sports", "Music & Performing Arts", "Kids Workshop", "Health & Wellness", "Cultural & Arts", "Quiz & Debates"];
  const defaultStatuses = ["Upcoming", "Ongoing", "Completed", "Planning"];
  const defaultTowers = dropdownMap["towers"]?.length ? dropdownMap["towers"] : ["Tower A", "Tower B", "Tower C", "Tower D", "Tower E", "Tower F", "Jaitra Management"];
  const defaultActivityCategories = dropdownMap["cultural_activities"]?.length ? dropdownMap["cultural_activities"] : [
    "Badminton Singles",
    "Badminton Doubles",
    "Cricket League",
    "Singing / Classical Vocal",
    "Solo Dance Performance",
    "Group Dance (Folk/Bollywood)",
    "Kids Drawing / Pottery",
    "Chess & Indoor Games",
    "Drama / Skit",
    "Speaker / Keynote Address",
    "Yoga & Wellness Demo",
  ];
  const defaultAgeGroups = ["Junior (<14)", "Youth (14-25)", "Adult (25-50)", "Senior (50+)"];

  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      const matchSearch =
        ev.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ev.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ev.coordinator.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ev.venue.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategory =
        selectedCategory === "All" ||
        ev.category.toLowerCase().includes(selectedCategory.toLowerCase());
      const matchStatus = selectedStatus === "All" || ev.status === selectedStatus;
      return matchSearch && matchCategory && matchStatus;
    });
  }, [events, searchTerm, selectedCategory, selectedStatus]);

  const currentEvent = useMemo(() => {
    if (!activeEventDetail) return null;
    return events.find((e) => e.id === activeEventDetail.id) || activeEventDetail;
  }, [events, activeEventDetail]);

  const currentParticipants = currentEvent?.participants || [];
  const currentAgendas = currentEvent?.agendas || [];

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.event_date || !formData.coordinator) return;
    setIsSubmitting(true);
    try {
      await onAddEvent(formData);
      setIsAddModalOpen(false);
      setFormData({
        title: "",
        category: "Sports",
        event_date: "",
        time: "07:00 AM - 01:00 PM",
        venue: "Clubhouse Indoor Arena",
        description: "",
        coordinator: "",
        coordinator_contact: "",
        status: "Upcoming",
        registered_count: 0,
        budget: "₹ 25,000",
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;
    setIsSubmitting(true);
    try {
      await onUpdateEvent(editingEvent.id, editingEvent);
      setEditingEvent(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddParticipantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEvent || !partData.participant_name) return;
    try {
      await onAddParticipant(currentEvent.id, partData);
      setPartData({
        tower: "Tower A",
        flat_no: "201",
        participant_name: "",
        age_group: "Adult (25-50)",
        activity_category: "Badminton Singles",
        contact_no: "",
        notes: "",
        registration_date: new Date().toISOString().split("T")[0],
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateParticipantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingParticipant) return;
    try {
      await onUpdateParticipant(editingParticipant.id, editingParticipant);
      setEditingParticipant(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddAgendaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEvent || !agendaData.performer_or_speaker || !agendaData.activity_topic) return;
    try {
      await onAddAgenda(currentEvent.id, agendaData);
      setAgendaData({
        slot_time: "06:00 PM - 06:30 PM",
        performer_or_speaker: "",
        activity_topic: "",
        stage_coordinator: "",
        duration_mins: 30,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateAgendaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAgenda) return;
    try {
      await onUpdateAgenda(editingAgenda.id, editingAgenda);
      setEditingAgenda(null);
    } catch (err) {
      console.error(err);
    }
  };

  const getCategoryGradient = (cat: string) => {
    if (cat.includes("Sports")) return "from-emerald-950/60 to-slate-900 border-emerald-500/30";
    if (cat.includes("Music") || cat.includes("Arts"))
      return "from-indigo-950/60 to-slate-900 border-indigo-500/30";
    if (cat.includes("Kids") || cat.includes("Workshop"))
      return "from-sky-950/60 to-slate-900 border-sky-500/30";
    return "from-purple-950/60 to-slate-900 border-purple-500/30";
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-3 h-3 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)]" />
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              1. Cultural &amp; Sports Events
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Participant lists, sports tournaments, singing/dancing schedules, and speaker agendas across Towers A-F.
          </p>
        </div>

        {canEdit && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-500/20 transition transform active:scale-95 hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule New Event</span>
          </button>
        )}
      </div>

      {/* Filters Bar */}
      <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl shadow-md flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search events, coordinators, venues..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 bg-slate-800/80 text-white placeholder-slate-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 text-xs">
            <Filter className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-slate-400 font-medium">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent font-bold text-white focus:outline-none cursor-pointer"
            >
              <option value="All">All Categories</option>
              {defaultCategories.map((c) => (
                <option key={c} value={c} className="bg-slate-900 text-white">
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 text-xs">
            <span className="text-slate-400 font-medium">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-transparent font-bold text-white focus:outline-none cursor-pointer"
            >
              <option value="All">All Statuses</option>
              {defaultStatuses.map((s) => (
                <option key={s} value={s} className="bg-slate-900 text-white">
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Events Grid */}
      {filteredEvents.length === 0 ? (
        <div className="bg-slate-900/60 rounded-2xl p-12 text-center border border-slate-800 shadow-md">
          <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-300">No cultural events found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Click &quot;Schedule New Event&quot; above to create a new event program.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredEvents.map((event) => {
            const parts = event.participants || [];
            const agendas = event.agendas || [];

            return (
              <div
                key={event.id}
                className={`bg-gradient-to-br ${getCategoryGradient(
                  event.category
                )} rounded-2xl p-6 border shadow-lg hover:shadow-xl transition-all duration-200 flex flex-col justify-between group`}
              >
                <div>
                  {/* Badges row */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-3 py-1 text-[11px] font-bold rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {event.category}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                          event.status === "Upcoming"
                            ? "bg-emerald-950/80 text-emerald-300 border-emerald-600/60"
                            : event.status === "Ongoing"
                            ? "bg-amber-950/80 text-amber-300 border-amber-600/60 animate-pulse"
                            : "bg-slate-800 text-slate-400 border-slate-700"
                        }`}
                      >
                        {event.status}
                      </span>

                      {canEdit && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingEvent(event);
                            }}
                            title="Edit Event"
                            className="text-slate-400 hover:text-amber-300 p-1.5 bg-slate-800/80 rounded-lg border border-slate-700 transition"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Delete cultural event "${event.title}"?`)) {
                                onDeleteEvent(event.id);
                              }
                            }}
                            title="Delete Event"
                            className="text-slate-400 hover:text-rose-400 p-1.5 bg-slate-800/80 rounded-lg border border-slate-700 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3
                    onClick={() => {
                      setActiveEventDetail(event);
                      setDetailTab("participants");
                    }}
                    className={`text-lg sm:text-xl font-extrabold text-white leading-snug transition flex items-center justify-between cursor-pointer group-hover:text-indigo-200`}
                  >
                    <span>{event.title}</span>
                    <ChevronRight className="w-5 h-5 text-indigo-400 opacity-80 group-hover:translate-x-1 transition" />
                  </h3>
                  <p className="text-xs text-slate-300 mt-2.5 leading-relaxed font-normal">
                    {event.description}
                  </p>

                  {/* Schedule Details */}
                  <div className="grid grid-cols-2 gap-2.5 mt-4 p-3.5 bg-slate-900/80 rounded-xl border border-slate-800 text-xs">
                    <div className="flex items-center gap-2 text-slate-300 font-semibold">
                      <Calendar className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span>{event.event_date}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300 font-semibold">
                      <Clock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span>{event.time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300 font-semibold col-span-2">
                      <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span className="truncate">{event.venue}</span>
                    </div>
                  </div>

                  {/* Coordinator & Budget */}
                  <div className="mt-3.5 flex items-center justify-between text-xs text-slate-400 pt-2.5 border-t border-slate-800">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        Coord: <strong className="text-slate-200">{event.coordinator}</strong>
                      </span>
                    </div>
                    {!isGuest && event.budget && (
                      <div className="flex items-center gap-1 text-slate-200 font-mono text-[11px] font-bold bg-slate-800/90 border border-slate-700 px-2 py-0.5 rounded">
                        <IndianRupee className="w-3 h-3 text-slate-400" />
                        <span>{event.budget.replace("₹", "").trim()}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Registration & View Details */}
                <div className="mt-5 pt-3.5 border-t border-slate-800 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs">
                    <Users className="w-4 h-4 text-emerald-400" />
                    <span className="font-extrabold text-white text-sm">
                      {parts.length || event.registered_count}
                    </span>
                    <span className="text-slate-400 text-[11px]">Enrolled Participants</span>
                  </div>

                  <button
                    onClick={() => {
                      setActiveEventDetail(event);
                      setDetailTab("participants");
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-300 hover:text-white bg-indigo-500/20 hover:bg-indigo-500/30 px-3.5 py-1.5 rounded-xl border border-indigo-400/40 transition shadow-sm"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{isGuest ? "View Details" : "View / Manage Participants"}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cultural Event Detailed View Modal */}
      {currentEvent && (
        <Modal
          isOpen={Boolean(currentEvent)}
          onClose={() => setActiveEventDetail(null)}
          title={`${currentEvent.title} — Event Manager`}
          subtitle={isGuest ? "View-only mode — sign in to manage participants & agendas" : "View / Edit Details, Tower-wise Participants & Speaker Agendas"}
          maxWidth="2xl"
        >
          <div className="space-y-5">
            {/* Modal Top Sub-Tabs */}
            <div className="flex space-x-2 border-b border-slate-800 pb-2">
              <button
                onClick={() => setDetailTab("participants")}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
                  detailTab === "participants"
                    ? "bg-indigo-600 text-white"
                    : "text-slate-400 hover:text-white bg-slate-800"
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Participants ({currentParticipants.length})</span>
              </button>

              <button
                onClick={() => setDetailTab("agenda")}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
                  detailTab === "agenda"
                    ? "bg-indigo-600 text-white"
                    : "text-slate-400 hover:text-white bg-slate-800"
                }`}
              >
                <ListOrdered className="w-3.5 h-3.5" />
                <span>Agenda &amp; Timeline ({currentAgendas.length})</span>
              </button>

              {canEdit && (
                <button
                  onClick={() => {
                    setEditingEvent(currentEvent);
                    setActiveEventDetail(null);
                  }}
                  className="px-3.5 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 text-slate-400 hover:text-white bg-slate-800"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Event Details</span>
                </button>
              )}
            </div>

            {/* TAB 1: PARTICIPANTS LIST & ADD FORM */}
            {detailTab === "participants" && (
              <div className="space-y-4">
                {/* Add Participant Form (Admin / Super Admin Only) */}
                {canEdit ? (
                  <form
                    onSubmit={handleAddParticipantSubmit}
                    className="p-4 bg-slate-950 rounded-xl border border-indigo-900/50 space-y-3"
                  >
                    <h4 className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Register Participant by Tower &amp; Activity</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                      <div>
                        <DynamicSelect
                          label="Tower"
                          required
                          value={partData.tower}
                          onChange={(val) => setPartData({ ...partData, tower: val })}
                          options={defaultTowers}
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-400 mb-1">Flat No *</label>
                        <input
                          type="text"
                          required
                          value={partData.flat_no}
                          onChange={(e) => setPartData({ ...partData, flat_no: e.target.value })}
                          placeholder="e.g. G01, 101, 502, 1404 (Ground + 14 Floors)"
                          className="w-full text-xs p-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-semibold text-slate-400 mb-1">Participant Name *</label>
                        <input
                          type="text"
                          required
                          value={partData.participant_name}
                          onChange={(e) => setPartData({ ...partData, participant_name: e.target.value })}
                          placeholder="e.g. Ananya Sen / Arjun"
                          className="w-full text-xs p-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <DynamicSelect
                          label="Age Category"
                          value={partData.age_group}
                          onChange={(val) => setPartData({ ...partData, age_group: val })}
                          options={defaultAgeGroups}
                        />
                      </div>

                      <div className="col-span-2">
                        <DynamicSelect
                          label="Participating For Activity"
                          required
                          value={partData.activity_category}
                          onChange={(val) => setPartData({ ...partData, activity_category: val })}
                          options={defaultActivityCategories}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-400 mb-1">Contact Phone</label>
                        <input
                          type="text"
                          value={partData.contact_no}
                          onChange={(e) => setPartData({ ...partData, contact_no: e.target.value })}
                          placeholder="+91 98450 11223"
                          className="w-full text-xs p-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-400 mb-1">Special Notes / Seed</label>
                        <input
                          type="text"
                          value={partData.notes}
                          onChange={(e) => setPartData({ ...partData, notes: e.target.value })}
                          placeholder="Song track provided / Doubles partner"
                          className="w-full text-xs p-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition shadow-md"
                    >
                      + Add Participant to Database
                    </button>
                  </form>
                ) : (
                  <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs text-slate-400">
                    <span>Resident View Only Mode: Registered participant list is shown below.</span>
                  </div>
                )}

                {/* Participants Table */}
                <div className="overflow-x-auto max-h-60 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-800 text-slate-400 uppercase font-bold sticky top-0">
                      <tr>
                        <th className="p-2.5">Tower &amp; Flat</th>
                        <th className="p-2.5">Participant Name</th>
                        <th className="p-2.5">Age</th>
                        <th className="p-2.5">Activity / Category</th>
                        <th className="p-2.5">Contact</th>
                        <th className="p-2.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      {currentParticipants.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-4 text-center text-slate-500 italic">
                            No registered participants yet.
                          </td>
                        </tr>
                      ) : (
                        currentParticipants.map((p) => (
                          <tr key={p.id} className="hover:bg-slate-800/40">
                            <td className="p-2.5 font-bold text-white">
                              {p.tower} - {p.flat_no}
                            </td>
                            <td className="p-2.5 font-semibold text-slate-200">{p.participant_name}</td>
                            <td className="p-2.5 text-slate-400">{p.age_group}</td>
                            <td className="p-2.5">
                              <span className="bg-indigo-950 text-indigo-300 border border-indigo-800 px-2 py-0.5 rounded text-[11px] font-semibold">
                                {p.activity_category}
                              </span>
                            </td>
                            <td className="p-2.5 font-mono text-slate-400">{p.contact_no || "—"}</td>
                            <td className="p-2.5 text-right">
                              {canEdit ? (
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => setEditingParticipant(p)}
                                    className="text-slate-400 hover:text-amber-300 p-1"
                                    title="Edit Participant"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (confirm(`Remove participant ${p.participant_name}?`)) {
                                        onDeleteParticipant(p.id);
                                      }
                                    }}
                                    className="text-slate-400 hover:text-rose-400 p-1"
                                    title="Delete Participant"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[10px] text-slate-500 font-mono">Enrolled</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 2: AGENDAS & SPEAKER TIMELINES */}
            {detailTab === "agenda" && (
              <div className="space-y-4">
                {/* Add Agenda Slot Form (Admin / Super Admin Only) */}
                {canEdit ? (
                  <form
                    onSubmit={handleAddAgendaSubmit}
                    className="p-4 bg-slate-950 rounded-xl border border-indigo-900/50 space-y-3"
                  >
                    <h4 className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Speaker / Performance Timeline Slot</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-400 mb-1">Time Slot *</label>
                        <input
                          type="text"
                          required
                          value={agendaData.slot_time}
                          onChange={(e) => setAgendaData({ ...agendaData, slot_time: e.target.value })}
                          placeholder="e.g. 06:30 PM - 07:00 PM"
                          className="w-full text-xs p-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-400 mb-1">Performer / Speaker *</label>
                        <input
                          type="text"
                          required
                          value={agendaData.performer_or_speaker}
                          onChange={(e) =>
                            setAgendaData({ ...agendaData, performer_or_speaker: e.target.value })
                          }
                          placeholder="e.g. Tower C Classical Group"
                          className="w-full text-xs p-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-400 mb-1">Activity / Topic *</label>
                        <input
                          type="text"
                          required
                          value={agendaData.activity_topic}
                          onChange={(e) =>
                            setAgendaData({ ...agendaData, activity_topic: e.target.value })
                          }
                          placeholder="e.g. Carnatic Vocal Medley"
                          className="w-full text-xs p-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-400 mb-1">Stage Coordinator</label>
                        <input
                          type="text"
                          value={agendaData.stage_coordinator}
                          onChange={(e) =>
                            setAgendaData({ ...agendaData, stage_coordinator: e.target.value })
                          }
                          placeholder="e.g. Radhika Nambiar"
                          className="w-full text-xs p-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-slate-400 mb-1">Duration (Mins)</label>
                        <input
                          type="number"
                          value={agendaData.duration_mins}
                          onChange={(e) =>
                            setAgendaData({ ...agendaData, duration_mins: parseInt(e.target.value) || 30 })
                          }
                          className="w-full text-xs p-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition shadow-md"
                    >
                      + Add Agenda Timeline Slot
                    </button>
                  </form>
                ) : (
                  <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs text-slate-400">
                    <span>Resident View Only Mode: Event schedule and speaker timeline are listed below.</span>
                  </div>
                )}

                {/* Agenda Timeline Cards */}
                <div className="space-y-2.5 max-h-64 overflow-y-auto">
                  {currentAgendas.length === 0 ? (
                    <p className="text-center text-slate-500 py-4 text-xs italic">No timeline slots entered yet.</p>
                  ) : (
                    currentAgendas.map((ag) => (
                      <div
                        key={ag.id}
                        className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <div className="bg-indigo-950 text-indigo-300 font-mono font-bold px-2.5 py-1 rounded-lg border border-indigo-800 text-[11px]">
                            {ag.slot_time}
                          </div>
                          <div>
                            <p className="font-bold text-white">{ag.activity_topic}</p>
                            <p className="text-slate-400 text-[11px]">
                              Performer/Speaker: <strong className="text-slate-200">{ag.performer_or_speaker}</strong>{" "}
                              {ag.stage_coordinator ? `(Stage: ${ag.stage_coordinator})` : ""}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {canEdit ? (
                            <>
                              <button
                                onClick={() => setEditingAgenda(ag)}
                                className="text-slate-400 hover:text-amber-300 p-1"
                                title="Edit Agenda"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Remove agenda slot "${ag.activity_topic}"?`)) {
                                    onDeleteAgenda(ag.id);
                                  }
                                }}
                                className="text-slate-400 hover:text-rose-400 p-1"
                                title="Delete Agenda"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <span className="text-[10px] text-slate-500 font-mono">Scheduled</span>
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

      {/* Add Event Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Schedule New Cultural / Sports Event"
        subtitle="Fill in event details to publish to society calendar"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateEvent} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Event Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Jaitra Table Tennis & Badminton Tournament"
              className="w-full text-xs p-2.5 border rounded-xl bg-slate-800 border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <DynamicSelect
                label="Category"
                required
                value={formData.category}
                onChange={(val) => setFormData({ ...formData, category: val })}
                options={defaultCategories}
              />
            </div>
            <div>
              <DynamicSelect
                label="Status"
                required
                value={formData.status}
                onChange={(val) => setFormData({ ...formData, status: val })}
                options={defaultStatuses}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Event Date *</label>
              <input
                type="date"
                required
                value={formData.event_date}
                onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                className="w-full text-xs p-2.5 border rounded-xl bg-slate-800 border-slate-700 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Timing *</label>
              <input
                type="text"
                required
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                placeholder="e.g., 07:00 AM - 01:00 PM"
                className="w-full text-xs p-2.5 border rounded-xl bg-slate-800 border-slate-700 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <DynamicSelect
              label="Venue Location"
              value={formData.venue}
              onChange={(val) => setFormData({ ...formData, venue: val })}
              options={[
                "Clubhouse Indoor Arena",
                "Clubhouse Multipurpose Studio",
                "Sports Turf",
                "Central Mandapam",
                "Amphitheatre",
              ]}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Description &amp; Highlights</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Provide event details, age eligibility, registration guidelines..."
              className="w-full text-xs p-2.5 border rounded-xl bg-slate-800 border-slate-700 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <DynamicSelect
                label="Coordinator"
                value={formData.coordinator}
                onChange={(val) => setFormData({ ...formData, coordinator: val })}
                options={teamMemberNames.length ? teamMemberNames : ["Dr. Swati Sen", "Vivek Murthy", "Rajesh Sharma"]}
              />
            </div>
            <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Coordinator Contact (Optional)</label>
              <input
                type="text"
                value={formData.coordinator_contact}
                onChange={(e) => setFormData({ ...formData, coordinator_contact: e.target.value })}
                placeholder="e.g., +91 98450 11223"
                className="w-full text-xs p-2.5 border rounded-xl bg-slate-800 border-slate-700 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Estimated Budget</label>
            <input
              type="text"
              value={formData.budget}
              onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
              placeholder="e.g., ₹ 35,000"
              className="w-full text-xs p-2.5 border rounded-xl bg-slate-800 border-slate-700 text-white focus:outline-none focus:border-indigo-500"
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
              className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md transition disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Create Event in DB"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Event Modal */}
      {editingEvent && (
        <Modal
          isOpen={Boolean(editingEvent)}
          onClose={() => setEditingEvent(null)}
          title={`Edit Event: ${editingEvent.title}`}
          subtitle="Update event details, timing, venue, or status in DB"
          maxWidth="lg"
        >
          <form onSubmit={handleUpdateEventSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Event Title *</label>
              <input
                type="text"
                required
                value={editingEvent.title}
                onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })}
                className="w-full text-xs p-2.5 border rounded-xl bg-slate-800 border-slate-700 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <DynamicSelect
                  label="Category"
                  value={editingEvent.category}
                  onChange={(val) => setEditingEvent({ ...editingEvent, category: val })}
                  options={defaultCategories}
                />
              </div>
              <div>
                <DynamicSelect
                  label="Status"
                  value={editingEvent.status}
                  onChange={(val) => setEditingEvent({ ...editingEvent, status: val })}
                  options={defaultStatuses}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Event Date</label>
                <input
                  type="date"
                  value={editingEvent.event_date}
                  onChange={(e) => setEditingEvent({ ...editingEvent, event_date: e.target.value })}
                  className="w-full text-xs p-2.5 border rounded-xl bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Timing</label>
                <input
                  type="text"
                  value={editingEvent.time}
                  onChange={(e) => setEditingEvent({ ...editingEvent, time: e.target.value })}
                  className="w-full text-xs p-2.5 border rounded-xl bg-slate-800 border-slate-700 text-white"
                />
              </div>
            </div>

            <div>
              <DynamicSelect
                label="Venue Location"
                value={editingEvent.venue}
                onChange={(val) => setEditingEvent({ ...editingEvent, venue: val })}
                options={[
                  "Clubhouse Indoor Arena",
                  "Clubhouse Multipurpose Studio",
                  "Sports Turf",
                  "Central Mandapam",
                  "Amphitheatre",
                ]}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
              <textarea
                rows={3}
                value={editingEvent.description || ""}
                onChange={(e) => setEditingEvent({ ...editingEvent, description: e.target.value })}
                className="w-full text-xs p-2.5 border rounded-xl bg-slate-800 border-slate-700 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <DynamicSelect
                  label="Coordinator"
                  value={editingEvent.coordinator}
                  onChange={(val) => setEditingEvent({ ...editingEvent, coordinator: val })}
                  options={teamMemberNames.length ? teamMemberNames : ["Dr. Swati Sen", "Vivek Murthy", "Rajesh Sharma"]}
                />
              </div>
              <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Coordinator Contact (Optional)</label>
                <input
                  type="text"
                  value={editingEvent.coordinator_contact || ""}
                  onChange={(e) =>
                    setEditingEvent({ ...editingEvent, coordinator_contact: e.target.value })
                  }
                  className="w-full text-xs p-2.5 border rounded-xl bg-slate-800 border-slate-700 text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingEvent(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md"
              >
                {isSubmitting ? "Saving..." : "Save Updates in DB"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Participant Modal */}
      {editingParticipant && (
        <Modal
          isOpen={Boolean(editingParticipant)}
          onClose={() => setEditingParticipant(null)}
          title="Edit Participant"
          subtitle="Modify participant name, tower, activity or contact"
          maxWidth="md"
        >
          <form onSubmit={handleUpdateParticipantSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <DynamicSelect
                  label="Tower"
                  value={editingParticipant.tower}
                  onChange={(val) => setEditingParticipant({ ...editingParticipant, tower: val })}
                  options={defaultTowers}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Flat No</label>
                <input
                  type="text"
                  value={editingParticipant.flat_no}
                  onChange={(e) =>
                    setEditingParticipant({ ...editingParticipant, flat_no: e.target.value })
                  }
                  className="w-full text-xs p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Participant Name</label>
              <input
                type="text"
                value={editingParticipant.participant_name}
                onChange={(e) =>
                  setEditingParticipant({ ...editingParticipant, participant_name: e.target.value })
                }
                className="w-full text-xs p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <DynamicSelect
                  label="Age Category"
                  value={editingParticipant.age_group}
                  onChange={(val) => setEditingParticipant({ ...editingParticipant, age_group: val })}
                  options={defaultAgeGroups}
                />
              </div>
              <div>
                <DynamicSelect
                  label="Activity Category"
                  value={editingParticipant.activity_category}
                  onChange={(val) =>
                    setEditingParticipant({ ...editingParticipant, activity_category: val })
                  }
                  options={defaultActivityCategories}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Contact No</label>
              <input
                type="text"
                value={editingParticipant.contact_no || ""}
                onChange={(e) =>
                  setEditingParticipant({ ...editingParticipant, contact_no: e.target.value })
                }
                className="w-full text-xs p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingParticipant(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl"
              >
                Save Participant Updates
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Agenda Modal */}
      {editingAgenda && (
        <Modal
          isOpen={Boolean(editingAgenda)}
          onClose={() => setEditingAgenda(null)}
          title="Edit Agenda Timeline Slot"
          subtitle="Modify slot timing, performer or activity topic"
          maxWidth="md"
        >
          <form onSubmit={handleUpdateAgendaSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Time Slot</label>
              <input
                type="text"
                value={editingAgenda.slot_time}
                onChange={(e) => setEditingAgenda({ ...editingAgenda, slot_time: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Performer / Speaker</label>
              <input
                type="text"
                value={editingAgenda.performer_or_speaker}
                onChange={(e) =>
                  setEditingAgenda({ ...editingAgenda, performer_or_speaker: e.target.value })
                }
                className="w-full text-xs p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Activity / Topic</label>
              <input
                type="text"
                value={editingAgenda.activity_topic}
                onChange={(e) =>
                  setEditingAgenda({ ...editingAgenda, activity_topic: e.target.value })
                }
                className="w-full text-xs p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Stage Coordinator</label>
                <input
                  type="text"
                  value={editingAgenda.stage_coordinator || ""}
                  onChange={(e) =>
                    setEditingAgenda({ ...editingAgenda, stage_coordinator: e.target.value })
                  }
                  className="w-full text-xs p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Duration (Mins)</label>
                <input
                  type="number"
                  value={editingAgenda.duration_mins}
                  onChange={(e) =>
                    setEditingAgenda({ ...editingAgenda, duration_mins: parseInt(e.target.value) || 30 })
                  }
                  className="w-full text-xs p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingAgenda(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl"
              >
                Save Agenda Updates
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
