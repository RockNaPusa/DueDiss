const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
    action: {
      type: String,
      required: true,
      enum: [
        'TASK_CREATED',
        'TASK_UPDATED',
        'TASK_DELETED',
        'BECAME_OVERDUE',
        'COMPLETED_ON_TIME',
        'COMPLETED_LATE',
        'MERCY_RULE_APPLIED',
        'ROASTER_MUTED',
        'ROASTER_UNMUTED',
      ],
    },
    details: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AuditLog', auditLogSchema);
