# MTBI Personality Test - AI Chat Application

A comprehensive web application for psychological evaluation using the Myers-Briggs Type Indicator (MBTI) test, featuring an AI chat system to guide users through self-discovery.

## Overview

This application consists of three independent services running in Docker containers:

1. **Frontend (Flask)** - User interface for the MTBI test and AI chat
2. **Backend (FastAPI)** - REST API for test processing and AI responses
3. **Database (PostgreSQL)** - Data storage for users, test results, and chat messages

## Features

- Complete MTBI personality test with 12 questions
- Personality type calculation and results display
- AI-powered chat system for self-discovery guidance
- User registration and session management
- Responsive web interface using Bootstrap
- RESTful API with FastAPI
- PostgreSQL database with proper relationships

## Architecture

```
Frontend (Flask:5000) → Backend (FastAPI:8000) → Database (PostgreSQL:5432)
```

## Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd perfil-mtbi
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env file if needed
   ```

3. **Start the application**
   ```bash
   docker-compose up --build
   ```

4. **Access the application**
   - Frontend: http://localhost:5000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

## Services

### Frontend (Flask)
- **Port**: 5000
- **Technology**: Flask, Bootstrap, HTML/CSS/JavaScript
- **Features**:
  - User registration and authentication
  - MTBI test interface
  - Results display
  - Real-time AI chat interface

### Backend (FastAPI)
- **Port**: 8000
- **Technology**: FastAPI, SQLAlchemy, PostgreSQL
- **Features**:
  - RESTful API endpoints
  - MTBI test scoring algorithm
  - AI response generation
  - Database operations

### Database (PostgreSQL)
- **Port**: 5432
- **Technology**: PostgreSQL 15
- **Features**:
  - User management
  - Test results storage
  - Chat message history

## API Endpoints

### Core Endpoints
- `GET /` - API status
- `GET /questions` - Get MTBI test questions
- `POST /users` - Create new user
- `POST /submit-test` - Submit test answers
- `POST /chat` - Send chat message
- `GET /chat/{user_id}` - Get chat history
- `GET /users/{user_id}/personality` - Get user personality type

## Database Schema

### Tables
- **users**: User information and authentication
- **test_results**: MTBI test submissions and personality types
- **chat_messages**: Chat conversation history

## Development

### Prerequisites
- Docker and Docker Compose
- Git

### Local Development

1. **Backend Development**
   ```bash
   cd backend
   pip install -r requirements.txt
   uvicorn main:app --reload
   ```

2. **Frontend Development**
   ```bash
   cd frontend
   pip install -r requirements.txt
   python app.py
   ```

3. **Database Setup**
   ```bash
   # Using PostgreSQL locally
   createdb mtbi_db
   psql mtbi_db < database/init.sql
   ```

### Testing

Access the application:
1. Visit http://localhost:5000
2. Register a new user
3. Complete the MTBI test
4. View your personality type results
5. Chat with the AI for self-discovery guidance

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `POSTGRES_DB` | Database name | `mtbi_db` |
| `POSTGRES_USER` | Database user | `mtbi_user` |
| `POSTGRES_PASSWORD` | Database password | `mtbi_password` |
| `DATABASE_URL` | Full database connection string | Generated from above |
| `BACKEND_URL` | Backend API URL for frontend | `http://backend:8000` |
| `FLASK_SECRET_KEY` | Flask session secret | Change in production |

## MTBI Personality Types

The application evaluates 16 personality types based on four dimensions:
- **E**xtraversion vs **I**ntroversion
- **S**ensing vs i**N**tuition
- **T**hinking vs **F**eeling
- **J**udging vs **P**erceiving

Results: INTJ, INTP, ENTJ, ENTP, INFJ, INFP, ENFJ, ENFP, ISTJ, ISFJ, ESTJ, ESFJ, ISTP, ISFP, ESTP, ESFP

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.