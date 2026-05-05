import React, { useState, useEffect, FC } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home, 
  Users, 
  FileText, 
  Plus, 
  Search, 
  ChevronRight, 
  ArrowLeft, 
  Save, 
  Baby, 
  Activity,
  Download,
  Trash2,
  Calendar,
  MapPin,
  Briefcase,
  Info,
  LineChart as LineChartIcon,
  TrendingUp
} from 'lucide-react';
import { 
    LineChart, 
    Line, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    Legend
} from 'recharts';
import { storage, User } from './services/storage';
import { Toddler, Measurement, POSYANDU_LIST, Posyandu } from './types';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { exportToExcel } from './services/reportService';

type View = 'DASHBOARD' | 'POSYANDU_DETAIL' | 'TODDLER_DETAIL' | 'ADD_TODDLER' | 'ADD_MEASUREMENT' | 'REPORTS' | 'ACCOUNT_MANAGER';

export default function App() {
  const [user, setUser] = useState<User | undefined>(storage.getUser());
  const [activeView, setActiveView] = useState<View>('DASHBOARD');
  const [selectedPosyandu, setSelectedPosyandu] = useState<Posyandu | null>(null);
  const [selectedToddler, setSelectedToddler] = useState<Toddler | null>(null);
  const [toddlers, setToddlers] = useState<Toddler[]>([]);

  // Load data on mount
  useEffect(() => {
    if (user) {
        setToddlers(storage.getToddlers());
        if (user.role === 'KADER' && user.assignedPosyanduId) {
            const p = POSYANDU_LIST.find(pos => pos.id === user.assignedPosyanduId);
            if (p) {
                setSelectedPosyandu(p);
                // For Kader, they always stay in their posyandu detail as "home"
                setActiveView('POSYANDU_DETAIL');
            }
        }
    }
  }, [user]);

  const handleLogin = (newUser: User) => {
    setUser(newUser);
    if (newUser.role === 'KADER') {
        setActiveView('POSYANDU_DETAIL');
    } else {
        setActiveView('DASHBOARD');
    }
  };

  const handleLogout = () => {
    storage.logout();
    setUser(undefined);
    setActiveView('DASHBOARD');
    setSelectedPosyandu(null);
  };

  if (!user) {
    return <LoginPortal onLogin={handleLogin} />;
  }

  const refreshData = () => {
    setToddlers(storage.getToddlers());
  };

  const navigateToPosyandu = (p: Posyandu) => {
    setSelectedPosyandu(p);
    setActiveView('POSYANDU_DETAIL');
  };

  const navigateToToddler = (t: Toddler) => {
    setSelectedToddler(t);
    setActiveView('TODDLER_DETAIL');
  };

  const handleExport = () => {
    const storageData = storage.exportToJSON();
    // Admin can export all, Kader can only export their posyandu
    const dataToExport = user.role === 'ADMIN' 
        ? toddlers 
        : toddlers.filter(t => t.posyanduId === user.assignedPosyanduId);
        
    exportToExcel(dataToExport, storageData.measurements, storageData.posyandus);
  };

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-background overflow-hidden relative">
      {/* Header */}
      <header className="px-6 py-4 bg-surface border-b border-zinc-100 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          {activeView !== 'DASHBOARD' && (user.role === 'ADMIN' || activeView !== 'POSYANDU_DETAIL') && (
            <button 
              onClick={() => {
                if (activeView === 'POSYANDU_DETAIL') setActiveView('DASHBOARD');
                else if (activeView === 'TODDLER_DETAIL') setActiveView('POSYANDU_DETAIL');
                else if (activeView === 'ADD_TODDLER') setActiveView('POSYANDU_DETAIL');
                else if (activeView === 'ADD_MEASUREMENT') setActiveView('TODDLER_DETAIL');
                else setActiveView('DASHBOARD');
              }}
              className="p-2 -ml-2 hover:bg-zinc-100 rounded-full transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <div>
            <h1 className="font-display text-xl font-bold text-primary italic">Permata Peris</h1>
            <p className="text-[9px] text-zinc-400 uppercase tracking-tight font-medium leading-none">Pemantauan Rutin Menuju Anak Tangguh</p>
            <p className="text-[8px] text-zinc-300 uppercase tracking-tighter font-bold">Ladang Peris Village</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
            {user.role === 'ADMIN' && (
                <button 
                    onClick={() => setActiveView('ACCOUNT_MANAGER')}
                    className="p-2 relative text-zinc-400 hover:text-secondary"
                >
                    <Users size={20} />
                    {storage.getPendingAccounts().length > 0 && (
                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                    )}
                </button>
            )}
            <div className="text-right mr-2 hidden sm:block">
                <p className="text-[8px] font-black uppercase text-zinc-300">Role</p>
                <p className="text-[10px] font-bold text-primary">{user.role}</p>
            </div>
            <button onClick={handleLogout} className="p-2 text-zinc-400 hover:text-red-400 transition-colors">
                <Trash2 size={18} />
            </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-24 px-4 pt-4">
        <AnimatePresence mode="wait">
          {activeView === 'DASHBOARD' && (
            <DashboardView 
                key="dashboard" 
                user={user}
                onPosyanduSelect={(p) => {
                    if (user.role === 'KADER' && user.assignedPosyanduId !== p.id) return;
                    navigateToPosyandu(p);
                }} 
            />
          )}
          {activeView === 'POSYANDU_DETAIL' && selectedPosyandu && (
            <PosyanduDetailView 
              key="posyandu" 
              posyandu={selectedPosyandu} 
              toddlers={toddlers.filter(t => t.posyanduId === selectedPosyandu.id)}
              onToddlerSelect={navigateToToddler}
              onAdd={() => setActiveView('ADD_TODDLER')}
            />
          )}
          {activeView === 'ADD_TODDLER' && selectedPosyandu && (
            <AddToddlerForm 
              key="add-toddler"
              posyanduId={selectedPosyandu.id}
              onCancel={() => setActiveView('POSYANDU_DETAIL')}
              onSuccess={() => {
                refreshData();
                setActiveView('POSYANDU_DETAIL');
              }}
            />
          )}
          {activeView === 'TODDLER_DETAIL' && selectedToddler && (
            <ToddlerDetailView 
              key="toddler-detail"
              toddler={selectedToddler}
              onAddMeasurement={() => setActiveView('ADD_MEASUREMENT')}
            />
          )}
          {activeView === 'ADD_MEASUREMENT' && selectedToddler && (
            <AddMeasurementForm 
              key="add-measurement"
              toddler={selectedToddler}
              onCancel={() => setActiveView('TODDLER_DETAIL')}
              onSuccess={() => {
                setActiveView('TODDLER_DETAIL');
              }}
            />
          )}
          {activeView === 'ACCOUNT_MANAGER' && (
            <AccountManager key="accounts" onClose={() => setActiveView('DASHBOARD')} />
          )}
        </AnimatePresence>
      </main>

      {/* Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-surface/80 backdrop-blur-md border-t border-zinc-100 flex justify-around items-center h-20 px-6 z-50">
        <NavButton active={activeView === 'DASHBOARD'} icon={<Home />} label="Home" onClick={() => setActiveView('DASHBOARD')} />
        <div className="relative -top-6">
            <button 
                onClick={() => {
                    if (selectedPosyandu) setActiveView('ADD_TODDLER');
                    else setActiveView('DASHBOARD');
                }}
                className="w-14 h-14 bg-primary rounded-full shadow-lg shadow-primary/30 flex items-center justify-center text-white active:scale-90 transition-transform"
            >
                <Plus size={28} />
            </button>
        </div>
        <NavButton active={activeView === 'REPORTS'} icon={<FileText />} label="Laporan" onClick={handleExport} />
      </nav>
    </div>
  );
}

function NavButton({ active, icon, label, onClick }: { active: boolean, icon: React.ReactNode, label: string, onClick: () => void }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-colors ${active ? 'text-primary font-semibold' : 'text-zinc-400'}`}>
      {React.cloneElement(icon as React.ReactElement, { size: 24, strokeWidth: active ? 2.5 : 2 })}
      <span className="text-[10px] uppercase tracking-wider">{label}</span>
    </button>
  );
}

// VIEW COMPONENTS

const DashboardView: FC<{ onPosyanduSelect: (p: Posyandu) => void, user: User }> = ({ onPosyanduSelect, user }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [posyandus, setPosyandus] = useState<Posyandu[]>(storage.getPosyandus());

  const handleAdd = () => {
    if (!newName.trim()) return;
    storage.addPosyandu(newName);
    setPosyandus(storage.getPosyandus());
    setNewName('');
    setShowAdd(false);
  };

  const filteredPosyandus = user.role === 'ADMIN' 
    ? posyandus 
    : posyandus.filter(p => p.id === user.assignedPosyanduId);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      <div className="card-peris bg-gradient-to-br from-primary/20 via-accent/20 to-secondary/20 border-none">
        <h2 className="font-display text-2xl font-bold mb-1 text-primary-dark tracking-tight">Halo, {user.role === 'ADMIN' ? 'Admin!' : 'Kader!'} ✨</h2>
        <p className="text-sm text-zinc-600 mb-2">Mari pantau tumbuh kembang Permata Ladang Peris hari ini.</p>
        <p className="text-[10px] text-primary-dark font-black uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="w-1 h-1 bg-primary rounded-full"></span>
            Pemantauan Rutin Menuju Anak Tangguh
        </p>
        <div className="flex gap-4">
            <div className="bg-white/80 p-3 rounded-2xl flex-1 border border-white shadow-sm">
                <p className="text-[10px] uppercase font-bold text-zinc-400 mb-1">Balita Aktif</p>
                <p className="text-xl font-black text-primary">{storage.getToddlers(user.role === 'KADER' ? user.assignedPosyanduId : undefined).length}</p>
            </div>
            <div className="bg-white/80 p-3 rounded-2xl flex-1 border border-white shadow-sm">
                <p className="text-[10px] uppercase font-bold text-zinc-400 mb-1">Unit Tugas</p>
                <p className="text-xl font-black text-secondary">{user.role === 'ADMIN' ? posyandus.length : '1'}</p>
            </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-zinc-800">{user.role === 'ADMIN' ? 'Semua Unit Posyandu' : 'Unit Tugas Anda'}</h3>
            {user.role === 'ADMIN' && (
                <button 
                    onClick={() => setShowAdd(!showAdd)}
                    className="text-[10px] font-bold text-secondary bg-secondary/10 px-3 py-1.5 rounded-full uppercase flex items-center gap-1"
                >
                    <Plus size={12} /> Tambah Unit
                </button>
            )}
        </div>

        <AnimatePresence>
            {showAdd && (
                <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mb-4 overflow-hidden"
                >
                    <div className="p-4 bg-muted/50 rounded-3xl border border-muted flex gap-2">
                        <input 
                            type="text" 
                            placeholder="Nama Unit Baru..." 
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            className="flex-1 bg-white border border-zinc-100 rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                        <button onClick={handleAdd} className="bg-secondary text-white p-2 rounded-xl">
                            <Save size={20} />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        <div className="grid gap-3">
          {filteredPosyandus.map((p, i) => (
            <motion.button
              key={p.id}
              whileHover={{ x: 4, scale: 1.02 }}
              onClick={() => onPosyanduSelect(p)}
              className="flex items-center justify-between p-4 bg-white border-2 border-primary/5 rounded-[28px] shadow-lg shadow-primary/5 hover:border-primary/20 transition-all text-left"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center text-primary font-black text-lg">
                  {user.role === 'ADMIN' ? i + 1 : '✨'}
                </div>
                <div>
                  <p className="font-bold text-zinc-800">{p.name}</p>
                  <p className="text-xs text-zinc-500">{storage.getToddlers(p.id).length} Balita terdaftar</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-zinc-300" />
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

const LoginPortal: FC<{ onLogin: (u: User) => void }> = ({ onLogin }) => {
    const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [selectedRole, setSelectedRole] = useState<'ADMIN' | 'KADER'>('KADER');
    const [selectedPosyanduId, setSelectedPosyanduId] = useState(POSYANDU_LIST[0].id);
    const [error, setError] = useState('');
    const [msg, setMsg] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMsg('');
        try {
            if (mode === 'LOGIN') {
                const u = storage.login(username, password);
                onLogin(u);
            } else {
                storage.register({
                    username,
                    password,
                    role: selectedRole,
                    assignedPosyanduId: selectedRole === 'KADER' ? selectedPosyanduId : undefined
                });
                setMsg(selectedRole === 'ADMIN' ? 'Admin terdaftar! Silakan login.' : 'Pendaftaran berhasil! Tunggu verifikasi dari Admin Desa.');
                setMode('LOGIN');
            }
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <div className="min-h-screen max-w-md mx-auto bg-background flex flex-col p-8 justify-center">
            <div className="text-center space-y-4 mb-12">
                <div className="w-20 h-20 bg-primary/20 rounded-[32px] flex items-center justify-center mx-auto text-primary">
                    <Baby size={40} strokeWidth={2.5} />
                </div>
                <div>
                    <h1 className="font-display text-3xl font-black text-zinc-800 italic">Permata Peris</h1>
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-1">Sistem Pemantauan Balita</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-white p-2 rounded-[32px] shadow-sm flex border-2 border-zinc-50 mb-4">
                    <button 
                        type="button"
                        onClick={() => setMode('LOGIN')}
                        className={`flex-1 py-3 rounded-[28px] text-[10px] font-black transition-all ${mode === 'LOGIN' ? 'bg-primary text-white' : 'text-zinc-400'}`}
                    >
                        LOGIN
                    </button>
                    <button 
                        type="button"
                        onClick={() => setMode('REGISTER')}
                        className={`flex-1 py-3 rounded-[28px] text-[10px] font-black transition-all ${mode === 'REGISTER' ? 'bg-zinc-800 text-white' : 'text-zinc-400'}`}
                    >
                        DAFTAR
                    </button>
                </div>

                {error && <p className="bg-red-50 text-red-500 text-[10px] font-bold p-3 rounded-xl border border-red-100">{error}</p>}
                {msg && <p className="bg-green-50 text-green-600 text-[10px] font-bold p-3 rounded-xl border border-green-100">{msg}</p>}

                <div className="space-y-4">
                    <InputField label="Username" value={username} onChange={setUsername} placeholder="nama_pengguna" required />
                    <InputField label="Password" type="password" value={password} onChange={setPassword} placeholder="••••••" required />
                    
                    {mode === 'REGISTER' && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4">
                            <div className="flex gap-2">
                                <button type="button" onClick={() => setSelectedRole('KADER')} className={`flex-1 py-3 rounded-xl border-2 text-[10px] font-black ${selectedRole === 'KADER' ? 'border-primary text-primary bg-primary/5' : 'border-zinc-50 text-zinc-300'}`}>KADER</button>
                                <button type="button" onClick={() => setSelectedRole('ADMIN')} className={`flex-1 py-3 rounded-xl border-2 text-[10px] font-black ${selectedRole === 'ADMIN' ? 'border-zinc-800 text-zinc-800 bg-zinc-50' : 'border-zinc-50 text-zinc-300'}`}>ADMIN</button>
                            </div>
                            {selectedRole === 'KADER' && (
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-zinc-400 uppercase px-1">Unit Tugas</label>
                                    <select 
                                        value={selectedPosyanduId}
                                        onChange={(e) => setSelectedPosyanduId(e.target.value)}
                                        className="w-full bg-white border-2 border-zinc-50 rounded-2xl p-4 text-sm font-bold shadow-sm"
                                    >
                                        {storage.getPosyandus().map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                            )}
                        </motion.div>
                    )}
                </div>

                <button 
                    type="submit"
                    className="w-full py-5 rounded-[28px] font-black text-white shadow-xl bg-primary active:scale-95 transition-all mt-4"
                >
                    {mode === 'LOGIN' ? 'MASUK ✨' : 'DAFTAR SEKARANG'}
                </button>

                {mode === 'LOGIN' && (
                    <div className="text-center p-4 bg-muted/50 rounded-2xl border border-muted">
                        <p className="text-[9px] text-zinc-400 font-medium">Demo Admin: <span className="font-bold text-zinc-600">username: admin | pass: 123</span></p>
                    </div>
                )}
            </form>
        </div>
    );
};

const AccountManager: FC<{ onClose: () => void }> = ({ onClose }) => {
    const [accounts, setAccounts] = useState<User[]>(storage.getAllAccounts());

    const handleVerify = (id: string) => {
        storage.verifyAccount(id);
        setAccounts(storage.getAllAccounts());
    };

    const handleDelete = (id: string) => {
        if (confirm('Apakah Anda yakin ingin menghapus akun ini?')) {
            try {
                storage.deleteAccount(id);
                setAccounts(storage.getAllAccounts());
            } catch (err: any) {
                alert(err.message);
            }
        }
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="font-display text-2xl font-bold">Kelola Akun Kader</h2>
                <button onClick={onClose} className="p-2 bg-muted rounded-full"><ChevronRight className="rotate-90" /></button>
            </div>
            {accounts.length <= 1 ? (
                <div className="py-20 text-center text-zinc-400 italic text-sm">Tidak ada kader lain terdaftar.</div>
            ) : (
                <div className="space-y-3">
                    {accounts.filter(a => a.id !== 'admin-main').map(acc => (
                        <div key={acc.id} className="card-peris space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-black text-zinc-800 flex items-center gap-2">
                                        {acc.username}
                                        {acc.isVerified && <span className="text-[8px] bg-green-100 text-green-600 px-1.5 py-0.5 rounded-full">TERVERIFIKASI</span>}
                                    </p>
                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">
                                        {acc.role} • {acc.assignedPosyanduId ? storage.getPosyandus().find(p => p.id === acc.assignedPosyanduId)?.name : 'Akses Penuh'}
                                    </p>
                                </div>
                                <button 
                                    onClick={() => handleDelete(acc.id)}
                                    className="p-2 text-red-300 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                            
                            {!acc.isVerified && (
                                <button 
                                    onClick={() => handleVerify(acc.id)}
                                    className="w-full bg-secondary text-white text-[10px] font-black py-3 rounded-xl shadow-lg shadow-secondary/20"
                                >
                                    VERIFIKASI AKUN INI
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </motion.div>
    );
};

const PosyanduDetailView: FC<{ posyandu: Posyandu, toddlers: Toddler[], onToddlerSelect: (t: Toddler) => void, onAdd: () => void }> = ({ posyandu, toddlers, onToddlerSelect, onAdd }) => {
  const [search, setSearch] = useState('');
  const filtered = toddlers.filter(t => t.name.toLowerCase().includes(search.toLowerCase()) || t.nik.includes(search));

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-2xl font-bold text-zinc-800 tracking-tight">{posyandu.name}</h2>
        <p className="text-xs text-zinc-500 uppercase font-semibold">Daftar Balita Terdaftar</p>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
        <input 
          type="text" 
          placeholder="Cari nama atau NIK..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-muted border-none rounded-2xl py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
        />
      </div>

      <div className="grid gap-3">
        {filtered.length > 0 ? filtered.map(t => (
          <button
            key={t.id}
            onClick={() => onToddlerSelect(t)}
            className="flex items-center gap-4 p-4 bg-white border-2 border-primary/5 rounded-[28px] shadow-lg shadow-primary/5 animate-in fade-in slide-in-from-bottom-2 duration-300"
          >
            <div className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg ${t.gender === 'L' ? 'bg-secondary/20 text-secondary' : 'bg-primary/20 text-primary'}`}>
              <Baby size={28} />
            </div>
            <div className="flex-1 text-left">
              <p className="font-bold text-zinc-800">{t.name}</p>
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <span className="font-mono">{t.nik}</span>
                <span>•</span>
                <span>{t.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</span>
              </div>
            </div>
          </button>
        )) : (
          <div className="py-20 text-center space-y-4">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto text-zinc-300 italic">
              <Baby size={32} />
            </div>
            <p className="text-sm text-zinc-400 italic">Belum ada data balita di Unit ini.</p>
            <button onClick={onAdd} className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-2">
              <Plus size={16} /> Tambah Balita
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

const AddToddlerForm: FC<{ posyanduId: string, onCancel: () => void, onSuccess: () => void }> = ({ posyanduId, onCancel, onSuccess }) => {
  const [formData, setFormData] = useState({
    nik: '',
    name: '',
    birthPlace: 'Ladang Peris',
    birthDate: '',
    gender: 'L',
    birthWeight: '',
    birthHeight: '',
    fatherName: '',
    motherName: '',
    address: 'Desa Ladang Peris',
    fatherJob: '',
    motherJob: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.nik.length !== 16) {
        alert('NIK harus berjumlah tepat 16 digit!');
        return;
    }
    storage.addToddler({
      ...formData,
      birthWeight: parseFloat(formData.birthWeight),
      birthHeight: parseFloat(formData.birthHeight),
      posyanduId
    });
    onSuccess();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold">Pendaftaran Balita</h2>
        <button onClick={onCancel} className="text-zinc-400 p-2"><ChevronRight className="rotate-90" /></button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">Identitas Balita</label>
          <div className="grid gap-3 p-4 bg-muted/50 rounded-3xl border border-muted ring-offset-background">
            <InputField label="NIK Balita" value={formData.nik} onChange={v => setFormData({...formData, nik: v.replace(/\D/g, '')})} placeholder="Masukkan 16 digit NIK..." required maxLength={16} />
            <InputField label="Nama Lengkap" value={formData.name} onChange={v => setFormData({...formData, name: v})} required />
            <div className="grid grid-cols-2 gap-3">
                <InputField label="Tempat Lahir" value={formData.birthPlace} onChange={v => setFormData({...formData, birthPlace: v})} />
                <InputField label="Tanggal Lahir" type="date" value={formData.birthDate} onChange={v => setFormData({...formData, birthDate: v})} required />
            </div>
            <div className="flex gap-4 p-1">
                <label className="flex-1 cursor-pointer flex items-center justify-center p-3 rounded-xl border-2 transition-all border-zinc-100 bg-white" 
                       onClick={() => setFormData({...formData, gender: 'L' as any})}>
                   <input type="radio" className="hidden" checked={formData.gender === 'L'} onChange={() => {}} />
                   <span className={`text-sm font-bold ${formData.gender === 'L' ? 'text-primary' : 'text-zinc-400'}`}>Laki-laki</span>
                </label>
                <label className="flex-1 cursor-pointer flex items-center justify-center p-3 rounded-xl border-2 transition-all border-zinc-100 bg-white"
                       onClick={() => setFormData({...formData, gender: 'P' as any})}>
                   <input type="radio" className="hidden" checked={formData.gender === 'P'} onChange={() => {}} />
                   <span className={`text-sm font-bold ${formData.gender === 'P' ? 'text-primary' : 'text-zinc-400'}`}>Perempuan</span>
                </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <InputField label="BB Lahir (kg)" type="number" step="0.1" value={formData.birthWeight} onChange={v => setFormData({...formData, birthWeight: v})} />
                <InputField label="TB Lahir (cm)" type="number" step="0.1" value={formData.birthHeight} onChange={v => setFormData({...formData, birthHeight: v})} />
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">Data Orang Tua</label>
          <div className="grid gap-3 p-4 bg-muted/50 rounded-3xl border border-muted">
            <InputField label="Nama Bapak" value={formData.fatherName} onChange={v => setFormData({...formData, fatherName: v})} />
            <InputField label="Nama Ibu" value={formData.motherName} onChange={v => setFormData({...formData, motherName: v})} />
            <InputField label="Pekerjaan Bapak" value={formData.fatherJob} onChange={v => setFormData({...formData, fatherJob: v})} />
            <InputField label="Pekerjaan Ibu" value={formData.motherJob} onChange={v => setFormData({...formData, motherJob: v})} />
            <InputField label="Alamat / Dusun" value={formData.address} onChange={v => setFormData({...formData, address: v})} />
          </div>
        </div>

        <button type="submit" className="btn-primary w-full shadow-lg shadow-primary/20 flex items-center justify-center gap-2">
          <Save size={20} /> Simpan Data Balita
        </button>
      </form>
    </motion.div>
  );
}

const ToddlerDetailView: FC<{ toddler: Toddler, onAddMeasurement: () => void }> = ({ toddler, onAddMeasurement }) => {
    const measurements = storage.getMeasurements(toddler.id);
    const latest = measurements[0];

    return (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6 pb-12"
        >
            {/* Profile Card */}
            <div className="card-peris bg-primary p-0 overflow-hidden text-white border-none shadow-2xl shadow-primary/30 rounded-[40px]">
                <div className="p-8 relative">
                    <div className="absolute -top-4 -right-4 opacity-10 rotate-12"><Baby size={160} /></div>
                    <div className="flex items-center gap-5 mb-6 relative z-10">
                        <div className="w-20 h-20 rounded-[32px] bg-white/20 backdrop-blur-xl flex items-center justify-center text-4xl shadow-inner">
                            {toddler.gender === 'L' ? '👦' : '👧'}
                        </div>
                        <div>
                            <h2 className="text-3xl font-black font-display tracking-tight">{toddler.name}</h2>
                            <p className="text-white/80 text-xs font-mono tracking-widest">{toddler.nik}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-xs font-medium">
                        <div className="flex items-center gap-2 bg-white/10 p-2 rounded-xl"><Calendar size={14} /> {format(new Date(toddler.birthDate), 'dd MMMM yyyy', { locale: localeId })}</div>
                        <div className="flex items-center gap-2 bg-white/10 p-2 rounded-xl"><MapPin size={14} /> {toddler.birthPlace}</div>
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
                <div className="card-peris flex flex-col items-center">
                    <p className="text-[10px] uppercase font-bold text-zinc-400 mb-2">BB Terakhir</p>
                    <p className="text-2xl font-black text-secondary">{latest?.weight || toddler.birthWeight} <span className="text-sm font-normal">kg</span></p>
                </div>
                <div className="card-peris flex flex-col items-center">
                    <p className="text-[10px] uppercase font-bold text-zinc-400 mb-2">TB Terakhir</p>
                    <p className="text-2xl font-black text-primary">{latest?.height || toddler.birthHeight} <span className="text-sm font-normal">cm</span></p>
                </div>
            </div>

            {/* Growth Graph */}
            <div className="card-peris space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-primary font-bold text-sm">
                        <TrendingUp size={16} /> Grafik Pertumbuhan
                    </div>
                </div>
                <div className="h-64 w-full">
                    {measurements.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                                data={[...measurements].reverse().map(m => ({
                                    name: format(new Date(m.date), 'MMM', { locale: localeId }),
                                    BB: m.weight,
                                    TB: m.height
                                }))}
                                margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                                <XAxis 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fontSize: 10, fill: '#aaa'}}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fontSize: 10, fill: '#aaa'}}
                                />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} />
                                <Line 
                                    type="monotone" 
                                    dataKey="BB" 
                                    stroke="#ec7063" 
                                    strokeWidth={4} 
                                    dot={{ r: 4, fill: '#ec7063' }}
                                    activeDot={{ r: 6 }}
                                    name="Berat (kg)"
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="TB" 
                                    stroke="#7bcbd4" 
                                    strokeWidth={4} 
                                    dot={{ r: 4, fill: '#7bcbd4' }}
                                    activeDot={{ r: 6 }}
                                    name="Tinggi (cm)"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-zinc-400 italic text-xs gap-2">
                             <LineChartIcon className="opacity-20" size={40} />
                             Penuhi data timbangan untuk melihat grafik
                        </div>
                    )}
                </div>
            </div>

            {/* Parent Info */}
            <div className="card-peris space-y-4">
                <div className="flex items-center gap-2 text-primary font-bold text-sm mb-2"><Info size={16} /> Data Orang Tua & Alamat</div>
                <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1">
                        <p className="text-zinc-400">Bapak</p>
                        <p className="font-bold">{toddler.fatherName}</p>
                        <p className="text-[10px] opacity-60 flex items-center gap-1"><Briefcase size={10}/> {toddler.fatherJob}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-zinc-400">Ibu</p>
                        <p className="font-bold">{toddler.motherName}</p>
                        <p className="text-[10px] opacity-60 flex items-center gap-1"><Briefcase size={10}/> {toddler.motherJob}</p>
                    </div>
                </div>
                <div className="pt-3 border-t border-zinc-100 flex items-start gap-2">
                    <MapPin size={14} className="text-zinc-400 mt-0.5" />
                    <p className="text-xs text-zinc-600 italic">"{toddler.address}"</p>
                </div>
            </div>

            {/* Measurements Ledger */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-bold text-zinc-800">Riwayat Penimbangan</h3>
                    <button onClick={onAddMeasurement} className="text-primary text-xs font-bold flex items-center gap-1 bg-primary/10 px-3 py-1 rounded-full">
                        <Plus size={14} /> Ukur
                    </button>
                </div>
                {measurements.length > 0 ? (
                    <div className="space-y-3">
                        {measurements.map(m => (
                            <div key={m.id} className="bg-white p-4 rounded-3xl border border-zinc-100 shadow-sm flex items-center gap-4">
                                <Activity className="text-secondary" />
                                <div className="flex-1">
                                    <p className="text-xs font-bold text-zinc-800">{format(new Date(m.date), 'MMMM yyyy', { locale: localeId })}</p>
                                    <div className="flex items-center gap-x-3 gap-y-1 text-[10px] font-mono text-zinc-500 mt-1 flex-wrap">
                                        <span>BB: {m.weight}kg</span>
                                        <span>TB: {m.height}cm</span>
                                        <span>LILA: {m.lila}cm</span>
                                        <span>LIKA: {m.lika}cm</span>
                                    </div>
                                    {m.immunization && (
                                        <div className="mt-2 inline-block bg-accent/20 text-[10px] font-bold px-2 py-0.5 rounded text-zinc-700">
                                            💉 {m.immunization}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-muted h-32 rounded-3xl border border-dashed border-zinc-200 flex flex-col items-center justify-center text-zinc-400 italic text-sm">
                        Belum ada riwayat penimbangan bulanan.
                    </div>
                )}
            </div>
        </motion.div>
    );
}

const AddMeasurementForm: FC<{ toddler: Toddler, onCancel: () => void, onSuccess: () => void }> = ({ toddler, onCancel, onSuccess }) => {
    const [formData, setFormData] = useState({
        date: format(new Date(), 'yyyy-MM-dd'),
        weight: '',
        height: '',
        lila: '',
        lika: '',
        immunization: '',
        notes: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        storage.addMeasurement({
            ...formData,
            toddlerId: toddler.id,
            weight: parseFloat(formData.weight),
            height: parseFloat(formData.height),
            lila: parseFloat(formData.lila),
            lika: parseFloat(formData.lika),
        });
        onSuccess();
    };

    return (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
            <div className="text-center space-y-2">
                <h2 className="font-display text-2xl font-bold">Input Pengukuran</h2>
                <p className="text-zinc-500 text-sm">Update pertumbuhan <span className="font-bold text-primary">{toddler.name}</span></p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-4 bg-muted/30 p-6 rounded-[32px] border border-muted">
                    <InputField label="Tanggal Penimbangan" type="date" value={formData.date} onChange={v => setFormData({...formData, date: v})} required />
                    <div className="grid grid-cols-2 gap-4">
                        <InputField label="BB (kg)" type="number" step="0.01" value={formData.weight} onChange={v => setFormData({...formData, weight: v})} required />
                        <InputField label="TB (cm)" type="number" step="0.1" value={formData.height} onChange={v => setFormData({...formData, height: v})} required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <InputField label="LILA (cm)" type="number" step="0.1" value={formData.lila} onChange={v => setFormData({...formData, lila: v})} />
                        <InputField label="LIKA (cm)" type="number" step="0.1" value={formData.lika} onChange={v => setFormData({...formData, lika: v})} />
                    </div>
                    <InputField label="Laporan Imunisasi" placeholder="Misal: Campak, BCG..." value={formData.immunization} onChange={v => setFormData({...formData, immunization: v})} />
                    <InputField label="Catatan Tambahan" value={formData.notes} onChange={v => setFormData({...formData, notes: v})} />
                </div>

                <div className="flex gap-4">
                    <button type="button" onClick={onCancel} className="flex-1 py-4 text-zinc-400 font-bold">Batal</button>
                    <button type="submit" className="flex-[2] btn-secondary shadow-lg shadow-secondary/20 flex items-center justify-center gap-2">
                        <Save size={20} /> Simpan Laporan
                    </button>
                </div>
            </form>
        </motion.div>
    );
}

function InputField({ label, type = 'text', value, onChange, placeholder, required, step, maxLength }: { label: string, type?: string, value: string, onChange: (v: string) => void, placeholder?: string, required?: boolean, step?: string, maxLength?: number }) {
  return (
    <div className="space-y-1.5 flex-1">
      <div className="flex justify-between items-end px-1">
        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{label} {required && <span className="text-primary">*</span>}</p>
        {maxLength && (
          <span className={`text-[9px] font-mono ${value.length === maxLength ? 'text-secondary font-bold' : 'text-zinc-400'}`}>
            {value.length}/{maxLength}
          </span>
        )}
      </div>
      <input 
        type={type} 
        value={value}
        onChange={(e) => {
            const val = e.target.value;
            if (maxLength && val.length > maxLength) return;
            onChange(val);
        }}
        placeholder={placeholder}
        required={required}
        step={step}
        className="w-full bg-white border border-zinc-100 rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
      />
    </div>
  );
}
