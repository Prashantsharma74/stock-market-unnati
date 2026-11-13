import bcrypt from 'bcryptjs'

const ROUNDS = 12

export const DUMMY_PASSWORD_HASH = bcrypt.hashSync('finora-timing-pad', ROUNDS)

export function hashPassword(password: string) {
  return bcrypt.hash(password, ROUNDS)
}

export function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash)
}
