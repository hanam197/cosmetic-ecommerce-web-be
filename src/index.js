const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

const logger = require('./middlewares/logger');
const sampleRoute = require('./routes/sample');
const controllerSampleRoute = require('./routes/controllerSample');

app.use(express.json());
app.use(logger);

app.use(sampleRoute);
app.use(controllerSampleRoute);

app.get('/', (req, res) => {
  res.send('Hello, World! 1111111111');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

