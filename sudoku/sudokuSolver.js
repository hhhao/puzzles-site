function sudoku(puzzle) {
    function init(pz) {
        var newP = [];
        for (var r = 0; r < 9; r++) {
            newP[r] = [];
            for (var c = 0; c < 9; c++) {
                if (pz[r][c]) {
                    newP[r][c] = pz[r][c].toString();
                } else {
                    newP[r][c] = '';
                    for (var d = 1; d <= 9; d++) {
                        var nonConflict = true;
                        for (var col = 0; col < 9; col++) {
                            if (pz[r][col] === d) {
                                nonConflict = false;
                                break;
                            }
                        }
                        if (nonConflict) {
                            for (var row = 0; row < 9; row++) {
                                if (pz[row][c] === d) {
                                    nonConflict = false;
                                    break;
                                }
                            }
                        }
                        if (nonConflict) {
                            for (var qr = 3 * Math.floor(r/3), qrn = qr + 3; qr < qrn; qr++) {
                                for (var qc = 3 * Math.floor(c/3), qcn = qc + 3; qc < qcn; qc++) {
                                    if ((r != qr || c != qc) && pz[qr][qc] === d) {
                                        nonConflict = false;
                                        break;
                                    }
                                }
                            }
                        }
                        if (nonConflict) newP[r][c] += d;
                    }
                }
            }
        }
        return newP;
    }
    function findMostRestrictedSquare(p) {
        var MRSloc = [], MRlen = 10;
        for (var r = 0; r < 9; r++) {
            for (var c = 0; c < 9; c++) {
                if (p[r][c].length > 1 && p[r][c].length < MRlen) {
                    MRlen = p[r][c].length;
                    MRSloc = [r, c];
                    if (MRlen == 2) return MRSloc;
                }
            }
        }
        return MRSloc;
    }
    function copyPuzzle(p) {
        var newP = [];
        for (var row  = 0; row < 9; row++) {
            newP[row] = [];
            for (var col = 0; col < 9; col++) {
                newP[row][col] = p[row][col];
            }
        }
        return newP;
    }
    function propagateRestraints(coord, p) {
        var dupIndex;
        for (var col = 0; col < 9; col++) {
            if (col != coord[1] && (dupIndex = p[coord[0]][col].indexOf(p[coord[0]][coord[1]])) != -1) {
                if (p[coord[0]][col].length <= 1) return false;
                p[coord[0]][col] = p[coord[0]][col].replace(p[coord[0]][coord[1]], '');
                if (p[coord[0]][col].length == 1 && !propagateRestraints([coord[0], col], p)) return false;
            }
        }
        for (var row = 0; row < 9; row++) {
            if (row != coord[0] && (dupIndex = p[row][coord[1]].indexOf(p[coord[0]][coord[1]])) != -1) {
                if (p[row][coord[1]].length <= 1) return false;
                p[row][coord[1]] = p[row][coord[1]].replace(p[coord[0]][coord[1]], '');
                if (p[row][coord[1]].length == 1 && !propagateRestraints([row, coord[1]], p)) return false;
            }
        }
        for (var qr = 3 * Math.floor(coord[0]/3), qrn = qr + 3; qr < qrn; qr++) {
            for (var qc = 3 * Math.floor(coord[1]/3), qcn = qc + 3; qc < qcn; qc++) {
                if ((qr != coord[0] || qc != coord[1]) && (dupIndex = p[qr][qc].indexOf(p[coord[0]][coord[1]])) != -1) {
                    if (p[qr][qc].length <= 1) return false;
                    p[qr][qc] = p[qr][qc].replace(p[coord[0]][coord[1]], '');
                    if (p[qr][qc].length == 1 && !propagateRestraints([qr, qc], p)) return false;
                }
            }
        }
        return true;
    }
    function convToNums(p) {
        for (var r = 0; r < 9; r++) {
            for (var c = 0; c < 9; c++) {
                p[r][c] = parseInt(p[r][c]);
            }
        }
        return p;
    }
    function sudokuRecursive(p) {
        var mrs = findMostRestrictedSquare(p);
        if (!mrs.length) return convToNums(p);
        var r = mrs[0], c = mrs[1];
        for (var k = 0; k < p[r][c].length; k++) {
            var pCopy = copyPuzzle(p);
            pCopy[r][c] = p[r][c][k];
            if (propagateRestraints([r, c], pCopy)) {
                var prevResult = sudokuRecursive(pCopy);
                if (prevResult) return prevResult;
            }
        }
        return false;
    }
    return sudokuRecursive(init(puzzle));
}

/*
var puzzle = [
    [5,3,0,0,7,0,0,0,0],
    [6,0,0,1,9,5,0,0,0],
    [0,9,8,0,0,0,0,6,0],
    [8,0,0,0,6,0,0,0,3],
    [4,0,0,8,0,3,0,0,1],
    [7,0,0,0,2,0,0,0,6],
    [0,6,0,0,0,0,2,8,0],
    [0,0,0,4,1,9,0,0,5],
    [0,0,0,0,8,0,0,7,9]];

console.log(sudoku(puzzle));
 */
/* Should return
 [[5,3,4,6,7,8,9,1,2],
 [6,7,2,1,9,5,3,4,8],
 [1,9,8,3,4,2,5,6,7],
 [8,5,9,7,6,1,4,2,3],
 [4,2,6,8,5,3,7,9,1],
 [7,1,3,9,2,4,8,5,6],
 [9,6,1,5,3,7,2,8,4],
 [2,8,7,4,1,9,6,3,5],
 [3,4,5,2,8,6,1,7,9]] */

/*
puzzle = [
    [0,0,0,5,0,6,0,0,0],
    [3,1,4,0,0,0,5,6,0],
    [6,5,0,4,0,3,0,0,0],
    [0,2,0,0,0,7,0,0,0],
    [4,0,0,6,0,5,0,0,7],
    [0,0,0,3,0,0,0,2,0],
    [0,0,0,8,0,2,0,7,9],
    [0,7,2,0,0,0,3,1,5],
    [0,0,0,7,0,1,0,0,0]];

console.log(sudoku(puzzle));
 */
/* Should return
 [[2,9,8,5,1,6,7,4,3],
 [3,1,4,2,7,9,5,6,8],
 [6,5,7,4,8,3,2,9,1],
 [9,2,3,1,4,7,8,5,6],
 [4,8,1,6,2,5,9,3,7],
 [7,6,5,3,9,8,1,2,4],
 [1,3,6,8,5,2,4,7,9],
 [8,7,2,9,6,4,3,1,5],
 [5,4,9,7,3,1,6,8,2]] */

puzzle = [ [ 0, 0, 8, 0, 3, 0, 5, 4, 0 ],
           [ 3, 0, 0, 4, 0, 7, 9, 0, 0 ],
           [ 4, 1, 0, 0, 0, 8, 0, 0, 2 ],
           [ 0, 4, 3, 5, 0, 2, 0, 6, 0 ],
           [ 5, 0, 0, 0, 0, 0, 0, 0, 8 ],
           [ 0, 6, 0, 3, 0, 9, 4, 1, 0 ],
           [ 1, 0, 0, 8, 0, 0, 0, 2, 7 ],
           [ 0, 0, 5, 6, 0, 3, 0, 0, 4 ],
           [ 0, 2, 9, 0, 7, 0, 8, 0, 0 ] ];

console.log(sudoku(puzzle));


puzzle = [[9, 0, 0, 0, 8, 0, 0, 0, 1],
           [0, 0, 0, 4, 0, 6, 0, 0, 0],
           [0, 0, 5, 0, 7, 0, 3, 0, 0],
           [0, 6, 0, 0, 0, 0, 0, 4, 0],
           [4, 0, 1, 0, 6, 0, 5, 0, 8],
           [0, 9, 0, 0, 0, 0, 0, 2, 0],
           [0, 0, 7, 0, 3, 0, 2, 0, 0],
           [0, 0, 0, 7, 0, 5, 0, 0, 0],
          [1, 0, 0, 0, 4, 0, 0, 0, 7]];

console.log(sudoku(puzzle));
