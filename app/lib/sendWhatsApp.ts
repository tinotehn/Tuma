// WhatsApp Cloud API senders: text, reply BUTTONS (max 3), LIST menus (max 10 rows), PDF documents.
const phoneId = () => process.env.WHATSAPP_PHONE_NUMBER_ID ?? process.env.WHATSAPP_PHONE_ID;
const base = () => `https://graph.facebook.com/${process.env.WHATSAPP_API_VERSION ?? "v21.0"}/${phoneId()}`;
const auth = () => ({ Authorization: `Bearer ${process.env.WHATSAPP_TOKEN ?? ""}` });

async function post(path: string, body: object): Promise<boolean> {
  try {
    const r = await fetch(`${base()}${path}`, { method: "POST", headers: { ...auth(), "Content-Type": "application/json" }, body: JSON.stringify({ messaging_product: "whatsapp", ...body }), signal: AbortSignal.timeout(10000) });
    if (!r.ok) console.error("whatsapp send failed", r.status, (await r.text()).slice(0, 300)); // never fail silently: a lost "payment confirmed" is a support ticket
    return r.ok;
  } catch (e) { console.error("whatsapp send error", (e as Error).message); return false; }
}
export const sendText = (to: string, text: string) => post("/messages", { to, type: "text", text: { body: text.slice(0, 4000) } });

export const sendButtons = (to: string, text: string, buttons: { id: string; title: string }[]) =>
  post("/messages", { to, type: "interactive", interactive: { type: "button", body: { text: text.slice(0, 1000) },
    action: { buttons: buttons.slice(0, 3).map(b => ({ type: "reply", reply: { id: b.id.slice(0, 256), title: b.title.slice(0, 20) } })) } } });

export const sendList = (to: string, text: string, buttonLabel: string, rows: { id: string; title: string; description?: string }[], section = "Options") =>
  post("/messages", { to, type: "interactive", interactive: { type: "list", body: { text: text.slice(0, 1000) },
    action: { button: buttonLabel.slice(0, 20), sections: [{ title: section.slice(0, 24), rows: rows.slice(0, 10).map(r => ({ id: r.id.slice(0, 200), title: r.title.slice(0, 24), ...(r.description ? { description: r.description.slice(0, 72) } : {}) })) }] } } });

export async function sendDocument(to: string, bytes: Uint8Array, filename: string, caption?: string): Promise<boolean> {
  try {
    const fd = new FormData(); fd.append("messaging_product", "whatsapp"); fd.append("type", "application/pdf");
    fd.append("file", new Blob([bytes as BlobPart], { type: "application/pdf" }), filename);
    const up = await fetch(`${base()}/media`, { method: "POST", headers: auth(), body: fd, signal: AbortSignal.timeout(15000) });
    if (!up.ok) { console.error("whatsapp media upload failed", up.status); return false; }
    const { id } = await up.json();
    return post("/messages", { to, type: "document", document: { id, filename, ...(caption ? { caption: caption.slice(0, 1000) } : {}) } });
  } catch (e) { console.error("whatsapp document error", (e as Error).message); return false; }
}
