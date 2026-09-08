import cors from "cors";
import { desc, eq, sql, sum } from "drizzle-orm";
import express from "express";
import { db, testConnection } from "./db";
import { items, lots, sales } from "./schema";

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy for Railway/cloud deployments (required for rate limiting)
app.set('trust proxy', 1);

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get("/api/health", async (req, res) => {
  const dbOk = await testConnection();
  res.json({ status: dbOk ? "ok" : "error", database: dbOk });
});

// ============ LOTS ============

// GET all lots with pre-computed summaries (optimized single query)
app.get("/api/lots/summary", async (req, res) => {
  try {
    const result = await db.execute(sql`
      SELECT 
        l.id,
        l.name,
        l.provider,
        l.buy_date as "buyDate",
        l.initial_quantity as "initialQuantity",
        l.total_cost as "totalCost",
        l.additional_fees as "additionalFees",
        l.created_at as "createdAt",
        l.updated_at as "updatedAt",
        COALESCE(l.total_cost, 0) + COALESCE(l.additional_fees, 0) as "totalInvestment",
        COALESCE(sales_agg.total_revenue, 0) as "totalRevenue",
        COALESCE(sales_agg.sold_count, 0) as "soldCount",
        COALESCE(items_agg.stock_count, 0) as "stockCount",
        GREATEST(0, (COALESCE(l.total_cost, 0) + COALESCE(l.additional_fees, 0)) - COALESCE(sales_agg.total_revenue, 0)) as "delta"
      FROM lots l
      LEFT JOIN (
        SELECT 
          lot_id,
          SUM(price_net) as total_revenue,
          COUNT(*) as sold_count
        FROM sales 
        WHERE status NOT IN ('CANCELLED', 'REFUNDED')
        GROUP BY lot_id
      ) sales_agg ON sales_agg.lot_id = l.id
      LEFT JOIN (
        SELECT 
          lot_id,
          COUNT(*) as stock_count
        FROM items 
        WHERE status = 'STOCK'
        GROUP BY lot_id
      ) items_agg ON items_agg.lot_id = l.id
      ORDER BY l.buy_date DESC, l.id DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch lots summary" });
  }
});

app.get("/api/lots", async (req, res) => {
  try {
    const result = await db.select().from(lots).orderBy(desc(lots.buyDate));
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch lots" });
  }
});

app.get("/api/lots/:id", async (req, res) => {
  try {
    const result = await db.select().from(lots).where(eq(lots.id, parseInt(req.params.id)));
    if (result.length === 0) {
      return res.status(404).json({ error: "Lot not found" });
    }
    res.json(result[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch lot" });
  }
});

app.post("/api/lots", async (req, res) => {
  try {
    const result = await db.insert(lots).values(req.body).returning();
    res.status(201).json(result[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create lot" });
  }
});

app.put("/api/lots/:id", async (req, res) => {
  try {
    const result = await db
      .update(lots)
      .set({ ...req.body, updatedAt: sql`CURRENT_TIMESTAMP` })
      .where(eq(lots.id, parseInt(req.params.id)))
      .returning();
    res.json(result[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update lot" });
  }
});

app.delete("/api/lots/:id", async (req, res) => {
  try {
    await db.delete(lots).where(eq(lots.id, parseInt(req.params.id)));
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete lot" });
  }
});

// ============ ITEMS ============
app.get("/api/items", async (req, res) => {
  try {
    const { lotId, status } = req.query;
    let query = db.select().from(items);
    
    if (lotId) {
      const result = await db.select().from(items).where(eq(items.lotId, parseInt(lotId as string)));
      return res.json(result);
    }
    if (status) {
      const result = await db.select().from(items).where(eq(items.status, status as string));
      return res.json(result);
    }
    
    const result = await query;
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch items" });
  }
});

app.get("/api/items/:id", async (req, res) => {
  try {
    const result = await db.select().from(items).where(eq(items.id, parseInt(req.params.id)));
    if (result.length === 0) {
      return res.status(404).json({ error: "Item not found" });
    }
    res.json(result[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch item" });
  }
});

app.post("/api/items", async (req, res) => {
  try {
    const result = await db.insert(items).values(req.body).returning();
    res.status(201).json(result[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create item" });
  }
});

app.post("/api/items/batch", async (req, res) => {
  try {
    if (!Array.isArray(req.body) || req.body.length === 0) {
      return res.status(400).json({ error: "Expected array of items" });
    }
    const result = await db.insert(items).values(req.body).returning();
    res.status(201).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create items" });
  }
});

app.put("/api/items/:id", async (req, res) => {
  try {
    const result = await db
      .update(items)
      .set({ ...req.body, updatedAt: sql`CURRENT_TIMESTAMP` })
      .where(eq(items.id, parseInt(req.params.id)))
      .returning();
    res.json(result[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update item" });
  }
});

app.patch("/api/items/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const result = await db
      .update(items)
      .set({ status, updatedAt: sql`CURRENT_TIMESTAMP` })
      .where(eq(items.id, parseInt(req.params.id)))
      .returning();
    res.json(result[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update item status" });
  }
});

app.delete("/api/items/:id", async (req, res) => {
  try {
    await db.delete(items).where(eq(items.id, parseInt(req.params.id)));
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete item" });
  }
});

// ============ SALES ============
app.get("/api/sales", async (req, res) => {
  try {
    const { lotId } = req.query;
    
    if (lotId) {
      const result = await db.select().from(sales).where(eq(sales.lotId, parseInt(lotId as string)));
      return res.json(result);
    }
    
    const result = await db.select().from(sales).orderBy(desc(sales.saleDate));
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch sales" });
  }
});

app.get("/api/sales/revenue", async (req, res) => {
  try {
    const { lotId } = req.query;
    
    if (lotId) {
      const result = await db
        .select({ total: sum(sales.priceNet) })
        .from(sales)
        .where(eq(sales.lotId, parseInt(lotId as string)));
      return res.json({ total: parseFloat(result[0]?.total || "0") });
    }
    
    const result = await db.select({ total: sum(sales.priceNet) }).from(sales);
    res.json({ total: parseFloat(result[0]?.total || "0") });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch revenue" });
  }
});

app.get("/api/sales/:id", async (req, res) => {
  try {
    const result = await db.select().from(sales).where(eq(sales.id, parseInt(req.params.id)));
    if (result.length === 0) {
      return res.status(404).json({ error: "Sale not found" });
    }
    res.json(result[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch sale" });
  }
});

app.post("/api/sales", async (req, res) => {
  try {
    const result = await db.insert(sales).values(req.body).returning();
    res.status(201).json(result[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create sale" });
  }
});

app.delete("/api/sales/:id", async (req, res) => {
  try {
    await db.delete(sales).where(eq(sales.id, parseInt(req.params.id)));
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete sale" });
  }
});

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 API Server running on port ${PORT}`);
  await testConnection();
});
