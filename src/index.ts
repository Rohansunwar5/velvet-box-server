import app from './app';
import logger from './utils/logger';
import connectDB from './db';
import redisClient from './services/cache';

(async () => {
  logger.info('Connecting to Database...');
  await connectDB();
  logger.info('DB connected');
  await redisClient.connect();

 const port = parseInt(process.env.PORT || "4010", 10);

app.listen(port, "0.0.0.0", () => {
  logger.info(`Server running on port ${port}`);
});
})();