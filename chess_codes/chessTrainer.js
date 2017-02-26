/*
 Chess Trainer
 */

let minimax = require('./chessMinimax.js');
let nn = new (require('./chessNN.js'))();
let chess = new (require('./chessGame.js'))();

let fs = require('fs');
let readline = require('readline');
let stream = require('stream');

let instream = fs.createReadStream('../../chess-position-files/unique04_shuffled.fen');
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
    console.log("\nfen: ", fen);
    chess.drawBoard();

    //increase position variability by making a random move or backprop if no moves
    let moves = chess.availableMoves();
    if (!moves.length) { // If can't even move on initial position
        let score = nn.forward(chess.gfeatures(), chess.pfeatures(), chess.sfeatures());
        let actual = chess.isCheckmate() ? (chess.current_move_side === 'w' ? -1 : 1) : 0;
        nn.backprop(score-actual);
    } else {
        let m = moves[Math.floor(Math.random()*moves.length)];
        chess.move(m[0], m[1], m[2]);
        let newFen = chess.boardToFen();
        console.log("New fen: ", newFen);
        chess.drawBoard();

        //TDleaf the fen postion for number of moves, sum error
        let error = 0, prevScore;
        for (let i = 0, canContinue = true; i < SELF_PLAY_TURNS && canContinue; i++) {
            console.log('--------------------------------------------------------');
            let result = minimax(nn, chess.boardToFen(), DEPTH);
            let score = result[0];
            if (result[1]) {
                chess.move(result[1][0], result[1][1], result[1][2]);
                console.log(chess.boardToFen());
                console.log("Move made: ", result[1]);
            } else {
                score = chess.isCheckmate() ? (chess.current_move_side === 'w' ? -1 : 1) : 0;
                console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
                console.log(score === 0 ? 'Draw, 0' : (score === -1 ? 'Checkmate on white, -1' : 'Checkmate on black, 1'));
                canContinue = false;
            }
            chess.drawBoard();
            error += Math.pow(LAMBDA, i) * (prevScore === undefined ? 0 : prevScore - score);
            console.log('result ' + (i+1) + ', error sum: ', score, error);
            prevScore = score;
        }

        totalError += error;
        console.log("Current iteration total error: ", totalError);
        console.log("************************************************\n************************************************");

        if (iterSubCount >= NFEN_PER_ITER) {
            chess.fenToBoard(newFen);
            nn.forward(chess.gfeatures(), chess.pfeatures(), chess.sfeatures()); // Need to foward once for correct rate calc in backprop
            let avgError = totalError/SELF_PLAY_TURNS/NFEN_PER_ITER;
            nn.backprop(avgError);
            iteration++;
            console.log('backprop, average error: ', avgError);
            console.log("############################## NEW ITERATION ##############################\n")
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
