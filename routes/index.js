const express = require('express'),
  router = express.Router(),
  config = require('../config/config.json');


/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});

// Get Evrymap's configuration
router.get('/getconfig', function (req, res) {
  const configReturn = config;
  res.send(configReturn);
});

module.exports = router;
