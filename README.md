# Visitor Management System - Database Setup

This project has been updated to use a MySQL database instead of localStorage for data persistence.

## Prerequisites

1. **MySQL Server** - Make sure MySQL is installed and running on your system
2. **Node.js** - Version 14 or higher
3. **npm** - Comes with Node.js

## Database Setup Instructions

### Step 1: Configure Environment Variables

1. Navigate to the `Backend` folder
2. Update the `.env` file with your MySQL credentials:

```env
DB_HOST=localhost
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=vms_db
JWT_SECRET=your_jwt_secret_key_here
PORT=4000
```

### Step 2: Install Dependencies

```bash
cd Backend
npm install
```

### Step 3: Setup Database

Run the database setup script to create the database and tables:

```bash
npm run setup-db
```

This will:
- Create the `vms_db` database
- Create all necessary tables (users, visitors, visits)
- Insert sample data including default admin and host users

### Step 4: Start the Backend Server

```bash
npm run dev
```

The server will start on `http://localhost:4000`

### Step 5: Start the Frontend

In a new terminal:

```bash
cd Frontend
npm install
npm start
```

The frontend will start on `http://localhost:3000`

## Default Login Credentials

After running the database setup, you can log in with these default accounts:

- **Admin**: admin@vms.com / admin123
- **Host**: john@company.com / password123
- **Host**: jane@company.com / password123

## Database Schema

The system uses three main tables:

### Users Table
- Stores admin and host user accounts
- Fields: id, name, email, password (hashed), role, timestamps

### Visitors Table
- Stores visitor information
- Fields: id, name, email, phone, photo, idCardPhoto, idCardNumber, timestamps

### Visits Table
- Stores check-in/check-out records
- Fields: id, visitor_id, host_id, reason, itemsCarried, check_in_time, check_out_time, timestamps

## API Endpoints

- `POST /api/register` - Register new user
- `POST /api/login` - User login
- `POST /api/visits` - Check-in visitor
- `GET /api/visits` - Get all visits (with filtering)
- `PUT /api/visits/:id/checkout` - Check-out visitor
- `GET /api/users` - Get all users

## Features Implemented

✅ **Database Integration**: Full MySQL database integration
✅ **User Authentication**: JWT-based authentication
✅ **Visitor Check-in**: Camera capture, ID card scanning, OCR integration
✅ **Visit Management**: Check-in/check-out tracking
✅ **Role-based Access**: Admin and Host roles
✅ **Photo Storage**: Base64 image storage in database
✅ **Data Persistence**: All data stored in MySQL database

## Troubleshooting

### Common Issues:

1. **Database Connection Error**
   - Make sure MySQL server is running
   - Check your credentials in the `.env` file
   - Ensure the database user has proper permissions

2. **Port Already in Use**
   - Make sure no other application is using port 4000
   - Change the PORT in `.env` file if needed

3. **CORS Issues**
   - The backend is configured to allow all origins
   - Make sure the frontend is making requests to the correct backend URL

### Need Help?

If you encounter any issues:
1. Check the console logs for error messages
2. Verify your MySQL connection
3. Ensure all dependencies are installed
4. Check that the database schema was created successfully
