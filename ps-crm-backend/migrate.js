require('dotenv').config();
const mongoose = require('mongoose');
const Complaint = require('./src/models/Complaint');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const complaints = await Complaint.find({ complaintNumber: { $exists: false } });
  console.log(`Found ${complaints.length} complaints without complaintNumber`);
  
  for (const c of complaints) {
    c.complaintNumber = `CMP-${c._id.toString().slice(-8).toUpperCase()}`;
    await c.save({ validateBeforeSave: false });
    console.log(`Updated: ${c.complaintNumber}`);
  }

  console.log('Migration complete!');
  mongoose.disconnect();
});