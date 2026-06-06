import { env } from "@/lib/env";

type SendListInviteEmailInput = {
  to: string;
  ownerName: string;
  listName: string;
  appLink: string;
};

export async function sendListInviteEmail({ to, ownerName, listName, appLink }: SendListInviteEmailInput) {
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM_ADDRESS) {
    throw new Error("Falta configurar RESEND_API_KEY o EMAIL_FROM_ADDRESS para enviar invitaciones por email.");
  }

  const safeOwnerName = ownerName.trim() || "Alguien";
  const safeListName = listName.trim() || "tu lista";
  const subject = `${safeOwnerName} te ha invitado a una lista en RecordApp`;
  const text = `¡Hola! ${safeOwnerName} te ha añadido a la lista «${safeListName}» en RecordApp. Puedes acceder desde aquí: ${appLink}. RecordApp te ayuda a organizar tus compras de forma sencilla, compartida y sin complicaciones.`;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM_ADDRESS,
      to: [to],
      subject,
      text,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2a24;">
          <p>¡Hola!</p>
          <p><strong>${escapeHtml(safeOwnerName)}</strong> te ha añadido a la lista <strong>«${escapeHtml(safeListName)}»</strong> en RecordApp.</p>
          <p>
            Puedes acceder desde aquí:
            <a href="${appLink}" style="color: #4a6150; font-weight: 600;">abrir invitación</a>.
          </p>
          <p>RecordApp te ayuda a organizar tus compras de forma sencilla, compartida y sin complicaciones.</p>
        </div>
      `
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "No se pudo enviar la invitación por email.");
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
