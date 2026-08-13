import { Plus, Search, UsersRound } from "lucide-react";
import Link from "next/link";

import { EmployeeStatusBadge } from "@/components/employees/employee-status-badge";
import { employeeStatusValues } from "@/db/schema/enums";
import { listEmployees } from "@/services/employee.service";
import { formatCpf, formatDate } from "@/utils/format";
import { employeeListQuerySchema } from "@/validations/employee";

const statusLabels = { ACTIVE: "Ativos", VACATION: "Em férias", LEAVE: "Afastados", TERMINATED: "Desligados", INACTIVE: "Inativos" } as const;

function pageHref(page: number, query: string, status?: string) {
  const params = new URLSearchParams();
  if (query) params.set("query", query);
  if (status) params.set("status", status);
  params.set("page", String(page));
  return `/admin/funcionarios?${params.toString()}`;
}

export default async function EmployeesPage({ searchParams }: PageProps<"/admin/funcionarios">) {
  const raw = await searchParams;
  const filters = employeeListQuerySchema.parse({
    query: typeof raw.query === "string" ? raw.query : "",
    status: typeof raw.status === "string" ? raw.status : undefined,
    page: typeof raw.page === "string" ? raw.page : 1,
  });
  const result = await listEmployees(filters);
  const created = raw.created === "1";

  return (
    <main className="dashboard-page">
      <div className="page-heading employees-heading">
        <div><p className="eyebrow">Equipe</p><h1>Funcionários</h1><p>Consulte e mantenha os dados cadastrais da equipe.</p></div>
        <Link className="primary-button action-button" href="/admin/funcionarios/novo"><Plus size={18} /> Novo funcionário</Link>
      </div>

      {created ? <p className="success-message" role="status">Funcionário cadastrado com sucesso.</p> : null}

      <form className="filter-bar" method="get">
        <label className="search-field" htmlFor="query"><Search size={18} aria-hidden="true" /><input id="query" name="query" defaultValue={filters.query} placeholder="Buscar por nome, CPF, matrícula ou cargo" /></label>
        <label className="sr-only" htmlFor="status">Status</label>
        <select id="status" name="status" defaultValue={filters.status ?? ""}>
          <option value="">Todos os status</option>
          {employeeStatusValues.map((status) => <option value={status} key={status}>{statusLabels[status]}</option>)}
        </select>
        <button className="secondary-button" type="submit">Filtrar</button>
      </form>

      <section className="data-panel" aria-label="Lista de funcionários">
        <div className="table-summary"><strong>{result.total}</strong> {result.total === 1 ? "funcionário encontrado" : "funcionários encontrados"}</div>
        {result.items.length ? (
          <div className="table-scroll"><table className="data-table"><thead><tr><th>Funcionário</th><th>Matrícula</th><th>Cargo</th><th>Admissão</th><th>Status</th></tr></thead><tbody>{result.items.map((employee) => <tr key={employee.id}><td><strong>{employee.fullName}</strong><small>{formatCpf(employee.cpf)}</small></td><td>{employee.registrationNumber}</td><td>{employee.position}</td><td>{formatDate(employee.admissionDate)}</td><td><EmployeeStatusBadge status={employee.status} /></td></tr>)}</tbody></table></div>
        ) : (
          <div className="empty-state"><UsersRound size={30} /><h2>Nenhum funcionário encontrado</h2><p>Ajuste os filtros ou cadastre o primeiro funcionário.</p><Link href="/admin/funcionarios/novo">Cadastrar funcionário</Link></div>
        )}
        {result.totalPages > 1 ? <nav className="pagination" aria-label="Paginação"><Link aria-disabled={result.page === 1} className={result.page === 1 ? "disabled" : ""} href={pageHref(result.page - 1, filters.query, filters.status)}>Anterior</Link><span>Página {result.page} de {result.totalPages}</span><Link aria-disabled={result.page >= result.totalPages} className={result.page >= result.totalPages ? "disabled" : ""} href={pageHref(result.page + 1, filters.query, filters.status)}>Próxima</Link></nav> : null}
      </section>
    </main>
  );
}
