var minimax = require('./chessMinimax.js');
var nn = new (require('./chessNN.js'))();
var chess = new (require('./chessGame.js'))();

var fs = require('fs');
var readline = require('readline');
var stream = require('stream');

var instream = fs.createReadStream('./unique00_shuffled.fen');
var outstream = new stream();
var rl = readline.createInterface(instream, outstream);

var DEPTH = 1; //search depth parameter
var LAMBDA = 0.7; //TDleaf parameter
var SELF_PLAY_TURNS = 10; //Number of turns to play self
var EPOCH = 10; //num of backprop iterations before write weights to file
var NFEN_PER_ITER = 1; //num of fen to process before backprop


var iteration = 0; //denotes iteration num of current epoch
var iterSubCount = 0; //num of fen read for current iteration
var totalError = 0;
rl.on('line', function(fen) {
    iterSubCount++;
    //set board to fen
    chess.fenToBoard(fen);
    console.log('fen: ', fen);

    //make a random move or backprop if no moves
    var moves = chess.availableMoves();
    if (!moves.length) {
        var s = nn.forward(chess.gfeatures(), chess.pfeatures(), chess.sfeatures());
        var a = chess.isCheckmate() ? -1 : 0;
        nn.backprop(s-a);
    } else {
        var m = moves[Math.floor(Math.random()*moves.length)];
        chess.move(m[0], m[1], m[2]);

        //TDleaf the fen postion for number of moves, sum error
        var error = 0;
        var prevScore;
        for (let i = 0; i < SELF_PLAY_TURNS; i++) {
            var result = minimax(chess.boardToFen(), DEPTH, -Infinity, Infinity);
            console.log("result: ", result[0]);
            if (endPositionBackprop(result)) break;
            var score = result[0];
            chess.move(result[1][0], result[1][1], result[1][2]);
            //var oppResult = minimax(chess.boardToFen(), DEPTH, -Infinity, Infinity);
            //console.log("oppResult: ", oppResult[0]);
            //if (endPositionBackprop(oppResult)) break;
            //chess.move(oppResult[1][0], oppResult[1][1], oppResult[1][2]);
            error += Math.pow(LAMBDA, i) * (prevScore === undefined ? 0 : prevScore - score);
            prevScore = score;
        }

        totalError += error;
        console.log("\nerror: ", totalError);

        if (iterSubCount >= NFEN_PER_ITER) {
            chess.fenToBoard(fen);
            nn.forward(chess.gfeatures(), chess.pfeatures(), chess.sfeatures());
            nn.backprop(totalError/SELF_PLAY_TURNS);
            iteration++;
            console.log('backprop');
            totalError = 0;
            iterSubCount = 0;
        }

        //write weights and adadelta params after each epoch
        if (iteration >= EPOCH) {
            nn.writeWeightsJSON();
            nn.writeAdadeltaParamsJSON();
            iteration = 0;
            console.log('saved weights');
        }
    }
});


rl.on('close', function() {
    console.log('All positions read');
});

function endPositionBackprop(result) {
    if (!result[1]) { //fen was stalemate or checkmate (score 0 or -1), good opportunity to backprop
        if (result[0] === -Infinity) {
            nn.backprop(nn.forward(chess.gfeatures(), chess.pfeatures(), chess.sfeatures()) - 0);
        } else {
            nn.backprop(result[0] + 1);
        }
        return true;
    }
    return false;
}
