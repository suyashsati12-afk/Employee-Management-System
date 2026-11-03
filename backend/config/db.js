
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const caCertificate = fs.readFileSync(
    path.join(__dirname, 'ca.pem'),
    'utf8'
);

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,

    ssl: {
        ca: caCertificate,
        rejectUnauthorized: true
    },

    waitForConnections: true,
    connectionLimit: 10
});

module.exports = pool;
