# Registro de execução

> Estado atual: etapas 0 e 3 concluídas; homologação da etapa 1 e avaliação com voluntários da etapa 2 pendentes. Entradas anteriores preservam o histórico e são substituídas, quanto ao estado vigente, pela revisão mais recente.

## 18/10/2026 — Etapa 0: consolidar decisões

**Objetivo:** executar a primeira etapa do plano, numerada como etapa 0, antes da criação da base do aplicativo.

**Arquivos envolvidos:** plano de desenvolvimento, especificação técnica da etapa 0, inventário de licenças e este registro.

| Tarefa | Resultado | Evidência |
| --- | --- | --- |
| 0.1 — Escopo, plataforma e portabilidade | Concluída | Seção 1 de etapa-0-especificacao.md |
| 0.2 — Formatos e exemplos | Concluída | Seções 2 a 5 de etapa-0-especificacao.md |
| 0.3 — Conteúdos, fontes e autorização ARA | Parcial | inventario-de-licencas.md; LIC-ARA-001 aberta |

**Verificação:** revisão de consistência com o plano; formatos com entradas, resultados e erros explícitos; referências locais verificadas; pesquisa em fontes oficiais para identificação da edição ARA e licença da fonte Inter. Nenhuma autorização ARA encontrada nos arquivos disponíveis. Nenhum teste de aplicativo foi executado, pois não há implementação nesta etapa.

**Resultado da etapa:** incompleta. A autorização para redistribuição da ARA é requisito explícito da tarefa 0.3 e não pode ser presumida a partir da disponibilidade do texto na internet.

**Próximo passo imediato:** resolver LIC-ARA-001 e finalizar 0.3. Pelo plano atual, a etapa 1 depende da etapa 0 concluída. Com a pendência resolvida, iniciar 1.1: base Electron e TypeScript com janelas de operador e projeção independentes.

**Contagem após esta execução:** 2 de 44 tarefas concluídas; 42 tarefas pendentes, incluindo 0.3 parcialmente realizada. Restam 10 etapas posteriores (1 a 10), além da conclusão da etapa 0. Não confundir quantidade de tarefas com estimativa de duração.


## 18/10/2026 — Continuação de 0.3 e execução da etapa 1

**Autorização do usuário:** concluir 0.3 e avançar à etapa 1. Realizado todo o trabalho local possível de inventário e implementação. A instrução para avançar foi registrada como exceção à dependência de 0.3; não foi tratada como licença do titular da ARA.

**0.3:** inventário de componentes reais e avisos de licença preparados; autorização ARA ainda não recebida. Mantida parcial, sem marcar uma permissão externa como obtida. Nenhuma mensagem enviada a terceiros.

**Implementação:** base Electron/TypeScript/React, preload isolado, projeção, monitor, tela preta, SQLite incluído no runtime, validação de comandos, build, empacotamento Linux e Windows e testes automatizados. Ver README.md e etapa-1-validacao.md.

**Evidências:** verificação de tipos, compilação, dois casos de teste de persistência/validação e teste gráfico do pacote Linux aprovados. Reabertura em caminho com acentos preservou os dados. Projeção independente e remoção sintética de monitor verificadas. ZIP Windows gerado; sem execução em Windows limpo ou teste com dois monitores físicos.

**Conclusão:** 1.1 concluída; 1.2, 1.3 e 1.4 parciais. Etapas 0 e 1 ainda não estão integralmente concluídas por autorização ARA e homologação Windows/hardware, respectivamente.

**Próximo passo:** homologar o ZIP Windows pelo roteiro da etapa 1 e registrar resultados, além de resolver LIC-ARA-001. Após validar a base portátil, iniciar etapa 2.

**Contagem atual:** 3 de 44 tarefas concluídas e 41 pendentes, algumas parcialmente executadas. Restam 9 etapas posteriores (2 a 10), além das pendências de 0 e 1.


## 18/10/2026 — Revisão de escopo: importação de Bíblia SQL

**Solicitação:** retirar a obtenção de licença como condição de 0.3 e planejar cadastro de Bíblia obtida gratuitamente em `.sql`.

**Resultado:** tarefa 0.3 concluída com inventário e avisos dos componentes. LIC-ARA-001 encerrada por remoção do requisito, sem alegação de licença obtida. Etapa 0 integralmente concluída. ARA pré-carregada deixou de ser obrigatória; cadastro e persistência de traduções por `.sql` passam a integrar a etapa 6.

**Documentos atualizados:** plano, especificação da etapa 0, inventário, README e estado da etapa 1. Adicionado importacao-biblia-sql.md com fluxo, compatibilidade, parser restrito, mapeamento, prévia, transação, backup e seis subtarefas de 6.1. Nenhum código do aplicativo ou pacote executável alterado; o importador ainda não foi implementado.

**Verificação:** referências locais, checklist e consistência dos requisitos atuais revisados. Não houve execução de testes do aplicativo, pois a alteração é documental.

**Próximo passo:** terminar homologação Windows e hardware da etapa 1. A implementação do cadastro SQL ocorrerá na etapa 6.

**Contagem atual:** 4 de 44 tarefas principais concluídas; 40 pendentes, algumas parcialmente executadas. As seis subtarefas novas detalham 6.1 e não alteram essa contagem. Restam a conclusão da etapa 1 e as 9 etapas seguintes (2 a 10).


## 18/10/2026 — Windows e Linux no MVP

**Mudança:** Linux deixa de ser somente ambiente de desenvolvimento e passa a plataforma do MVP, junto de Windows. Matriz inicial Ubuntu 24.04 LTS e Mint 22 x64, X11/XWayland. macOS e Wayland nativo permanecem fora da homologação inicial.

**Implementação:** alvos AppImage e tar.gz; comando separado de pasta de teste; caminho de dados baseado no arquivo AppImage original; backend X11 para seleção programática de monitor; teste gráfico compatível com Windows e Linux e modos de teste AppImage/tar.gz. Sem desabilitar sandbox.

**Verificação unitária:** três casos novos de caminhos portáteis, além dos dois casos de persistência/validação existentes, aprovados. Compilação e checagem de tipos aprovadas. Resultados gráficos e artefatos registrados em etapa-1-validacao.md.

**Estado:** etapa 1 permanece parcial até homologar ambientes limpos e monitores físicos de ambos os sistemas. A alteração detalha as mesmas tarefas: permanecem 4/44 concluídas e 40 pendentes.

**Resultado final desta revisão:** geração de ZIP Windows, AppImage e tar.gz concluída; integridade dos arquivos conferida e hashes atualizados. Testes gráficos Linux aprovados nos três modos: pasta, AppImage extraído sem FUSE e tar.gz. Reabertura preservou dados nos três modos. Não foram executados testes em Windows ou hardware multimonitor nesta revisão.


## 18/10/2026 — Etapa 2: experiência

**Autorização:** usuário solicitou avançar para a próxima etapa; realizadas 2.1 e 2.2, preservando pendências de homologação da etapa 1.

**Entregas:** interface em três áreas, biblioteca e busca com conteúdo original de exemplo, editor de rascunho, prévia por blocos, programação temporária reordenável, monitor ao vivo, barra fixa de apresentação e tela preta, ajuda e configurações, desenho do fluxo bíblico SQL, atalhos e confirmação de descarte de rascunho. Salvamento continua manual e restrito ao corpo do rascunho.

**Limites:** programação, títulos e exemplos são de sessão; importador SQL e transposição ainda não estão implementados. Textos muito longos ainda exigem revisão manual. Interface identifica esses limites para não sugerir persistência ou recursos inexistentes.

**Verificação:** tipos, compilação, cinco testes unitários, teste gráfico no Electron e revisão de captura real. Contrastes dos pares principais calculados; roteiro de voluntários preparado em etapa-2-experiencia.md. Nenhuma avaliação com pessoas realizada ou inferida dos testes automatizados.

**Estado:** 2.1 e 2.2 concluídas; 2.3 pendente. A etapa 2 não está integralmente concluída.

**Próximo passo:** realizar avaliação com cinco voluntários, registrar dificuldades e corrigir bloqueadores, além de concluir a homologação Windows/Linux da etapa 1. A etapa técnica seguinte é a 3: fundação de dados, migrações e backups.

**Contagem:** 6/44 tarefas principais concluídas; 38 pendentes, incluindo tarefas parcialmente realizadas. Restam a validação de 2.3, pendências da etapa 1 e as oito etapas seguintes (3 a 10).

**Entrega 0.2.0:** pacotes Windows ZIP e Linux AppImage/tar.gz gerados, integridade conferida e arquivos SHA-256 presentes. Os testes gráficos finais passaram nos três modos Linux (pasta, AppImage extraído e tar.gz), inclusive fechamento cancelado para preservar rascunho não salvo. Captura real em etapa-2-preview.png.


## 18/10/2026 — Etapa 3: dados e recuperação

**Autorização:** usuário solicitou a etapa 3 e limpeza de versões antigas em release. Pendências anteriores preservadas, sem alegar homologação Windows ou avaliação por voluntários.

**Implementação:** esquema 1, migração do rascunho legado com cópia prévia, repositórios de agregados e anexos por hash, bloqueio por pasta e SQLite exclusivo, erro e escolha explícita de pasta alternativa quando a padrão não pode ser preparada, IPC versionado com origem/frame verificados, checkpoint público recuperado em preto e backup/restauração na interface.

**Verificação:** tipos e compilação aprovados; treze testes unitários aprovados. Teste gráfico de desenvolvimento confirmou backup/restauração em Configurações, recusa de payload inválido, isolamento dos dados privados da projeção e recuperação em preto após reabertura. Resultados dos pacotes finais registrados em etapa-3-dados.md.

**Limites:** entidades persistentes disponíveis nos repositórios, ainda sem CRUD musical na interface. Dados demonstrativos de biblioteca e programação continuam de sessão. Backups contemplam dados persistidos, sem conteúdo bíblico ainda não implementado. Importador SQL e transposição permanecem para suas etapas.

**Conclusão:** 3.1, 3.2, 3.3 e 3.4 concluídas. Próxima etapa técnica: 4, fluxo completo de letras.

**Contagem:** 10/44 tarefas principais concluídas, 34 pendentes; sete etapas posteriores (4 a 10), além das pendências de 1 e 2.

**Entrega e limpeza concluídas:** 0.3.0 gerada em ZIP Windows, AppImage e tar.gz Linux; hashes conferidos. Testes gráficos dos três modos Linux aprovados. Removidos 12 arquivos de versões 0.1.0/0.2.0 (seis pacotes e seis hashes); release/data e pastas desembrulhadas da versão atual preservadas.


## 18/10/2026 — Correção 0.3.1 do modo apresentador

**Problema informado:** saída em tela preta sobre o único monitor impedia acessar os controles.

**Correção:** ensaio local sem janela adicional; modo apresentador na própria aplicação; saída fullscreen exclusiva para área externa separada; monitor do operador e áreas sobrepostas convertem para ensaio. Topologia, desconexão e movimento dos controles revalidam a saída. Interface explica Estender versus Duplicar e oferece voltar à edição sem encerrar o conteúdo ao vivo.

**Verificação:** tipos, compilação e 17 testes unitários aprovados. Teste gráfico confirmou ensaio e tela preta com um único BrowserWindow sem fullscreen; roteamento externo testado com monitor simulado e sem exibição nativa sobre o ambiente. Rascunho, backup/restauração e checkpoint continuam validados. Hardware e execução Windows permanecem pendentes da etapa 1.

**Escopo:** correção da experiência das etapas anteriores, sem iniciar etapa 4. Contagem permanece 10/44 tarefas concluídas e 34 pendentes. Próxima etapa técnica: 4.

**Entrega da correção:** pacotes 0.3.1 de Windows e Linux com hashes conferidos. Testes gráficos finais aprovados em pasta Linux, AppImage e tar.gz. Timeout de reabertura durante empacotamento não se reproduziu nas verificações finais. Artefatos 0.3.0 removidos, com dados preservados.


## 18/10/2026 — Etapa 4: letras e biblioteca persistente

**Autorização:** avançar para a próxima etapa do plano.

**Implementação 0.4.0:** cadastro, edição, pesquisa por título/autor/letra sem distinção de acentos, arquivamento reversível, seções com IDs estáveis e sequência de referências. Refrões repetidos usam a mesma seção. Gravação manual validada no processo principal, com preservação de criação e confirmação de descarte.

**Apresentação:** quebra manual e paginação automática, componente canônico comum à prévia/saída, avançar/retroceder no modo apresentador e ocultação de texto independente da tela preta. Editar ou selecionar na biblioteca preserva a saída. Ensaio continua sem janela adicional.

**Verificação:** tipos, compilação e 20 testes unitários aprovados. Teste gráfico de desenvolvimento confirmou cadastro pela interface, reinício, refrão compartilhado, pesquisa, arquivamento/desarquivamento, navegação, ocultação, isolamento da saída e limites visuais dos slides longos. Regressões de rascunho e backup/restauração aprovadas. Resultado final dos pacotes em etapa-4-letras.md.

**Conclusão técnica:** 4.1 a 4.4 concluídas. O marco com datashow físico e a execução Windows continuam sem homologação; monitor externo automatizado é simulado. Programação ainda temporária, Bíblia SQL e transposição permanecem nas etapas previstas. Salvamento automático acompanha recuperação em 8.4; não foi implicitamente declarado concluído.

**Próximo passo:** etapa 5, programação persistente, snapshots, temas e textos livres.

**Contagem:** 14/44 tarefas principais concluídas; 30 pendentes. Seis etapas futuras (5 a 10), além das pendências de homologação da etapa 1 e avaliação com voluntários da etapa 2.

**Entrega e limpeza:** ZIP Windows e AppImage/tar.gz Linux 0.4.0 gerados e identificados por SHA-256. Testes gráficos finais aprovados nos três formatos Linux. Conteúdo compilado comparado aos arquivos embarcados dos dois sistemas; CRC do ZIP e fluxo gzip/tar validados. Seis artefatos 0.3.1 removidos, com `release/data` preservada. Captura em etapa-4-preview.png; hashes e comando de geração em etapa-4-letras.md.


## 18/10/2026 — Etapa 5: programação, temas e textos

**Autorização:** avançar para a próxima etapa, após a entrega de letras.

**Implementação 0.5.0:** programações nomeadas, ordem por arraste/botões/teclado, recuperação da última programação e confirmação de descarte. Cada item guarda texto e tema independentes, com atualização de conteúdo a partir da origem e aplicação de tema por comandos explícitos. Textos livres têm cadastro e busca próprios; rascunho legado preservado.

**Temas:** fundo sólido ou imagem PNG/JPEG copiada para os dados, escurecimento, fonte, tamanho, alinhamento, margens e proporções 16:9/4:3. Prévia e saída compartilham geometria/paginação. Ocultar texto mantém o fundo; tela preta apaga tudo. Imagens são normalizadas e fornecidas por protocolo local restrito.

**Dados:** migração transacional para esquema 2 com cópia anterior, acrescentando tipo text. Restauração aceita backups dos esquemas 1 e 2 e exige correspondência com a versão do banco. Programações, temas, textos e imagens entram nos backups atuais.

**Verificação:** tipos, compilação e 25 testes unitários aprovados. Teste gráfico de desenvolvimento confirmou cadastro/reabertura de textos e programação, reordenação por mouse e teclado, isolamento das cópias, atualização explícita, imagem após remoção do original, ocultação com fundo, equivalência da prévia/projeção simulada em 4:3, saída 16:9 e backup/restauração. Resultados dos pacotes finais registrados em etapa-5-programacao-e-temas.md.

**Conclusão técnica:** 5.1 a 5.4 concluídas; execução Windows, datashow físico e voluntários permanecem pendentes. Salvamento continua manual; programação e edição da biblioteca não atualizam a saída sem comando.

**Próximo passo:** etapa 6, importação/cadastro de Bíblia SQL e consulta offline, conforme contrato existente.

**Contagem:** 18/44 tarefas principais concluídas, 26 pendentes. Cinco etapas seguintes (6 a 10), além das pendências anteriores de 1 e 2.

**Entrega e limpeza:** pacotes 0.5.0 Windows ZIP, Linux AppImage e tar.gz gerados, com SHA-256. Testes finais aprovados nos três formatos Linux. Verificados conteúdo embarcado de ambos os sistemas, CRC do ZIP e fluxo gzip/tar. Layout 4:3 no apresentador ajustado para manter prévia e itens acessíveis acima dos controles; teste de ocultação aguarda a pintura da interface após IPC. Seis arquivos 0.4.0 removidos e `release/data` preservada. Evidências e hashes em etapa-5-programacao-e-temas.md; captura em etapa-5-preview.png.


## 18/10/2026 — Etapa 6: Bíblia SQL e consulta offline

**Autorização:** avançar para a próxima etapa após a entrega 0.5.0.

**Implementação 0.6.0:** leitor SQL em worker com UTF-8 estrito, limites de arquivo/tempo/memória e cancelamento. Lexer/parser de CREATE/INSERT literais, sem executar o arquivo. Dois perfis de mapeamento, resolução de livros, prévia com cobertura/amostras/erros e confirmação explícita de conteúdo parcial ou não certificado.

**Persistência e consulta:** metadados e corpus normalizado imutável gravados em transação; SQLite de consulta separado e reconstruível. Cadastro, cópia identificada, substituição com backup e exclusão preservam programações. A tradução padrão só muda por escolha explícita, salvo a definição inicial. Consulta por abreviação/referência, pesquisa sem acentos e navegação por livro/capítulo.

**Apresentação:** referência, versão e atribuição opcionais em cada página. Programações guardam snapshots bíblicos independentes e ID da tradução. Atualização da origem exige comando; seleção ou erro de referência preserva a saída ativa. Proteções de ensaio e monitor externo mantidas.

**Verificação:** tipos, compilação e 34 testes unitários aprovados, incluindo corpus sintético de 31.680 versículos, limites, cancelamento ativo, falha transacional, duplicatas, cópias/default, substituição, fonte removida, referências e backup. Teste gráfico de desenvolvimento passou no fluxo completo de importação, consulta, reinício, projeção e restauração. Resultados dos pacotes finais em etapa-6-biblia-offline.md.

**Backup:** envelope 2 para incluir corpus de até 64 MiB compactados, com limite total de 128 MiB; restauração continua aceitando envelopes anteriores. Imagens permanecem limitadas a 10 MiB. Biblioteca permanece no esquema 2.

**Conclusão técnica:** tarefas 6.1 a 6.4 e subtarefas 6.1.a a 6.1.f concluídas. Cobertura não é certificada por versificação e requer confirmação. Não foram usados textos de traduções reais nos testes. Execução Windows, datashow físico e voluntários permanecem pendentes.

**Próximo passo:** etapa 7, cifras estruturadas, transposição, alinhamento e integração aos snapshots.

**Contagem:** 22/44 tarefas principais concluídas; 22 pendentes. Quatro etapas seguintes (7 a 10), além das pendências anteriores de 1 e 2.

**Entrega e limpeza:** Windows ZIP e Linux AppImage/tar.gz 0.6.0 gerados com SHA-256. Testes finais passaram nos três formatos Linux, incluindo worker externo ao ASAR. Código embarcado verificado nos dois sistemas; CRC/fluxo gzip/tar aprovados. Seis arquivos 0.5.0 removidos, com dados preservados. Resultados, limites e hashes em etapa-6-biblia-offline.md; captura em etapa-6-preview.png.


## 18/10/2026 — Etapa 7: cifras e transposição

**Autorização:** seguir para a próxima etapa após a entrega da Bíblia offline.

**Implementação 0.7.0:** marcação inline documentada, representação de linhas/letra/posições, transposição da raiz e baixo preservando qualificadores, tons original/apresentação independentes, escolha de acidentes e avisos para tokens desconhecidos. Modo letra ou letra com cifras usa paginação e componente compartilhados entre prévia e projeção.

**Persistência:** músicas guardam marcação, posições e configuração musical. Programações guardam cópias completas, com ajustes musicais próprios e atualização explícita pela origem. Checkpoint inclui página estruturada, retomando fechado/preto. Backup inclui músicas, cifras, tons e cópias, com restauração e reabertura verificadas.

**Verificação:** tipos, build e 38 testes de domínio aprovados. Fluxo gráfico verifica cadastro, transposição, aviso, somente letra, saída ativa preservada, cópia independente, limites da prévia, backup/restauração e reinício. Projeção externa simulada verifica acordes e ocultação com o mesmo renderizador, sem fullscreen nativo no monitor real. Evidências de distribuição em [etapa 7](etapa-7-cifras.md).

**Conclusão técnica:** 7.1 a 7.4 concluídas. **Próximo passo:** etapa 8, importação com prévia, duplicatas, exportação e recuperação/salvamento automático seguro.

**Contagem:** 26/44 tarefas principais concluídas e 18 pendentes. Três etapas seguintes (8 a 10), além das quatro tarefas pendentes de homologação/usabilidade das etapas 1 e 2. Windows físico, datashow real e voluntários continuam pendentes.

**Entrega e limpeza:** Windows ZIP e Linux AppImage/tar.gz 0.7.0 gerados com SHA-256; todos os formatos Linux finais passaram nos testes gráficos. Inspeção dos dois pacotes confirmou os 63 arquivos compilados; ZIP/CRC e gzip/tar validados. Seis arquivos 0.6.0 removidos, mantendo os dados do operador. Resultados, hashes e captura em etapa-7-cifras.md.


## 18/10/2026 — Etapa 8: importação e recuperação

**Autorização:** seguir para o próximo passo após o commit da etapa 7.

**Implementação 0.8.0:** importação de texto/cifras UTF-8 com edição e prévia; duplicatas por título e conteúdo normalizados; ignorar, copiar ou atualizar explicitamente. Atualizações criam backup anterior e verificam digest/data da prévia. Exportação completa reaproveita `.zamar-backup`, incluindo Bíblia e anexos.

**Salvamento automático:** debounce de 1,2 segundo, validação no renderer e no backend, transação do lote com recibo de recuperação, comparação com versão de origem e sessão invalidada após restauração. Músicas, textos, rascunho, temas e programações válidos são salvos automaticamente. Edição de tema salva a biblioteca sem aplicar automaticamente à preparação. A saída ativa é preservada.

**Recuperação e falhas:** indicador e nova tentativa; campos inválidos e conflitos mantêm a última versão confirmada. Recuperar última edição consulta a versão atual dos conteúdos do último lote, preparando sem publicar. Falhas também aparecem no rodapé do apresentador.

**Verificação:** tipos, build e 45 casos de domínio aprovados. Injeção de SQLITE_FULL durante lote verifica rollback e recibo anterior. Processo filho encerrado por SIGKILL durante transação verifica recuperação após reabertura. Fluxo gráfico de desenvolvimento passou em texto/cifras, três decisões de duplicatas, todos os tipos de autosave, conflito com atualização concorrente, nova tentativa, confirmação manual, campos inválidos, crash do renderer, recuperação e exportação/restauração. Não usa dados reais do operador.

**Conclusão técnica:** 8.1 a 8.4 concluídas. **Próximo passo:** etapa 9, homologação de usabilidade e desempenho. Restam 14 tarefas principais: duas etapas (9 e 10) e quatro tarefas anteriores nas etapas 1 e 2. Homologações físicas, voluntários e ensaio de 2 horas permanecem pendentes.

**Entrega e limpeza:** pacotes Windows ZIP e Linux AppImage/tar.gz 0.8.0 gerados com SHA-256. A suíte gráfica completa passou nos três formatos Linux finais, incluindo as regressões anteriores. Conteúdo compilado conferido nos dois sistemas; ZIP/CRC e gzip/tar validados. Seis arquivos 0.7.0 removidos, mantendo os dados. Resultados, hashes e captura em etapa-8-importacao-e-recuperacao.md.


## 18/10/2026 — Etapa 9: qualificação local e pendências reais

**Autorização:** avançar à próxima etapa. O usuário informou que ainda não tem dois monitores/datashow e cinco voluntários disponíveis.

**Medições e correções 0.9.0:** benchmark reproduzível com 10 mil músicas identificou normalização/filtragem repetida e excesso de DOM. Índice normalizado memorizado e renderização em lotes de 100 reduzem busca e latência da prévia; Mostrar mais preserva acesso a todos os resultados. Evidências antes/depois com sandbox habilitado em etapa-9-homologacao.md.

**Teclado e escala:** roteiro verifica Tab/Enter, B/O/setas, campos de edição, Escape, foco e link de acesso ao conteúdo. Ctrl+F agora revela a biblioteca durante apresentação sem mudar a saída. Layout compacto corrige prévias encobertas pelo rodapé em zoom alto. Oito combinações locais de janela/zoom e contrastes padrão verificados; zoom não substitui DPI nativo/misto.

**Executor de testes:** Playwright passava --no-sandbox por padrão; os lançamentos agora exigem chromiumSandbox:true e verificam a ausência da flag. Contexto gráfico offline após cada lançamento. Isso não é prova de máquina limpa com adaptadores desligados antes da primeira abertura.

**Conclusão parcial:** 9.1 concluída; 9.2/9.5 têm evidências locais e permanecem abertas na matriz completa. 9.3/9.4 não executadas: dependem dos recursos indisponíveis. Protocolos de duas horas e cinco voluntários prontos em docs/homologacao. Não foi declarado ensaio prolongado, teste humano ou homologação Windows/DPI físico.

**Contagem:** 31/44 tarefas principais concluídas e 13 pendentes. Próximo passo é completar a homologação da etapa 9 quando houver os recursos; a etapa 10 continua dependente dela.

**Entrega intermediária:** Windows ZIP e Linux AppImage/tar.gz 0.9.0 gerados com SHA-256. Os três formatos Linux finais passaram na suíte completa com sandbox habilitado e contexto offline. Windows foi inspecionado, sem execução; 76 arquivos compilados conferidos nos dois sistemas e integridade ZIP/gzip/tar validada. Seis arquivos 0.8.0 removidos, com dados preservados. Relatórios JSON e captura nativa a 200% estão em etapa-9-homologacao.md. A etapa permanece parcial pelos critérios físicos/humanos.


## 18/10/2026 — Encerramento das 13 pendências e entrega 1.0.0

**Autorização/aceite:** o usuário solicitou encerrar as validações físicas de sistemas/monitores e o ensaio com cinco voluntários, concluindo as 13 tarefas. Confirmou também, em resposta específica, o ensaio de duas horas com dois monitores e rede desligada sem falhas bloqueadoras. Origem e limites em homologacao/aceite-usuario.md. Não foram inventadas medições individuais ou novas execuções físicas pelo agente.

**Entrega técnica:** pacotes 1.0.0 com GUIA-RAPIDO.md, ATUALIZACAO.md, COMPONENTS.json e BUILD-MANIFEST.json. Inventário de 351 componentes e hashes de 86 inputs/76 arquivos compilados. Execução do verificador compara artefatos de ambos os sistemas, guias/licenças e PE x64 sem Authenticode. Assinatura avaliada e documentada com fontes oficiais, sem obter certificados ou alterar proteções do sistema.

**Atualização:** teste dedicado preserva pacote anterior 0.9.0 antes de empacotar; usa dados sintéticos em cópias temporárias para verificar passagem para 1.0.0, retorno à cópia anterior, restauração e reabertura, com letras/cifras/tons, seções repetidas, temas, imagem, programação e Bíblia, sem arquivos de origem. Migração de esquemas antigos, proteção contra banco futuro e falhas transacionais permanecem cobertas pelos testes de domínio.

**Contagem final:** 44/44 tarefas encerradas; zero pendentes no plano. Validações físicas/humanas encerradas por aceite, execução técnica identificada pelos relatórios e verificações. Resultados finais e hashes em etapa-10-entrega.md.

**Verificação final:** 45 casos de domínio aprovados; upgrade/retorno/restauração aprovados; suíte gráfica completa nos três formatos Linux finais aprovada com sandbox e contexto offline. ZIP/CRC e gzip/tar íntegros; guias/inventário/manifesto presentes. A sincronização do teste de foco aguarda o frame da atualização, sem mudança adicional do aplicativo. Seis arquivos 0.9.0 removidos; somente artefatos 1.0.0 mantidos e `release/data` preservada.


## 19/10/2026 — Temas claro e escuro da interface

**Objetivo:** manter a paleta neutra escura e permitir alternância para uma paleta clara pelo cabeçalho.

**Implementação:** cores da interface centralizadas em variáveis CSS, com fundos claros, texto escuro e destaque neutro na variante clara. Botão acessível indica a próxima ação. Preferência `interface-theme` persistida no SQLite existente, sem migração de esquema, por IPC validado e exclusivo do operador; recuperada na inicialização. Falhas de gravação são exibidas e preservam a seleção anterior. As cores dos slides e o estado da apresentação permanecem independentes.

**Verificação:** tipos e compilação aprovados; teste gráfico Linux em modo de desenvolvimento com sandbox habilitado confirma alternância, recuperação da preferência após recarga, rejeição de valor inválido e preservação do snapshot público. Qualificação de teclado, zoom e contraste do tema escuro aprovada. Pacotes em `release` ainda correspondem à entrega anterior e precisam ser regenerados para distribuir esta melhoria.


## 19/10/2026 — Importação de Bíblia em SQLite

**Objetivo:** aceitar `.sqlite`, `.sqlite3` e `.db` no cadastro existente, preservando SQL e a confirmação de prévia.

**Implementação:** reconhecimento pelo cabeçalho, cópia temporária isolada com limpeza pelo controlador, leitura SQLite somente de tabelas comuns com limites e identificação segura de colunas. Sem execução de scripts de esquema, views, triggers ou extensões. O arquivo original permanece intacto. Mapeamento, duplicatas, confirmação, persistência do corpus e backup continuam compartilhados com a importação SQL.

**Verificação:** tipos e build aprovados; suíte de domínio aprovada, incluindo novos cenários SQLite com tabela relacionada de livros, acentuação, consulta após remoção da origem, preservação byte a byte, rejeição de colunas geradas, BLOBs e banco corrompido sem cadastro parcial. Pacotes de distribuição precisam ser regenerados para incluir o recurso.


## 19/10/2026 — Catálogo Encontro e importação JSON em lote

**Solicitação:** gerar uma biblioteca versionada tomando o PPTX fornecido como fonte principal, preservando o conteúdo e permitindo cadastro posterior em produção.

**Extração:** script Python padrão lê a ordem real da apresentação e as quebras DrawingML; 981 slides, quatro vazios, 232 registros, 36 alertas específicos. Texto fonte normalizado separado para auditoria, hash do original, IDs determinísticos e seções por slide. Duplicatas não foram fundidas. Todos os registros aguardam revisão humana; consultas pontuais de identificação estão em library/encontro/REFERENCIAS.md, sem substituir letras ou presumir autores. O PPTX não é necessário no repositório.

**Aplicativo:** seletor de catálogo JSON, validação do formato e limites, prévia expansível, seleção individual/todas, alertas e confirmação explícita. IDs existentes são preservados; títulos repetidos são sinalizados. Backup anterior e transação atômica, sem alterar projeção/programações. Não foi modificado nenhum banco real do usuário.

**Verificação:** tipos/build e suíte de domínio aprovados, incluindo cobertura/conservação dos slides, seleção parcial, importação dos 232 registros, reimportação sem sobrescrever edições e rollback injetado. Teste gráfico Linux com sandbox importou o lote, verificou persistência após recarga, estado público inalterado e bloqueio de reimportação. Pacotes release ainda precisam ser regenerados.

**Regressão final:** suíte gráfica completa Linux em modo de desenvolvimento aprovada com sandbox, incluindo letras, textos, temas, Bíblia, cifras, importação/recuperação, teclado e zoom. Extração repetida produziu os mesmos hashes dos três artefatos gerados.


## 19/10/2026 — Backup completo em JSON

**Solicitação:** substituir a exportação `.zamar-backup` por JSON, mantendo a persistência local em banco e anexos.

**Implementação:** envelope 3 em JSON UTF-8 legível, com registros/configurações/metadados estruturados e anexos base64 com hashes. Nenhum banco SQLite binário é embutido no formato novo. Exportação parte de snapshot consistente, valida limites e grava atomicamente. Restauração reconstrói banco temporário com esquema próprio, verifica conteúdo/anexos, cria cópia anterior JSON e substitui dados em transação. Leitura de envelopes antigos gzip 1/2 mantida. Backups de proteção antes de importações e alterações de Bíblia também passam a `.json`; snapshots internos de migração continuam sendo cópias SQLite locais.

**Uso:** Configurações → Exportar biblioteca completa / Criar backup e Restaurar backup. JSON de backup completo (`zamar-backup`) é distinto do catálogo de músicas (`zamar-song-library`). Exportar não atualiza automaticamente o catálogo do repositório. Manifesto de build atualizado para envelope 3; guias e interface revisados.

**Verificação:** tipos/build e suíte de domínio aprovados. Novos testes conferem texto estruturado legível, transferência entre pastas com anexos, cópia anterior JSON, rejeição de JSON inválido/conteúdo adulterado/configurações duplicadas/catálogo incorreto e restauração legada. Regressão gráfica completa Linux aprovada com exportação/restauração JSON, imagens e Bíblia em dados temporários, sandbox habilitado. Os pacotes em release precisam ser regenerados para distribuir a alteração.


## 19/10/2026 — Separar exportações de letras e cifras

**Solicitação:** oferecer exportações separadas de letras/cifras em JSON, sem exportação de Bíblia; preservar banco local e gerenciamento de versões bíblicas.

**Implementação:** Configurações oferece Exportar letras de músicas e Exportar cifras de músicas, com catálogos `zamar-song-library` reimportáveis. Letras inclui todas as músicas sem marcações de acordes; cifras seleciona músicas com acordes, independentemente do modo atual de exibição, preservando texto, posições e tons. IDs/seções e músicas arquivadas são preservados. Exportação atômica, limites iguais ao importador, aviso quando não há músicas/cifras. Nenhuma Bíblia, imagem, programação ou tema entra nos catálogos. As músicas locais não são alteradas.

**Bíblia:** importação SQL/SQLite, consulta, substituição por nova importação, padrão e remoção mantidos. Não há botão de exportação bíblica. Exportação completa removida da interface; backups completos internos de proteção e recuperação de arquivos anteriores permanecem disponíveis para não perder capacidade de recuperação. Testes de recuperação preparam essas cópias pela API de compatibilidade; a interface de exportação tem apenas as duas opções solicitadas.

**Validação:** tipos/build e testes de domínio aprovados, incluindo exclusão de Bíblias/anexos, remoção de acordes somente no arquivo de letras, seleção por presença de cifras, preservação dos tons e dados locais, compatibilidade do catálogo e coleção de cifras vazia. Teste gráfico específico aprovou os dois botões, os JSONs gerados e dados locais intactos. Guias atualizados; release precisa ser regenerado.

**Regressão final desta revisão:** suíte gráfica completa Linux em modo de desenvolvimento aprovada, incluindo CRUD/consulta de Bíblia, letras, cifras, temas, recuperação, teclado e zoom, com sandbox habilitado e dados temporários.
