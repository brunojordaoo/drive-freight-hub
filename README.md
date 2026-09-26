# DriveWise Logtech

Crie o MVP de uma Logtech de locação de veículos comerciais (Vans/Utilitários) voltada para motoristas MEI no modelo B2B, focada na região de Itabuna/Ilhéus. 

A interface deve ser limpa, moderna, responsiva (Mobile-First), utilizando Tailwind CSS, Shadcn UI e Lucide Icons.

Implemente um estado global simulado que represente um cliente do Supabase para que a interface venha 100% populada com mock data inicial e permita mutações estruturadas.

### 1. ARQUITETURA DO BANCO DE DADOS (Simulação Supabase Client)

Garanta que os hooks e estados usem a estrutura exata das tabelas abaixo:

- 'motoristas': id (uuid), email (text), nome_completo (text), cpf (text), cnpj_mei (text), data_nascimento (date), cnh_numero (text), cnh_possui_ear (boolean), status_perfil ('pendente' | 'aprovado' | 'reprovado'), criado_em (timestamp).

- 'veiculos': id (uuid), placa (text), modelo (text), ano (integer), km_atual (integer), km_ultima_troca_oleo (integer), status_rastreador ('ativo' | 'bloqueado'), status_disponibilidade ('disponivel' | 'alugado' | 'manutencao').

- 'alugueis': id (uuid), motorista_id (uuid), veiculo_id (uuid), data_inicio (date), valor_semanal (numeric), status_contrato ('ativo' | 'suspenso' | 'encerrado').

- 'vistorias': id (uuid), aluguel_id (uuid), km_registro (integer), nivel_oleo_ok (boolean), estado_pneus (text), urls_fotos (text[]), criado_em (timestamp).

- 'pagamentos': id (uuid), aluguel_id (uuid), tipo ('cauçao' | 'aluguel_semanal'), valor (numeric), status_pagamento ('pendente' | 'pago' | 'atrasado'), data_vencimento (date), pago_em (timestamp).

### 2. NAVEGAÇÃO PRINCIPAL

Crie um Navbar/Sidebar superior que permita alternar instantaneamente entre as 3 visões do sistema para fins de demonstração (pitch):

1. Portal Público & Onboarding

2. Dashboard do Motorista

3. Painel do Administrador

### 3. INTERFACES E LOGICA DE NEGÓCIO EM TYPESCRIPT

#### PAINEL 1: PORTAL PÚBLICO E ONBOARDING DO MOTORISTA

- Landing Page: Headline forte focada em motoristas de carga de Itabuna e Ilhéus. Chamada para ação (CTA) abrindo o Onboarding.

- Formulário Stepper (Em Etapas):

  - Passo 1 (Dados): Nome, Email, Celular, CPF, CNPJ MEI e Data de Nascimento.

  - Passo 2 (CNH): Número da CNH e um Switch/Checkbox obrigatório: "Possui EAR na CNH (Exerce Atividade Remunerada)?". Se falso, exibir aviso impeditivo.

  - Passo 3 (Documentos): Dropzone simulado para CNH e Antecedentes Criminais.

- Validação Estrita TypeScript:

  - Validar idade através da data de nascimento. Se menor de 25 anos, bloquear o avanço com erro descritivo.

  - Aplicar máscaras de Input e Regex estrito para CPF (999.999.999-99), CNPJ (99.999.999/9999-99) e Telefone ((99) 99999-9999).

- Checkout da Caução: Após finalizar as etapas, exibir tela de pagamento da Caução de Segurança (R$ 1.600,00) via PIX. Renderizar um QR Code (imagem fictícia/placeholder), uma string de "Copia e Cola" e um timer regressivo real de 10:00 minutos em TypeScript.

#### PAINEL 2: DASHBOARD DO MOTORISTA (ÁREA LOGADA)

- Visão Geral do Veículo: Card destacado com foto/detalhes de um "Peugeot Partner Rapid 2023 - Placa Vermelha".

- Status Financeiro Atual: Alerta visual dinâmico com base na tabela de 'pagamentos'. Exibir status como "Pago", "A vencer na próxima Segunda-feira" ou um banner piscando em vermelho: "⚠️ Bloqueio do veículo em 24h por atraso de pagamento".

- Histórico Financeiro: Lista de parcelas semanais com botão "Copiar Segunda Via Pix".

- Aba Nova Vistoria Quinzenal: Formulário completo contendo:

  - Input numérico de KM Atual.

  - Toggle para Nível de Óleo (OK / Baixo).

  - Select para Estado dos Pneus (Bom, Regular, Ruim).

  - Botão de upload para 4 fotos obrigatórias.

  - Lógica de Manutenção: Se o KM Atual digitado for maior que (km_ultima_troca_oleo + 10000), exibir imediatamente o alerta: "Necessário agendar manutenção preventiva na oficina credenciada de Itabuna".

  - Ao salvar, simular a mutação TypeScript inserindo o registro no array de 'vistorias'.

#### PAINEL 3: PAINEL DO ADMINISTRADOR (SVA LOGTECH)

- Kanban de Aprovação: Três colunas ("Aguardando Análise", "Aprovados no Perfil", "Reprovados"). Os cartões dos motoristas devem permitir arrastar ou clicar em botões de ação rápidos para alterar o 'status_perfil' na tabela simulada.

- Gestão de Frota: Tabela listando os carros, KM acumulado e status do rastreador (Ativo/Bloqueado). Inclua uma coluna calculada por TypeScript: (km_atual * 0.20) exibida como "Fundo de Depreciação Acumulado (R$)".

- Gatilho de Inadimplência: Botão "Disparar Alerta de Atraso". Ao ser clicado, ele atualiza o 'status_rastreador' do veículo selecionado para 'bloqueado' e imprime na tela uma caixa de log estilizada com o JSON do payload simulando o envio de um Webhook REST para a API do rastreador da frota (ex: { event: "engine_lock", vehicle_id: "...", status: "requested" }).

Gere o código completo com estados reativos utilizando React (useState, useEffect) simulando os métodos .from('tabela').insert(), .from('tabela').update() e .from('tabela').select() em comentários ou funções nomeadas para facilitar a futura substituição pelo cliente real do Supabase.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/56956d42-e6ee-4393-9ef6-0ff63f699319).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
