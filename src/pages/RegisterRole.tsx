import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Building, User as UserIcon } from 'lucide-react';

export function RegisterRole() {
  const { currentUser, userData, registerUser } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState<'worker' | 'company' | null>(null);
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      navigate('/');
    }
    if (userData) {
      if (userData.role === 'worker') navigate('/worker-dashboard');
      else navigate('/company-dashboard');
    }
  }, [currentUser, userData, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role || !name.trim()) return;
    setIsSubmitting(true);
    await registerUser(role, name);
    setIsSubmitting(false);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white shadow-sm border border-[#E2E8F0] sm:rounded-xl">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-xl leading-6 font-bold text-[#0F172A]">
            Completa la tua registrazione
          </h3>
          <div className="mt-2 max-w-xl text-sm text-[#64748B]">
            <p>Seleziona il tuo ruolo per continuare sulla piattaforma.</p>
          </div>
          <form className="mt-5" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-6">
              <div
                className={`relative rounded-xl border p-4 cursor-pointer flex flex-col items-center transition-all ${
                  role === 'worker' ? 'border-[#2563EB] ring-2 ring-[#2563EB] bg-[#EFF6FF]' : 'border-[#E2E8F0] hover:border-[#CBD5E1] bg-[#F8FAFC]'
                }`}
                onClick={() => setRole('worker')}
              >
                <UserIcon className={`h-8 w-8 mb-2 ${role === 'worker' ? 'text-[#2563EB]' : 'text-[#64748B]'}`} />
                <span className={`block text-sm font-bold ${role === 'worker' ? 'text-[#0F172A]' : 'text-[#1E293B]'}`}>
                  Operatore (Cerco lavoro)
                </span>
              </div>
              <div
                className={`relative rounded-xl border p-4 cursor-pointer flex flex-col items-center transition-all ${
                  role === 'company' ? 'border-[#2563EB] ring-2 ring-[#2563EB] bg-[#EFF6FF]' : 'border-[#E2E8F0] hover:border-[#CBD5E1] bg-[#F8FAFC]'
                }`}
                onClick={() => setRole('company')}
              >
                <Building className={`h-8 w-8 mb-2 ${role === 'company' ? 'text-[#2563EB]' : 'text-[#64748B]'}`} />
                <span className={`block text-sm font-bold ${role === 'company' ? 'text-[#0F172A]' : 'text-[#1E293B]'}`}>
                  Azienda (Offro lavoro)
                </span>
              </div>
            </div>

            <div className="mb-6">
              <label htmlFor="name" className="block text-sm font-bold text-[#1E293B]">
                {role === 'company' ? 'Nome Azienda' : 'Nome e Cognome'}
              </label>
              <input
                type="text"
                name="name"
                id="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 shadow-sm focus:ring-[#2563EB] focus:border-[#2563EB] block w-full sm:text-sm border-[#E2E8F0] bg-[#F8FAFC] rounded-lg py-2 px-3 border transition-colors"
                placeholder={role === 'company' ? 'Es. Multiservizi SPA' : 'Es. Mario Rossi'}
              />
            </div>

            <button
              type="submit"
              disabled={!role || !name.trim() || isSubmitting}
              className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-semibold rounded-lg shadow-sm text-white bg-[#2563EB] hover:bg-[#1D4ED8] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2563EB] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Salvataggio...' : 'Continua'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
