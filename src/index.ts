import express from "express"
import bodyParser from "body-parser"
import mysql from "mysql"
import dotenv from "dotenv"
import path from "path"

dotenv.config()


function prepareUpdateStatement(body: any): string | null {
    const id = mysql.escape(body.id)

    let firstValue = true
    let updatePairs = ""
    for (const key in body) {
        if (key === "id") {
            continue
        }

        if (firstValue) {
            firstValue = false
        } else {
            updatePairs += ", "
        }

        updatePairs += `${mysql.escapeId(key)} = ${mysql.escape(body[key])}`
    }

    if (!firstValue) {
        // There has been at least one value to update

        return `UPDATE inventory SET ${updatePairs} WHERE id = ${id}`
    }

    return null
}


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

app.use(bodyParser.json())

app.get("/inventory", (req, res) => {
    dbConnection.query("SELECT * FROM inventory", (error, results, fields) => {
        // TODO error handling
        res.send(results)
    })
})

app.put("/inventory", (req, res) => {
    if (req.body.hasOwnProperty("id")) {
        // It is an update request

        const updateStmt = prepareUpdateStatement(req.body)
        if (updateStmt) {
            dbConnection.query(updateStmt, (error, results, fields) => {
                // TODO error handling

                res.status(200).send()
            })
        } else {
            // TODO handle no fields to update
        }
    } else {
        // It is a creation request
    }
})

app.delete("/inventory", (req, res) => {
    res.send("delete")
})

app.use(express.static(path.resolve(__dirname, "..", "public")))

app.listen(8000)
