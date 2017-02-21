/*
 Initializes neural net weight with random small values for better first time training
 DO NOT use on main weights file if trained!
 Will OVERWRITE target file weights
 Uncomment the last line to use
 */

var fs = require('fs');

var GFL = 15;
var PFL = 208;
var SFL = 128;

var GHL = 8;
var PHL = 128;
var SHL = 64;
var H2L = 128;

function randMatrix(rows, cols, option) {
    var m = new Array(rows);
    for (let r = 0; r < rows; r++) {
        m[r] = new Array(cols);
        for (let c = 0; c < cols; c++) {
            if (option === 0) {
                m[r][c] = 0;
            } else {
                m[r][c] = (Math.random() - 0.5) * Math.sqrt(2/(rows + cols));
            }
        }
    }
    return m;
}

var dataObj = {gw: randMatrix(GHL, GFL),
               gb: randMatrix(GHL, 1, 0),
               ghw: randMatrix(H2L, GHL),
               pw: randMatrix(PHL, PFL),
               pb: randMatrix(PHL, 1, 0),
               phw: randMatrix(H2L, PHL),
               sw: randMatrix(SHL, SFL),
               sb: randMatrix(SHL, 1, 0),
               shw: randMatrix(H2L, SHL),
               hb: randMatrix(H2L, 1, 0),
               h2w: randMatrix(1, H2L),
               h2b: randMatrix(1, 1, 0)
              };

//Uncommenting the following will destroy existing trained NN in NNWeights.json
//fs.writeFileSync('./NNWeights.json', JSON.stringify(dataObj));
