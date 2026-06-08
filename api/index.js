const { handleRequest } = require('./handler');

module.exports = async function handler(req, res) {
  const url = new URL(req.url, `https://${req.headers.host}`);
  
  // Vercel rewrite loses the original path — rebuild it from headers
  const originalPath = req.headers['x-matched-path'] || url.pathname;
  
  return handleRequest(req, res, originalPath);
};