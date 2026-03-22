import React, { useEffect, useState } from 'react';
import { Search, Plus, MoreVertical, Phone, MapPin, Calendar, User as UserIcon } from 'lucide-react';
import { getMyPatients } from '../../api';

const PatientsView = ({ onPatientSelect }) => {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchPatients = async () => {
        try {
            const res = await getMyPatients();
            setPatients(res.data.data || []);
        } catch (error) {
            console.error("Failed to fetch patients", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPatients();
    }, []);

    return (
        <div className="space-y-6">
            {/* Header Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search patients by name or email..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 transition-all text-slate-700"
                    />
                </div>
                <button className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors shadow-sm cursor-pointer opacity-50 cursor-not-allowed" title="Ask patient to invite you">
                    <Plus size={20} />
                    <span>Link New Patient</span>
                </button>
            </div>

            {/* Patients Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {loading && <p className="col-span-full text-center text-slate-500 py-10">Loading patients...</p>}

                {!loading && patients.length === 0 && (
                    <div className="col-span-full text-center py-10 bg-white rounded-2xl border border-dashed border-slate-200">
                        <p className="text-slate-500">No patients assigned yet.</p>
                        <p className="text-sm text-slate-400 mt-1">Ask your patient to invite you via their dashboard.</p>
                    </div>
                )}

                {patients.map((patient) => (
                    <div key={patient.linkId} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-600 flex items-center justify-center text-xl font-bold shadow-inner">
                                        {patient.name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{patient.name}</h3>
                                        <p className="text-sm text-slate-500">{patient.email}</p>
                                    </div>
                                </div>
                                <button className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50">
                                    <MoreVertical size={20} />
                                </button>
                            </div>

                            <div className="space-y-3 pt-2">
                                <div className="flex items-center text-sm text-slate-600">
                                    <UserIcon size={16} className="mr-3 text-slate-400" />
                                    {patient.age} Years • {patient.gender}
                                </div>
                                <div className="flex items-center text-sm text-slate-600">
                                    <Phone size={16} className="mr-3 text-slate-400" />
                                    {/* Placeholder for phone as it's not in user model yet */}
                                    --
                                </div>
                                <div className="flex items-center text-sm text-slate-600">
                                    <MapPin size={16} className="mr-3 text-slate-400" />
                                    {/* Placeholder for address */}
                                    --
                                </div>
                            </div>

                            <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700`}>
                                    Active
                                </span>
                                <button
                                    onClick={() => onPatientSelect(patient)}
                                    className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                                >
                                    View Profile
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PatientsView;
