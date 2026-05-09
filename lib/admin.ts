import "server-only";

import { redirect, notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export interface AdminContext {
  id: string;
  email: string;
}

/**
 * Loads the current user's role from the DB. Cheap (single indexed lookup).
 * Returns null when there's no logged-in user.
 */
async function loadCurrentRole(): Promise<{ id: string; email: string; role: "user" | "admin" } | null> {
  const session = await getSession();
  if (!session?.user) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, role: true },
  });
  return user;
}

/**
 * Throws by redirecting unauthenticated users to /login, and 404'ing logged-in
 * users who aren't admins. The 404 (instead of 403) avoids disclosing that
 * /admin exists to non-admins.
 */
export async function requireAdmin(): Promise<AdminContext> {
  const user = await loadCurrentRole();
  if (!user) {
    redirect("/login?callbackURL=/admin");
  }
  if (user.role !== "admin") {
    notFound();
  }
  return { id: user.id, email: user.email };
}

/**
 * Soft check used in pages that want to render different UI for admins
 * without redirecting. Doesn't throw.
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  const user = await loadCurrentRole();
  return user?.role === "admin";
}
