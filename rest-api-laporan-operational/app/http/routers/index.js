import express from 'express';

const router = express.Router();

router.get('/', (req, res) => {
  res.send('Rest Boiller Plate v.0.1');
});

export default router;
