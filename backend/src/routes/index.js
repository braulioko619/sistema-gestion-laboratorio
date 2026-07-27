const express = require('express');
const router = express.Router();

router.use('/auth', require('./auth.routes'));
router.use('/documents', require('./document.routes'));
router.use('/quality', require('./quality.routes'));
router.use('/nonconformities', require('./nonconformity.routes'));
router.use('/equipment', require('./equipment.routes'));
router.use('/personnel', require('./personnel.routes'));
router.use('/internal-audits', require('./internalaudit.routes'));
router.use('/users', require('./user.routes'));
router.use('/audit', require('./audit.routes'));
router.use('/clients', require('./client.routes'));
router.use('/work-orders', require('./workorder.routes'));
router.use('/accreditations', require('./accreditation.routes'));
router.use('/commercial-documents', require('./commercialdocument.routes'));
router.use('/price-list', require('./pricelist.routes'));
router.use('/quotes', require('./quote.routes'));
router.use('/software-validations', require('./softwarevalidation.routes'));
router.use('/excel-templates', require('./exceltemplate.routes'));
router.use('/calibration-form-templates', require('./calibrationformtemplate.routes'));

router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
