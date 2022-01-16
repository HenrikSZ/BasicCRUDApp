import express from "express"
import { QueryError } from "mysql2"
import logger from "./logger"


export enum Error {
    DB = "Database Error",
    FIELD = "Field Error"
}

export type ErrorResponse = {
    name: Error,
    errno?: number,
    message?: string
}


export function isMysqlError(error: ErrorResponse | QueryError):
    error is QueryError {
    return Boolean((error as QueryError).name)
}

export function handleMixedError(error: ErrorResponse | QueryError,
    req: express.Request, res: express.Response) {
    if (isMysqlError(error)) {
        logDbError(error, req.hostname)

        const body: ErrorResponse = { name: Error.DB }
        res.status(500).send(body)
    } else {
        res.send(error)
    }

    return 0
}

export function logDbError(error: QueryError, hostname?: string) {
    if (hostname) {
        logger.error(`${hostname} caused database error ${error.code}: `
            + `${error.message}`)
    } else {
        logger.error(`Database error ${error.code}: ${error.message}`)
    }
}


export function isInteger(n: string): boolean {
    return /^-?\d+$/.test(n)
}
