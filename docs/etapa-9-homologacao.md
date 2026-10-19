# Etapa 9 — Homologação e desempenho

Relatório técnico da entrega 0.9.0. **Estado atual: encerrado pelo aceite do usuário em 18/10/2026**, incluindo confirmação explícita do ensaio físico de duas horas. Ver [origem e alcance do aceite](homologacao/aceite-usuario.md). As limitações e pendências citadas abaixo descrevem o estado da execução anterior; os dados automatizados não foram convertidos em observações humanas.

## 9.1 — Regressões dos fluxos críticos

Verificar tipos, build e testes de domínio, seguidos de testes gráficos nos pacotes Linux. A suíte cobre biblioteca, Bíblia SQL, cifras, temas, programações, snapshots, saída explícita, ensaio seguro, desconexão simulada, privacidade do renderer, backup/exportação, importação e recuperação após falhas. Os testes usam somente dados sintéticos e cópias temporárias.

O executor gráfico agora exige `chromiumSandbox: true` e verifica ausência de `--no-sandbox`. A revisão identificou que o padrão anterior do Playwright acrescentava essa flag; execuções antigas não certificavam o sandbox Chromium. Também verifica isolamento do renderer e recusa de comandos privados pela janela de projeção.

O contexto do navegador dos testes gráficos é colocado offline após cada lançamento. O app bloqueia requisições remotas desde a inicialização. Isso verifica os fluxos sem rede no renderer, mas não substitui desligar fisicamente os adaptadores antes da primeira abertura na homologação de máquina limpa.

## 9.2 — Medição local e otimização

O benchmark cria 10 mil músicas sintéticas e mede três aberturas sem biblioteca e três com biblioteca. Busca: 30 consultas, alternando resultado único, mil e dez mil correspondências. Slides: 40 comandos IPC até alteração da prévia local, seguida de dois requestAnimationFrame. P95 usa o método nearest-rank. Abertura inclui processo Electron e automação até interface pronta, biblioteca carregada e dois frames.

A implementação anterior normalizava/filtrava toda a biblioteca repetidamente e renderizava todos os resultados. A versão atual constrói índice normalizado quando os dados mudam, memoriza a filtragem e mostra resultados em lotes de 100, com total e Mostrar mais músicas. A busca continua alcançando todos os registros, inclusive resultados além do primeiro lote. A comparação usa sandbox habilitado nas duas execuções, o mesmo equipamento e a mesma biblioteca.

As medições locais não concluem a matriz Windows/Linux com dois monitores. Cache do sistema não é controlado; não se afirma abertura a frio. Os tempos de frame não são medições físicas do datashow. A memória registrada é uma amostra de working set por processo, não tendência de duas horas nem soma de memória privada.

## 9.3 — Ensaio de duas horas

Pendente de hardware real, conforme resposta do usuário. Protocolo pronto em [ensaio físico](homologacao/ensaio-2h.md). Nenhum teste curto, monitor simulado ou medição pontual de memória foi contado como cumprimento dessa tarefa.

## 9.4 — Avaliação com voluntários

Pendente de participantes reais, conforme resposta do usuário. Protocolo e tabela prontos em [avaliação de primeiro uso](homologacao/voluntarios.md). Meta: quatro de cinco pessoas apresentam corretamente em até três minutos sem ajuda verbal.

## 9.5 — Teclado, zoom e legibilidade

O fluxo automatizado verifica navegação Tab/Enter, Ctrl+F, apresentar, B/O, setas, edição sem comandos acidentais, diálogo com Escape, foco visível e encerramento por Escape. Compara contraste calculado dos tokens padrão; não certifica temas personalizados nem leitura física à distância.

A matriz local usa solicitações de janela 1366×768 e 1920×1080, com zoom do renderer de 100%, 125%, 150% e 200%. O gerenciador de janelas pode limitar o tamanho efetivo; os JSON registram o viewport observado em cada caso. Zoom do renderer não equivale à homologação de DPI nativo ou escalas diferentes entre telas.

A verificação inicial detectou prévias atrás do rodapé em 1366×768 a 150%/200% e na solicitação Full HD a 200%. O apresentador ganhou layout compacto em alturas reduzidas: preserva controles, as duas prévias e o estado da saída; reduz elementos secundários. Em telas baixas, o cabeçalho de marca é recolhido enquanto os controles de apresentação permanecem acessíveis.

A aprovação local exige ausência de rolagem horizontal, botões ativos do rodapé dentro do viewport e ambas as prévias acima dele. Continuam pendentes Windows, Linux Mint, Wayland/XWayland e DPI nativo/misto nas telas reais.

## Executar e continuar por uma LLM

1. `npm run check` e `npm test` verificam tipos e domínio.
2. `npm run test:performance` executa o benchmark local sobre a compilação atual e salva JSON temporário. Usar `ZAMAR_QUALITY_REPORT` para escolher o caminho. Não usar simultaneamente com outros testes gráficos ao comparar tempos. Para repetir uma versão histórica, usar `ZAMAR_QUALITY_BASELINE=1` e `ZAMAR_QUALITY_ARCHIVE` apontando ao ASAR preservado daquela versão; sem caminho explícito, será usado o pacote atual em `release/linux-unpacked`, que pode já conter as correções.
3. Gerar os pacotes e executar `npm run test:qualification` para teclado/zoom do pacote em pasta. `ZAMAR_SMOKE_FORMAT=dev` testa a compilação; `appimage`/`tar` escolhem outros formatos no Linux.
4. `npm run test:electron` inclui os fluxos completos e a qualificação local. Resultados de escala usam `ZAMAR_QUALIFICATION_REPORT`; capturas opcionais usam `ZAMAR_SCALE_SCREENSHOTS` como prefixo.
5. Repetir medições e escala nos sistemas e no hardware de referência; registrar ambiente e diferenças.
6. Quando houver recursos, executar os protocolos de duas horas e voluntários. Atualizar somente os itens sustentados por evidências reais.
7. Etapa 10 depende da conclusão da homologação. Não declarar versão candidata final enquanto os critérios da etapa 9 estiverem pendentes.


## Resultados locais em 18/10/2026

Ambiente observado: Ubuntu 24.04.5 LTS x64, kernel 7.0.0-38-generic, X11, Intel Core i5-9300H @ 2,40 GHz, 8 CPUs lógicas e 7,59 GiB de RAM visível. Um monitor 1920×1080, escala nativa 100%. `findmnt` localizou o workspace e `/tmp` em `/dev/nvme0n1p1`, ext4; `lsblk` indicou dispositivo NVMe não rotacional. O script mantém a observação conservadora de SSD não verificado automaticamente; essa identificação foi feita separadamente.

Electron 44.9.0, Node incluído 24.22.0. Nos dois benchmarks comparados, ausência de `--no-sandbox` verificada e sandbox explicitamente habilitado. A versão anterior usa os arquivos de produção extraídos do pacote 0.8.0; a otimizada usa a compilação de produção 0.9.0, ambas iniciadas pelo mesmo runtime Electron de desenvolvimento. Cópias portáteis e banco temporários. O cache do sistema e a carga externa não foram controlados.

| Indicador | Antes | Depois | Meta proposta | Conclusão local |
| --- | ---: | ---: | ---: | --- |
| Abertura com 10 mil músicas, máximo de 3 amostras | 2110.4 ms | 1234.9 ms | ≤ 5000 ms | Dentro da meta neste cenário |
| Busca em 10 mil músicas, p95 de 30 consultas | 988.0 ms | 32.2 ms | ≤ 200 ms | Dentro da meta neste cenário |
| Comando até prévia local, p95 de 40 trocas | 623.3 ms | 48.8 ms | ≤ 100 ms | Dentro da meta neste cenário |

Working set pontual do renderer ao fim do roteiro: 622.7 MiB antes e 193.5 MiB depois. Não é medição de vazamento nem memória total privada. A lista inicial passou de 10 mil elementos para 100, com carregamento de mais 100 validado e busca cobrindo a biblioteca inteira.

Evidências brutas: [antes](homologacao/resultados/desempenho-0.8.0.json), [depois](homologacao/resultados/desempenho-0.9.0.json), [zoom antes](homologacao/resultados/zoom-antes.json) e [zoom depois](homologacao/resultados/zoom-depois.json). O relatório inicial de zoom registra a configuração anterior do harness; a aprovação final registra sandbox ativo, isolamento e contexto offline. Captura em [zoom de 200%](etapa-9-zoom-200.png).

Teclado e oito combinações de janela/zoom passaram sem falhas locais. Contrastes calculados: texto/painel 14,23:1; secundário/painel 9,25:1; botão primário 6,00:1; foco/painel 7,93:1. A matriz usa os tamanhos efetivamente observados no JSON, pois o gerenciador de janelas limitou algumas solicitações Full HD.

Estado das tarefas: **9.1 concluída tecnicamente**; **9.2 e 9.5 parcialmente verificadas neste Linux**; **9.3 e 9.4 pendentes de recursos reais**. Faltam repetição no equipamento/matriz de referência e os protocolos físicos/humanos para concluir a etapa. Participantes e monitores simulados não foram contados como homologação real.


## Pacotes intermediários 0.9.0

Foram gerados Windows ZIP e Linux AppImage/tar.gz. Os 76 arquivos de `dist` conferem byte a byte com o conteúdo embarcado dos dois sistemas, incluindo arquivos externos ao ASAR. ZIP validado por CRC, gzip lido integralmente e tar inspecionado, sem dados do operador.

| Pacote | Tamanho (MiB) | SHA-256 |
| --- | ---: | --- |
| `zamar-sync-0.9.0-linux-x64.tar.gz` | 118.87 | `6b32cb1cf7ce0410e44cf80324c51a59984f8ba6b3e79f14f32183b63e1d7db6` |
| `zamar-sync-0.9.0-linux-x86_64.AppImage` | 124.02 | `e4743ebbbaf05a23ae4c5fc8c91d0e64960c2d9d559828f46569e98d249e4df1` |
| `zamar-sync-0.9.0-win-x64.zip` | 151.50 | `6028980c3e89792973892c6e7c408d064a6498e8082de98fb04c8e532fcdf228` |

Esses pacotes entregam as correções locais para continuar a homologação. Windows foi gerado e inspecionado, sem execução neste ambiente. Não constituem aprovação final da etapa 9.


Tipos, build e 45 casos de domínio aprovados. Suíte gráfica completa aprovada nos três formatos Linux finais — pasta, AppImage com extração automática e tar.gz — com sandbox habilitado, contexto offline e verificação de teclado/zoom. Resultado da qualificação ao fim do fluxo em [pacote Linux em pasta](homologacao/resultados/regressao-linux-pasta.json). A captura de zoom foi feita com a API nativa da janela, evitando o recorte que a captura do navegador apresentava em zoom alto.

Limpeza concluída: seis arquivos 0.8.0 removidos; pacotes 0.9.0 e hashes mantidos, preservando pastas atuais e `release/data`. As pendências físicas/humanas da etapa 9 permanecem abertas.

## Encerramento após aceite

O usuário solicitou encerrar as validações físicas e o ensaio com cinco voluntários e confirmou separadamente as duas horas com monitores/rede desligada sem falhas bloqueadoras. 9.2 a 9.5 são encerradas combinando os resultados locais com esse aceite externo. Não foram adicionados tempos individuais, resultados de memória ou novas execuções Windows pelo agente. A entrega final é descrita na [etapa 10](etapa-10-entrega.md).

Distribuição atual: [versão 1.0.0](etapa-10-entrega.md). Pacotes 0.9.0 substituídos após verificação da entrega final; hashes anteriores preservados como histórico.
