import mongoose from 'mongoose';

export enum FieldType {
  TEXT = 'text',
  TEXTAREA = 'textarea',
  NUMBER = 'number',
  EMAIL = 'email',
  PHONE = 'phone',
  DATE = 'date',
  SELECT = 'select',
  MULTI_SELECT = 'multi_select',
  CHECKBOX = 'checkbox',
  RADIO = 'radio',
  FILE = 'file',
  IMAGE = 'image',
  VIDEO = 'video',
  URL = 'url',
  VOICE_RECORDING = 'voice_recording',
  VIDEO_RECORDING = 'video_recording'
}

export enum JobStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  CLOSED = 'closed',
  ARCHIVED = 'archived'
}

const dynamicFieldSchema = new mongoose.Schema({
  fieldName: {
    type: String,
    required: true,
    trim: true,
  },
  fieldLabel: {
    type: String,
    required: true,
    trim: true,
  },
  fieldType: {
    type: String,
    enum: Object.values(FieldType),
    required: true,
  },
  fieldValue: {
    type: mongoose.Schema.Types.Mixed,
  },
  isRequired: {
    type: Boolean,
    default: false,
  },
  placeholder: {
    type: String,
    trim: true,
  },
  options: [{
    label: String,
    value: String,
  }],
  validation: {
    minLength: Number,
    maxLength: Number,
    min: Number,
    max: Number,
    pattern: String,
  },
  recordingConfig: {
    maxDuration: {
      type: Number,
      default: 300
    },
    minDuration: {
      type: Number,
      default: 0
    },
    allowRetake: {
      type: Boolean,
      default: true
    },
    format: {
      type: String,
      enum: ['webm', 'mp4', 'wav', 'mp3'],
      default: 'webm'
    }
  },
  order: {
    type: Number,
    default: 0,
  },
}, { _id: false });

const formSectionSchema = new mongoose.Schema({
  sectionTitle: {
    type: String,
    required: true,
    trim: true,
  },
  sectionDescription: {
    type: String,
    trim: true,
  },
  fields: [dynamicFieldSchema],
  order: {
    type: Number,
    default: 0,
  },
}, { _id: true });

const mediaSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['image', 'video', 'document'],
    required: true,
  },
  filename: {
    type: String,
  },
  size: {
    type: Number,
  },
  mimeType: {
    type: String,
  },
  caption: {
    type: String,
    trim: true,
  },
  order: {
    type: Number,
    default: 0,
  },
}, { _id: true, timestamps: true });

const jobListingSchema = new mongoose.Schema(
  {
    jobTitle: {
      type: String,
      required: true,
      trim: true,
      maxLength: 200,
    },
    jobDescription: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      required: true,
      trim: true,
    },
    experienceRequired: {
      min: {
        type: Number,
        default: 0,
      },
      max: {
        type: Number,
      },
      unit: {
        type: String,
        enum: ['years', 'months'],
        default: 'years',
      },
    },
    qualifications: [{
      type: String,
      trim: true,
    }],
    notes: {
      type: String,
      trim: true,
    },
    companyInfo: {
      name: {
        type: String,
        trim: true,
      },
      logo: {
        type: String,
      },
      website: {
        type: String,
        trim: true,
      },
    },

    location: {
      city: String,
      state: String,
      country: String,
      isRemote: {
        type: Boolean,
        default: false,
      },
    },
    salary: {
      min: Number,
      max: Number,
      currency: {
        type: String,
        default: 'INR',
      },
      period: {
        type: String,
        enum: ['hourly', 'monthly', 'yearly'],
        default: 'yearly',
      },
      isNegotiable: {
        type: Boolean,
        default: false,
      },
    },

    employmentType: {
      type: String,
      enum: ['full_time', 'part_time', 'contract', 'temporary', 'internship'],
      default: 'full_time',
    },
    customSections: [formSectionSchema],
    media: [mediaSchema],
    status: {
      type: String,
      enum: Object.values(JobStatus),
      default: JobStatus.DRAFT,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    publishedAt: {
      type: Date,
    },
    expiresAt: {
      type: Date,
    },
    views: {
      type: Number,
      default: 0,
    },
    applications: {
      type: Number,
      default: 0,
    },
    tags: [{
      type: String,
      trim: true,
      lowercase: true,
    }],
    slug: {
      type: String,
      trim: true,
      lowercase: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

jobListingSchema.index({ isPublished: 1, status: 1 });
jobListingSchema.index({ slug: 1 }, { unique: true, sparse: true });
jobListingSchema.index({ tags: 1 });
jobListingSchema.index({ 'location.city': 1, 'location.country': 1 });
jobListingSchema.index({ createdAt: -1 });

export interface IJobListing extends mongoose.Document {
  _id: string;
  jobTitle: string;
  jobDescription: string;
  role: string;
  experienceRequired: {
    min: number;
    max?: number;
    unit: 'years' | 'months';
  };
  qualifications: string[];
  notes?: string;
  companyInfo?: {
    name?: string;
    logo?: string;
    website?: string;
  };

  location?: {
    city?: string;
    state?: string;
    country?: string;
    isRemote: boolean;
  };

  salary?: {
    min?: number;
    max?: number;
    currency: string;
    period: 'hourly' | 'monthly' | 'yearly';
    isNegotiable: boolean;
  };

  employmentType: 'full_time' | 'part_time' | 'contract' | 'temporary' | 'internship';
  customSections: Array<{
    _id: mongoose.Types.ObjectId;
    sectionTitle: string;
    sectionDescription?: string;
    fields: Array<{
      fieldName: string;
      fieldLabel: string;
      fieldType: FieldType;
      fieldValue?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
      isRequired: boolean;
      placeholder?: string;
      options?: Array<{ label: string; value: string }>;
      validation?: {
        minLength?: number;
        maxLength?: number;
        min?: number;
        max?: number;
        pattern?: string;
      };
      recordingConfig?: {
        maxDuration?: number;
        minDuration?: number;
        allowRetake?: boolean;
        format?: string;
      };
      order: number;
    }>;
    order: number;
  }>;
  media: Array<{
    _id: mongoose.Types.ObjectId;
    url: string;
    type: 'image' | 'video' | 'document';
    filename?: string;
    size?: number;
    mimeType?: string;
    caption?: string;
    order: number;
    createdAt: Date;
    updatedAt: Date;
  }>;
  status: JobStatus;
  isPublished: boolean;
  publishedAt?: Date;
  expiresAt?: Date;
  views: number;
  applications: number;
  tags: string[];
  slug?: string;
  createdAt: Date;
  updatedAt: Date;
}

export default mongoose.model<IJobListing>('JobListing', jobListingSchema);