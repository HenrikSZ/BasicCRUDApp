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

        if (!error) {
            res.send(results)
        }
    })
})

app.get("/inventory/:id", (req, res) => {
    dbConnection.query(`SELECT * FROM inventory WHERE id = ${mysql.escape(req.params.id)}`,
    (error, results, fields) => {
        // TODO error handling

        if (!error) {
            res.send(results[0])
        }
    })
})

app.put("/inventory", (req, res) => {
    if (req.body.hasOwnProperty("name") && req.body.hasOwnProperty("count")) {
        const name = mysql.escape(req.body.name)
        const count = mysql.escape(req.body.count)
        dbConnection.query(`INSERT INTO inventory (name, count) VALUES (${name}, ${count})`,
            (error, results, fields) => {
            // TODO error handling

            if (!error) {
                res.status(201).send({
                    name: req.body.name,
                    count: req.body.count,
                    id: results.insertId
                })
            }
        })
    }
})

app.put("/inventory/:id", (req, res) => {
    const updateStmt = prepareUpdateStatement(req.body)
    if (updateStmt) {
        dbConnection.query(updateStmt, (error, results, fields) => {
            // TODO error handling

            if (!error) {
                res.send()
            }
        })
    } else {
        // TODO handle missing parameters
    }
})

app.delete("/inventory/:id", (req, res) => {
    dbConnection.query(`DELETE FROM inventory WHERE id = ${mysql.escape(req.params.id)}`,
    (error, results, fields) => {
        // TODO error handling

        if (!error) {
            res.send()
        }
    })
})

app.use(express.static(path.resolve(__dirname, "..", "public")))

app.listen(8000)
