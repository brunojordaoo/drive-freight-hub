import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  FileText,
  Radio,
  Truck,
  UserRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  brl,
  caucaoDe,
  dataBR,
  db,
  fundoDepreciacao,
  precisaManutencao,
  useDb,
  type Motorista,
  type StatusMotorista,
} from "@/lib/mock-supabase";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Painel do administrador — Vantura Frota" },
      {
        name: "description",
        content:
          "Aprovação de motoristas MEI, gestão da frota com fundo de depreciação e bloqueio remoto por inadimplência.",
      },
      { property: "og:title", content: "Painel do administrador — Vantura Frota" },
      {
        property: "og:description",
        content: "Kanban de aprovação, frota e gatilho de bloqueio do rastreador.",
      },
    ],
  }),
  component: PainelAdmin,
});

const COLUNAS: { status: StatusMotorista; titulo: string }[] = [
  { status: "pendente", titulo: "Aguardando análise" },
  { status: "em_analise", titulo: "Em análise" },
  { status: "aprovado", titulo: "Aprovados" },
  { status: "reprovado", titulo: "Reprovados" },
];

function PainelAdmin() {
  // db.from('...').select()
  const { motoristas, veiculos, alugueis, pagamentos } = useDb((s) => s);
  const [webhookLog, setWebhookLog] = useState<string[]>([]);
  const [detalheId, setDetalheId] = useState<string | null>(null);

  const detalhe = motoristas.find((m) => m.id === detalheId) ?? null;

  function abrirAnalise(m: Motorista) {
    setDetalheId(m.id);
    if (m.status !== "em_analise" && m.status === "pendente") {
      db.from("motoristas").update({ status: "em_analise" }).eq("id", m.id);
    }
  }

  function moverMotorista(m: Motorista, status: StatusMotorista) {
    // db.from('motoristas').update({ status }).eq('id', m.id)
    db.from("motoristas").update({ status }).eq("id", m.id);
    toast.success(`${m.nome.split(" ")[0]} movido para "${rotuloStatus(status)}".`);
  }

  function dispararBloqueio(veiculoId: string, placa: string) {
    // db.from('veiculos').update({ rastreador_bloqueado: true }).eq('id', veiculoId)
    db.from("veiculos").update({ rastreador_bloqueado: true }).eq("id", veiculoId);
    const evento = {
      event: "engine_lock",
      vehicle_id: veiculoId,
      placa,
      status: "requested",
      at: new Date().toISOString(),
    };
    setWebhookLog((l) => [JSON.stringify(evento, null, 2), ...l]);
    toast.warning(`Bloqueio solicitado para ${placa}.`);
  }

  const alugueisAtivos = alugueis.filter((a) => a.status === "ativo");

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 pb-20">
      <div>
        <p className="text-xs text-muted-foreground">Operação Vantura</p>
        <h1 className="text-2xl font-semibold tracking-tight">Painel do administrador</h1>
      </div>

      {/* Kanban de aprovação */}
      <section>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Aprovação de cadastros</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {COLUNAS.map((c) => {
            const itens = motoristas.filter((m) => m.status === c.status);
            return (
              <div key={c.status} className="rounded-2xl border border-border/60 bg-card/40 p-3">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-medium">{c.titulo}</p>
                  <Badge variant="secondary" className="text-[10px]">
                    {itens.length}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {itens.length === 0 && (
                    <p className="rounded-xl border border-dashed border-border/60 p-3 text-center text-[11px] text-muted-foreground">
                      Nenhum cadastro
                    </p>
                  )}
                  {itens.map((m) => (
                    <div key={m.id} className="rounded-xl border border-border/60 bg-card p-3">
                      <p className="text-sm font-medium">{m.nome}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {m.cidade} · {m.tem_ear ? "EAR" : "sem EAR"}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-7 px-2 text-[11px]"
                          onClick={() => abrirAnalise(m)}
                        >
                          <FileText className="mr-1 size-3" /> Analisar
                        </Button>
                        {c.status !== "aprovado" && (
                          <Button
                            size="sm"
                            className="h-7 px-2 text-[11px]"
                            onClick={() => moverMotorista(m, "aprovado")}
                          >
                            <CheckCircle2 className="mr-1 size-3" /> Aprovar
                          </Button>
                        )}
                        {c.status !== "reprovado" && (
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-7 px-2 text-[11px]"
                            onClick={() => moverMotorista(m, "reprovado")}
                          >
                            <Ban className="mr-1 size-3" /> Reprovar
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Frota */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Truck className="size-4 text-primary" /> Gestão de frota
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Veículo</TableHead>
                <TableHead>Locatário</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Semanal</TableHead>
                <TableHead>Caução</TableHead>
                <TableHead>Km atual</TableHead>
                <TableHead>Fundo de depreciação</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {veiculos.map((v) => {
                const aluguelDoVeiculo = alugueis.find(
                  (a) => a.veiculo_id === v.id && a.status === "ativo",
                );
                const locatario = motoristas.find(
                  (m) => m.id === aluguelDoVeiculo?.motorista_id,
                );
                return (
                <TableRow key={v.id}>
                  <TableCell>
                    <p className="font-medium">{v.modelo}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {v.placa} · {v.ano}
                    </p>
                  </TableCell>
                  <TableCell>
                    {locatario ? (
                      <div className="space-y-1">
                        <p className="text-xs font-medium">{locatario.nome}</p>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-6 px-2 text-[10px]"
                          onClick={() => setDetalheId(locatario.id)}
                        >
                          <FileText className="mr-1 size-3" /> Documentos e observações
                        </Button>
                      </div>
                    ) : (
                      <span className="text-[11px] text-muted-foreground">Sem locatário</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs">
                    {v.tipo === "furgao" ? "Furgão" : "Van"}
                  </TableCell>
                  <TableCell>{brl(v.valor_semanal)}</TableCell>
                  <TableCell>{brl(caucaoDe(v.tipo))}</TableCell>
                  <TableCell>{v.km_atual.toLocaleString("pt-BR")} km</TableCell>
                  <TableCell className="text-primary">
                    {brl(fundoDepreciacao(v.km_atual))}
                    {precisaManutencao(v.km_atual, v.km_ultima_revisao) && (
                      <span className="ml-2 inline-flex items-center gap-1 text-[11px] text-warning">
                        <AlertTriangle className="size-3" /> revisão
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        v.status === "disponivel"
                          ? "secondary"
                          : v.status === "manutencao"
                            ? "destructive"
                            : "outline"
                      }
                      className="text-[10px]"
                    >
                      {v.status === "disponivel"
                        ? "Disponível"
                        : v.status === "manutencao"
                          ? "Manutenção"
                          : "Alugado"}
                    </Badge>
                    {v.rastreador_bloqueado && (
                      <Badge variant="destructive" className="ml-1 text-[10px]">
                        Bloqueado
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Inadimplência */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Radio className="size-4 text-primary" /> Gatilho de inadimplência
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {alugueisAtivos.map((a) => {
            const atrasados = pagamentos.filter(
              (p) => p.aluguel_id === a.id && p.status === "atrasado",
            );
            const veiculo = veiculos.find((v) => v.id === a.veiculo_id);
            const motorista = motoristas.find((m) => m.id === a.motorista_id);
            if (!veiculo || !motorista) return null;
            return (
              <div
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 p-4"
              >
                <div>
                  <p className="text-sm font-medium">
                    {motorista.nome} · {veiculo.modelo} ({veiculo.placa})
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {atrasados.length > 0
                      ? `${atrasados.length} parcela(s) em atraso — ${brl(
                          atrasados.reduce((s, p) => s + p.valor, 0),
                        )}`
                      : "Sem parcelas em atraso"}
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={atrasados.length === 0 || veiculo.rastreador_bloqueado}
                  onClick={() => dispararBloqueio(veiculo.id, veiculo.placa)}
                >
                  {veiculo.rastreador_bloqueado ? "Rastreador bloqueado" : "Disparar bloqueio"}
                </Button>
              </div>
            );
          })}

          {webhookLog.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                Webhooks enviados ao rastreador
              </p>
              {webhookLog.map((l, i) => (
                <pre
                  key={i}
                  className="overflow-x-auto rounded-xl bg-secondary/60 p-3 text-[11px] text-muted-foreground"
                >
                  {l}
                </pre>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

function rotuloStatus(s: StatusMotorista) {
  return COLUNAS.find((c) => c.status === s)?.titulo ?? s;
}
