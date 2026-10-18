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
