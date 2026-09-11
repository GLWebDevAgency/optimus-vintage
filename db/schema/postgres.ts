import {
    date,
    decimal,
    index,
    integer,
    pgTable,
    serial,
    text,
    timestamp,
} from "drizzle-orm/pg-core";

// LOTS
export const lots = pgTable("lots", {
  id: serial("id").primaryKey(),
  name: text("name"),
  provider: text("provider").notNull(),
  buyDate: date("buy_date").notNull(),
  type: text("type").notNull().default("BULK"), // 'BULK' | 'PIECEWISE'

  // Costs
  totalCost: decimal("total_cost", { precision: 10, scale: 2 }).notNull(),
  additionalFees: decimal("additional_fees", { precision: 10, scale: 2 }).default("0"),

  // Specs
  initialQuantity: integer("initial_quantity").notNull(),
  currency: text("currency").default("EUR"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ITEMS (Pièces)
export const items = pgTable("items", {
  id: serial("id").primaryKey(),
  lotId: integer("lot_id")
    .references(() => lots.id, { onDelete: "cascade" })
    .notNull(),

  // Details
  brand: text("brand"),
  type: text("type"),
  color: text("color"),
  size: text("size"),
  condition: text("condition"),

  // Financials
  unitCost: decimal("unit_cost", { precision: 10, scale: 2 }).notNull(),

  // Status
  status: text("status").notNull().default("STOCK"), // STOCK, ONLINE, SOLD, RETURNED, LOST
  photos: text("photos"), // JSON string of array of paths

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  lotIdIdx: index("idx_items_lot_id").on(table.lotId),
  statusIdx: index("idx_items_status").on(table.status),
}));

// SALES (Ventes)
export const sales = pgTable("sales", {
  id: serial("id").primaryKey(),
  itemId: integer("item_id").references(() => items.id, { onDelete: "set null" }),
  lotId: integer("lot_id")
    .references(() => lots.id, { onDelete: "cascade" })
    .notNull(),

  platform: text("platform").default("VINTED"),

  // Prices
  priceGross: decimal("price_gross", { precision: 10, scale: 2 }).notNull(),
  platformFees: decimal("platform_fees", { precision: 10, scale: 2 }).default("0"),
  shippingFees: decimal("shipping_fees", { precision: 10, scale: 2 }).default("0"),
  miscFees: decimal("misc_fees", { precision: 10, scale: 2 }).default("0"),
  priceNet: decimal("price_net", { precision: 10, scale: 2 }).notNull(),

  saleDate: date("sale_date").notNull(),
  status: text("status").notNull().default("COMPLETED"), // COMPLETED, PENDING, CANCELLED, REFUNDED

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  lotIdIdx: index("idx_sales_lot_id").on(table.lotId),
  itemIdIdx: index("idx_sales_item_id").on(table.itemId),
  statusIdx: index("idx_sales_status").on(table.status),
}));

// Types exports
export type Lot = typeof lots.$inferSelect;
export type NewLot = typeof lots.$inferInsert;
export type Item = typeof items.$inferSelect;
export type NewItem = typeof items.$inferInsert;
export type Sale = typeof sales.$inferSelect;
export type NewSale = typeof sales.$inferInsert;
