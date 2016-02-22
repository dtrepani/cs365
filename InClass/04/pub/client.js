function updateResults(data) {
}

function main() {
	var request = $.post("/updateResults", {}, function(data) {
		var results = jQuery.parseJSON(data);
		console.log(results);

		for(var i = 1; i < 5; i++) {
			for(var j = 1; j < 5; j++) {
				$("#results tr:nth-child(" + i + ") td:nth-child(" + j + ")").html(results[i][j]);
			}
		}
	});

	request.fail(function(jqXHR, textStatus, errorThrown) {
		$("#results").prepend(jqXHR.responseText);
	});
}

$(main);