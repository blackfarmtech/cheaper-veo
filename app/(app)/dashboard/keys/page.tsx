import { KeyRound } from "lucide-react";

import { requireUser } from "@/lib/session";
import { listApiKeys } from "@/lib/api-key";

import { KeyCreateForm } from "@/components/dashboard/KeyCreateForm";
import { RevokeKeyButton } from "@/components/dashboard/RevokeKeyButton";
import { EmptyState } from "@/components/dashboard/EmptyState";

export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("en-US", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const dateTimeFmt = new Intl.DateTimeFormat("en-US", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const codeStyle: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: "12px",
  background: "rgba(0, 0, 0, 0.4)",
  padding: "1px 6px",
  borderRadius: "4px",
};

export default async function ApiKeysPage() {
  const user = await requireUser();
  const keys = await listApiKeys(user.id);

  return (
    <div className="space-y-10">
      <header className="space-y-1.5">
        <h1
          className="text-3xl font-semibold tracking-tight md:text-[2.25rem]"
          style={{ letterSpacing: "-0.024em" }}
        >
          API Keys
        </h1>
        <p className="text-[15px] text-secondary">
          Create keys to authenticate requests to the{" "}
          <code style={codeStyle}>/api/v1</code> endpoint. Use the header{" "}
          <code style={codeStyle}>Authorization: Bearer veo_…</code>.
        </p>
      </header>

      <KeyCreateForm />

      <section
        className="card overflow-hidden"
        style={{ padding: 0 }}
      >
        <div
          className="flex items-center justify-between px-7 py-5"
          style={{ borderBottom: "1px solid var(--color-border)" }}
        >
          <div>
            <h2 className="text-[17px] font-semibold tracking-tight">
              Your keys
            </h2>
            <p className="mt-0.5 text-[13px] text-secondary">
              {keys.length === 0
                ? "No keys created yet."
                : `${keys.length} ${keys.length === 1 ? "key" : "keys"} total.`}
            </p>
          </div>
        </div>

        {keys.length === 0 ? (
          <div className="p-7">
            <EmptyState
              icon={KeyRound}
              title="No keys created yet"
              description="Generate your first key above to start using the API."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr
                  className="text-[11px] uppercase text-muted"
                  style={{
                    background: "rgba(255, 255, 255, 0.025)",
                    borderBottom: "1px solid var(--color-border)",
                    letterSpacing: "0.08em",
                  }}
                >
                  <th className="px-7 py-3.5 font-medium">Name</th>
                  <th className="px-7 py-3.5 font-medium">Prefix</th>
                  <th className="px-7 py-3.5 font-medium">
                    Last used
                  </th>
                  <th className="px-7 py-3.5 font-medium">Created on</th>
                  <th className="px-7 py-3.5 font-medium">Status</th>
                  <th className="px-7 py-3.5 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {keys.map((key, i) => {
                  const revoked = key.revokedAt !== null;
                  return (
                    <tr
                      key={key.id}
                      className="transition-colors hover:bg-white/[0.02]"
                      style={
                        i !== keys.length - 1
                          ? { borderBottom: "1px solid var(--color-border)" }
                          : undefined
                      }
                    >
                      <td className="px-7 py-4 font-medium">{key.name}</td>
                      <td
                        className="px-7 py-4 text-xs text-secondary"
                        style={{ fontFamily: "var(--font-mono)" }}
                      >
                        {key.prefix}…
                      </td>
                      <td className="px-7 py-4 text-secondary">
                        {key.lastUsedAt ? (
                          <span className="text-xs">
                            {dateTimeFmt.format(key.lastUsedAt)}
                          </span>
                        ) : (
                          <span className="text-xs text-muted">Never</span>
                        )}
                      </td>
                      <td className="px-7 py-4 text-xs text-secondary">
                        {dateFmt.format(key.createdAt)}
                      </td>
                      <td className="px-7 py-4">
                        {revoked ? (
                          <span
                            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                            style={{
                              border: "1px solid rgba(248, 113, 113, 0.4)",
                              background: "rgba(248, 113, 113, 0.10)",
                              color: "var(--color-danger)",
                            }}
                          >
                            <span
                              aria-hidden
                              className="h-1.5 w-1.5 rounded-full"
                              style={{ background: "var(--color-danger)" }}
                            />
                            Revoked
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                            style={{
                              border: "1px solid var(--color-border-accent)",
                              background: "rgba(162, 221, 0, 0.10)",
                              color: "var(--color-accent)",
                            }}
                          >
                            <span
                              aria-hidden
                              className="h-1.5 w-1.5 rounded-full"
                              style={{
                                background: "var(--color-accent)",
                                boxShadow:
                                  "0 0 8px rgba(162, 221, 0, 0.6)",
                              }}
                            />
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-7 py-4 text-right">
                        {revoked ? (
                          <span className="text-xs text-muted">—</span>
                        ) : (
                          <RevokeKeyButton id={key.id} name={key.name} />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
