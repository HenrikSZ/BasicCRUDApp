/**
 * All other functions needed as helpers somewhere
 */


import express from "express"
import { QueryError } from "mysql2"
import logger from "./logger"


/**
 * Indicates the error type when communicating with the frontend
 */
export enum Error {
    DB = "Database Error",
    FIELD = "Field Error"
}

/**
 * For use when sending out error responses to the frontend
 */
export type ErrorResponse = {
    name: Error,
    errno?: number,
    message?: string
}


/**
 * Checks if a given error originates from the mysql2 library
 *
 * @param error
 * @returns true if the error has a name property
 */
export function isMysqlError(error: ErrorResponse | QueryError):
    error is QueryError {
    return Boolean((error as QueryError).name)
}

/**
 * Logs the error and sends an error response
 *
 * @param error the error to be handled
 * @param req the request from express.js
 * @param res the response from express.js
 * @returns 0 to return some value if used in promises
 */
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

/**
 * Logs a database error
 *
 * @param error the error to be logged
 * @param hostname the hostname of the host that maybe caused this
 */
export function logDbError(error: QueryError, hostname?: string) {
    if (hostname) {
        logger.error(`${hostname} caused database error ${error.code}: `
            + `${error.message}`)
    } else {
        logger.error(`Database error ${error.code}: ${error.message}`)
    }
}


/**
 * Checks whether a given string is an integer
 *
 * @param n the string to be checked
 * @returns true if string is a positive or negative integer
 */
export function isInteger(n: string): boolean {
    return /^-?\d+$/.test(n)
}
