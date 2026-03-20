import React, { useEffect, useState } from 'react';
import { X, Calendar, Pill, Clock, Mail, RefreshCw } from 'lucide-react';
import { getPatientDetails } from '../../api';

const PatientDetailModal = ({ patient, onClose }) => {
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchDetails = async () => {
        try {
            setLoading(true);
            const res = await getPatientDetails(patient.id);
            setDetails(res.data.data);
        } catch (error) {
            console.error("Failed to fetch patient details", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (patient) {
            fetchDetails();
        }
    }, [patient]);

    if (!patient) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fadeIn">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xl uppercase">
                            {patient.name.substring(0, 2)}
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-800">{patient.name}</h3>
                            <p className="text-sm text-slate-500">{patient.age} Years • {patient.gender}</p>
                            <p className="text-xs text-blue-600 flex items-center gap-1 mt-1">
                                <Mail size={12} /> {patient.email}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={fetchDetails} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500 cursor-pointer" title="Refresh Data">
                            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500 cursor-pointer">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {/* Status Section */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Adherence Rate</p>
                            <p className="text-2xl font-bold text-blue-800 mt-1">
                                {loading ? '...' : (details?.adherence || 0)}%
                            </p>
                            <p className="text-xs text-slate-400 mt-1">Last 7 days</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Relationship</p>
                            <p className="text-lg font-bold text-slate-800 mt-1 flex items-center">
                                {patient.relationship || "Caregiver"}
                            </p>
                        </div>
                    </div>

                    {/* Medications */}
                    <div>
                        <h4 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wide flex items-center">
                            <Pill size={16} className="mr-2 text-blue-500" />
                            Current Medications
                        </h4>
                        <div className="space-y-3">
                            {loading && <p className="text-slate-500 text-sm italic">Loading medications...</p>}

                            {!loading && details?.medicines?.length === 0 && (
                                <p className="text-slate-500 text-sm italic py-4 text-center border border-slate-100 rounded-xl bg-slate-50">
                                    No medications assigned yet.
                                </p>
                            )}

                            {!loading && details?.medicines?.map((med) => (
                                <div key={med._id} className="flex items-center justify-between p-3 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-600 flex items-center justify-center">
                                            <Pill size={16} />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-800">{med.medicineName}</p>
                                            <p className="text-xs text-slate-500">{med.dosage} • {med.frequency}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs font-medium bg-blue-50 text-blue-600 px-2 py-1 rounded-md">
                                            {med.time.join(', ')}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recent Activity / History */}
                    <div>
                        <h4 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wide flex items-center">
                            <Clock size={16} className="mr-2 text-orange-500" />
                            Recent Activity
                        </h4>
                        {loading && <p className="text-slate-500 text-sm italic">Loading history...</p>}

                        {!loading && details?.history?.length === 0 && (
                            <div className="text-center p-6 bg-slate-50 rounded-xl border-dashed border-2 border-slate-200">
                                <p className="text-slate-500 text-sm">No recent activity recorded.</p>
                            </div>
                        )}

                        <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                            {!loading && details?.history?.map((record) => (
                                <div key={record._id} className="flex justify-between items-center text-sm p-2 rounded-lg border border-slate-50 hover:bg-slate-50">
                                    <span className="text-slate-600">
                                        {new Date(record.time).toLocaleString()}
                                    </span>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize 
                                        ${record.status === 'taken' ? 'bg-green-100 text-green-700' :
                                            record.status === 'missed' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                        {record.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 rounded-b-2xl">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer">Close</button>
                    <button
                        onClick={() => window.location.href = `mailto:${patient.email}`}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm shadow-blue-200 cursor-pointer"
                    >
                        Contact Patient
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PatientDetailModal;
