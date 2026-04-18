import { NextResponse } from 'next/server'
import { ensureOrdersTable, getMssqlPool } from '@/lib/db/mssql'
import sql from 'mssql'

export async function POST(request) {
  try {
    const body = await request.json()
    const { paymentMethod, total, address, items } = body

    if (!paymentMethod || !address || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Invalid order payload' }, { status: 400 })
    }

    await ensureOrdersTable()
    const pool = await getMssqlPool()

    const dbResult = await pool
      .request()
      .input('paymentMethod', sql.NVarChar(50), paymentMethod)
      .input('total', sql.Decimal(10, 2), Number(total))
      .input('address', sql.NVarChar(sql.MAX), JSON.stringify(address))
      .input('orderItems', sql.NVarChar(sql.MAX), JSON.stringify(items))
      .query(`
        INSERT INTO dbo.orders (paymentMethod, total, address, orderItems)
        OUTPUT INSERTED.id, INSERTED.status, INSERTED.paymentMethod, INSERTED.total, INSERTED.address, INSERTED.orderItems, INSERTED.createdAt
        VALUES (@paymentMethod, @total, @address, @orderItems)
      `)

    const row = dbResult.recordset[0]

    return NextResponse.json({
      order: {
        id: row.id,
        status: row.status,
        paymentMethod: row.paymentMethod,
        total: Number(row.total),
        address: JSON.parse(row.address),
        orderItems: JSON.parse(row.orderItems),
        createdAt: row.createdAt,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create order', details: error.message },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    await ensureOrdersTable()
    const pool = await getMssqlPool()

    const dbResult = await pool.request().query(`
      SELECT TOP 100 id, status, paymentMethod, total, address, orderItems, createdAt
      FROM dbo.orders
      ORDER BY createdAt DESC
    `)

    const orders = dbResult.recordset.map((row) => ({
      id: row.id,
      status: row.status,
      paymentMethod: row.paymentMethod,
      total: Number(row.total),
      address: JSON.parse(row.address),
      orderItems: JSON.parse(row.orderItems),
      createdAt: row.createdAt,
    }))

    return NextResponse.json({ orders })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch orders', details: error.message },
      { status: 500 }
    )
  }
}