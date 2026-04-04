'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Pill,
  Mail,
  Phone,
  Eye,
  EyeOff,
  Loader2,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  User,
  Building2,
  MapPin,
  Check,
  Shield,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from '@/components/ui/input-otp';
import { useAppStore } from '@/store/app-store';

// ─── Types ───────────────────────────────────────────────────────────────────

type AuthTab = 'login' | 'register';
type LoginMethod = 'email' | 'phone' | 'google';
type RegisterMethod = 'email' | 'phone';
type AuthRole = 'patient' | 'pharmacist';
type PharmacistStep = 1 | 2;

const CI_CITIES = [
  'Abidjan',
  'Bouaké',
  'San Pedro',
  'Yamoussoukro',
  'Korhogo',
  'Daloa',
  'Man',
  'Soubré',
  'Adzopé',
  'Agboville',
  'Anyama',
  'Bingerville',
  'Bondoukou',
  'Bouna',
  'Dabou',
  'Danané',
  'Dimbokro',
  'Ferkessédougou',
  'Gagnoa',
  'Grand-Bassam',
  'Guiglo',
  'Issia',
  'Katiola',
  'Lakota',
  'Odienné',
  'Sassandra',
  'Séguéla',
  'Tabou',
  'Tengréla',
  'Tiassalé',
  'Touba',
  'Zuénoula',
] as const;

// ─── Main Component ──────────────────────────────────────────────────────────

export function AuthScreen() {
  const [role, setRole] = useState<AuthRole>('patient');
  const [tab, setTab] = useState<AuthTab>('login');
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('email');
  const [registerMethod, setRegisterMethod] = useState<RegisterMethod>('email');

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginPhone, setLoginPhone] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register state (patient)
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Pharmacist registration state
  const [pharmStep, setPharmStep] = useState<PharmacistStep>(1);
  const [pharmacyName, setPharmacyName] = useState('');
  const [pharmacyPhone, setPharmacyPhone] = useState('');
  const [pharmacyAddress, setPharmacyAddress] = useState('');
  const [pharmacyCity, setPharmacyCity] = useState('');
  const [pharmacyDistrict, setPharmacyDistrict] = useState('');
  const [pharmacistName, setPharmacistName] = useState('');
  const [pharmacistEmail, setPharmacistEmail] = useState('');
  const [pharmacistPassword, setPharmacistPassword] = useState('');
  const [pharmacistConfirmPassword, setPharmacistConfirmPassword] = useState('');
  const [showPharmacistPassword, setShowPharmacistPassword] = useState(false);

  // OTP state
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpUserId, setOtpUserId] = useState<string | null>(null);
  const [otpPhone, setOtpPhone] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpTimer, setOtpTimer] = useState(0);

  // General state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const setCurrentUser = useAppStore((s) => s.setCurrentUser);

  // OTP countdown timer
  useEffect(() => {
    if (otpTimer <= 0) return;
    const interval = setInterval(() => {
      setOtpTimer((t) => t - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [otpTimer]);

  // Reset form when role changes
  useEffect(() => {
    setError('');
    setPharmStep(1);
  }, [role]);

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // ─── Login Handlers ─────────────────────────────────────────────────────

  const handleEmailLogin = async () => {
    setError('');
    if (!loginEmail.trim() || !loginPassword) {
      setError("L'email et le mot de passe sont requis");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail.trim(), password: loginPassword, authProvider: 'email' }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Erreur de connexion');
        return;
      }
      setCurrentUser(data.user);
    } catch {
      setError('Erreur réseau');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneLogin = async () => {
    setError('');
    const cleanPhone = loginPhone.replace(/[^0-9+]/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setError('Numéro de téléphone invalide');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone, authProvider: 'phone' }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Erreur');
        return;
      }
      setOtpUserId(data.userId);
      setOtpPhone(cleanPhone);
      setShowOtp(true);
      setOtpTimer(300);
      setOtpCode('');
      setOtpError('');
    } catch {
      setError('Erreur réseau');
    } finally {
      setLoading(false);
    }
  };

  // ─── OTP Handlers ───────────────────────────────────────────────────────

  const handleOtpVerify = async () => {
    setOtpError('');
    if (!otpCode || otpCode.length !== 4) {
      setOtpError('Entrez le code à 4 chiffres');
      return;
    }
    if (!otpUserId) {
      setOtpError('Erreur: utilisateur non trouvé');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/phone/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: otpUserId, code: otpCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setOtpError(data.error || 'Code invalide');
        return;
      }
      setCurrentUser(data.user);
    } catch {
      setOtpError('Erreur réseau');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (otpTimer > 0 || !otpPhone) return;
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: otpPhone, authProvider: 'phone' }),
      });
      const data = await res.json();
      if (res.ok) {
        setOtpTimer(300);
        setOtpCode('');
        setOtpError('');
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  // ─── Patient Register Handlers ──────────────────────────────────────────

  const handleEmailRegister = async () => {
    setError('');
    if (!regName.trim()) {
      setError('Le nom est requis');
      return;
    }
    if (!regEmail.trim() || !regPassword) {
      setError("L'email et le mot de passe sont requis");
      return;
    }
    if (regPassword.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'patient',
          name: regName.trim(),
          email: regEmail.trim(),
          password: regPassword,
          confirmPassword: regConfirmPassword,
          authProvider: 'email',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur d'inscription");
        return;
      }
      setCurrentUser(data.user);
    } catch {
      setError('Erreur réseau');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneRegister = async () => {
    setError('');
    if (!regName.trim()) {
      setError('Le nom est requis');
      return;
    }
    const cleanPhone = regPhone.replace(/[^0-9+]/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setError('Numéro de téléphone invalide');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'patient',
          name: regName.trim(),
          phone: cleanPhone,
          authProvider: 'phone',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur d'inscription");
        return;
      }
      if (data.user) {
        setOtpUserId(data.user.id);
        setOtpPhone(cleanPhone);
        setShowOtp(true);
        setOtpTimer(300);
        setOtpCode('');
        setOtpError('');
      }
    } catch {
      setError('Erreur réseau');
    } finally {
      setLoading(false);
    }
  };

  // ─── Pharmacist Register Handler ────────────────────────────────────────

  const handlePharmacistRegister = async () => {
    setError('');
    if (!pharmacyName.trim() || !pharmacyAddress.trim() || !pharmacyCity || !pharmacyPhone.trim()) {
      setError('Toutes les informations de la pharmacie sont requises');
      return;
    }
    if (!pharmacistName.trim() || !pharmacistEmail.trim() || !pharmacistPassword) {
      setError('Toutes les informations personnelles sont requises');
      return;
    }
    if (pharmacistPassword.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    if (pharmacistPassword !== pharmacistConfirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'pharmacist',
          name: pharmacistName.trim(),
          email: pharmacistEmail.trim(),
          password: pharmacistPassword,
          confirmPassword: pharmacistConfirmPassword,
          authProvider: 'email',
          pharmacy: {
            name: pharmacyName.trim(),
            address: pharmacyAddress.trim(),
            city: pharmacyCity,
            district: pharmacyDistrict.trim() || undefined,
            phone: pharmacyPhone.trim(),
            latitude: 5.3600,
            longitude: -3.9324,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur d'inscription");
        return;
      }
      setCurrentUser(data.user);
    } catch {
      setError('Erreur réseau');
    } finally {
      setLoading(false);
    }
  };

  // ─── Google login (coming soon) ─────────────────────────────────────────

  const handleGoogleLogin = async () => {
    setError('');
    try {
      const res = await fetch('/api/auth/google');
      const data = await res.json();
      setError(data.message || 'Bientôt disponible');
    } catch {
      setError('Erreur réseau');
    }
  };

  // ─── Back from OTP to login ─────────────────────────────────────────────

  const handleOtpBack = () => {
    setShowOtp(false);
    setOtpCode('');
    setOtpError('');
    setOtpUserId(null);
    setOtpPhone('');
    setOtpTimer(0);
  };

  const switchTab = (t: AuthTab) => {
    setTab(t);
    setError('');
    setPharmStep(1);
  };

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Emerald gradient header */}
      <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-800 px-6 pt-12 pb-10 rounded-b-[2rem]">
        <div className="max-w-md mx-auto text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-4">
            <Pill className="h-9 w-9 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Pharma CI</h1>
          <p className="text-emerald-100 text-sm mt-1">Côte d&apos;Ivoire</p>
        </div>
      </div>

      {/* Auth content */}
      <div className="flex-1 px-4 -mt-4">
        <div className="max-w-md mx-auto">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-5 pt-6">
              <AnimatePresence mode="wait">
                {showOtp ? (
                  <OtpScreen
                    key="otp"
                    otpCode={otpCode}
                    setOtpCode={setOtpCode}
                    otpError={otpError}
                    otpTimer={otpTimer}
                    formatTimer={formatTimer}
                    loading={loading}
                    onVerify={handleOtpVerify}
                    onResend={handleResendOtp}
                    onBack={handleOtpBack}
                    phone={otpPhone}
                  />
                ) : (
                  <motion.div
                    key={`${role}-${tab}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* Role Selector */}
                    <RoleSelector role={role} setRole={setRole} />

                    {/* Auth Tabs */}
                    <div className="flex bg-muted rounded-xl p-1 mt-4 mb-5">
                      {(['login', 'register'] as AuthTab[]).map((t) => (
                        <button
                          key={t}
                          onClick={() => switchTab(t)}
                          className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                            tab === t
                              ? 'bg-white text-emerald-700 shadow-sm'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {t === 'login' ? 'Connexion' : 'Inscription'}
                        </button>
                      ))}
                    </div>

                    {/* Error message */}
                    <AnimatePresence>
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mb-4"
                        >
                          <div className="bg-red-50 border border-red-200 text-red-600 text-xs px-3 py-2 rounded-lg">
                            {error}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Content based on role + tab */}
                    {role === 'patient' && tab === 'login' && (
                      <AnimatePresence mode="wait">
                        <motion.div
                          key="patient-login"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ duration: 0.2 }}
                        >
                          <PatientLoginForm
                            loginMethod={loginMethod}
                            setLoginMethod={setLoginMethod}
                            loginEmail={loginEmail}
                            setLoginEmail={setLoginEmail}
                            loginPassword={loginPassword}
                            setLoginPassword={setLoginPassword}
                            loginPhone={loginPhone}
                            setLoginPhone={setLoginPhone}
                            showLoginPassword={showLoginPassword}
                            setShowLoginPassword={setShowLoginPassword}
                            loading={loading}
                            onEmailLogin={handleEmailLogin}
                            onPhoneLogin={handlePhoneLogin}
                            onGoogleLogin={handleGoogleLogin}
                            onSwitchTab={() => switchTab('register')}
                          />
                        </motion.div>
                      </AnimatePresence>
                    )}

                    {role === 'patient' && tab === 'register' && (
                      <AnimatePresence mode="wait">
                        <motion.div
                          key="patient-register"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.2 }}
                        >
                          <PatientRegisterForm
                            registerMethod={registerMethod}
                            setRegisterMethod={setRegisterMethod}
                            regName={regName}
                            setRegName={setRegName}
                            regEmail={regEmail}
                            setRegEmail={setRegEmail}
                            regPhone={regPhone}
                            setRegPhone={setRegPhone}
                            regPassword={regPassword}
                            setRegPassword={setRegPassword}
                            regConfirmPassword={regConfirmPassword}
                            setRegConfirmPassword={setRegConfirmPassword}
                            showRegPassword={showRegPassword}
                            setShowRegPassword={setShowRegPassword}
                            loading={loading}
                            onEmailRegister={handleEmailRegister}
                            onPhoneRegister={handlePhoneRegister}
                            onSwitchTab={() => switchTab('login')}
                          />
                        </motion.div>
                      </AnimatePresence>
                    )}

                    {role === 'pharmacist' && tab === 'login' && (
                      <AnimatePresence mode="wait">
                        <motion.div
                          key="pharmacist-login"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ duration: 0.2 }}
                        >
                          <PharmacistLoginForm
                            loginEmail={loginEmail}
                            setLoginEmail={setLoginEmail}
                            loginPassword={loginPassword}
                            setLoginPassword={setLoginPassword}
                            showLoginPassword={showLoginPassword}
                            setShowLoginPassword={setShowLoginPassword}
                            loading={loading}
                            onEmailLogin={handleEmailLogin}
                            onSwitchTab={() => switchTab('register')}
                          />
                        </motion.div>
                      </AnimatePresence>
                    )}

                    {role === 'pharmacist' && tab === 'register' && (
                      <AnimatePresence mode="wait">
                        <motion.div
                          key="pharmacist-register"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.2 }}
                        >
                          <PharmacistRegisterForm
                            step={pharmStep}
                            setStep={setPharmStep}
                            pharmacyName={pharmacyName}
                            setPharmacyName={setPharmacyName}
                            pharmacyPhone={pharmacyPhone}
                            setPharmacyPhone={setPharmacyPhone}
                            pharmacyAddress={pharmacyAddress}
                            setPharmacyAddress={setPharmacyAddress}
                            pharmacyCity={pharmacyCity}
                            setPharmacyCity={setPharmacyCity}
                            pharmacyDistrict={pharmacyDistrict}
                            setPharmacyDistrict={setPharmacyDistrict}
                            pharmacistName={pharmacistName}
                            setPharmacistName={setPharmacistName}
                            pharmacistEmail={pharmacistEmail}
                            setPharmacistEmail={setPharmacistEmail}
                            pharmacistPassword={pharmacistPassword}
                            setPharmacistPassword={setPharmacistPassword}
                            pharmacistConfirmPassword={pharmacistConfirmPassword}
                            setPharmacistConfirmPassword={setPharmacistConfirmPassword}
                            showPharmacistPassword={showPharmacistPassword}
                            setShowPharmacistPassword={setShowPharmacistPassword}
                            loading={loading}
                            onSubmit={handlePharmacistRegister}
                            onSwitchTab={() => switchTab('login')}
                          />
                        </motion.div>
                      </AnimatePresence>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>

          {/* Footer */}
          <p className="text-center text-[10px] text-muted-foreground mt-6 mb-6 pb-safe">
            Pharma CI © 2025 — Votre santé, notre priorité
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Role Selector ────────────────────────────────────────────────────────────

function RoleSelector({
  role,
  setRole,
}: {
  role: AuthRole;
  setRole: (r: AuthRole) => void;
}) {
  return (
    <div className="flex bg-muted/60 rounded-xl p-1 border border-border/50">
      {([
        { key: 'patient' as AuthRole, label: 'Patient', icon: User, desc: 'Rechercher des médicaments' },
        { key: 'pharmacist' as AuthRole, label: 'Pharmacien', icon: Building2, desc: 'Gérer ma pharmacie' },
      ]).map((r) => (
        <button
          key={r.key}
          onClick={() => setRole(r.key)}
          className={`flex-1 relative flex flex-col items-center gap-1 py-3 px-2 rounded-lg transition-all duration-300 ${
            role === r.key
              ? 'bg-white text-emerald-700 shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <div
            className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300 ${
              role === r.key
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-transparent'
            }`}
          >
            <r.icon className="h-4.5 w-4.5" />
          </div>
          <span className="text-xs font-semibold leading-tight">{r.label}</span>
          <AnimatePresence>
            {role === r.key && (
              <motion.span
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="text-[9px] text-emerald-600 font-medium leading-tight block"
              >
                {r.desc}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      ))}
    </div>
  );
}

// ─── Patient Login Form ───────────────────────────────────────────────────────

function PatientLoginForm({
  loginMethod,
  setLoginMethod,
  loginEmail,
  setLoginEmail,
  loginPassword,
  setLoginPassword,
  loginPhone,
  setLoginPhone,
  showLoginPassword,
  setShowLoginPassword,
  loading,
  onEmailLogin,
  onPhoneLogin,
  onGoogleLogin,
  onSwitchTab,
}: {
  loginMethod: LoginMethod;
  setLoginMethod: (m: LoginMethod) => void;
  loginEmail: string;
  setLoginEmail: (v: string) => void;
  loginPassword: string;
  setLoginPassword: (v: string) => void;
  loginPhone: string;
  setLoginPhone: (v: string) => void;
  showLoginPassword: boolean;
  setShowLoginPassword: (v: boolean) => void;
  loading: boolean;
  onEmailLogin: () => void;
  onPhoneLogin: () => void;
  onGoogleLogin: () => void;
  onSwitchTab: () => void;
}) {
  return (
    <div className="space-y-4">
      {/* Method selector */}
      <div className="grid grid-cols-3 gap-2">
        {([
          { key: 'email' as LoginMethod, label: 'Email', icon: <Mail className="h-5 w-5" /> },
          { key: 'phone' as LoginMethod, label: 'Téléphone', icon: <Phone className="h-5 w-5" /> },
          { key: 'google' as LoginMethod, label: 'Google', icon: <span className="text-lg">🔵</span> },
        ]).map((m) => (
          <button
            key={m.key}
            onClick={() => setLoginMethod(m.key)}
            className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 transition-all duration-200 text-xs font-medium ${
              loginMethod === m.key
                ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                : 'border-border bg-background text-muted-foreground hover:border-emerald-200'
            }`}
          >
            {m.icon}
            {m.label}
          </button>
        ))}
      </div>

      {/* Email method */}
      {loginMethod === 'email' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <div className="space-y-1.5">
            <Label htmlFor="login-email" className="text-xs font-medium text-muted-foreground">Adresse email</Label>
            <Input
              id="login-email"
              type="email"
              placeholder="email@exemple.com"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              className="h-12 border-emerald-200 focus:border-emerald-500 text-base"
              autoComplete="email"
              disabled={loading}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="login-password" className="text-xs font-medium text-muted-foreground">Mot de passe</Label>
            <div className="relative">
              <Input
                id="login-password"
                type={showLoginPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="h-12 border-emerald-200 focus:border-emerald-500 text-base pr-12"
                autoComplete="current-password"
                disabled={loading}
                onKeyDown={(e) => e.key === 'Enter' && onEmailLogin()}
              />
              <button
                type="button"
                onClick={() => setShowLoginPassword(!showLoginPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <Button
            onClick={onEmailLogin}
            disabled={loading}
            className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {loading ? 'Connexion...' : 'Se connecter'}
          </Button>
        </motion.div>
      )}

      {/* Phone method */}
      {loginMethod === 'phone' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <div className="space-y-1.5">
            <Label htmlFor="login-phone" className="text-xs font-medium text-muted-foreground">Numéro de téléphone</Label>
            <Input
              id="login-phone"
              type="tel"
              placeholder="+225 07 XX XX XX XX"
              value={loginPhone}
              onChange={(e) => setLoginPhone(e.target.value)}
              className="h-12 border-emerald-200 focus:border-emerald-500 text-base"
              autoComplete="tel"
              disabled={loading}
            />
            <p className="text-[10px] text-muted-foreground">
              Format: +225 07 XX XX XX XX ou 07 XX XX XX XX
            </p>
          </div>
          <Button
            onClick={onPhoneLogin}
            disabled={loading}
            className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {loading ? 'Envoi...' : 'Envoyer le code'}
          </Button>
        </motion.div>
      )}

      {/* Google method */}
      {loginMethod === 'google' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <Button
            onClick={onGoogleLogin}
            variant="outline"
            className="w-full h-12 border-emerald-200 text-sm font-semibold rounded-xl hover:bg-emerald-50"
          >
            <span className="mr-2">🔵</span>
            Continuer avec Google
          </Button>
          <p className="text-center text-[10px] text-muted-foreground">Bientôt disponible</p>
        </motion.div>
      )}

      {/* Switch to register */}
      <p className="text-center text-xs text-muted-foreground pt-2">
        Pas encore de compte ?{' '}
        <button
          onClick={onSwitchTab}
          className="text-emerald-600 font-semibold hover:text-emerald-700"
        >
          S&apos;inscrire
        </button>
      </p>
    </div>
  );
}

// ─── Patient Register Form ────────────────────────────────────────────────────

function PatientRegisterForm({
  registerMethod,
  setRegisterMethod,
  regName,
  setRegName,
  regEmail,
  setRegEmail,
  regPhone,
  setRegPhone,
  regPassword,
  setRegPassword,
  regConfirmPassword,
  setRegConfirmPassword,
  showRegPassword,
  setShowRegPassword,
  loading,
  onEmailRegister,
  onPhoneRegister,
  onSwitchTab,
}: {
  registerMethod: RegisterMethod;
  setRegisterMethod: (m: RegisterMethod) => void;
  regName: string;
  setRegName: (v: string) => void;
  regEmail: string;
  setRegEmail: (v: string) => void;
  regPhone: string;
  setRegPhone: (v: string) => void;
  regPassword: string;
  setRegPassword: (v: string) => void;
  regConfirmPassword: string;
  setRegConfirmPassword: (v: string) => void;
  showRegPassword: boolean;
  setShowRegPassword: (v: boolean) => void;
  loading: boolean;
  onEmailRegister: () => void;
  onPhoneRegister: () => void;
  onSwitchTab: () => void;
}) {
  return (
    <div className="space-y-4">
      {/* Method toggle */}
      <div className="flex bg-muted rounded-xl p-1">
        {(['email', 'phone'] as RegisterMethod[]).map((m) => (
          <button
            key={m}
            onClick={() => setRegisterMethod(m)}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
              registerMethod === m
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-muted-foreground'
            }`}
          >
            {m === 'email' ? '📧 Email' : '📱 Téléphone'}
          </button>
        ))}
      </div>

      {/* Name field (common) */}
      <div className="space-y-1.5">
        <Label htmlFor="reg-name" className="text-xs font-medium text-muted-foreground">Nom complet</Label>
        <Input
          id="reg-name"
          type="text"
          placeholder="Votre nom"
          value={regName}
          onChange={(e) => setRegName(e.target.value)}
          className="h-12 border-emerald-200 focus:border-emerald-500 text-base"
          autoComplete="name"
          disabled={loading}
        />
      </div>

      {/* Email-specific fields */}
      {registerMethod === 'email' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <div className="space-y-1.5">
            <Label htmlFor="reg-email" className="text-xs font-medium text-muted-foreground">Adresse email</Label>
            <Input
              id="reg-email"
              type="email"
              placeholder="email@exemple.com"
              value={regEmail}
              onChange={(e) => setRegEmail(e.target.value)}
              className="h-12 border-emerald-200 focus:border-emerald-500 text-base"
              autoComplete="email"
              disabled={loading}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reg-password" className="text-xs font-medium text-muted-foreground">Mot de passe</Label>
            <div className="relative">
              <Input
                id="reg-password"
                type={showRegPassword ? 'text' : 'password'}
                placeholder="Minimum 6 caractères"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                className="h-12 border-emerald-200 focus:border-emerald-500 text-base pr-12"
                autoComplete="new-password"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowRegPassword(!showRegPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showRegPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reg-confirm" className="text-xs font-medium text-muted-foreground">Confirmer le mot de passe</Label>
            <Input
              id="reg-confirm"
              type={showRegPassword ? 'text' : 'password'}
              placeholder="Retapez le mot de passe"
              value={regConfirmPassword}
              onChange={(e) => setRegConfirmPassword(e.target.value)}
              className="h-12 border-emerald-200 focus:border-emerald-500 text-base"
              autoComplete="new-password"
              disabled={loading}
              onKeyDown={(e) => e.key === 'Enter' && onEmailRegister()}
            />
          </div>
          <Button
            onClick={onEmailRegister}
            disabled={loading}
            className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {loading ? 'Inscription...' : "S'inscrire"}
          </Button>
        </motion.div>
      )}

      {/* Phone-specific fields */}
      {registerMethod === 'phone' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <div className="space-y-1.5">
            <Label htmlFor="reg-phone" className="text-xs font-medium text-muted-foreground">Numéro de téléphone</Label>
            <Input
              id="reg-phone"
              type="tel"
              placeholder="+225 07 XX XX XX XX"
              value={regPhone}
              onChange={(e) => setRegPhone(e.target.value)}
              className="h-12 border-emerald-200 focus:border-emerald-500 text-base"
              autoComplete="tel"
              disabled={loading}
            />
            <p className="text-[10px] text-muted-foreground">
              Un code de vérification vous sera envoyé par SMS
            </p>
          </div>
          <Button
            onClick={onPhoneRegister}
            disabled={loading}
            className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {loading ? 'Envoi...' : "S'inscrire"}
          </Button>
        </motion.div>
      )}

      {/* Switch to login */}
      <p className="text-center text-xs text-muted-foreground pt-2">
        Déjà un compte ?{' '}
        <button
          onClick={onSwitchTab}
          className="text-emerald-600 font-semibold hover:text-emerald-700"
        >
          Se connecter
        </button>
      </p>
    </div>
  );
}

// ─── Pharmacist Login Form ────────────────────────────────────────────────────

function PharmacistLoginForm({
  loginEmail,
  setLoginEmail,
  loginPassword,
  setLoginPassword,
  showLoginPassword,
  setShowLoginPassword,
  loading,
  onEmailLogin,
  onSwitchTab,
}: {
  loginEmail: string;
  setLoginEmail: (v: string) => void;
  loginPassword: string;
  setLoginPassword: (v: string) => void;
  showLoginPassword: boolean;
  setShowLoginPassword: (v: boolean) => void;
  loading: boolean;
  onEmailLogin: () => void;
  onSwitchTab: () => void;
}) {
  return (
    <div className="space-y-4">
      {/* Pharmacist badge */}
      <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2.5">
        <Building2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
        <p className="text-xs text-emerald-700 font-medium">Espace pharmacien — Connectez-vous avec vos identifiants</p>
      </div>

      {/* Email field */}
      <div className="space-y-1.5">
        <Label htmlFor="ph-login-email" className="text-xs font-medium text-muted-foreground">Email professionnel</Label>
        <Input
          id="ph-login-email"
          type="email"
          placeholder="email@pharmacie.ci"
          value={loginEmail}
          onChange={(e) => setLoginEmail(e.target.value)}
          className="h-12 border-emerald-200 focus:border-emerald-500 text-base"
          autoComplete="email"
          disabled={loading}
        />
      </div>

      {/* Password field */}
      <div className="space-y-1.5">
        <Label htmlFor="ph-login-password" className="text-xs font-medium text-muted-foreground">Mot de passe</Label>
        <div className="relative">
          <Input
            id="ph-login-password"
            type={showLoginPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
            className="h-12 border-emerald-200 focus:border-emerald-500 text-base pr-12"
            autoComplete="current-password"
            disabled={loading}
            onKeyDown={(e) => e.key === 'Enter' && onEmailLogin()}
          />
          <button
            type="button"
            onClick={() => setShowLoginPassword(!showLoginPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            tabIndex={-1}
          >
            {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Login button */}
      <Button
        onClick={onEmailLogin}
        disabled={loading}
        className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        {loading ? 'Connexion...' : 'Se connecter'}
      </Button>

      {/* Switch to register */}
      <p className="text-center text-xs text-muted-foreground pt-2">
        Nouvelle pharmacie ?{' '}
        <button
          onClick={onSwitchTab}
          className="text-emerald-600 font-semibold hover:text-emerald-700"
        >
          Inscrire ma pharmacie
        </button>
      </p>
    </div>
  );
}

// ─── Pharmacist Register Form (Multi-Step) ────────────────────────────────────

function PharmacistRegisterForm({
  step,
  setStep,
  pharmacyName,
  setPharmacyName,
  pharmacyPhone,
  setPharmacyPhone,
  pharmacyAddress,
  setPharmacyAddress,
  pharmacyCity,
  setPharmacyCity,
  pharmacyDistrict,
  setPharmacyDistrict,
  pharmacistName,
  setPharmacistName,
  pharmacistEmail,
  setPharmacistEmail,
  pharmacistPassword,
  setPharmacistPassword,
  pharmacistConfirmPassword,
  setPharmacistConfirmPassword,
  showPharmacistPassword,
  setShowPharmacistPassword,
  loading,
  onSubmit,
  onSwitchTab,
}: {
  step: PharmacistStep;
  setStep: (s: PharmacistStep) => void;
  pharmacyName: string;
  setPharmacyName: (v: string) => void;
  pharmacyPhone: string;
  setPharmacyPhone: (v: string) => void;
  pharmacyAddress: string;
  setPharmacyAddress: (v: string) => void;
  pharmacyCity: string;
  setPharmacyCity: (v: string) => void;
  pharmacyDistrict: string;
  setPharmacyDistrict: (v: string) => void;
  pharmacistName: string;
  setPharmacistName: (v: string) => void;
  pharmacistEmail: string;
  setPharmacistEmail: (v: string) => void;
  pharmacistPassword: string;
  setPharmacistPassword: (v: string) => void;
  pharmacistConfirmPassword: string;
  setPharmacistConfirmPassword: (v: string) => void;
  showPharmacistPassword: boolean;
  setShowPharmacistPassword: (v: boolean) => void;
  loading: boolean;
  onSubmit: () => void;
  onSwitchTab: () => void;
}) {
  const goToNext = () => {
    if (!pharmacyName.trim() || !pharmacyPhone.trim() || !pharmacyAddress.trim() || !pharmacyCity) return;
    setStep(2);
  };

  const goToPrev = () => {
    setStep(1);
  };

  return (
    <div className="space-y-4">
      {/* Step indicator */}
      <div className="flex items-center gap-2 px-1">
        <StepIndicator step={1} currentStep={step} label="Pharmacie" />
        <div className={`flex-1 h-0.5 rounded-full transition-colors duration-300 ${step >= 2 ? 'bg-emerald-500' : 'bg-muted'}`} />
        <StepIndicator step={2} currentStep={step} label="Identifiants" />
      </div>

      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.div
            key="pharm-step-1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.25 }}
            className="space-y-3"
          >
            {/* Step 1 header */}
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Building2 className="h-4 w-4 text-emerald-700" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Informations de la pharmacie</p>
                <p className="text-[10px] text-muted-foreground">Étape 1 sur 2</p>
              </div>
            </div>

            {/* Pharmacy Name */}
            <div className="space-y-1.5">
              <Label htmlFor="ph-name" className="text-xs font-medium text-muted-foreground">
                Nom de la pharmacie <span className="text-red-500">*</span>
              </Label>
              <Input
                id="ph-name"
                type="text"
                placeholder="Ex: Pharmacie de la Paix"
                value={pharmacyName}
                onChange={(e) => setPharmacyName(e.target.value)}
                className="h-12 border-emerald-200 focus:border-emerald-500 text-base"
                disabled={loading}
              />
            </div>

            {/* Pharmacy Phone */}
            <div className="space-y-1.5">
              <Label htmlFor="ph-phone" className="text-xs font-medium text-muted-foreground">
                Téléphone de la pharmacie <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="ph-phone"
                  type="tel"
                  placeholder="+225 07 XX XX XX XX"
                  value={pharmacyPhone}
                  onChange={(e) => setPharmacyPhone(e.target.value)}
                  className="h-12 border-emerald-200 focus:border-emerald-500 text-base pl-10"
                  autoComplete="tel"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Address */}
            <div className="space-y-1.5">
              <Label htmlFor="ph-address" className="text-xs font-medium text-muted-foreground">
                Adresse <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="ph-address"
                  type="text"
                  placeholder="Ex: Cocody Riviera 3, en face du carrefour"
                  value={pharmacyAddress}
                  onChange={(e) => setPharmacyAddress(e.target.value)}
                  className="h-12 border-emerald-200 focus:border-emerald-500 text-base pl-10"
                  autoComplete="street-address"
                  disabled={loading}
                />
              </div>
            </div>

            {/* City */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">
                Ville <span className="text-red-500">*</span>
              </Label>
              <Select value={pharmacyCity} onValueChange={setPharmacyCity} disabled={loading}>
                <SelectTrigger className="h-12 border-emerald-200 focus:border-emerald-500 text-base w-full">
                  <SelectValue placeholder="Sélectionnez votre ville" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {CI_CITIES.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* District (optional) */}
            <div className="space-y-1.5">
              <Label htmlFor="ph-district" className="text-xs font-medium text-muted-foreground">
                Quartier <span className="text-muted-foreground/60">(optionnel)</span>
              </Label>
              <Input
                id="ph-district"
                type="text"
                placeholder="Ex: Cocody, Plateau, Marcory..."
                value={pharmacyDistrict}
                onChange={(e) => setPharmacyDistrict(e.target.value)}
                className="h-12 border-emerald-200 focus:border-emerald-500 text-base"
                disabled={loading}
              />
            </div>

            {/* Next button */}
            <Button
              onClick={goToNext}
              disabled={!pharmacyName.trim() || !pharmacyPhone.trim() || !pharmacyAddress.trim() || !pharmacyCity || loading}
              className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl disabled:opacity-50"
            >
              Suivant
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="pharm-step-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="space-y-3"
          >
            {/* Step 2 header */}
            <div className="flex items-center gap-2 mb-1">
              <button
                onClick={goToPrev}
                className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
                tabIndex={-1}
              >
                <ArrowLeft className="h-4 w-4 text-muted-foreground" />
              </button>
              <div>
                <p className="text-sm font-semibold text-foreground">Vos informations</p>
                <p className="text-[10px] text-muted-foreground">Étape 2 sur 2</p>
              </div>
            </div>

            {/* Summary of pharmacy info */}
            <div className="bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2.5 flex items-start gap-2">
              <Building2 className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-emerald-800 truncate">{pharmacyName}</p>
                <p className="text-[10px] text-emerald-600 truncate">{pharmacyAddress} — {pharmacyCity}</p>
              </div>
              <button
                onClick={goToPrev}
                className="text-[10px] text-emerald-600 font-medium whitespace-nowrap hover:text-emerald-700 flex-shrink-0"
              >
                Modifier
              </button>
            </div>

            {/* Pharmacist Name */}
            <div className="space-y-1.5">
              <Label htmlFor="pharm-name" className="text-xs font-medium text-muted-foreground">
                Nom complet du pharmacien <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="pharm-name"
                  type="text"
                  placeholder="Dr. Konan Jean-Marc"
                  value={pharmacistName}
                  onChange={(e) => setPharmacistName(e.target.value)}
                  className="h-12 border-emerald-200 focus:border-emerald-500 text-base pl-10"
                  autoComplete="name"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Pharmacist Email */}
            <div className="space-y-1.5">
              <Label htmlFor="pharm-email" className="text-xs font-medium text-muted-foreground">
                Email professionnel <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="pharm-email"
                  type="email"
                  placeholder="email@pharmacie.ci"
                  value={pharmacistEmail}
                  onChange={(e) => setPharmacistEmail(e.target.value)}
                  className="h-12 border-emerald-200 focus:border-emerald-500 text-base pl-10"
                  autoComplete="email"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="pharm-password" className="text-xs font-medium text-muted-foreground">
                Mot de passe <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="pharm-password"
                  type={showPharmacistPassword ? 'text' : 'password'}
                  placeholder="Minimum 6 caractères"
                  value={pharmacistPassword}
                  onChange={(e) => setPharmacistPassword(e.target.value)}
                  className="h-12 border-emerald-200 focus:border-emerald-500 text-base pr-12"
                  autoComplete="new-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPharmacistPassword(!showPharmacistPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPharmacistPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {/* Password strength indicator */}
              {pharmacistPassword.length > 0 && (
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      className={`h-1 flex-1 rounded-full transition-colors duration-200 ${
                        pharmacistPassword.length >= level * 3
                          ? pharmacistPassword.length >= 10
                            ? 'bg-emerald-500'
                            : pharmacistPassword.length >= 8
                              ? 'bg-emerald-400'
                              : 'bg-amber-400'
                          : 'bg-muted'
                      }`}
                    />
                  ))}
                  <span className="text-[9px] text-muted-foreground ml-1.5">
                    {pharmacistPassword.length < 6
                      ? 'Trop court'
                      : pharmacistPassword.length < 8
                        ? 'Faible'
                        : pharmacistPassword.length < 10
                          ? 'Moyen'
                          : 'Fort'}
                  </span>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <Label htmlFor="pharm-confirm" className="text-xs font-medium text-muted-foreground">
                Confirmer le mot de passe <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="pharm-confirm"
                  type={showPharmacistPassword ? 'text' : 'password'}
                  placeholder="Retapez le mot de passe"
                  value={pharmacistConfirmPassword}
                  onChange={(e) => setPharmacistConfirmPassword(e.target.value)}
                  className="h-12 border-emerald-200 focus:border-emerald-500 text-base pr-12"
                  autoComplete="new-password"
                  disabled={loading}
                  onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
                />
                {pharmacistConfirmPassword.length > 0 && pharmacistPassword === pharmacistConfirmPassword && (
                  <Check className="absolute right-10 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                )}
              </div>
            </div>

            {/* Terms note */}
            <div className="flex items-start gap-2 bg-muted/50 rounded-lg px-3 py-2">
              <Shield className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                En créant un compte pharmacien, vous certifiez être un professionnel de santé habilité. Vos informations seront vérifiées.
              </p>
            </div>

            {/* Submit button */}
            <Button
              onClick={onSubmit}
              disabled={
                !pharmacistName.trim() ||
                !pharmacistEmail.trim() ||
                !pharmacistPassword ||
                !pharmacistConfirmPassword ||
                pharmacistPassword.length < 6 ||
                pharmacistPassword !== pharmacistConfirmPassword ||
                loading
              }
              className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {loading ? 'Création du compte...' : "Créer mon compte pharmacien"}
            </Button>

            {/* Back to step 1 */}
            <button
              onClick={goToPrev}
              className="w-full flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Retour aux informations de la pharmacie
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Switch to login */}
      <p className="text-center text-xs text-muted-foreground pt-2">
        Déjà un compte pharmacien ?{' '}
        <button
          onClick={onSwitchTab}
          className="text-emerald-600 font-semibold hover:text-emerald-700"
        >
          Se connecter
        </button>
      </p>
    </div>
  );
}

// ─── Step Indicator ───────────────────────────────────────────────────────────

function StepIndicator({
  step,
  currentStep,
  label,
}: {
  step: 1 | 2;
  currentStep: 1 | 2;
  label: string;
}) {
  const isActive = step === currentStep;
  const isCompleted = step < currentStep;

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 ${
          isCompleted
            ? 'bg-emerald-500 text-white'
            : isActive
              ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
              : 'bg-muted text-muted-foreground'
        }`}
      >
        {isCompleted ? (
          <Check className="h-3.5 w-3.5" />
        ) : (
          <span className="text-xs font-bold">{step}</span>
        )}
      </div>
      <span
        className={`text-[10px] font-medium transition-colors duration-300 ${
          isActive ? 'text-emerald-700' : 'text-muted-foreground'
        }`}
      >
        {label}
      </span>
    </div>
  );
}

// ─── OTP Screen ───────────────────────────────────────────────────────────────

function OtpScreen({
  otpCode,
  setOtpCode,
  otpError,
  otpTimer,
  formatTimer,
  loading,
  onVerify,
  onResend,
  onBack,
  phone,
}: {
  otpCode: string;
  setOtpCode: (v: string) => void;
  otpError: string;
  otpTimer: number;
  formatTimer: (s: number) => string;
  loading: boolean;
  onVerify: () => void;
  onResend: () => void;
  onBack: () => void;
  phone: string;
}) {
  const otpRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    otpRef.current?.focus();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour
      </button>

      {/* Header */}
      <div className="text-center">
        <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-3">
          <Phone className="h-7 w-7 text-emerald-600" />
        </div>
        <h3 className="text-lg font-bold text-foreground">Vérification</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Entrez le code envoyé au
        </p>
        <p className="text-sm font-semibold text-emerald-700 mt-0.5">{phone}</p>
      </div>

      {/* OTP Input */}
      <div className="flex justify-center">
        <InputOTP maxLength={4} value={otpCode} onChange={(val) => setOtpCode(val)}>
          <InputOTPGroup>
            <InputOTPSlot index={0} className="h-14 w-14 text-xl" />
            <InputOTPSlot index={1} className="h-14 w-14 text-xl" />
            <InputOTPSeparator />
            <InputOTPSlot index={2} className="h-14 w-14 text-xl" />
            <InputOTPSlot index={3} className="h-14 w-14 text-xl" />
          </InputOTPGroup>
        </InputOTP>
      </div>

      {/* Timer */}
      {otpTimer > 0 ? (
        <p className="text-center text-xs text-muted-foreground">
          Code valide dans <span className="font-semibold text-emerald-700">{formatTimer(otpTimer)}</span>
        </p>
      ) : (
        <button
          onClick={onResend}
          disabled={loading}
          className="w-full flex items-center justify-center gap-1.5 text-xs text-emerald-600 font-semibold hover:text-emerald-700"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Renvoyer le code
        </button>
      )}

      {/* Error */}
      {otpError && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-red-50 border border-red-200 text-red-600 text-xs px-3 py-2 rounded-lg text-center"
        >
          {otpError}
        </motion.div>
      )}

      {/* Verify button */}
      <Button
        onClick={onVerify}
        disabled={loading || otpCode.length !== 4}
        className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        {loading ? 'Vérification...' : 'Vérifier'}
      </Button>
    </motion.div>
  );
}
