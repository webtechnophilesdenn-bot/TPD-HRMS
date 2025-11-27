const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true 
  },
  description: String,
  category: String,
  level: { 
    type: String, 
    enum: ['Beginner', 'Intermediate', 'Advanced']
  },
  
  modules: [{
    title: String,
    description: String,
    order: Number,
    lessons: [{
      title: String,
      content: String,
      videoUrl: String,
      documentUrl: String,
      duration: Number
    }]
  }],
  
  quiz: [{
    question: String,
    options: [String],
    correctAnswer: Number,
    points: Number
  }],
  
  totalDuration: Number, // in hours
  passingScore: Number,
  
  enrolledStudents: [{
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
    enrolledDate: Date,
    progress: Number,
    completedModules: [Number],
    score: Number,
    status: { 
      type: String, 
      enum: ['In Progress', 'Completed', 'Failed'],
      default: 'In Progress'
    },
    completedDate: Date,
    certificateUrl: String
  }],
  
  isPublished: { 
    type: Boolean, 
    default: false 
  },
  
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Employee' 
  }
}, { timestamps: true });

module.exports = mongoose.model('Course', courseSchema);