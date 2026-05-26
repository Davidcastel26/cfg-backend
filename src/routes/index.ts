import { Router } from 'express';
import imports from './import';
import lands from './lands';
import payments from './payments';
import products from './products';
import suppliers from './suppliers';
import tickets from './tickets';

/** Composes every feature router under /api/v1. */
const router = Router();
router.use('/tickets', tickets);
router.use('/suppliers', suppliers);
router.use('/lands', lands);
router.use('/products', products);
router.use('/import', imports);
router.use('/payments', payments);

export default router;
