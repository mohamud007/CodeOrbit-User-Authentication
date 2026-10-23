
const pool = require("./db");

async function testConnection() {
    try {
        const [rows] = await pool.query(
            "SELECT DATABASE() AS databaseName"
        );

        console.log("MySQL connected successfully!");
        console.log("Database:", rows[0].databaseName);
    } catch (error) {
        console.error("MySQL connection failed:", error.message);
    } finally {
        await pool.end();
    }
}

testConnection();
