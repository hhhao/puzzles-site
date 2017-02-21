/*
 Chess Minimax Search
 */

var nn = new (require('./chessNN.js'))();
var chess = new (require('./chessGame.js'))();

//TODO implement alpha-beta
function minimaxTopLevelWithMove(fen, depth) {
    var result = [-Infinity, null];
    var alpha = -Infinity;
    var beta = Inifinity;
    chess.fenToBoard(fen);
    var moves = chess.availableMoves();
    if (depth <= 0 || !moves.length) {
        result[0] = nn.forward(chess.gfeatures(), chess.pfeatures(), chess.sfeatures());
        return result;
    }
    for (let i = 0, n = moves.length; i < n; i++) {
        var m = moves[i];
        chess.move(m[0], m[1], m[2]);
        var subScore = minimax(chess.boardToFen(), depth-1, alpha, beta, false);
        if (subScore > result[0]) {
            result[0] = subScore;
            result[1] = m;
            alpha = subScore;
        }
        chess.fenToBoard(fen);
    }
    return result;
}

function minimax(fen, depth, alpha, beta, isMaxSide) {
    chess.fenToBoard(fen);
    var moves = chess.availableMoves();
    if (depth <= 0 || !moves.length) {
        return nn.forward(chess.gfeatures(), chess.pfeatures(), chess.sfeatures());
    }
    var score = isMaxSide ? -Infinity : Infinity;
    for (let i = 0, n = moves.length; i < n; i++) {
        var m = moves[i];
        chess.move(m[0], m[1], m[2]);
        var subScore = minimax(chess.boardToFen(), depth-1, alpha, beta, !isMaxSide);
        if (isMaxSide && subScore > score) {
            score = subScore;
            alpha = subScore;
        } else if (!isMaxSide && subScore < score) {
            score = subScore;
            beta = subScore;
        }
        chess.fenToBoard(fen);
        if (alpha > beta) break;
    }
    return score;
}

module.exports = minimaxTopLevelWithMove;
