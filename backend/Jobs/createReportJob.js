import {Queue , Worker} from 'bullmq';

import { redisConnectionInfo , finalScoringQueueConfig } from '../libs/queue.js';
import calculateTotalScore from '../utils/finalScoring.js';

export const finalScoringQueueName = 'finalReport';

export const finalScoringQueue = new Queue(finalScoringQueueName, {
    connection: redisConnectionInfo,
    defaultJobOptions: finalScoringQueueConfig,
});

export const finalScoringWorker = new Worker(finalScoringQueueName, async job => {
    const { percentage, interviewId } = job.data;
    await calculateTotalScore({ percentage, interviewId });
}, {
    connection: redisConnectionInfo
});


