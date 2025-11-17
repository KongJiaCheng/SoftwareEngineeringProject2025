// app/api/auth/login/route.js
import { Pool } from "pg";
import crypto from "crypto";

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "dam_system",
  password: "software",
  port: 5432,
});

// Verify Django pbkdf2_sha256 password hashes
function verifyDjangoPassword(plainPassword, djangoHash) {
  if (!djangoHash || typeof djangoHash !== "string") return false;

  const parts = djangoHash.split("$");
  if (parts.length !== 4) return false;

  const [algorithm, iterationsStr, salt, storedHash] = parts;

  if (algorithm !== "pbkdf2_sha256") return false;

  const iterations = parseInt(iterationsStr, 10);
  if (!iterations) return false;

  // Django uses 32-byte key length for sha256 by default
  const keyLen = Buffer.from(storedHash, "base64").length;

  const derived = crypto
    .pbkdf2Sync(plainPassword, salt, iterations, keyLen, "sha256")
    .toString("base64");

  // timing-safe comparison
  return crypto.timingSafeEqual(
    Buffer.from(storedHash, "base64"),
    Buffer.from(derived, "base64")
  );
}

export async function POST(req) {
  try {
    const { username, password } = await req.json();

    console.log("🔐 Login attempt:", { username, password: "***" });

    if (!username || !password) {
      return Response.json(
        {
          success: false,
          error: "Username and password are required",
        },
        { status: 400 }
      );
    }

    const userResult = await pool.query(
      `SELECT 
         au.id, 
         au.username, 
         au.password, 
         au.email, 
         au.first_name, 
         au.last_name,
         au.is_superuser,
         au.is_staff,
         au.is_active,
         rup.role
       FROM auth_user au
       LEFT JOIN roles_userprofile rup ON au.id = rup.user_id
       WHERE au.username = $1 AND au.is_active = true`,
      [username]
    );

    console.log("📊 User query result:", userResult.rows.length, "users found");

    if (userResult.rows.length === 0) {
      console.log("❌ User not found in database");
      return Response.json(
        {
          success: false,
          error: "Invalid username or password",
        },
        { status: 401 }
      );
    }

    const user = userResult.rows[0];

    const passwordsMatch = verifyDjangoPassword(password, user.password);

    console.log("👤 User found:", {
      username: user.username,
      storedPasswordPrefix: user.password.slice(0, 20) + "...",
      inputPassword: "***",
      passwordsMatch,
    });

    if (passwordsMatch) {
      console.log("✅ Password matches (Django hash)!");

      await pool.query("UPDATE auth_user SET last_login = NOW() WHERE id = $1", [
        user.id,
      ]);

      const userResponse = {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role || "user",
        isSuperuser: user.is_superuser,
        isStaff: user.is_staff,
        isActive: user.is_active,
      };

      return Response.json({
        success: true,
        user: userResponse,
      });
    } else {
      console.log("❌ Password does not match (Django hash)");
      return Response.json(
        {
          success: false,
          error: "Invalid username or password",
        },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error("💥 Database error:", error);
    return Response.json(
      {
        success: false,
        error: "Internal server error: " + error.message,
      },
      { status: 500 }
    );
  }
}
