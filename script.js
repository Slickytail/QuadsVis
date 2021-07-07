// Looking at caps in Z_2^dim
var dim = 4;
// The points currently in the qap
var qap = new Qap(dim);
var light = false;


function createListeners() {
    // Light and Dark Mode
    let colorToggle = document.getElementById("light-mode");
    colorToggle.addEventListener("click", () => {
        light = !light;
        document.body.classList.toggle("light", light);
        setTimeout(drawAffSpace);
    });

    // PDF saver
    let saveBtn = document.getElementById("save-svg");
    saveBtn.addEventListener("click", () => {
        let el = document.getElementById("qap");
        saveSVG(el);
    });

    // Dimension chooser
    let dimDown = document.getElementById("dim-down");
    let dimUp = document.getElementById("dim-up");
    let dimText = document.getElementById("dim");

    const minDim = 2;
    const maxDim = 14;
    function updateDimText() {
        if (dim <= minDim) {
            dim = minDim;
            dimDown.classList.add("disabled");
            dimUp.classList.remove("disabled");
        }
        else if (dim >= maxDim) {
            dim = maxDim;
            dimDown.classList.remove("disabled");
            dimUp.classList.add("disabled");
        } else {
            dimDown.classList.remove("disabled");
            dimUp.classList.remove("disabled");
        }
        dimText.innerText = dim;
        qap.changeDim(dim);
        setTimeout(drawAffSpace);
    }
    dimDown.onclick = () => {dim--; updateDimText()};
    dimUp.onclick = () => {dim++; updateDimText()};
    updateDimText();

    // Dimension display
    let yesBtn = document.getElementById("exc-line-yes");
    let noBtn = document.getElementById("exc-line-no");

    function setDisplayStyle(style) {
        if (style) {
            yesBtn.classList.remove("selected");
            noBtn.classList.add("selected");
        } else {
            yesBtn.classList.add("selected");
            noBtn.classList.remove("selected");
        }
        d3.select("#lines").classed("hidden_locked", style);
    }
    yesBtn.onclick = () => setDisplayStyle(false);
    noBtn.onclick = () => setDisplayStyle(true);
    setDisplayStyle(false);

    // Qap clear
    document.getElementById("clear").onclick = () => {
        qap.clear();
        window.requestAnimationFrame(drawQap);
    }
    // Qap complete
    document.getElementById("complete").onclick = () => {
        qap.complete();
        window.requestAnimationFrame(drawQap);
    }
    // Qap random
    const r = document.getElementById("random");
    r.onclick = () => {
        if (r.classList.contains("disabled"))
        return;
        r.classList.add("disabled");
        qap.clear();
        function _done() {
            r.classList.remove("disabled");
            drawQap();
        }
        function _f() {
            qap.random(_f, _done);
        }
        qap.random(_f, _done);
    }

    window.requestAnimationFrame(drawAffSpace);
}

// Preprocesses the SVG display to make it standalone.
function saveSVG(element) {
    
    const xmlns = "http://www.w3.org/2000/svg";
    const xlink = "http://www.w3.org/1999/xlink";

    let copiedSvg = element.cloneNode(true);
    // Add the xlink
    copiedSvg.setAttribute("xmlns:xlink", xlink);
    // Within this copied svg, we're going to delete elements that are invisible.
    // Delete the "lines"
    copiedSvg.removeChild(copiedSvg.getElementById("lines"));

    // Delete the parts of qap elements that are hidden.
    // Do this with d3 instead?
    let cards = copiedSvg.getElementById("points");
    Array.from(cards.getElementsByClassName("card")).forEach(el => {
        if (el.classList.contains("in-qap")) {
            el.removeChild(el.getElementsByTagName("rect")[0]);
            el.removeChild(el.getElementsByTagName("text")[0]);

            // Set the new diamond style
            let diamond = el.getElementsByClassName("diamond")[0];
            let center = diamond.getAttribute("width");
            diamond.setAttribute("fill", "none");
            diamond.setAttribute("stroke", "#5c9");
            diamond.setAttribute("stroke-width", `${center/28}`);
            // We make up for the added stroke width by reducing the width
            diamond.setAttribute("width", `${center*0.9}`);
            diamond.setAttribute("height", `${center*0.9}`);
            diamond.setAttribute("x", `${center/20}`);
            diamond.setAttribute("y", `${center/20}`);
            diamond.setAttributeNS(xlink, "xlink:href", "#diamond");
        }
        else if (el.classList.contains("excluded")) {
            el.removeChild(el.getElementsByTagName("rect")[0]);
            el.removeChild(el.getElementsByClassName("diamond")[0]);

            // Properly compute the text position
            let text = el.getElementsByTagName("text")[0];
            // Based on the font, determine how to center the text...
            text.setAttribute("dominant-baseline", "central");
            text.setAttribute("text-anchor", "middle");
            text.setAttribute("fill", "#b55");
        }
        else {
            cards.removeChild(el);
        }
    });

    let data = copiedSvg.outerHTML;
    let blob = new Blob([data], {type:"image/svg+xml;charset=utf-8"});
    let url = URL.createObjectURL(blob);

    let link = document.createElement("a");
    link.setAttribute("target","_blank");
    link.href = url;
    link.download = "saved-cap.svg"

    // Cheap way to click a link.
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

var cardPos = [];
function drawAffSpace() {
    let qapSvg = d3.select("#qap");
    // Draw the grid
    // First, we have to compute the size of the grid.
    // The viewbox is set to 100 x 100. (maybe plus padding)
    // In the future, we should actually change the viewBox here, depending on the quadStyle and the parity of dim
    const w = 100;
    const h = 100;

    // We'll put the odd dimension on the X-axis. (this should probably depend on viewport orientation.)
    // First, we'll figure out the cardsBtn-style layout (ie, quadStyle == false)
    let xDim = Math.ceil(dim/2);
    let yDim = Math.floor(dim/2);
    let xL = Math.pow(2, xDim);
    let yL = Math.pow(2, yDim);
    // We want our cells to actually be square. 
    let cellSize = Math.min(w / xL, h / yDim);
    // We're going to vertically center the cells.
    let gridHeight = cellSize * yL;
    let gridYMin = (h - gridHeight)/2;
    let gridYMax = (h + gridHeight)/2;

    qapSvg.attr("viewBox", `-5 ${gridYMin-5} 110 ${gridHeight+10}`);
    // Draw lines
    // Generate priority (ruler tickmarks) for lines
    let ruler = new Array(xL+1).fill(0);
    for (let w = 0; w < xDim; w++) {
        let wavelength = Math.pow(2, w);
        for (let i = 0; i <= xL; i += wavelength) {
            ruler[i]++;
        }
    }
    const rulerColorsDark  = ["#333", "#444", "#666", "#567", "#46a", "#38d"];
    const rulerColorsLight = ["#ccc", "#bbb", "#999", "#567", "#46a", "#38d"];
    let rulerColors = light ? rulerColorsLight : rulerColorsDark;
    const colorScale = d3.interpolateRgbBasis(rulerColors);

    let lines = new Array();
    for (let xi = 0; xi <= xL; xi++) {
        lines.push({
            vert: true,
            x: xi,
            priority: (xi != 0 && xi != xL) ? ruler[xi] : 0.5
        });
    }
    for (let yi = 0; yi <= yL; yi++) {
        lines.push({
            vert: false,
            y: yi,
            priority: (yi != 0 && yi != yL) ? ruler[yi] : 0.5
        });
    }

    lines.sort((a, b) => a.priority - b.priority);

    let grid = qapSvg
    .select("#grid")
    .selectAll(".line")
    .data(lines);

    let enter = grid.enter().append("line")
    .classed("line", true);
    grid.exit().remove();

    grid = grid.merge(enter)
        .attr("x1", d =>  d.vert ? d.x * cellSize : 0)
        .attr("x2", d =>  d.vert ? d.x * cellSize : 100)
        .attr("y1", d => !d.vert ? gridYMin + d.y * cellSize : gridYMin)
        .attr("y2", d => !d.vert ? gridYMin + d.y * cellSize : gridYMax)
        .attr("stroke-width", d => (d.priority+1)*Math.sqrt(cellSize)/15)
        .attr("stroke", d => colorScale(d.priority / xDim));
    d3.select("#lines")
        .attr("stroke-width", Math.sqrt(cellSize)/3)

    // Draw squares for getting clicks
    let squares = new Array();
    for (let xi = 0; xi < xL; xi++) {
        for (let yi = 0; yi < yL; yi++) {
            // Compute which SET card this actually is, in cardsBtn notation
            // The strategy here is to interleave the bits of xi and yi.
            let cardNum = 0;
            for (let i = 0; i < xDim; i++) {
                // The ith-leftmost bit of xi is 
                let bx = (xi & (1 << i)) >>> i;
                let by = (yi & (1 << i)) >>> i;
                // Now we need to set the 2ith bit of cardnum to bx and the (2i+1)th to by
                cardNum = cardNum | (bx << (2*i)) | (by << (2*i + 1));
            }
            squares.push({
                xi: xi,
                yi: yi,
                card: cardNum
            })
            cardPos[cardNum] = {x: (xi+0.5)*cellSize, y: gridYMin + (yi+0.5)*cellSize};
        }
    }

    let cards = qapSvg
    .select("#points")
    .selectAll("g.card")
    .data(squares, d => d.card);

    let dist = (x1, y1, x2, y2) => Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
    let dCards = cards.enter().append("g")
    .classed("card", true)
    .on('click', function(d) {
        if (qap.excludesCount(d.card)) {
            return;
        }
        if (qap.contains(d.card))
        qap.remove(d.card);
        else
        qap.add(d.card);
        window.requestAnimationFrame(drawQap);
    })
    .on('mouseover', function(d) {
        // Compute which lines we want
        let quads = qap.excludesTriples(d.card);
        if (!quads || !quads.length)
        return;
        let paths = [];
        for (let i = 0; i < quads.length; i += 3) {
            let pts = quads.slice(i, i+3).map(x => cardPos[x]);
            // Find the shortest path between the three
            let minPathLength = Infinity;
            let minPath;
            let comparePathLengths = ([p1, p2, p3]) => {
                let d = dist(p1.x, p1.y, p2.x, p2.y) + dist(p2.x, p2.y, p3.x, p3.y);
                if (d < minPathLength) {
                    minPathLength = d;
                    minPath = [p1, p2, p3];
                }
            }
            [pts, [pts[1], pts[2], pts[0]], [pts[2], pts[0], pts[1]]]
            .forEach(comparePathLengths) 
            paths.push(minPath);
        }
        let pathEls = d3.select("#lines")
        .classed("hidden", false)
        .selectAll("path.quad")
        .data(paths);
        let dPathEls = pathEls
        .enter()
        .append("path")
        .classed("quad", true);
        pathEls.exit().remove();
        pathEls.merge(dPathEls)
            .attr("d", p => `M ${p[0].x} ${p[0].y} L ${p[1].x} ${p[1].y} L ${p[2].x} ${p[2].y}`);

    })
    .on('mouseout', function(d) {
        d3.select("#lines")
            .classed("hidden", true);
    })
    dCards.append("use")
        .attr("href", "#diamond")
        .classed("diamond", true);
    dCards.append("text")
        .attr("font-size", "25");
    dCards.append("rect");
    cards.exit()
        .each(d => qap.remove(d.card)) 
        .remove();

    cards = cards.merge(dCards)
        .attr("transform", d => `translate(${d.xi * cellSize}, ${gridYMin + d.yi * cellSize})`);
    cards.select("rect")
        .attr("width", cellSize)
        .attr("height", cellSize);
    cards.select("text")
        .attr("transform", `translate(${cellSize/2}, ${cellSize/2}) scale(${cellSize * 0.9/25})`);
    cards.select("use")
        .attr("width", cellSize)
        .attr("height", cellSize);
    drawQap();
}


function drawQap() {
    d3.selectAll("g.card")
        .classed("in-qap", d => qap.contains(d.card))
        .classed("excluded", d => qap.excludesCount(d.card))
        .select("text")
        .text(function(d) {
            return qap.excludesCount(d.card) || 0;
        });
    d3.select("#cap-size")
        .text(qap.size());

    // Exclude counts
    // Start with excludes[0] being all elements
    let excludes = [Math.pow(2, qap.dim) - qap.size()]  
    for (let i of Object.values(qap.exclude)) {
        let c = i.length/3;
        while (excludes.length <= c) 
        excludes.push(0) 
        excludes[c] += 1;
        excludes[0] --;
    }
    let convolved = [];
    for (let i = 0; i < excludes.length; i++) {
        let tot = 0;
        for (let t = 0; t < excludes.length; t++) {
            tot += excludes[t] * binomial(t, i);
        }
        convolved.push(tot);
    }

    const maxExcludeFactor = (d3.select("#exclude-counts")
        .node().getBoundingClientRect().width - 5) *
        0.8 / 10 / Math.max(...excludes);
    let eC = d3.select("#exclude-counts")
    .selectAll(".exclude-count")
    .data(excludes);
    let deC = eC.enter()
    .append("div")
    .classed("exclude-count", true);
    deC.append('span')
        .classed('blue-bar', true);
    deC.append("span")
        .classed("control-label", true)
        .text((d, i) => i);
    deC.append("span")
        .classed("control-display", true);
    eC.exit().remove();
    eC = eC.merge(deC)
    eC.select("span.control-display")
        .text(d => d);

    eC.select('.blue-bar')
        .style('transform', d => `scaleX(${d*maxExcludeFactor})`);

    // convolve distribution
    let eCV = d3.select("#exclude-convolution")
    .selectAll(".exclude-count")
    .data(convolved);
    let deCV = eCV.enter()
    .append("div")
    .classed("exclude-count", true);
    deCV.append("span")
        .classed("control-label", true)
        .text((d, i) => i);
    deCV.append("span")
        .classed("control-display", true);
    eCV.exit().remove();
    eCV = eCV.merge(deCV);
    eCV.select("span.control-display")
        .text(d => d);
}

// Binomial Coefficient Computation
var binomials = [
    [1],
    [1,1],
    [1,2,1],
    [1,3,3,1],
    [1,4,6,4,1],
    [1,5,10,10,5,1],
    [1,6,15,20,15,6,1]
];

// step 2: a function that builds out the LUT if it needs to.
function binomial(n,k) {
    if (n < k)
    return 0;
    while (n >= binomials.length) {
        let s = binomials.length;
        let nextRow = [];
        nextRow[0] = 1;
        for(let i=1, prev=s-1; i<s; i++) {
            nextRow[i] = binomials[prev][i-1] + binomials[prev][i];
        }
        nextRow[s] = 1;
        binomials.push(nextRow);
    }
    return binomials[n][k];
}

// Call createListeners at the right time
if (document.readyState === "complete" ||
    (document.readyState !== "loading" && !document.documentElement.doScroll) ) {
    createListeners();
} else {
    document.addEventListener("DOMContentLoaded", createListeners);
}
