var votes = new Object();

var express = require("express");
var server = express();
bodyParser = require("body-parser");
server.use(bodyParser.urlencoded({extended: false}));

server.use("/vote", function(req, res) {
	var params = req.body.person;
	var person = Array.isArray(params) ? params[0] : params;

	if(votes.hasOwnProperty(person)) {
		votes[person]++;
	} else {
		votes[person] = 1;
	}

	if(!req.body.total) {
		res.write("You just submitted a vote for " + person + ".\n\n");
	}

	res.write("Total: ");
	for (var person in votes) {
		if(person.length > 0) res.write("\t" + person + " has " + votes[person] + " votes.\n");
	}

	res.end();
});

server.use(express.static("./pub"));
server.listen(80);
console.log("Server is now running on port 80.");