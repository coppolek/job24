import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { Job, Application, User, OperationType } from '../types';
import { handleFirestoreError } from '../utils';
import { Briefcase, Plus, Users, MapPin, CheckCircle, XCircle, Search, Filter } from 'lucide-react';

const DAYS = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];

export function CompanyDashboard() {
  const { currentUser, userData } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<(Application & { workerName?: string, workerEmail?: string, workerAvailabilities?: string[], workerLocation?: string, workerHourlyRate?: number, workerCvData?: string, workerCvName?: string, workerCvType?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showNewJobForm, setShowNewJobForm] = useState(false);
  const [newJob, setNewJob] = useState<{ title: string; description: string; location: string; requiredAvailabilities: string[] }>({ title: '', description: '', location: '', requiredAvailabilities: [] });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filters for applications
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMaxRate, setFilterMaxRate] = useState<number | ''>('');
  const [filterAvailabilities, setFilterAvailabilities] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const filteredApplications = applications.filter(app => {
    let matches = true;
    
    // Text search (name, location, or job title)
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const job = jobs.find(j => j.id === app.jobId);
      const searchStr = `${app.workerName || ''} ${app.workerLocation || ''} ${job?.title || ''}`.toLowerCase();
      if (!searchStr.includes(term)) matches = false;
    }

    // Max hourly rate
    if (filterMaxRate !== '') {
      if (app.workerHourlyRate === undefined || app.workerHourlyRate > filterMaxRate) {
        matches = false;
      }
    }

    // Availability filter (must have AT LEAST ONE of the required selected availabilities, if any selected)
    if (filterAvailabilities.length > 0) {
      if (!app.workerAvailabilities || !app.workerAvailabilities.some(avail => filterAvailabilities.includes(avail))) {
        matches = false;
      }
    }

    return matches;
  });

  const toggleFilterAvailability = (day: string, shift: 'Mattina' | 'Pomeriggio' | 'Sera') => {
    const value = `${day} - ${shift}`;
    if (filterAvailabilities.includes(value)) {
      setFilterAvailabilities(filterAvailabilities.filter(a => a !== value));
    } else {
      setFilterAvailabilities([...filterAvailabilities, value]);
    }
  };

  useEffect(() => {
    async function fetchData() {
      if (!currentUser) return;
      try {
        const jobsQuery = query(collection(db, 'jobs'), where('companyId', '==', currentUser.uid));
        const jobsSnapshot = await getDocs(jobsQuery);
        const jobsList = jobsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));
        setJobs(jobsList);

        if (jobsList.length > 0) {
          const appsQuery = query(collection(db, 'applications'), where('companyId', '==', currentUser.uid));
          const appsSnapshot = await getDocs(appsQuery);
          
          const appsList = await Promise.all(appsSnapshot.docs.map(async (appDoc) => {
            const appData = appDoc.data() as Application;
            let workerInfo = {};
            try {
              const workerSnap = await getDoc(doc(db, 'users', appData.workerId));
              if (workerSnap.exists()) {
                const worker = workerSnap.data() as User;
                workerInfo = { 
                  workerName: worker.name, 
                  workerEmail: worker.email,
                  workerAvailabilities: worker.availabilities,
                  workerLocation: worker.location,
                  workerHourlyRate: worker.hourlyRate,
                  workerCvData: worker.cvData,
                  workerCvName: worker.cvName,
                  workerCvType: worker.cvType
                };
              }
            } catch (e) {
              console.error("Error fetching worker", e);
            }
            return { id: appDoc.id, ...appData, ...workerInfo };
          }));
          
          setApplications(appsList);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'jobs/applications');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [currentUser]);

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newJob.title || !newJob.description || !newJob.location) return;
    setIsSubmitting(true);
    try {
      const jobData = {
        companyId: currentUser.uid,
        title: newJob.title,
        description: newJob.description,
        location: newJob.location,
        status: 'open',
        requiredAvailabilities: newJob.requiredAvailabilities,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      const docRef = await addDoc(collection(db, 'jobs'), jobData);
      setJobs([{ id: docRef.id, ...jobData } as Job, ...jobs]);
      setShowNewJobForm(false);
      setNewJob({ title: '', description: '', location: '', requiredAvailabilities: [] });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'jobs');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateApplicationStatus = async (appId: string, status: 'accepted' | 'rejected') => {
    try {
      const appRef = doc(db, 'applications', appId);
      await updateDoc(appRef, { status, updatedAt: Date.now() });
      setApplications(apps => apps.map(a => a.id === appId ? { ...a, status } : a));

      // Notify the worker
      const application = applications.find(a => a.id === appId);
      const job = jobs.find(j => j.id === application?.jobId);
      if (application && job) {
        try {
          await addDoc(collection(db, 'notifications'), {
            userId: application.workerId,
            message: `La tua candidatura per l'annuncio "${job.title}" è stata ${status === 'accepted' ? 'ACCETTATA' : 'RIFIUTATA'}.`,
            read: false,
            createdAt: Date.now()
          });
        } catch (notifError) {
          console.error("Failed to create notification", notifError);
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `applications/${appId}`);
    }
  };

  const toggleAvailability = (day: string, shift: 'Mattina' | 'Pomeriggio' | 'Sera') => {
    const value = `${day} - ${shift}`;
    if (newJob.requiredAvailabilities.includes(value)) {
      setNewJob({ ...newJob, requiredAvailabilities: newJob.requiredAvailabilities.filter(a => a !== value) });
    } else {
      setNewJob({ ...newJob, requiredAvailabilities: [...newJob.requiredAvailabilities, value] });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-[#0F172A]">Area Azienda</h1>
        <button
          onClick={() => setShowNewJobForm(!showNewJobForm)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-semibold rounded-lg shadow-sm text-white bg-[#2563EB] hover:bg-[#1D4ED8] transition-colors"
        >
          {showNewJobForm ? 'Annulla' : <><Plus className="h-4 w-4 mr-2" /> Nuovo Annuncio</>}
        </button>
      </div>

      {showNewJobForm && (
        <div className="bg-white border border-[#E2E8F0] shadow-sm sm:rounded-xl p-6 mb-8 border-t-4 border-t-[#2563EB]">
          <h2 className="text-xl font-bold text-[#0F172A] mb-4">Crea nuovo annuncio</h2>
          <form onSubmit={handleCreateJob}>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-sm font-bold text-[#1E293B]">Titolo Annuncio</label>
                <input
                  type="text"
                  required
                  value={newJob.title}
                  onChange={e => setNewJob({...newJob, title: e.target.value})}
                  className="mt-1 block w-full rounded-lg border-[#E2E8F0] bg-[#F8FAFC] shadow-sm focus:border-[#2563EB] focus:ring-[#2563EB] sm:text-sm py-2 px-3 border transition-colors"
                  placeholder="es. Addetto alle pulizie uffici"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-bold text-[#1E293B]">Descrizione e Requisiti</label>
                <textarea
                  required
                  rows={4}
                  value={newJob.description}
                  onChange={e => setNewJob({...newJob, description: e.target.value})}
                  className="mt-1 block w-full rounded-lg border-[#E2E8F0] bg-[#F8FAFC] shadow-sm focus:border-[#2563EB] focus:ring-[#2563EB] sm:text-sm py-2 px-3 border transition-colors"
                  placeholder="Descrivi il lavoro e le disponibilità orarie richieste..."
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-bold text-[#1E293B]">Luogo di lavoro</label>
                <input
                  type="text"
                  required
                  value={newJob.location}
                  onChange={e => setNewJob({...newJob, location: e.target.value})}
                  className="mt-1 block w-full rounded-lg border-[#E2E8F0] bg-[#F8FAFC] shadow-sm focus:border-[#2563EB] focus:ring-[#2563EB] sm:text-sm py-2 px-3 border transition-colors"
                  placeholder="es. Milano Centro"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-bold text-[#1E293B] mb-2">Disponibilità Richieste (Opzionale)</label>
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-4 space-y-3">
                  {DAYS.map(day => (
                    <div key={day} className="border-b border-[#E2E8F0] pb-3 last:border-0 last:pb-0">
                      <span className="block text-xs font-bold text-[#1E293B] mb-2 uppercase tracking-wider">{day}</span>
                      <div className="flex flex-wrap gap-2">
                        {['Mattina', 'Pomeriggio', 'Sera'].map(shift => {
                          const value = `${day} - ${shift}`;
                          const isSelected = newJob.requiredAvailabilities.includes(value);
                          return (
                            <button
                              key={shift}
                              type="button"
                              onClick={() => toggleAvailability(day, shift as any)}
                              className={`px-3 py-1 text-xs font-bold rounded-full border transition-colors ${
                                isSelected 
                                  ? 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]' 
                                  : 'bg-white text-[#64748B] border-[#E2E8F0] hover:bg-[#F8FAFC]'
                              }`}
                            >
                              {shift}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-semibold rounded-lg text-white bg-[#2563EB] hover:bg-[#1D4ED8] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2563EB] disabled:opacity-50"
              >
                {isSubmitting ? 'Pubblicazione...' : 'Pubblica Annuncio'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <div className="bg-white border border-[#E2E8F0] shadow-sm sm:rounded-xl p-6 h-full flex flex-col">
            <h2 className="text-xl font-bold text-[#0F172A] mb-4 flex items-center shrink-0">
              <Briefcase className="h-5 w-5 mr-2 text-[#2563EB]" />
              I tuoi annunci
            </h2>
            {loading ? (
              <p className="text-sm text-[#64748B] font-medium">Caricamento...</p>
            ) : jobs.length === 0 ? (
              <p className="text-sm text-[#64748B] font-medium">Non hai ancora pubblicato annunci.</p>
            ) : (
              <div className="space-y-4 overflow-y-auto pr-1">
                {jobs.map(job => (
                  <div key={job.id} className="border border-[#E2E8F0] bg-[#F8FAFC] rounded-xl p-4">
                    <h3 className="text-lg font-bold text-[#0F172A]">{job.title}</h3>
                    <p className="text-xs text-[#64748B] flex items-center mt-1 mb-2 font-medium">
                      <MapPin className="h-3 w-3 mr-1" /> {job.location}
                    </p>
                    <p className="text-sm text-[#475569] line-clamp-2">{job.description}</p>
                    {job.requiredAvailabilities && job.requiredAvailabilities.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        <span className="text-[10px] font-bold text-[#64748B] uppercase w-full mb-1">Richieste:</span>
                        {job.requiredAvailabilities.map((avail, idx) => (
                          <span key={idx} className="inline-block bg-[#F1F5F9] text-[#475569] text-[10px] font-bold px-2 py-0.5 rounded">
                            {avail}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="mt-4">
                      <span className="inline-flex items-center px-2 py-1 bg-[#DCFCE7] text-[#166534] rounded-full text-[10px] font-bold tracking-wider uppercase">
                        Aperto
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="bg-white border border-[#E2E8F0] shadow-sm sm:rounded-xl p-6 h-full flex flex-col">
            <div className="flex justify-between items-center mb-4 shrink-0">
              <h2 className="text-xl font-bold text-[#0F172A] flex items-center">
                <Users className="h-5 w-5 mr-2 text-[#2563EB]" />
                Candidature
              </h2>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-lg border transition-colors ${showFilters ? 'bg-[#EFF6FF] border-[#BFDBFE] text-[#2563EB]' : 'bg-white border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC]'}`}
                title="Filtra candidature"
              >
                <Filter className="w-4 h-4" />
              </button>
            </div>

            {showFilters && (
              <div className="mb-4 p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-3">
                <div>
                  <label className="block text-xs font-bold text-[#1E293B] mb-1">Cerca (Nome, Città, Annuncio)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 text-[#94A3B8]" />
                    </div>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="block w-full pl-9 rounded-lg border-[#E2E8F0] bg-white shadow-sm focus:border-[#2563EB] focus:ring-[#2563EB] sm:text-sm py-2 px-3 border transition-colors"
                      placeholder="Cerca..."
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1E293B] mb-1">Tariffa oraria massima (€)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={filterMaxRate}
                    onChange={(e) => setFilterMaxRate(e.target.value ? parseFloat(e.target.value) : '')}
                    className="block w-full rounded-lg border-[#E2E8F0] bg-white shadow-sm focus:border-[#2563EB] focus:ring-[#2563EB] sm:text-sm py-2 px-3 border transition-colors"
                    placeholder="Nessun limite"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1E293B] mb-2">Filtra per disponibilità (Mostra se ha almeno uno dei turni selezionati)</label>
                  <div className="bg-white border border-[#E2E8F0] rounded-lg p-3 max-h-40 overflow-y-auto space-y-2">
                    {DAYS.map(day => (
                      <div key={day} className="border-b border-[#F1F5F9] pb-2 last:border-0 last:pb-0">
                        <span className="block text-[10px] font-bold text-[#64748B] mb-1 uppercase tracking-wider">{day}</span>
                        <div className="flex flex-wrap gap-1">
                          {['Mattina', 'Pomeriggio', 'Sera'].map(shift => {
                            const value = `${day} - ${shift}`;
                            const isSelected = filterAvailabilities.includes(value);
                            return (
                              <button
                                key={shift}
                                type="button"
                                onClick={() => toggleFilterAvailability(day, shift as any)}
                                className={`px-2 py-0.5 text-[10px] font-bold rounded border transition-colors ${
                                  isSelected 
                                    ? 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]' 
                                    : 'bg-white text-[#64748B] border-[#E2E8F0] hover:bg-[#F8FAFC]'
                                }`}
                              >
                                {shift}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {loading ? (
              <p className="text-sm text-[#64748B] font-medium">Caricamento...</p>
            ) : applications.length === 0 ? (
              <p className="text-sm text-[#64748B] font-medium">Nessuna candidatura ricevuta.</p>
            ) : filteredApplications.length === 0 ? (
              <p className="text-sm text-[#64748B] font-medium">Nessuna candidatura corrisponde ai filtri di ricerca.</p>
            ) : (
              <div className="space-y-4 overflow-y-auto pr-1">
                {filteredApplications.map(app => {
                  const job = jobs.find(j => j.id === app.jobId);
                  return (
                    <div key={app.id} className="border border-[#E2E8F0] bg-[#F8FAFC] rounded-xl p-4 transition-all">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="text-md font-bold text-[#0F172A]">{app.workerName || 'Utente sconosciuto'}</h3>
                          <p className="text-xs text-[#64748B] font-medium">Per annuncio: <span className="text-[#1E293B]">{job?.title}</span></p>
                        </div>
                        <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                          app.status === 'pending' ? 'bg-[#FEF3C7] text-[#92400E]' :
                          app.status === 'accepted' ? 'bg-[#DCFCE7] text-[#166534]' :
                          'bg-[#FEE2E2] text-[#991B1B]'
                        }`}>
                          {app.status === 'pending' ? 'IN ATTESA' : app.status === 'accepted' ? 'ACCETTATO' : 'RIFIUTATO'}
                        </span>
                      </div>
                      
                      <div className="bg-white border border-[#F1F5F9] rounded-lg p-3">
                        <div className="flex flex-wrap items-center gap-4 mb-2">
                          {app.workerLocation && (
                            <p className="text-xs text-[#475569] flex items-center font-medium">
                              <MapPin className="h-3 w-3 mr-1" /> {app.workerLocation}
                            </p>
                          )}
                          {app.workerHourlyRate !== undefined && (
                            <p className="text-xs text-[#475569] font-medium">
                              Tariffa: <span className="text-[#0F172A] font-bold">{app.workerHourlyRate} €/h</span>
                            </p>
                          )}
                          {app.workerCvData && (
                            <a
                              href={app.workerCvData}
                              download={app.workerCvName || 'cv'}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs font-bold text-[#2563EB] hover:underline flex items-center bg-[#EFF6FF] px-2 py-1 rounded"
                            >
                              Visualizza CV
                            </a>
                          )}
                        </div>
                        <p className="text-[10px] text-[#64748B] font-semibold mb-2 uppercase tracking-wider">Disponibilità orarie</p>
                        <div className="flex flex-wrap gap-2">
                          {app.workerAvailabilities && app.workerAvailabilities.length > 0 ? (
                            app.workerAvailabilities.map((avail, idx) => (
                              <span key={idx} className="inline-block bg-[#EFF6FF] text-[#2563EB] text-xs font-medium px-2 py-1 rounded-md">
                                {avail}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-[#94A3B8] italic">Nessuna indicata</span>
                          )}
                        </div>
                      </div>

                      {app.status === 'pending' && (
                        <div className="mt-4 flex space-x-3">
                          <button
                            onClick={() => handleUpdateApplicationStatus(app.id, 'accepted')}
                            className="flex-1 flex justify-center items-center px-4 py-2 border border-transparent text-sm font-semibold rounded-lg text-white bg-[#2563EB] hover:bg-[#1D4ED8] transition-colors"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" /> Accetta
                          </button>
                          <button
                            onClick={() => handleUpdateApplicationStatus(app.id, 'rejected')}
                            className="flex-1 flex justify-center items-center px-4 py-2 border border-[#E2E8F0] text-sm font-semibold rounded-lg text-[#64748B] bg-white hover:bg-[#F8FAFC] transition-colors"
                          >
                            <XCircle className="w-4 h-4 mr-2" /> Rifiuta
                          </button>
                        </div>
                      )}
                      
                      {app.status === 'accepted' && (
                        <div className="mt-4 flex items-center gap-3 p-3 bg-[#F0FDF4] border-l-4 border-[#166534] rounded">
                          <div className="text-lg">📩</div>
                          <div>
                            <p className="text-xs font-bold text-[#166534] uppercase">Contatto Sbloccato</p>
                            <p className="text-sm font-medium mt-0.5">{app.workerEmail}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
