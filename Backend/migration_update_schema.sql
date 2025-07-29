-- Migration script to update the database schema for company-based user management
-- Run this script AFTER the initial database setup

USE vms_db;

-- Create companies table if it doesn't exist
CREATE TABLE IF NOT EXISTS companies (
    id INT PRIMARY KEY,
    firstname VARCHAR(255) NOT NULL,
    lastname VARCHAR(255),
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'host') NOT NULL DEFAULT 'admin',
    company_name VARCHAR(255) NOT NULL,
    mobile_number VARCHAR(20),
    admin_company_id INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (admin_company_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Add missing columns to visitors table if they don't exist
ALTER TABLE visitors 
ADD COLUMN IF NOT EXISTS designation VARCHAR(255),
ADD COLUMN IF NOT EXISTS company VARCHAR(255),
ADD COLUMN IF NOT EXISTS companyTel VARCHAR(20),
ADD COLUMN IF NOT EXISTS website VARCHAR(255),
ADD COLUMN IF NOT EXISTS address TEXT;

-- Update the unique constraint on visitors email to allow duplicates
-- (since we're creating a new visitor record for each visit)
ALTER TABLE visitors DROP INDEX email;

-- Add index for better performance on company queries
CREATE INDEX IF NOT EXISTS idx_companies_company_name ON companies(company_name);
CREATE INDEX IF NOT EXISTS idx_companies_admin_company_id ON companies(admin_company_id);

-- Show current table structures
DESCRIBE users;
DESCRIBE companies;
DESCRIBE visitors;
DESCRIBE visits;
