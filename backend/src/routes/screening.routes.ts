import { Router } from 'express';
import { screeningController } from '../controllers/screening.controller';
import { validate, ScreeningRequestSchema } from '../middleware/validate';

const router = Router();

router.post('/', validate(ScreeningRequestSchema), screeningController.runScreening.bind(screeningController));
router.get('/', screeningController.listScreenings.bind(screeningController));
router.get('/:id', screeningController.getScreening.bind(screeningController));
router.get('/:id/rankings', screeningController.getRankings.bind(screeningController));

export default router;
