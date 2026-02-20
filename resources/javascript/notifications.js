const PROJECT_REF = "qrhswmwyccpzgjbjwrpz";
const CREATE_URL = `https://${PROJECT_REF}.supabase.co/functions/v1/create-private-channel`;

// If your Edge Function requires auth, fill this in (anon key is ok for many functions,
// service role should ONLY be used server-side, not in a client app).
// const SUPABASE_ANON_KEY = "YOUR_ANON_KEY";

function normalizePlayerIds(input) {
  // Accepts: string, number, array of strings/numbers
  if (Array.isArray(input)) return input.flat().map(String).filter(Boolean);
  if (input === null || input === undefined) return [];
  return [String(input)].filter(Boolean);
}

async function createDiscordChannel(playerIdsInput) {
  const playerIds = normalizePlayerIds(playerIdsInput);

  if (playerIds.length === 0) {
    throw new Error("createDiscordChannel: playerIds is empty");
  }

  const res = await fetch(CREATE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // Uncomment if needed:
      // "apikey": SUPABASE_ANON_KEY,
      // "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ playerIds }),
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }

  console.log("create response:", res.status, data);

  if (!res.ok) {
    throw new Error(`create failed ${res.status}: ${text}`);
  }

  if (!data.webhookUrl) {
    throw new Error(`create succeeded but missing webhookUrl: ${text}`);
  }

  // Welcome message
  await sendDiscordMessage(
    `Hello 👋, Your private notifications channel is ready! 🎉\nWelcome from the Chizza Skyblock Helper Team!`,
    data.webhookUrl
  );

  return data.webhookUrl;
}

async function sendDiscordMessage(content, webhookUrl = privateWebhookURLVar, pingUser = true) {
  const url = String(webhookUrl ?? "").trim();
  if (!url || url === "null" || url === "undefined") {
    throw new Error("No webhook URL set. Create the private channel first.");
  }

  const msg = pingUser ? `<@${discordIdVar}> ${content}` : content;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: msg }),
  });

  if (!res.ok) {
    throw new Error(`Webhook failed: ${res.status} ${await res.text()}`);
  }
}

async function makePrivateDiscordChannel() {
  // discordIdVar is a string → normalizePlayerIds will wrap it correctly
  privateWebhookURLVar = await createDiscordChannel(discordIdVar);

  db.run("UPDATE user_info SET privateWebhookURL = ? WHERE id = 1", [privateWebhookURLVar]);
  await saveDb();

  console.log("Discord channel created and webhook URL saved:", privateWebhookURLVar);
}

async function sendNotification(title, body, webhookUrl = privateWebhookURLVar, ignoreSettings = false) {
  await Neutralino.os.showNotification(`${title}`, `${body}`);

  if (discordNotificationVar == 1 || ignoreSettings) {
    const url = String(webhookUrl ?? "").trim();

    if (!url || url === "null" || url === "undefined") {
      webhookUrl = await createDiscordChannel(discordIdVar);
      privateWebhookURLVar = webhookUrl;

      db.run("UPDATE user_info SET privateWebhookURL = ? WHERE id = 1", [webhookUrl]);
      await saveDb();

      console.log("Auto-created Discord channel and saved webhook URL:", webhookUrl);
    }

    await sendDiscordMessage(`${title}\n${body}`, webhookUrl);
  }
}

async function sendTestNotification() {
  await sendNotification(
    "TEST!",
    "this is a test, test test test. The quick brown fox jumped over the lazy dog."
  );
}
