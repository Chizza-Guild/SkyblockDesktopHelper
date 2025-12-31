const PROJECT_REF = "qrhswmwyccpzgjbjwrpz";

const CREATE_URL = `https://${PROJECT_REF}.supabase.co/functions/v1/create-private-channel`;
const SEND_URL   = `https://${PROJECT_REF}.supabase.co/functions/v1/hello`; // or whatever you named it

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

  return data.webhookUrl;
}


async function sendDiscordMessage(webhookUrl, content) {
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
  const webhookUrl = await createDiscordChannel(discordIdVar);
  console.log("Webhook:", webhookUrl);

  await sendDiscordMessage(webhookUrl, `<@${playerId}>\n Hello 👋, Your private notifications channel is ready! 🎉\n Welcome from the Chizza Hypixel Helper Developer Team!`);
  console.log("Sent message!");
}
