import { NextFunction, Request, Response } from 'express';
import jobListingService from '../services/jobListing.service';
import { JobStatus } from '../models/joblisting.model';

export const createJobListing = async (req: Request, res: Response, next: NextFunction) => {
  const response = await jobListingService.createJobListing({
    ...req.body
  });

  next(response);
};

export const getJobListingById = async (req: Request, res: Response, next: NextFunction) => {
  const { jobId } = req.params;
  const { incrementViews } = req.query;
  const response = await jobListingService.getJobListingById(
    jobId,
    incrementViews === 'true'
  );

  next(response);
};

export const getJobListingBySlug = async (req: Request, res: Response, next: NextFunction) => {
  const { slug } = req.params;
  const { incrementViews } = req.query;
  const response = await jobListingService.getJobListingBySlug(
    slug,
    incrementViews === 'true'
  );

  next(response);
};

export const getAllJobListings = async (req: Request, res: Response, next: NextFunction) => {
  const {
    page = 1,
    limit = 10,
    status,
    sortBy,
    startDate,
    endDate,
    searchTerm,
    tags,
    city,
    state,
    country,
    isRemote,
    employmentType
  } = req.query;

  const response = await jobListingService.getAllJobListings({
    page: Number(page),
    limit: Number(limit),
    status: status as JobStatus,
    sortBy: sortBy as string,
    startDate: startDate ? new Date(startDate as string) : undefined,
    endDate: endDate ? new Date(endDate as string) : undefined,
    searchTerm: searchTerm as string,
    tags: tags ? (Array.isArray(tags) ? tags : [tags]) as string[] : undefined,
    location: city || state || country ? {
      city: city as string,
      state: state as string,
      country: country as string
    } : undefined,
    isRemote: isRemote === 'true' ? true : isRemote === 'false' ? false : undefined,
    employmentType: employmentType as string
  });

  next(response);
};


export const getPublishedJobListings = async (req: Request, res: Response, next: NextFunction) => {
  const {
    page = 1,
    limit = 10,
    tags,
    city,
    state,
    country,
    isRemote,
    experienceMin,
    experienceMax,
    employmentType
  } = req.query;

  const response = await jobListingService.getPublishedJobListings(
    Number(page),
    Number(limit),
    {
      tags: tags ? (Array.isArray(tags) ? tags : [tags]) as string[] : undefined,
      location: city || state || country ? {
        city: city as string,
        state: state as string,
        country: country as string
      } : undefined,
      isRemote: isRemote === 'true' ? true : isRemote === 'false' ? false : undefined,
      experienceMin: experienceMin ? Number(experienceMin) : undefined,
      experienceMax: experienceMax ? Number(experienceMax) : undefined,
      employmentType: employmentType as string
    }
  );

  next(response);
};

export const updateJobListing = async (req: Request, res: Response, next: NextFunction) => {
  const { jobId } = req.params;

  const response = await jobListingService.updateJobListing(
    jobId,
    req.body,
  );

  next(response);
};

export const updateJobStatus = async (req: Request, res: Response, next: NextFunction) => {
  const { jobId } = req.params;
  const { status } = req.body;

  const response = await jobListingService.updateJobStatus(jobId, status);

  next(response);
};

export const publishJobListing = async (req: Request, res: Response, next: NextFunction) => {
  const { jobId } = req.params;

  const response = await jobListingService.publishJobListing(jobId);

  next(response);
};

export const unpublishJobListing = async (req: Request, res: Response, next: NextFunction) => {
  const { jobId } = req.params;

  const response = await jobListingService.unpublishJobListing(jobId);

  next(response);
};

export const addMediaToJobListing = async (req: Request, res: Response, next: NextFunction) => {
  const { jobId } = req.params;
  const { url, type, filename, size, mimeType, caption, order } = req.body;

  const response = await jobListingService.addMediaToJobListing(
    jobId,
    { url, type, filename, size, mimeType, caption, order }
  );

  next(response);
};

export const removeMediaFromJobListing = async (req: Request, res: Response, next: NextFunction) => {
  const { jobId, mediaId } = req.params;

  const response = await jobListingService.removeMediaFromJobListing(jobId, mediaId);

  next(response);
};

export const updateMedia = async (req: Request, res: Response, next: NextFunction) => {
  const { jobId, mediaId } = req.params;
  const { caption, order } = req.body;

  const response = await jobListingService.updateMedia(
    jobId,
    mediaId,
    { caption, order },
  );

  next(response);
};

export const addCustomSection = async (req: Request, res: Response, next: NextFunction) => {
  const { jobId } = req.params;
  const { sectionTitle, sectionDescription, fields, order} = req.body;

  const response = await jobListingService.addCustomSection(
    jobId,
    { sectionTitle, sectionDescription, fields, order },
  );

  next(response);
};

export const updateCustomSection = async (req: Request, res: Response, next: NextFunction) => {
  const { jobId, sectionId } = req.params;
  const { sectionTitle, sectionDescription, fields, order } = req.body;

  const response = await jobListingService.updateCustomSection(
    jobId,
    sectionId,
    { sectionTitle, sectionDescription, fields, order },
  );

  next(response);
};

export const removeCustomSection = async (req: Request, res: Response, next: NextFunction) => {
  const { jobId, sectionId } = req.params;
  const response = await jobListingService.removeCustomSection(jobId, sectionId);

  next(response);
};

export const incrementApplications = async (req: Request, res: Response, next: NextFunction) => {
  const { jobId } = req.params;

  const response = await jobListingService.incrementApplications(jobId);

  next(response);
};

export const decrementApplications = async (req: Request, res: Response, next: NextFunction) => {
  const { jobId } = req.params;

  const response = await jobListingService.decrementApplications(jobId);

  next(response);
};

export const getJobListingsByDateRange = async (req: Request, res: Response, next: NextFunction) => {
  const { startDate, endDate, page = 1, limit = 10 } = req.query;

  const response = await jobListingService.getJobListingsByDateRange(
    new Date(startDate as string),
    new Date(endDate as string),
    Number(page),
    Number(limit)
  );

  next(response);
};

// export const getJobListingStats = async (req: Request, res: Response, next: NextFunction) => {
//   const response = await jobListingService.getJobListingStats(companyId as string);

//   next(response);
// };

export const getPopularTags = async (req: Request, res: Response, next: NextFunction) => {
  const { limit = 20 } = req.query;

  const response = await jobListingService.getPopularTags(Number(limit));

  next(response);
};

export const searchJobListings = async (req: Request, res: Response, next: NextFunction) => {
  const { searchTerm, page = 1, limit = 10 } = req.query;

  const response = await jobListingService.searchJobListings(
    searchTerm as string,
    Number(page),
    Number(limit)
  );

  next(response);
};

export const getExpiredJobListings = async (req: Request, res: Response, next: NextFunction) => {
  const { page = 1, limit = 10 } = req.query;

  const response = await jobListingService.getExpiredJobListings(
    Number(page),
    Number(limit)
  );

  next(response);
};

export const closeExpiredJobListings = async (req: Request, res: Response, next: NextFunction) => {
  const response = await jobListingService.closeExpiredJobListings();

  next(response);
};

export const deleteJobListing = async (req: Request, res: Response, next: NextFunction) => {
  const { jobId } = req.params;

  const response = await jobListingService.deleteJobListing(jobId);

  next(response);
};

export const getJobListingsByLocation = async (req: Request, res: Response, next: NextFunction) => {
  const { city, state, country, page = 1, limit = 10 } = req.query;

  const response = await jobListingService.getJobListingsByLocation(
    city as string,
    state as string,
    country as string,
    Number(page),
    Number(limit)
  );

  next(response);
};

export const bulkUpdateStatus = async (req: Request, res: Response, next: NextFunction) => {
  const { jobIds, status} = req.body;

  const response = await jobListingService.bulkUpdateStatus(jobIds, status );

  next(response);
};

export const addTagsToJobListing = async (req: Request, res: Response, next: NextFunction) => {
  const { jobId } = req.params;
  const { tags } = req.body;

  const response = await jobListingService.addTagsToJobListing(jobId, tags);

  next(response);
};

export const removeTagsFromJobListing = async (req: Request, res: Response, next: NextFunction) => {
  const { jobId } = req.params;
  const { tags } = req.body;

  const response = await jobListingService.removeTagsFromJobListing(jobId, tags);

  next(response);
};

export const getJobListingsByEmploymentType = async (req: Request, res: Response, next: NextFunction) => {
  const { employmentType } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const response = await jobListingService.getJobListingsByEmploymentType(
    employmentType,
    Number(page),
    Number(limit)
  );

  next(response);
};

export const getSimilarJobListings = async (req: Request, res: Response, next: NextFunction) => {
  const { jobId } = req.params;
  const { limit = 5 } = req.query;

  const response = await jobListingService.getSimilarJobListings(jobId, Number(limit));

  next(response);
};

export const uploadImageForForms = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.file) {
      // no file uploaded
      return next({ status: 400, message: 'No file uploaded' });
    }

    const imageUrls = await jobListingService.handleImageUploads({ files: [req.file] });
    next(imageUrls);
};

export const uploadDocumentForForms = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.file) {
    return next({ status: 400, message: 'No document uploaded' });
  }

  const documentUrls = await jobListingService.handleDocumentUploads({
    files: [req.file]
  });

  next(documentUrls);
};