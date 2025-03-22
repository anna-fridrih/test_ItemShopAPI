import pino from 'pino';

export const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    transport: {
        target: 'pino-pretty',
        options: {
            colorize: true,
            translateTime: 'SYS:HH:MM:ss',
            ignore: 'pid,hostname',
            levelFirst: true
        }
    },
    serializers: {
        req: (req) => ({
            method: req.method,
            url: req.url,
            hostname: req.hostname,
            remoteAddress: req.ip
        }),
        res: (res) => ({
            statusCode: res.statusCode
        }),
        err: pino.stdSerializers.err
    },
    formatters: {
        level: (label) => ({ level: label.toUpperCase() })
    }
});