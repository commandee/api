import type { FastifyInstance } from "../server";
import db from "../database/db";
import { PORT } from "../enviroment";

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

  fastify.get("/port", async (_request, reply) => {
    reply.send(PORT);
  });
}
