import type { FastifyInstance } from "../server";
import db from "../database/db";
import { PORT } from "../enviroment";
import APIError from "../api_error";

export default async function (fastify: FastifyInstance) {
  fastify.get("/", async (_request, reply) => {
    const items = await db
      .selectFrom("order")
      .innerJoin("item", "order.item_id", "item.id")
      .innerJoin("commanda", "order.commanda_id", "commanda.id")
      .selectAll("order")
      .select(["item.name as item_name", "commanda.costumer as commanda"])
      .executeTakeFirst();

    return reply.send(items);
  });

  fastify.get("/throw", async (request, reply) => {
    if ((request.query as any).throw) {
      throw new APIError("Test", 400);
    }

    reply.send("hello!");
  });

  fastify.get("/port", async (_request, reply) => {
    reply.send(PORT);
  });
}
