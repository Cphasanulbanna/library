CREATE TABLE users (
    id SERIAL PRIMARY KEY,  -- Auto-increment ID
    email VARCHAR(255) UNIQUE NOT NULL,  -- Email must be unique
    password VARCHAR(255) NOT NULL,  -- Store hashed password
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP  -- Timestamp when user is created
);

CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL  -- Role name, e.g., "Admin", "User"
);

CREATE TABLE user_roles (
    user_id INT REFERENCES users(id) ON DELETE CASCADE,  -- Foreign key to users table
    role_id INT REFERENCES roles(id) ON DELETE CASCADE,  -- Foreign key to roles table
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE sessions (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,  -- Foreign key to users table
    token VARCHAR(255) UNIQUE NOT NULL,  -- JWT token for session
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP  -- When the session was created
);
