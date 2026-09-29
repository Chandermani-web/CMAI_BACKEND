import mongoose from 'mongoose';

const resumeSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },

    extractText: { type: String, required: true },
    score: { type: Number, required: true },
    summary: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },

    education: [{ type: mongoose.Schema.Types.Mixed, required: true }],
    experience: [{ type: mongoose.Schema.Types.Mixed, required: true }],
    skills: [{ type: String, required: true }],
    projects: [{ type: mongoose.Schema.Types.Mixed, required: true }],

    strengths: [{ type: String, required: true }],
    weaknesses: [{ type: String, required: true }],
    missingSkills: [{ type: String, required: true }],

    recommendations: [{ type: String, required: true }],
    suggestedRole: { type: String, default: 'Not specified' },
  },
  { timestamps: true }
);

const Resume = mongoose.model('Resume', resumeSchema);

export default Resume;