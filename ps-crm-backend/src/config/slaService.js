const cron = require('node-cron');
const Complaint = require('../models/Complaint');
const { sendEscalationAlert } = require('./emailService');

const SLA_HOURS = {
  High: 24,
  Medium: 72,
  Low: 168,
};

const setSLADeadline = (urgency) => {
  const hours = SLA_HOURS[urgency] || 72;
  const deadline = new Date();
  deadline.setHours(deadline.getHours() + hours);
  return deadline;
};

const checkAndEscalate = async () => {
  try {
    const now = new Date();
    console.log(`[SLA Check] Running at ${now.toISOString()}`);

    const overdueComplaints = await Complaint.find({
      status: { $in: ['Pending', 'In Progress'] },
      'sla.deadline': { $lt: now },
      'sla.escalated': false,
    });

    if (overdueComplaints.length === 0) {
      console.log('[SLA Check] No overdue complaints found');
      return;
    }

    console.log(`[SLA Check] Found ${overdueComplaints.length} overdue complaints`);

    for (const complaint of overdueComplaints) {
      await Complaint.findByIdAndUpdate(complaint._id, {
        status: 'Escalated',
        'sla.escalated': true,
        'sla.escalatedAt': now,
      });

      // Send escalation email to admin
      sendEscalationAlert(complaint);

      console.log(`[SLA Escalated] Complaint: ${complaint.title} (ID: ${complaint._id})`);
    }
  } catch (error) {
    console.error('[SLA Check Error]', error.message);
  }
};

const startSLAService = () => {
  console.log('[SLA Service] Started - checking every hour');
  checkAndEscalate();
  cron.schedule('0 * * * *', () => {
    checkAndEscalate();
  });
};

module.exports = { startSLAService, setSLADeadline };