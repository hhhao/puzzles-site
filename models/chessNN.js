var math = require('mathjs');

//weights read from file
//var gw = ..., gb = ...;
//gw, gb, ghw, pw, pb, phw, sw, sb, shw, hb, h2w, h2b
function ChessNN() {
    this.gw = gw;
    this.gb = gb;
    this.ghw = ghw;
    this.pw = pw;
    this.pb = pb;
    this.pw = phw;
    this.sw = sw;
    this.sb = sb;
    this.shw = shw;
    this.hb = hb;
    this.h2w = h2w;
    this.h2b = h2b;
}

ChessNN.prototype = {
    //forward neural net.
    //gfeatures, pfeatures, sfeatures are general, piece, square features
    forward: function(gfeatures, pfeatures, sfeatures) {
        this.gf = gfeatures;
        this.pf = pfeatures;
        this.sf = sfeatures;

        this.gs = math.multiply(this.gw, this.gf) + this.gb;
        this.gh = math.map(this.gs, function(v) {
            return this.relu(v);
        });

        this.ps = math.multiply(this.pw, this.pf) + this.pb;
        this.ph = math.map(this.ps, function(v) {
            return this.relu(v);
        });

        this.ss = math.multiply(this.sw, this.sf) + this.sb;
        this.sh = math.map(this.ss, function(v) {
            return this.relu(v);
        });

        this.hs = math.multiply(this.ghw, this.gh) + math.multiply(this.phw, this.ph) + math.multiply(this.shw, this.sh) + this.hb;
        this.h2 = math.map(this.hs, function(v) {
            return this.relu(v);
        });

        this.h2s = math.multiply(this.h2w, this.h2) + this.h2b;
        this.out = this.tanh(this.h2s);

        return this.out;
    },

    //back propagation
    backprop: function(error) {
        var dout = error < 0 ? -1 : (error > 0 ? 1 : 0);
        var dh2s = dout * this.dtanh(this.h2s);
        var dh2w = dh2s * math.transpose(this.h2);
        var dh2b = dh2s;
        var dh2 = dh2s * math.transpose(this.h2w);
        var dhs = math.map(dh2, function(v, i) {
            if (this.hs[i[0]][i[1]] <= 0) {
                return 0;
            } else {
                return v;
            }
        });
        var dhb = dhs;
        var dghw = math.multiply(dhs, math.transpose(this.gh));
        var dphw = math.multiply(dhs, math.transpose(this.ph));
        var dshw = math.multiply(dhs, math.transpose(this.sh));
        var dgh = math.multiply(math.transpose(this.ghw, dhs));
        var dph = math.multiply(math.transpose(this.phw, dhs));
        var dsh = math.multiply(math.transpose(this.shw, dhs));
        var dgs = math.map(dgh, function(v, i) {
            if (this.gs[i[0]][i[1]] <= 0) {
                return 0;
            } else {
                return v;
            }
        });
        var dps = math.map(dph, function(v, i) {
            if (this.ps[i[0]][i[1]] <= 0) {
                return 0;
            } else {
                return v;
            }
        });
        var dss = math.map(dsh, function(v, i) {
            if (this.ss[i[0]][i[1]] <= 0) {
                return 0;
            } else {
                return v;
            }
        });
        var dgb = dgs;
        var dpb = dps;
        var dsb = dss;
        var dgw = math.multiply(dgs, this.gf);
        var dpw = math.multiply(dps, this.pf);
        var dsw = math.multiply(dss, this.sf);

        //TODO: update weights and biases using AdaDelta
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
    }
};

module.exports = ChessNN;
