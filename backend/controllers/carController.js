const Car = require('../models/Car');
const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');
const cloudinary = require('../utils/cloudinary');

const uploadDir = path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads');

function isCloudinaryConfigured() {
  return !!(process.env.CLOUDINARY_URL || process.env.CLOUDINARY_CLOUD_NAME);
}

async function uploadLocalFileToCloudinary(localPath, resourceType = 'image') {
  try {
    const opt = { resource_type: resourceType };
    // optionally set folder
    if (process.env.CLOUDINARY_FOLDER) opt.folder = process.env.CLOUDINARY_FOLDER;
    const result = await cloudinary.uploader.upload(localPath, opt);
    // remove local file
    try { fs.unlinkSync(localPath); } catch (e) { /* ignore */ }
    return result;
  } catch (e) {
    console.warn('Cloudinary upload failed for', localPath, e.message);
    return null;
  }
}

async function removeFileIfExists(relPath) {
  if (!relPath) return;
  // relPath expected like '/uploads/filename.ext' or a full cloudinary URL
  // handle local files
  if (relPath.startsWith('/')) {
    const p = path.join(__dirname, '..', relPath.replace(/^\//, ''));
    try {
      if (fs.existsSync(p)) fs.unlinkSync(p);
    } catch (e) {
      console.warn('Failed to remove file', p, e.message);
    }
    return;
  }

  // handle cloudinary URLs
  if (relPath.includes('res.cloudinary.com')) {
    try {
      // extract public_id from URL: after '/upload/' remove optional version and extension
      const m = relPath.match(/\/upload\/(?:v\d+\/)?(.+)$/);
      if (m && m[1]) {
        let publicId = m[1];
        // strip extension
        publicId = publicId.replace(/\.[a-zA-Z0-9]+(\?.*)?$/, '');
        publicId = decodeURIComponent(publicId);
        // try destroy as image then video
        try {
          await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
        } catch (e) {
          try { await cloudinary.uploader.destroy(publicId, { resource_type: 'video' }); } catch (er) { /* ignore */ }
        }
      }
    } catch (e) {
      console.warn('Failed to remove cloudinary file', relPath, e.message);
    }
  }
}

exports.createCar = async (req, res) => {
  try {
    const data = req.body;
    // attach authenticated user
    if (req.user && req.user._id) data.createdBy = req.user._id;
    // files handled by multer; photos and video
    if (req.files) {
      data.photos = data.photos || [];
      if (req.files.photos) {
        for (const f of req.files.photos) {
          const localPath = path.join(uploadDir, f.filename);
          if (isCloudinaryConfigured()) {
            const res = await uploadLocalFileToCloudinary(localPath, 'image');
            if (res && res.secure_url) data.photos.push(res.secure_url);
            else data.photos.push(`/uploads/${f.filename}`);
          } else {
            data.photos.push(`/uploads/${f.filename}`);
          }
        }
      }
      if (req.files.video && req.files.video[0]) {
        const vf = req.files.video[0];
        const localPath = path.join(uploadDir, vf.filename);
        if (isCloudinaryConfigured()) {
          const r = await uploadLocalFileToCloudinary(localPath, 'video');
          if (r && r.secure_url) data.video = r.secure_url;
          else data.video = `/uploads/${vf.filename}`;
        } else {
          data.video = `/uploads/${vf.filename}`;
        }
      }
    }
    // basic validation
    if (!data.regNo) return res.status(400).json({ message: 'regNo is required' });
    if (!data.referralId) return res.status(400).json({ message: 'referralId is required' });
    if (data.referralId.length > 16) return res.status(400).json({ message: 'Referral ID must be 16 characters or less' });

    const car = await Car.create(data);
    res.status(201).json(car);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllCars = async (req, res) => {
  try {
    // Support search, field filters, date range, pagination and sorting
    const {
      search,
      regNo,
      personName,
      make,
      model,
      status,
      startDate,
      endDate,
      page = 1,
      limit = 25,
      sortBy = 'createdAt',
      sortDir = 'desc'
    } = req.query;

    const filter = {};

    if (search) {
      // search across multiple fields
      filter.$or = [
        { regNo: new RegExp(search, 'i') },
        { personName: new RegExp(search, 'i') },
        { make: new RegExp(search, 'i') },
        { model: new RegExp(search, 'i') },
        { referralId: new RegExp(search, 'i') }
      ];
    }
    if (regNo) filter.regNo = new RegExp(regNo, 'i');
    if (personName) filter.personName = new RegExp(personName, 'i');
    if (make) filter.make = new RegExp(make, 'i');
    if (model) filter.model = new RegExp(model, 'i');
    if (status) filter.inOutStatus = status;
    if (startDate || endDate) {
      filter.inOutDateTime = {};
      if (startDate) filter.inOutDateTime.$gte = new Date(startDate);
      if (endDate) filter.inOutDateTime.$lte = new Date(endDate);
    }

    // Filter for non-admin users: only show cars where referralId matches user's employeeId
    if (req.user && req.user.role !== 'admin') {
      const User = require('../models/User');
      const user = await User.findById(req.user.id);
      if (user && user.employeeId) {
        filter.referralId = user.employeeId;
      } else {
        // If user has no employeeId, return empty results
        return res.json({ total: 0, page: 1, limit: parseInt(limit), items: [] });
      }
    }

    const pageNum = Math.max(1, parseInt(page));
    const lim = Math.max(1, Math.min(100, parseInt(limit)));
    const sort = { [sortBy]: sortDir === 'asc' ? 1 : -1 };

    const [items, total] = await Promise.all([
      Car.find(filter).sort(sort).skip((pageNum - 1) * lim).limit(lim),
      Car.countDocuments(filter)
    ]);

    res.json({ total, page: pageNum, limit: lim, items });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getCar = async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) return res.status(404).json({ message: 'Not found' });
    res.json(car);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateCar = async (req, res) => {
  try {
    const data = req.body || {};

    // find existing to possibly remove old files
    const existing = await Car.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Not found' });

    if (req.files) {
      if (req.files.photos) {
        const existingPhotos = Array.isArray(existing.photos) ? existing.photos : [];
        const newPhotos = [];
        for (const f of req.files.photos) {
          const localPath = path.join(uploadDir, f.filename);
          if (isCloudinaryConfigured()) {
            const res = await uploadLocalFileToCloudinary(localPath, 'image');
            if (res && res.secure_url) newPhotos.push(res.secure_url);
            else newPhotos.push(`/uploads/${f.filename}`);
          } else {
            newPhotos.push(`/uploads/${f.filename}`);
          }
        }
        const combinedPhotos = [...existingPhotos, ...newPhotos];
        data.photos = combinedPhotos.slice(0, 5);
      }
      if (req.files.video && req.files.video[0]) {
        const vf = req.files.video[0];
        const localPath = path.join(uploadDir, vf.filename);
        if (existing.video) await removeFileIfExists(existing.video);
        if (isCloudinaryConfigured()) {
          const r = await uploadLocalFileToCloudinary(localPath, 'video');
          if (r && r.secure_url) data.video = r.secure_url;
          else data.video = `/uploads/${vf.filename}`;
        } else {
          data.video = `/uploads/${vf.filename}`;
        }
      }
    }

    // don't allow changing createdBy via body
    delete data.createdBy;

    const car = await Car.findByIdAndUpdate(req.params.id, data, { new: true });
    res.json(car);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteCar = async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) return res.status(404).json({ message: 'Not found' });

    // remove uploaded files
    if (Array.isArray(car.photos)) car.photos.forEach(p => removeFileIfExists(p));
    if (car.video) removeFileIfExists(car.video);

  await Car.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deletePhoto = async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const car = await Car.findById(req.params.id);
    if (!car) return res.status(404).json({ message: 'Car not found' });

    const index = parseInt(req.params.index);
    if (isNaN(index) || index < 0 || index >= car.photos.length) {
      return res.status(400).json({ message: 'Invalid photo index' });
    }

    const photoPath = car.photos[index];
    removeFileIfExists(photoPath);
    car.photos.splice(index, 1);
    await car.save();

    res.json({ message: 'Photo deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteVideo = async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const car = await Car.findById(req.params.id);
    if (!car) return res.status(404).json({ message: 'Car not found' });

    if (!car.video) return res.status(404).json({ message: 'No video to delete' });

    removeFileIfExists(car.video);
    car.video = null;
    await car.save();

    res.json({ message: 'Video deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// dashboard stats
exports.getStats = async (req, res) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const day = now.getDay(); // 0 (Sun) - 6 (Sat)
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfToday.getDate() - day);

    let filter = {};

    // Filter for non-admin users: only show stats for cars where referralId matches user's employeeId
    if (req.user && req.user.role !== 'admin') {
      const User = require('../models/User');
      const user = await User.findById(req.user.id);
      if (user && user.employeeId) {
        filter.referralId = user.employeeId;
      } else {
        // If user has no employeeId, return zero stats
        return res.json({ total: 0, today: 0, thisWeek: 0, recent: [], topReg: [], topPersons: [], dailyCounts: [] });
      }
    }

    const total = await Car.countDocuments(filter);

    // allow client to specify tzOffset and today so "today" and "thisWeek" reflect client-local dates
    const tzOffset = req.query.tzOffset || '+00:00'; // e.g. '+05:30'
    const clientToday = req.query.today || startOfToday.toISOString().slice(0,10); // e.g. '2025-11-20'

    let today = 0;
    let thisWeek = 0;
    if (tzOffset && clientToday) {
      try {
        // compute today's count using aggregation by localDate
        const todayAgg = await Car.aggregate([
          { $match: filter },
          { $addFields: { localDate: { $dateToString: { format: "%Y-%m-%d", date: "$inOutDateTime", timezone: tzOffset } } } },
          { $match: { localDate: clientToday } },
          { $count: "cnt" }
        ]);
        today = (todayAgg[0] && todayAgg[0].cnt) || 0;

        // compute start of week in client local date
          // compute weekStart (client-local) using UTC arithmetic
          const [by, bm, bd] = clientToday.split('-').map(Number);
          const baseDate = new Date(Date.UTC(by, bm - 1, bd));
          const dayIdx = baseDate.getUTCDay();
          const wkStartDate = new Date(Date.UTC(by, bm - 1, bd - dayIdx));
          const weekStartStr = `${wkStartDate.getUTCFullYear()}-${String(wkStartDate.getUTCMonth()+1).padStart(2,'0')}-${String(wkStartDate.getUTCDate()).padStart(2,'0')}`;

        const weekAgg = await Car.aggregate([
          { $match: filter },
          { $addFields: { localDate: { $dateToString: { format: "%Y-%m-%d", date: "$inOutDateTime", timezone: tzOffset } } } },
          { $match: { localDate: { $gte: weekStartStr, $lte: clientToday } } },
          { $count: "cnt" }
        ]);
        thisWeek = (weekAgg[0] && weekAgg[0].cnt) || 0;
      } catch (e) {
        // fallback to server-local calculations
        today = await Car.countDocuments({ ...filter, inOutDateTime: { $gte: startOfToday } });
        thisWeek = await Car.countDocuments({ ...filter, inOutDateTime: { $gte: startOfWeek } });
      }
    } else {
      today = await Car.countDocuments({ ...filter, inOutDateTime: { $gte: startOfToday } });
      thisWeek = await Car.countDocuments({ ...filter, inOutDateTime: { $gte: startOfWeek } });
    }

    const recent = await Car.find(filter).sort({ inOutDateTime: -1 }).limit(10).lean();

    // top regNos
    const topReg = await Car.aggregate([
      { $match: filter },
      { $group: { _id: '$regNo', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    const topPersons = await Car.aggregate([
      { $match: filter },
      { $group: { _id: '$personName', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // last 7 days counts (separate IN and OUT), grouped by client-local date if provided
    // frontend may pass `tzOffset` like '+05:30' and `today` as 'YYYY-MM-DD'

    // build last 7 client-local date strings (YYYY-MM-DD) ending with clientToday
      // build last 7 client-local date strings (YYYY-MM-DD) ending with clientToday
      // Use UTC arithmetic to avoid server-local timezone shifts
      const days = [];
      const [cy, cm, cd] = clientToday.split('-').map(Number);
      for (let i = 0; i < 7; i++) {
        const delta = i - 6; // for i=0 => -6 (six days before), ... i=6 => 0 (clientToday)
        const dt = new Date(Date.UTC(cy, cm - 1, cd + delta));
        const y = dt.getUTCFullYear();
        const m = String(dt.getUTCMonth() + 1).padStart(2, '0');
        const dstr = String(dt.getUTCDate()).padStart(2, '0');
        days.push(`${y}-${m}-${dstr}`);
    }

    // aggregation helper: group by localDate string produced by $dateToString using tzOffset
    const aggCounts = async (status) => {
      const match = { ...filter };
      if (status) match.inOutStatus = status;
      const pipeline = [
        { $match: match },
        { $addFields: { localDate: { $dateToString: { format: "%Y-%m-%d", date: "$inOutDateTime", timezone: tzOffset } } } },
        { $match: { localDate: { $in: days } } },
        { $group: { _id: "$localDate", count: { $sum: 1 } } }
      ];
      const resAgg = await Car.aggregate(pipeline);
      const map = {};
      resAgg.forEach(r => { map[r._id] = r.count; });
      return days.map(d => map[d] || 0);
    };

    const [inCounts, outCounts] = await Promise.all([aggCounts('IN'), aggCounts('OUT')]);

    const dailyCountsIn = days.map((date, idx) => ({ date, count: inCounts[idx] }));
    const dailyCountsOut = days.map((date, idx) => ({ date, count: outCounts[idx] }));

    // Keep `dailyCounts` (combined) for backward compatibility
    const dailyCounts = days.map((date, idx) => ({ date, count: inCounts[idx] + outCounts[idx] }));

    const response = { total, today, thisWeek, recent, topReg, topPersons, dailyCounts, dailyCountsIn, dailyCountsOut };

    // if debug requested, include internal debug info to help diagnose timezone/day grouping
    if (req.query.debug) {
      // also include raw aggregation maps
      const inMap = {};
      const outMap = {};
      inCounts.forEach((c, i) => { inMap[days[i]] = c; });
      outCounts.forEach((c, i) => { outMap[days[i]] = c; });
      response.debug = { tzOffset, clientToday, days, inMap, outMap };
    }

    res.json(response);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Export all cars to Excel (Admin only)
exports.exportCars = async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    // Fetch all cars
    const cars = await Car.find({}).populate('createdBy', 'name email').lean();

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Car Inventory');

    // Define columns
    worksheet.columns = [
      { header: 'Registration Number', key: 'regNo', width: 20 },
      { header: 'Make', key: 'make', width: 15 },
      { header: 'Model', key: 'model', width: 15 },
      { header: 'Variant', key: 'variant', width: 15 },
      { header: 'Year', key: 'year', width: 10 },
      { header: 'Colour', key: 'colour', width: 10 },
      { header: 'KMP', key: 'kmp', width: 10 },
      { header: 'Person Name', key: 'personName', width: 20 },
      { header: 'Cell Number', key: 'cellNo', width: 15 },
      { header: 'Price', key: 'price', width: 15 },
      { header: 'In/Out Status', key: 'inOutStatus', width: 15 },
      { header: 'In/Out Date Time', key: 'inOutDateTime', width: 20 },
      { header: 'Created By', key: 'createdBy', width: 20 },
      { header: 'Created At', key: 'createdAt', width: 20 },
      { header: 'Updated At', key: 'updatedAt', width: 20 }
    ];

    // Add data rows
    cars.forEach(car => {
      worksheet.addRow({
        regNo: car.regNo,
        make: car.make,
        model: car.model,
        variant: car.variant,
        year: car.year,
        colour: car.colour,
        kmp: car.kmp,
        personName: car.personName,
        cellNo: car.cellNo,
        price: car.price,
        inOutStatus: car.inOutStatus,
        inOutDateTime: car.inOutDateTime ? new Date(car.inOutDateTime).toLocaleString() : '',
        createdBy: car.createdBy ? car.createdBy.name : '',
        createdAt: car.createdAt ? new Date(car.createdAt).toLocaleString() : '',
        updatedAt: car.updatedAt ? new Date(car.updatedAt).toLocaleString() : ''
      });
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=car_inventory_${new Date().toISOString().slice(0,10)}.xlsx`);

    // Write to response
    await workbook.xlsx.write(res);
    res.end();

  } catch (err) {
    console.error('Export error:', err);
    res.status(500).json({ message: 'Export failed', error: err.message });
  }
};
