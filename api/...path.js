const { handleRequest } = require('./handler');

module.exports = async function handler(req, res) {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    return handleRequest(req, res, url.pathname);
};