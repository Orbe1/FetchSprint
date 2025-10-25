// Force the Node CommonJS file — never the browser/ESM build.
const pdfParse = require('pdf-parse/lib/pdf-parse.js');

/**
 * @param {Buffer} buffer
 * @returns {Promise<{ text?: string }>}
 */
module.exports = async function parsePdfBuffer(buffer) {
  return pdfParse(buffer);
};

