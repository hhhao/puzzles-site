var nn = new require('./chessNN.js')();
var minimax = require('./chessMinimax.js');
var chess = new require('./chessGame.js')();

var DEPTH = 10; //search depth parameter
var LAMBDA = 0.7; //TDleaf parameter
var SELF_PLAY_TURNS = 12; //Number of turns to play self
var EPOCH = 100; //backprop iterations before write weights to file


var iterations = 0;
//TODO implement read from file
while ('not at EOF') {
    iterations++;
    var totalError = 0;
    //TODO implement read N (256?) fen postions
    while ('read N fen postions') {
        //read fen position from file
        var fen; //TODO: =...?

        //set board to fen
        chess.fenToBoard(fen);

        //make a random move
        var moves = chess.availableMoves();
        var m = moves[Math.floor(Math.random()*moves.length)];
        chess.move(m[0], m[0], 'q');

        //TDleaf the fen postion for 12 moves, sum error
        var error = 0;
        var prevScore = undefined;
        for (let i = 0; i < SELF_PLAY_TURNS; i++) {
            var result = minimax(chess.boardToFen(), DEPTH, -Infinity, Infinity);
            var score = result[0];
            chess.move(result[1][0], result[1][1]);
            var oppResult = minimax(chess.boardToFen(), DEPTH, -Infinity, Infinity);
            chess.move(oppResult[1][0], oppResult[1][1]);
            error += Math.pow(LAMBDA, i) * (prevScore === undefined ? 0 : score - prevScore);
            prevScore = score;
        }
        totalError += error;

    }

    nn.backprop(totalError);

    if (iterations >= EPOCH) {
        //TODO: after set number of iterations write nn weights to file
    }

}
