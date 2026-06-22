const express = require('express');
const router = express.Router();

router.use('/auth', require('./auth.routes'));
router.use('/documents', require('./document.routes'));
router.use('/quality', require('./quality.routes'));
router.use('/users', require('./user.routes'));
router.use('/audit', require('./audit.routes'));

router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
