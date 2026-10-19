# Etapa 7 — Cifras estruturadas e transposição

Versão 0.7.0. Abrange as tarefas 7.1 a 7.4. A biblioteca e o backup continuam locais; não há dependência de internet nem novo runtime no computador do operador.

## 7.1 — Cadastro e representação

1. Criar ou abrir uma música e inserir cifras junto à letra: `[C]Minha [G/B]canção`.
2. Cada acorde fica ancorado no caractere seguinte. Acordes no fim da linha e vários acordes na mesma posição são aceitos.
3. Salvar música confirma a letra marcada, seções, sequência e configurações musicais. Os registros novos também incluem as linhas estruturadas, com letra e posições dos acordes.
4. A marcação é a fonte canônica: ao editar ou reabrir a letra, as posições são recalculadas a partir dela, evitando divergência de versões. As posições usam offsets UTF-16; caracteres compostos e emojis respeitam limites de grafemas. Uma marcação entre partes do mesmo caractere gera aviso e é ajustada ao próximo limite.

O subconjunto é inspirado na marcação inline do ChordPro; não constitui importador completo de arquivos ChordPro. Aceita raízes A–G, `#` e `b`, qualificadores `m`, `maj`, `min`, `dim`, `aug`, `sus`, `sus2`, `sus4`, `add2/4/6/9`, números, alterações como `b9`/`#11`, parênteses de alterações e sinais `+`/`-`. O baixo invertido usa `/` seguido de nota: `[F#m7/C#]`. Barras com extensões numéricas, diretivas `{title:...}`, diagramas e tablaturas não fazem parte deste subconjunto.

Tokens entre colchetes têm de 1 a 80 caracteres. Acordes desconhecidos são exibidos como digitados, sem transposição, com aviso no editor. Colchetes incompletos, vazios ou tokens maiores permanecem literalmente na letra. Em somente letra, os tokens completos entre colchetes são retirados da apresentação; o cadastro original continua intacto. Textos livres e Bíblia não são interpretados como cifras.

Linha em branco e linha contendo apenas `---` continuam separando slides. Quebras adicionais são calculadas conforme tamanho da fonte, margens e proporção. Os limites existentes de texto e de tamanho JSON dos registros continuam vigentes.

## 7.2 — Transposição

1. Informar o tom original e o tom de apresentação. Os seletores representam centros tonais, como C e D; a qualidade menor é indicada nos acordes, como Am.
2. Escolher sustenidos ou bemóis para os nomes resultantes.
3. Escolher somente letra ou letra e cifras e salvar a música.

A transposição aplica a diferença em semitons à raiz e ao baixo de cada acorde reconhecido. Preserva os qualificadores. Exemplo de C para D: `C → D`, `Am7 → Bm7`, `G/B → A/C#`. Os acordes de origem permanecem no cadastro; alternar tons não acumula transposições e não modifica a letra. A grafia de saída segue a preferência escolhida, inclusive para equivalências enarmônicas. Acordes desconhecidos não são parcialmente convertidos.

## 7.3 — Apresentação alinhada

1. Conferir a prévia antes de apresentar.
2. No modo com cifras, cada unidade de letra reserva espaço para seus acordes acima dela; rótulos longos ampliam esse espaço para evitar sobreposição.
3. Fonte, largura, margem e tom recalculam a paginação. Um acorde muito longo pode reduzir a fonte do slide para caber.
4. Prévia, monitor ao vivo e janela de projeção usam o mesmo componente e geometria canônica. As opções de alinhamento do tema continuam aplicáveis.
5. Apresentar ou avançar no modo apresentador publica um snapshot validado da página, com letra, posições e acordes já transpostos. Editar não publica automaticamente.

Ocultar texto oculta também os acordes, preservando o fundo. Tela preta e ensaio seguro com um único monitor continuam funcionando. Não há saída independente para músicos nesta etapa.

## 7.4 — Programações, recuperação e backup

1. Adicionar a música cria cópia completa de seções, sequência, tons, acidentes e modo de exibição, além do tema.
2. Selecionar a cópia prepara seus próprios dados. Seus controles musicais permitem ajustes independentes; confirmar em Salvar programação.
3. Editar a biblioteca não modifica essa cópia nem a saída ativa. Atualizar no item busca explicitamente a música salva mais recente, preservando o tema do item.
4. Fechar e reabrir mantém os tons e acordes das músicas e programações salvas. O checkpoint inclui a página estruturada; a saída sempre reabre fechada e preta.
5. Backup/restauração incluem esses dados sem migração adicional do banco. Músicas e programações anteriores sem configuração musical continuam legíveis. Itens antigos que só continham texto permanecem como tais até atualização explícita pela origem.

## Verificação e continuidade

Arquivos principais: `src/shared/chords.ts`, `songs.ts`, `content.ts`, `contracts.ts`; `src/renderer/song-editor.tsx`, `slide.tsx`, `app.tsx`; `src/main/main.ts`, `protocol.ts`.

Testes: `tests/chords.test.cjs` cobre transposição, baixos, desconhecidos, Unicode, limites de posições, fonte/proporção, snapshots e checkpoint fechado. `tests/chord-flow.cjs` integra a suíte gráfica e cobre cadastro, aviso, transposição, exibição, saída preservada, independência da programação, backup/restauração e reinício. A projeção usa monitor simulado, com fullscreen e exibição nativos desativados para preservar o monitor real.

Próxima etapa: **8 — Importação, deduplicação, exportação e recuperação**, conforme o plano principal. Continuam pendentes as homologações físicas Windows/Linux/datashow e a avaliação com voluntários.


## Resultados e pacotes 0.7.0

Tipos, build e 38 casos de teste de domínio aprovados. A inspeção visual identificou e corrigiu espaçamento interno nas palavras: o renderizador agrupa trechos contínuos entre os acordes. Captura real em [modo apresentador com cifras](etapa-7-preview.png).

Pacotes gerados para Windows ZIP e Linux AppImage/tar.gz. Cada um acompanha SHA-256. Os 63 arquivos de `dist` foram comparados byte a byte ao conteúdo embarcado dos dois sistemas, inclusive os módulos externos ao ASAR. ZIP validado por CRC, gzip lido integralmente, tar inspecionado e ausência de dados do operador conferida.

| Pacote | Tamanho (MiB) | SHA-256 |
| --- | ---: | --- |
| `zamar-sync-0.7.0-linux-x64.tar.gz` | 118.20 | `b451dd204363da11f99297f5d4b3df74d934a30ef8f229b82ea410fcaae61228` |
| `zamar-sync-0.7.0-linux-x86_64.AppImage` | 123.32 | `786d5b92ce37271bc10703155b59bcffbfaf79b2a28a602a89987583d518af25` |
| `zamar-sync-0.7.0-win-x64.zip` | 150.83 | `dc9c91c2621009b6c81cd7e91539e23127b1daa5f9700828cdbf4fb6efc89153` |

Windows foi gerado e inspecionado, sem execução neste ambiente. Datashow físico e homologação dos sistemas permanecem nas tarefas anteriores e na etapa 9.

Testes gráficos completos aprovados nos três formatos Linux finais: pasta, AppImage por extração automática sem FUSE e tar.gz. Incluem o fluxo de cifras e regressões das etapas anteriores, com dados temporários isolados. Limpeza concluída: seis arquivos 0.6.0 removidos; pacotes 0.7.0, seus hashes e `release/data` preservados.

Nota de histórico: os pacotes 0.7.0 foram substituídos em release pela [etapa 8](etapa-8-importacao-e-recuperacao.md). Os hashes acima registram a entrega anterior.
