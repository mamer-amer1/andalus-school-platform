/* AndSwiss — محرك التوزيع السويسري لمنصة شطرنج الأندلس.
   التزاوج الأمثل: خوارزمية Edmonds Blossom (MIT) — Joris van Rantwijk، نقلها إلى JS Matt Krick. */
(function (root) {
"use strict";
/*Converted to JS from Python by Matt Krick. Original: http://jorisvr.nl/maximummatching.html*/

var b;
var path;
var v;
var blossom = function (edges, maxCardinality) {
  if (edges.length === 0) {
    return edges;
  }
  var edmonds = new Edmonds(edges, maxCardinality);
  return edmonds.maxWeightMatching();

};

var Edmonds = function (edges, maxCardinality) {
  this.edges = edges;
  this.maxCardinality = maxCardinality;
  this.nEdge = edges.length;
  this.init();
};

Edmonds.prototype.maxWeightMatching = function () {
  for (var t = 0; t < this.nVertex; t++) {
    //console.log('DEBUG: STAGE ' + t);
    this.label = filledArray(2 * this.nVertex, 0);
    this.bestEdge = filledArray(2 * this.nVertex, -1);
    this.blossomBestEdges = initArrArr(2 * this.nVertex);
    this.allowEdge = filledArray(this.nEdge, false);
    this.queue = [];
    for (var v = 0; v < this.nVertex; v++) {
      if (this.mate[v] === -1 && this.label[this.inBlossom[v]] === 0) {
        this.assignLabel(v, 1, -1);
      }
    }
    var augmented = false;
    while (true) {
      //console.log('DEBUG: SUBSTAGE');
      while (this.queue.length > 0 && !augmented) {
        v = this.queue.pop();
        //console.log('DEBUG: POP ', 'v=' + v);
        //console.assert(this.label[this.inBlossom[v]] == 1);
        for (var ii = 0; ii < this.neighbend[v].length; ii++) {
          var p = this.neighbend[v][ii];
          var k = ~~(p / 2);
          var w = this.endpoint[p];
          if (this.inBlossom[v] === this.inBlossom[w]) continue;
          if (!this.allowEdge[k]) {
            var kSlack = this.slack(k);
            if (kSlack <= 0) {
              this.allowEdge[k] = true;
            }
          }
          if (this.allowEdge[k]) {
            if (this.label[this.inBlossom[w]] === 0) {
              this.assignLabel(w, 2, p ^ 1);
            } else if (this.label[this.inBlossom[w]] === 1) {
              var base = this.scanBlossom(v, w);
              if (base >= 0) {
                this.addBlossom(base, k);
              } else {
                this.augmentMatching(k);
                augmented = true;
                break;
              }
            } else if (this.label[w] === 0) {
              //console.assert(this.label[this.inBlossom[w]] === 2);
              this.label[w] = 2;
              this.labelEnd[w] = p ^ 1;
            }
          } else if (this.label[this.inBlossom[w]] === 1) {
            var b = this.inBlossom[v];
            if (this.bestEdge[b] === -1 || kSlack < this.slack(this.bestEdge[b])) {
              this.bestEdge[b] = k;
            }
          } else if (this.label[w] === 0) {
            if (this.bestEdge[w] === -1 || kSlack < this.slack(this.bestEdge[w])) {
              this.bestEdge[w] = k;
            }
          }
        }
      }
      if (augmented) break;
      var deltaType = -1;
      var delta = [];
      var deltaEdge = [];
      var deltaBlossom = [];
      if (!this.maxCardinality) {
        deltaType = 1;
        delta = getMin(this.dualVar, 0, this.nVertex - 1);
      }
      for (v = 0; v < this.nVertex; v++) {
        if (this.label[this.inBlossom[v]] === 0 && this.bestEdge[v] !== -1) {
          var d = this.slack(this.bestEdge[v]);
          if (deltaType === -1 || d < delta) {
            delta = d;
            deltaType = 2;
            deltaEdge = this.bestEdge[v];
          }
        }
      }
      for (b = 0; b < 2 * this.nVertex; b++) {
        if (this.blossomParent[b] === -1 && this.label[b] === 1 && this.bestEdge[b] !== -1) {
          kSlack = this.slack(this.bestEdge[b]);
          ////console.assert((kSlack % 2) == 0);
          d = kSlack / 2;
          if (deltaType === -1 || d < delta) {
            delta = d;
            deltaType = 3;
            deltaEdge = this.bestEdge[b];
          }
        }
      }
      for (b = this.nVertex; b < this.nVertex * 2; b++) {
        if (this.blossomBase[b] >= 0 && this.blossomParent[b] === -1 && this.label[b] === 2 && (deltaType === -1 || this.dualVar[b] < delta)) {
          delta = this.dualVar[b];
          deltaType = 4;
          deltaBlossom = b;
        }
      }
      if (deltaType === -1) {
        //console.assert(this.maxCardinality);
        deltaType = 1;
        delta = Math.max(0, getMin(this.dualVar, 0, this.nVertex - 1));
      }
      for (v = 0; v < this.nVertex; v++) {
        var curLabel = this.label[this.inBlossom[v]];
        if (curLabel === 1) {
          this.dualVar[v] -= delta;
        } else if (curLabel === 2) {
          this.dualVar[v] += delta;
        }
      }
      for (b = this.nVertex; b < this.nVertex * 2; b++) {
        if (this.blossomBase[b] >= 0 && this.blossomParent[b] === -1) {
          if (this.label[b] === 1) {
            this.dualVar[b] += delta;
          } else if (this.label[b] === 2) {
            this.dualVar[b] -= delta;
          }
        }
      }
      //console.log('DEBUG: deltaType', deltaType, ' delta: ', delta);
      if (deltaType === 1) {
        break;
      } else if (deltaType === 2) {
        this.allowEdge[deltaEdge] = true;
        var i = this.edges[deltaEdge][0];
        var j = this.edges[deltaEdge][1];
        var wt = this.edges[deltaEdge][2];
        if (this.label[this.inBlossom[i]] === 0) {
          i = i ^ j;
          j = j ^ i;
          i = i ^ j;
        }
        //console.assert(this.label[this.inBlossom[i]] == 1);
        this.queue.push(i);
      } else if (deltaType === 3) {
        this.allowEdge[deltaEdge] = true;
        i = this.edges[deltaEdge][0];
        j = this.edges[deltaEdge][1];
        wt = this.edges[deltaEdge][2];
        //console.assert(this.label[this.inBlossom[i]] == 1);
        this.queue.push(i);
      } else if (deltaType === 4) {
        this.expandBlossom(deltaBlossom, false);
      }
    }
    if (!augmented) break;
    for (b = this.nVertex; b < this.nVertex * 2; b++) {
      if (this.blossomParent[b] === -1 && this.blossomBase[b] >= 0 && this.label[b] === 1 && this.dualVar[b] === 0) {
        this.expandBlossom(b, true);
      }
    }
  }
  for (v = 0; v < this.nVertex; v++) {
    if (this.mate[v] >= 0) {
      this.mate[v] = this.endpoint[this.mate[v]];
    }
  }
  for (v = 0; v < this.nVertex; v++) {
    //console.assert(this.mate[v] == -1 || this.mate[this.mate[v]] == v);
  }
  return this.mate;
};

Edmonds.prototype.slack = function (k) {
  var i = this.edges[k][0];
  var j = this.edges[k][1];
  var wt = this.edges[k][2];
  return this.dualVar[i] + this.dualVar[j] - 2 * wt;
};

Edmonds.prototype.blossomLeaves = function (b) {
  if (b < this.nVertex) {
    return [b];
  }
  var leaves = [];
  var childList = this.blossomChilds[b];
  for (var t = 0; t < childList.length; t++) {
    if (childList[t] <= this.nVertex) {
      leaves.push(childList[t]);
    } else {
      var leafList = this.blossomLeaves(childList[t]);
      for (var v = 0; v < leafList.length; v++) {
        leaves.push(leafList[v]);
      }
    }
  }
  return leaves;
};

Edmonds.prototype.assignLabel = function (w, t, p) {
  //console.log('DEBUG: assignLabel(' + w + ',' + t + ',' + p + '}');
  var b = this.inBlossom[w];
  //console.assert(this.label[w] === 0 && this.label[b] === 0);
  this.label[w] = this.label[b] = t;
  this.labelEnd[w] = this.labelEnd[b] = p;
  this.bestEdge[w] = this.bestEdge[b] = -1;
  if (t === 1) {
    this.queue.push.apply(this.queue, this.blossomLeaves(b));
    //console.log('DEBUG: PUSH ' + this.blossomLeaves(b).toString());
  } else if (t === 2) {
    var base = this.blossomBase[b];
    //console.assert(this.mate[base] >= 0);
    this.assignLabel(this.endpoint[this.mate[base]], 1, this.mate[base] ^ 1);
  }
};

Edmonds.prototype.scanBlossom = function (v, w) {
  //console.log('DEBUG: scanBlossom(' + v + ',' + w + ')');
  var path = [];
  var base = -1;
  while (v !== -1 || w !== -1) {
    var b = this.inBlossom[v];
    if ((this.label[b] & 4)) {
      base = this.blossomBase[b];
      break;
    }
    //console.assert(this.label[b] === 1);
    path.push(b);
    this.label[b] = 5;
    //console.assert(this.labelEnd[b] === this.mate[this.blossomBase[b]]);
    if (this.labelEnd[b] === -1) {
      v = -1;
    } else {
      v = this.endpoint[this.labelEnd[b]];
      b = this.inBlossom[v];
      //console.assert(this.label[b] === 2);
      //console.assert(this.labelEnd[b] >= 0);
      v = this.endpoint[this.labelEnd[b]];
    }
    if (w !== -1) {
      v = v ^ w;
      w = w ^ v;
      v = v ^ w;
    }
  }
  for (var ii = 0; ii < path.length; ii++) {
    b = path[ii];
    this.label[b] = 1;
  }
  return base;
};

Edmonds.prototype.addBlossom = function (base, k) {
  var v = this.edges[k][0];
  var w = this.edges[k][1];
  var wt = this.edges[k][2];
  var bb = this.inBlossom[base];
  var bv = this.inBlossom[v];
  var bw = this.inBlossom[w];
  b = this.unusedBlossoms.pop();
  //console.log('DEBUG: addBlossom(' + base + ',' + k + ')' + ' (v=' + v + ' w=' + w + ')' + ' -> ' + b);
  this.blossomBase[b] = base;
  this.blossomParent[b] = -1;
  this.blossomParent[bb] = b;
  path = this.blossomChilds[b] = [];
  var endPs = this.blossomEndPs[b] = [];
  while (bv !== bb) {
    this.blossomParent[bv] = b;
    path.push(bv);
    endPs.push(this.labelEnd[bv]);
    //console.assert(this.label[bv] === 2 || (this.label[bv] === 1 && this.labelEnd[bv] === this.mate[this.blossomBase[bv]]));
    //console.assert(this.labelEnd[bv] >= 0);
    v = this.endpoint[this.labelEnd[bv]];
    bv = this.inBlossom[v];
  }
  path.push(bb);
  path.reverse();
  endPs.reverse();
  endPs.push((2 * k));
  while (bw !== bb) {
    this.blossomParent[bw] = b;
    path.push(bw);
    endPs.push(this.labelEnd[bw] ^ 1);
    //console.assert(this.label[bw] === 2 || (this.label[bw] === 1 && this.labelEnd[bw] === this.mate[this.blossomBase[bw]]));
    //console.assert(this.labelEnd[bw] >= 0);
    w = this.endpoint[this.labelEnd[bw]];
    bw = this.inBlossom[w];
  }
  //console.assert(this.label[bb] === 1);
  this.label[b] = 1;
  this.labelEnd[b] = this.labelEnd[bb];
  this.dualVar[b] = 0;
  var leaves = this.blossomLeaves(b);
  for (var ii = 0; ii < leaves.length; ii++) {
    v = leaves[ii];
    if (this.label[this.inBlossom[v]] === 2) {
      this.queue.push(v);
    }
    this.inBlossom[v] = b;
  }
  var bestEdgeTo = filledArray(2 * this.nVertex, -1);
  for (ii = 0; ii < path.length; ii++) {
    bv = path[ii];
    if (this.blossomBestEdges[bv].length === 0) {
      var nbLists = [];
      leaves = this.blossomLeaves(bv);
      for (var x = 0; x < leaves.length; x++) {
        v = leaves[x];
        nbLists[x] = [];
        for (var y = 0; y < this.neighbend[v].length; y++) {
          var p = this.neighbend[v][y];
          nbLists[x].push(~~(p / 2));
        }
      }
    } else {
      nbLists = [this.blossomBestEdges[bv]];
    }
    //console.log('DEBUG: nbLists ' + nbLists.toString());
    for (x = 0; x < nbLists.length; x++) {
      var nbList = nbLists[x];
      for (y = 0; y < nbList.length; y++) {
        k = nbList[y];
        var i = this.edges[k][0];
        var j = this.edges[k][1];
        wt = this.edges[k][2];
        if (this.inBlossom[j] === b) {
          i = i ^ j;
          j = j ^ i;
          i = i ^ j;
        }
        var bj = this.inBlossom[j];
        if (bj !== b && this.label[bj] === 1 && (bestEdgeTo[bj] === -1 || this.slack(k) < this.slack(bestEdgeTo[bj]))) {
          bestEdgeTo[bj] = k;
        }
      }
    }
    this.blossomBestEdges[bv] = [];
    this.bestEdge[bv] = -1;
  }
  var be = [];
  for (ii = 0; ii < bestEdgeTo.length; ii++) {
    k = bestEdgeTo[ii];
    if (k !== -1) {
      be.push(k);
    }
  }
  this.blossomBestEdges[b] = be;
  //console.log('DEBUG: blossomBestEdges[' + b + ']= ' + this.blossomBestEdges[b].toString());
  this.bestEdge[b] = -1;
  for (ii = 0; ii < this.blossomBestEdges[b].length; ii++) {
    k = this.blossomBestEdges[b][ii];
    if (this.bestEdge[b] === -1 || this.slack(k) < this.slack(this.bestEdge[b])) {
      this.bestEdge[b] = k;
    }
  }
  //console.log('DEBUG: blossomChilds[' + b + ']= ' + this.blossomChilds[b].toString());
};

Edmonds.prototype.expandBlossom = function (b, endStage) {
  //console.log('DEBUG: expandBlossom(' + b + ',' + endStage + ') ' + this.blossomChilds[b].toString());
  for (var ii = 0; ii < this.blossomChilds[b].length; ii++) {
    var s = this.blossomChilds[b][ii];
    this.blossomParent[s] = -1;
    if (s < this.nVertex) {
      this.inBlossom[s] = s;
    } else if (endStage && this.dualVar[s] === 0) {
      this.expandBlossom(s, endStage);
    } else {
      var leaves = this.blossomLeaves(s);
      for (var jj = 0; jj < leaves.length; jj++) {
        v = leaves[jj];
        this.inBlossom[v] = s;
      }
    }
  }
  if (!endStage && this.label[b] === 2) {
    //console.assert(this.labelEnd[b] >= 0);
    var entryChild = this.inBlossom[this.endpoint[this.labelEnd[b] ^ 1]];
    var j = this.blossomChilds[b].indexOf(entryChild);
    if ((j & 1)) {
      j -= this.blossomChilds[b].length;
      var jStep = 1;
      var endpTrick = 0;
    } else {
      jStep = -1;
      endpTrick = 1;
    }
    var p = this.labelEnd[b];
    while (j !== 0) {
      this.label[this.endpoint[p ^ 1]] = 0;
      this.label[this.endpoint[pIndex(this.blossomEndPs[b], j - endpTrick) ^ endpTrick ^ 1]] = 0;
      this.assignLabel(this.endpoint[p ^ 1], 2, p);
      this.allowEdge[~~(pIndex(this.blossomEndPs[b], j - endpTrick) / 2)] = true;
      j += jStep;
      p = pIndex(this.blossomEndPs[b], j - endpTrick) ^ endpTrick;
      this.allowEdge[~~(p / 2)] = true;
      j += jStep;
    }
    var bv = pIndex(this.blossomChilds[b], j);
    this.label[this.endpoint[p ^ 1]] = this.label[bv] = 2;

    this.labelEnd[this.endpoint[p ^ 1]] = this.labelEnd[bv] = p;
    this.bestEdge[bv] = -1;
    j += jStep;
    while (pIndex(this.blossomChilds[b], j) !== entryChild) {
      bv = pIndex(this.blossomChilds[b], j);
      if (this.label[bv] === 1) {
        j += jStep;
        continue;
      }
      leaves = this.blossomLeaves(bv);
      for (ii = 0; ii < leaves.length; ii++) {
        v = leaves[ii];
        if (this.label[v] !== 0) break;
      }
      if (this.label[v] !== 0) {
        //console.assert(this.label[v] === 2);
        //console.assert(this.inBlossom[v] === bv);
        this.label[v] = 0;
        this.label[this.endpoint[this.mate[this.blossomBase[bv]]]] = 0;
        this.assignLabel(v, 2, this.labelEnd[v]);
      }
      j += jStep;
    }
  }
  this.label[b] = this.labelEnd[b] = -1;
  this.blossomEndPs[b] = this.blossomChilds[b] = [];
  this.blossomBase[b] = -1;
  this.blossomBestEdges[b] = [];
  this.bestEdge[b] = -1;
  this.unusedBlossoms.push(b);
};

Edmonds.prototype.augmentBlossom = function (b, v) {
  //console.log('DEBUG: augmentBlossom(' + b + ',' + v + ')');
  var i, j;
  var t = v;
  while (this.blossomParent[t] !== b) {
    t = this.blossomParent[t];
  }
  if (t > this.nVertex) {
    this.augmentBlossom(t, v);
  }
  i = j = this.blossomChilds[b].indexOf(t);
  if ((i & 1)) {
    j -= this.blossomChilds[b].length;
    var jStep = 1;
    var endpTrick = 0;
  } else {
    jStep = -1;
    endpTrick = 1;
  }
  while (j !== 0) {
    j += jStep;
    t = pIndex(this.blossomChilds[b], j);
    var p = pIndex(this.blossomEndPs[b], j - endpTrick) ^ endpTrick;
    if (t >= this.nVertex) {
      this.augmentBlossom(t, this.endpoint[p]);
    }
    j += jStep;
    t = pIndex(this.blossomChilds[b], j);
    if (t >= this.nVertex) {
      this.augmentBlossom(t, this.endpoint[p ^ 1]);
    }
    this.mate[this.endpoint[p]] = p ^ 1;
    this.mate[this.endpoint[p ^ 1]] = p;
  }
  //console.log('DEBUG: PAIR ' + this.endpoint[p] + ' ' + this.endpoint[p^1] + '(k=' + ~~(p/2) + ')');
  this.blossomChilds[b] = this.blossomChilds[b].slice(i).concat(this.blossomChilds[b].slice(0, i));
  this.blossomEndPs[b] = this.blossomEndPs[b].slice(i).concat(this.blossomEndPs[b].slice(0, i));
  this.blossomBase[b] = this.blossomBase[this.blossomChilds[b][0]];
  //console.assert(this.blossomBase[b] === v);
};

Edmonds.prototype.augmentMatching = function (k) {
  var v = this.edges[k][0];
  var w = this.edges[k][1];
  //console.log('DEBUG: augmentMatching(' + k + ')' + ' (v=' + v + ' ' + 'w=' + w);
  //console.log('DEBUG: PAIR ' + v + ' ' + w + '(k=' + k + ')');
  for (var ii = 0; ii < 2; ii++) {
    if (ii === 0) {
      var s = v;
      var p = 2 * k + 1;
    } else {
      s = w;
      p = 2 * k;
    }
    while (true) {
      var bs = this.inBlossom[s];
      //console.assert(this.label[bs] === 1);
      //console.assert(this.labelEnd[bs] === this.mate[this.blossomBase[bs]]);
      if (bs >= this.nVertex) {
        this.augmentBlossom(bs, s);
      }
      this.mate[s] = p;
      if (this.labelEnd[bs] === -1) break;
      var t = this.endpoint[this.labelEnd[bs]];
      var bt = this.inBlossom[t];
      //console.assert(this.label[bt] === 2);
      //console.assert(this.labelEnd[bt] >= 0);
      s = this.endpoint[this.labelEnd[bt]];
      var j = this.endpoint[this.labelEnd[bt] ^ 1];
      //console.assert(this.blossomBase[bt] === t);
      if (bt >= this.nVertex) {
        this.augmentBlossom(bt, j);
      }
      this.mate[j] = this.labelEnd[bt];
      p = this.labelEnd[bt] ^ 1;
      //console.log('DEBUG: PAIR ' + s + ' ' + t + '(k=' + ~~(p/2) + ')');


    }
  }
};


//INIT STUFF//
Edmonds.prototype.init = function () {
  this.nVertexInit();
  this.maxWeightInit();
  this.endpointInit();
  this.neighbendInit();
  this.mate = filledArray(this.nVertex, -1);
  this.label = filledArray(2 * this.nVertex, 0); //remove?
  this.labelEnd = filledArray(2 * this.nVertex, -1);
  this.inBlossomInit();
  this.blossomParent = filledArray(2 * this.nVertex, -1);
  this.blossomChilds = initArrArr(2 * this.nVertex);
  this.blossomBaseInit();
  this.blossomEndPs = initArrArr(2 * this.nVertex);
  this.bestEdge = filledArray(2 * this.nVertex, -1); //remove?
  this.blossomBestEdges = initArrArr(2 * this.nVertex); //remove?
  this.unusedBlossomsInit();
  this.dualVarInit();
  this.allowEdge = filledArray(this.nEdge, false); //remove?
  this.queue = []; //remove?
};
Edmonds.prototype.blossomBaseInit = function () {
  var base = [];
  for (var i = 0; i < this.nVertex; i++) {
    base[i] = i;
  }
  var negs = filledArray(this.nVertex, -1);
  this.blossomBase = base.concat(negs);
};
Edmonds.prototype.dualVarInit = function () {
  var mw = filledArray(this.nVertex, this.maxWeight);
  var zeros = filledArray(this.nVertex, 0);
  this.dualVar = mw.concat(zeros);
};
Edmonds.prototype.unusedBlossomsInit = function () {
  var i, unusedBlossoms = [];
  for (i = this.nVertex; i < 2 * this.nVertex; i++) {
    unusedBlossoms.push(i);
  }
  this.unusedBlossoms = unusedBlossoms;
};
Edmonds.prototype.inBlossomInit = function () {
  var i, inBlossom = [];
  for (i = 0; i < this.nVertex; i++) {
    inBlossom[i] = i;
  }
  this.inBlossom = inBlossom;
};
Edmonds.prototype.neighbendInit = function () {
  var k, i, j;
  var neighbend = initArrArr(this.nVertex);
  for (k = 0; k < this.nEdge; k++) {
    i = this.edges[k][0];
    j = this.edges[k][1];
    neighbend[i].push(2 * k + 1);
    neighbend[j].push(2 * k);
  }
  this.neighbend = neighbend;
};
Edmonds.prototype.endpointInit = function () {
  var p;
  var endpoint = [];
  for (p = 0; p < 2 * this.nEdge; p++) {
    endpoint[p] = this.edges[~~(p / 2)][p % 2];
  }
  this.endpoint = endpoint;
};
Edmonds.prototype.nVertexInit = function () {
  var nVertex = 0;
  for (var k = 0; k < this.nEdge; k++) {
    var i = this.edges[k][0];
    var j = this.edges[k][1];
    if (i >= nVertex) nVertex = i + 1;
    if (j >= nVertex) nVertex = j + 1;
  }
  this.nVertex = nVertex;
};
Edmonds.prototype.maxWeightInit = function () {
  var maxWeight = 0;
  for (var k = 0; k < this.nEdge; k++) {
    var weight = this.edges[k][2];
    if (weight > maxWeight) {
      maxWeight = weight;
    }
  }
  this.maxWeight = maxWeight;
};

//HELPERS//
function filledArray(len, fill) {
  var i, newArray = [];
  for (i = 0; i < len; i++) {
    newArray[i] = fill;
  }
  return newArray;
}

function initArrArr(len) {
  var arr = [];
  for (var i = 0; i < len; i++) {
    arr[i] = [];
  }
  return arr;
}

function getMin(arr, start, end) {
  var min = Infinity;
  for (var i = start; i <= end; i++) {
    if (arr[i] < min) {
      min = arr[i];
    }
  }
  return min;
}

function pIndex(arr, idx) {
  //if idx is negative, go from the back
  return idx < 0 ? arr[arr.length + idx] : arr[idx];
}

/* ---------- Swiss engine ---------- */
var BASE = 1e12;
function prefOf(h) { // colour preference: {c:'w'|'b'|null, s:0 none,1 mild,2 strong,3 absolute}
  var col = h.colors.filter(function (c) { return c === 'w' || c === 'b'; });
  if (!col.length) return { c: null, s: 0 };
  var d = 0; col.forEach(function (c) { d += c === 'w' ? 1 : -1; });
  var last = col[col.length - 1], prev = col[col.length - 2];
  var opp = last === 'w' ? 'b' : 'w';
  if (d >= 2 || (last === 'w' && prev === 'w')) return { c: 'b', s: 3 };
  if (d <= -2 || (last === 'b' && prev === 'b')) return { c: 'w', s: 3 };
  if (d === 1) return { c: 'b', s: 2 };
  if (d === -1) return { c: 'w', s: 2 };
  return { c: opp, s: 1 };
}
function rankPlayers(players) {
  return players.slice().sort(function (a, b) {
    return b.score - a.score || (b.rating || 0) - (a.rating || 0) || String(a.seed).localeCompare(String(b.seed), 'en', { numeric: true });
  });
}
/* players: [{id, score, rating, seed, opps:[ids], colors:['w'|'b'|'-'], hadBye:bool}]
   returns {games:[{w,b}], bye:id|null, relaxed:bool} */
function pairRound(players, opts) {
  opts = opts || {};
  var P = rankPlayers(players), n = P.length;
  if (n < 2) return { games: [], bye: n ? P[0].id : null, relaxed: false };
  var idx = {}; P.forEach(function (p, i) { idx[p.id] = i; });
  // score groups and position within group
  var groups = {}; P.forEach(function (p) { (groups[p.score] = groups[p.score] || []).push(p.id); });
  var pos = {}; Object.keys(groups).forEach(function (s) { groups[s].forEach(function (id, i) { pos[id] = { i: i, g: groups[s].length }; }); });
  var maxScore = P[0].score;
  var prefs = P.map(prefOf);
  function edgeW(i, j, relax) {
    var a = P[i], b = P[j];
    if (a.id === b.id) return null;
    var played = a.opps.indexOf(b.id) >= 0;
    if (played && !relax) return null;
    var w = BASE;
    if (played) w -= 4e11;
    var sd = Math.round(Math.abs(a.score - b.score) * 2);
    // prefer floats in lower groups: weight score difference by how high the pair sits
    w -= sd * sd * 1e9 + sd * Math.round((a.score + b.score) * 2) * 1e7;
    var pa = prefs[i], pb = prefs[j];
    if (pa.c && pa.c === pb.c) {
      var m = Math.min(pa.s, pb.s);
      if (m >= 3) w -= relax ? 5e8 : 2e10; else if (m === 2) w -= 2e7; else w -= 2e6;
    }
    if (a.score === b.score) {
      var pi = pos[a.id], pj = pos[b.id], half = Math.floor(pi.g / 2);
      w -= Math.abs(Math.abs(pj.i - pi.i) - half) * 1e4;
    } else {
      w -= Math.abs(j - i) * 10;
    }
    return w;
  }
  function attempt(relax) {
    var edges = [], N = n + (n % 2);
    for (var i = 0; i < n; i++) for (var j = i + 1; j < n; j++) {
      var w = edgeW(i, j, relax); if (w !== null) edges.push([i, j, w]);
    }
    if (n % 2) {
      var bv = n;
      for (var k = 0; k < n; k++) {
        var p = P[k];
        if (p.hadBye && !relax) continue;
        var s2 = Math.round(p.score * 2);
        edges.push([k, bv, BASE - (p.hadBye ? 3e11 : 0) - s2 * s2 * 1e9 - s2 * 1e8 - (n - 1 - k) * 1e3]);
      }
    }
    var mate = edges.length ? blossom(edges, true) : [];
    var games = [], bye = null, ok = true;
    for (var v = 0; v < n; v++) {
      var m = mate[v];
      if (m === undefined || m === -1) { ok = false; break; }
      if (m === n) { bye = P[v].id; continue; }
      if (m > v) games.push([v, m]);
    }
    if (!ok || games.length * 2 + (bye ? 1 : 0) !== n) return null;
    return { games: games, bye: bye };
  }
  var r = attempt(false), relaxed = false;
  if (!r) { r = attempt(true); relaxed = true; }
  if (!r) throw new Error('تعذّر التوزيع');
  var round = opts.round || 1;
  var out = r.games.map(function (g, k) {
    var i = Math.min(g[0], g[1]), j = Math.max(g[0], g[1]);
    var a = P[i], b = P[j], pa = prefs[i], pb = prefs[j], aw;
    if (!pa.c && !pb.c) aw = (k % 2 === 0) === ((opts.firstColor || 'w') === 'w'); // round 1: alternate by board, top seed white on board 1
    else if (pa.c && pb.c && pa.c !== pb.c) aw = pa.c === 'w';
    else if (pa.s !== pb.s) aw = pa.s > pb.s ? pa.c === 'w' : pb.c === 'b';
    else {
      // same preference & strength: alternate from most recent round where colours differed, else higher ranked gets preference
      var ca = a.colors.slice(), cb = b.colors.slice(), decided = false;
      for (var t = Math.min(ca.length, cb.length) - 1; t >= 0; t--) {
        if ((ca[t] === 'w' || ca[t] === 'b') && (cb[t] === 'w' || cb[t] === 'b') && ca[t] !== cb[t]) { aw = ca[t] === 'b'; decided = true; break; }
      }
      if (!decided) aw = pa.c ? pa.c === 'w' : true;
    }
    return { w: aw ? a.id : b.id, b: aw ? b.id : a.id, top: Math.max(a.score, b.score), sum: a.score + b.score, hi: i };
  });
  out.sort(function (x, y) { return y.top - x.top || y.sum - x.sum || x.hi - y.hi; });
  return { games: out.map(function (g) { return { w: g.w, b: g.b }; }), bye: r.bye, relaxed: relaxed };
}

/* Round robin (Berger tables): ids in seed order -> [{games:[{w,b}], bye}] */
function roundRobin(ids) {
  var a = ids.slice(); if (a.length % 2) a.push(null);
  var n = a.length, rounds = [];
  for (var r = 0; r < n - 1; r++) {
    var games = [], bye = null;
    for (var i = 0; i < n / 2; i++) {
      var x = a[i], y = a[n - 1 - i];
      if (i === 0 && r % 2 === 1) { var t = x; x = y; y = t; }
      else if (i > 0 && i % 2 === 1) { var t2 = x; x = y; y = t2; }
      if (x === null || y === null) { bye = x === null ? y : x; continue; }
      games.push({ w: x, b: y });
    }
    rounds.push({ games: games, bye: bye });
    a.splice(1, 0, a.pop()); // rotate all but the first
  }
  return rounds;
}
root.AndSwiss = { pairRound: pairRound, roundRobin: roundRobin, prefOf: prefOf, rankPlayers: rankPlayers, blossom: blossom };
})(typeof window !== 'undefined' ? window : module.exports);
