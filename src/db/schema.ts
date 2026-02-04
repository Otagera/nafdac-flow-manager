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
}));

export const documents = pgTable('documents', {
  id: serial('id').primaryKey(),
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
