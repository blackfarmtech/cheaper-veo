import { headers } from "next/headers";

import { auth, type AuthSession } from "@/lib/auth";

export async function getSession(): Promise<AuthSession> {
  return auth.api.getSession({ headers: await headers() });
}

export type SessionUser = NonNullable<AuthSession>["user"];

const GUEST_USER: SessionUser = {
  id: "guest",
  email: "guest@example.com",
  name: "Convidado",
  image: null,
  emailVerified: false,
  createdAt: new Date(0),
  updatedAt: new Date(0),
} as SessionUser;

export async function requireUser(_redirectTo: string = "/login"): Promise<SessionUser> {
  const session = await getSession();
  return session?.user ?? GUEST_USER;
}
