CREATE DATABASE VSP ;

USE VSP;
CREATE TABLE employees (
    employee_id INT(6) PRIMARY KEY,
    full_name V3ARCHAR(100) NOT NULL,
    gender VARCHAR(10),
    dob DATE,
    department VARCHAR(50),
    role VARCHAR(50)
);
select* from employees;
CREATE TABLE contact_info (
    employee_id INT(6) PRIMARY KEY,
    phone VARCHAR(10),
    email VARCHAR(100),
    address_line1 VARCHAR(150),
    address_line2 VARCHAR(150),
    city VARCHAR(50),
    state VARCHAR(100),
    pincode VARCHAR(10),
    country VARCHAR(50),
    CONSTRAINT fk_employee_contact
        FOREIGN KEY (employee_id)
        REFERENCES employees(employee_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE employee_login (
    employee_id INT(6) PRIMARY KEY,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_employee_login
        FOREIGN KEY (employee_id)
        REFERENCES employees(employee_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

INSERT INTO employees (employee_id, full_name, gender, dob, department, role) VALUES

(100001, 'Amit Sharma', 'Male', '1995-03-12', 'IT', 'Employee'),
(100002, 'Neha Verma', 'Female', '1996-07-21', 'IT', 'Employee'),
(100003, 'Rohit Singh', 'Male', '1994-11-05', 'IT', 'Employee'),

(200001, 'Suresh Kumar', 'Male', '1993-05-10', 'Finance', 'Employee'),
(200002, 'Anita Rao', 'Female', '1995-08-18', 'Finance', 'Employee'),
(200003, 'Vikram Mehta', 'Male', '1992-12-01', 'Finance', 'Employee'),

(300001, 'Ramesh Patel', 'Male', '1991-06-30', 'Electrical', 'Employee'),
(300002, 'Pooja Shah', 'Female', '1994-09-14', 'Electrical', 'Employee'),
(300003, 'Arjun Reddy', 'Male', '1993-01-25', 'Electrical', 'Employee')

INSERT INTO contact_info (employee_id, phone, email, address_line1, city, state, pincode, country) VALUES
(100001, '9000000001', 'amitsharma.it@vizagsteel.com', 'IT Block', 'Vizag', 'AP', '530001', 'India'),
(100002, '9000000002', 'nehaverma.it@vizagsteel.com', 'IT Block', 'Vizag', 'AP', '530001', 'India'),
(100003, '9000000003', 'rohitsingh.it@vizagsteel.com', 'IT Block', 'Vizag', 'AP', '530001', 'India'),

(200001, '9000000011', 'sureshkumar.finance@vizagsteel.com', 'Finance Block', 'Vizag', 'AP', '530002', 'India'),
(200002, '9000000012', 'anitarao.finance@vizagsteel.com', 'Finance Block', 'Vizag', 'AP', '530002', 'India'),
(200003, '9000000013', 'vikrammehta.finance@vizagsteel.com', 'Finance Block', 'Vizag', 'AP', '530002', 'India'),

(300001, '9000000021', 'rameshpatel.electrical@vizagsteel.com', 'Electrical Block', 'Vizag', 'AP', '530003', 'India'),
(300002, '9000000022', 'poojashah.electrical@vizagsteel.com', 'Electrical Block', 'Vizag', 'AP', '530003', 'India'),
(300003, '9000000023', 'arjunreddy.electrical@vizagsteel.com', 'Electrical Block', 'Vizag', 'AP', '530003', 'India')

INSERT INTO employee_login (employee_id, password_hash) VALUES
(100001, SHA2('100001', 256)),
(100002, SHA2('100002', 256)),
(100003, SHA2('100003', 256)),
(100004, SHA2('100004', 256)),

(200001, SHA2('200001', 256)),
(200002, SHA2('200002', 256)),
(200003, SHA2('200003', 256)),
(200004, SHA2('200004', 256)),

(300001, SHA2('300001', 256)),
(300002, SHA2('300002', 256)),
(300003, SHA2('300003', 256)),
(300004, SHA2('300004', 256));

CREATE TABLE dependants (
    dependant_id INT auto_increment PRIMARY KEY,
    employee_id INT(6) NOT NULL,
    dependant_name VARCHAR(100) NOT NULL,
    relation VARCHAR(50) NOT NULL,
    gender VARCHAR(10),
    dob DATE,
    CONSTRAINT fk_dependants_employee
        FOREIGN KEY (employee_id)
        REFERENCES employees(employee_id)
        ON DELETE CASCADE
) ;
DROP TABLE IF EXISTS dependants;

CREATE TABLE dependants (
    dependant_id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    dependant_name VARCHAR(100) NOT NULL,
    relation VARCHAR(50) NOT NULL,
    gender VARCHAR(10),
    dob DATE
);
select* from hr_table;

INSERT INTO dependants (employee_id, dependant_name, relation, gender, dob) VALUES
(100001, 'Anita Sharma', 'Spouse', 'Female', '1995-06-10'),
(100001, 'Rohan Sharma', 'Son', 'Male', '2020-03-15'),

(100002, 'Rahul Verma', 'Spouse', 'Male', '1994-02-18'),
(100002, 'Aarav Verma', 'Son', 'Male', '2019-11-22'),

(100003, 'Sneha Singh', 'Spouse', 'Female', '1993-08-25'),
(100003, 'Kavya Singh', 'Daughter', 'Female', '2021-01-10'),

(200001, 'Sunita Kumar', 'Spouse', 'Female', '1990-04-12'),
(200001, 'Amit Kumar', 'Son', 'Male', '2016-09-30'),

(200002, 'Suresh Rao', 'Spouse', 'Male', '1989-10-08'),
(200002, 'Diya Rao', 'Daughter', 'Female', '2017-05-14'),

(200003, 'Pallavi Mehta', 'Spouse', 'Female', '1991-01-20'),
(200003, 'Ishaan Mehta', 'Son', 'Male', '2019-06-03'),

(300001, 'Lata Patel', 'Spouse', 'Female', '1990-09-22'),
(300001, 'Neel Patel', 'Son', 'Male', '2015-04-18'),

(300002, 'Karan Shah', 'Spouse', 'Male', '1992-07-11'),
(300002, 'Myra Shah', 'Daughter', 'Female', '2018-02-27'),

(300003, 'Pooja Reddy', 'Spouse', 'Female', '1991-11-29'),
(300003, 'Ayaan Reddy', 'Son', 'Male', '2016-08-09')


SELECT
    e.employee_id,
    e.full_name,
    e.dob,
    c.email,
    l.password_hash
FROM employees e
JOIN contact_info c
    ON e.employee_id = c.employee_id
JOIN employee_login l
    ON e.employee_id = l.employee_id;

SELECT * FROM dependants;


CREATE TABLE hr (
    hr_id INT(6) PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    gender VARCHAR(10),
    dob DATE,
    department VARCHAR(50),
    role VARCHAR(50) DEFAULT 'hr'
);

CREATE TABLE hr_login (
    hr_id INT(6) PRIMARY KEY,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_hr_login
        FOREIGN KEY (hr_id)
        REFERENCES hr(hr_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);


INSERT INTO hr_login (hr_id, password_hash)
SELECT hr_id, SHA2(hr_id, 256)
FROM hr;

INSERT INTO hr (hr_id, full_name, gender, dob, department, role)
VALUES
(900001, 'Anita Sharma', 'Female', '1988-05-12', 'IT', 'HR'),
(900002, 'Ramesh Kumar', 'Male', '1985-09-20', 'Finance', 'HR'),
(900003, 'Suresh Reddy', 'Male', '1987-03-15', 'Electrical', 'HR');

SELECT * FROM hr;
SELECT * FROM hr_login;


CREATE TABLE dependant_requests (
    request_id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    dependant_name VARCHAR(100) NOT NULL,
    relation VARCHAR(50) NOT NULL,
    gender VARCHAR(10),
    dob DATE NOT NULL,

    status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',

    request_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_timestamp TIMESTAMP NULL,

    FOREIGN KEY (employee_id) REFERENCES employees(employee_id)
);

select* from employees

CREATE TABLE attendance (
    attendance_id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    month ENUM('Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec') NOT NULL,
    year YEAR NOT NULL,
    total_working_days INT NOT NULL,
    casual_leave INT DEFAULT 0,
    sick_leave INT DEFAULT 0,
    other_leave INT DEFAULT 0,
    days_present INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (employee_id, month, year),
    FOREIGN KEY (employee_id) REFERENCES employees(employee_id)
);


INSERT INTO attendance
(employee_id, month, year, total_working_days, casual_leave, sick_leave, other_leave, days_present)
VALUES
(100001,'Oct',2025,22,1,0,0,21),
(100002,'Oct',2025,22,0,1,0,21),
(100003,'Oct',2025,22,2,0,0,20),

(200001,'Oct',2025,22,1,1,0,20),
(200002,'Oct',2025,22,0,0,1,21),
(200003,'Oct',2025,22,2,1,0,19),

(300001,'Oct',2025,22,1,0,0,21),
(300002,'Oct',2025,22,0,1,1,20),
(300003,'Oct',2025,22,2,0,0,20);

INSERT INTO attendance
(employee_id, month, year, total_working_days, casual_leave, sick_leave, other_leave, days_present)
VALUES
(100001,'Nov',2025,21,1,0,0,20),
(100002,'Nov',2025,21,0,1,0,20),
(100003,'Nov',2025,21,1,1,0,19),

(200001,'Nov',2025,21,0,2,0,19),
(200002,'Nov',2025,21,1,0,0,20),
(200003,'Nov',2025,21,1,1,1,18),

(300001,'Nov',2025,21,0,0,1,20),
(300002,'Nov',2025,21,2,0,0,19),
(300003,'Nov',2025,21,1,0,0,20);

INSERT INTO attendance
(employee_id, month, year, total_working_days, casual_leave, sick_leave, other_leave, days_present)
VALUES
(100001,'Dec',2025,20,1,0,0,19),
(100002,'Dec',2025,20,0,1,0,19),
(100003,'Dec',2025,20,2,0,0,18),

(200001,'Dec',2025,20,1,1,0,18),
(200002,'Dec',2025,20,0,0,1,19),
(200003,'Dec',2025,20,2,1,0,17),

(300001,'Dec',2025,20,1,0,0,19),
(300002,'Dec',2025,20,0,1,1,18),
(300003,'Dec',2025,20,2,0,0,18);

SELECT employee_id, month, year, days_present
FROM attendance
ORDER BY employee_id, year, month;

CREATE TABLE salary (
    salary_id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    year INT NOT NULL,
    month VARCHAR(3) NOT NULL,
    gross_pay DECIMAL(10,2) NOT NULL,
    tax DECIMAL(10,2) NOT NULL,
    net_pay DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (employee_id) REFERENCES employees(employee_id)
);

INSERT INTO salary (employee_id, year, month, gross_pay, tax, net_pay) VALUES

(100001, 2025, 'Jan', 45000, 5000, 40000),
(100001, 2025, 'Feb', 45000, 5000, 40000),
(100001, 2025, 'Mar', 46000, 5200, 40800),

(100002, 2025, 'Jan', 48000, 5500, 42500),
(100002, 2025, 'Feb', 48000, 5500, 42500),
(100002, 2025, 'Mar', 49000, 5600, 43400),

(100003, 2025, 'Jan', 42000, 4500, 37500),
(100003, 2025, 'Feb', 42000, 4500, 37500),
(100003, 2025, 'Mar', 43000, 4700, 38300),


(200001, 2025, 'Jan', 52000, 6200, 45800),
(200001, 2025, 'Feb', 52000, 6200, 45800),

(200002, 2025, 'Jan', 50000, 6000, 44000),
(200002, 2025, 'Feb', 50000, 6000, 44000),

(200003, 2025, 'Jan', 47000, 5300, 41700),


(300001, 2025, 'Jan', 55000, 7000, 48000),

(300002, 2025, 'Jan', 53000, 6800, 46200),

(300003, 2025, 'Jan', 56000, 7200, 48800);

DELETE FROM dependant_requests;

select* from dependant_requests;

DROP TABLE IF EXISTS dependant_requests;

CREATE TABLE dependant_requests (
    request_id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    dependant_name VARCHAR(100),
    relation VARCHAR(50),
    gender VARCHAR(10),
    dob DATE,

    status ENUM('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',

    request_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    approved_timestamp DATETIME NULL
);

DELETE FROM dependants;
CREATE TABLE relation_master (
    relation_id INT(2) PRIMARY KEY,
    relation_name VARCHAR(50) NOT NULL
);

INSERT INTO relation_master (relation_id, relation_name) VALUES
(01, 'Spouse'),
(02, 'Father'),
(03, 'Mother'),
(04, 'Father In Law'),
(05, 'Mother In Law'),
(11, 'Child 1'),
(12, 'Child 2'),
(23, 'Sibling 1'),
(24, 'Sibling 2');

DROP TABLE IF EXISTS dependants;

CREATE TABLE dependants (
    dependant_id INT PRIMARY KEY,
    employee_id INT NOT NULL,
    dependant_name VARCHAR(100) NOT NULL,
    relation VARCHAR(50) NOT NULL,
    gender VARCHAR(10),
    dob DATE,

    FOREIGN KEY (employee_id)
        REFERENCES employees(employee_id)
        ON DELETE CASCADE
);
INSERT INTO dependants VALUES
(10000101,100001,'Anita Sharma','Spouse','Female','1995-06-10'),
(10000111,100001,'Rohan Sharma','Child 1','Male','2020-03-15'),

(10000201,100002,'Rahul Verma','Spouse','Male','1994-02-18'),
(10000211,100002,'Aarav Verma','Child 1','Male','2019-11-22'),

(10000301,100003,'Sneha Singh','Spouse','Female','1993-08-25'),
(10000311,100003,'Kavya Singh','Child 1','Female','2021-01-10');

INSERT INTO dependants VALUES
(20000101,200001,'Sunita Kumar','Spouse','Female','1990-04-12'),
(20000111,200001,'Amit Kumar','Child 1','Male','2016-09-30'),

(20000201,200002,'Suresh Rao','Spouse','Male','1989-10-08'),
(20000211,200002,'Diya Rao','Child 1','Female','2017-05-14'),

(20000301,200003,'Pallavi Mehta','Spouse','Female','1991-01-20'),
(20000311,200003,'Ishaan Mehta','Child 1','Male','2019-06-03');

INSERT INTO dependants VALUES
(30000101,300001,'Lata Patel','Spouse','Female','1990-09-22'),
(30000111,300001,'Neel Patel','Child 1','Male','2015-04-18'),

(30000201,300002,'Karan Shah','Spouse','Male','1992-07-11'),
(30000211,300002,'Myra Shah','Child 1','Female','2018-02-27'),

(30000301,300003,'Pooja Reddy','Spouse','Female','1991-11-29'),
(30000311,300003,'Ayaan Reddy','Child 1','Male','2016-08-09');

DROP TABLE IF EXISTS relation;

CREATE TABLE relation (
    relation_id INT PRIMARY KEY,
    relation VARCHAR(50) NOT NULL
);

INSERT INTO relation VALUES
(01, 'Spouse'),
(02, 'Father'),
(03, 'Mother'),
(04, 'Father In Law'),
(05, 'Mother In Law'),
(11, 'Child 1'),
(12, 'Child 2'),
(23, 'Sibling 1'),
(24, 'Sibling 2');

DROP TABLE IF EXISTS dependants;

CREATE TABLE dependants (
    dependant_id BIGINT PRIMARY KEY,
    employee_id INT NOT NULL,
    dependant_name VARCHAR(100),
    relation_id INT,
    gender VARCHAR(10),
    dob DATE,
    FOREIGN KEY (relation_id) REFERENCES relation_master(relation_id)
);

ALTER TABLE salary
ADD COLUMN other_deductions DECIMAL(10,2) DEFAULT 0 AFTER tax;

UPDATE salary
SET net_pay = gross_pay - tax - IFNULL(other_deductions, 0);

UPDATE salary
SET other_deductions = 1200
WHERE employee_id IN (100001,100002,100003);

UPDATE salary
SET net_pay = gross_pay - tax - other_deductions;

DELETE FROM dependants;

DROP TABLE IF EXISTS dependants;


CREATE TABLE dependants (
    dependant_id BIGINT PRIMARY KEY,
    employee_id INT NOT NULL,
    dependant_name VARCHAR(100) NOT NULL,
    relation VARCHAR(50) NOT NULL,
    gender VARCHAR(10),
    dob DATE,

    CONSTRAINT fk_dependants_employee
        FOREIGN KEY (employee_id)
        REFERENCES employees(employee_id)
        ON DELETE CASCADE
);
INSERT INTO dependants
(dependant_id, employee_id, dependant_name, relation, gender, dob)
VALUES
(10000101,100001,'Anita Sharma','Spouse','Female','1995-06-10'),
(10000111,100001,'Rohan Sharma','Child 1','Male','2020-03-15'),

(10000201,100002,'Rahul Verma','Spouse','Male','1994-02-18'),
(10000211,100002,'Aarav Verma','Child 1','Male','2019-11-22');

select* from dependants;

CREATE TABLE dependants (
    dependant_id INT  PRIMARY KEY,
    employee_id INT(6) NOT NULL,
    dependant_name VARCHAR(100) NOT NULL,
    relation VARCHAR(50) NOT NULL,
    gender VARCHAR(10),
    dob DATE,
    CONSTRAINT fk_dependants_employee
        FOREIGN KEY (employee_id)
        REFERENCES employees(employee_id)
        ON DELETE CASCADE
) ;

select* from relation;

ALTER TABLE dependant_requests
ADD COLUMN remarks VARCHAR(255) NULL;

INSERT INTO dependants (
    dependant_id,
    employee_id,
    dependant_name,
    relation,
    gender,
    dob
)
SELECT
    e.employee_id * 100 AS dependant_id,   -- empid00
    e.employee_id,
    e.full_name,
    'Self',
    e.gender,
    e.dob
FROM employees e
WHERE NOT EXISTS (
    SELECT 1
    FROM dependants d
    WHERE d.employee_id = e.employee_id
      AND d.relation = 'Self'
);

CREATE TABLE leave_requests (
    leave_id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    leave_date DATE NOT NULL,
    leave_type ENUM('CL','SL','OL') NOT NULL,
    description VARCHAR(255),
    status ENUM('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
    remark VARCHAR(255),
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP NULL,
    processed_by VARCHAR(20)
);
select* from salary;

UPDATE attendance
SET sick_leave = GREATEST(sick_leave - 1, 0)
WHERE employee_id=100001 and month!='Jan';

INSERT INTO attendance (
    employee_id,
    month,
    year,
    total_working_days,
    casual_leave,
    sick_leave,
    other_leave,
    days_present
)
VALUES (
    100001,
    'Jan',
    2026,
    26,
    1,
    0,
    0,
    25
);

UPDATE attendance
SET days_present = total_working_days
                  - IFNULL(casual_leave, 0)
                  - IFNULL(sick_leave, 0)
                  - IFNULL(other_leave, 0);
DELETE FROM dependants
WHERE relation = 'Sibling 1';
