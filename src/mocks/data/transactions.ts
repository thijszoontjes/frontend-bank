import type { Transaction } from '@/types/transaction'

export const mockTransactions: Transaction[] = [
  {
    transactionId: 1001,
    transactionType: 'TRANSFER',
    status: 'COMPLETED',
    amount: 3400,
    currency: 'EUR',
    description: 'Salary April',
    createdAt: '2026-04-12T07:45:00Z',
    fromAccount: {
      iban: 'NL76BANK1111222233',
    },
    toAccount: {
      iban: 'NL20BANK0123456789',
      accountType: 'CHECKING',
    },
    initiator: {
      userId: 10,
      firstName: 'Evelyn',
      lastName: 'Banks',
      role: 'EMPLOYEE',
    },
  },
  {
    transactionId: 1002,
    transactionType: 'TRANSFER',
    status: 'COMPLETED',
    amount: 1285,
    currency: 'EUR',
    description: 'Rent Payment',
    createdAt: '2026-04-05T09:10:00Z',
    fromAccount: {
      iban: 'NL20BANK0123456789',
      accountType: 'CHECKING',
    },
    toAccount: {
      iban: 'NL91BANK9876543210',
      accountType: 'SAVINGS',
    },
    initiator: {
      userId: 1,
      firstName: 'Emma',
      lastName: 'Verbeek',
      role: 'CUSTOMER',
    },
  },
  {
    transactionId: 1003,
    transactionType: 'TRANSFER',
    status: 'COMPLETED',
    amount: 87.44,
    currency: 'EUR',
    description: 'Supermarket',
    createdAt: '2026-04-14T17:20:00Z',
    fromAccount: {
      iban: 'NL20BANK0123456789',
      accountType: 'CHECKING',
    },
    toAccount: {
      iban: 'NL91BANK9876543210',
      accountType: 'SAVINGS',
    },
    initiator: {
      userId: 1,
      firstName: 'Emma',
      lastName: 'Verbeek',
      role: 'CUSTOMER',
    },
  },
  {
    transactionId: 1004,
    transactionType: 'TRANSFER',
    status: 'COMPLETED',
    amount: 250,
    currency: 'EUR',
    description: 'Internal savings top-up',
    createdAt: '2026-04-15T06:45:00Z',
    fromAccount: {
      iban: 'NL20BANK0123456789',
      accountType: 'CHECKING',
    },
    toAccount: {
      iban: 'NL91BANK9876543210',
      accountType: 'SAVINGS',
    },
    initiator: {
      userId: 1,
      firstName: 'Emma',
      lastName: 'Verbeek',
      role: 'CUSTOMER',
    },
  },
  {
    transactionId: 1005,
    transactionType: 'TRANSFER',
    status: 'COMPLETED',
    amount: 920,
    currency: 'EUR',
    description: 'Corporate refund',
    createdAt: '2026-04-13T13:05:00Z',
    fromAccount: {
      iban: 'NL76BANK1111222233',
    },
    toAccount: {
      iban: 'NL14BANK1000000004',
      accountType: 'CHECKING',
    },
    initiator: {
      userId: 10,
      firstName: 'Evelyn',
      lastName: 'Banks',
      role: 'EMPLOYEE',
    },
  },
]