const mongoose = require('mongoose');

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const parseNumber = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const validateNearbyParams = (req, res, next) => {
  const { lat, lng, radius, ward } = req.query;
  const latitude = parseNumber(lat);
  const longitude = parseNumber(lng);
  const radiusKm = parseNumber(radius) ?? 5;

  if (latitude === null || longitude === null) {
    return res.status(400).json({ success: false, message: 'lat and lng query parameters are required and must be numbers.' });
  }
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return res.status(400).json({ success: false, message: 'lat and lng values must be valid coordinates.' });
  }
  if (radiusKm <= 0 || radiusKm > 100) {
    return res.status(400).json({ success: false, message: 'radius must be a positive number and reasonable (max 100 km).' });
  }

  req.validatedQuery = { latitude, longitude, radiusKm, ward: (ward || '').trim() };
  next();
};

const validateCoordinatesParams = (req, res, next) => {
  const { lat, lng } = req.query;
  const latitude = parseNumber(lat);
  const longitude = parseNumber(lng);

  if (latitude === null || longitude === null) {
    return res.status(400).json({ success: false, message: 'lat and lng query parameters are required and must be numbers.' });
  }
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return res.status(400).json({ success: false, message: 'lat and lng values must be valid coordinates.' });
  }

  req.validatedQuery = { latitude, longitude };
  next();
};

const validateCmIdFilterParams = (req, res, next) => {
  const { cmId, filter } = req.query;
  const allowedFilter = ['all', 'today', 'week', 'month'];

  if (!cmId || !isValidObjectId(cmId)) {
    return res.status(400).json({ success: false, message: 'cmId is required and must be a valid MongoDB ObjectId.' });
  }
  if (filter && !allowedFilter.includes(filter)) {
    return res.status(400).json({ success: false, message: 'filter must be one of: all, today, week, month.' });
  }

  req.validatedQuery = { cmId, filter: filter || 'all' };
  next();
};

const validateCmIdParams = (req, res, next) => {
  const { cmId } = req.query;

  if (!cmId || !isValidObjectId(cmId)) {
    return res.status(400).json({ success: false, message: 'cmId is required and must be a valid MongoDB ObjectId.' });
  }

  req.validatedQuery = { cmId };
  next();
};

const validateOfficersBandwidthParams = (req, res, next) => {
  const { sortBy } = req.query;
  const allowed = ['load', 'performance', 'name'];

  if (sortBy && !allowed.includes(sortBy)) {
    return res.status(400).json({ success: false, message: 'sortBy must be one of: load, performance, name.' });
  }

  req.validatedQuery = { sortBy: sortBy || 'load' };
  next();
};

module.exports = {
  validateNearbyParams,
  validateCoordinatesParams,
  validateCmIdFilterParams,
  validateCmIdParams,
  validateOfficersBandwidthParams,
};
