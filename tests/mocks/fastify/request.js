import mockPinoLogger from "../pino/logger.js"


export default function mock(options = {}) {
    return {
        params: options.params,
        body: options.body,
        log: mockPinoLogger()
    }
}
