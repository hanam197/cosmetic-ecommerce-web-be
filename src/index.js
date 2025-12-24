import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import logger from './middlewares/logger.js';
import sampleRoute from './routes/sample.js';
import controllerSampleRoute from './routes/controllerSample.js';
import productsRoute from './routes/products.js';
import { swaggerUi, specs } from './swagger/swaggerConfig.js';
import connectDB from './config/db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logger);

// Database connection
connectDB().catch(err => {
  console.error('Database connection failed:', err.message);
  console.log('Server will still start without database...');
});

// Swagger UI setup
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Routes
app.use(sampleRoute);
app.use(controllerSampleRoute);
app.use(productsRoute);

app.get('/', (req, res) => {
  res.json({
    message: 'Cosmetic Ecommerce API',
    version: '1.0.0',
    status: 'running'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

app.listen(PORT, () => {
  console.log(`✓ Server is running on port ${PORT}`);
  console.log(`✓ API docs: http://localhost:${PORT}/api-docs`);
  console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
});