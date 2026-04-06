'use client';

import { logger } from '@/lib/logger';
import { fetcher } from '@/lib/fetcher';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  Phone,
  Lock,
  User,
  Eye,
  EyeOff,
  Pill,
  ArrowRight,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAppStore } from '@/store/app-store';

type AuthMethod = 'email' | 'phone' | 'google';
type AuthMode = 'login' | 'register';

export function AuthView() {
  const { setCurrentUser } = useAppStore();
  const [mode, setMode] = useState<AuthMode>('login');
  const [method, setMethod] = useState<AuthMethod>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [demoOtp, setDemoOtp] = useState('');

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (method === 'phone') {
        if (otpSent && otp) {
          // Verify OTP
          const res = await fetcher('/api/auth/verify-phone', {
            method: 'POST',
            body: JSON.stringify({ phone, code: otp }),
          });
          const data = await res.json();
          if (!res.ok) {
            setError(data.error || 'Code incorrect');
            setLoading(false);
            return;
          }
          localStorage.setItem('pharmapp-token', data.token);
          setCurrentUser(data.user);
          return;
        }

        if (mode === 'register') {
          // Send OTP then auto-register
          const sendRes = await fetcher('/api/auth/verify-phone', {
            method: 'POST',
            body: JSON.stringify({ phone }),
          });
          const sendData = await sendRes.json();
          if (!sendRes.ok) {
            setError(sendData.error || 'Erreur d\'envoi du code');
            setLoading(false);
            return;
          }
          setDemoOtp(sendData._demoCode || '');
          setOtpSent(true);
          setLoading(false);
          return;
        }

        // Login with phone — just send OTP
        const sendRes = await fetcher('/api/auth/verify-phone', {
          method: 'POST',
          body: JSON.stringify({ phone }),
        });
        const sendData = await sendRes.json();
        if (!sendRes.ok) {
          setError(sendData.error || 'Numéro non trouvé');
          setLoading(false);
          return;
        }
        setDemoOtp(sendData._demoCode || '');
        setOtpSent(true);
        setLoading(false);
        return;
      }

      if (method === 'google') {
        // Simulated Google login — in production, use OAuth
        setError('Connexion Google non configurée en démo. Utilisez email ou téléphone.');
        setLoading(false);
        return;
      }

      // Email auth
      const endpoint = mode === 'register' ? '/api/auth/register' : '/api/auth/login';
      const body: Record<string, string> = { authProvider: 'email', password };
      if (mode === 'register') body.name = name;
      body.email = email;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Erreur');
        setLoading(false);
        return;
      }

      localStorage.setItem('pharmapp-token', data.token);
      setCurrentUser(data.user);
    } catch {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
    setOtpSent(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-600 via-amber-700 to-amber-800 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <Pill className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Pharma CI</h1>
          <p className="text-amber-200 text-sm mt-1">
            {mode === 'login' ? 'Connectez-vous à votre compte' : 'Créez votre compte'}
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          {/* Mode toggle */}
          <div className="flex bg-amber-50 rounded-xl p-1 mb-6">
            <button
              onClick={() => { setMode('login'); setError(''); setOtpSent(false); }}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                mode === 'login' ? 'bg-white text-amber-700 shadow-sm' : 'text-amber-600'
              }`}
            >
              Connexion
            </button>
            <button
              onClick={() => { setMode('register'); setError(''); setOtpSent(false); }}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                mode === 'register' ? 'bg-white text-amber-700 shadow-sm' : 'text-amber-600'
              }`}
            >
              Inscription
            </button>
          </div>

          {/* Method selector */}
          {!otpSent && (
            <div className="flex gap-2 mb-6">
              {([
                { key: 'email' as AuthMethod, icon: Mail, label: 'Email' },
                { key: 'phone' as AuthMethod, icon: Phone, label: 'Téléphone' },
                { key: 'google' as AuthMethod, icon: ShieldCheck, label: 'Google' },
              ]).map((m) => (
                <button
                  key={m.key}
                  onClick={() => { setMethod(m.key); setError(''); setOtpSent(false); }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-medium border-2 transition-all ${
                    method === m.key
                      ? 'border-amber-500 bg-amber-50 text-amber-700'
                      : 'border-gray-200 text-gray-500 hover:border-amber-300 hover:text-amber-600'
                  }`}
                >
                  <m.icon className="h-4 w-4" />
                  {m.label}
                </button>
              ))}
            </div>
          )}

          {/* OTP verification mode */}
          {otpSent && (
            <div className="mb-4 bg-indigo-50 border border-indigo-200 rounded-xl p-3 text-center">
              <p className="text-xs text-indigo-700 font-medium mb-1 flex items-center justify-center gap-1.5">
                <Smartphone className="h-3.5 w-3.5" />
                Code envoyé par SMS
              </p>
              <p className="text-[10px] text-indigo-500">
                Mode démo — code affiché ci-dessous
              </p>
              {demoOtp && (
                <p className="text-2xl font-bold text-indigo-700 mt-2 tracking-widest">
                  {demoOtp}
                </p>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {method === 'email' && !otpSent && (
                <motion.div
                  key="email-form"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-4"
                >
                  {mode === 'register' && (
                    <div>
                      <label className="text-xs text-gray-500 mb-1.5 block font-medium">Nom complet</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Jean Dupont"
                          className="pl-10 h-11 rounded-xl"
                          required
                        />
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="text-xs text-gray-500 mb-1.5 block font-medium">Adresse email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="jean@example.com"
                        className="pl-10 h-11 rounded-xl"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1.5 block font-medium">Mot de passe</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="pl-10 pr-10 h-11 rounded-xl"
                        minLength={6}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {mode === 'register' && (
                      <p className="text-[10px] text-gray-400 mt-1">Minimum 6 caractères</p>
                    )}
                  </div>
                </motion.div>
              )}

              {method === 'phone' && !otpSent && (
                <motion.div
                  key="phone-form"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-4"
                >
                  {mode === 'register' && (
                    <div>
                      <label className="text-xs text-gray-500 mb-1.5 block font-medium">Nom complet</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Jean Dupont"
                          className="pl-10 h-11 rounded-xl"
                          required
                        />
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="text-xs text-gray-500 mb-1.5 block font-medium">Numéro de téléphone</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+225 07 XX XX XX"
                        className="pl-10 h-11 rounded-xl"
                        required
                      />
                    </div>
                  </div>
                  {mode === 'login' && (
                    <div>
                      <label className="text-xs text-gray-500 mb-1.5 block font-medium">Mot de passe</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="pl-10 pr-10 h-11 rounded-xl"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  )}
                  {mode === 'register' && (
                    <p className="text-[10px] text-gray-400">
                      Un code de vérification sera envoyé par SMS
                    </p>
                  )}
                </motion.div>
              )}

              {method === 'google' && !otpSent && (
                <motion.div
                  key="google-form"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="text-center py-4"
                >
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                    <ShieldCheck className="h-6 w-6 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500">
                    La connexion Google sera bientôt disponible.
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Utilisez email ou téléphone pour vous inscrire.
                  </p>
                </motion.div>
              )}

              {otpSent && (
                <motion.div
                  key="otp-form"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-4"
                >
                  <div>
                    <label className="text-xs text-gray-500 mb-1.5 block font-medium">Code de vérification</label>
                    <Input
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="000000"
                      className="h-11 rounded-xl text-center text-xl tracking-[0.3em] font-mono"
                      maxLength={6}
                      required
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => { setOtpSent(false); setError(''); }}
                    className="text-xs text-amber-600 hover:underline"
                  >
                    Renvoyer un nouveau code
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error */}
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg text-center"
              >
                {error}
              </motion.p>
            )}

            {/* Submit */}
            <Button
              type="submit"
              disabled={loading || (method === 'google' && !otpSent)}
              className="w-full h-11 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-medium text-sm"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
              ) : (
                <span className="flex items-center justify-center gap-2">
                  {otpSent ? 'Vérifier' : mode === 'login' ? 'Se connecter' : "S'inscrire"}
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          </form>

          {/* Switch mode */}
          <p className="text-center text-xs text-gray-500 mt-4">
            {mode === 'login' ? 'Pas encore de compte ?' : 'Déjà un compte ?'}
            <button onClick={switchMode} className="text-amber-600 font-semibold hover:underline ml-1">
              {mode === 'login' ? 'S\'inscrire' : 'Se connecter'}
            </button>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-amber-200/60 text-[10px] mt-6">
          Pharma CI © 2025 — Côte d&apos;Ivoire
        </p>
      </motion.div>
    </div>
  );
}
