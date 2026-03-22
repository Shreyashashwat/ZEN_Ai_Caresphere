import React, { useState } from 'react';
import AlertsView from '../components/Caregiver/AlertsView';
import PatientsView from '../components/Caregiver/PatientsView';
import PatientDetailModal from '../components/Caregiver/PatientDetailModal';

const CaregiverDashboard = () => {
    const [selectedPatient, setSelectedPatient] = useState(null);

    return (
        <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto space-y-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Caregiver Dashboard</h1>
                    <p className="mt-2 text-slate-600">Overview of your patients and notifications.</p>
                </div>

                <AlertsView />

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                    <h2 className="text-xl font-bold text-slate-800 mb-6">My Patients</h2>
                    <PatientsView onPatientSelect={setSelectedPatient} />
                </div>
            </div>

            {selectedPatient && (
                <PatientDetailModal
                    patient={selectedPatient}
                    onClose={() => setSelectedPatient(null)}
                />
            )}
        </div>
    );
};

export default CaregiverDashboard;
