import express from 'express';
import logger from './middlewares/logger.js';
import sampleRoute from './routes/sample.js';
import controllerSampleRoute from './routes/controllerSample.js';
import productsRoute from './routes/products.js';
import { swaggerUi, specs } from './swagger/swaggerConfig.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(logger);

// Swagger UI setup
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

app.use(sampleRoute);
app.use(controllerSampleRoute);
app.use(productsRoute);

app.get('/', (req, res) => {
  res.send('Hello, World! 11111sssssssss1111ssss1');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

