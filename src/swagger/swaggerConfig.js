import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import dotenv from 'dotenv';

dotenv.config();

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Cosmetic E-commerce API',
      version: '1.0.0',
      description: 'API documentation for Cosmetic E-commerce Backend',
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 5000}`, // Use environment variable for port
        description: 'Development server',
      },
    ],
  },
  apis: ['./src/routes/*.js'],
};

const specs = swaggerJsdoc(options);

export { swaggerUi, specs };
