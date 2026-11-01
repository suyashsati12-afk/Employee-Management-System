
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const db = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Home route
app.get('/', (req, res) => {
    res.send('Employee Management System API is running!');
});

// Test database connection
app.get('/api/test-db', async (req, res) => {
    try {
        const [result] = await db.query('SELECT 1 AS connected');

        res.json({
            success: true,
            message: 'MySQL connected successfully!',
            data: result
        });
    } catch (error) {
        console.error('Database error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Database connection failed'
        });
    }
});

// GET employees: Search + Filters + Pagination
app.get('/api/employees', async (req, res) => {
    try {
        const parsedPage = Number.parseInt(req.query.page, 10);
        const parsedLimit = Number.parseInt(req.query.limit, 10);

        const page = Number.isInteger(parsedPage)
            ? Math.max(1, parsedPage)
            : 1;

        const limit = Number.isInteger(parsedLimit)
            ? Math.min(100, Math.max(1, parsedLimit))
            : 10;

        const offset = (page - 1) * limit;

        const search = (req.query.search || '').trim();
        const department = (req.query.department || '').trim();
        const status = (req.query.status || '').trim();

        const conditions = [];
        const params = [];

        // Search across the complete employees table
        if (search) {
            conditions.push(`(
                name LIKE ?
                OR employee_code LIKE ?
                OR email LIKE ?
                OR department LIKE ?
                OR designation LIKE ?
            )`);

            const value = `%${search}%`;

            params.push(
                value,
                value,
                value,
                value,
                value
            );
        }

        // Department filter
        if (department) {
            conditions.push('department = ?');
            params.push(department);
        }

        // Status filter
        if (status) {
            conditions.push('status = ?');
            params.push(status);
        }

        const whereClause = conditions.length
            ? `WHERE ${conditions.join(' AND ')}`
            : '';

        // Count all matching employees before pagination
        const [countResult] = await db.query(
            `SELECT COUNT(*) AS total
             FROM employees
             ${whereClause}`,
            params
        );

        const total = Number(countResult[0].total);
        const totalPages = Math.ceil(total / limit);

        // Fetch only the requested page
        const [employees] = await db.query(
            `SELECT
                id,
                employee_code,
                name,
                email,
                department,
                designation,
                salary,
                joining_date,
                status,
                created_at
             FROM employees
             ${whereClause}
             ORDER BY id DESC
             LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );

        res.json({
            data: employees,
            pagination: {
                page,
                limit,
                total,
                totalPages
            }
        });
    } catch (error) {
        console.error('Error fetching employees:', error);

        res.status(500).json({
            message: 'Failed to fetch employees'
        });
    }
});

// GET a single employee
app.get('/api/employees/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                message: 'Invalid employee ID'
            });
        }

        const [employees] = await db.query(
            'SELECT * FROM employees WHERE id = ?',
            [id]
        );

        if (employees.length === 0) {
            return res.status(404).json({
                message: 'Employee not found'
            });
        }

        res.json(employees[0]);
    } catch (error) {
        console.error('Error fetching employee:', error);

        res.status(500).json({
            message: 'Failed to fetch employee'
        });
    }
});

// ADD a new employee
app.post('/api/employees', async (req, res) => {
    try {
        const {
            employee_code,
            name,
            email,
            department,
            designation,
            salary,
            joining_date,
            status
        } = req.body;

        if (
            !employee_code ||
            !name ||
            !email ||
            !department ||
            !designation ||
            salary === undefined ||
            salary === null ||
            salary === '' ||
            !joining_date ||
            !status
        ) {
            return res.status(400).json({
                message: 'Please provide all required employee fields'
            });
        }

        const [result] = await db.query(
            `INSERT INTO employees
                (employee_code, name, email, department,
                 designation, salary, joining_date, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                employee_code,
                name,
                email,
                department,
                designation,
                salary,
                joining_date,
                status
            ]
        );

        res.status(201).json({
            message: 'Employee added successfully',
            id: result.insertId
        });
    } catch (error) {
        console.error('Error adding employee:', error);

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                message: 'Employee code or email already exists'
            });
        }

        res.status(500).json({
            message: 'Failed to add employee'
        });
    }
});

// UPDATE an employee
app.put('/api/employees/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                message: 'Invalid employee ID'
            });
        }

        const {
            employee_code,
            name,
            email,
            department,
            designation,
            salary,
            joining_date,
            status
        } = req.body;

        if (
            !employee_code ||
            !name ||
            !email ||
            !department ||
            !designation ||
            salary === undefined ||
            salary === null ||
            salary === '' ||
            !joining_date ||
            !status
        ) {
            return res.status(400).json({
                message: 'Please provide all required employee fields'
            });
        }

        const [result] = await db.query(
            `UPDATE employees
             SET employee_code = ?,
                 name = ?,
                 email = ?,
                 department = ?,
                 designation = ?,
                 salary = ?,
                 joining_date = ?,
                 status = ?
             WHERE id = ?`,
            [
                employee_code,
                name,
                email,
                department,
                designation,
                salary,
                joining_date,
                status,
                id
            ]
        );

        if (result.affectedRows === 0) {
            const [existing] = await db.query(
                'SELECT id FROM employees WHERE id = ?',
                [id]
            );

            if (existing.length === 0) {
                return res.status(404).json({
                    message: 'Employee not found'
                });
            }
        }

        res.json({
            message: 'Employee updated successfully'
        });
    } catch (error) {
        console.error('Error updating employee:', error);

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                message: 'Employee code or email already exists'
            });
        }

        res.status(500).json({
            message: 'Failed to update employee'
        });
    }
});

// DELETE an employee
app.delete('/api/employees/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                message: 'Invalid employee ID'
            });
        }

        const [result] = await db.query(
            'DELETE FROM employees WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: 'Employee not found'
            });
        }

        res.json({
            message: 'Employee deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting employee:', error);

        res.status(500).json({
            message: 'Failed to delete employee'
        });
    }
});

// Start server
async function startServer() {
    try {
        await db.query('SELECT 1');

        console.log('MySQL connected successfully!');

        app.listen(PORT, () => {
            console.log(
                `Server running at http://localhost:${PORT}`
            );
        });
    } catch (error) {
        console.error(
            'Unable to connect to MySQL:',
            error.message
        );
    }
}

startServer();
