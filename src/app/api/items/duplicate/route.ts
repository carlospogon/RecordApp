import { NextResponse } from "next/server";
import { findDuplicateNotice } from "@/lib/supabase/queries";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name");

  if (!name) {
    return NextResponse.json({ duplicateNotice: null });
  }

  try {
    const duplicateNotice = await findDuplicateNotice(name);
    return NextResponse.json({ duplicateNotice });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo revisar el historial.", duplicateNotice: null },
      { status: 500 }
    );
  }
}
