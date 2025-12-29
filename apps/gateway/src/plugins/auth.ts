import fp from "fastify-plugin";
import type { FastifyPluginCallback } from "fastify";
import { buildTenantSession, CognitoTenantVerifier, type HeaderMap, type TenantSession } from "@ironsight/auth";
import { getTenantSsoConfig } from "../tenant-config";

declare module "fastify" {
  interface FastifyRequest {
    tenantSession?: TenantSession;
  }
}

const verifier = new CognitoTenantVerifier(getTenantSsoConfig);

const authPlugin: FastifyPluginCallback = (fastify, _opts, done) => {
  fastify.decorateRequest("tenantSession", null);

  fastify.addHook("onRequest", async (request, reply) => {
    if (request.routerPath && request.routerPath.startsWith("/health")) {
      return;
    }
    try {
      const headerMap: HeaderMap = Object.fromEntries(
        Object.entries(request.headers).map(([key, value]) => [key, value as string | string[] | undefined]),
      );
      const session = await buildTenantSession(verifier, headerMap);
      request.tenantSession = session;
    } catch (error) {
      request.log.error({ err: error }, "Unauthorized request");
      return reply.code(401).send({ error: "Unauthorized" });
    }
  });

  done();
};

export default fp(authPlugin);
