from database import Base
from sqlalchemy import Column, Integer, String, Text, ForeignKey, Float
from sqlalchemy.orm import relationship

# 1. Festival Celebrations & Audit Expense / Collection Models
class FestivalCelebrationModel(Base):
    __tablename__ = "festival_celebrations"
    id = Column(Integer, primary_key=True, index=True)
    festival_name = Column(String(200), nullable=False)
    start_date = Column(String(50), nullable=False)
    end_date = Column(String(50), nullable=False)
    location = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    lead_organizer = Column(String(100), nullable=False)
    estimated_budget = Column(String(50), nullable=True)
    collected_funds = Column(String(50), nullable=True)
    status = Column(String(50), default="Planning")
    highlights = Column(Text, nullable=True)

    collections = relationship("FestivalCollectionModel", back_populates="festival", cascade="all, delete-orphan")
    expenses = relationship("FestivalExpenseModel", back_populates="festival", cascade="all, delete-orphan")

class FestivalCollectionModel(Base):
    __tablename__ = "festival_collections"
    id = Column(Integer, primary_key=True, index=True)
    festival_id = Column(Integer, ForeignKey("festival_celebrations.id", ondelete="CASCADE"), nullable=False)
    tower = Column(String(50), nullable=False)  # Tower A, Tower B, etc.
    flat_no = Column(String(50), nullable=False)
    donor_name = Column(String(100), nullable=False)
    amount = Column(Float, nullable=False, default=0.0)
    payment_mode = Column(String(50), default="UPI")  # UPI, NetBanking, Cash, Cheque
    transaction_ref = Column(String(100), nullable=True)
    collected_date = Column(String(50), nullable=False)
    receipt_url = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)

    festival = relationship("FestivalCelebrationModel", back_populates="collections")

class FestivalExpenseModel(Base):
    __tablename__ = "festival_expenses"
    id = Column(Integer, primary_key=True, index=True)
    festival_id = Column(Integer, ForeignKey("festival_celebrations.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(200), nullable=False)
    category = Column(String(100), nullable=False)  # Decor, Pooja, Sound & Light, Food/Prasadam, Security, Priest Dakshina, Gifts
    amount = Column(Float, nullable=False, default=0.0)
    vendor_name = Column(String(150), nullable=True)
    bill_date = Column(String(50), nullable=False)
    invoice_url = Column(String(255), nullable=True)  # Evidence attachment
    audit_evidence_notes = Column(Text, nullable=True)
    approver_name = Column(String(100), nullable=False)  # e.g., Vikram Patel (Treasurer)
    approver_role = Column(String(100), default="Treasurer")
    approval_status = Column(String(50), default="Approved")  # Approved, Pending, Rejected

    festival = relationship("FestivalCelebrationModel", back_populates="expenses")


# 2. Cultural Events, Participants & Agenda Models
class CulturalEventModel(Base):
    __tablename__ = "cultural_events"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    category = Column(String(100), nullable=False)
    event_date = Column(String(50), nullable=False)
    time = Column(String(50), nullable=False)
    venue = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    coordinator = Column(String(100), nullable=False)
    coordinator_contact = Column(String(100), nullable=True)
    status = Column(String(50), default="Upcoming")
    registered_count = Column(Integer, default=0)
    budget = Column(String(50), nullable=True)

    participants = relationship("CulturalParticipantModel", back_populates="event", cascade="all, delete-orphan")
    agendas = relationship("CulturalAgendaModel", back_populates="event", cascade="all, delete-orphan")

class CulturalParticipantModel(Base):
    __tablename__ = "cultural_participants"
    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("cultural_events.id", ondelete="CASCADE"), nullable=False)
    tower = Column(String(50), nullable=False)  # Tower A, Tower B, etc.
    flat_no = Column(String(50), nullable=False)
    participant_name = Column(String(100), nullable=False)
    age_group = Column(String(50), default="Adult")  # Junior (<14), Youth (14-25), Adult (25-50), Senior (50+)
    activity_category = Column(String(100), nullable=False)  # Singing, Solo Dance, Group Dance, Games / Sports, Kids Workshop, Drama, Speaker / Debate
    contact_no = Column(String(50), nullable=True)
    notes = Column(Text, nullable=True)
    registration_date = Column(String(50), nullable=False)

    event = relationship("CulturalEventModel", back_populates="participants")

class CulturalAgendaModel(Base):
    __tablename__ = "cultural_agendas"
    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("cultural_events.id", ondelete="CASCADE"), nullable=False)
    slot_time = Column(String(50), nullable=False)  # e.g. 06:00 PM - 06:30 PM
    performer_or_speaker = Column(String(150), nullable=False)
    activity_topic = Column(String(200), nullable=False)
    stage_coordinator = Column(String(100), nullable=True)
    duration_mins = Column(Integer, default=30)

    event = relationship("CulturalEventModel", back_populates="agendas")


# 3. General Body Meetings (GBMs)
class GeneralBodyMeetingModel(Base):
    __tablename__ = "gbm_meetings"
    id = Column(Integer, primary_key=True, index=True)
    meeting_title = Column(String(200), nullable=False)
    meeting_type = Column(String(100), nullable=False)
    meeting_date = Column(String(50), nullable=False)
    time = Column(String(50), nullable=False)
    venue = Column(String(150), nullable=False)
    quorum_status = Column(String(50), default="Quorum Met")
    key_agenda = Column(Text, nullable=True)
    resolutions_passed = Column(Text, nullable=True)
    minutes_summary = Column(Text, nullable=True)
    attendees_count = Column(Integer, default=0)
    doc_link = Column(String(255), nullable=True)


# 4. Community Issues Tracker (Tower-level Tagged)
class CommunityIssueModel(Base):
    __tablename__ = "community_issues"
    id = Column(Integer, primary_key=True, index=True)
    issue_code = Column(String(50), unique=True, index=True)
    tower = Column(String(50), nullable=False, default="Tower A")  # Tower A, Tower B, Tower C, Tower D, Tower E, Tower F, Clubhouse, Common Space
    flat_no = Column(String(50), nullable=True)
    flat_or_location = Column(String(150), nullable=False)
    title = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False)
    reported_by = Column(String(100), nullable=False)
    priority = Column(String(50), default="Medium")  # Critical, High, Medium, Low
    status = Column(String(50), default="Open")  # Open, In Progress, Under Inspection, Resolved, Closed
    assigned_to = Column(String(100), nullable=False)
    created_at = Column(String(50), nullable=False)
    description = Column(Text, nullable=True)
    resolution_notes = Column(Text, nullable=True)


# 5. ADO Tasks with Comments & Audit Attachments (Builder & IGS)
class ADOTaskModel(Base):
    __tablename__ = "ado_tasks"
    id = Column(Integer, primary_key=True, index=True)
    task_code = Column(String(50), unique=True, index=True)
    title = Column(String(255), nullable=False)
    assigned_to = Column(String(100), nullable=False)  # Builder, IGS, Association, Joint
    entity_type = Column(String(50), nullable=False)  # Builder, IGS
    category = Column(String(100), nullable=False)
    status = Column(String(50), nullable=False, default="New")  # New, Active, Resolved, Closed
    priority = Column(String(50), nullable=False, default="Medium")  # Critical, High, Medium, Low
    assignee_name = Column(String(150), nullable=True)
    due_date = Column(String(50), nullable=True)
    sla_days = Column(Integer, default=7)
    blockers = Column(Text, nullable=True)
    description = Column(Text, nullable=True)
    completion_percentage = Column(Integer, default=0)
    tags = Column(String(200), nullable=True)

    comments = relationship("ADOCommentModel", back_populates="task", cascade="all, delete-orphan")
    attachments = relationship("ADOAttachmentModel", back_populates="task", cascade="all, delete-orphan")

class ADOCommentModel(Base):
    __tablename__ = "ado_comments"
    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("ado_tasks.id", ondelete="CASCADE"), nullable=False)
    author_name = Column(String(100), nullable=False)
    author_role = Column(String(100), default="MC Member")
    comment_text = Column(Text, nullable=False)
    created_at = Column(String(50), nullable=False)

    task = relationship("ADOTaskModel", back_populates="comments")

class ADOAttachmentModel(Base):
    __tablename__ = "ado_attachments"
    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("ado_tasks.id", ondelete="CASCADE"), nullable=False)
    file_name = Column(String(200), nullable=False)
    file_url = Column(String(255), nullable=False)
    description = Column(String(255), nullable=True)
    uploaded_by = Column(String(100), nullable=False)
    created_at = Column(String(50), nullable=False)

    task = relationship("ADOTaskModel", back_populates="attachments")


# 6. Team Members (Jaitra Association Committee)
class TeamMemberModel(Base):
    __tablename__ = "team_members"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    role = Column(String(100), nullable=False)
    wing_flat = Column(String(50), nullable=True)
    tower = Column(String(50), default="Tower A")
    contact = Column(String(100), nullable=False)
    email = Column(String(100), nullable=True)
    term = Column(String(50), default="2025-2027")
    sub_committee = Column(String(100), nullable=True)
    status = Column(String(50), default="Active")


# 7. Distribution Lists (DL Groups) & Members & Notifications
class DLGroupModel(Base):
    __tablename__ = "dl_groups"
    id = Column(Integer, primary_key=True, index=True)
    group_name = Column(String(200), nullable=False)
    group_code = Column(String(50), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True, default="")
    category = Column(String(100), default="General")
    sender_email = Column(String(150), default="jaitra-association-hyd@googlegroups.com")
    is_system = Column(Integer, default=0)
    created_at = Column(String(50), nullable=True)

    members = relationship("DLMemberModel", back_populates="group", cascade="all, delete-orphan")


class DLMemberModel(Base):
    __tablename__ = "dl_members"
    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("dl_groups.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(150), nullable=False)
    tower = Column(String(50), default="Tower A")
    flat_no = Column(String(50), default="")
    email = Column(String(150), nullable=False)
    phone = Column(String(50), nullable=False)
    status = Column(String(20), default="Active")
    role_tag = Column(String(50), default="Owner")
    notes = Column(Text, nullable=True, default="")
    created_at = Column(String(50), nullable=True)

    group = relationship("DLGroupModel", back_populates="members")


class BroadcastNotificationModel(Base):
    __tablename__ = "broadcast_notifications"
    id = Column(Integer, primary_key=True, index=True)
    subject = Column(String(255), nullable=False)
    category = Column(String(100), default="General Notice")
    channel = Column(String(50), default="Email")
    sender_email = Column(String(150), default="jaitra-association-hyd@googlegroups.com")
    sender_name = Column(String(150), default="Jaitra Residents Welfare Association")
    group_ids = Column(String(255), nullable=True, default="")
    group_names = Column(Text, nullable=True, default="")
    target_tower = Column(String(50), default="All")
    active_recipients_count = Column(Integer, default=0)
    total_target_count = Column(Integer, default=0)
    message_body = Column(Text, nullable=False)
    event_or_meeting_ref = Column(String(255), nullable=True, default="")
    doc_link = Column(String(255), nullable=True, default="")
    sent_by = Column(String(150), default="Admin")
    status = Column(String(50), default="Dispatched")
    sent_at = Column(String(50), nullable=True)

