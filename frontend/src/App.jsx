import { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

// ── Endereço base da API ─────────────────────────────────────────────────────
const API_URL = "http://localhost:8000";

// ── Função auxiliar para buscar dados da API ─────────────────────────────────
async function fetchDados(rota) {
  const resposta = await fetch(`${API_URL}${rota}`);
  const json = await resposta.json();
  return json.dados;
}

// ── Paleta ───────────────────────────────────────────────────────────────────
const CORES_MATRIZ = ["#3b82f6", "#f97316", "#22c55e", "#eab308"];
const CORES_SUBS = ["#6366f1", "#0ea5e9", "#f59e0b", "#10b981"];

const estiloSelect = {
  background: "#0f172a",
  border: "1px solid #334155",
  color: "#f1f5f9",
  borderRadius: 8,
  padding: "6px 12px",
  fontSize: 13,
  cursor: "pointer",
};

// ════════════════════════════════════════════════════════════════════════════
// TELA DE SELEÇÃO
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
          descricao="Acompanhe a tendência de custos e a composição da matriz energética."
          onClick={() => onSelecionar("cliente")}
        />
        <CardSelecao
          icone="⚙️"
          titulo="Painel Administrativo"
          descricao="Acesso completo com filtros, custos operacionais, ranking de usinas e alertas."
          onClick={() => onSelecionar("admin")}
        />
      </div>
    </div>
  );
}

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
// PAINEL DO CLIENTE — simples, só o essencial
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
        <GraficoCard titulo="Tendência do Custo Marginal de Operação (R$/MWh)">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={cmo}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="ano" tick={{ fill: "#94a3b8" }} />
              <YAxis tick={{ fill: "#94a3b8" }} />
              <Tooltip contentStyle={estilos.tooltip} />
              <Area
                dataKey="custo_medio_anual"
                name="CMO"
                stroke="#3b82f6"
                fill="#1e3a5f"
              />
            </AreaChart>
          </ResponsiveContainer>
        </GraficoCard>

        <GraficoCard titulo="Matriz Energética por Subsistema">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={matriz}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="subsistema" tick={{ fill: "#94a3b8" }} />
              <YAxis tick={{ fill: "#94a3b8" }} />
              <Tooltip contentStyle={estilos.tooltip} />
              <Legend wrapperStyle={{ color: "#94a3b8" }} />
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
// PAINEL ADMINISTRATIVO
// ════════════════════════════════════════════════════════════════════════════
function PainelAdmin({ onVoltar }) {
  const [kpis, setKpis] = useState(null);
  const [usinas, setUsinas] = useState([]);
  const [realPrev, setRealPrev] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [cmo, setCmo] = useState([]);
  const [matriz, setMatriz] = useState([]);

  // Filtros
  const [filtroSubsistema, setFiltroSubsistema] = useState("Todos");
  const [filtroAno, setFiltroAno] = useState("Todos");
  const [filtroUsina, setFiltroUsina] = useState("Todas");
  const [filtroCriticidade, setFiltroCriticidade] = useState("Todas");

  useEffect(() => {
    fetchDados("/api/admin/kpis").then(setKpis);
    fetchDados("/api/admin/ranking-usinas").then(setUsinas);
    fetchDados("/api/admin/custo-real-vs-previsto").then(setRealPrev);
    fetchDados("/api/admin/alertas").then(setAlertas);
    fetchDados("/api/insights/tendencia-custo-marginal").then(setCmo);
    fetchDados("/api/dashboard/matriz-energetica").then(setMatriz);
  }, []);

  // Opções dos filtros derivadas dos dados
  const subsistemas = ["Todos", ...new Set(usinas.map((u) => u.subsistema))];
  const anos = ["Todos", ...new Set(realPrev.map((r) => r.ano))];
  const nomeUsinas = ["Todas", ...usinas.map((u) => u.usina)];

  // Tabela de usinas filtrada
  const usinasFiltradas = usinas.filter((u) => {
    const porSub =
      filtroSubsistema === "Todos" || u.subsistema === filtroSubsistema;
    const porNome = filtroUsina === "Todas" || u.usina === filtroUsina;
    const porCrit =
      filtroCriticidade === "Todas" || u.criticidade === filtroCriticidade;
    return porSub && porNome && porCrit;
  });

  // Custo real vs previsto filtrado por ano
  const realPrevFiltrado = realPrev.filter(
    (r) => filtroAno === "Todos" || String(r.ano) === String(filtroAno)
  );

  // ── Dados derivados para os novos gráficos ────────────────────────────────

  // 1. Desvio mensal (real - previsto), calculado a partir de realPrev
  const dadosDesvio = realPrevFiltrado.map((r) => ({
    mes: r.mes,
    desvio: parseFloat((r.real - r.previsto).toFixed(2)),
  }));

  // 2. Variabilidade de custo por usina (min, média, max) — vem de ranking-usinas
  const dadosVariabilidade = usinas.map((u) => ({
    usina: u.usina,
    custo_min: parseFloat((u.custo_medio - u.variabilidade).toFixed(2)),
    custo_medio: u.custo_medio,
    custo_max: parseFloat((u.custo_medio + u.variabilidade).toFixed(2)),
    variacao: parseFloat((u.variabilidade * 2).toFixed(2)),
  }));

  // 3. Custo médio por subsistema — agrupado a partir de ranking-usinas
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

  // 4. Participação renovável por subsistema — calculada a partir de matriz-energetica
  const renovavelSubsistema = matriz.map((m) => {
    const total =
      (m.hidrica || 0) + (m.termica || 0) + (m.eolica || 0) + (m.solar || 0);
    const renovavel = (m.hidrica || 0) + (m.eolica || 0) + (m.solar || 0);
    return {
      subsistema: m.subsistema,
      renovavel_pct:
        total > 0 ? parseFloat(((renovavel / total) * 100).toFixed(1)) : 0,
      termica_pct:
        total > 0 ? parseFloat(((m.termica / total) * 100).toFixed(1)) : 0,
    };
  });

  // 5. Crescimento anual do CMO (variação % ano a ano) — calculado a partir de cmo
  const dadosCrescimento = cmo
    .map((d, i) => {
      if (i === 0) return { ano: d.ano, crescimento: 0 };
      const anterior = cmo[i - 1].custo_medio_anual;
      const variacao = parseFloat(
        (((d.custo_medio_anual - anterior) / anterior) * 100).toFixed(1)
      );
      return { ano: d.ano, crescimento: variacao };
    })
    .slice(1); // remove o primeiro (sem referência anterior)

  return (
    <div style={estilos.pagina}>
      <Cabecalho titulo="Painel Administrativo" onVoltar={onVoltar} admin />
      <div style={estilos.conteudo}>
        {/* KPIs */}
        <div style={estilos.gridKpis}>
          <CardKpi
            label="CMO Médio"
            valor={kpis?.cmo_atual}
            unidade="R$/MWh"
            cor="#d97706"
          />
          <CardKpi
            label="Variação CMO"
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

        {/* Alertas */}
        <GraficoCard titulo="Alertas Operacionais">
          {alertas.map((alerta, i) => (
            <AlertaItem key={i} alerta={alerta} />
          ))}
        </GraficoCard>

        {/* ── GRÁFICO 1 — Custo real vs previsto com filtro de ano ── */}
        <GraficoCard titulo="Custo Real vs Previsto (R$/MWh)">
          <div style={estilos.barraFiltros}>
            <label style={estilos.labelFiltro}>Ano:</label>
            <select
              style={estiloSelect}
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
              <Tooltip contentStyle={estilos.tooltip} />
              <Legend wrapperStyle={{ color: "#94a3b8" }} />
              <Bar dataKey="real" name="Real" fill="#fbbf24" />
              <Bar dataKey="previsto" name="Previsto" fill="#6366f1" />
            </BarChart>
          </ResponsiveContainer>
        </GraficoCard>

        {/* ── GRÁFICO 2 — Desvio mensal real vs previsto ── */}
        <GraficoCard
          titulo="Desvio Orçamentário Mensal (R$/MWh)"
          descricao="Diferença entre custo real e previsto — barras verdes indicam economia, vermelhas indicam estouro."
        >
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dadosDesvio}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="mes" tick={{ fill: "#94a3b8" }} />
              <YAxis tick={{ fill: "#94a3b8" }} />
              <Tooltip
                contentStyle={estilos.tooltip}
                formatter={(v) => [`${v} R$/MWh`, "Desvio"]}
              />
              <ReferenceLine y={0} stroke="#475569" strokeDasharray="4 4" />
              <Bar dataKey="desvio" name="Desvio" radius={[4, 4, 0, 0]}>
                {dadosDesvio.map((d, i) => (
                  <Cell key={i} fill={d.desvio <= 0 ? "#22c55e" : "#ef4444"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </GraficoCard>

        {/* ── GRÁFICO 3 — Variação anual do CMO ── */}
        <GraficoCard
          titulo="Variação Anual do CMO (%)"
          descricao="Crescimento ou queda percentual do custo marginal a cada ano — identifica anos críticos."
        >
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dadosCrescimento}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="ano" tick={{ fill: "#94a3b8" }} />
              <YAxis tick={{ fill: "#94a3b8" }} unit="%" />
              <Tooltip
                contentStyle={estilos.tooltip}
                formatter={(v) => [`${v}%`, "Variação"]}
              />
              <ReferenceLine y={0} stroke="#475569" strokeDasharray="4 4" />
              <Bar
                dataKey="crescimento"
                name="Variação %"
                radius={[4, 4, 0, 0]}
              >
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

        {/* ── GRÁFICO 4 — Custo médio por subsistema ── */}
        <GraficoCard
          titulo="Custo Médio das Usinas por Subsistema (R$/MWh)"
          descricao="Média dos custos operacionais das usinas térmicas agrupadas por região — apoia decisões de despacho."
        >
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={custoSubsistema} barSize={40}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="subsistema" tick={{ fill: "#94a3b8" }} />
              <YAxis tick={{ fill: "#94a3b8" }} />
              <Tooltip contentStyle={estilos.tooltip} />
              <Bar
                dataKey="custo_medio"
                name="Custo médio (R$/MWh)"
                radius={[6, 6, 0, 0]}
              >
                {custoSubsistema.map((_, i) => (
                  <Cell key={i} fill={CORES_SUBS[i % CORES_SUBS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </GraficoCard>

        {/* ── GRÁFICO 5 — Variabilidade de custo por usina ── */}
        <GraficoCard
          titulo="Variabilidade de Custo por Usina (R$/MWh)"
          descricao="Amplitude entre o custo mínimo e máximo registrado — usinas com alta variação representam risco operacional."
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={dadosVariabilidade} layout="vertical" barSize={14}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#334155"
                horizontal={false}
              />
              <XAxis type="number" tick={{ fill: "#94a3b8" }} />
              <YAxis
                type="category"
                dataKey="usina"
                tick={{ fill: "#94a3b8" }}
                width={110}
              />
              <Tooltip contentStyle={estilos.tooltip} />
              <Legend wrapperStyle={{ color: "#94a3b8" }} />
              <Bar
                dataKey="custo_min"
                name="Mínimo"
                stackId="a"
                fill="#22c55e"
              />
              <Bar
                dataKey="variacao"
                name="Variação"
                stackId="a"
                fill="#ef4444"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </GraficoCard>

        {/* ── GRÁFICO 6 — Participação renovável por subsistema ── */}
        <GraficoCard
          titulo="Participação Renovável vs Térmica por Subsistema (%)"
          descricao="Quanto de cada subsistema depende de fontes renováveis — essencial para avaliar vulnerabilidade energética."
        >
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={renovavelSubsistema} barSize={40}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="subsistema" tick={{ fill: "#94a3b8" }} />
              <YAxis tick={{ fill: "#94a3b8" }} unit="%" domain={[0, 100]} />
              <Tooltip
                contentStyle={estilos.tooltip}
                formatter={(v) => [`${v}%`]}
              />
              <Legend wrapperStyle={{ color: "#94a3b8" }} />
              <Bar
                dataKey="renovavel_pct"
                name="Renovável"
                stackId="a"
                fill="#22c55e"
              />
              <Bar
                dataKey="termica_pct"
                name="Térmica"
                stackId="a"
                fill="#f97316"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </GraficoCard>

        {/* ── TABELA — Ranking com filtros ── */}
        <GraficoCard titulo="Ranking de Usinas por Custo Operacional">
          <div style={estilos.barraFiltros}>
            <label style={estilos.labelFiltro}>Subsistema:</label>
            <select
              style={estiloSelect}
              value={filtroSubsistema}
              onChange={(e) => setFiltroSubsistema(e.target.value)}
            >
              {subsistemas.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>

            <label style={estilos.labelFiltro}>Usina:</label>
            <select
              style={estiloSelect}
              value={filtroUsina}
              onChange={(e) => setFiltroUsina(e.target.value)}
            >
              {nomeUsinas.map((u) => (
                <option key={u}>{u}</option>
              ))}
            </select>

            <label style={estilos.labelFiltro}>Criticidade:</label>
            <select
              style={estiloSelect}
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
                {[
                  "#",
                  "Usina",
                  "Subsistema",
                  "Custo (R$/MWh)",
                  "Criticidade",
                  "Ação",
                ].map((col) => (
                  <th key={col} style={estilos.th}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {usinasFiltradas.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      ...estilos.td,
                      textAlign: "center",
                      color: "#64748b",
                    }}
                  >
                    Nenhuma usina encontrada para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                usinasFiltradas.map((u) => (
                  <tr
                    key={u.rank}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#263244")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "")
                    }
                  >
                    <td style={estilos.td}>{u.rank}</td>
                    <td style={estilos.td}>{u.usina}</td>
                    <td style={estilos.td}>{u.subsistema}</td>
                    <td style={estilos.td}>{u.custo_medio}</td>
                    <td style={estilos.td}>
                      <BadgeCriticidade criticidade={u.criticidade} />
                    </td>
                    <td style={estilos.td}>{u.acao}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </GraficoCard>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// COMPONENTES REUTILIZÁVEIS
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
        {valor ?? "—"} <span style={estilos.kpiUnidade}>{unidade}</span>
      </p>
    </div>
  );
}

function GraficoCard({ titulo, descricao, children }) {
  return (
    <div style={estilos.graficoCard}>
      <h3 style={estilos.graficoTitulo}>{titulo}</h3>
      {descricao && <p style={estilos.graficoDescricao}>{descricao}</p>}
      {children}
    </div>
  );
}

function AlertaItem({ alerta }) {
  const estilosPorTipo = {
    critical: {
      fundo: "#2d1515",
      borda: "#ef4444",
      cor: "#f87171",
      label: "Crítico",
    },
    warning: {
      fundo: "#2d2008",
      borda: "#f59e0b",
      cor: "#fbbf24",
      label: "Atenção",
    },
    info: { fundo: "#0f1f3d", borda: "#3b82f6", cor: "#60a5fa", label: "Info" },
  };
  const s = estilosPorTipo[alerta.tipo] ?? estilosPorTipo.info;
  return (
    <div
      style={{
        background: s.fundo,
        borderLeft: `4px solid ${s.borda}`,
        borderRadius: 6,
        padding: "10px 14px",
        marginBottom: 8,
        display: "flex",
        gap: 12,
      }}
    >
      <span
        style={{ color: s.cor, fontWeight: 700, fontSize: 12, minWidth: 48 }}
      >
        {s.label}
      </span>
      <span style={{ fontSize: 13, color: "#cbd5e1" }}>{alerta.msg}</span>
    </div>
  );
}

function BadgeCriticidade({ criticidade }) {
  const cores = {
    Alta: { fundo: "#2d1515", texto: "#f87171" },
    Média: { fundo: "#2d1e08", texto: "#fb923c" },
    Baixa: { fundo: "#0d2918", texto: "#4ade80" },
  };
  const c = cores[criticidade] ?? cores.Baixa;
  return (
    <span
      style={{
        background: c.fundo,
        color: c.texto,
        fontWeight: 700,
        fontSize: 11,
        padding: "3px 10px",
        borderRadius: 100,
      }}
    >
      {criticidade}
    </span>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// APP PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [tela, setTela] = useState("selecao");
  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        background: "#0f172a",
        minHeight: "100vh",
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

// ════════════════════════════════════════════════════════════════════════════
// ESTILOS
// ════════════════════════════════════════════════════════════════════════════
const estilos = {
  paginaCentro: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    background: "#0f172a",
  },
  pagina: { minHeight: "100vh", background: "#0f172a" },
  conteudo: { maxWidth: 1100, margin: "0 auto", padding: "28px 24px" },

  titulo: {
    fontSize: 32,
    fontWeight: 800,
    color: "#f1f5f9",
    margin: "0 0 8px",
  },
  subtitulo: { fontSize: 16, color: "#64748b", margin: "0 0 40px" },
  gridCards: {
    display: "flex",
    gap: 20,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  card: {
    width: 280,
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: 12,
    padding: 28,
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  cardTitulo: { fontSize: 18, fontWeight: 700, color: "#f1f5f9", margin: 0 },
  cardDescricao: { fontSize: 13, color: "#94a3b8", lineHeight: 1.6, margin: 0 },
  linkAcessar: {
    color: "#60a5fa",
    fontWeight: 700,
    fontSize: 13,
    marginTop: 8,
  },

  cabecalho: {
    background: "#1e293b",
    borderBottom: "1px solid #334155",
    padding: "14px 24px",
    display: "flex",
    alignItems: "center",
    gap: 16,
  },
  cabecalhoTitulo: {
    fontSize: 18,
    fontWeight: 700,
    color: "#f1f5f9",
    margin: 0,
  },
  btnVoltar: {
    background: "none",
    border: "1px solid #334155",
    color: "#94a3b8",
    borderRadius: 8,
    padding: "5px 14px",
    cursor: "pointer",
    fontSize: 13,
  },

  gridKpis: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 14,
    marginBottom: 24,
  },
  cardKpi: {
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: 10,
    padding: "16px 18px",
  },
  kpiLabel: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    margin: "0 0 8px",
  },
  kpiValor: { fontSize: 22, fontWeight: 700, color: "#f1f5f9", margin: 0 },
  kpiUnidade: { fontSize: 13, color: "#64748b", fontWeight: 400 },

  graficoCard: {
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: 10,
    padding: "20px 22px",
    marginBottom: 20,
  },
  graficoTitulo: {
    fontSize: 14,
    fontWeight: 700,
    color: "#e2e8f0",
    margin: "0 0 4px",
  },
  graficoDescricao: {
    fontSize: 12,
    color: "#64748b",
    margin: "0 0 16px",
    lineHeight: 1.5,
  },
  tooltip: {
    background: "#0f172a",
    border: "1px solid #334155",
    color: "#f1f5f9",
  },

  barraFiltros: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
    marginBottom: 16,
  },
  labelFiltro: { fontSize: 12, color: "#64748b", fontWeight: 600 },

  tabela: { width: "100%", borderCollapse: "collapse", fontSize: 14 },
  th: {
    textAlign: "left",
    padding: "8px 12px",
    color: "#64748b",
    fontWeight: 600,
    fontSize: 11,
    textTransform: "uppercase",
    borderBottom: "2px solid #334155",
  },
  td: {
    padding: "11px 12px",
    color: "#cbd5e1",
    borderBottom: "1px solid #263244",
  },
};
