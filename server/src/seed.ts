import { Notification } from './models/Notification'
import { User, type UserRole } from './models/User'
import { UserProfile } from './models/UserProfile'
import { hashPassword } from './utils/password'
import { logger } from './utils/logger'

type SeedAccount = {
  email: string
  password: string
  fullName: string
  mobile: string
  dateOfBirth: string
  role: UserRole
}

const accounts: SeedAccount[] = [
  {
    email: 'demo@unnati.app',
    password: 'Demo@12345',
    fullName: 'Demo Investor',
    mobile: '9876543210',
    dateOfBirth: '1994-06-15',
    role: 'user',
  },
  {
    email: 'admin@unnati.app',
    password: 'Admin@12345',
    fullName: 'Unnati Admin',
    mobile: '9123456780',
    dateOfBirth: '1990-01-20',
    role: 'admin',
  },
]

export async function seedDemoData() {
  for (const account of accounts) {
    const existing = await User.findOne({ email: account.email })
    if (existing) continue

    const user = await User.create({
      email: account.email,
      passwordHash: await hashPassword(account.password),
      role: account.role,
      emailVerified: true,
      isActive: true,
    })

    await UserProfile.create({
      user: user._id,
      fullName: account.fullName,
      mobile: account.mobile,
      dateOfBirth: new Date(`${account.dateOfBirth}T00:00:00.000Z`),
    })

    await Notification.insertMany([
      {
        user: user._id,
        title: 'Welcome to Unnati',
        body: 'This workspace uses a simulated portfolio. Nothing here is a live price or a real order.',
        kind: 'system',
      },
      {
        user: user._id,
        title: 'Demo portfolio is shared',
        body: 'Every account currently sees the same illustrative holdings. Personal tracking comes in a later release.',
        kind: 'account',
      },
    ])

    logger.info('Seeded development account', { email: account.email, role: account.role })
  }
}
