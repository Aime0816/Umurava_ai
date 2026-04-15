import { Router } from 'express';
import { candidateController } from '../controllers/candidate.controller';

const router = Router();

router.post('/', candidateController.createCandidates.bind(candidateController));
router.get('/', candidateController.listCandidates.bind(candidateController));
router.get('/search', candidateController.searchCandidates.bind(candidateController));
router.get('/:id', candidateController.getCandidate.bind(candidateController));
router.put('/:id', candidateController.updateCandidate.bind(candidateController));
router.delete('/:id', candidateController.deleteCandidate.bind(candidateController));

export default router;
