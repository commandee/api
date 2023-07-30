import { Kysely } from "kysely";
import { DB } from "./generated/schema/schema";
import { PlanetScaleDialect } from "kysely-planetscale";
import { DB_OPTIONS } from "../enviroment";

const dialect = new PlanetScaleDialect(DB_OPTIONS);

export default new Kysely<DB>({
  dialect,
  log: import.meta.env.DEV ? ["query", "error"] : []
});
