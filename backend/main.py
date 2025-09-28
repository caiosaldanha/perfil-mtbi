from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
import time
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.exc import OperationalError
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
                conn.execute("SELECT 1")
            return engine
        except OperationalError as e:
            if attempt == max_retries - 1:
                raise e
            print(f"Database connection attempt {attempt + 1} failed, retrying in {retry_interval} seconds...")
            time.sleep(retry_interval)

engine = create_db_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Database models
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class TestResult(Base):
    __tablename__ = "test_results"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    personality_type = Column(String)  # MTBI type like INTJ, ENFP, etc.
    answers = Column(Text)  # JSON string of answers
    completed_at = Column(DateTime, default=datetime.utcnow)

class ChatMessage(Base):
    __tablename__ = "chat_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    message = Column(Text)
    is_user = Column(Boolean, default=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

# Create tables
# Note: Table creation moved to startup event to avoid timing issues

# Pydantic models
class UserCreate(BaseModel):
    name: str
    email: str

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    created_at: datetime

class QuestionAnswer(BaseModel):
    question_id: int
    answer: int  # 1-5 scale

class TestSubmission(BaseModel):
    user_id: int
    answers: List[QuestionAnswer]

class ChatMessageCreate(BaseModel):
    user_id: int
    message: str

class ChatMessageResponse(BaseModel):
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
        Base.metadata.create_all(bind=engine)
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

# MTBI Test Questions
MTBI_QUESTIONS = [
    {"id": 1, "text": "I prefer to work alone rather than in groups.", "dimension": "E/I"},
    {"id": 2, "text": "I focus on details and facts rather than possibilities.", "dimension": "S/N"},
    {"id": 3, "text": "I make decisions based on logic rather than feelings.", "dimension": "T/F"},
    {"id": 4, "text": "I prefer to have things planned and organized.", "dimension": "J/P"},
    {"id": 5, "text": "I feel energized after spending time with others.", "dimension": "E/I"},
    {"id": 6, "text": "I trust my intuition and gut feelings.", "dimension": "S/N"},
    {"id": 7, "text": "I consider how decisions affect people's feelings.", "dimension": "T/F"},
    {"id": 8, "text": "I like to keep my options open and be flexible.", "dimension": "J/P"},
    {"id": 9, "text": "I enjoy meeting new people and socializing.", "dimension": "E/I"},
    {"id": 10, "text": "I focus on the big picture rather than details.", "dimension": "S/N"},
    {"id": 11, "text": "I value harmony and avoid conflict.", "dimension": "T/F"},
    {"id": 12, "text": "I prefer structure and routine in my daily life.", "dimension": "J/P"},
]

def calculate_mtbi_type(answers: List[QuestionAnswer]) -> str:
    """Calculate MTBI personality type based on answers"""
    scores = {"E": 0, "I": 0, "S": 0, "N": 0, "T": 0, "F": 0, "J": 0, "P": 0}
    
    for answer in answers:
        question = next((q for q in MTBI_QUESTIONS if q["id"] == answer.question_id), None)
        if question:
            dimension = question["dimension"]
            if "/" in dimension:
                dim1, dim2 = dimension.split("/")
                # Higher scores (4-5) favor second dimension, lower scores (1-2) favor first
                if answer.answer >= 4:
                    scores[dim2] += answer.answer - 3
                else:
                    scores[dim1] += 3 - answer.answer
    
    # Determine personality type
    personality = ""
    personality += "E" if scores["E"] > scores["I"] else "I"
    personality += "S" if scores["S"] > scores["N"] else "N"
    personality += "T" if scores["T"] > scores["F"] else "F"
    personality += "J" if scores["J"] > scores["P"] else "P"
    
    return personality

def generate_ai_response(user_message: str, personality_type: str = None) -> str:
    """Generate AI response based on user message and personality type"""
    # Simple rule-based responses for demonstration
    responses = {
        "greeting": "Hello! I'm here to help you explore your personality and guide you on a journey of self-discovery. How are you feeling today?",
        "personality": f"Based on your test results, you have an {personality_type} personality type. This means you tend to be...",
        "default": "That's interesting. Tell me more about how that makes you feel. Understanding yourself better is a continuous journey."
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

@app.get("/questions")
async def get_questions():
    """Get all MTBI test questions"""
    return MTBI_QUESTIONS

@app.post("/users", response_model=UserResponse)
async def create_user(user: UserCreate, db: Session = Depends(get_db)):
    """Create a new user"""
    db_user = User(name=user.name, email=user.email)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.post("/submit-test")
async def submit_test(test: TestSubmission, db: Session = Depends(get_db)):
    """Submit MTBI test answers and get personality type"""
    # Calculate personality type
    personality_type = calculate_mtbi_type(test.answers)
    
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
        "description": f"You have an {personality_type} personality type.",
        "test_result_id": test_result.id
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