# Contract Management Application

This is a contract management application with a React frontend and Express.js backend.

## License and Usage

This software is proprietary to Bausch Health and is intended for internal use only. 
All rights reserved. Unauthorized copying, distribution, or use is strictly prohibited.

© 2025 Bausch Health. Internal contract management system.

## Prerequisites

Before running this application, make sure you have the following installed:

1. **Node.js** (version 16 or higher) - Download from https://nodejs.org/
2. **PostgreSQL** - Download from https://www.postgresql.org/download/
3. **npm** (comes with Node.js)

## Database Setup

1. Install and start PostgreSQL on your local machine
2. Create a database named `test` (or update the DB_NAME in the .env file)
3. Make sure PostgreSQL is running on port 5432 (default)
4. Update the database credentials in `my-express-api/.env` if needed

## Running the Application

### Backend (Express.js API)

1. Navigate to the backend directory:
   ```powershell
   cd my-express-api
   ```

2. Install dependencies:
   ```powershell
   npm install
   ```

3. Start the backend server:
   ```powershell
   node server.js
   ```

   The backend will be available at http://localhost:3001

### Frontend (React)

1. Open a new terminal window/tab
2. Navigate to the frontend directory:
   ```powershell
   cd Frontend
   ```

3. Install dependencies:
   ```powershell
   npm install
   ```

4. Start the development server:
   ```powershell
   npm run dev
   ```

   The frontend will be available at http://localhost:5173

## Default Test Users

The application creates test users automatically:

- **Regular User**: 
  - Email: user@test.com
  - Password: password123

- **Lawyer User**: 
  - Email: lawyer@test.com
  - Password: password123

## File Uploads

Uploaded files are stored in the `my-express-api/uploads/` directory.

## Environment Variables

### Backend (my-express-api/.env)
The backend uses environment variables for configuration. Key variables include:
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` - Database connection
- `JWT_SECRET` - JWT token secret
- `PORT` - Backend server port (default: 3001)

### Frontend (Optional)
You can create a `.env.local` file in the Frontend directory to customize:
- `VITE_API_URL` - Backend API URL (default: http://localhost:3001/api)

## Troubleshooting

1. **Database Connection Issues**: Make sure PostgreSQL is running and the credentials in `.env` are correct
2. **Port Conflicts**: If ports 3001 or 5173 are in use, you can change them in the respective configuration files
3. **Dependencies Issues**: Delete `node_modules` folders and run `npm install` again

## Project Structure

- `Frontend/` - React frontend application
- `my-express-api/` - Express.js backend API

## Preguntas

1. Visualizado por: *nombre del abogado* ¿Los usuarios tambien puede ver eso o solo los abogados?
2. ¿Se deberia crear una seccion de comentarios similar a la de "archivos adjuntos" o poner los comentarios en los archivos adjuntos
3. Como se hace el otrosi

RL Humax

