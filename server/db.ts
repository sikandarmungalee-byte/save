import fs from 'fs';
import path from 'path';
import { ERPDatabase, User, CompanySettings } from '../src/types/erp';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DATA_DIR, 'erp-database.json');

// Clean production baseline: Savouré Luxury Artisanal Brand
export const CLEAN_COMPANY: CompanySettings = {
  companyName: 'Savouré (Pty) Ltd',
  tradingName: 'Savouré - A Taste of Tradition',
  registrationNumber: '',
  vatNumber: '',
  address: 'Unit 4, Tradition Square, 18 Artisanal Way, Sandton, Johannesburg, 2196',
  phone: '061 364 5712',
  email: 'info@savoure.co.za',
  currency: 'R',
  vatRate: 0,
  bankName: 'First National Bank (FNB)',
  accountHolder: 'Savouré (Pty) Ltd',
  accountNumber: '62983104821',
  branchCode: '250655',
  swiftCode: 'FIRNZAJJ',
  defaultPaymentTerms: 'Strictly 30 days from invoice date. Please use your invoice number as EFT payment reference.',
  pinCode: '1234',
  logoUrl: '/images/savoure/savoure-logo.png',
};

export const MASTER_ADMIN_USER: User = {
  id: 'usr_master_savoure',
  name: 'Master Admin',
  email: 'admin@savoure.co.za',
  password: 'Shazia',
  role: 'super_admin',
  permissions: {
    manageUsers: true,
    invoices: true,
    deliveryNotes: true,
    quotations: true,
    payments: true,
    customers: true,
    catalog: true,
    reports: true,
    crmLeads: true,
    databaseExplorer: true,
    companySettings: true,
  },
  status: 'active',
  createdAt: new Date().toISOString(),
  lastLogin: new Date().toISOString(),
};

export const CLEAN_USERS: User[] = [MASTER_ADMIN_USER];

export function getCleanEmptyDatabase(): ERPDatabase {
  return {
    users: [MASTER_ADMIN_USER],
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

    // Guarantee that Master Admin admin@savoure.co.za / Shazia always exists and is active
    let modified = false;
    if (!Array.isArray(parsed.users)) {
      parsed.users = [];
      modified = true;
    }

    // Filter out dummy test users
    const filteredUsers = parsed.users.filter((u) => u.email.toLowerCase() !== 'test@test.com');
    if (filteredUsers.length !== parsed.users.length) {
      parsed.users = filteredUsers;
      modified = true;
    }

    const masterIndex = parsed.users.findIndex(
      (u) => u.email.toLowerCase() === 'admin@savoure.co.za'
    );

    if (masterIndex === -1) {
      parsed.users.unshift({ ...MASTER_ADMIN_USER });
      modified = true;
    } else {
      // Ensure password is Shazia and permissions are super admin
      if (parsed.users[masterIndex].password !== 'Shazia' || parsed.users[masterIndex].status !== 'active') {
        parsed.users[masterIndex].password = 'Shazia';
        parsed.users[masterIndex].status = 'active';
        parsed.users[masterIndex].role = 'super_admin';
        parsed.users[masterIndex].permissions = { ...MASTER_ADMIN_USER.permissions };
        modified = true;
      }
    }

    if (modified) {
      saveDatabase(parsed);
    }

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
