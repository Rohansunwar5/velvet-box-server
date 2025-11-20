import { BadRequestError } from '../errors/bad-request.error';
import { InternalServerError } from '../errors/internal-server.error';
import { NotFoundError } from '../errors/not-found.error';
import { FieldType, JobStatus } from '../models/joblisting.model';
import JobListingRepository, {
  CreateJobListingParams,
  UpdateJobListingParams,
  GetAllJobListingsParams
} from '../repository/jobListing.repository';
import { customAlphabet } from 'nanoid';
import { uploadToCloudinary } from '../utils/cloudinary.util';

const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 10);

class JobListingService {
  constructor(private readonly _jobListingRepository: typeof JobListingRepository) {}

  async createJobListing(params: CreateJobListingParams ) {
    const { ...jobData } = params;

    if (!jobData.jobTitle) throw new BadRequestError('Job title is required');
    if (!jobData.jobDescription) throw new BadRequestError('Job description is required');
    if (!jobData.role) throw new BadRequestError('Role is required');
    if (!jobData.slug) {
      const slugBase = jobData.jobTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      jobData.slug = `${slugBase}-${nanoid()}`;
    }

    try {
      const jobListing = await this._jobListingRepository.createJobListing({ ...jobData });

      if (!jobListing) throw new InternalServerError('Failed to create job listing');

      return jobListing;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        throw new BadRequestError(error.message);
      }
      throw error;
    }
  }

  async getJobListingById(jobId: string, incrementViews: boolean = false) {
    if (!jobId) throw new BadRequestError('Job ID is required');

    const jobListing = await this._jobListingRepository.getJobListingById(jobId);
    if (!jobListing) throw new NotFoundError('Job listing not found');

    if (incrementViews && jobListing.isPublished) {
      await this._jobListingRepository.incrementViews(jobId);
      jobListing.views += 1;
    }

    return jobListing;
  }

  async getJobListingBySlug(slug: string, incrementViews: boolean = false) {
    if (!slug) throw new BadRequestError('Slug is required');

    const jobListing = await this._jobListingRepository.getJobListingBySlug(slug);
    if (!jobListing) throw new NotFoundError('Job listing not found');

    if (incrementViews && jobListing.isPublished) {
      await this._jobListingRepository.incrementViews(jobListing._id);
      jobListing.views += 1;
    }

    return jobListing;
  }

  async getAllJobListings(params: GetAllJobListingsParams) {
    const result = await this._jobListingRepository.getAllJobListings(params);
    return result;
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
    const result = await this._jobListingRepository.getPublishedJobListings(
      page,
      limit,
      filters
    );

    return result;
  }

  async updateJobListing(
    jobId: string,
    updateData: UpdateJobListingParams,
  ) {
    if (!jobId) throw new BadRequestError('Job ID is required');

    // Verify job exists
    const existingJob = await this._jobListingRepository.getJobListingById(jobId);
    if (!existingJob) throw new NotFoundError('Job listing not found');

    // If updating slug, ensure it's unique
    if (updateData.slug && updateData.slug !== existingJob.slug) {
      const existingSlug = await this._jobListingRepository.getJobListingBySlug(updateData.slug);
      if (existingSlug) {
        throw new BadRequestError(`Job listing with slug '${updateData.slug}' already exists`);
      }
    }

    const updatedJob = await this._jobListingRepository.updateJobListing(jobId, updateData);
    if (!updatedJob) throw new InternalServerError('Failed to update job listing');

    return updatedJob;
  }

  async updateJobStatus(jobId: string, status: JobStatus) {
    if (!jobId) throw new BadRequestError('Job ID is required');
    if (!status) throw new BadRequestError('Status is required');

    // Verify job exists
    const existingJob = await this._jobListingRepository.getJobListingById(jobId);
    if (!existingJob) throw new NotFoundError('Job listing not found');

    const updatedJob = await this._jobListingRepository.updateJobStatus(jobId, status);
    if (!updatedJob) throw new InternalServerError('Failed to update job status');

    return updatedJob;
  }

  async publishJobListing(jobId: string) {
    if (!jobId) throw new BadRequestError('Job ID is required');

    // Verify job exists
    const existingJob = await this._jobListingRepository.getJobListingById(jobId);
    if (!existingJob) throw new NotFoundError('Job listing not found');

    // Validate required fields before publishing
    if (!existingJob.jobTitle || !existingJob.jobDescription || !existingJob.role) {
      throw new BadRequestError('Job listing must have title, description, and role to be published');
    }

    if (existingJob.isPublished) {
      throw new BadRequestError('Job listing is already published');
    }

    const publishedJob = await this._jobListingRepository.publishJobListing(jobId);
    if (!publishedJob) throw new InternalServerError('Failed to publish job listing');

    return publishedJob;
  }

  async unpublishJobListing(jobId: string) {
    if (!jobId) throw new BadRequestError('Job ID is required');

    // Verify job exists
    const existingJob = await this._jobListingRepository.getJobListingById(jobId);
    if (!existingJob) throw new NotFoundError('Job listing not found');

    if (!existingJob.isPublished) {
      throw new BadRequestError('Job listing is not published');
    }

    const unpublishedJob = await this._jobListingRepository.unpublishJobListing(jobId);
    if (!unpublishedJob) throw new InternalServerError('Failed to unpublish job listing');

    return unpublishedJob;
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
    },
  ) {
    if (!jobId) throw new BadRequestError('Job ID is required');
    if (!media.url) throw new BadRequestError('Media URL is required');
    if (!media.type) throw new BadRequestError('Media type is required');

    // Verify job exists
    const existingJob = await this._jobListingRepository.getJobListingById(jobId);
    if (!existingJob) throw new NotFoundError('Job listing not found');

    const updatedJob = await this._jobListingRepository.addMediaToJobListing(jobId, media);
    if (!updatedJob) throw new InternalServerError('Failed to add media to job listing');

    return updatedJob;
  }

  async removeMediaFromJobListing(jobId: string, mediaId: string) {
    if (!jobId) throw new BadRequestError('Job ID is required');
    if (!mediaId) throw new BadRequestError('Media ID is required');

    // Verify job exists
    const existingJob = await this._jobListingRepository.getJobListingById(jobId);
    if (!existingJob) throw new NotFoundError('Job listing not found');

    const updatedJob = await this._jobListingRepository.removeMediaFromJobListing(jobId, mediaId);
    if (!updatedJob) throw new InternalServerError('Failed to remove media from job listing');

    return updatedJob;
  }

  async updateMedia(
    jobId: string,
    mediaId: string,
    updateData: { caption?: string; order?: number },
  ) {
    if (!jobId) throw new BadRequestError('Job ID is required');
    if (!mediaId) throw new BadRequestError('Media ID is required');

    // Verify job exists
    const existingJob = await this._jobListingRepository.getJobListingById(jobId);
    if (!existingJob) throw new NotFoundError('Job listing not found');

    const updatedJob = await this._jobListingRepository.updateMedia(jobId, mediaId, updateData);
    if (!updatedJob) throw new InternalServerError('Failed to update media');

    return updatedJob;
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
    },
  ) {
    if (!jobId) throw new BadRequestError('Job ID is required');
    if (!section.sectionTitle) throw new BadRequestError('Section title is required');
    if (!section.fields || section.fields.length === 0) {
      throw new BadRequestError('Section must have at least one field');
    }

    // Verify job exists
    const existingJob = await this._jobListingRepository.getJobListingById(jobId);
    if (!existingJob) throw new NotFoundError('Job listing not found');

    const updatedJob = await this._jobListingRepository.addCustomSection(jobId, section);
    if (!updatedJob) throw new InternalServerError('Failed to add custom section');

    return updatedJob;
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
    },
  ) {
    if (!jobId) throw new BadRequestError('Job ID is required');
    if (!sectionId) throw new BadRequestError('Section ID is required');

    // Verify job exists
    const existingJob = await this._jobListingRepository.getJobListingById(jobId);
    if (!existingJob) throw new NotFoundError('Job listing not found');

    const updatedJob = await this._jobListingRepository.updateCustomSection(
      jobId,
      sectionId,
      sectionData
    );
    if (!updatedJob) throw new InternalServerError('Failed to update custom section');

    return updatedJob;
  }

  async removeCustomSection(jobId: string, sectionId: string) {
    if (!jobId) throw new BadRequestError('Job ID is required');
    if (!sectionId) throw new BadRequestError('Section ID is required');

    // Verify job exists
    const existingJob = await this._jobListingRepository.getJobListingById(jobId);
    if (!existingJob) throw new NotFoundError('Job listing not found');

    const updatedJob = await this._jobListingRepository.removeCustomSection(jobId, sectionId);
    if (!updatedJob) throw new InternalServerError('Failed to remove custom section');

    return updatedJob;
  }

  async incrementApplications(jobId: string) {
    if (!jobId) throw new BadRequestError('Job ID is required');

    const updatedJob = await this._jobListingRepository.incrementApplications(jobId);
    if (!updatedJob) throw new InternalServerError('Failed to increment applications');

    return updatedJob;
  }

  async decrementApplications(jobId: string) {
    if (!jobId) throw new BadRequestError('Job ID is required');

    const updatedJob = await this._jobListingRepository.decrementApplications(jobId);
    if (!updatedJob) throw new InternalServerError('Failed to decrement applications');

    return updatedJob;
  }

  async getJobListingsByDateRange(
    startDate: Date,
    endDate: Date,
    page: number = 1,
    limit: number = 10
  ) {
    if (!startDate || !endDate) throw new BadRequestError('Start date and end date are required');
    if (startDate > endDate) throw new BadRequestError('Start date must be before end date');

    const result = await this._jobListingRepository.getJobListingsByDateRange(
      startDate,
      endDate,
      page,
      limit
    );

    return result;
  }

//   async getJobListingStats() {
//     const stats = await this._jobListingRepository.getJobListingStats(companyId);
//     return stats;
//   }

  async getPopularTags(limit: number = 20) {
    if (limit < 1 || limit > 100) throw new BadRequestError('Limit must be between 1 and 100');

    const tags = await this._jobListingRepository.getPopularTags(limit);
    return tags;
  }

  async searchJobListings(
    searchTerm: string,
    page: number = 1,
    limit: number = 10
  ) {
    if (!searchTerm || searchTerm.trim().length === 0) {
      throw new BadRequestError('Search term is required');
    }

    const result = await this._jobListingRepository.searchJobListings(
      searchTerm,
      page,
      limit
    );

    return result;
  }

  async getExpiredJobListings(page: number = 1, limit: number = 10) {
    const result = await this._jobListingRepository.getExpiredJobListings(page, limit);
    return result;
  }

  async closeExpiredJobListings() {
    const count = await this._jobListingRepository.closeExpiredJobListings();
    return { closedCount: count };
  }

  async deleteJobListing(jobId: string) {
    if (!jobId) throw new BadRequestError('Job ID is required');

    // Verify job exists
    const existingJob = await this._jobListingRepository.getJobListingById(jobId);
    if (!existingJob) throw new NotFoundError('Job listing not found');

    const deletedJob = await this._jobListingRepository.deleteJobListing(jobId);
    if (!deletedJob) throw new InternalServerError('Failed to delete job listing');

    return deletedJob;
  }

  async getJobListingsByLocation(
    city?: string,
    state?: string,
    country?: string,
    page: number = 1,
    limit: number = 10
  ) {
    if (!city && !state && !country) {
      throw new BadRequestError('At least one location parameter is required');
    }

    const result = await this._jobListingRepository.getJobListingsByLocation(
      city,
      state,
      country,
      page,
      limit
    );

    return result;
  }

  async bulkUpdateStatus(jobIds: string[], status: JobStatus ) {
    if (!jobIds || jobIds.length === 0) throw new BadRequestError('Job IDs are required');
    if (!status) throw new BadRequestError('Status is required');

    const count = await this._jobListingRepository.bulkUpdateStatus(jobIds, status);
    return { updatedCount: count };
  }

  async addTagsToJobListing(jobId: string, tags: string[] ) {
    if (!jobId) throw new BadRequestError('Job ID is required');
    if (!tags || tags.length === 0) throw new BadRequestError('Tags are required');

    // Verify job exists
    const existingJob = await this._jobListingRepository.getJobListingById(jobId);
    if (!existingJob) throw new NotFoundError('Job listing not found');

    const updatedJob = await this._jobListingRepository.addTagsToJobListing(jobId, tags);
    if (!updatedJob) throw new InternalServerError('Failed to add tags');

    return updatedJob;
  }

  async removeTagsFromJobListing(jobId: string, tags: string[] ) {
    if (!jobId) throw new BadRequestError('Job ID is required');
    if (!tags || tags.length === 0) throw new BadRequestError('Tags are required');

    // Verify job exists
    const existingJob = await this._jobListingRepository.getJobListingById(jobId);
    if (!existingJob) throw new NotFoundError('Job listing not found');

    const updatedJob = await this._jobListingRepository.removeTagsFromJobListing(jobId, tags);
    if (!updatedJob) throw new InternalServerError('Failed to remove tags');

    return updatedJob;
  }

  async getJobListingsByEmploymentType(
    employmentType: string,
    page: number = 1,
    limit: number = 10
  ) {
    if (!employmentType) throw new BadRequestError('Employment type is required');

    const validTypes = ['full_time', 'part_time', 'contract', 'temporary', 'internship'];
    if (!validTypes.includes(employmentType)) {
      throw new BadRequestError('Invalid employment type');
    }

    const result = await this._jobListingRepository.getJobListingsByEmploymentType(
      employmentType,
      page,
      limit
    );

    return result;
  }

  async getSimilarJobListings(jobId: string, limit: number = 5) {
    if (!jobId) throw new BadRequestError('Job ID is required');
    if (limit < 1 || limit > 20) throw new BadRequestError('Limit must be between 1 and 20');

    const similarJobs = await this._jobListingRepository.getSimilarJobListings(jobId, limit);
    return similarJobs;
  }

  async handleImageUploads(params: { files?: Express.Multer.File[]; existingImages?: string[] }): Promise<string[]> {
    let imageUrls: string[] = [];

    if (params.existingImages) {
        imageUrls = Array.isArray(params.existingImages) ? params.existingImages : [params.existingImages];
    }

    if (params.files && params.files.length > 0) {
        const uploadPromises = params.files.map((file) => uploadToCloudinary(file));
        const newImageUrls = await Promise.all(uploadPromises);
        imageUrls = [...imageUrls, ...newImageUrls];
    }

    if (imageUrls.length === 0) throw new BadRequestError('At least one product image is required');

    return imageUrls;
  }

  async handleDocumentUploads(params: {
    files?: Express.Multer.File[];
    existingDocuments?: string[]
  }): Promise<string[]> {
    let documentUrls: string[] = [];

    if (params.existingDocuments) {
      documentUrls = Array.isArray(params.existingDocuments)
        ? params.existingDocuments
        : [params.existingDocuments];
    }

    if (params.files && params.files.length > 0) {
      const uploadPromises = params.files.map((file) => uploadToCloudinary(file));
      const newDocumentUrls = await Promise.all(uploadPromises);
      documentUrls = [...documentUrls, ...newDocumentUrls];
    }

    if (documentUrls.length === 0) {
      throw new BadRequestError('At least one document is required');
    }

    return documentUrls;
  }
}

export default new JobListingService(JobListingRepository);