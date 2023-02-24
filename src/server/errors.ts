import { FastifyError, FastifyReply } from "fastify"
import { FastifyRequest } from "fastify"
import createError from "fastify-error"
import { QueryError } from "mysql2"


function isQueryError(error: Error): error is QueryError {
    return Boolean((error as QueryError).sqlState)
}


function isFastifyError(error: Error): error is FastifyError {
    return Boolean((error as FastifyError).statusCode)
}


export const DatabaseError = createError(
    "BCA_DATABASE_ERROR",
    "An error occured while communicating with the database",
    500
)


export const FieldError = createError(
    "BCA_FIELD_ERROR",
    "An invalid parameter was passed in for field %s",
    400
)


export function handleError(error: Error, req: FastifyRequest, rep: FastifyReply) {
    if (isFastifyError(error)) {
        rep.status(error.statusCode ?? 500).send({
            name: error.name,
            message: error.message
        })
    } else {
        rep.status(500).send({ 
            name: error.name,
            message: error.message
        })
    }
}


export function handleDbError(error: Error) {
    if (isQueryError(error)) {
        switch (error.sqlState) {
            case "55001":
                throw new FieldError("Assigned count too high")
            default:
                throw new DatabaseError("unspecified")
        }
    }

    throw error
}
