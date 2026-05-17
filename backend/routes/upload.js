const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../utils/db');
const auth = require('../middleware/auth');

// Ensure upload directories exist
const uploadDirs = ['uploads/profiles', 'uploads/gallery', 'uploads/grounds'];
uploadDirs.forEach(dir => {
  const full = path.join(__dirname, '..', dir);
  if (!fs.existsSync(full)) fs.mkdirSync(full, { recursive: true });
});

// Multer storage engine
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = 'uploads/profiles';
    if (req.path.includes('gallery')) folder = 'uploads/gallery';
    if (req.path.includes('ground')) folder = 'uploads/grounds';
    cb(null, path.join(__dirname, '..', folder));
  },
  filename: (req, file, cb) => {
    const unique = `${req.user.id}_${Date.now()}${path.extname(file.originalname)}`;
    cb(null, unique);
  }
});

const fileFilter = (req, file, cb) => {
  if (/image\/(jpeg|jpg|png|webp|gif)/.test(file.mimetype)) cb(null, true);
  else cb(new Error('Only images are allowed'), false);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

// ---- COACH ROUTES ----

// POST /api/upload/coach/profile - Upload profile photo + details
router.post('/coach/profile', auth, upload.single('image'), (req, res) => {
  if (req.user.role !== 'coach' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const { name, sport, experience, price, description } = req.body;
  const imageUrl = req.file ? `/uploads/profiles/${req.file.filename}` : null;

  // Find or create coach profile in coaches collection
  const coaches = db.get('coaches');
  const existing = coaches.find(c => c.userId === req.user.id);

  let coach;
  if (existing) {
    coach = db.update('coaches', existing._id, {
      name: name || existing.name,
      sport: sport || existing.sport,
      exp: experience || existing.exp,
      price: price || existing.price,
      description: description || existing.description,
      ...(imageUrl && { image: imageUrl }),
      userId: req.user.id
    });
  } else {
    coach = db.insert('coaches', {
      name: name || req.user.fullName,
      sport: sport || 'General Coaching',
      exp: experience || '1y',
      price: price || '₹1,000',
      description: description || '',
      image: imageUrl,
      rating: 5.0,
      reviews: 0,
      verified: false,
      userId: req.user.id
    });
  }

  res.json({ success: true, coach });
});

// POST /api/upload/coach/gallery - Upload multiple training images
router.post('/coach/gallery', auth, upload.array('images', 10), (req, res) => {
  if (req.user.role !== 'coach' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const urls = req.files.map(f => `/uploads/gallery/${f.filename}`);
  
  const coaches = db.get('coaches');
  const existing = coaches.find(c => c.userId === req.user.id);
  
  if (existing) {
    const current = existing.gallery || [];
    db.update('coaches', existing._id, { gallery: [...current, ...urls] });
  }

  res.json({ success: true, urls });
});

// GET /api/upload/coach/me - Get current coach profile
router.get('/coach/me', auth, (req, res) => {
  const coaches = db.get('coaches');
  const coach = coaches.find(c => c.userId === req.user.id);
  res.json(coach || null);
});

// ---- GROUND OWNER ROUTES ----

// POST /api/upload/ground - Add/update a ground with images
router.post('/ground', auth, upload.array('images', 8), (req, res) => {
  // Allow ground_owner and admin; other roles get 403
  const allowed = ['ground_owner', 'admin'];
  if (!allowed.includes(req.user.role)) {
    return res.status(403).json({ error: `Role '${req.user.role}' cannot add grounds. Only ground_owner accounts can list grounds.` });
  }

  const { name, location, sport, pricePerHour, timings } = req.body;
  const images = (req.files || []).map(f => `/uploads/grounds/${f.filename}`);

  if (!name || !location) {
    return res.status(400).json({ error: 'Ground name and location are required.' });
  }

  const ground = db.insert('grounds', {
    name,
    location,
    sport: sport || 'Multi-Sport',
    price: pricePerHour ? `₹${pricePerHour}/hr` : '₹500/hr',
    timings: timings || '6AM - 10PM',
    images,
    image: images[0] || null,
    status: 'Available',
    condition: 'dry',
    distance: '1.0 km',
    ownerId: req.user.id
  });

  res.json({ success: true, ground });
});

// GET /api/upload/ground/me - Get grounds by this owner
router.get('/ground/me', auth, (req, res) => {
  const grounds = db.get('grounds').filter(g => g.ownerId === req.user.id);
  res.json(grounds);
});

module.exports = router;
