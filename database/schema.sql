CREATE DATABASE IF NOT EXISTS VSP;
USE VSP;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS password_otps;
DROP TABLE IF EXISTS leave_requests;
DROP TABLE IF EXISTS attendance;
DROP TABLE IF EXISTS salary;
DROP TABLE IF EXISTS dependant_requests;
DROP TABLE IF EXISTS dependants;
DROP TABLE IF EXISTS relation_master;
DROP TABLE IF EXISTS hr_contact_info;
DROP TABLE IF EXISTS hr_login;
DROP TABLE IF EXISTS hr;
DROP TABLE IF EXISTS employee_login;
DROP TABLE IF EXISTS contact_info;
DROP TABLE IF EXISTS employees;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE employees (
    employee_id INT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    gender VARCHAR(10),
    dob DATE,
    department VARCHAR(50) NOT NULL,
    role VARCHAR(50) DEFAULT 'Employee'
);

CREATE TABLE contact_info (
    employee_id INT PRIMARY KEY,
    phone VARCHAR(15),
    email VARCHAR(100) NOT NULL,
    address_line1 VARCHAR(150),
    address_line2 VARCHAR(150),
    city VARCHAR(50),
    state VARCHAR(100),
    pincode VARCHAR(10),
    country VARCHAR(50),
    CONSTRAINT fk_contact_employee
        FOREIGN KEY (employee_id)
        REFERENCES employees(employee_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE employee_login (
    employee_id INT PRIMARY KEY,
    password_hash VARCHAR(255) NOT NULL,
    must_reset_password BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_employee_login
        FOREIGN KEY (employee_id)
        REFERENCES employees(employee_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE hr (
    hr_id INT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    gender VARCHAR(10),
    dob DATE,
    department VARCHAR(50) NOT NULL,
    role VARCHAR(50) DEFAULT 'HR'
);

CREATE TABLE hr_contact_info (
    hr_id INT PRIMARY KEY,
    phone VARCHAR(15),
    email VARCHAR(100) NOT NULL,
    address_line1 VARCHAR(150),
    address_line2 VARCHAR(150),
    city VARCHAR(50),
    state VARCHAR(100),
    pincode VARCHAR(10),
    country VARCHAR(50),
    CONSTRAINT fk_hr_contact
        FOREIGN KEY (hr_id)
        REFERENCES hr(hr_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE hr_login (
    hr_id INT PRIMARY KEY,
    password_hash VARCHAR(255) NOT NULL,
    must_reset_password BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_hr_login
        FOREIGN KEY (hr_id)
        REFERENCES hr(hr_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE relation_master (
    relation_id INT PRIMARY KEY,
    relation_name VARCHAR(50) NOT NULL UNIQUE
);

INSERT INTO relation_master (relation_id, relation_name) VALUES
(1, 'Spouse'),
(2, 'Father'),
(3, 'Mother'),
(4, 'Father In Law'),
(5, 'Mother In Law'),
(11, 'Child 1'),
(12, 'Child 2'),
(23, 'Sibling 1'),
(24, 'Sibling 2');

CREATE TABLE dependants (
    dependant_id BIGINT PRIMARY KEY,
    employee_id INT NOT NULL,
    dependant_name VARCHAR(100) NOT NULL,
    relation_id INT NOT NULL,
    gender VARCHAR(10),
    dob DATE NOT NULL,
    CONSTRAINT uq_employee_relation
        UNIQUE (employee_id, relation_id),
    CONSTRAINT fk_dependant_employee
        FOREIGN KEY (employee_id)
        REFERENCES employees(employee_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_dependant_relation
        FOREIGN KEY (relation_id)
        REFERENCES relation_master(relation_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

CREATE TABLE dependant_requests (
    request_id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    dependant_name VARCHAR(100) NOT NULL,
    relation_id INT NOT NULL,
    gender VARCHAR(10),
    dob DATE NOT NULL,
    status ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    request_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP NULL,
    processed_by INT NULL,
    remarks VARCHAR(255) NULL,
    CONSTRAINT fk_dependant_request_employee
        FOREIGN KEY (employee_id)
        REFERENCES employees(employee_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_dependant_request_relation
        FOREIGN KEY (relation_id)
        REFERENCES relation_master(relation_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT fk_dependant_request_hr
        FOREIGN KEY (processed_by)
        REFERENCES hr(hr_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

CREATE TABLE attendance (
    attendance_id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    month ENUM(
        'Jan','Feb','Mar','Apr','May','Jun',
        'Jul','Aug','Sep','Oct','Nov','Dec'
    ) NOT NULL,
    year YEAR NOT NULL,
    total_working_days INT NOT NULL,
    casual_leave INT NOT NULL DEFAULT 0,
    sick_leave INT NOT NULL DEFAULT 0,
    other_leave INT NOT NULL DEFAULT 0,
    days_present INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_employee_attendance
        UNIQUE (employee_id, month, year),
    CONSTRAINT fk_attendance_employee_id
        FOREIGN KEY (employee_id)
        REFERENCES employees(employee_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE leave_requests (
    leave_id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    leave_date DATE NOT NULL,
    leave_type ENUM('CL', 'SL', 'OL') NOT NULL,
    description VARCHAR(100),
    status ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    remark VARCHAR(255),
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP NULL,
    processed_by INT NULL,
    CONSTRAINT fk_leave_employee
        FOREIGN KEY (employee_id)
        REFERENCES employees(employee_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_leave_hr
        FOREIGN KEY (processed_by)
        REFERENCES hr(hr_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

CREATE TABLE salary (
    salary_id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    year YEAR NOT NULL,
    month ENUM(
        'Jan','Feb','Mar','Apr','May','Jun',
        'Jul','Aug','Sep','Oct','Nov','Dec'
    ) NOT NULL,
    gross_pay DECIMAL(10,2) NOT NULL DEFAULT 0,
    tax DECIMAL(10,2) NOT NULL DEFAULT 0,
    other_deductions DECIMAL(10,2) NOT NULL DEFAULT 0,
    net_pay DECIMAL(10,2) NOT NULL DEFAULT 0,
    CONSTRAINT uq_employee_salary
        UNIQUE (employee_id, year, month),
    CONSTRAINT fk_salary_employee
        FOREIGN KEY (employee_id)
        REFERENCES employees(employee_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE password_otps (
    otp_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_type ENUM('EMPLOYEE', 'HR') NOT NULL,
    user_id INT NOT NULL,
    otp_hash VARCHAR(255) NOT NULL,
    expires_at DATETIME NOT NULL,
    attempts INT NOT NULL DEFAULT 0,
    used_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_otp_user (user_type, user_id),
    INDEX idx_otp_expiry (expires_at)
);