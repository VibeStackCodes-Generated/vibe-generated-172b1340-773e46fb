/**
 * Sample data for testing and demonstration of the matching engine
 */

import type { Invoice, Transaction } from '@/types/matching'

export const SAMPLE_INVOICES: Invoice[] = [
  {
    id: 'INV-001',
    amount: 1500.0,
    date: new Date('2024-01-15'),
    dueDate: new Date('2024-02-15'),
    customerId: 'CUST-001',
    customerName: 'Acme Corporation',
    referenceId: 'INV-2024-001',
    description: 'Monthly retainer services',
    status: 'pending',
  },
  {
    id: 'INV-002',
    amount: 2500.5,
    date: new Date('2024-01-20'),
    dueDate: new Date('2024-02-20'),
    customerId: 'CUST-002',
    customerName: 'Tech Solutions Inc',
    referenceId: 'INV-2024-002',
    description: 'Software development services',
    status: 'pending',
  },
  {
    id: 'INV-003',
    amount: 750.0,
    date: new Date('2024-02-01'),
    dueDate: new Date('2024-03-01'),
    customerId: 'CUST-003',
    customerName: 'Digital Marketing Agency',
    referenceId: 'ORD-5678',
    description: 'Q1 marketing consultation',
    status: 'pending',
  },
  {
    id: 'INV-004',
    amount: 3200.0,
    date: new Date('2024-02-05'),
    dueDate: new Date('2024-03-05'),
    customerId: 'CUST-004',
    customerName: 'Global Enterprises Ltd',
    referenceId: 'INV-2024-004',
    description: 'Consulting engagement',
    status: 'pending',
  },
]

export const SAMPLE_TRANSACTIONS: Transaction[] = [
  {
    id: 'TXN-001',
    amount: 1500.0,
    date: new Date('2024-01-16'),
    description: 'Deposit - Acme Corp payment',
    reference: 'ACH-789456',
    source: 'bank',
    status: 'pending',
  },
  {
    id: 'TXN-002',
    amount: 2500.5,
    date: new Date('2024-01-21'),
    description: 'Tech Solutions Inc - INV-2024-002',
    reference: 'WIRE-123456',
    source: 'bank',
    status: 'pending',
  },
  {
    id: 'TXN-003',
    amount: 750.0,
    date: new Date('2024-02-02'),
    description: 'Digital Marketing Agency order 5678',
    reference: 'CC-987654',
    source: 'payment_processor',
    status: 'pending',
  },
  {
    id: 'TXN-004',
    amount: 3200.0,
    date: new Date('2024-02-10'),
    description: 'Payment from Global Enterprises',
    reference: 'ACH-456123',
    source: 'bank',
    status: 'pending',
  },
  {
    id: 'TXN-005',
    amount: 500.0,
    date: new Date('2024-02-15'),
    description: 'Acme Corp partial payment',
    reference: 'ACH-789999',
    source: 'bank',
    status: 'pending',
  },
  {
    id: 'TXN-006',
    amount: 1000.0,
    date: new Date('2024-03-01'),
    description: 'Unknown customer payment',
    reference: 'WIRE-999999',
    source: 'bank',
    status: 'pending',
  },
]
