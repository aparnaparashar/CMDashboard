const express = require('express');
const router = express.Router();
const {
  submitComplaint,
  getAllComplaints,
  getComplaintByNumber,
  getComplaintById,
  updateComplaintStatus,
  getMyComplaints,
  getAssignedComplaints,
  classifyComplaint,
} = require('../controllers/complaintController');
const { protect, adminOnly, officerOrAdmin } = require('../middleware/authMiddleware');

router.post('/classify',              classifyComplaint);                              // AI classification (public)
router.post('/',          protect,    submitComplaint);                                // citizen submits complaint
router.get('/my',         protect,    getMyComplaints);                                // citizen's own complaints
router.get('/assigned',   protect,    officerOrAdmin, getAssignedComplaints);          // officer's assigned
router.get('/track/:complaintNumber', getComplaintByNumber);                           // ← PUBLIC track by CMP-XXXXXXXX
router.get('/',           protect,    adminOnly, getAllComplaints);                     // admin: all complaints
router.get('/:id',                    getComplaintById);                               // single by MongoDB _id
router.put('/:id',        protect,    officerOrAdmin, updateComplaintStatus);          // officer resolves

module.exports = router;