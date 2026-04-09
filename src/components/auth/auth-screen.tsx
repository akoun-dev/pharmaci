'use client';

import { logger } from '@/lib/logger';
import { fetcher } from '@/lib/fetcher';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Pill,
  Mail,
  Phone,
  Eye,
  EyeOff,
  Loader2,
  ArrowLeft,
  RefreshCw,
  User,
  Building2,
  Check,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useAppStore } from '@/store/app-store';

// ─── Types ───────────────────────────────────────────────────────────────────

type AuthStep = 'login' | 'register-role' | 'register-form' | 'otp';
type AuthMethod = 'email' | 'phone';
type AuthRole = 'patient' | 'pharmacist';

// ─── Main Component ──────────────────────────────────────────────────────────

export function AuthScreen() {
  const [step, setStep] = useState<AuthStep>('login');
  const [role, setRole] = useState<AuthRole>('patient');
  const [loginMethod, setLoginMethod] = useState<AuthMethod>('email');
  const [registerMethod, setRegisterMethod] = useState<AuthMethod>('email');

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginPhone, setLoginPhone] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Pharmacist registration state
  const [pharmacyName, setPharmacyName] = useState('');
  const [pharmacyAddress, setPharmacyAddress] = useState('');
  const [pharmacyCity, setPharmacyCity] = useState('');
  const [pharmacyPhone, setPharmacyPhone] = useState('');

  // OTP state
  const [otpCode, setOtpCode] = useState('');
  const [otpUserId, setOtpUserId] = useState<string | null>(null);
  const [otpPhone, setOtpPhone] = useState('');
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

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const resetForm = useCallback(() => {
    setError('');
    setLoginEmail('');
    setLoginPassword('');
    setLoginPhone('');
    setRegName('');
    setRegEmail('');
    setRegPhone('');
    setRegPassword('');
    setRegConfirmPassword('');
    setPharmacyName('');
    setPharmacyAddress('');
    setPharmacyCity('');
    setPharmacyPhone('');
  }, []);

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleGoToRegister = () => {
    resetForm();
    setStep('register-role');
  };

  const handleBack = () => {
    setError('');
    switch (step) {
      case 'register-role':
        setStep('login');
        break;
      case 'register-form':
        setStep('register-role');
        break;
      case 'otp':
        setStep('login');
        break;
    }
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
      const res = await fetcher('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: loginEmail.trim(), password: loginPassword, authProvider: 'email' }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Erreur de connexion');
        return;
      }
      setCurrentUser(data.user, data.token);
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
      const res = await fetcher('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ phone: cleanPhone, authProvider: 'phone' }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Erreur');
        return;
      }
      setOtpUserId(data.userId);
      setOtpPhone(cleanPhone);
      setStep('otp');
      setOtpTimer(300);
      setOtpCode('');
      setError('');
    } catch {
      setError('Erreur réseau');
    } finally {
      setLoading(false);
    }
  };

  // ─── OTP Handlers ───────────────────────────────────────────────────────

  const handleOtpVerify = async () => {
    setError('');
    if (!otpCode || otpCode.length !== 4) {
      setError('Entrez le code à 4 chiffres');
      return;
    }
    if (!otpUserId) {
      setError('Erreur: utilisateur non trouvé');
      return;
    }
    setLoading(true);
    try {
      const res = await fetcher('/api/auth/phone/verify', {
        method: 'POST',
        body: JSON.stringify({ userId: otpUserId, code: otpCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Code invalide');
        return;
      }
      setCurrentUser(data.user, data.token);
    } catch {
      setError('Erreur réseau');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (otpTimer > 0 || !otpPhone) return;
    setLoading(true);
    try {
      const res = await fetcher('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ phone: otpPhone, authProvider: 'phone' }),
      });
      const data = await res.json();
      if (res.ok) {
        setOtpTimer(300);
        setOtpCode('');
        setError('');
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  // ─── Register Handlers ───────────────────────────────────────────────────

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

    // Pharmacist validation
    if (role === 'pharmacist') {
      if (!pharmacyName.trim() || !pharmacyAddress.trim() || !pharmacyCity || !pharmacyPhone.trim()) {
        setError('Toutes les informations de la pharmacie sont requises');
        return;
      }
    }

    setLoading(true);
    try {
      const res = await fetcher('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          role,
          name: regName.trim(),
          email: regEmail.trim(),
          password: regPassword,
          confirmPassword: regConfirmPassword,
          authProvider: 'email',
          ...(role === 'pharmacist' && {
            pharmacy: {
              name: pharmacyName.trim(),
              address: pharmacyAddress.trim(),
              city: pharmacyCity,
              phone: pharmacyPhone.trim(),
              latitude: 5.3600,
              longitude: -3.9324,
            },
          }),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur d'inscription");
        return;
      }
      setCurrentUser(data.user, data.token);
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
      const res = await fetcher('/api/auth/register', {
        method: 'POST',
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
        setStep('otp');
        setOtpTimer(300);
        setOtpCode('');
        setError('');
      }
    } catch {
      setError('Erreur réseau');
    } finally {
      setLoading(false);
    }
  };

  // ─── Render Helpers ───────────────────────────────────────────────────────

  const StepHeader = ({ title, subtitle }: { title: string; subtitle?: string }) => (
    <div className="text-center mb-6">
      <h2 className="text-xl font-bold text-foreground">{title}</h2>
      {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
    </div>
  );

  const ErrorDisplay = () => (
    <AnimatePresence>
      {error && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-4"
        >
          <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs px-3 py-2 rounded-lg">
            {error}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Green gradient header */}
      <div className="bg-gradient-to-r from-amber-600 to-amber-600 px-6 pt-12 pb-10 rounded-b-[2rem]">
        <div className="max-w-md mx-auto text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-4">
            <Pill className="h-9 w-9 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Pharma CI</h1>
          <p className="text-green-100 text-sm mt-1">Côte d&apos;Ivoire</p>
        </div>
      </div>

      {/* Auth content */}
      <div className="flex-1 px-4 -mt-4">
        <div className="max-w-md mx-auto">
          <Card className="border-green-100 dark:border-green-900/50 dark:bg-gray-950/70 shadow-lg">
            <CardContent className="p-5 pt-6">
              <AnimatePresence mode="wait">
                {/* Step: Login with Email/Phone tabs */}
                {step === 'login' && (
                  <motion.div
                    key="login"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <StepHeader title="Connexion" subtitle="Connectez-vous pour continuer" />
                    <ErrorDisplay />

                    {/* Email/Phone Tabs */}
                    <div className="flex bg-muted rounded-xl p-1 mb-5">
                      <button
                        onClick={() => {
                          setLoginMethod('email');
                          setError('');
                        }}
                        className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                          loginMethod === 'email'
                            ? 'bg-white text-green-700 shadow-sm'
                            : 'text-muted-foreground'
                        }`}
                      >
                        <Mail className="h-4 w-4" />
                        Email
                      </button>
                      <button
                        onClick={() => {
                          setLoginMethod('phone');
                          setError('');
                        }}
                        className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                          loginMethod === 'phone'
                            ? 'bg-white text-amber-700 shadow-sm'
                            : 'text-muted-foreground'
                        }`}
                      >
                        <Phone className="h-4 w-4" />
                        Téléphone
                      </button>
                    </div>

                    {/* Login Forms */}
                    <div className="space-y-4">
                      {loginMethod === 'email' ? (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="loginEmail" className="text-sm">Email</Label>
                            <Input
                              id="loginEmail"
                              type="email"
                              placeholder="Email"
                              onChange={(e) => setLoginEmail(e.target.value)}
                              className="h-11"
                              onKeyDown={(e) => e.key === 'Enter' && handleEmailLogin()}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="loginPassword" className="text-sm">Mot de passe</Label>
                            <div className="relative">
                              <Input
                                id="loginPassword"
                                type={showLoginPassword ? 'text' : 'password'}
                                placeholder="••••••••"
                                value={loginPassword}
                                onChange={(e) => setLoginPassword(e.target.value)}
                                className="h-11 pr-10"
                                onKeyDown={(e) => e.key === 'Enter' && handleEmailLogin()}
                              />
                              <button
                                type="button"
                                onClick={() => setShowLoginPassword(!showLoginPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                              >
                                {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                          </div>
                          <Button
                            onClick={handleEmailLogin}
                            disabled={loading}
                            className="w-full h-11 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium"
                          >
                            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                            Se connecter
                          </Button>
                        </>
                      ) : (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="loginPhone" className="text-sm">Téléphone</Label>
                            <Input
                              id="loginPhone"
                              type="tel"
                              placeholder="+225 XX XX XX XX"
                              value={loginPhone}
                              onChange={(e) => setLoginPhone(e.target.value)}
                              className="h-11"
                              onKeyDown={(e) => e.key === 'Enter' && handlePhoneLogin()}
                            />
                          </div>
                          <Button
                            onClick={handlePhoneLogin}
                            disabled={loading}
                            className="w-full h-11 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium"
                          >
                            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                            Recevoir le code
                          </Button>
                        </>
                      )}
                    </div>

                    {/* Register Link */}
                    <div className="mt-6 text-center">
                      <p className="text-sm text-muted-foreground">
                        Pas encore de compte ?{' '}
                        <button
                          onClick={handleGoToRegister}
                          className="text-amber-600 hover:text-amber-700 font-medium"
                        >
                          Créer un compte
                        </button>
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Step: Register Role Choice */}
                {step === 'register-role' && (
                  <motion.div
                    key="register-role"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-3"
                  >
                    <div className="flex items-center mb-4">
                      <button onClick={handleBack} className="p-1 -ml-1 text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="h-5 w-5" />
                      </button>
                    </div>
                    <StepHeader title="Inscription" subtitle="Quel est votre profil ?" />
                    <Button
                      onClick={() => {
                        setRole('patient');
                        setStep('register-form');
                      }}
                      className="w-full h-14 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium text-base"
                    >
                      <User className="h-5 w-5 mr-2" />
                      Patient
                    </Button>
                    <Button
                      onClick={() => {
                        setRole('pharmacist');
                        setStep('register-form');
                      }}
                      variant="outline"
                      className="w-full h-14 border-amber-200 text-amber-700 hover:bg-amber-50 rounded-xl font-medium text-base"
                    >
                      <Building2 className="h-5 w-5 mr-2" />
                      Pharmacien
                    </Button>
                  </motion.div>
                )}

                {/* Step: Register Form */}
                {step === 'register-form' && (
                  <motion.div
                    key="register-form"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <div className="flex items-center mb-4">
                      <button onClick={handleBack} className="p-1 -ml-1 text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="h-5 w-5" />
                      </button>
                    </div>
                    <StepHeader
                      title="Création de compte"
                      subtitle={role === 'pharmacist' ? 'Inscription pharmacien' : 'Complétez vos informations'}
                    />
                    <ErrorDisplay />

                    {/* Register Method Tabs */}
                    <div className="flex bg-muted rounded-xl p-1 mb-5">
                      <button
                        onClick={() => {
                          setRegisterMethod('email');
                          setError('');
                        }}
                        className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                          registerMethod === 'email'
                            ? 'bg-white text-amber-700 shadow-sm'
                            : 'text-muted-foreground'
                        }`}
                      >
                        <Mail className="h-4 w-4" />
                        Email
                      </button>
                      <button
                        onClick={() => {
                          setRegisterMethod('phone');
                          setError('');
                        }}
                        className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                          registerMethod === 'phone'
                            ? 'bg-white text-amber-700 shadow-sm'
                            : 'text-muted-foreground'
                        }`}
                      >
                        <Phone className="h-4 w-4" />
                        Téléphone
                      </button>
                    </div>

                    <div className="space-y-4 max-h-[50vh] overflow-y-auto -mx-2 px-2">
                      {/* Pharmacist pharmacy info */}
                      {role === 'pharmacist' && (
                        <div className="bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 rounded-xl p-3 space-y-3">
                          <p className="text-xs font-medium text-green-800 dark:text-green-200 flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            Informations de la pharmacie
                          </p>
                          <div className="space-y-2">
                            <Label htmlFor="pharmacyName" className="text-xs">Nom de la pharmacie *</Label>
                            <Input
                              id="pharmacyName"
                              placeholder="Pharmacie de la Paix"
                              value={pharmacyName}
                              onChange={(e) => setPharmacyName(e.target.value)}
                              className="h-10"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="pharmacyAddress" className="text-xs">Adresse *</Label>
                            <Input
                              id="pharmacyAddress"
                              placeholder="Bd de France, Cocody"
                              value={pharmacyAddress}
                              onChange={(e) => setPharmacyAddress(e.target.value)}
                              className="h-10"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-2">
                              <Label htmlFor="pharmacyCity" className="text-xs">Ville *</Label>
                              <Input
                                id="pharmacyCity"
                                placeholder="Abidjan"
                                value={pharmacyCity}
                                onChange={(e) => setPharmacyCity(e.target.value)}
                                className="h-10"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="pharmacyPhone" className="text-xs">Téléphone *</Label>
                              <Input
                                id="pharmacyPhone"
                                type="tel"
                                placeholder="+225 XX XX XX XX"
                                value={pharmacyPhone}
                                onChange={(e) => setPharmacyPhone(e.target.value)}
                                className="h-10"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Common fields */}
                      <div className="space-y-2">
                        <Label htmlFor="regName" className="text-sm">Nom complet *</Label>
                        <Input
                          id="regName"
                          placeholder="Kouassi Jean"
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          className="h-11"
                        />
                      </div>

                      {registerMethod === 'email' ? (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="regEmail" className="text-sm">Email *</Label>
                            <Input
                              id="regEmail"
                              type="email"
                              placeholder="votre@email.com"
                              value={regEmail}
                              onChange={(e) => setRegEmail(e.target.value)}
                              className="h-11"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="regPassword" className="text-sm">Mot de passe *</Label>
                            <div className="relative">
                              <Input
                                id="regPassword"
                                type={showRegPassword ? 'text' : 'password'}
                                placeholder="Min. 6 caractères"
                                value={regPassword}
                                onChange={(e) => setRegPassword(e.target.value)}
                                className="h-11 pr-10"
                              />
                              <button
                                type="button"
                                onClick={() => setShowRegPassword(!showRegPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                              >
                                {showRegPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="regConfirmPassword" className="text-sm">Confirmer le mot de passe *</Label>
                            <Input
                              id="regConfirmPassword"
                              type={showRegPassword ? 'text' : 'password'}
                              placeholder="Confirmez le mot de passe"
                              value={regConfirmPassword}
                              onChange={(e) => setRegConfirmPassword(e.target.value)}
                              className="h-11"
                            />
                          </div>
                        </>
                      ) : (
                        <div className="space-y-2">
                          <Label htmlFor="regPhone" className="text-sm">Téléphone *</Label>
                          <Input
                            id="regPhone"
                            type="tel"
                            placeholder="+225 XX XX XX XX"
                            value={regPhone}
                            onChange={(e) => setRegPhone(e.target.value)}
                            className="h-11"
                          />
                          <p className="text-xs text-muted-foreground">
                            Un code de vérification sera envoyé à ce numéro
                          </p>
                        </div>
                      )}
                    </div>
                    <Button
                      onClick={registerMethod === 'email' ? handleEmailRegister : handlePhoneRegister}
                      disabled={loading}
                      className="w-full h-11 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium mt-4"
                    >
                      {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                      {registerMethod === 'email' ? "S'inscrire" : "Recevoir le code"}
                    </Button>
                  </motion.div>
                )}

                {/* Step: OTP Verification */}
                {step === 'otp' && (
                  <motion.div
                    key="otp"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-center"
                  >
                    <div className="flex items-center justify-center mb-2">
                      <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                        <Mail className="h-6 w-6 text-green-600 dark:text-green-400" />
                      </div>
                    </div>
                    <StepHeader
                      title="Vérification"
                      subtitle={`Entrez le code envoyé au ${otpPhone}`}
                    />
                    <ErrorDisplay />
                    <div className="flex justify-center mb-6">
                      <InputOTP
                        value={otpCode}
                        onChange={(value) => setOtpCode(value)}
                        maxLength={4}
                      >
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                          <InputOTPSlot index={3} />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                    <p className="text-xs text-muted-foreground mb-4">
                      {otpTimer > 0 ? (
                        <>Renvoyer dans {formatTimer(otpTimer)}</>
                      ) : (
                        <button
                          onClick={handleResendOtp}
                          className="text-green-600 hover:underline flex items-center gap-1 mx-auto"
                        >
                          <RefreshCw className="h-3 w-3" />
                          Renvoyer le code
                        </button>
                      )}
                    </p>
                    <Button
                      onClick={handleOtpVerify}
                      disabled={loading || otpCode.length !== 4}
                      className="w-full h-11 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium"
                    >
                      {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                      Vérifier
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>

          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground mt-4">
            En continuant, vous acceptez nos conditions d&apos;utilisation
          </p>
        </div>
      </div>
    </div>
  );
}
