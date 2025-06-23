import { Issuer, Strategy as OIDCStrategy } from 'openid-client';

export async function createOidcStrategy() {
  const issuerUrl = process.env.OIDC_ISSUER!;
  const clientId = process.env.OIDC_CLIENT_ID!;
  const clientSecret = process.env.OIDC_CLIENT_SECRET!;
  const redirectUri = process.env.OIDC_REDIRECT_URI!;

  const oidcIssuer = await Issuer.discover(issuerUrl);
  const client = new oidcIssuer.Client({
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uris: [redirectUri],
    response_types: ['code'],
  });

  return new OIDCStrategy(
    { client, passReqToCallback: false },
    (tokenSet, userinfo, done) => {
      const user = {
        ...userinfo,
        id_token: tokenSet.id_token,
        access_token: tokenSet.access_token,
        refresh_token: tokenSet.refresh_token,
        claims: tokenSet.claims(),
      };
      console.log('user OIDC Strategy :', user);
      done(null, user);
    },
  );
}
