from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, field_validator
from typing import Dict, List
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

# Database setup
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://mtbi_user:mtbi_password@localhost:5432/mtbi_db")

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

@app.on_event("startup")
async def startup_event():
    """Create database tables on startup"""
    try:
        # Wait a bit more to ensure database is completely ready
        import asyncio
        await asyncio.sleep(2)
        Base.metadata.create_all(bind=engine)
        with SessionLocal() as session:
            seed_questions(session)
        print("Database tables created successfully")
    except Exception as e:
        print(f"Error creating database tables: {e}")
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
            # Resolve ties deterministically using the primary trait.
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
