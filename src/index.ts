import express from "express"
import mysql from "mysql"
import dotenv from "dotenv"

dotenv.config()

const app = express()
const dbConnection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
})

dbConnection.connect()
dbConnection.query(
            "CREATE TABLE IF NOT EXISTS inventory" +
            "(id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY," +
            "name VARCHAR(64) NOT NULL," +
            "count INT NOT NULL DEFAULT 0)")

app.get("/", (req, res) => {
    dbConnection.query("INSERT INTO inventory (name, count) VALUES (\"Tea\", 100)")
    res.send("Hello, world!")
})

app.post("/", (req, res) => {
    res.send("post")
})

app.delete("/", (req, res) => {
    res.send("delete")
})

app.listen(8000)
