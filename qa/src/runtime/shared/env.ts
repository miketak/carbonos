/** Where the drivers find the stack. */
export const env = {
  apiUrl: process.env.QA_API_URL ?? 'http://localhost:8080',
  appUrl: process.env.QA_APP_URL ?? 'http://localhost:5173',
  mailpitUrl: process.env.QA_MAILPIT_URL ?? 'http://localhost:8025',
  /** The seeded administrator's credentials (CARBONOS_ADMIN_EMAIL / PASSWORD of the backend). */
  adminEmail: process.env.QA_ADMIN_EMAIL,
  adminPassword: process.env.QA_ADMIN_PASSWORD,
  crossCheck: process.env.QA_CROSS_CHECK !== '0',
}
