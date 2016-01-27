// The question, the first option, the second option,
// Locations of next question for first and second option respectively.
// 	However, "GAMEOVER" and "SUCCESS" leads to end screens.
var step = 0;
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
		3,
		4
	],
	[	"Cars begin to honk behind you. They probably want you to stop reflecting upon your life choices in the middle of the street.",
		"Continue to reflect upon your life choices in the middle of the street.",
		"The shiny's getting away! You return to the chase.",
		"GAMEOVER",
		5
	],
	[	"As you're chasing the shiny down the street, a truck barely misses you as you blindly chase the shiny. There are many more cars after the truck. The shiny is so far away now though. If only you hadn't reflected upon your life choices earlier.",
		"Reflect further upon your life choices as you wait for the cars to pass.",
		"Charge blindly into traffic. The shiny has top priority.",
		"GAMEOVER",
		5
	],
	[	"You somehow survive blindly running into traffic, but the shiny is still far away. There is a biker nearby watching the scene you caused.",
		"Push them off their bike and steal it. Reflect upon your life choices and how a shiny has led you to a life of crime.",
		"Ignore them and continue to run after the shiny.",
		5,
		"GAMEOVER"
	],
	[	"The shiny is so close and slowing down, but someone picked it up. They observe it intently, oblivious to your presence.",
		"Punch them and take the shiny. Reflect upon your life choices and how a shiny has led you to a life of crime.",
		"Let the shiny go. Mourn as you reflect your life choices.",
		"SUCCESS",
		"GAMEOVER"
	]
];

function screenGameOver() {
	$('body').css('background', 'url("img/bg_gameover.png")');
	$('h1').css('color', '#444');

	$('#content').html("\
		<img src=\"img/gameover.jpg\" alt=\"It got away!!!\" width=\"500px\" height=\"500px\">\
		\
		<br><br><p>The shiny got away! Now might be the time for you to reflect on your life choices.</p>");
}

function screenSuccess() {
	$('body').css('background', 'url("img/bg_success.png")');
	$('h1').css('color', '#FAC564');

	$('#content').html("\
		<img src=\"img/success.jpg\" alt=\"A shiny rock!\" width=\"300px\" height=\"390px\">\
		\
		<br><br><p>Now that\'s one shiny rock! Well worth the law-breaking and very angry people yelling behind you.</p>");
}

function screenStep() {
	$('#story').html(questions[step][0]);
	$('button[value="option1"]').text(questions[step][1]);
	$('button[value="option2"]').text(questions[step][2]);
}

function centerWrapper() {
	$('#wrapper').css({
		'position': 'absolute',
		'left': '50%',
		'top': '50%',
		'margin-left': -$('#wrapper').outerWidth()/2,
		'margin-top': -$('#wrapper').outerHeight()/2,
	});
}

// The height is set to auto first to match the changing text within the button.
function matchButtonHeightAndCenterWrapper() {
	$('button')
		.css('height', 'auto')
		.css('height', Math.max( $('button[value="option1"]').outerHeight(), $('button[value="option2"]').outerHeight() ) );

	centerWrapper();
}

function setupButton(optionNum) {
	$('button[value="option' + optionNum + '"]').click(function() {
		step = questions[step][optionNum + 2];

		if(step == "SUCCESS") screenSuccess();
		else if(step == "GAMEOVER") screenGameOver();
		else screenStep();

		matchButtonHeightAndCenterWrapper();
	});
}

function main() {
	setupButton(1);
	setupButton(2);
	screenStep();
	matchButtonHeightAndCenterWrapper();
}

$(main);