require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { MongoClient } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Directories
const INDEX_DIR = path.join(__dirname, 'index');
const DATA_FILE = path.join(__dirname, 'data', 'site-data.json');
const UPLOADS_DIR = path.join(INDEX_DIR, 'uploads');

// Ensure uploads and data directories exist
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
if (!fs.existsSync(path.dirname(DATA_FILE))) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${cleanName}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp|gif|avif/;
  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  const mime = file.mimetype;
  if (allowedTypes.test(ext) || allowedTypes.test(mime)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, PNG, WEBP, GIF, AVIF) are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max per file
  fileFilter: fileFilter
});

// Helper: Read local database (fallback)
function readLocalData() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return {
        siteInfo: {},
        categories: [],
        photos: [],
        comments: [],
        inquiries: [],
        admin: { password: 'admin' }
      };
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading local data file:', err);
    return { siteInfo: {}, categories: [], photos: [], comments: [], inquiries: [], admin: { password: 'admin' } };
  }
}

// Helper: Write local database (fallback)
function writeLocalData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing local data file:', err);
    return false;
  }
}

// MongoDB Atlas State
let mongoClient = null;
let mongoDb = null;
let isMongoConnected = false;

async function initMongoDB() {
  if (!MONGODB_URI) {
    console.log('ℹ️ [Database] No MONGODB_URI found. Running with local JSON database.');
    return;
  }
  try {
    console.log('⏳ [Database] Connecting to MongoDB Atlas Cloud...');
    mongoClient = new MongoClient(MONGODB_URI, {
      connectTimeoutMS: 10000,
      serverSelectionTimeoutMS: 10000
    });
    await mongoClient.connect();
    mongoDb = mongoClient.db('timeless_moments');
    isMongoConnected = true;
    console.log('🌟 [Database] Connected successfully to MongoDB Atlas Cloud Database!');
    await seedMongoIfEmpty();
  } catch (err) {
    console.error('⚠️ [Database] Could not connect to MongoDB Atlas:', err.message);
    console.log('🔄 [Database] Falling back to local site-data.json database.');
    isMongoConnected = false;
  }
}

// Seed MongoDB Atlas with existing site data if empty
async function seedMongoIfEmpty() {
  if (!isMongoConnected || !mongoDb) return;
  try {
    const configCol = mongoDb.collection('site_config');
    const existingConfig = await configCol.findOne({ _id: 'main' });
    const local = readLocalData();

    if (!existingConfig) {
      console.log('🌱 [Database] Seeding initial site configuration to MongoDB Atlas...');
      await configCol.insertOne({
        _id: 'main',
        siteInfo: local.siteInfo || {},
        categories: local.categories || [],
        admin: local.admin || { password: 'admin' },
        updatedAt: new Date()
      });
    }

    const photosCol = mongoDb.collection('photos');
    const photosCount = await photosCol.countDocuments();
    if (photosCount === 0 && local.photos && local.photos.length > 0) {
      console.log(`🌱 [Database] Seeding ${local.photos.length} photos to MongoDB Atlas...`);
      await photosCol.insertMany(local.photos.map(p => ({ ...p })));
    }

    const commentsCol = mongoDb.collection('comments');
    const commentsCount = await commentsCol.countDocuments();
    if (commentsCount === 0 && local.comments && local.comments.length > 0) {
      console.log(`🌱 [Database] Seeding ${local.comments.length} reviews to MongoDB Atlas...`);
      await commentsCol.insertMany(local.comments.map(c => ({ ...c })));
    }

    const inquiriesCol = mongoDb.collection('inquiries');
    const inquiriesCount = await inquiriesCol.countDocuments();
    if (inquiriesCount === 0 && local.inquiries && local.inquiries.length > 0) {
      await inquiriesCol.insertMany(local.inquiries.map(i => ({ ...i })));
    }

    console.log('✨ [Database] MongoDB Atlas database ready!');
  } catch (err) {
    console.error('Error during MongoDB Atlas seeding:', err);
  }
}

// Unified Data Fetcher
async function getFullData() {
  if (isMongoConnected && mongoDb) {
    try {
      const config = (await mongoDb.collection('site_config').findOne({ _id: 'main' })) || {};
      const photos = await mongoDb.collection('photos').find().sort({ createdAt: -1 }).toArray();
      const comments = await mongoDb.collection('comments').find().sort({ date: -1 }).toArray();
      const inquiries = await mongoDb.collection('inquiries').find().sort({ createdAt: -1 }).toArray();

      return {
        siteInfo: config.siteInfo || {},
        categories: config.categories || [],
        admin: config.admin || { password: 'admin' },
        photos: photos.map(p => {
          const { _id, dataBase64, ...rest } = p;
          return rest;
        }),
        comments: comments.map(c => {
          const { _id, ...rest } = c;
          return rest;
        }),
        inquiries: inquiries.map(i => {
          const { _id, ...rest } = i;
          return rest;
        })
      };
    } catch (err) {
      console.warn('Error reading from Mongo, fallback to local JSON:', err);
    }
  }
  return readLocalData();
}

async function getAdminPassword() {
  if (isMongoConnected && mongoDb) {
    try {
      const config = await mongoDb.collection('site_config').findOne({ _id: 'main' });
      if (config && config.admin && config.admin.password) {
        return config.admin.password;
      }
    } catch (e) {}
  }
  const local = readLocalData();
  return (local.admin && local.admin.password) || 'admin';
}

async function checkAdmin(req) {
  const currentPassword = await getAdminPassword();
  const authHeader = req.headers['x-admin-token'] || req.headers['authorization'];
  const bodyPassword = req.body && req.body.adminPassword;

  if (authHeader && authHeader === currentPassword) return true;
  if (bodyPassword && bodyPassword === currentPassword) return true;
  if (authHeader === 'Bearer ' + currentPassword) return true;
  return false;
}

// Persistent Cloud Image Delivery (Serves from disk or MongoDB Atlas fallback)
app.get('/uploads/:filename', async (req, res, next) => {
  const filePath = path.join(UPLOADS_DIR, req.params.filename);
  if (fs.existsSync(filePath)) {
    return res.sendFile(filePath);
  }
  if (isMongoConnected && mongoDb) {
    try {
      const doc = await mongoDb.collection('photos').findOne({ filename: req.params.filename });
      if (doc && doc.dataBase64) {
        const buffer = Buffer.from(doc.dataBase64, 'base64');
        res.contentType(doc.mimeType || 'image/jpeg');
        return res.send(buffer);
      }
    } catch (err) {
      console.warn('Error retrieving photo from MongoDB:', err);
    }
  }
  next();
});

// API Routes

// 1. Get Site Data
app.get('/api/site-data', async (req, res) => {
  const data = await getFullData();
  const isAdmin = await checkAdmin(req);
  const safeData = {
    siteInfo: data.siteInfo,
    categories: data.categories,
    photos: data.photos || [],
    comments: data.comments || [],
    inquiries: isAdmin ? (data.inquiries || []) : []
  };
  res.json({ success: true, data: safeData });
});

// 2. Admin Login
app.post('/api/login', async (req, res) => {
  const { password } = req.body;
  const currentPassword = await getAdminPassword();

  if (password === currentPassword) {
    return res.json({ success: true, token: currentPassword, message: 'Logged in successfully' });
  }
  return res.status(401).json({ success: false, message: 'Invalid Admin Password' });
});

// 3. Change Admin Password
app.post('/api/change-password', async (req, res) => {
  if (!(await checkAdmin(req))) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  const { newPassword } = req.body;
  if (!newPassword || newPassword.trim().length < 3) {
    return res.status(400).json({ success: false, message: 'Password must be at least 3 characters' });
  }

  if (isMongoConnected && mongoDb) {
    await mongoDb.collection('site_config').updateOne(
      { _id: 'main' },
      { $set: { 'admin.password': newPassword.trim(), updatedAt: new Date() } },
      { upsert: true }
    );
  }

  const local = readLocalData();
  if (!local.admin) local.admin = {};
  local.admin.password = newPassword.trim();
  writeLocalData(local);

  res.json({ success: true, message: 'Password updated successfully' });
});

// 4. Update Site Info (Details)
app.post('/api/site-info', async (req, res) => {
  if (!(await checkAdmin(req))) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  const { siteInfo } = req.body;
  if (!siteInfo) {
    return res.status(400).json({ success: false, message: 'Missing siteInfo data' });
  }

  if (isMongoConnected && mongoDb) {
    await mongoDb.collection('site_config').updateOne(
      { _id: 'main' },
      { $set: { siteInfo, updatedAt: new Date() } },
      { upsert: true }
    );
  }

  const local = readLocalData();
  local.siteInfo = { ...local.siteInfo, ...siteInfo };
  writeLocalData(local);

  res.json({ success: true, data: local.siteInfo, message: 'Site details saved successfully' });
});

// 5. Upload Photo(s)
app.post('/api/upload', upload.array('photos', 20), async (req, res) => {
  const isAdmin = await checkAdmin(req);
  if (!isAdmin) {
    if (req.files && req.files.length) {
      req.files.forEach(f => {
        if (fs.existsSync(f.path)) fs.unlinkSync(f.path);
      });
    }
    return res.status(401).json({ success: false, message: 'Unauthorized upload' });
  }

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, message: 'No image files uploaded' });
  }

  const { category = 'wedding', album = '', title = '', caption = '', date = '' } = req.body;
  const newPhotos = [];

  for (let i = 0; i < req.files.length; i++) {
    const file = req.files[i];
    const photoId = 'p_' + Date.now() + '_' + i;

    // Read base64 representation to ensure persistence in MongoDB Atlas cloud
    let dataBase64 = null;
    try {
      dataBase64 = fs.readFileSync(file.path).toString('base64');
    } catch (e) {}

    const photoObj = {
      id: photoId,
      filename: file.filename,
      originalName: file.originalname,
      url: 'uploads/' + file.filename,
      size: file.size,
      mimeType: file.mimetype,
      category: category.toLowerCase().trim(),
      album: album.trim(),
      title: title.trim() || path.parse(file.originalname).name,
      caption: caption.trim(),
      date: date || new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    };

    if (isMongoConnected && mongoDb) {
      await mongoDb.collection('photos').insertOne({
        ...photoObj,
        dataBase64: dataBase64
      });
    }

    newPhotos.push(photoObj);
  }

  // Also maintain local copy
  const local = readLocalData();
  if (!local.photos) local.photos = [];
  newPhotos.forEach(p => local.photos.unshift(p));
  writeLocalData(local);

  res.json({
    success: true,
    message: `Successfully uploaded ${newPhotos.length} photo(s)`,
    photos: newPhotos,
    storage: isMongoConnected ? 'MongoDB Atlas Cloud' : 'Local File Storage'
  });
});

// 6. Delete Photo
app.delete('/api/photos/:id', async (req, res) => {
  if (!(await checkAdmin(req))) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const photoId = req.params.id;

  if (isMongoConnected && mongoDb) {
    await mongoDb.collection('photos').deleteOne({ id: photoId });
  }

  const local = readLocalData();
  const index = (local.photos || []).findIndex(p => p.id === photoId);
  if (index !== -1) {
    const [removed] = local.photos.splice(index, 1);
    const filePath = path.join(INDEX_DIR, removed.url);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.warn('Could not delete physical file:', err);
      }
    }
    writeLocalData(local);
  }

  res.json({ success: true, message: 'Photo deleted successfully' });
});

// 7. Get Comments & Ratings
app.get('/api/comments', async (req, res) => {
  const { category } = req.query;
  const data = await getFullData();
  let comments = data.comments || [];
  if (category) {
    comments = comments.filter(c => c.category === category.toLowerCase());
  }
  res.json({ success: true, comments });
});

// 8. Submit New Comment & Rating
app.post('/api/comments', async (req, res) => {
  const { author = 'Anonymous', comment, rating = 5, category = 'general' } = req.body;
  if (!comment || !comment.trim()) {
    return res.status(400).json({ success: false, message: 'Comment content cannot be empty' });
  }

  const newComment = {
    id: 'c_' + Date.now(),
    author: author.trim() || 'Anonymous',
    comment: comment.trim(),
    rating: parseInt(rating, 10) || 5,
    category: category.toLowerCase().trim(),
    date: new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString()
  };

  if (isMongoConnected && mongoDb) {
    await mongoDb.collection('comments').insertOne({ ...newComment });
  }

  const local = readLocalData();
  if (!local.comments) local.comments = [];
  local.comments.unshift(newComment);
  writeLocalData(local);

  res.json({ success: true, comment: newComment, message: 'Thank you for your comment!' });
});

// 9. Delete Comment (Admin only)
app.delete('/api/comments/:id', async (req, res) => {
  if (!(await checkAdmin(req))) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  const commentId = req.params.id;

  if (isMongoConnected && mongoDb) {
    await mongoDb.collection('comments').deleteOne({ id: commentId });
  }

  const local = readLocalData();
  local.comments = (local.comments || []).filter(c => c.id !== commentId);
  writeLocalData(local);

  res.json({ success: true, message: 'Comment deleted successfully' });
});

// 10. Booking Consultation Inquiries
app.post('/api/inquiries', async (req, res) => {
  const { name, email, phone, service, date, location, message } = req.body;
  if (!name || !email) {
    return res.status(400).json({ success: false, message: 'Name and email are required.' });
  }

  const newInquiry = {
    id: 'inq_' + Date.now(),
    name: name.trim(),
    email: email.trim(),
    phone: (phone || '').trim(),
    service: (service || 'general').trim(),
    date: date || '',
    location: (location || '').trim(),
    message: (message || '').trim(),
    createdAt: new Date().toISOString(),
    status: 'new'
  };

  if (isMongoConnected && mongoDb) {
    await mongoDb.collection('inquiries').insertOne({ ...newInquiry });
  }

  const local = readLocalData();
  if (!local.inquiries) local.inquiries = [];
  local.inquiries.unshift(newInquiry);
  writeLocalData(local);

  res.json({
    success: true,
    message: 'Your consultation request has been received! Kuya Jason will reach out shortly.',
    inquiry: newInquiry
  });
});

app.get('/api/inquiries', async (req, res) => {
  if (!(await checkAdmin(req))) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  const data = await getFullData();
  res.json({ success: true, inquiries: data.inquiries || [] });
});

app.delete('/api/inquiries/:id', async (req, res) => {
  if (!(await checkAdmin(req))) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  const id = req.params.id;

  if (isMongoConnected && mongoDb) {
    await mongoDb.collection('inquiries').deleteOne({ id });
  }

  const local = readLocalData();
  local.inquiries = (local.inquiries || []).filter(i => i.id !== id);
  writeLocalData(local);

  res.json({ success: true, message: 'Inquiry removed' });
});

// 11. Status & Diagnostics Endpoint
app.get('/api/status', async (req, res) => {
  const data = await getFullData();
  res.json({
    status: 'online',
    appName: 'Timeless Moments Photography',
    nodeVersion: process.version,
    databaseMode: isMongoConnected ? 'MongoDB Atlas (Cloud Database)' : 'Local File JSON Database',
    isCloudDatabase: isMongoConnected,
    totalPhotosUploaded: (data.photos || []).length,
    totalReviews: (data.comments || []).length,
    totalInquiries: (data.inquiries || []).length,
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

// Serve static frontend files from 'index' folder
app.use(express.static(INDEX_DIR));

// Also serve root path to index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(INDEX_DIR, 'index.html'));
});

// Serve admin shortcut
app.get('/admin', (req, res) => {
  res.sendFile(path.join(INDEX_DIR, 'admin.html'));
});

// Start Server & Connect Database
app.listen(PORT, async () => {
  await initMongoDB();
  console.log(`====================================================`);
  console.log(`📸 TIMELESS MOMENTS Server is running!`);
  console.log(`🌐 Local Website URL: http://localhost:${PORT}`);
  console.log(`⚙️ Admin Dashboard:  http://localhost:${PORT}/admin.html`);
  console.log(`🗄️ Database:         ${isMongoConnected ? 'MongoDB Atlas (Cloud)' : 'Local JSON File'}`);
  console.log(`====================================================`);
});
