import { cookies } from "next/headers";
import crypto from "crypto";

const COOKIE = "company_admin";

function expectedToken() {
  return crypto.createHash("sha256")
    .update(`${process.env.ADMIN_EMAIL}:${process.env.ADMIN_PASSWORD}`)
    .digest("hex");
}

export async function isAdmin() {
  const store = await cookies();
  return store.get(COOKIE)?.value === expectedToken();
}

export async function setAdminCookie() {
  const store = await cookies();
  store.set(COOKIE, expectedToken(), {
    httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production",
    path: "/", maxAge: 60 * 60 * 8
  });
}

export async function clearAdminCookie() {
  const store = await cookies();
  store.delete(COOKIE);
}
