from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, field_validator
from typing import Any, Dict, List, Optional
import os
import time
from sqlalchemy import (
    create_engine,
    Column,
    Integer,
    String,
    Text,
    DateTime,
    Boolean,
    ForeignKey,
    text,
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.exc import IntegrityError, OperationalError
from datetime import datetime
import json
from functools import lru_cache
from threading import Lock

# Database setup
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://mtbi_user:mtbi_password@localhost:5432/mtbi_db")

# Performance optimization - JSON parsing cache
_json_cache = {}
_cache_lock = Lock()

def create_db_engine():
    """Create database engine with retry logic"""
    max_retries = 30
    retry_interval = 2
    
    for attempt in range(max_retries):
        try:
            engine = create_engine(DATABASE_URL)
            # Test the connection
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            return engine
        except OperationalError as e:
            if attempt == max_retries - 1:
                raise e
            print(f"Database connection attempt {attempt + 1} failed, retrying in {retry_interval} seconds...")
            time.sleep(retry_interval)

engine = create_db_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Default question bank with scoring metadata.
DEFAULT_QUESTIONS = [
    {
        "id": 1,
        "text": "Eu me sinto energizado depois de passar tempo com outras pessoas.",
        "dimension": "E/I",
        "trait_high": "E",
        "trait_low": "I",
    },
    {
        "id": 2,
        "text": "Prefiro reservar momentos de silêncio para recarregar após eventos sociais.",
        "dimension": "E/I",
        "trait_high": "I",
        "trait_low": "E",
    },
    {
        "id": 3,
        "text": "Costumo explorar novas ideias e possibilidades antes de focar nos detalhes.",
        "dimension": "S/N",
        "trait_high": "N",
        "trait_low": "S",
    },
    {
        "id": 4,
        "text": "Sinto-me mais confiante quando tenho dados concretos e fatos comprovados.",
        "dimension": "S/N",
        "trait_high": "S",
        "trait_low": "N",
    },
    {
        "id": 5,
        "text": "Ao tomar decisões, priorizo a lógica e a objetividade.",
        "dimension": "T/F",
        "trait_high": "T",
        "trait_low": "F",
    },
    {
        "id": 6,
        "text": "Levo em consideração como as pessoas serão afetadas antes de decidir algo.",
        "dimension": "T/F",
        "trait_high": "F",
        "trait_low": "T",
    },
    {
        "id": 7,
        "text": "Gosto de planejar com antecedência e seguir cronogramas definidos.",
        "dimension": "J/P",
        "trait_high": "J",
        "trait_low": "P",
    },
    {
        "id": 8,
        "text": "Prefiro manter minhas opções em aberto e ajustar o plano conforme necessário.",
        "dimension": "J/P",
        "trait_high": "P",
        "trait_low": "J",
    },
    {
        "id": 9,
        "text": "Costumo iniciar conversas com desconhecidos com facilidade.",
        "dimension": "E/I",
        "trait_high": "E",
        "trait_low": "I",
    },
    {
        "id": 10,
        "text": "Presto atenção em como os pequenos detalhes se conectam ao todo.",
        "dimension": "S/N",
        "trait_high": "S",
        "trait_low": "N",
    },
    {
        "id": 11,
        "text": "Procuro reduzir conflitos para manter a harmonia nos relacionamentos.",
        "dimension": "T/F",
        "trait_high": "F",
        "trait_low": "T",
    },
    {
        "id": 12,
        "text": "Sinto-me confortável fazendo ajustes de última hora no meu dia.",
        "dimension": "J/P",
        "trait_high": "P",
        "trait_low": "J",
    },
]

PERSONALITY_DESCRIPTIONS = {
    "INTJ": "O Arquiteto - Pensadores estratégicos e independentes.",
    "INTP": "O Pensador - Inovadores e lógicos solucionadores de problemas.",
    "ENTJ": "O Comandante - Líderes ousados e de vontade forte.",
    "ENTP": "O Debatedor - Pensadores inteligentes e curiosos.",
    "INFJ": "O Advogado - Inspiradores criativos e perspicazes.",
    "INFP": "O Mediador - Idealistas poéticos de bom coração.",
    "ENFJ": "O Protagonista - Líderes carismáticos e inspiradores.",
    "ENFP": "O Ativista - Espíritos livres entusiasmados e criativos.",
    "ISTJ": "O Logístico - Indivíduos práticos e factuais.",
    "ISFJ": "O Protetor - Protetores de coração caloroso e dedicados.",
    "ESTJ": "O Executivo - Excelentes administradores e gerentes.",
    "ESFJ": "O Cônsul - Pessoas extraordinariamente atenciosas e sociais.",
    "ISTP": "O Virtuoso - Experimentadores ousados e práticos.",
    "ISFP": "O Aventureiro - Artistas flexíveis e charmosos.",
    "ESTP": "O Empreendedor - Pessoas inteligentes, enérgicas e perspicazes.",
    "ESFP": "O Animador - Pessoas espontâneas, enérgicas e entusiasmadas.",
}


class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    text = Column(Text, nullable=False)
    dimension = Column(String(3), nullable=False)
    trait_high = Column(String(1), nullable=False)
    trait_low = Column(String(1), nullable=False)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class TestResult(Base):
    __tablename__ = "test_results"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    personality_type = Column(String, nullable=False)
    answers = Column(Text, nullable=False)
    completed_at = Column(DateTime, default=datetime.utcnow)


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    message = Column(Text, nullable=False)
    is_user = Column(Boolean, default=True)
    timestamp = Column(DateTime, default=datetime.utcnow)


class TestSession(Base):
    __tablename__ = "test_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    status = Column(String, default="in_progress", nullable=False)
    current_index = Column(Integer, default=0, nullable=False)
    answers = Column(Text, default="[]", nullable=False)
    question_order = Column(Text, nullable=False)
    test_result_id = Column(Integer, ForeignKey("test_results.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

# Create tables
# Note: Table creation moved to startup event to avoid timing issues

# Pydantic models
class UserCreate(BaseModel):
    name: str
    email: str

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str
    created_at: datetime

class QuestionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    text: str
    dimension: str
    trait_high: str
    trait_low: str


class QuestionAnswer(BaseModel):
    question_id: int
    answer: int  # 1-5 scale

    @field_validator("answer")
    @classmethod
    def validate_answer(cls, value: int) -> int:
        if not 1 <= value <= 5:
            raise ValueError("Answer must be between 1 and 5.")
        return value

class TestSubmission(BaseModel):
    user_id: int
    answers: List[QuestionAnswer]

class ChatMessageCreate(BaseModel):
    user_id: int
    message: str

class ChatMessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    message: str
    is_user: bool
    timestamp: datetime


class TestSessionCreate(BaseModel):
    user_id: int
    restart: bool = False


class TestSessionAnswer(BaseModel):
    question_id: int
    answer: int

    @field_validator("answer")
    @classmethod
    def validate_answer(cls, value: int) -> int:
        if not 1 <= value <= 5:
            raise ValueError("Answer must be between 1 and 5.")
        return value


class AnsweredQuestion(BaseModel):
    question_id: int
    answer: int
    dimension: str


class TestSessionResponse(BaseModel):
    id: int
    user_id: int
    status: str
    current_index: int
    total_questions: int
    answers_count: int
    question: Optional[QuestionResponse]
    answered: List[AnsweredQuestion]
    personality_type: Optional[str] = None
    trait_scores: Optional[Dict[str, int]] = None
    completed_at: Optional[datetime] = None
    test_result_id: Optional[int] = None


class TestResultSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    personality_type: str
    completed_at: datetime

# FastAPI app
app = FastAPI(title="MTBI Personality Test API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def verify_and_update_schema(db_session: Session) -> None:
    """
    Verify database schema matches models and apply necessary migrations.
    
    This system supports multiple schema changes through a generic migration framework.
    Each migration is defined with check_query, migration_query, and description.
    """
    print("Checking database schema alignment...")
    
    # Define migrations as a list of dicts with 'check_query', 'migration_query', and 'description'
    migrations = [
        {
            "description": "test_sessions.test_result_id column",
            "check_query": "SELECT test_result_id FROM test_sessions LIMIT 1",
            "migration_query": "ALTER TABLE test_sessions ADD COLUMN test_result_id INTEGER REFERENCES test_results(id) ON DELETE SET NULL",
            "missing_error": "does not exist",
        },
        # Add future migrations here as needed
        # Example:
        # {
        #     "description": "users.email_verified column",
        #     "check_query": "SELECT email_verified FROM users LIMIT 1",
        #     "migration_query": "ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE",
        #     "missing_error": "does not exist",
        # },
    ]
    
    # Execute migrations sequentially
    for migration in migrations:
        try:
            # Try to execute the check query
            db_session.execute(text(migration["check_query"]))
            print(f"✓ {migration['description']} verified")
        except Exception as e:
            if migration["missing_error"] in str(e):
                print(f"⚠ Missing {migration['description']}, applying migration...")
                db_session.rollback()
                try:
                    db_session.execute(text(migration["migration_query"]))
                    db_session.commit()
                    print(f"✓ Successfully applied migration for {migration['description']}")
                except Exception as migration_error:
                    print(f"✗ Failed to apply migration for {migration['description']}: {migration_error}")
                    db_session.rollback()
                    raise
            else:
                print(f"✗ Schema verification failed for {migration['description']}: {e}")
                db_session.rollback()
                raise


@app.on_event("startup")
async def startup_event():
    """Create database tables and verify schema on startup"""
    try:
        # Wait a bit more to ensure database is completely ready
        import asyncio
        await asyncio.sleep(2)
        
        # Create tables first
        Base.metadata.create_all(bind=engine)
        
        with SessionLocal() as session:
            # Verify and update schema if needed
            verify_and_update_schema(session)
            
            # Seed questions in a fresh session after schema verification
            
        with SessionLocal() as session:
            seed_questions(session)
            
        print("Database initialization completed successfully")
    except Exception as e:
        print(f"Error during database initialization: {e}")
        raise

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def seed_questions(session: Session) -> None:
    """Ensure default MBTI questions are present and up to date."""
    existing_questions: Dict[int, Question] = {
        question.id: question for question in session.query(Question).all()
    }
    has_changes = False

    for question_data in DEFAULT_QUESTIONS:
        question = existing_questions.get(question_data["id"])
        if question:
            for field in ("text", "dimension", "trait_high", "trait_low"):
                if getattr(question, field) != question_data[field]:
                    setattr(question, field, question_data[field])
                    has_changes = True
        else:
            session.add(Question(**question_data))
            has_changes = True

    if has_changes:
        session.commit()


def load_json_array(raw: Optional[str]) -> List[Any]:
    """
    Load and parse JSON array with caching for performance optimization.
    
    Reduces JSON parsing overhead when the same data is accessed frequently
    across multiple API endpoints.
    """
    if not raw:
        return []
    
    # Use thread-safe cache for frequently accessed JSON data
    cache_key = hash(raw)
    with _cache_lock:
        if cache_key in _json_cache:
            return _json_cache[cache_key]
    
    try:
        data = json.loads(raw)
        if isinstance(data, list):
            # Cache successful parse results (limit cache size to prevent memory issues)
            with _cache_lock:
                if len(_json_cache) < 1000:  # Prevent unlimited cache growth
                    _json_cache[cache_key] = data
            return data
    except json.JSONDecodeError:
        pass
    return []


# Performance optimization - Questions cache
_questions_cache = None
_questions_cache_time = 0
_questions_cache_ttl = 300  # 5 minutes TTL

def get_ordered_questions(db: Session) -> List[Question]:
    """
    Get ordered questions with caching for performance optimization.
    
    Questions are cached since they rarely change and are accessed frequently.
    Cache has a 5-minute TTL to balance performance with data freshness.
    """
    global _questions_cache, _questions_cache_time
    
    current_time = time.time()
    
    # Check if cache is valid
    if (_questions_cache is None or 
        current_time - _questions_cache_time > _questions_cache_ttl):
        
        questions = db.query(Question).order_by(Question.id).all()
        if not questions:
            raise HTTPException(status_code=400, detail="Questionário indisponível. Consulte o administrador.")
        
        # Update cache
        _questions_cache = questions
        _questions_cache_time = current_time
    
    return _questions_cache


def ensure_user_exists(db: Session, user_id: int) -> User:
    user = db.query(User).filter(User.id == user_id).one_or_none()
    if user is None:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    return user


def ensure_session_alignment(
    db: Session,
    session_obj: TestSession,
    questions: List[Question],
) -> TestSession:
    """Normalize question order, answers and index so the session always exposes a next question."""

    valid_question_ids = {question.id for question in questions}
    original_order = load_json_array(session_obj.question_order)
    filtered_order = [question_id for question_id in original_order if question_id in valid_question_ids]
    changed = False

    if not filtered_order and questions:
        filtered_order = [question.id for question in questions]
        session_obj.answers = json.dumps([])
        session_obj.current_index = 0
        session_obj.status = "in_progress"
        session_obj.completed_at = None
        session_obj.test_result_id = None
        changed = True
    elif len(filtered_order) != len(original_order):
        changed = True

    if filtered_order != original_order:
        session_obj.question_order = json.dumps(filtered_order)

    answers_raw = load_json_array(session_obj.answers)
    filtered_answers = [
        answer
        for answer in answers_raw
        if isinstance(answer, dict)
        and answer.get("question_id") in valid_question_ids
        and isinstance(answer.get("answer"), int)
    ]

    if len(filtered_answers) != len(answers_raw):
        session_obj.answers = json.dumps(filtered_answers)
        changed = True

    answers_count = len(filtered_answers)
    if session_obj.current_index < answers_count:
        session_obj.current_index = answers_count
        changed = True

    if session_obj.current_index > len(filtered_order):
        session_obj.current_index = len(filtered_order)
        changed = True

    if (
        session_obj.status == "in_progress"
        and filtered_order
        and session_obj.current_index >= len(filtered_order)
    ):
        session_obj.status = "completed"
        session_obj.completed_at = session_obj.completed_at or datetime.utcnow()
        changed = True

    if changed:
        session_obj.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(session_obj)

    return session_obj


def build_session_response(session_obj: TestSession, questions: List[Question]) -> TestSessionResponse:
    question_order = load_json_array(session_obj.question_order)
    answers_raw = load_json_array(session_obj.answers)
    questions_by_id = {question.id: question for question in questions}
    total_questions = len(question_order)
    answers_count = len(answers_raw)

    next_question: Optional[QuestionResponse] = None
    if (
        session_obj.status == "in_progress"
        and session_obj.current_index < total_questions
    ):
        next_question_id = question_order[session_obj.current_index]
        question_obj = questions_by_id.get(next_question_id)
        if question_obj:
            next_question = QuestionResponse.model_validate(question_obj)

    answered_items: List[AnsweredQuestion] = []
    for answer_data in answers_raw:
        question = questions_by_id.get(answer_data.get("question_id"))
        if question:
            answered_items.append(
                AnsweredQuestion(
                    question_id=question.id,
                    answer=int(answer_data.get("answer", 0)),
                    dimension=question.dimension,
                )
            )

    trait_scores: Optional[Dict[str, int]] = None
    personality_type: Optional[str] = None
    result_summary = None
    if answers_raw:
        answers_models = [QuestionAnswer(**item) for item in answers_raw]
        result_summary = calculate_mtbi_type(answers_models, questions_by_id)
        trait_scores = result_summary["trait_scores"]
        if session_obj.status == "completed":
            personality_type = result_summary["personality_type"]

    return TestSessionResponse(
        id=session_obj.id,
        user_id=session_obj.user_id,
        status=session_obj.status,
        current_index=session_obj.current_index,
        total_questions=total_questions,
        answers_count=answers_count,
        question=next_question,
        answered=answered_items,
        personality_type=personality_type,
        trait_scores=trait_scores,
        completed_at=session_obj.completed_at,
        test_result_id=session_obj.test_result_id,
    )

def calculate_mtbi_type(
    answers: List[QuestionAnswer],
    questions_by_id: Dict[int, Question],
) -> Dict[str, Dict[str, int] | str]:
    """Calculate MBTI personality type and provide score breakdown."""

    trait_scores = {"E": 0, "I": 0, "S": 0, "N": 0, "T": 0, "F": 0, "J": 0, "P": 0}

    for answer in answers:
        question = questions_by_id.get(answer.question_id)
        if not question:
            raise HTTPException(status_code=400, detail=f"Invalid question id {answer.question_id}.")

        if answer.answer >= 4:
            trait_scores[question.trait_high] += answer.answer - 3
        elif answer.answer <= 2:
            trait_scores[question.trait_low] += 3 - answer.answer

    personality = ""
    for primary, secondary in (("E", "I"), ("S", "N"), ("T", "F"), ("J", "P")):
        if trait_scores[primary] > trait_scores[secondary]:
            personality += primary
        elif trait_scores[secondary] > trait_scores[primary]:
            personality += secondary
        else:
            # Tie-break: deterministically select the primary trait for consistency and reproducibility.
            personality += primary

    return {
        "personality_type": personality,
        "trait_scores": trait_scores,
    }

def generate_ai_response(user_message: str, personality_type: str = None) -> str:
    """Generate AI response based on user message and personality type"""
    # Simple rule-based responses for demonstration
    personality_description = PERSONALITY_DESCRIPTIONS.get(
        personality_type or "",
        "Cada pessoa manifesta qualidades únicas; vamos explorar as suas juntas.",
    )

    responses = {
        "greeting": "Olá! Estou aqui para ajudar você a explorar sua personalidade. Como tem se sentido hoje?",
        "personality": (
            f"Seus resultados indicam o tipo {personality_type}. {personality_description}"
            if personality_type
            else "Conte-me um pouco mais sobre o seu resultado para que eu possa ajudar."
        ),
        "default": "Interessante! Conte mais para entendermos como isso se conecta com o seu estilo pessoal.",
    }
    
    message_lower = user_message.lower()
    
    if any(word in message_lower for word in ["hello", "hi", "hey"]):
        return responses["greeting"]
    elif personality_type and any(word in message_lower for word in ["personality", "type", "result"]):
        return responses["personality"]
    else:
        return responses["default"]

# API Routes
@app.get("/")
async def root():
    return {"message": "MTBI Personality Test API"}

@app.get("/questions", response_model=List[QuestionResponse])
async def get_questions(db: Session = Depends(get_db)):
    """Return the ordered list of MBTI questions from the database."""
    questions = db.query(Question).order_by(Question.id).all()
    return questions

@app.post("/users", response_model=UserResponse)
async def create_user(user: UserCreate, db: Session = Depends(get_db)):
    """Create a new user"""
    db_user = User(name=user.name, email=user.email)
    db.add(db_user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="E-mail já cadastrado.")
    db.refresh(db_user)
    return db_user


@app.post("/test-session", response_model=TestSessionResponse)
async def create_or_resume_test_session(
    session_data: TestSessionCreate,
    db: Session = Depends(get_db),
):
    """Create a new test session or resume an active one."""

    seed_questions(db)
    ensure_user_exists(db, session_data.user_id)
    questions = get_ordered_questions(db)

    if session_data.restart:
        active_sessions = db.query(TestSession).filter(
            TestSession.user_id == session_data.user_id,
            TestSession.status == "in_progress",
        ).all()
        for active in active_sessions:
            active.status = "cancelled"
            active.updated_at = datetime.utcnow()
        if active_sessions:
            db.commit()

    if not session_data.restart:
        existing_session = (
            db.query(TestSession)
            .filter(
                TestSession.user_id == session_data.user_id,
                TestSession.status == "in_progress",
            )
            .order_by(TestSession.updated_at.desc())
            .first()
        )
        if existing_session:
            ensure_session_alignment(db, existing_session, questions)
            response = build_session_response(existing_session, questions)
            if response.question is None and response.status != "completed":
                existing_session.status = "cancelled"
                existing_session.updated_at = datetime.utcnow()
                db.commit()
                db.refresh(existing_session)
            else:
                return response

    question_order = [question.id for question in questions]
    new_session = TestSession(
        user_id=session_data.user_id,
        status="in_progress",
        current_index=0,
        answers=json.dumps([]),
        question_order=json.dumps(question_order),
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)

    ensure_session_alignment(db, new_session, questions)
    new_session_response = build_session_response(new_session, questions)

    if new_session_response.question is None:
        raise HTTPException(
            status_code=500,
            detail="Não foi possível preparar a primeira pergunta do teste.",
        )

    return new_session_response


def get_session_or_404(db: Session, session_id: int) -> TestSession:
    session_obj = db.query(TestSession).filter(TestSession.id == session_id).one_or_none()
    if session_obj is None:
        raise HTTPException(status_code=404, detail="Sessão de teste não encontrada.")
    return session_obj


@app.get("/test-session/{session_id}", response_model=TestSessionResponse)
async def get_test_session(session_id: int, db: Session = Depends(get_db)):
    """Retrieve the current state of a test session."""

    session_obj = get_session_or_404(db, session_id)
    questions = get_ordered_questions(db)
    ensure_session_alignment(db, session_obj, questions)
    return build_session_response(session_obj, questions)


@app.post("/test-session/{session_id}/answer", response_model=TestSessionResponse)
async def answer_test_question(
    session_id: int,
    answer_payload: TestSessionAnswer,
    db: Session = Depends(get_db),
):
    """Submit an answer for the next question in the session."""

    session_obj = get_session_or_404(db, session_id)
    if session_obj.status != "in_progress":
        raise HTTPException(status_code=400, detail="Esta sessão já foi finalizada.")

    questions = get_ordered_questions(db)
    session_obj = ensure_session_alignment(db, session_obj, questions)
    question_order = load_json_array(session_obj.question_order)
    total_questions = len(question_order)

    if session_obj.current_index >= total_questions:
        raise HTTPException(status_code=400, detail="Todas as perguntas já foram respondidas.")

    expected_question_id = question_order[session_obj.current_index]
    if answer_payload.question_id != expected_question_id:
        raise HTTPException(status_code=400, detail="Questão enviada fora de sequência.")

    answers_raw = load_json_array(session_obj.answers)
    answers_raw.append(
        {"question_id": answer_payload.question_id, "answer": answer_payload.answer}
    )

    session_obj.answers = json.dumps(answers_raw)
    session_obj.current_index += 1
    session_obj.updated_at = datetime.utcnow()

    if session_obj.current_index >= total_questions:
        session_obj.status = "completed"
        session_obj.completed_at = datetime.utcnow()

        answers_models = [QuestionAnswer(**item) for item in answers_raw]
        questions_by_id = {question.id: question for question in questions}
        result_summary = calculate_mtbi_type(answers_models, questions_by_id)

        test_result = TestResult(
            user_id=session_obj.user_id,
            personality_type=result_summary["personality_type"],
            answers=json.dumps(answers_raw),
        )
        db.add(test_result)
        db.flush()
        session_obj.test_result_id = test_result.id

    db.commit()
    db.refresh(session_obj)

    # Use the previously fetched questions to avoid duplicate DB query
    return build_session_response(session_obj, questions)


@app.post("/test-session/{session_id}/rewind", response_model=TestSessionResponse)
async def rewind_last_answer(session_id: int, db: Session = Depends(get_db)):
    """Undo the last answer, allowing the user to review a question."""

    session_obj = get_session_or_404(db, session_id)
    if session_obj.status != "in_progress":
        raise HTTPException(status_code=400, detail="A sessão não pode ser editada.")

    questions = get_ordered_questions(db)
    session_obj = ensure_session_alignment(db, session_obj, questions)

    answers_raw = load_json_array(session_obj.answers)
    if not answers_raw:
        return build_session_response(session_obj, questions)

    answers_raw.pop()
    session_obj.answers = json.dumps(answers_raw)
    session_obj.current_index = max(session_obj.current_index - 1, 0)
    session_obj.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(session_obj)

    ensure_session_alignment(db, session_obj, questions)
    return build_session_response(session_obj, questions)


@app.get("/users/{user_id}/test-results", response_model=List[TestResultSummary])
async def list_user_test_results(user_id: int, db: Session = Depends(get_db)):
    """Return all completed test results for a user."""

    ensure_user_exists(db, user_id)
    results = (
        db.query(TestResult)
        .filter(TestResult.user_id == user_id)
        .order_by(TestResult.completed_at.desc())
        .all()
    )
    return results

@app.post("/submit-test")
async def submit_test(test: TestSubmission, db: Session = Depends(get_db)):
    """Submit MTBI test answers and get personality type"""
    if not test.answers:
        raise HTTPException(status_code=400, detail="Respostas do teste são obrigatórias.")

    user = db.query(User.id).filter(User.id == test.user_id).one_or_none()
    if user is None:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")

    question_ids = [answer.question_id for answer in test.answers]
    if len(set(question_ids)) != len(question_ids):
        raise HTTPException(status_code=400, detail="Há respostas duplicadas para a mesma pergunta.")

    questions = db.query(Question).order_by(Question.id).all()
    questions_by_id = {question.id: question for question in questions}

    expected_ids = set(questions_by_id.keys())
    provided_ids = set(question_ids)

    missing_questions = sorted(expected_ids - provided_ids)
    if missing_questions:
        raise HTTPException(
            status_code=400,
            detail="Todas as perguntas devem ser respondidas antes de enviar o teste.",
        )

    unknown_questions = sorted(provided_ids - expected_ids)
    if unknown_questions:
        raise HTTPException(
            status_code=400,
            detail="Foram enviadas perguntas inválidas para o teste.",
        )

    # Calculate personality type
    result_summary = calculate_mtbi_type(test.answers, questions_by_id)
    personality_type = result_summary["personality_type"]
    
    # Save test result
    test_result = TestResult(
        user_id=test.user_id,
        personality_type=personality_type,
        answers=json.dumps([{"question_id": a.question_id, "answer": a.answer} for a in test.answers])
    )
    db.add(test_result)
    db.commit()
    db.refresh(test_result)
    
    return {
        "personality_type": personality_type,
        "description": PERSONALITY_DESCRIPTIONS.get(
            personality_type,
            "Use este resultado como ponto de partida para aprofundar seu autoconhecimento.",
        ),
        "test_result_id": test_result.id,
        "trait_scores": result_summary["trait_scores"],
    }

@app.post("/chat", response_model=ChatMessageResponse)
async def send_message(message: ChatMessageCreate, db: Session = Depends(get_db)):
    """Send a chat message and get AI response"""
    # Save user message
    user_message = ChatMessage(
        user_id=message.user_id,
        message=message.message,
        is_user=True
    )
    db.add(user_message)
    db.commit()
    db.refresh(user_message)
    
    # Get user's personality type if available
    test_result = db.query(TestResult).filter(
        TestResult.user_id == message.user_id
    ).order_by(TestResult.completed_at.desc()).first()
    
    personality_type = test_result.personality_type if test_result else None
    
    # Generate AI response
    ai_response_text = generate_ai_response(message.message, personality_type)
    
    # Save AI response
    ai_message = ChatMessage(
        user_id=message.user_id,
        message=ai_response_text,
        is_user=False
    )
    db.add(ai_message)
    db.commit()
    db.refresh(ai_message)
    
    return ai_message

@app.get("/chat/{user_id}")
async def get_chat_history(user_id: int, db: Session = Depends(get_db)):
    """Get chat history for a user"""
    messages = db.query(ChatMessage).filter(
        ChatMessage.user_id == user_id
    ).order_by(ChatMessage.timestamp).all()
    
    return messages

@app.get("/users/{user_id}/personality")
async def get_user_personality(user_id: int, db: Session = Depends(get_db)):
    """Get user's personality type"""
    test_result = db.query(TestResult).filter(
        TestResult.user_id == user_id
    ).order_by(TestResult.completed_at.desc()).first()
    
    if not test_result:
        raise HTTPException(status_code=404, detail="No test results found for user")
    
    return {
        "personality_type": test_result.personality_type,
        "completed_at": test_result.completed_at
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
