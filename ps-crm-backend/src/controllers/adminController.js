const Complaint = require('../models/Complaint');
const User = require('../models/User');
const VisitLog = require('../models/VisitLog');
const Feedback = require('../models/Feedback');
const { reverseGeocode } = require('../services/locationService');

const getDistanceFilter = (filter) => {
  const now = new Date();
  let startDate;

  switch (filter) {
    case 'today':
      startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'week':
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'month':
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 30);
      break;
    default:
      return null;
  }
  return startDate;
};

/**
 * GET /api/complaints/nearby
 * @query {number} lat
 * @query {number} lng
 * @query {number} radius
 */
const getNearbyComplaints = async (req, res) => {
  try {
    const { latitude, longitude, radiusKm, ward } = req.validatedQuery;
    const maxDistance = radiusKm * 1000;
    const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const formatComplaint = (complaint, distanceMeters = null) => ({
      _id: complaint._id,
      complaintType: complaint.category,
      status: complaint.status,
      description: complaint.filers?.[0]?.description || '',
      citizen: complaint.filers?.[0]?.citizen || null,
      location: {
        line1: complaint.location?.line1,
        line2: complaint.location?.line2,
        ward: complaint.location?.ward,
        locality: complaint.location?.locality,
        zone: complaint.location?.zone,
        latitude: complaint.location?.coordinates?.coordinates?.[1],
        longitude: complaint.location?.coordinates?.coordinates?.[0],
      },
      createdAt: complaint.createdAt,
      distanceMeters,
      distanceKm: distanceMeters != null ? Number((distanceMeters / 1000).toFixed(2)) : null,
      matchType: distanceMeters != null ? 'distance' : 'ward',
    });

    let geoComplaints = [];
    try {
      geoComplaints = await Complaint.aggregate([
        {
          $geoNear: {
            near: {
              type: 'Point',
              coordinates: [longitude, latitude],
            },
            distanceField: 'distanceMeters',
            spherical: true,
            maxDistance,
            query: { 'location.coordinates.coordinates.0': { $exists: true } },
          },
        },
        { $sort: { distanceMeters: 1 } },
        { $limit: 50 },
      ]).allowDiskUse(false);
    } catch (geoError) {
      console.warn('[Nearby Complaints] Geo lookup skipped:', geoError.message);
    }

    const seenIds = new Set(geoComplaints.map((complaint) => String(complaint._id)));
    let wardComplaints = [];

    if (ward) {
      wardComplaints = await Complaint.find({
        _id: { $nin: Array.from(seenIds) },
        'location.ward': { $regex: `^${escapeRegex(ward)}$`, $options: 'i' },
      })
        .sort({ createdAt: -1 })
        .limit(Math.max(0, 50 - geoComplaints.length))
        .lean();
    }

    const complaints = [
      ...geoComplaints.map((complaint) => formatComplaint(complaint, complaint.distanceMeters)),
      ...wardComplaints.map((complaint) => formatComplaint(complaint)),
    ].slice(0, 50);

    res.status(200).json({
      success: true,
      data: complaints,
      meta: {
        radiusKm,
        ward: ward || null,
        geoMatches: geoComplaints.length,
        wardMatches: wardComplaints.length,
      },
    });
  } catch (error) {
    console.error('[Nearby Complaints]', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const reverseLocation = async (req, res) => {
  try {
    const { latitude, longitude } = req.validatedQuery;
    const lookup = await reverseGeocode(latitude, longitude);

    res.status(200).json({
      success: true,
      data: lookup || {
        placeName: 'Current location',
        ward: '',
        address: {},
      },
    });
  } catch (error) {
    console.error('[Reverse Location]', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getVisitLogs = async (req, res) => {
  try {
    const { cmId, filter } = req.validatedQuery;
    const startDate = getDistanceFilter(filter);
    const match = { cmId };
    if (startDate) {
      match.visitDate = { $gte: startDate };
    }

    const logs = await VisitLog.find(match)
      .sort({ visitDate: -1 })
      .populate({
        path: 'complaintsHandled',
        select: 'complaintNumber category status assignedTo location createdAt',
      })
      .lean();

    const formatted = logs.map((log) => {
      const duration = (() => {
        const s = log.startTime || '';
        const e = log.endTime || '';
        const [sh, sm] = s.split(':').map(Number);
        const [eh, em] = e.split(':').map(Number);
        if (Number.isFinite(sh) && Number.isFinite(sm) && Number.isFinite(eh) && Number.isFinite(em)) {
          const start = new Date(log.visitDate);
          start.setHours(sh, sm, 0, 0);
          const end = new Date(log.visitDate);
          end.setHours(eh, em, 0, 0);
          const diffMs = end - start;
          if (diffMs >= 0) return Math.round(diffMs / 60000);
        }
        return null;
      })();

      return {
        _id: log._id,
        visitDate: log.visitDate,
        startTime: log.startTime,
        endTime: log.endTime,
        area: log.area,
        outcome: log.outcome,
        complaintsHandled: log.complaintsHandled,
        areaSummary: log.areaSummary,
        notes: log.notes,
        duration,
      };
    });

    res.status(200).json({ success: true, data: formatted });
  } catch (error) {
    console.error('[Visit Logs]', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getCmMobileStats = async (req, res) => {
  try {
    const { cmId } = req.validatedQuery;
    const officer = await User.findById(cmId).select('name email phone role area');
    if (!officer) {
      return res.status(404).json({ success: false, message: 'Officer not found.' });
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todayComplaints = await Complaint.countDocuments({
      assignedTo: cmId,
      createdAt: { $gte: startOfToday },
    });

    const completedToday = await Complaint.countDocuments({
      assignedTo: cmId,
      status: 'Resolved',
      updatedAt: { $gte: startOfToday },
    });

    const pendingComplaints = await Complaint.countDocuments({
      assignedTo: cmId,
      status: { $ne: 'Resolved' },
    });

    const escalatedComplaints = await Complaint.find({
      assignedTo: cmId,
      status: 'Escalated',
    })
      .select('complaintNumber status category createdAt')
      .lean();

    const completionRate = todayComplaints > 0
      ? Number(((completedToday / todayComplaints) * 100).toFixed(1))
      : 0;

    res.status(200).json({
      success: true,
      data: {
        todayComplaints,
        completedToday,
        completionRate,
        pendingComplaints,
        escalatedComplaints,
      },
    });
  } catch (error) {
    console.error('[CM Mobile Stats]', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const heatmapCache = {
  value: null,
  expiresAt: null,
};

/**
 * GET /api/heatmap
 * Returns complaint counts by area with intensity normalized to 0-100.
 */
const getHeatmap = async (req, res) => {
  try {
    const now = Date.now();
    if (heatmapCache.value && heatmapCache.expiresAt > now) {
      return res.status(200).json({ success: true, data: heatmapCache.value });
    }

    const complaintsByArea = await Complaint.aggregate([
      {
        $group: {
          _id: '$location.ward',
          complaintCount: { $sum: 1 },
        },
      },
      { $sort: { complaintCount: -1 } },
      { $limit: 20 },
    ]);

    const maxCount = complaintsByArea[0]?.complaintCount || 1;
    const data = complaintsByArea.map((entry) => ({
      area: entry._id || 'Unknown',
      complaintCount: entry.complaintCount,
      intensity: Number(((entry.complaintCount / maxCount) * 100).toFixed(1)),
    }));

    heatmapCache.value = data;
    heatmapCache.expiresAt = now + 5 * 60 * 1000;

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('[Heatmap]', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getOfficersBandwidth = async (req, res) => {
  try {
    const { sortBy } = req.validatedQuery;
    const officers = await User.find({ role: { $in: ['officer', 'cm'] } })
      .select('name email phone area role lastActive recentActivity')
      .lean();

    const officerStats = await Promise.all(
      officers.map(async (officer) => {
        const [assignedComplaints, activeComplaints, resolvedCount, feedbackSummary, resolutionSummary] = await Promise.all([
          Complaint.countDocuments({ assignedTo: officer._id }),
          Complaint.countDocuments({ assignedTo: officer._id, status: { $ne: 'Resolved' } }),
          Complaint.countDocuments({ assignedTo: officer._id, status: 'Resolved' }),
          Feedback.aggregate([
            { $match: { complaint: { $exists: true } } },
            {
              $lookup: {
                from: 'complaints',
                localField: 'complaint',
                foreignField: '_id',
                as: 'complaint',
              },
            },
            { $unwind: '$complaint' },
            { $match: { 'complaint.assignedTo': officer._id.toString(), 'complaint.status': 'Resolved' } },
            { $group: { _id: null, avgRating: { $avg: '$rating' } } },
          ]),
          Complaint.aggregate([
            { $match: { assignedTo: officer._id, status: 'Resolved', updatedAt: { $exists: true } } },
            {
              $project: {
                resolutionTimeDays: {
                  $divide: [ { $subtract: ['$updatedAt', '$createdAt'] }, 1000 * 60 * 60 * 24 ],
                },
              },
            },
            { $group: { _id: null, avgResolutionTime: { $avg: '$resolutionTimeDays' } } },
          ]),
        ]);

        const customerRating = feedbackSummary[0]?.avgRating ? Number(feedbackSummary[0].avgRating.toFixed(1)) : 0;
        const avgResolutionTime = resolutionSummary[0]?.avgResolutionTime
          ? Number(resolutionSummary[0].avgResolutionTime.toFixed(1))
          : 0;

        const completionRate = assignedComplaints > 0
          ? Number(((resolvedCount / assignedComplaints) * 100).toFixed(1))
          : 0;

        const recentActivity = (officer.recentActivity || [])
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          .slice(0, 3);

        return {
          _id: officer._id,
          name: officer.name,
          email: officer.email,
          phone: officer.phone,
          area: officer.area,
          activeComplaints,
          totalAssigned: assignedComplaints,
          completionRate,
          customerRating,
          avgResolutionTime,
          lastActive: officer.lastActive,
          recentActivity,
        };
      })
    );

    officerStats.sort((a, b) => {
      if (sortBy === 'performance') return b.completionRate - a.completionRate;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return b.activeComplaints - a.activeComplaints;
    });

    res.status(200).json({ success: true, data: officerStats });
  } catch (error) {
    console.error('[Officers Bandwidth]', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getNearbyComplaints,
  reverseLocation,
  getVisitLogs,
  getCmMobileStats,
  getHeatmap,
  getOfficersBandwidth,
};
