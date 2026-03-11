import { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

// ── CONFIGURAÇÕES E AUXILIARES ───────────────────────────────────────────────
const API_URL = "http://localhost:8000";

async function fetchDados(rota) {
  try {
    const resposta = await fetch(`${API_URL}${rota}`);
    const json = await resposta.json();
    return json.dados || [];
  } catch (err) {
    console.error(`Erro ao buscar ${rota}:`, err);
    return [];
  }
}

const formatarMoeda = (v) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    v
  );

const CORES = {
  AZUL: "#38bdf8",
  LARANJA: "#fb923c",
  VERDE: "#4ade80",
  AMARELO: "#facc15",
  ROXO: "#a855f7",
  VERMELHO: "#f87171",
  TEXTO: "#ffffff",
};

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTES REUTILIZÁVEIS
// ════════════════════════════════════════════════════════════════════════════
function Cabecalho({ titulo, onVoltar, admin }) {
  return (
    <header
      style={{
        ...estilos.cabecalho,
        borderBottom: `3px solid ${admin ? CORES.LARANJA : CORES.AZUL}`,
      }}
    >
      <button style={estilos.btnVoltar} onClick={onVoltar}>
        ← Voltar
      </button>
      <h1 style={estilos.cabecalhoTitulo}>⚡ ONS — {titulo}</h1>
    </header>
  );
}

function CardKpi({ label, valor, cor }) {
  return (
    <div style={{ ...estilos.cardKpi, borderTop: `4px solid ${cor}` }}>
      <p style={estilos.kpiLabel}>{label}</p>
      <p style={{ ...estilos.kpiValor, color: "#ffffff" }}>{valor}</p>
    </div>
  );
}

function GraficoCard({ titulo, children }) {
  return (
    <div style={estilos.graficoCard}>
      <h3 style={estilos.graficoTitulo}>{titulo}</h3>
      {children}
    </div>
  );
}

function BadgeCriticidade({ criticidade }) {
  const cores = {
    Alta: CORES.VERMELHO,
    Média: CORES.LARANJA,
    Baixa: CORES.VERDE,
  };
  return (
    <span
      style={{ color: cores[criticidade], fontWeight: "bold", fontSize: 12 }}
    >
      ● {criticidade}
    </span>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// PAINEL ADMINISTRATIVO COMPLETO
// ════════════════════════════════════════════════════════════════════════════
function PainelAdmin({ onVoltar }) {
  const [kpis, setKpis] = useState(null);
  const [usinas, setUsinas] = useState([]);
  const [realPrev, setRealPrev] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [cmo, setCmo] = useState([]);
  const [matriz, setMatriz] = useState([]);

  // Estados dos Filtros
  const [filtroAno, setFiltroAno] = useState("Todos");
  const [metricaDinamica, setMetricaDinamica] = useState("real");
  const [mesDinamico, setMesDinamico] = useState("Todos");

  useEffect(() => {
    fetchDados("/api/admin/kpis").then(setKpis);
    fetchDados("/api/admin/ranking-usinas").then(setUsinas);
    fetchDados("/api/admin/custo-real-vs-previsto").then(setRealPrev);
    fetchDados("/api/admin/alertas").then(setAlertas);
    fetchDados("/api/insights/tendencia-custo-marginal").then(setCmo);
    fetchDados("/api/dashboard/matriz-energetica").then(setMatriz);
  }, []);

  // ── PROCESSAMENTO DE DADOS ──
  const anos = ["Todos", ...new Set(realPrev.map((r) => r.ano))];
  const dadosProcessados = realPrev.map((r) => ({
    ...r,
    desvio: parseFloat((r.real - r.previsto).toFixed(2)),
  }));

  const realPrevFiltrado = dadosProcessados.filter(
    (r) => filtroAno === "Todos" || String(r.ano) === String(filtroAno)
  );

  const dadosCrescimento = cmo
    .map((d, i) => {
      if (i === 0) return { ano: d.ano, crescimento: 0 };
      const anterior = cmo[i - 1].custo_medio_anual;
      return {
        ano: d.ano,
        crescimento: parseFloat(
          (((d.custo_medio_anual - anterior) / anterior) * 100).toFixed(1)
        ),
      };
    })
    .slice(1);

  const mesesDisponiveis = ["Todos", ...new Set(realPrev.map((r) => r.mes))];
  const dadosFiltradosDinamicos = dadosProcessados.filter(
    (d) => mesDinamico === "Todos" || d.mes === mesDinamico
  );

  return (
    <div style={estilos.pagina}>
      <Cabecalho titulo="Painel Administrativo" onVoltar={onVoltar} admin />
      <div style={estilos.conteudo}>
        {/* 1. KPIs */}
        <div style={estilos.gridKpis}>
          <CardKpi
            label="CMO Médio"
            valor={kpis?.cmo_atual ? formatarMoeda(kpis.cmo_atual) : "—"}
            cor={CORES.LARANJA}
          />
          <CardKpi
            label="Variação CMO"
            valor={
              kpis?.variacao_cmo_pct !== undefined
                ? `${kpis.variacao_cmo_pct}%`
                : "0%"
            }
            cor={CORES.ROXO}
          />
          <CardKpi
            label="Renovável"
            valor={kpis?.renovavel_pct ? `${kpis.renovavel_pct}%` : "—"}
            cor={CORES.VERDE}
          />
          <CardKpi
            label="Subsistemas"
            valor={kpis?.total_subsistemas || "—"}
            cor={CORES.AZUL}
          />
        </div>

        {/* 2. Tendência CMO (Histórico) */}
        <GraficoCard titulo="Histórico de Tendência do CMO (R$/MWh)">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={cmo}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="ano" tick={{ fill: "#94a3b8" }} />
              <YAxis tick={{ fill: "#94a3b8" }} />
              <Tooltip
                contentStyle={estilos.tooltip}
                itemStyle={{ color: "#fff" }}
                labelStyle={{ color: "#fff" }}
                formatter={(v) => formatarMoeda(v)}
              />
              <Area
                dataKey="custo_medio_anual"
                stroke={CORES.AZUL}
                fill={CORES.AZUL}
                fillOpacity={0.2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </GraficoCard>

        {/* 3. Real vs Previsto */}
        <GraficoCard titulo="Custo Real vs Previsto">
          <div style={estilos.barraFiltros}>
            <select
              style={estilos.select}
              value={filtroAno}
              onChange={(e) => setFiltroAno(e.target.value)}
            >
              {anos.map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={realPrevFiltrado}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="mes" tick={{ fill: "#94a3b8" }} />
              <YAxis tick={{ fill: "#94a3b8" }} />
              <Tooltip
                contentStyle={estilos.tooltip}
                itemStyle={{ color: "#fff" }}
                labelStyle={{ color: "#fff" }}
              />
              <Legend />
              <Bar
                dataKey="real"
                name="Real"
                fill={CORES.AMARELO}
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="previsto"
                name="Previsto"
                fill={CORES.ROXO}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </GraficoCard>

        {/* 4. Desvio Orçamentário (Vibrante) */}
        <GraficoCard titulo="Análise de Desvio (Verde = Economia | Vermelho = Gasto Excessivo)">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dadosProcessados}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="mes" tick={{ fill: "#94a3b8" }} />
              <YAxis tick={{ fill: "#94a3b8" }} />
              <Tooltip
                contentStyle={estilos.tooltip}
                itemStyle={{ color: "#fff" }}
                labelStyle={{ color: "#fff" }}
                formatter={(v) => formatarMoeda(v)}
              />
              <ReferenceLine y={0} stroke="#94a3b8" />
              <Bar dataKey="desvio">
                {dadosProcessados.map((d, i) => (
                  <Cell
                    key={i}
                    fill={d.desvio <= 0 ? CORES.VERDE : CORES.VERMELHO}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </GraficoCard>

        {/* 5. Variação Anual % */}

        {/* 6. NOVO: FERRAMENTA DE ANÁLISE DINÂMICA */}
        <GraficoCard titulo="🔍 FERRAMENTA EXPLORATÓRIA (Filtro Personalizado)">
          <div
            style={{
              ...estilos.barraFiltros,
              background: "#0f172a",
              padding: "15px",
              borderRadius: "10px",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <label style={estilos.labelFiltro}>Métrica:</label>
              <select
                style={estilos.select}
                value={metricaDinamica}
                onChange={(e) => setMetricaDinamica(e.target.value)}
              >
                <option value="real">Custo Real</option>
                <option value="previsto">Custo Previsto</option>
                <option value="desvio">Desvio</option>
              </select>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <label style={estilos.labelFiltro}>Mês:</label>
              <select
                style={estilos.select}
                value={mesDinamico}
                onChange={(e) => setMesDinamico(e.target.value)}
              >
                {mesesDisponiveis.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dadosFiltradosDinamicos}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="mes" tick={{ fill: "#94a3b8" }} />
              <YAxis tick={{ fill: "#94a3b8" }} />
              <Tooltip
                contentStyle={estilos.tooltip}
                itemStyle={{ color: "#fff" }}
                labelStyle={{ color: "#fff" }}
                formatter={(v) => formatarMoeda(v)}
              />
              <Bar
                dataKey={metricaDinamica}
                fill={CORES.AZUL}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </GraficoCard>

        {/* 7. Ranking de Usinas */}
        <GraficoCard titulo="Ranking de Usinas">
          <table style={estilos.tabela}>
            <thead>
              <tr>
                <th style={estilos.th}>Usina</th>
                <th style={estilos.th}>Subsistema</th>
                <th style={estilos.th}>Custo Médio</th>
                <th style={estilos.th}>Criticidade</th>
              </tr>
            </thead>
            <tbody>
              {usinas.map((u, i) => (
                <tr key={i}>
                  <td style={estilos.td}>{u.usina}</td>
                  <td style={estilos.td}>{u.subsistema}</td>
                  <td style={estilos.td}>{formatarMoeda(u.custo_medio)}</td>
                  <td style={estilos.td}>
                    <BadgeCriticidade criticidade={u.criticidade} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </GraficoCard>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// APP PRINCIPAL E ESTILOS (IGUAIS AOS ANTERIORES)
// ════════════════════════════════════════════════════════════════════════════
function TelaSelecao({ onSelecionar }) {
  return (
    <div style={estilos.paginaCentro}>
      <h1 style={estilos.titulo}>Dashboard ONS</h1>
      <div style={estilos.gridCards}>
        <div style={estilos.card} onClick={() => onSelecionar("cliente")}>
          <span style={{ fontSize: 36 }}>🏢</span>
          <h2 style={estilos.cardTitulo}>Área do Cliente</h2>
          <span style={estilos.linkAcessar}>Acessar →</span>
        </div>
        <div style={estilos.card} onClick={() => onSelecionar("admin")}>
          <span style={{ fontSize: 36 }}>⚙️</span>
          <h2 style={estilos.cardTitulo}>Painel Administrativo</h2>
          <span style={estilos.linkAcessar}>Acessar →</span>
        </div>
      </div>
    </div>
  );
}

function PainelCliente({ onVoltar }) {
  return (
    <div style={estilos.pagina}>
      <Cabecalho titulo="Cliente" onVoltar={onVoltar} />
      <div style={estilos.conteudo}>
        <p>Consulte a versão Admin para os gráficos completos.</p>
      </div>
    </div>
  );
}

export default function App() {
  const [tela, setTela] = useState("selecao");
  return (
    <div style={{ minHeight: "100vh", background: "#0f172a" }}>
      {tela === "selecao" && <TelaSelecao onSelecionar={setTela} />}
      {tela === "cliente" && (
        <PainelCliente onVoltar={() => setTela("selecao")} />
      )}
      {tela === "admin" && <PainelAdmin onVoltar={() => setTela("selecao")} />}
    </div>
  );
}

const estilos = {
  paginaCentro: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: "#0f172a",
  },
  pagina: { minHeight: "100vh", background: "#0f172a", color: "#f1f5f9" },
  conteudo: { maxWidth: 1200, margin: "0 auto", padding: "20px" },
  titulo: { fontSize: 42, color: "#f1f5f9", marginBottom: 40 },
  gridCards: { display: "flex", gap: 20 },
  card: {
    background: "#1e293b",
    padding: 30,
    borderRadius: 15,
    cursor: "pointer",
    width: 280,
    border: "1px solid #334155",
    textAlign: "center",
  },
  cardTitulo: { color: "#f1f5f9", marginTop: 15 },
  linkAcessar: {
    color: CORES.AZUL,
    display: "block",
    marginTop: 15,
    fontWeight: "bold",
  },
  cabecalho: {
    background: "#1e293b",
    padding: "15px 30px",
    display: "flex",
    alignItems: "center",
    gap: 20,
  },
  btnVoltar: {
    background: "none",
    border: "1px solid #334155",
    color: "#94a3b8",
    padding: "8px 15px",
    borderRadius: 8,
    cursor: "pointer",
  },
  cabecalhoTitulo: { fontSize: 20, margin: 0 },
  gridKpis: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: 20,
    marginBottom: 30,
  },
  cardKpi: { background: "#1e293b", padding: 20, borderRadius: 10 },
  kpiLabel: { color: "#94a3b8", fontSize: 11, textTransform: "uppercase" },
  kpiValor: { fontSize: 24, fontWeight: "bold", margin: 0 },
  graficoCard: {
    background: "#1e293b",
    padding: 25,
    borderRadius: 12,
    border: "1px solid #334155",
    marginBottom: 25,
  },
  graficoTitulo: { fontSize: 15, marginBottom: 20, color: "#cbd5e1" },
  tooltip: {
    background: "#0f172a",
    border: "1px solid #334155",
    borderRadius: 8,
    padding: "10px",
  },
  select: {
    background: "#0f172a",
    color: "#f1f5f9",
    border: "1px solid #334155",
    padding: "10px",
    borderRadius: 8,
  },
  barraFiltros: { display: "flex", gap: 20, marginBottom: 25 },
  labelFiltro: { fontSize: 12, color: "#94a3b8" },
  tabela: { width: "100%", borderCollapse: "collapse" },
  th: {
    textAlign: "left",
    color: "#64748b",
    padding: 12,
    borderBottom: "1px solid #334155",
    fontSize: 11,
  },
  td: {
    padding: 12,
    borderBottom: "1px solid #263244",
    fontSize: 14,
    color: "#cbd5e1",
  },
};
