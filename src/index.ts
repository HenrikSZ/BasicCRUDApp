import express from "express"
import mysql from "mysql"
import dotenv from "dotenv"

dotenv.config()

const app = express()
const dbConnection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS
})

dbConnection.connect()

app.get("/", (req, res) => {
    res.send("Hello, world!")
})

app.post("/", (req, res) => {
    res.send("post")
})

app.delete("/", (req, res) => {
    res.send("delete")
})

app.listen(8000)
