require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer'); // Import Nodemailer

const app = express();

// --- Middleware ---
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json({ limit: '50mb' }));

// --- Database Connection Pool ---
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});


// --- Nodemailer Transporter for sending emails ---
// This uses your Gmail account credentials from the .env file
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, // Your Gmail address from .env
        pass: process.env.EMAIL_PASS, // Your Gmail App Password from .env
    },
});


// --- JWT Authentication Middleware ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Access token required.' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token.' });
    }
    req.user = user;
    next();
  });
};

// --- API Endpoints ---

/**
 * @route   POST /api/register
 * @desc    Register a new user (For admin creating users under their company)
 * @access  Protected (admin only)
 */
app.post('/api/register', authenticateToken, async (req, res) => {
  // Only admins can create new users
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only admins can create new users.' });
  }

  const { email, firstName, lastName, password } = req.body;
  if (!email || !firstName || !password) {
    return res.status(400).json({ message: 'Please provide email, first name, and password.' });
  }

  try {
    const name = `${firstName} ${lastName}`.trim();
    
    // Get the admin's company information
    const [adminCompany] = await pool.query(
      'SELECT company_name FROM companies WHERE id = ?',
      [req.user.id]
    );

    if (!adminCompany.length) {
      return res.status(400).json({ message: 'Admin company information not found.' });
    }

    const companyName = adminCompany[0].company_name;

    // Create the new user with 'host' role and company name
    const [userResult] = await pool.query(
      'INSERT INTO users (name, email, password, role, company_name) VALUES (?, ?, ?, ?, ?)',
      [name, email, password, 'host', companyName]
    );

    // Create company record for the new user linked to the admin's company
    await pool.query(
      'INSERT INTO companies (id, firstname, lastname, email, password, role, company_name, created_at, admin_company_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [userResult.insertId, firstName, lastName, email, password, 'host', companyName, new Date(), req.user.id]
    );

    res.status(201).json({ 
      id: userResult.insertId, 
      name, 
      email, 
      role: 'host',
      company_name: companyName
    });
  } catch (error) {
    // Handle case where email already exists
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }
    console.error('Registration Error:', error);
    res.status(500).json({ message: 'Server error during registration.' });
  }
});

/**
 * @route   POST /api/registerCompany
 * @desc    Register a new user and their company (New endpoint)
 * @access  Public
 */
app.post('/api/registerCompany', async (req, res) => {
    // Destructure all fields from the registration form body
    const { email, firstName, lastName, password, companyName, mobileNumber } = req.body;

    // Validate that all required fields are present
    if (!email || !firstName || !password || !companyName) {
        return res.status(400).json({ message: 'Please provide email, first name, password, and company name.' });
    }

    // Get a connection from the pool to handle the transaction
    const connection = await pool.getConnection();

    try {
        // Start a database transaction to ensure data integrity across two tables
        await connection.beginTransaction();

        // 1. Insert the new user into the 'users' table
        const name = `${firstName} ${lastName}`.trim();
        // New users are given the 'admin' role by default
        const [userResult] = await connection.query(
            'INSERT INTO users (name, email, password, role, company_name) VALUES (?, ?, ?, ?, ?)',
            [name, email, password, 'admin', companyName]
        );
        const userId = userResult.insertId;

        // 2. Insert the new company into the 'companies' table, linking it to the user
        // CORRECTED: The columns now match the values being provided.
        await connection.query(
            'INSERT INTO companies (id, firstname,lastname, email, password, role, company_name, mobile_number, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [userId, firstName,lastName, email, password, 'admin', companyName, mobileNumber || null, new Date()]
        );

        // If both inserts are successful, commit the transaction
        await connection.commit();



         // --- 3. Send Verification Email ---
        const verificationToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '1d' });
        const verificationLink = `http://localhost:4000/api/verify-email?token=${verificationToken}`;

        const mailOptions = {
          from: `"Visitor Management System" <${process.env.EMAIL_USER}>`,
          to: email,
          subject: 'Welcome! Please Verify Your Email Address',
          html: `
            <div style="font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f7f7f7;">
              <div style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); padding: 40px;">
                <div style="text-align: center; margin-bottom: 20px;">
                  <h1 style="color: #1a3c7a; font-size: 24px; margin: 0;">Welcome to Visitor Management System</h1>
                </div>
                <div style="padding: 20px; background-color: #f9f9f9; border-radius: 6px;">
                  <p style="font-size: 16px; margin: 0 0 15px;">Hello ${firstName},</p>
                  <p style="font-size: 16px; margin: 0 0 25px;">Thank you for registering with us! To get started, please verify your email address by clicking the button below.</p>
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${verificationLink}" style="background-color: #007bff; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold; display: inline-block; transition: background-color 0.3s;">Verify Your Email</a>
                  </div>
                  <p style="font-size: 14px; color: #666666; margin: 0 0 15px;">If the button doesn't work, copy and paste this link into your browser:</p>
                  <p style="font-size: 14px; word-break: break-all; margin: 0 0 25px;"><a href="${verificationLink}" style="color: #007bff; text-decoration: none;">${verificationLink}</a></p>
                  <p style="font-size: 14px; color: #666666; margin: 0;">If you didn't create this account, you can safely ignore this email.</p>
                </div>
                <div style="text-align: center; margin-top: 30px; font-size: 12px; color: #999999;">
                  <p style="margin: 0;">Visitor Management System &copy; ${new Date().getFullYear()}</p>
                  <p style="margin: 5px 0 0;">Questions? Contact us at <a href="mailto:support@vms.com" style="color: #007bff; text-decoration: none;">support@vms.com</a></p>
                </div>
              </div>
            </div>
          `
        };

        await transporter.sendMail(mailOptions);
        console.log('Verification email sent successfully to:', email);
        
        // --- End of Email Sending ---


        // Send a success response back to the client
        res.status(201).json({ id: userId, name, email, role: 'host', companyName });

    } catch (error) {
        // If any error occurs during the transaction, roll it back
        await connection.rollback();

        // Handle the specific error for a duplicate email address
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'An account with this email already exists.' });
        }

        // Log the full error for debugging purposes
        console.error('Registration Error:', error);
        // Send a generic server error message
        res.status(500).json({ message: 'Server error during registration.' });

    } finally {
        // IMPORTANT: Always release the database connection back to the pool
        connection.release();
    }
});

/**
 * @route   GET /api/verify-email
 * @desc    Verifies the user's email address using the token.
 * @access  Public
 */
app.get('/api/verify-email', async (req, res) => {
    const { token } = req.query;
    if (!token) {
        return res.status(400).send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Email Verification Error</title>
                <style>
                    body {
                        font-family: 'Roboto', Arial, sans-serif;
                        background-color: #f4f7fa;
                        margin: 0;
                        padding: 0;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        min-height: 100vh;
                        color: #333333;
                    }
                    .container {
                        max-width: 500px;
                        background: #ffffff;
                        border-radius: 10px;
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                        padding: 40px;
                        text-align: center;
                    }
                    h1 {
                        color: #c53030;
                        font-size: 28px;
                        margin-bottom: 20px;
                    }
                    p {
                        font-size: 16px;
                        color: #4a5568;
                        margin-bottom: 30px;
                        line-height: 1.5;
                    }
                    .btn {
                        display: inline-block;
                        background-color: #3b82f6;
                        color: #ffffff;
                        padding: 12px 30px;
                        text-decoration: none;
                        border-radius: 50px;
                        font-size: 16px;
                        font-weight: 500;
                        transition: background-color 0.3s ease;
                    }
                    .btn:hover {
                        background-color: #2563eb;
                    }
                    .footer {
                        margin-top: 20px;
                        font-size: 12px;
                        color: #718096;
                    }
                    .footer a {
                        color: #3b82f6;
                        text-decoration: none;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Verification Failed</h1>
                    <p>Verification token is missing. Please check the link or request a new verification email.</p>
                    <a href="/request-new-verification" class="btn">Request New Link</a>
                    <div class="footer">
                        <p>Need help? Contact us at <a href="mailto:support@vms.com">support@vms.com</a></p>
                        <p>&copy; ${new Date().getFullYear()} Visitor Management System</p>
                    </div>
                </div>
            </body>
            </html>
        `);
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;

        // Update the user in the database to mark them as verified.
        await pool.query('UPDATE users SET is_verified = ? WHERE id = ?', [true, userId]);

        // Serve the success page
        res.send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Email Verification Success</title>
                <style>
                    body {
                        font-family: 'Roboto', Arial, sans-serif;
                        background-color: #f4f7fa;
                        margin: 0;
                        padding: 0;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        min-height: 100vh;
                        color: #333333;
                    }
                    .container {
                        max-width: 500px;
                        background: #ffffff;
                        border-radius: 10px;
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                        padding: 40px;
                        text-align: center;
                    }
                    h1 {
                        color: #2c5282;
                        font-size: 28px;
                        margin-bottom: 20px;
                    }
                    p {
                        font-size: 16px;
                        color: #4a5568;
                        margin-bottom: 30px;
                        line-height: 1.5;
                    }
                    .btn {
                        display: inline-block;
                        background-color: #3b82f6;
                        color: #ffffff;
                        padding: 12px 30px;
                        text-decoration: none;
                        border-radius: 50px;
                        font-size: 16px;
                        font-weight: 500;
                        transition: background-color 0.3s ease;
                    }
                    .btn:hover {
                        background-color: #2563eb;
                    }
                    .footer {
                        margin-top: 20px;
                        font-size: 12px;
                        color: #718096;
                    }
                    .footer a {
                        color: #3b82f6;
                        text-decoration: none;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Email Verified Successfully!</h1>
                    <p>Your email has been verified, and your account is now active. You can now log in to the Visitor Management System and start exploring.</p>
                    <a href="http://localhost:3000/login" class="btn">Go to Login</a>
                    <div class="footer">
                        <p>Need help? Contact us at <a href="mailto:support@vms.com">support@vms.com</a></p>
                        <p>&copy; ${new Date().getFullYear()} Visitor Management System</p>
                    </div>
                </div>
            </body>
            </html>
        `);

    } catch (error) {
        console.error('Email verification error:', error);
        res.status(400).send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Email Verification Error</title>
                <style>
                    body {
                        font-family: 'Roboto', Arial, sans-serif;
                        background-color: #f4f7fa;
                        margin: 0;
                        padding: 0;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        min-height: 100vh;
                        color: #333333;
                    }
                    .container {
                        max-width: 500px;
                        background: #ffffff;
                        border-radius: 10px;
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                        padding: 40px;
                        text-align: center;
                    }
                    h1 {
                        color: #c53030;
                        font-size: 28px;
                        margin-bottom: 20px;
                    }
                    p {
                        font-size: 16px;
                        color: #4a5568;
                        margin-bottom: 30px;
                        line-height: 1.5;
                    }
                    .btn {
                        display: inline-block;
                        background-color: #3b82f6;
                        color: #ffffff;
                        padding: 12px 30px;
                        text-decoration: none;
                        border-radius: 50px;
                        font-size: 16px;
                        font-weight: 500;
                        transition: background-color 0.3s ease;
                    }
                    .btn:hover {
                        background-color: #2563eb;
                    }
                    .footer {
                        margin-top: 20px;
                        font-size: 12px;
                        color: #718096;
                    }
                    .footer a {
                        color: #3b82f6;
                        text-decoration: none;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Verification Failed</h1>
                    <p>The verification link is invalid or has expired. Please request a new verification email.</p>
                    <a href="/request-new-verification" class="btn">Request New Link</a>
                    <div class="footer">
                        <p>Need help? Contact us at <a href="mailto:support@vms.com">support@vms.com</a></p>
                        <p>&copy; ${new Date().getFullYear()} Visitor Management System</p>
                    </div>
                </div>
            </body>
            </html>
        `);
    }
});



/**
 * @route   POST /api/login
 * @desc    Authenticate a user and get a token
 * @access  Public
 */
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    const user = rows[0];

    // Note: Passwords should be hashed in a real application.
    if (!user || user.password !== password) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Skip email verification for users with the 'host' role
    if (user.role !== 'host' && !user.is_verified) {
      return res.status(403).json({ message: 'Please verify your email address before logging in.' });
    }

    // Company name is now directly available in the users table
    const companyInfo = user.company_name || null;

    // Create a JWT with user ID and role, expiring in 1 day
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({
      token,
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        role: user.role,
        company_name: companyInfo
      }
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Server error during login.' });
  }
});



/**
 * @route   POST /api/visits
 * @desc    Create a new visit (Check-In) by always creating a new visitor record.
 * @access  Protected (admin or host)
 */
app.post('/api/visits', authenticateToken, async (req, res) => {
    // Destructure all fields from the request body
    const {
        name, email, phone, designation, company, companyTel, website, address,
        hostName, reason, itemsCarried, photo, idCardPhoto, idCardNumber
    } = req.body;

    if (!name || !email || !hostName || !idCardNumber) {
        return res.status(400).json({ message: 'Missing required fields for check-in.' });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        let host_id;

        if (req.user.role === 'host') {
            // If the logged-in user is a host, they can only check in visitors for themselves
            const [hostUser] = await connection.query("SELECT name FROM users WHERE id = ?", [req.user.id]);
            if (hostUser.length === 0 || hostUser[0].name.toLowerCase() !== hostName.toLowerCase()) {
                await connection.rollback();
                return res.status(403).json({ message: 'Hosts can only check in visitors for themselves.' });
            }
            host_id = req.user.id;
        } else if (req.user.role === 'admin') {
            // If the logged-in user is an admin, find the host within their company
            const [adminUser] = await connection.query(
                'SELECT company_name FROM users WHERE id = ?',
                [req.user.id]
            );

            if (!adminUser.length || !adminUser[0].company_name) {
                await connection.rollback();
                return res.status(400).json({ message: 'Admin company information not found.' });
            }

            const adminCompanyName = adminUser[0].company_name;

            // Find the host by name within the admin's company
            const [hostRows] = await connection.query(`
                SELECT u.id 
                FROM users u
                WHERE u.name = ? 
                  AND u.role = 'host' 
                  AND u.company_name = ?
            `, [hostName, adminCompanyName]);

            if (hostRows.length === 0) {
                await connection.rollback();
                return res.status(404).json({ message: 'Host not found in your company.' });
            }

            host_id = hostRows[0].id;
        } else {
            await connection.rollback();
            return res.status(403).json({ message: 'Unauthorized access.' });
        }

        // Get the company name of the host to check for same-company active visits
        const [hostCompanyInfo] = await connection.query(
            'SELECT company_name FROM users WHERE id = ?',
            [host_id]
        );

        if (!hostCompanyInfo.length) {
            await connection.rollback();
            return res.status(400).json({ message: 'Host company information not found.' });
        }

        const hostCompanyName = hostCompanyInfo[0].company_name;

        // Check for an active visit using the VISITOR'S EMAIL within the SAME COMPANY only
        const [activeVisits] = await connection.query(
           `SELECT v.id FROM visits v
            JOIN visitors vis ON v.visitor_id = vis.id
            JOIN users h ON v.host_id = h.id
            WHERE vis.email = ? AND v.check_out_time IS NULL AND h.company_name = ?`,
           [email, hostCompanyName]
        );

        if (activeVisits.length > 0) {
            // If an active visit for this email exists in the same company, prevent check-in.
            await connection.rollback();
            return res.status(409).json({ message: `This visitor is already checked in to ${hostCompanyName} and has not checked out yet. Please check out first before checking in again to the same company.` });
        }

        // Always insert a new record into the 'visitors' table for this visit.
        const [newVisitorResult] = await connection.query(
            `INSERT INTO visitors 
              (name, email, phone, designation, company, companyTel, website, address, photo, idCardPhoto, idCardNumber) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                name, email, phone, designation, company, companyTel, website, address,
                photo, idCardPhoto, idCardNumber
            ]
        );
        const visitor_id = newVisitorResult.insertId;

        // Insert the new visit record, linking it to the newly created visitor record.
        const check_in_time = new Date();
        const [newVisitResult] = await connection.query(
            'INSERT INTO visits (visitor_id, host_id, reason, itemsCarried, check_in_time) VALUES (?, ?, ?, ?, ?)',
            [visitor_id, host_id, reason, itemsCarried, check_in_time]
        );

        await connection.commit();
        res.status(201).json({ message: 'Check-in successful!', visitId: newVisitResult.insertId });

    } catch (error) {
        await connection.rollback();
        console.error('Check-in error:', error);
        res.status(500).json({ message: 'Database transaction failed.', error: error.message });
    } finally {
        connection.release();
    }
});



/**
 * @route   GET /api/visits
 * @desc    Get all visits with filtering (admin only) - filtered by admin's company
 * @access  Protected (admin only)
 */
app.get('/api/visits', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required.' });
  }

  const { hostId, startDate, endDate, hostName, visitorName } = req.query;

  try {
    // First, get the admin's company name from users table
    const [adminUser] = await pool.query(
      'SELECT company_name FROM users WHERE id = ?',
      [req.user.id]
    );

    if (!adminUser.length || !adminUser[0].company_name) {
      return res.status(400).json({ message: 'Admin company information not found.' });
    }

    const adminCompanyName = adminUser[0].company_name;

    // Build the query to get visits only from hosts in the same company
    let query = `
      SELECT DISTINCT
        v.id, v.reason, v.itemsCarried, v.check_in_time, v.check_out_time,
        vis.id AS visitor_id, vis.name AS visitorName, vis.email AS visitorEmail, vis.phone AS visitorPhone, 
        vis.designation, vis.company, vis.photo AS visitorPhoto, vis.idCardPhoto, vis.idCardNumber,
        h.id AS host_id, h.name AS hostName, h.company_name AS hostCompany
      FROM visits v
      JOIN visitors vis ON v.visitor_id = vis.id
      JOIN users h ON v.host_id = h.id
      WHERE h.company_name = ?
    `;
    const params = [adminCompanyName];
    const conditions = [];

    if (hostId) {
      conditions.push('v.host_id = ?');
      params.push(hostId);
    }
    if (startDate) {
      conditions.push('DATE(v.check_in_time) >= ?');
      params.push(startDate);
    }
    if (endDate) {
      conditions.push('DATE(v.check_in_time) <= ?');
      params.push(endDate);
    }
    if (hostName) {
      conditions.push('h.name LIKE ?');
      params.push(`%${hostName}%`);
    }
    if (visitorName) {
      conditions.push('vis.name LIKE ?');
      params.push(`%${visitorName}%`);
    }

    if (conditions.length) {
      query += ' AND ' + conditions.join(' AND ');
    }
    query += ' ORDER BY v.check_in_time DESC';

    const [visits] = await pool.query(query, params);
    res.json(visits);
  } catch (error) {
    console.error('Fetch visits error:', error);
    res.status(500).json({ message: 'Failed to fetch visits.' });
  }
});

/**
 * @route   GET /api/host-visits
 * @desc    Get visits for the authenticated host
 * @access  Protected (host only)
 */
app.get('/api/host-visits', authenticateToken, async (req, res) => {
  if (req.user.role !== 'host') {
    return res.status(403).json({ message: 'Host access required.' });
  }

  const hostId = req.user.id;

  let query = `
    SELECT
      v.id, v.reason, v.itemsCarried, v.check_in_time, v.check_out_time,
      vis.id AS visitor_id, vis.name AS visitorName, vis.email AS visitorEmail, vis.phone AS visitorPhone,
      vis.designation, vis.company, vis.photo AS visitorPhoto, vis.idCardPhoto, vis.idCardNumber,
      h.id AS host_id, h.name AS hostName
    FROM visits v
    JOIN visitors vis ON v.visitor_id = vis.id
    JOIN users h ON v.host_id = h.id
    WHERE v.host_id = ?
    ORDER BY v.check_in_time DESC
  `;

  try {
    const [visits] = await pool.query(query, [hostId]);
    res.json(visits);
  } catch (error) {
    console.error('Fetch host visits error:', error);
    res.status(500).json({ message: 'Failed to fetch visits.' });
  }
});

/**
 * @route   PUT /api/visits/:id/checkout
 * @desc    Check out a visitor
 * @access  Protected (admin or host)
 */
app.put('/api/visits/:id/checkout', authenticateToken, async (req, res) => {
  const { id } = req.params;
  
  if (req.user.role === 'host') {
    const [visitRows] = await pool.query('SELECT host_id FROM visits WHERE id = ?', [id]);
    if (visitRows.length === 0 || visitRows[0].host_id !== req.user.id) {
      return res.status(403).json({ message: 'Hosts can only check out their own visitors.' });
    }
  }

  const check_out_time = new Date();
  try {
    const [result] = await pool.query(
      'UPDATE visits SET check_out_time = ? WHERE id = ? AND check_out_time IS NULL',
      [check_out_time, id]
    );
    if (result.affectedRows > 0) {
      res.json({ message: 'Check-out successful.' });
    } else {
      res.status(404).json({ message: 'Visit not found or visitor already checked out.' });
    }
  } catch (error) {
    console.error('Check-out error:', error);
    res.status(500).json({ message: 'Failed to check out visitor.' });
  }
});

/**
 * @route   GET /api/users
 * @desc    Get all users from admin's company (for admin dashboard)
 * @access  Protected (admin only)
 */
app.get('/api/users', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required.' });
  }
  try {
    // First, get the admin's company name from users table
    const [adminUser] = await pool.query(
      'SELECT company_name FROM users WHERE id = ?',
      [req.user.id]
    );

    if (!adminUser.length || !adminUser[0].company_name) {
      return res.status(400).json({ message: 'Admin company information not found.' });
    }

    const adminCompanyName = adminUser[0].company_name;

    // Get users that belong to the same company as the admin
    const [users] = await pool.query(`
      SELECT u.id, u.name, u.email, u.role, u.company_name 
      FROM users u
      WHERE u.company_name = ?
      ORDER BY u.role, u.name
    `, [adminCompanyName]);
    res.json(users);
  } catch (error) {
    console.error('Fetch users error:', error);
    res.status(500).json({ message: 'Failed to fetch users.' });
  }
});

/**
 * @route   GET /api/hosts
 * @desc    Get all hosts from the current user's company (for dropdown in visitor check-in)
 * @access  Protected (admin or host)
 */
app.get('/api/hosts', authenticateToken, async (req, res) => {
  try {
    let companyName;
    
    if (req.user.role === 'admin') {
      // Get the admin's company name from users table
      const [adminUser] = await pool.query(
        'SELECT company_name FROM users WHERE id = ?',
        [req.user.id]
      );
      
      if (!adminUser.length || !adminUser[0].company_name) {
        return res.status(400).json({ message: 'Admin company information not found.' });
      }
      
      companyName = adminUser[0].company_name;
      
      // Get all hosts from the same company
      const [hosts] = await pool.query(`
        SELECT u.id, u.name, u.email, u.company_name 
        FROM users u
        WHERE u.role = 'host' AND u.company_name = ?
        ORDER BY u.name
      `, [companyName]);
      
      res.json(hosts);
    } else if (req.user.role === 'host') {
      // For hosts, only return themselves
      const [hostUser] = await pool.query(`
        SELECT u.id, u.name, u.email, u.company_name 
        FROM users u
        WHERE u.id = ?
      `, [req.user.id]);
      
      res.json(hostUser);
    } else {
      return res.status(403).json({ message: 'Access denied.' });
    }
  } catch (error) {
    console.error('Fetch hosts error:', error);
    res.status(500).json({ message: 'Failed to fetch hosts.' });
  }
});

// --- Start Server ---
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend server running on http://localhost:${PORT}`));
