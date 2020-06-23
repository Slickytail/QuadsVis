// Looking at caps in Z_2^dim
var dim = 4;
// Should the grid be drawn with four components? (vs two)
var quadStyle = true;
// The points currently in the qap
var qap = new Qap();
function createListeners() {
	// Dimension chooser
	let dimDown = document.getElementById("dim-down");
	let dimUp = document.getElementById("dim-up");
	let dimText = document.getElementById("dim");

	const minDim = 2;
	const maxDim = 10;
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
	let z2 = document.getElementById("z2");
	let z4 = document.getElementById("z4");

	function setQuadStyle(style) {
		quadStyle = style;
		if (style) {
			z2.classList.remove("selected");
			z4.classList.add("selected");
		} else {
			z2.classList.add("selected");
			z4.classList.remove("selected");
		}
		setTimeout(drawAffSpace);
	}
	z2.onclick = () => setQuadStyle(false);
	z4.onclick = () => setQuadStyle(true);
	setQuadStyle(quadStyle);

	// Qap clear
	let clear = document.getElementById("clear");
	clear.onclick = () => {
		qap.clear();
		setTimeout(drawAffSpace);
	}

	setTimeout(drawAffSpace);
}
function drawAffSpace() {
	let qapSvg = document.getElementById("qap");
	// Draw the grid
	// First, we have to compute the size of the grid.

	// The viewbox is set to 100 x 100. (maybe plus padding)
	// In the future, we should actually change the viewBox here, depending on the quadStyle and the parity of dim
	const w = 100;
	const h = 100;

	// We'll put the odd dimension on the X-axis. (this should probably depend on viewport orientation.)
	// First, we'll figure out the Z2-style layout (ie, quadStyle == false)
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

	// Draw lines
	// Generate priority (ruler tickmarks) for lines
	let ruler = new Array(xL+1).fill(0);
	for (let w = 0; w < xDim; w++) {
		let wavelength = Math.pow(2, w);
		for (let i = 0; i <= xL; i += wavelength) {
			ruler[i]++;
		}
	}
	const rulerColors = ["#333", "#444", "#666", "#567", "#46a", "#38d"];
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

	let grid = d3.select(qapSvg)
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

	// Draw squares for getting clicks
	let squares = new Array();
	for (let xi = 0; xi < xL; xi++) {
		for (let yi = 0; yi < yL; yi++) {
			// Compute which SET card this actually is, in Z2 notation
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
		}
	}

	let cards = d3.select(qapSvg)
		.select("#points")
	    .selectAll("g.card")
	    .data(squares, d => d.card);

	let dCards = cards.enter().append("g")
	    .classed("card", true)
	    .on('click', function(d) {

	    	if (qap.excludes(d.card)) {
	    		//drawQap();
	    		throw "Excluded cards shouldn't be clickable..."
	    	}
	    	if (qap.contains(d.card))
	    		qap.remove(d.card);
	    	else
	    		qap.add(d.card);
	    	setTimeout(drawQap, 20);
	    });
    dCards.append("use")
        .attr("href", "#diamond")
        .classed("diamond", true);
    dCards.append("text")
        .attr("font-size", "25");
    dCards.append("rect");
	cards.exit()
		.each(d => {
			if (qap.contains(d.card))
	    		qap.remove(d.card);
		})
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
		    .classed("excluded", d => qap.excludes(d.card))
        .filter(".excluded")
		.select("text")
			.text(function(d) {
                return qap.excludes(d.card) || 0;
            })
        d3.select("#cap-size")
            .text(qap.size());
	}
if (document.readyState === "complete" ||
   (document.readyState !== "loading" && !document.documentElement.doScroll) ) {
	createListeners();
} else {
	document.addEventListener("DOMContentLoaded", createListeners);
}
