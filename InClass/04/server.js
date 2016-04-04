var express		= require("express");
var bodyParser	= require("body-parser");
var app 		= express();

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("pub"));

var cycle = [ "win", "lose", "draw" ];
var results = [
	["x", "", "", ""],
	["", "x", "", ""],
	["", "", "x", ""],
	["", "", "", "x"]
];

app.get("/updateResults", updateResults);
app.post("/setResult", setResult);

app.listen(8037);
console.log("Server running on port 8037.");

// Get the index of the next value in the cycle for a
// given cell.
function getNextInCycle(row, col) {
	return ((cycle.indexOf(results[row][col]) + 1) % 3);
}

// Get the index of the opposite of current cycle value.
// Win becomes lose and vice versa. Draw stays the same.
function getOppositeInCycle(cycleIndex) {
	return (cycle[cycleIndex] == "win")
			? cycle.indexOf("lose")
			: (cycle[cycleIndex] == "lose")
				? cycle.indexOf("win")
				: cycleIndex;
}

// Set results based on which cell was clicked.
function setResult(req, res) {
	var row = req.body.row - 1;
	var col = req.body.col - 1;

	if (row === col) {
		updateResults(req, res);
		return;
	}

	var nextInCycle = getNextInCycle(row, col);
	var result = (results[row, col] == "")
		? cycle[0]
		: cycle[nextInCycle];

	results[row][col] = result;
	results[col][row] = cycle[getOppositeInCycle(nextInCycle)];

	updateResults(req, res);
}

// Send the results back to the client.
function updateResults(req, res) {
	res.setHeader("Content-Type", "application/json");
	res.write(JSON.stringify(results));
	res.end();
}
