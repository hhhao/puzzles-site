var nn = new require('./chessNN.js')();
var chess = new require('./chessGame.js')();

//TODO implement alpha-beta
function minimax(fen, depth, alpha, beta) {
    if (chess.fenToBoard(fen).isCheckMate() || depth <= 0) {
        return nn.forward(chess.gfeatures, chess.pfeatures, chess.sfeatures);
    }
    var result = [-Infinity, null];
    var moves = chess.availableMoves();
    for (let i = 0, n = moves.length; i < n; i++) {
        var m = moves[i];
        var subScore = -1 * minimax(chess.move(m[0], m[1]).boardToFen(), depth-1, alpha, beta);
        if (subScore > result[0]) {
            result[0] = subScore;
            result[1] = m;
        }
        chess.fenToBoard(fen);
    }
    return result;
}

module.exports = minimax;
