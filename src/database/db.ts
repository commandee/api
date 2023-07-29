import { MysqlDialect, Kysely } from "kysely";
import mysql from "mysql2/promise";
import { DB } from "./schema";

const dialect = new MysqlDialect({
  pool: mysql.createPool(import.meta.env.DATABASE_URL)
});

export default new Kysely<DB>({ dialect });
