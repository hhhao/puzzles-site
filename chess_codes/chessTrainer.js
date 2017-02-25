/*
 Chess Trainer
 */

let minimax = require('./chessMinimax.js');
let nn = new (require('./chessNN.js'))();
let chess = new (require('./chessGame.js'))();

let fs = require('fs');
let readline = require('readline');
let stream = require('stream');

let instream = fs.createReadStream('../../chess-position-files/unique00.fen');
let outstream = new stream();
let rl = readline.createInterface(instream, outstream);

const DEPTH = 2; //search depth parameter
const LAMBDA = 0.7; //TDleaf parameter
const SELF_PLAY_TURNS = 10; //Number of turns to play self
const EPOCH = 10; //num of backprop iterations before write weights to file
const NFEN_PER_ITER = 10; //num of fen to process before backprop


let iteration = 0; //denotes iteration num of current epoch
let iterSubCount = 0; //num of fen read for current iteration
let totalError = 0;
rl.on('line', function(fen) {
    iterSubCount++;
    //set board to fen
    chess.fenToBoard(fen);
    console.log('fen: ', fen);

    //increase position variability by making a random move or backprop if no moves
    let moves = chess.availableMoves();
    if (!moves.length) {
        let score = nn.forward(chess.gfeatures(), chess.pfeatures(), chess.sfeatures());
        let actual = chess.isCheckmate() ? (chess.current_move_side === 'w' ? -1 : 1) : 0;
        nn.backprop(score-actual);
    } else {
        let m = moves[Math.floor(Math.random()*moves.length)];
        chess.move(m[0], m[1], m[2]);

        //TDleaf the fen postion for number of moves, sum error
        let error = 0;
        let prevScore;
        for (let i = 0; i < SELF_PLAY_TURNS; i++) {
            let result = minimax(chess.boardToFen(), DEPTH);
            console.log("result: ", result[0]);
            if (endPositionBackprop(result)) break; // Game ended before self play end
            let score = result[0];
            chess.move(result[1][0], result[1][1], result[1][2]);
            error += Math.pow(LAMBDA, i) * (prevScore === undefined ? 0 : prevScore - score);
            prevScore = score;
        }

        totalError += error;
        console.log("error: ", totalError);

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
    if (!result[1]) { //fen was stalemate or checkmate (score 0 or -1 or 1), good opportunity to backprop
        let actual = chess.isCheckmate() ? (chess.current_move_side === 'w' ? -1 : 1) : 0;
        nn.backprop(result[0]-actual);

        // Print some information:
        console.log(actual === 0 ? 'Draw, 0' : (actual === -1 ? 'Checkmate on white, -1' : 'Checkmate on black, 1'));
        chess.drawBoard();

        return true;
    }
    return false;
}
