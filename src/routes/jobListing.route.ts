import { Router } from 'express';
import { asyncHandler } from '../utils/asynchandler';
import {
  createJobListing,
  getJobListingById,
  getJobListingBySlug,
  getAllJobListings,
  getPublishedJobListings,
  updateJobListing,
  updateJobStatus,
  publishJobListing,
  unpublishJobListing,
  addMediaToJobListing,
  removeMediaFromJobListing,
  updateMedia,
  addCustomSection,
  updateCustomSection,
  removeCustomSection,
  incrementApplications,
  decrementApplications,
  getJobListingsByDateRange,
  searchJobListings,
  getExpiredJobListings,
  closeExpiredJobListings,
  deleteJobListing,
  getJobListingsByLocation,
  bulkUpdateStatus,
  addTagsToJobListing,
  removeTagsFromJobListing,
  getJobListingsByEmploymentType,
  uploadImageForForms,
  uploadDocumentForForms,
  uploadVoiceRecording,
  uploadVideoRecording
} from '../controllers/jobListing.controller';
import isLoggedIn from '../middlewares/isLoggedIn.middleware';
import { uploadDocument, uploadImage, uploadRecording } from '../middlewares/multer.middleware';

const jobListingRouter = Router();

// Public routes
jobListingRouter.get('/published', asyncHandler(getPublishedJobListings));
jobListingRouter.get('/search', asyncHandler(searchJobListings));
jobListingRouter.get('/location', asyncHandler(getJobListingsByLocation));
jobListingRouter.get('/employment-type/:employmentType', asyncHandler(getJobListingsByEmploymentType));
// jobListingRouter.get('/tags/popular', asyncHandler(getPopularTags));
jobListingRouter.get('/slug/:slug', asyncHandler(getJobListingBySlug));
jobListingRouter.get('/:jobId', asyncHandler(getJobListingById));
jobListingRouter.post('/upload-image', uploadImage, asyncHandler(uploadImageForForms));
jobListingRouter.post('/upload-document', uploadDocument, asyncHandler(uploadDocumentForForms));
jobListingRouter.post('/upload-voice-recording', uploadRecording, asyncHandler(uploadVoiceRecording));
jobListingRouter.post('/upload-video-recording', uploadRecording, asyncHandler(uploadVideoRecording));
// jobListingRouter.get('/:jobId/similar', asyncHandler(getSimilarJobListings));


// Protected routes - require authentication
jobListingRouter.post('/', isLoggedIn, asyncHandler(createJobListing));
jobListingRouter.get('/', isLoggedIn, asyncHandler(getAllJobListings));
jobListingRouter.patch('/:jobId', isLoggedIn, asyncHandler(updateJobListing));
jobListingRouter.delete('/:jobId', isLoggedIn, asyncHandler(deleteJobListing));

// Company-specific routes
// jobListingRouter.get('/company/:companyId', asyncHandler(getJobListingsByCompany));

// Status management
jobListingRouter.patch('/:jobId/status', isLoggedIn, asyncHandler(updateJobStatus));
jobListingRouter.post('/:jobId/publish', isLoggedIn, asyncHandler(publishJobListing));
jobListingRouter.post('/:jobId/unpublish', isLoggedIn, asyncHandler(unpublishJobListing));
jobListingRouter.post('/bulk/status', isLoggedIn, asyncHandler(bulkUpdateStatus));

// Media management
jobListingRouter.post('/:jobId/media', isLoggedIn, asyncHandler(addMediaToJobListing));
jobListingRouter.delete('/:jobId/media/:mediaId', isLoggedIn, asyncHandler(removeMediaFromJobListing));
jobListingRouter.patch('/:jobId/media/:mediaId', isLoggedIn, asyncHandler(updateMedia));

// Custom sections management
jobListingRouter.post('/:jobId/sections', isLoggedIn, asyncHandler(addCustomSection));
jobListingRouter.patch('/:jobId/sections/:sectionId', isLoggedIn, asyncHandler(updateCustomSection));
jobListingRouter.delete('/:jobId/sections/:sectionId', isLoggedIn, asyncHandler(removeCustomSection));

// Tags management
jobListingRouter.post('/:jobId/tags', isLoggedIn, asyncHandler(addTagsToJobListing));
jobListingRouter.delete('/:jobId/tags', isLoggedIn, asyncHandler(removeTagsFromJobListing));

// Applications management
jobListingRouter.post('/:jobId/applications/increment', asyncHandler(incrementApplications));
jobListingRouter.post('/:jobId/applications/decrement', asyncHandler(decrementApplications));

// Statistics and analytics
// jobListingRouter.get('/stats/overview', isLoggedIn, asyncHandler(getJobListingStats));
jobListingRouter.get('/stats/date-range', isLoggedIn, asyncHandler(getJobListingsByDateRange));

// Expired jobs management
jobListingRouter.get('/expired/list', isLoggedIn, asyncHandler(getExpiredJobListings));
jobListingRouter.post('/expired/close', isLoggedIn, asyncHandler(closeExpiredJobListings));

export default jobListingRouter;