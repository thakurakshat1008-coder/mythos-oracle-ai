import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

type OAuthDetails = {
  client?: { name?: string; redirect_uri?: string } | null;
  scope?: string | null;
  redirect_url?: string | null;
  redirect_to?: string | null;
};

type OAuthResult = { data: OAuthDetails | null; error: { message: string } | null };

type OAuthApi = {
  getAuthorizationDetails: (id: string) => Promise<OAuthResult>;
  approveAuthorization: (id: string) => Promise<OAuthResult>;
  denyAuthorization: (id: string) => Promise<OAuthResult>;
};

function oauthApi(): OAuthApi {
  return (supabase.auth as unknown as { oauth: OAuthApi }).oauth;
}

const SCOPE_LABELS: Record<string, string> = {
  openid: "Confirm your identity",
  email: "Share your email address",
  profile: "Share your basic profile",
};

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s.authorization_id === "string" ? s.authorization_id : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("Missing authorization_id");
    const { data } = await supabase.auth.getSession();
    const next = location.pathname + location.searchStr;
    if (!data.session) throw redirect({ to: "/login", search: { next } });
  },
  loader: async ({ location }) => {
    const authorizationId = new URLSearchParams(location.search).get("authorization_id")!;
    const { data, error } = await oauthApi().getAuthorizationDetails(authorizationId);
    if (error) throw new Error(error.message);
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) throw redirect({ href: immediate });
    const { data: userData } = await supabase.auth.getUser();
    return { details: data, email: userData.user?.email ?? null };
  },
  component: Consent,
  errorComponent: ({ error }) => (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="glass-panel max-w-md rounded-2xl p-8">
        <h1 className="font-display text-xl text-primary">Authorization unavailable</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {String((error as Error)?.message ?? error)}
        </p>
      </div>
    </main>
  ),
  head: () => ({
    meta: [
      { title: "Authorize access — Mythos AI Hub" },
      {
        name: "description",
        content: "Review and approve an AI client's request to use Mythos tools as you.",
      },
      { property: "og:title", content: "Authorize access — Mythos AI Hub" },
      {
        property: "og:description",
        content: "Review and approve an AI client's request to use Mythos tools as you.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function Consent() {
  const { details, email } = Route.useLoaderData();
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clientName = details?.client?.name ?? "an app";
  const scopes = (details?.scope ?? "").split(/\s+/).filter(Boolean);

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    const api = oauthApi();
    const { data, error } = approve
      ? await api.approveAuthorization(authorization_id)
      : await api.denyAuthorization(authorization_id);
    if (error) {
      setBusy(false);
      setError(error.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("No redirect returned by the authorization server.");
      return;
    }
    window.location.href = target;
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-16">
      <div className="glass-panel w-full max-w-md rounded-2xl p-8">
        <h1 className="font-display text-2xl text-primary">
          Connect {clientName} to Mythos AI Hub
        </h1>
        {email && (
          <p className="mt-2 text-sm text-muted-foreground">Signed in as {email}</p>
        )}
        <p className="mt-4 text-sm">
          {clientName} will be able to call Mythos&apos;s enabled tools while you are signed in.
        </p>

        {details?.client?.redirect_uri && (
          <p className="mt-3 break-all text-xs text-muted-foreground">
            Redirects to {details.client.redirect_uri}
          </p>
        )}

        {scopes.length > 0 && (
          <ul className="mt-5 space-y-2 text-sm">
            {scopes.map((s) => (
              <li key={s} className="text-muted-foreground">
                • {SCOPE_LABELS[s] ?? `Additional permission requested: ${s}`}
              </li>
            ))}
          </ul>
        )}

        <p className="mt-5 text-xs text-muted-foreground">
          This does not bypass this app&apos;s permissions or backend policies.
        </p>

        {error && (
          <p role="alert" className="mt-4 text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="mt-6 flex gap-3">
          <Button disabled={busy} onClick={() => decide(true)} className="flex-1">
            Approve
          </Button>
          <Button
            disabled={busy}
            variant="secondary"
            onClick={() => decide(false)}
            className="flex-1"
          >
            Cancel connection
          </Button>
        </div>
      </div>
    </main>
  );
}
