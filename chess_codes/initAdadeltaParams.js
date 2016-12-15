var fs = require('fs');

var GFL = 15;
var PFL = 208;
var SFL = 128;

var GHL = 8;
var PHL = 128;
var SHL = 64;
var H2L = 128;

function zeros(rows, cols) {
    var m = new Array(rows);
    for (let r = 0; r < rows; r++) {
        m[r] = new Array(cols);
        for (let c = 0; c < cols; c++) {
            m[r][c] = 0;
        }
    }
    return m;
}

var dataObj = {
    gw_Eg2: zeros(GHL, GFL),
    gw_ED2: zeros(GHL, GFL),

    gb_Eg2: zeros(GHL, 1),
    gb_ED2: zeros(GHL, 1),

    ghw_Eg2: zeros(H2L, GHL),
    ghw_ED2: zeros(H2L, GHL),

    pw_Eg2: zeros(PHL, PFL),
    pw_ED2: zeros(PHL, PFL),

    pb_Eg2: zeros(PHL, 1),
    pb_ED2: zeros(PHL, 1),

    phw_Eg2: zeros(H2L, PHL),
    phw_ED2: zeros(H2L, PHL),

    sw_Eg2: zeros(SHL, SFL),
    sw_ED2: zeros(SHL, SFL),

    sb_Eg2: zeros(SHL, 1),
    sb_ED2: zeros(SHL, 1),

    shw_Eg2: zeros(H2L, SHL),
    shw_ED2: zeros(H2L, SHL),

    hb_Eg2: zeros(H2L, 1),
    hb_ED2: zeros(H2L, 1),

    h2w_Eg2: zeros(1, H2L),
    h2w_ED2: zeros(1, H2L),

    h2b_Eg2: zeros(1, 1),
    h2b_ED2: zeros(1, 1)
};

//Uncomment to reset Adadelta params to 0
fs.writeFileSync('./adadelta_params.json', JSON.stringify(dataObj));
