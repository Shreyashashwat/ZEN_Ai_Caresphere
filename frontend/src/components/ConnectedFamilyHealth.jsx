import React, { useState, useEffect } from 'react';
import { Activity, Heart, CheckCircle, XCircle, Clock, Pill } from 'lucide-react';
import { getMyCaregivers, getPatientDetails } from '../api';

// Deterministic avatar gradient per name
const avatarGradients = [
  ['from-violet-400 to-purple-500', 'bg-violet-50 text-violet-700'],
  ['from-rose-400   to-pink-500',   'bg-rose-50   text-rose-700'],
  ['from-amber-400  to-orange-500', 'bg-amber-50  text-amber-700'],
  ['from-teal-400   to-emerald-500','bg-teal-50   text-teal-700'],
  ['from-blue-400   to-indigo-500', 'bg-blue-50   text-blue-700'],
  ['from-fuchsia-400 to-pink-500',  'bg-fuchsia-50 text-fuchsia-700'],
];
const getGrad = (name = '') => avatarGradients[name.charCodeAt(0) % avatarGradients.length];

// Circular progress ring
const Ring = ({ pct, size = 80, stroke = 8, color }) => {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const ringColor = color || (pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444');
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none" stroke={ringColor} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={circ - (circ * pct) / 100}
        strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease' }}
      />
    </svg>
  );
};

// Individual member health card
const MemberHealthCard = ({ member }) => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [grad, pill] = getGrad(member.name || member.email || '');

  useEffect(() => {
    (async () => {
      try {
        const res = await getPatientDetails(member.memberId);
        setReport(res.data.data);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [member.memberId]);

  const { medicines = [], history = [], adherence = 0 } = report || {};
  const taken   = history.filter(h => h.status === 'taken').length;
  const missed  = history.filter(h => h.status === 'missed').length;
  const pending = history.filter(h => h.status === 'pending').length;

  const lastActivity = history.length > 0
    ? new Date([...history].sort((a, b) => new Date(b.time) - new Date(a.time))[0].time)
        .toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className="bg-white rounded-3xl shadow-md hover:shadow-xl border border-gray-100 hover:border-rose-200 transition-all duration-300 hover:-translate-y-1 overflow-hidden">
      {/* Header banner */}
      <div className={`bg-gradient-to-r ${grad} px-6 py-5`}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-md">
            {member.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div>
            <h3 className="text-white font-black text-lg leading-tight">{member.name || 'Family Member'}</h3>
            <p className="text-white/70 text-xs mt-0.5 truncate max-w-[180px]">{member.email}</p>
            <span className="text-[10px] font-black bg-white/20 px-2 py-0.5 rounded-full mt-1 inline-block text-white">
              {member.relationship || 'Family Member'}
            </span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-5">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-rose-100 border-t-rose-500" />
            <p className="text-xs text-gray-400 font-medium">Loading health data…</p>
          </div>
        ) : error ? (
          <div className="text-center py-6">
            <p className="text-sm text-red-400 font-bold">Could not load health data</p>
          </div>
        ) : (
          <>
            {/* Adherence + stats row */}
            <div className="flex items-center gap-4 mb-4">
              <div className="relative flex-shrink-0">
                <Ring pct={adherence} />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg font-black text-gray-800">{adherence}%</span>
                  <span className="text-[9px] text-gray-400 font-bold uppercase leading-none">adherence</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 flex-1">
                {[
                  { label: 'Taken',   val: taken,   bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' },
                  { label: 'Missed',  val: missed,  bg: 'bg-red-50',     text: 'text-red-500',     border: 'border-red-100'    },
                  { label: 'Pending', val: pending, bg: 'bg-amber-50',   text: 'text-amber-500',   border: 'border-amber-100'  },
                ].map(s => (
                  <div key={s.label} className={`${s.bg} border ${s.border} rounded-xl p-2 text-center`}>
                    <p className={`text-lg font-black ${s.text}`}>{s.val}</p>
                    <p className="text-[9px] text-gray-400 font-bold uppercase">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Active medicines */}
            {medicines.length > 0 && (
              <div className="mb-3">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                  Active Medicines ({medicines.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {medicines.slice(0, 4).map(m => (
                    <span key={m._id} className="flex items-center gap-1 text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-1 rounded-xl">
                      💊 {m.medicineName}
                    </span>
                  ))}
                  {medicines.length > 4 && (
                    <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-1 rounded-xl">
                      +{medicines.length - 4} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Footer: last activity + status */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                <Activity size={11} />
                <span>{lastActivity ? `Last: ${lastActivity}` : 'No recent activity'}</span>
              </div>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                adherence >= 80 ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                : adherence >= 50 ? 'bg-amber-50 text-amber-600 border border-amber-200'
                : 'bg-red-50 text-red-500 border border-red-200'
              }`}>
                {adherence >= 80 ? '🟢 Good' : adherence >= 50 ? '🟡 Fair' : '🔴 Low'}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// Main component
const ConnectedFamilyHealth = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await getMyCaregivers();
        const all = res.data.data || [];
        // Only show active members where we are the caregiver (direction=accepted) and memberId exists
        const connected = all.filter(m => m.status === 'Active' && m.direction === 'accepted' && m.memberId);
        setMembers(connected);
      } catch {
        console.error('Failed to load family members');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return (
    <div className="flex justify-center py-10">
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-rose-100 border-t-rose-500" />
    </div>
  );

  if (members.length === 0) return (
    <div className="text-center py-12 bg-rose-50/40 rounded-2xl border-2 border-dashed border-rose-200">
      <Heart className="mx-auto mb-3 text-rose-300" size={36} />
      <p className="font-bold text-rose-500">No connected family members yet</p>
      <p className="text-xs text-gray-400 mt-1">
        When a family member accepts your invite, their health report will appear here.
      </p>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {members.map(m => (
        <MemberHealthCard key={m.id} member={m} />
      ))}
    </div>
  );
};

export default ConnectedFamilyHealth;
