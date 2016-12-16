var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
    res.sendFile(appRoot + '/views/chess.html');
});

module.exports = router;
