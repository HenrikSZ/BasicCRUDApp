/**
 * Whenever a logger is required, the app is well served with this module
 */


import winston from "winston"


const logger = winston.createLogger({
    level: process.env.LOG_LEVEL,
    format: winston.format.combine(
        winston.format.json(), winston.format.timestamp()
    ),
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' }),
    ]
})


export default logger
