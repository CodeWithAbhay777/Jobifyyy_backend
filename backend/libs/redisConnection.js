import {Redis} from 'ioredis';

const redis = new Redis({
    host: process.env.REDIS_HOST, 
    port: process.env.REDIS_PORT || 16930,      
    password: process.env.REDIS_PASSWORD, 
});

 export const redisConnection = () => {
    if (redis.status === 'ready') {
        console.log("Redis is already connected");
        return;
    }
    redis.on('connect' ,() => console.log("Redis connected"));
    redis.on('error', (err) => console.log("Redis connection error:", err));
 }



export default redis;


