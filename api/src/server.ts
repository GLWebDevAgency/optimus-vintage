/**
 * 🚀 Optimus Vintage API Server
 * 
 * Enterprise-grade REST API for inventory management.
 * 
 * Features:
 * - Input validation with Zod
 * - Rate limiting
 * - Security headers
 * - Structured error handling
 * - Request logging
 * - Health checks
 */

import cors from "cors";
import { desc, eq, sql, sum } from "drizzle-orm";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { config, validateEnv } from "./config";
import { db, testConnection } from "./db";
import {
    ApiError,
    asyncHandler,
    errorHandler,
    requestLogger,
    securityHeaders,
    validateBody,
    validateParams,
    validateQuery,
} from "./middleware";
import { items, lots, sales } from "./schema";
import {
    createItemBatchSchema,
    createItemSchema,
    createLotSchema,
    createSaleSchema,
    itemIdSchema,
    itemQuerySchema,
    lotIdSchema,
    saleIdSchema,
    saleQuerySchema,
    updateItemSchema,
    updateItemStatusSchema,
    updateLotSchema,
} from "./validation";

// Validate environment on startup
validateEnv();

const app = express();

// ============ GLOBAL MIDDLEWARE ============

// Security
app.use(helmet());
app.use(securityHeaders);

// CORS
app.use(cors({
  origin: config.security.corsOrigins,
  credentials: true,
}));

// Rate limiting
if (config.features.enableRateLimiting) {
  app.use(rateLimit({
    windowMs: config.security.rateLimitWindowMs,
    max: config.security.rateLimitMax,
    message: { error: { message: 'Too many requests', code: 'RATE_LIMITED' } },
    standardHeaders: true,
    legacyHeaders: false,
  }));
}

// Body parsing
app.use(express.json({ limit: '10mb' }));

// Logging
if (config.features.enableLogging) {
  app.use(requestLogger);
}

// ============ HEALTH & STATUS ============

app.get("/api/health", asyncHandler(async (req, res) => {
  const dbOk = await testConnection();
  const status = dbOk ? 'healthy' : 'degraded';
  
  res.status(dbOk ? 200 : 503).json({
    status,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    services: {
      database: dbOk ? 'connected' : 'disconnected',
    },
  });
}));

// ============ LOTS ROUTES ============

app.get("/api/lots", asyncHandler(async (req, res) => {
  const result = await db.select().from(lots).orderBy(desc(lots.buyDate));
  res.json({ data: result, count: result.length });
}));

app.get("/api/lots/:id", 
  validateParams(lotIdSchema),
  asyncHandler(async (req, res) => {
    const { id } = (res.locals.params || req.params) as { id: number };
    const result = await db.select().from(lots).where(eq(lots.id, id));
    
    if (result.length === 0) {
      throw ApiError.notFound('Lot not found');
    }
    
    res.json({ data: result[0] });
  })
);

app.post("/api/lots",
  validateBody(createLotSchema),
  asyncHandler(async (req, res) => {
    const result = await db.insert(lots).values(req.body).returning();
    res.status(201).json({ data: result[0], message: 'Lot created successfully' });
  })
);

app.put("/api/lots/:id",
  validateParams(lotIdSchema),
  validateBody(updateLotSchema),
  asyncHandler(async (req, res) => {
    const { id } = (res.locals.params || req.params) as { id: number };
    const result = await db
      .update(lots)
      .set({ ...req.body, updatedAt: sql`CURRENT_TIMESTAMP` })
      .where(eq(lots.id, id))
      .returning();
    
    if (result.length === 0) {
      throw ApiError.notFound('Lot not found');
    }
    
    res.json({ data: result[0], message: 'Lot updated successfully' });
  })
);

app.delete("/api/lots/:id",
  validateParams(lotIdSchema),
  asyncHandler(async (req, res) => {
    const { id } = (res.locals.params || req.params) as { id: number };
    const result = await db.delete(lots).where(eq(lots.id, id)).returning();
    
    if (result.length === 0) {
      throw ApiError.notFound('Lot not found');
    }
    
    res.status(200).json({ message: 'Lot deleted successfully' });
  })
);

// ============ ITEMS ROUTES ============

app.get("/api/items",
  validateQuery(itemQuerySchema),
  asyncHandler(async (req, res) => {
    const { lotId, status } = (res.locals.query || req.query) as { lotId?: number; status?: string };
    
    let result;
    if (lotId) {
      result = await db.select().from(items).where(eq(items.lotId, lotId));
    } else if (status) {
      result = await db.select().from(items).where(eq(items.status, status));
    } else {
      result = await db.select().from(items);
    }
    
    res.json({ data: result, count: result.length });
  })
);

app.get("/api/items/:id",
  validateParams(itemIdSchema),
  asyncHandler(async (req, res) => {
    const { id } = (res.locals.params || req.params) as { id: number };
    const result = await db.select().from(items).where(eq(items.id, id));
    
    if (result.length === 0) {
      throw ApiError.notFound('Item not found');
    }
    
    res.json({ data: result[0] });
  })
);

app.post("/api/items",
  validateBody(createItemSchema),
  asyncHandler(async (req, res) => {
    // Verify lot exists
    const lot = await db.select().from(lots).where(eq(lots.id, req.body.lotId));
    if (lot.length === 0) {
      throw ApiError.badRequest('Referenced lot does not exist', 'INVALID_LOT_ID');
    }
    
    const result = await db.insert(items).values(req.body).returning();
    res.status(201).json({ data: result[0], message: 'Item created successfully' });
  })
);

app.post("/api/items/batch",
  validateBody(createItemBatchSchema),
  asyncHandler(async (req, res) => {
    const itemsData = req.body;
    
    // Verify all lots exist
    const lotIds = [...new Set(itemsData.map((i: { lotId: number }) => i.lotId))] as number[];
    for (const lotId of lotIds) {
      const lot = await db.select().from(lots).where(eq(lots.id, lotId));
      if (lot.length === 0) {
        throw ApiError.badRequest(`Lot with ID ${lotId} does not exist`, 'INVALID_LOT_ID');
      }
    }
    
    const result = await db.insert(items).values(itemsData).returning();
    res.status(201).json({
      data: result, 
      count: result.length,
      message: `${result.length} items created successfully` 
    });
  })
);

app.put("/api/items/:id",
  validateParams(itemIdSchema),
  validateBody(updateItemSchema),
  asyncHandler(async (req, res) => {
    const { id } = (res.locals.params || req.params) as { id: number };
    const result = await db
      .update(items)
      .set({ ...req.body, updatedAt: sql`CURRENT_TIMESTAMP` })
      .where(eq(items.id, id))
      .returning();
    
    if (result.length === 0) {
      throw ApiError.notFound('Item not found');
    }
    
    res.json({ data: result[0], message: 'Item updated successfully' });
  })
);

app.patch("/api/items/:id/status",
  validateParams(itemIdSchema),
  validateBody(updateItemStatusSchema),
  asyncHandler(async (req, res) => {
    const { id } = (res.locals.params || req.params) as { id: number };
    const { status } = req.body;
    
    const result = await db
      .update(items)
      .set({ status, updatedAt: sql`CURRENT_TIMESTAMP` })
      .where(eq(items.id, id))
      .returning();
    
    if (result.length === 0) {
      throw ApiError.notFound('Item not found');
    }
    
    res.json({ data: result[0], message: 'Item status updated successfully' });
  })
);

app.delete("/api/items/:id",
  validateParams(itemIdSchema),
  asyncHandler(async (req, res) => {
    const { id } = (res.locals.params || req.params) as { id: number };
    const result = await db.delete(items).where(eq(items.id, id)).returning();
    
    if (result.length === 0) {
      throw ApiError.notFound('Item not found');
    }
    
    res.status(200).json({ message: 'Item deleted successfully' });
  })
);

// ============ SALES ROUTES ============

app.get("/api/sales",
  validateQuery(saleQuerySchema),
  asyncHandler(async (req, res) => {
    const { lotId } = (res.locals.query || req.query) as { lotId?: number };
    
    let result;
    if (lotId) {
      result = await db.select().from(sales).where(eq(sales.lotId, lotId)).orderBy(desc(sales.saleDate));
    } else {
      result = await db.select().from(sales).orderBy(desc(sales.saleDate));
    }
    
    res.json({ data: result, count: result.length });
  })
);

app.get("/api/sales/revenue",
  validateQuery(saleQuerySchema),
  asyncHandler(async (req, res) => {
    const { lotId } = (res.locals.query || req.query) as { lotId?: number };
    
    let result;
    if (lotId) {
      result = await db
        .select({ total: sum(sales.priceNet) })
        .from(sales)
        .where(eq(sales.lotId, lotId));
    } else {
      result = await db.select({ total: sum(sales.priceNet) }).from(sales);
    }
    
    res.json({ 
      data: { 
        total: parseFloat(result[0]?.total || "0"),
        currency: 'EUR',
      } 
    });
  })
);

app.get("/api/sales/:id",
  validateParams(saleIdSchema),
  asyncHandler(async (req, res) => {
    const { id } = (res.locals.params || req.params) as { id: number };
    const result = await db.select().from(sales).where(eq(sales.id, id));
    
    if (result.length === 0) {
      throw ApiError.notFound('Sale not found');
    }
    
    res.json({ data: result[0] });
  })
);

app.post("/api/sales",
  validateBody(createSaleSchema),
  asyncHandler(async (req, res) => {
    // Verify lot exists
    const lot = await db.select().from(lots).where(eq(lots.id, req.body.lotId));
    if (lot.length === 0) {
      throw ApiError.badRequest('Referenced lot does not exist', 'INVALID_LOT_ID');
    }
    
    // Verify item exists if provided
    if (req.body.itemId) {
      const item = await db.select().from(items).where(eq(items.id, req.body.itemId));
      if (item.length === 0) {
        throw ApiError.badRequest('Referenced item does not exist', 'INVALID_ITEM_ID');
      }
    }
    
    const result = await db.insert(sales).values(req.body).returning();
    res.status(201).json({ data: result[0], message: 'Sale recorded successfully' });
  })
);

app.delete("/api/sales/:id",
  validateParams(saleIdSchema),
  asyncHandler(async (req, res) => {
    const { id } = (res.locals.params || req.params) as { id: number };
    const result = await db.delete(sales).where(eq(sales.id, id)).returning();
    
    if (result.length === 0) {
      throw ApiError.notFound('Sale not found');
    }
    
    res.status(200).json({ message: 'Sale deleted successfully' });
  })
);

// ============ ERROR HANDLING ============

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      message: `Route ${req.method} ${req.path} not found`,
      code: 'NOT_FOUND',
    },
  });
});

// Global error handler
app.use(errorHandler);

// ============ SERVER STARTUP ============

const server = app.listen(config.server.port, async () => {
  console.log(`
🚀 Optimus Vintage API Server
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Port: ${config.server.port}
🌍 Environment: ${config.server.env}
🔒 Rate Limiting: ${config.features.enableRateLimiting ? 'Enabled' : 'Disabled'}
📝 Logging: ${config.features.enableLogging ? 'Enabled' : 'Disabled'}
  `);
  
  const dbConnected = await testConnection();
  if (!dbConnected) {
    console.error('❌ Failed to connect to database. Server may not function correctly.');
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});

export default app;
