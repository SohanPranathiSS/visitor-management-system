-- Updated database schema with proper company filtering
-- Run this to ensure your database has the correct structure

USE vms_db;

-- Check if companies table exists, if not create it
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

-- Remove unique constraint on visitors email if it exists
-- (We need to allow duplicate emails since each visit creates a new visitor record)
DROP INDEX IF EXISTS email ON visitors;

-- Add is_verified column to users table if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_companies_company_name ON companies(company_name);
CREATE INDEX IF NOT EXISTS idx_companies_admin_company_id ON companies(admin_company_id);
CREATE INDEX IF NOT EXISTS idx_visits_check_in_time ON visits(check_in_time);
CREATE INDEX IF NOT EXISTS idx_visits_host_id ON visits(host_id);

-- Sample data for testing (optional)
-- Insert a test admin company
INSERT IGNORE INTO users (id, name, email, password, role, is_verified) VALUES 
(999, 'Test Admin', 'admin@testcompany.com', 'password123', 'admin', TRUE);

INSERT IGNORE INTO companies (id, firstname, lastname, email, password, role, company_name, mobile_number, created_at) VALUES 
(999, 'Test', 'Admin', 'admin@testcompany.com', 'password123', 'admin', 'Test Company Inc', '1234567890', NOW());

-- Insert a test host under the same company
INSERT IGNORE INTO users (id, name, email, password, role, is_verified) VALUES 
(998, 'Test Host', 'host@testcompany.com', 'password123', 'host', TRUE);

INSERT IGNORE INTO companies (id, firstname, lastname, email, password, role, company_name, admin_company_id, created_at) VALUES 
(998, 'Test', 'Host', 'host@testcompany.com', 'password123', 'host', 'Test Company Inc', 999, NOW());

SELECT 'Database schema updated successfully!' as message;
