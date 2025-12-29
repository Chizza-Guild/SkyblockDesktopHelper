const minions = [
  "Cobblestone",
  "Coal",
  "Iron",
  "Gold",
  "Diamond",
  "Emerald",
  "Redstone",
  "Lapis",
  "Quartz",
  "Obsidian",
  "Glowstone",
  "Gravel",
  "Ice",
  "Sand",
  "Clay",
  "Snow",
  "Mycelium",
  "End Stone",
  "Wheat",
  "Carrot",
  "Potato",
  "Pumpkin",
  "Melon",
  "Cocoa Beans",
  "Sugar Cane",
  "Nether Wart",
  "Cactus",
  "Mushroom",
  "Flower",
  "Fishing",
  "Zombie",
  "Skeleton",
  "Creeper",
  "Spider",
  "Cave Spider",
  "Blaze",
  "Enderman",
  "Ghast",
  "Slime",
  "Cow",
  "Pig",
  "Chicken",
  "Sheep",
  "Rabbit",
  "Oak",
  "Spruce",
  "Birch",
  "Dark Oak",
  "Acacia",
  "Jungle"
];

const select = document.getElementById("minionSelect");

// Optional placeholder
const placeholder = document.createElement("option");
placeholder.value = "";
placeholder.textContent = "Select a minion";
placeholder.disabled = true;
placeholder.selected = true;
select.appendChild(placeholder);

// Populate options
for (const minion of minions) {
  const option = document.createElement("option");
  option.value = minion;
  option.textContent = minion;
  select.appendChild(option);
}
