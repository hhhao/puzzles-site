var nn = new (require('./chessNN.js'))();
var chess = new (require('./chessGame.js'))();

//TODO implement alpha-beta
function minimaxTopLevelWithMove(fen, depth, alpha, beta) {
    var result = [-Infinity, null];
    chess.fenToBoard(fen);
    if (chess.isCheckmate() || depth <= 0) {
        result[0] = nn.forward(chess.gfeatures(), chess.pfeatures(), chess.sfeatures());
        return result;
    }

    var moves = chess.availableMoves();
    for (let i = 0, n = moves.length; i < n; i++) {
        var m = moves[i];
        chess.move(m[0], m[1], m[2]);
        var subScore = -1 * minimax(chess.boardToFen(), depth-1, alpha, beta);
        if (subScore > result[0]) {
            result[0] = subScore;
            result[1] = m;
        }
        chess.fenToBoard(fen);
    }
    return result;
}

function minimax(fen, depth, alpha, beta) {
    chess.fenToBoard(fen);
    if (chess.isCheckmate() || depth <= 0) {
        return nn.forward(chess.gfeatures(), chess.pfeatures(), chess.sfeatures());
    }

    var score = -Infinity;
    var moves = chess.availableMoves();
    for (let i = 0, n = moves.length; i < n; i++) {
        var m = moves[i];
        chess.move(m[0], m[1], m[2]);
        //chess.drawBoard();//#################
        var subScore = -1 * minimax(chess.boardToFen(), depth-1, alpha, beta);
        if (subScore > score) score = subScore;
        chess.fenToBoard(fen);
    }
    return score;
}

module.exports = minimaxTopLevelWithMove;