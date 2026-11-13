export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Unnati API',
    version: '0.1.0',
    description:
      'Phase 1 API for Unnati. Market figures are simulated. The service does not place orders, collect PAN, or accept investment money. Email delivery uses a development mailbox outside production and is unconfigured in production.',
  },
  servers: [{ url: '/' }],
  tags: [
    { name: 'Health' },
    { name: 'Auth' },
    { name: 'Users' },
    { name: 'Notifications' },
    { name: 'Dashboard' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      accessCookie: { type: 'apiKey', in: 'cookie', name: 'finora_access' },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string' },
          code: { type: 'string' },
        },
      },
      PublicUser: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          fullName: { type: 'string' },
          email: { type: 'string' },
          mobile: { type: 'string' },
          dateOfBirth: { type: 'string', example: '1994-06-15' },
          role: { type: 'string', enum: ['user', 'admin'] },
          emailVerified: { type: 'boolean' },
          panStatus: { type: 'string', enum: ['not_started', 'pending', 'verified'] },
          kycStatus: { type: 'string', enum: ['not_started', 'pending', 'verified'] },
        },
      },
    },
  },
  paths: {
    '/api/health': {
      get: {
        tags: ['Health'],
        summary: 'Service, database, and integration status',
        responses: { '200': { description: 'Health payload' } },
      },
    },
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Create an account and queue email confirmation',
        responses: { '201': { description: 'Created' }, '409': { description: 'Email already registered' } },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Sign in with email and password',
        responses: { '200': { description: 'Sets access and refresh cookies' }, '401': { description: 'Invalid credentials' } },
      },
    },
    '/api/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Rotate the refresh token and issue a new access token',
        responses: { '200': { description: 'Rotated' }, '401': { description: 'Session expired' } },
      },
    },
    '/api/auth/logout': {
      post: { tags: ['Auth'], summary: 'Revoke the current refresh token', responses: { '200': { description: 'Signed out' } } },
    },
    '/api/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Current user',
        security: [{ bearerAuth: [] }, { accessCookie: [] }],
        responses: { '200': { description: 'Public user' }, '401': { description: 'Unauthenticated' } },
      },
    },
    '/api/auth/verify-email': {
      post: { tags: ['Auth'], summary: 'Confirm an email token', responses: { '200': { description: 'Verified' } } },
    },
    '/api/auth/resend-verification': {
      post: { tags: ['Auth'], summary: 'Create another confirmation email when needed', responses: { '200': { description: 'Accepted' } } },
    },
    '/api/auth/forgot-password': {
      post: { tags: ['Auth'], summary: 'Start a password reset without revealing whether the email exists', responses: { '200': { description: 'Accepted' } } },
    },
    '/api/auth/reset-password': {
      post: { tags: ['Auth'], summary: 'Set a new password from a reset token', responses: { '200': { description: 'Reset' } } },
    },
    '/api/auth/dev/mailbox': {
      get: {
        tags: ['Auth'],
        summary: 'Development-only mailbox. Disabled in production.',
        parameters: [{ name: 'email', in: 'query', schema: { type: 'string' } }],
        responses: { '200': { description: 'Messages' }, '404': { description: 'Disabled' } },
      },
    },
    '/api/users/me': {
      get: {
        tags: ['Users'],
        security: [{ bearerAuth: [] }, { accessCookie: [] }],
        summary: 'Profile',
        responses: { '200': { description: 'Public user' } },
      },
      patch: {
        tags: ['Users'],
        security: [{ bearerAuth: [] }, { accessCookie: [] }],
        summary: 'Update name, mobile, and date of birth',
        responses: { '200': { description: 'Updated' } },
      },
    },
    '/api/users/me/password': {
      post: {
        tags: ['Users'],
        security: [{ bearerAuth: [] }, { accessCookie: [] }],
        summary: 'Change password and revoke sessions',
        responses: { '200': { description: 'Changed' } },
      },
    },
    '/api/notifications': {
      get: {
        tags: ['Notifications'],
        security: [{ bearerAuth: [] }, { accessCookie: [] }],
        summary: 'Recent notifications',
        responses: { '200': { description: 'Notifications' } },
      },
    },
    '/api/notifications/read-all': {
      post: {
        tags: ['Notifications'],
        security: [{ bearerAuth: [] }, { accessCookie: [] }],
        summary: 'Mark all notifications read',
        responses: { '200': { description: 'Updated' } },
      },
    },
    '/api/notifications/{id}/read': {
      patch: {
        tags: ['Notifications'],
        security: [{ bearerAuth: [] }, { accessCookie: [] }],
        summary: 'Mark one notification read',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Updated' } },
      },
    },
    '/api/dashboard': {
      get: {
        tags: ['Dashboard'],
        security: [{ bearerAuth: [] }, { accessCookie: [] }],
        summary: 'Simulated portfolio snapshot shared by every account',
        responses: { '200': { description: 'Snapshot' } },
      },
    },
    '/api/dashboard/search': {
      get: {
        tags: ['Dashboard'],
        security: [{ bearerAuth: [] }, { accessCookie: [] }],
        summary: 'Search the simulated instrument catalog',
        parameters: [{ name: 'q', in: 'query', schema: { type: 'string' } }],
        responses: { '200': { description: 'Matches' } },
      },
    },
    '/api/dashboard/instruments/{id}': {
      get: {
        tags: ['Dashboard'],
        security: [{ bearerAuth: [] }, { accessCookie: [] }],
        summary: 'One simulated instrument',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Instrument' }, '404': { description: 'Not in the sample set' } },
      },
    },
  },
}
