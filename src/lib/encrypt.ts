import crypto from "crypto"
import dotenv from "dotenv"

dotenv.config()

const algorithm = "aes-256-cbc"
const key = Buffer.from(process.env.ENCRYPTION_SECRET as string, "hex")
const iv = Buffer.from(process.env.ENCRYPTION_IV as string, "hex")

// Encrypt function
export function encrypt(text: string): string {
  const cipher = crypto.createCipheriv(algorithm, key, iv)
  let encrypted = cipher.update(text, "utf8", "hex")
  encrypted += cipher.final("hex")
  return `${iv.toString("hex")}:${encrypted}`
}

// Decrypt function
export function decrypt(text: string): string {
  const textParts = text.split(":")
  const iv = Buffer.from(textParts.shift()!, "hex")
  const encryptedText = Buffer.from(textParts.join(":"), "hex")
  const decipher = crypto.createDecipheriv(algorithm, key, iv)
  let decrypted = decipher.update(encryptedText.toString("hex"), "hex", "utf8")
  decrypted += decipher.final("utf8")
  return decrypted
}
