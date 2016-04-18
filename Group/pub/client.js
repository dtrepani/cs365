var socket = io();
var myUsername;
var myRoomNumber;
var myState = "waiting";

function doThisWhenLoaded() {
	showLoginScreen();

	$("#loginButton").click(function() {
		socket.emit("login", $("#username").val());
	});

	$("#readyBtn").click(function() {
		console.log("readyBtm clicked");
		console.log(myState);
		if (myState === "waiting") {
			myState = "ready";
			$("#readyBtn").text("not ready");
		} else {
			myState = "waiting";
			$("#readyBtn").text("ready");
		}
		socket.emit("changeState", myState);
	});

	$("#exitRoomBtn").click(function() {
		$("#waitDiv").hide();
		$("#msgRoom").hide();
		console.log(myRoomNumber);
		socket.emit("exitRoom", myRoomNumber);
	});

	socket.on("joinedSuccessfully", function(roomNumber) {
		$("#waitDiv").show();
		$("#userInRoomText").text("You are in room #" + roomNumber);
		$("#readyBtn").text("ready");
		myRoomNumber = roomNumber;
	});

	socket.on("lockRoom", function(roomNumber) {
		$("#lock"+roomNumber+"room").css("visibility",  "visible");
		$("#roomDiv .room").eq(roomNumber).find(".joinBtn").prop("disabled",true);
	});

	socket.on("nameExists", function(name) {
		$("#nameWarning").text("Choose other name");
	});

	socket.on("removedSuccessfully", function(roomNumber) {
		$("#waitDiv").hide();
	});

	/**
	* @see Room->getDataForPlayer().
	*/
	socket.on("sendData", function(data) {
		// TODO: Set data appropriately.
	});

	socket.on("sendMessage", function(msg) {
		$("#msgRoom").show();
		$("#msgRoom").text(msg);
	});

	socket.on("showRooms", function(username) {
		showRoomScreen();
	});

	// NOTE: Had two functions of the same name, just with different capitalizations and the server was calling the other one. :) Works fine now.
	socket.on("startGame", function(usersInRoom) {
		showMainScreen();
		for(var k = 0; k < usersInRoom.length; ++k) {
			$("#p"+k+"name").text(usersInRoom[k]);
		}
	});

	socket.on("updateRooms", function(usersInRooms) {
		console.log(usersInRooms);
		updateRoomsInfo(usersInRooms);
	});

	for(i = 0; i < 6; ++i) {
		$("#roomDiv .room").eq(i).find(".joinBtn").click(makeClickHandlerFor(i));
	}
}

function updateRoomsInfo(usersInRooms) {
	var r, p;
	for(r = 0; r < 6; ++r) {
		for(p = 0; p < usersInRooms[r].length; ++p) {
			$("#r" + (r+1) + "p" + (p+1)).text(usersInRooms[r][p]);
		}
		while(p < 4) {
			$("#r" + (r+1) + "p" + (p+1)).text("...");
			++p
		}
	}
}

function makeClickHandlerFor(roomNumber) {
	return function() {
		socket.emit("join", roomNumber);
	}
}

function showLoginScreen() {
	$("#nameWarning").text("");
	$("#loginDiv").show();
	$("#waitDiv").hide();
	$("#mainDiv").hide();
	$("#roomDiv").hide();
}

function showRoomScreen() {
	$("#nameWarning").text("");
	$("#loginDiv").hide();
	$("#mainDiv").hide();
	$("#roomDiv").show();
	$("#waitDiv").hide();
}

function showMainScreen() {
	$("#loginDiv").hide();
	$("#waitDiv").hide();
	$("#roomDiv").hide();
	$("#mainDiv").show();
}

$(doThisWhenLoaded);