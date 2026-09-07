import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, updateDoc, collection, query, getDocs, addDoc, where, getDoc } from 'firebase/firestore';
import { OperationType, Job, Application } from '../types';
import { handleFirestoreError } from '../utils';
import { CheckCircle, Clock, MapPin, Briefcase } from 'lucide-react';

const DAYS = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];

export function WorkerDashboard() {
  const { userData, currentUser } = useAuth();
  const [availabilities, setAvailabilities] = useState<string[]>(userData?.availabilities || []);
  const [location, setLocation] = useState<string>(userData?.location || '');
  const [hourlyRate, setHourlyRate] = useState<number | ''>(userData?.hourlyRate || '');
  const [cvName, setCvName] = useState<string>(userData?.cvName || '');
  const [cvData, setCvData] = useState<string>(userData?.cvData || '');
  const [cvType, setCvType] = useState<string>(userData?.cvType || '');
  const [isSaving, setIsSaving] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<(Application & { jobTitle?: string, jobLocation?: string })[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);

  useEffect(() => {
    if (userData) {
      if (userData.availabilities) setAvailabilities(userData.availabilities);
      if (userData.location) setLocation(userData.location);
      if (userData.hourlyRate) setHourlyRate(userData.hourlyRate);
      if (userData.cvName) setCvName(userData.cvName);
      if (userData.cvData) setCvData(userData.cvData);
      if (userData.cvType) setCvType(userData.cvType);
    }
  }, [userData]);

  useEffect(() => {
    async function fetchJobsAndApplications() {
      if (!currentUser) return;
      try {
        const jobsQuery = query(collection(db, 'jobs'), where('status', '==', 'open'));
        const jobsSnapshot = await getDocs(jobsQuery);
        const jobsList = jobsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));
        setJobs(jobsList);

        const appsQuery = query(collection(db, 'applications'), where('workerId', '==', currentUser.uid));
        const appsSnapshot = await getDocs(appsQuery);
        const appsList = await Promise.all(appsSnapshot.docs.map(async (docSnap) => {
          const appData = docSnap.data() as Application;
          let jobTitle = 'Annuncio non disponibile';
          let jobLocation = '';
          try {
            // First check if it's already in our fetched open jobs
            const existingJob = jobsList.find(j => j.id === appData.jobId);
            if (existingJob) {
              jobTitle = existingJob.title;
              jobLocation = existingJob.location;
            } else {
              // Otherwise fetch it directly (it might be closed)
              const jobSnap = await getDoc(doc(db, 'jobs', appData.jobId));
              if (jobSnap.exists()) {
                const jobData = jobSnap.data() as Job;
                jobTitle = jobData.title;
                jobLocation = jobData.location;
              }
            }
          } catch(e) {
            console.error("Error fetching job for application", e);
          }
          return { id: docSnap.id, ...appData, jobTitle, jobLocation };
        }));
        setApplications(appsList);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'jobs/applications');
      } finally {
        setLoadingJobs(false);
      }
    }
    fetchJobsAndApplications();
  }, [currentUser]);

  const [compatibleJobs, setCompatibleJobs] = useState<Job[]>([]);
  const [otherJobs, setOtherJobs] = useState<Job[]>([]);

  useEffect(() => {
    const compatible = jobs.filter(job => 
      job.requiredAvailabilities && 
      job.requiredAvailabilities.length > 0 &&
      job.requiredAvailabilities.some(req => availabilities.includes(req))
    );
    const other = jobs.filter(job => 
      !job.requiredAvailabilities || 
      job.requiredAvailabilities.length === 0 ||
      !job.requiredAvailabilities.some(req => availabilities.includes(req))
    );
    setCompatibleJobs(compatible);
    setOtherJobs(other);
  }, [jobs, availabilities]);

  const handleSaveProfile = async () => {
    if (!currentUser) return;
    setIsSaving(true);
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const updateData: any = {
        availabilities,
        updatedAt: Date.now()
      };
      if (location.trim()) updateData.location = location.trim();
      if (typeof hourlyRate === 'number' && hourlyRate >= 0) updateData.hourlyRate = hourlyRate;
      if (cvData) {
        updateData.cvData = cvData;
        updateData.cvName = cvName;
        updateData.cvType = cvType;
      }

      await updateDoc(userRef, updateData);
      alert('Profilo salvato con successo!');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${currentUser.uid}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 700 * 1024) {
      alert("Il file è troppo grande. Dimensione massima 700KB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setCvData(result);
      setCvName(file.name);
      setCvType(file.type);
    };
    reader.readAsDataURL(file);
  };

  const toggleAvailability = (day: string, shift: 'Mattina' | 'Pomeriggio' | 'Sera') => {
    const value = `${day} - ${shift}`;
    if (availabilities.includes(value)) {
      setAvailabilities(availabilities.filter(a => a !== value));
    } else {
      setAvailabilities([...availabilities, value]);
    }
  };

  const applyForJob = async (job: Job) => {
    if (!currentUser) return;
    try {
      const newApp = {
        jobId: job.id,
        workerId: currentUser.uid,
        companyId: job.companyId,
        status: 'pending',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      const docRef = await addDoc(collection(db, 'applications'), newApp);
      setApplications([...applications, { id: docRef.id, ...newApp, jobTitle: job.title, jobLocation: job.location } as (Application & { jobTitle?: string, jobLocation?: string })]);
      
      // Notify the company
      try {
        await addDoc(collection(db, 'notifications'), {
          userId: job.companyId,
          message: `Hai ricevuto una nuova candidatura per l'annuncio "${job.title}".`,
          read: false,
          createdAt: Date.now()
        });
      } catch (notifError) {
        console.error("Failed to create notification", notifError);
      }
      
      alert('Candidatura inviata!');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'applications');
    }
  };

  const hasApplied = (jobId: string) => applications.some(app => app.jobId === jobId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-[#0F172A] mb-8">Area Operatore</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white border border-[#E2E8F0] shadow-sm sm:rounded-xl p-6">
            <h2 className="text-xl font-bold text-[#0F172A] mb-4 flex items-center">
              <Clock className="h-5 w-5 mr-2 text-[#2563EB]" />
              Le tue disponibilità
            </h2>
            <p className="text-sm text-[#64748B] mb-4">Seleziona i turni in cui sei disponibile a lavorare. Le aziende vedranno il tuo profilo se corrisponde alle loro esigenze.</p>
            
            <div className="space-y-4">
              <div className="mb-6">
                <label className="block text-sm font-bold text-[#1E293B] mb-1">Città / Zona di lavoro</label>
                <input
                  type="text"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  className="block w-full rounded-lg border-[#E2E8F0] bg-[#F8FAFC] shadow-sm focus:border-[#2563EB] focus:ring-[#2563EB] sm:text-sm py-2 px-3 border transition-colors"
                  placeholder="es. Milano, Roma..."
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-bold text-[#1E293B] mb-1">Tariffa oraria desiderata (€)</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={hourlyRate}
                  onChange={e => setHourlyRate(e.target.value ? parseFloat(e.target.value) : '')}
                  className="block w-full rounded-lg border-[#E2E8F0] bg-[#F8FAFC] shadow-sm focus:border-[#2563EB] focus:ring-[#2563EB] sm:text-sm py-2 px-3 border transition-colors"
                  placeholder="es. 10"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-bold text-[#1E293B] mb-1">Curriculum Vitae (PDF o Immagine)</label>
                <input
                  type="file"
                  accept=".pdf,image/*"
                  onChange={handleCvUpload}
                  className="block w-full text-sm text-[#64748B] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[#EFF6FF] file:text-[#2563EB] hover:file:bg-[#DBEAFE] transition-colors"
                />
                {cvName && <p className="mt-2 text-xs text-[#2563EB] font-medium break-all">Caricato: {cvName}</p>}
                <p className="mt-1 text-xs text-[#94A3B8]">Dimensione massima: 700KB</p>
              </div>

              {DAYS.map(day => (
                <div key={day} className="border-b border-[#F1F5F9] pb-4 last:border-0">
                  <span className="block text-sm font-bold text-[#1E293B] mb-2">{day}</span>
                  <div className="flex flex-wrap gap-2">
                    {['Mattina', 'Pomeriggio', 'Sera'].map(shift => {
                      const value = `${day} - ${shift}`;
                      const isSelected = availabilities.includes(value);
                      return (
                        <button
                          key={shift}
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
            
            <button
              onClick={handleSaveProfile}
              disabled={isSaving}
              className="mt-6 w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-semibold rounded-lg shadow-sm text-white bg-[#2563EB] hover:bg-[#1D4ED8] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2563EB] disabled:opacity-50"
            >
              {isSaving ? 'Salvataggio...' : 'Salva Profilo'}
            </button>
          </div>

          <div className="bg-white border border-[#E2E8F0] shadow-sm sm:rounded-xl p-6 mt-8">
            <h2 className="text-xl font-bold text-[#0F172A] mb-4 flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-[#2563EB]" />
              Le tue candidature
            </h2>
            {loadingJobs ? (
              <p className="text-sm text-[#64748B] font-medium">Caricamento...</p>
            ) : applications.length === 0 ? (
              <p className="text-sm text-[#64748B] font-medium">Non hai ancora inviato candidature.</p>
            ) : (
              <div className="space-y-4">
                {applications.map(app => (
                  <div key={app.id} className="border-b border-[#F1F5F9] pb-4 last:border-0 last:pb-0">
                    <h3 className="text-sm font-bold text-[#0F172A] leading-tight">{app.jobTitle}</h3>
                    <p className="text-xs text-[#64748B] mt-1 mb-2">{app.jobLocation}</p>
                    <span className={`inline-flex px-2 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                      app.status === 'pending' ? 'bg-[#FEF3C7] text-[#92400E]' :
                      app.status === 'accepted' ? 'bg-[#DCFCE7] text-[#166534]' :
                      'bg-[#FEE2E2] text-[#991B1B]'
                    }`}>
                      {app.status === 'pending' ? 'IN ATTESA' : app.status === 'accepted' ? 'ACCETTATA' : 'RIFIUTATA'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-8">
          {compatibleJobs.length > 0 && (
            <div className="bg-white border border-[#2563EB] shadow-sm sm:rounded-xl p-6 ring-1 ring-[#2563EB] ring-opacity-20">
              <h2 className="text-xl font-bold text-[#0F172A] mb-4 flex items-center">
                <CheckCircle className="h-5 w-5 mr-2 text-[#2563EB]" />
                Annunci compatibili con te
              </h2>
              <div className="space-y-4">
                {compatibleJobs.map(job => (
                  <JobCard key={job.id} job={job} hasApplied={hasApplied(job.id)} onApply={() => applyForJob(job)} />
                ))}
              </div>
            </div>
          )}

          <div className="bg-white border border-[#E2E8F0] shadow-sm sm:rounded-xl p-6">
            <h2 className="text-xl font-bold text-[#0F172A] mb-4 flex items-center">
              <Briefcase className="h-5 w-5 mr-2 text-[#64748B]" />
              {compatibleJobs.length > 0 ? 'Altri annunci' : 'Tutti gli annunci'}
            </h2>
            
            {loadingJobs ? (
              <p className="text-[#64748B] text-sm font-medium">Caricamento annunci...</p>
            ) : otherJobs.length === 0 ? (
              <p className="text-[#64748B] text-sm font-medium">Nessun annuncio disponibile al momento.</p>
            ) : (
              <div className="space-y-4">
                {otherJobs.map(job => (
                  <JobCard key={job.id} job={job} hasApplied={hasApplied(job.id)} onApply={() => applyForJob(job)} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function JobCard({ job, hasApplied, onApply }: { job: Job, hasApplied: boolean, onApply: () => void }) {
  return (
    <div className="border border-[#E2E8F0] bg-[#F8FAFC] rounded-xl p-5 hover:border-[#2563EB] transition-all">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-bold text-[#0F172A]">{job.title}</h3>
          <p className="text-sm text-[#64748B] flex items-center mt-1">
            <MapPin className="h-4 w-4 mr-1" />
            {job.location}
          </p>
        </div>
        {hasApplied ? (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-[#DCFCE7] text-[#166534]">
            <CheckCircle className="w-3 h-3 mr-1" /> Candidato
          </span>
        ) : (
          <button
            onClick={onApply}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-semibold rounded-lg text-white bg-[#2563EB] hover:bg-[#1D4ED8] transition-colors"
          >
            Candidati
          </button>
        )}
      </div>
      <p className="mt-3 text-sm text-[#475569]">{job.description}</p>
      {job.requiredAvailabilities && job.requiredAvailabilities.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          <span className="text-[10px] font-bold text-[#64748B] uppercase w-full mb-1">Richieste azienda:</span>
          {job.requiredAvailabilities.map((avail, idx) => (
            <span key={idx} className="inline-block bg-[#F1F5F9] text-[#475569] text-[10px] font-bold px-2 py-0.5 rounded">
              {avail}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
