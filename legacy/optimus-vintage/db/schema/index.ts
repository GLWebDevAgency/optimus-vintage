import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

// LOTS
export const lots = sqliteTable("lots", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name"),
  provider: text("provider").notNull(), // Eureka, Fleek, etc.
  buyDate: text("buy_date").notNull(), // ISO Date string
  type: text("type").notNull().default("BULK"), // 'BULK' | 'PIECEWISE'

  // Costs
  totalCost: real("total_cost").notNull(),
  additionalFees: real("additional_fees").default(0),

  // Specs
  initialQuantity: integer("initial_quantity").notNull(),
  currency: text("currency").default("EUR"),

  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
  updatedAt: text("updated_at").default("CURRENT_TIMESTAMP"),
});

// ITEMS (Pièces)
export const items = sqliteTable("items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  lotId: integer("lot_id")
    .references(() => lots.id)
    .notNull(),

  // Details
  brand: text("brand"),
  type: text("type"), // pull, polaire, doudoune...
  color: text("color"),
  size: text("size"),
  condition: text("condition"), // neuf, tbe, bon...

  // Financials
  unitCost: real("unit_cost").notNull(), // Calculated or overridden

  // Status
  status: text("status").notNull().default("STOCK"), // STOCK, ONLINE, SOLD, RETURNED, LOST
  photos: text("photos"), // JSON string of array of paths

  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
  updatedAt: text("updated_at").default("CURRENT_TIMESTAMP"),
});

// SALES (Ventes)
export const sales = sqliteTable("sales", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  itemId: integer("item_id").references(() => items.id), // Nullable if "Quick Sale" linked only to Lot (optimization for MVP)?
  // Wait, user spec says: "id, itemId (ou vente “rapide” rattachée à un lot si item pas créé)"
  // So we probably need a lotId here too if itemId is null
  lotId: integer("lot_id")
    .references(() => lots.id)
    .notNull(),

  platform: text("platform").default("VINTED"), // Vinted, Depop, etc.

  // Prices
  priceGross: real("price_gross").notNull(),
  platformFees: real("platform_fees").default(0),
  shippingFees: real("shipping_fees").default(0),
  miscFees: real("misc_fees").default(0), // Packaging, etc.
  priceNet: real("price_net").notNull(), // Stored for easier querying, or calc on fly? Storing is safer for history.

  saleDate: text("sale_date").notNull(), // ISO Date string
  status: text("status").notNull().default("COMPLETED"), // COMPLETED, PENDING, CANCELLED, REFUNDED

  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
  updatedAt: text("updated_at").default("CURRENT_TIMESTAMP"),
});
