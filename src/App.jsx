import { useState, useRef, useEffect } from "react";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ── Firebase config ──────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyCzaWPGMLmuSmRqQIrRCcWwZOBebqFpKME",
  authDomain: "gestion-comercial-42c6d.firebaseapp.com",
  projectId: "gestion-comercial-42c6d",
  storageBucket: "gestion-comercial-42c6d.firebasestorage.app",
  messagingSenderId: "153172278217",
  appId: "1:153172278217:web:a814b00bc9c590e6298618"
};
const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);
const DB_DOC = "data/main";

// ── Estado inicial (primera vez o si no hay datos en Firebase) ───
const INIT_TEAM = [
  { id: 1, name: "David",  zone: "Centro", visits: 4, target: 6, status: "active",    lastUpdate: "Hace 20 min" },
  { id: 2, name: "Roger",  zone: "Norte",  visits: 6, target: 6, status: "completed", lastUpdate: "Hace 1h" },
  { id: 3, name: "Marcos", zone: "Sur",    visits: 2, target: 6, status: "warning",   lastUpdate: "Hace 3h" },
  { id: 4, name: "Carles", zone: "Este",   visits: 5, target: 6, status: "active",    lastUpdate: "Hace 45 min" },
  { id: 5, name: "Oriol",  zone: "Oeste",  visits: 3, target: 6, status: "active",    lastUpdate: "Hace 1h" },
];
const INIT_OPPS = [
  { id: 1, name: "Bar El Rincón",     type: "Nuevo cliente", value: "Alto",  agent: "David",  status: "pending",  notes: "Interesado en lager y IPA" },
  { id: 2, name: "Restaurante Bravo", type: "Ampliación",    value: "Medio", agent: "Roger", status: "followup", notes: "Quiere añadir cervezas artesanas" },
  { id: 3, name: "Hotel Mirador",     type: "Nuevo cliente", value: "Alto",  agent: "Carles",   status: "pending",  notes: "Evento de verano, 200 barriles" },
  { id: 4, name: "Terraza Sunset",    type: "Recuperación",  value: "Medio", agent: "Marcos",    status: "lost",     notes: "Se fue a competencia, posible vuelta" },
];
const INIT_TASKS = [
  { id: 1, text: "Revisar rutas de la semana",                    done: false, priority: "high",   agent: "Equipo" },
  { id: 2, text: "Llamar a Hotel Mirador para confirmar pedido",  done: false, priority: "high",   agent: "Carles" },
  { id: 3, text: "Enviar catálogo de verano a prospectos",        done: true,  priority: "medium", agent: "Equipo" },
  { id: 4, text: "Reunión semanal — viernes 10h",                 done: false, priority: "medium", agent: "Equipo" },
  { id: 5, text: "Seguimiento Bar El Rincón",                     done: false, priority: "low",    agent: "David" },
];
const INIT_HOLIDAYS = [
  { id: 1, person: "Yo (Jefe)",    start: "2026-07-01", end: "2026-07-14", label: "Vacaciones verano" },
  { id: 2, person: "David",  start: "2026-08-01", end: "2026-08-15", label: "Vacaciones agosto" },
  { id: 3, person: "Roger", start: "2026-07-15", end: "2026-07-28", label: "Vacaciones verano" },
  { id: 4, person: "Marcos",    start: "2026-06-15", end: "2026-06-22", label: "Vacaciones junio" },
  { id: 5, person: "Carles",   start: "2026-08-16", end: "2026-08-31", label: "Vacaciones agosto" },
];
const INIT_EVENTS = [
  { id: 1, date: "2026-04-15", title: "Feria Hostelería Madrid",   type: "feria",      notes: "Stand B12. Llevar catálogo nuevo y muestras de la gama artesana. Contacto: Pepe Martínez 612345678.", attendees: "Yo (Jefe), David" },
  { id: 2, date: "2026-05-10", title: "Lanzamiento IPA Verano",    type: "lanzamiento",notes: "Presentación de la nueva IPA en el almacén. Invitar a los 20 mejores clientes. Catering incluido.", attendees: "Todo el equipo" },
  { id: 3, date: "2026-06-01", title: "Reunión distribuidores",    type: "reunion",    notes: "Negociación precios temporada alta. Revisar márgenes antes. Traer datos de ventas Q1.", attendees: "Yo (Jefe)" },
  { id: 4, date: "2026-09-05", title: "Inicio temporada otoño",    type: "temporada",  notes: "Arranque de campaña otoño-invierno. Nuevas rutas y objetivos de visitas. Reunión de equipo 9h.", attendees: "Todo el equipo" },
];

const TEAM_NAMES   = ["Yo (Jefe)", "David", "Roger", "Marcos", "Carles", "Oriol"];
const TEAM_COLORS  = { "Yo (Jefe)":"#f5c87a", "David":"#4ade80", "Roger":"#60a5fa", "Marcos":"#fb923c", "Carles":"#e879f9", "Oriol":"#34d399" };
const EVENT_TYPES  = {
  feria:      { color:"#f5c87a", icon:"🏛️", label:"Feria" },
  lanzamiento:{ color:"#4ade80", icon:"🚀", label:"Lanzamiento" },
  reunion:    { color:"#60a5fa", icon:"🤝", label:"Reunión" },
  temporada:  { color:"#fb923c", icon:"📅", label:"Temporada" },
  otro:       { color:"#e879f9", icon:"⭐", label:"Otro" },
};
const MONTHS     = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const SC         = { active:"#4ade80", completed:"#60a5fa", warning:"#fb923c" };
const OC         = { pending:{bg:"#fef3c7",text:"#92400e",label:"Pendiente"}, followup:{bg:"#dbeafe",text:"#1e40af",label:"Seguimiento"}, won:{bg:"#dcfce7",text:"#166534",label:"Ganada"}, lost:{bg:"#fee2e2",text:"#991b1b",label:"Perdida"} };
const PC         = { high:"#ef4444", medium:"#f59e0b", low:"#6b7280" };
const TABS       = ["Resumen","Equipo","Oportunidades","Tareas","Calendario","Asistente IA"];

const parseDate    = s => new Date(s+"T00:00:00");
const fmt          = d => parseDate(d).toLocaleDateString("es-ES",{day:"numeric",month:"short"});
const fmtFull      = d => parseDate(d).toLocaleDateString("es-ES",{day:"numeric",month:"long",year:"numeric"});
const daysBetween  = (a,b) => Math.round((parseDate(b)-parseDate(a))/86400000);
const today        = new Date(); today.setHours(0,0,0,0);
const todayStr     = today.toISOString().slice(0,10);

function pct(date,rs,re){ const d=parseDate(date),s=parseDate(rs),e=parseDate(re); return Math.max(0,Math.min(100,((d-s)/(e-s))*100)); }
function barPct(start,end,rs,re){ const s=parseDate(rs),e=parseDate(re),ds=Math.max(parseDate(start),s),de=Math.min(parseDate(end),e); if(de<=ds)return null; return{left:((ds-s)/(e-s))*100,width:((de-ds)/(e-s))*100}; }

// ── COMPONENTE PRINCIPAL ─────────────────────────────────────────
export default function App() {
  const [tab, setTab]                     = useState("Resumen");
  const [team, setTeamState]              = useState(INIT_TEAM);
  const [opps, setOppsState]              = useState(INIT_OPPS);
  const [tasks, setTasksState]            = useState(INIT_TASKS);
  const [holidays, setHolidaysState]      = useState(INIT_HOLIDAYS);
  const [events, setEventsState]          = useState(INIT_EVENTS);
  const [dbReady, setDbReady]             = useState(false);
  const [syncing, setSyncing]             = useState(false);
  const [lastSaved, setLastSaved]         = useState(null);
  const skipSave                          = useRef(true); // evitar guardar en la carga inicial

  // ── Cargar datos de Firebase al iniciar ──
  useEffect(() => {
    const ref = doc(db, "data", "main");
    const unsub = onSnapshot(ref, snap => {
      if (snap.exists()) {
        const d = snap.data();
        skipSave.current = true;
        if (d.team)     setTeamState(d.team);
        if (d.opps)     setOppsState(d.opps);
        if (d.tasks)    setTasksState(d.tasks);
        if (d.holidays) setHolidaysState(d.holidays);
        if (d.events)   setEventsState(d.events);
        setTimeout(() => { skipSave.current = false; setDbReady(true); }, 100);
      } else {
        // Primera vez: guardar datos iniciales
        saveAll(INIT_TEAM, INIT_OPPS, INIT_TASKS, INIT_HOLIDAYS, INIT_EVENTS);
        skipSave.current = false;
        setDbReady(true);
      }
    });
    return () => unsub();
  }, []);

  // ── Guardar en Firebase ──
  const saveAll = async (t, o, tk, h, e) => {
    if (skipSave.current) return;
    setSyncing(true);
    try {
      await setDoc(doc(db, "data", "main"), { team:t, opps:o, tasks:tk, holidays:h, events:e });
      setLastSaved(new Date().toLocaleTimeString("es-ES",{hour:"2-digit",minute:"2-digit"}));
    } catch(err) { console.error("Error guardando:", err); }
    setSyncing(false);
  };

  // Wrappers que guardan automáticamente
  const setTeam     = v => { setTeamState(v);     saveAll(v, opps, tasks, holidays, events); };
  const setOpps     = v => { setOppsState(v);     saveAll(team, v, tasks, holidays, events); };
  const setTasks    = v => { setTasksState(v);    saveAll(team, opps, v, holidays, events); };
  const setHolidays = v => { setHolidaysState(v); saveAll(team, opps, tasks, v, events); };
  const setEvents   = v => { setEventsState(v);   saveAll(team, opps, tasks, holidays, v); };

  // ── Calendario ──
  const [viewYear, setViewYear]             = useState(2026);
  const [selectedEvent, setSelectedEvent]   = useState(null);
  const [showAddEvent, setShowAddEvent]     = useState(false);
  const [showAddHoliday, setShowAddHoliday] = useState(false);
  const [newEvent, setNewEvent]             = useState({date:"",title:"",type:"otro",notes:"",attendees:""});
  const [newHoliday, setNewHoliday]         = useState({person:"Yo (Jefe)",start:"",end:"",label:"Vacaciones"});
  const [editEvent, setEditEvent]           = useState(null);
  const [newTask, setNewTask]               = useState("");
  const [showAddOpp, setShowAddOpp]         = useState(false);
  const [newOpp, setNewOpp]                 = useState({name:"",type:"Nuevo cliente",value:"Medio",agent:"",notes:""});

  // ── Chat IA ──
  const [messages, setMessages]   = useState([{ role:"assistant", text:"¡Hola! Soy tu asistente comercial 🍺\n\nPuedes decirme cosas como:\n• \"David hizo 2 visitas más\"\n• \"Añade oportunidad: Bar Roma, zona norte\"\n• \"Marca como completada la tarea de rutas\"\n• \"Marcos está en warning\"\n\n¿En qué te ayudo?" }]);
  const [chatInput, setChatInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const chatEndRef                = useRef(null);
  useEffect(() => { chatEndRef.current?.scrollIntoView({behavior:"smooth"}); }, [messages]);

  const rangeStart   = `${viewYear}-01-01`;
  const rangeEnd     = `${viewYear}-12-31`;
  const todayPctVal  = pct(todayStr<rangeStart?rangeStart:todayStr>rangeEnd?rangeEnd:todayStr, rangeStart, rangeEnd);
  const yearEvents   = events.filter(e=>e.date.startsWith(String(viewYear))).sort((a,b)=>a.date.localeCompare(b.date));
  const yearHolidays = holidays.filter(h=>h.start.startsWith(String(viewYear))||h.end.startsWith(String(viewYear)));
  const upcomingEvents = [...events].filter(e=>e.date>=todayStr).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,3);

  const buildContext = (tm,op,tk) => `Eres el asistente de gestión comercial de una empresa distribuidora de cervezas a hostelería.
Interpreta instrucciones en lenguaje natural y devuelve SOLO un JSON sin markdown.
EQUIPO: ${JSON.stringify(tm)}
OPORTUNIDADES: ${JSON.stringify(op)}
TAREAS: ${JSON.stringify(tk)}
Formato: { "reply":"...", "team":[...si cambia], "opps":[...si cambia], "tasks":[...si cambia] }
Estados equipo: active/completed/warning. Oportunidades: pending/followup/won/lost. IDs nuevos: número alto. Sé breve.`;

  const sendMessage = async () => {
    const text = chatInput.trim();
    if (!text||aiLoading) return;
    setChatInput("");
    setMessages(prev=>[...prev,{role:"user",text}]);
    setAiLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:1000, system:buildContext(team,opps,tasks), messages:[{role:"user",content:text}] }),
      });
      const data = await res.json();
      const raw = data.content?.map(b=>b.text||"").join("").trim();
      let parsed;
      try { parsed = JSON.parse(raw.replace(/```json|```/g,"").trim()); }
      catch { parsed = {reply: raw||"No entendí, ¿puedes repetirlo?"}; }
      if (parsed.team)  setTeam(parsed.team);
      if (parsed.opps)  setOpps(parsed.opps);
      if (parsed.tasks) setTasks(parsed.tasks);
      setMessages(prev=>[...prev,{role:"assistant",text:parsed.reply||"✅ Hecho."}]);
    } catch { setMessages(prev=>[...prev,{role:"assistant",text:"⚠️ Error de conexión."}]); }
    setAiLoading(false);
  };

  const toggleTask   = id => setTasks(tasks.map(t=>t.id===id?{...t,done:!t.done}:t));
  const addTask      = () => { if(!newTask.trim())return; setTasks([...tasks,{id:Date.now(),text:newTask,done:false,priority:"medium",agent:"Equipo"}]); setNewTask(""); };
  const addOpp       = () => { if(!newOpp.name.trim())return; setOpps([...opps,{...newOpp,id:Date.now(),status:"pending"}]); setNewOpp({name:"",type:"Nuevo cliente",value:"Medio",agent:"",notes:""}); setShowAddOpp(false); };
  const cycleStatus  = id => { const c=["pending","followup","won","lost"]; setOpps(opps.map(o=>o.id!==id?o:{...o,status:c[(c.indexOf(o.status)+1)%c.length]})); };
  const addEvent     = () => { if(!newEvent.date||!newEvent.title.trim())return; setEvents([...events,{...newEvent,id:Date.now()}]); setNewEvent({date:"",title:"",type:"otro",notes:"",attendees:""}); setShowAddEvent(false); };
  const addHoliday   = () => { if(!newHoliday.start||!newHoliday.end)return; setHolidays([...holidays,{...newHoliday,id:Date.now()}]); setNewHoliday({person:"Yo (Jefe)",start:"",end:"",label:"Vacaciones"}); setShowAddHoliday(false); };
  const deleteEvent   = id => { setEvents(events.filter(e=>e.id!==id)); setSelectedEvent(null); };
  const deleteHoliday = id => setHolidays(holidays.filter(h=>h.id!==id));
  const saveEditEvent = () => { setEvents(events.map(e=>e.id===editEvent.id?editEvent:e)); setSelectedEvent(editEvent); setEditEvent(null); };

  const totalVisits  = team.reduce((a,b)=>a+b.visits,0);
  const totalTarget  = team.reduce((a,b)=>a+b.target,0);
  const openOpps     = opps.filter(o=>o.status==="pending"||o.status==="followup").length;
  const pendingTasks = tasks.filter(t=>!t.done).length;

  const card  = {background:"linear-gradient(135deg,#1a0e04,#2a1608)",border:"1px solid #3a2010",borderRadius:12,padding:18,marginBottom:14};
  const inp   = {width:"100%",padding:"10px 13px",borderRadius:9,background:"#2a1608",border:"1px solid #3a2010",color:"#f5f0e8",fontFamily:"Georgia,serif",fontSize:13,boxSizing:"border-box"};
  const btn   = x => ({padding:"10px 18px",borderRadius:9,border:"none",fontFamily:"Georgia,serif",fontSize:13,cursor:"pointer",...x});

  if (!dbReady) return (
    <div style={{minHeight:"100vh",background:"#0f0f0f",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"Georgia,serif",color:"#f5f0e8"}}>
      <div style={{fontSize:40,marginBottom:16}}>🍺</div>
      <div style={{fontSize:14,color:"#c87c2a",letterSpacing:2}}>Cargando datos...</div>
      <div style={{fontSize:11,color:"#806040",marginTop:8}}>Conectando con Firebase</div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:"#0f0f0f",fontFamily:"Georgia,serif",color:"#f5f0e8"}}>

      {/* Header */}
      <div style={{background:"linear-gradient(135deg,#1a0a00,#2d1200,#1a0a00)",borderBottom:"2px solid #c87c2a",padding:"14px 18px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:11}}>
          <div style={{width:38,height:38,borderRadius:"50%",background:"linear-gradient(135deg,#c87c2a,#8b4513)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,boxShadow:"0 0 14px #c87c2a55"}}>🍺</div>
          <div>
            <div style={{fontSize:15,fontWeight:"bold",letterSpacing:1,color:"#f5c87a"}}>GESTIÓN COMERCIAL</div>
            <div style={{fontSize:9,color:"#a07040",letterSpacing:2,textTransform:"uppercase"}}>Gestión del equipo</div>
          </div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:10,color:"#f5c87a",fontWeight:"bold"}}>{new Date().toLocaleDateString("es-ES",{weekday:"long",day:"numeric",month:"long"})}</div>
          <div style={{fontSize:9,color:syncing?"#f5c87a":"#4ade80",marginTop:2}}>
            {syncing ? "⟳ Guardando…" : lastSaved ? `✓ Guardado ${lastSaved}` : "☁️ Conectado"}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:"flex",borderBottom:"1px solid #2a1a08",background:"#150800",overflowX:"auto"}}>
        {TABS.map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{padding:"11px 13px",border:"none",cursor:"pointer",background:tab===t?"#2d1200":"transparent",color:tab===t?"#f5c87a":"#806040",borderBottom:tab===t?"2px solid #c87c2a":"2px solid transparent",fontFamily:"Georgia,serif",fontSize:10,fontWeight:tab===t?"bold":"normal",whiteSpace:"nowrap"}}>
            {t==="Asistente IA"?"🤖 IA":t==="Calendario"?"📅 Cal.":t}
          </button>
        ))}
      </div>

      <div style={{padding:"14px 12px",maxWidth:900,margin:"0 auto"}}>

        {/* ══ RESUMEN ══ */}
        {tab==="Resumen" && <>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:10,marginBottom:16}}>
            {[
              {icon:"🏃",label:"Visitas hoy",     value:`${totalVisits}/${totalTarget}`,color:"#4ade80"},
              {icon:"💡",label:"Oportunidades",    value:openOpps,                       color:"#f5c87a"},
              {icon:"✅",label:"Tareas pendientes",value:pendingTasks,                   color:"#fb923c"},
              {icon:"👥",label:"Equipo OK",        value:`${team.filter(m=>m.status!=="warning").length}/${team.length}`,color:"#60a5fa"},
            ].map(c=>(
              <div key={c.label} style={{...card,padding:"13px 12px",marginBottom:0}}>
                <div style={{fontSize:18,marginBottom:4}}>{c.icon}</div>
                <div style={{fontSize:22,fontWeight:"bold",color:c.color,lineHeight:1}}>{c.value}</div>
                <div style={{fontSize:10,color:"#c87c2a",marginTop:3}}>{c.label}</div>
              </div>
            ))}
          </div>
          {upcomingEvents.length>0 && (
            <div style={card}>
              <div style={{fontSize:11,color:"#c87c2a",fontWeight:"bold",marginBottom:11,letterSpacing:1}}>📅 PRÓXIMOS EVENTOS</div>
              {upcomingEvents.map(e=>{
                const et=EVENT_TYPES[e.type]||EVENT_TYPES.otro;
                const dl=daysBetween(todayStr,e.date);
                return(
                  <div key={e.id} onClick={()=>{setSelectedEvent(e);setTab("Calendario");}} style={{display:"flex",alignItems:"center",gap:10,marginBottom:8,padding:"8px 11px",background:"#2a1005",borderRadius:8,border:`1px solid ${et.color}33`,cursor:"pointer"}}>
                    <div style={{fontSize:16,flexShrink:0}}>{et.icon}</div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:12,fontWeight:"bold"}}>{e.title}</div>
                      <div style={{fontSize:10,color:"#806040"}}>{fmtFull(e.date)}</div>
                    </div>
                    <div style={{fontSize:10,fontWeight:"bold",color:et.color,background:`${et.color}22`,padding:"2px 7px",borderRadius:10,flexShrink:0}}>
                      {dl===0?"Hoy":dl===1?"Mañana":`En ${dl}d`}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div style={card}>
            <div style={{fontSize:11,color:"#c87c2a",fontWeight:"bold",marginBottom:12,letterSpacing:1}}>🗺️ ESTADO DEL EQUIPO HOY</div>
            {team.map(m=>(
              <div key={m.id} style={{display:"flex",alignItems:"center",gap:10,marginBottom:11}}>
                <div style={{width:7,height:7,borderRadius:"50%",background:SC[m.status],boxShadow:`0 0 5px ${SC[m.status]}`,flexShrink:0}}/>
                <div style={{flex:1}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                    <span style={{fontSize:12,fontWeight:"bold"}}>{m.name}</span>
                    <span style={{fontSize:10,color:"#806040"}}>{m.lastUpdate}</span>
                  </div>
                  <div style={{background:"#2a1608",borderRadius:4,height:5,overflow:"hidden"}}>
                    <div style={{height:"100%",borderRadius:4,width:`${Math.min((m.visits/m.target)*100,100)}%`,background:`linear-gradient(90deg,${SC[m.status]},${SC[m.status]}88)`,transition:"width 0.5s"}}/>
                  </div>
                  <div style={{fontSize:10,color:"#806040",marginTop:2}}>{m.zone} · {m.visits}/{m.target} visitas</div>
                </div>
              </div>
            ))}
          </div>
          <div style={card}>
            <div style={{fontSize:11,color:"#c87c2a",fontWeight:"bold",marginBottom:10,letterSpacing:1}}>🔥 TAREAS URGENTES</div>
            {tasks.filter(t=>t.priority==="high"&&!t.done).map(t=>(
              <div key={t.id} style={{display:"flex",alignItems:"center",gap:10,marginBottom:7,padding:"8px 11px",background:"#2a1005",borderRadius:8,border:"1px solid #ef444433"}}>
                <input type="checkbox" checked={t.done} onChange={()=>toggleTask(t.id)} style={{cursor:"pointer",accentColor:"#c87c2a",width:15,height:15}}/>
                <div style={{flex:1}}>
                  <div style={{fontSize:12}}>{t.text}</div>
                  <div style={{fontSize:10,color:"#806040"}}>{t.agent}</div>
                </div>
              </div>
            ))}
            {tasks.filter(t=>t.priority==="high"&&!t.done).length===0&&<div style={{color:"#4ade80",fontSize:12,textAlign:"center",padding:"6px 0"}}>✅ Sin tareas urgentes</div>}
          </div>
        </>}

        {/* ══ EQUIPO ══ */}
        {tab==="Equipo" && team.map(m=>(
          <div key={m.id} style={{...card,border:`1px solid ${SC[m.status]}44`,boxShadow:`0 2px 12px ${SC[m.status]}22`}}>
            <div style={{display:"flex",alignItems:"center",gap:11,marginBottom:10}}>
              <div style={{width:37,height:37,borderRadius:"50%",background:`${SC[m.status]}22`,border:`2px solid ${SC[m.status]}`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:"bold",color:SC[m.status],fontSize:14}}>{m.name[0]}</div>
              <div style={{flex:1}}>
                <div style={{fontWeight:"bold",fontSize:13}}>{m.name}</div>
                <div style={{fontSize:11,color:"#c87c2a"}}>Zona {m.zone} · {m.lastUpdate}</div>
              </div>
              <div style={{padding:"3px 9px",borderRadius:20,fontSize:10,fontWeight:"bold",background:`${SC[m.status]}22`,color:SC[m.status],border:`1px solid ${SC[m.status]}44`}}>
                {m.status==="active"?"Activo":m.status==="completed"?"Completado":"⚠️ Revisar"}
              </div>
            </div>
            <div style={{marginBottom:9}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"#806040",marginBottom:4}}>
                <span>Visitas</span><span style={{color:SC[m.status],fontWeight:"bold"}}>{m.visits}/{m.target}</span>
              </div>
              <div style={{background:"#2a1608",borderRadius:6,height:8,overflow:"hidden"}}>
                <div style={{height:"100%",borderRadius:6,width:`${Math.min((m.visits/m.target)*100,100)}%`,background:`linear-gradient(90deg,${SC[m.status]},${SC[m.status]}88)`,transition:"width 0.6s"}}/>
              </div>
            </div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setTeam(team.map(t=>t.id===m.id?{...t,visits:Math.min(t.visits+1,t.target),lastUpdate:"Ahora"}:t))} style={btn({flex:1,background:"#2a1608",border:"1px solid #c87c2a44",color:"#c87c2a"})}>+ Visita</button>
              <button onClick={()=>{const ns=m.status==="warning"?"active":m.status==="active"?"completed":"warning";setTeam(team.map(t=>t.id===m.id?{...t,status:ns}:t));}} style={btn({flex:1,background:"#1a0e04",border:"1px solid #3a2010",color:"#806040"})}>Cambiar estado</button>
            </div>
          </div>
        ))}

        {/* ══ OPORTUNIDADES ══ */}
        {tab==="Oportunidades" && <>
          <button onClick={()=>setShowAddOpp(!showAddOpp)} style={btn({width:"100%",marginBottom:13,background:"linear-gradient(135deg,#c87c2a,#8b4513)",color:"#fff",fontWeight:"bold",letterSpacing:1})}>+ NUEVA OPORTUNIDAD</button>
          {showAddOpp&&(
            <div style={{...card,border:"1px solid #c87c2a44"}}>
              <div style={{fontSize:12,color:"#c87c2a",fontWeight:"bold",marginBottom:11}}>REGISTRAR OPORTUNIDAD</div>
              {[["Nombre del local","name"],["Comercial responsable","agent"],["Notas","notes"]].map(([lbl,key])=>(
                <div key={key} style={{marginBottom:8}}>
                  <div style={{fontSize:10,color:"#806040",marginBottom:3}}>{lbl}</div>
                  <input value={newOpp[key]} onChange={e=>setNewOpp({...newOpp,[key]:e.target.value})} style={inp}/>
                </div>
              ))}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                {[["Tipo","type",["Nuevo cliente","Ampliación","Recuperación"]],["Valor","value",["Alto","Medio","Bajo"]]].map(([lbl,key,opts])=>(
                  <div key={key}>
                    <div style={{fontSize:10,color:"#806040",marginBottom:3}}>{lbl}</div>
                    <select value={newOpp[key]} onChange={e=>setNewOpp({...newOpp,[key]:e.target.value})} style={inp}>{opts.map(o=><option key={o}>{o}</option>)}</select>
                  </div>
                ))}
              </div>
              <button onClick={addOpp} style={btn({width:"100%",background:"#c87c2a",color:"#fff"})}>Guardar</button>
            </div>
          )}
          {opps.map(o=>{const s=OC[o.status]||OC.pending;return(
            <div key={o.id} style={card}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:7}}>
                <div>
                  <div style={{fontWeight:"bold",fontSize:13}}>{o.name}</div>
                  <div style={{fontSize:11,color:"#806040",marginTop:2}}>{o.type} · {o.agent}</div>
                </div>
                <div style={{display:"flex",gap:6,alignItems:"center",flexShrink:0,marginLeft:8}}>
                  <span style={{padding:"2px 7px",borderRadius:12,fontSize:10,fontWeight:"bold",background:o.value==="Alto"?"#fef3c7":o.value==="Medio"?"#dbeafe":"#f3f4f6",color:o.value==="Alto"?"#92400e":o.value==="Medio"?"#1e40af":"#374151"}}>{o.value}</span>
                  <button onClick={()=>cycleStatus(o.id)} style={{padding:"2px 9px",borderRadius:12,fontSize:10,fontWeight:"bold",background:s.bg,color:s.text,border:"none",cursor:"pointer"}}>{s.label}</button>
                </div>
              </div>
              {o.notes&&<div style={{fontSize:11,color:"#a07858",padding:"6px 10px",background:"#2a1608",borderRadius:6,borderLeft:"2px solid #c87c2a44"}}>{o.notes}</div>}
            </div>
          );})}
        </>}

        {/* ══ TAREAS ══ */}
        {tab==="Tareas" && <>
          <div style={{display:"flex",gap:10,marginBottom:15}}>
            <input value={newTask} onChange={e=>setNewTask(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addTask()} placeholder="Añadir tarea…" style={{...inp,flex:1}}/>
            <button onClick={addTask} style={btn({padding:"10px 18px",background:"linear-gradient(135deg,#c87c2a,#8b4513)",color:"#fff",fontWeight:"bold"})}>+</button>
          </div>
          {["high","medium","low"].map(p=>{
            const labels={high:"🔴 Urgente",medium:"🟡 Normal",low:"⚪ Baja prioridad"};
            return(<div key={p} style={{marginBottom:16}}>
              <div style={{fontSize:10,color:"#806040",fontWeight:"bold",letterSpacing:1,marginBottom:8}}>{labels[p]}</div>
              {tasks.filter(t=>t.priority===p).map(t=>(
                <div key={t.id} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",background:t.done?"#150b04":"#1a0e04",border:`1px solid ${t.done?"#2a1608":PC[p]+"33"}`,borderRadius:9,marginBottom:6,opacity:t.done?0.5:1,transition:"all 0.2s"}}>
                  <input type="checkbox" checked={t.done} onChange={()=>toggleTask(t.id)} style={{cursor:"pointer",accentColor:"#c87c2a",width:15,height:15,flexShrink:0}}/>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12,textDecoration:t.done?"line-through":"none"}}>{t.text}</div>
                    <div style={{fontSize:10,color:"#806040",marginTop:1}}>{t.agent}</div>
                  </div>
                  <div style={{width:6,height:6,borderRadius:"50%",background:PC[p],flexShrink:0}}/>
                </div>
              ))}
            </div>);
          })}
        </>}

        {/* ══ CALENDARIO ══ */}
        {tab==="Calendario" && <>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
            <button onClick={()=>setViewYear(v=>v-1)} style={btn({background:"#2a1608",border:"1px solid #3a2010",color:"#c87c2a",padding:"7px 14px"})}>‹ {viewYear-1}</button>
            <div style={{fontSize:17,fontWeight:"bold",color:"#f5c87a",letterSpacing:2}}>{viewYear}</div>
            <button onClick={()=>setViewYear(v=>v+1)} style={btn({background:"#2a1608",border:"1px solid #3a2010",color:"#c87c2a",padding:"7px 14px"})}>{viewYear+1} ›</button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
            <button onClick={()=>{setShowAddEvent(!showAddEvent);setShowAddHoliday(false);}} style={btn({background:showAddEvent?"#c87c2a":"linear-gradient(135deg,#2d1200,#1a0a00)",border:"1px solid #c87c2a44",color:showAddEvent?"#fff":"#c87c2a",fontWeight:"bold"})}>
              {showAddEvent?"✕ Cancelar":"+ Evento"}
            </button>
            <button onClick={()=>{setShowAddHoliday(!showAddHoliday);setShowAddEvent(false);}} style={btn({background:showAddHoliday?"#1e40af":"linear-gradient(135deg,#001a2d,#000a1a)",border:"1px solid #60a5fa44",color:showAddHoliday?"#fff":"#60a5fa",fontWeight:"bold"})}>
              {showAddHoliday?"✕ Cancelar":"+ Vacaciones"}
            </button>
          </div>

          {showAddEvent&&(
            <div style={{...card,border:"1px solid #c87c2a55",marginBottom:16}}>
              <div style={{fontSize:11,color:"#c87c2a",fontWeight:"bold",marginBottom:12,letterSpacing:1}}>NUEVO EVENTO</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:9}}>
                <div><div style={{fontSize:10,color:"#806040",marginBottom:3}}>Fecha</div><input type="date" value={newEvent.date} onChange={e=>setNewEvent({...newEvent,date:e.target.value})} style={inp}/></div>
                <div><div style={{fontSize:10,color:"#806040",marginBottom:3}}>Tipo</div>
                  <select value={newEvent.type} onChange={e=>setNewEvent({...newEvent,type:e.target.value})} style={inp}>
                    {Object.entries(EVENT_TYPES).map(([k,v])=><option key={k} value={k}>{v.icon} {v.label}</option>)}
                  </select>
                </div>
              </div>
              <div style={{marginBottom:9}}><div style={{fontSize:10,color:"#806040",marginBottom:3}}>Título</div><input value={newEvent.title} onChange={e=>setNewEvent({...newEvent,title:e.target.value})} placeholder="Ej: Feria Hostelería Barcelona" style={inp}/></div>
              <div style={{marginBottom:9}}><div style={{fontSize:10,color:"#806040",marginBottom:3}}>Asistentes</div><input value={newEvent.attendees} onChange={e=>setNewEvent({...newEvent,attendees:e.target.value})} placeholder="Ej: Yo, David…" style={inp}/></div>
              <div style={{marginBottom:12}}><div style={{fontSize:10,color:"#806040",marginBottom:3}}>Notas e información relevante</div><textarea value={newEvent.notes} onChange={e=>setNewEvent({...newEvent,notes:e.target.value})} placeholder="Ubicación, contactos, objetivos…" rows={3} style={{...inp,resize:"vertical",lineHeight:1.6}}/></div>
              <button onClick={addEvent} style={btn({width:"100%",background:"linear-gradient(135deg,#c87c2a,#8b4513)",color:"#fff",fontWeight:"bold"})}>Guardar evento</button>
            </div>
          )}

          {showAddHoliday&&(
            <div style={{...card,border:"1px solid #60a5fa44",marginBottom:16}}>
              <div style={{fontSize:11,color:"#60a5fa",fontWeight:"bold",marginBottom:12,letterSpacing:1}}>AÑADIR VACACIONES</div>
              <div style={{marginBottom:9}}><div style={{fontSize:10,color:"#806040",marginBottom:3}}>Persona</div>
                <select value={newHoliday.person} onChange={e=>setNewHoliday({...newHoliday,person:e.target.value})} style={inp}>
                  {TEAM_NAMES.map(n=><option key={n}>{n}</option>)}
                </select>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:9}}>
                <div><div style={{fontSize:10,color:"#806040",marginBottom:3}}>Desde</div><input type="date" value={newHoliday.start} onChange={e=>setNewHoliday({...newHoliday,start:e.target.value})} style={inp}/></div>
                <div><div style={{fontSize:10,color:"#806040",marginBottom:3}}>Hasta</div><input type="date" value={newHoliday.end} onChange={e=>setNewHoliday({...newHoliday,end:e.target.value})} style={inp}/></div>
              </div>
              <div style={{marginBottom:12}}><div style={{fontSize:10,color:"#806040",marginBottom:3}}>Etiqueta</div><input value={newHoliday.label} onChange={e=>setNewHoliday({...newHoliday,label:e.target.value})} style={inp}/></div>
              <button onClick={addHoliday} style={btn({width:"100%",background:"linear-gradient(135deg,#1e40af,#1e3a8a)",color:"#fff",fontWeight:"bold"})}>Guardar vacaciones</button>
            </div>
          )}

          {/* Línea temporal */}
          <div style={{...card,overflowX:"auto"}}>
            <div style={{fontSize:11,color:"#c87c2a",fontWeight:"bold",marginBottom:14,letterSpacing:1}}>📅 LÍNEA TEMPORAL {viewYear}</div>
            <div style={{position:"relative",minWidth:520}}>
              <div style={{display:"flex",marginBottom:5,paddingLeft:80}}>
                {MONTHS.map(m=><div key={m} style={{flex:1,textAlign:"center",fontSize:8,color:"#806040",fontWeight:"bold"}}>{m}</div>)}
              </div>
              <div style={{position:"relative",paddingLeft:80}}>
                <div style={{position:"absolute",left:80,right:0,top:"50%",height:1,background:"#3a2010",zIndex:0}}/>
                {MONTHS.map((_,i)=><div key={i} style={{position:"absolute",left:`calc(80px + ${(i/12)*100}%)`,top:0,bottom:0,width:1,background:"#2a1608",zIndex:0}}/>)}
                {todayStr>=rangeStart&&todayStr<=rangeEnd&&(
                  <div style={{position:"absolute",left:`calc(80px + ${todayPctVal}%)`,top:-4,bottom:-4,width:2,background:"#ef4444",zIndex:10,borderRadius:2}}>
                    <div style={{position:"absolute",top:-15,left:"50%",transform:"translateX(-50%)",fontSize:7,color:"#ef4444",fontWeight:"bold",whiteSpace:"nowrap",background:"#0f0f0f",padding:"1px 3px",borderRadius:2}}>HOY</div>
                  </div>
                )}
                {TEAM_NAMES.map(person=>{
                  const ph=yearHolidays.filter(h=>h.person===person);
                  if(!ph.length)return null;
                  const col=TEAM_COLORS[person]||"#888";
                  return(
                    <div key={person} style={{display:"flex",alignItems:"center",marginBottom:6,height:20}}>
                      <div style={{width:78,fontSize:9,color:col,fontWeight:"bold",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flexShrink:0}}>{person==="Yo (Jefe)"?"👑 Yo":person.split(" ")[0]}</div>
                      <div style={{flex:1,position:"relative",height:13}}>
                        {ph.map(h=>{
                          const b=barPct(h.start,h.end,rangeStart,rangeEnd);
                          if(!b)return null;
                          return(
                            <div key={h.id} onClick={()=>deleteHoliday(h.id)} title={`${h.label}: ${fmt(h.start)}–${fmt(h.end)} (toca para eliminar)`}
                              style={{position:"absolute",left:`${b.left}%`,width:`${b.width}%`,height:"100%",background:`${col}55`,border:`1px solid ${col}`,borderRadius:5,cursor:"pointer",display:"flex",alignItems:"center",overflow:"hidden"}}>
                              <span style={{fontSize:7,color:col,paddingLeft:3,fontWeight:"bold"}}>☀️</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                <div style={{height:1,background:"#3a2010",marginBottom:8,marginTop:3}}/>
                <div style={{position:"relative",height:30,marginBottom:3}}>
                  {yearEvents.map(e=>{
                    const et=EVENT_TYPES[e.type]||EVENT_TYPES.otro;
                    const p=pct(e.date,rangeStart,rangeEnd);
                    const isSel=selectedEvent?.id===e.id;
                    return(
                      <div key={e.id} onClick={()=>setSelectedEvent(isSel?null:e)} style={{position:"absolute",left:`${p}%`,transform:"translateX(-50%)",top:0,cursor:"pointer",zIndex:5}}>
                        <div style={{width:20,height:20,borderRadius:"50%",background:isSel?et.color:`${et.color}44`,border:`2px solid ${et.color}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,boxShadow:isSel?`0 0 8px ${et.color}`:"none",transition:"all 0.2s"}}>{et.icon}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div style={{display:"flex",flexWrap:"wrap",gap:8,marginTop:8,paddingLeft:80}}>
                {TEAM_NAMES.filter(n=>yearHolidays.some(h=>h.person===n)).map(n=>(
                  <div key={n} style={{display:"flex",alignItems:"center",gap:3}}>
                    <div style={{width:8,height:8,borderRadius:2,background:TEAM_COLORS[n]+"55",border:`1px solid ${TEAM_COLORS[n]}`}}/>
                    <span style={{fontSize:8,color:TEAM_COLORS[n]}}>{n==="Yo (Jefe)"?"Yo":n.split(" ")[0]}</span>
                  </div>
                ))}
                <div style={{display:"flex",alignItems:"center",gap:3}}>
                  <div style={{width:2,height:8,background:"#ef4444",borderRadius:1}}/>
                  <span style={{fontSize:8,color:"#ef4444"}}>Hoy</span>
                </div>
              </div>
            </div>
          </div>

          {/* Detalle evento */}
          {selectedEvent&&!editEvent&&(()=>{
            const et=EVENT_TYPES[selectedEvent.type]||EVENT_TYPES.otro;
            return(
              <div style={{...card,border:`2px solid ${et.color}44`,marginTop:4}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:11}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <div style={{fontSize:22}}>{et.icon}</div>
                    <div>
                      <div style={{fontWeight:"bold",fontSize:14}}>{selectedEvent.title}</div>
                      <div style={{fontSize:11,color:et.color,marginTop:1}}>{et.label} · {fmtFull(selectedEvent.date)}</div>
                    </div>
                  </div>
                  <button onClick={()=>setSelectedEvent(null)} style={{background:"none",border:"none",color:"#806040",fontSize:17,cursor:"pointer"}}>✕</button>
                </div>
                {selectedEvent.attendees&&<div style={{marginBottom:9}}><div style={{fontSize:9,color:"#806040",marginBottom:3,letterSpacing:1,textTransform:"uppercase"}}>Asistentes</div><div style={{fontSize:12,color:"#f5c87a",background:"#2a1608",padding:"7px 11px",borderRadius:7}}>{selectedEvent.attendees}</div></div>}
                {selectedEvent.notes&&<div style={{marginBottom:13}}><div style={{fontSize:9,color:"#806040",marginBottom:3,letterSpacing:1,textTransform:"uppercase"}}>Notas</div><div style={{fontSize:12,color:"#f5f0e8",background:"#2a1608",padding:"9px 11px",borderRadius:7,lineHeight:1.7,borderLeft:`3px solid ${et.color}55`,whiteSpace:"pre-wrap"}}>{selectedEvent.notes}</div></div>}
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>setEditEvent({...selectedEvent})} style={btn({flex:1,background:"#2a1608",border:"1px solid #c87c2a44",color:"#c87c2a"})}>✏️ Editar</button>
                  <button onClick={()=>deleteEvent(selectedEvent.id)} style={btn({flex:1,background:"#2a1005",border:"1px solid #ef444433",color:"#ef4444"})}>🗑 Eliminar</button>
                </div>
              </div>
            );
          })()}

          {editEvent&&(
            <div style={{...card,border:"1px solid #f5c87a44",marginTop:4}}>
              <div style={{fontSize:11,color:"#f5c87a",fontWeight:"bold",marginBottom:12,letterSpacing:1}}>✏️ EDITAR EVENTO</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:9}}>
                <div><div style={{fontSize:10,color:"#806040",marginBottom:3}}>Fecha</div><input type="date" value={editEvent.date} onChange={e=>setEditEvent({...editEvent,date:e.target.value})} style={inp}/></div>
                <div><div style={{fontSize:10,color:"#806040",marginBottom:3}}>Tipo</div>
                  <select value={editEvent.type} onChange={e=>setEditEvent({...editEvent,type:e.target.value})} style={inp}>
                    {Object.entries(EVENT_TYPES).map(([k,v])=><option key={k} value={k}>{v.icon} {v.label}</option>)}
                  </select>
                </div>
              </div>
              <div style={{marginBottom:9}}><div style={{fontSize:10,color:"#806040",marginBottom:3}}>Título</div><input value={editEvent.title} onChange={e=>setEditEvent({...editEvent,title:e.target.value})} style={inp}/></div>
              <div style={{marginBottom:9}}><div style={{fontSize:10,color:"#806040",marginBottom:3}}>Asistentes</div><input value={editEvent.attendees} onChange={e=>setEditEvent({...editEvent,attendees:e.target.value})} style={inp}/></div>
              <div style={{marginBottom:12}}><div style={{fontSize:10,color:"#806040",marginBottom:3}}>Notas</div><textarea value={editEvent.notes} onChange={e=>setEditEvent({...editEvent,notes:e.target.value})} rows={4} style={{...inp,resize:"vertical",lineHeight:1.6}}/></div>
              <div style={{display:"flex",gap:8}}>
                <button onClick={saveEditEvent} style={btn({flex:1,background:"linear-gradient(135deg,#c87c2a,#8b4513)",color:"#fff",fontWeight:"bold"})}>Guardar cambios</button>
                <button onClick={()=>setEditEvent(null)} style={btn({flex:1,background:"#1a0e04",border:"1px solid #3a2010",color:"#806040"})}>Cancelar</button>
              </div>
            </div>
          )}

          <div style={{marginTop:16}}>
            <div style={{fontSize:10,color:"#806040",fontWeight:"bold",letterSpacing:1,marginBottom:11}}>EVENTOS {viewYear}</div>
            {yearEvents.length===0&&<div style={{color:"#806040",fontSize:12,textAlign:"center",padding:"16px 0"}}>No hay eventos para {viewYear}</div>}
            {yearEvents.map(e=>{
              const et=EVENT_TYPES[e.type]||EVENT_TYPES.otro;
              const isPast=e.date<todayStr;
              return(
                <div key={e.id} onClick={()=>setSelectedEvent(selectedEvent?.id===e.id?null:e)}
                  style={{display:"flex",alignItems:"center",gap:11,padding:"10px 13px",background:selectedEvent?.id===e.id?"#2d1200":"#1a0e04",border:`1px solid ${selectedEvent?.id===e.id?et.color+"55":"#3a2010"}`,borderRadius:10,marginBottom:7,cursor:"pointer",opacity:isPast?0.55:1,transition:"all 0.2s"}}>
                  <div style={{width:32,height:32,borderRadius:"50%",background:`${et.color}22`,border:`1.5px solid ${et.color}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>{et.icon}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12,fontWeight:"bold"}}>{e.title}</div>
                    <div style={{fontSize:10,color:"#806040",marginTop:1}}>{fmtFull(e.date)}{e.attendees?` · ${e.attendees}`:""}</div>
                  </div>
                  <div style={{fontSize:9,fontWeight:"bold",color:et.color,background:`${et.color}22`,padding:"2px 8px",borderRadius:10,flexShrink:0}}>{et.label}</div>
                </div>
              );
            })}
          </div>
        </>}

        {/* ══ ASISTENTE IA ══ */}
        {tab==="Asistente IA" && (
          <div style={{display:"flex",flexDirection:"column",height:"calc(100vh - 170px)"}}>
            <div style={{background:"#1a0e04",border:"1px solid #c87c2a33",borderRadius:10,padding:"8px 12px",marginBottom:11,fontSize:11,color:"#a07040",lineHeight:1.7}}>
              💬 Dime en lenguaje natural qué actualizar. Ej: <span style={{color:"#f5c87a"}}>"David hizo 2 visitas más"</span> · <span style={{color:"#f5c87a"}}>"Añade oportunidad: Bar Roma"</span>
            </div>
            <div style={{flex:1,overflowY:"auto",paddingRight:2,marginBottom:10}}>
              {messages.map((m,i)=>(
                <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start",marginBottom:10}}>
                  {m.role==="assistant"&&<div style={{width:26,height:26,borderRadius:"50%",background:"linear-gradient(135deg,#c87c2a,#8b4513)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,marginRight:7,flexShrink:0,marginTop:2}}>🍺</div>}
                  <div style={{maxWidth:"78%",padding:"9px 12px",borderRadius:m.role==="user"?"12px 12px 4px 12px":"12px 12px 12px 4px",background:m.role==="user"?"linear-gradient(135deg,#c87c2a,#8b4513)":"#1a0e04",border:m.role==="user"?"none":"1px solid #3a2010",fontSize:12,lineHeight:1.65,color:"#f5f0e8",whiteSpace:"pre-wrap"}}>{m.text}</div>
                  {m.role==="user"&&<div style={{width:26,height:26,borderRadius:"50%",background:"#2a1608",border:"1px solid #3a2010",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,marginLeft:7,flexShrink:0,marginTop:2}}>👤</div>}
                </div>
              ))}
              {aiLoading&&(
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                  <div style={{width:26,height:26,borderRadius:"50%",background:"linear-gradient(135deg,#c87c2a,#8b4513)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12}}>🍺</div>
                  <div style={{padding:"9px 14px",borderRadius:"12px 12px 12px 4px",background:"#1a0e04",border:"1px solid #3a2010"}}>
                    <span style={{color:"#c87c2a",fontSize:17,letterSpacing:3}}>···</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef}/>
            </div>
            <div style={{display:"flex",gap:8}}>
              <input value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&sendMessage()} placeholder="Escribe una instrucción…" disabled={aiLoading} style={{...inp,flex:1,opacity:aiLoading?0.6:1}}/>
              <button onClick={sendMessage} disabled={aiLoading||!chatInput.trim()} style={btn({padding:"10px 15px",background:aiLoading||!chatInput.trim()?"#2a1608":"linear-gradient(135deg,#c87c2a,#8b4513)",color:aiLoading||!chatInput.trim()?"#806040":"#fff",fontWeight:"bold",fontSize:14,opacity:aiLoading?0.7:1})}>➤</button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
