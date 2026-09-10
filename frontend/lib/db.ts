import { neon } from "@neondatabase/serverless";
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
} from "./types";

// Neon Database URL - checking all potential environment variables
const neonDbUrl =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.NEON_DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  "postgresql://neondb_owner:npg_69GgMhcwVKea@ep-quiet-union-aw2qwjhv-pooler.c-12.us-east-1.aws.neon.tech/neondb?sslmode=require";

let sqlClient: any = null;
try {
  if (neonDbUrl) {
    sqlClient = neon(neonDbUrl);
  }
} catch (e) {
  console.warn("Could not initialize Neon client:", e);
}

async function runQuery(query: string, params: any[] = []): Promise<any[]> {
  if (!sqlClient) {
    throw new Error("Neon client not initialized");
  }
  try {
    return await sqlClient.query(query, params);
  } catch (err: any) {
    console.error("SQL Query Error:", query, params, err);
    throw err;
  }
}

// ----------------- STATS -----------------
export async function getStats(): Promise<SocietyStats> {
  if (sqlClient) {
    try {
      const [
        eventsCount,
        festivalsCount,
        meetingsCount,
        issues,
        tasks,
        teamCount,
        vendorsCount,
      ] = await Promise.all([
        runQuery("SELECT COUNT(*) as cnt FROM cultural_events"),
        runQuery("SELECT COUNT(*) as cnt FROM festival_celebrations"),
        runQuery("SELECT COUNT(*) as cnt FROM gbm_meetings"),
        runQuery("SELECT tower, status FROM community_issues"),
        runQuery("SELECT assigned_to, entity_type, status FROM ado_tasks"),
        runQuery("SELECT COUNT(*) as cnt FROM team_members"),
        runQuery("SELECT COUNT(*) as cnt FROM vendor_contracts"),
      ]);

      const openIssues = issues.filter(
        (i: any) => i.status !== "Resolved" && i.status !== "Closed"
      );
      const builderTasks = tasks.filter(
        (t: any) =>
          (t.assigned_to && t.assigned_to.includes("Builder")) ||
          t.entity_type === "Builder"
      );
      const igsTasks = tasks.filter(
        (t: any) =>
          (t.assigned_to && t.assigned_to.includes("IGS")) ||
          t.entity_type === "IGS"
      );
      const activeAdo = tasks.filter(
        (t: any) => t.status === "New" || t.status === "Active"
      );
      const resolvedAdo = tasks.filter(
        (t: any) => t.status === "Resolved" || t.status === "Closed"
      );

      const towers = [
        "Tower A",
        "Tower B",
        "Tower C",
        "Tower D",
        "Tower E",
        "Tower F",
        "Clubhouse",
        "Common Space",
      ];
      const towerCounts: Record<string, number> = {};
      towers.forEach((t) => {
        towerCounts[t] = issues.filter((i: any) => i.tower === t).length;
      });

      return {
        cultural_events_count: parseInt(eventsCount[0]?.cnt || "0"),
        festivals_count: parseInt(festivalsCount[0]?.cnt || "0"),
        meetings_count: parseInt(meetingsCount[0]?.cnt || "0"),
        total_issues: issues.length,
        open_issues_count: openIssues.length,
        total_ado_tasks: tasks.length,
        builder_tasks_count: builderTasks.length,
        igs_tasks_count: igsTasks.length,
        active_ado_tasks: activeAdo.length,
        resolved_ado_tasks: resolvedAdo.length,
        team_members_count: parseInt(teamCount[0]?.cnt || "0"),
        vendors_count: parseInt(vendorsCount[0]?.cnt || "0"),
        tower_issue_counts: towerCounts,
        society_name: "Jaitra Residents Welfare Association",
        total_towers: 6,
      };
    } catch (e) {
      console.error("Error fetching stats from DB, using fallback", e);
    }
  }

  return {
    cultural_events_count: 2,
    festivals_count: 2,
    meetings_count: 2,
    total_issues: 8,
    open_issues_count: 6,
    total_ado_tasks: 4,
    builder_tasks_count: 2,
    igs_tasks_count: 2,
    active_ado_tasks: 3,
    resolved_ado_tasks: 1,
    team_members_count: 10,
    society_name: "Jaitra Residents Welfare Association",
    total_towers: 6,
  };
}

// ----------------- FESTIVALS & TRANSACTIONS -----------------
export async function getFestivals(status?: string): Promise<FestivalCelebration[]> {
  try {
    let query = "SELECT * FROM festival_celebrations";
    const params: any[] = [];
    if (status && status !== "All") {
      query += " WHERE status = $1";
      params.push(status);
    }
    query += " ORDER BY id DESC";
    const fests = await runQuery(query, params);

    // Fetch collections and expenses for each festival
    const festivalIds = fests.map((f: any) => f.id);
    if (festivalIds.length === 0) return [];

    const [collections, expenses] = await Promise.all([
      runQuery("SELECT * FROM festival_collections ORDER BY id DESC"),
      runQuery("SELECT * FROM festival_expenses ORDER BY id DESC"),
    ]);

    return fests.map((f: any) => ({
      ...f,
      collections: collections.filter((c: any) => c.festival_id === f.id),
      expenses: expenses.filter((e: any) => e.festival_id === f.id),
    }));
  } catch (err) {
    console.error("getFestivals DB error:", err);
    return [];
  }
}

export async function getFestival(id: number): Promise<FestivalCelebration | null> {
  try {
    const fests = await runQuery("SELECT * FROM festival_celebrations WHERE id = $1", [id]);
    if (fests.length === 0) return null;
    const f = fests[0];
    const [collections, expenses] = await Promise.all([
      runQuery("SELECT * FROM festival_collections WHERE festival_id = $1 ORDER BY id DESC", [id]),
      runQuery("SELECT * FROM festival_expenses WHERE festival_id = $1 ORDER BY id DESC", [id]),
    ]);
    return {
      ...f,
      collections,
      expenses,
    };
  } catch (err) {
    console.error("getFestival DB error:", err);
    return null;
  }
}

export async function createFestival(data: FestivalCelebrationCreate): Promise<FestivalCelebration> {
  const res = await runQuery(
    `INSERT INTO festival_celebrations (festival_name, start_date, end_date, location, description, lead_organizer, estimated_budget, collected_funds, status, highlights)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [
      data.festival_name,
      data.start_date,
      data.end_date,
      data.location,
      data.description || "",
      data.lead_organizer,
      data.estimated_budget || "₹ 0",
      data.collected_funds || "₹ 0",
      data.status || "Planning",
      data.highlights || "",
    ]
  );
  return { ...res[0], collections: [], expenses: [] };
}

export async function updateFestival(id: number, data: Partial<FestivalCelebrationCreate>): Promise<FestivalCelebration> {
  const fields: string[] = [];
  const values: any[] = [];
  let i = 1;

  if (data.festival_name !== undefined) { fields.push(`festival_name = $${i++}`); values.push(data.festival_name); }
  if (data.start_date !== undefined) { fields.push(`start_date = $${i++}`); values.push(data.start_date); }
  if (data.end_date !== undefined) { fields.push(`end_date = $${i++}`); values.push(data.end_date); }
  if (data.location !== undefined) { fields.push(`location = $${i++}`); values.push(data.location); }
  if (data.description !== undefined) { fields.push(`description = $${i++}`); values.push(data.description); }
  if (data.lead_organizer !== undefined) { fields.push(`lead_organizer = $${i++}`); values.push(data.lead_organizer); }
  if (data.estimated_budget !== undefined) { fields.push(`estimated_budget = $${i++}`); values.push(data.estimated_budget); }
  if (data.collected_funds !== undefined) { fields.push(`collected_funds = $${i++}`); values.push(data.collected_funds); }
  if (data.status !== undefined) { fields.push(`status = $${i++}`); values.push(data.status); }
  if (data.highlights !== undefined) { fields.push(`highlights = $${i++}`); values.push(data.highlights); }

  if (fields.length === 0) return (await getFestival(id))!;
  values.push(id);

  const res = await runQuery(
    `UPDATE festival_celebrations SET ${fields.join(", ")} WHERE id = $${i} RETURNING *`,
    values
  );
  return getFestival(id) as Promise<FestivalCelebration>;
}

export async function deleteFestival(id: number): Promise<void> {
  await runQuery("DELETE FROM festival_collections WHERE festival_id = $1", [id]);
  await runQuery("DELETE FROM festival_expenses WHERE festival_id = $1", [id]);
  await runQuery("DELETE FROM festival_celebrations WHERE id = $1", [id]);
}

// Festival Collections
export async function addFestivalCollection(festivalId: number, data: FestivalCollectionCreate): Promise<FestivalCollection> {
  const res = await runQuery(
    `INSERT INTO festival_collections (festival_id, tower, flat_no, donor_name, amount, payment_mode, transaction_ref, collected_date, receipt_url, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [
      festivalId,
      data.tower,
      data.flat_no,
      data.donor_name,
      data.amount,
      data.payment_mode || "UPI",
      data.transaction_ref || "",
      data.collected_date || new Date().toISOString().split("T")[0],
      data.receipt_url || "",
      data.notes || "",
    ]
  );

  // Update total collected in festival
  const total = await runQuery(
    "SELECT COALESCE(SUM(amount), 0) as total FROM festival_collections WHERE festival_id = $1",
    [festivalId]
  );
  const formattedFunds = `₹ ${Number(total[0]?.total || 0).toLocaleString("en-IN")}`;
  await runQuery("UPDATE festival_celebrations SET collected_funds = $1 WHERE id = $2", [formattedFunds, festivalId]);

  return res[0];
}

export async function updateFestivalCollection(id: number, data: Partial<FestivalCollectionCreate>): Promise<FestivalCollection> {
  const fields: string[] = [];
  const values: any[] = [];
  let i = 1;

  if (data.tower !== undefined) { fields.push(`tower = $${i++}`); values.push(data.tower); }
  if (data.flat_no !== undefined) { fields.push(`flat_no = $${i++}`); values.push(data.flat_no); }
  if (data.donor_name !== undefined) { fields.push(`donor_name = $${i++}`); values.push(data.donor_name); }
  if (data.amount !== undefined) { fields.push(`amount = $${i++}`); values.push(data.amount); }
  if (data.payment_mode !== undefined) { fields.push(`payment_mode = $${i++}`); values.push(data.payment_mode); }
  if (data.transaction_ref !== undefined) { fields.push(`transaction_ref = $${i++}`); values.push(data.transaction_ref); }
  if (data.collected_date !== undefined) { fields.push(`collected_date = $${i++}`); values.push(data.collected_date); }
  if (data.receipt_url !== undefined) { fields.push(`receipt_url = $${i++}`); values.push(data.receipt_url); }
  if (data.notes !== undefined) { fields.push(`notes = $${i++}`); values.push(data.notes); }

  values.push(id);
  const res = await runQuery(
    `UPDATE festival_collections SET ${fields.join(", ")} WHERE id = $${i} RETURNING *`,
    values
  );
  return res[0];
}

export async function deleteFestivalCollection(collectionId: number): Promise<void> {
  const coll = await runQuery("SELECT festival_id FROM festival_collections WHERE id = $1", [collectionId]);
  await runQuery("DELETE FROM festival_collections WHERE id = $1", [collectionId]);
  if (coll.length > 0) {
    const festId = coll[0].festival_id;
    const total = await runQuery("SELECT COALESCE(SUM(amount), 0) as total FROM festival_collections WHERE festival_id = $1", [festId]);
    const formattedFunds = `₹ ${Number(total[0]?.total || 0).toLocaleString("en-IN")}`;
    await runQuery("UPDATE festival_celebrations SET collected_funds = $1 WHERE id = $2", [formattedFunds, festId]);
  }
}

// Festival Expenses
export async function addFestivalExpense(festivalId: number, data: FestivalExpenseCreate): Promise<FestivalExpense> {
  const res = await runQuery(
    `INSERT INTO festival_expenses (festival_id, title, category, amount, vendor_name, bill_date, invoice_url, audit_evidence_notes, approver_name, approver_role, approval_status, payment_mode, transaction_ref)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
     RETURNING *`,
    [
      festivalId,
      data.title,
      data.category,
      data.amount,
      data.vendor_name || "",
      data.bill_date || new Date().toISOString().split("T")[0],
      data.invoice_url || "",
      data.audit_evidence_notes || "",
      data.approver_name || "Treasurer",
      data.approver_role || "Treasurer",
      data.approval_status || "Approved",
      data.payment_mode || "UPI",
      data.transaction_ref || "",
    ]
  );
  return res[0];
}

export async function updateFestivalExpense(id: number, data: Partial<FestivalExpenseCreate>): Promise<FestivalExpense> {
  const fields: string[] = [];
  const values: any[] = [];
  let i = 1;

  if (data.title !== undefined) { fields.push(`title = $${i++}`); values.push(data.title); }
  if (data.category !== undefined) { fields.push(`category = $${i++}`); values.push(data.category); }
  if (data.amount !== undefined) { fields.push(`amount = $${i++}`); values.push(data.amount); }
  if (data.vendor_name !== undefined) { fields.push(`vendor_name = $${i++}`); values.push(data.vendor_name); }
  if (data.bill_date !== undefined) { fields.push(`bill_date = $${i++}`); values.push(data.bill_date); }
  if (data.invoice_url !== undefined) { fields.push(`invoice_url = $${i++}`); values.push(data.invoice_url); }
  if (data.audit_evidence_notes !== undefined) { fields.push(`audit_evidence_notes = $${i++}`); values.push(data.audit_evidence_notes); }
  if (data.approver_name !== undefined) { fields.push(`approver_name = $${i++}`); values.push(data.approver_name); }
  if (data.approver_role !== undefined) { fields.push(`approver_role = $${i++}`); values.push(data.approver_role); }
  if (data.approval_status !== undefined) { fields.push(`approval_status = $${i++}`); values.push(data.approval_status); }
  if (data.payment_mode !== undefined) { fields.push(`payment_mode = $${i++}`); values.push(data.payment_mode); }
  if (data.transaction_ref !== undefined) { fields.push(`transaction_ref = $${i++}`); values.push(data.transaction_ref); }

  values.push(id);
  const res = await runQuery(
    `UPDATE festival_expenses SET ${fields.join(", ")} WHERE id = $${i} RETURNING *`,
    values
  );
  return res[0];
}

export async function updateFestivalExpenseStatus(expenseId: number, approvalStatus: string, approverName?: string): Promise<FestivalExpense> {
  let query = "UPDATE festival_expenses SET approval_status = $1";
  const params: any[] = [approvalStatus];
  if (approverName) {
    query += ", approver_name = $2 WHERE id = $3 RETURNING *";
    params.push(approverName, expenseId);
  } else {
    query += " WHERE id = $2 RETURNING *";
    params.push(expenseId);
  }
  const res = await runQuery(query, params);
  return res[0];
}

export async function deleteFestivalExpense(expenseId: number): Promise<void> {
  await runQuery("DELETE FROM festival_expenses WHERE id = $1", [expenseId]);
}

// ----------------- CULTURAL EVENTS -----------------
export async function getCulturalEvents(status?: string, category?: string): Promise<CulturalEvent[]> {
  try {
    let query = "SELECT * FROM cultural_events";
    const conditions: string[] = [];
    const params: any[] = [];
    let i = 1;

    if (status && status !== "All") {
      conditions.push(`status = $${i++}`);
      params.push(status);
    }
    if (category && category !== "All") {
      conditions.push(`category ILIKE $${i++}`);
      params.push(`%${category}%`);
    }
    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }
    query += " ORDER BY event_date ASC, id DESC";

    const events = await runQuery(query, params);
    const [participants, agendas] = await Promise.all([
      runQuery("SELECT * FROM cultural_participants ORDER BY id DESC"),
      runQuery("SELECT * FROM cultural_agendas ORDER BY slot_time ASC, id ASC"),
    ]);

    return events.map((e: any) => ({
      ...e,
      participants: participants.filter((p: any) => p.event_id === e.id),
      agendas: agendas.filter((a: any) => a.event_id === e.id),
    }));
  } catch (err) {
    console.error("getCulturalEvents DB error:", err);
    return [];
  }
}

export async function getCulturalEvent(id: number): Promise<CulturalEvent | null> {
  try {
    const evs = await runQuery("SELECT * FROM cultural_events WHERE id = $1", [id]);
    if (evs.length === 0) return null;
    const e = evs[0];
    const [participants, agendas] = await Promise.all([
      runQuery("SELECT * FROM cultural_participants WHERE event_id = $1 ORDER BY id DESC", [id]),
      runQuery("SELECT * FROM cultural_agendas WHERE event_id = $1 ORDER BY slot_time ASC, id ASC", [id]),
    ]);
    return {
      ...e,
      participants,
      agendas,
    };
  } catch (err) {
    console.error("getCulturalEvent DB error:", err);
    return null;
  }
}

export async function createCulturalEvent(data: CulturalEventCreate): Promise<CulturalEvent> {
  const res = await runQuery(
    `INSERT INTO cultural_events (title, category, event_date, time, venue, description, coordinator, coordinator_contact, status, registered_count, budget)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING *`,
    [
      data.title,
      data.category,
      data.event_date,
      data.time,
      data.venue,
      data.description || "",
      data.coordinator,
      data.coordinator_contact || "",
      data.status || "Upcoming",
      data.registered_count || 0,
      data.budget || "₹ 0",
    ]
  );
  return { ...res[0], participants: [], agendas: [] };
}

export async function updateCulturalEvent(id: number, data: Partial<CulturalEventCreate>): Promise<CulturalEvent> {
  const fields: string[] = [];
  const values: any[] = [];
  let i = 1;

  if (data.title !== undefined) { fields.push(`title = $${i++}`); values.push(data.title); }
  if (data.category !== undefined) { fields.push(`category = $${i++}`); values.push(data.category); }
  if (data.event_date !== undefined) { fields.push(`event_date = $${i++}`); values.push(data.event_date); }
  if (data.time !== undefined) { fields.push(`time = $${i++}`); values.push(data.time); }
  if (data.venue !== undefined) { fields.push(`venue = $${i++}`); values.push(data.venue); }
  if (data.description !== undefined) { fields.push(`description = $${i++}`); values.push(data.description); }
  if (data.coordinator !== undefined) { fields.push(`coordinator = $${i++}`); values.push(data.coordinator); }
  if (data.coordinator_contact !== undefined) { fields.push(`coordinator_contact = $${i++}`); values.push(data.coordinator_contact); }
  if (data.status !== undefined) { fields.push(`status = $${i++}`); values.push(data.status); }
  if (data.registered_count !== undefined) { fields.push(`registered_count = $${i++}`); values.push(data.registered_count); }
  if (data.budget !== undefined) { fields.push(`budget = $${i++}`); values.push(data.budget); }

  values.push(id);
  await runQuery(`UPDATE cultural_events SET ${fields.join(", ")} WHERE id = $${i}`, values);
  return (await getCulturalEvent(id))!;
}

export async function deleteCulturalEvent(id: number): Promise<void> {
  await runQuery("DELETE FROM cultural_participants WHERE event_id = $1", [id]);
  await runQuery("DELETE FROM cultural_agendas WHERE event_id = $1", [id]);
  await runQuery("DELETE FROM cultural_events WHERE id = $1", [id]);
}

export async function addCulturalParticipant(eventId: number, data: CulturalParticipantCreate): Promise<CulturalParticipant> {
  const res = await runQuery(
    `INSERT INTO cultural_participants (event_id, tower, flat_no, participant_name, age_group, activity_category, contact_no, notes, registration_date)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      eventId,
      data.tower,
      data.flat_no,
      data.participant_name,
      data.age_group,
      data.activity_category,
      data.contact_no || "",
      data.notes || "",
      data.registration_date || new Date().toISOString().split("T")[0],
    ]
  );
  await runQuery(
    "UPDATE cultural_events SET registered_count = (SELECT COUNT(*) FROM cultural_participants WHERE event_id = $1) WHERE id = $1",
    [eventId]
  );
  return res[0];
}

export async function updateCulturalParticipant(id: number, data: Partial<CulturalParticipantCreate>): Promise<CulturalParticipant> {
  const fields: string[] = [];
  const values: any[] = [];
  let i = 1;

  if (data.tower !== undefined) { fields.push(`tower = $${i++}`); values.push(data.tower); }
  if (data.flat_no !== undefined) { fields.push(`flat_no = $${i++}`); values.push(data.flat_no); }
  if (data.participant_name !== undefined) { fields.push(`participant_name = $${i++}`); values.push(data.participant_name); }
  if (data.age_group !== undefined) { fields.push(`age_group = $${i++}`); values.push(data.age_group); }
  if (data.activity_category !== undefined) { fields.push(`activity_category = $${i++}`); values.push(data.activity_category); }
  if (data.contact_no !== undefined) { fields.push(`contact_no = $${i++}`); values.push(data.contact_no); }
  if (data.notes !== undefined) { fields.push(`notes = $${i++}`); values.push(data.notes); }

  values.push(id);
  const res = await runQuery(`UPDATE cultural_participants SET ${fields.join(", ")} WHERE id = $${i} RETURNING *`, values);
  return res[0];
}

export async function deleteCulturalParticipant(participantId: number): Promise<void> {
  const row = await runQuery("SELECT event_id FROM cultural_participants WHERE id = $1", [participantId]);
  await runQuery("DELETE FROM cultural_participants WHERE id = $1", [participantId]);
  if (row.length > 0) {
    const eventId = row[0].event_id;
    await runQuery(
      "UPDATE cultural_events SET registered_count = (SELECT COUNT(*) FROM cultural_participants WHERE event_id = $1) WHERE id = $1",
      [eventId]
    );
  }
}

export async function addCulturalAgenda(eventId: number, data: CulturalAgendaCreate): Promise<CulturalAgenda> {
  const res = await runQuery(
    `INSERT INTO cultural_agendas (event_id, slot_time, performer_or_speaker, activity_topic, stage_coordinator, duration_mins)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      eventId,
      data.slot_time,
      data.performer_or_speaker,
      data.activity_topic,
      data.stage_coordinator || "",
      data.duration_mins || 30,
    ]
  );
  return res[0];
}

export async function updateCulturalAgenda(id: number, data: Partial<CulturalAgendaCreate>): Promise<CulturalAgenda> {
  const fields: string[] = [];
  const values: any[] = [];
  let i = 1;

  if (data.slot_time !== undefined) { fields.push(`slot_time = $${i++}`); values.push(data.slot_time); }
  if (data.performer_or_speaker !== undefined) { fields.push(`performer_or_speaker = $${i++}`); values.push(data.performer_or_speaker); }
  if (data.activity_topic !== undefined) { fields.push(`activity_topic = $${i++}`); values.push(data.activity_topic); }
  if (data.stage_coordinator !== undefined) { fields.push(`stage_coordinator = $${i++}`); values.push(data.stage_coordinator); }
  if (data.duration_mins !== undefined) { fields.push(`duration_mins = $${i++}`); values.push(data.duration_mins); }

  values.push(id);
  const res = await runQuery(`UPDATE cultural_agendas SET ${fields.join(", ")} WHERE id = $${i} RETURNING *`, values);
  return res[0];
}

export async function deleteCulturalAgenda(agendaId: number): Promise<void> {
  await runQuery("DELETE FROM cultural_agendas WHERE id = $1", [agendaId]);
}

// ----------------- MEETINGS (GBM) -----------------
export async function getMeetings(meetingType?: string): Promise<GeneralBodyMeeting[]> {
  try {
    let query = "SELECT * FROM gbm_meetings";
    const params: any[] = [];
    if (meetingType && meetingType !== "All") {
      query += " WHERE meeting_type = $1";
      params.push(meetingType);
    }
    query += " ORDER BY meeting_date DESC, id DESC";
    return await runQuery(query, params);
  } catch (err) {
    console.error("getMeetings DB error:", err);
    return [];
  }
}

export async function getMeeting(id: number): Promise<GeneralBodyMeeting | null> {
  const rows = await runQuery("SELECT * FROM gbm_meetings WHERE id = $1", [id]);
  return rows[0] || null;
}

export async function createMeeting(data: GeneralBodyMeetingCreate): Promise<GeneralBodyMeeting> {
  const res = await runQuery(
    `INSERT INTO gbm_meetings (meeting_title, meeting_type, meeting_date, time, venue, quorum_status, key_agenda, resolutions_passed, minutes_summary, attendees_count, doc_link)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING *`,
    [
      data.meeting_title,
      data.meeting_type,
      data.meeting_date,
      data.time,
      data.venue,
      data.quorum_status || "Quorum Met",
      data.key_agenda || "",
      data.resolutions_passed || "",
      data.minutes_summary || "",
      data.attendees_count || 0,
      data.doc_link || "",
    ]
  );
  return res[0];
}

export async function updateMeeting(id: number, data: Partial<GeneralBodyMeetingCreate>): Promise<GeneralBodyMeeting> {
  const fields: string[] = [];
  const values: any[] = [];
  let i = 1;

  if (data.meeting_title !== undefined) { fields.push(`meeting_title = $${i++}`); values.push(data.meeting_title); }
  if (data.meeting_type !== undefined) { fields.push(`meeting_type = $${i++}`); values.push(data.meeting_type); }
  if (data.meeting_date !== undefined) { fields.push(`meeting_date = $${i++}`); values.push(data.meeting_date); }
  if (data.time !== undefined) { fields.push(`time = $${i++}`); values.push(data.time); }
  if (data.venue !== undefined) { fields.push(`venue = $${i++}`); values.push(data.venue); }
  if (data.quorum_status !== undefined) { fields.push(`quorum_status = $${i++}`); values.push(data.quorum_status); }
  if (data.key_agenda !== undefined) { fields.push(`key_agenda = $${i++}`); values.push(data.key_agenda); }
  if (data.resolutions_passed !== undefined) { fields.push(`resolutions_passed = $${i++}`); values.push(data.resolutions_passed); }
  if (data.minutes_summary !== undefined) { fields.push(`minutes_summary = $${i++}`); values.push(data.minutes_summary); }
  if (data.attendees_count !== undefined) { fields.push(`attendees_count = $${i++}`); values.push(data.attendees_count); }
  if (data.doc_link !== undefined) { fields.push(`doc_link = $${i++}`); values.push(data.doc_link); }

  values.push(id);
  const res = await runQuery(`UPDATE gbm_meetings SET ${fields.join(", ")} WHERE id = $${i} RETURNING *`, values);
  return res[0];
}

export async function deleteMeeting(id: number): Promise<void> {
  await runQuery("DELETE FROM gbm_meetings WHERE id = $1", [id]);
}

// ----------------- ISSUES TRACKER -----------------
export async function getIssues(
  tower?: string,
  status?: string,
  priority?: string,
  category?: string
): Promise<CommunityIssue[]> {
  try {
    let query = "SELECT * FROM community_issues";
    const conditions: string[] = [];
    const params: any[] = [];
    let i = 1;

    if (tower && tower !== "All") {
      conditions.push(`tower = $${i++}`);
      params.push(tower);
    }
    if (status && status !== "All") {
      conditions.push(`status = $${i++}`);
      params.push(status);
    }
    if (priority && priority !== "All") {
      conditions.push(`priority = $${i++}`);
      params.push(priority);
    }
    if (category && category !== "All") {
      conditions.push(`category ILIKE $${i++}`);
      params.push(`%${category}%`);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }
    query += " ORDER BY id DESC";

    return await runQuery(query, params);
  } catch (err) {
    console.error("getIssues DB error:", err);
    return [];
  }
}

export async function getIssue(id: number): Promise<CommunityIssue | null> {
  const rows = await runQuery("SELECT * FROM community_issues WHERE id = $1", [id]);
  return rows[0] || null;
}

export async function createIssue(data: CommunityIssueCreate): Promise<CommunityIssue> {
  let code = data.issue_code?.trim();
  if (!code) {
    let pfx = "TWA";
    let base = 100;
    const tower = data.tower || "";
    if (tower.includes("Tower B")) { pfx = "TWB"; base = 200; }
    else if (tower.includes("Tower C")) { pfx = "TWC"; base = 300; }
    else if (tower.includes("Tower D")) { pfx = "TWD"; base = 400; }
    else if (tower.includes("Tower E")) { pfx = "TWE"; base = 500; }
    else if (tower.includes("Tower F")) { pfx = "TWF"; base = 600; }
    else if (tower.includes("Clubhouse")) { pfx = "CH"; base = 700; }
    else if (tower.includes("Common")) { pfx = "CS"; base = 800; }

    const rows = await runQuery("SELECT issue_code FROM community_issues WHERE issue_code IS NOT NULL");
    const existingCodes = new Set<string>(rows.map((r: any) => (r.issue_code || "").trim()));
    const regex = new RegExp(`^ISS-${pfx}-(\\d+)$`, "i");
    let maxNum = base;
    existingCodes.forEach((ec) => {
      const match = ec.match(regex);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    });
    let candidate = `ISS-${pfx}-${maxNum + 1}`;
    let nextNum = maxNum + 1;
    while (existingCodes.has(candidate)) {
      nextNum++;
      candidate = `ISS-${pfx}-${nextNum}`;
    }
    code = candidate;
  }

  const res = await runQuery(
    `INSERT INTO community_issues (issue_code, tower, flat_no, flat_or_location, title, category, reported_by, priority, status, assigned_to, created_at, description, resolution_notes, attachment_url)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
     RETURNING *`,
    [
      code,
      data.tower,
      data.flat_no || "",
      data.flat_or_location,
      data.title,
      data.category,
      data.reported_by,
      data.priority || "Medium",
      data.status || "Open",
      data.assigned_to || "Facility Maintenance",
      data.created_at || new Date().toISOString().split("T")[0],
      data.description || "",
      data.resolution_notes || "",
      data.attachment_url || "",
    ]
  );
  return res[0];
}

export async function updateIssue(id: number, data: Partial<CommunityIssueCreate>): Promise<CommunityIssue> {
  const fields: string[] = [];
  const values: any[] = [];
  let i = 1;

  if (data.tower !== undefined) { fields.push(`tower = $${i++}`); values.push(data.tower); }
  if (data.flat_no !== undefined) { fields.push(`flat_no = $${i++}`); values.push(data.flat_no); }
  if (data.flat_or_location !== undefined) { fields.push(`flat_or_location = $${i++}`); values.push(data.flat_or_location); }
  if (data.title !== undefined) { fields.push(`title = $${i++}`); values.push(data.title); }
  if (data.category !== undefined) { fields.push(`category = $${i++}`); values.push(data.category); }
  if (data.reported_by !== undefined) { fields.push(`reported_by = $${i++}`); values.push(data.reported_by); }
  if (data.priority !== undefined) { fields.push(`priority = $${i++}`); values.push(data.priority); }
  if (data.status !== undefined) { fields.push(`status = $${i++}`); values.push(data.status); }
  if (data.assigned_to !== undefined) { fields.push(`assigned_to = $${i++}`); values.push(data.assigned_to); }
  if (data.description !== undefined) { fields.push(`description = $${i++}`); values.push(data.description); }
  if (data.resolution_notes !== undefined) { fields.push(`resolution_notes = $${i++}`); values.push(data.resolution_notes); }
  if (data.attachment_url !== undefined) { fields.push(`attachment_url = $${i++}`); values.push(data.attachment_url); }

  values.push(id);
  const res = await runQuery(`UPDATE community_issues SET ${fields.join(", ")} WHERE id = $${i} RETURNING *`, values);
  return res[0];
}

export async function deleteIssue(id: number): Promise<void> {
  await runQuery("DELETE FROM community_issues WHERE id = $1", [id]);
}

// ----------------- ADO TASKS (BUILDER & IGS) -----------------
export async function getTasks(assignedTo?: string, entityType?: string, status?: string): Promise<ADOTask[]> {
  try {
    let query = "SELECT * FROM ado_tasks";
    const conditions: string[] = [];
    const params: any[] = [];
    let i = 1;

    if (assignedTo && assignedTo !== "All") {
      conditions.push(`assigned_to ILIKE $${i++}`);
      params.push(`%${assignedTo}%`);
    }
    if (entityType && entityType !== "All") {
      conditions.push(`entity_type = $${i++}`);
      params.push(entityType);
    }
    if (status && status !== "All") {
      conditions.push(`status = $${i++}`);
      params.push(status);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }
    query += " ORDER BY id DESC";

    const tasks = await runQuery(query, params);
    const [comments, attachments] = await Promise.all([
      runQuery("SELECT * FROM ado_comments ORDER BY id ASC"),
      runQuery("SELECT * FROM ado_attachments ORDER BY id DESC"),
    ]);

    return tasks.map((t: any) => ({
      ...t,
      comments: comments.filter((c: any) => c.task_id === t.id),
      attachments: attachments.filter((a: any) => a.task_id === t.id),
    }));
  } catch (err) {
    console.error("getTasks DB error:", err);
    return [];
  }
}

export async function getTask(id: number): Promise<ADOTask | null> {
  try {
    const tasks = await runQuery("SELECT * FROM ado_tasks WHERE id = $1", [id]);
    if (tasks.length === 0) return null;
    const t = tasks[0];
    const [comments, attachments] = await Promise.all([
      runQuery("SELECT * FROM ado_comments WHERE task_id = $1 ORDER BY id ASC", [id]),
      runQuery("SELECT * FROM ado_attachments WHERE task_id = $1 ORDER BY id DESC", [id]),
    ]);
    return {
      ...t,
      comments,
      attachments,
    };
  } catch (err) {
    console.error("getTask DB error:", err);
    return null;
  }
}

export async function createTask(data: ADOTaskCreate): Promise<ADOTask> {
  let code = data.task_code?.trim();
  if (!code) {
    const rows = await runQuery("SELECT task_code FROM ado_tasks WHERE task_code IS NOT NULL");
    const existingCodes = new Set<string>(rows.map((r: any) => (r.task_code || "").trim()));
    let maxNum = 100;
    existingCodes.forEach((ec) => {
      const match = ec.match(/(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    });
    let candidate = `ADO-${maxNum + 1}`;
    let nextNum = maxNum + 1;
    while (existingCodes.has(candidate)) {
      nextNum++;
      candidate = `ADO-${nextNum}`;
    }
    code = candidate;
  }

  const res = await runQuery(
    `INSERT INTO ado_tasks (task_code, title, assigned_to, entity_type, category, status, priority, assignee_name, due_date, sla_days, blockers, description, completion_percentage, tags)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
     RETURNING *`,
    [
      code,
      data.title,
      data.assigned_to,
      data.entity_type || (data.assigned_to.includes("IGS") ? "IGS" : "Builder"),
      data.category,
      data.status || "Active",
      data.priority || "High",
      data.assignee_name || "",
      data.due_date || "",
      data.sla_days || 14,
      data.blockers || "",
      data.description || "",
      data.completion_percentage || 0,
      data.tags || "",
    ]
  );
  return { ...res[0], comments: [], attachments: [] };
}

export async function updateTask(id: number, data: Partial<ADOTaskCreate>): Promise<ADOTask> {
  const fields: string[] = [];
  const values: any[] = [];
  let i = 1;

  if (data.title !== undefined) { fields.push(`title = $${i++}`); values.push(data.title); }
  if (data.assigned_to !== undefined) { fields.push(`assigned_to = $${i++}`); values.push(data.assigned_to); }
  if (data.entity_type !== undefined) { fields.push(`entity_type = $${i++}`); values.push(data.entity_type); }
  if (data.category !== undefined) { fields.push(`category = $${i++}`); values.push(data.category); }
  if (data.status !== undefined) { fields.push(`status = $${i++}`); values.push(data.status); }
  if (data.priority !== undefined) { fields.push(`priority = $${i++}`); values.push(data.priority); }
  if (data.assignee_name !== undefined) { fields.push(`assignee_name = $${i++}`); values.push(data.assignee_name); }
  if (data.due_date !== undefined) { fields.push(`due_date = $${i++}`); values.push(data.due_date); }
  if (data.sla_days !== undefined) { fields.push(`sla_days = $${i++}`); values.push(data.sla_days); }
  if (data.blockers !== undefined) { fields.push(`blockers = $${i++}`); values.push(data.blockers); }
  if (data.description !== undefined) { fields.push(`description = $${i++}`); values.push(data.description); }
  if (data.completion_percentage !== undefined) { fields.push(`completion_percentage = $${i++}`); values.push(data.completion_percentage); }
  if (data.tags !== undefined) { fields.push(`tags = $${i++}`); values.push(data.tags); }

  values.push(id);
  await runQuery(`UPDATE ado_tasks SET ${fields.join(", ")} WHERE id = $${i}`, values);
  return (await getTask(id))!;
}

export async function updateTaskStatus(
  id: number,
  status: string,
  completionPercentage?: number,
  blockers?: string
): Promise<ADOTask> {
  const fields = ["status = $1"];
  const values: any[] = [status];
  let i = 2;

  if (completionPercentage !== undefined) {
    fields.push(`completion_percentage = $${i++}`);
    values.push(completionPercentage);
  } else if (status === "Resolved" || status === "Closed") {
    fields.push(`completion_percentage = $${i++}`);
    values.push(100);
  } else if (status === "New") {
    fields.push(`completion_percentage = $${i++}`);
    values.push(0);
  }

  if (blockers !== undefined) {
    fields.push(`blockers = $${i++}`);
    values.push(blockers);
  }

  values.push(id);
  await runQuery(`UPDATE ado_tasks SET ${fields.join(", ")} WHERE id = $${i}`, values);
  return (await getTask(id))!;
}

export async function deleteTask(id: number): Promise<void> {
  await runQuery("DELETE FROM ado_comments WHERE task_id = $1", [id]);
  await runQuery("DELETE FROM ado_attachments WHERE task_id = $1", [id]);
  await runQuery("DELETE FROM ado_tasks WHERE id = $1", [id]);
}

export async function addComment(taskId: number, data: ADOCommentCreate): Promise<ADOComment> {
  const res = await runQuery(
    `INSERT INTO ado_comments (task_id, author_name, author_role, comment_text, created_at)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [
      taskId,
      data.author_name,
      data.author_role || "MC Member",
      data.comment_text,
      data.created_at || new Date().toLocaleString(),
    ]
  );
  return res[0];
}

export async function deleteComment(commentId: number): Promise<void> {
  await runQuery("DELETE FROM ado_comments WHERE id = $1", [commentId]);
}

export async function addAttachment(taskId: number, data: ADOAttachmentCreate): Promise<ADOAttachment> {
  const res = await runQuery(
    `INSERT INTO ado_attachments (task_id, file_name, file_url, description, uploaded_by, created_at)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      taskId,
      data.file_name,
      data.file_url,
      data.description || "",
      data.uploaded_by || "User",
      data.created_at || new Date().toISOString().split("T")[0],
    ]
  );
  return res[0];
}

export async function deleteAttachment(attachmentId: number): Promise<void> {
  await runQuery("DELETE FROM ado_attachments WHERE id = $1", [attachmentId]);
}

// ----------------- TEAM MEMBERS -----------------
export async function getTeam(status?: string, tower?: string): Promise<TeamMember[]> {
  try {
    let query = "SELECT * FROM team_members";
    const conditions: string[] = [];
    const params: any[] = [];
    let i = 1;

    if (status && status !== "All") {
      conditions.push(`status = $${i++}`);
      params.push(status);
    }
    if (tower && tower !== "All") {
      conditions.push(`(tower = $${i} OR wing_flat ILIKE $${i + 1})`);
      params.push(tower, `%${tower}%`);
      i += 2;
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }
    query += " ORDER BY id ASC";

    return await runQuery(query, params);
  } catch (err) {
    console.error("getTeam DB error:", err);
    return [];
  }
}

export async function getTeamMember(id: number): Promise<TeamMember | null> {
  const rows = await runQuery("SELECT * FROM team_members WHERE id = $1", [id]);
  return rows[0] || null;
}

export async function createTeamMember(data: TeamMemberCreate): Promise<TeamMember> {
  const res = await runQuery(
    `INSERT INTO team_members (name, role, wing_flat, tower, contact, email, term, sub_committee, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      data.name,
      data.role,
      data.wing_flat || "",
      data.tower || "Tower A",
      data.contact,
      data.email || "",
      data.term || "2025-2027",
      data.sub_committee || "General Committee",
      data.status || "Active",
    ]
  );
  return res[0];
}

export async function updateTeamMember(id: number, data: Partial<TeamMemberCreate>): Promise<TeamMember> {
  const fields: string[] = [];
  const values: any[] = [];
  let i = 1;

  if (data.name !== undefined) { fields.push(`name = $${i++}`); values.push(data.name); }
  if (data.role !== undefined) { fields.push(`role = $${i++}`); values.push(data.role); }
  if (data.wing_flat !== undefined) { fields.push(`wing_flat = $${i++}`); values.push(data.wing_flat); }
  if (data.tower !== undefined) { fields.push(`tower = $${i++}`); values.push(data.tower); }
  if (data.contact !== undefined) { fields.push(`contact = $${i++}`); values.push(data.contact); }
  if (data.email !== undefined) { fields.push(`email = $${i++}`); values.push(data.email); }
  if (data.term !== undefined) { fields.push(`term = $${i++}`); values.push(data.term); }
  if (data.sub_committee !== undefined) { fields.push(`sub_committee = $${i++}`); values.push(data.sub_committee); }
  if (data.status !== undefined) { fields.push(`status = $${i++}`); values.push(data.status); }

  values.push(id);
  const res = await runQuery(`UPDATE team_members SET ${fields.join(", ")} WHERE id = $${i} RETURNING *`, values);
  return res[0];
}

export async function deleteTeamMember(id: number): Promise<void> {
  await runQuery("DELETE FROM team_members WHERE id = $1", [id]);
}

// ----------------- AUDIT REPORT / TRANSACTIONS -----------------
export async function getAllTransactions(): Promise<AuditTransaction[]> {
  const [fests, collections, expenses] = await Promise.all([
    runQuery("SELECT id, festival_name FROM festival_celebrations"),
    runQuery("SELECT * FROM festival_collections ORDER BY collected_date DESC"),
    runQuery("SELECT * FROM festival_expenses ORDER BY bill_date DESC"),
  ]);

  const festMap: Record<number, string> = {};
  fests.forEach((f: any) => { festMap[f.id] = f.festival_name; });

  const list: AuditTransaction[] = [];

  collections.forEach((c: any) => {
    list.push({
      id: `COL-${c.id}`,
      type: "Collection",
      festival_or_event: festMap[c.festival_id] || `Festival #${c.festival_id}`,
      date: c.collected_date || "-",
      category: "Resident Contribution",
      particulars: `${c.donor_name} (${c.tower} ${c.flat_no})`,
      payer_or_vendor: c.donor_name,
      tower_flat: `${c.tower} ${c.flat_no}`,
      payment_mode: c.payment_mode || "UPI",
      transaction_ref: c.transaction_ref || "-",
      amount: Number(c.amount || 0),
      status: "Received",
      evidence_url: c.receipt_url,
    });
  });

  expenses.forEach((e: any) => {
    list.push({
      id: `EXP-${e.id}`,
      type: "Expense",
      festival_or_event: festMap[e.festival_id] || `Festival #${e.festival_id}`,
      date: e.bill_date || "-",
      category: e.category || "General",
      particulars: e.title,
      payer_or_vendor: e.vendor_name || "-",
      tower_flat: "-",
      payment_mode: e.payment_mode || "UPI",
      transaction_ref: e.transaction_ref || "-",
      amount: Number(e.amount || 0),
      status: e.approval_status || "Approved",
      evidence_url: e.invoice_url,
      approver: e.approver_name,
    });
  });

  return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

// ----------------- DROPDOWN SETTINGS (SUPER ADMIN ONLY) -----------------
export async function getAllDropdownSettings(): Promise<DropdownCategoryMap> {
  try {
    const rows = await runQuery(
      "SELECT category_key, option_value FROM dropdown_settings WHERE is_active = TRUE ORDER BY category_key ASC, sort_order ASC, id ASC"
    );
    const map: DropdownCategoryMap = {};
    for (const r of rows) {
      if (!map[r.category_key]) {
        map[r.category_key] = [];
      }
      map[r.category_key].push(r.option_value);
    }
    return map;
  } catch (err) {
    console.error("getAllDropdownSettings error:", err);
    return {};
  }
}

export async function getDropdownSettingsList(): Promise<DropdownOption[]> {
  try {
    return await runQuery(
      "SELECT * FROM dropdown_settings ORDER BY category_key ASC, sort_order ASC, id ASC"
    );
  } catch (err) {
    console.error("getDropdownSettingsList error:", err);
    return [];
  }
}

export async function addDropdownOption(
  categoryKey: string,
  optionValue: string,
  sortOrder: number = 0
): Promise<DropdownOption> {
  const res = await runQuery(
    `INSERT INTO dropdown_settings (category_key, option_value, sort_order, is_active)
     VALUES ($1, $2, $3, TRUE)
     ON CONFLICT (category_key, option_value) DO UPDATE SET is_active = TRUE
     RETURNING *`,
    [categoryKey, optionValue.trim(), sortOrder]
  );
  return res[0];
}

export async function updateDropdownOption(
  id: number,
  optionValue?: string,
  isActive?: boolean,
  sortOrder?: number
): Promise<DropdownOption> {
  const fields: string[] = [];
  const values: any[] = [];
  let i = 1;

  if (optionValue !== undefined) { fields.push(`option_value = $${i++}`); values.push(optionValue.trim()); }
  if (isActive !== undefined) { fields.push(`is_active = $${i++}`); values.push(isActive); }
  if (sortOrder !== undefined) { fields.push(`sort_order = $${i++}`); values.push(sortOrder); }

  values.push(id);
  const res = await runQuery(
    `UPDATE dropdown_settings SET ${fields.join(", ")} WHERE id = $${i} RETURNING *`,
    values
  );
  return res[0];
}

export async function deleteDropdownOption(id: number): Promise<void> {
  await runQuery("DELETE FROM dropdown_settings WHERE id = $1", [id]);
}

// ----------------- USER AUTHENTICATION & RBAC -----------------
export async function ensureAppUsersTable(): Promise<void> {
  try {
    await runQuery(`
      CREATE TABLE IF NOT EXISTS app_users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'User',
        tower TEXT DEFAULT 'Tower A',
        flat_no TEXT DEFAULT '',
        phone TEXT DEFAULT '',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Ensure Staff user exists
    const staffCheck = await runQuery("SELECT id FROM app_users WHERE LOWER(email) = 'staff@jaitra.org'");
    if (staffCheck.length === 0) {
      await runQuery(`
        INSERT INTO app_users (name, email, password, role, tower, flat_no, phone)
        VALUES ('Jaitra Operations Staff', 'staff@jaitra.org', 'staff123', 'Staff', 'Clubhouse', 'Staff Desk', '+91 98450 00111')
        ON CONFLICT (email) DO UPDATE SET role = 'Staff'
      `);
    }

    // Ensure Super Admin user exists
    const superCheck = await runQuery("SELECT id FROM app_users WHERE LOWER(email) = 'superadmin@jaitra.org'");
    if (superCheck.length === 0) {
      await runQuery(`
        INSERT INTO app_users (name, email, password, role, tower, flat_no, phone)
        VALUES ('Jaitra Super Admin', 'superadmin@jaitra.org', 'admin123', 'Super Admin', 'Tower A', '1204', '+91 98450 71001')
        ON CONFLICT (email) DO UPDATE SET role = 'Super Admin'
      `);
    }

    // Ensure Admin user exists
    const adminCheck = await runQuery("SELECT id FROM app_users WHERE LOWER(email) = 'admin@jaitra.org' OR LOWER(email) = 'admin4u@jaitra.org'");
    if (adminCheck.length === 0) {
      await runQuery(`
        INSERT INTO app_users (name, email, password, role, tower, flat_no, phone)
        VALUES ('Jaitra Admin Officer', 'admin@jaitra.org', 'admin123', 'Admin', 'Tower B', '501', '+91 97411 98765')
        ON CONFLICT (email) DO UPDATE SET role = 'Admin'
      `);
    }

    // Ensure Resident user exists
    const residentCheck = await runQuery("SELECT id FROM app_users WHERE LOWER(email) = 'resident@jaitra.org'");
    if (residentCheck.length === 0) {
      await runQuery(`
        INSERT INTO app_users (name, email, password, role, tower, flat_no, phone)
        VALUES ('Resident Member', 'resident@jaitra.org', 'resident123', 'User', 'Tower C', '302', '+91 98451 22334')
        ON CONFLICT (email) DO UPDATE SET role = 'User'
      `);
    }
  } catch (err) {
    console.error("ensureAppUsersTable error:", err);
  }
}

export async function loginUser(email: string, password: string): Promise<AppUser | null> {
  try {
    await ensureAppUsersTable();
    const rows = await runQuery(
      "SELECT id, name, email, role, tower, flat_no, phone, created_at FROM app_users WHERE LOWER(email) = LOWER($1) AND password = $2",
      [email.trim(), password.trim()]
    );
    return rows[0] || null;
  } catch (err) {
    console.error("loginUser DB error:", err);
    return null;
  }
}

export async function registerUser(data: AppUserRegister): Promise<AppUser> {
  await ensureAppUsersTable();
  const defaultRole = data.role || "User";
  const res = await runQuery(
    `INSERT INTO app_users (name, email, password, role, tower, flat_no, phone)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, name, email, role, tower, flat_no, phone, created_at`,
    [
      data.name.trim(),
      data.email.trim().toLowerCase(),
      data.password.trim(),
      defaultRole,
      data.tower || "Tower A",
      data.flat_no || "",
      data.phone || "",
    ]
  );
  return res[0];
}

export async function getUsers(): Promise<AppUser[]> {
  try {
    await ensureAppUsersTable();
    return await runQuery("SELECT id, name, email, role, tower, flat_no, phone, created_at FROM app_users ORDER BY id ASC");
  } catch (err) {
    console.error("getUsers error:", err);
    return [];
  }
}

export async function updateUserRole(id: number, role: UserRole): Promise<AppUser> {
  const res = await runQuery(
    "UPDATE app_users SET role = $1 WHERE id = $2 RETURNING id, name, email, role, tower, flat_no, phone, created_at",
    [role, id]
  );
  return res[0];
}

export async function deleteUser(id: number): Promise<void> {
  await runQuery("DELETE FROM app_users WHERE id = $1", [id]);
}

// ----------------- VENDOR CONTRACTS & AMENITIES MANAGEMENT -----------------
export async function getVendorContracts(
  category?: string,
  functionalStatus?: string,
  verificationStatus?: string
): Promise<VendorContract[]> {
  try {
    let query = "SELECT * FROM vendor_contracts";
    const conditions: string[] = [];
    const params: any[] = [];
    let i = 1;

    if (category && category !== "All") {
      conditions.push(`category ILIKE $${i++}`);
      params.push(`%${category}%`);
    }
    if (functionalStatus && functionalStatus !== "All") {
      conditions.push(`functional_status = $${i++}`);
      params.push(functionalStatus);
    }
    if (verificationStatus && verificationStatus !== "All") {
      conditions.push(`verification_status = $${i++}`);
      params.push(verificationStatus);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }
    query += " ORDER BY id ASC";

    return await runQuery(query, params);
  } catch (err) {
    console.error("getVendorContracts DB error:", err);
    return [];
  }
}

export async function getVendorContract(id: number): Promise<VendorContract | null> {
  const rows = await runQuery("SELECT * FROM vendor_contracts WHERE id = $1", [id]);
  return rows[0] || null;
}

export async function createVendorContract(data: VendorContractCreate): Promise<VendorContract> {
  const res = await runQuery(
    `INSERT INTO vendor_contracts (
      vendor_name, category, service_type, contact_person, contact_phone, contact_email,
      contract_start_date, contract_end_date, contract_value, functional_status, verification_status,
      rating, feedback_summary, scope_of_work, contract_doc_url, certificate_url, bidding_notes
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
    RETURNING *`,
    [
      data.vendor_name,
      data.category,
      data.service_type,
      data.contact_person || "",
      data.contact_phone || "",
      data.contact_email || "",
      data.contract_start_date || null,
      data.contract_end_date || null,
      data.contract_value || "₹ 0",
      data.functional_status || "Operational",
      data.verification_status || "Verified & Compliant",
      data.rating || 4.5,
      data.feedback_summary || "",
      data.scope_of_work || "",
      data.contract_doc_url || "",
      data.certificate_url || "",
      data.bidding_notes || "",
    ]
  );
  return res[0];
}

export async function updateVendorContract(
  id: number,
  data: Partial<VendorContractCreate>
): Promise<VendorContract> {
  const fields: string[] = [];
  const values: any[] = [];
  let i = 1;

  if (data.vendor_name !== undefined) { fields.push(`vendor_name = $${i++}`); values.push(data.vendor_name); }
  if (data.category !== undefined) { fields.push(`category = $${i++}`); values.push(data.category); }
  if (data.service_type !== undefined) { fields.push(`service_type = $${i++}`); values.push(data.service_type); }
  if (data.contact_person !== undefined) { fields.push(`contact_person = $${i++}`); values.push(data.contact_person); }
  if (data.contact_phone !== undefined) { fields.push(`contact_phone = $${i++}`); values.push(data.contact_phone); }
  if (data.contact_email !== undefined) { fields.push(`contact_email = $${i++}`); values.push(data.contact_email); }
  if (data.contract_start_date !== undefined) { fields.push(`contract_start_date = $${i++}`); values.push(data.contract_start_date || null); }
  if (data.contract_end_date !== undefined) { fields.push(`contract_end_date = $${i++}`); values.push(data.contract_end_date || null); }
  if (data.contract_value !== undefined) { fields.push(`contract_value = $${i++}`); values.push(data.contract_value); }
  if (data.functional_status !== undefined) { fields.push(`functional_status = $${i++}`); values.push(data.functional_status); }
  if (data.verification_status !== undefined) { fields.push(`verification_status = $${i++}`); values.push(data.verification_status); }
  if (data.rating !== undefined) { fields.push(`rating = $${i++}`); values.push(data.rating); }
  if (data.feedback_summary !== undefined) { fields.push(`feedback_summary = $${i++}`); values.push(data.feedback_summary); }
  if (data.scope_of_work !== undefined) { fields.push(`scope_of_work = $${i++}`); values.push(data.scope_of_work); }
  if (data.contract_doc_url !== undefined) { fields.push(`contract_doc_url = $${i++}`); values.push(data.contract_doc_url); }
  if (data.certificate_url !== undefined) { fields.push(`certificate_url = $${i++}`); values.push(data.certificate_url); }
  if (data.bidding_notes !== undefined) { fields.push(`bidding_notes = $${i++}`); values.push(data.bidding_notes); }

  values.push(id);
  const res = await runQuery(
    `UPDATE vendor_contracts SET ${fields.join(", ")} WHERE id = $${i} RETURNING *`,
    values
  );
  return res[0];
}

export async function deleteVendorContract(id: number): Promise<void> {
  await runQuery("DELETE FROM vendor_contracts WHERE id = $1", [id]);
}

// ----------------- AUDIT LOG -----------------

export async function ensureAuditLogTable(): Promise<void> {
  await runQuery(`
    CREATE TABLE IF NOT EXISTS audit_log (
      id SERIAL PRIMARY KEY,
      user_name TEXT NOT NULL DEFAULT '',
      user_role TEXT NOT NULL DEFAULT '',
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id INTEGER,
      entity_label TEXT NOT NULL DEFAULT '',
      details TEXT NOT NULL DEFAULT '',
      ip_address TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

export async function insertAuditLog(entry: {
  user_name?: string;
  user_role?: string;
  action: string;
  entity_type: string;
  entity_id?: number | null;
  entity_label?: string;
  details?: string;
  ip_address?: string;
}): Promise<void> {
  try {
    await ensureAuditLogTable();
    await runQuery(
      `INSERT INTO audit_log (user_name, user_role, action, entity_type, entity_id, entity_label, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        entry.user_name || "",
        entry.user_role || "",
        entry.action,
        entry.entity_type,
        entry.entity_id || null,
        entry.entity_label || "",
        entry.details || "",
        entry.ip_address || "",
      ]
    );
  } catch (err) {
    console.error("Audit log insert failed:", err);
  }
}

export async function getAuditLogs(limit = 200): Promise<any[]> {
  try {
    await ensureAuditLogTable();
    return await runQuery(
      `SELECT * FROM audit_log ORDER BY created_at DESC LIMIT $1`,
      [limit]
    );
  } catch (err) {
    console.error("getAuditLogs error:", err);
    return [];
  }
}


