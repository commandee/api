import bcrypt from "bcryptjs/";

export async function encrypt(input: string) {
  return bcrypt.hash(input, 10);
}

export async function compare(input: string, hash: string) {
  return bcrypt.compare(input, hash);
}
