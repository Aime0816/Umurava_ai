import { Router } from 'express';
import { jobController } from '../controllers/job.controller';

const router = Router();

router.post('/', jobController.createJob.bind(jobController));
router.get('/', jobController.listJobs.bind(jobController));
router.get('/:id', jobController.getJob.bind(jobController));
router.put('/:id', jobController.updateJob.bind(jobController));
router.delete('/:id', jobController.deleteJob.bind(jobController));

export default router;
