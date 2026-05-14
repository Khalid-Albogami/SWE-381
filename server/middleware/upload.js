const path = require('path');
const fs = require('fs');
const multer = require('multer');

const uploadDir = path.join(__dirname, '..', 'uploads', 'stadiums');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safe = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    cb(null, safe);
  },
});

const fileFilter = (req, file, cb) => {
  if (/^image\//.test(file.mimetype)) cb(null, true);
  else cb(new Error('Only image uploads are allowed'));
};

module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024, files: 8 },
});
