/*
TODO List:

Get in all mutations info in a json. Download all icons:
Mutation Name - Icon Webp (Check if we can ditch png) - Growing Conditions - Rarity - Harvesting Rewards - 
Copper when analysed - Aura buffs - Growth Phase Amount - If it needs water - Short ID - Size - Growth Surface
In a separate place: Planted time in unix - Unlocked by player

Create a matrix where each space is a plot. We will need three since three greenhouse slots. Save these to the
database somehow.

Feature idea: Show how much time until next growth phase.
Feature idea: Show what crops can currently grow in a specific plot with details, and why can't they grow.
Feature idea: A helper to guide you to the current goal (Sundial / Crow Pet / Rose Dragon / Coins / Unlock All / None)
Feature idea: Make it fill the remaining space most optimally (profit).

*/

let greenHouseNo1: number = [5][5]; // Fill this with 0, the middle will have 1 in a plus shape.
// I forgot how large was the greenhouse so i will change "5"
// Later the greenhouse plot data will be loaded from the database.
// 0: Not Unlocked
// 1: Unlocked but empty plots
// 2+: The planted crops specific ID