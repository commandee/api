import APIError from "../api_error";
import { genID } from "../crypt";
import db from "../database/db";
import type { Priority, Status } from "../database/generated/schema/enums";
import { areFromSameRestaurant } from "./restaurant";

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
    .select([
      "public_id as id",
      "order.notes",
      "quantity",
      "status",
      "priority",
      "item.public_id as itemId",
      "restaurant.public_id as restaurantId",
      "item.name as itemName",
      "item.description as itemDescription"
    ])
    .where("public_id", "=", id)
    .executeTakeFirstOrThrow(APIError.noResult("Order not found."));

  return parseOrder(result);
}

export async function create(
  order: {
    notes?: string;
    quantity?: number;
    priority?: Priority;
    status?: Status;
    itemId: string;
  },
  commandaId: string
): Promise<void> {
  const [publicId] = await Promise.all([
    genID(),
    areFromSameRestaurant(commandaId, order.itemId)
  ]);

  const result = await db
    .insertInto("order")
    .values(({ selectFrom }) => ({
      public_id: publicId,
      notes: order.notes,
      priority: order.priority,
      status: order.status,
      quantity: order.quantity,
      commanda_id: selectFrom("commanda")
        .select("id")
        .where("public_id", "=", commandaId),
      item_id: selectFrom("item")
        .select("id")
        .where("public_id", "=", order.itemId)
    }))
    .executeTakeFirst();

  if (result.numInsertedOrUpdatedRows !== 1n) {
    throw new APIError("Order not created", 500);
  }
}

export async function update(
  orderId: string,
  order: {
    notes?: string;
    quantity?: number;
    priority?: Priority;
    status?: Status;
  }
): Promise<void> {
  const result = await db
    .updateTable("order")
    .set(order)
    .where("public_id", "=", orderId)
    .executeTakeFirst();

  if (result.numUpdatedRows !== 1n) {
    throw new APIError("Order not found", 404);
  }
}

export async function del(id: string): Promise<void> {
  const result = await db
    .deleteFrom("order")
    .where("public_id", "=", id)
    .executeTakeFirst();

  if (result?.numDeletedRows !== 1n) {
    throw new APIError("Order not found", 404);
  }
}

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
};

export async function getAllFrom(
  restaurantId: string,
  parameters: {
    orderBy?: "createdAt" | "priority" | "status" | "quantity";
    order?: "asc" | "desc";
    limit?: number;
    where?: {
      status?: Status;
      priority?: Priority;
    };
  }
): Promise<Order[]> {
  let query = db
    .selectFrom("order")
    .innerJoin("item", "item.id", "order.item_id")
    .innerJoin("restaurant", "restaurant.id", "item.restaurant_id")
    .select([
      "public_id as id",
      "order.notes",
      "quantity",
      "status",
      "priority",
      "item.public_id as itemId",
      "restaurant.public_id as restaurantId",
      "item.name as itemName",
      "item.description as itemDescription"
    ])
    .where("restaurant.public_id", "=", restaurantId);

  if (parameters.orderBy) {
    const orderBy =
      parameters.orderBy === "createdAt" ? "created" : parameters.orderBy;
    query = query.orderBy(orderBy, parameters.order);
  }

  if (parameters.limit) {
    query = query.limit(parameters.limit);
  }

  if (parameters.where) {
    Object.entries(parameters.where).forEach((pair) => {
      if (!pair[1]) return;
      query = query.where(pair[0], "=", pair[1]);
    });
  }

  const result = await query.execute();

  return result.map((order) => parseOrder(order));
}
