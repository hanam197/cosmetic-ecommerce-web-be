import express from 'express';
import { getSample } from '../controllers/sampleController.js';

const router = express.Router();

router.get('/controller-sample', getSample);

export default router;

