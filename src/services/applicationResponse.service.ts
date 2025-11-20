import { BadRequestError } from '../errors/bad-request.error';
import { InternalServerError } from '../errors/internal-server.error';
import { NotFoundError } from '../errors/not-found.error';

import mongoose from 'mongoose';
import { ApplicationRepository } from '../repository/applicationResponse.repository';
import { IApplication } from '../models/applicationResponse.model';

interface ISubmitApplicationParams {
  jobListingId: string;
  candidate: {
    name: string;
    email: string;
    phone?: string;
  };
  responses: Array<{
    fieldName: string;
    fieldLabel: string;
    fieldType: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    value?: any;
    files?: Array<{
      url: string;
      filename: string;
      size: number;
      mimeType: string;
      uploadedAt: Date;
    }>;
  }>;
  formSnapshot: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    customSections: any;
  };
}

interface IUpdateApplicationStatusParams {
  applicationId: string;
  status: 'submitted' | 'under_review' | 'shortlisted' | 'rejected' | 'accepted';
  notes?: string;
  rating?: number;
}

interface IGetApplicationsParams {
  jobListingId: string;
  status?: string;
  page?: number;
  limit?: number;
}

class ApplicationService {
  constructor(private readonly _applicationRepository: ApplicationRepository) {}

  async submitApplication(params: ISubmitApplicationParams): Promise<IApplication> {
    const { jobListingId, candidate, responses, formSnapshot } = params;

    // Validate jobListingId format
    if (!mongoose.Types.ObjectId.isValid(jobListingId)) {
      throw new BadRequestError('Invalid job listing ID');
    }

    // Check if candidate already applied for this job
    const existingApplication = await this._applicationRepository.getApplicationByEmailAndJob(
      candidate.email,
      jobListingId
    );

    if (existingApplication) {
      throw new BadRequestError('You have already applied for this job');
    }

    // Validate required fields
    if (!candidate.name || !candidate.email) {
      throw new BadRequestError('Candidate name and email are required');
    }

    if (!responses || responses.length === 0) {
      throw new BadRequestError('Application responses are required');
    }

    // Create application
    const application = await this._applicationRepository.createApplication({
      jobListingId,
      candidate,
      responses,
      formSnapshot,
    });

    if (!application) {
      throw new InternalServerError('Failed to submit application');
    }

    return application;
  }

  async getApplicationById(applicationId: string): Promise<IApplication> {
    if (!mongoose.Types.ObjectId.isValid(applicationId)) {
      throw new BadRequestError('Invalid application ID');
    }

    const application = await this._applicationRepository.getApplicationById(applicationId);

    if (!application) {
      throw new NotFoundError('Application not found');
    }

    return application;
  }

  async getApplicationsByJobListing(params: IGetApplicationsParams) {
    const { jobListingId, status, page = 1, limit = 10 } = params;

    if (!mongoose.Types.ObjectId.isValid(jobListingId)) {
      throw new BadRequestError('Invalid job listing ID');
    }

    if (page && limit) {
      const result = await this._applicationRepository.getApplicationsPaginated(
        jobListingId,
        page,
        limit,
        status
      );

      return result;
    }

    if (status) {
      const applications = await this._applicationRepository.getApplicationsByJobListingAndStatus(
        jobListingId,
        status
      );
      return { applications, total: applications.length };
    }

    const applications = await this._applicationRepository.getApplicationsByJobListing(jobListingId);
    return { applications, total: applications.length };
  }

  async getApplicationsByCandidateEmail(email: string): Promise<IApplication[]> {
    if (!email) {
      throw new BadRequestError('Email is required');
    }

    const applications = await this._applicationRepository.getApplicationsByCandidateEmail(email);
    return applications;
  }

  async updateApplicationStatus(params: IUpdateApplicationStatusParams): Promise<IApplication> {
    const { applicationId, status, notes, rating } = params;

    if (!mongoose.Types.ObjectId.isValid(applicationId)) {
      throw new BadRequestError('Invalid application ID');
    }

    // Validate status
    const validStatuses = ['submitted', 'under_review', 'shortlisted', 'rejected', 'accepted'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestError('Invalid application status');
    }

    // Validate rating if provided
    if (rating !== undefined && (rating < 1 || rating > 5)) {
      throw new BadRequestError('Rating must be between 1 and 5');
    }

    const application = await this._applicationRepository.updateApplicationStatus({
      applicationId,
      status,
      notes,
      rating,
    });

    if (!application) {
      throw new NotFoundError('Application not found');
    }

    return application;
  }

  async addNotesToApplication(applicationId: string, notes: string): Promise<IApplication> {
    if (!mongoose.Types.ObjectId.isValid(applicationId)) {
      throw new BadRequestError('Invalid application ID');
    }

    if (!notes || notes.trim().length === 0) {
      throw new BadRequestError('Notes cannot be empty');
    }

    const application = await this._applicationRepository.updateApplicationNotes(applicationId, notes);

    if (!application) {
      throw new NotFoundError('Application not found');
    }

    return application;
  }

  async rateApplication(applicationId: string, rating: number): Promise<IApplication> {
    if (!mongoose.Types.ObjectId.isValid(applicationId)) {
      throw new BadRequestError('Invalid application ID');
    }

    if (rating < 1 || rating > 5) {
      throw new BadRequestError('Rating must be between 1 and 5');
    }

    const application = await this._applicationRepository.updateApplicationRating(applicationId, rating);

    if (!application) {
      throw new NotFoundError('Application not found');
    }

    return application;
  }

  async deleteApplication(applicationId: string): Promise<boolean> {
    if (!mongoose.Types.ObjectId.isValid(applicationId)) {
      throw new BadRequestError('Invalid application ID');
    }

    const application = await this._applicationRepository.deleteApplication(applicationId);

    if (!application) {
      throw new NotFoundError('Application not found');
    }

    return true;
  }

  async getApplicationsCount(jobListingId: string): Promise<number> {
    if (!mongoose.Types.ObjectId.isValid(jobListingId)) {
      throw new BadRequestError('Invalid job listing ID');
    }

    const count = await this._applicationRepository.getApplicationsCount(jobListingId);
    return count;
  }

  async getApplicationsCountByStatus(jobListingId: string, status: string): Promise<number> {
    if (!mongoose.Types.ObjectId.isValid(jobListingId)) {
      throw new BadRequestError('Invalid job listing ID');
    }

    const validStatuses = ['submitted', 'under_review', 'shortlisted', 'rejected', 'accepted'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestError('Invalid application status');
    }

    const count = await this._applicationRepository.getApplicationsCountByStatus(jobListingId, status);
    return count;
  }

  async checkApplicationExists(email: string, jobListingId: string): Promise<boolean> {
    if (!mongoose.Types.ObjectId.isValid(jobListingId)) {
      throw new BadRequestError('Invalid job listing ID');
    }

    if (!email) {
      throw new BadRequestError('Email is required');
    }

    const exists = await this._applicationRepository.checkApplicationExists(email, jobListingId);
    return exists;
  }

  async getApplicationsByDateRange(
    jobListingId: string,
    startDate: Date,
    endDate: Date
  ): Promise<IApplication[]> {
    if (!mongoose.Types.ObjectId.isValid(jobListingId)) {
      throw new BadRequestError('Invalid job listing ID');
    }

    if (!startDate || !endDate) {
      throw new BadRequestError('Start date and end date are required');
    }

    if (startDate > endDate) {
      throw new BadRequestError('Start date must be before end date');
    }

    const applications = await this._applicationRepository.getApplicationsByDateRange(
      jobListingId,
      startDate,
      endDate
    );

    return applications;
  }

  async searchApplicationsByResponse(
    jobListingId: string,
    fieldName: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    searchValue: any
  ): Promise<IApplication[]> {
    if (!mongoose.Types.ObjectId.isValid(jobListingId)) {
      throw new BadRequestError('Invalid job listing ID');
    }

    if (!fieldName) {
      throw new BadRequestError('Field name is required');
    }

    const applications = await this._applicationRepository.searchApplicationsByResponse(
      jobListingId,
      fieldName,
      searchValue
    );

    return applications;
  }

  async bulkUpdateApplicationStatus(
    applicationIds: string[],
    status: string
  ): Promise<{ modifiedCount: number }> {
    if (!applicationIds || applicationIds.length === 0) {
      throw new BadRequestError('Application IDs are required');
    }

    // Validate all IDs
    const invalidIds = applicationIds.filter(id => !mongoose.Types.ObjectId.isValid(id));
    if (invalidIds.length > 0) {
      throw new BadRequestError('One or more invalid application IDs');
    }

    const validStatuses = ['submitted', 'under_review', 'shortlisted', 'rejected', 'accepted'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestError('Invalid application status');
    }

    const result = await this._applicationRepository.bulkUpdateApplicationStatus(
      applicationIds,
      status
    );

    return result;
  }

  async getRecentApplications(jobListingId: string, limit: number = 5): Promise<IApplication[]> {
    if (!mongoose.Types.ObjectId.isValid(jobListingId)) {
      throw new BadRequestError('Invalid job listing ID');
    }

    if (limit < 1 || limit > 50) {
      throw new BadRequestError('Limit must be between 1 and 50');
    }

    const applications = await this._applicationRepository.getRecentApplications(
      jobListingId,
      limit
    );

    return applications;
  }

  async getApplicationStatistics(jobListingId: string) {
    if (!mongoose.Types.ObjectId.isValid(jobListingId)) {
      throw new BadRequestError('Invalid job listing ID');
    }

    const [
      total,
      submitted,
      underReview,
      shortlisted,
      rejected,
      accepted,
    ] = await Promise.all([
      this._applicationRepository.getApplicationsCount(jobListingId),
      this._applicationRepository.getApplicationsCountByStatus(jobListingId, 'submitted'),
      this._applicationRepository.getApplicationsCountByStatus(jobListingId, 'under_review'),
      this._applicationRepository.getApplicationsCountByStatus(jobListingId, 'shortlisted'),
      this._applicationRepository.getApplicationsCountByStatus(jobListingId, 'rejected'),
      this._applicationRepository.getApplicationsCountByStatus(jobListingId, 'accepted'),
    ]);

    return {
      total,
      byStatus: {
        submitted,
        under_review: underReview,
        shortlisted,
        rejected,
        accepted,
      },
    };
  }
}

export default new ApplicationService(new ApplicationRepository());