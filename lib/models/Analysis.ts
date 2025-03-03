import mongoose from 'mongoose';

const AnalysisSchema = new mongoose.Schema({
  imageUrl: {
    type: String,
    required: true,
  },
  diagnosis: {
    type: String,
    required: true,
  },
  confidence: {
    type: Number,
    required: true,
  },
  recommendations: [{
    type: String,
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  userId: {
    type: String,
    required: true,
  },
});

export default mongoose.models.Analysis || mongoose.model('Analysis', AnalysisSchema);