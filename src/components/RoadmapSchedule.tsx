import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Roadmap, RoadmapPhase, DaySchedule, Schedule } from '../types';
import { COLORS } from './Common';
import { supabase } from '../lib/supabase';

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDateISO(d: Date) { return d.toISOString().slice(0,10); }

function formatDateDisplay(dateStr: string) {
  const [year, month, day] = dateStr.split('-');
  return `${day}-${month}-${year}`;
}

function parseWeekRange(weeks: string) {
  const s = weeks.replace(/Weeks?/i, '').trim();
  if (s.includes('+')) {
    const n = Number(s.replace('+','').replace(/[^\d]/g,'')) || 1;
    return [n, n + 3];
  }
  if (s.includes('-')) {
    const [a,b] = s.split('-').map(x => Number(x.replace(/[^\d]/g,'')));
    return [a||1, b||a||1];
  }
  const n = Number(s.replace(/[^\d]/g,'')) || 1;
  return [n, n];
}

export default function RoadmapSchedule({ roadmap, startDate, hoursPerDay, userId, onChangeStart, onToggleComplete }: { roadmap: Roadmap; startDate: string; hoursPerDay?: string; userId?: string | null; onChangeStart?: (d:number)=>void; onToggleComplete?: (date:string, completed:boolean, award?:number)=>void }) {
  const start = new Date(startDate + 'T00:00:00');
  const [localPhases, setLocalPhases] = useState<RoadmapPhase[]>(roadmap.phases);
  useEffect(()=> setLocalPhases(roadmap.phases), [roadmap.phases]);
  const [schedule, setSchedule] = useState<DaySchedule[] | null>(null);
  const [editing, setEditing] = useState<Record<string, boolean>>({});
  const [undoStack, setUndoStack] = useState<DaySchedule[][]>([]);
  const [redoStack, setRedoStack] = useState<DaySchedule[][]>([]);
  const ganttRef = useRef<HTMLDivElement|null>(null);
  const dragState = useRef<{ active: boolean; startX:number; origDate: string | null }>({ active:false, startX:0, origDate:null });
  const phaseDragRef = useRef<{ active: boolean; idx: number | null; mode: 'move'|'resize-left'|'resize-right' | null; startX:number; origStart:number; origEnd:number }>({ active:false, idx:null, mode:null, startX:0, origStart:0, origEnd:0 });
  const prevPhasesRef = useRef<RoadmapPhase[] | null>(null);
  const PHASE_COLORS = [COLORS.purple600, COLORS.mint, COLORS.gold, COLORS.pink, COLORS.purple400, COLORS.yellow];

  // Build weeks array for all phases (editable localPhases)
  const weeks: { weekNum: number; dateStart: Date; dateEnd: Date; phase?: RoadmapPhase }[] = [];
  let maxWeek = 0;
  localPhases.forEach(p => {
    const [s,e] = parseWeekRange(p.weeks);
    if (e > maxWeek) maxWeek = e;
  });

  for (let w = 1; w <= Math.max(1, maxWeek); w++) {
    const ws = addDays(start, (w-1)*7);
    const we = addDays(ws, 6);
    weeks.push({ weekNum: w, dateStart: ws, dateEnd: we });
  }

  // Map phases into week boundaries
  const phaseMap: Record<number, RoadmapPhase | undefined> = {};
  localPhases.forEach(p => {
    const [s,e] = parseWeekRange(p.weeks);
    for (let w = s; w <= e; w++) phaseMap[w] = p;
  });

  // Build flat days array across all weeks
  const days = useMemo(() => {
    const arr: DaySchedule[] = [];
    const taskPatterns = [
      (topic: string, dayOfWeek: number) => `Learn: ${topic}`,
      (topic: string, dayOfWeek: number) => `Practice: ${topic} exercises`,
      (topic: string, dayOfWeek: number) => `Code: Implement ${topic}`,
      (topic: string, dayOfWeek: number) => `Quiz: Test your ${topic} knowledge`,
      (topic: string, dayOfWeek: number) => `Review: ${topic} concepts`,
      (topic: string, dayOfWeek: number) => `Project: Apply ${topic} to real problem`,
      (topic: string, dayOfWeek: number) => `Debug: Fix ${topic} code`,
    ];
    
    weeks.forEach(w => {
      for (let i=0;i<7;i++) {
        const d = addDays(w.dateStart, i);
        const phase = phaseMap[w.weekNum];
        const topics = phase ? phase.topics.split(',').map(s=>s.trim()) : ['Practice review'];
        const topicIdx = i % topics.length;
        const topic = topics[topicIdx] || topics[0];
        const taskPattern = taskPatterns[i % taskPatterns.length];
        const taskText = taskPattern(topic, i);
        arr.push({ date: formatDateISO(d), task: taskText, duration_hours: Number(hoursPerDay) || 0.5 });
      }
    });
    return arr;
  }, [weeks.map(w=>w.weekNum).join(','), startDate, localPhases.map(p=>p.topics).join('|'), hoursPerDay]);

  // load saved schedule for user if present
  useEffect(()=>{
    let cancelled = false;
    (async ()=>{
      if (!userId) {
        setSchedule(days);
        return;
      }
      try {
        const { data, error } = await supabase.from('users').select('schedule').eq('id', userId).single();
        if (error || !data) {
          setSchedule(days);
          return;
        }
        const saved: Schedule | null = data?.schedule || null;
        if (saved && Array.isArray(saved.days)) {
          setSchedule(saved.days as DaySchedule[]);
        } else {
          setSchedule(days);
        }
      } catch (e) {
        setSchedule(days);
      }
    })();
    return ()=>{ cancelled = true; };
  }, [userId, JSON.stringify(days)]);

  // handlers for editing and persisting
  const [versions, setVersions] = useState<any[]>([]);
  const [showVersions, setShowVersions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const loadVersions = async ()=>{
    if (!userId) return;
    try {
      const { data, error } = await supabase.from('users').select('history').eq('id', userId).single();
      if (!error && data && Array.isArray(data.history)) setVersions(data.history as any[]);
      if (error) console.warn('loadVersions error', error.message || error);
    } catch (e) {}
  };

  const saveToServer = async (daysArr: DaySchedule[])=>{
    if (!userId) return;
    setSaving(true);
    setSaveError(null);
    try {
      // create version entry
      const when = new Date().toISOString();
      const snapshot = { when, schedule: { startDate, days: daysArr }, note: 'user edit' };
      // fetch existing history
      const { data, error } = await supabase.from('users').select('history').eq('id', userId).single();
      let historyArr: any[] = [];
      if (!error && data && Array.isArray(data.history)) historyArr = data.history;
      historyArr = [snapshot, ...historyArr].slice(0, 50);
      // update user row with new schedule + history
      const { error: upErr } = await supabase.from('users').update({ schedule: { startDate, days: daysArr }, history: historyArr }).eq('id', userId);
      if (upErr) {
        setSaveError(upErr.message || String(upErr));
        setSaving(false);
        return false;
      }
      setVersions(historyArr);
      setSaving(false);
      return true;
    } catch (e:any) {
      setSaveError(e?.message || String(e));
      setSaving(false);
      return false;
    }
  };

  const handleEdit = (date: string, value: string)=>{
    if (!schedule) return;
    // push to undo
    setUndoStack(s => [...s, schedule.map(d=>({...d}))].slice(-10));
    setRedoStack([]);
    const copy = schedule.map(d => d.date === date ? { ...d, task: value } : d);
    setSchedule(copy);
  };

  const handleSave = async ()=>{
    if (!schedule) return;
    try { localStorage.setItem('edubuddy_schedule', JSON.stringify({ startDate, days: schedule })); } catch {}
    await saveToServer(schedule);
  };

  const undo = ()=>{
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length-1];
    setRedoStack(r=>[...(schedule? [schedule.map(d=>({...d}))] : []), ...r].slice(0,10));
    setUndoStack(u=>u.slice(0,-1));
    setSchedule(prev.map(d=>({...d})));
  };

  const redo = ()=>{
    if (redoStack.length === 0) return;
    const next = redoStack[0];
    setUndoStack(u=>[...(schedule? [schedule.map(d=>({...d}))] : []), ...u].slice(-10));
    setRedoStack(r=>r.slice(1));
    setSchedule(next.map(d=>({...d})));
  };

  const exportCSV = ()=>{
    if (!schedule) return;
    const rows = [['date','task','duration_hours']];
    schedule.forEach(d=> rows.push([d.date, d.task.replace(/"/g,'""'), String(d.duration_hours || '')]));
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'schedule.csv'; a.click(); URL.revokeObjectURL(url);
  };

  const exportICS = ()=>{
    if (!schedule) return;
    const lines = ['BEGIN:VCALENDAR','VERSION:2.0','CALSCALE:GREGORIAN'];
    schedule.forEach(d=>{
      const uid = `${d.date}-${d.task}`.replace(/[^a-z0-9]/gi,'');
      const dt = d.date.replace(/-/g,'') + 'T090000';
      lines.push('BEGIN:VEVENT');
      lines.push(`UID:${uid}`);
      lines.push(`DTSTART:${dt}`);
      lines.push(`SUMMARY:${d.task}`);
      lines.push('END:VEVENT');
    });
    lines.push('END:VCALENDAR');
    const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'schedule.ics'; a.click(); URL.revokeObjectURL(url);
  };

  const handleRevertVersion = async (vIndex:number) => {
    const v = versions[vIndex];
    if (!v || !v.schedule) return;
    // push current to undo
    if (schedule) setUndoStack(s => [...s, schedule.map(d=>({...d}))].slice(-10));
    setSchedule(v.schedule.days.map((d:DaySchedule)=>({...d})));
    // save revert as a new version
    await saveToServer(v.schedule.days as DaySchedule[]);
    setShowVersions(false);
  };

  // simple Gantt drag to shift global start date
  const onMouseDownBar = (e: React.MouseEvent) => {
    dragState.current = { active: true, startX: e.clientX, origDate: startDate };
    window.addEventListener('mousemove', onMouseMoveBar);
    window.addEventListener('mouseup', onMouseUpBar);
  };
  const onMouseMoveBar = (ev: MouseEvent) => {
    if (!dragState.current.active) return;
    const dx = ev.clientX - dragState.current.startX;
    const pixelsPerDay = 12; // arbitrary scale
    const deltaDays = Math.round(dx / pixelsPerDay);
    if (deltaDays === 0) return;
    const orig = new Date(dragState.current.origDate + 'T00:00:00');
    const newDate = addDays(orig, deltaDays);
    if (onChangeStart) onChangeStart( Math.round((newDate.getTime() - orig.getTime()) / (1000*60*60*24)) );
  };
  const onMouseUpBar = () => {
    dragState.current.active = false;
    window.removeEventListener('mousemove', onMouseMoveBar);
    window.removeEventListener('mouseup', onMouseUpBar);
  };

  // Phase drag/resize handlers
  const onPhaseMouseDown = (e: React.MouseEvent, idx: number, mode: 'move'|'resize-left'|'resize-right') => {
    e.stopPropagation();
    const p = localPhases[idx];
    const [s,eWeek] = parseWeekRange(p.weeks);
    prevPhasesRef.current = localPhases.map(p=>({ ...p }));
    phaseDragRef.current = { active:true, idx, mode, startX: e.clientX, origStart: s, origEnd: eWeek };
    window.addEventListener('mousemove', onPhaseMouseMove);
    window.addEventListener('mouseup', onPhaseMouseUp);
  };

  const onPhaseMouseMove = (ev: MouseEvent) => {
    if (!phaseDragRef.current.active || phaseDragRef.current.idx === null) return;
    const container = ganttRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const pixelsPerWeek = rect.width / Math.max(1, maxWeek);
    const dx = ev.clientX - phaseDragRef.current.startX;
    const deltaWeeks = Math.round(dx / pixelsPerWeek);
    const idx = phaseDragRef.current.idx;
    const mode = phaseDragRef.current.mode;
    const origS = phaseDragRef.current.origStart;
    const origE = phaseDragRef.current.origEnd;
    let newS = origS;
    let newE = origE;
    if (mode === 'move') {
      newS = Math.max(1, origS + deltaWeeks);
      newE = Math.max(newS, origE + deltaWeeks);
    } else if (mode === 'resize-left') {
      newS = Math.max(1, origS + deltaWeeks);
      newE = Math.max(newS, origE);
    } else if (mode === 'resize-right') {
      newE = Math.max(origE + deltaWeeks, origS);
    }
    const next = localPhases.map((pp, i)=> i===idx ? { ...pp, weeks: `Weeks ${newS}-${newE}` } : pp );
    setLocalPhases(next);
  };

  const onPhaseMouseUp = async () => {
    if (!phaseDragRef.current.active) return;
    const idx = phaseDragRef.current.idx;
    phaseDragRef.current.active = false;
    phaseDragRef.current.idx = null;
    phaseDragRef.current.mode = null;
    window.removeEventListener('mousemove', onPhaseMouseMove);
    window.removeEventListener('mouseup', onPhaseMouseUp);
    // push to undo and recompute schedule
    if (schedule) setUndoStack(s => [...s, schedule.map(d=>({...d}))].slice(-10));
    setRedoStack([]);
    // recompute days after localPhases change
    setTimeout(()=>{ setSchedule(days); }, 0);
    // if large shift, ask for confirmation
    try {
      if (prevPhasesRef.current && idx !== null) {
        const prev = prevPhasesRef.current[idx];
        const curr = localPhases[idx];
        const [ps,pe] = parseWeekRange(prev.weeks);
        const [cs,ce] = parseWeekRange(curr.weeks);
        if (Math.abs(cs - ps) > 2 || Math.abs(ce - pe) > 2) {
          const ok = window.confirm(`You moved/resized the phase significantly (by ${Math.abs(cs-ps)} weeks). Apply changes?`);
          if (!ok) {
            // revert
            setLocalPhases(prevPhasesRef.current);
            setTimeout(()=> setSchedule(days), 0);
          }
        }
      }
    } finally {
      prevPhasesRef.current = null;
    }
  };

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 900, margin:'0 0 6px 0' }}>Weekly Schedule</h2>
          <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
            <div style={{ fontSize:14, color:COLORS.purple300 }}>
              Daily time: <span style={{ fontWeight:700, color: COLORS.gold }}>{hoursPerDay || '0.5'}h/day</span>
            </div>
            <div style={{ fontSize:14, color:COLORS.purple300 }}>
              Estimated weeks: <span style={{ fontWeight:700, color: COLORS.gold }}>{Math.max(1, maxWeek)}</span>
            </div>
          </div>
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', justifyContent:'flex-end' }}>
          <button onClick={undo} disabled={undoStack.length===0} style={{ background: 'rgba(255,255,255,0.04)', color: 'white', border:'none', padding:'8px 10px', borderRadius:8, cursor: undoStack.length===0 ? 'not-allowed' : 'pointer', opacity: undoStack.length===0 ? 0.5 : 1 }}>Undo</button>
          <button onClick={redo} disabled={redoStack.length===0} style={{ background: 'rgba(255,255,255,0.04)', color: 'white', border:'none', padding:'8px 10px', borderRadius:8, cursor: redoStack.length===0 ? 'not-allowed' : 'pointer', opacity: redoStack.length===0 ? 0.5 : 1 }}>Redo</button>
          <button onClick={()=>{ loadVersions(); setShowVersions(s=>!s); }} style={{ background: 'rgba(255,255,255,0.02)', color: 'white', border:'none', padding:'8px 10px', borderRadius:8, cursor:'pointer' }}>{showVersions ? 'Hide Versions' : 'Versions'}</button>
          <button onClick={handleSave} disabled={saving} style={{ background: COLORS.purple700, color: 'white', border:'none', padding:'8px 10px', borderRadius:8, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>{saving ? 'Saving...' : 'Save'}</button>
          <button onClick={exportCSV} style={{ background: COLORS.purple600, color: 'white', border:'none', padding:'8px 10px', borderRadius:8, cursor:'pointer' }}>Export CSV</button>
          <button onClick={exportICS} style={{ background: COLORS.yellow, color: COLORS.purple900, border:'none', padding:'8px 10px', borderRadius:8, fontWeight:700, cursor:'pointer' }}>Export ICS</button>
        </div>
      </div>

      <div style={{ marginBottom:20 }}>
        <div ref={ganttRef} style={{ height:60, background:'rgba(255,255,255,0.02)', borderRadius:8, position:'relative', padding:12, border:'1px solid rgba(255,255,255,0.06)' }}>
          {localPhases.map((p, idx) => {
            const [s,e] = parseWeekRange(p.weeks);
            const leftPct = ((s-1) / Math.max(1, maxWeek)) * 100;
            const widthPct = ((e - s + 1) / Math.max(1, maxWeek)) * 100;
            const color = PHASE_COLORS[idx % PHASE_COLORS.length];
            return (
              <div key={idx} style={{ position:'absolute', left: `${leftPct}%`, top:12, height:36, width: `${widthPct}%`, background: color, borderRadius:6, cursor:'grab', display:'flex', alignItems:'center', justifyContent:'center', color:'white', padding:'4px', boxShadow: '0 2px 6px rgba(0,0,0,0.3)', fontSize:11, fontWeight:700 }} onMouseDown={(e)=>onPhaseMouseDown(e, idx, 'move')}>
                <div style={{ position:'absolute', left:0, top:0, bottom:0, width:6, cursor:'ew-resize' }} onMouseDown={(e)=>onPhaseMouseDown(e, idx, 'resize-left')} />
                <div style={{ pointerEvents:'none', textAlign:'center' }}>{p.phase}</div>
                <div style={{ position:'absolute', right:0, top:0, bottom:0, width:6, cursor:'ew-resize' }} onMouseDown={(e)=>onPhaseMouseDown(e, idx, 'resize-right')} />
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
        {weeks.map((w) => {
          const weekDays = (schedule || days).filter(d => {
            const d_date = new Date(d.date+'T00:00:00');
            return d_date >= w.dateStart && d_date <= w.dateEnd;
          });
          const dayOfWeekNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          
          return (
            <div key={w.weekNum} style={{ background:'rgba(255,255,255,0.02)', borderRadius:12, padding:16, border:'1px solid rgba(255,255,255,0.08)' }}>
              <h3 style={{ fontSize:18, fontWeight:900, color:'white', margin:'0 0 16px 0' }}>Week {w.weekNum}</h3>
              <div style={{ display:'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap:12 }}>
                {weekDays.map(d => {
                  const dateObj = new Date(d.date+'T00:00:00');
                  const dayName = dayOfWeekNames[dateObj.getDay()];
                  const dateStr = formatDateDisplay(d.date);
                  
                  return (
                    <div key={d.date} style={{ background:'rgba(255,255,255,0.04)', padding:14, borderRadius:8, border:'1px solid rgba(255,255,255,0.08)', display:'flex', flexDirection:'column', height:'100%' }}>
                      <div style={{ marginBottom:12 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                          <div style={{ fontSize:14, fontWeight:800, color:'white' }}>{dayName}</div>
                          <div style={{ fontSize:12, color: COLORS.gold, fontWeight:700 }}>{(d.duration_hours||0.5)}h</div>
                        </div>
                        <div style={{ fontSize:12, color: COLORS.purple300 }}>{dateStr}</div>
                      </div>
                      <div style={{ flex:1, marginBottom:12, minHeight:50 }}>
                        {editing[d.date] ? (
                          <div>
                            <textarea autoFocus value={d.task} onChange={e=>handleEdit(d.date, e.target.value)} style={{ width:'100%', height:60, background:'rgba(255,255,255,0.05)', color:'white', borderRadius:6, padding:'8px', border:'1px solid rgba(255,255,255,0.1)', fontFamily:"'Nunito', sans-serif", fontSize:12, resize:'none', boxSizing:'border-box' }} />
                          </div>
                        ) : (
                          <div style={{ color: COLORS.purple200, fontSize:13, lineHeight:1.5, wordWrap:'break-word' }}>{d.task}</div>
                        )}
                      </div>
                      <div style={{ display:'flex', gap:6, alignItems:'center', flexWrap:'wrap' }}>
                        <label style={{ display:'inline-flex', alignItems:'center', gap:3, cursor:'pointer', fontSize:12 }}>
                          <input type='checkbox' onChange={e=>{ onToggleComplete && onToggleComplete(d.date, e.target.checked, Math.round((Number(d.duration_hours||0.5)*10))); }} style={{ cursor:'pointer', width:14, height:14 }} />
                          <span style={{ color:COLORS.purple300 }}>Done</span>
                        </label>
                        {editing[d.date] ? (
                          <>
                            <button onClick={()=>{ setEditing(prev=>({...prev,[d.date]:false})); handleSave(); }} style={{ background:COLORS.yellow, color:COLORS.purple900, border:'none', padding:'4px 8px', borderRadius:4, fontSize:11, fontWeight:700, cursor:'pointer' }}>Save</button>
                            <button onClick={()=>{ setEditing(prev=>({...prev,[d.date]:false})); }} style={{ background:'rgba(255,255,255,0.04)', color:'white', border:'none', padding:'4px 8px', borderRadius:4, fontSize:11, cursor:'pointer' }}>Cancel</button>
                          </>
                        ) : (
                          <button onClick={()=>setEditing(prev=>({...prev,[d.date]:true}))} style={{ background:'rgba(255,255,255,0.02)', color:'white', border:'1px solid rgba(255,255,255,0.1)', padding:'4px 8px', borderRadius:4, fontSize:11, cursor:'pointer' }}>Edit</button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      {showVersions && (
        <div style={{ marginTop:20, background:'rgba(255,255,255,0.02)', padding:12, borderRadius:8, border:'1px solid rgba(255,255,255,0.06)' }}>
          <h3 style={{ margin:'0 0 12px 0', fontSize:14, fontWeight:800 }}>Version History</h3>
          {versions.length === 0 ? (
            <div style={{ color:COLORS.purple300, fontSize:12 }}>No versions yet.</div>
          ) : (
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {versions.slice(0, 5).map((v, idx) => (
                <div key={v.when} style={{ display:'flex', gap:6, alignItems:'center', background:'rgba(255,255,255,0.03)', padding:'8px 12px', borderRadius:6, fontSize:11 }}>
                  <div style={{ color:COLORS.purple200 }}>{new Date(v.when).toLocaleDateString()}</div>
                  <button onClick={()=>{ setSchedule(v.schedule.days.map((d:DaySchedule)=>({...d}))); }} style={{ background:'rgba(255,255,255,0.05)', color:'white', border:'1px solid rgba(255,255,255,0.1)', padding:'3px 6px', borderRadius:4, fontSize:10, cursor:'pointer' }}>Preview</button>
                  <button onClick={()=>handleRevertVersion(idx)} style={{ background:COLORS.yellow, color:COLORS.purple900, border:'none', padding:'3px 6px', borderRadius:4, fontSize:10, fontWeight:700, cursor:'pointer' }}>Revert</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
