const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema({
  candidateId: { 
    type: String, 
    unique: true 
  },
  job: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Job', 
    required: true 
  },
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  email: { 
    type: String, 
    required: true,
    lowercase: true
  },
  phone: String,
  currentLocation: String,
  currentCompany: String,
  currentDesignation: String,
  totalExperience: Number,
  expectedSalary: Number,
  noticePeriod: String,
  resume: String, // URL
  coverLetter: String,
  portfolio: String,
  linkedIn: String,
  github: String,
  
  stage: {
    type: String,
    enum: [
      'Applied',
      'Resume Screening',
      'Phone Screening',
      'Technical Test',
      'HR Round',
      'Technical Round',
      'Manager Round',
      'Final Round',
      'Selected',
      'Offer Extended',
      'Offer Accepted',
      'Offer Rejected',
      'Rejected',
      'On Hold',
      'Hired'
    ],
    default: 'Applied'
  },
  
  aiScore: Number,
  screeningScore: Number,
  technicalScore: Number,
  hrScore: Number,
  overallRating: Number,
  
  notes: String,
  rejectionReason: String,
  
  interviews: [{
    round: String,
    date: Date,
    time: String,
    type: { type: String, enum: ['Phone', 'Video', 'In-Person'] },
    interviewers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }],
    meetingLink: String,
    feedback: String,
    rating: Number,
    status: { 
      type: String, 
      enum: ['Scheduled', 'Completed', 'Cancelled', 'No Show'],
      default: 'Scheduled'
    }
  }],
  
  source: { 
    type: String, 
    enum: ['Website', 'LinkedIn', 'Naukri', 'Indeed', 'Referral', 'Campus', 'Other'],
    default: 'Website'
  },
  referredBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Employee' 
  },
  
  appliedDate: { 
    type: Date, 
    default: Date.now 
  },
  
  status: { 
    type: String, 
    enum: ['Active', 'Archived'],
    default: 'Active'
  }
}, { timestamps: true });

// Auto-generate Candidate ID
candidateSchema.pre('save', async function(next) {
  if (!this.candidateId) {
    const count = await mongoose.model('Candidate').countDocuments();
    this.candidateId = `CAND${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Candidate', candidateSchema);
