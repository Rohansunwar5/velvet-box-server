import { Router } from 'express';
import { asyncHandler } from '../utils/asynchandler';
import {
  submitApplication,
  getApplicationById,
  getApplicationsByJobListing,
  getApplicationsByCandidateEmail,
  updateApplicationStatus,
  addNotesToApplication,
  rateApplication,
  deleteApplication,
  getApplicationsCount,
  getApplicationsCountByStatus,
  checkApplicationExists,
  getApplicationsByDateRange,
  searchApplicationsByResponse,
  bulkUpdateApplicationStatus,
  getRecentApplications,
  getApplicationStatistics,
} from '../controllers/applicationResponse.controller';
// import {
//   submitApplicationValidator,
//   getApplicationByIdValidator,
//   getApplicationsByJobListingValidator,
//   getApplicationsByCandidateEmailValidator,
//   updateApplicationStatusValidator,
//   addNotesToApplicationValidator,
//   rateApplicationValidator,
//   deleteApplicationValidator,
//   getApplicationsCountValidator,
//   getApplicationsCountByStatusValidator,
//   checkApplicationExistsValidator,
//   getApplicationsByDateRangeValidator,
//   searchApplicationsByResponseValidator,
//   bulkUpdateApplicationStatusValidator,
//   getRecentApplicationsValidator,
//   getApplicationStatisticsValidator,
// } from '../middlewares/validators/application.validator';
import isLoggedIn from '../middlewares/isLoggedIn.middleware';

const applicationRouter = Router();

// Public routes (for candidates)
applicationRouter.post(
  '/submit',
  asyncHandler(submitApplication)
);

applicationRouter.get(
  '/check-exists/:jobListingId',
  asyncHandler(checkApplicationExists)
);

applicationRouter.get(
  '/candidate/:email',
  asyncHandler(getApplicationsByCandidateEmail)
);

// Protected routes (for recruiters/admins)
applicationRouter.get(
  '/:applicationId',
  isLoggedIn,
  asyncHandler(getApplicationById)
);

applicationRouter.get(
  '/job/:jobListingId',
  isLoggedIn,
  asyncHandler(getApplicationsByJobListing)
);

applicationRouter.patch(
  '/:applicationId/status',
  isLoggedIn,
  asyncHandler(updateApplicationStatus)
);

applicationRouter.patch(
  '/:applicationId/notes',
  isLoggedIn,
  asyncHandler(addNotesToApplication)
);

applicationRouter.patch(
  '/:applicationId/rating',
  isLoggedIn,
  asyncHandler(rateApplication)
);

applicationRouter.delete(
  '/:applicationId',
  isLoggedIn,
  asyncHandler(deleteApplication)
);

applicationRouter.get(
  '/count/:jobListingId',
  isLoggedIn,
  asyncHandler(getApplicationsCount)
);

applicationRouter.get(
  '/count-by-status/:jobListingId',
  isLoggedIn,
  asyncHandler(getApplicationsCountByStatus)
);

applicationRouter.get(
  '/date-range/:jobListingId',
  isLoggedIn,
  asyncHandler(getApplicationsByDateRange)
);

applicationRouter.get(
  '/search/:jobListingId',
  isLoggedIn,
  asyncHandler(searchApplicationsByResponse)
);

applicationRouter.patch(
  '/bulk-update-status',
  isLoggedIn,
  asyncHandler(bulkUpdateApplicationStatus)
);

applicationRouter.get(
  '/recent/:jobListingId',
  isLoggedIn,
  asyncHandler(getRecentApplications)
);

applicationRouter.get(
  '/statistics/:jobListingId',
  isLoggedIn,
  asyncHandler(getApplicationStatistics)
);

export default applicationRouter;