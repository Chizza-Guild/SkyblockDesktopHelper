/*
TODO List:

Get in all mutations info in a json. Download all icons:
Mutation Name - Icon Webp (Check if we can ditch png) - Growing Conditions - Rarity - Harvesting Rewards - 
Copper when analysed - Aura buffs - Growth Phase Amount - If it needs water - Short ID - Size - Growth Surface
In a separate place: Planted time in unix - Unlocked by player

Save greenhouse layouts to the database on change.

Feature idea: Show how much time until next growth phase.
Feature idea: Show what crops can currently grow in a specific plot with details, and why can't they grow.
Feature idea: A helper to guide you to the current goal (Sundial / Crow Pet / Rose Dragon / Coins / Unlock All / None)
Feature idea: Make it fill the remaining space most optimally (profit).

*/

let greenhouseNo1 = Array.from({ length: 10 }, () => Array.from({ length: 10 }, () => 0));
let greenhouseNo2 = Array.from({ length: 10 }, () => Array.from({ length: 10 }, () => 0));
let greenhouseNo3 = Array.from({ length: 10 }, () => Array.from({ length: 10 }, () => 0));

function unlockGreenhouse(greenhouse) {
	greenhouse[4][4] = 1;
	greenhouse[4][5] = 1;
	greenhouse[5][5] = 1;
	greenhouse[5][4] = 1;
	greenhouse[3][4] = 1;
	greenhouse[3][5] = 1;
	greenhouse[6][4] = 1;
	greenhouse[6][5] = 1;
	greenhouse[4][3] = 1;
	greenhouse[4][6] = 1;
	greenhouse[5][3] = 1;
	greenhouse[5][6] = 1;
}

function displayGreenhouse(greenhouse) {
	document.getElementById("greenhouseLayout").innerText = "";

	for (let i = 0; i < 10; i++) {
		for (let j = 0; j < 10; j++) {
			document.getElementById("greenhouseLayout").innerText += `${greenhouse[i][j]}${j == 9 ? "\n" : ","}`;
		}
	}
}

// Immediately unlock the first plots of the first greenhouse and display it
unlockGreenhouse(greenhouseNo1);

// When you unlock a greenhouse, the middle will be automatically unlocked.
// Later the greenhouse plot data will be loaded from the database.
// 0: Not Unlocked
// 1: Unlocked but empty plots
// 2+: The planted crops specific ID
