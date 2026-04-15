import { Router } from 'express';
import { uploadController, upload } from '../controllers/upload.controller';

const router = Router();

// Upload one or many CV files (PDF, CSV, Excel)
router.post('/cvs', upload.array('files', 20), uploadController.uploadFiles.bind(uploadController));

// Upload raw JSON profile(s)
router.post('/json', uploadController.uploadJson.bind(uploadController));

export default router;
