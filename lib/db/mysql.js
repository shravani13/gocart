import mysql from 'mysql2/promise'
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager'

let poolPromise

/**
 * Production: set MYSQL_SECRET_ARN or MYSQL_SECRET_NAME (from ECS task / CodeBuild
 * environment or task secret reference—no .env file required).
 * The secret value must be JSON with at least username + password (RDS-style secrets
 * usually include host, port; database may come from MYSQL_DATABASE if omitted).
 *
 * IAM: the runtime role needs secretsmanager:GetSecretValue on that secret.
 */

async function resolveMysqlPoolOptions() {
  const secretId = process.env.MYSQL_SECRET_ARN || process.env.MYSQL_SECRET_NAME

  if (secretId) {
    const region =
      process.env.AWS_REGION ||
      process.env.AWS_DEFAULT_REGION ||
      'us-east-1'

    const client = new SecretsManagerClient({ region })
    const response = await client.send(
      new GetSecretValueCommand({ SecretId: secretId })
    )

    if (!response.SecretString) {
      throw new Error('Secrets Manager response has no SecretString')
    }

    let parsed
    try {
      parsed = JSON.parse(response.SecretString)
    } catch {
      throw new Error('MySQL secret must be JSON (username/password, optional host/port/database)')
    }

    const user = parsed.username ?? parsed.user
    const password = parsed.password
    const host =
      parsed.host ??
      parsed.hostname ??
      process.env.MYSQL_HOST
    const database =
      parsed.database ??
      parsed.dbname ??
      parsed.db ??
      process.env.MYSQL_DATABASE
    const port = Number(
      parsed.port ?? process.env.MYSQL_PORT ?? 3306
    )

    if (!user || !password) {
      throw new Error(
        'MySQL secret JSON must include username (or user) and password'
      )
    }
    if (!host) {
      throw new Error(
        'Set host in the secret JSON or provide MYSQL_HOST in the task environment'
      )
    }
    if (!database) {
      throw new Error(
        'Set database/dbname in the secret JSON or provide MYSQL_DATABASE in the task environment'
      )
    }

    const sslEnabled =
      process.env.MYSQL_SSL === 'true' ||
      parsed.ssl === true ||
      host.includes('.rds.amazonaws.com')

    return {
      host,
      user,
      password,
      database,
      port,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      ...(sslEnabled
        ? {
            ssl: {
              rejectUnauthorized:
                process.env.MYSQL_SSL_REJECT_UNAUTHORIZED !== 'false',
            },
          }
        : {}),
    }
  }

  /** Local / CI: explicit env vars when no Secrets Manager id is set. */
  const missing = ['MYSQL_HOST', 'MYSQL_USER', 'MYSQL_PASSWORD', 'MYSQL_DATABASE'].filter(
    (key) => !process.env[key]
  )

  if (missing.length) {
    throw new Error(
      `Configure MYSQL_SECRET_ARN or MYSQL_SECRET_NAME for AWS, or set: ${missing.join(', ')}`
    )
  }

  return {
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    port: Number(process.env.MYSQL_PORT || 3306),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ...(process.env.MYSQL_SSL === 'true'
      ? {
          ssl: {
            rejectUnauthorized:
              process.env.MYSQL_SSL_REJECT_UNAUTHORIZED !== 'false',
          },
        }
      : {}),
  }
}

export const getMysqlPool = async () => {
  if (!poolPromise) {
    poolPromise = (async () => {
      const options = await resolveMysqlPoolOptions()
      return mysql.createPool(options)
    })()
  }

  return poolPromise
}

/** Ensures orders table exists (MySQL 8.x). */
export const ensureOrdersTable = async () => {
  const pool = await getMysqlPool()
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS orders (
      id CHAR(36) NOT NULL PRIMARY KEY,
      status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
      paymentMethod VARCHAR(50) NOT NULL,
      total DECIMAL(10, 2) NOT NULL,
      address TEXT NOT NULL,
      orderItems TEXT NOT NULL,
      createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
    )
  `)
}
