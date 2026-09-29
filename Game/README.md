# Eternal Realms — Ascensão dos Reinos

RPG de ação e estratégia para navegador, em português. React + TypeScript strict + Vite, com motor Canvas 2D próprio, mapa ilustrado por código e sprites pixel art sem imagens externas.

**Estado da entrega: prévia jogável 0.1.** Existe um ciclo de jogo integrado e uma base estratégica funcional. O escopo completo do GDD 1.0 ainda não está concluído. A matriz de cobertura e o plano para completá-lo estão em [docs/ARQUITETURA.md](docs/ARQUITETURA.md).

## Executar

Dependências já instaladas neste workspace. Em PowerShell:

```powershell
cd C:\OSE\RTS\Game
.\iniciar.ps1
```

Abra **http://127.0.0.1:5174**. Mantenha o terminal aberto. Para parar, `Ctrl+C`.

Em outra máquina, use Node.js 22+ e pnpm:

```sh
pnpm install --frozen-lockfile
pnpm dev
```

O comando padrão do Vite informa a porta utilizada. Também é possível usar `npm install` e `npm run dev`; o lockfile fornecido é do pnpm. O script Windows usa a porta 5174 e aceita `-Porta 5180`.

## Jogar

1. Inicie uma jornada, escolha raça e classe, distribua os 27 pontos e dê um nome ao personagem.
2. No mapa, explore as marcas do seu reino. Mova com **WASD**, ataque com **J** ou clique, esquive com **Espaço**, use habilidades com **1–4**.
3. **E** interage. O portal à esquerda permite sair. Ao eliminar os inimigos, caminhe até o portal à direita e pressione E para concluir a expedição ou avançar de sala.
4. **P** ou **Tab** pausa. O botão “Retornar ao mapa” encerra a expedição preservando recompensas obtidas; a sala não fica salva.
5. Na **Cidade → Guilda**, receba a recompensa por cinco eliminações. Na Ferraria, compre equipamento; no Inventário, equipe-o. O Templo recupera vida e mana.
6. Contrate companheiros na Taverna. A Companhia permite escolher os três aliados ativos e suas ordens. Viagens consomem um dia, comida e salários.
7. Evolua atributos, linhagem e grimório. O contrato de nível 15 concede o primeiro Despertar. Rank C abre o Batalhão; Rank B permite conquistar vilas; Rank A abre diplomacia.

A interface de gestão é responsiva. O combate foi projetado para **teclado e mouse**; não há joystick para celular.

## O que está jogável

- Criação com 24 raças, seis classes, compra de atributos, afinidades, forma única e origem racial/Arkanis.
- Mapa com 16 regiões, cidades, áreas locais e dungeons; viagem, diário e simulação diária.
- Mapas 60×40, colisão, câmera, minimapa, combate corpo a corpo/à distância, esquiva, habilidades, chefes, companheiros, XP, ouro, essência e loot.
- Dungeons de 6–9 salas lineares, descanso, tesouro, elites, chefe e seis modificadores.
- Rank por PW, pontos por nível, evolução T1–T5, escolha de ramo T2 e primeiro Despertar via contrato.
- Cinco páginas de grimório como melhorias das habilidades de classe; inventário e oito slots de equipamento.
- Doze contratos, serviços da cidade, recrutas semanais, grupo, salários, comida, lealdade e abandono.
- Esquadrões abstratos, três cenários, pausa, ordens, contramedidas, moral e baixas; vila conquistável.
- Construções, tributos, produção diária, pesquisas Militar/Economia, relações e conflitos simplificados.
- Save local versionado, validação de importação, exportação JSON e recuperação de erro de armazenamento.

As raças, formas, chefes e especializações ainda compartilham bastante comportamento. Ter um nome cadastrado não equivale a ter conteúdo exclusivo implementado. Consulte a matriz antes de considerar qualquer fase do GDD concluída.

## Verificação

```sh
pnpm test
pnpm build
pnpm preview
```

Os testes cobrem regras econômicas e de progressão, persistência, geração procedural e simulação de controles/combate. O build usa TypeScript strict. O jogo não exige API, conta ou chave Gemini. Todos os recursos visuais são locais; a distribuição deve ser servida por HTTP, não aberta diretamente pelo protocolo `file://`.

## Documentação

- [Arquitetura, decisões e cobertura do GDD](docs/ARQUITETURA.md)
- [Plano de entrega até a versão 1.0](docs/PLANO.md)
- [Checklist e resultados de validação](docs/VALIDACAO.md)
- [GDD original preservado](docs/GDD-ORIGINAL.md)
- [Balanceamento central](src/data/balance.ts)

O navegador separa saves por origem (host + porta). Para trocar de `localhost` para `127.0.0.1`, mudar porta ou publicar o jogo, exporte o JSON e importe na nova origem.
