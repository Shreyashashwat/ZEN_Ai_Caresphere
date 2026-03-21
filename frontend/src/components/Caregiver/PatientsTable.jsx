import React, { useEffect, useState } from 'react';
import { Eye } from 'lucide-react';
import { getMyPatients } from '../../api';

const PatientsTable = ({ onPatientSelect }) => {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchPatients = async () => {
        try {
            const res = await getMyPatients();
            // Transform data structure to match expected format if needed
            // For now assuming getMyPatients returns basic info. 
            // Mocking compliance data since we don't have that endpoint yet.
            const realPatients = (res.data.data || []).map(p => ({
                ...p,
                status: Math.random() > 0.5 ? 'Taken' : 'Pending', // Mock status
                adherence: Math.floor(Math.random() * (100 - 70) + 70) // Mock adherence
            }));

            setPatients(realPatients);
        } catch (error) {
            console.error("Failed to fetch patients", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPatients();
    }, []);

    const getStatusColor = (status) => {
        switch (status) {
            case 'Taken': return 'bg-green-100 text-green-700';
            case 'Missed': return 'bg-red-100 text-red-700';
            case 'Pending': return 'bg-yellow-100 text-yellow-700';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    const getAdherenceColor = (rate) => {
        if (rate >= 90) return 'text-green-600';
        if (rate >= 80) return 'text-yellow-600';
        return 'text-red-600';
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-800">My Patients</h3>
                <button className="text-sm text-blue-600 font-semibold hover:text-blue-700 cursor-pointer">View All</button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            <th className="px-6 py-4">Patient Name</th>
                            <th className="px-6 py-4">Age/Gender</th>
                            <th className="px-6 py-4">Status (Today)</th>
                            <th className="px-6 py-4">Adherence</th>
                            <th className="px-6 py-4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading && (
                            <tr>
                                <td colSpan="5" className="px-6 py-8 text-center text-slate-500">Loading data...</td>
                            </tr>
                        )}
                        {!loading && patients.length === 0 && (
                            <tr>
                                <td colSpan="5" className="px-6 py-8 text-center text-slate-500">No patients assigned yet.</td>
                            </tr>
                        )}
                        {patients.map((patient) => (
                            <tr key={patient.linkId} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs mr-3">
                                            {patient.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <span className="font-medium text-slate-800">{patient.name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-slate-600 text-sm">{patient.age} / {patient.gender}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(patient.status)}`}>
                                        {patient.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center">
                                        <div className="w-16 bg-slate-200 rounded-full h-1.5 mr-2">
                                            <div
                                                className={`h-1.5 rounded-full ${patient.adherence >= 90 ? 'bg-green-500' : patient.adherence >= 80 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                                style={{ width: `${patient.adherence}%` }}
                                            ></div>
                                        </div>
                                        <span className={`text-xs font-bold ${getAdherenceColor(patient.adherence)}`}>{patient.adherence}%</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => onPatientSelect(patient)}
                                        className="inline-flex items-center px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200 transition-all cursor-pointer"
                                    >
                                        <Eye size={14} className="mr-1.5" />
                                        Details
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PatientsTable;
