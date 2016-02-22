var express		= require("express");
var bodyParser	= require("body-parser");
var app 		= express();

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("pub"));

var results = [
	["X", "", "", ""],
	["", "X", "", ""],
	["", "", "X", ""],
	["", "", "", "X"]
];

app.post("/updateResults", function(req, res) {
	console.log("test");
	res.setHeader("Content-Type", "application/json");
	res.write(JSON.stringify(results));
	res.end();
});

app.listen(80);
console.log("Server running.");