import type { FastifyInstance } from "fastify";
import Stripe from "stripe";
import { getLogger } from "@ironsight/common";
import { withTenantTransaction } from "@ironsight/db";

export function registerWebhookRoute(server: FastifyInstance) {
  const config = server.billingConfig;
  const stripe = new Stripe(config.stripeSecretKey, { apiVersion: "2023-10-16" });
  const logger = getLogger();

  // Encapsulate a raw-buffer content-type parser for this route only
  server.register(async (scoped) => {
    scoped.addContentTypeParser("*", { parseAs: "buffer" }, (req, body, done) => done(null, body));

    scoped.post("/webhook", async (request, reply) => {
      let event: Stripe.Event;

      if (config.stripeWebhookSecret) {
        const signature = request.headers["stripe-signature"] as string;
        try {
          const bodyBuffer = request.body as Buffer;
          event = stripe.webhooks.constructEvent(bodyBuffer, signature, config.stripeWebhookSecret);
        } catch (error) {
          logger.error({ err: error }, "Stripe webhook signature verification failed");
          return reply.code(400).send({ error: "Invalid signature" });
        }
      } else {
        const bodyBuffer = request.body as Buffer;
        event = JSON.parse(bodyBuffer.toString("utf8")) as Stripe.Event;
      }

      switch (event.type) {
        case "invoice.payment_succeeded":
          logger.info({ id: event.id }, "Invoice payment succeeded");
          break;
        case "customer.subscription.deleted":
          logger.warn({ id: event.id }, "Subscription canceled");
          break;
        default:
          logger.info({ type: event.type }, "Unhandled Stripe event");
      }

      return reply.send({ received: true });
    });
  });
}
