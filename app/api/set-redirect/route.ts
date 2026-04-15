import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const { redirect } = await request.json();
    
    if (!redirect || typeof redirect !== "string") {
      return NextResponse.json(
        { error: "Invalid redirect path" },
        { status: 400 }
      );
    }

    // Set cookie that expires in 10 minutes
    const cookieStore = await cookies();
    cookieStore.set("redirect", redirect, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 10, // 10 minutes
      path: "/",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to set redirect cookie" },
      { status: 500 }
    );
  }
}
