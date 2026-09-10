from typing import List, Optional
import datetime
import re
from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session, joinedload
from database import engine, get_db, Base
import models

# Re-create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Jaitra Association Portal API",
    description="Backend API for Jaitra Residents Welfare Association (Towers A-F, Events, ADO Tracker)",
    version="3.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------- PYDANTIC SCHEMAS -----------------

# 1. Festival Schemas
class FestivalCollectionBase(BaseModel):
    tower: str
    flat_no: str
    donor_name: str
    amount: float
    payment_mode: Optional[str] = "UPI"
    transaction_ref: Optional[str] = ""
    collected_date: Optional[str] = ""
    receipt_url: Optional[str] = ""
    notes: Optional[str] = ""

class FestivalCollectionCreate(FestivalCollectionBase):
    pass

class FestivalCollectionSchema(FestivalCollectionBase):
    id: int
    festival_id: int
    model_config = ConfigDict(from_attributes=True)


class FestivalExpenseBase(BaseModel):
    title: str
    category: str
    amount: float
    vendor_name: Optional[str] = ""
    bill_date: str
    invoice_url: Optional[str] = ""
    audit_evidence_notes: Optional[str] = ""
    approver_name: str
    approver_role: Optional[str] = "Treasurer"
    approval_status: Optional[str] = "Approved"

class FestivalExpenseCreate(FestivalExpenseBase):
    pass

class FestivalExpenseStatusUpdate(BaseModel):
    approval_status: str
    approver_name: Optional[str] = None

class FestivalExpenseSchema(FestivalExpenseBase):
    id: int
    festival_id: int
    model_config = ConfigDict(from_attributes=True)


class FestivalCelebrationBase(BaseModel):
    festival_name: str
    start_date: str
    end_date: str
    location: str
    description: Optional[str] = ""
    lead_organizer: str
    estimated_budget: Optional[str] = ""
    collected_funds: Optional[str] = ""
    status: Optional[str] = "Planning"
    highlights: Optional[str] = ""

class FestivalCelebrationCreate(FestivalCelebrationBase):
    pass

class FestivalCelebrationSchema(FestivalCelebrationBase):
    id: int
    collections: List[FestivalCollectionSchema] = []
    expenses: List[FestivalExpenseSchema] = []
    model_config = ConfigDict(from_attributes=True)


# 2. Cultural Event Schemas
class CulturalParticipantBase(BaseModel):
    tower: str
    flat_no: str
    participant_name: str
    age_group: Optional[str] = "Adult"
    activity_category: str
    contact_no: Optional[str] = ""
    notes: Optional[str] = ""
    registration_date: Optional[str] = ""

class CulturalParticipantCreate(CulturalParticipantBase):
    pass

class CulturalParticipantSchema(CulturalParticipantBase):
    id: int
    event_id: int
    model_config = ConfigDict(from_attributes=True)


class CulturalAgendaBase(BaseModel):
    slot_time: str
    performer_or_speaker: str
    activity_topic: str
    stage_coordinator: Optional[str] = ""
    duration_mins: Optional[int] = 30

class CulturalAgendaCreate(CulturalAgendaBase):
    pass

class CulturalAgendaSchema(CulturalAgendaBase):
    id: int
    event_id: int
    model_config = ConfigDict(from_attributes=True)


class CulturalEventBase(BaseModel):
    title: str
    category: str
    event_date: str
    time: str
    venue: str
    description: Optional[str] = ""
    coordinator: str
    coordinator_contact: Optional[str] = ""
    status: Optional[str] = "Upcoming"
    registered_count: Optional[int] = 0
    budget: Optional[str] = ""

class CulturalEventCreate(CulturalEventBase):
    pass

class CulturalEventSchema(CulturalEventBase):
    id: int
    participants: List[CulturalParticipantSchema] = []
    agendas: List[CulturalAgendaSchema] = []
    model_config = ConfigDict(from_attributes=True)


# 3. General Body Meeting Schemas
class GeneralBodyMeetingBase(BaseModel):
    meeting_title: str
    meeting_type: str
    meeting_date: str
    time: str
    venue: str
    quorum_status: Optional[str] = "Quorum Met"
    key_agenda: Optional[str] = ""
    resolutions_passed: Optional[str] = ""
    minutes_summary: Optional[str] = ""
    attendees_count: Optional[int] = 0
    doc_link: Optional[str] = ""

class GeneralBodyMeetingCreate(GeneralBodyMeetingBase):
    pass

class GeneralBodyMeetingSchema(GeneralBodyMeetingBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


# 4. Community Issue Schemas (Tower Level)
class CommunityIssueBase(BaseModel):
    issue_code: Optional[str] = None
    tower: str
    flat_no: Optional[str] = ""
    flat_or_location: str
    title: str
    category: str
    reported_by: str
    priority: Optional[str] = "Medium"
    status: Optional[str] = "Open"
    assigned_to: str
    created_at: Optional[str] = None
    description: Optional[str] = ""
    resolution_notes: Optional[str] = ""

class CommunityIssueCreate(CommunityIssueBase):
    pass

class CommunityIssueSchema(CommunityIssueBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


# 5. ADO Task Schemas (with Comments & Evidence Attachments)
class ADOCommentBase(BaseModel):
    author_name: str
    author_role: Optional[str] = "MC Member"
    comment_text: str
    created_at: Optional[str] = None

class ADOCommentCreate(ADOCommentBase):
    pass

class ADOCommentSchema(ADOCommentBase):
    id: int
    task_id: int
    model_config = ConfigDict(from_attributes=True)


class ADOAttachmentBase(BaseModel):
    file_name: str
    file_url: str
    description: Optional[str] = ""
    uploaded_by: str
    created_at: Optional[str] = None

class ADOAttachmentCreate(ADOAttachmentBase):
    pass

class ADOAttachmentSchema(ADOAttachmentBase):
    id: int
    task_id: int
    model_config = ConfigDict(from_attributes=True)


class ADOTaskBase(BaseModel):
    task_code: Optional[str] = None
    title: str
    assigned_to: str
    entity_type: str
    category: str
    status: Optional[str] = "New"
    priority: Optional[str] = "Medium"
    assignee_name: Optional[str] = ""
    due_date: Optional[str] = ""
    sla_days: Optional[int] = 7
    blockers: Optional[str] = ""
    description: Optional[str] = ""
    completion_percentage: Optional[int] = 0
    tags: Optional[str] = ""

class ADOTaskCreate(ADOTaskBase):
    pass

class ADOTaskStatusUpdate(BaseModel):
    status: str
    completion_percentage: Optional[int] = None
    blockers: Optional[str] = None

class ADOTaskSchema(ADOTaskBase):
    id: int
    comments: List[ADOCommentSchema] = []
    attachments: List[ADOAttachmentSchema] = []
    model_config = ConfigDict(from_attributes=True)


# 6. Team Member Schemas
class TeamMemberBase(BaseModel):
    name: str
    role: str
    wing_flat: Optional[str] = ""
    tower: Optional[str] = "Tower A"
    contact: str
    email: Optional[str] = ""
    term: Optional[str] = "2025-2027"
    sub_committee: Optional[str] = ""
    status: Optional[str] = "Active"

class TeamMemberCreate(TeamMemberBase):
    pass

class TeamMemberSchema(TeamMemberBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


# ----------------- STATS / OVERVIEW -----------------

@app.get("/api/stats")
def get_society_stats(db: Session = Depends(get_db)):
    events_count = db.query(models.CulturalEventModel).count()
    festivals_count = db.query(models.FestivalCelebrationModel).count()
    meetings_count = db.query(models.GeneralBodyMeetingModel).count()
    issues = db.query(models.CommunityIssueModel).all()
    tasks = db.query(models.ADOTaskModel).all()
    team_count = db.query(models.TeamMemberModel).count()

    builder_tasks = [t for t in tasks if t.assigned_to == "Builder" or t.entity_type == "Builder"]
    igs_tasks = [t for t in tasks if t.assigned_to == "IGS" or t.entity_type == "IGS"]
    open_issues = [i for i in issues if i.status in ["Open", "In Progress", "Under Inspection"]]

    # Tower breakdown for issues
    towers = ["Tower A", "Tower B", "Tower C", "Tower D", "Tower E", "Tower F", "Clubhouse", "Common Space"]
    tower_issue_counts = {t: len([i for i in issues if i.tower == t]) for t in towers}

    return {
        "cultural_events_count": events_count,
        "festivals_count": festivals_count,
        "meetings_count": meetings_count,
        "total_issues": len(issues),
        "open_issues_count": len(open_issues),
        "total_ado_tasks": len(tasks),
        "builder_tasks_count": len(builder_tasks),
        "igs_tasks_count": len(igs_tasks),
        "active_ado_tasks": len([t for t in tasks if t.status in ["New", "Active"]]),
        "resolved_ado_tasks": len([t for t in tasks if t.status in ["Resolved", "Closed"]]),
        "team_members_count": team_count,
        "tower_issue_counts": tower_issue_counts,
        "society_name": "Jaitra Residents Welfare Association",
        "total_towers": 6
    }


# ----------------- 1. FESTIVALS & FINANCIAL AUDIT ROUTES -----------------

@app.get("/api/festivals", response_model=List[FestivalCelebrationSchema])
def get_festivals(status: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(models.FestivalCelebrationModel).options(
        joinedload(models.FestivalCelebrationModel.collections),
        joinedload(models.FestivalCelebrationModel.expenses)
    )
    if status and status != "All":
        query = query.filter(models.FestivalCelebrationModel.status == status)
    return query.order_by(models.FestivalCelebrationModel.id.desc()).all()

@app.get("/api/festivals/{fest_id}", response_model=FestivalCelebrationSchema)
def get_festival(fest_id: int, db: Session = Depends(get_db)):
    db_fest = db.query(models.FestivalCelebrationModel).options(
        joinedload(models.FestivalCelebrationModel.collections),
        joinedload(models.FestivalCelebrationModel.expenses)
    ).filter(models.FestivalCelebrationModel.id == fest_id).first()
    if not db_fest:
        raise HTTPException(status_code=404, detail="Festival not found")
    return db_fest

@app.post("/api/festivals", response_model=FestivalCelebrationSchema)
def create_festival(fest: FestivalCelebrationCreate, db: Session = Depends(get_db)):
    new_fest = models.FestivalCelebrationModel(**fest.model_dump())
    db.add(new_fest)
    db.commit()
    db.refresh(new_fest)
    return new_fest

@app.put("/api/festivals/{fest_id}", response_model=FestivalCelebrationSchema)
def update_festival(fest_id: int, fest: FestivalCelebrationCreate, db: Session = Depends(get_db)):
    db_fest = db.query(models.FestivalCelebrationModel).filter(models.FestivalCelebrationModel.id == fest_id).first()
    if not db_fest:
        raise HTTPException(status_code=404, detail="Festival not found")
    for key, value in fest.model_dump().items():
        if value is not None:
            setattr(db_fest, key, value)
    db.commit()
    db.refresh(db_fest)
    return db_fest

@app.delete("/api/festivals/{fest_id}")
def delete_festival(fest_id: int, db: Session = Depends(get_db)):
    db_fest = db.query(models.FestivalCelebrationModel).filter(models.FestivalCelebrationModel.id == fest_id).first()
    if not db_fest:
        raise HTTPException(status_code=404, detail="Festival not found")
    db.delete(db_fest)
    db.commit()
    return {"message": "Festival deleted successfully"}

# Collections
@app.post("/api/festivals/{fest_id}/collections", response_model=FestivalCollectionSchema)
def add_festival_collection(fest_id: int, coll: FestivalCollectionCreate, db: Session = Depends(get_db)):
    db_fest = db.query(models.FestivalCelebrationModel).filter(models.FestivalCelebrationModel.id == fest_id).first()
    if not db_fest:
        raise HTTPException(status_code=404, detail="Festival not found")
    data = coll.model_dump()
    if not data.get("collected_date"):
        data["collected_date"] = datetime.date.today().isoformat()
    new_coll = models.FestivalCollectionModel(festival_id=fest_id, **data)
    db.add(new_coll)
    db.commit()
    db.refresh(new_coll)
    return new_coll

@app.delete("/api/festivals/collections/{collection_id}")
def delete_festival_collection(collection_id: int, db: Session = Depends(get_db)):
    db_coll = db.query(models.FestivalCollectionModel).filter(models.FestivalCollectionModel.id == collection_id).first()
    if not db_coll:
        raise HTTPException(status_code=404, detail="Collection entry not found")
    db.delete(db_coll)
    db.commit()
    return {"message": "Collection record deleted"}

# Expenses
@app.post("/api/festivals/{fest_id}/expenses", response_model=FestivalExpenseSchema)
def add_festival_expense(fest_id: int, exp: FestivalExpenseCreate, db: Session = Depends(get_db)):
    db_fest = db.query(models.FestivalCelebrationModel).filter(models.FestivalCelebrationModel.id == fest_id).first()
    if not db_fest:
        raise HTTPException(status_code=404, detail="Festival not found")
    data = exp.model_dump()
    new_exp = models.FestivalExpenseModel(festival_id=fest_id, **data)
    db.add(new_exp)
    db.commit()
    db.refresh(new_exp)
    return new_exp

@app.patch("/api/festivals/expenses/{expense_id}/status", response_model=FestivalExpenseSchema)
def update_expense_approval_status(expense_id: int, status_update: FestivalExpenseStatusUpdate, db: Session = Depends(get_db)):
    db_exp = db.query(models.FestivalExpenseModel).filter(models.FestivalExpenseModel.id == expense_id).first()
    if not db_exp:
        raise HTTPException(status_code=404, detail="Expense entry not found")
    db_exp.approval_status = status_update.approval_status
    if status_update.approver_name:
        db_exp.approver_name = status_update.approver_name
    db.commit()
    db.refresh(db_exp)
    return db_exp

@app.delete("/api/festivals/expenses/{expense_id}")
def delete_festival_expense(expense_id: int, db: Session = Depends(get_db)):
    db_exp = db.query(models.FestivalExpenseModel).filter(models.FestivalExpenseModel.id == expense_id).first()
    if not db_exp:
        raise HTTPException(status_code=404, detail="Expense entry not found")
    db.delete(db_exp)
    db.commit()
    return {"message": "Expense record deleted"}


# ----------------- 2. CULTURAL EVENTS, PARTICIPANTS & AGENDAS -----------------

@app.get("/api/cultural-events", response_model=List[CulturalEventSchema])
def get_cultural_events(
    status: Optional[str] = None,
    category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.CulturalEventModel).options(
        joinedload(models.CulturalEventModel.participants),
        joinedload(models.CulturalEventModel.agendas)
    )
    if status and status != "All":
        query = query.filter(models.CulturalEventModel.status == status)
    if category and category != "All":
        query = query.filter(models.CulturalEventModel.category == category)
    return query.order_by(models.CulturalEventModel.id.desc()).all()

@app.get("/api/cultural-events/{event_id}", response_model=CulturalEventSchema)
def get_cultural_event(event_id: int, db: Session = Depends(get_db)):
    db_event = db.query(models.CulturalEventModel).options(
        joinedload(models.CulturalEventModel.participants),
        joinedload(models.CulturalEventModel.agendas)
    ).filter(models.CulturalEventModel.id == event_id).first()
    if not db_event:
        raise HTTPException(status_code=404, detail="Event not found")
    return db_event

@app.post("/api/cultural-events", response_model=CulturalEventSchema)
def create_cultural_event(event: CulturalEventCreate, db: Session = Depends(get_db)):
    new_event = models.CulturalEventModel(**event.model_dump())
    db.add(new_event)
    db.commit()
    db.refresh(new_event)
    return new_event

@app.put("/api/cultural-events/{event_id}", response_model=CulturalEventSchema)
def update_cultural_event(event_id: int, event: CulturalEventCreate, db: Session = Depends(get_db)):
    db_event = db.query(models.CulturalEventModel).filter(models.CulturalEventModel.id == event_id).first()
    if not db_event:
        raise HTTPException(status_code=404, detail="Event not found")
    for key, value in event.model_dump().items():
        if value is not None:
            setattr(db_event, key, value)
    db.commit()
    db.refresh(db_event)
    return db_event

@app.delete("/api/cultural-events/{event_id}")
def delete_cultural_event(event_id: int, db: Session = Depends(get_db)):
    db_event = db.query(models.CulturalEventModel).filter(models.CulturalEventModel.id == event_id).first()
    if not db_event:
        raise HTTPException(status_code=404, detail="Event not found")
    db.delete(db_event)
    db.commit()
    return {"message": "Event deleted successfully"}

# Participants
@app.post("/api/cultural-events/{event_id}/participants", response_model=CulturalParticipantSchema)
def add_participant(event_id: int, part: CulturalParticipantCreate, db: Session = Depends(get_db)):
    db_event = db.query(models.CulturalEventModel).filter(models.CulturalEventModel.id == event_id).first()
    if not db_event:
        raise HTTPException(status_code=404, detail="Cultural event not found")
    data = part.model_dump()
    if not data.get("registration_date"):
        data["registration_date"] = datetime.date.today().isoformat()
    new_part = models.CulturalParticipantModel(event_id=event_id, **data)
    db.add(new_part)
    db_event.registered_count = (db_event.registered_count or 0) + 1
    db.commit()
    db.refresh(new_part)
    return new_part

@app.delete("/api/cultural-events/participants/{participant_id}")
def delete_participant(participant_id: int, db: Session = Depends(get_db)):
    db_part = db.query(models.CulturalParticipantModel).filter(models.CulturalParticipantModel.id == participant_id).first()
    if not db_part:
        raise HTTPException(status_code=404, detail="Participant not found")
    db_event = db.query(models.CulturalEventModel).filter(models.CulturalEventModel.id == db_part.event_id).first()
    if db_event and db_event.registered_count > 0:
        db_event.registered_count -= 1
    db.delete(db_part)
    db.commit()
    return {"message": "Participant deleted"}

# Agendas
@app.post("/api/cultural-events/{event_id}/agendas", response_model=CulturalAgendaSchema)
def add_agenda_item(event_id: int, agenda: CulturalAgendaCreate, db: Session = Depends(get_db)):
    db_event = db.query(models.CulturalEventModel).filter(models.CulturalEventModel.id == event_id).first()
    if not db_event:
        raise HTTPException(status_code=404, detail="Cultural event not found")
    new_ag = models.CulturalAgendaModel(event_id=event_id, **agenda.model_dump())
    db.add(new_ag)
    db.commit()
    db.refresh(new_ag)
    return new_ag

@app.delete("/api/cultural-events/agendas/{agenda_id}")
def delete_agenda_item(agenda_id: int, db: Session = Depends(get_db)):
    db_ag = db.query(models.CulturalAgendaModel).filter(models.CulturalAgendaModel.id == agenda_id).first()
    if not db_ag:
        raise HTTPException(status_code=404, detail="Agenda item not found")
    db.delete(db_ag)
    db.commit()
    return {"message": "Agenda item deleted"}


# ----------------- 3. GENERAL BODY MEETINGS -----------------

@app.get("/api/meetings", response_model=List[GeneralBodyMeetingSchema])
def get_meetings(meeting_type: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(models.GeneralBodyMeetingModel)
    if meeting_type and meeting_type != "All":
        query = query.filter(models.GeneralBodyMeetingModel.meeting_type == meeting_type)
    return query.order_by(models.GeneralBodyMeetingModel.id.desc()).all()

@app.get("/api/meetings/{meeting_id}", response_model=GeneralBodyMeetingSchema)
def get_meeting(meeting_id: int, db: Session = Depends(get_db)):
    db_m = db.query(models.GeneralBodyMeetingModel).filter(models.GeneralBodyMeetingModel.id == meeting_id).first()
    if not db_m:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return db_m

@app.post("/api/meetings", response_model=GeneralBodyMeetingSchema)
def create_meeting(meeting: GeneralBodyMeetingCreate, db: Session = Depends(get_db)):
    new_meeting = models.GeneralBodyMeetingModel(**meeting.model_dump())
    db.add(new_meeting)
    db.commit()
    db.refresh(new_meeting)
    return new_meeting

@app.put("/api/meetings/{meeting_id}", response_model=GeneralBodyMeetingSchema)
def update_meeting(meeting_id: int, meeting: GeneralBodyMeetingCreate, db: Session = Depends(get_db)):
    db_meeting = db.query(models.GeneralBodyMeetingModel).filter(models.GeneralBodyMeetingModel.id == meeting_id).first()
    if not db_meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    for key, value in meeting.model_dump().items():
        if value is not None:
            setattr(db_meeting, key, value)
    db.commit()
    db.refresh(db_meeting)
    return db_meeting

@app.delete("/api/meetings/{meeting_id}")
def delete_meeting(meeting_id: int, db: Session = Depends(get_db)):
    db_meeting = db.query(models.GeneralBodyMeetingModel).filter(models.GeneralBodyMeetingModel.id == meeting_id).first()
    if not db_meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    db.delete(db_meeting)
    db.commit()
    return {"message": "Meeting record deleted successfully"}


# ----------------- 4. COMMUNITY ISSUES (TOWER LEVEL A-F, CH, CS) -----------------

@app.get("/api/issues", response_model=List[CommunityIssueSchema])
def get_issues(
    tower: Optional[str] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.CommunityIssueModel)
    if tower and tower != "All":
        query = query.filter(models.CommunityIssueModel.tower == tower)
    if status and status != "All":
        query = query.filter(models.CommunityIssueModel.status == status)
    if priority and priority != "All":
        query = query.filter(models.CommunityIssueModel.priority == priority)
    if category and category != "All":
        query = query.filter(models.CommunityIssueModel.category == category)
    return query.order_by(models.CommunityIssueModel.id.desc()).all()

@app.post("/api/issues", response_model=CommunityIssueSchema)
def create_issue(issue: CommunityIssueCreate, db: Session = Depends(get_db)):
    data = issue.model_dump()
    if not data.get("issue_code") or str(data.get("issue_code")).strip() == "":
        tower_prefix = "TWA"
        base_num = 100
        tower = data.get("tower", "") or ""
        if "Tower B" in tower: tower_prefix = "TWB"; base_num = 200
        elif "Tower C" in tower: tower_prefix = "TWC"; base_num = 300
        elif "Tower D" in tower: tower_prefix = "TWD"; base_num = 400
        elif "Tower E" in tower: tower_prefix = "TWE"; base_num = 500
        elif "Tower F" in tower: tower_prefix = "TWF"; base_num = 600
        elif "Clubhouse" in tower: tower_prefix = "CH"; base_num = 700
        elif "Common" in tower: tower_prefix = "CS"; base_num = 800
        
        existing_issues = db.query(models.CommunityIssueModel.issue_code).all()
        existing_codes = {i[0].strip() for i in existing_issues if i[0]}
        max_num = base_num
        for code in existing_codes:
            m = re.match(rf"^ISS-{tower_prefix}-(\d+)$", code, re.IGNORECASE)
            if m:
                num = int(m.group(1))
                if num > max_num:
                    max_num = num
        candidate = f"ISS-{tower_prefix}-{max_num + 1}"
        next_num = max_num + 1
        while candidate in existing_codes:
            next_num += 1
            candidate = f"ISS-{tower_prefix}-{next_num}"
        data["issue_code"] = candidate
    if not data.get("created_at"):
        data["created_at"] = datetime.date.today().isoformat()
    new_issue = models.CommunityIssueModel(**data)
    db.add(new_issue)
    db.commit()
    db.refresh(new_issue)
    return new_issue

@app.put("/api/issues/{issue_id}", response_model=CommunityIssueSchema)
def update_issue(issue_id: int, issue: CommunityIssueCreate, db: Session = Depends(get_db)):
    db_issue = db.query(models.CommunityIssueModel).filter(models.CommunityIssueModel.id == issue_id).first()
    if not db_issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    for key, value in issue.model_dump().items():
        if key in ["issue_code", "created_at"] and (value is None or value == ""):
            continue
        if value is not None:
            setattr(db_issue, key, value)
    db.commit()
    db.refresh(db_issue)
    return db_issue

@app.delete("/api/issues/{issue_id}")
def delete_issue(issue_id: int, db: Session = Depends(get_db)):
    db_issue = db.query(models.CommunityIssueModel).filter(models.CommunityIssueModel.id == issue_id).first()
    if not db_issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    db.delete(db_issue)
    db.commit()
    return {"message": "Issue deleted successfully"}


# ----------------- 5. ADO TASKS, COMMENTS & ATTACHMENTS (BUILDER & IGS) -----------------

@app.get("/api/tasks", response_model=List[ADOTaskSchema])
def get_ado_tasks(
    assigned_to: Optional[str] = None,
    entity_type: Optional[str] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.ADOTaskModel).options(
        joinedload(models.ADOTaskModel.comments),
        joinedload(models.ADOTaskModel.attachments)
    )
    if assigned_to and assigned_to != "All":
        query = query.filter(models.ADOTaskModel.assigned_to == assigned_to)
    if entity_type and entity_type != "All":
        query = query.filter(models.ADOTaskModel.entity_type == entity_type)
    if status and status != "All":
        query = query.filter(models.ADOTaskModel.status == status)
    if priority and priority != "All":
        query = query.filter(models.ADOTaskModel.priority == priority)
    return query.order_by(models.ADOTaskModel.id.asc()).all()

@app.get("/api/tasks/{task_id}", response_model=ADOTaskSchema)
def get_ado_task(task_id: int, db: Session = Depends(get_db)):
    db_task = db.query(models.ADOTaskModel).options(
        joinedload(models.ADOTaskModel.comments),
        joinedload(models.ADOTaskModel.attachments)
    ).filter(models.ADOTaskModel.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    return db_task

@app.post("/api/tasks", response_model=ADOTaskSchema)
def create_ado_task(task: ADOTaskCreate, db: Session = Depends(get_db)):
    data = task.model_dump()
    if not data.get("task_code") or str(data.get("task_code")).strip() == "":
        existing_tasks = db.query(models.ADOTaskModel.task_code).all()
        existing_codes = {t[0].strip() for t in existing_tasks if t[0]}
        max_num = 100
        for code in existing_codes:
            m = re.search(r"(\d+)$", code)
            if m:
                num = int(m.group(1))
                if num > max_num:
                    max_num = num
        candidate = f"ADO-{max_num + 1}"
        next_num = max_num + 1
        while candidate in existing_codes:
            next_num += 1
            candidate = f"ADO-{next_num}"
        data["task_code"] = candidate
    new_task = models.ADOTaskModel(**data)
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return new_task

@app.put("/api/tasks/{task_id}", response_model=ADOTaskSchema)
def update_ado_task(task_id: int, task: ADOTaskCreate, db: Session = Depends(get_db)):
    db_task = db.query(models.ADOTaskModel).filter(models.ADOTaskModel.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    for key, value in task.model_dump().items():
        if key == "task_code" and (value is None or value == ""):
            continue
        if value is not None:
            setattr(db_task, key, value)
    db.commit()
    db.refresh(db_task)
    return db_task

@app.patch("/api/tasks/{task_id}/status", response_model=ADOTaskSchema)
def update_task_status(task_id: int, update_data: ADOTaskStatusUpdate, db: Session = Depends(get_db)):
    db_task = db.query(models.ADOTaskModel).filter(models.ADOTaskModel.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    db_task.status = update_data.status
    if update_data.completion_percentage is not None:
        db_task.completion_percentage = update_data.completion_percentage
    elif update_data.status in ["Resolved", "Closed"]:
        db_task.completion_percentage = 100
    elif update_data.status == "New":
        db_task.completion_percentage = 0
    if update_data.blockers is not None:
        db_task.blockers = update_data.blockers
    db.commit()
    db.refresh(db_task)
    return db_task

@app.delete("/api/tasks/{task_id}")
def delete_ado_task(task_id: int, db: Session = Depends(get_db)):
    db_task = db.query(models.ADOTaskModel).filter(models.ADOTaskModel.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(db_task)
    db.commit()
    return {"message": "ADO task deleted"}

# Comments / Discussions
@app.post("/api/tasks/{task_id}/comments", response_model=ADOCommentSchema)
def add_task_comment(task_id: int, comment: ADOCommentCreate, db: Session = Depends(get_db)):
    db_task = db.query(models.ADOTaskModel).filter(models.ADOTaskModel.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    data = comment.model_dump()
    if not data.get("created_at"):
        data["created_at"] = datetime.datetime.now().strftime("%Y-%m-%d %I:%M %p")
    new_comment = models.ADOCommentModel(task_id=task_id, **data)
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)
    return new_comment

# Attachments / Evidence Proofs
@app.post("/api/tasks/{task_id}/attachments", response_model=ADOAttachmentSchema)
def add_task_attachment(task_id: int, att: ADOAttachmentCreate, db: Session = Depends(get_db)):
    db_task = db.query(models.ADOTaskModel).filter(models.ADOTaskModel.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    data = att.model_dump()
    if not data.get("created_at"):
        data["created_at"] = datetime.date.today().isoformat()
    new_att = models.ADOAttachmentModel(task_id=task_id, **data)
    db.add(new_att)
    db.commit()
    db.refresh(new_att)
    return new_att

@app.delete("/api/tasks/attachments/{attachment_id}")
def delete_task_attachment(attachment_id: int, db: Session = Depends(get_db)):
    db_att = db.query(models.ADOAttachmentModel).filter(models.ADOAttachmentModel.id == attachment_id).first()
    if not db_att:
        raise HTTPException(status_code=404, detail="Attachment not found")
    db.delete(db_att)
    db.commit()
    return {"message": "Attachment deleted"}


# ----------------- 6. TEAM MEMBERS -----------------

@app.get("/api/team", response_model=List[TeamMemberSchema])
def get_team(status: Optional[str] = None, tower: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(models.TeamMemberModel)
    if status and status != "All":
        query = query.filter(models.TeamMemberModel.status == status)
    if tower and tower != "All":
        query = query.filter(models.TeamMemberModel.tower == tower)
    return query.order_by(models.TeamMemberModel.id.asc()).all()

@app.post("/api/team", response_model=TeamMemberSchema)
def add_team_member(member: TeamMemberCreate, db: Session = Depends(get_db)):
    new_member = models.TeamMemberModel(**member.model_dump())
    db.add(new_member)
    db.commit()
    db.refresh(new_member)
    return new_member

@app.put("/api/team/{member_id}", response_model=TeamMemberSchema)
def update_team_member(member_id: int, member: TeamMemberCreate, db: Session = Depends(get_db)):
    db_member = db.query(models.TeamMemberModel).filter(models.TeamMemberModel.id == member_id).first()
    if not db_member:
        raise HTTPException(status_code=404, detail="Team member not found")
    for key, value in member.model_dump().items():
        if value is not None:
            setattr(db_member, key, value)
    db.commit()
    db.refresh(db_member)
    return db_member

@app.delete("/api/team/{member_id}")
def delete_team_member(member_id: int, db: Session = Depends(get_db)):
    db_member = db.query(models.TeamMemberModel).filter(models.TeamMemberModel.id == member_id).first()
    if not db_member:
        raise HTTPException(status_code=404, detail="Team member not found")
    db.delete(db_member)
    db.commit()
    return {"message": "Team member deleted"}


# ----------------- 7. DISTRIBUTION LISTS (DL GROUPS) & MEMBERS & NOTIFICATIONS -----------------

class DLMemberBase(BaseModel):
    name: str
    tower: Optional[str] = "Tower A"
    flat_no: Optional[str] = ""
    email: str
    phone: str
    status: Optional[str] = "Active"
    role_tag: Optional[str] = "Owner"
    notes: Optional[str] = ""

class DLMemberCreate(DLMemberBase):
    pass

class DLMemberSchema(DLMemberBase):
    id: int
    group_id: int
    created_at: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class DLGroupBase(BaseModel):
    group_name: str
    group_code: Optional[str] = ""
    description: Optional[str] = ""
    category: Optional[str] = "General"
    sender_email: Optional[str] = "jaitra-association-hyd@googlegroups.com"
    is_system: Optional[int] = 0

class DLGroupCreate(DLGroupBase):
    pass

class DLGroupSchema(DLGroupBase):
    id: int
    total_members: Optional[int] = 0
    active_members: Optional[int] = 0
    inactive_members: Optional[int] = 0
    created_at: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class BroadcastNotificationCreate(BaseModel):
    subject: str
    category: Optional[str] = "General Notice"
    channel: Optional[str] = "Email"
    sender_email: Optional[str] = "jaitra-association-hyd@googlegroups.com"
    sender_name: Optional[str] = "Jaitra Residents Welfare Association"
    group_ids: Optional[str] = ""
    group_names: Optional[str] = ""
    target_tower: Optional[str] = "All"
    active_recipients_count: Optional[int] = 0
    total_target_count: Optional[int] = 0
    message_body: str
    event_or_meeting_ref: Optional[str] = ""
    doc_link: Optional[str] = ""
    sent_by: Optional[str] = "Admin"
    status: Optional[str] = "Dispatched"

class BroadcastNotificationSchema(BroadcastNotificationCreate):
    id: int
    sent_at: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class BulkStatusUpdate(BaseModel):
    memberIds: List[int]
    status: str

class BulkDeleteRequest(BaseModel):
    memberIds: List[int]

class RecipientsQuery(BaseModel):
    groupIds: List[int]
    tower: Optional[str] = "All"


@app.get("/api/dl-groups", response_model=List[DLGroupSchema])
def get_dl_groups(category: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(models.DLGroupModel)
    if category and category != "All":
        query = query.filter(models.DLGroupModel.category == category)
    groups = query.order_by(models.DLGroupModel.id.asc()).all()
    results = []
    for g in groups:
        total = db.query(models.DLMemberModel).filter(models.DLMemberModel.group_id == g.id).count()
        active = db.query(models.DLMemberModel).filter(models.DLMemberModel.group_id == g.id, models.DLMemberModel.status == "Active").count()
        inactive = total - active
        results.append(DLGroupSchema(
            id=g.id,
            group_name=g.group_name,
            group_code=g.group_code,
            description=g.description,
            category=g.category,
            sender_email=g.sender_email,
            is_system=g.is_system,
            total_members=total,
            active_members=active,
            inactive_members=inactive,
            created_at=str(g.created_at) if g.created_at else None
        ))
    return results

@app.post("/api/dl-groups", response_model=DLGroupSchema)
def create_dl_group(group: DLGroupCreate, db: Session = Depends(get_db)):
    code = group.group_code.strip().upper() if group.group_code else f"DL-{datetime.datetime.now().strftime('%M%S')}"
    new_g = models.DLGroupModel(
        group_name=group.group_name.strip(),
        group_code=code,
        description=group.description or "",
        category=group.category or "General",
        sender_email=group.sender_email or "jaitra-association-hyd@googlegroups.com",
        is_system=group.is_system or 0,
        created_at=datetime.datetime.now().isoformat()
    )
    db.add(new_g)
    db.commit()
    db.refresh(new_g)
    return DLGroupSchema(
        id=new_g.id,
        group_name=new_g.group_name,
        group_code=new_g.group_code,
        description=new_g.description,
        category=new_g.category,
        sender_email=new_g.sender_email,
        is_system=new_g.is_system,
        total_members=0,
        active_members=0,
        inactive_members=0,
        created_at=new_g.created_at
    )

@app.get("/api/dl-members", response_model=List[DLMemberSchema])
def get_dl_members(
    groupId: Optional[int] = None,
    status: Optional[str] = None,
    tower: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.DLMemberModel)
    if groupId:
        query = query.filter(models.DLMemberModel.group_id == groupId)
    if status and status != "All":
        query = query.filter(models.DLMemberModel.status == status)
    if tower and tower != "All":
        query = query.filter(models.DLMemberModel.tower == tower)
    if search:
        query = query.filter(
            models.DLMemberModel.name.ilike(f"%{search}%") |
            models.DLMemberModel.email.ilike(f"%{search}%") |
            models.DLMemberModel.phone.ilike(f"%{search}%") |
            models.DLMemberModel.flat_no.ilike(f"%{search}%")
        )
    return query.order_by(models.DLMemberModel.tower.asc(), models.DLMemberModel.flat_no.asc()).all()

@app.post("/api/dl-members", response_model=DLMemberSchema)
def create_dl_member(member: DLMemberCreate, group_id: int = Query(...), db: Session = Depends(get_db)):
    new_m = models.DLMemberModel(
        group_id=group_id,
        name=member.name.strip(),
        tower=member.tower or "Tower A",
        flat_no=member.flat_no.strip() if member.flat_no else "",
        email=member.email.strip().lower(),
        phone=member.phone.strip() if member.phone else "",
        status=member.status or "Active",
        role_tag=member.role_tag or "Owner",
        notes=member.notes or "",
        created_at=datetime.datetime.now().isoformat()
    )
    db.add(new_m)
    db.commit()
    db.refresh(new_m)
    return new_m

@app.post("/api/notifications/broadcast", response_model=dict)
def broadcast_notification(payload: BroadcastNotificationCreate, db: Session = Depends(get_db)):
    new_notif = models.BroadcastNotificationModel(
        subject=payload.subject,
        category=payload.category,
        channel=payload.channel,
        sender_email=payload.sender_email,
        sender_name=payload.sender_name,
        group_ids=payload.group_ids,
        group_names=payload.group_names,
        target_tower=payload.target_tower,
        active_recipients_count=payload.active_recipients_count,
        total_target_count=payload.total_target_count,
        message_body=payload.message_body,
        event_or_meeting_ref=payload.event_or_meeting_ref,
        doc_link=payload.doc_link,
        sent_by=payload.sent_by,
        status="Dispatched",
        sent_at=datetime.datetime.now().isoformat()
    )
    db.add(new_notif)
    db.commit()
    db.refresh(new_notif)
    return {
        "success": True,
        "message": f"Broadcast '{payload.subject}' logged successfully",
        "notification_id": new_notif.id
    }

@app.get("/api/notifications/history", response_model=List[BroadcastNotificationSchema])
def get_broadcast_history(limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.BroadcastNotificationModel).order_by(models.BroadcastNotificationModel.id.desc()).limit(limit).all()

