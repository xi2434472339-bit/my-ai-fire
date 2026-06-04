import { useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PasswordGateProps {
  onAuthenticated: () => void;
}

export function PasswordGate({ onAuthenticated }: PasswordGateProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  const correctPassword = import.meta.env.VITE_ACCESS_PASSWORD as string | undefined;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === correctPassword) {
      sessionStorage.setItem('ledger_auth', 'true');
      onAuthenticated();
    } else {
      setError('密码错误，请重试');
      setShake(true);
      setPassword('');
      setTimeout(() => setShake(false), 500);
    }
  };

  const boxClass = [
    'w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 shadow-xl p-8',
    'border border-slate-200 dark:border-slate-700',
    shake ? 'animate-shake' : '',
  ].join(' ');

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 px-4">
      <div className={boxClass}>
        <div className="mb-6 flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-ledger-header text-white shadow-md">
            <Lock className="h-6 w-6" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">戈瓦记账本</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">请输入访问密码</p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-slate-700 dark:text-slate-300">
              访问密码
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                placeholder="请输入密码"
                autoFocus
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
          </div>
          <Button type="submit" className="w-full bg-ledger-header hover:opacity-90" disabled={!password}>
            进入台账
          </Button>
        </form>
        <p className="mt-4 text-center text-xs text-slate-400">仅限授权人员访问</p>
      </div>
    </div>
  );
}
