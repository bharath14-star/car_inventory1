const Car = require('../models/Car');
const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');

const uploadDir = path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads');

function removeFileIfExists(relPath) {
  if (!relPath) return;
  // relPath expected like '/uploads/filename.ext'
  const p = path.join(__dirname, '..', relPath.replace(/^\//, ''));
  try {
    if (fs.existsSync(p)) fs.unlinkSync(p);
  } catch (e) {
    console.warn('Failed to remove file', p, e.message);
  }
}

exports.createCar = async (req, res) => {
  try {
    const data = req.body;
    // attach authenticated user
    if (req.user && req.user._id) data.createdBy = req.user._id;
    // files handled by multer; photos and video
    if (req.files) {
      if (req.files.photos) data.photos = req.files.photos.map(f => `/uploads/${f.filename}`);
      if (req.files.video && req.files.video[0]) data.video = `/uploads/${req.files.video[0].filename}`;
    }
    // basic validation
    if (!data.regNo) return res.status(400).json({ message: 'regNo is required' });

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
      // use text search when available
      filter.$text = { $search: search };
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
        // remove old photos
        if (Array.isArray(existing.photos)) existing.photos.forEach(p => removeFileIfExists(p));
        data.photos = req.files.photos.map(f => `/uploads/${f.filename}`);
      }
      if (req.files.video && req.files.video[0]) {
        if (existing.video) removeFileIfExists(existing.video);
        data.video = `/uploads/${req.files.video[0].filename}`;
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

// dashboard stats
exports.getStats = async (req, res) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const day = now.getDay(); // 0 (Sun) - 6 (Sat)
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfToday.getDate() - day);

    const total = await Car.countDocuments({});
    const today = await Car.countDocuments({ inOutDateTime: { $gte: startOfToday } });
    const thisWeek = await Car.countDocuments({ inOutDateTime: { $gte: startOfWeek } });

    const recent = await Car.find({}).sort({ inOutDateTime: -1 }).limit(10).lean();

    // top regNos
    const topReg = await Car.aggregate([
      { $group: { _id: '$regNo', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    const topPersons = await Car.aggregate([
      { $group: { _id: '$personName', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // last 7 days counts
    const start7 = new Date(startOfToday);
    start7.setDate(startOfToday.getDate() - 6);
    const days = [];
    const promises = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start7);
      d.setDate(start7.getDate() + i);
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
      promises.push(Car.countDocuments({ inOutDateTime: { $gte: dayStart, $lt: dayEnd } }));
      days.push(dayStart.toISOString().slice(0,10));
    }
    const counts = await Promise.all(promises);

    const dailyCounts = days.map((date, idx) => ({ date, count: counts[idx] }));

    res.json({ total, today, thisWeek, recent, topReg, topPersons, dailyCounts });
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
