-- Database initialization script for MTBI Personality Test application
-- This script will be executed when the PostgreSQL container starts

-- Create database if it doesn't exist (this is handled by POSTGRES_DB env var)

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create questions table
CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY,
    text TEXT NOT NULL,
    dimension VARCHAR(3) NOT NULL,
    trait_high CHAR(1) NOT NULL,
    trait_low CHAR(1) NOT NULL
);

-- Create test_results table
CREATE TABLE IF NOT EXISTS test_results (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    personality_type VARCHAR(4) NOT NULL,
    answers TEXT NOT NULL,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create test_sessions table
CREATE TABLE IF NOT EXISTS test_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'in_progress',
    current_index INTEGER NOT NULL DEFAULT 0,
    answers TEXT NOT NULL DEFAULT '[]',
    question_order TEXT NOT NULL,
    test_result_id INTEGER REFERENCES test_results(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_user BOOLEAN DEFAULT TRUE,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_questions_dimension ON questions(dimension);
CREATE INDEX IF NOT EXISTS idx_test_results_user_id ON test_results(user_id);
CREATE INDEX IF NOT EXISTS idx_test_results_completed_at ON test_results(completed_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_timestamp ON chat_messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_test_sessions_user_id ON test_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_test_sessions_status ON test_sessions(status);

-- Seed default MBTI questions
INSERT INTO questions (id, text, dimension, trait_high, trait_low) VALUES
    (1, 'Eu me sinto energizado depois de passar tempo com outras pessoas.', 'E/I', 'E', 'I'),
    (2, 'Prefiro reservar momentos de silêncio para recarregar após eventos sociais.', 'E/I', 'I', 'E'),
    (3, 'Costumo explorar novas ideias e possibilidades antes de focar nos detalhes.', 'S/N', 'N', 'S'),
    (4, 'Sinto-me mais confiante quando tenho dados concretos e fatos comprovados.', 'S/N', 'S', 'N'),
    (5, 'Ao tomar decisões, priorizo a lógica e a objetividade.', 'T/F', 'T', 'F'),
    (6, 'Levo em consideração como as pessoas serão afetadas antes de decidir algo.', 'T/F', 'F', 'T'),
    (7, 'Gosto de planejar com antecedência e seguir cronogramas definidos.', 'J/P', 'J', 'P'),
    (8, 'Prefiro manter minhas opções em aberto e ajustar o plano conforme necessário.', 'J/P', 'P', 'J'),
    (9, 'Costumo iniciar conversas com desconhecidos com facilidade.', 'E/I', 'E', 'I'),
    (10, 'Presto atenção em como os pequenos detalhes se conectam ao todo.', 'S/N', 'S', 'N'),
    (11, 'Procuro reduzir conflitos para manter a harmonia nos relacionamentos.', 'T/F', 'F', 'T'),
    (12, 'Sinto-me confortável fazendo ajustes de última hora no meu dia.', 'J/P', 'P', 'J')
ON CONFLICT (id) DO UPDATE SET
    text = EXCLUDED.text,
    dimension = EXCLUDED.dimension,
    trait_high = EXCLUDED.trait_high,
    trait_low = EXCLUDED.trait_low;

-- Insert some sample data (optional)

-- INSERT INTO users (name, email) VALUES 
--     ('John Doe', 'john.doe@example.com'),
--     ('Jane Smith', 'jane.smith@example.com')
-- ON CONFLICT (email) DO NOTHING;

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO mtbi_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO mtbi_user;
