import 'dotenv/config'

// Integration tests wipe catalog data, so they run against a separate database
if (process.env.TEST_DATABASE_URL) process.env.DATABASE_URL = process.env.TEST_DATABASE_URL
