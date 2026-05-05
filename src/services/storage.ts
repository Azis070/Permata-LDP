import { Toddler, Measurement, User, UserAccount } from '../types';

// Storage Key
const STORAGE_KEY = 'permata_peris_v3';

export interface AppData {
  posyandus: { id: string; name: string }[];
  toddlers: Toddler[];
  measurements: Measurement[];
  currentUser?: User;
  accounts: UserAccount[];
}

const INITIAL_DATA: AppData = {
  posyandus: Array.from({ length: 7 }, (_, i) => ({
    id: `melati-${i + 1}`,
    name: `Posyandu Melati ${i + 1}`
  })),
  toddlers: [],
  measurements: [],
  accounts: [
    {
      id: 'admin-main',
      username: 'admin',
      password: '123',
      role: 'ADMIN',
      isVerified: true
    }
  ]
};

class StorageService {
  private data: AppData;

  constructor() {
    const saved = localStorage.getItem(STORAGE_KEY);
    this.data = saved ? JSON.parse(saved) : INITIAL_DATA;
    // Migrate if needed
    if (!this.data.accounts) {
        this.data.accounts = INITIAL_DATA.accounts;
        this.save();
    }
  }

  private save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
  }

  // Auth Methods
  register(account: Omit<UserAccount, 'id' | 'isVerified'>) {
    const newAccount: UserAccount = {
        ...account,
        id: crypto.randomUUID(),
        isVerified: account.role === 'ADMIN' // Admin auto verify for demo usually, but we'll follow logic
    };
    if (this.data.accounts.find(a => a.username === account.username)) {
        throw new Error('Username sudah digunakan');
    }
    this.data.accounts.push(newAccount);
    this.save();
    return newAccount;
  }

  login(username: string, password: string): User {
    const account = this.data.accounts.find(a => a.username === username && a.password === password);
    if (!account) throw new Error('Username atau password salah');
    if (!account.isVerified) throw new Error('Akun Anda belum diverifikasi oleh Admin. Silakan hubungi Admin Desa.');
    this.data.currentUser = { ...account };
    this.save();
    return this.data.currentUser;
  }

  logout() {
    delete this.data.currentUser;
    this.save();
  }

  getUser(): User | undefined {
    return this.data.currentUser;
  }

  getPendingAccounts() {
    return this.data.accounts.filter(a => !a.isVerified);
  }

  getAllAccounts() {
    return this.data.accounts;
  }

  verifyAccount(userId: string) {
    const account = this.data.accounts.find(a => a.id === userId);
    if (account) {
        account.isVerified = true;
        this.save();
    }
  }

  deleteAccount(userId: string) {
    // Prevent deleting the main admin account from within the app to ensure system access
    if (userId === 'admin-main') {
        throw new Error('Akun Admin utama tidak bisa dihapus');
    }
    this.data.accounts = this.data.accounts.filter(a => a.id !== userId);
    this.save();
  }

  // Rest of methods...
  getPosyandus() {
    return this.data.posyandus;
  }

  addPosyandu(name: string) {
    const newPosyandu = {
      id: `custom-${crypto.randomUUID()}`,
      name: name
    };
    this.data.posyandus.push(newPosyandu);
    this.save();
    return newPosyandu;
  }

  getPosyandu(id: string) {
    return this.data.posyandus.find(p => p.id === id);
  }

  getToddlers(posyanduId?: string) {
    if (posyanduId) {
      return this.data.toddlers.filter(t => t.posyanduId === posyanduId);
    }
    return this.data.toddlers;
  }

  addToddler(toddler: any) {
    const newToddler = { ...toddler, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    this.data.toddlers.push(newToddler);
    this.save();
    return newToddler;
  }

  getMeasurements(toddlerId: string) {
    return this.data.measurements
      .filter(m => m.toddlerId === toddlerId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  addMeasurement(measurement: any) {
    const newMeasurement = { ...measurement, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    this.data.measurements.push(newMeasurement);
    this.save();
    return newMeasurement;
  }

  exportToJSON() {
    return this.data;
  }
}

export const storage = new StorageService();
