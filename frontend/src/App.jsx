import { useState, useEffect, useMemo } from "react";
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

// ── CONFIGURAÇÕES ────────────────────────────────────────────────────────────
const API_URL = "http://localhost:8000";

async function fetchDados(rota) {
  try {
    const resposta = await fetch(`${API_URL}${rota}`);
    if (!resposta.ok) return [];
    const json = await resposta.json();
    return json.dados || [];
  } catch (err) {
    console.error(`Erro ao buscar ${rota}:`, err);
    return [];
  }
}

const formatarMoeda = (v) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    v || 0
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

// ── COMPONENTES DE UI ────────────────────────────────────────────────────────
const Cabecalho = ({ titulo, onVoltar, admin }) => (
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

const CardKpi = ({ label, valor, cor }) => (
  <div style={{ ...estilos.cardKpi, borderTop: `4px solid ${cor}` }}>
    <p style={estilos.kpiLabel}>{label}</p>
    <p style={{ ...estilos.kpiValor, color: "#ffffff" }}>{valor || "—"}</p>
  </div>
);

const GraficoCard = ({ titulo, children, descricao }) => (
  <div style={estilos.graficoCard}>
    <h3 style={estilos.graficoTitulo}>{titulo}</h3>
    {descricao && <p style={estilos.graficoDescricao}>{descricao}</p>}
    <div style={{ minHeight: "250px", width: "100%" }}>{children}</div>
  </div>
);

// PAINEL DO CLIENTE

function PainelCliente({ onVoltar }) {
  const [cmo, setCmo] = useState([]);
  const [matriz, setMatriz] = useState([]);

  useEffect(() => {
    fetchDados("/api/insights/tendencia-custo-marginal").then(setCmo);
    fetchDados("/api/dashboard/matriz-energetica").then(setMatriz);
  }, []);

  return (
    <div style={estilos.pagina}>
      <Cabecalho titulo="Área do Cliente" onVoltar={onVoltar} />
      <div style={estilos.conteudo}>
        <GraficoCard titulo="Tendência Histórica de Custos (CMO)">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={Array.isArray(cmo) ? cmo : []}>
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

        <GraficoCard titulo="Matriz Energética por Subsistema">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={Array.isArray(matriz) ? matriz : []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="subsistema" tick={{ fill: "#94a3b8" }} />
              <Tooltip
                contentStyle={estilos.tooltip}
                itemStyle={{ color: "#fff" }}
                labelStyle={{ color: "#fff" }}
              />
              <Legend />
              <Bar
                dataKey="hidrica"
                name="Hídrica"
                stackId="a"
                fill={CORES.AZUL}
              />
              <Bar
                dataKey="termica"
                name="Térmica"
                stackId="a"
                fill={CORES.LARANJA}
              />
              <Bar
                dataKey="eolica"
                name="Eólica"
                stackId="a"
                fill={CORES.VERDE}
              />
              <Bar
                dataKey="solar"
                name="Solar"
                stackId="a"
                fill={CORES.AMARELO}
              />
            </BarChart>
          </ResponsiveContainer>
        </GraficoCard>
      </div>
    </div>
  );
}

// PAINEL ADMINISTRATIVO

function PainelAdmin({ onVoltar }) {
  // Dados vindos diretamente da API
  const [kpis, setKpis] = useState(null);
  const [usinas, setUsinas] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [desvioDados, setDesvioDados] = useState([]);
  const [cmoGrowth, setCmoGrowth] = useState([]);
  const [matrizPct, setMatrizPct] = useState([]);
  const [variabilidade, setVariabilidade] = useState([]);

  // Controles de UI
  const [metricaDinamica, setMetricaDinamica] = useState("real");
  const [mesDinamico, setMesDinamico] = useState("Todos");

  useEffect(() => {
    fetchDados("/api/admin/kpis").then(setKpis);
    fetchDados("/api/admin/ranking-usinas").then(setUsinas);
    fetchDados("/api/admin/alertas").then(setAlertas);
    fetchDados("/api/admin/grafico-desvio").then(setDesvioDados);
    fetchDados("/api/admin/cmo-growth").then(setCmoGrowth);
    fetchDados("/api/admin/matriz-percentual").then(setMatrizPct);
    fetchDados("/api/admin/variabilidade-usinas").then(setVariabilidade);
  }, []);

  const mesesOptions = useMemo(() => {
    const meses = (Array.isArray(desvioDados) ? desvioDados : [])
      .map((d) => d.mes)
      .filter(Boolean);
    return ["Todos", ...new Set(meses)];
  }, [desvioDados]);

  const filtradosDinamicos = useMemo(() => {
    return (Array.isArray(desvioDados) ? desvioDados : []).filter(
      (d) => mesDinamico === "Todos" || d.mes === mesDinamico
    );
  }, [desvioDados, mesDinamico]);

  return (
    <div style={estilos.pagina}>
      <Cabecalho titulo="Painel Administrativo" onVoltar={onVoltar} admin />
      <div style={estilos.conteudo}>
        {/* KPIs */}
        <div style={estilos.gridKpis}>
          <CardKpi
            label="CMO Médio"
            valor={kpis?.cmo_atual ? formatarMoeda(kpis.cmo_atual) : "—"}
            cor={CORES.LARANJA}
          />
          <CardKpi
            label="Variação"
            valor={
              kpis?.variacao_cmo_pct != null
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

        {/* Alertas */}
        <div style={{ marginBottom: 25 }}>
          {Array.isArray(alertas) &&
            alertas.map((a, i) => (
              <div
                key={i}
                style={{
                  background: a.tipo === "critical" ? "#451a1a" : "#1e293b",
                  borderLeft: `4px solid ${
                    a.tipo === "critical" ? CORES.VERMELHO : CORES.AZUL
                  }`,
                  padding: 12,
                  borderRadius: 6,
                  marginBottom: 8,
                  fontSize: 13,
                  color: "#fff",
                }}
              >
                {a.msg}
              </div>
            ))}
        </div>

        {/* Variabilidade */}
        <GraficoCard titulo="Variabilidade de Custo por Usina (R$/MWh)">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={Array.isArray(variabilidade) ? variabilidade : []}
              layout="vertical"
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#334155"
                horizontal={false}
              />
              <XAxis type="number" tick={{ fill: "#94a3b8" }} />
              <YAxis
                dataKey="usina"
                type="category"
                tick={{ fill: "#94a3b8" }}
                width={100}
              />
              <Tooltip
                contentStyle={estilos.tooltip}
                itemStyle={{ color: "#fff" }}
                labelStyle={{ color: "#fff" }}
              />
              <Bar dataKey="min" name="Mínimo" stackId="a" fill={CORES.VERDE} />
              <Bar
                dataKey="variacao"
                name="Variabilidade"
                stackId="a"
                fill={CORES.VERMELHO}
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </GraficoCard>

        {/* Desvio*/}
        <GraficoCard titulo="Desvio Mensal (Economia vs Estouro)">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={Array.isArray(desvioDados) ? desvioDados : []}>
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
              <Bar dataKey="desvio" name="Desvio">
                {(Array.isArray(desvioDados) ? desvioDados : []).map((d, i) => (
                  <Cell
                    key={i}
                    fill={d.desvio <= 0 ? CORES.VERDE : CORES.VERMELHO}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </GraficoCard>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))",
            gap: "20px",
          }}
        >
          {/* Crescimento CMO */}
          <GraficoCard titulo="Variação Anual CMO (%)">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={Array.isArray(cmoGrowth) ? cmoGrowth : []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="ano" tick={{ fill: "#94a3b8" }} />
                <Tooltip
                  contentStyle={estilos.tooltip}
                  itemStyle={{ color: "#fff" }}
                  labelStyle={{ color: "#fff" }}
                />
                <Bar
                  dataKey="crescimento"
                  fill={CORES.AZUL}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </GraficoCard>

          {/* Matriz percentual*/}
          <GraficoCard titulo="Vulnerabilidade Térmica por Subsistema (%)">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={Array.isArray(matrizPct) ? matrizPct : []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="subsistema" tick={{ fill: "#94a3b8" }} />
                <YAxis unit="%" tick={{ fill: "#94a3b8" }} />
                <Tooltip
                  contentStyle={estilos.tooltip}
                  itemStyle={{ color: "#fff" }}
                  labelStyle={{ color: "#fff" }}
                />
                <Legend />
                <Bar
                  dataKey="renovavel_pct"
                  name="Renovável"
                  stackId="a"
                  fill={CORES.VERDE}
                />
                <Bar
                  dataKey="termica_pct"
                  name="Térmica"
                  stackId="a"
                  fill={CORES.LARANJA}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </GraficoCard>
        </div>

        {/* Explorador Dinâmico */}
        <GraficoCard titulo="🔍 Explorador Dinâmico de Métricas">
          <div style={estilos.barraFiltros}>
            <select
              style={estilos.select}
              value={metricaDinamica}
              onChange={(e) => setMetricaDinamica(e.target.value)}
            >
              <option value="real">Custo Real</option>
              <option value="previsto">Custo Previsto</option>
              <option value="desvio">Desvio</option>
            </select>
            <select
              style={estilos.select}
              value={mesDinamico}
              onChange={(e) => setMesDinamico(e.target.value)}
            >
              {mesesOptions.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={filtradosDinamicos}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="mes" tick={{ fill: "#94a3b8" }} />
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

        {/* Ranking de usinas */}
        <GraficoCard titulo="Ranking de Usinas Térmicas">
          <table style={estilos.tabela}>
            <thead>
              <tr>
                <th style={estilos.th}>Usina</th>
                <th style={estilos.th}>Sub</th>
                <th style={estilos.th}>Custo</th>
                <th style={estilos.th}>Criticidade</th>
              </tr>
            </thead>
            <tbody>
              {(Array.isArray(usinas) ? usinas : [])
                .slice(0, 10)
                .map((u, i) => (
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

function BadgeCriticidade({ criticidade }) {
  const cores = {
    Alta: CORES.VERMELHO,
    Média: CORES.LARANJA,
    Baixa: CORES.VERDE,
  };
  return (
    <span
      style={{
        color: cores[criticidade] || CORES.VERDE,
        fontWeight: "bold",
        fontSize: 12,
      }}
    >
      ● {criticidade}
    </span>
  );
}

export default function App() {
  const [tela, setTela] = useState("selecao");
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f172a",
        fontFamily: "sans-serif",
      }}
    >
      {tela === "selecao" && <TelaSelecao onSelecionar={setTela} />}
      {tela === "cliente" && (
        <PainelCliente onVoltar={() => setTela("selecao")} />
      )}
      {tela === "admin" && <PainelAdmin onVoltar={() => setTela("selecao")} />}
    </div>
  );
}

function TelaSelecao({ onSelecionar }) {
  return (
    <div style={estilos.paginaCentro}>
      <h1 style={estilos.titulo}>Dashboard ONS</h1>
      <div style={estilos.gridCards}>
        <div style={estilos.card} onClick={() => onSelecionar("cliente")}>
          <span style={{ fontSize: 36 }}>🏢</span>
          <h2 style={estilos.cardTitulo}>Cliente</h2>
          <span style={estilos.linkAcessar}>Entrar →</span>
        </div>
        <div style={estilos.card} onClick={() => onSelecionar("admin")}>
          <span style={{ fontSize: 36 }}>⚙️</span>
          <h2 style={estilos.cardTitulo}>Admin</h2>
          <span style={estilos.linkAcessar}>Entrar →</span>
        </div>
      </div>
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
    textAlign: "center",
  },
  pagina: { minHeight: "100vh", background: "#0f172a", color: "#f1f5f9" },
  conteudo: { maxWidth: 1200, margin: "0 auto", padding: "20px" },
  titulo: { fontSize: 42, color: "#f1f5f9", marginBottom: 30 },
  gridCards: { display: "flex", gap: 20 },
  card: {
    background: "#1e293b",
    padding: 30,
    borderRadius: 15,
    cursor: "pointer",
    width: 220,
    border: "1px solid #334155",
  },
  cardTitulo: { color: "#f1f5f9", marginTop: 15, fontSize: 18 },
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
  graficoTitulo: { fontSize: 15, color: "#cbd5e1", marginBottom: 5 },
  graficoDescricao: { fontSize: 12, color: "#64748b", marginBottom: 15 },
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
  barraFiltros: { display: "flex", gap: 15, marginBottom: 20 },
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
