/*
 Initializes neural net weight with random values
 DO NOT use on main weights file if trained!
 Will OVERWRITE target file weights
 */

var fs = require('fs');

var GFL = 15;
var PFL = 208;
var SFL = 128;

var GHL = 8;
var PHL = 128;
var SHL = 64;
var H2L = 128;

function randMatrix(rows, cols) {
    var m = new Array(rows);
    for (let r = 0; r < rows; r++) {
        m[r] = new Array(cols);
        for (let c = 0; c < cols; c++) {
            m[r][c] = (Math.random() - 0.5) * Math.sqrt(2/(rows + cols));
        }
    }
    return m;
}

var dataObj = {gw: randMatrix(GHL, GFL),
               gb: randMatrix(GHL, 1),
               ghw: randMatrix(H2L, GHL),
               pw: randMatrix(PHL, PFL),
               pb: randMatrix(PHL, 1),
               phw: randMatrix(H2L, PHL),
               sw: randMatrix(SHL, SFL),
               sb: randMatrix(SHL, 1),
               shw: randMatrix(H2L, SHL),
               hb: randMatrix(H2L, 1),
               h2w: randMatrix(1, H2L),
               h2b: randMatrix(1, 1)
              };

fs.writeFile('./NNWeights.json', JSON.stringify(dataObj), function(err) {
    if (err) {
        console.log(err);
    }
});
