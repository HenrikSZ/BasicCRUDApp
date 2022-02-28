import { FastifyReply } from "fastify"
import { FastifyRequest } from "fastify"
import { QueryError } from "mysql2"


function isSafeError(error: Error): error is SafeError {
    return Boolean((error as SafeError).safeMessage)
}


function isQueryError(error: Error): error is QueryError {
    return Boolean((error as QueryError).sqlState)
}


class SafeError extends Error {
    safeMessage: string
    statusCode: number

    constructor(message: string, safeMessage: string, statusCode: number = 500) {
        super(message)
        this.statusCode = statusCode
        this.safeMessage = safeMessage
    }
}


export class FieldError extends SafeError {
    constructor(message: string, safeMessage: string = message,
            statusCode: number = 400) {
        super(message, safeMessage, statusCode)
        this.name = this.constructor.name
    }
}


export class DatabaseError extends SafeError {
    constructor(message: string, safeMessage: string = message,
            statusCode: number = 500) {
        super(message, safeMessage, statusCode)
        this.name = this.constructor.name
    }
}


export function handleError(error: Error, req: FastifyRequest, rep: FastifyReply) {
    if (isSafeError(error)) {
        rep.status(error.statusCode).send({
            name: error.name,
            message: error.safeMessage
        })
    } else {
        rep.status(500).send({ 
            name: "UnknownError",
            message: "Please contact the admininstrator"
        })
    }
}


export function handleDbError(error: Error) {
    if (isQueryError(error)) {
        switch (error.sqlState) {
            case "55001":
                throw new DatabaseError("Assigned count too high")
            default:
                throw new DatabaseError("unspecified")
        }
    }

    throw error
}
