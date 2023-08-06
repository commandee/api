import bcrypt from "bcryptjs";
import * as nanoid from "nanoid/async"

export async function encrypt(input: string) {
  return bcrypt.hash(input, 10);
}

export async function compare(input: string, hash: string) {
  return bcrypt.compare(input, hash);
}

export const genID: () => Promise<string> = nanoid.customAlphabet("0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ", 16);
export const idRegex = /^[0-9a-zA-Z]{16}$/;

export function isID(input: string) {
  return input.match(idRegex);
}
