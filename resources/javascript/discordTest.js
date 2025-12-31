const PROJECT_REF = "qrhswmwyccpzgjbjwrpz";
const CREATE_URL = `https://${PROJECT_REF}.supabase.co/functions/v1/create-private-channel`;

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

  await sendDiscordMessage(`Hello 👋, Your private notifications channel is ready! 🎉\n Welcome from the Chizza Hypixel Helper Developer Team!`, data.webhookUrl);
  return data.webhookUrl;
}
async function sendDiscordMessage( message, webhookUrl = privateWebhookURLVar) {
    let content = `<@${discordIdVar}> ${message}`
    const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
    });

    if (!res.ok) {
        throw new Error(`Webhook failed: ${res.status} ${await res.text()}`);
    }
}

// Example button handler
async function makeDiscordChannel() {

}
 