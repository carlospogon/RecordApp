import { NextResponse } from "next/server";
import { sendListInviteEmail } from "@/lib/email/send-list-invite-email";
import { env } from "@/lib/env";
import { sendPushNotificationToUsers } from "@/lib/push/send-push-notification";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAccessibleListForUser } from "@/lib/supabase/shared-access";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type AddMemberPayload = {
  email?: string;
};

type DeleteMemberPayload = {
  email?: string;
};

function buildShareCode() {
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}

function getDisplayName(email: string | undefined, metadata: Record<string, unknown> | undefined) {
  return (
    (typeof metadata?.full_name === "string" && metadata.full_name.trim()) ||
    (typeof metadata?.name === "string" && metadata.name.trim()) ||
    (email?.split("@")[0] ?? "Usuario")
  );
}

function buildAppBaseUrl(request: Request) {
  if (env.APP_PUBLIC_URL) {
    return env.APP_PUBLIC_URL;
  }

  const url = new URL(request.url);
  return url.origin;
}

async function findUserByEmail(admin: ReturnType<typeof createSupabaseAdminClient>, email: string) {
  let page = 1;
  const perPage = 200;
  const normalizedEmail = email.trim().toLowerCase();

  while (true) {
    const response = await admin.auth.admin.listUsers({
      page,
      perPage
    });
    const users = response.data.users ?? [];
    const match = users.find((candidate) => candidate.email?.trim().toLowerCase() === normalizedEmail) ?? null;

    if (match) {
      return match;
    }

    if (users.length < perPage) {
      return null;
    }

    page += 1;
  }
}

export async function GET(_: Request, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accessibleList = await getAccessibleListForUser(id, user.id);

  if (!accessibleList?.id) {
    return NextResponse.json({ error: "No tienes acceso a esta lista." }, { status: 403 });
  }

  const { data: memberRows, error } = await admin
    .from("shopping_list_members")
    .select("user_id, role")
    .eq("list_id", id)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const members = await Promise.all(
    (memberRows ?? []).map(async (member) => {
      const authUser = await admin.auth.admin.getUserById(member.user_id);
      const authMember = authUser.data.user;
      const metadata = (authMember?.user_metadata ?? {}) as Record<string, unknown>;

      return {
        userId: member.user_id,
        displayName: getDisplayName(authMember?.email, metadata),
        email: authMember?.email ?? null,
        role: member.role
      };
    })
  );

  const { data: pendingInviteRows, error: pendingInvitesError } = await admin
    .from("shopping_list_email_invites")
    .select("id, email, share_code, status, created_at, accepted_at")
    .eq("list_id", id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (pendingInvitesError) {
    return NextResponse.json({ error: pendingInvitesError.message }, { status: 500 });
  }

  const pendingInvites = (pendingInviteRows ?? []).map((invite) => ({
    id: invite.id,
    email: invite.email,
    shareCode: invite.share_code,
    status: invite.status,
    createdAt: invite.created_at,
    acceptedAt: invite.accepted_at
  }));

  return NextResponse.json({ members, pendingInvites });
}

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const body = (await request.json()) as AddMemberPayload;
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!email) {
    return NextResponse.json({ error: "Necesitamos un email para añadir a alguien." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accessibleList = await getAccessibleListForUser(id, user.id);

  if (!accessibleList?.id) {
    return NextResponse.json({ error: "No tienes acceso a esta lista." }, { status: 403 });
  }

  if (accessibleList.ownerId !== user.id) {
    return NextResponse.json({ error: "Solo el propietario puede añadir participantes." }, { status: 403 });
  }

  const actorMetadata = (user.user_metadata ?? {}) as Record<string, unknown>;
  const actorDisplayName = getDisplayName(user.email, actorMetadata);
  const { data: listRow } = await admin.from("shopping_lists").select("title").eq("id", id).maybeSingle();
  const listTitle = typeof listRow?.title === "string" ? listRow.title : "tu lista";

  const targetUser = await findUserByEmail(admin, email);

  if (!targetUser?.id) {
    let shareCode: string;
    const { data: existingInvite } = await admin
      .from("shopping_list_invites")
      .select("share_code")
      .eq("list_id", id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingInvite?.share_code) {
      shareCode = existingInvite.share_code;
    } else {
      const createdShareCode = buildShareCode();
      const { data: createdInvite, error: inviteError } = await admin
        .from("shopping_list_invites")
        .insert({
          list_id: id,
          invited_by: user.id,
          share_code: createdShareCode
        })
        .select("share_code")
        .single();

      if (inviteError || !createdInvite?.share_code) {
        return NextResponse.json({ error: inviteError?.message ?? "No se pudo generar la invitación." }, { status: 500 });
      }

      shareCode = createdInvite.share_code;
    }

    await admin.from("shopping_lists").update({ shared: true }).eq("id", id);

    const inviteLink = `${buildAppBaseUrl(request)}/auth?mode=signup&invite=${encodeURIComponent(shareCode)}`;

    try {
      await sendListInviteEmail({
        to: email,
        ownerName: actorDisplayName,
        listName: listTitle,
        appLink: inviteLink
      });
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "No se pudo enviar la invitación por email." },
        { status: 500 }
      );
    }

    const nowIso = new Date().toISOString();
    const { data: persistedInvite, error: persistedInviteError } = await admin
      .from("shopping_list_email_invites")
      .upsert(
        {
          list_id: id,
          invited_by: user.id,
          email,
          share_code: shareCode,
          status: "pending",
          created_at: nowIso,
          accepted_at: null
        },
        { onConflict: "list_id,email" }
      )
      .select("id, email, share_code, status, created_at, accepted_at")
      .single();

    if (persistedInviteError || !persistedInvite) {
      return NextResponse.json({ error: persistedInviteError?.message ?? "No se pudo guardar la invitación pendiente." }, { status: 500 });
    }

    return NextResponse.json({
      invitedByEmail: true,
      email,
      listShared: true,
      pendingInvite: {
        id: persistedInvite.id,
        email: persistedInvite.email,
        shareCode: persistedInvite.share_code,
        status: persistedInvite.status,
        createdAt: persistedInvite.created_at,
        acceptedAt: persistedInvite.accepted_at
      }
    });
  }

  const targetMetadata = (targetUser.user_metadata ?? {}) as Record<string, unknown>;
  const member = {
    userId: targetUser.id,
    displayName: getDisplayName(targetUser.email, targetMetadata),
    email: targetUser.email ?? email,
    role: targetUser.id === accessibleList.ownerId ? "owner" : "editor"
  } as const;

  const { data: existingMembership } = await admin
    .from("shopping_list_members")
    .select("user_id, role")
    .eq("list_id", id)
    .eq("user_id", targetUser.id)
    .maybeSingle();

  if (!existingMembership?.user_id) {
    const { error: membershipError } = await admin.from("shopping_list_members").upsert(
      {
        list_id: id,
        user_id: targetUser.id,
        role: member.role
      },
      { onConflict: "list_id,user_id" }
    );

    if (membershipError) {
      return NextResponse.json({ error: membershipError.message }, { status: 500 });
    }
  }

  await admin.from("shopping_list_email_invites").delete().eq("list_id", id).eq("email", email);

  await admin.from("shopping_lists").update({ shared: true }).eq("id", id);

  if (!existingMembership?.user_id && targetUser.id !== user.id) {
    void sendPushNotificationToUsers([targetUser.id], {
      title: "RecordApp",
      body: `${actorDisplayName} te ha añadido a ${listTitle}.`,
      url: `/app?list=${id}&tab=lista`
    }).catch(() => undefined);
  }

  return NextResponse.json({
    member,
    added: !existingMembership?.user_id,
    listShared: true
  });
}

export async function DELETE(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const body = (await request.json()) as DeleteMemberPayload;
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!email) {
    return NextResponse.json({ error: "Necesitamos el email de la invitación que quieres cancelar." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accessibleList = await getAccessibleListForUser(id, user.id);

  if (!accessibleList?.id) {
    return NextResponse.json({ error: "No tienes acceso a esta lista." }, { status: 403 });
  }

  if (accessibleList.ownerId !== user.id) {
    return NextResponse.json({ error: "Solo el propietario puede cancelar invitaciones." }, { status: 403 });
  }

  const { error } = await admin.from("shopping_list_email_invites").delete().eq("list_id", id).eq("email", email);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, email });
}
