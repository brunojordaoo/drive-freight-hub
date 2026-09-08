import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Copy,
  Gauge,
  MapPin,
  QrCode,
  ShieldCheck,
  Timer,
  UploadCloud,
  Wrench,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  db,
  DOCS_PADRAO,
  brl,
  caucaoDe,
  idadeEm,
  maskCNPJ,
  maskCPF,
  maskTel,
  uid,
  useDb,
  type Veiculo,
} from "@/lib/mock-supabase";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Vantura Frota — Vans e utilitários para MEI em Itabuna e Ilhéus" },
      {
        name: "description",
        content:
          "Alugue vans e utilitários por semana, sem burocracia bancária. Cadastro 100% digital para motoristas MEI da região de Itabuna e Ilhéus.",
      },
      { property: "og:title", content: "Vantura Frota — Locação de utilitários para MEI" },
      {
        property: "og:description",
        content: "Van na porta em até 48h. Caução no Pix, manutenção e rastreador inclusos.",
      },
    ],
  }),
  component: Portal,
});

const cadastroSchema = z.object({
  nome: z.string().trim().min(5, "Informe o nome completo").max(100),
  email: z.string().trim().email("E-mail inválido").max(255),
  telefone: z.string().refine((v) => v.replace(/\D/g, "").length === 11, "Telefone inválido"),
  data_nascimento: z
    .string()
    .min(1, "Informe a data de nascimento")
    .refine((v) => idadeEm(v) >= 25, "É necessário ter 25 anos ou mais"),
  cpf: z.string().refine((v) => v.replace(/\D/g, "").length === 11, "CPF incompleto"),
  cnpj: z.string().refine((v) => v.replace(/\D/g, "").length === 14, "CNPJ MEI incompleto"),
  cnh: z.string().refine((v) => v.replace(/\D/g, "").length === 11, "CNH deve ter 11 dígitos"),
  tem_ear: z.literal(true, { errorMap: () => ({ message: "A CNH precisa ter a observação EAR" }) }),
  cidade: z.string().trim().min(3, "Informe a cidade"),
  comprovante_residencia: z.literal(true, {
    errorMap: () => ({ message: "Anexe o comprovante de residência (frente)" }),
  }),
});

type Erros = Record<string, string | undefined>;

function Portal() {
  // db.from('veiculos').select()
  const veiculos = useDb((s) => s.veiculos);
  const [passo, setPasso] = useState(1);
  const [veiculoId, setVeiculoId] = useState<string | null>(null);
  const [erros, setErros] = useState<Erros>({});
  const [form, setForm] = useState({
    nome: "",
    email: "",
    telefone: "",
    data_nascimento: "",
    cpf: "",
    cnpj: "",
    cnh: "",
    tem_ear: false,
    cidade: "Itabuna",
    comprovante_residencia: false,
  });
  const [pedido, setPedido] = useState<{ motoristaId: string; veiculo: Veiculo } | null>(null);

  const set = (k: keyof typeof form, v: string | boolean) =>
    setForm((f) => ({ ...f, [k]: v }));

  const disponiveis = veiculos.filter((v) => v.status !== "manutencao");
  const selecionado = veiculos.find((v) => v.id === veiculoId) ?? null;

  function validarEAvancar() {
    const r = cadastroSchema.safeParse(form);
    if (!r.success) {
      const e: Erros = {};
      r.error.issues.forEach((i) => (e[String(i.path[0])] = i.message));
      setErros(e);
      toast.error("Confira os campos destacados.");
      return;
    }
    setErros({});
    setPasso(3);
  }

  function confirmarCadastro() {
    if (!selecionado) return;
    const motoristaId = uid("mot");
    // db.from('motoristas').insert({...})
    db.from("motoristas").insert({
      id: motoristaId,
      nome: form.nome,
      cpf: form.cpf,
      cnpj: form.cnpj,
      telefone: form.telefone,
      email: form.email,
      data_nascimento: form.data_nascimento,
      cnh: form.cnh,
      tem_ear: true,
      cidade: form.cidade,
      status: "pendente",
      criado_em: new Date().toISOString().slice(0, 10),
      documentos: DOCS_PADRAO(form.cpf.replace(/\D/g, "").slice(0, 6) || motoristaId),
      observacoes_admin: "",
    });
    setPedido({ motoristaId, veiculo: selecionado });
    toast.success("Cadastro enviado para análise!");
  }

  return (
    <main className="mx-auto max-w-6xl px-4 pb-20">
      {/* HERO */}
      <section className="py-12 sm:py-16">
        <Badge className="mb-4 bg-primary/15 text-primary hover:bg-primary/15">
          <MapPin className="mr-1 size-3" /> Sul da Bahia · Itabuna e Ilhéus
        </Badge>
        <h1 className="max-w-2xl text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">
          Sua van de trabalho sem entrada, sem banco e sem fila.
        </h1>
        <p className="mt-4 max-w-xl text-sm text-muted-foreground sm:text-base">
          Locação semanal de utilitários para motoristas MEI que rodam com aplicativos e
          transportadoras. Manutenção, rastreador e documentação por nossa conta.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button size="lg" onClick={() => setPasso(1)} asChild={false}>
            <a href="#cadastro" className="flex items-center gap-2">
              Quero alugar <ArrowRight className="size-4" />
            </a>
          </Button>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="size-4 text-primary" /> Caução de {brl(1700)} a {brl(2500)} via
            Pix
          </div>
        </div>

        <div className="mt-10 grid gap-3 sm:grid-cols-3">
          {[
            { icon: Wrench, t: "Manutenção inclusa", d: "Revisão a cada 10.000 km por nossa conta." },
            { icon: BadgeCheck, t: "Aprovação em 48h", d: "Análise digital de CNH com EAR e MEI ativo." },
            { icon: Gauge, t: "Pagamento semanal", d: "Boleto Pix toda semana, sem juros escondidos." },
          ].map((b) => (
            <div key={b.t} className="glass-panel rounded-2xl p-4">
              <b.icon className="size-5 text-primary" />
              <p className="mt-3 text-sm font-medium">{b.t}</p>
              <p className="mt-1 text-xs text-muted-foreground">{b.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CADASTRO */}
      <section id="cadastro" className="scroll-mt-20">
        <div className="mb-6 flex items-center gap-2">
          {[1, 2, 3].map((n) => (
            <div key={n} className="flex flex-1 items-center gap-2">
              <span
                className={`grid size-8 shrink-0 place-items-center rounded-full text-xs font-semibold ${
                  passo >= n
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                {n}
              </span>
              {n < 3 && (
                <span
                  className={`h-px flex-1 ${passo > n ? "bg-primary" : "bg-border"}`}
                  aria-hidden
                />
              )}
            </div>
          ))}
        </div>

        {pedido ? (
          <Checkout
            veiculo={pedido.veiculo}
            onNovo={() => {
              setPedido(null);
              setPasso(1);
              setVeiculoId(null);
            }}
          />
        ) : (
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">
                {passo === 1 && "Passo 1 · Escolha o utilitário"}
                {passo === 2 && "Passo 2 · Seus dados de MEI"}
                {passo === 3 && "Passo 3 · Revisão do pedido"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {passo === 1 && (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {disponiveis.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setVeiculoId(v.id)}
                        className={`rounded-2xl border p-4 text-left transition-colors ${
                          veiculoId === v.id
                            ? "border-primary bg-primary/10"
                            : "border-border/60 hover:border-primary/50"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium">{v.modelo}</p>
                          <Badge variant="secondary" className="text-[10px]">
                            {v.status === "disponivel" ? "Disponível" : "Fila de espera"}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {v.ano} · {v.km_atual.toLocaleString("pt-BR")} km · {v.placa}
                        </p>
                        <p className="mt-3 text-lg font-semibold text-primary">
                          {brl(v.valor_semanal)}
                          <span className="text-xs font-normal text-muted-foreground">/semana</span>
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {v.tipo === "furgao" ? "Furgão" : "Van"} · caução {brl(caucaoDe(v.tipo))}
                        </p>
                      </button>
                    ))}
                  </div>
                  <Button
                    className="w-full"
                    disabled={!veiculoId}
                    onClick={() => setPasso(2)}
                  >
                    Continuar
                  </Button>
                </>
              )}

              {passo === 2 && (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Campo label="Nome completo" erro={erros['nome']}>
                      <Input
                        value={form.nome}
                        maxLength={100}
                        onChange={(e) => set("nome", e.target.value)}
                        placeholder="Como está na CNH"
                      />
                    </Campo>
                    <Campo label="E-mail" erro={erros['email']}>
                      <Input
                        value={form.email}
                        maxLength={255}
                        onChange={(e) => set("email", e.target.value)}
                        placeholder="voce@email.com"
                      />
                    </Campo>
                    <Campo label="Telefone" erro={erros['telefone']}>
                      <Input
                        value={form.telefone}
                        onChange={(e) => set("telefone", maskTel(e.target.value))}
                        placeholder="(73) 99999-0000"
                        inputMode="numeric"
                      />
                    </Campo>
                    <Campo label="Data de nascimento" erro={erros['data_nascimento']}>
                      <Input
                        type="date"
                        value={form.data_nascimento}
                        onChange={(e) => set("data_nascimento", e.target.value)}
                      />
                    </Campo>
                    <Campo label="CPF" erro={erros['cpf']}>
                      <Input
                        value={form.cpf}
                        onChange={(e) => set("cpf", maskCPF(e.target.value))}
                        placeholder="000.000.000-00"
                        inputMode="numeric"
                      />
                    </Campo>
                    <Campo label="CNPJ (MEI)" erro={erros['cnpj']}>
                      <Input
                        value={form.cnpj}
                        onChange={(e) => set("cnpj", maskCNPJ(e.target.value))}
                        placeholder="00.000.000/0001-00"
                        inputMode="numeric"
                      />
                    </Campo>
                    <Campo label="Número da CNH" erro={erros['cnh']}>
                      <Input
                        value={form.cnh}
                        onChange={(e) => set("cnh", e.target.value.replace(/\D/g, "").slice(0, 11))}
                        placeholder="11 dígitos"
                        inputMode="numeric"
                      />
                    </Campo>
                    <Campo label="Cidade" erro={erros['cidade']}>
                      <Input
                        value={form.cidade}
                        maxLength={60}
                        onChange={(e) => set("cidade", e.target.value)}
                      />
                    </Campo>
                  </div>

                  <div className="flex items-start justify-between gap-4 rounded-2xl border border-border/60 p-4">
                    <div>
                      <p className="text-sm font-medium">Minha CNH tem a observação EAR</p>
                      <p className="text-xs text-muted-foreground">
                        Exigência legal para atividade remunerada. Sem EAR não é possível alugar.
                      </p>
                      {erros['tem_ear'] && (
                        <p className="mt-1 text-xs text-destructive">{erros['tem_ear']}</p>
                      )}
                    </div>
                    <Switch
                      checked={form.tem_ear}
                      onCheckedChange={(c) => set("tem_ear", c)}
                      aria-label="CNH com EAR"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => set("comprovante_residencia", !form.comprovante_residencia)}
                    className={`flex w-full items-center gap-3 rounded-2xl border border-dashed p-4 text-left transition-colors ${
                      form.comprovante_residencia
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    {form.comprovante_residencia ? (
                      <CheckCircle2 className="size-6 shrink-0 text-primary" />
                    ) : (
                      <UploadCloud className="size-6 shrink-0 text-muted-foreground" />
                    )}
                    <span>
                      <span className="block text-sm font-medium">
                        {form.comprovante_residencia
                          ? "Comprovante de residência anexado"
                          : "Anexar comprovante de residência (frente)"}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        Conta de luz, água ou telefone recente em seu nome.
                      </span>
                      {erros['comprovante_residencia'] && (
                        <span className="mt-1 block text-xs text-destructive">
                          {erros['comprovante_residencia']}
                        </span>
                      )}
                    </span>
                  </button>

                  <div className="flex gap-3">
                    <Button variant="secondary" className="flex-1" onClick={() => setPasso(1)}>
                      Voltar
                    </Button>
                    <Button className="flex-1" onClick={validarEAvancar}>
                      Revisar
                    </Button>
                  </div>
                </>
              )}

              {passo === 3 && selecionado && (
                <>
                  <div className="rounded-2xl border border-border/60 p-4 text-sm">
                    <Linha rot="Motorista" val={form.nome} />
                    <Linha rot="MEI" val={form.cnpj} />
                    <Linha rot="Contato" val={`${form.telefone} · ${form.email}`} />
                    <Linha rot="Cidade" val={form.cidade} />
                    <Separator className="my-3" />
                    <Linha rot="Veículo" val={`${selecionado.modelo} · ${selecionado.placa}`} />
                    <Linha rot="Semanal" val={brl(selecionado.valor_semanal)} />
                    <Linha rot="Caução (Pix)" val={brl(caucaoDe(selecionado.tipo))} />
                    <Linha rot="Documentos" val="CNH + comprovante de residência anexados" />
                  </div>
                  <div className="flex gap-3">
                    <Button variant="secondary" className="flex-1" onClick={() => setPasso(2)}>
                      Voltar
                    </Button>
                    <Button className="flex-1" onClick={confirmarCadastro}>
                      Ir para o pagamento
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </section>
    </main>
  );
}

function Campo({
  label,
  erro,
  children,
}: {
  label: string;
  erro?: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
      {erro && <p className="text-xs text-destructive">{erro}</p>}
    </div>
  );
}

function Linha({ rot, val }: { rot: string; val: string }) {
  return (
    <div className="flex justify-between gap-4 py-1">
      <span className="text-muted-foreground">{rot}</span>
      <span className="text-right font-medium">{val}</span>
    </div>
  );
}

function Checkout({ veiculo, onNovo }: { veiculo: Veiculo; onNovo: () => void }) {
  const [segundos, setSegundos] = useState(600);
  const [pago, setPago] = useState(false);

  useEffect(() => {
    if (pago) return;
    const t = setInterval(() => setSegundos((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [pago]);

  const mmss = useMemo(
    () =>
      `${String(Math.floor(segundos / 60)).padStart(2, "0")}:${String(segundos % 60).padStart(2, "0")}`,
    [segundos],
  );

  const caucao = caucaoDe(veiculo.tipo);
  const codigo = `00020126VANTURACAUCAO${veiculo.placa.replace("-", "")}52040000530398654${caucao}5802BR5913VANTURA FROTA6008ITABUNA6304A1B2`;

  return (
    <Card className="border-primary/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <QrCode className="size-4 text-primary" /> Pagamento da caução
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {pago ? (
          <div className="rounded-2xl border border-primary/40 bg-primary/10 p-5 text-center">
            <CheckCircle2 className="mx-auto size-8 text-primary" />
            <p className="mt-3 text-sm font-medium">Caução recebida!</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Seu cadastro entrou na fila de aprovação. Avisamos por WhatsApp em até 48h.
            </p>
            <Button className="mt-4" variant="secondary" onClick={onNovo}>
              Fazer novo pedido
            </Button>
          </div>
        ) : (
          <>
            <div
              className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium ${
                segundos === 0 ? "bg-destructive/15 text-destructive" : "bg-secondary"
              }`}
            >
              <Timer className="size-4" />
              {segundos === 0 ? "Código Pix expirado" : `Código expira em ${mmss}`}
            </div>

            <div className="mx-auto grid size-40 place-items-center rounded-2xl bg-foreground/95">
              <QrCode className="size-28 text-background" />
            </div>

            <div className="text-center">
              <p className="text-xs text-muted-foreground">Caução do {veiculo.modelo}</p>
              <p className="text-3xl font-semibold text-primary">{brl(caucao)}</p>
            </div>

            <p className="break-all rounded-xl bg-secondary/60 p-3 text-[11px] text-muted-foreground">
              {codigo}
            </p>

            <div className="grid gap-2 sm:grid-cols-2">
              <Button
                variant="secondary"
                onClick={() => {
                  navigator.clipboard?.writeText(codigo);
                  toast.success("Código Pix copiado");
                }}
              >
                <Copy className="mr-2 size-4" /> Copiar código
              </Button>
              <Button disabled={segundos === 0} onClick={() => setPago(true)}>
                Já paguei
              </Button>
            </div>
            {segundos === 0 && (
              <Button variant="ghost" className="w-full" onClick={() => setSegundos(600)}>
                Gerar novo código
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
