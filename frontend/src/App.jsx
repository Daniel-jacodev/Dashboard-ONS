import { useState, useEffect } from 'react';
import { 
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

export default function App() {
  const [usinasCaras, setUsinasCaras] = useState([]);
  const [tendenciaCustos, setTendenciaCustos] = useState([]);
  const [matrizEnergetica, setMatrizEnergetica] = useState([]);
  const [historicoDemanda, setHistoricoDemanda] = useState([]);
  const [limite, setLimite] = useState(8);
  const [ano, setAno] = useState(2023);
  const [mes, setMes] = useState(12);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  useEffect(() => {
    fetch('http://localhost:8000/api/insights/tendencia-custo-marginal').then(res => res.json()).then(data => setTendenciaCustos(data.dados || []));
    fetch('http://localhost:8000/api/dashboard/matriz-energetica').then(res => res.json()).then(data => setMatrizEnergetica(data.dados || []));
  }, []);

  useEffect(() => {
    fetch(`http://localhost:8000/api/custos/termicas-mais-caras?limite=${limite}`).then(res => res.json()).then(data => setUsinasCaras(data.dados || []));
  }, [limite]);

  useEffect(() => {
    fetch(`http://localhost:8000/api/operacao/historico-demanda/${ano}/${mes}`).then(res => res.json()).then(data => setHistoricoDemanda(data.dados || []));
  }, [ano, mes]);

  const cardStyle = { background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 8px 16px rgba(0,0,0,0.08)', border: '1px solid #eee' };

  return (
    <div style={{ padding: '40px', backgroundColor: '#f8f9fa', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <header style={{ marginBottom: '30px' }}>
        <h1>Sistema de Inteligência ONS</h1>
        <p>Monitoramento e Análise de Custos Energéticos</p>
      </header>

      <div style={{ display: 'flex', gap: '20px', marginBottom: '25px', background: '#fff', padding: '15px', borderRadius: '8px' }}>
        <label>Mês: <select value={mes} onChange={e => setMes(e.target.value)}>{[1,2,3,4,5,6,7,8,9,10,11,12].map(m => <option key={m} value={m}>{m}</option>)}</select></label>
        <label>Ano: <select value={ano} onChange={e => setAno(e.target.value)}><option value="2023">2023</option><option value="2022">2022</option></select></label>
        <label>Qtd Usinas: <input type="range" min="3" max="15" value={limite} onChange={e => setLimite(e.target.value)} /> {limite}</label>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '25px' }}>
        <div style={cardStyle}>
          <h3>🔥 Usinas com Maior Custo Operacional</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer><BarChart data={usinasCaras} layout="vertical"><CartesianGrid strokeDasharray="3 3" /><XAxis type="number" /><YAxis dataKey="usina" type="category" width={120} fontSize={10} /><Tooltip /><Bar dataKey="custo_maximo" fill="#ff7675" name="R$/MWh" /></BarChart></ResponsiveContainer>
          </div>
        </div>

        <div style={cardStyle}>
          <h3>📉 Tendência de Custo Marginal</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer><AreaChart data={tendenciaCustos}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="ano" /><YAxis /><Tooltip /><Area type="monotone" dataKey="custo_medio_anual" stroke="#0984e3" fill="#74b9ff" name="Custo Médio" /></AreaChart></ResponsiveContainer>
          </div>
        </div>

        <div style={cardStyle}>
          <h3>⚡ Matriz Energética por Subsistema</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer><BarChart data={matrizEnergetica}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="subsistema" /><YAxis /><Tooltip /><Legend /><Bar dataKey="hidrica" stackId="a" fill="#0088FE" /><Bar dataKey="termica" stackId="a" fill="#FF8042" /><Bar dataKey="eolica" stackId="a" fill="#00C49F" /><Bar dataKey="solar" stackId="a" fill="#FFBB28" /></BarChart></ResponsiveContainer>
          </div>
        </div>

        <div style={cardStyle}>
          <h3>📊 Demanda por Subsistema</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer><PieChart><Pie data={historicoDemanda} dataKey="demanda_total" nameKey="subsistema" cx="50%" cy="50%" innerRadius={60} outerRadius={80} label>{historicoDemanda.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
