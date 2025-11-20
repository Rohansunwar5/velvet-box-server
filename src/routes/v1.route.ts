import { Router } from 'express';
import { country, health, helloWorld } from '../controllers/health.controller';
import { asyncHandler } from '../utils/asynchandler';
import authRouter from './auth.route';
import contactRouter from './contact.route';
import jobListingRouter from './jobListing.route';
import applicationRouter from './applicationResponse.route';

const v1Router = Router();

v1Router.get('/', asyncHandler(helloWorld));
v1Router.get('/health', asyncHandler(health));
v1Router.use('/auth', authRouter);
v1Router.use('/contact', contactRouter);
v1Router.use('/joblist', jobListingRouter);
v1Router.use('/application', applicationRouter);
v1Router.get('/country', asyncHandler(country));

export default v1Router;
