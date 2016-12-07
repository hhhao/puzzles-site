var express = require('express');
var router = express.Router();

//var __path = '/home/hhhao/codecore/final_project/puzzles';
router.get('/', function(req, res, next) {
    res.render('chess');
    //res.sendFile(__path + '/client/chess.html');
});

module.exports = router;
