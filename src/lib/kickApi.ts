export async function checkKickStatus(username: string): Promise<boolean> {
  try {
    const res = await fetch(`https://kick.com/api/v1/channels/${username}`);
    if (!res.ok) return false;
    const data = await res.json();
    return data?.livestream !== null;
  } catch (err) {
    console.error("Kick API error:", err);
    return false;
  }
}
