const PROJECT_REF = "qrhswmwyccpzgjbjwrpz";
const CREATE_URL = `https://qrhswmwyccpzgjbjwrpz.supabase.co/functions/v1/create-private-channel`;

async function createDiscordChannel(playerId) {
  const res = await fetch(CREATE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ playerId }),
  });

  const text = await res.text(); // read ONCE
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

  await sendDiscordMessage(`Hello 👋, Your private notifications channel is ready! 🎉\n Welcome from the Chizza Hypixel Helper Developer Team!`, data.webhookUrl, true);
  return data.webhookUrl;
}
async function sendDiscordMessage( content, webhookUrl = privateWebhookURLVar) {
    const url = String(webhookUrl ?? "").trim();
  if (!url || url === "null" || url === "undefined") {
    throw new Error("No webhook URL set. Create the private channel first.");
  }

  const message = `<@${discordIdVar}> ${content}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: message }), 
  });

  if (!res.ok) {
    throw new Error(`Webhook failed: ${res.status} ${await res.text()}`);
  }
}

async function sendTestNotification() {
  await sendNotification("TEST!", "this is a test, test test test. The quick brown fox jumped over the lazy dog.")
}

// Example button handler
async function makeDiscordChannel() {
    privateWebhookURLVar = await createDiscordChannel(discordIdVar);
}

async function sendNotification(title, body, webhookUrl = privateWebhookURLVar, ignoreSettings = false) {

  
	await Neutralino.os.showNotification(`${title}`, `${body}`);
	if (discordNotificationVar == 1 || ignoreSettings) {
    if (webhookUrl == null) {
      webhookUrl = await createDiscordChannel(discordIdVar);
      await sendDiscordMessage(`${title}\n${body}`, webhookUrl);
    } else {
      await sendDiscordMessage(`${title}\n${body}`, webhookUrl);
    }
	}
}


 