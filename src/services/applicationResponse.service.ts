import { BadRequestError } from '../errors/bad-request.error';
import { InternalServerError } from '../errors/internal-server.error';
import { NotFoundError } from '../errors/not-found.error';

import mongoose from 'mongoose';
import ApplicationRepository, { ApplicationRepository as AppRepo } from '../repository/applicationResponse.repository';
import { IApplication, IApplicationResponse } from '../models/applicationResponse.model';

interface ISubmitApplicationParams {
  jobListingId: string;
  candidate: {
    name: string;
    email: string;
    phone?: string;
  };
  responses: IApplicationResponse[];
  formSnapshot: {
    customSections: any; // eslint-disable-line @typescript-eslint/no-explicit-any
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
  constructor(private readonly _applicationRepository: AppRepo) {}

  // Helper to validate recording responses
  private validateRecordingResponse(response: IApplicationResponse, fieldConfig?: any): void { // eslint-disable-line @typescript-eslint/no-explicit-any
    const fieldType = response.fieldType;

    if (fieldType === 'voice_recording') {
      if (!response.voiceRecording || !response.voiceRecording.url) {
        if (fieldConfig?.isRequired) {
          throw new BadRequestError(`Voice recording is required for field: ${response.fieldLabel}`);
        }
      } else {
        // Validate duration if config exists
        if (fieldConfig?.recordingConfig) {
          const { minDuration, maxDuration } = fieldConfig.recordingConfig;
          const duration = response.voiceRecording.duration;

          if (minDuration && duration < minDuration) {
            throw new BadRequestError(
              `Voice recording for ${response.fieldLabel} must be at least ${minDuration} seconds`
            );
          }
          if (maxDuration && duration > maxDuration) {
            throw new BadRequestError(
              `Voice recording for ${response.fieldLabel} cannot exceed ${maxDuration} seconds`
            );
          }
        }
      }
    }

    if (fieldType === 'video_recording') {
      if (!response.videoRecording || !response.videoRecording.url) {
        if (fieldConfig?.isRequired) {
          throw new BadRequestError(`Video recording is required for field: ${response.fieldLabel}`);
        }
      } else {
        // Validate duration if config exists
        if (fieldConfig?.recordingConfig) {
          const { minDuration, maxDuration } = fieldConfig.recordingConfig;
          const duration = response.videoRecording.duration;

          if (minDuration && duration < minDuration) {
            throw new BadRequestError(
              `Video recording for ${response.fieldLabel} must be at least ${minDuration} seconds`
            );
          }
          if (maxDuration && duration > maxDuration) {
            throw new BadRequestError(
              `Video recording for ${response.fieldLabel} cannot exceed ${maxDuration} seconds`
            );
          }
        }
      }
    }
  }

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

    // Validate recording responses against formSnapshot
    if (formSnapshot && formSnapshot.customSections) {
      for (const section of formSnapshot.customSections) {
        if (section.fields) {
          for (const field of section.fields) {
            const response = responses.find(r => r.fieldName === field.fieldName);
            if (response) {
              this.validateRecordingResponse(response, field);
            } else if (field.isRequired) {
              throw new BadRequestError(`Required field missing: ${field.fieldLabel}`);
            }
          }
        }
      }
    }

    // Add uploadedAt timestamp to recordings
    const processedResponses = responses.map(response => {
      const processed = { ...response };

      if (response.voiceRecording && !response.voiceRecording.uploadedAt) {
        processed.voiceRecording = {
          ...response.voiceRecording,
          uploadedAt: new Date()
        };
      }

      if (response.videoRecording && !response.videoRecording.uploadedAt) {
        processed.videoRecording = {
          ...response.videoRecording,
          uploadedAt: new Date()
        };
      }

      return processed;
    });

    // Create application
    const application = await this._applicationRepository.createApplication({
      jobListingId,
      candidate,
      responses: processedResponses,
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

  // NEW: Get applications with voice recordings
  async getApplicationsWithVoiceRecordings(jobListingId: string): Promise<IApplication[]> {
    if (!mongoose.Types.ObjectId.isValid(jobListingId)) {
      throw new BadRequestError('Invalid job listing ID');
    }

    const applications = await this._applicationRepository.getApplicationsWithVoiceRecordings(jobListingId);
    return applications;
  }

  // NEW: Get applications with video recordings
  async getApplicationsWithVideoRecordings(jobListingId: string): Promise<IApplication[]> {
    if (!mongoose.Types.ObjectId.isValid(jobListingId)) {
      throw new BadRequestError('Invalid job listing ID');
    }

    const applications = await this._applicationRepository.getApplicationsWithVideoRecordings(jobListingId);
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
    searchValue: any // eslint-disable-line @typescript-eslint/no-explicit-any
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

export default new ApplicationService(ApplicationRepository);