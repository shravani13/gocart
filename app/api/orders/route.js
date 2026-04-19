import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { ensureOrdersTable, getMysqlPool } from '@/lib/db/mysql'


export async function POST(request) {
  try {
    const body = await request.json()
    const { paymentMethod, total, address, items } = body

    if (!paymentMethod || !address || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Invalid order payload' }, { status: 400 })
    }

    await ensureOrdersTable()
    const pool = await getMysqlPool()

    const id = randomUUID()
    const addressJson = JSON.stringify(address)
    const itemsJson = JSON.stringify(items)

    await pool.execute(
      `INSERT INTO orders (id, paymentMethod, total, address, orderItems)
       VALUES (?, ?, ?, ?, ?)`,
      [id, paymentMethod, Number(total), addressJson, itemsJson]
    )

    const [rows] = await pool.execute(
      `SELECT id, status, paymentMethod, total, address, orderItems, createdAt
       FROM orders WHERE id = ?`,
      [id]
    )

    const row = rows[0]

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
    const pool = await getMysqlPool()

    const [rows] = await pool.execute(
      `SELECT id, status, paymentMethod, total, address, orderItems, createdAt
       FROM orders
       ORDER BY createdAt DESC
       LIMIT 100`
    )

    const orders = rows.map((row) => ({
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
