// Database setup script
// Run this file with: node setup-database.js

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function setupDatabase() {
  let connection;
  
  try {
    // First connect without specifying the database to create it
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
    });

    console.log('✅ Connected to MySQL server');

    // Create database if it doesn't exist
    await connection.execute(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'vms_db'}`);
    console.log(`✅ Database '${process.env.DB_NAME || 'vms_db'}' created or already exists`);

    // Close the connection and reconnect to the specific database
    await connection.end();

    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'vms_db',
    });

    console.log(`✅ Connected to database '${process.env.DB_NAME || 'vms_db'}'`);

    // Read and execute SQL schema
    const schemaPath = path.join(__dirname, 'database_schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Split the schema into individual statements
    const statements = schema.split(';').filter(stmt => stmt.trim() !== '');
    
    for (const statement of statements) {
      if (statement.trim()) {
        await connection.execute(statement);
      }
    }

    console.log('✅ Database schema created successfully');
    console.log('✅ Sample data inserted');
    console.log('\n🎉 Database setup completed!');
    console.log('\nDefault login credentials:');
    console.log('Admin: admin@vms.com / admin123');
    console.log('Host: john@company.com / password123');
    console.log('Host: jane@company.com / password123');

  } catch (error) {
    console.error('❌ Error setting up database:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the setup
setupDatabase();
