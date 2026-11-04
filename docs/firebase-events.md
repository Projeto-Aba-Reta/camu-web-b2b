# Eventos do Firebase Analytics (GA4)

Documentação de todos os eventos enviados pelo site da Camu Studio ao Firebase Analytics.

- **Implementação:** `app/analytics.ts` (função `track`) e `app/funnel-tracker.tsx` (maior parte dos eventos).
- **Inicialização:** `FunnelTracker` (montado em `app/layout.tsx`) chama `initAnalytics()` ao carregar a página.
- **Pré-requisitos:** só envia eventos no browser, com as variáveis `NEXT_PUBLIC_FIREBASE_*` definidas (`API_KEY`, `APP_ID`, `MEASUREMENT_ID` são obrigatórias) e se o navegador suportar Analytics. Caso contrário, `track()` não faz nada.

## Convenção de nomes

A função `track(event, params)` normaliza o nome: minúsculo, sem acento, apenas `[a-z0-9_]`, começa com letra e tem no máximo 40 caracteres. O valor variável (origem do botão, seção, etc.) vai **no próprio nome do evento**, por exemplo `booking_click_hero`.

## Funil principal

```
page_view → section_view_<secao> → booking_click_<origem> → booking_opened_<origem>
          → booking_successful_<origem> (+ generate_lead)
```

## Resumo

| Evento | Quando dispara | Parâmetros |
| --- | --- | --- |
| `page_view` | Automático do SDK ao carregar a página | — |
| `section_view_<secao>` | Seção entra 35% na tela (1x por seção) | `step` |
| `scroll_depth_<25\|50\|75\|100>` | Scroll atinge a porcentagem (1x cada) | — |
| `booking_click_<origem>` | Clique em um CTA de agendamento | `label` |
| `booking_opened_<origem>` | Popup do Cal.com termina de carregar | — |
| `booking_successful_<origem>` | Agendamento concluído no Cal.com | — |
| `generate_lead` | Lead gerado (agendamento ou formulário) | `method`, `source` |
| `nav_click_<destino>` | Clique em link âncora `#...` | `location` |
| `menu_open` / `menu_close` | Abre/fecha o menu mobile | — |
| `theme_toggle_<light\|dark>` | Troca de tema | — |
| `faq_open_<pergunta>` | Pergunta do FAQ aberta | — |
| `kit_open_<slug>` | Hover/foco em card de kit | — |
| `idea_hover_<segmento>` | Hover/foco em card de ideia | — |
| `why_hover_<razao>` | Hover/foco em card "Por que a Camu" | — |
| `surprise_box_open` / `surprise_box_close` | Abre/lacra a caixa surpresa | — |
| `chat_opened` / `chat_closed` / `chat_message_sent` | Interação com o chat Crisp | — |
| `form_start_briefing` / `form_submit_briefing` | Formulário de briefing (ver nota) | — |

---

## Detalhamento

### `page_view`
Coletado automaticamente pelo SDK (GA4) quando `initAnalytics()` inicializa o Analytics. Não é chamado manualmente.

### `section_view_<secao>`
- **Arquivo:** `app/funnel-tracker.tsx` (IntersectionObserver, `threshold: 0.35`).
- **Quando:** a primeira vez que cada seção fica 35% visível. Dispara uma única vez por seção por visita.
- **Parâmetros:** `step` (posição da seção, 1–7).
- **Valores:**

| Evento | `step` | Elemento (id) |
| --- | --- | --- |
| `section_view_hero` | 1 | `#top` |
| `section_view_ruido` | 2 | `#ruido` |
| `section_view_kits` | 3 | `#solucoes` |
| `section_view_ideias` | 4 | `#ideias` |
| `section_view_por_que_camu` | 5 | `#por-que` |
| `section_view_processo` | 6 | `#processo` |
| `section_view_faq` | 7 | `#faq` |

### `scroll_depth_<25|50|75|100>`
- **Arquivo:** `app/funnel-tracker.tsx`.
- **Quando:** o scroll da página alcança 25%, 50%, 75% e 100% (com tolerância de 1 ponto percentual). Cada marco dispara uma vez por visita.

### `booking_click_<origem>`
- **Arquivo:** `app/funnel-tracker.tsx` (listener de clique em fase de captura).
- **Quando:** clique em qualquer elemento com `data-cal-link` (CTAs que abrem o agendamento do Cal.com). Também guarda a origem via `setBookingSource`, usada pelos eventos seguintes do funil.
- **Origem:** vem de `data-source`; se ausente, é a área da página (`header`, `footer`, nome da seção ou `page`).
- **Parâmetros:** `label` (texto do botão, até 60 caracteres).
- **Valores atuais:**

| Evento | Botão |
| --- | --- |
| `booking_click_header` | CTA do cabeçalho (`app/header.tsx`) |
| `booking_click_hero` | CTA do hero (`app/page.tsx`) |
| `booking_click_surprise_box` | CTA dentro da caixa surpresa (`app/surprise-kit.tsx`) |

### `booking_opened_<origem>`
- **Arquivo:** `app/cal-button.tsx`.
- **Quando:** o Cal.com emite `linkReady` — o popup de agendamento foi carregado e está pronto. Usa a origem do último `booking_click_*`.

### `booking_successful_<origem>`
- **Arquivo:** `app/cal-button.tsx`.
- **Quando:** o Cal.com emite `bookingSuccessful` — o visitante concluiu o agendamento. Usa a origem do último `booking_click_*`.

### `generate_lead`
Evento recomendado do GA4 para conversão. Disparado em dois pontos:

| Origem | Arquivo | Quando | Parâmetros |
| --- | --- | --- | --- |
| Agendamento | `app/cal-button.tsx` | Junto com `booking_successful_<origem>` | `method: "cal_briefing"`, `source: <origem>` |
| Formulário | `app/briefing-form.tsx` | No envio do formulário de briefing | `method: "briefing_form"`, `source: "briefing_form"` |

### `nav_click_<destino>`
- **Arquivo:** `app/funnel-tracker.tsx`.
- **Quando:** clique em qualquer `<a href="#...">` (logo, menu desktop/mobile, rodapé, botão do hero). `<destino>` é o id da âncora (`top` se vazio).
- **Parâmetros:** `location` — área onde o link está (`header`, `footer`, `hero`, nome da seção ou `page`).
- **Destinos atuais:** `top`, `solucoes`, `ideias`, `por-que` (vira `por_que`), `processo`, `faq`.

### `menu_open` / `menu_close`
- **Arquivo:** `app/header.tsx`.
- **Quando:** clique no botão de menu (hambúrguer) do cabeçalho mobile; `menu_open` ao abrir, `menu_close` ao fechar.

### `theme_toggle_<light|dark>`
- **Arquivo:** `app/theme-toggle.tsx`.
- **Quando:** clique no botão de tema. O sufixo é o tema **para o qual** o usuário está trocando.

### `faq_open_<pergunta>`
- **Arquivo:** `app/funnel-tracker.tsx` (evento `toggle` em `<details data-faq>`).
- **Quando:** uma pergunta do FAQ é aberta (fechar não dispara).
- **Valores:** `arquivo_3d`, `pedido_minimo`, `prazo`, `preco`, `nota_fiscal`, `entrega_brasil`.

### Eventos de interesse (`data-hover`)
- **Arquivo:** `app/funnel-tracker.tsx`.
- **Quando:** elemento com `data-hover="<evento>"` recebe o mouse por **400 ms** (passagens rápidas são ignoradas) ou ganha foco/toque. Dispara uma vez por visita para cada nome.

| Evento | Elemento | Valores |
| --- | --- | --- |
| `kit_open_<slug>` | Cards de kits (`app/page.tsx`) | `boas_vindas`, `lancamento`, `creators`, `vip`, `evento` |
| `idea_hover_<segmento>` | Cards de ideias (`app/page.tsx`) | `fintech`, `saas_b2b`, `logistica`, `hardware` |
| `why_hover_<razao>` | Cards "Por que a Camu" (`app/why-camu.tsx`) | `zero_molde`, `do_1_ao_5_000`, `design_incluso`, `feito_no_brasil` |

### `surprise_box_open` / `surprise_box_close`
- **Arquivo:** `app/surprise-kit.tsx`.
- **Quando:** `surprise_box_open` ao clicar para romper o lacre da caixa; `surprise_box_close` ao clicar para lacrá-la de novo.

### `chat_opened` / `chat_closed` / `chat_message_sent`
- **Arquivos:** `app/crisp-chat.tsx` (dispara o `CustomEvent` `camu:chat`) e `app/funnel-tracker.tsx` (converte em evento).
- **Quando:** o visitante abre o chat da Crisp (`chat_opened`), fecha (`chat_closed`) ou envia uma mensagem (`chat_message_sent`).
- **Observação:** só existe se `NEXT_PUBLIC_CRISP_WEBSITE_ID` estiver definido (ver `app/layout.tsx`).

### `form_start_briefing` / `form_submit_briefing`
- **Arquivo:** `app/briefing-form.tsx`.
- **Quando:** `form_start_briefing` no primeiro foco em qualquer campo (1x); `form_submit_briefing` ao enviar o formulário (acompanhado de `generate_lead`).
- **Nota:** o componente `BriefingForm` está importado em `app/page.tsx`, mas atualmente não é renderizado, então esses eventos não disparam hoje. O envio também ainda não está conectado a um endpoint (há um `TODO` no código).

---

## Como adicionar um novo evento

- **Ação pontual em um componente:** importe `track` de `./analytics` e chame `track("nome_do_evento", { param: valor })`.
- **Interesse em um card/caixa:** adicione `data-hover="nome_do_evento"` ao elemento (disparo único por visita).
- **CTA de agendamento:** adicione `data-source="<origem>"` junto com `{...calTrigger}` para nomear os eventos `booking_*`.
- **Nova pergunta do FAQ:** inclua uma entrada em `faqs` (`app/page.tsx`); o `data-faq` gera o evento automaticamente.
- **Nova seção rastreada:** adicione `[id, nome]` em `SECTIONS` em `app/funnel-tracker.tsx`.
