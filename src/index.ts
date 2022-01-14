import express from "express"
import bodyParser from "body-parser"
import mysql from "mysql"
import dotenv from "dotenv"
import path from "path"

dotenv.config()

enum Error {
    DB = "Database Error",
    FIELD = "Field Error"
}

type ErrorResponse = {
    name: Error,
    errno?: number,
    message?: string
}


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


function isInteger(n: string): boolean {
    return /^-?\d+$/.test(n)
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
        if (!error) {
            res.send(results)
        } else {
            const body: ErrorResponse = { name: Error.DB }
            res.status(500).send(body)
        }
    })
})

app.get("/inventory/:id", (req, res) => {
    dbConnection.query(`SELECT * FROM inventory WHERE id = ${mysql.escape(req.params.id)}`,
    (error, results, fields) => {
        if (!error) {
            res.send(results[0])
        } else {
            const body: ErrorResponse = { name: Error.DB }
            res.status(500).send(body)
        }
    })
})

app.put("/inventory", (req, res) => {
    if (req.body.hasOwnProperty("name") && req.body.hasOwnProperty("count")
        && req.body.name.length !== 0 && isInteger(req.body.count) && req.body.count >= 0) {
        const name = mysql.escape(req.body.name)
        const count = mysql.escape(req.body.count)

        dbConnection.query(`INSERT INTO inventory (name, count) VALUES (${name}, ${count})`,
            (error, results, fields) => {
            if (!error) {
                res.status(201).send({
                    name: req.body.name,
                    count: req.body.count,
                    id: results.insertId
                })
            } else {
                const body: ErrorResponse = { name: Error.DB }
                res.status(500).send(body)
            }
        })
    } else {
        const body: ErrorResponse = {
            name: Error.FIELD,
            message: "Missing or malformed json fields"
        }

        res.status(400).send(body)
    }
})

app.put("/inventory/:id", (req, res) => {
    const updateStmt = prepareUpdateStatement(req.body)
    if (updateStmt) {
        dbConnection.query(updateStmt, (error, results, fields) => {
            if (!error) {
                res.send()
            } else {
                const body: ErrorResponse = { name: Error.DB }
                res.status(500).send(body)
            }
        })
    } else {
        const body: ErrorResponse = {
            name: Error.FIELD,
            message: "There has to be at least one field to be updated"
        }

        res.status(400).send(body)
    }
})

app.delete("/inventory/:id", (req, res) => {
    dbConnection.query(`DELETE FROM inventory WHERE id = ${mysql.escape(req.params.id)}`,
    (error, results, fields) => {
        if (!error) {
            res.send()
        } else {
            const body: ErrorResponse = { name: Error.DB }
            res.status(500).send(body)
        }
    })
})

app.use(express.static(path.resolve(__dirname, "..", "public")))

app.listen(process.env.PORT)
