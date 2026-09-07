/**
 * Cliente Supabase SIMULADO (mock).
 *
 * Toda a leitura/escrita passa por `db.from('tabela').select()/insert()/update()`,
 * exatamente como no cliente real do Supabase. Para migrar no futuro basta
 * trocar `import { db } from "@/lib/mock-supabase"` por
 * `import { supabase as db } from "@/integrations/supabase/client"`.
 */

import { useSyncExternalStore } from "react";

/* ------------------------------------------------------------------ */
/* Tipos (espelham o schema previsto no Postgres)                      */
/* ------------------------------------------------------------------ */

export type StatusMotorista = "pendente" | "em_analise" | "aprovado" | "reprovado";
export type StatusVeiculo = "disponivel" | "alugado" | "manutencao";
export type StatusAluguel = "ativo" | "encerrado";
export type StatusPagamento = "pago" | "pendente" | "atrasado";
export type StatusVistoria = "ok" | "avaria";

export interface Motorista {
  id: string;
  nome: string;
  cpf: string;
  cnpj: string;
  telefone: string;
  email: string;
  data_nascimento: string;
  cnh: string;
  tem_ear: boolean;
  cidade: string;
  status: StatusMotorista;
  criado_em: string;
}

export type TipoVeiculo = "furgao" | "van";

export interface Veiculo {
  id: string;
  modelo: string;
  placa: string;
  ano: number;
  tipo: TipoVeiculo;
  km_atual: number;
  km_ultima_revisao: number;
  valor_semanal: number;
  status: StatusVeiculo;
  rastreador_bloqueado: boolean;
}

export interface Aluguel {
  id: string;
  motorista_id: string;
  veiculo_id: string;
  inicio: string;
  valor_semanal: number;
  caucao: number;
  status: StatusAluguel;
}

export interface Pagamento {
  id: string;
  aluguel_id: string;
  competencia: string;
  vencimento: string;
  valor: number;
  status: StatusPagamento;
  pix_copia_cola: string;
}

export interface Vistoria {
  id: string;
  aluguel_id: string;
  data: string;
  km: number;
  observacoes: string;
  fotos: string[];
  status: StatusVistoria;
}

export interface DbShape {
  motoristas: Motorista[];
  veiculos: Veiculo[];
  alugueis: Aluguel[];
  pagamentos: Pagamento[];
  vistorias: Vistoria[];
}

/* ------------------------------------------------------------------ */
/* Seed inicial (Itabuna / Ilhéus - BA)                                */
/* ------------------------------------------------------------------ */

const seed: DbShape = {
  motoristas: [
    {
      id: "mot-1",
      nome: "Bruno Jordão",
      cpf: "042.117.885-30",
      cnpj: "48.221.905/0001-77",
      telefone: "(73) 99912-4477",
      email: "bruno.jordao@entregasba.com",
      data_nascimento: "1989-03-14",
      cnh: "04512339871",
      tem_ear: true,
      cidade: "Itabuna",
      status: "aprovado",
      criado_em: "2026-06-02",
    },
    {
      id: "mot-2",
      nome: "Cleiton Ramos",
      cpf: "018.774.335-11",
      cnpj: "51.903.117/0001-04",
      telefone: "(73) 98871-2210",
      email: "cleiton.log@gmail.com",
      data_nascimento: "1993-11-28",
      cnh: "01127744902",
      tem_ear: true,
      cidade: "Ilhéus",
      status: "em_analise",
      criado_em: "2026-08-29",
    },
    {
      id: "mot-3",
      nome: "Marcos Vinícius Sena",
      cpf: "077.310.445-92",
      cnpj: "44.108.552/0001-63",
      telefone: "(73) 99640-8102",
      email: "mv.sena@outlook.com",
      data_nascimento: "1987-01-09",
      cnh: "03390118745",
      tem_ear: false,
      cidade: "Itabuna",
      status: "pendente",
      criado_em: "2026-09-01",
    },
    {
      id: "mot-4",
      nome: "Rafaela Nunes",
      cpf: "090.554.201-38",
      cnpj: "52.771.900/0001-20",
      telefone: "(73) 99155-3390",
      email: "rafaela.nunes@expressobahia.com",
      data_nascimento: "1995-07-21",
      cnh: "05781120033",
      tem_ear: true,
      cidade: "Ilhéus",
      status: "pendente",
      criado_em: "2026-09-04",
    },
  ],
  veiculos: [
    {
      id: "vei-1",
      modelo: "Peugeot Partner 1.6",
      placa: "QWA-7C31",
      ano: 2022,
      tipo: "van",
      km_atual: 74210,
      km_ultima_revisao: 68000,
      valor_semanal: 1000,
      status: "alugado",
      rastreador_bloqueado: false,
    },
    {
      id: "vei-2",
      modelo: "Fiat Fiorino Endurance",
      placa: "PJB-4D08",
      ano: 2023,
      tipo: "furgao",
      km_atual: 41880,
      km_ultima_revisao: 40000,
      valor_semanal: 800,
      status: "alugado",
      rastreador_bloqueado: false,
    },
    {
      id: "vei-3",
      modelo: "Renault Master Furgão",
      placa: "RTF-9G55",
      ano: 2021,
      tipo: "furgao",
      km_atual: 118430,
      km_ultima_revisao: 112000,
      valor_semanal: 800,
      status: "disponivel",
      rastreador_bloqueado: false,
    },
    {
      id: "vei-4",
      modelo: "Fiat Ducato Cargo",
      placa: "SAB-2H19",
      ano: 2024,
      tipo: "van",
      km_atual: 22105,
      km_ultima_revisao: 20000,
      valor_semanal: 1000,
      status: "manutencao",
      rastreador_bloqueado: false,
    },
  ],
  alugueis: [
    {
      id: "alu-1",
      motorista_id: "mot-1",
      veiculo_id: "vei-1",
      inicio: "2026-06-08",
      valor_semanal: 1000,
      caucao: 2500,
      status: "ativo",
    },
    {
      id: "alu-2",
      motorista_id: "mot-2",
      veiculo_id: "vei-2",
      inicio: "2026-08-31",
      valor_semanal: 800,
      caucao: 1700,
      status: "ativo",
    },
  ],
  pagamentos: [
    pgto("pag-1", "alu-1", "Semana 30/06", "2026-07-06", 1000, "pago"),
    pgto("pag-2", "alu-1", "Semana 07/07", "2026-07-13", 1000, "pago"),
    pgto("pag-3", "alu-1", "Semana 14/07", "2026-07-20", 1000, "pago"),
    pgto("pag-4", "alu-1", "Semana 24/08", "2026-08-31", 1000, "pago"),
    pgto("pag-5", "alu-1", "Semana 31/08", "2026-09-04", 1000, "atrasado"),
    pgto("pag-6", "alu-1", "Semana 07/09", "2026-09-11", 1000, "pendente"),
    pgto("pag-7", "alu-2", "Semana 31/08", "2026-09-06", 800, "pendente"),
  ],
  vistorias: [
    {
      id: "vis-1",
      aluguel_id: "alu-1",
      data: "2026-08-09",
      km: 68120,
      observacoes: "Pneu dianteiro direito com desgaste leve. Lataria sem avarias.",
      fotos: ["Frente", "Traseira", "Lateral esquerda", "Lateral direita"],
      status: "ok",
    },
  ],
};

function pgto(
  id: string,
  aluguel_id: string,
  competencia: string,
  vencimento: string,
  valor: number,
  status: StatusPagamento,
): Pagamento {
  return {
    id,
    aluguel_id,
    competencia,
    vencimento,
    valor,
    status,
    pix_copia_cola: `00020126VANTURA${id.toUpperCase()}5204000053039865802BR5913VANTURA FROTA6008ITABUNA62070503***6304${Math.floor(
      1000 + valor,
    )}`,
  };
}

/* ------------------------------------------------------------------ */
/* Store reativo                                                       */
/* ------------------------------------------------------------------ */

let state: DbShape = seed;
const listeners = new Set<() => void>();

function emit() {
  state = { ...state };
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useDb<T>(selector: (s: DbShape) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(state),
    () => selector(state),
  );
}

export const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 8)}`;

/* ------------------------------------------------------------------ */
/* API estilo Supabase                                                 */
/* ------------------------------------------------------------------ */

type TableName = keyof DbShape;

class QueryBuilder<K extends TableName> {
  constructor(private table: K) {}

  /** db.from('tabela').select() */
  select(): { data: DbShape[K]; error: null } {
    return { data: state[this.table], error: null };
  }

  /** db.from('tabela').insert(row) */
  insert(row: DbShape[K][number]): { data: DbShape[K][number]; error: null } {
    state[this.table] = [...state[this.table], row] as DbShape[K];
    emit();
    return { data: row, error: null };
  }

  /** db.from('tabela').update(patch).eq('id', id) */
  update(patch: Partial<DbShape[K][number]>) {
    const table = this.table;
    return {
      eq(column: "id", value: string) {
        state[table] = state[table].map((r) =>
          (r as { id: string }).id === value ? { ...r, ...patch } : r,
        ) as DbShape[K];
        emit();
        return { data: null, error: null };
      },
    };
  }
}

export const db = {
  from<K extends TableName>(table: K) {
    return new QueryBuilder(table);
  },
};

/* ------------------------------------------------------------------ */
/* Helpers de domínio                                                  */
/* ------------------------------------------------------------------ */

export const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const dataBR = (iso: string) => {
  const [a, m, d] = iso.split("-");
  return `${d}/${m}/${a}`;
};

/** Fundo de depreciação: R$ 0,20 por km rodado */
export const fundoDepreciacao = (km: number) => km * 0.2;

/** Semanal: furgão R$ 800 · van R$ 1.000 */
export const semanalDe = (tipo: TipoVeiculo) => (tipo === "furgao" ? 800 : 1000);

/** Caução: furgão R$ 1.700 · van R$ 2.500 */
export const caucaoDe = (tipo: TipoVeiculo) => (tipo === "furgao" ? 1700 : 2500);

/** Manutenção obrigatória a cada 10.000 km */
export const precisaManutencao = (km: number, kmUltimaRevisao: number) =>
  km - kmUltimaRevisao >= 10000;

export const idadeEm = (nascimento: string) => {
  const hoje = new Date();
  const n = new Date(nascimento);
  let idade = hoje.getFullYear() - n.getFullYear();
  const m = hoje.getMonth() - n.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < n.getDate())) idade--;
  return idade;
};

export const maskCPF = (v: string) =>
  v
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");

export const maskCNPJ = (v: string) =>
  v
    .replace(/\D/g, "")
    .slice(0, 14)
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");

export const maskTel = (v: string) =>
  v
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d{1,4})$/, "$1-$2");
