import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, getDocs, deleteDoc, doc, addDoc, updateDoc } from 'firebase/firestore';
import { User, Job, Banner, OperationType } from '../types';
import { handleFirestoreError } from '../utils';
import { Users, Briefcase, Image as ImageIcon, Trash2, Plus, Edit2, CheckCircle, XCircle } from 'lucide-react';

export function AdminDashboard() {
  const { userData } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'jobs' | 'banners'>('users');
  
  const [users, setUsers] = useState<User[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  
  const [loading, setLoading] = useState(false);

  const [newBanner, setNewBanner] = useState({ title: '', imageUrl: '', linkUrl: '', isActive: true });
  const [isSubmittingBanner, setIsSubmittingBanner] = useState(false);

  useEffect(() => {
    if (userData?.role !== 'admin') return;
    
    async function fetchData() {
      setLoading(true);
      try {
        if (activeTab === 'users') {
          const snapshot = await getDocs(query(collection(db, 'users')));
          setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User)));
        } else if (activeTab === 'jobs') {
          const snapshot = await getDocs(query(collection(db, 'jobs')));
          setJobs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job)));
        } else if (activeTab === 'banners') {
          const snapshot = await getDocs(query(collection(db, 'banners')));
          setBanners(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Banner)));
        }
      } catch (error) {
        console.error("Admin fetch error", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [activeTab, userData]);

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo utente?')) return;
    try {
      await deleteDoc(doc(db, 'users', userId));
      setUsers(users.filter(u => u.uid !== userId && u.id !== userId));
    } catch (e) {
      console.error(e);
      alert('Errore durante l\'eliminazione');
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo annuncio?')) return;
    try {
      await deleteDoc(doc(db, 'jobs', jobId));
      setJobs(jobs.filter(j => j.id !== jobId));
    } catch (e) {
      console.error(e);
      alert('Errore durante l\'eliminazione');
    }
  };

  const handleCreateBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingBanner(true);
    try {
      const bannerData = {
        title: newBanner.title,
        imageUrl: newBanner.imageUrl || null,
        linkUrl: newBanner.linkUrl || null,
        isActive: newBanner.isActive,
        createdAt: Date.now()
      };
      const docRef = await addDoc(collection(db, 'banners'), bannerData);
      setBanners([{ id: docRef.id, ...bannerData } as Banner, ...banners]);
      setNewBanner({ title: '', imageUrl: '', linkUrl: '', isActive: true });
    } catch (e) {
      console.error(e);
      alert('Errore creazione banner');
    } finally {
      setIsSubmittingBanner(false);
    }
  };

  const handleToggleBanner = async (bannerId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'banners', bannerId), { isActive: !currentStatus });
      setBanners(banners.map(b => b.id === bannerId ? { ...b, isActive: !currentStatus } : b));
    } catch (e) {
      console.error(e);
      alert('Errore aggiornamento banner');
    }
  };
  
  const handleDeleteBanner = async (bannerId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo banner?')) return;
    try {
      await deleteDoc(doc(db, 'banners', bannerId));
      setBanners(banners.filter(b => b.id !== bannerId));
    } catch (e) {
      console.error(e);
      alert('Errore durante l\'eliminazione');
    }
  };

  if (userData?.role !== 'admin') {
    return <div className="p-8 text-center text-red-600 font-bold">Accesso Negato. Solo amministratori.</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-[#0F172A] mb-8">Pannello Amministratore</h1>
      
      <div className="flex space-x-2 mb-8 bg-white p-1 rounded-xl shadow-sm border border-[#E2E8F0] w-max">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center px-4 py-2 rounded-lg font-bold text-sm transition-colors ${activeTab === 'users' ? 'bg-[#2563EB] text-white' : 'text-[#64748B] hover:bg-[#F1F5F9]'}`}
        >
          <Users className="w-4 h-4 mr-2" /> Utenti
        </button>
        <button
          onClick={() => setActiveTab('jobs')}
          className={`flex items-center px-4 py-2 rounded-lg font-bold text-sm transition-colors ${activeTab === 'jobs' ? 'bg-[#2563EB] text-white' : 'text-[#64748B] hover:bg-[#F1F5F9]'}`}
        >
          <Briefcase className="w-4 h-4 mr-2" /> Annunci
        </button>
        <button
          onClick={() => setActiveTab('banners')}
          className={`flex items-center px-4 py-2 rounded-lg font-bold text-sm transition-colors ${activeTab === 'banners' ? 'bg-[#2563EB] text-white' : 'text-[#64748B] hover:bg-[#F1F5F9]'}`}
        >
          <ImageIcon className="w-4 h-4 mr-2" /> Banner
        </button>
      </div>

      <div className="bg-white border border-[#E2E8F0] shadow-sm rounded-xl p-6">
        {loading && <p className="text-[#64748B] font-bold">Caricamento in corso...</p>}
        
        {!loading && activeTab === 'users' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-[#F8FAFC] text-[#475569] font-bold border-b border-[#E2E8F0]">
                <tr>
                  <th className="py-3 px-4">Nome</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Ruolo</th>
                  <th className="py-3 px-4 text-right">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id || u.uid} className="border-b border-[#F1F5F9] hover:bg-[#F8FAFC]">
                    <td className="py-3 px-4 font-bold text-[#0F172A]">{u.name}</td>
                    <td className="py-3 px-4 text-[#64748B]">{u.email}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                        u.role === 'admin' ? 'bg-[#F3E8FF] text-[#7E22CE]' :
                        u.role === 'company' ? 'bg-[#DBEAFE] text-[#1D4ED8]' :
                        'bg-[#FEF3C7] text-[#B45309]'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {u.role !== 'admin' && (
                        <button onClick={() => handleDeleteUser(u.id || u.uid)} className="text-red-600 hover:text-red-800 p-1" title="Elimina Utente">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && activeTab === 'jobs' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-[#F8FAFC] text-[#475569] font-bold border-b border-[#E2E8F0]">
                <tr>
                  <th className="py-3 px-4">Titolo</th>
                  <th className="py-3 px-4">Località</th>
                  <th className="py-3 px-4">Stato</th>
                  <th className="py-3 px-4 text-right">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map(j => (
                  <tr key={j.id} className="border-b border-[#F1F5F9] hover:bg-[#F8FAFC]">
                    <td className="py-3 px-4 font-bold text-[#0F172A]">{j.title}</td>
                    <td className="py-3 px-4 text-[#64748B]">{j.location}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase bg-[#DCFCE7] text-[#166534]">
                        {j.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button onClick={() => handleDeleteJob(j.id)} className="text-red-600 hover:text-red-800 p-1" title="Elimina Annuncio">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && activeTab === 'banners' && (
          <div>
            <form onSubmit={handleCreateBanner} className="mb-8 p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
              <h3 className="font-bold text-[#0F172A] mb-4 flex items-center">
                <Plus className="w-4 h-4 mr-2 text-[#2563EB]" />
                Nuovo Banner
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1E293B] mb-1">Titolo/Testo (Obbligatorio)</label>
                  <input required type="text" value={newBanner.title} onChange={e => setNewBanner({...newBanner, title: e.target.value})} className="w-full rounded-lg border-[#E2E8F0] py-2 px-3 text-sm focus:ring-[#2563EB]" placeholder="Promozione del mese" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1E293B] mb-1">URL Immagine (Opzionale)</label>
                  <input type="url" value={newBanner.imageUrl} onChange={e => setNewBanner({...newBanner, imageUrl: e.target.value})} className="w-full rounded-lg border-[#E2E8F0] py-2 px-3 text-sm focus:ring-[#2563EB]" placeholder="https://..." />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-[#1E293B] mb-1">URL Destinazione Link (Opzionale)</label>
                  <input type="url" value={newBanner.linkUrl} onChange={e => setNewBanner({...newBanner, linkUrl: e.target.value})} className="w-full rounded-lg border-[#E2E8F0] py-2 px-3 text-sm focus:ring-[#2563EB]" placeholder="https://..." />
                </div>
                <div className="md:col-span-2 flex items-center mt-2">
                  <input type="checkbox" id="isActive" checked={newBanner.isActive} onChange={e => setNewBanner({...newBanner, isActive: e.target.checked})} className="rounded text-[#2563EB] focus:ring-[#2563EB] mr-2" />
                  <label htmlFor="isActive" className="text-sm font-bold text-[#0F172A]">Banner Attivo Subito</label>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button type="submit" disabled={isSubmittingBanner} className="px-4 py-2 bg-[#2563EB] text-white text-sm font-bold rounded-lg hover:bg-[#1D4ED8] disabled:opacity-50">
                  {isSubmittingBanner ? 'Creazione...' : 'Crea Banner'}
                </button>
              </div>
            </form>

            <div className="space-y-4">
              {banners.length === 0 && <p className="text-[#64748B] text-sm">Nessun banner configurato.</p>}
              {banners.map(b => (
                <div key={b.id} className={`p-4 border rounded-xl flex items-center justify-between ${b.isActive ? 'border-[#2563EB] bg-[#EFF6FF]' : 'border-[#E2E8F0] bg-white'}`}>
                  <div className="flex-1">
                    <h4 className="font-bold text-[#0F172A]">{b.title}</h4>
                    {b.linkUrl && <a href={b.linkUrl} target="_blank" rel="noreferrer" className="text-xs text-[#2563EB] hover:underline block mt-1">{b.linkUrl}</a>}
                  </div>
                  <div className="flex items-center space-x-3 ml-4 shrink-0">
                    <button onClick={() => handleToggleBanner(b.id, b.isActive)} className={`text-xs font-bold px-3 py-1 rounded-full ${b.isActive ? 'bg-[#DCFCE7] text-[#166534]' : 'bg-[#F1F5F9] text-[#64748B]'}`}>
                      {b.isActive ? 'ATTIVO' : 'DISATTIVATO'}
                    </button>
                    <button onClick={() => handleDeleteBanner(b.id)} className="text-red-600 hover:text-red-800 p-1" title="Elimina Banner">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
