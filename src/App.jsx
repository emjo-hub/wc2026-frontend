import { useState, useCallback } from "react";
import axios from "axios";

const API = "https://wc2026-backend-bgmd.vercel.app";
const SIMULATE_URL = "https://wc2026-backend-bgmd.vercel.app/api/simulate";
const MC_URL = "https://wc2026-backend-bgmd.vercel.app/api/montecarlo";

const TEAMS = {
  "Argentina":      {f:"🇦🇷",g:"J",r:1, e:2088},
  "España":         {f:"🇪🇸",g:"H",r:2, e:2052},
  "Francia":        {f:"🇫🇷",g:"I",r:3, e:2038},
  "Inglaterra":     {f:"🏴󠁧󠁢󠁥󠁮󠁧󠁿",g:"L",r:4, e:2028},
  "Portugal":       {f:"🇵🇹",g:"K",r:5, e:2018},
  "Brasil":         {f:"🇧🇷",g:"C",r:6, e:2012},
  "Marruecos":      {f:"🇲🇦",g:"C",r:7, e:1995},
  "Países Bajos":   {f:"🇳🇱",g:"F",r:8, e:1968},
  "Bélgica":        {f:"🇧🇪",g:"G",r:9, e:1955},
  "Alemania":       {f:"🇩🇪",g:"E",r:10,e:1942},
  "Croacia":        {f:"🇭🇷",g:"L",r:11,e:1935},
  "Colombia":       {f:"🇨🇴",g:"K",r:12,e:1882},
  "México":         {f:"🇲🇽",g:"A",r:14,e:1842},
  "Noruega":        {f:"🇳🇴",g:"I",r:15,e:1835},
  "Uruguay":        {f:"🇺🇾",g:"H",r:16,e:1828},
  "EE.UU.":         {f:"🇺🇸",g:"D",r:17,e:1822},
  "Japón":          {f:"🇯🇵",g:"F",r:18,e:1815},
  "Suiza":          {f:"🇨🇭",g:"B",r:20,e:1798},
  "Senegal":        {f:"🇸🇳",g:"I",r:21,e:1788},
  "Corea del Sur":  {f:"🇰🇷",g:"A",r:22,e:1785},
  "Austria":        {f:"🇦🇹",g:"J",r:23,e:1778},
  "Suecia":         {f:"🇸🇪",g:"F",r:24,e:1768},
  "Australia":      {f:"🇦🇺",g:"D",r:25,e:1762},
  "Irán":           {f:"🇮🇷",g:"G",r:26,e:1752},
  "Chequia":        {f:"🇨🇿",g:"A",r:28,e:1742},
  "Costa de Marfil":{f:"🇨🇮",g:"E",r:29,e:1738},
  "Turquía":        {f:"🇹🇷",g:"D",r:30,e:1732},
  "Canadá":         {f:"🇨🇦",g:"B",r:30,e:1728},
  "Egipto":         {f:"🇪🇬",g:"G",r:32,e:1722},
  "Túnez":          {f:"🇹🇳",g:"F",r:34,e:1712},
  "Catar":          {f:"🇶🇦",g:"B",r:37,e:1692},
  "Escocia":        {f:"🏴󠁧󠁢󠁳󠁣󠁴󠁿",g:"C",r:39,e:1685},
  "Ecuador":        {f:"🇪🇨",g:"E",r:43,e:1672},
  "Argelia":        {f:"🇩🇿",g:"J",r:44,e:1668},
  "Paraguay":       {f:"🇵🇾",g:"D",r:52,e:1645},
  "Arabia Saudita": {f:"🇸🇦",g:"H",r:53,e:1638},
  "Bosnia y Herz.": {f:"🇧🇦",g:"B",r:55,e:1638},
  "Sudáfrica":      {f:"🇿🇦",g:"A",r:58,e:1620},
  "Congo DR":       {f:"🇨🇩",g:"K",r:59,e:1622},
  "Ghana":          {f:"🇬🇭",g:"L",r:60,e:1618},
  "Irak":           {f:"🇮🇶",g:"I",r:62,e:1612},
  "Haití":          {f:"🇭🇹",g:"C",r:71,e:1592},
  "Cabo Verde":     {f:"🇨🇻",g:"H",r:73,e:1588},
  "Uzbekistán":     {f:"🇺🇿",g:"K",r:75,e:1578},
  "Panamá":         {f:"🇵🇦",g:"L",r:78,e:1572},
  "Jordania":       {f:"🇯🇴",g:"J",r:86,e:1552},
  "Curazao":        {f:"🇨🇼",g:"E",r:88,e:1548},
  "Nueva Zelanda":  {f:"🇳🇿",g:"G",r:98,e:1538},
};

const NAMES = Object.keys(TEAMS).sort((a,b) => TEAMS[a].r - TEAMS[b].r);
const groups = {};
NAMES.forEach(n => { const g = TEAMS[n].g; if (!groups[g]) groups[g] = []; groups[g].push(n); });

const BG="#080c14",S1="#0f1623",S2="#161f30",BRD="#1e2d47",
      TXT="#dde4f0",MUTED="#6b7a96",GOLD="#f0b429",
      BLUE="#3b82f6",RED="#ef4444",ACC="#3b6fd4",PUR="#a78bfa",GREEN="#34d399";

export default function App() {
  const [na, setNa] = useState(null);
  const [nb, setNb] = useState(null);
  const [cw, setCw] = useState(1);
  const [cp, setCp] = useState(1);
  const [cr, setCr] = useState(1);
  const [result, setResult] = useState(null);
  const [mc, setMc] = useState(null);
  const [narrative, setNarrative] = useState("");
  const [loading, setLoading] = useState(false);
  const [mcLoading, setMcLoading] = useState(false);
  const [error, setError] = useState(null);

  const canSim = na && nb && na !== nb && !loading;

  const runSim = useCallback(async () => {
    if (!canSim) return;
    setLoading(true); setResult(null); setMc(null); setNarrative(""); setError(null);
    try {
      const { data } = await axios.post(SIMULATE_URL, {
        teamA: na, teamB: nb,
        context: { weather: cw, phase: cp, rest: cr }
      });
      setResult(data);
      setNarrative("Generando análisis...");
      try {
        const resp = await fetch(`${API}/api/narrative`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        });
        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let text = "";
        setNarrative("");
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const lines = decoder.decode(value).split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ") && line !== "data: [DONE]") {
              try { text += JSON.parse(line.slice(6)).text; setNarrative(text); } catch {}
            }
          }
        }
      } catch { setNarrative("Análisis no disponible."); }
    } catch (err) {
      setError("Error al simular. Intenta de nuevo.");
    } finally { setLoading(false); }
  }, [na, nb, cw, cp, cr, canSim]);

  const doMC = useCallback(async () => {
    if (!result) return;
    setMcLoading(true);
    try {
      const { data } = await axios.post(MC_URL, {
        muA: result.model.muA,
        muB: result.model.muB,
        isKnockout: cp >= 1.05,
        eloA: result.teams.a.elo,
        eloB: result.teams.b.elo
      });
      setMc(data);
    } catch {} finally { setMcLoading(false); }
  }, [result]);

  const reset = () => { setResult(null); setMc(null); setNarrative(""); setError(null); };

  const sl = (label, opts, val, set) => (
    <div>
      <div style={{fontSize:9,color:MUTED,letterSpacing:2,textTransform:"uppercase",marginBottom:3}}>{label}</div>
      <select style={{width:"100%",background:S2,color:TXT,border:`1px solid ${BRD}`,borderRadius:5,padding:"7px 4px",fontSize:11}}
        value={val} onChange={e => set(parseFloat(e.target.value))}>
        {opts.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  );

  return (
    <div style={{fontFamily:"system-ui,sans-serif",background:BG,minHeight:"100vh",color:TXT,paddingBottom:32}}>

      {/* HEADER */}
      <div style={{background:"linear-gradient(90deg,#1a3a6b,#0a1f45,#1a3a6b)",borderBottom:`2px solid ${GOLD}`,padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{fontWeight:900,fontSize:15,letterSpacing:2,color:"#fff"}}>⚽ FIFA <span style={{color:GOLD}}>WC 2026™</span></div>
        <div style={{fontSize:10,color:"#8aacdb",textAlign:"right",lineHeight:1.5}}>Dixon-Coles · Elo · IA<br/>48 equipos · Supabase</div>
      </div>

      {/* HERO */}
      <div style={{background:"linear-gradient(180deg,#09131f,#0a1528)",borderBottom:`1px solid ${BRD}`,padding:"18px 14px",textAlign:"center"}}>
        <div style={{fontWeight:900,fontSize:24,color:"#fff",marginBottom:3}}>
          Simulador <em style={{color:GOLD,fontStyle:"normal"}}>Avanzado</em>
        </div>
        <div style={{fontSize:11,color:MUTED}}>Datos reales · Modelos estadísticos · Análisis IA</div>
      </div>

      {/* PICKER */}
      <div style={{background:S1,borderBottom:`1px solid ${BRD}`,padding:14}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 30px 1fr",gap:8,alignItems:"end",marginBottom:10}}>
          <div>
            <div style={{fontSize:10,color:MUTED,letterSpacing:3,textTransform:"uppercase",marginBottom:4}}>🏠 Local</div>
            <select style={{width:"100%",background:S2,color:na?TXT:MUTED,border:`1px solid ${na?ACC:BRD}`,borderRadius:6,padding:"10px 6px",fontSize:14,fontWeight:na?700:400}}
              value={na||""} onChange={e=>{setNa(e.target.value||null);reset();}}>
              <option value="">— Elige local —</option>
              {Object.entries(groups).sort().map(([g,gT])=>(
                <optgroup key={g} label={`Grupo ${g}`}>
                  {gT.map(n=><option key={n} value={n}>{TEAMS[n].f} {n}</option>)}
                </optgroup>
              ))}
            </select>
          </div>
          <div style={{textAlign:"center",fontSize:15,fontWeight:700,color:MUTED,paddingBottom:6}}>VS</div>
          <div>
            <div style={{fontSize:10,color:MUTED,letterSpacing:3,textTransform:"uppercase",marginBottom:4}}>✈️ Visitante</div>
            <select style={{width:"100%",background:S2,color:nb?TXT:MUTED,border:`1px solid ${nb?ACC:BRD}`,borderRadius:6,padding:"10px 6px",fontSize:14,fontWeight:nb?700:400}}
              value={nb||""} onChange={e=>{setNb(e.target.value||null);reset();}}>
              <option value="">— Elige visitante —</option>
              {Object.entries(groups).sort().map(([g,gT])=>(
                <optgroup key={g} label={`Grupo ${g}`}>
                  {gT.filter(n=>n!==na).map(n=><option key={n} value={n}>{TEAMS[n].f} {n}</option>)}
                </optgroup>
              ))}
            </select>
          </div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginBottom:10}}>
          {sl("Condición",[[1,"Normal"],[0.95,"Calor"],[0.97,"Lluvia"],[0.92,"Altitud CDMX"]],cw,setCw)}
          {sl("Fase",[[1,"Grupos"],[1.05,"32avos"],[1.07,"16avos"],[1.09,"Cuartos"],[1.12,"Semifinal"],[1.15,"Final"]],cp,setCp)}
          {sl("Descanso",[[1,"Normal"],[0.96,"Corto"],[0.92,"Mínimo"]],cr,setCr)}
        </div>

        {error && <div style={{background:"rgba(239,68,68,.1)",border:`1px solid ${RED}`,borderRadius:6,padding:"8px 12px",marginBottom:10,fontSize:12,color:RED}}>{error}</div>}

        <button
          style={{width:"100%",background:canSim?"linear-gradient(135deg,#1e4fc2,#0d2d7a)":S2,border:`1px solid ${canSim?ACC:BRD}`,color:canSim?"#fff":MUTED,fontWeight:700,fontSize:14,letterSpacing:2,padding:"12px",borderRadius:6,cursor:canSim?"pointer":"default",marginBottom:8}}
          onClick={runSim} disabled={!canSim}>
          {loading?"⏳ Simulando...":!na||!nb?"Elige los dos equipos":"▶ SIMULAR PARTIDO"}
        </button>

        {result && !loading && (
          <div style={{display:"flex",gap:8}}>
            <button style={{flex:1,background:"transparent",border:`1px solid ${BRD}`,color:MUTED,fontSize:11,padding:"8px",borderRadius:6,cursor:"pointer"}} onClick={reset}>↺ Reiniciar</button>
            <button style={{flex:1,background:"transparent",border:`1px solid ${BRD}`,color:MUTED,fontSize:11,padding:"8px",borderRadius:6,cursor:"pointer",opacity:mcLoading?.5:1}} onClick={doMC} disabled={mcLoading}>{mcLoading?"⏳...":"🎲 Monte Carlo 50k"}</button>
          </div>
        )}
      </div>

      {/* RESULT */}
      {result && (
        <div style={{padding:"0 14px",maxWidth:540,margin:"0 auto"}}>
          {/* Scoreboard */}
          <div style={{background:"linear-gradient(180deg,#0b1525,#0f1623)",borderBottom:`1px solid ${BRD}`,padding:"22px 12px 14px",textAlign:"center",marginBottom:12}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"center"}}>
              <div style={{flex:1,textAlign:"center"}}>
                <div style={{fontSize:38,marginBottom:4}}>{TEAMS[na]?.f}</div>
                <div style={{fontSize:12,fontWeight:700,letterSpacing:1,textTransform:"uppercase"}}>{na}</div>
              </div>
              <div style={{minWidth:110,display:"flex",flexDirection:"column",alignItems:"center"}}>
                <div style={{display:"flex",alignItems:"center",gap:2}}>
                  <div style={{fontSize:66,fontWeight:900,width:46,textAlign:"center",lineHeight:1,color:"#fff"}}>{result.result.ga}</div>
                  <div style={{fontSize:46,fontWeight:300,color:BRD}}>:</div>
                  <div style={{fontSize:66,fontWeight:900,width:46,textAlign:"center",lineHeight:1,color:"#fff"}}>{result.result.gb}</div>
                </div>
                <div style={{fontSize:11,color:GOLD,marginTop:5}}>
                  {result.result.ga>result.result.gb?`Victoria ${na}`:result.result.gb>result.result.ga?`Victoria ${nb}`:"Empate"}
                </div>
                {result.result.extraTime && (
                  <div style={{fontSize:10,color:'#93c5fd',marginTop:3}}>
                    {result.result.penalties
                      ? `⚽ Penales — Gana ${result.result.penaltyWinner==='a'?na:nb}`
                      : '⏱ Prórroga'}
                  </div>
                )}  
                              <div style={{background:"rgba(59,111,212,.07)",border:`1px solid ${ACC}`,borderRadius:5,padding:"8px 12px",marginTop:10,fontSize:11,color:"#93c5fd",textAlign:"center",lineHeight:1.8}}>
                  <span style={{color:BLUE,fontWeight:700}}>{na}</span> μ={result.model.muA} · <span style={{color:RED,fontWeight:700}}>{nb}</span> μ={result.model.muB} · <span style={{color:GOLD}}>Goles esperados: {result.model.expectedGoals}</span>
                </div>
              </div>
              <div style={{flex:1,textAlign:"center"}}>
                <div style={{fontSize:38,marginBottom:4}}>{TEAMS[nb]?.f}</div>
                <div style={{fontSize:12,fontWeight:700,letterSpacing:1,textTransform:"uppercase"}}>{nb}</div>
              </div>
            </div>
            <div style={{marginTop:10,display:"flex",flexDirection:"column",gap:4}}>
              {result.events?.map((ev,i)=>(
                <div key={i} style={{display:"inline-flex",alignItems:"center",gap:5,border:`1px solid ${BRD}`,borderRadius:20,padding:"2px 10px",fontSize:12,alignSelf:"center",color:TXT}}>
                  <span style={{color:GOLD,fontWeight:700,fontSize:10}}>{ev.min}'</span>
                  {ev.team==='a'?TEAMS[na]?.f:TEAMS[nb]?.f} {ev.player} {ev.type==='setpiece'?'🚩':'⚽'}
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div style={{fontSize:10,color:MUTED,letterSpacing:3,textTransform:"uppercase",borderLeft:`2px solid ${GOLD}`,paddingLeft:7,margin:"14px 0 8px"}}>Estadísticas</div>
          <div style={{background:S1,border:`1px solid ${BRD}`,borderRadius:8,padding:"12px 14px",marginBottom:10}}>
            {[
              {lbl:"Posesión",a:`${result.stats.possession.a}%`,b:`${result.stats.possession.b}%`,wA:result.stats.possession.a},
              {lbl:"xG",a:result.stats.xg.a,b:result.stats.xg.b,wA:Math.round(result.stats.xg.a/(result.stats.xg.a+result.stats.xg.b)*100)},
              {lbl:"Remates",a:result.stats.shots.a,b:result.stats.shots.b,wA:Math.round(result.stats.shots.a/(result.stats.shots.a+result.stats.shots.b)*100)},
              {lbl:"PPDA",a:result.stats.ppda.a,b:result.stats.ppda.b,wA:100-Math.round(result.stats.ppda.a/(result.stats.ppda.a+result.stats.ppda.b)*100)},
            ].map((r,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:i===3?0:8}}>
                <div style={{fontSize:12,fontWeight:700,minWidth:34,textAlign:"center",color:BLUE}}>{r.a}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:9,color:MUTED,textAlign:"center",marginBottom:2}}>{r.lbl}</div>
                  <div style={{height:5,borderRadius:3,background:S2,display:"flex",overflow:"hidden"}}>
                    <div style={{width:`${r.wA}%`,background:"#2563eb",borderRadius:"3px 0 0 3px"}}></div>
                    <div style={{width:`${100-r.wA}%`,background:"#dc2626",borderRadius:"0 3px 3px 0"}}></div>
                  </div>
                </div>
                <div style={{fontSize:12,fontWeight:700,minWidth:34,textAlign:"center",color:RED}}>{r.b}</div>
              </div>
            ))}
          </div>

          {/* Corners */}
          <div style={{fontSize:10,color:MUTED,letterSpacing:3,textTransform:"uppercase",borderLeft:`2px solid ${GOLD}`,paddingLeft:7,margin:"14px 0 8px"}}>Esquinas</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
            {[{flag:TEAMS[na]?.f,name:na,c1:result.corners.c1a,c2:result.corners.c2a,ct:result.corners.cta,col:BLUE},{flag:TEAMS[nb]?.f,name:nb,c1:result.corners.c1b,c2:result.corners.c2b,ct:result.corners.ctb,col:RED}].map((t,i)=>(
              <div key={i} style={{background:S2,border:`1px solid ${BRD}`,borderRadius:7,padding:10}}>
                <div style={{fontSize:12,fontWeight:600,marginBottom:8,display:"flex",alignItems:"center",gap:5,color:TXT}}><span style={{fontSize:18}}>{t.flag}</span>{t.name}</div>
                <div style={{display:"flex",gap:6,marginBottom:6}}>
                  {[{l:"1ª",v:t.c1},{l:"2ª",v:t.c2}].map((h,j)=>(
                    <div key={j} style={{flex:1,background:S1,border:`1px solid ${BRD}`,borderRadius:5,padding:5,textAlign:"center"}}>
                      <div style={{fontSize:9,color:MUTED,textTransform:"uppercase",marginBottom:2}}>{h.l}</div>
                      <div style={{fontSize:22,fontWeight:900,color:TXT}}>{h.v}</div>
                    </div>
                  ))}
                </div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontSize:10,color:MUTED}}>Total</span>
                  <span style={{fontSize:18,fontWeight:900,color:t.col}}>{t.ct}</span>
                </div>
              </div>
            ))}
          </div>
          <div style={{background:S1,border:`1px solid ${BRD}`,borderRadius:8,padding:"9px 14px",marginBottom:10}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <span style={{fontSize:11,color:MUTED}}>Total esquinas partido</span>
              <span style={{fontSize:22,fontWeight:900,color:TXT}}>{result.corners.total}</span>
            </div>
          </div>

          {/* Elo */}
          <div style={{fontSize:10,color:MUTED,letterSpacing:3,textTransform:"uppercase",borderLeft:`2px solid ${GOLD}`,paddingLeft:7,margin:"14px 0 8px"}}>Modelo Elo</div>
          <div style={{background:S1,border:`1px solid ${BRD}`,borderRadius:8,padding:"12px 14px",marginBottom:10}}>
            <div style={{display:"flex",gap:6,alignItems:"center"}}>
              <div style={{flex:1,background:S2,borderRadius:6,padding:9,textAlign:"center"}}>
                <div style={{fontSize:10,color:MUTED,marginBottom:2}}>{na}</div>
                <div style={{fontSize:24,fontWeight:900,color:PUR}}>{result.teams.a.elo}</div>
                <div style={{fontSize:9,color:MUTED}}>FIFA #{result.teams.a.rank}</div>
              </div>
              <div style={{textAlign:"center",minWidth:64}}>
                <div style={{fontSize:16,fontWeight:700,color:TXT}}>{result.teams.a.elo-result.teams.b.elo>0?"+":""}{result.teams.a.elo-result.teams.b.elo}</div>
                <div style={{fontSize:9,color:MUTED}}>ventaja Elo</div>
              </div>
              <div style={{flex:1,background:S2,borderRadius:6,padding:9,textAlign:"center"}}>
                <div style={{fontSize:10,color:MUTED,marginBottom:2}}>{nb}</div>
                <div style={{fontSize:24,fontWeight:900,color:PUR}}>{result.teams.b.elo}</div>
                <div style={{fontSize:9,color:MUTED}}>FIFA #{result.teams.b.rank}</div>
              </div>
            </div>
          </div>

{/* Monte Carlo */}
          {mc && (
            <div style={{padding:"0 0"}}>
              <div style={{fontSize:10,color:MUTED,letterSpacing:3,textTransform:"uppercase",borderLeft:`2px solid ${GOLD}`,paddingLeft:7,margin:"14px 0 8px"}}>Monte Carlo — 50.000 simulaciones</div>
              <div style={{background:S1,border:`1px solid ${BRD}`,borderRadius:8,padding:"12px 14px",marginBottom:10}}>
                <div style={{background:"rgba(59,111,212,.07)",border:`1px solid ${ACC}`,borderRadius:5,padding:"7px 10px",marginBottom:10,fontSize:11,color:"#93c5fd",lineHeight:1.5}}>
                  💡 Distribución de 50.000 partidos con los mismos λ. El marcador individual es una muestra de esta distribución.
                </div>
                <div style={{display:"flex",gap:6,marginBottom:10}}>
                  {[{l:na,v:mc.probabilities.winA,col:BLUE},{l:"Empate",v:mc.probabilities.draw,col:GOLD},{l:nb,v:mc.probabilities.winB,col:RED}].map((x,i)=>(
                    <div key={i} style={{flex:1,background:S2,borderRadius:6,padding:9,textAlign:"center"}}>
                      <div style={{fontSize:10,color:MUTED,marginBottom:2}}>{x.l}</div>
                      <div style={{fontSize:20,fontWeight:900,color:x.col}}>{x.v}%</div>
                    </div>
                  ))}
                </div>
                <div style={{background:"rgba(240,180,41,.08)",border:`1px solid ${GOLD}`,borderRadius:6,padding:"10px 14px",marginBottom:10,textAlign:"center"}}>
                  <div style={{fontSize:10,color:MUTED,letterSpacing:2,textTransform:"uppercase",marginBottom:4}}>Marcador más probable</div>
                  <div style={{fontSize:28,fontWeight:900,color:GOLD}}>{mc.mostLikelyScore?.ga} — {mc.mostLikelyScore?.gb}</div>
                  <div style={{fontSize:11,color:MUTED,marginTop:2}}>{mc.mostLikelyScore?.pct}% de 50.000 simulaciones</div>
                </div>
                <div style={{fontSize:10,color:MUTED,marginBottom:6}}>Marcadores más frecuentes</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:5}}>
                  {mc.topScores.map(({score,pct},i)=>(
                    <div key={i} style={{background:S2,borderRadius:5,padding:"6px 4px",textAlign:"center"}}>
                      <div style={{fontSize:15,fontWeight:700,color:TXT}}>{score}</div>
                      <div style={{fontSize:9,color:MUTED,marginTop:1}}>{pct}%</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Narrative */}
          {narrative && (
            <>
              <div style={{fontSize:10,color:MUTED,letterSpacing:3,textTransform:"uppercase",borderLeft:`2px solid ${GOLD}`,paddingLeft:7,margin:"14px 0 8px"}}>Análisis de la IA</div>
              <div style={{background:S1,border:"1px solid #2a4a7f",borderRadius:8,padding:"14px",marginBottom:10,position:"relative"}}>
                <div style={{position:"absolute",top:9,right:11,fontSize:9,color:ACC,letterSpacing:1}}>ANÁLISIS · CLAUDE</div>
                <div style={{fontSize:13,lineHeight:1.8,color:"#b8c8e4",whiteSpace:"pre-wrap"}}>{narrative}</div>
              </div>
            </>
          )}

          <div style={{fontSize:10,color:MUTED,textAlign:"center",borderTop:`1px solid ${BRD}`,paddingTop:12,lineHeight:1.7,marginTop:8}}>
            Dixon-Coles · Elo FIFA Jun 2026 · Monte Carlo 50k · Supabase · Solo simulación estadística
          </div>
        </div>
      )}
    </div>
  );
}
