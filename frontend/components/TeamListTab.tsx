"use client";

import React, { useState, useMemo } from "react";
import { TeamMember, TeamMemberCreate, UserRole, DropdownCategoryMap } from "../lib/types";
import {
  Users,
  UserPlus,
  Search,
  Phone,
  Mail,
  Home,
  Shield,
  Trash2,
  CheckCircle2,
  Building,
  Award,
  Crown,
  Briefcase,
  UserCheck,
  Edit,
} from "lucide-react";
import Modal from "./Modal";
import DynamicSelect from "./DynamicSelect";

interface TeamListTabProps {
  team: TeamMember[];
  onAddMember: (member: TeamMemberCreate) => Promise<void>;
  onUpdateMember: (id: number, member: Partial<TeamMemberCreate>) => Promise<void>;
  onDeleteMember: (id: number) => Promise<void>;
  isLoading: boolean;
  userRole?: UserRole;
  dropdownMap?: DropdownCategoryMap;
}

export default function TeamListTab({
  team,
  onAddMember,
  onUpdateMember,
  onDeleteMember,
  isLoading,
  userRole = "Super Admin",
  dropdownMap = {},
}: TeamListTabProps) {
  const canEditTeam = userRole === "Super Admin";
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTower, setSelectedTower] = useState("All");
  const [selectedSubCommittee, setSelectedSubCommittee] = useState("All");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState<TeamMemberCreate>({
    name: "",
    role: "Executive Member",
    tower: "Tower A",
    wing_flat: "Tower A - 101",
    contact: "",
    email: "",
    term: "2025-2027",
    sub_committee: "Community Welfare",
    status: "Active",
  });

  const defaultTowers = dropdownMap["towers"]?.length
    ? dropdownMap["towers"]
    : ["Tower A", "Tower B", "Tower C", "Tower D", "Tower E", "Tower F", "Jaitra Management"];

  const ROLE_SORT_ORDER: string[] = [
    "Chairman",
    "Vice-chairman",
    "Vice Chairman",
    "General Secretary",
    "Joint Secretary",
    "Treasurer",
    "Director - A",
    "Director - B",
    "Director - C",
    "Director - D",
    "Director - E",
    "Director - F",
    "Jaitra MD",
    "Jaitra Director 1",
    "Jaitra Director 2",
    "Jaitra CRM 1",
    "Jaitra CRM 2",
    "Jaitra Engineer 1",
    "Jaitra Engineer 2",
  ];

  const defaultRoles = dropdownMap["team_roles"]?.length
    ? dropdownMap["team_roles"]
    : [
        "Chairman",
        "Vice-chairman",
        "Vice Chairman",
        "President",
        "Vice President",
        "General Secretary",
        "Joint Secretary",
        "Treasurer",
        "Joint Treasurer",
        "Director - A",
        "Director - B",
        "Director - C",
        "Director - D",
        "Director - E",
        "Director - F",
        "Jaitra MD",
        "Jaitra Director 1",
        "Jaitra Director 2",
        "Jaitra CRM 1",
        "Jaitra CRM 2",
        "Jaitra Engineer 1",
        "Jaitra Engineer 2",
        "Cultural Committee Head",
        "Sports & Amenities Head",
        "Facility & Maintenance Lead",
        "Security & IT Lead",
        "Block Representative (Tower A)",
        "Block Representative (Tower B)",
        "Block Representative (Tower C)",
        "Block Representative (Tower D)",
        "Block Representative (Tower E)",
        "Block Representative (Tower F)",
        "Executive Member",
      ];

  const defaultSubCommittees = dropdownMap["sub_committees"]?.length
    ? dropdownMap["sub_committees"]
    : [
        "Executive & Governance",
        "Legal, Compliance & Admin",
        "Finance, Audit & Corpus",
        "Security & Estate Management",
        "Community Relations & PR",
        "Billing & Vendor Escrow",
        "Events, Festivals & Arts",
        "Clubhouse, Gym & Grounds",
        "Builder Handover & IGS Oversight",
        "Resident Welfare & Elevators",
      ];

  const getRoleSortIndex = (role: string): number => {
    const idx = ROLE_SORT_ORDER.findIndex(
      (r) => r.toLowerCase() === role.toLowerCase()
    );
    return idx === -1 ? ROLE_SORT_ORDER.length : idx;
  };

  const filteredTeam = useMemo(() => {
    return team
      .filter((m) => {
        const matchSearch =
          m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          m.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (m.wing_flat && m.wing_flat.toLowerCase().includes(searchTerm.toLowerCase())) ||
          m.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (m.sub_committee && m.sub_committee.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchTower =
          selectedTower === "All" ||
          m.tower === selectedTower ||
          (m.wing_flat && m.wing_flat.includes(selectedTower));
        const matchSub =
          selectedSubCommittee === "All" ||
          (m.sub_committee &&
            m.sub_committee.toLowerCase().includes(selectedSubCommittee.toLowerCase()));
        return matchSearch && matchTower && matchSub;
      })
      .sort((a, b) => getRoleSortIndex(a.role) - getRoleSortIndex(b.role));
  }, [team, searchTerm, selectedTower, selectedSubCommittee]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.role || !formData.contact) return;
    setIsSubmitting(true);
    try {
      await onAddMember(formData);
      setIsAddModalOpen(false);
      setFormData({
        name: "",
        role: "Executive Member",
        tower: "Tower A",
        wing_flat: "Tower A - 101",
        contact: "",
        email: "",
        term: "2025-2027",
        sub_committee: "Community Welfare",
        status: "Active",
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    setIsSubmitting(true);
    try {
      await onUpdateMember(editingMember.id, editingMember);
      setEditingMember(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleBadgeStyle = (role: string) => {
    if (role.includes("President")) return "bg-purple-950 text-purple-300 border-purple-700/60";
    if (role.includes("Secretary")) return "bg-sky-950 text-sky-300 border-sky-700/60";
    if (role.includes("Treasurer")) return "bg-emerald-950 text-emerald-300 border-emerald-700/60";
    if (role.includes("Head") || role.includes("Lead"))
      return "bg-amber-950 text-amber-300 border-amber-700/60";
    return "bg-slate-800 text-slate-300 border-slate-700";
  };

  const getInitials = (name: string) => {
    const parts = name.replace(/^(Col\.|Dr\.|Mr\.|Mrs\.|Ms\.)\s+/i, "").trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return (parts[0]?.[0] || "J").toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              6. Jaitra Association Team &amp; Committee Directory
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Elected office bearers, tower block representatives (Towers A-F), and portfolio leads (Tenure: 2025-2027).
          </p>
        </div>

        {canEditTeam && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 transition transform active:scale-95 hover:scale-[1.02]"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Committee Member</span>
          </button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl shadow-md flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search member name, designation, flat number, phone..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 bg-slate-800/80 text-white placeholder-slate-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Tower */}
          <div className="flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 text-xs">
            <Building className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-slate-400 font-medium">Tower:</span>
            <select
              value={selectedTower}
              onChange={(e) => setSelectedTower(e.target.value)}
              className="bg-transparent font-bold text-white focus:outline-none cursor-pointer"
            >
              <option value="All">All Towers</option>
              {defaultTowers.map((t) => (
                <option key={t} value={t} className="bg-slate-900 text-white">
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Sub-committee */}
          <div className="flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 text-xs">
            <span className="text-slate-400 font-medium">Portfolio:</span>
            <select
              value={selectedSubCommittee}
              onChange={(e) => setSelectedSubCommittee(e.target.value)}
              className="bg-transparent font-bold text-white focus:outline-none cursor-pointer max-w-[170px] truncate"
            >
              <option value="All">All Portfolios</option>
              {defaultSubCommittees.map((s) => (
                <option key={s} value={s} className="bg-slate-900 text-white">
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Layout: Directory Cards & Quick Add Side Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Members Cards List */}
        <div className="lg:col-span-2 space-y-4">
          {filteredTeam.length === 0 ? (
            <div className="bg-slate-900/60 rounded-2xl p-12 text-center border border-slate-800 shadow-md">
              <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-300">No committee members found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Try searching with a different keyword or add a new team member.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredTeam.map((member) => (
                <div
                  key={member.id}
                  className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-lg hover:border-slate-700 hover:shadow-xl transition-all duration-200 flex flex-col justify-between group"
                >
                  <div>
                    {/* Top Row: Avatar & Designation */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#0c4a9e] to-[#1e69d2] text-white flex items-center justify-center font-extrabold text-sm shadow-md border border-sky-400/30">
                          {getInitials(member.name)}
                        </div>
                        <div>
                          <h3 className="text-sm font-extrabold text-white leading-tight group-hover:text-sky-200 transition">
                            {member.name}
                          </h3>
                          <span
                            className={`inline-block text-[10px] font-black uppercase px-2 py-0.5 rounded-md border mt-1 ${getRoleBadgeStyle(
                              member.role
                            )}`}
                          >
                            {member.role}
                          </span>
                        </div>
                      </div>

                      {canEditTeam && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setEditingMember(member)}
                            title="Edit Member"
                            className="text-slate-400 hover:text-amber-300 p-1 transition"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Remove "${member.name}" from committee?`)) {
                                onDeleteMember(member.id);
                              }
                            }}
                            title="Remove Member"
                            className="text-slate-400 hover:text-rose-400 p-1 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Sub-committee tag if present */}
                    {member.sub_committee && (
                      <div className="p-2 bg-slate-950/60 rounded-lg border border-slate-800 text-[11px] text-slate-300 mb-3 flex items-center gap-1.5">
                        <Briefcase className="w-3 h-3 text-slate-500 shrink-0" />
                        <span className="truncate">
                          Portfolios: <strong className="text-sky-300">{member.sub_committee}</strong>
                        </span>
                      </div>
                    )}

                    {/* Contact & Flat info */}
                    <div className="space-y-1.5 text-xs text-slate-300">
                      {member.wing_flat && (
                        <div className="flex items-center gap-2">
                          <Home className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span className="font-semibold text-slate-200">{member.wing_flat}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <a
                          href={`tel:${member.contact}`}
                          className="font-mono font-bold text-sky-400 hover:underline"
                        >
                          {member.contact}
                        </a>
                      </div>

                      {member.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                          <a
                            href={`mailto:${member.email}`}
                            className="text-slate-400 hover:text-sky-300 truncate"
                          >
                            {member.email}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer status */}
                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-mono">Tenure: {member.term || "2025-2027"}</span>
                    <span className="inline-flex items-center gap-1 text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{member.status || "Active"}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Quick Add Form (Super Admin Only) or Directory Info */}
        <div className="bg-slate-900/90 p-5 rounded-2xl shadow-xl border border-slate-800">
          {canEditTeam ? (
            isAddModalOpen ? (
            <>
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-extrabold text-white">Add Association Member</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-slate-400 hover:text-white text-xs font-bold px-2 py-1 bg-slate-800 rounded-lg"
                >
                  Close
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., S. Ramesh Kumar"
                    className="w-full text-xs p-2.5 border rounded-xl bg-slate-800 border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <DynamicSelect
                      label="Tower"
                      required
                      value={formData.tower || "Tower A"}
                      onChange={(val) => {
                        setFormData({ ...formData, tower: val, wing_flat: `${val} - 101` });
                      }}
                      options={defaultTowers}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Flat Details *</label>
                    <input
                      type="text"
                      required
                      value={formData.wing_flat}
                      onChange={(e) => setFormData({ ...formData, wing_flat: e.target.value })}
                      placeholder="e.g., Tower B - G02 / Tower A - 604"
                      className="w-full text-xs p-2.5 border rounded-xl bg-slate-800 border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <DynamicSelect
                    label="Designation / Role"
                    required
                    value={formData.role}
                    onChange={(val) => setFormData({ ...formData, role: val })}
                    options={defaultRoles}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Contact Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.contact}
                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                    placeholder="e.g., +91 98450 99887"
                    className="w-full text-xs p-2.5 border rounded-xl bg-slate-800 border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Official Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g., ramesh@jaitra.org"
                    className="w-full text-xs p-2.5 border rounded-xl bg-slate-800 border-slate-700 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <DynamicSelect
                    label="Sub-Committee Portfolio"
                    value={formData.sub_committee || "Community Welfare"}
                    onChange={(val) => setFormData({ ...formData, sub_committee: val })}
                    options={defaultSubCommittees}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Term</label>
                    <input
                      type="text"
                      value={formData.term}
                      onChange={(e) => setFormData({ ...formData, term: e.target.value })}
                      placeholder="2025-2027"
                      className="w-full text-xs p-2.5 border rounded-xl bg-slate-800 border-slate-700 text-white"
                    />
                  </div>

                  <div>
                    <DynamicSelect
                      label="Status"
                      value={formData.status || "Active"}
                      onChange={(val) => setFormData({ ...formData, status: val })}
                      options={["Active", "Emeritus", "Ex-Officio"]}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-extrabold text-xs py-2.5 px-4 rounded-xl shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{isSubmitting ? "Saving..." : "Save Member to Live DB"}</span>
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-6">
              <UserPlus className="w-8 h-8 text-emerald-500/50 mx-auto mb-2" />
              <p className="text-xs text-slate-400">Click &quot;Add Committee Member&quot; above to add a new member.</p>
            </div>
          )
          ) : (
            <div className="space-y-4 text-xs">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
                <Shield className="w-4 h-4 text-sky-400" />
                <h3 className="text-sm font-extrabold text-white">Association Governance</h3>
              </div>
              <p className="text-slate-300 leading-relaxed">
                The Managing Committee (2025-2027) oversees society operations across all 6 towers, infrastructure maintenance, festival funds, and builder handover tasks.
              </p>
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1.5 text-slate-400 text-[11px]">
                <p><strong>Official Contact:</strong> <span className="text-sky-300">jaitra-association-hyd@googlegroups.com</span></p>
                <p><strong>General Body Meetings:</strong> Held quarterly in Clubhouse Grand Banquet Hall</p>
                <p><strong>Elections &amp; Tenure:</strong> 2-year terms per registered bye-laws</p>
              </div>
              <p className="text-[11px] text-slate-500 italic">
                Note: Addition, editing, or removal of committee members is authorized exclusively for Super Admin.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Member Modal */}
      {editingMember && (
        <Modal
          isOpen={Boolean(editingMember)}
          onClose={() => setEditingMember(null)}
          title={`Edit Committee Member: ${editingMember.name}`}
          subtitle="Update designation, contact, or sub-committee portfolio in DB"
          maxWidth="md"
        >
          <form onSubmit={handleUpdateSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={editingMember.name}
                onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <DynamicSelect
                  label="Tower"
                  value={editingMember.tower || "Tower A"}
                  onChange={(val) => setEditingMember({ ...editingMember, tower: val })}
                  options={defaultTowers}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Flat Details</label>
                <input
                  type="text"
                  value={editingMember.wing_flat || ""}
                  onChange={(e) =>
                    setEditingMember({ ...editingMember, wing_flat: e.target.value })
                  }
                  className="w-full text-xs p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
                />
              </div>
            </div>

            <div>
              <DynamicSelect
                label="Designation / Role"
                value={editingMember.role}
                onChange={(val) => setEditingMember({ ...editingMember, role: val })}
                options={defaultRoles}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Contact Phone *</label>
                <input
                  type="text"
                  required
                  value={editingMember.contact}
                  onChange={(e) => setEditingMember({ ...editingMember, contact: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Official Email</label>
                <input
                  type="email"
                  value={editingMember.email || ""}
                  onChange={(e) => setEditingMember({ ...editingMember, email: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
                />
              </div>
            </div>

            <div>
              <DynamicSelect
                label="Sub-Committee Portfolio"
                value={editingMember.sub_committee || ""}
                onChange={(val) => setEditingMember({ ...editingMember, sub_committee: val })}
                options={defaultSubCommittees}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Term</label>
                <input
                  type="text"
                  value={editingMember.term || ""}
                  onChange={(e) => setEditingMember({ ...editingMember, term: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
                />
              </div>

              <div>
                <DynamicSelect
                  label="Status"
                  value={editingMember.status || "Active"}
                  onChange={(val) => setEditingMember({ ...editingMember, status: val })}
                  options={["Active", "Emeritus", "Ex-Officio"]}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingMember(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl"
              >
                Save Member Updates in DB
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
