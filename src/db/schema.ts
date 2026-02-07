import { relations } from 'drizzle-orm';
import { pgTable, serial, text, timestamp, integer } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  password_hash: text('password_hash'),
  role: text('role', {
    enum: ['DIRECTOR', 'FINANCE', 'VETTING', 'DOCUMENTATION'],
  }).notNull(),
  invite_code: text('invite_code').unique(),
  created_at: timestamp('created_at').defaultNow(),
});

export const clients = pgTable('clients', {
  id: serial('id').primaryKey(),
  company_name: text('company_name').notNull(),
  cac_number: text('cac_number').notNull(),
});

export const clientsRelations = relations(clients, ({ many }) => ({
  applications: many(applications),
}));

export const applications = pgTable('applications', {
  id: serial('id').primaryKey(),
  product_name: text('product_name').notNull(),
  client_id: integer('client_id')
    .references(() => clients.id)
    .notNull(),
  status: text('status', {
    enum: ['PENDING_DOCS', 'FINANCE_PENDING', 'VETTING_PROGRESS', 'NAFDAC_SUBMITTED', 'APPROVED'],
  })
    .notNull()
    .default('PENDING_DOCS'),
});

export const applicationsRelations = relations(applications, ({ one, many }) => ({
  client: one(clients, {
    fields: [applications.client_id],
    references: [clients.id],
  }),
  documents: many(documents),
  invoices: many(invoices),
}));

export const documents = pgTable('documents', {
  id: serial('id').primaryKey(),
  application_id: integer('application_id')
    .references(() => applications.id, { onDelete: 'cascade' })
    .notNull(),
  file_type: text('file_type').notNull(), // e.g., 'CAC', 'LABEL', 'SOP'
  file_path: text('file_path').notNull(),
});

export const documentsRelations = relations(documents, ({ one }) => ({
  application: one(applications, {
    fields: [documents.application_id],
    references: [applications.id],
  }),
}));

export const invoices = pgTable('invoices', {
  id: serial('id').primaryKey(),
  invoice_number: text('invoice_number').notNull().unique(),
  client_id: integer('client_id')
    .references(() => clients.id)
    .notNull(),
  application_id: integer('application_id').references(() => applications.id, { onDelete: 'cascade' }),
  total_amount: integer('total_amount').notNull().default(0),
  status: text('status', { enum: ['PENDING', 'PAID', 'VOID'] })
    .notNull()
    .default('PENDING'),
  created_at: timestamp('created_at').defaultNow(),
});

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  client: one(clients, {
    fields: [invoices.client_id],
    references: [clients.id],
  }),
  application: one(applications, {
    fields: [invoices.application_id],
    references: [applications.id],
  }),
  items: many(invoice_items),
}));

export const invoice_items = pgTable('invoice_items', {
  id: serial('id').primaryKey(),
  invoice_id: integer('invoice_id')
    .references(() => invoices.id, { onDelete: 'cascade' })
    .notNull(),
  description: text('description').notNull(), // e.g., 'SOP Writing'
  quantity: integer('quantity').notNull().default(1),
  unit_price: integer('unit_price').notNull(),
  amount: integer('amount').notNull(),
});

export const invoiceItemsRelations = relations(invoice_items, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoice_items.invoice_id],
    references: [invoices.id],
  }),
}));
