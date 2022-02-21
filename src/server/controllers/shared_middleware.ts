import validator from "validator"
import { Request, Response, NextFunction } from "express"
import { ErrorResponse, ErrorType, handleDbError } from "../error_handling.js"
import logger from "../logger.js"


/**
 * Checks whether the parameers of the request contain a valid itemId.
 * 
 * @param req the request from express.js.
 * @param res the response from express.js
 * @param next function to the next middleware
 */
export function itemIdMiddleware(req: Request, res: Response, next: NextFunction) {
    if (req.params.itemId && validator.isInt(req.params.itemId + "", {min: 1})) {
        req.itemId = Number.parseInt(req.params.itemId)
        next()
        return
    }

    logger.info(`${req.hostname} tried to access item `
        + `without valid id (${req.params.itemId})`)

    const errorBody: ErrorResponse = {
        name: ErrorType.FIELD,
        message: "Some fields of the an item contain invalid values"
    }

    res.status(400).send(errorBody)
}