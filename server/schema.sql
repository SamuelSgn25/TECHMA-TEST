-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    drive_enabled BOOLEAN DEFAULT FALSE,
    drive_tokens JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des dossiers (AVANT local_files car elle est référencée)
CREATE TABLE IF NOT EXISTS local_folders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    parent_id INTEGER REFERENCES local_folders(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des fichiers locaux
CREATE TABLE IF NOT EXISTS local_files (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100),
    size BIGINT,
    path TEXT NOT NULL,
    folder_id INTEGER REFERENCES local_folders(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Historique IA
CREATE TABLE IF NOT EXISTS chat_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    role VARCHAR(50),
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
