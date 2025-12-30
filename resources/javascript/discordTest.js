async function sendDiscordMessage() {
    await fetch("https://qrhswmwyccpzgjbjwrpz.functions.supabase.co/hello", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Hello from chizza skyblock helper" }),
    });
}