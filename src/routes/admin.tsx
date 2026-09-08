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
                );
              })}
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

      <Dialog open={!!detalhe} onOpenChange={(o) => !o && setDetalheId(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          {detalhe && (
            <FichaMotorista
              m={detalhe}
              onStatus={(s) => moverMotorista(detalhe, s)}
            />
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}

function FichaMotorista({
  m,
  onStatus,
}: {
  m: Motorista;
  onStatus: (s: StatusMotorista) => void;
}) {
  const [obs, setObs] = useState(m.observacoes_admin);

  useEffect(() => setObs(m.observacoes_admin), [m.id, m.observacoes_admin]);

  function alternarDoc(tipo: string) {
    // db.from('motoristas').update({ documentos }).eq('id', m.id)
    db.from("motoristas")
      .update({
        documentos: m.documentos.map((d) =>
          d.tipo === tipo ? { ...d, verificado: !d.verificado } : d,
        ),
      })
      .eq("id", m.id);
  }

  function salvarObs() {
    // db.from('motoristas').update({ observacoes_admin }).eq('id', m.id)
    db.from("motoristas").update({ observacoes_admin: obs.trim() }).eq("id", m.id);
    toast.success("Observações salvas.");
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-base">
          <UserRound className="size-4 text-primary" /> {m.nome}
        </DialogTitle>
        <DialogDescription>
          Cadastro enviado em {dataBR(m.criado_em)} · {rotuloStatus(m.status)}
        </DialogDescription>
      </DialogHeader>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <Dado rot="CPF" val={m.cpf} />
        <Dado rot="CNPJ MEI" val={m.cnpj} />
        <Dado rot="Telefone" val={m.telefone} />
        <Dado rot="E-mail" val={m.email} />
        <Dado rot="Nascimento" val={dataBR(m.data_nascimento)} />
        <Dado rot="CNH" val={m.cnh} />
        <Dado rot="Cidade" val={m.cidade} />
        <Dado rot="EAR" val={m.tem_ear ? "Sim" : "Não"} />
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Documentos enviados</p>
        {m.documentos.map((d) => (
          <div
            key={d.tipo}
            className="flex items-center justify-between gap-3 rounded-xl border border-border/60 p-3"
          >
            <div className="min-w-0">
              <p className="truncate text-xs font-medium">{d.tipo}</p>
              <p className="truncate text-[11px] text-muted-foreground">{d.arquivo}</p>
            </div>
            <Button
              size="sm"
              variant={d.verificado ? "default" : "secondary"}
              className="h-7 shrink-0 px-2 text-[11px]"
              onClick={() => alternarDoc(d.tipo)}
            >
              {d.verificado ? (
                <>
                  <CheckCircle2 className="mr-1 size-3" /> Conferido
                </>
              ) : (
                "Conferir"
              )}
            </Button>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Observações internas</Label>
        <Textarea
          value={obs}
          maxLength={600}
          placeholder="Ex.: comprovante de residência ilegível, reenviar."
          onChange={(e) => setObs(e.target.value)}
        />
        <Button size="sm" variant="secondary" onClick={salvarObs}>
          Salvar observações
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-border/60 pt-3">
        <Button size="sm" onClick={() => onStatus("aprovado")}>
          <CheckCircle2 className="mr-1 size-3" /> Aprovar
        </Button>
        <Button size="sm" variant="destructive" onClick={() => onStatus("reprovado")}>
          <Ban className="mr-1 size-3" /> Reprovar
        </Button>
      </div>
    </>
  );
}

function Dado({ rot, val }: { rot: string; val: string }) {
  return (
    <div className="rounded-xl bg-secondary/50 p-2">
      <p className="text-[10px] text-muted-foreground">{rot}</p>
      <p className="truncate font-medium">{val}</p>
    </div>
  );
}

function rotuloStatus(s: StatusMotorista) {
  return COLUNAS.find((c) => c.status === s)?.titulo ?? s;
}
