
import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Truck, Mail, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, user, profile } = useAuth();
  const navigate = useNavigate();

  // If user is authenticated and has profile, redirect to home
  if (user && profile) {
    console.log('✅ User authenticated, redirecting to home');
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        console.log('🔐 Attempting login for:', email);
        const { error } = await signIn(email, password);
        if (!error) {
          console.log('✅ Login successful, navigating to home');
          // Wait a bit for auth state to update, then navigate
          setTimeout(() => {
            navigate('/', { replace: true });
          }, 500);
        }
      } else {
        console.log('📝 Attempting signup for:', email);
        const { error } = await signUp(email, password, 'agent');
        if (!error) {
          console.log('✅ Signup successful');
          setIsLogin(true); // Switch to login after successful signup
        }
      }
    } catch (error) {
      console.error('❌ Auth error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = () => {
    setEmail('contact@matchmove.fr');
    setPassword('Azzyouman@90');
  };

  const clearForm = () => {
    setEmail('');
    setPassword('');
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{
        backgroundImage: 'url(https://www.petites-phrases.com/wp-content/uploads/2023/02/demenagement-urgent.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Overlay for better readability */}
      <div className="absolute inset-0 bg-black/40"></div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 260, damping: 20 }}
            className="mx-auto mb-4"
          >
            <img 
              src="https://matchmove.fr/wp-content/uploads/2024/02/Logo-Matchmove-e1709213815530.png" 
              alt="MatchMove Logo" 
              className="h-20 w-auto mx-auto"
            />
          </motion.div>
          <h1 className="text-3xl font-bold text-white drop-shadow-lg">
            MatchMove.io
          </h1>
          <p className="text-white/90 mt-2 drop-shadow">
            Plateforme de matching pour déménagements
          </p>
        </div>

        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">
              {isLogin ? 'Connexion' : 'Inscription'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    type="password"
                    placeholder="Mot de passe"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                disabled={loading}
              >
                {loading ? 'Chargement...' : (isLogin ? 'Se connecter' : "S'inscrire")}
              </Button>
            </form>

            <div className="mt-4 space-y-3">
              <div className="flex justify-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    clearForm();
                  }}
                >
                  {isLogin ? "Créer un compte" : "Se connecter"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAdminLogin}
                >
                  Login Admin
                </Button>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Contactez votre admin en cas de problème de login
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Auth;
