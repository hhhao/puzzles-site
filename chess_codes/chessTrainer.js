var minimax = require('./chessMinimax.js');
var nn = new (require('./chessNN.js'))();
var chess = new (require('./chessGame.js'))();

var fs = require('fs');
var readline = require('readline');
var stream = require('stream');

var instream = fs.createReadStream('./unique00.fen');
var outstream = new stream();
var rl = readline.createInterface(instream, outstream);

var DEPTH = 10; //search depth parameter
var LAMBDA = 0.7; //TDleaf parameter
var SELF_PLAY_TURNS = 12; //Number of turns to play self
var EPOCH = 100; //num of backprop iterations before write weights to file
var NFEN_PER_ITER = 128; //num of fen to process before backprop


var iteration = 0; //denotes iteration num of current epoch
var iterSubCount = 0; //num of fen read for current iteration
var totalError = 0;
rl.on('line', function(fen) {
    iterSubCount++;
    //set board to fen
    chess.fenToBoard(fen);

    //make a random move
    var moves = chess.availableMoves();
    var m = moves[Math.floor(Math.random()*moves.length)];
    chess.move(m[0], m[1], m[2]);

    //TDleaf the fen postion for 12 moves, sum error
    var error = 0;
    var prevScore;
    for (let i = 0; i < SELF_PLAY_TURNS; i++) {
        var result = minimax(chess.boardToFen(), DEPTH, -Infinity, Infinity);
        var score = result[0];
        chess.move(result[1][0], result[1][1], result[1][2]);
        var oppResult = minimax(chess.boardToFen(), DEPTH, -Infinity, Infinity);
        chess.move(oppResult[1][0], oppResult[1][1]);
        error += Math.pow(LAMBDA, i) * (prevScore === undefined ? 0 : score - prevScore);
        prevScore = score;
    }

    totalError += error;

    if (iterSubCount >= NFEN_PER_ITER) {
        totalError = 0;
        iterSubCount = 0;
        nn.backprop(totalError);
        iteration++;
    }

    //write weights to after each epoch
    if (iteration >= EPOCH) {
        nn.writeWeightsJSON('./NNWeights.json');
        iteration = 0;
    }
});
