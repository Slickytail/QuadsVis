var dim = 3;
var quadStyle = true;
var qap = {};
function createListeners() {
	// Dimension chooser
	let dimDown = document.getElementById("dim-down");
	let dimUp = document.getElementById("dim-up");
	let dimText = document.getElementById("dim");

	const minDim = 1;
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
		setTimeout(drawQap);
	}
	dimDown.onclick = () => {dim--; updateDimText();}
	dimUp.onclick = () => {dim++; updateDimText();}

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
		setTimeout(drawQap);
	}
	z2.onclick = () => setQuadStyle(false);
	z4.onclick = () => setQuadStyle(true);
	setQuadStyle(quadStyle);

	// Qap clear
	let clear = document.getElementById("clear");
	clear.onclick = () => {
		qap = {};
		setTimeout(drawQap);
	}

	setTimeout(drawQap);
}

function drawQap() {
	let qap = document.getElementById("qap");
	// Draw a grid
}

if (document.readyState === "complete" ||
   (document.readyState !== "loading" && !document.documentElement.doScroll) ) {
	createListeners();
} else {
	document.addEventListener("DOMContentLoaded", createListeners);
}