import { relations } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  password_hash: text('password_hash'),
  role: text('role', {
    enum: ['DIRECTOR', 'FINANCE', 'VETTING', 'DOCUMENTATION'],
  }).notNull(),
  invite_code: text('invite_code').unique(),
  created_at: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const clients = sqliteTable('clients', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  company_name: text('company_name').notNull(),
  cac_number: text('cac_number').notNull(),
});

export const clientsRelations = relations(clients, ({ many }) => ({
  applications: many(applications),
}));

export const applications = sqliteTable('applications', {
  id: integer('id').primaryKey({ autoIncrement: true }),
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
}));

export const documents = sqliteTable('documents', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  application_id: integer('application_id')
    .references(() => applications.id)
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
