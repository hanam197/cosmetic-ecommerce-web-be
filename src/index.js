import dotenv from 'dotenv';
dotenv.config();



import express from 'express';
import cors from 'cors';
import logger from './middlewares/logger.js';
import productsRoute from './routes/products.js';
import cartRoute from './routes/cart.js';
import ordersRoute from './routes/orders.js';
import paymentsRoute from './routes/payments.js';
import { swaggerUi, specs } from './swagger/swaggerConfig.js';
import connectDB from './config/database.js';
import authRoute from './routes/auth.js';

const app = express();
const PORT = process.env.PORT || 5000;

console.log('=== ENV VARIABLES CHECK ===');
console.log('PORT:', PORT);
console.log('FRONTEND_URL:', process.env.FRONTEND_URL || 'http://localhost:3001');
console.log('VNPAY_TMN_CODE:', process.env.VNPAY_TMN_CODE ? '***' : 'NOT SET');
console.log('VNPAY_SECRET_KEY:', process.env.VNPAY_SECRET_KEY ? '***' : 'NOT SET');
console.log('VNPAY_URL:', process.env.VNPAY_URL);
console.log('VNPAY_RETURN_URL:', process.env.VNPAY_RETURN_URL);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('=== END ENV CHECK ===\n');

// Middlewares
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
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
app.use('/api/products', productsRoute);
app.use('/api/cart', cartRoute);
app.use('/api/auth', authRoute);
app.use('/api/orders', ordersRoute);
app.use('/api/payment', paymentsRoute);

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