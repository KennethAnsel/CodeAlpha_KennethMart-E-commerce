const { handleRequest } = require('./handler');

module.exports = async function handler(req, res) {
  // Vercel passes the full path including /api
  // We parse it and forward to the shared handler
  const url = new URL(req.url, `https://${req.headers.host}`);
  return handleRequest(req, res, url.pathname);
};