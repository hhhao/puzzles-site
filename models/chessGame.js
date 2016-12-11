function Chess() {
    this.board = new Array(8);
    for (let i = 0; i < 8; i++) {
        this.board[i] = new Array(8).fill(null);
    }
    this.current_move_side = 'w';
    this.history = []; //[[from,to,:move_type,option,eat?],[from2,to2,:move_type2,option,eat?]...]
    this.hist_index = 0;
    this.pieces = Array(2);
    for (let c = 0; c <= 1; c++) {
        this.pieces[c] = [new Rook(), new Knight(), new Bishop(), new Queen(), new King(), new Bishop(), new Knight(), new Rook(), new Pawn(), new Pawn(), new Pawn(), new Pawn(), new Pawn(), new Pawn(), new Pawn(), new Pawn()];
    }
    for (let k = 0; k < 8; k++) {
        for (let i = 0; i <= 1; i++) {
            var color = i === 0 ? 'w' : 'b';
            var y_cord0 = i === 0 ? 0 : 7;
            var y_cord1 = y_cord0 - 2 * i + 1;
            this.pieces[i][k].color = color;
            this.pieces[i][k].loc = [k, y_cord0];
            this.board[k][y_cord0] = this.pieces[i][k];
            this.pieces[i][k+8].color = color;
            this.pieces[i][k+8].loc = [k, y_cord1];
            this.board[k][y_cord1] = this.pieces[i][k+8];
        }

    }
    this.dead_pieces = [[], []];
    this.promoted_pieces = [[], []];
    this.resign = false;
    this.enpassantSqr = null;
}

Chess.prototype = {
    /*
    start: function() {
        while (!this.isCheckmateStalemate()) {
            var input_array = [[], []];
            while (1) {
                this.drawBoard();
                console.log(this.colorToWord(this.current_move_side) + "'s move: (eg:b1c3/[b]ack/[f]orward/[r]esign)");
                if (this.getinput(input_array)) break;
            }
            if (this.resign) {
                console.log(this.colorToWord(this.oppositeColor(this.current_move_side)) + ' wins!');
                return false;
            }
            this.move(input_array[0], input_array[1], null);
        }
        //this.drawBoard();
    },
     */

    boardToFen: function() {
        function fenPSign(p) {
            if (p.color === 'w') {
                return p.sign;
            } else {
                return p.sign.toLowerCase();
            }
        }
        var fen = '';
        for (let y = 7; y >= 0; y--) {
            var row = '';
            var num = 0;
            for (let x = 0; x < 8; x++) {
                var p = this.board[x][y];
                if (p === null) {
                    num++;
                } else {
                    row += num === 0 ? fenPSign(p) : num + fenPSign(p);
                    num = 0;
                }
            }
            if (num > 0) row += num;
            fen += row + (y === 0 ? ' ' : '/');
        }
        fen += this.current_move_side + ' ';
        var canCastle = false;
        if (this.board[4][0] && this.isCastlePath([4, 0], [6, 0])) {fen += 'K'; canCastle = true;}
        if (this.board[4][0] && this.isCastlePath([4, 0], [2, 0])) {fen += 'Q'; canCastle = true;}
        if (this.board[4][7] && this.isCastlePath([4, 7], [6, 7])) {fen += 'k'; canCastle = true;}
        if (this.board[4][7] && this.isCastlePath([4, 7], [2, 7])) {fen += 'q'; canCastle = true;}
        fen += canCastle ? ' ' : '- ';
        fen += this.convPosToStr(this.enpassantSqr);

        return fen;
    },

    fenToBoard: function(fen) {
    },

    availableMoves: function() {
        var moves = [];
        var movingSide = this.pieces[this.colorToIndex(this.current_move_side)];
        for (let x = 0; x < 8; x++) {
            for (let y = 0; y < 8; y++) {
                for (let p = 0, n = movingSide.length; p < n; p++) {
                    var piece = movingSide[p];
                    if (piece.alive && this.isLegalMove(piece.sign, piece.loc, [x, y])) {
                        moves.push([piece.loc, [x, y]]);
                    }
                }
            }
        }
        return moves;
    },

    convPosFromStr: function(posStr) {
        var x = posStr[0].charCodeAt() - 'a'.charCodeAt();
        var y = parseInt(posStr[1]) - 1;
        return [x, y];
    },

    convPosToStr: function(pos) {
        if (!pos) return '-';
        return String.fromCharCode('a'.charCodeAt()+pos[0]) + (pos[1]+1).toString();
    },

    getPositionObj: function() {
        var obj = {};
        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                var p = this.board[x][y];
                if (p) obj[this.convPosToStr([x, y])] = p.color + p.sign;
            }
        }
        return obj;
    },

    getinput: function(input_array) {
        var raw_input = prompt('enter move');
        var input = [];
        input[0] = raw_input.slice(0, 2);
        input[1] = raw_input.slice(raw_input.length-2, raw_input.length);
        if (input[0].length < 1) return false;
        if (['b', 'f', 'r'].indexOf(input[0]) !== -1) {
            if (input[0] === 'b' && this.hist_index) {
                this.backOneMove();
            } else if (input[0] === 'f' && this.history[this.hist_index]) {
                this.forwardOneMove();
            } else if (input[0] === 'r') {
                this.resign = true;
                return true;
            } else {
                console.log('No available move in history!');
            }
            return false;
        }
        for (let i = 0; i <= 1; i++) {
            if (input[i][0].charCodeAt() > 'h'.charCodeAt() ||
                input[i][0].charCodeAt() < 'a' ||
                parseInt(input[i][1]) > 8 || parseInt(input[i][1]) < 1) {
                console.log('Invalid Input');
                return false;
            }
        }
        input_array[0][0] = input[0][0].charCodeAt() - 'a'.charCodeAt();
        input_array[0][1] = parseInt(input[0][1]) - 1;
        input_array[1][0] = input[1][0].charCodeAt() - 'a'.charCodeAt();
        input_array[1][1] = parseInt(input[1][1]) - 1;
        return true;
    },

    drawBoard: function() {
        console.log("  A B C D E F G H    ");
        for (let r = 7; r >= 0; r--) {
            var rowStr = `${r+1}|`;
            for (let c = 0; c <= 7; c++) {
                var sqr = this.board[c][r];
                rowStr += sqr ? this.pieceDisplay(sqr.sign, sqr.color) + '|' : '_|';
            }
            console.log(rowStr);
        }
        console.log("  A B C D E F G H    ");
        console.log(this.colorToWord(this.current_move_side) + "'s move:");
    },

    pieceDisplay: function(psign, pcolor) {
        if (psign === 'K') {
            return pcolor === 'w' ? '♔' : '♚';
        } else if (psign === 'Q') {
            return pcolor === 'w' ? '♕' : '♛';
        } else if (psign === 'R') {
            return pcolor === 'w' ? '♖' : '♜';
        } else if (psign === 'N') {
            return pcolor === 'w' ? '♘' : '♞';
        } else if (psign === 'B') {
            return pcolor === 'w' ? '♗' : '♝';
        } else if (psign === 'P') {
            return pcolor === 'w' ? '♙' : '♟';
        }
    },

    colorToWord: function(color) {
        return (color === 'w') ? 'White' : 'Black';
    },

    colorToIndex: function(color) {
        return color === 'w' ? 0 : 1;
    },

    oppositeColor: function(color) {
        return color === 'w' ? 'b' : 'w';
    },

    eat: function(loc) {
        var piece = this.board[loc[0]][loc[1]];
        this.board[loc[0]][loc[1]] = null;
        piece.alive = false;
        this.dead_pieces[this.colorToIndex(piece.color)].push(piece);
    },

    uneat: function(piece) {
        this.board[piece.loc[0]][piece.loc[1]] = piece;
        piece.alive = true;
    },

    promote: function(pawn, option) {
        var promo;
        if (option === null) {
            promo = prompt("Piece to promote your pawn to? ([q]ueen/[r]ook/[k]night/[b]ishop)");
            while (promo !== 'q' && promo !== 'r' && promo !== 'k' && promo !== 'b') {
                promo = prompt("Please enter a valid choice: ([q]ueen/[r]ook/[k]night/[b]ishop)");

            }
        } else {
            promo = option;
        }
        var choices = {'q': Queen,
                       'r': Rook,
                       'k': Knight,
                       'b': Bishop};
        var promote_to = new choices[promo](pawn.color, pawn.loc);
        promote_to.loc = pawn.loc;
        promote_to.color = pawn.color;
        promote_to.moves = pawn.moves;
        this.promoted_pieces[this.colorToIndex(pawn.color)].push(pawn);
        this.board[pawn.loc[0]][pawn.loc[1]] = promote_to;
        var i = this.colorToIndex(pawn.color);
        this.pieces[i][this.pieces[i].indexOf(pawn)] = promote_to;
        return [promote_to, promo];
    },

    unpromote: function(pawn, piece) {
        this.board[pawn.loc[0]][pawn.loc[1]] = pawn;
        var i = this.colorToIndex(piece.color);
        this.pieces[i][this.pieces[i].indexOf(piece)] = pawn;
    },

    castle: function(dest) {
        var y = dest[1];
        if (dest[0] === 2) {
            this.posSwitch([0, y], [3, y]);
            this.board[3][y].moves++;
        } else if (dest[0] === 6) {
            this.posSwitch([7, y], [5, y]);
            this.board[5][y].moves++;
        }
    },

    uncastle: function(king_to_loc) {
        var p_x = king_to_loc[0];
        var p_y = king_to_loc[1];
        if (p_x === 2) {
            this.posSwitch([3, p_y], [0, p_y]);
            this.board[0][p_y].moves--;
        } else if (p_x === 6) {
            this.posSwitch([5, p_y], [7, p_y]);
            this.board[7][p_y].moves--;
        }
    },

    isLocUnderAttack: function(loc, color) {
        var i = this.colorToIndex(this.oppositeColor(color));
        for (let k = 0, n = this.pieces[i].length; k < n; k++) {
            var p = this.pieces[i][k];
            if (p.alive && this.isLegalMove(p.sign, p.loc, loc)) return true;
        }
        return false;
    },

    isInCheck: function(color) {
        if (this.isLocUnderAttack(this.pieces[this.colorToIndex(color)][4].loc, color)) {
            return true;
        } else {
            return false;
        }
    },

    posSwitch: function(curr, dest) {
        this.board[curr[0]][curr[1]].loc = dest;
        this.board[dest[0]][dest[1]] = this.board[curr[0]][curr[1]];
        this.board[curr[0]][curr[1]] = null;
    },

    move: function(curr, dest, option) {
        var piece = this.board[curr[0]][curr[1]];
        if (!piece) return false;
        if (piece.color === this.current_move_side) {
            var m = this.isLegalMove(piece.sign, curr, dest);
            if (m) {
                this.history[this.hist_index] = [curr, dest, m, option, false];
                if (this.pieceColorAtLoc(dest)) {
                    this.eat(dest);
                    this.history[this.hist_index][-1] = true;
                }
                if (m === 'promotion') {
                    var promo_array = this.promote(piece, option);
                    piece = promo_array[0];
                    this.history[this.hist_index][3] = promo_array[1];
                } else if (m === 'en_passant') {
                    this.history[this.hist_index][-1] = true;
                    var pawn_eat_y = dest[1] + (piece.color == 'w' ? -1 : 1);
                    this.eat([dest[0], pawn_eat_y]);
                } else if (m === 'castle') {
                    this.castle(dest);
                }
                this.hist_index++;
                piece.moves++;
                this.posSwitch(curr, dest);
                this.current_move_side = this.oppositeColor(this.current_move_side);
                if (this.isInCheck(piece.color)) {
                    this.backOneMove();
                    return false;
                }
                console.log(this.boardToFen());
                return true;
            }
        } else {
            console.log('Please select a valid piece!');
            return false;
        }
    },

    backOneMove: function() {
        this.current_move_side = this.oppositeColor(this.current_move_side);
        this.hist_index--;
        var last_move;
        if (arguments[0] === 'd') {
            last_move = this.history.pop();
        } else {
            last_move = this.history[this.hist_index];
        }
        var piece = this.board[last_move[1][0]][last_move[1][1]];
        piece.moves--;
        this.posSwitch(last_move[1], last_move[0]);
        if (last_move[4]) {
            var dead = this.dead_pieces[this.colorToIndex(this.oppositeColor(piece.color))].pop();
            this.uneat(dead);
        }
        if (last_move[2] === 'promotion') {
            var pawn = this.promoted_pieces[this.colorToIndex(piece.color)].pop();
            this.unpromote(pawn, piece);
        } else if (last_move[2] === 'castle') {
            this.uncastle(last_move[1]);
        }
    },

    forwardOneMove: function() {
        var next_move = this.history[this.hist_index];
        if (next_move) {
            this.move(next_move[0], next_move[1], next_move[3]);
        }
    },

    isCheckmateStalemate: function() {
        var currPieces = this.pieces[this.colorToIndex(this.current_move_side)];
        for (let i = 0, n = currPieces.length; i < n; i++) {
            var p = currPieces[i];
            if (p.alive) {
                for (let x = 0; x < 8; x++) {
                    for (let y = 0; y < 8; y++) {
                        if (this.move(p.loc, [x, y], 'q')) {
                            this.backOneMove('d');
                            return false;
                        }
                    }
                }
            }
        }
        if (this.isInCheck(this.current_move_side)) {
            console.log('Checkmate!' + this.colorToWord(this.oppositeColor(this.current_move_side)) + 'wins!');
        } else {
            console.log('Stalemate! Draw!');
        }
        return true;
    },

    isLegalMove: function(psign, curr, dest) {
        var eps = this.enpassantSqr;
        this.enpassantSqr = null;
        if (this.isLocsInBounds(curr, dest) && this.isUnobstructedPath(curr, dest)) {
            if (psign === 'K') {
                if (this.isCastlePath(curr, dest)) {
                    return 'castle';
                } else if (this.isKingPath(curr, dest)) {
                    return 'move';
                }
            } else if (psign === 'Q' && (this.isDiagonalPath(curr, dest) || this.isStraightPath(curr, dest))) {
                return 'move';
            } else if (psign === 'R' && this.isStraightPath(curr, dest)) {
                return 'move';
            } else if (psign === 'N' && this.isKnightPath(curr, dest)) {
                return 'move';
            } else if (psign === 'B' && this.isDiagonalPath(curr, dest)) {
                return 'move';
            } else if (psign === 'P') {
                if (this.isPromotionPath(curr, dest)) {
                    return 'promotion';
                } else if (this.isEnPassantPath(curr, dest)) {
                    return 'en_passant';
                } else if (this.isPawnPath(curr, dest)) {
                    return 'move';
                }
            }
        }
        this.enpassantSqr = eps;
        return false;
    },

    isPromotionPath: function(curr, dest) {
        var pawn = this.board[curr[0]][curr[1]];
        var dir = pawn.color == 'w' ? 1 : -1;
        if (dest[1] - curr[1] === dir && (dest[1] === 0 || dest[1] === 7)) {
            if ((dest[0] - curr[0] === 0 && this.pieceColorAtLoc(dest) === null) || (Math.abs(dest[0] - curr[0]) === 1 && this.pieceColorAtLoc(dest) === this.oppositeColor(pawn.color))) {
                return true;
            }

        }
        return false;
    },

    isCastlePath: function(curr, dest) {
        var piece = this.board[curr[0]][curr[1]];
        if (piece.sign === 'K' && piece.moves === 0 && dest[1] === curr[1]) {
            var left_rook = this.pieces[this.colorToIndex(piece.color)][0];
            var right_rook = this.pieces[this.colorToIndex(piece.color)][7];
            if (dest[0] - curr[0] === -2 && (left_rook.moves === 0) && this.isUnobstructedPath(curr, [left_rook.loc[0]+1, left_rook.loc[1]])) {
                for (let i = curr[0], n = curr[0]-2; i >= n; i--) {
                    if (this.isLocUnderAttack([i, curr[1]], piece.color)) return false;
                }
                return true;
            } else if (dest[0] - curr[0] === 2 && right_rook.moves === 0 && this.isUnobstructedPath(curr, [right_rook.loc[0]-1, right_rook.loc[1]])) {
                for (let j = curr[0], n = curr[0]+2; j <= n; j++) {
                    if (this.isLocUnderAttack([j, curr[1]], piece.color)) return false;
                }
                return true;
            }
        }
        return false;
    },

    isEnPassantPath: function(curr, dest) {
        var piece = this.board[curr[0]][curr[1]];
        var dir = piece.color === 'w' ? 1 : -1;
        if (Math.abs(dest[0] - curr[0]) === 1 && dest[1] - curr[1] === dir) {
            if (!this.pieceColorAtLoc(dest) && this.history[this.hist_index - 1]) {
                var last_move_from = this.history[this.hist_index - 1][0];
                var last_move_to = this.history[this.hist_index - 1][1];
                if (this.board[last_move_to[0]][last_move_to[1]].sign === 'P' && (last_move_to[0] - last_move_from[0]) === 0 && (last_move_to[1] - last_move_from[1]) === -2 * dir) {
                    if (dest[0] == last_move_from[0] && dest[1] == last_move_to[1] + dir) {
                        return true;
                    }
                }
            }
        }
        return false;
    },

    isPawnPath: function(curr, dest) {
        var piece = this.board[curr[0]][curr[1]];
        var dir = (piece.color == 'w' ? 1 : -1);
        if (dest[1] - curr[1] === dir && dest[0] - curr[0] === 0 && this.board[dest[0]][dest[1]] === null) {
            return true;
        } else if (piece.moves === 0 && Math.abs(dest[0] - curr[0]) === 0 && Math.abs(dest[1] - curr[1]) === 2 && this.board[dest[0]][dest[1]] === null) {
            this.enpassantSqr = [curr[0], curr[1]+dir];
            return true;
        } else if (Math.abs(dest[0] - curr[0]) === 1 && dest[1] - curr[1] == dir && this.pieceColorAtLoc(dest) == (this.oppositeColor(piece.color))) {
            return true;
        }
        return false;
    },

    isKingPath: function(curr, dest) {
        if (Math.abs(dest[0] - curr[0]) <= 1 && Math.abs(dest[1] - curr[1]) <= 1) {
            return true;
        } else {
            return false;
        }
    },

    isDiagonalPath: function(curr, dest) {
        if (Math.abs(curr[0] - dest[0]) === Math.abs(curr[1] - dest[1])) {
            return true;
        } else {
            return false;
        }
    },

    isStraightPath: function(curr, dest) {
        for (let i = 0; i <= 1; i++) {
            if (curr[i] === dest[i]) return true;
        }
        return false;
    },

    isKnightPath: function(curr, dest) {
        for (let i = 0; i <= 1; i++) {
            if (Math.abs(curr[i] - dest[i]) === 2 && Math.abs(curr[1-i] - dest[1-i]) === 1) return true;
        }
        return false;
    },

    isLocsInBounds: function(locs) {
        for (let i = 0, n = arguments.length; i < n; i++) {
            var loc = arguments[i];
            for (let j = 0; j <= 1; j++) {
                if (loc[j] < 0 || loc[j] > 7) return false;
            }
        }
        return true;
    },

    pieceColorAtLoc: function(loc) {
        if (!this.board[loc[0]][loc[1]]) {
            return null;
        } else {
            return this.board[loc[0]][loc[1]].color;
        }
    },

    isUnobstructedPath: function(curr, dest) {
        if (this.pieceColorAtLoc(curr) === this.pieceColorAtLoc(dest)) {
            return false;
        } else {
            if (this.isStraightPath(curr, dest)) {
                for (let i = 0; i <= 1; i++) {
                    if (curr[i] === dest[i]) {
                        var path = [];
                        if (curr[1-i] < dest[1-i]) {
                            for (let p = curr[1-i]+1, n = dest[1-i]; p < n; p++) {
                                path.push(p);
                            }
                        } else {
                            for (let p = curr[1-i]-1, n = dest[1-i]; p > n; p--) {
                                path.push(p);
                            }
                        }
                        if (!i) {
                            for (let i = 0, n = path.length; i < n; i++) {
                                if (this.board[curr[0]][path[i]]) return false;
                            }
                        } else {
                            for (let i = 0, n = path.length; i < n; i++) {
                                if (this.board[path[i]][curr[1]]) return false;
                            }
                        }
                    }
                }
                return true;
            } else if (this.isDiagonalPath(curr, dest)) {
                var x_change = dest[0] - curr[0];
                var y_change = dest[1] - curr[1];
                var x_inc = x_change / Math.abs(x_change);
                var y_inc = y_change / Math.abs(y_change);
                var x = curr[0] + x_inc;
                var y = curr[1] + y_inc;
                while (Math.abs(x - dest[0]) > 0 && Math.abs(y - dest[1]) > 0) {
                    if (this.board[x][y]) return false;
                    x += x_inc;
                    y += y_inc;
                }
                return true;
            } else if (this.isKnightPath(curr, dest)) {
                return true;
            }
        }
        return false;
    }
};

function Piece() {
    var blah = 2;
    this.alive = true;
    this.moves = 0;
}

function Rook() {
    this.color = '';
    this.loc = [];
    this.sign = 'R';
}

function Knight() {
    this.color = '';
    this.loc = [];
    this.sign = 'N';
}

function Bishop() {
    this.color = '';
    this.loc = [];
    this.sign = 'B';
}

function Queen() {
    this.color = '';
    this.loc = [];
    this.sign = 'Q';
}

function King() {
    this.color = '';
    this.loc = [];
    this.sign = 'K';
}

function Pawn() {
    this.color = '';
    this.loc = [];
    this.sign = 'P';
}

Rook.prototype = new Piece();
Knight.prototype = new Piece();
Bishop.prototype = new Piece();
Queen.prototype = new Piece();
King.prototype = new Piece();
Pawn.prototype = new Piece();

module.exports = Chess;
