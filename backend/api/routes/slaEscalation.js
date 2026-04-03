import { Complaint } from '../models/Complaint.js';

// SLA hours per escalation level
const ESCALATION_DELAY_MINS = 30; // re-check every 30 mins for further escalation

export function startSlaEscalation(io) {
    console.log('✅ SLA Escalation Engine started');

    setInterval(async () => {
        try {
            const now = new Date();

            // Find all open complaints whose SLA deadline has passed and not yet closed
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

                // Emit SLA breach event to admin/officer dashboards
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

            // Continue escalating already-breached complaints at higher delays
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
            console.error('SLA Engine Error:', err.message);
        }
    }, 60 * 1000); // Run every 60 seconds
}
