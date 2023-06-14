/**
 * Converts a time string into milliseconds.
 *
 * @param {string} time - The time string to be converted.
 *                         Format: {number}{unit}, where unit can be:
 *                         ms (milliseconds), s (seconds), m (minutes), h (hours)
 * @return {number} The time in milliseconds.
 */
export default function TimeDetector(time) {
    const regex = /^(\d+)(ms|s|m|h)$/;
    const match = time.match(regex);
    
    if (match) {
      const q = parseInt(match[1], 10);
      const u = match[2];
  
      switch (u) {
        case 'ms':
          return q;
        case 's':
          return q * 1000;
        case 'm':
          return q * 60000;
        case 'h':
          return q * 3600000;
        default:
          return 0;
      }
    } else {
      return 0;
    }
  }
  