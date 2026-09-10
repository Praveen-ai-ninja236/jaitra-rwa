"use client";

import React, { useState, useMemo } from "react";
import { GeneralBodyMeeting, GeneralBodyMeetingCreate, UserRole, DropdownCategoryMap } from "../lib/types";
import {
  FileText,
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle,
  Plus,
  Search,
  Download,
  Trash2,
  FileCheck2,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Landmark,
  Edit3,
  ExternalLink,
  Edit,
  Paperclip,
  Eye,
} from "lucide-react";
import Modal from "./Modal";
import DynamicSelect from "./DynamicSelect";
import FileUploadInput from "./FileUploadInput";
import DocumentPreviewModal from "./DocumentPreviewModal";

interface GeneralBodyMeetingsTabProps {
  meetings: GeneralBodyMeeting[];
  onAddMeeting: (meeting: GeneralBodyMeetingCreate) => Promise<void>;
  onUpdateMeeting: (id: number, meeting: Partial<GeneralBodyMeetingCreate>) => Promise<void>;
  onDeleteMeeting: (id: number) => Promise<void>;
  isLoading: boolean;
  userRole?: UserRole;
  isGuest?: boolean;
  dropdownMap?: DropdownCategoryMap;
}

export default function GeneralBodyMeetingsTab({
  meetings,
  onAddMeeting,
  onUpdateMeeting,
  onDeleteMeeting,
  isLoading,
  userRole = "Super Admin",
  isGuest = false,
  dropdownMap = {},
}: GeneralBodyMeetingsTabProps) {
  const canEdit = userRole === "Super Admin" || userRole === "Admin";
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("All");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<GeneralBodyMeeting | null>(null);
  const [viewingMeeting, setViewingMeeting] = useState<GeneralBodyMeeting | null>(null);
  const [expandedMeetingId, setExpandedMeetingId] = useState<number | null>(null);
  const [previewDoc, setPreviewDoc] = useState<{ url: string; title: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State for New Meeting
  const [formData, setFormData] = useState<GeneralBodyMeetingCreate>({
    meeting_title: "",
    meeting_type: "Quarterly GBM",
    meeting_date: "",
    time: "10:00 AM - 01:00 PM",
    venue: "Clubhouse Grand Banquet Hall",
    quorum_status: "Quorum Met",
    key_agenda: "1. Financial Audit Review\n2. Builder Handover Checklist\n3. Society Amenities Upkeep",
    resolutions_passed: "Resolution: Approved unanimously by attending members.",
    minutes_summary: "Minutes recorded and signed by General Secretary.",
    attendees_count: 150,
    doc_link: "",
  });

  const defaultMeetingTypes = dropdownMap["meeting_types"]?.length ? dropdownMap["meeting_types"] : ["AGM", "EGM", "Quarterly GBM", "Special Committee", "MC Monthly"];
  const defaultVenues = dropdownMap["meeting_venues"]?.length ? dropdownMap["meeting_venues"] : ["Clubhouse Grand Banquet Hall", "Clubhouse Studio 1", "Amphitheatre", "Zoom Hybrid Online"];
  const defaultQuorumStatuses = ["Quorum Met (Full)", "Quorum Met (Partial)", "Quorum Pending", "Special Session"];

  const filteredMeetings = useMemo(() => {
    return meetings.filter((m) => {
      const matchSearch =
        m.meeting_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.key_agenda?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.resolutions_passed?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.minutes_summary?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchType = selectedType === "All" || m.meeting_type === selectedType;
      return matchSearch && matchType;
    });
  }, [meetings, searchTerm, selectedType]);

  const toggleExpand = (id: number) => {
    setExpandedMeetingId(expandedMeetingId === id ? null : id);
  };

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.meeting_title || !formData.meeting_date) return;
    setIsSubmitting(true);
    try {
      await onAddMeeting(formData);
      setIsAddModalOpen(false);
      setFormData({
        meeting_title: "",
        meeting_type: "Quarterly GBM",
        meeting_date: "",
        time: "10:00 AM - 01:00 PM",
        venue: "Clubhouse Grand Banquet Hall",
        quorum_status: "Quorum Met",
        key_agenda: "1. Financial Audit Review\n2. Builder Handover Checklist\n3. Society Amenities Upkeep",
        resolutions_passed: "Resolution: Approved unanimously by attending members.",
        minutes_summary: "Minutes recorded and signed by General Secretary.",
        attendees_count: 150,
        doc_link: "",
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateMeetingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMeeting) return;
    setIsSubmitting(true);
    try {
      await onUpdateMeeting(editingMeeting.id, editingMeeting);
      setEditingMeeting(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-3 h-3 rounded-full bg-sky-500 shadow-[0_0_10px_rgba(14,165,233,0.8)]" />
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              3. General Body Meetings (GBM)
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Official records, AGM/EGM minutes, passed resolutions, and resident quorum archives for Towers A-F.
          </p>
        </div>

        {canEdit && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-sky-500/20 transition transform active:scale-95 hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            <span>Record New GBM / Meeting</span>
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
            placeholder="Search meeting minutes, agenda items, resolutions..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500 bg-slate-800/80 text-white placeholder-slate-400"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 text-xs">
          <span className="text-slate-400 font-medium">Meeting Type:</span>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-transparent font-bold text-white focus:outline-none cursor-pointer"
          >
            <option value="All">All Types</option>
            {defaultMeetingTypes.map((t) => (
              <option key={t} value={t} className="bg-slate-900 text-white">
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Meetings List */}
      {filteredMeetings.length === 0 ? (
        <div className="bg-slate-900/60 rounded-2xl p-12 text-center border border-slate-800 shadow-md">
          <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-300">No meeting records found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Click &quot;Record New GBM / Meeting&quot; above to log minutes and resolutions.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMeetings.map((m) => {
            const isExpanded = expandedMeetingId === m.id;

            return (
              <div
                key={m.id}
                className="bg-slate-900/80 rounded-2xl border border-slate-800 shadow-lg hover:border-slate-700 transition overflow-hidden"
              >
                {/* Meeting Card Header */}
                <div className="p-5 sm:p-6 border-b border-slate-800 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2.5">
                      <span
                        className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-lg uppercase tracking-wider ${
                          m.meeting_type === "AGM"
                            ? "bg-purple-950/80 text-purple-300 border border-purple-700/60"
                            : m.meeting_type === "EGM"
                            ? "bg-rose-950/80 text-rose-300 border border-rose-700/60"
                            : "bg-sky-950/80 text-sky-300 border border-sky-700/60"
                        }`}
                      >
                        {m.meeting_type}
                      </span>

                      <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 px-2.5 py-0.5 rounded-lg">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{m.quorum_status}</span>
                      </span>

                      {m.attendees_count > 0 && (
                        <span className="text-[11px] font-semibold text-slate-300 bg-slate-800 border border-slate-700 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                          <Users className="w-3 h-3 text-slate-400" />
                          <span>{m.attendees_count} Members Attended</span>
                        </span>
                      )}
                    </div>

                    <h3
                      onClick={() => {
                        if (isGuest) {
                          setViewingMeeting(m);
                        } else {
                          setEditingMeeting(m);
                        }
                      }}
                      className="text-lg sm:text-xl font-extrabold text-white leading-snug transition cursor-pointer hover:text-sky-300"
                    >
                      {m.meeting_title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-4 mt-2.5 text-xs text-slate-400 font-medium">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Calendar className="w-3.5 h-3.5 text-sky-400" />
                        <span>{m.meeting_date}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Clock className="w-3.5 h-3.5 text-sky-400" />
                        <span>{m.time}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <MapPin className="w-3.5 h-3.5 text-rose-400" />
                        <span>{m.venue}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Right */}
                  <div className="flex items-center gap-2 self-end md:self-start">
                    {canEdit && (
                      <button
                        onClick={() => setEditingMeeting(m)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-300 hover:text-white bg-sky-500/20 hover:bg-sky-500/30 px-3 py-1.5 rounded-lg border border-sky-400/40 transition"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Edit Meeting</span>
                      </button>
                    )}

                    <button
                      onClick={() => toggleExpand(m.id)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700 transition"
                    >
                      <span>{isExpanded ? "Hide" : "Details"}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {canEdit && (
                      <button
                        onClick={() => {
                          if (confirm(`Delete record for "${m.meeting_title}"?`)) {
                            onDeleteMeeting(m.id);
                          }
                        }}
                        title="Delete Record"
                        className="text-slate-500 hover:text-rose-400 p-1.5 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Summary Row */}
                <div className="px-5 py-3 bg-slate-950/60 text-xs text-slate-300 flex items-center justify-between border-t border-slate-800">
                  <p className="line-clamp-1 italic text-slate-300">
                    &quot;{m.minutes_summary || "Official minutes approved by General Body."}&quot;
                  </p>
                  {m.doc_link && (
                    <button
                      type="button"
                      onClick={() =>
                        setPreviewDoc({
                          url: m.doc_link!,
                          title: `Signed Minutes: ${m.meeting_title}`,
                        })
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-sky-950/90 hover:bg-sky-900 border border-sky-600 text-sky-300 hover:text-white rounded-xl text-xs font-black transition shadow-sm ml-3 shrink-0"
                      title="View Signed Minutes & Resolutions Document"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Minutes Document</span>
                    </button>
                  )}
                </div>

                {/* Expanded Details Section */}
                {isExpanded && (
                  <div className="p-5 sm:p-6 bg-slate-950/80 border-t border-slate-800 space-y-4 animate-fadeIn">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Key Agendas */}
                      <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
                        <h4 className="text-xs font-bold text-sky-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-sky-400" />
                          <span>Key Agenda Items</span>
                        </h4>
                        <div className="text-xs text-slate-300 whitespace-pre-line leading-relaxed font-sans">
                          {m.key_agenda || "No agenda details entered."}
                        </div>
                      </div>

                      {/* Resolutions Passed */}
                      <div className="p-4 bg-emerald-950/40 rounded-xl border border-emerald-800/50">
                        <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <FileCheck2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Resolutions Passed</span>
                        </h4>
                        <div className="text-xs text-emerald-100 whitespace-pre-line leading-relaxed">
                          {m.resolutions_passed || "Resolutions archived in general body registrar."}
                        </div>
                      </div>
                    </div>

                    {/* Complete Minutes Summary */}
                    <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 text-xs">
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                        Executive Summary &amp; Next Steps
                      </h4>
                      <p className="text-slate-300 leading-relaxed">{m.minutes_summary}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Meeting Modal */}
      {editingMeeting && (
        <Modal
          isOpen={Boolean(editingMeeting)}
          onClose={() => setEditingMeeting(null)}
          title={`Edit GBM Record: ${editingMeeting.meeting_title}`}
          subtitle="Update agendas, approved resolutions, attendees count and minutes in DB"
          maxWidth="xl"
        >
          <form onSubmit={handleUpdateMeetingSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Meeting Title *</label>
              <input
                type="text"
                required
                value={editingMeeting.meeting_title}
                onChange={(e) =>
                  setEditingMeeting({ ...editingMeeting, meeting_title: e.target.value })
                }
                className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <DynamicSelect
                  label="Meeting Type"
                  value={editingMeeting.meeting_type}
                  onChange={(val) => setEditingMeeting({ ...editingMeeting, meeting_type: val })}
                  options={defaultMeetingTypes}
                />
              </div>

              <div>
                <DynamicSelect
                  label="Quorum Status"
                  value={editingMeeting.quorum_status}
                  onChange={(val) => setEditingMeeting({ ...editingMeeting, quorum_status: val })}
                  options={defaultQuorumStatuses}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Date</label>
                <input
                  type="date"
                  value={editingMeeting.meeting_date}
                  onChange={(e) =>
                    setEditingMeeting({ ...editingMeeting, meeting_date: e.target.value })
                  }
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Timing</label>
                <input
                  type="text"
                  value={editingMeeting.time}
                  onChange={(e) => setEditingMeeting({ ...editingMeeting, time: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Attendees Count</label>
                <input
                  type="number"
                  value={editingMeeting.attendees_count}
                  onChange={(e) =>
                    setEditingMeeting({
                      ...editingMeeting,
                      attendees_count: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono"
                />
              </div>
            </div>

            <div>
              <DynamicSelect
                label="Venue Location"
                value={editingMeeting.venue}
                onChange={(val) => setEditingMeeting({ ...editingMeeting, venue: val })}
                options={defaultVenues}
              />
            </div>

            {/* Signed PDF / Minutes Upload */}
            <FileUploadInput
              label="Attach Signed Minutes / Resolution Document (PDF)"
              value={editingMeeting.doc_link}
              onChange={(dataUrl) => setEditingMeeting({ ...editingMeeting, doc_link: dataUrl })}
            />

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Key Agenda Items</label>
              <textarea
                rows={3}
                value={editingMeeting.key_agenda || ""}
                onChange={(e) =>
                  setEditingMeeting({ ...editingMeeting, key_agenda: e.target.value })
                }
                className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Resolutions Passed</label>
              <textarea
                rows={3}
                value={editingMeeting.resolutions_passed || ""}
                onChange={(e) =>
                  setEditingMeeting({ ...editingMeeting, resolutions_passed: e.target.value })
                }
                className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Executive Summary / Minutes</label>
              <textarea
                rows={2}
                value={editingMeeting.minutes_summary || ""}
                onChange={(e) =>
                  setEditingMeeting({ ...editingMeeting, minutes_summary: e.target.value })
                }
                className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingMeeting(null)}
                className="px-4 py-2 text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl"
              >
                {isSubmitting ? "Updating..." : "Save Updates to DB"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add Meeting Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Record General Body Meeting (GBM)"
        subtitle="Log agendas, resolutions passed, and quorum details"
        maxWidth="xl"
      >
        <form onSubmit={handleCreateMeeting} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Meeting Title *</label>
            <input
              type="text"
              required
              value={formData.meeting_title}
              onChange={(e) => setFormData({ ...formData, meeting_title: e.target.value })}
              placeholder="e.g., 6th Annual General Body Meeting (AGM 2026)"
              className="w-full text-xs p-2.5 border rounded-xl bg-slate-800 border-slate-700 text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <DynamicSelect
                label="Meeting Type"
                required
                value={formData.meeting_type}
                onChange={(val) => setFormData({ ...formData, meeting_type: val })}
                options={defaultMeetingTypes}
              />
            </div>
            <div>
              <DynamicSelect
                label="Quorum Status"
                required
                value={formData.quorum_status}
                onChange={(val) => setFormData({ ...formData, quorum_status: val })}
                options={defaultQuorumStatuses}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Date *</label>
              <input
                type="date"
                required
                value={formData.meeting_date}
                onChange={(e) => setFormData({ ...formData, meeting_date: e.target.value })}
                className="w-full text-xs p-2.5 border rounded-xl bg-slate-800 border-slate-700 text-white focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Time</label>
              <input
                type="text"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                placeholder="10:00 AM - 01:00 PM"
                className="w-full text-xs p-2.5 border rounded-xl bg-slate-800 border-slate-700 text-white focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Attendees Count</label>
              <input
                type="number"
                value={formData.attendees_count}
                onChange={(e) =>
                  setFormData({ ...formData, attendees_count: parseInt(e.target.value) || 0 })
                }
                className="w-full text-xs p-2.5 border rounded-xl bg-slate-800 border-slate-700 text-white focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div>
            <DynamicSelect
              label="Venue Location"
              value={formData.venue}
              onChange={(val) => setFormData({ ...formData, venue: val })}
              options={defaultVenues}
            />
          </div>

          {/* Signed PDF / Minutes Upload */}
          <FileUploadInput
            label="Upload Signed Minutes Document / Resolution PDF (Optional)"
            value={formData.doc_link}
            onChange={(dataUrl) => setFormData({ ...formData, doc_link: dataUrl })}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Key Agenda Items</label>
            <textarea
              rows={3}
              value={formData.key_agenda}
              onChange={(e) => setFormData({ ...formData, key_agenda: e.target.value })}
              placeholder="1. Solar plant sanction\n2. Financial audit review\n3. Lift AMC agreement"
              className="w-full text-xs p-2.5 border rounded-xl bg-slate-800 border-slate-700 text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Resolutions Passed</label>
            <textarea
              rows={3}
              value={formData.resolutions_passed}
              onChange={(e) => setFormData({ ...formData, resolutions_passed: e.target.value })}
              placeholder="Record binding decisions approved during the meeting..."
              className="w-full text-xs p-2.5 border rounded-xl bg-slate-800 border-slate-700 text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Executive Summary / Minutes</label>
            <textarea
              rows={2}
              value={formData.minutes_summary}
              onChange={(e) => setFormData({ ...formData, minutes_summary: e.target.value })}
              placeholder="Summary of discussions, voting results, and next actions..."
              className="w-full text-xs p-2.5 border rounded-xl bg-slate-800 border-slate-700 text-white focus:outline-none focus:border-sky-500"
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
              className="px-5 py-2.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 rounded-xl shadow-md transition disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Save GBM Record in Live DB"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Read-Only Detail Modal for Guests */}
      {viewingMeeting && (
        <Modal
          isOpen={Boolean(viewingMeeting)}
          onClose={() => setViewingMeeting(null)}
          title={viewingMeeting.meeting_title}
          subtitle="View-only mode — sign in to edit meeting records"
          maxWidth="xl"
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase">Meeting Type</span>
                <p className="text-sm font-bold text-white mt-0.5">{viewingMeeting.meeting_type}</p>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase">Date</span>
                <p className="text-sm font-bold text-white mt-0.5">{viewingMeeting.meeting_date}</p>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase">Time</span>
                <p className="text-sm font-bold text-white mt-0.5">{viewingMeeting.time}</p>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase">Venue</span>
                <p className="text-sm font-bold text-white mt-0.5">{viewingMeeting.venue}</p>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase">Quorum Status</span>
                <p className="text-sm font-bold text-white mt-0.5">{viewingMeeting.quorum_status}</p>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase">Attendees</span>
                <p className="text-sm font-bold text-white mt-0.5">{viewingMeeting.attendees_count} Members</p>
              </div>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <span className="text-[10px] font-semibold text-slate-400 uppercase">Key Agenda</span>
              <p className="text-xs text-slate-200 mt-1 whitespace-pre-wrap leading-relaxed">{viewingMeeting.key_agenda}</p>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <span className="text-[10px] font-semibold text-slate-400 uppercase">Resolutions Passed</span>
              <p className="text-xs text-slate-200 mt-1 whitespace-pre-wrap leading-relaxed">{viewingMeeting.resolutions_passed}</p>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
              <span className="text-[10px] font-semibold text-slate-400 uppercase">Minutes Summary</span>
              <p className="text-xs text-slate-200 mt-1 whitespace-pre-wrap leading-relaxed">{viewingMeeting.minutes_summary}</p>
            </div>

            {viewingMeeting.doc_link && (
              <div className="p-3 bg-sky-950/60 rounded-xl border border-sky-800/60 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-sky-400 uppercase">Attached Minutes / Document</span>
                  <p className="text-xs text-slate-200 mt-0.5">Signed Official Resolution File</p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setPreviewDoc({
                      url: viewingMeeting.doc_link!,
                      title: `Signed Minutes: ${viewingMeeting.meeting_title}`,
                    })
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-black transition shadow-md"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Document</span>
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Document & Minutes Preview Modal */}
      <DocumentPreviewModal
        isOpen={Boolean(previewDoc)}
        onClose={() => setPreviewDoc(null)}
        url={previewDoc?.url}
        title={previewDoc?.title}
      />
    </div>
  );
}
