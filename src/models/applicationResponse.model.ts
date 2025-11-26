import mongoose from 'mongoose';

const applicationResponseSchema = new mongoose.Schema({
  fieldName: {
    type: String,
    required: true,
  },
  fieldLabel: {
    type: String,
    required: true,
  },
  fieldType: {
    type: String,
    required: true,
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
  },
  // For regular file uploads (FILE, IMAGE field types)
  files: [{
    url: String,
    filename: String,
    size: Number,
    mimeType: String,
    uploadedAt: Date,
  }],
  // NEW: For voice recordings (VOICE_RECORDING field type)
  voiceRecording: {
    url: String,
    duration: Number, // in seconds
    format: String,
    filename: String,
    size: Number,
    mimeType: String,
    uploadedAt: Date,
  },
  // NEW: For video recordings (VIDEO_RECORDING field type)
  videoRecording: {
    url: String,
    duration: Number, // in seconds
    format: String,
    filename: String,
    size: Number,
    mimeType: String,
    uploadedAt: Date,
  },
}, { _id: false });

const applicationSchema = new mongoose.Schema(
  {
    jobListingId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    candidate: {
      name: {
        type: String,
        required: true,
        trim: true,
      },
      email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
      },
      phone: {
        type: String,
        trim: true,
      },
    },

    responses: [applicationResponseSchema],

    // Store snapshot of form at submission
    formSnapshot: {
      customSections: {
        type: mongoose.Schema.Types.Mixed,
      },
    },

    status: {
      type: String,
      enum: ['submitted', 'under_review', 'shortlisted', 'rejected', 'accepted'],
      default: 'submitted',
    },

    notes: String,
    rating: Number,
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

applicationSchema.index({ jobListingId: 1, status: 1 });
applicationSchema.index({ 'candidate.email': 1, jobListingId: 1 }, { unique: true });

export interface IApplicationResponse {
  fieldName: string;
  fieldLabel: string;
  fieldType: string;
  value?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  files?: Array<{
    url: string;
    filename: string;
    size: number;
    mimeType: string;
    uploadedAt: Date;
  }>;
  voiceRecording?: {
    url: string;
    duration: number;
    format: string;
    filename?: string;
    size?: number;
    mimeType?: string;
    uploadedAt: Date;
  };
  videoRecording?: {
    url: string;
    duration: number;
    format: string;
    filename?: string;
    size?: number;
    mimeType?: string;
    uploadedAt: Date;
  };
}

export interface IApplication extends mongoose.Document {
  _id: string;
  jobListingId: mongoose.Types.ObjectId;
  candidate: {
    name: string;
    email: string;
    phone?: string;
  };
  responses: IApplicationResponse[];
  formSnapshot: {
    customSections: Array<any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  };
  status: 'submitted' | 'under_review' | 'shortlisted' | 'rejected' | 'accepted';
  notes?: string;
  rating?: number;
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export default mongoose.model<IApplication>('Application', applicationSchema);