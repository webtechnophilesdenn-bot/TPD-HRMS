const mongoose = require('mongoose');

const trainingSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true 
  },
  description: String,
  type: { 
    type: String, 
    enum: ['Online', 'Instructor-Led', 'Workshop', 'Webinar', 'Self-Paced'],
    required: true 
  },
  category: String,
  instructor: String,
  duration: Number,
  startDate: Date,
  endDate: Date,
  location: String,
  meetingLink: String,
  capacity: Number,
  enrolledEmployees: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Employee' 
  }],
  totalEnrollments: {
    type: Number,
    default: 0
  },
  averageRating: {
    type: Number,
    default: 0
  },
  status: { 
    type: String, 
    enum: ['draft', 'published', 'upcoming', 'ongoing', 'completed', 'cancelled'],
    default: 'draft'
  },
  cost: Number,
  prerequisites: [String],
  learningObjectives: [String],
  tags: [String],
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }
}, { 
  timestamps: true 
});

module.exports = mongoose.model('Training', trainingSchema);