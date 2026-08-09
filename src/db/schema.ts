import {
  pgTable,
  text,
  timestamp,
  boolean,
  numeric,
  uuid,
  pgEnum,
  index,
  uniqueIndex,
  check,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

// Enums
export const billStatusEnum = pgEnum("bill_status", [
  "pending",
  "approved",
  "rejected",
]);

export const settlementStatusEnum = pgEnum("settlement_status", [
  "pending",
  "approved",
  "rejected",
]);

export const ledgerSourceTypeEnum = pgEnum("ledger_source_type", [
  "bill",
  "settlement",
  "reversal",
  "adjustment",
]);

export const billCategoryEnum = pgEnum("bill_category", [
  "breakfast",
  "lunch",
  "dinner",
  "groceries",
  "transportation",
  "utilities",
  "rent",
  "entertainment",
  "vacation",
  "shopping",
  "healthcare",
  "other",
]);

// Users table (Better Auth compatible)
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Sessions table (Better Auth)
export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
});

// Accounts table (Better Auth)
export const accounts = pgTable("accounts", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Verification tokens (Better Auth)
export const verifications = pgTable("verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Jemaws (Groups)
export const jemaws = pgTable("jemaws", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  currency: text("currency").notNull().default("USD"),
  createdById: text("created_by_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  archivedAt: timestamp("archived_at"),
});

// Jemaw Members (Group membership)
export const jemawMembers = pgTable(
  "jemaw_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    jemawId: uuid("jemaw_id")
      .notNull()
      .references(() => jemaws.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    balance: numeric("balance", { precision: 12, scale: 2 })
      .notNull()
      .default("0.00"),
    isAdmin: boolean("is_admin").notNull().default(false),
    joinedAt: timestamp("joined_at").notNull().defaultNow(),
  },
  (table) => [
    index("jemaw_members_jemaw_idx").on(table.jemawId),
    index("jemaw_members_user_idx").on(table.userId),
    uniqueIndex("jemaw_members_jemaw_user_unique").on(
      table.jemawId,
      table.userId
    ),
  ]
);

// Jemaw Invitations
export const jemawInvitations = pgTable(
  "jemaw_invitations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    jemawId: uuid("jemaw_id")
      .notNull()
      .references(() => jemaws.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    invitedById: text("invited_by_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    expiresAt: timestamp("expires_at").notNull(),
    acceptedAt: timestamp("accepted_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("jemaw_invitations_email_idx").on(table.email),
    index("jemaw_invitations_token_idx").on(table.token),
  ]
);

// Bills (Expenses)
export const bills = pgTable(
  "bills",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    jemawId: uuid("jemaw_id")
      .notNull()
      .references(() => jemaws.id, { onDelete: "cascade" }),
    description: text("description").notNull(),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    category: billCategoryEnum("category").notNull().default("other"),
    paidById: text("paid_by_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: billStatusEnum("status").notNull().default("pending"),
    approvedById: text("approved_by_id").references(() => users.id),
    approvedAt: timestamp("approved_at"),
    receiptUrl: text("receipt_url"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("bills_jemaw_idx").on(table.jemawId),
    index("bills_paid_by_idx").on(table.paidById),
    index("bills_status_idx").on(table.status),
    index("bills_jemaw_status_created_idx").on(
      table.jemawId,
      table.status,
      table.createdAt
    ),
    check("bills_amount_positive", sql`${table.amount} > 0`),
  ]
);

// Bill Splits (How bills are divided among users)
export const billSplits = pgTable(
  "bill_splits",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    billId: uuid("bill_id")
      .notNull()
      .references(() => bills.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("bill_splits_bill_idx").on(table.billId),
    index("bill_splits_user_idx").on(table.userId),
    uniqueIndex("bill_splits_bill_user_unique").on(
      table.billId,
      table.userId
    ),
    check("bill_splits_amount_positive", sql`${table.amount} > 0`),
  ]
);

// Settlements (Debt payments)
export const settlements = pgTable(
  "settlements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    jemawId: uuid("jemaw_id")
      .notNull()
      .references(() => jemaws.id, { onDelete: "cascade" }),
    payerId: text("payer_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    receiverId: text("receiver_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    description: text("description"),
    paymentProofUrl: text("payment_proof_url"),
    rejectionReason: text("rejection_reason"),
    status: settlementStatusEnum("status").notNull().default("pending"),
    approvedAt: timestamp("approved_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("settlements_jemaw_idx").on(table.jemawId),
    index("settlements_payer_idx").on(table.payerId),
    index("settlements_receiver_idx").on(table.receiverId),
    index("settlements_status_idx").on(table.status),
    index("settlements_receiver_status_created_idx").on(
      table.receiverId,
      table.status,
      table.createdAt
    ),
    check("settlements_amount_positive", sql`${table.amount} > 0`),
    check(
      "settlements_distinct_parties",
      sql`${table.payerId} <> ${table.receiverId}`
    ),
  ]
);

// Activity Logs
export const activityLogs = pgTable(
  "activity_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    jemawId: uuid("jemaw_id")
      .notNull()
      .references(() => jemaws.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    action: text("action").notNull(),
    targetType: text("target_type").notNull(),
    targetId: text("target_id").notNull(),
    metadata: text("metadata"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("activity_logs_jemaw_idx").on(table.jemawId),
    index("activity_logs_user_idx").on(table.userId),
  ]
);

// Notifications
export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    message: text("message").notNull(),
    link: text("link").notNull(),
    read: boolean("read").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("notifications_user_idx").on(table.userId),
    index("notifications_user_read_created_idx").on(
      table.userId,
      table.read,
      table.createdAt
    ),
  ]
);

// Append-only financial entries. jemaw_members.balance is a rebuildable cache.
export const ledgerEntries = pgTable(
  "ledger_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    jemawId: uuid("jemaw_id")
      .notNull()
      .references(() => jemaws.id, { onDelete: "restrict" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    currency: text("currency").notNull(),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    sourceType: ledgerSourceTypeEnum("source_type").notNull(),
    sourceId: uuid("source_id").notNull(),
    description: text("description"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("ledger_entries_jemaw_created_idx").on(
      table.jemawId,
      table.createdAt
    ),
    index("ledger_entries_user_created_idx").on(
      table.userId,
      table.createdAt
    ),
    uniqueIndex("ledger_entries_source_user_unique").on(
      table.sourceType,
      table.sourceId,
      table.userId
    ),
    check("ledger_entries_amount_nonzero", sql`${table.amount} <> 0`),
  ]
);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  accounts: many(accounts),
  jemawMemberships: many(jemawMembers),
  createdJemaws: many(jemaws),
  paidBills: many(bills, { relationName: "paidBills" }),
  approvedBills: many(bills, { relationName: "approvedBills" }),
  billSplits: many(billSplits),
  sentSettlements: many(settlements, { relationName: "payer" }),
  receivedSettlements: many(settlements, { relationName: "receiver" }),
  sentInvitations: many(jemawInvitations),
  activityLogs: many(activityLogs),
  notifications: many(notifications),
  ledgerEntries: many(ledgerEntries),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const jemawsRelations = relations(jemaws, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [jemaws.createdById],
    references: [users.id],
  }),
  members: many(jemawMembers),
  bills: many(bills),
  settlements: many(settlements),
  invitations: many(jemawInvitations),
  activityLogs: many(activityLogs),
  ledgerEntries: many(ledgerEntries),
}));

export const jemawMembersRelations = relations(jemawMembers, ({ one }) => ({
  jemaw: one(jemaws, {
    fields: [jemawMembers.jemawId],
    references: [jemaws.id],
  }),
  user: one(users, {
    fields: [jemawMembers.userId],
    references: [users.id],
  }),
}));

export const jemawInvitationsRelations = relations(
  jemawInvitations,
  ({ one }) => ({
    jemaw: one(jemaws, {
      fields: [jemawInvitations.jemawId],
      references: [jemaws.id],
    }),
    invitedBy: one(users, {
      fields: [jemawInvitations.invitedById],
      references: [users.id],
    }),
  })
);

export const billsRelations = relations(bills, ({ one, many }) => ({
  jemaw: one(jemaws, {
    fields: [bills.jemawId],
    references: [jemaws.id],
  }),
  paidBy: one(users, {
    fields: [bills.paidById],
    references: [users.id],
    relationName: "paidBills",
  }),
  approvedBy: one(users, {
    fields: [bills.approvedById],
    references: [users.id],
    relationName: "approvedBills",
  }),
  splits: many(billSplits),
}));

export const billSplitsRelations = relations(billSplits, ({ one }) => ({
  bill: one(bills, {
    fields: [billSplits.billId],
    references: [bills.id],
  }),
  user: one(users, {
    fields: [billSplits.userId],
    references: [users.id],
  }),
}));

export const settlementsRelations = relations(settlements, ({ one }) => ({
  jemaw: one(jemaws, {
    fields: [settlements.jemawId],
    references: [jemaws.id],
  }),
  payer: one(users, {
    fields: [settlements.payerId],
    references: [users.id],
    relationName: "payer",
  }),
  receiver: one(users, {
    fields: [settlements.receiverId],
    references: [users.id],
    relationName: "receiver",
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  jemaw: one(jemaws, {
    fields: [activityLogs.jemawId],
    references: [jemaws.id],
  }),
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const ledgerEntriesRelations = relations(ledgerEntries, ({ one }) => ({
  jemaw: one(jemaws, {
    fields: [ledgerEntries.jemawId],
    references: [jemaws.id],
  }),
  user: one(users, {
    fields: [ledgerEntries.userId],
    references: [users.id],
  }),
}));

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type Jemaw = typeof jemaws.$inferSelect;
export type NewJemaw = typeof jemaws.$inferInsert;
export type JemawMember = typeof jemawMembers.$inferSelect;
export type NewJemawMember = typeof jemawMembers.$inferInsert;
export type JemawInvitation = typeof jemawInvitations.$inferSelect;
export type Bill = typeof bills.$inferSelect;
export type NewBill = typeof bills.$inferInsert;
export type BillSplit = typeof billSplits.$inferSelect;
export type NewBillSplit = typeof billSplits.$inferInsert;
export type Settlement = typeof settlements.$inferSelect;
export type NewSettlement = typeof settlements.$inferInsert;

export type ActivityLog = typeof activityLogs.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type LedgerEntry = typeof ledgerEntries.$inferSelect;

export type BillStatus = "pending" | "approved" | "rejected";
export type SettlementStatus = "pending" | "approved" | "rejected";
export type BillCategory =
  | "breakfast"
  | "lunch"
  | "dinner"
  | "groceries"
  | "transportation"
  | "utilities"
  | "rent"
  | "entertainment"
  | "vacation"
  | "shopping"
  | "healthcare"
  | "other";
