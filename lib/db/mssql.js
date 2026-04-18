import sql from 'mssql'

let poolPromise

const getConfig = () => ({
  user: process.env.MSSQL_USER,
  password: process.env.MSSQL_PASSWORD,
  server: process.env.MSSQL_SERVER,
  database: process.env.MSSQL_DATABASE,
  port: Number(process.env.MSSQL_PORT || 1433),
  options: {
    encrypt: process.env.MSSQL_ENCRYPT !== 'false',
    trustServerCertificate: process.env.MSSQL_TRUST_SERVER_CERTIFICATE === 'true',
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
})

export const getMssqlPool = async () => {
  if (!poolPromise) {
    const missing = ['MSSQL_USER', 'MSSQL_PASSWORD', 'MSSQL_SERVER', 'MSSQL_DATABASE'].filter(
      (key) => !process.env[key]
    )

    if (missing.length) {
      throw new Error(`Missing MSSQL env vars: ${missing.join(', ')}`)
    }

    poolPromise = sql.connect(getConfig())
  }

  return poolPromise
}

export const ensureOrdersTable = async () => {
  const pool = await getMssqlPool()
  await pool.request().query(`
    IF NOT EXISTS (
      SELECT 1 FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = 'orders'
    )
    BEGIN
      CREATE TABLE dbo.orders (
        id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        status NVARCHAR(50) NOT NULL DEFAULT 'PENDING',
        paymentMethod NVARCHAR(50) NOT NULL,
        total DECIMAL(10,2) NOT NULL,
        address NVARCHAR(MAX) NOT NULL,
        orderItems NVARCHAR(MAX) NOT NULL,
        createdAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
      )
    END
  `)
}