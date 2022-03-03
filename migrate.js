import Postgrator from "postgrator"
import dotenv from "dotenv"
import mysql2 from "mysql2"

dotenv.config()

const connection = mysql2.createConnection({
    multipleStatements: true,
    host: process.env.DB_HOST ?? "localhost",
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
})
connection.connect()

const postgrator = new Postgrator({
    migrationPattern: "migrations/*",
    driver: "mysql",
    database: process.env.DB_NAME,
    execQuery: (query) => new Promise((resolve, reject) => {
        connection.query(query, (err, rows, fields) =>
            (err ? reject(err) : resolve({ rows, fields })));
    })
})

const version = process.argv[2] ?? await postgrator.getMaxVersion()
const migrations = await postgrator.migrate(version + "")

if (migrations.length > 0) {
    migrations.forEach(m => {
        const action = m.action.toUpperCase()
        const version = action == "UNDO" ? m.version - 1 : m.version
        console.log(`[${action}] migration "${m.name}" to version ${version}`)
    })
} else {
    console.log("No migrations to run")
}

connection.end()
