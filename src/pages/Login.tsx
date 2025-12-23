import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { BlockchainLogo } from '@/components/BlockchainLogo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock, User, ArrowRight, Shield, FileCheck, Blocks } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate loading
    await new Promise(resolve => setTimeout(resolve, 800));

    const success = login(username, password);
    
    if (success) {
      toast({
        title: "Welcome back!",
        description: "Successfully authenticated.",
      });
      navigate('/dashboard');
    } else {
      toast({
        title: "Authentication failed",
        description: "Invalid credentials.",
        variant: "destructive",
      });
    }
    
    setIsLoading(false);
  };

  const features = [
    { icon: Shield, title: "Secure", desc: "Cryptographic verification" },
    { icon: Blocks, title: "Immutable", desc: "Tamper-proof records" },
    { icon: FileCheck, title: "Verified", desc: "Instant validation" },
  ];

  return (
    <div className="min-h-screen grid-pattern flex items-center justify-center p-6">
      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
        {/* Left - Branding */}
        <div className="opacity-0 animate-slide-up" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
          <div className="flex items-center gap-4 mb-8">
            <BlockchainLogo size="lg" />
            <div>
              <h1 className="text-4xl font-display font-bold text-gradient">CertChain</h1>
              <p className="text-muted-foreground">Blockchain Certificate Verification</p>
            </div>
          </div>

          <h2 className="text-3xl lg:text-4xl font-display font-bold text-foreground mb-4">
            Secure Academic<br />
            <span className="text-gradient">Credential Verification</span>
          </h2>

          <p className="text-lg text-muted-foreground mb-8 max-w-md">
            Immutable blockchain technology ensuring authentic, tamper-proof academic certificates with instant verification.
          </p>

          <div className="grid grid-cols-3 gap-4">
            {features.map((feature, idx) => (
              <div 
                key={idx} 
                className="p-4 glass rounded-xl opacity-0 animate-scale-in"
                style={{ animationDelay: `${300 + idx * 100}ms`, animationFillMode: 'forwards' }}
              >
                <feature.icon className="w-8 h-8 text-primary mb-3" />
                <h3 className="font-display font-semibold text-foreground">{feature.title}</h3>
                <p className="text-xs text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right - Login Form */}
        <div 
          className="opacity-0 animate-slide-up"
          style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}
        >
          <div className="glass-strong rounded-3xl p-8 lg:p-10 border-glow">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-display font-bold text-foreground mb-2">Welcome Back</h3>
              <p className="text-muted-foreground">Enter your credentials to access the system</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Username</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Enter username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-12"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-12"
                    required
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </form>

            <p className="text-xs text-muted-foreground text-center mt-6">
              Protected by blockchain cryptography
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
