import { NextResponse } from "next/server";
import pool from "@/app/lib/db";

export async function POST(req) {
  try {
    const { username, password } = await req.json();
    console.log("🔹 Login attempt:", username, password);

    const result = await pool.query(
      'SELECT id, username, password_hash, role FROM users WHERE username = $1',
      [username]
    );

    const user = result.rows[0];
    if (!user || user.password_hash !== password) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }

    console.log("✅ Login successful for user:", username);
    return NextResponse.json({ user });
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
