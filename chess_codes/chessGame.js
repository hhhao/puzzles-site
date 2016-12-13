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
        this.pieces[c] = [new Rook(), new Knight(), new Bishop(), new Queen(), new King(), new Bishop(), new Knight(), new Rook(), new Pawn(0), new Pawn(1), new Pawn(2), new Pawn(3), new Pawn(4), new Pawn(5), new Pawn(6), new Pawn(7)];
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
    this.fenCastleRights = [true, true, true, true]; //[white king-side, w queen-side, b king-side, b queen-side]
    this.pieceValues = {K: 1000, Q: 9, R: 5, B: 3, N: 3, P: 1};
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

    gfeatures: function() {
        var gf = [];
        var ind = 0;
        gf[ind++] = [this.current_move_side === 'w' ? 1 : -1];
        for (let i = 0, n = this.fenCastleRights.length; i < n; i++) {
            gf[ind++] = [this.fenCastleRights[i] ? 1 : -1];
        }
        var pOrder = [['Q', 2], ['R', 2], ['B', 2], ['N', 2], ['P', 8]];
        for (let c = 0; c <= 1; c++) {
            var pieces = this.pieces[c];
            for (let ord = 0, ordn = pOrder.length; ord < ordn; ord++) {
                var sign = pOrder[ord][0];
                gf[ind] = [0];
                for (let p = 0, pn = pieces.length; p < pn; p++) {
                    if (pieces[p].sign === sign && pieces[p].alive) {
                        gf[ind][0]++;
                    }
                }
                gf[ind][0] /= pOrder[ord][1];
                ind++;
            }
        }
        return gf;
    },

    normalizedCoord: function(coord) {
        return (coord - 3.5)/3.5;
    },

    attackValue: function(sqr) {
        var attackers = this.pieces[this.colorToIndex(this.oppositeColor(this.current_move_side))];
        var lowest = null, lowestVal = Infinity;
        for (let i = 0, n = attackers.length; i < n; i++) {
            var a = attackers[i];
            if (a.alive &&
                this.isLegalMove(a.sign, a.loc, sqr) &&
                this.pieceValues[a.sign] < lowestVal) {
                lowest = a.sign;
                lowestVal = this.pieceValues[a.sign];
            }
        }
        return 1/lowestVal;
    },

    defendValue: function(sqr) {
        var defenders = this.pieces[this.colorToIndex(this.current_move_side)];
        var lowest = null, lowestVal = Infinity;
        for (let i = 0, n = defenders.length; i < n; i++) {
            var d = defenders[i];
            if (d.alive &&
                this.isLegalMove(d.sign, d.loc, sqr, true) &&
                this.pieceValues[d.sign] < lowestVal) {
                lowest = d.sign;
                lowestVal = this.pieceValues[d.sign];
            }
        }
        return 1/lowestVal;

    },

    calcMobility: function(piece, dir) {
        var steps = 0;
        //max steps in any direction is 7
        for (let i = 1; i < 8; i++) {
            var dest = [piece.loc[0] + i * dir[0], piece.loc[1] + i * dir[1]];
            if (this.isLegalMove(piece.sign, piece.loc, dest)) {
                steps++;
            } else {
                break;
            }
        }
        return steps/7;
    },

    pfeatures: function() {
        var pf = [];
        for (let c = 0; c <= 1; c++) {
            var pieces = this.pieces[c];
            for (let i = 0, n = pieces.length; i < n; i++) {
                var p = pieces[i];
                pf.push([p.alive ? 1 : -1]);
                pf.push([this.normalizedCoord(p.loc[0])]);
                pf.push([this.normalizedCoord(p.loc[1])]);
                pf.push([this.attackValue(p.loc)]);
                pf.push([this.defendValue(p.loc)]);
                if (p.sign === 'Q' || p.sign === 'R' || p.sign === 'B') {
                    for (let dx = -1; dx <= 1; dx++) {
                        for (let dy = -1; dy <= 1; dy++) {
                            if (p.sign === 'Q' && (dx || dy)) {
                                pf.push([this.calcMobility(p, [dx, dy])]);
                            } else if (p.sign === 'R' && (!dx || !dy) && (dx || dy)) {
                                pf.push([this.calcMobility(p, [dx, dy])]);
                            } else if (p.sign === 'B' && dx && dy) {
                                pf.push([this.calcMobility(p, [dx, dy])]);
                            }
                        }
                    }
                }
            }
        }
        return pf;
    },

    sfeatures: function() {
        var sf = [];
        for (let x = 0; x < 8; x++) {
            for (let y = 0; y < 8; y++) {
                sf.push([this.attackValue([x, y])]);
                sf.push([this.defendValue([x, y])]);
            }
        }
        return sf;
    },

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
        var castleXLocs = [7, 0];
        var castleYLocs = [0, 7];
        var castleRightsStr = 'KQkq';
        for (let colorIndex = 0; colorIndex <= 1; colorIndex++) {
            for (let castleSide = 0; castleSide <= 1; castleSide++) {
                var castleRightsInd = castleSide + colorIndex * 2;
                var castlePiece = this.board[castleXLocs[castleSide]][castleYLocs[colorIndex]];
                if (this.fenCastleRights[castleRightsInd] &&
                    this.pieces[colorIndex][4].moves === 0 &&
                    castlePiece &&
                    castlePiece.sign === 'R' &&
                    castlePiece.moves === 0) {
                    fen += castleRightsStr[castleRightsInd];
                    canCastle = true;
                }
            }
        }

        fen += canCastle ? ' ' : '- ';
        fen += this.convPosToStr(this.enpassantSqr);

        return fen;
    },

    fenToBoard: function(fen) {
        //Take pieces off board (nullify squares and turn pieces dead)
        for (let x = 0; x < 8; x++) {
            for (let y = 0; y < 8; y++) {
                this.board[x][y] = null;
            }
        }
        for (let c = 0; c <= 1; c++) {
            for (let pw = 0, m = this.promoted_pieces[c].length; pw < m; pw++) {
                var pawn = this.promoted_pieces[c][pw];
                this.pieces[c][8 + pawn.rank] = pawn;
            }
            for (let p = 0, n = this.pieces[c].length; p < n; p++) {
                this.pieces[c][p].alive = false;
                this.pieces[c][p].moves = 0;
            }
        }
        this.history = [];
        this.hist_index = 0;
        this.promoted_pieces = [[], []];
        this.dead_pieces = [[], []];

        var piecesKeys = {r: 'bR', R: 'wR',
                          n: 'bN', N: 'wN',
                          b: 'bB', B: 'wB',
                          q: 'bQ', Q: 'wQ',
                          k: 'bK', K: 'wK',
                          p: 'bP', P: 'wP'
                         };

        //Get fen array and arrange pieces
        var fenArray = fen.split(' ');
        fenArray[0] = fenArray[0].split('/');
        for (let i = 0; i < 8; i++) {
            var y = 7 - i;
            var x = 0;
            for (let j = 0, m = fenArray[0][i].length; j < m; j++) {
                var char = fenArray[0][i][j];
                var num = parseInt(char);
                if (num) {
                    x += num-1;
                } else {
                    var pieceVal = piecesKeys[char];
                    var pieces = this.pieces[this.colorToIndex(pieceVal[0])];
                    for (let p = 0, pn = pieces.length; p < pn; p++) {
                        if (pieces[p].sign === pieceVal[1] && !pieces[p].alive) {
                            pieces[p].loc = [x, y];
                            pieces[p].alive = true;
                            this.board[x][y] = pieces[p];
                            break;
                        }
                    }
                }
                x++;
            }
        }
        //set move side
        this.current_move_side = fenArray[1];
        //set castling rights
        var castleStr = fenArray[2];
        var FCRKeys = ['K', 'Q', 'k', 'q'];
        for (let f = 0, fn = this.fenCastleRights.length; f < fn; f++) {
            if (castleStr.indexOf(FCRKeys[f]) !== -1) {
                this.fenCastleRights[f] = true;
            } else {
                this.fenCastleRights[f] = false;
            }
        }
    },

    availableMoves: function() {
        var moves = [];
        var movingSidePieces = this.pieces[this.colorToIndex(this.current_move_side)];
        for (let p = 0, n = movingSidePieces.length; p < n; p++) {
            var piece = movingSidePieces[p];
            if (piece.alive) {
                var from = [piece.loc[0], piece.loc[1]], to = [];
                for (let x = 0; x < 8; x++) {
                    to[0] = x;
                    for (let y = 0; y < 8; y++) {
                        to[1] = y;
                        if (piece.sign === 'P' && this.isPromotionPath(from, to)) {
                            var choices = 'qrbn';
                            for (let i = 0; i < 4; i++) {
                                if (this.move(from, to, choices[i])) {
                                    moves.push([[from[0], from[1]], [to[0], to[1]], choices[i]]);
                                    this.backOneMove('d');
                                }
                            }
                        } else if (this.move(from, to, null)) {
                            moves.push([[from[0], from[1]], [to[0], to[1]], null]);
                            this.backOneMove('d');
                        }
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
            /*TODO promo = prompt("Piece to promote your pawn to? ([q]ueen/[r]ook/k[n]ight/[b]ishop)");
            while (promo !== 'q' && promo !== 'r' && promo !== 'n' && promo !== 'b') {
                promo = prompt("Please enter a valid choice: ([q]ueen/[r]ook/k[n]ight/[b]ishop)");

            }
             */
        } else {
            promo = option;
        }
        var promote_to;
        if (promo === 'q') {
            promote_to = new Queen();
        } else if (promo === 'r') {
            promote_to = new Rook();
        } else if (promo === 'n') {
            promote_to = new Knight();
        } else if (promo === 'b') {
            promote_to = new Bishop();
        }
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
                    this.history[this.hist_index][4] = true;
                }
                if (m === 'promotion') {
                    var promo_array = this.promote(piece, option);
                    piece = promo_array[0];
                    this.history[this.hist_index][3] = promo_array[1];
                } else if (m === 'en_passant') {
                    this.history[this.hist_index][4] = true;
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
                    this.backOneMove('d');
                    return false;
                }
                //console.log(this.boardToFen());
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

    isCheckmate: function() {
        if (this.isInCheck(this.current_move_side)) {
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
            return true;
        }
        return false;
    },

    isLegalMove: function(psign, curr, dest, noDestPiece) {
        var eps = this.enpassantSqr;
        this.enpassantSqr = null;
        if (this.isLocsInBounds(curr, dest) && this.isUnobstructedPath(curr, dest, noDestPiece)) {
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
        if (!pawn) return false;
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
        if (!piece) return false;
        if (piece.sign === 'K' && piece.moves === 0 && dest[1] === curr[1]) {
            var colorInd = this.colorToIndex(piece.color);
            var queen_rook = this.board[0][curr[1]]; //this.pieces[colorInd][0];
            var king_rook = this.board[7][curr[1]]; //this.pieces[colorInd][7];
            if (dest[0] - curr[0] === -2 && this.fenCastleRights[1+2*colorInd] && queen_rook && queen_rook.moves === 0 && this.isUnobstructedPath(curr, [queen_rook.loc[0]+1, queen_rook.loc[1]])) {
                for (let i = curr[0], n = curr[0]-2; i >= n; i--) {
                    if (this.isLocUnderAttack([i, curr[1]], piece.color)) return false;
                }
                return true;
            } else if (dest[0] - curr[0] === 2 && this.fenCastleRights[0+2*colorInd] && king_rook && king_rook.moves === 0 && this.isUnobstructedPath(curr, [king_rook.loc[0]-1, king_rook.loc[1]])) {
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
        if (!piece) return false;
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
        if (!piece) return false;
        var dir = (piece.color === 'w' ? 1 : -1);
        var startYPos = piece.color === 'w' ? 1 : 6;
        if (dest[1] - curr[1] === dir && dest[0] - curr[0] === 0 && this.board[dest[0]][dest[1]] === null) {
            return true;
        } else if (curr[1] === startYPos && Math.abs(dest[0] - curr[0]) === 0 && Math.abs(dest[1] - curr[1]) === 2 && this.board[dest[0]][dest[1]] === null) {
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
        var piece = this.board[loc[0]][loc[1]];
        if (!piece) {
            return null;
        } else {
            return piece.color;
        }
    },

    isUnobstructedPath: function(curr, dest, noDestPiece) {
        if (!noDestPiece && this.pieceColorAtLoc(curr) === this.pieceColorAtLoc(dest)) {
            return false;
        }
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
                    if (i === 0) {
                        for (let k = 0, n = path.length; k < n; k++) {
                            if (this.board[curr[0]][path[k]]) return false;
                        }
                    } else {
                        for (let k = 0, n = path.length; k < n; k++) {
                            if (this.board[path[k]][curr[1]]) return false;
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
        return false;
    }
};

function Piece(color, loc) {
    this.alive = true;
    this.moves = 0;
    this.color = color;
    this.loc = loc;
}

function Rook() {
    this.sign = 'R';
}

function Knight() {
    this.sign = 'N';
}

function Bishop() {
    this.sign = 'B';
}

function Queen() {
    this.sign = 'Q';
}

function King() {
    this.sign = 'K';
}

function Pawn(rank) {
    this.sign = 'P';
    this.rank = rank;
}

Rook.prototype = new Piece();
Knight.prototype = new Piece();
Bishop.prototype = new Piece();
Queen.prototype = new Piece();
King.prototype = new Piece();
Pawn.prototype = new Piece();

module.exports = Chess;
