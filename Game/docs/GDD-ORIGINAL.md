# ETERNAL REALMS — Ascensão dos Reinos
## GDD v1.0 (decisões finais) + Plano de Implementação no Google AI Studio

> Este documento **decide** tudo que o conceito original deixava em aberto. Onde havia opções, escolhi uma. Os números são valores iniciais de balanceamento e ficam em um único arquivo (`data/balance.ts`) para ajustar depois sem mexer no código.

---

## 0. Decisões-chave (resumo)

| Tema | Decisão |
|---|---|
| Gênero | Começa como **RPG de ação top-down**; vira **estratégia de reino/exército** conforme você sobe de Rank |
| Plataforma | Jogo web 100% no navegador, feito no AI Studio (React + TypeScript + Canvas 2D) |
| Estilo visual | **Pixel art chibi 2D**, sprites 32×32, gerados por código (paper-doll com troca de paleta) no protótipo |
| Estrutura do mundo | **2 camadas**: Mapa-múndi em nós (viagem, eventos, tempo passando) + Zonas locais em top-down (ação) |
| Tamanho do mundo | **16 regiões**: 6 reinos + 10 regiões neutras |
| Raças | **24 jogáveis + 1 secreta (Slime)**, cada uma com 3 ramos de evolução e 5 tiers |
| Classes | **6 classes base** → especializações nos níveis 20/40/70 → classe secundária (híbridas) no nível 50 |
| Atributos | FOR, DES, CON, INT, SAB, CAR (D&D) |
| Rank | E → D → C → B → A → S → SS → SSS → EX → Mítico → Divino, calculado por **Poder (PW)**, não por nível |
| Magia | 7 afinidades base (0–100) + 7 avançadas (desbloqueadas por combinação) + 1 Forma Única por personagem |
| Grimório | 5 páginas (níveis 1/15/35/60/85) + 6ª página "Proibida" rara |
| Exércitos | Até **40 personagens nomeados** com ficha completa; tropas são **números abstratos** dentro de esquadrões (performance) |
| Combate de exército | Tático em **tempo real com pausa**, ordens + triângulo de contra-ataque, resolução simulada |
| Mundo vivo | Simulação por dia de jogo (1 dia = 90 s reais) com IA de reinos, eventos e "Quebra de Dungeon" |
| Salvamento | `localStorage` com try/catch + exportar/importar JSON |
| IA generativa | Opcional na Fase 8 (Gemini): narrador/histórias de recrutas, sempre com fallback offline |
| Meta de entrega | **Vertical Slice jogável = Fases 0 a 5**. Fases 6–8 levam ao 1.0 |

---

## 1. Pilares e loop de jogo

**Pilares:** (1) personagens únicos pela combinação de sistemas; (2) progressão que muda o tipo de jogo; (3) mundo que continua rodando sem você; (4) escolhas de evolução com consequência.

**Loop curto (5–10 min):** viajar → entrar em zona/dungeon → lutar → coletar loot/XP/Essência → voltar à cidade → gastar (equipar, recrutar, melhorar).

**Loop médio (1–2 h):** subir de Rank → evoluir raça/classe → recrutar oficiais → dominar um território.

**Loop longo:** Aventureiro → Rei → Imperador, administrando reinos, guerras e diplomacia.

**Transição RPG → Estratégia (regra explícita):**
- Rank E–D: só ação, grupo de até 4.
- Rank C: desbloqueia Companhia (12) e a **tela Batalhão**.
- Rank B: desbloqueia **território** (vila) e economia.
- Rank A+: desbloqueia governar cidades, exércitos e diplomacia. O modo ação continua disponível sempre.

---

## 2. O Mundo — 16 regiões

### 2.1 Os 6 Reinos
Cada reino tem **3 anéis**: *Marcas* (nível 1–15), *Interior* (15–40), *Núcleo/Capital* (40–70). Você **começa nas Marcas do reino da sua raça**.

| Reino | Capital | Raças predominantes | Tema / Facção |
|---|---|---|---|
| **Valoria** | Lumeris | Humano, Halfling, Gnomo, Meio-Elfo | Cavaleiros, Paladinos, Magos; ordem e comércio |
| **Sylvaris** | Aelthar | Elfo, Fada, Driade, Tribo-Fera | Druidas, espíritos; equilíbrio natural |
| **Drakmor** | Kar-Drakh | Orc, Goblin, Draconiano, Ogro | Dragões, bestas; força e conquista |
| **Noxaris** | Nyx'Thal | Tiefling, Elfo Negro, Morto-vivo, Vampiro | Demônios, necromantes; poder e pactos |
| **Frostheim** | Hjalmgard | Anão, Frostborn, Gigante, Lobo Ancestral | Forja, gelo, clãs ancestrais |
| **Aurelia** | Solarion | Celestial, Abençoado, Autômato Sagrado, Leonino | Serafins, luz, ordem divina |

### 2.2 As 10 regiões neutras

| Região | Nível | Papel |
|---|---|---|
| **Arkanis** (Cidade-Livre) | 1–10 | Hub da Guilda dos Aventureiros; segunda opção de início; missões e recrutas de todas as raças |
| Floresta Primordial | 5–25 | Bestas, druidas, ingredientes, dungeons E–C |
| Pântano Sombrio | 15–35 | Veneno, mortos-vivos, dungeons D–B |
| Deserto dos Ossos | 25–45 | Cripta, esqueletos, tesouros antigos |
| Ruínas Antigas | 35–55 | Golems, magia perdida, relíquias |
| Vulcão Ígnis | 45–65 | Fogo, dragões menores, minérios raros |
| Terras Corrompidas | 55–75 | Monstros corrompidos, Quebras de Dungeon frequentes |
| Mar Eterno | 60–80 | Travessia por navio, ilhas, criaturas marinhas |
| Ilhas dos Dragões | 70–90 | Dragões ancestrais, Grimório Proibido |
| Abismo | 80–100 | Endgame; bosses Rank SS+ |

### 2.3 Estrutura de mapa
- **Mapa-múndi:** grafo de nós (cidades, vilas, fortalezas, dungeons, pontos de evento). Viajar consome dias (afeta a simulação do mundo).
- **Zona local:** mapa top-down 2D gerado por seed (~60×40 tiles), com inimigos, coletáveis e saídas.
- Cada região: 1 capital/hub, 3–6 cidades/vilas, 2–5 dungeons, 1 boss regional, recursos e eventos próprios.

---

## 3. Raças e Evolução

### 3.1 Regras de evolução
- **6 tiers:** T0 Base → T1 → T2 → T3 → T4 → T5 (Ancestral).
- **Níveis mínimos:** T1 nv10 · T2 nv25 · T3 nv45 · T4 nv70 · T5 nv95.
- **Requisitos além do nível:** gastar **Essência** (dropa de monstros/dungeons) + cumprir 1 condição (quest, item, título ou afinidade mínima).
- **Ramos:** no T2 você escolhe **1 de 3 ramos** (definem T2→T5):
  - **Marcial** (Força, defesa, liderança de linha de frente)
  - **Arcano** (magia, mana, afinidades)
  - **Único** (identidade racial: Sagrado, Corrupto, Selvagem ou Soberano — o **alinhamento** do ramo é decidido pelo jogador via escolhas de quest)
- **Ramos alternativos por escolha:** se um personagem cumprir condição especial (ex.: Orc com afinidade Trevas ≥ 70), aparece um 4º ramo oculto ("Corrupção").
- **Bônus de Poder (PW) por tier:** T1 +50 · T2 +150 · T3 +400 · T4 +900 · T5 +2000.
- Evolução concede: bônus de atributos, nova aparência (sprite), habilidade racial nova por tier e ajuste de crescimento.

### 3.2 As 24 raças (+ Slime secreta)
Cada linha: T1 → (T5 final de cada ramo). Os tiers T2–T4 seguem o padrão `{nome do ramo} I/II/III` gerado nos dados, com nome próprio ajustável depois.

| # | Raça | T1 | T5 Marcial | T5 Arcano | T5 Único |
|---|---|---|---|---|---|
| 1 | Humano | Desperto | Campeão Lendário | Sábio Arcano | Humano Divino |
| 2 | Halfling | Andarilho | Lâmina das Sombras | Bardo Místico | Sortudo Ancestral |
| 3 | Gnomo | Artífice | Engenheiro de Guerra | Artífice Rúnico | Mestre Golemista |
| 4 | Meio-Elfo | Errante | Duelista Real | Arcanista Real | Soberano Imperial |
| 5 | Elfo | Elfo Superior | Arqueiro Lunar | Arquimago Élfico | Elfo Ancestral |
| 6 | Fada | Fada Maior | Valquíria Silvestre | Rainha Feérica | Espírito da Floresta |
| 7 | Driade | Guardiã Antiga | Guardião de Carvalho | Druida-Mãe | Avatar da Árvore-Mundo |
| 8 | Tribo-Fera | Alfa | Senhor das Presas | Xamã Ancestral | Fera Ancestral |
| 9 | Orc | Orc Guerreiro | Warlord | High Shaman | Orc Abissal |
| 10 | Goblin | Hobgoblin | Rei Goblin | Xamã Goblin Ancestral | Demon Goblin Ancestral |
| 11 | Draconiano | Draconato | Dragoon | Feiticeiro Dracônico | Dragão Ancestral |
| 12 | Ogro | Ogro Brutal | Ogro Rei | Ogro Mago | Titã |
| 13 | Tiefling | Imp Maior | Cavaleiro Infernal | Arquimago Infernal | Lorde Demônio |
| 14 | Elfo Negro | Dark Elf Nobre | Assassino Umbral | Feiticeiro Umbral | Soberano Umbral |
| 15 | Morto-vivo | Esqueleto Guerreiro | Cavaleiro da Morte | Lich | Rei dos Mortos |
| 16 | Vampiro | Vampiro Nobre | Lorde Sanguíneo | Arquimago de Sangue | Vampiro Ancestral |
| 17 | Anão | Anão de Ferro | Senhor da Forja | Runemestre | Titã da Forja |
| 18 | Frostborn | Frostborn Guerreiro | Cavaleiro Glacial | Arquimago do Gelo | Avatar do Inverno |
| 19 | Gigante | Gigante Jovem | Colosso | Xamã Gigante | Titã de Gelo |
| 20 | Lobo Ancestral | Dire Wolf | Fenrir | Lobo Espectral | Ancient Fenrir → Fera Mítica |
| 21 | Celestial | Anjo Menor | Arcanjo Guerreiro | Serafim | Divindade Menor |
| 22 | Abençoado | Iluminado | Cruzado | Clérigo Supremo | Santo |
| 23 | Autômato Sagrado | Golem Consagrado | Sentinela | Núcleo Arcano | Colosso Divino |
| 24 | Leonino | Leão Dourado | Rei Leão | Xamã Solar | Deus Solar |
| ★ | **Slime** (secreta) | Great Slime | Slime Devorador | Magic Slime | Ancient Slime |

**Slime:** desbloqueada ao derrotar 100 slimes e completar a quest "Essência Primordial". Habilidade racial única *Devorar* (absorve traços/skills de inimigos derrotados, com limite de slots).

### 3.3 Modificadores raciais iniciais (T0)
- Cada raça: **+2 em um atributo, +1 em outro, −1 em um terceiro**, +1 habilidade racial passiva, +1 habilidade racial ativa, e **afinidade inicial** (2 elementos com bônus +20).
- Exemplos: Orc (+2 FOR, +1 CON, −1 INT; Fogo/Terra) · Elfo (+2 DES, +1 SAB, −1 CON; Ar/Espírito) · Humano (+1 em três atributos à escolha, sem penalidade; sem bônus de afinidade, mas +10% XP).

---

## 4. Atributos e Estatísticas

### 4.1 Criação
- Todos começam em 8; **27 pontos** para distribuir (compra de pontos, máximo 15 na criação) + modificadores raciais.
- Cada nível: **+3 pontos livres** + crescimento automático da raça/classe.

### 4.2 Estatísticas derivadas
| Estatística | Fórmula |
|---|---|
| Vida | 50 + CON×10 + nível×8 |
| Mana | 20 + INT×5 + SAB×3 + nível×3 |
| Stamina | 80 + CON×2 + DES×2 |
| Ataque Físico | FOR×2 + DES×0,5 + arma |
| Poder Mágico | INT×2 + SAB×0,5 + cajado, × (1 + afinidade/200) |
| Defesa | CON + armadura |
| Resistência Mágica | SAB + itens + afinidade da defesa |
| Velocidade | 100 + DES×0,5 (+ bônus de montaria) |
| Crítico | 5% + DES×0,2% (dano crítico 150%) |
| Carisma | Preço em lojas, chance de domesticar, lealdade de recrutas, diplomacia |
| Regen | Vida: CON×0,1/s fora de combate · Mana: SAB×0,2/s · Stamina: 15/s |

### 4.3 XP
`XP para o próximo nível = 50 × nível^1,6`. Nível máximo: **100**.

### 4.4 Afinidades e resistências
Ver seção 8 (Magia).

---

## 5. Classes

### 5.1 As 6 classes base (escolha na criação)
Guerreiro · Mago · Arqueiro · Assassino · Clérigo · Invocador

Cada classe dá: dado de crescimento de atributos, 4 habilidades ativas iniciais, 1 passiva, tipo de arma.

### 5.2 Especializações (nv 20 → nv 40 → nv 70)

| Base | Caminho A | Caminho B | Caminho C |
|---|---|---|---|
| **Guerreiro** | Cavaleiro → Paladino → Santo da Espada | Berserker → Campeão → Warlord | Duelista → Mestre Lâmina → Espadachim Supremo |
| **Mago** | Elementalista → Arquimago → Sábio dos Elementos | Necromante → Lich → Soberano dos Mortos | Runeiro → Mestre das Runas → Tecelão da Realidade |
| **Arqueiro** | Patrulheiro → Caçador de Feras → Senhor da Caça | Atirador → Franco-atirador → Olho do Céu | Arqueiro Arcano → Flecha Mágica → Arqueiro Estelar |
| **Assassino** | Ladino → Sombra → Mestre da Noite | Envenenador → Alquimista da Morte → Rei Veneno | Lâmina Fantasma → Ceifador → Morte Encarnada |
| **Clérigo** | Sacerdote → Bispo → Santo | Inquisidor → Julgador → Arauto da Ira | Druida → Guardião da Natureza → Voz da Floresta |
| **Invocador** | Domador → Mestre das Feras → Rei das Bestas | Espiritualista → Mestre dos Espíritos → Soberano Espiritual | Conjurador Pactuado → Senhor dos Pactos → Lorde dos Pactos |

Paladino, Necromante, Monge (via Guerreiro/Cavaleiro com Ki) etc. **existem como especializações**, não como classes iniciais.

### 5.3 Classe secundária (Híbridas)
No **nv 50**, o personagem escolhe uma **segunda classe** (só até o 1º tier de especialização dela). O nome híbrido é gerado por combinação (ex.: Cavaleiro + Mago = **Cavaleiro Arcano**; Assassino + Invocador = **Sombra Pactuada**). Bônus: soma parcial (60%) do passivo da secundária.

---

## 6. Rank de Poder (Solo Leveling)

### 6.1 Fórmula
```
PW = (soma dos 6 atributos − 48) + 4×nível
   + poder_equipamento + poder_habilidades
   + bônus_evolução + bônus_títulos + bônus_despertar
```
### 6.2 Tabela

| Rank | PW mínimo | Rank | PW mínimo |
|---|---|---|---|
| E | 0 | SS | 2.500 |
| D | 100 | SSS | 4.000 |
| C | 250 | EX | 6.500 |
| B | 500 | Mítico | 10.000 |
| A | 900 | Divino | 15.000 |
| S | 1.500 | | |

- **Rank ≠ nível:** um nv 50 pode ser B (pouca evolução) e um nv 30 pode ser A (evoluído, com equipamento e título).
- Rank aparece com destaque no HUD, nas dungeons (rank recomendado) e no recrutamento.
- **Poder de equipamento:** valor base por raridade × nível do item. **Poder de habilidade:** soma dos níveis de skills × peso do tier.
- **Rank de dungeon/monstro** usa a mesma escala (E–S no MVP; SS+ no endgame).

---

## 7. Despertar

- Todo personagem tem **Potencial oculto** (E a SSS). Só é revelado com a habilidade *Olho do Abismo* ou ao Despertar.
- **Tipos:**
  1. **Despertar de Rank:** +1 tier de Potencial aproveitado (bônus de PW +400 no primeiro; escala depois).
  2. **Despertar de Habilidade Única:** ganha uma skill exclusiva (ex.: *Olho do Abismo* — vê mana, revela fraquezas, copia padrões mágicos, analisa jogadores/NPCs).
  3. **Despertar de Linhagem:** para recrutas — sobe a raça/tier direto.
- **Gatilhos:** (a) **Primeiro Despertar garantido** na missão principal do nível 15; (b) chance de 3% ao derrotar boss de Rank acima do seu; (c) chance ao vencer com Vida < 10%; (d) sistema de "pity": a cada 10 gatilhos falhados o próximo é garantido.
- Despertar tem cutscene curta + animação de mudança de sprite e exibição "Antes → Depois".

---

## 8. Sistema de Magia (Black Clover) e Grimório

### 8.1 Afinidades
- **7 base (0–100):** Fogo, Água, Terra, Ar, Luz, Trevas, Espírito. Definidas por raça + rolagem (±15) + treino.
- **7 avançadas** (desbloqueiam quando as duas base indicadas ≥ 60, ou por raça/título):

| Avançada | Base necessária |
|---|---|
| Gelo | Água + Ar |
| Relâmpago | Ar + Fogo |
| Natureza | Terra + Água |
| Sangue | Trevas + Fogo |
| Espaço | Trevas + Ar |
| Tempo | Luz + Espírito |
| Mente | Espírito + Água |

- **Efeito da afinidade:** dano mágico do elemento × (1 + afinidade/200); custo de mana × (1 − afinidade/400); acima de 80 desbloqueia habilidades de "Tier Superior".

### 8.2 Forma Única de Magia
Cada personagem recebe **1 Forma Única** ao ser criado/gerado, sorteada de um pool de 20 (ex.: **Correntes** — prender, criar armas, barreiras, puxar aliados, armadilhas · Espelhos · Gravidade · Marionetes · Selos · Sombras Vivas · Lâminas de Vento · Bestas de Cristal…). 1% de chance de vir uma **Forma Proibida** (mais forte, com custo de Vida/Corrupção).

### 8.3 Grimório
- Cada personagem tem um Grimório com **5 páginas**, liberadas nos **níveis 1 / 15 / 35 / 60 / 85**.
- Cada página = 1 magia com **3 níveis de melhoria**.
- Exemplo (Fogo): Fireball → Flame Blade → Inferno → Dragon Flame → Meteor Apocalypse.
- **6ª Página Proibida** (rara, 1/500 ou via Ilhas dos Dragões/Abismo): poder alto, aplica **Corrupção** (efeito colateral).
- O Grimório escolhe a afinidade **principal** do personagem; magias de afinidades secundárias entram como skills soltas (slots de skill).

---

## 9. Combate

### 9.1 Combate de Ação (modo principal)
- **Controles:** WASD mover · J/clique atacar (combo de 3 golpes) · Espaço esquiva (frames de invulnerabilidade, custa stamina) · 1–4 habilidades · E interagir · Tab abrir Grimório rápido · P pausa.
- **Recursos:** Vida, Mana, Stamina.
- **Fórmula de dano:**
`Dano = ATQ × mult_skill × (100 / (100 + DEF_alvo)) × (crítico ? 1,5 : 1) × mod_elemental`
- `mod_elemental`: fraco 1,5 · neutro 1,0 · resistente 0,5.
- **Inimigos:** telegrafam ataques (indicador de área 0,4–0,8 s). Tipos: melee, ranged, tank, mago, elite (com modificadores), boss (3 fases).
- **Status:** queimadura, veneno, congelamento, lentidão, sangramento, medo, silêncio, corrupção.
- **Companheiros do grupo (até 4 no total)** têm IA simples: seguem, focam alvo, usam skills por prioridade, respeitam a ordem "agressivo/defensivo/suporte".

### 9.2 Combate Estratégico (Batalhão)
- Desbloqueia no Rank C. Mapa de batalha top-down com **esquadrões** como peças.
- **Ordens:** Atacar · Defender · Cercar · Recuar · Usar Magia · Proteger Comandante · Capturar Território.
- **Tempo real com pausa:** o jogador pode pausar e dar ordens; a simulação roda em ticks de 0,5 s.
- **Triângulo de contra-ataque (+25% de dano):** Vanguarda > Ranger > Mago > Vanguarda. **Guardião** (tanque) neutro, reduz dano recebido dos aliados adjacentes. **Monstros** são curinga (sem contra ou fraqueza).
- **Moral** (0–100): cai com baixas e comandante caído; abaixo de 20% o esquadrão foge.
- **Comandante:** pode entrar em combate direto (assume o controle de ação numa minicena) para dar bônus ao esquadrão próximo (aura).
- **Resolução:** cálculo simulado a partir de PW total do esquadrão, moral, terreno e ordem.

---

## 10. Recrutamento Procedural

- Cada **cidade** gera uma lista de recrutas por seed (`cidadeId + semanaDeJogo`), renovada a cada 7 dias de jogo. Quantidade: 5–20 conforme tamanho da cidade e sua reputação com o reino.
- **Ficha do recruta:** nome, raça, classe, tier de evolução, nível, Rank, Potencial (E–SSS), afinidade principal, Forma Única, personalidade, **lealdade**, traço, custo de contratação e salário.
- **Personalidades (8):** Reservada, Ambiciosa, Leal, Rebelde, Gananciosa, Devota, Sanguinária, Curiosa. Cada uma modifica ganho/perda de lealdade por tipo de ação.
- **Traços (exemplos, 1–2 por personagem):**
  Gênio Mágico (+INT growth) · Fúria Incontrolável (+dano, −defesa) · Nascido para Liderar (aura de moral) · Sortudo (+drops) · Sombra Silenciosa (+crítico furtivo) · Sangue Antigo (afinidade extra) · Pacto Proibido (+poder, risco de corrupção) · Curandeiro Natural · Mestre de Armas · Domador Nato · Amaldiçoado · Herdeiro Perdido (chance de Despertar de Linhagem) · Veterano de Guerra · Nobre Decadente (paga mais, exige mais).
- **Lealdade (0–100):**
  - Ganha: pagamento em dia, vitórias, presente, missões alinhadas com a personalidade.
  - Perde: derrotas, atraso de salário, ordem contra a personalidade, morte de aliado.
  - **< 30:** reclama e rende menos · **< 15:** chance diária de abandonar · **< 5:** chance de traição (leva itens/troca de lado).
- **Custo:** `ouro = 50 × 2^(índiceDoRank) × multiplicadorDePotencial` (índice E=0). Alguns recrutas exigem **missão** ou **Reputação mínima** em vez de ouro.
- **Recrutas especiais** (nomeados, fixos): aparecem por evento/quest e têm história e ramos exclusivos.

---

## 11. Batalhão e Escala do Exército

### 11.1 Escala de organização
| Nível | Tamanho | Requisito |
|---|---|---|
| Grupo | até 4 | Início |
| Companhia | até 12 | Rank C |
| Esquadrão | até 30 | Rank B + território |
| Batalhão | até 100 | Rank A |
| Legião | até 500 | Rank S + reino |
| Exército | 2.000+ | Governador/Rei |

### 11.2 Regra de performance (decisão importante)
- **Oficiais/Personagens nomeados:** até **40** com ficha completa e simulação individual.
- **Tropas:** abstratas — cada esquadrão tem `contagem × tipo × tier`, com stats agregados. Nunca simular 5.000 entidades.

### 11.3 Estrutura
- **Comandante** (você) → **Vice-comandante** → **Capitães de esquadrão** → tropas.
- **Esquadrões (tipos):** Vanguarda ⚔️ · Guardião 🛡️ · Ranger 🏹 · Mágico 🧙 · Monstros 🐉.
- Companhias têm nome, emblema e **Tradição** (bônus permanente que evolui com vitórias; ex.: *Companhia do Lobo Negro*: +10% de moral em combate noturno).

---

## 12. Reino: Hierarquia, Território e Economia

### 12.1 Ladder de poder
| Estágio | Requisito | Desbloqueia |
|---|---|---|
| Aventureiro | — | Ação, dungeons, grupo |
| Líder de Grupo | Rank D + 2 recrutas | Companhia (parcial) |
| Capitão | Rank C + Fama 100 | Batalhão, salários |
| Senhor de Território | Rank B + capturar 1 vila | Território, economia básica |
| Governador | Rank A + 3 territórios | Cidades, tributos, política |
| Rei | Rank S + 1 reino conquistado/fundado | Reino, leis, diplomacia |
| Imperador | Rank SS + 3 reinos | Império, vassalos |

### 12.2 Recursos
**Ouro · Comida · Madeira · Pedra · Ferro · Cristal de Mana** + **Influência** (política/diplomacia) + **Essência** (evolução; não se acumula em território, vem de combate).

### 12.3 Territórios
- **Vila → Cidade → Fortaleza → Capital.** Cada território tem **slots de construção** (3/6/9/12).
- **Construções (12):** Fazenda, Serraria, Mina, Cristalaria, Quartel, Guilda, Torre Arcana, Ferraria, Templo, Muralha, Mercado, Academia. Cada uma tem 5 níveis.
- **Produção/dia:** `base × nível × (1 + bônus_administrador)`; **Tributos:** taxa 0–30% (mais alta = mais ouro, menos felicidade).
- **Estabilidade** (0–100): influencia produção, rebeliões e lealdade dos oficiais alocados.
- **Manutenção:** tropas consomem Comida + Ouro por dia; sem pagamento, a moral e a lealdade caem.
- **Pesquisa (árvore):** Militar, Magia, Economia, Diplomacia (cada uma com ~15 nós).

### 12.3 Diplomacia
Relações entre reinos (−100 a +100). Ações: aliança, tratado de comércio, tributo, ultimato, espionagem, sabotagem, declaração de guerra. **Espionagem** revela stats do inimigo e eventos futuros.

---

## 13. Mundo Vivo

- **Tempo:** 1 dia de jogo = 90 s reais (configurável). Pausa em menus. Viajar avança dias.
- **IA de reino (a cada dia):** cada reino tem Militar, Riqueza, Estabilidade e humor; decide **expandir, comerciar, atacar, defender ou pesquisar** com pesos por personalidade (Drakmor agressivo, Aurelia diplomático etc.).
- **Eventos aleatórios (tabela ponderada):**
  Guerra declarada · Cidade destruída · Migração de raça · Praga · Festival/Torneio · Invasão de monstros · **Quebra de Dungeon** · Dragão toma dungeon · Recruta famoso abandona exército · Rebelião · Mercador raro · Aparição de Lorde Demônio.
- **Quebra de Dungeon (Solo Leveling):** dungeons não limpas por X dias vazam monstros para a região próxima e sobem de Rank. Limpar a tempo dá bônus de Fama.
- **Log do Mundo:** aba "Diário do mundo" com últimos 50 eventos filtráveis, para o jogador perceber o mundo mudando.
- **Persistência:** o estado do mundo é salvo junto ao personagem (seed + deltas de eventos).

---

## 14. Monstros, Evolução de Criaturas e Domesticação

- **Rank de monstro** (E–S no MVP). **Linhas evolutivas:** Slime → Great → Magic → Demon → Ancient · Lobo → Dire → Fenrir → Ancient Fenrir · Goblin → Hobgoblin → Lord · Serpente → Naga → Basilisco · Espírito → Espírito Maior → Arconte · etc.
- **Evolução:** monstros evoluem com tempo/combate/Essência (selvagens) ou por comando (domesticados).
- **Domesticação:** `chance% = 20 + CAR×1,5 − (RankMonstro − RankJogador)×10`, limitada entre 5–90; itens e skills aumentam. Só monstros com HP < 30% são domesticáveis (exceto skills especiais).
- **Slots:** 1 **Montaria** (velocidade, carga), 1 **Familiar** (suporte passivo), até 2 **Criaturas de batalha** (contam como membros no combate).
- **Fome/lealdade** simples: alimentar mantém lealdade; abandono o faz retornar à natureza.

---

## 15. Raridade e Itens

### 15.1 Tiers de raridade
Comum → Incomum → Raro → Épico → Lendário → Mítico → Divino → Transcendente

| Raridade | Multiplicador base | Afixos | Chance de drop base |
|---|---|---|---|
| Comum | ×1,0 | 0 | 55% |
| Incomum | ×1,25 | 1 | 25% |
| Raro | ×1,6 | 2 | 12% |
| Épico | ×2,1 | 3 | 5% |
| Lendário | ×2,8 | 4 + efeito único | 2,2% |
| Mítico | ×3,8 | 4 + bônus de conjunto | 0,7% |
| Divino | ×5,0 | 5 + habilidade | 0,1% |
| Transcendente | ×7,0 | fixo/único | via eventos/bosses raros |

Aplicável a: **itens, recrutas (Potencial), habilidades, criaturas**.

### 15.2 Slots de equipamento
Arma · Armadura · Elmo · Luvas · Botas · Acessório ×2 · Relíquia (1 por personagem).

---

## 16. Dungeons Dinâmicas

**Geração por seed** (`seed = regiãoId + dungeonId + nº de vezes limpa`):

| Campo | Opções |
|---|---|
| Rank / nível | E–S, faixa de nível da região |
| Bioma | Floresta, Deserto, Gelo, Vulcão, Abismo, Ruínas, Cripta, Pântano, Céu, Caverna Submersa |
| Salas | 5–12 conectadas em grafo (Combate, Elite, Tesouro, Armadilha, Descanso, Boss) |
| Boss | Pool de 24 (ex.: Dragão Corrompido, Ent Ancestral, Lich Rei, Golem Colosso, Hidra Abissal…) |
| Modificador | Gravidade · Regeneração · Névoa · Berserk · Escuridão · Veneno · Espelho · Tempo Lento · Meteoros · Câmaras Seladas · Maldição · Duplo Boss |
| Inimigos | Por bioma + facção (Demônios, Bestas, Mortos-vivos, Golems, Elementais…) |
| Tesouro | Raridade mínima e máxima pelo Rank + modificador |

- **Portais Vermelhos** (raros): dungeon de Rank alto surgindo em região de baixo nível (gatilho de Despertar).
- **Progressão:** dungeon limpa gera Fama, Essência e loot; mantém "primeira limpeza" com bônus único.

---

## 17. Arte, UI e Áudio

### 17.1 Arte
- Pixel art chibi, **sprites 32×32**, 4 direções (baixo, cima, esq., dir.), 4 frames de caminhada, 3 de ataque.
- **Protótipo:** sprites gerados por código com camadas (corpo, cabelo, roupa, arma, aura), **troca de paleta por raça/rank** e cor da afinidade como brilho.
- **Versão final (opcional):** substituir por imagens geradas/desenhadas, mantendo a mesma interface de sprite.
- **Tiles:** 16×16 por bioma (10 biomas), gerados por padrões de pixel por código.

### 17.2 Telas
Menu · Criação de personagem · Ficha · **Árvore de Evolução** · Grimório · Inventário · **Mapa-múndi** · Zona (HUD de ação) · Cidade (Guilda, Taverna, Ferraria, Templo, Mercado, Quartel) · Recrutamento · **Batalhão** · Batalha tática · Reino (territórios, economia, pesquisa) · Diplomacia · Diário do mundo · Configurações/Save.

### 17.3 Áudio
Efeitos sintetizados via Web Audio (sem arquivos): golpe, magia, level up, evolução, Despertar. Música em loop simples gerada ou desativável.

---

## 18. Arquitetura Técnica

- **Stack:** React + TypeScript + Vite (padrão do AI Studio), **Canvas 2D próprio** (sem engine), estado central em store (Zustand; se o AI Studio recusar a dependência, usar `useReducer` + Context).
- **Data-driven:** todo conteúdo em arquivos de dados; sistemas leem os dados.

```
src/
  data/        balance.ts, races.ts, classes.ts, spells.ts, affinities.ts,
               traits.ts, regions.ts, bosses.ts, items.ts, events.ts, buildings.ts
  systems/     stats.ts, rank.ts, evolution.ts, awakening.ts, recruit.ts,
               dungeon.ts, loot.ts, battle.ts, worldSim.ts, economy.ts, save.ts, rng.ts
  engine/      loop.ts, canvas.ts, input.ts, sprites.ts, tiles.ts, camera.ts, audio.ts
  entities/    player.ts, enemy.ts, companion.ts, projectile.ts
  ui/          screens/*.tsx, components/*.tsx, theme.css
  state/       store.ts, types.ts
  App.tsx
```

- **Tipos centrais:** `Character`, `Race`, `ClassDef`, `Spell`, `Grimoire`, `Item`, `Region`, `MapNode`, `Dungeon`, `Recruit`, `Squad`, `Territory`, `Kingdom`, `WorldEvent`, `SaveGame`.
- **RNG determinístico:** `mulberry32(seed)` para dungeons, recrutas e eventos (mesma seed = mesmo resultado; permite salvar só a seed + deltas).
- **Loop:** timestep fixo 60 Hz para ação; simulação de mundo em tick próprio.
- **Limites de performance:** ≤ 200 entidades simultâneas na zona; batalha tática simula esquadrões, não soldados.
- **Save:** `SaveGame { version, player, party, world, kingdoms, territories, seed, time }`; migração por `version`; `localStorage` + exportar/importar `.json`.
- **Balanceamento:** só em `data/balance.ts` (curvas de XP, custos, multiplicadores).

---

## 19. Escopo: do Protótipo ao 1.0

### Vertical Slice (Fases 0–5) — o "primeiro jogo jogável"
- **3 reinos** (Valoria, Sylvaris, Drakmor) + Arkanis + Floresta Primordial (5 regiões)
- **8 raças** (Humano, Elfo, Orc, Goblin, Anão, Draconiano, Fada, Lobo Ancestral), evolução até T3
- **6 classes base** com especializações até o nv 40
- 7 afinidades base, Grimório de 5 páginas para 3 afinidades
- Ação completa, dungeons procedurais, loot com 6 raridades
- Rank E–A, Despertar (1º garantido)
- Recrutamento procedural, grupo de 4 e Companhia (12)

### Versão 1.0 (Fases 6–8)
- Batalhão/Legião, territórios, economia, diplomacia, mundo vivo completo
- 24 raças + Slime, T5, todas as 16 regiões, ranks até SSS
- IA Gemini (opcional), polimento e balanceamento

---

## 20. PLANO DE IMPLEMENTAÇÃO NO GOOGLE AI STUDIO

### 20.1 Regras de ouro para o AI Studio
1. **Uma fase por mensagem.** Nunca peça o jogo inteiro de uma vez.
2. **Cole junto** do prompt da fase as seções do GDD indicadas em "Cole junto".
3. Ao final de cada fase, peça: *"liste o que funciona, o que está incompleto e como testar"*.
4. Teste com o checklist da fase **antes** de avançar. Se quebrar, corrija na mesma fase.
5. Use o **histórico de versões** do AI Studio como checkpoint; salve uma versão antes de cada fase.
6. Sempre inclua no prompt: *"não reescreva arquivos que não precisam mudar; altere apenas o necessário"*.
7. Se o contexto ficar pesado: reinicie a conversa, cole o **Prompt Mestre** e a **seção de arquitetura (18)** e informe qual fase está feita.

### 20.2 PROMPT MESTRE (cole nas *System Instructions* / no primeiro prompt)

```
Você é um engenheiro sênior de jogos web. Vamos construir, por fases, o jogo
"Eternal Realms — Ascensão dos Reinos": RPG de ação top-down em pixel art chibi 2D
que evolui para estratégia de reino e exército.

REGRAS TÉCNICAS (valem para todas as fases):
- React + TypeScript (strict) + Canvas 2D próprio. Sem engines externas.
- Todos os assets gerados por código (sprites 32x32 pixel art via arrays de cores
  e paleta; tiles 16x16 por padrão). Nenhuma imagem externa.
- Arquitetura data-driven: todo conteúdo em src/data/*.ts; sistemas em src/systems/*.
- Números de balanceamento só em src/data/balance.ts.
- RNG determinístico (mulberry32) para geração procedural.
- Estado central em store; salvar/carregar via localStorage dentro de try/catch e
  botão Exportar/Importar JSON. Campo `version` no save.
- Interface e textos em Português (BR).
- Loop de jogo com timestep fixo de 60 Hz; máximo de 200 entidades por zona.
- Código organizado em arquivos pequenos. NÃO reescreva arquivos que não precisam
  mudar; entregue apenas os arquivos alterados/novos e explique o que mudou.
- Nunca deixe TODO ou funções vazias sem comentário explicando; tudo o que a fase pede
  deve funcionar de fato.
- Ao final de cada fase, entregue: (1) resumo do que foi feito, (2) como testar,
  (3) limitações conhecidas.

Vou enviar o GDD por partes e o pedido de cada fase. Confirme o entendimento
respondendo apenas com um resumo de 5 linhas e aguarde a Fase 0.
```

### 20.3 FASE 0 — Fundação
**Cole junto:** seções 0, 18.
**Objetivo:** projeto rodando, tipos, dados vazios/estruturados, save, tela inicial.

```
FASE 0 — Fundação.
Crie a estrutura de pastas da seção 18 e implemente:
1) state/types.ts com todos os tipos centrais (Character, Race, ClassDef, Spell,
   Grimoire, Item, Region, MapNode, Dungeon, Recruit, Squad, Territory, Kingdom,
   WorldEvent, SaveGame).
2) systems/rng.ts (mulberry32 + helpers: pick, weighted, range).
3) systems/save.ts (save/load/export/import, versionado, seguro contra falha do
   localStorage).
4) engine/loop.ts (timestep fixo 60 Hz), engine/canvas.ts (canvas responsivo com
   escala inteira para pixel art nítido), engine/input.ts (teclado + mouse).
5) data/balance.ts com as fórmulas da seção 4 e 6 (XP, PW, Rank).
6) UI: Tela de menu (Novo Jogo, Continuar, Importar, Configurações) e um roteador
   de telas simples.
7) Um "teste de sanidade": tela que mostra um sprite 32x32 gerado por código
   andando no canvas com WASD.
Entregue rodando sem erros.
```
**Checklist:** o app abre · sprite se move com WASD · salvar/continuar funciona · sem erros no console.

### 20.4 FASE 1 — Criação de personagem e ficha
**Cole junto:** seções 3, 4, 5, 6, 8.
```
FASE 1 — Criação de personagem, ficha e Rank.
1) data/races.ts: as 8 raças do Vertical Slice (Humano, Elfo, Orc, Goblin, Anão,
   Draconiano, Fada, Lobo Ancestral) com modificadores raciais, afinidades iniciais,
   1 passiva e 1 ativa racial cada, e as linhas de evolução T1 e os 3 ramos
   (T2–T5 nomeados conforme o GDD; T2–T4 podem ser "{ramo} I/II/III").
2) data/classes.ts: 6 classes base + especializações até nv 40 (tabela da seção 5).
3) data/affinities.ts: 7 base + 7 avançadas com regras de desbloqueio.
4) systems/stats.ts: atributos, stats derivados (seção 4.2), XP e nível.
5) systems/rank.ts: cálculo de PW e Rank (seção 6). Deve recalcular ao mudar
   equipamento, nível, evolução.
6) UI: Criação de personagem em etapas (raça → classe → atributos com compra de 27
   pontos → afinidades rolagem/visualização → forma única sorteada → nome/aparência).
   Sprite do personagem com paleta por raça e brilho da afinidade principal.
7) UI: Ficha do personagem (atributos, stats, afinidades em barras, Rank em destaque,
   PW detalhado, Forma Única, Grimório com 5 páginas bloqueadas).
Integre com o save.
```
**Checklist:** criar 5 personagens diferentes · Rank inicial E · pontos gastos corretamente · ficha salva e carrega.

### 20.5 FASE 2 — Ação em zona local
**Cole junto:** seções 9.1, 14 (parcial), 15, 17.
```
FASE 2 — Zona de ação.
1) Gerador de zona top-down por seed (60x40 tiles de 16px, bioma Floresta) com
   colisão, árvores/rochas, pontos de spawn, saída para o mapa.
2) Jogador: movimento, combo de 3 golpes, esquiva com invulnerabilidade, 4 slots de
   skill. Skills da classe/raça funcionando (dano, área, projétil, buff).
3) Inimigos com IA: melee, ranged, tank, mago. Telegrafar ataques. 1 mini-boss.
4) Fórmula de dano (seção 9.1), críticos, status básicos (queimadura, veneno, lentidão).
5) Loot com raridade (tabela seção 15) e inventário com 9 slots de equipamento.
   Equipamento altera stats e PW.
6) XP, level up, distribuição de +3 pontos, HUD (Vida/Mana/Stamina, XP, skills,
   Rank, minimapa simples).
7) Companheiro de teste com IA simples.
Sem loading longo; 60 fps com até 100 entidades.
```
**Checklist:** lutar 5 min sem travar · esquiva funciona · loot equipável · subir de nível.

### 20.6 FASE 3 — Evolução, Despertar e Grimório
**Cole junto:** seções 3.1, 5, 7, 8.
```
FASE 3 — Evolução, Despertar e Grimório.
1) Tela "Árvore de Evolução" mostrando raça (T0→T3) e classe (nv 20/40),
   estados: bloqueado/disponível/escolhido. Requisitos: nível + Essência + condição.
2) systems/evolution.ts: aplica evolução (bônus de atributos, PW, sprite novo, nova
   habilidade racial). Escolha de ramo no T2 com pré-visualização.
3) Especialização de classe nv 20 e 40; classe secundária no nv 50 (híbrida) — pode
   ficar bloqueada até ser testável.
4) Sistema de Despertar (seção 7): Primeiro Despertar garantido no nv 15 via missão
   curta; gatilhos, pity, animação "Antes → Depois".
5) Grimório funcional: 5 páginas por afinidade principal para Fogo, Água, Trevas,
   Luz e Espírito, com 3 níveis de melhoria; magias usáveis na ação.
6) Essência dropando de inimigos e bosses; título "Primeiro Despertar" com bônus de PW.
```
**Checklist:** evoluir e ver o sprite/Rank mudar · Despertar acontece no nv 15 · página nova do Grimório aparece no nível certo.

### 20.7 FASE 4 — Mapa-múndi, cidades e dungeons
**Cole junto:** seções 2, 13 (parcial), 16.
```
FASE 4 — Mundo, cidades e dungeons.
1) Mapa-múndi em nós para: Arkanis, Valoria (Marcas), Sylvaris (Marcas),
   Drakmor (Marcas), Floresta Primordial. Cada nó: cidade, vila, dungeon, evento.
   Viajar consome dias e o relógio de jogo avança (1 dia = 90 s).
2) Cidade: telas de Guilda (missões), Ferraria, Templo (cura, evolução), Mercado e
   Taverna (Fase 5). Lojas com preço afetado por Carisma.
3) Missões: 12 missões variadas (matar, coletar, escoltar, limpar dungeon) + missão
   principal até o Despertar.
4) Dungeon procedural (seção 16): rank E–C, salas em grafo, boss, modificadores,
   tesouro por raridade. Cada zona/dungeon é gerada por seed.
5) Início do Mundo Vivo: relógio, log "Diário do mundo", 5 eventos aleatórios
   (Quebra de Dungeon, mercador raro, invasão de monstros, festival, praga).
6) Persistência do mundo no save.
```
**Checklist:** viajar Arkanis→outro reino · dungeon diferente a cada seed · diário registra eventos · save mantém o dia.

### 20.8 FASE 5 — Recrutamento e Grupo (fecha o Vertical Slice)
**Cole junto:** seções 10, 11 (escala até Companhia), 9.1.
```
FASE 5 — Recrutamento e grupo.
1) systems/recruit.ts: recrutas por seed (cidadeId+semana). Ficha completa
   (raça, classe, tier, Rank, Potencial, afinidade, Forma Única, personalidade,
   traço, lealdade, custo, salário).
2) Taverna: lista, filtros (raça/classe/Rank), comparar, contratar.
3) Sistema de lealdade (seção 10): ganhos/perdas, abandono e traição.
4) Grupo de até 4 em combate; ordens (agressivo/defensivo/suporte); IA de
   companheiros com skills.
5) Companhia (até 12) com tela de gestão: nome, emblema, membros, Tradição.
6) Evolução de recrutas (Despertar de Linhagem) simplificada.
7) Salário diário e economia mínima (ouro, comida).
```
**Checklist:** recrutar 3 pessoas diferentes · lealdade cai sem salário · a Companhia é salva.

> ✅ **Aqui você tem o Vertical Slice jogável.** Faça um **balanceamento** (XP, dano, custos em `balance.ts`) antes de seguir.

### 20.9 FASE 6 — Batalhão e batalha tática
**Cole junto:** seções 9.2, 11.
```
FASE 6 — Batalhão e batalha tática.
1) Estrutura Batalhão/Legião com Vice-comandante, capitães e esquadrões de tipos
   Vanguarda, Guardião, Ranger, Mágico e Monstros. Tropas abstratas (contagem x tipo x
   tier); no máximo 40 personagens nomeados.
2) Tela Batalhão: compor esquadrões, atribuir oficiais, ver PW e moral.
3) Batalha tática em tempo real com pausa: mapa, ordens (Atacar, Defender, Cercar,
   Recuar, Usar Magia, Proteger Comandante, Capturar Território), triângulo de
   contra-ataque, moral, fuga, terreno e aura do comandante.
4) Resultado: baixas, loot, Fama, lealdade, captura de território (habilita a Fase 7).
5) Desafios: 3 cenários de teste (defesa de vila, cerco, emboscada).
```
**Checklist:** vencer com estratégia correta · perder por má ordem · baixas persistem no save.

### 20.10 FASE 7 — Reino, economia e mundo vivo completo
**Cole junto:** seções 12, 13, 14.
```
FASE 7 — Reino e mundo vivo.
1) Territórios (Vila→Cidade→Fortaleza→Capital), 12 construções com 5 níveis, slots,
   produção/dia, tributos, estabilidade, manutenção.
2) Hierarquia: Aventureiro → … → Imperador (seção 12.1) com requisitos e
   desbloqueios de UI.
3) IA de reinos (6 reinos) por dia: expandir, comerciar, atacar, defender, pesquisar.
4) Diplomacia (aliança, comércio, ultimato, espionagem, sabotagem, guerra) e relações.
5) 12 tipos de evento com tabela ponderada, Quebra de Dungeon completa,
   recrutas famosos abandonando exércitos.
6) Monstros: evolução, domesticação (fórmula da seção 14), montaria/familiar/criaturas.
7) Árvore de pesquisa (Militar, Magia, Economia, Diplomacia).
```
**Checklist:** um reino rival ataca sem sua participação · construir e ver produção · domesticar um monstro.

### 20.11 FASE 8 — Expansão de conteúdo, IA Gemini e polimento
**Cole junto:** seções 3.2, 5, 8, 16, 2.
```
FASE 8 — Conteúdo total e polimento.
1) Completar as 24 raças + Slime (T5, ramos, habilidades raciais), 16 regiões e
   todas as dungeons/bosses (24 bosses), Grimório Proibido, classes híbridas.
2) Ranks até SSS e balanceamento das faixas de nível por região.
3) (Opcional) Integrar Gemini para: narrador, história de recrutas, descrições
   de eventos. Sempre com fallback offline por templates. Chave da API pelo
   mecanismo do AI Studio, nunca hardcoded.
4) Áudio via Web Audio, efeitos de partículas em pixel, telas de transição
   (Despertar, Evolução).
5) Otimização: pooling de entidades, culling, teste com 200 entidades.
6) Tutorial curto (5 passos) e tela de Configurações (teclas, volume, velocidade
   do tempo, dificuldade).
```
**Checklist:** 60 fps · nenhum erro de save antigo · tutorial guia um jogador novo.

---

## 21. Regras de conteúdo para o AI Studio gerar dados grandes

Quando pedir dados extensos (ex.: 24 raças), use este padrão para evitar respostas cortadas:
```
Gere APENAS o arquivo src/data/races.ts com as raças 1–8 desta tabela. Quando
eu disser "continue", gere as raças 9–16 no mesmo arquivo (append), depois 17–24.
Mantenha exatamente o formato de tipo existente em types.ts.
```

---

## 22. Riscos e como mitigar

| Risco | Mitigação |
|---|---|
| Escopo gigante | Vertical Slice primeiro; 1.0 só depois de balancear |
| AI Studio cortar respostas longas | Fases pequenas, "apenas arquivos alterados", dados em pedaços |
| Performance com exércitos | Tropas abstratas, ≤ 40 nomeados |
| Balanceamento se perder | Tudo em `balance.ts`, poucas fórmulas simples |
| Bugs de save ao evoluir o jogo | `version` + migração; exportar JSON como backup |
| Sprites por código ficarem feios | Interface de sprite única para trocar por imagens depois |

---

**Próximo passo:** abra o AI Studio, cole o **Prompt Mestre (20.2)** e, quando ele confirmar, envie a **Fase 0**.