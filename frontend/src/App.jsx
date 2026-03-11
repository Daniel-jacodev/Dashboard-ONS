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

// ── CONFIGURAÇÕES GERAIS ─────────────────────────────────────────────────────
const API_URL = "http://localhost:8000";

/**
 * Função de busca com tratamento de erros (Dica de Robustez)
 * Evita que o app trave caso a API esteja fora do ar ou o banco carregando.
 */
async function fetchDados(rota) {
  try {
    const resposta = await fetch(`${API_URL}${rota}`);
    if (!resposta.ok) throw new Error(`Erro: ${resposta.status}`);
    const json = await resposta.json();
    return json.dados || []; // Garante que sempre retorne um array, mesmo vazio
  } catch (err) {
    console.error(`Falha ao buscar ${rota}:`, err);
    return []; // Retorno de segurança
  }
}

/**
 * Formatador de Moeda Brasileira (R$)
 */
const formatarMoeda = (valor) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    valor
  );

// ── PALETAS DE CORES ─────────────────────────────────────────────────────────
const CORES_MATRIZ = ["#3b82f6", "#f97316", "#22c55e", "#eab308"]; // Azul, Laranja, Verde, Amarelo
const CORES_SUBS = ["#6366f1", "#0ea5e9", "#f59e0b", "#10b981"]; // Indigo, Sky, Amber, Emerald

// ════════════════════════════════════════════════════════════════════════════
// TELA DE SELEÇÃO INICIAL
// ════════════════════════════════════════════════════════════════════════════
function TelaSelecao({ onSelecionar }) {
  return (
    <div style={estilos.paginaCentro}>
      <h1 style={estilos.titulo}>Dashboard ONS</h1>
      <p style={estilos.subtitulo}>Selecione seu perfil de acesso</p>
      <div style={estilos.gridCards}>
        <CardSelecao
          icone="🏢"
          titulo="Área do Cliente"
          descricao="Acompanhe a tendência de custos e a composição da matriz energética nacional."
          onClick={() => onSelecionar("cliente")}
        />
        <CardSelecao
          icone="⚙️"
          titulo="Painel Administrativo"
          descricao="Controle total: ranking de usinas, desvios orçamentários e alertas críticos."
          onClick={() => onSelecionar("admin")}
        />
      </div>
    </div>
  );
}

// Componente visual do Card de Seleção
function CardSelecao({ icone, titulo, descricao, onClick }) {
  return (
    <div style={estilos.card} onClick={onClick}>
      <span style={{ fontSize: 36 }}>{icone}</span>
      <h2 style={estilos.cardTitulo}>{titulo}</h2>
      <p style={estilos.cardDescricao}>{descricao}</p>
      <span style={estilos.linkAcessar}>Acessar →</span>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// PAINEL DO CLIENTE (Visão Simplificada)
// ════════════════════════════════════════════════════════════════════════════
function PainelCliente({ onVoltar }) {
  const [cmo, setCmo] = useState([]);
  const [matriz, setMatriz] = useState([]);

  useEffect(() => {
    fetchDados("/api/insights/tendencia-custo-marginal").then(setCmo);
    fetchDados("/api/dashboard/matriz-energetica").then(setMatriz);
  }, []);

  return (
    <div style={estilos.pagina}>
      <Cabecalho titulo="Visão do Cliente" onVoltar={onVoltar} />
      <div style={estilos.conteudo}>
        {/* Gráfico de Tendência (Área) */}
        <GraficoCard titulo="Tendência do Custo Marginal de Operação (CMO)">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={cmo}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="ano" tick={{ fill: "#94a3b8" }} />
              <YAxis
                tick={{ fill: "#94a3b8" }}
                tickFormatter={(v) => `R$ ${v}`}
              />
              <Tooltip
                contentStyle={estilos.tooltip}
                formatter={(v) => [formatarMoeda(v), "Custo"]}
              />
              <Area
                dataKey="custo_medio_anual"
                name="CMO"
                stroke="#3b82f6"
                fill="#1e3a5f"
              />
            </AreaChart>
          </ResponsiveContainer>
        </GraficoCard>

        {/* Matriz Energética (Barras Empilhadas) */}
        <GraficoCard titulo="Matriz Energética por Subsistema">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={matriz}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="subsistema" tick={{ fill: "#94a3b8" }} />
              <YAxis tick={{ fill: "#94a3b8" }} />
              <Tooltip contentStyle={estilos.tooltip} />
              <Legend />
              <Bar
                dataKey="hidrica"
                name="Hídrica"
                stackId="a"
                fill={CORES_MATRIZ[0]}
              />
              <Bar
                dataKey="termica"
                name="Térmica"
                stackId="a"
                fill={CORES_MATRIZ[1]}
              />
              <Bar
                dataKey="eolica"
                name="Eólica"
                stackId="a"
                fill={CORES_MATRIZ[2]}
              />
              <Bar
                dataKey="solar"
                name="Solar"
                stackId="a"
                fill={CORES_MATRIZ[3]}
              />
            </BarChart>
          </ResponsiveContainer>
        </GraficoCard>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// PAINEL ADMINISTRATIVO (Visão Analítica Completa)
// ════════════════════════════════════════════════════════════════════════════
function PainelAdmin({ onVoltar }) {
  // Estados para armazenar dados da API
  const [kpis, setKpis] = useState(null);
  const [usinas, setUsinas] = useState([]);
  const [realPrev, setRealPrev] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [cmo, setCmo] = useState([]);
  const [matriz, setMatriz] = useState([]);

  // Estados dos Filtros
  const [filtroSubsistema, setFiltroSubsistema] = useState("Todos");
  const [filtroAno, setFiltroAno] = useState("Todos");
  const [filtroUsina, setFiltroUsina] = useState("Todas");
  const [filtroCriticidade, setFiltroCriticidade] = useState("Todas");

  // Carregamento inicial de todos os dados
  useEffect(() => {
    fetchDados("/api/admin/kpis").then(setKpis);
    fetchDados("/api/admin/ranking-usinas").then(setUsinas);
    fetchDados("/api/admin/custo-real-vs-previsto").then(setRealPrev);
    fetchDados("/api/admin/alertas").then(setAlertas);
    fetchDados("/api/insights/tendencia-custo-marginal").then(setCmo);
    fetchDados("/api/dashboard/matriz-energetica").then(setMatriz);
  }, []);

  // ── LÓGICA DE FILTRAGEM (Lado do Cliente/Frontend) ─────────────────────────
  const subsistemas = ["Todos", ...new Set(usinas.map((u) => u.subsistema))];
  const anos = ["Todos", ...new Set(realPrev.map((r) => r.ano))];
  const nomeUsinas = ["Todas", ...usinas.map((u) => u.usina)];

  const usinasFiltradas = usinas.filter((u) => {
    const porSub =
      filtroSubsistema === "Todos" || u.subsistema === filtroSubsistema;
    const porNome = filtroUsina === "Todas" || u.usina === filtroUsina;
    const porCrit =
      filtroCriticidade === "Todas" || u.criticidade === filtroCriticidade;
    return porSub && porNome && porCrit;
  });

  const realPrevFiltrado = realPrev.filter(
    (r) => filtroAno === "Todos" || String(r.ano) === String(filtroAno)
  );

  // ── PROCESSAMENTO DE DADOS PARA GRÁFICOS ANALÍTICOS ──────────────────────────

  // 1. Desvio (Real - Previsto)
  const dadosDesvio = realPrevFiltrado.map((r) => ({
    mes: r.mes,
    desvio: parseFloat((r.real - r.previsto).toFixed(2)),
  }));

  // 2. Crescimento Anual do CMO (Variação %)
  const dadosCrescimento = cmo
    .map((d, i) => {
      if (i === 0) return { ano: d.ano, crescimento: 0 };
      const anterior = cmo[i - 1].custo_medio_anual;
      const variacao = parseFloat(
        (((d.custo_medio_anual - anterior) / anterior) * 100).toFixed(1)
      );
      return { ano: d.ano, crescimento: variacao };
    })
    .slice(1);

  // 3. Custo Médio por Subsistema (Agrupamento via JS)
  const custoSubsistema = Object.values(
    usinas.reduce((acc, u) => {
      if (!acc[u.subsistema])
        acc[u.subsistema] = { subsistema: u.subsistema, total: 0, count: 0 };
      acc[u.subsistema].total += u.custo_medio;
      acc[u.subsistema].count += 1;
      return acc;
    }, {})
  ).map((s) => ({
    subsistema: s.subsistema,
    custo_medio: parseFloat((s.total / s.count).toFixed(2)),
  }));

  return (
    <div style={estilos.pagina}>
      <Cabecalho titulo="Painel Administrativo" onVoltar={onVoltar} admin />
      <div style={estilos.conteudo}>
        {/* Seção de KPIs Principais */}
        <div style={estilos.gridKpis}>
          <CardKpi
            label="CMO Médio"
            valor={kpis?.cmo_atual ? formatarMoeda(kpis.cmo_atual) : "—"}
            unidade=""
            cor="#d97706"
          />
          <CardKpi
            label="Variação"
            valor={kpis?.variacao_cmo_pct}
            unidade="%"
            cor="#6366f1"
          />
          <CardKpi
            label="Renovável"
            valor={kpis?.renovavel_pct}
            unidade="%"
            cor="#22c55e"
          />
          <CardKpi
            label="Subsistemas"
            valor={kpis?.total_subsistemas}
            unidade=""
            cor="#0ea5e9"
          />
        </div>

        {/* Feed de Alertas Críticos */}
        <GraficoCard titulo="Alertas Operacionais">
          {alertas.length > 0 ? (
            alertas.map((alerta, i) => <AlertaItem key={i} alerta={alerta} />)
          ) : (
            <p style={{ color: "#64748b" }}>Nenhum alerta pendente.</p>
          )}
        </GraficoCard>

        {/* Gráfico: Real vs Previsto */}
        <GraficoCard titulo="Custo Real vs Previsto (Sazonalidade)">
          <div style={estilos.barraFiltros}>
            <label style={estilos.labelFiltro}>Filtrar Ano:</label>
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
                formatter={(v) => formatarMoeda(v)}
              />
              <Legend />
              <Bar
                dataKey="real"
                name="Real"
                fill="#fbbf24"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="previsto"
                name="Previsto"
                fill="#6366f1"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </GraficoCard>

        {/* Gráfico: Desvio Orçamentário (Verde/Vermelho) */}
        <GraficoCard titulo="Análise de Desvio Mensal">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dadosDesvio}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="mes" tick={{ fill: "#94a3b8" }} />
              <YAxis tick={{ fill: "#94a3b8" }} />
              <Tooltip
                contentStyle={estilos.tooltip}
                formatter={(v) => formatarMoeda(v)}
              />
              <ReferenceLine y={0} stroke="#475569" />
              <Bar dataKey="desvio" name="Desvio">
                {dadosDesvio.map((d, i) => (
                  <Cell key={i} fill={d.desvio <= 0 ? "#22c55e" : "#ef4444"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </GraficoCard>

        {/* Gráfico: Variação % CMO */}
        <GraficoCard titulo="Variação Percentual do CMO (Ano a Ano)">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dadosCrescimento}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="ano" tick={{ fill: "#94a3b8" }} />
              <YAxis tick={{ fill: "#94a3b8" }} unit="%" />
              <Tooltip
                contentStyle={estilos.tooltip}
                formatter={(v) => [`${v}%`, "Variação"]}
              />
              <Bar dataKey="crescimento" name="Variação %">
                {dadosCrescimento.map((d, i) => (
                  <Cell
                    key={i}
                    fill={d.crescimento <= 0 ? "#22c55e" : "#ef4444"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </GraficoCard>

        {/* Tabela de Ranking com Multi-filtros */}
        <GraficoCard titulo="Ranking e Filtro de Usinas">
          <div style={estilos.barraFiltros}>
            <select
              style={estilos.select}
              value={filtroSubsistema}
              onChange={(e) => setFiltroSubsistema(e.target.value)}
            >
              {subsistemas.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <select
              style={estilos.select}
              value={filtroCriticidade}
              onChange={(e) => setFiltroCriticidade(e.target.value)}
            >
              {["Todas", "Alta", "Média", "Baixa"].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
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
              {usinasFiltradas.map((u, i) => (
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
// COMPONENTES ATÔMICOS (Reutilizáveis)
// ════════════════════════════════════════════════════════════════════════════
function Cabecalho({ titulo, onVoltar, admin }) {
  return (
    <header
      style={{
        ...estilos.cabecalho,
        borderBottom: `3px solid ${admin ? "#d97706" : "#3b82f6"}`,
      }}
    >
      <button style={estilos.btnVoltar} onClick={onVoltar}>
        ← Voltar
      </button>
      <h1 style={estilos.cabecalhoTitulo}>⚡ ONS — {titulo}</h1>
    </header>
  );
}

function CardKpi({ label, valor, unidade, cor }) {
  return (
    <div style={{ ...estilos.cardKpi, borderTop: `3px solid ${cor}` }}>
      <p style={estilos.kpiLabel}>{label}</p>
      <p style={estilos.kpiValor}>
        {valor} <span style={estilos.kpiUnidade}>{unidade}</span>
      </p>
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

function AlertaItem({ alerta }) {
  const cores = { critical: "#ef4444", warning: "#f59e0b", info: "#3b82f6" };
  return (
    <div
      style={{
        background: "#1e293b",
        borderLeft: `4px solid ${cores[alerta.tipo]}`,
        padding: "10px",
        marginBottom: 8,
        borderRadius: 4,
      }}
    >
      <span style={{ fontSize: 13, color: "#cbd5e1" }}>{alerta.msg}</span>
    </div>
  );
}

function BadgeCriticidade({ criticidade }) {
  const cores = { Alta: "#ef4444", Média: "#f59e0b", Baixa: "#22c55e" };
  return (
    <span
      style={{ color: cores[criticidade], fontWeight: "bold", fontSize: 12 }}
    >
      ● {criticidade}
    </span>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// APP ENTRY POINT
// ════════════════════════════════════════════════════════════════════════════
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

// ════════════════════════════════════════════════════════════════════════════
// OBJETO DE ESTILOS (CSS-in-JS)
// ════════════════════════════════════════════════════════════════════════════
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

  titulo: { fontSize: 42, color: "#f1f5f9", marginBottom: 10 },
  subtitulo: { color: "#94a3b8", marginBottom: 40 },

  gridCards: { display: "flex", gap: 20 },
  card: {
    background: "#1e293b",
    padding: 30,
    borderRadius: 15,
    cursor: "pointer",
    width: 300,
    border: "1px solid #334155",
    transition: "0.3s",
  },
  cardTitulo: { color: "#f1f5f9", marginTop: 15 },
  cardDescricao: { color: "#94a3b8", fontSize: 14 },
  linkAcessar: {
    color: "#3b82f6",
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
  kpiLabel: { color: "#94a3b8", fontSize: 12, margin: 0 },
  kpiValor: { fontSize: 24, fontWeight: "bold", margin: "5px 0" },
  kpiUnidade: { fontSize: 14, fontWeight: "normal" },

  graficoCard: {
    background: "#1e293b",
    padding: 25,
    borderRadius: 12,
    border: "1px solid #334155",
    marginBottom: 25,
  },
  graficoTitulo: { fontSize: 16, marginBottom: 20, color: "#cbd5e1" },
  tooltip: {
    background: "#0f172a",
    border: "1px solid #334155",
    borderRadius: 8,
  },

  select: {
    background: "#0f172a",
    color: "#f1f5f9",
    border: "1px solid #334155",
    padding: "8px",
    borderRadius: 6,
    cursor: "pointer",
  },
  barraFiltros: {
    display: "flex",
    gap: 15,
    alignItems: "center",
    marginBottom: 20,
  },
  labelFiltro: { color: "#94a3b8", fontSize: 14 },

  tabela: { width: "100%", borderCollapse: "collapse" },
  th: {
    textAlign: "left",
    color: "#64748b",
    padding: 12,
    borderBottom: "1px solid #334155",
    fontSize: 12,
  },
  td: { padding: 12, borderBottom: "1px solid #263244", fontSize: 14 },
};
