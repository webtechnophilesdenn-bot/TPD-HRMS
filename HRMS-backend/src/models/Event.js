// models/Event.js
const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: [
        'Company Meeting',
        'Training',
        'Holiday',
        'Team Building',
        'Birthday',
        'Anniversary',
        'Town Hall',
        'Workshop',
        'Conference',
        'Other',
      ],
      required: [true, 'Event type is required'],
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    isAllDay: {
      type: Boolean,
      default: false,
    },
    location: String,
    meetingLink: String,

    // Organizer
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },

    // Attendees with RSVP tracking
    attendees: [
      {
        employee: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Employee',
        },
        rsvpStatus: {
          type: String,
          enum: ['Pending', 'Accepted', 'Declined', 'Maybe'],
          default: 'Pending',
        },
        rsvpDate: Date,
      },
    ],

    // Visibility & Targeting
    visibility: {
      type: String,
      enum: ['Public', 'Department', 'Private'],
      default: 'Public',
    },
    targetDepartments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
      },
    ],

    // Reminders
    reminders: [
      {
        type: {
          type: String,
          enum: ['Email', 'SMS', 'Notification'],
        },
        before: Number, // minutes before event
        sent: {
          type: Boolean,
          default: false,
        },
        sentAt: Date,
      },
    ],

    // Status
    status: {
      type: String,
      enum: ['Scheduled', 'In Progress', 'Completed', 'Cancelled'],
      default: 'Scheduled',
    },

    // Attachments
    attachments: [
      {
        fileName: String,
        fileUrl: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    notes: String,
    color: String, // For calendar UI
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for performance
eventSchema.index({ startDate: 1, endDate: 1 });
eventSchema.index({ organizer: 1 });
eventSchema.index({ 'attendees.employee': 1 });
eventSchema.index({ type: 1, status: 1 });
eventSchema.index({ visibility: 1 });

// Virtual for attendee count
eventSchema.virtual('attendeeCount').get(function () {
  return this.attendees.length;
});

// Virtual for accepted count
eventSchema.virtual('acceptedCount').get(function () {
  return this.attendees.filter((a) => a.rsvpStatus === 'Accepted').length;
});

// Virtual for acceptance rate
eventSchema.virtual('acceptanceRate').get(function () {
  if (this.attendees.length === 0) return 0;
  const accepted = this.attendees.filter((a) => a.rsvpStatus === 'Accepted').length;
  return Number(((accepted / this.attendees.length) * 100).toFixed(2));
});

// Pre-save validation
eventSchema.pre('save', function (next) {
  if (this.endDate < this.startDate) {
    next(new Error('End date must be after start date'));
  }
  next();
});

module.exports = mongoose.model('Event', eventSchema);
