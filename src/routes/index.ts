import { FastifyInstance } from "..";
import db from "../database/db";

export default async function(fastify: FastifyInstance) {
  fastify.get("/", async (_request, reply) => {
    const items = await db
      .selectFrom("item")
      .innerJoin("restaurant", "item.restaurant_id", "restaurant.id")
      .select(["item.id", "item.name", "item.price", "restaurant.name as restaurant"])
      .executeTakeFirst();

    reply.send(items);
  });
} 
