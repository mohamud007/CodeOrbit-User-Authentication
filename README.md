# CodeOrbit – User Authentication System

A simple web application that provides user signup, login, profile access, and logout using Node.js, Express, and MySQL.

## Features

- User registration and login
- Password hashing with bcrypt
- Session-based authentication
- Protected user profile
- Logout functionality
- Input validation and duplicate-email handling
- Automated tests using Jest and Supertest

## Technologies Used

- **Backend:** Node.js, Express.js
- **Database:** MySQL
- **Password Security:** bcrypt
- **Authentication:** express-session
- **Environment Configuration:** dotenv
- **Testing:** Jest, Supertest
- **Frontend:** HTML, CSS, JavaScript

## Prerequisites

Install the following before running the project:

- Node.js and npm
- MySQL Server
- Git

## Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/mohamud007/CodeOrbit-User-Authentication.git
```

### 2. Open the project directory

```bash
cd CodeOrbit-User-Authentication
```

### 3. Install dependencies

```bash
npm install
```

### 4. Configure the database

Start MySQL and create the database:

```sql
CREATE DATABASE user_auth_db;
USE user_auth_db;
```

Create the users table:

```sql
CREATE TABLE users (
    id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY email (email)
);
```

### 5. Configure environment variables

Create a `.env` file in the project root. Add the database credentials and other environment variables required by `db.js` and `server.js`.

**Important:** Never commit your `.env` file or expose database passwords and session secrets.

### 6. Start the application

```bash
node server.js
```

Open your browser at:

http://localhost:3000

### 7. Run automated tests

```bash
npm test
```

The tests verify signup, login, profile access, and logout behavior.

## GitHub Repository

[CodeOrbit – User Authentication System](https://github.com/mohamud007/CodeOrbit-User-Authentication)

## Author

Developed as a backend authentication project to practice REST APIs, database integration, password security, session management, and automated testing.
