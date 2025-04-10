const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.render('documentation', {
    title: 'Documentation de l\'API',
    currentPage: 'api',
    layout: false
  });
});

module.exports = router;