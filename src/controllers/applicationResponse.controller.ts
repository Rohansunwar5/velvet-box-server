import { NextFunction, Request, Response } from 'express';
import applicationResponseService from '../services/applicationResponse.service';


export const submitApplication = async (req: Request, res: Response, next: NextFunction) => {
  const { jobListingId, candidate, responses, formSnapshot } = req.body;
  const response = await applicationResponseService.submitApplication({
    jobListingId,
    candidate,
    responses,
    formSnapshot,
  });

  next(response);
};

export const getApplicationById = async (req: Request, res: Response, next: NextFunction) => {
  const { applicationId } = req.params;
  const response = await applicationResponseService.getApplicationById(applicationId);

  next(response);
};

export const getApplicationsByJobListing = async (req: Request, res: Response, next: NextFunction) => {
  const { jobListingId } = req.params;
  const { status, page, limit } = req.query;

  const response = await applicationResponseService.getApplicationsByJobListing({
    jobListingId,
    status: status as string,
    page: page ? parseInt(page as string) : undefined,
    limit: limit ? parseInt(limit as string) : undefined,
  });

  next(response);
};

export const getApplicationsByCandidateEmail = async (req: Request, res: Response, next: NextFunction) => {
  const { email } = req.params;
  const response = await applicationResponseService.getApplicationsByCandidateEmail(email);

  next(response);
};

export const updateApplicationStatus = async (req: Request, res: Response, next: NextFunction) => {
  const { applicationId } = req.params;
  const { status, notes, rating } = req.body;

  const response = await applicationResponseService.updateApplicationStatus({
    applicationId,
    status,
    notes,
    rating,
  });

  next(response);
};

export const addNotesToApplication = async (req: Request, res: Response, next: NextFunction) => {
  const { applicationId } = req.params;
  const { notes } = req.body;

  const response = await applicationResponseService.addNotesToApplication(applicationId, notes);

  next(response);
};

export const rateApplication = async (req: Request, res: Response, next: NextFunction) => {
  const { applicationId } = req.params;
  const { rating } = req.body;

  const response = await applicationResponseService.rateApplication(applicationId, rating);

  next(response);
};

export const deleteApplication = async (req: Request, res: Response, next: NextFunction) => {
  const { applicationId } = req.params;
  const response = await applicationResponseService.deleteApplication(applicationId);

  next(response);
};

export const getApplicationsCount = async (req: Request, res: Response, next: NextFunction) => {
  const { jobListingId } = req.params;
  const response = await applicationResponseService.getApplicationsCount(jobListingId);

  next(response);
};

export const getApplicationsCountByStatus = async (req: Request, res: Response, next: NextFunction) => {
  const { jobListingId } = req.params;
  const { status } = req.query;

  const response = await applicationResponseService.getApplicationsCountByStatus(
    jobListingId,
    status as string
  );

  next(response);
};

export const checkApplicationExists = async (req: Request, res: Response, next: NextFunction) => {
  const { jobListingId } = req.params;
  const { email } = req.query;

  const response = await applicationResponseService.checkApplicationExists(
    email as string,
    jobListingId
  );

  next(response);
};

export const getApplicationsByDateRange = async (req: Request, res: Response, next: NextFunction) => {
  const { jobListingId } = req.params;
  const { startDate, endDate } = req.query;

  const response = await applicationResponseService.getApplicationsByDateRange(
    jobListingId,
    new Date(startDate as string),
    new Date(endDate as string)
  );

  next(response);
};

export const searchApplicationsByResponse = async (req: Request, res: Response, next: NextFunction) => {
  const { jobListingId } = req.params;
  const { fieldName, searchValue } = req.query;

  const response = await applicationResponseService.searchApplicationsByResponse(
    jobListingId,
    fieldName as string,
    searchValue
  );

  next(response);
};

export const bulkUpdateApplicationStatus = async (req: Request, res: Response, next: NextFunction) => {
  const { applicationIds, status } = req.body;

  const response = await applicationResponseService.bulkUpdateApplicationStatus(applicationIds, status);

  next(response);
};

export const getRecentApplications = async (req: Request, res: Response, next: NextFunction) => {
  const { jobListingId } = req.params;
  const { limit } = req.query;

  const response = await applicationResponseService.getRecentApplications(
    jobListingId,
    limit ? parseInt(limit as string) : undefined
  );

  next(response);
};

export const getApplicationStatistics = async (req: Request, res: Response, next: NextFunction) => {
  const { jobListingId } = req.params;
  const response = await applicationResponseService.getApplicationStatistics(jobListingId);

  next(response);
};