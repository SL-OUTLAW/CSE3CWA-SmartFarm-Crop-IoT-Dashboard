import { Router } from 'express';
import { readValidSensorData } from '../utils/sensorValidator.js';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    res.json(await readValidSensorData());
  } catch {
    res.status(500).json({ error: 'Sensor data file is invalid' });
  }
});

export default router;
