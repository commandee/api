import APIError from "../api_error";
import db from "../database/db";

function parseOrder(result: {
  id: string;
  quantity: number;
  priority: "low" | "medium" | "high";
  status: "pending" | "in_progress" | "done";
  notes: string | null;
  itemId: string;
  restaurantId: string;
  itemName: string;
  itemDescription: string | null;
}): Order {
  return {
    id: result.id,
    priority: result.priority,
    quantity: result.quantity,
    status: result.status,
    notes: result.notes || undefined,
    restaurantId: result.restaurantId,
    item: {
      id: result.itemId,
      name: result.itemName,
      description: result.itemDescription || undefined
    }
  };
}

export async function get(id: string): Promise<Order> {
  const result = await db
    .selectFrom("order")
    .innerJoin("item", "item.id", "order.item_id")
    .innerJoin("restaurant", "restaurant.id", "item.restaurant_id")
    .select(["public_id as id", "order.notes", "quantity", "status", "priority", "item.public_id as itemId", "restaurant.public_id as restaurantId", "item.name as itemName", "item.description as itemDescription"])
    .where("public_id", "=", id)
    .executeTakeFirstOrThrow(APIError.noResult("Order not found."));

  return parseOrder(result);
}

// export async function create(order: {
//   notes?: string | undefined | null;
//   priority?: "low" | "medium" | "high" | null;
//   status?: "in_progress" | "pending" | "done" | null
//   quantity: number;
// }) {
//   await db
//     .insertInto("order")
//     .values({
//       notes: order.notes || null,
//       priority: order.priority,
//       quantity: order.quantity,
//       status: order.status || null
//     })
// }

type Order = {
  id: string;
  notes?: string | undefined;
  priority: "low" | "medium" | "high";
  quantity: number;
  status: "in_progress" | "done" | "pending";
  restaurantId: string;
  item: {
    name: string;
    id: string;
    description?: string | undefined;
  };
}

export async function getAllFrom(restaurantId: string): Promise<Order[]> {
  const result = await db
    .selectFrom("order")
    .innerJoin("item", "item.id", "order.item_id")
    .innerJoin("restaurant", "restaurant.id", "item.restaurant_id")
    .select(["public_id as id", "order.notes", "quantity", "status", "priority", "item.public_id as itemId", "restaurant.public_id as restaurantId", "item.name as itemName", "item.description as itemDescription"])
    .where("restaurant.public_id", "=", restaurantId)
    .execute();

  return result.map((order) => parseOrder(order));
}
