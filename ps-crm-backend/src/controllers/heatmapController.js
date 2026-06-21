// ps-crm-backend/src/controllers/heatmapController.js

const Complaint = require('../models/Complaint');

const URGENCY_WEIGHT = { High: 3, Medium: 2, Low: 1 };

// ── Real Delhi localities → coordinates ───────────────────────────────────────
// Covers locality names, common spellings, and ward numbers (Ward 1–272)
// Add more entries here as new ward values appear in your DB
const LOCALITY_COORDS = {
  // ── Central Delhi ──────────────────────────────────────────────────────────
  'Pahar Ganj':        { lat: 28.6448, lng: 77.2100 },
  'Paharganj':         { lat: 28.6448, lng: 77.2100 },
  'Pahari Ganj':       { lat: 28.6448, lng: 77.2100 },
  'Connaught Place':   { lat: 28.6315, lng: 77.2167 },
  'CP':                { lat: 28.6315, lng: 77.2167 },
  'Karol Bagh':        { lat: 28.6520, lng: 77.1921 },
  'Karolbagh':         { lat: 28.6520, lng: 77.1921 },
  'Civil Lines':       { lat: 28.6800, lng: 77.2200 },
  'Daryaganj':         { lat: 28.6380, lng: 77.2380 },
  'Chandni Chowk':     { lat: 28.6506, lng: 77.2300 },
  'Old Delhi':         { lat: 28.6560, lng: 77.2310 },
  'Sadar Bazar':       { lat: 28.6618, lng: 77.2100 },
  'Patel Nagar':       { lat: 28.6553, lng: 77.1720 },
  'Rajendra Nagar':    { lat: 28.6388, lng: 77.1722 },
  'Rajender Nagar':    { lat: 28.6388, lng: 77.1722 },

  // ── North Delhi ────────────────────────────────────────────────────────────
  'Model Town':        { lat: 28.7110, lng: 77.1900 },
  'Rohini':            { lat: 28.7400, lng: 77.1800 },
  'Pitampura':         { lat: 28.7000, lng: 77.1500 },
  'Shalimar Bagh':     { lat: 28.7200, lng: 77.1600 },
  'Ashok Vihar':       { lat: 28.6950, lng: 77.1750 },
  'Burari':            { lat: 28.7500, lng: 77.2000 },
  'Mukherjee Nagar':   { lat: 28.7050, lng: 77.2100 },
  'GTB Nagar':         { lat: 28.7010, lng: 77.2090 },
  'Adarsh Nagar':      { lat: 28.7150, lng: 77.1800 },
  'Timarpur':          { lat: 28.6980, lng: 77.2150 },
  'Shakti Nagar':      { lat: 28.6780, lng: 77.2080 },
  'Tri Nagar':         { lat: 28.6800, lng: 77.1600 },

  // ── North-East Delhi ───────────────────────────────────────────────────────
  'Shahdara':          { lat: 28.6770, lng: 77.2910 },
  'Vivek Vihar':       { lat: 28.6720, lng: 77.3150 },
  'Geeta Colony':      { lat: 28.6650, lng: 77.2900 },
  'Anand Vihar':       { lat: 28.6480, lng: 77.3160 },
  'Preet Vihar':       { lat: 28.6390, lng: 77.2950 },
  'Laxmi Nagar':       { lat: 28.6320, lng: 77.2770 },
  'Jhilmil':           { lat: 28.6600, lng: 77.3100 },
  'Krishna Nagar':     { lat: 28.6510, lng: 77.2820 },
  'Gandhi Nagar':      { lat: 28.6600, lng: 77.2820 },
  'Seelampur':         { lat: 28.6780, lng: 77.2750 },
  'Mustafabad':        { lat: 28.7050, lng: 77.2950 },
  'Bhajanpura':        { lat: 28.7000, lng: 77.2800 },

  // ── East Delhi ─────────────────────────────────────────────────────────────
  'Patparganj':        { lat: 28.6240, lng: 77.2980 },
  'Mayur Vihar':       { lat: 28.6080, lng: 77.2960 },
  'Kondli':            { lat: 28.5940, lng: 77.3300 },
  'Trilokpuri':        { lat: 28.6150, lng: 77.3080 },
  'Kalyanpuri':        { lat: 28.6100, lng: 77.3150 },
  'Mandawali':         { lat: 28.6150, lng: 77.3050 },
  'IP Extension':      { lat: 28.6280, lng: 77.3000 },
  'Lal Kuan':          { lat: 28.6380, lng: 77.2850 },

  // ── South Delhi ────────────────────────────────────────────────────────────
  'Lajpat Nagar':      { lat: 28.5700, lng: 77.2430 },
  'South Extension':   { lat: 28.5780, lng: 77.2220 },
  'Greater Kailash':   { lat: 28.5480, lng: 77.2430 },
  'Malviya Nagar':     { lat: 28.5320, lng: 77.2050 },
  'Hauz Khas':         { lat: 28.5493, lng: 77.2006 },
  'Green Park':        { lat: 28.5602, lng: 77.2010 },
  'Safdarjung':        { lat: 28.5684, lng: 77.2060 },
  'Nehru Place':       { lat: 28.5491, lng: 77.2520 },
  'Kalkaji':           { lat: 28.5360, lng: 77.2580 },
  'Govindpuri':        { lat: 28.5260, lng: 77.2530 },
  'Okhla':             { lat: 28.5500, lng: 77.2700 },
  'Sarita Vihar':      { lat: 28.5250, lng: 77.2900 },
  'Badarpur':          { lat: 28.5055, lng: 77.2894 },
  'Tughlakabad':       { lat: 28.5060, lng: 77.2600 },
  'Sangam Vihar':      { lat: 28.5050, lng: 77.2330 },
  'Deoli':             { lat: 28.5000, lng: 77.2250 },
  'Ambedkar Nagar':    { lat: 28.5150, lng: 77.2400 },

  // ── South-West Delhi ───────────────────────────────────────────────────────
  'Vasant Kunj':       { lat: 28.5200, lng: 77.1600 },
  'Vasant Vihar':      { lat: 28.5700, lng: 77.1700 },
  'Mehrauli':          { lat: 28.5242, lng: 77.1855 },
  'Chattarpur':        { lat: 28.5000, lng: 77.1800 },
  'Saket':             { lat: 28.5200, lng: 77.2100 },

  // ── West Delhi ─────────────────────────────────────────────────────────────
  'Dwarka':            { lat: 28.5921, lng: 77.0460 },
  'Uttam Nagar':       { lat: 28.6213, lng: 77.0590 },
  'Janakpuri':         { lat: 28.6280, lng: 77.0870 },
  'Rajouri Garden':    { lat: 28.6480, lng: 77.1230 },
  'Punjabi Bagh':      { lat: 28.6680, lng: 77.1380 },
  'Paschim Vihar':     { lat: 28.6680, lng: 77.1050 },
  'Vikaspuri':         { lat: 28.6330, lng: 77.0720 },
  'Tilak Nagar':       { lat: 28.6400, lng: 77.1000 },
  'Subhash Nagar':     { lat: 28.6400, lng: 77.1200 },
  'Tagore Garden':     { lat: 28.6420, lng: 77.1180 },
  'Moti Nagar':        { lat: 28.6600, lng: 77.1500 },
  'Kirti Nagar':       { lat: 28.6540, lng: 77.1480 },
  'Ramesh Nagar':      { lat: 28.6500, lng: 77.1380 },
  'Hari Nagar':        { lat: 28.6250, lng: 77.1250 },
  'Nawada':            { lat: 28.6180, lng: 77.0790 },
  'Najafgarh':         { lat: 28.6091, lng: 76.9795 },
  'Bindapur':          { lat: 28.6100, lng: 77.0620 },

  // ── North-West Delhi ───────────────────────────────────────────────────────
  'Mangolpuri':        { lat: 28.7100, lng: 77.0850 },
  'Sultanpuri':        { lat: 28.7200, lng: 77.0700 },
  'Mundka':            { lat: 28.6850, lng: 77.0350 },
  'Nangloi':           { lat: 28.6720, lng: 77.0620 },
  'Peeragarhi':        { lat: 28.6780, lng: 77.0900 },
  'Kirari':            { lat: 28.7400, lng: 77.0450 },
  'Bawana':            { lat: 28.7900, lng: 77.0500 },
  'Narela':            { lat: 28.8480, lng: 77.0929 },
  'Alipur':            { lat: 28.7960, lng: 77.1330 },

  // ── Fallback: Ward numbers (Ward 1 – Ward 272) mapped to Delhi zones ───────
  // These cover numeric ward IDs stored as "Ward 1", "Ward 12", etc.
  // Mapped to the geographic centre of their approximate zone.
  'Ward 1':   { lat: 28.6600, lng: 77.2300 }, 'Ward 2':   { lat: 28.6550, lng: 77.2250 },
  'Ward 3':   { lat: 28.6500, lng: 77.2200 }, 'Ward 4':   { lat: 28.6480, lng: 77.2150 },
  'Ward 5':   { lat: 28.6460, lng: 77.2100 }, 'Ward 6':   { lat: 28.6440, lng: 77.2050 },
  'Ward 7':   { lat: 28.6420, lng: 77.2000 }, 'Ward 8':   { lat: 28.6400, lng: 77.1950 },
  'Ward 9':   { lat: 28.6380, lng: 77.1900 }, 'Ward 10':  { lat: 28.6360, lng: 77.1850 },
  'Ward 11':  { lat: 28.6700, lng: 77.2400 }, 'Ward 12':  { lat: 28.6750, lng: 77.2350 },
  'Ward 13':  { lat: 28.6800, lng: 77.2300 }, 'Ward 14':  { lat: 28.6850, lng: 77.2250 },
  'Ward 15':  { lat: 28.6900, lng: 77.2200 }, 'Ward 16':  { lat: 28.6950, lng: 77.2150 },
  'Ward 17':  { lat: 28.7000, lng: 77.2100 }, 'Ward 18':  { lat: 28.7050, lng: 77.2050 },
  'Ward 19':  { lat: 28.7100, lng: 77.2000 }, 'Ward 20':  { lat: 28.7150, lng: 77.1950 },
  'Ward 21':  { lat: 28.5800, lng: 77.2100 }, 'Ward 22':  { lat: 28.5750, lng: 77.2050 },
  'Ward 23':  { lat: 28.5700, lng: 77.2000 }, 'Ward 24':  { lat: 28.5650, lng: 77.1950 },
  'Ward 25':  { lat: 28.5600, lng: 77.1900 }, 'Ward 26':  { lat: 28.5550, lng: 77.1850 },
  'Ward 27':  { lat: 28.5500, lng: 77.1800 }, 'Ward 28':  { lat: 28.5450, lng: 77.1750 },
  'Ward 29':  { lat: 28.5400, lng: 77.1700 }, 'Ward 30':  { lat: 28.5350, lng: 77.1650 },
  'Ward 31':  { lat: 28.6200, lng: 77.0800 }, 'Ward 32':  { lat: 28.6250, lng: 77.0850 },
  'Ward 33':  { lat: 28.6300, lng: 77.0900 }, 'Ward 34':  { lat: 28.6350, lng: 77.0950 },
  'Ward 35':  { lat: 28.6400, lng: 77.1000 }, 'Ward 36':  { lat: 28.6450, lng: 77.1050 },
  'Ward 37':  { lat: 28.6500, lng: 77.1100 }, 'Ward 38':  { lat: 28.6550, lng: 77.1150 },
  'Ward 39':  { lat: 28.6600, lng: 77.1200 }, 'Ward 40':  { lat: 28.6650, lng: 77.1250 },
  'Ward 41':  { lat: 28.7200, lng: 77.0600 }, 'Ward 42':  { lat: 28.7250, lng: 77.0650 },
  'Ward 43':  { lat: 28.7300, lng: 77.0700 }, 'Ward 44':  { lat: 28.7350, lng: 77.0750 },
  'Ward 45':  { lat: 28.7400, lng: 77.0800 }, 'Ward 46':  { lat: 28.7450, lng: 77.0850 },
  'Ward 47':  { lat: 28.7500, lng: 77.0900 }, 'Ward 48':  { lat: 28.7550, lng: 77.0950 },
  'Ward 49':  { lat: 28.7600, lng: 77.1000 }, 'Ward 50':  { lat: 28.7650, lng: 77.1050 },
};

// ── Normalise ward string for lookup ─────────────────────────────────────────
// Handles any capitalisation variant of locality names + "Ward N" format
function normaliseKey(raw) {
  if (!raw) return null;
  const s = raw.toString().trim();

  // Title-case the string for lookup: "pahar ganj" → "Pahar Ganj"
  const titleCase = s.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());

  // Direct match (title-cased)
  if (LOCALITY_COORDS[titleCase]) return titleCase;

  // Original string exact match (covers "Ward 12", "Uttam Nagar" already title-cased)
  if (LOCALITY_COORDS[s]) return s;

  // "Ward N" numeric format normalisation
  const wardNum = s.match(/^ward\s*(\d+)$/i);
  if (wardNum) {
    const key = `Ward ${wardNum[1]}`;
    if (LOCALITY_COORDS[key]) return key;
  }

  return null; // unrecognised — will be shown on map at fallback position
}

// ── Fallback: place unrecognised ward at a slightly offset Delhi centre ───────
// so it still appears on the heatmap rather than being silently dropped
const DELHI_CENTER = { lat: 28.6517, lng: 77.2219 };
let fallbackOffset = 0;
function getFallbackCoords() {
  fallbackOffset += 0.01;
  return {
    lat: DELHI_CENTER.lat + (Math.random() - 0.5) * 0.08,
    lng: DELHI_CENTER.lng + (Math.random() - 0.5) * 0.08,
  };
}

exports.getHeatmapData = async (req, res) => {
  // Reset fallback offset each request
  fallbackOffset = 0;

  try {
    const wardStats = await Complaint.aggregate([
      {
        $group: {
          _id:         '$location.ward',
          total:       { $sum: 1 },
          pending:     { $sum: { $cond: [{ $eq: ['$status', 'Pending'] },     1, 0] } },
          inProgress:  { $sum: { $cond: [{ $eq: ['$status', 'In Progress'] }, 1, 0] } },
          resolved:    { $sum: { $cond: [{ $eq: ['$status', 'Resolved'] },    1, 0] } },
          escalated:   { $sum: { $cond: [{ $eq: ['$status', 'Escalated'] },   1, 0] } },
          highUrgency: { $sum: { $cond: [{ $eq: ['$urgency', 'High'] },   1, 0] } },
          medUrgency:  { $sum: { $cond: [{ $eq: ['$urgency', 'Medium'] }, 1, 0] } },
          lowUrgency:  { $sum: { $cond: [{ $eq: ['$urgency', 'Low'] },   1, 0] } },
          categories:  { $push: '$category' },
        },
      },
      { $sort: { total: -1 } },
    ]);

    const heatmapPoints = [];
    const wardDetails   = [];
    let maxWeight = 1;

    for (const ward of wardStats) {
      if (!ward._id) continue;

      const key    = normaliseKey(ward._id);
      const coords = key ? LOCALITY_COORDS[key] : getFallbackCoords();
      const displayName = ward._id; // always show original name from DB

      const weightedScore =
        ward.highUrgency * URGENCY_WEIGHT.High +
        ward.medUrgency  * URGENCY_WEIGHT.Medium +
        ward.lowUrgency  * URGENCY_WEIGHT.Low +
        ward.escalated   * 2;

      if (weightedScore > maxWeight) maxWeight = weightedScore;

      const catCount = {};
      ward.categories.forEach(c => { catCount[c] = (catCount[c] || 0) + 1; });
      const topCategory = Object.entries(catCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Other';
      const resRate = ward.total > 0 ? Math.round((ward.resolved / ward.total) * 100) : 0;

      heatmapPoints.push({ lat: coords.lat, lng: coords.lng, weight: weightedScore });

      wardDetails.push({
        ward:           displayName,
        localName:      key || displayName,
        lat:            coords.lat,
        lng:            coords.lng,
        total:          ward.total,
        pending:        ward.pending,
        inProgress:     ward.inProgress,
        resolved:       ward.resolved,
        escalated:      ward.escalated,
        highUrgency:    ward.highUrgency,
        medUrgency:     ward.medUrgency,
        lowUrgency:     ward.lowUrgency,
        weightedScore,
        topCategory,
        resolutionRate: resRate,
        urgencyLevel:
          weightedScore >= maxWeight * 0.7 ? 'Critical' :
          weightedScore >= maxWeight * 0.4 ? 'High'     :
          weightedScore >= maxWeight * 0.2 ? 'Medium'   : 'Low',
      });
    }

    const totalComplaints = await Complaint.countDocuments();
    const totalResolved   = await Complaint.countDocuments({ status: 'Resolved' });
    const totalEscalated  = await Complaint.countDocuments({ status: 'Escalated' });

    res.json({
      heatmapPoints,
      wardDetails,
      maxWeight,
      summary: {
        totalComplaints,
        totalResolved,
        totalEscalated,
        activeWards: wardDetails.length,
        resolutionRate: totalComplaints > 0
          ? Math.round((totalResolved / totalComplaints) * 100) : 0,
      },
    });
  } catch (err) {
    console.error('[Heatmap]', err);
    res.status(500).json({ error: 'Failed to fetch heatmap data' });
  }
};