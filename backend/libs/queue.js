export const redisConnectionInfo = {
    host: process.env.REDIS_HOST, 
    port: process.env.REDIS_PORT || 18582,      
    password: process.env.REDIS_PASSWORD,
}

export const emailQueueConfig = {
    attempts : 3,
    backoff : {
        type : 'exponential',
        delay: 1000,
    },
}

export const finalScoringQueueConfig = {
    attempts : 3,
    backoff : {
        type : 'exponential',
        delay: 1000,        
    },
}
