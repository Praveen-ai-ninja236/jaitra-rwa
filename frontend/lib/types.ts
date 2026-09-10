export type UserRole = "Super Admin" | "Admin" | "Staff" | "User";

export interface AppUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  tower?: string;
  flat_no?: string;
  phone?: string;
  created_at?: string;
}

export interface AppUserRegister {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
  tower?: string;
  flat_no?: string;
  phone?: string;
}

export interface DropdownOption {
  id: number;
  category_key: string;
  option_value: string;
  sort_order: number;
  is_active: boolean;
}

export type DropdownOptionCreate = Omit<DropdownOption, "id">;

export type DropdownCategoryMap = Record<string, string[]>;

export interface FestivalCollection {
  id: number;
  festival_id: number;
  tower: string;
  flat_no: string;
  donor_name: string;
  amount: number;
  payment_mode: string; // UPI | Cash | Cheque | Net Banking | Card | Other
  transaction_ref?: string;
  collected_date: string;
  receipt_url?: string;
  notes?: string;
}

export type FestivalCollectionCreate = Omit<FestivalCollection, "id" | "festival_id">;

export interface FestivalExpense {
  id: number;
  festival_id: number;
  title: string;
  category: string;
  amount: number;
  vendor_name?: string;
  bill_date: string;
  invoice_url?: string;
  audit_evidence_notes?: string;
  approver_name: string;
  approver_role?: string;
  approval_status: "Approved" | "Pending" | "Rejected" | string;
  payment_mode?: string; // UPI | Cash | Cheque | Net Banking | Card
  transaction_ref?: string;
}

export type FestivalExpenseCreate = Omit<FestivalExpense, "id" | "festival_id">;

export interface FestivalCelebration {
  id: number;
  festival_name: string;
  start_date: string;
  end_date: string;
  location: string;
  description?: string;
  lead_organizer: string;
  estimated_budget?: string;
  collected_funds?: string;
  status: "Planning" | "Active" | "Completed" | string;
  highlights?: string;
  collections?: FestivalCollection[];
  expenses?: FestivalExpense[];
}

export type FestivalCelebrationCreate = Omit<FestivalCelebration, "id" | "collections" | "expenses">;

export interface CulturalParticipant {
  id: number;
  event_id: number;
  tower: string;
  flat_no: string;
  participant_name: string;
  age_group: string;
  activity_category: string;
  contact_no?: string;
  notes?: string;
  registration_date: string;
}

export type CulturalParticipantCreate = Omit<CulturalParticipant, "id" | "event_id">;

export interface CulturalAgenda {
  id: number;
  event_id: number;
  slot_time: string;
  performer_or_speaker: string;
  activity_topic: string;
  stage_coordinator?: string;
  duration_mins: number;
}

export type CulturalAgendaCreate = Omit<CulturalAgenda, "id" | "event_id">;

export interface CulturalEvent {
  id: number;
  title: string;
  category: string;
  event_date: string;
  time: string;
  venue: string;
  description?: string;
  coordinator: string;
  coordinator_contact?: string;
  status: "Upcoming" | "Ongoing" | "Completed" | "Planning" | string;
  registered_count: number;
  budget?: string;
  participants?: CulturalParticipant[];
  agendas?: CulturalAgenda[];
}

export type CulturalEventCreate = Omit<CulturalEvent, "id" | "participants" | "agendas">;

export interface GeneralBodyMeeting {
  id: number;
  meeting_title: string;
  meeting_type: "AGM" | "EGM" | "Quarterly GBM" | "Special Committee" | string;
  meeting_date: string;
  time: string;
  venue: string;
  quorum_status: string;
  key_agenda?: string;
  resolutions_passed?: string;
  minutes_summary?: string;
  attendees_count: number;
  doc_link?: string;
}

export type GeneralBodyMeetingCreate = Omit<GeneralBodyMeeting, "id">;

export interface CommunityIssue {
  id: number;
  issue_code?: string;
  tower: string;
  flat_no?: string;
  flat_or_location: string;
  title: string;
  category: string;
  reported_by: string;
  priority: "Critical" | "High" | "Medium" | "Low" | string;
  status: "Open" | "In Progress" | "Under Inspection" | "Resolved" | "Closed" | string;
  assigned_to: string;
  created_at: string;
  description?: string;
  resolution_notes?: string;
  attachment_url?: string;
}

export type CommunityIssueCreate = Omit<CommunityIssue, "id">;

export interface ADOComment {
  id: number;
  task_id: number;
  author_name: string;
  author_role: string;
  comment_text: string;
  created_at?: string;
}

export type ADOCommentCreate = Omit<ADOComment, "id" | "task_id">;

export interface ADOAttachment {
  id: number;
  task_id: number;
  file_name: string;
  file_url: string;
  description?: string;
  uploaded_by: string;
  created_at?: string;
}

export type ADOAttachmentCreate = Omit<ADOAttachment, "id" | "task_id">;

export interface ADOTask {
  id: number;
  task_code: string;
  title: string;
  assigned_to: string;
  entity_type: "Builder" | "IGS" | string;
  category: string;
  status: "New" | "Active" | "Resolved" | "Closed" | string;
  priority: "Critical" | "High" | "Medium" | "Low" | string;
  assignee_name?: string;
  due_date?: string;
  sla_days: number;
  blockers?: string;
  description?: string;
  completion_percentage: number;
  tags?: string;
  comments?: ADOComment[];
  attachments?: ADOAttachment[];
}

export type ADOTaskCreate = Omit<ADOTask, "id" | "comments" | "attachments">;

export interface TeamMember {
  id: number;
  name: string;
  role: string;
  wing_flat?: string;
  tower?: string;
  contact: string;
  email?: string;
  term?: string;
  sub_committee?: string;
  status?: "Active" | "Emeritus" | "Ex-Officio" | string;
}

export type TeamMemberCreate = Omit<TeamMember, "id">;

export interface VendorContract {
  id: number;
  vendor_name: string;
  category: string; // Amenities & EV Charging | Lifts & Elevators AMC | STP & WTP Operations | Security & Surveillance | Fire Safety & Compliance | Solar & Power Infrastructure | Housekeeping & Facility | Plumbing & Civil
  service_type: string;
  contact_person?: string;
  contact_phone?: string;
  contact_email?: string;
  contract_start_date?: string;
  contract_end_date?: string;
  contract_value?: string;
  functional_status: "Operational" | "Under Maintenance" | "Degraded" | "Pending Parts" | string;
  verification_status: "Verified & Compliant" | "Pending Inspection" | "Non-Compliant" | string;
  rating?: number;
  feedback_summary?: string;
  scope_of_work?: string;
  contract_doc_url?: string;
  certificate_url?: string;
  bidding_notes?: string;
  created_at?: string;
}

export type VendorContractCreate = Omit<VendorContract, "id">;

export interface SocietyStats {
  cultural_events_count: number;
  festivals_count: number;
  meetings_count: number;
  total_issues: number;
  open_issues_count: number;
  total_ado_tasks: number;
  builder_tasks_count: number;
  igs_tasks_count: number;
  active_ado_tasks: number;
  resolved_ado_tasks: number;
  team_members_count: number;
  vendors_count?: number;
  tower_issue_counts?: Record<string, number>;
  society_name: string;
  total_towers: number;
}

export interface AuditTransaction {
  id: string | number;
  type: "Collection" | "Expense";
  festival_or_event: string;
  date: string;
  category: string;
  particulars: string;
  payer_or_vendor: string;
  tower_flat: string;
  payment_mode: string;
  transaction_ref: string;
  amount: number;
  status: string;
  evidence_url?: string;
  approver?: string;
}

export interface AuditLogEntry {
  id: number;
  user_name: string;
  user_role: string;
  action: "CREATE" | "UPDATE" | "DELETE";
  entity_type: string;
  entity_id: number | null;
  entity_label: string;
  details: string;
  ip_address: string;
  created_at: string;
}

export type AuditLogEntryCreate = Omit<AuditLogEntry, "id" | "created_at">;

export interface FlatFestivalStatus {
  festival_id: number;
  festival_name: string;
  status: "Done" | "Not Done";
  amount?: number;
  donations_count?: number;
  transactions?: FestivalCollection[];
  date?: string;
  mode?: string;
  receipt_url?: string;
}

export interface FlatSummaryItem {
  id: string;
  tower: string;
  floor: number | string;
  flat_no: string;
  display_label: string;
  resident_name?: string;
  resident_email?: string;
  resident_phone?: string;
  resident_role?: string;
  is_registered_user: boolean;
  total_donations: number;
  donations_count: number;
  festivals_status: Record<number, FlatFestivalStatus>;
  total_complaints: number;
  open_complaints: number;
  in_progress_complaints: number;
  resolved_complaints: number;
  complaints_list: CommunityIssue[];
  total_events_participated: number;
  events_list: Array<{
    event_id: number;
    event_title: string;
    participant_name: string;
    activity_category?: string;
    registration_date?: string;
  }>;
  total_gbm_attended: number;
}
