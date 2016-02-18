var express = require("express");
var bodyParser = require("body-parser");
var app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("pub"));

var count = 0;

var sendCount = function(req, res) {
	res.setHeader("Content-Type", "application/json");
	res.write(JSON.stringify(count));
	res.end();
}

function isNumeric(obj) {
	return !isNaN( parseFloat(obj) ) && isFinite( obj );
}

app.post("/fetchCount", sendCount);

app.post("/resetCount", function(req, res) {
	count = 0;
	sendCount(req, res);
});

app.post("/changeCount", function(req, res) {
	if (isNumeric(req.body.changeBy)) {
		count += parseFloat(req.body.changeBy);
		sendCount(req, res);
	}
	else {
		res.status(400);
		res.setHeader("Content-Type", "text/plain");
		res.write("Invalid request parameter - must be numeric.");
		res.end();
	}
});

app.listen(80);
console.log("server running...");