import joblistingModel, { FieldType, IJobListing, JobStatus } from '../models/joblisting.model';

export interface GetAllJobListingsParams {
  page: number;
  limit: number;
  status?: JobStatus;
  sortBy?: string;
  startDate?: Date;
  endDate?: Date;
  searchTerm?: string;
  tags?: string[];
  location?: {
    city?: string;
    state?: string;
    country?: string;
  };
  isRemote?: boolean;
  employmentType?: string;
}

export interface CreateJobListingParams {
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
    currency?: string;
    period?: 'hourly' | 'monthly' | 'yearly';
    isNegotiable?: boolean;
  };
  employmentType?: 'full_time' | 'part_time' | 'contract' | 'temporary' | 'internship';
  customSections?: Array<{
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
      order: number;
    }>;
    order: number;
  }>;
  media?: Array<{
    url: string;
    type: 'image' | 'video';
    filename?: string;
    size?: number;
    mimeType?: string;
    caption?: string;
    order: number;
  }>;
  tags?: string[];
  slug?: string;
  expiresAt?: Date;
}

export interface UpdateJobListingParams {
  jobTitle?: string;
  jobDescription?: string;
  role?: string;
  experienceRequired?: {
    min?: number;
    max?: number;
    unit?: 'years' | 'months';
  };
  qualifications?: string[];
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
    isRemote?: boolean;
  };
  salary?: {
    min?: number;
    max?: number;
    currency?: string;
    period?: 'hourly' | 'monthly' | 'yearly';
    isNegotiable?: boolean;
  };
  employmentType?: 'full_time' | 'part_time' | 'contract' | 'temporary' | 'internship';
  customSections?: Array<any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  media?: Array<any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  status?: JobStatus;
  tags?: string[];
  slug?: string;
  expiresAt?: Date;
}

export class JobListingRepository {
  private _model = joblistingModel;

  async createJobListing(params: CreateJobListingParams): Promise<IJobListing> {
    try {
      const jobListing = await this._model.create(params);
      return jobListing;
    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      if (error.code === 11000) {
        throw new Error(`Job listing with slug '${params.slug}' already exists`);
      }
      throw error;
    }
  }

  async getJobListingById(jobId: string): Promise<IJobListing | null> {
    return this._model.findById(jobId);
  }

  async getJobListingBySlug(slug: string): Promise<IJobListing | null> {
    return this._model.findOne({ slug });
  }

  async getAllJobListings(params: GetAllJobListingsParams) {
    const {
      page = 1,
      limit = 10,
      status,
      sortBy = '-createdAt',
      startDate,
      endDate,
      searchTerm,
      tags,
      location,
      isRemote,
      employmentType
    } = params;

    const skip = (page - 1) * limit;
    const filter: any = {}; // eslint-disable-line @typescript-eslint/no-explicit-any

    if (status) {
      filter.status = status;
    }

    if (employmentType) {
      filter.employmentType = employmentType;
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = startDate;
      if (endDate) filter.createdAt.$lte = endDate;
    }

    if (searchTerm) {
      filter.$or = [
        { jobTitle: { $regex: searchTerm, $options: 'i' } },
        { jobDescription: { $regex: searchTerm, $options: 'i' } },
        { role: { $regex: searchTerm, $options: 'i' } },
        { 'companyInfo.name': { $regex: searchTerm, $options: 'i' } },
        { tags: { $regex: searchTerm, $options: 'i' } }
      ];
    }

    if (tags && tags.length > 0) {
      filter.tags = { $in: tags };
    }

    if (location) {
      if (location.city) {
        filter['location.city'] = { $regex: location.city, $options: 'i' };
      }
      if (location.state) {
        filter['location.state'] = { $regex: location.state, $options: 'i' };
      }
      if (location.country) {
        filter['location.country'] = { $regex: location.country, $options: 'i' };
      }
    }

    if (typeof isRemote === 'boolean') {
      filter['location.isRemote'] = isRemote;
    }

    const [jobListings, total] = await Promise.all([
      this._model
        .find(filter)
        .sort(sortBy)
        .skip(skip)
        .limit(limit),
      this._model.countDocuments(filter)
    ]);

    return {
      jobListings,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    };
  }

  async getPublishedJobListings(
    page: number = 1,
    limit: number = 10,
    filters?: {
      tags?: string[];
      location?: { city?: string; state?: string; country?: string };
      isRemote?: boolean;
      experienceMin?: number;
      experienceMax?: number;
      employmentType?: string;
    }
  ) {
    const skip = (page - 1) * limit;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: any = {
      isPublished: true,
      status: JobStatus.ACTIVE,
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: { $gt: new Date() } }
      ]
    };

    if (filters) {
      if (filters.tags && filters.tags.length > 0) {
        filter.tags = { $in: filters.tags };
      }

      if (filters.location) {
        if (filters.location.city) {
          filter['location.city'] = { $regex: filters.location.city, $options: 'i' };
        }
        if (filters.location.state) {
          filter['location.state'] = { $regex: filters.location.state, $options: 'i' };
        }
        if (filters.location.country) {
          filter['location.country'] = { $regex: filters.location.country, $options: 'i' };
        }
      }

      if (typeof filters.isRemote === 'boolean') {
        filter['location.isRemote'] = filters.isRemote;
      }

      if (filters.experienceMin !== undefined) {
        filter['experienceRequired.min'] = { $lte: filters.experienceMin };
      }

      if (filters.experienceMax !== undefined) {
        filter['experienceRequired.max'] = { $gte: filters.experienceMax };
      }

      if (filters.employmentType) {
        filter.employmentType = filters.employmentType;
      }
    }

    const [jobListings, total] = await Promise.all([
      this._model
        .find(filter)
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(limit),
      this._model.countDocuments(filter)
    ]);

    return {
      jobListings,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    };
  }

  async updateJobListing(
    jobId: string,
    updateData: UpdateJobListingParams
  ): Promise<IJobListing | null> {
    return this._model.findByIdAndUpdate(jobId, updateData, { new: true });
  }

  async updateJobStatus(jobId: string, status: JobStatus): Promise<IJobListing | null> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const update: any = { status };

    if (status === JobStatus.CLOSED) {
      update.expiresAt = new Date();
    }

    return this._model.findByIdAndUpdate(jobId, update, { new: true });
  }

  async publishJobListing(jobId: string): Promise<IJobListing | null> {
    return this._model.findByIdAndUpdate(
      jobId,
      {
        isPublished: true,
        publishedAt: new Date(),
        status: JobStatus.ACTIVE
      },
      { new: true }
    );
  }

  async unpublishJobListing(jobId: string): Promise<IJobListing | null> {
    return this._model.findByIdAndUpdate(
      jobId,
      {
        isPublished: false,
        status: JobStatus.DRAFT
      },
      { new: true }
    );
  }

  async addMediaToJobListing(
    jobId: string,
    media: {
      url: string;
      type: 'image' | 'video';
      filename?: string;
      size?: number;
      mimeType?: string;
      caption?: string;
      order: number;
    }
  ): Promise<IJobListing | null> {
    return this._model.findByIdAndUpdate(
      jobId,
      { $push: { media } },
      { new: true }
    );
  }

  async removeMediaFromJobListing(
    jobId: string,
    mediaId: string
  ): Promise<IJobListing | null> {
    return this._model.findByIdAndUpdate(
      jobId,
      { $pull: { media: { _id: mediaId } } },
      { new: true }
    );
  }

  async updateMedia(
    jobId: string,
    mediaId: string,
    updateData: {
      caption?: string;
      order?: number;
    }
  ): Promise<IJobListing | null> {
    const updateFields: any = {}; // eslint-disable-line @typescript-eslint/no-explicit-any

    if (updateData.caption !== undefined) {
      updateFields['media.$.caption'] = updateData.caption;
    }
    if (updateData.order !== undefined) {
      updateFields['media.$.order'] = updateData.order;
    }

    return this._model.findOneAndUpdate(
      { _id: jobId, 'media._id': mediaId },
      { $set: updateFields },
      { new: true }
    );
  }

  async addCustomSection(
    jobId: string,
    section: {
      sectionTitle: string;
      sectionDescription?: string;
      fields: Array<{
        fieldName: string;
        fieldLabel: string;
        fieldType: FieldType;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        fieldValue?: any;
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
        order: number;
      }>;
      order: number;
    }
  ): Promise<IJobListing | null> {
    return this._model.findByIdAndUpdate(
      jobId,
      { $push: { customSections: section } },
      { new: true }
    );
  }

  async updateCustomSection(
    jobId: string,
    sectionId: string,
    sectionData: {
      sectionTitle?: string;
      sectionDescription?: string;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      fields?: Array<any>;
      order?: number;
    }
  ): Promise<IJobListing | null> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateFields: any = {};

    if (sectionData.sectionTitle) {
      updateFields['customSections.$.sectionTitle'] = sectionData.sectionTitle;
    }
    if (sectionData.sectionDescription !== undefined) {
      updateFields['customSections.$.sectionDescription'] = sectionData.sectionDescription;
    }
    if (sectionData.fields) {
      updateFields['customSections.$.fields'] = sectionData.fields;
    }
    if (sectionData.order !== undefined) {
      updateFields['customSections.$.order'] = sectionData.order;
    }

    return this._model.findOneAndUpdate(
      { _id: jobId, 'customSections._id': sectionId },
      { $set: updateFields },
      { new: true }
    );
  }

  async removeCustomSection(
    jobId: string,
    sectionId: string
  ): Promise<IJobListing | null> {
    return this._model.findByIdAndUpdate(
      jobId,
      { $pull: { customSections: { _id: sectionId } } },
      { new: true }
    );
  }

  async incrementViews(jobId: string): Promise<IJobListing | null> {
    return this._model.findByIdAndUpdate(
      jobId,
      { $inc: { views: 1 } },
      { new: true }
    );
  }

  async incrementApplications(jobId: string): Promise<IJobListing | null> {
    return this._model.findByIdAndUpdate(
      jobId,
      { $inc: { applications: 1 } },
      { new: true }
    );
  }

  async decrementApplications(jobId: string): Promise<IJobListing | null> {
    return this._model.findByIdAndUpdate(
      jobId,
      { $inc: { applications: -1 } },
      { new: true }
    );
  }

  async getJobListingsByDateRange(
    startDate: Date,
    endDate: Date,
    page: number = 1,
    limit: number = 10
  ): Promise<{ jobListings: IJobListing[]; total: number }> {
    const skip = (page - 1) * limit;
    const filter = {
      createdAt: {
        $gte: startDate,
        $lte: endDate
      }
    };

    const [jobListings, total] = await Promise.all([
      this._model
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      this._model.countDocuments(filter)
    ]);

    return { jobListings, total };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getJobListingStats(companyId?: string): Promise<any> {
    const matchStage = companyId ? { companyId } : {};

    return this._model.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalViews: { $sum: '$views' },
          totalApplications: { $sum: '$applications' }
        }
      }
    ]);
  }

  async getPopularTags(limit: number = 20): Promise<Array<{ tag: string; count: number }>> {
    return this._model.aggregate([
      { $match: { isPublished: true, status: JobStatus.ACTIVE } },
      { $unwind: '$tags' },
      {
        $group: {
          _id: '$tags',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: limit },
      {
        $project: {
          _id: 0,
          tag: '$_id',
          count: 1
        }
      }
    ]);
  }

  async searchJobListings(
    searchTerm: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ jobListings: IJobListing[]; total: number }> {
    const skip = (page - 1) * limit;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: any = {
      $or: [
        { jobTitle: { $regex: searchTerm, $options: 'i' } },
        { jobDescription: { $regex: searchTerm, $options: 'i' } },
        { role: { $regex: searchTerm, $options: 'i' } },
        { 'companyInfo.name': { $regex: searchTerm, $options: 'i' } },
        { tags: { $regex: searchTerm, $options: 'i' } },
        { qualifications: { $regex: searchTerm, $options: 'i' } }
      ]
    };

    const [jobListings, total] = await Promise.all([
      this._model
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      this._model.countDocuments(filter)
    ]);

    return { jobListings, total };
  }

  async getExpiredJobListings(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const filter = {
      expiresAt: { $lte: new Date() },
      status: { $ne: JobStatus.CLOSED }
    };

    const [jobListings, total] = await Promise.all([
      this._model
        .find(filter)
        .sort({ expiresAt: -1 })
        .skip(skip)
        .limit(limit),
      this._model.countDocuments(filter)
    ]);

    return {
      jobListings,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    };
  }

  async closeExpiredJobListings(): Promise<number> {
    const result = await this._model.updateMany(
      {
        expiresAt: { $lte: new Date() },
        status: { $ne: JobStatus.CLOSED }
      },
      {
        $set: { status: JobStatus.CLOSED }
      }
    );

    return result.modifiedCount;
  }

  async deleteJobListing(jobId: string): Promise<IJobListing | null> {
    return this._model.findByIdAndDelete(jobId);
  }

  async getJobListingsByLocation(
    city?: string,
    state?: string,
    country?: string,
    page: number = 1,
    limit: number = 10
  ) {
    const skip = (page - 1) * limit;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: any = {
      isPublished: true,
      status: JobStatus.ACTIVE
    };

    if (city) {
      filter['location.city'] = { $regex: city, $options: 'i' };
    }
    if (state) {
      filter['location.state'] = { $regex: state, $options: 'i' };
    }
    if (country) {
      filter['location.country'] = { $regex: country, $options: 'i' };
    }

    const [jobListings, total] = await Promise.all([
      this._model
        .find(filter)
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(limit),
      this._model.countDocuments(filter)
    ]);

    return {
      jobListings,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    };
  }

  async bulkUpdateStatus(
    jobIds: string[],
    status: JobStatus
  ): Promise<number> {
    const result = await this._model.updateMany(
      { _id: { $in: jobIds } },
      { $set: { status } }
    );

    return result.modifiedCount;
  }

  async addTagsToJobListing(jobId: string, tags: string[]): Promise<IJobListing | null> {
    return this._model.findByIdAndUpdate(
      jobId,
      { $addToSet: { tags: { $each: tags } } },
      { new: true }
    );
  }

  async removeTagsFromJobListing(jobId: string, tags: string[]): Promise<IJobListing | null> {
    return this._model.findByIdAndUpdate(
      jobId,
      { $pull: { tags: { $in: tags } } },
      { new: true }
    );
  }

  async getJobListingsByEmploymentType(
    employmentType: string,
    page: number = 1,
    limit: number = 10
  ) {
    const skip = (page - 1) * limit;
    const filter = {
      employmentType,
      isPublished: true,
      status: JobStatus.ACTIVE
    };

    const [jobListings, total] = await Promise.all([
      this._model
        .find(filter)
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(limit),
      this._model.countDocuments(filter)
    ]);

    return {
      jobListings,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    };
  }

  async getSimilarJobListings(
    jobId: string,
    limit: number = 5
  ): Promise<IJobListing[]> {
    const job = await this._model.findById(jobId);
    if (!job) return [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: any = {
      _id: { $ne: jobId },
      isPublished: true,
      status: JobStatus.ACTIVE,
      $or: [
        { role: job.role },
        { tags: { $in: job.tags } },
        { 'location.city': job.location?.city }
      ]
    };

    return this._model
      .find(filter)
      .sort({ publishedAt: -1 })
      .limit(limit);
  }
}

export default new JobListingRepository();