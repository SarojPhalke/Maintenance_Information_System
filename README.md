# MIS Project 1

This repository contains a full-stack Maintenance Information System (MIS) project with a React frontend (PWA) and a Node.js backend.

## Project Structure

```
MIS_Project1/
├── mis-pwa/        # Frontend (React, Vite, Tailwind)
├── server/         # Backend (Node.js, Express)
├── MIS_SRS.pdf     # System Requirements Specification
├── SRS.ini         # Configuration file
```

## Getting Started

### Prerequisites
- Node.js (v18 or above recommended)
- npm


Create a .env file in server folder 
SUPABASE_URL=url
SUPABASE_SERVICE_ROLE_KEY=key
SUPABASE_ANON_KEY=key
PORT=5000

.env folder in mis-pwa:
VITE_API_URL=http://localhost:5000

### 1. Install Dependencies

#### Frontend
```powershell
cd mis-pwa
npm install
```

#### Backend
```powershell
cd server
npm install
```

### 2. Run the Project

#### Start Frontend
```powershell
cd mis-pwa
npm run dev
```
- Open the URL shown in the terminal (e.g., http://localhost:5173) in your browser.

#### Start Backend
```powershell
cd server
npm start
```
- The backend will run on the port specified in your server configuration (commonly http://localhost:3000).

### 3. Database
- The `db/schema1.sql` file contains the database schema. Set up your database using this file as needed.

### 4. Configuration
- Update environment variables and configuration files as required for your setup.

## Notes
- Supabase integration is present in the code but not required for initial setup. Comment out or mock Supabase-related code if not using it.
- For troubleshooting, check the browser console and terminal output for errors.

## License
This project is for educational and internal use.


