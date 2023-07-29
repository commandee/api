import type { ColumnType } from "kysely";

export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;

export interface Commanda {
  id: string;
  costumer: string;
  table: number | null;
  restaurant_id: number;
}

export interface Employee {
  id: string;
  username: string;
  email: string;
  password: string;
}

export interface Employement {
  employee_id: string;
  restaurant_id: string;
}

export interface Item {
  id: Generated<number>;
  name: string;
  price: number;
  restaurant_id: number;
}

export interface Order {
  id: Generated<number>;
  commanda_id: string;
  item_id: number;
  restaurant_id: string;
  quantity: Generated<number>;
  priority: Generated<"high" | "low" | "medium">;
  status: Generated<"done" | "in_progress" | "pending">;
  notes: string | null;
}

export interface Ownership {
  owner_id: string;
  restaurant_id: string;
}

export interface Restaurant {
  id: string;
  name: string;
  address: string;
}

export interface DB {
  commanda: Commanda;
  employee: Employee;
  employement: Employement;
  item: Item;
  order: Order;
  ownership: Ownership;
  restaurant: Restaurant;
}
