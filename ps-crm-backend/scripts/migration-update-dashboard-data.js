const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');
const Complaint = require('../src/models/Complaint');
const User = require('../src/models/User');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error', error);
    process.exit(1);
  }
};

const updateComplaintLocations = async () => {
  const complaints = await Complaint.find({
    'location.coordinates.coordinates': { $exists: false },
    'location.locality': { $exists: true, $ne: null },
  }).lean();

  for (const complaint of complaints) {
    const lat = complaint.location.latitude || complaint.location.lat || null;
    const lng = complaint.location.longitude || complaint.location.lng || null;

    if (typeof lat === 'number' && typeof lng === 'number') {
      await Complaint.updateOne(
        { _id: complaint._id },
        { 'location.coordinates': { type: 'Point', coordinates: [lng, lat] } }
      );
    }
  }
  console.log(`Updated ${complaints.length} complaint location documents with geo coordinates.`);
};

const updateOfficerMetrics = async () => {
  const officers = await User.find({ role: { $in: ['officer', 'cm', 'supervisor'] } });
  for (const officer of officers) {
    const assignedComplaints = await Complaint.countDocuments({ assignedTo: officer._id });
    const activeComplaints = await Complaint.countDocuments({ assignedTo: officer._id, status: { $ne: 'Resolved' } });
    const resolvedCount = await Complaint.countDocuments({ assignedTo: officer._id, status: 'Resolved' });
    const feedbackSummary = await Complaint.aggregate([
      { $match: { assignedTo: officer._id, status: 'Resolved' } },
      {
        $lookup: {
          from: 'feedbacks',
          localField: '_id',
          foreignField: 'complaint',
          as: 'feedback',
        },
      },
      { $unwind: { path: '$feedback', preserveNullAndEmptyArrays: true } },
      { $group: { _id: null, avgRating: { $avg: '$feedback.rating' } } },
    ]);
    const resolutionSummary = await Complaint.aggregate([
      { $match: { assignedTo: officer._id, status: 'Resolved' } },
      {
        $project: {
          resolutionTimeDays: {
            $divide: [ { $subtract: ['$updatedAt', '$createdAt'] }, 1000 * 60 * 60 * 24 ],
          },
        },
      },
      { $group: { _id: null, avgResolutionTime: { $avg: '$resolutionTimeDays' } } },
    ]);

    const avgRating = feedbackSummary[0]?.avgRating ? Number(feedbackSummary[0].avgRating.toFixed(1)) : 0;
    const avgResolutionTime = resolutionSummary[0]?.avgResolutionTime ? Number(resolutionSummary[0].avgResolutionTime.toFixed(1)) : 0;
    const completionRate = assignedComplaints > 0 ? Number(((resolvedCount / assignedComplaints) * 100).toFixed(1)) : 0;

    await User.updateOne(
      { _id: officer._id },
      {
        activeComplaints,
        totalAssigned: assignedComplaints,
        completionRate,
        customerRating: avgRating,
        avgResolutionTime,
      }
    );
  }
  console.log(`Updated metrics for ${officers.length} officers.`);
};

const run = async () => {
  await connectDB();
  await updateComplaintLocations();
  await updateOfficerMetrics();
  mongoose.disconnect();
};

run().catch((error) => {
  console.error('Migration failed', error);
  process.exit(1);
});
