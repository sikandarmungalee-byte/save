import fs from 'fs';
import path from 'path';
import { ERPDatabase, User, CompanySettings } from '../src/types/erp';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DATA_DIR, 'erp-database.json');

// Clean production baseline: Savouré Luxury Artisanal Brand
export const CLEAN_COMPANY: CompanySettings = {
  companyName: 'Savouré (Pty) Ltd',
  tradingName: 'Savouré - A Taste of Tradition',
  registrationNumber: '2023/481920/07',
  vatNumber: '4120938471',
  address: 'Johannesburg, Gauteng, South Africa',
  phone: '+27 (0)11 789 2200',
  email: 'admin@savoure.co.za',
  currency: 'R',
  vatRate: 15,
  bankName: 'First National Bank (FNB)',
  accountHolder: 'Savouré (Pty) Ltd',
  accountNumber: '62983104821',
  branchCode: '250655',
  swiftCode: 'FIRNZAJJ',
  defaultPaymentTerms: 'Strictly 30 days from invoice date. Please use your invoice number as EFT payment reference.',
  pinCode: '1234',
  logoUrl: '/src/assets/images/savoure_master_logo_1790775722136.jpg',
};

export const CLEAN_USERS: User[] = [];

export function getCleanEmptyDatabase(): ERPDatabase {
  return {
    users: [],
    company: CLEAN_COMPANY,
    customers: [],
    products: [],
    categories: [],
    invoices: [],
    deliveryNotes: [],
    quotations: [],
    payments: [],
    leads: [],
    communications: [],
    lastUpdated: new Date().toISOString(),
  };
}

export function getDatabase(): ERPDatabase {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      const initialDb = getCleanEmptyDatabase();
      fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2), 'utf-8');
      return initialDb;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as ERPDatabase;
    return parsed;
  } catch (err) {
    console.error('Error reading database file:', err);
    return getCleanEmptyDatabase();
  }
}

export function saveDatabase(db: ERPDatabase): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    db.lastUpdated = new Date().toISOString();
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing database file:', err);
  }
}

export function purgeAllFakeData(): ERPDatabase {
  const current = getDatabase();
  const purgedDb: ERPDatabase = {
    users: current.users.filter(u => u.email.toLowerCase() === 'sikandarmungalee@gmail.com' || u.role === 'super_admin'),
    company: current.company || CLEAN_COMPANY,
    customers: [],
    products: [],
    invoices: [],
    deliveryNotes: [],
    quotations: [],
    payments: [],
    leads: [],
    communications: [],
    lastUpdated: new Date().toISOString(),
  };
  saveDatabase(purgedDb);
  return purgedDb;
}
