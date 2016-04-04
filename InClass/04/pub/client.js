'use strict';

function main() {
	$.get("/updateResults", {}, updateResults)
		.fail(xhrFailed);

	setupClicks();
}

function setupClicks() {
	$("#results").on(
		"click",
		"td",
		function() {
			var row = $(this).closest("tr").index();
			var col = $(this).index();

			$.post(
				"/setResult",
				{row: row, col: col},
				updateResults)
				.fail(xhrFailed);
		}
	);
}

// Results are appended with results[i-1][j-1] because
// the given results do not account for headers.
function getAppend(i, j, results) {
	if (i === 0 && j === 0) {
		return "<th></th>"
	}

	if (i === 0 || j === 0) {
		return "<th>" +
			((i === 0) ? j : i) +
			"</th>";
	}

	return "<td class='" + results[i-1][j-1] + "'>" + results[i-1][j-1] + "</td>";
}

// Update the table based on the results from the server.
function updateResults(data) {
	var results = "";

	for(var i = 0; i < 5; i++) {
		results += "<tr>";

 		for (var j = 0; j < 5; j++) {
			results += getAppend(i, j, data);
		}

		results += "</tr>";
	}

	$("#results").html(results);
}

function xhrFailed(jqXHR, textStatus, errorThrown) {
	console.log(jqXHR.responseText);
	$("#error").html(jqXHR.responseText);
}

$(main);