import { FastifyReply, FastifyRequest } from "fastify"
import { QueryError } from "mysql2"
import logger from "./logger.js"


/**
 * Indicates the error type when communicating with the frontend
 */
 export enum ErrorType {
    DB = "Database Error",
    FIELD = "Field Error",
    UNKOWN = "Unknown Error"
}


export class CustomError {
    response: ErrorResponse

    constructor(response: ErrorResponse) {
        this.response = response
    }
}


/**
 * For use when sending out error responses to the frontend
 */
 export interface ErrorResponse {
    name: ErrorType,
    errno?: number,
    message?: string
}


/**
 * Checks if a given error originates is a custom error
 *
 * @param error
 * @returns true if the error has a cleaned_msg property
 */
export function isCustomError(error: CustomError | QueryError):
        error is CustomError {
    error = error as CustomError
    return Boolean(error.response)
}

/**
* Logs the error and sends an error response
*
* @param error the error to be handled
* @param req the request from express.js
* @param res the response from express.js
* @returns 0 to return some value if used in promises
*/
export function handleDbError(error: CustomError | QueryError,
        req: FastifyRequest, res: FastifyReply) {
    if (isCustomError(error)) {
        res.status(500).send(error.response)
    } else {
        switch (error.sqlState) {
            case "55001":
                handleInvalidCountError(error, res, req.hostname)
                break
            default:
                logDbError(error, req.hostname)
                const body: ErrorResponse = { name: ErrorType.DB }
                res.status(500).send(body)
        }
    }

    return 0
}


function handleInvalidCountError(error: QueryError, res: FastifyReply,
        hostname?: string) {
    if (hostname) {
        logger.error(`${hostname} used an invalid count`)
    } else {
        logger.error(`An invalid assigned count was specified (${error.code}): ${error.message}`)
    }

    let errorResponse: ErrorResponse = {
        name: ErrorType.FIELD,
        message: "The assigned value is too high in regard to the stock levels"
    }

    res.status(400).send(errorResponse)
}


/**
 * Logs any kind of completely unexpected error
 * 
 * @param error Any kind of error
 */
export function handleUnexpectedError(error: any,
        req: FastifyRequest, res: FastifyReply) {
    logger.warn(error)

    let errorResponse: ErrorResponse = {
        name: ErrorType.UNKOWN,
        message: "This error is completely unexpected. Please contact the administrator"
    }

    res.status(500).send(errorResponse)
}


/**
 * Logs a database error
 *
 * @param error the error to be logged
 * @param hostname the hostname of the host that maybe caused this
 */
function logDbError(error: QueryError, hostname?: string) {
    if (hostname) {
        logger.error(`${hostname} caused database error ${error.code}: `
            + `${error.message}`)
    } else {
        logger.error(`Database error ${error.code}: ${error.message}`)
    }
}
