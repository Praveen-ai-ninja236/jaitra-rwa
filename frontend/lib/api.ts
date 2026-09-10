import {
  CulturalEvent,
  CulturalEventCreate,
  CulturalParticipant,
  CulturalParticipantCreate,
  CulturalAgenda,
  CulturalAgendaCreate,
  FestivalCelebration,
  FestivalCelebrationCreate,
  FestivalCollection,
  FestivalCollectionCreate,
  FestivalExpense,
  FestivalExpenseCreate,
  GeneralBodyMeeting,
  GeneralBodyMeetingCreate,
  CommunityIssue,
  CommunityIssueCreate,
  ADOTask,
  ADOTaskCreate,
  ADOComment,
  ADOCommentCreate,
  ADOAttachment,
  ADOAttachmentCreate,
  TeamMember,
  TeamMemberCreate,
  SocietyStats,
  AuditTransaction,
  DropdownCategoryMap,
  DropdownOption,
  AppUser,
  AppUserRegister,
  UserRole,
  VendorContract,
  VendorContractCreate,
  AuditLogEntry,
} from "./types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL !== undefined
    ? process.env.NEXT_PUBLIC_API_URL
    : (typeof window !== "undefined" ? "" : "http://localhost:8000");

async function fetchJSON<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`API error (${response.status}): ${errorData || response.statusText}`);
  }

  return response.json();
}

// ----------------- STATS -----------------
export async function getStats(): Promise<SocietyStats> {
  return fetchJSON<SocietyStats>("/api/stats");
}

// ----------------- AUDIT & TRANSACTIONS -----------------
export async function getAuditTransactions(): Promise<AuditTransaction[]> {
  return fetchJSON<AuditTransaction[]>("/api/audit");
}

// ----------------- 1. CULTURAL EVENTS & PARTICIPANTS / AGENDAS -----------------
export async function getCulturalEvents(status?: string, category?: string): Promise<CulturalEvent[]> {
  const params = new URLSearchParams();
  if (status && status !== "All") params.append("status", status);
  if (category && category !== "All") params.append("category", category);
  const qs = params.toString() ? `?${params.toString()}` : "";
  return fetchJSON<CulturalEvent[]>(`/api/cultural-events${qs}`);
}

export async function getCulturalEvent(id: number): Promise<CulturalEvent> {
  return fetchJSON<CulturalEvent>(`/api/cultural-events/${id}`);
}

export async function createCulturalEvent(data: CulturalEventCreate): Promise<CulturalEvent> {
  return fetchJSON<CulturalEvent>("/api/cultural-events", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateCulturalEvent(id: number, data: Partial<CulturalEventCreate>): Promise<CulturalEvent> {
  return fetchJSON<CulturalEvent>(`/api/cultural-events/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteCulturalEvent(id: number): Promise<{ message: string }> {
  return fetchJSON<{ message: string }>(`/api/cultural-events/${id}`, {
    method: "DELETE",
  });
}

export async function addCulturalParticipant(
  eventId: number,
  data: CulturalParticipantCreate
): Promise<CulturalParticipant> {
  return fetchJSON<CulturalParticipant>(`/api/cultural-events/${eventId}/participants`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateCulturalParticipant(
  participantId: number,
  data: Partial<CulturalParticipantCreate>
): Promise<CulturalParticipant> {
  return fetchJSON<CulturalParticipant>(`/api/cultural-events/participants/${participantId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteCulturalParticipant(participantId: number): Promise<{ message: string }> {
  return fetchJSON<{ message: string }>(`/api/cultural-events/participants/${participantId}`, {
    method: "DELETE",
  });
}

export async function addCulturalAgenda(
  eventId: number,
  data: CulturalAgendaCreate
): Promise<CulturalAgenda> {
  return fetchJSON<CulturalAgenda>(`/api/cultural-events/${eventId}/agendas`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateCulturalAgenda(
  agendaId: number,
  data: Partial<CulturalAgendaCreate>
): Promise<CulturalAgenda> {
  return fetchJSON<CulturalAgenda>(`/api/cultural-events/agendas/${agendaId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteCulturalAgenda(agendaId: number): Promise<{ message: string }> {
  return fetchJSON<{ message: string }>(`/api/cultural-events/agendas/${agendaId}`, {
    method: "DELETE",
  });
}

// ----------------- 2. FESTIVALS & EXPENSES / COLLECTIONS -----------------
export async function getFestivals(status?: string): Promise<FestivalCelebration[]> {
  const params = new URLSearchParams();
  if (status && status !== "All") params.append("status", status);
  const qs = params.toString() ? `?${params.toString()}` : "";
  return fetchJSON<FestivalCelebration[]>(`/api/festivals${qs}`);
}

export async function getFestival(id: number): Promise<FestivalCelebration> {
  return fetchJSON<FestivalCelebration>(`/api/festivals/${id}`);
}

export async function createFestival(data: FestivalCelebrationCreate): Promise<FestivalCelebration> {
  return fetchJSON<FestivalCelebration>("/api/festivals", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateFestival(id: number, data: Partial<FestivalCelebrationCreate>): Promise<FestivalCelebration> {
  return fetchJSON<FestivalCelebration>(`/api/festivals/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteFestival(id: number): Promise<{ message: string }> {
  return fetchJSON<{ message: string }>(`/api/festivals/${id}`, {
    method: "DELETE",
  });
}

export async function addFestivalCollection(
  festivalId: number,
  data: FestivalCollectionCreate
): Promise<FestivalCollection> {
  return fetchJSON<FestivalCollection>(`/api/festivals/${festivalId}/collections`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateFestivalCollection(
  collectionId: number,
  data: Partial<FestivalCollectionCreate>
): Promise<FestivalCollection> {
  return fetchJSON<FestivalCollection>(`/api/festivals/collections/${collectionId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteFestivalCollection(collectionId: number): Promise<{ message: string }> {
  return fetchJSON<{ message: string }>(`/api/festivals/collections/${collectionId}`, {
    method: "DELETE",
  });
}

export async function addFestivalExpense(
  festivalId: number,
  data: FestivalExpenseCreate
): Promise<FestivalExpense> {
  return fetchJSON<FestivalExpense>(`/api/festivals/${festivalId}/expenses`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateFestivalExpense(
  expenseId: number,
  data: Partial<FestivalExpenseCreate>
): Promise<FestivalExpense> {
  return fetchJSON<FestivalExpense>(`/api/festivals/expenses/${expenseId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function updateFestivalExpenseStatus(
  expenseId: number,
  approvalStatus: string,
  approverName?: string
): Promise<FestivalExpense> {
  return fetchJSON<FestivalExpense>(`/api/festivals/expenses/${expenseId}/status`, {
    method: "PATCH",
    body: JSON.stringify({
      approval_status: approvalStatus,
      approver_name: approverName,
    }),
  });
}

export async function deleteFestivalExpense(expenseId: number): Promise<{ message: string }> {
  return fetchJSON<{ message: string }>(`/api/festivals/expenses/${expenseId}`, {
    method: "DELETE",
  });
}

// ----------------- 3. GENERAL BODY MEETINGS -----------------
export async function getMeetings(meetingType?: string): Promise<GeneralBodyMeeting[]> {
  const params = new URLSearchParams();
  if (meetingType && meetingType !== "All") params.append("meeting_type", meetingType);
  const qs = params.toString() ? `?${params.toString()}` : "";
  return fetchJSON<GeneralBodyMeeting[]>(`/api/meetings${qs}`);
}

export async function createMeeting(data: GeneralBodyMeetingCreate): Promise<GeneralBodyMeeting> {
  return fetchJSON<GeneralBodyMeeting>("/api/meetings", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateMeeting(id: number, data: Partial<GeneralBodyMeetingCreate>): Promise<GeneralBodyMeeting> {
  return fetchJSON<GeneralBodyMeeting>(`/api/meetings/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteMeeting(id: number): Promise<{ message: string }> {
  return fetchJSON<{ message: string }>(`/api/meetings/${id}`, {
    method: "DELETE",
  });
}

// ----------------- 4. COMMUNITY ISSUES (TOWERS A-F) -----------------
export async function getIssues(
  tower?: string,
  status?: string,
  priority?: string,
  category?: string
): Promise<CommunityIssue[]> {
  const params = new URLSearchParams();
  if (tower && tower !== "All") params.append("tower", tower);
  if (status && status !== "All") params.append("status", status);
  if (priority && priority !== "All") params.append("priority", priority);
  if (category && category !== "All") params.append("category", category);
  const qs = params.toString() ? `?${params.toString()}` : "";
  return fetchJSON<CommunityIssue[]>(`/api/issues${qs}`);
}

export async function createIssue(data: CommunityIssueCreate): Promise<CommunityIssue> {
  return fetchJSON<CommunityIssue>("/api/issues", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateIssue(id: number, data: Partial<CommunityIssueCreate>): Promise<CommunityIssue> {
  return fetchJSON<CommunityIssue>(`/api/issues/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteIssue(id: number): Promise<{ message: string }> {
  return fetchJSON<{ message: string }>(`/api/issues/${id}`, {
    method: "DELETE",
  });
}

// ----------------- 5. ADO TASKS, COMMENTS & ATTACHMENTS -----------------
export async function getADOTasks(assignedTo?: string, entityType?: string, status?: string): Promise<ADOTask[]> {
  const params = new URLSearchParams();
  if (assignedTo && assignedTo !== "All") params.append("assigned_to", assignedTo);
  if (entityType && entityType !== "All") params.append("entity_type", entityType);
  if (status && status !== "All") params.append("status", status);
  const qs = params.toString() ? `?${params.toString()}` : "";
  return fetchJSON<ADOTask[]>(`/api/tasks${qs}`);
}

export async function getADOTask(id: number): Promise<ADOTask> {
  return fetchJSON<ADOTask>(`/api/tasks/${id}`);
}

export async function createADOTask(data: ADOTaskCreate): Promise<ADOTask> {
  return fetchJSON<ADOTask>("/api/tasks", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateADOTaskStatus(
  id: number,
  status: string,
  completionPercentage?: number,
  blockers?: string
): Promise<ADOTask> {
  return fetchJSON<ADOTask>(`/api/tasks/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({
      status,
      completion_percentage: completionPercentage,
      blockers,
    }),
  });
}

export async function updateADOTask(id: number, data: Partial<ADOTaskCreate>): Promise<ADOTask> {
  return fetchJSON<ADOTask>(`/api/tasks/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteADOTask(id: number): Promise<{ message: string }> {
  return fetchJSON<{ message: string }>(`/api/tasks/${id}`, {
    method: "DELETE",
  });
}

export async function addADOComment(taskId: number, data: ADOCommentCreate): Promise<ADOComment> {
  return fetchJSON<ADOComment>(`/api/tasks/${taskId}/comments`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function addADOAttachment(taskId: number, data: ADOAttachmentCreate): Promise<ADOAttachment> {
  return fetchJSON<ADOAttachment>(`/api/tasks/${taskId}/attachments`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function deleteADOAttachment(attachmentId: number): Promise<{ message: string }> {
  return fetchJSON<{ message: string }>(`/api/tasks/attachments/${attachmentId}`, {
    method: "DELETE",
  });
}

// ----------------- 6. TEAM MEMBERS -----------------
export async function getTeam(status?: string, tower?: string): Promise<TeamMember[]> {
  const params = new URLSearchParams();
  if (status && status !== "All") params.append("status", status);
  if (tower && tower !== "All") params.append("tower", tower);
  const qs = params.toString() ? `?${params.toString()}` : "";
  return fetchJSON<TeamMember[]>(`/api/team${qs}`);
}

export async function addTeamMember(data: TeamMemberCreate): Promise<TeamMember> {
  return fetchJSON<TeamMember>("/api/team", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateTeamMember(id: number, data: Partial<TeamMemberCreate>): Promise<TeamMember> {
  return fetchJSON<TeamMember>(`/api/team/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteTeamMember(id: number): Promise<{ message: string }> {
  return fetchJSON<{ message: string }>(`/api/team/${id}`, {
    method: "DELETE",
  });
}

// ----------------- 7. SETTINGS & DROPDOWN MANAGER -----------------
export async function getDropdownSettingsMap(): Promise<DropdownCategoryMap> {
  return fetchJSON<DropdownCategoryMap>("/api/settings");
}

export async function getDropdownSettingsList(): Promise<DropdownOption[]> {
  return fetchJSON<DropdownOption[]>("/api/settings?format=list");
}

export async function addDropdownOption(
  categoryKey: string,
  optionValue: string,
  sortOrder: number = 0
): Promise<DropdownOption> {
  return fetchJSON<DropdownOption>("/api/settings", {
    method: "POST",
    body: JSON.stringify({ category_key: categoryKey, option_value: optionValue, sort_order: sortOrder }),
  });
}

export async function updateDropdownOption(
  id: number,
  optionValue?: string,
  isActive?: boolean,
  sortOrder?: number
): Promise<DropdownOption> {
  return fetchJSON<DropdownOption>(`/api/settings/${id}`, {
    method: "PUT",
    body: JSON.stringify({ option_value: optionValue, is_active: isActive, sort_order: sortOrder }),
  });
}

export async function deleteDropdownOption(id: number): Promise<{ message: string }> {
  return fetchJSON<{ message: string }>(`/api/settings/${id}`, {
    method: "DELETE",
  });
}

// ----------------- 8. AUTHENTICATION & RBAC -----------------
export async function loginUser(email: string, password: string): Promise<{ user: AppUser }> {
  return fetchJSON<{ user: AppUser }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function registerUser(data: AppUserRegister): Promise<{ user: AppUser }> {
  return fetchJSON<{ user: AppUser }>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getUsers(): Promise<AppUser[]> {
  return fetchJSON<AppUser[]>("/api/auth/users");
}

export async function updateUserRole(id: number, role: UserRole): Promise<AppUser> {
  return fetchJSON<AppUser>("/api/auth/users", {
    method: "PUT",
    body: JSON.stringify({ id, role }),
  });
}

export async function deleteUser(id: number): Promise<{ message: string }> {
  return fetchJSON<{ message: string }>(`/api/auth/users?id=${id}`, {
    method: "DELETE",
  });
}

// ----------------- 9. VENDOR & CONTRACT MANAGEMENT -----------------
export async function getVendorContracts(
  category?: string,
  functionalStatus?: string,
  verificationStatus?: string
): Promise<VendorContract[]> {
  const params = new URLSearchParams();
  if (category && category !== "All") params.append("category", category);
  if (functionalStatus && functionalStatus !== "All") params.append("functional_status", functionalStatus);
  if (verificationStatus && verificationStatus !== "All") params.append("verification_status", verificationStatus);
  const qs = params.toString() ? `?${params.toString()}` : "";
  return fetchJSON<VendorContract[]>(`/api/vendors${qs}`);
}

export async function getVendorContract(id: number): Promise<VendorContract> {
  return fetchJSON<VendorContract>(`/api/vendors/${id}`);
}

export async function createVendorContract(data: VendorContractCreate): Promise<VendorContract> {
  return fetchJSON<VendorContract>("/api/vendors", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateVendorContract(
  id: number,
  data: Partial<VendorContractCreate>
): Promise<VendorContract> {
  return fetchJSON<VendorContract>(`/api/vendors/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteVendorContract(id: number): Promise<{ message: string }> {
  return fetchJSON<{ message: string }>(`/api/vendors/${id}`, {
    method: "DELETE",
  });
}

// ----------------- 10. AUDIT LOG -----------------
export async function getAuditLogs(limit?: number): Promise<AuditLogEntry[]> {
  const url = limit ? `/api/audit-log?limit=${limit}` : "/api/audit-log";
  return fetchJSON<AuditLogEntry[]>(url);
}

export async function createAuditLog(entry: {
  user_name?: string;
  user_role?: string;
  action: string;
  entity_type: string;
  entity_id?: number | null;
  entity_label?: string;
  details?: string;
}): Promise<{ message: string }> {
  return fetchJSON<{ message: string }>("/api/audit-log", {
    method: "POST",
    body: JSON.stringify(entry),
  });
}


