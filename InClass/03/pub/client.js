
var countChange = function(event) {
	var changeAmt = event.data.param;
	var request = $.post("/changeCount", {changeBy: changeAmt}, function(dataBack) {
		$("#result").text(dataBack);
	});
	request.fail(function(jqXHR, textStatus, errorThrown) {
		$("#result").text(jqXHR.responseText);
	});
};

function startUp() {
	$.post("/fetchCount", {}, function(dataBack) {
		$("#result").text(dataBack);
	});
	$("#up").click({param: 1}, countChange);
	$("#down").click({param: -1}, countChange);
	$("#reset").click(function() {
		$.post("/resetCount", {}, function(dataBack) {
			$("#result").text(dataBack);
		});
	});
	$("#change").click({param: $("#change-amt").val()}, countChange);
}

$(startUp);