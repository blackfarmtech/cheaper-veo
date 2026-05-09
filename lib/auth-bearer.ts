import "server-only";

import { validateBearerKey, type ValidatedKey } from "./api-key";

const UNAUTHORIZED_BODY = JSON.stringify({
  error: { code: "UNAUTHORIZED", message: "Invalid or revoked API key." },
});

function unauthorizedResponse(): Response {
  return new Response(UNAUTHORIZED_BODY, {
    status: 401,
    headers: {
      "Content-Type": "application/json",
      "WWW-Authenticate": 'Bearer realm="veo"',
    },
  });
}

/**
 * Extracts the Bearer token from the request and validates it.
 * Throws a `Response` (401) when invalid — route handlers should let it propagate
 * and the catch block in the route turns it into the actual response.
 */
export async function requireBearerAuth(req: Request): Promise<ValidatedKey> {
  const header = req.headers.get("authorization");
  const result = await validateBearerKey(header);
  if (!result) {
    throw unauthorizedResponse();
  }
  return result;
}
