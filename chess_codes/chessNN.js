/*
 Chess Deep Neural Network
*/

var math = require('mathjs');
var fs = require("fs");

//weights read from file
//gw, gb, ghw, pw, pb, phw, sw, sb, shw, hb, h2w, h2b
var weights = JSON.parse(fs.readFileSync(__dirname + "/NNWeights.json"));
var adadeltaParams = JSON.parse(fs.readFileSync(__dirname + "/adadelta_params.json"));
var decayRate = 0.95; //Decay rate constant for AdaDelta
var eps = 0.000001; //Conditioning constant for AdaDelta


/*
 Notes on neural network internals variable names:
 g, p, s stand for general, positional, and squares respectively
 w, b stand for weight, bias respectively
 Eg2 and ED2 are root mean squares for gradient and change in AdaDelta, respectively
 h denotes 1st hidden layer, h2 denotes 2nd hidden layer

 Graphical representation of the NN architecture will be available on GitHub
 */
function ChessNN() {
    this.gw = weights.gw;
    this.gw_Eg2 = adadeltaParams.gw_Eg2;
    this.gw_ED2 = adadeltaParams.gw_ED2;

    this.gb = weights.gb;
    this.gb_Eg2 = adadeltaParams.gb_Eg2;
    this.gb_ED2 = adadeltaParams.gb_ED2;

    this.ghw = weights.ghw;
    this.ghw_Eg2 = adadeltaParams.ghw_Eg2;
    this.ghw_ED2 = adadeltaParams.ghw_ED2;

    this.pw = weights.pw;
    this.pw_Eg2 = adadeltaParams.pw_Eg2;
    this.pw_ED2 = adadeltaParams.pw_ED2;

    this.pb = weights.pb;
    this.pb_Eg2 = adadeltaParams.pb_Eg2;
    this.pb_ED2 = adadeltaParams.pb_ED2;

    this.phw = weights.phw;
    this.phw_Eg2 = adadeltaParams.phw_Eg2;
    this.phw_ED2 = adadeltaParams.phw_ED2;

    this.sw = weights.sw;
    this.sw_Eg2 = adadeltaParams.sw_Eg2;
    this.sw_ED2 = adadeltaParams.sw_ED2;

    this.sb = weights.sb;
    this.sb_Eg2 = adadeltaParams.sb_Eg2;
    this.sb_ED2 = adadeltaParams.sb_ED2;

    this.shw = weights.shw;
    this.shw_Eg2 = adadeltaParams.shw_Eg2;
    this.shw_ED2 = adadeltaParams.shw_ED2;

    this.hb = weights.hb;
    this.hb_Eg2 = adadeltaParams.hb_Eg2;
    this.hb_ED2 = adadeltaParams.hb_ED2;

    this.h2w = weights.h2w;
    this.h2w_Eg2 = adadeltaParams.h2w_Eg2;
    this.h2w_ED2 = adadeltaParams.h2w_ED2;

    this.h2b = weights.h2b;
    this.h2b_Eg2 = adadeltaParams.h2b_Eg2;
    this.h2b_ED2 = adadeltaParams.h2b_ED2;

}

ChessNN.prototype = {
    //forward neural net.
    //gfeatures, pfeatures, sfeatures are general, piece, square features
    forward: function(gfeatures, pfeatures, sfeatures) {
        this.gf = gfeatures;
        this.pf = pfeatures;
        this.sf = sfeatures;

        this.gs = math.add(math.multiply(this.gw, this.gf), this.gb);
        this.gh = math.map(this.gs, function(v) {
            return this.relu(v);
        }.bind(this));

        this.ps = math.add(math.multiply(this.pw, this.pf), this.pb);
        this.ph = math.map(this.ps, function(v) {
            return this.relu(v);
        }.bind(this));

        this.ss = math.add(math.multiply(this.sw, this.sf), this.sb);
        this.sh = math.map(this.ss, function(v) {
            return this.relu(v);
        }.bind(this));

        this.hs = math.add(math.add(math.multiply(this.ghw, this.gh), math.multiply(this.phw, this.ph)), math.add(math.multiply(this.shw, this.sh), this.hb));
        this.h2 = math.map(this.hs, function(v) {
            return this.relu(v);
        }.bind(this));

        this.h2s = math.add(math.multiply(this.h2w, this.h2), this.h2b);
        this.out = this.tanh(this.h2s[0][0]);

        return this.out;
    },

    //back propagation
    backprop: function(error) {
        var dout = error; //L2 loss, for L1 use error < 0 ? -1 : (error > 0 ? 1 : 0);
        var dh2s = dout * this.dtanh(this.h2s[0][0]);
        var dh2w = math.multiply(dh2s, math.transpose(this.h2));
        var dh2b = [[dh2s]];
        var dh2 = math.multiply(dh2s, math.transpose(this.h2w));
        var dhs = math.map(dh2, function(v, i) {
            if (this.hs[i[0]][i[1]] <= 0) {
                return 0;
            } else {
                return v;
            }
        }.bind(this));
        var dhb = dhs;
        var dghw = math.multiply(dhs, math.transpose(this.gh));
        var dphw = math.multiply(dhs, math.transpose(this.ph));
        var dshw = math.multiply(dhs, math.transpose(this.sh));
        var dgh = math.multiply(math.transpose(this.ghw), dhs);
        var dph = math.multiply(math.transpose(this.phw), dhs);
        var dsh = math.multiply(math.transpose(this.shw), dhs);
        var dgs = math.map(dgh, function(v, i) {
            if (this.gs[i[0]][i[1]] <= 0) {
                return 0;
            } else {
                return v;
            }
        }.bind(this));
        var dps = math.map(dph, function(v, i) {
            if (this.ps[i[0]][i[1]] <= 0) {
                return 0;
            } else {
                return v;
            }
        }.bind(this));
        var dss = math.map(dsh, function(v, i) {
            if (this.ss[i[0]][i[1]] <= 0) {
                return 0;
            } else {
                return v;
            }
        }.bind(this));
        var dgb = dgs;
        var dpb = dps;
        var dsb = dss;
        var dgw = math.multiply(dgs, math.transpose(this.gf));
        var dpw = math.multiply(dps, math.transpose(this.pf));
        var dsw = math.multiply(dss, math.transpose(this.sf));

        //update weights and biases using AdaDelta
        adadeltaUpdate(this.gw, this.gw_Eg2, this.gw_ED2, dgw);
        adadeltaUpdate(this.gb, this.gb_Eg2, this.gb_ED2, dgb);
        adadeltaUpdate(this.ghw, this.ghw_Eg2, this.ghw_ED2, dghw);
        adadeltaUpdate(this.pw, this.pw_Eg2, this.pw_ED2, dpw);
        adadeltaUpdate(this.pb, this.pb_Eg2, this.pb_ED2, dpb);
        adadeltaUpdate(this.phw, this.phw_Eg2, this.phw_ED2, dphw);
        adadeltaUpdate(this.sw, this.sw_Eg2, this.sw_ED2, dsw);
        adadeltaUpdate(this.sb, this.sb_Eg2, this.sb_ED2, dsb);
        adadeltaUpdate(this.shw, this.shw_Eg2, this.shw_ED2, dshw);
        adadeltaUpdate(this.hb, this.hb_Eg2, this.hb_ED2, dhb);
        adadeltaUpdate(this.h2w, this.h2w_Eg2, this.h2w_ED2, dh2w);
        adadeltaUpdate(this.h2b, this.h2b_Eg2, this.h2b_ED2, dh2b);
    },

    //Rectified Linear Unit as activation
    relu: function(x) {
        return Math.max(0, x);
    },

    //ReLU derivative
    drelu: function(x) {
        if (x > 0) {
            return 1;
        } else {
            return 0;
        }
    },

    //Tanh activation unit for final output
    tanh: function(x) {
        return Math.tanh(x);
    },

    //tanh derivative
    dtanh: function(x) {
        return 1 - Math.pow(Math.tanh(x), 2);
    },

    writeAdadeltaParamsJSON: function() {
        var dataObj = {gw_Eg2: this.gw_Eg2,
                       gw_ED2: this.gw_ED2,
                       gb_Eg2: this.gb_Eg2,
                       gb_ED2: this.gb_ED2,
                       ghw_Eg2: this.ghw_Eg2,
                       ghw_ED2: this.ghw_ED2,
                       pw_Eg2: this.pw_Eg2,
                       pw_ED2: this.pw_ED2,
                       pb_Eg2: this.pb_Eg2,
                       pb_ED2: this.pb_ED2,
                       phw_Eg2: this.phw_Eg2,
                       phw_ED2: this.phw_ED2,
                       sw_Eg2: this.sw_Eg2,
                       sw_ED2: this.sw_ED2,
                       sb_Eg2: this.sb_Eg2,
                       sb_ED2: this.sb_ED2,
                       shw_Eg2: this.shw_Eg2,
                       shw_ED2: this.shw_ED2,
                       hb_Eg2: this.hb_Eg2,
                       hb_ED2: this.hb_ED2,
                       h2w_Eg2: this.h2w_Eg2,
                       h2w_ED2: this.h2w_ED2,
                       h2b_Eg2: this.h2b_Eg2,
                       h2b_ED2: this.h2b_ED2
                      };

        fs.writeFileSync(__dirname + "/adadelta_params.json", JSON.stringify(dataObj));
    },

    writeWeightsJSON: function() {
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

        console.log('write weights, gb: ', dataObj.gb);
        fs.writeFileSync(__dirname + "/NNWeights.json", JSON.stringify(dataObj));

    }
};

function adadeltaUpdate(w, w_Eg2, w_ED2, dw) {
    for (let i = 0, rows = w.length; i < rows; i++) {
        for (let j = 0, cols = w[0].length; j < cols; j++) {
            w_Eg2[i][j] = decayRate * w_Eg2[i][j] + (1 - decayRate) * (dw[i][j] * dw[i][j]);
            var D = -1 * (Math.sqrt(w_ED2[i][j] + eps) / Math.sqrt(w_Eg2[i][j] + eps)) * dw[i][j];

            w_ED2[i][j] = decayRate * w_ED2[i][j] + (1 - decayRate) * (D * D);
            w[i][j] += D;
        }
    }
}

module.exports = ChessNN;
