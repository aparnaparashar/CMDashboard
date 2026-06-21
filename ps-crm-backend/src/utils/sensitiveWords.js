// Backend sensitive word filter for complaint validation
const SENSITIVE_WORDS = [
  // Common English offensive words
  'damn', 'hell', 'bastard', 'asshole', 'idiot', 'stupid', 'moron',
  'retard', 'crap', 'piss', 'sucks', 'shit', 'suck', 'fuck', 'fucking',
  'bitched', 'bitching', 'bitch', 'asshat', 'jackass', 'douchebag',
  
  // Hindi/Devanagari offensive words (transliteration)
  'gaali', 'randii', 'randi', 'bhenchod', 'maderchod', 'chutiya',
  'chod', 'lund', 'rand', 'harami', 'haram', 'jhandu', 'jhantu', 'nalayak',
   'gadha', 'gandu',  'chirkut', 'buddu',
  'hookah', 'hathkandi', 'chapri', 'chamcha', 'makkhichaps',
  'bebakof', 'badmash', 'badmaash', 'gundagardi', 'lath', 'pithau','khichdi', 'makhmali', 'makdi', 'chunnu', 'munnu',
  'gundaism', 'jhunjhuna', 'chappal', 'chatpati',
  
  // Regional variations
  'oye', 'sadda', 'pagal', 'paagal',
  'jhunjhunaa', 'marwana', 'pitna', 
  'doglapan', 'bewakoof', 'bewkoof', 'nakara',
  
  // Slang and abusive references
  'teri maa', 'tera baap', 'bap re', 'aajao', 'aa jaao',
  'sale', 'kamina', 'kameena', 'dalaal', 'nakaam',
  'nakamyaab', 'shaitan',
  

];

/**
 * Detects sensitive/offensive words in text
 * @param {string} text - Text to check
 * @returns {boolean} - True if sensitive words found
 */
const hasSensitiveWords = (text) => {
  if (!text || typeof text !== 'string') return false;
  
  const lowerText = text.toLowerCase().trim();
  
  // Check against word list
  return SENSITIVE_WORDS.some(word => {
    // Use word boundaries to avoid partial matches
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    return regex.test(lowerText);
  });
};

/**
 * Validates complaint text fields for sensitive words
 * @param {Object} complaintData - Complaint data object
 * @returns {Object} - { valid: boolean, field: string (if invalid) }
 */
const validateComplaintFields = (complaintData) => {
  // Check title
  if (complaintData.title && hasSensitiveWords(complaintData.title)) {
    return { valid: false, field: 'title' };
  }
  
  // Check description
  if (complaintData.description && hasSensitiveWords(complaintData.description)) {
    return { valid: false, field: 'description' };
  }
  
  // Check remarks if it exists
  if (complaintData.remarks && hasSensitiveWords(complaintData.remarks)) {
    return { valid: false, field: 'remarks' };
  }
  
  // Check location line1
  if (complaintData.location?.line1 && hasSensitiveWords(complaintData.location.line1)) {
    return { valid: false, field: 'location.line1' };
  }
  
  return { valid: true };
};

module.exports = { hasSensitiveWords, validateComplaintFields };
