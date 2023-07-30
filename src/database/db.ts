import { MysqlDialect, Kysely } from "kysely";
import mysql from "mysql2/promise";
import { DB } from "./generated/schema/schema";
import { DATABASE_URL } from "../enviroment";

const dialect = new MysqlDialect({
  pool: mysql.createPool(DATABASE_URL)
});

export default new Kysely<DB>({ 
  dialect,
  log: import.meta.env.DEV ? ["query", "error"] : []
});
