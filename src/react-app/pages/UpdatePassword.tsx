import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import AuthHeader from '@/react-app/components/AuthHeader';

const UpdatePassword: React.FC = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if there's a session, which would mean the user arrived here via a password reset link
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError("Nenhuma sessão de redefinição de senha ativa. Por favor, solicite um novo link.");
        // Optionally redirect to forgot password page
        // navigate('/forgot-password');
      }
    };
    checkSession();
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    setLoading(true);

    if (newPassword !== confirmNewPassword) {
      setError("As senhas não coincidem.");
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      setLoading(false);
      return;
    }

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setError(updateError.message);
      } else {
        setMessage("Sua senha foi atualizada com sucesso! Você será redirecionado para a página de login.");
        setTimeout(() => {
          navigate('/signin');
        }, 3000); // Redirect after 3 seconds
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100">
      <AuthHeader linkTo="/signin" linkText="Voltar para Login" />
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Definir Nova Senha
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Insira sua nova senha abaixo.
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleUpdatePassword}>
            <div className="space-y-4">
              <div>
                <label htmlFor="new-password" className="sr-only">
                  Nova Senha
                </label>
                <input
                  id="new-password"
                  name="new-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="appearance-none rounded-xl relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
                  placeholder="Nova Senha"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div>
                <label htmlFor="confirm-new-password" className="sr-only">
                  Confirmar Nova Senha
                </label>
                <input
                  id="confirm-new-password"
                  name="confirm-new-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="appearance-none rounded-xl relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
                  placeholder="Confirmar Nova Senha"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            {error && <p className="mt-2 text-center text-sm text-red-600">{error}</p>}
            {message && <p className="mt-2 text-center text-sm text-green-600">{message}</p>}

            <div>
              <button
                type="submit"
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-lg hover:shadow-xl transition-all duration-200"
                disabled={loading}
              >
                {loading ? 'Atualizando...' : 'Atualizar Senha'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UpdatePassword;