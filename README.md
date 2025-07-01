# Nurser

A modern, type-safe nursing home management system built with PostgreSQL and Effect, designed to streamline resident care, staff management, and medication administration.

## ✨ Features

- **Resident Management** - Track resident information, room assignments, and status
- **Staff Management** - Manage staff members with role-based positions
- **Medication Tracking** - Record and monitor medication administration
- **Type-Safe API** - Built with TypeScript and Effect for robust type safety
- **Functional Architecture** - Clean separation of concerns with repository and service layers

## 🚀 Getting Started

### Prerequisites

- Node.js v18+
- PostgreSQL 12+
- npm or yarn

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/your-username/nurser.git
   cd nurser
2. Install Dependencies
   ```
   npm install
3. Database Setup

   Create a new PostgreSQL database:
   ```
   createdb nurser_db
4. Configuration
   Copy the example environment file:
   ```
   cp .env.example .env
Edit .env with your credentials:

    DATABASE_URL=postgres://username:password@localhost:5432/nurser_db
    PORT=3000
🚀 Running the Application

Start the development server:

    npm start

🏗️ Project Structure

      src/
      ├── db.ts            # Database connection setup
      ├── repositories.ts  # Data access operations
      ├── schema.ts        # Data models and validation
      ├── services.ts      # Business logic
      └── server.ts        # HTTP server configuration

## 🤝 Contributing

#### We welcome contributions! Here's how:

- Fork the repository
- Clone your fork
- Create a feature branch:
  ```
  git checkout -b your-feature

- Commit your changes:
  ```
  git commit -m 'Add amazing feature'

- Push to your branch:
  ```
  git push origin feature/your-feature

- Open a Pull Request

### Contribution Guidelines

    Follow existing code style

    Write clear commit messages

    Include relevant tests

    Update documentation when needed

## 🛠️ Development Setup

### Code Style

We use:

    TypeScript strict mode

    Prettier for formatting

    ESLint for code quality

Format your code before committing:

    npm run format

#### Linting

Check for code quality issues:

    npm run lint
