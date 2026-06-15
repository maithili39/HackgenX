import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';
import { Complaint } from '../models/Complaint.js';

const isUpstash = (process.env.REDIS_URL || '').includes('upstash.io');

const redisConnection = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
    maxRetriesPerRequest: null,
    ...(isUpstash && { tls: {} }),
});

export const slaQueue = new Queue('slaQueue', {
    connection: redisConnection,
    prefix: '{civicsense}',
});

const ESCALATION_DELAY_MINS = 30;

export function initializeSlaWorker(io) {
    const worker = new Worker('slaQueue', async job => {
        if (job.name !== 'processSlaEscalations') return;
        
        try {
            const now = new Date();

            const breachedComplaints = await Complaint.find({
                slaDeadline: { $lt: now },
                slaBreached: false,
                status: { $nin: ['Closed', 'Rejected'] }
            });

            for (const complaint of breachedComplaints) {
                complaint.slaBreached = true;
                complaint.escalationLevel = Math.min(complaint.escalationLevel + 1, 3);
                complaint.auditLog.push({
                    action: 'SLA Breach – Auto Escalated',
                    performedBy: 'System',
                    performedByRole: 'system',
                    note: `SLA deadline was ${complaint.slaDeadline?.toISOString()}. Escalated to level ${complaint.escalationLevel}.`
                });
                await complaint.save();

                io.emit('sla_breach', {
                    complaintId: complaint.complaintId,
                    _id: complaint._id,
                    department: complaint.department,
                    priority: complaint.priority,
                    escalationLevel: complaint.escalationLevel,
                    description: complaint.description?.slice(0, 100),
                    slaDeadline: complaint.slaDeadline
                });
                console.log(`⚠️  SLA Breach: ${complaint.complaintId} | Dept: ${complaint.department} | Level: ${complaint.escalationLevel}`);
            }

            const furtherEscalate = await Complaint.find({
                slaBreached: true,
                escalationLevel: { $lt: 3 },
                status: { $nin: ['Closed', 'Rejected', 'Resolved'] },
                updatedAt: { $lt: new Date(now - ESCALATION_DELAY_MINS * 60 * 1000) }
            });

            for (const complaint of furtherEscalate) {
                complaint.escalationLevel = Math.min(complaint.escalationLevel + 1, 3);
                complaint.auditLog.push({
                    action: `Further Escalation – Level ${complaint.escalationLevel}`,
                    performedBy: 'System',
                    performedByRole: 'system',
                    note: `Complaint still unresolved after SLA breach. Escalated to Level ${complaint.escalationLevel}.`
                });
                await complaint.save();
                io.emit('sla_breach', {
                    complaintId: complaint.complaintId,
                    _id: complaint._id,
                    department: complaint.department,
                    priority: complaint.priority,
                    escalationLevel: complaint.escalationLevel,
                    description: complaint.description?.slice(0, 100),
                    slaDeadline: complaint.slaDeadline
                });
            }
        } catch (err) {
            console.error('SLA Worker Error:', err.message);
        }
    }, { connection: redisConnection, prefix: '{civicsense}' });

    worker.on('ready', () => {
        console.log('✅ SLA Escalation BullMQ Worker started');
    });

    worker.on('failed', (job, err) => {
        console.error(`SLA Job ${job?.id} failed:`, err.message);
    });
}

// Add the repeatable job to the queue
export async function startSlaJob() {
    await slaQueue.add('processSlaEscalations', {}, {
        repeat: {
            every: 60 * 1000 // Run every 60 seconds
        }
    });
}
