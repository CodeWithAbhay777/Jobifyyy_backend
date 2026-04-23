import {Queue , Worker} from 'bullmq';

import { redisConnectionInfo , emailQueueConfig } from '../libs/queue.js';
import { sendEmail } from '../utils/sendEmail.js';

export const emailQueueName = 'sendEmail';

export const emailQueue = new Queue(emailQueueName, {
    connection: redisConnectionInfo,
    defaultJobOptions: emailQueueConfig,

});

export const emailWorker = new Worker(emailQueueName, async job => {
    const { to, subject, text, html } = job.data;
    await sendEmail({ to, subject, text, html });
}, {
    connection: redisConnectionInfo
});
