/// <reference types="vite/client" />
/// <reference types="typed-html" />

import type { JSONSchema7 } from "json-schema-to-ts";
import type { TSchema } from "@sinclair/typebox";
import type { Role } from "./database/generated/schema/enums";

type Entries<T> = {
  [K in keyof T]-?: [K, T[K]];
}[keyof T][];

const a = 1 as unknown as Entries<{
  hi?: "hello",
  bye: "goodbye"
}>;

const b = a[0]

declare global {
  const elements: typeof import("typed-html");
  type JSONSchema = JSONSchema7;

  interface ObjectConstructor {
    entries<T extends object>(o: T): Entries<T>;
  }
}

declare module "fastify" {
  type SchemaValidator = ZodTypeAny | TSchema | JSONSchema7 | undefined;
  export interface FastifySchema {
    readonly body?: SchemaValidator;
    readonly querystring?: SchemaValidator;
    readonly params?: SchemaValidator;
    readonly headers?: SchemaValidator;
    readonly response?: Record<number, SchemaValidator>;
  }
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: {
      id: string;
      restaurant?: {
        id: string;
        role: Role;
      };
    };
  }
}

type Readable<T> = {
  [P in keyof T]: T[P];
};
