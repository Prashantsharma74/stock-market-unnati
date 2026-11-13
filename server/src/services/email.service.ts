import { env } from '../config/env'
import { EmailMessage } from '../models/EmailMessage'
import { logger } from '../utils/logger'

export type EmailChannel = 'dev-mailbox' | 'unconfigured'

export async function sendEmail(input: { to: string; subject: string; text: string }) {
  if (env.NODE_ENV !== 'production') {
    await EmailMessage.create({
      to: input.to.toLowerCase(),
      subject: input.subject,
      text: input.text,
    })
    logger.info('Stored development email', { to: input.to, subject: input.subject })
    return { delivered: true, channel: 'dev-mailbox' as const }
  }

  logger.warn('Email delivery is not configured. No message was sent.', {
    to: input.to,
    subject: input.subject,
  })
  return { delivered: false, channel: 'unconfigured' as const }
}
