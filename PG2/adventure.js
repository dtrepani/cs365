// The question, the first option, the second option,
// Locations of next question for first and second option respectively.
// 	However, "GAMEOVER" and "SUCCESS" leads to end screens
/*
see shiny
> go to shiny
	truck misses, past traffic
	> reflect in middle of street
		cars honk at you
		> continue to reflect
			GAMEOVER - shiny got away!
		> break out of trance and go after shiny
			LINK TO shiny below
	> go after shiny
		the shiny slows down enough for someone else to grab it
		> punch them and take the shiny. reflect on your life choices and how a shiny has led you to a life of crime
			SUCCESS!
		> let the shiny go. mourn.
			GAMEOVER - shiny go away!
> reflect
	truck misses, before traffic
	> reflect while waiting for cars to pass
		GAMEOVER - shiny got away!
	> charge blindly into traffic
		somehow survive
		> steal kid's bike to catch up to shiny and reflect on your life choices and how a shiny has led you to a life of crime
			LINK ABOVE for question above shiny slowing down
		> continue to run after shiny
			GAMEOVER - shiny got away!
*/
var questions = [
	[	"You see a fine shiny rolling down a street. You want the shiny.",
		"Go after the shiny.",
		"Reflect upon your life choices before going after the shiny.",
		1,
		2
	],
	[	"As you're chasing the shiny the street, a truck barely misses you as you blindly chase the shiny. But the shiny is so close now.",
		"Reflect upon your life choices in the middle of the street.",
		"Never give up! The shiny's so close!",
		2,
		3
	],
	[	"Cars begin to honk behind you. They probably want you to stop reflecting upon your life choices in the middle of the street.",
		"Continue to reflect upon your life choices in the middle of the street.",
		"The shiny's getting away! You return to the chase.",
		"GAMEOVER",
		0
	],
	[	"As you're chasing the shiny down the street, a truck barely misses you as you blindly chase the shiny. There are many more cars after the truck. The shiny is so far away now though. If only you hadn't reflected upon your life choices earlier.",
		"Reflect further upon your life choices as you wait for the cars to pass.",
		"Charge blindly into traffic. The shiny has top priority.",
		"GAMEOVER",
		0
	],
	[	"You somehow survive blindly running into traffic, but the shiny is still far away. There is a biker nearby watching the scene you caused.",
		"Push them off their bike and steal it. Reflect upon your life choices and how a shiny has led you to a life of crime.",
		"Ignore them and continue to run after the shiny.",
		0,
		"GAMEOVER"
	],
	[	"The shiny is so close and slowing down, but someone picked it up. They observe it intently, oblivious to your presence.",
		"Punch them and take the shiny. Reflect upon your life choices and how a shiny has led you to a life of crime.",
		"Let the shiny go. Mourn as you reflect your life choices.",
		"SUCCESS",
		"GAMEOVER"
	]
];

function centerWrapper() {
	$('#wrapper').css({
		'position': 'absolute',
		'left': '50%',
		'top': '50%',
		'margin-left': -$('#wrapper').outerWidth()/2,
		'margin-top': -$('#wrapper').outerHeight()/2,
	});
}

function main() {
	$(centerWrapper);
}

$(main);