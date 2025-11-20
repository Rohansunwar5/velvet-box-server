
import mongoose from 'mongoose';
import applicationResponseModel, { IApplication } from '../models/applicationResponse.model';

export interface ICreateApplicationParams {
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
    value?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    files?: Array<{
      url: string;
      filename: string;
      size: number;
      mimeType: string;
      uploadedAt: Date;
    }>;
  }>;
  formSnapshot: {
    customSections: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  };
}

export interface IUpdateApplicationStatusParams {
  applicationId: string;
  status: 'submitted' | 'under_review' | 'shortlisted' | 'rejected' | 'accepted';
  notes?: string;
  rating?: number;
}

export class ApplicationRepository {
  private _model = applicationResponseModel;

  async createApplication(params: ICreateApplicationParams): Promise<IApplication> {
    const { jobListingId, candidate, responses, formSnapshot } = params;

    return this._model.create({
      jobListingId: new mongoose.Types.ObjectId(jobListingId),
      candidate,
      responses,
      formSnapshot,
      submittedAt: new Date(),
    });
  }

  async getApplicationById(applicationId: string): Promise<IApplication | null> {
    return this._model.findById(applicationId);
  }

  async getApplicationsByJobListing(jobListingId: string): Promise<IApplication[]> {
    return this._model
      .find({ jobListingId: new mongoose.Types.ObjectId(jobListingId) })
      .sort({ submittedAt: -1 });
  }

  async getApplicationsByJobListingAndStatus(
    jobListingId: string,
    status: string
  ): Promise<IApplication[]> {
    return this._model
      .find({
        jobListingId: new mongoose.Types.ObjectId(jobListingId),
        status,
      })
      .sort({ submittedAt: -1 });
  }

  async getApplicationByEmailAndJob(
    email: string,
    jobListingId: string
  ): Promise<IApplication | null> {
    return this._model.findOne({
      'candidate.email': email.toLowerCase(),
      jobListingId: new mongoose.Types.ObjectId(jobListingId),
    });
  }

  async getApplicationsByCandidateEmail(email: string): Promise<IApplication[]> {
    return this._model
      .find({ 'candidate.email': email.toLowerCase() })
      .sort({ submittedAt: -1 });
  }

  async updateApplicationStatus(params: IUpdateApplicationStatusParams): Promise<IApplication | null> {
    const { applicationId, status, notes, rating } = params;

    const updateData: any = { status }; // eslint-disable-line @typescript-eslint/no-explicit-any
    if (notes !== undefined) updateData.notes = notes;
    if (rating !== undefined) updateData.rating = rating;

    return this._model.findByIdAndUpdate(
      applicationId,
      updateData,
      { new: true }
    );
  }

  async updateApplicationNotes(
    applicationId: string,
    notes: string
  ): Promise<IApplication | null> {
    return this._model.findByIdAndUpdate(
      applicationId,
      { notes },
      { new: true }
    );
  }

  async updateApplicationRating(
    applicationId: string,
    rating: number
  ): Promise<IApplication | null> {
    return this._model.findByIdAndUpdate(
      applicationId,
      { rating },
      { new: true }
    );
  }

  async deleteApplication(applicationId: string): Promise<IApplication | null> {
    return this._model.findByIdAndDelete(applicationId);
  }

  async getApplicationsCount(jobListingId: string): Promise<number> {
    return this._model.countDocuments({
      jobListingId: new mongoose.Types.ObjectId(jobListingId),
    });
  }

  async getApplicationsCountByStatus(
    jobListingId: string,
    status: string
  ): Promise<number> {
    return this._model.countDocuments({
      jobListingId: new mongoose.Types.ObjectId(jobListingId),
      status,
    });
  }

  async checkApplicationExists(
    email: string,
    jobListingId: string
  ): Promise<boolean> {
    const count = await this._model.countDocuments({
      'candidate.email': email.toLowerCase(),
      jobListingId: new mongoose.Types.ObjectId(jobListingId),
    });
    return count > 0;
  }

  async getApplicationsByDateRange(
    jobListingId: string,
    startDate: Date,
    endDate: Date
  ): Promise<IApplication[]> {
    return this._model
      .find({
        jobListingId: new mongoose.Types.ObjectId(jobListingId),
        submittedAt: {
          $gte: startDate,
          $lte: endDate,
        },
      })
      .sort({ submittedAt: -1 });
  }

  async searchApplicationsByResponse(
    jobListingId: string,
    fieldName: string,
    searchValue: any // eslint-disable-line @typescript-eslint/no-explicit-any
  ): Promise<IApplication[]> {
    return this._model.find({
      jobListingId: new mongoose.Types.ObjectId(jobListingId),
      responses: {
        $elemMatch: {
          fieldName,
          value: searchValue,
        },
      },
    });
  }

  async getApplicationsPaginated(
    jobListingId: string,
    page: number = 1,
    limit: number = 10,
    status?: string
  ): Promise<{ applications: IApplication[]; total: number; pages: number }> {
    const query: any = { jobListingId: new mongoose.Types.ObjectId(jobListingId) }; // eslint-disable-line @typescript-eslint/no-explicit-any
    if (status) query.status = status;

    const skip = (page - 1) * limit;

    const [applications, total] = await Promise.all([
      this._model.find(query).sort({ submittedAt: -1 }).skip(skip).limit(limit),
      this._model.countDocuments(query),
    ]);

    return {
      applications,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  async bulkUpdateApplicationStatus(
    applicationIds: string[],
    status: string
  ): Promise<{ modifiedCount: number }> {
    const result = await this._model.updateMany(
      { _id: { $in: applicationIds } },
      { status }
    );
    return { modifiedCount: result.modifiedCount };
  }

  async getRecentApplications(
    jobListingId: string,
    limit: number = 5
  ): Promise<IApplication[]> {
    return this._model
      .find({ jobListingId: new mongoose.Types.ObjectId(jobListingId) })
      .sort({ submittedAt: -1 })
      .limit(limit);
  }
}