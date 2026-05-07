import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Lock, Mail, Shield, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [honeypot, setHoneypot] = useState(''); // Bot protection
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('error') === 'access_denied') {
      setError('SECURITY ALERT: Unauthorized access attempt detected and logged.');
    }
  }, [location]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;
    if (honeypot) {
      console.log('Bot detected');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Obligatory credentials check
      if (email !== 'digital@bcos-dz.com' || password !== 'xccbn34@@sà') {
        throw new Error('SECURITY: Invalid Admin Credentials.');
      }

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;
      
      toast.success('Encryption Key Validated. Welcome Admin.');
      navigate('/admin');
    } catch (err: any) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      
      if (newAttempts >= 5) {
        setIsLocked(true);
        setError('CRITICAL: Too many failed attempts. Temporary IP lockout initiated.');
        setTimeout(() => {
          setIsLocked(false);
          setAttempts(0);
        }, 600000); // 10 minute lockout
      } else {
        setError(err.message || 'Verification failed. Please check your credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/admin',
        },
      });
      if (error) throw error;
    } catch (err: any) {
      toast.error(err.message || 'Google Auth Error');
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#020617] font-sans">
      {/* Background Orbs */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-5%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[150px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] rounded-full bg-indigo-600/10 blur-[150px] animate-pulse" />
        <div className="absolute top-[30%] left-[40%] w-[20%] h-[20%] rounded-full bg-emerald-500/5 blur-[100px]" />
      </div>

      {/* Matrix-like light lines */}
      <div className="absolute inset-0 z-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '50px 50px' }} />

      <div className="w-full max-w-[1000px] grid lg:grid-cols-2 gap-0 relative z-10 bg-[#0f172a]/40 backdrop-blur-3xl rounded-[40px] border border-white/5 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] overflow-hidden">
        
        {/* Left Side: Branding/Visual */}
        <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-primary/20 to-transparent border-r border-white/5 relative overflow-hidden">
          <div className="relative z-10">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mb-8 shadow-lg shadow-primary/40">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
              BCOS <span className="text-primary">Management</span> Center
            </h2>
            <p className="text-white/50 text-lg leading-relaxed max-w-sm">
              Empowering professional growth through state-of-the-art management tools.
            </p>
          </div>

          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-3 text-white/40 text-sm">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Systems Operational
            </div>
            <p className="text-white/30 text-xs">
              © 2024 BCOS Formation & Conseil. All rights reserved.
            </p>
          </div>

          {/* Decorative element */}
          <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
        </div>

        {/* Right Side: Login Form */}
        <div className="p-8 sm:p-12 lg:p-16 flex flex-col justify-center">
          <div className="mb-8 block lg:hidden text-center">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">BCOS Admin</h2>
          </div>

          <div className="mb-10 text-center lg:text-left">
            <h3 className="text-2xl font-bold text-white mb-2">Internal Portal</h3>
            <p className="text-white/40 text-sm">Administrative identity verification required.</p>
          </div>

          {error && (
            <Alert className="mb-6 bg-red-500/10 border-red-500/20 text-red-400 rounded-2xl">
              <AlertDescription className="text-xs font-medium">{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Honeypot field (Hidden from humans) */}
            <input 
              type="text" 
              name="website" 
              className="hidden" 
              tabIndex={-1} 
              autoComplete="off" 
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />

            <div className="space-y-2">
              <Label htmlFor="email" className="text-white/60 text-xs font-bold uppercase tracking-widest ml-1">Email Address</Label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 w-4 h-4 group-focus-within:text-primary transition-colors" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@bcos-dz.com"
                  value={email}
                  disabled={isLocked}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-12 h-14 bg-white/[0.03] border-white/5 rounded-2xl text-white placeholder:text-white/10 focus:ring-primary/20 focus:border-primary/40 transition-all disabled:opacity-50"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <Label htmlFor="password" className="text-white/60 text-xs font-bold uppercase tracking-widest">Security Code</Label>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 w-4 h-4 group-focus-within:text-primary transition-colors" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  disabled={isLocked}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-12 h-14 bg-white/[0.03] border-white/5 rounded-2xl text-white placeholder:text-white/10 focus:ring-primary/20 focus:border-primary/40 transition-all disabled:opacity-50"
                  required
                />
                <button
                  type="button"
                  disabled={isLocked}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className={`w-full h-14 font-bold rounded-2xl shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 group ${
                isLocked ? 'bg-red-500/50 cursor-not-allowed' : 'bg-primary hover:bg-primary/90 shadow-primary/20 text-white'
              }`}
              disabled={isLoading || isLocked}
            >
              {isLocked ? (
                'System Locked'
              ) : isLoading ? (
                'Decrypting Access...'
              ) : (
                <>
                  Connect to Dashboard
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/5"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-widest font-bold">
              <span className="px-4 bg-[#0f172a] text-white/20">External Auth</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="h-14 bg-white/[0.03] border-white/5 rounded-2xl text-white/80 hover:bg-white/[0.05] hover:text-white transition-all flex items-center justify-center gap-3"
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading}
          >
            {isGoogleLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-primary"></div>
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            Sign in with Google Account
          </Button>

        </div>
      </div>
    </div>
  );
};

export default Login;
