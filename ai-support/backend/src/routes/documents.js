const router = require('express').Router();
const path = require('path');
const os = require('os');
const multer = require('multer');
const { authenticate } = require('../middleware/auth');
const documentController = require('../controllers/documentController');

// ── Disk storage: uploads go to OS temp dir, not RAM ──────────────────────────
// This is the key change that prevents OOM — large files no longer sit in the
// Node.js heap while waiting to be processed.
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, os.tmpdir()),
  filename: (req, file, cb) => {
    const unique = `upload_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, unique + ext);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'text/plain', 'text/markdown', 'text/csv'];
    if (allowed.includes(file.mimetype) || file.originalname.match(/\.(pdf|txt|md|csv)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, TXT, MD, and CSV files are allowed'));
    }
  },
});

router.use(authenticate);

router.get('/', documentController.listDocuments);
router.post('/', upload.single('file'), documentController.uploadDocument);
router.get('/:id', documentController.getDocument);
router.delete('/:id', documentController.deleteDocument);
router.post('/:id/reprocess', upload.single('file'), documentController.reprocessDocument);

module.exports = router;
