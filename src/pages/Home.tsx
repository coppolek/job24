import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, Sparkles, Building2, Users, ArrowRight, ShieldCheck, Clock } from 'lucide-react';
import { motion } from 'motion/react';

export function Home() {
  const { currentUser, userData, loading, login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && currentUser) {
      if (!userData) {
        navigate('/register-role');
      } else if (userData.role === 'worker') {
        navigate('/worker-dashboard');
      } else if (userData.role === 'company') {
        navigate('/company-dashboard');
      }
    }
  }, [currentUser, userData, loading, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] bg-[#F8FAFC]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2563EB]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F8FAFC] flex flex-col">
      {/* Hero Section */}
      <section className="relative px-4 pt-20 pb-24 sm:px-6 lg:px-8 mx-auto max-w-7xl w-full flex flex-col items-center text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center px-3 py-1 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-[#1D4ED8] text-sm font-semibold mb-8"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          La nuova rete del multiservizi in Italia
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl md:text-6xl font-extrabold text-[#0F172A] tracking-tight max-w-4xl"
        >
          Connetti <span className="text-[#2563EB]">Aziende</span> e <span className="text-[#2563EB]">Operatori</span> in un click.
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-6 text-lg md:text-xl text-[#475569] max-w-2xl leading-relaxed font-medium"
        >
          La piattaforma verticale per il settore pulizie e facility management. 
          Crea il tuo profilo, imposta le tue disponibilità o trova il personale qualificato di cui hai bisogno oggi stesso.
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-10 flex flex-col sm:flex-row gap-4 w-full sm:w-auto z-10"
        >
          <button
            onClick={login}
            className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-xl shadow-sm transition-all focus:ring-2 focus:ring-offset-2 focus:ring-[#2563EB]"
          >
            <LogIn className="w-5 h-5 mr-2" />
            Accedi o Registrati gratis
          </button>
          <button
            onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
            className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-[#0F172A] bg-white border border-[#E2E8F0] hover:bg-[#F1F5F9] rounded-xl shadow-sm transition-all"
          >
            Scopri come funziona
            <ArrowRight className="w-5 h-5 ml-2 text-[#64748B]" />
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mt-16 w-full max-w-5xl rounded-2xl overflow-hidden shadow-2xl border border-[#E2E8F0]"
        >
          <img 
            src="/src/assets/images/hero_cleaning_services_1788775176366.jpg" 
            alt="Professionisti delle pulizie al lavoro" 
            className="w-full h-auto object-cover aspect-video"
            referrerPolicy="no-referrer"
          />
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white border-t border-[#F1F5F9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-[#0F172A]">Progettato per la flessibilità</h2>
            <p className="mt-4 text-lg text-[#64748B] max-w-2xl mx-auto">
              Che tu stia cercando lavoro o offrendo opportunità, abbiamo gli strumenti giusti per te.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="p-8 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#CBD5E1] transition-colors"
            >
              <div className="w-12 h-12 bg-[#EFF6FF] rounded-xl flex items-center justify-center mb-6">
                <Users className="w-6 h-6 text-[#2563EB]" />
              </div>
              <h3 className="text-xl font-bold text-[#0F172A] mb-3">Per gli Operatori</h3>
              <p className="text-[#475569] leading-relaxed">
                Crea il tuo profilo, imposta le tue disponibilità orarie (Mattina, Pomeriggio, Sera), carica il tuo CV e candidati agli annunci in un clic.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="p-8 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#CBD5E1] transition-colors"
            >
              <div className="w-12 h-12 bg-[#EFF6FF] rounded-xl flex items-center justify-center mb-6">
                <Building2 className="w-6 h-6 text-[#2563EB]" />
              </div>
              <h3 className="text-xl font-bold text-[#0F172A] mb-3">Per le Aziende</h3>
              <p className="text-[#475569] leading-relaxed">
                Pubblica annunci dettagliati con richieste di disponibilità specifiche. Filtra i candidati per zona, tariffa o turni desiderati.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="p-8 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#CBD5E1] transition-colors"
            >
              <div className="w-12 h-12 bg-[#EFF6FF] rounded-xl flex items-center justify-center mb-6">
                <ShieldCheck className="w-6 h-6 text-[#2563EB]" />
              </div>
              <h3 className="text-xl font-bold text-[#0F172A] mb-3">Gestione Semplice</h3>
              <p className="text-[#475569] leading-relaxed">
                Notifiche istantanee sull'esito delle candidature. Accetta o rifiuta candidati in tempo reale direttamente dalla tua dashboard.
              </p>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
