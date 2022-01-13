import express from "express"
import mysql from "mysql"
import dotenv from "dotenv"
import path from "path"

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

app.get("/inventory", (req, res) => {
    dbConnection.query("SELECT * FROM inventory", (error, results, fields) => {
        res.send(results)
    })
})

app.post("/inventory", (req, res) => {
    res.send("post")
})

app.delete("/inventory", (req, res) => {
    res.send("delete")
})

app.use(express.static(path.resolve(__dirname, "..", "public")))

app.listen(8000)
