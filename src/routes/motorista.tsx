import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  Camera,
  CalendarClock,
  CheckCircle2,
  Copy,
  Gauge,
  Truck,
  Wrench,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  brl,
  dataBR,
  db,
  precisaManutencao,
  uid,
  useDb,
} from "@/lib/mock-supabase";

export const Route = createFileRoute("/motorista")({
  head: () => ({
    meta: [
      { title: "Área do motorista — Vantura Frota" },
      {
        name: "description",
        content:
          "Acompanhe seu veículo alugado, pagamentos semanais no Pix, vistorias e alertas de manutenção.",
      },
      { property: "og:title", content: "Área do motorista — Vantura Frota" },
      {
        property: "og:description",
        content: "Veículo, pagamentos, 2ª via do Pix e vistoria com fotos em um só lugar.",
      },
    ],
  }),
  component: AreaMotorista,
});

const ANGULOS = ["Frente", "Traseira", "Lateral esquerda", "Lateral direita"] as const;

function AreaMotorista() {
  // db.from('...').select()
  const { motoristas, veiculos, alugueis, pagamentos, vistorias } = useDb((s) => s);

  const aluguel = alugueis.find((a) => a.motorista_id === "mot-1" && a.status === "ativo");
  const motorista = motoristas.find((m) => m.id === aluguel?.motorista_id);
  const veiculo = veiculos.find((v) => v.id === aluguel?.veiculo_id);

  const minhasParcelas = pagamentos.filter((p) => p.aluguel_id === aluguel?.id);
  const emAberto = minhasParcelas.filter((p) => p.status !== "pago");
  const atrasada = minhasParcelas.find((p) => p.status === "atrasado");
  const minhasVistorias = vistorias.filter((v) => v.aluguel_id === aluguel?.id);
  const ultimaVistoria = minhasVistorias[minhasVistorias.length - 1];

  const [km, setKm] = useState("");
  const [obs, setObs] = useState("");
  const [fotos, setFotos] = useState<string[]>([]);

  if (!aluguel || !veiculo || !motorista) return null;

  const proximaVistoria = (() => {
    const base = ultimaVistoria ? new Date(ultimaVistoria.data) : new Date(aluguel.inicio);
    base.setDate(base.getDate() + 30);
    return base.toISOString().slice(0, 10);
  })();

  const kmDigitado = Number(km.replace(/\D/g, ""));
  const alertaManutencao =
    kmDigitado > 0 && precisaManutencao(kmDigitado, veiculo.km_ultima_revisao);

  function toggleFoto(a: string) {
    setFotos((f) => (f.includes(a) ? f.filter((x) => x !== a) : [...f, a]));
  }

  function enviarVistoria() {
    if (fotos.length < 4) {
      toast.error("Envie as 4 fotos obrigatórias do veículo.");
      return;
    }
    if (!kmDigitado) {
      toast.error("Informe a quilometragem atual.");
      return;
    }
    // db.from('vistorias').insert({...})
    db.from("vistorias").insert({
      id: uid("vis"),
      aluguel_id: aluguel!.id,
      data: new Date().toISOString().slice(0, 10),
      km: kmDigitado,
      observacoes: obs.trim().slice(0, 500),
      fotos,
      status: alertaManutencao ? "avaria" : "ok",
    });
    // db.from('veiculos').update({ km_atual }).eq('id', ...)
    db.from("veiculos").update({ km_atual: kmDigitado }).eq("id", veiculo!.id);
    setFotos([]);
    setKm("");
    setObs("");
    toast.success("Vistoria registrada com sucesso.");
  }

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 pb-20">
      <div>
        <p className="text-xs text-muted-foreground">Olá, {motorista.nome.split(" ")[0]}</p>
        <h1 className="text-2xl font-semibold tracking-tight">Minha operação</h1>
      </div>

      {/* Alerta financeiro dinâmico */}
      {atrasada ? (
        <div className="flex items-start gap-3 rounded-2xl border border-destructive/50 bg-destructive/10 p-4">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" />
          <div>
            <p className="text-sm font-medium text-destructive">
              Parcela em atraso desde {dataBR(atrasada.vencimento)}
            </p>
            <p className="text-xs text-muted-foreground">
              Regularize {brl(atrasada.valor)} para evitar o bloqueio remoto do veículo.
            </p>
          </div>
        </div>
      ) : emAberto.length ? (
        <div className="flex items-start gap-3 rounded-2xl border border-warning/50 bg-warning/10 p-4">
          <CalendarClock className="mt-0.5 size-5 shrink-0 text-warning" />
          <p className="text-sm">
            Próxima parcela de {brl(emAberto[0]!.valor)} vence em{" "}
            {dataBR(emAberto[0]!.vencimento)}.
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-2xl border border-primary/40 bg-primary/10 p-4">
          <CheckCircle2 className="size-5 text-primary" />
          <p className="text-sm">Tudo em dia. Boa rota!</p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Card do veículo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Truck className="size-4 text-primary" /> Meu veículo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-semibold">{veiculo.modelo}</p>
                <p className="text-xs text-muted-foreground">
                  Placa {veiculo.placa} · {veiculo.ano}
                </p>
              </div>
              <Badge
                variant={veiculo.rastreador_bloqueado ? "destructive" : "secondary"}
                className="text-[10px]"
              >
                {veiculo.rastreador_bloqueado ? "Bloqueado" : "Liberado"}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <Info rot="Semanal" val={brl(aluguel.valor_semanal)} />
              <Info rot="Caução" val={brl(aluguel.caucao)} />
              <Info rot="Km atual" val={`${veiculo.km_atual.toLocaleString("pt-BR")} km`} />
              <Info rot="Desde" val={dataBR(aluguel.inicio)} />
            </div>

            <div>
              <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Gauge className="size-3" /> Rodagem até a próxima revisão
                </span>
                <span>
                  {Math.max(0, 10000 - (veiculo.km_atual - veiculo.km_ultima_revisao)).toLocaleString(
                    "pt-BR",
                  )}{" "}
                  km
                </span>
              </div>
              <Progress
                value={Math.min(
                  100,
                  ((veiculo.km_atual - veiculo.km_ultima_revisao) / 10000) * 100,
                )}
              />
            </div>

            <div className="flex items-center gap-2 rounded-xl bg-secondary/60 p-3 text-xs">
              <CalendarClock className="size-4 text-primary" />
              Próxima vistoria: <strong>{dataBR(proximaVistoria)}</strong>
            </div>
          </CardContent>
        </Card>

        {/* Histórico financeiro */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Histórico financeiro</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {minhasParcelas.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border/60 p-3"
              >
                <div>
                  <p className="text-sm font-medium">{p.competencia}</p>
                  <p className="text-xs text-muted-foreground">
                    Vence {dataBR(p.vencimento)} · {brl(p.valor)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    className="text-[10px]"
                    variant={
                      p.status === "pago"
                        ? "secondary"
                        : p.status === "atrasado"
                          ? "destructive"
                          : "outline"
                    }
                  >
                    {p.status === "pago" ? "Pago" : p.status === "atrasado" ? "Atrasado" : "Em aberto"}
                  </Badge>
                  {p.status !== "pago" && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        navigator.clipboard?.writeText(p.pix_copia_cola);
                        toast.success("2ª via Pix copiada");
                      }}
                    >
                      <Copy className="mr-1 size-3" /> 2ª via
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Vistoria */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Camera className="size-4 text-primary" /> Registrar vistoria
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-4">
            {ANGULOS.map((a) => {
              const ok = fotos.includes(a);
              return (
                <button
                  key={a}
                  type="button"
                  onClick={() => toggleFoto(a)}
                  className={`flex aspect-4/3 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed text-xs transition-colors ${
                    ok
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  {ok ? <CheckCircle2 className="size-6" /> : <Camera className="size-6" />}
                  {a}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            {fotos.length}/4 fotos obrigatórias enviadas.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Quilometragem atual</Label>
              <Input
                value={km}
                inputMode="numeric"
                placeholder={String(veiculo.km_atual)}
                onChange={(e) => setKm(e.target.value.replace(/\D/g, "").slice(0, 7))}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Observações</Label>
              <Textarea
                value={obs}
                maxLength={500}
                onChange={(e) => setObs(e.target.value)}
                placeholder="Ruídos, avarias, pneus..."
              />
            </div>
          </div>

          {alertaManutencao && (
            <div className="flex items-start gap-3 rounded-2xl border border-warning/50 bg-warning/10 p-4">
              <Wrench className="mt-0.5 size-5 shrink-0 text-warning" />
              <div>
                <p className="text-sm font-medium">Manutenção preventiva necessária</p>
                <p className="text-xs text-muted-foreground">
                  O veículo passou de 10.000 km desde a última revisão. Agende na oficina parceira
                  em Itabuna.
                </p>
              </div>
            </div>
          )}

          <Button className="w-full" onClick={enviarVistoria}>
            Enviar vistoria
          </Button>

          {minhasVistorias.length > 0 && (
            <div className="space-y-2 pt-2">
              <p className="text-xs font-medium text-muted-foreground">Vistorias anteriores</p>
              {minhasVistorias
                .slice()
                .reverse()
                .map((v) => (
                  <div key={v.id} className="rounded-xl border border-border/60 p-3 text-xs">
                    <div className="flex justify-between">
                      <span className="font-medium">{dataBR(v.data)}</span>
                      <span className="text-muted-foreground">
                        {v.km.toLocaleString("pt-BR")} km · {v.fotos.length} fotos
                      </span>
                    </div>
                    {v.observacoes && (
                      <p className="mt-1 text-muted-foreground">{v.observacoes}</p>
                    )}
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

function Info({ rot, val }: { rot: string; val: string }) {
  return (
    <div className="rounded-xl bg-secondary/50 p-3">
      <p className="text-[11px] text-muted-foreground">{rot}</p>
      <p className="font-medium">{val}</p>
    </div>
  );
}
