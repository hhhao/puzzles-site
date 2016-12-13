/*
 Initializes neural net weight with random values
 DO NOT use on main weights file if trained!
 Will OVERWRITE target file weights
 */

var math = require('mathjs');
var fs = require('fs');

function randMatrix(rows, cols) {
    var m = new Array(rows);
    for (let r = 0; r < rows; r++) {
        m[r] = new Array(cols);
        for (let c = 0; c < cols; c++) {
            m[r][c] = Math.random() * 2 - 1;
        }
    }
    return m
}

var gw = randMatrix(8, 15);

/*
var dataObj = {gw: this.gw,
               gb: this.gb,
               ghw: this.ghw,
               pw: this.pw,
               pb: this.pb,
               phw: this.phw,
               sw: this.sw,
               sb: this.sb,
               shw: this.shw,
               hb: this.hb,
               h2w: this.h2w,
               h2b: this.h2b
              };
fs.writeFile(fileName, JSON.stringify(dataObj), function(err) {
    if (err) {
        console.log(err);
    }
});
*/
