import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, User as UserIcon, Briefcase } from 'lucide-react';
import { NotificationsPopover } from './NotificationsPopover';

export function Navbar() {
  const { currentUser, userData, logout } = useAuth();

  return (
    <nav className="bg-white border-b border-[#E2E8F0] shrink-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <div className="w-8 h-8 bg-[#2563EB] rounded flex items-center justify-center text-white font-bold"><Briefcase className="h-5 w-5" /></div>
              <span className="ml-2 text-xl font-bold tracking-tight text-[#0F172A]">MultiServizi Jobs</span>
            </Link>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            {currentUser && userData ? (
              <>
                <NotificationsPopover />
                <div className="flex items-center space-x-4">
                  {userData.role === 'admin' && (
                    <Link to="/admin-dashboard" className="text-sm font-bold text-[#2563EB] hover:underline mr-2 hidden sm:block">
                      Admin Panel
                    </Link>
                  )}
                  <span className="text-sm text-[#64748B] flex items-center font-medium hidden sm:flex">
                    <UserIcon className="h-4 w-4 mr-1" />
                    {userData.name} ({userData.role === 'worker' ? 'Operatore' : userData.role === 'company' ? 'Azienda' : 'Admin'})
                  </span>
                  <button
                    onClick={logout}
                    className="inline-flex items-center px-3 py-2 border border-[#E2E8F0] text-sm leading-4 font-medium rounded-lg text-[#64748B] bg-white hover:bg-[#F8FAFC] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2563EB]"
                  >
                    <LogOut className="h-4 w-4 sm:mr-1" />
                    <span className="hidden sm:inline">Esci</span>
                  </button>
                </div>
              </>
            ) : currentUser && !userData ? (
              <button
                  onClick={logout}
                  className="inline-flex items-center px-3 py-2 border border-[#E2E8F0] text-sm leading-4 font-medium rounded-lg text-[#64748B] bg-white hover:bg-[#F8FAFC] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2563EB]"
                >
                  <LogOut className="h-4 w-4 sm:mr-1" />
                  <span className="hidden sm:inline">Esci</span>
                </button>
            ) : null}
          </div>
        </div>
      </div>
    </nav>
  );
}
