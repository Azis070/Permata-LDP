export interface Posyandu {
  id: string;
  name: string;
}

export interface Toddler {
  id: string;
  nik: string;
  name: string;
  birthPlace: string;
  birthDate: string;
  gender: 'L' | 'P';
  birthWeight: number; // kg
  birthHeight: number; // cm
  fatherName: string;
  motherName: string;
  address: string;
  fatherJob: string;
  motherJob: string;
  posyanduId: string;
  createdAt: string;
}

export interface Measurement {
  id: string;
  toddlerId: string;
  date: string;
  weight: number; // BB (kg)
  height: number; // TB (cm)
  lila: number; // Lingkar Lengan Atas (cm)
  lika: number; // Lingkar Kepala (cm)
  immunization: string;
  notes?: string;
  createdAt: string;
}

export interface User {
  id: string;
  username: string;
  role: 'ADMIN' | 'KADER';
  assignedPosyanduId?: string;
  isVerified: boolean;
}

export interface UserAccount extends User {
  password: string;
}

export const POSYANDU_LIST: Posyandu[] = Array.from({ length: 7 }, (_, i) => ({
  id: `melati-${i + 1}`,
  name: `Melati ${i + 1}`
}));
