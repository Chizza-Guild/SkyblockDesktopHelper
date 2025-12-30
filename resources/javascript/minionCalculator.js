Neutralino.init();

async function loadMinionData() {
  try {
    // Read the JSON file as text
    const fileContents = await Neutralino.filesystem.readFile(
      "/resources/json/minionData.json"
    );

    // Parse JSON into a JS object
    const minionData = JSON.parse(fileContents);

    // Print the data
    console.log("Minion Data Loaded:");
    console.log(minionData);

  } catch (err) {
    console.error("Failed to load minionData.json:", err);
  }
}


