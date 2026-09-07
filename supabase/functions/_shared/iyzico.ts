// iyzico HMACSHA256 kimlik doğrulaması (IYZWSv2)
// Kaynak: https://docs.iyzico.com/en/getting-started/preliminaries/authentication/hmacsha256-auth
// Formül: signature = HMACSHA256(randomKey + uriPath + requestBody, secretKey)
// Authorization: "IYZWSv2 " + base64("apiKey:<apiKey>&randomKey:<randomKey>&signature:<signatureHex>")

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function hmacSha256Hex(key: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(message));
  return Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function iyzicoRequest(
  uriPath: string,
  body: Record<string, unknown>
): Promise<any> {
  const apiKey = Deno.env.get('IYZICO_API_KEY')!;
  const secretKey = Deno.env.get('IYZICO_SECRET_KEY')!;
  const baseUrl = Deno.env.get('IYZICO_BASE_URL')!; // sandbox: https://sandbox-api.iyzipay.com

  const randomKey = `${Date.now()}${Math.floor(Math.random() * 1_000_000_000)}`;
  const requestBody = JSON.stringify(body);

  const signature = await hmacSha256Hex(secretKey, randomKey + uriPath + requestBody);

  const authorizationParams = `apiKey:${apiKey}&randomKey:${randomKey}&signature:${signature}`;
  const base64EncodedAuthorization = btoa(authorizationParams);

  const response = await fetch(`${baseUrl}${uriPath}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `IYZWSv2 ${base64EncodedAuthorization}`,
      'x-iyzi-rnd': randomKey,
    },
    body: requestBody,
  });

  return response.json();
}
