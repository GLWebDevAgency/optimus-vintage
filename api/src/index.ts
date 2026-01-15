import cors from "cors";
import { desc, eq, sql, sum } from "drizzle-orm";
import express from "express";
import { db, testConnection } from "./db";
import { items, lots, sales } from "./schema";

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get("/api/health", async (req, res) => {
  const dbOk = await testConnection();
  res.json({ status: dbOk ? "ok" : "error", database: dbOk });
});

// ============ LOTS ============
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
