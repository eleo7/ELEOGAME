# Plano de entrega até o 1.0

A prévia 0.1 permite verificar o ciclo de jogo e a direção visual. A ordem abaixo fecha o vertical slice antes de ampliar o fim de jogo. Nenhuma etapa abaixo é tratada como concluída apenas por existir uma tela.

| Marco                  | Trabalho                                                                                      | Critério de aceite                                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| A — Combate definitivo | Sistema de efeitos, skills exclusivas das seis classes, resistências, status, IA e telegrafia | Jogar cinco minutos com cada classe; efeitos, custo e cooldown corretos; derrota/retorno sem duplicar recompensas |
| B — Personagem único   | Raciais das oito raças do slice, formas, evolução até T3, especialização 20/40                | Cinco fichas distintas; mudança mecânica e visual por tier; nenhuma escolha inválida aceita                       |
| C — Magia e despertar  | Magias equipáveis por página, cinco afinidades prioritárias, missão de despertar, pity        | Magia nova nos níveis previstos, custos por afinidade; antes/depois de PW verificável                             |
| D — Expedições         | Grafo de salas, 5 regiões refinadas, recursos, objetivos de coleta/escolta, primeiro-clear    | Duas seeds diferentes; todas as salas alcançáveis; mission progress e world danger persistidos                    |
| E — Companhia          | IA de suporte/defesa completa, dano e incapacitação dos aliados, traços e lealdade contextual | Grupo com três recrutas realmente distintos; salário atrasado e vitória alteram lealdade; tradição persiste       |
| F — Balancear slice    | Curvas de progressão, economia e UX                                                           | Campanha nível 1→40 sem comandos de debug; Rank/tempo medidos; tutorial explica cinco passos                      |
| G — Batalha tática     | Movimento, terreno, adjacência, sete ordens, comando em ação e hierarquia                     | Vencer com boa composição, perder por escolhas ruins; pausa não altera resultados; baixas persistem               |
| H — Reino vivo         | Produção específica, recursos completos, fronteiras, IA, diplomacia, eventos e domesticação   | Rival conquista/ataca sem ordem do jogador; captura válida, alimentação e produção auditáveis                     |
| I — Conteúdo 1.0       | 24+Slime completos, T5, 16 regiões distintas, 24 chefes, híbridas, magia proibida             | Checklist por raça/chefe/região; Slime exige 100 slimes + quest; custos e corrupção testados                      |
| J — Qualidade          | Save v2, migração, acessibilidade, áudio, performance, recuperação de abas                    | Saves antigos abrem; 200 entidades medidas; sem erros de console durante campanha de teste                        |

## Sequência de releases

- **0.2:** marcos A–B, refinando o combate e a identidade dos personagens.
- **0.3:** marcos C–E, completando os sistemas do vertical slice.
- **0.4:** marco F, marco de validação de campanha.
- **0.6:** marcos G–H, estratégia e simulação.
- **0.9:** marco I, conteúdo completo e testes de regressão.
- **1.0:** marco J e critérios de aceite de todos os marcos anteriores.

## Regras de execução

- Manter o código testável sem navegador: fórmulas, quests, simulação e resultados são funções puras.
- Alterações em saves exigem fixtures e migração antes de mudar `version`.
- Adicionar conteúdo por IDs estáveis. Ajustes de balanceamento não renomeiam referências salvas.
- Para novos visuais, manter assets gerados por código até haver uma decisão explícita de substituição.
- Separar números de mecânica em `balance.ts`; tabelas de conteúdo descrevem IDs, nomes e requisitos.
- Gemini permanece opcional. Uma chave pessoal nunca deve entrar no bundle Vite, no save ou no repositório. Se habilitado, usar serviço intermediário e fallback local.
- Cada marco termina com build, testes e verificação manual da experiência. Uma tela bloqueada ou catálogo de nomes não substitui comportamento implementado.
