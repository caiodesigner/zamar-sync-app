# Plano de desenvolvimento — Zamar Sync

> Documento de planejamento, sem implementação. Elaborado em 18/10/2026. As decisões abaixo orientam a execução futura em tarefas pequenas por uma LLM.

## 1. Objetivo do produto

Criar um aplicativo de apresentação de letras de música, versículos bíblicos e cifras em datashow, simples para voluntários e confiável durante cultos e ensaios. A experiência deve permitir abrir o aplicativo, escolher a tela de projeção, buscar um conteúdo e apresentá-lo em poucos passos.

Usar o Holyrics como referência funcional para biblioteca, temas, programação e apresentação, criando identidade visual e fluxos próprios. Priorizar as tarefas frequentes e evitar menus extensos, configurações obrigatórias e excesso de recursos na primeira versão.

## 2. Premissas e limites

- Funcionamento integral dos recursos principais sem internet, inclusive no primeiro uso.
- Sem conta, autenticação, servidor remoto ou assinatura para operar.
- Sem instalação de Java, Node.js, navegador ou banco de dados pelo usuário.
- Windows 11 x64 e Linux x64 como plataformas do MVP. Matriz Linux inicial: Ubuntu 24.04 LTS e Linux Mint 22; homologação em X11 e, onde disponível, sessão Wayland executando o app por XWayland. Wayland nativo e macOS ficam para avaliação posterior. Distribuições fora dessa matriz não têm compatibilidade presumida.
- Distribuição Windows em ZIP portátil; Linux em AppImage e alternativa `tar.gz` extraível sem FUSE. Extrair o ZIP/tar.gz e abrir o executável, ou conceder permissão de execução ao AppImage e abri-lo. Validar os requisitos do sistema operacional e a execução sem instalações secundárias em cada ambiente homologado.
- Não prometer um único binário universal: cada sistema e arquitetura exigem empacotamento e testes próprios.
- Execução sem administrador em pasta gravável. Políticas corporativas e alertas do sistema operacional podem limitar a execução de aplicativos portáteis.
- Conteúdos, fontes e imagens essenciais incluídos localmente no pacote.
- Cadastro de Bíblias pelo usuário a partir de arquivos `.sql` obtidos gratuitamente na internet, sem cobrança de importação pelo aplicativo. O programa não incluirá obrigatoriamente a ARA nem fará download automático de traduções. Após importar, todo o conteúdo fica salvo localmente e disponível offline. A obtenção do arquivo é feita previamente pelo usuário; sua origem e condições de uso podem ser registradas no cadastro, sem exigência de documento de autorização para concluir a etapa 0.3 ou utilizar o importador.
- O computador precisa oferecer saída de vídeo compatível com o datashow. O app pode orientar o uso de área de trabalho estendida, mas não substitui a configuração física do sistema.

## 3. Escopo por versão

### MVP

- Biblioteca local de músicas, com cadastro, edição, pesquisa e importação de texto.
- Letras divididas em estrofes, refrões e outras seções reutilizáveis.
- Cadastro e importação de Bíblia em `.sql`, com prévia, identificação da tradução, persistência local e consulta por referência e por texto. Suportar ARA quando o usuário fornecer arquivo compatível, sem fixar uma tradução obrigatória.
- Persistência local de todas as letras e cifras cadastradas ou importadas pelo usuário, incluindo edições, seções, sequências e tons, preservadas entre sessões e atualizações.
- Cifras com edição, visualização e transposição de acordes reconhecidos.
- Programação do culto com músicas, passagens e textos livres em ordem editável.
- Tela do operador, prévia e uma saída pública independente.
- Temas básicos, fundo sólido, imagem local, ajuste de fonte e margens.
- Atalhos, tela preta, ocultação do texto, salvamento automático e backup.
- Pacote portátil testado em computador sem ferramentas de desenvolvimento.

### Versão seguinte

- Retorno para músicos em terceiro monitor, independente da projeção pública.
- Mais formatos de importação, após verificar documentação e direitos de uso.
- Temas adicionais, filtros por categoria e histórico de apresentações.
- Pacote para macOS e ampliação da matriz de distribuições Linux, respeitando suas dependências e permissões.

### Fora do escopo inicial

Sincronização em nuvem, controle por celular, transmissão ao vivo, reprodução de vídeo, áudio, escalas de equipes, marketplace, IA generativa e integração direta com serviços de letras. Esses recursos não devem criar dependências no MVP.

## 4. Experiência e design

### 4.1 Tela principal

Organizar a interface em três áreas: biblioteca e busca à esquerda; conteúdo selecionado e prévia no centro; programação à direita. Manter uma barra inferior com estado da saída, conteúdo ao vivo e ações de apresentação.

- Busca única com filtros visíveis: músicas, Bíblia e textos.
- Botões claros: “Adicionar à programação”, “Apresentar”, “Tela preta” e “Encerrar projeção”.
- Identificação textual e visual distinta para “Prévia” e “Ao vivo”.
- Selecionar ou editar um item não altera o conteúdo projetado. A mudança exige ação explícita.
- Configurações avançadas em painel secundário, com valores iniciais úteis.
- Primeiro uso curto: selecionar monitor, testar projeção e abrir conteúdo de demonstração.
- Tema escuro para operação, contraste adequado, foco de teclado visível e ícones acompanhados de rótulos nas ações principais.

### 4.2 Fluxos essenciais

1. **Música:** buscar → selecionar → conferir seções → apresentar → avançar blocos.
2. **Bíblia:** digitar referência → escolher trecho → conferir divisão → apresentar.
3. **Cifra:** selecionar música → ativar cifras → ajustar tom → conferir → apresentar.
4. **Culto:** criar programação → adicionar conteúdos → ordenar → salvar → executar.
5. **Emergência:** acionar tela preta imediatamente → resolver seleção → retomar último slide.

### 4.3 Atalhos propostos

| Ação | Atalho inicial |
| --- | --- |
| Buscar | Ctrl+F |
| Apresentar seleção | Ctrl+Enter |
| Próximo/anterior | Setas direita/esquerda |
| Tela preta e retorno | B, apenas fora de campos de edição |
| Ocultar/restaurar texto | O, apenas fora de campos de edição |
| Sair da tela cheia da saída | Esc na janela de projeção |

Atalhos de apresentação não devem capturar digitação em campos de texto. Avançar o último slide mantém a exibição; passar ao próximo item deve ser uma ação explícita e previsível.

## 5. Arquitetura recomendada

### 5.1 Linguagem e tecnologias

| Camada | Escolha proposta | Justificativa |
| --- | --- | --- |
| Aplicativo desktop | Electron | Inclui Chromium e Node.js no pacote, sem instalação separada pelo operador |
| Linguagem | TypeScript | Tipagem compartilhada entre domínio, interface e comunicação |
| Interface | React com Vite | Componentização e construção de interface interativa |
| Estilos | CSS com tokens de design | Controle de contraste, espaçamento, tipografia e temas |
| Persistência | SQLite embarcado | Transações, pesquisa local e backup em arquivo |
| Testes | Vitest e Playwright com suporte ao Electron | Verificar regras e fluxos críticos |
| Distribuição | Empacotador compatível com Electron e modo portátil | Gerar artefatos por sistema operacional |

Fixar versões compatíveis no início da implementação. Validar o driver SQLite e suas dependências nativas no pacote de destino; nenhum módulo pode exigir instalação adicional no computador do usuário. Ferramentas de desenvolvimento serão necessárias apenas para quem compila o aplicativo.

### 5.2 Alternativas avaliadas

- **Electron — recomendado:** pacote maior e maior consumo de memória em troca de ambiente de renderização incluído e consistente.
- **Tauri:** candidato se tamanho for prioridade futura; a dependência de WebView do sistema exige estratégia específica. No Windows, runtime fixo pode ser empacotado, mas essa decisão precisa de validação própria.
- **Aplicativo web/PWA:** não atende tão diretamente à primeira execução offline e ao controle de janelas e monitores exigidos.
- **.NET desktop autocontido:** alternativa viável para Windows; exigiria outra stack de interface e avaliação própria de portabilidade.

Não tratar “sem dependências” como ausência de requisitos do sistema operacional. O objetivo é não exigir runtimes ou serviços instalados separadamente.

### 5.3 Divisão de responsabilidades

- **Processo principal:** janelas, monitores, persistência, arquivos, backups e ciclo de vida.
- **Preload:** API mínima e tipada para comunicação autorizada com a interface.
- **Interface do operador:** biblioteca, edição, programação e comandos.
- **Interface de projeção:** renderização exclusiva do conteúdo público, sem controles administrativos.
- **Domínio compartilhado:** segmentação de slides, referências bíblicas, cifras, temas e validações.

O processo principal mantém o estado oficial da apresentação. As janelas recebem snapshots versionados; a saída recém-aberta solicita o estado completo. Comandos possuem validação e sequência para impedir que mensagens atrasadas substituam o slide atual.

### 5.4 Segurança e recursos locais

Desabilitar integração Node nas interfaces; usar isolamento de contexto, sandbox e política restritiva de conteúdo. Validar mensagens entre processos e arquivos importados. Renderizar letras como texto, sem executar HTML. Não carregar scripts, fontes ou estilos externos. Não abrir portas de rede para os recursos do MVP.

### 5.5 Estrutura lógica futura

Organizar módulos separados para domínio, aplicação, persistência, processo principal, preload, interface do operador, projeção e testes. Regras de música, Bíblia e cifras devem funcionar sem depender de componentes visuais. Evitar serviços e camadas sem necessidade demonstrada.

## 6. Dados e armazenamento

| Entidade | Informações principais |
| --- | --- |
| Música | Identificador, título, autor, categorias, tom original e datas |
| Seção musical | Música, tipo, rótulo, ordem e linhas de conteúdo |
| Cifra | Acordes associados a posições no texto e metadados de transposição |
| Sequência musical | Referências às seções, permitindo repetir refrões sem duplicar texto |
| Versão bíblica | Nome, abreviação, idioma, licença, origem e versão do pacote |
| Versículo | Versão, livro, capítulo, número e texto |
| Programação | Nome, data opcional e itens ordenados |
| Item da programação | Referência ao conteúdo, configurações e snapshot para apresentação estável |
| Tema | Fonte, tamanho, contraste, fundo, alinhamento e margens |
| Configuração | Preferências, monitor escolhido e localização de dados |
| Arquivo local | Identificador, caminho relativo, tipo e integridade |

Usar identificadores estáveis e migrações versionadas. Alterações na biblioteca não devem modificar silenciosamente uma programação já preparada: oferecer atualização explícita do snapshot. Copiar imagens importadas para a biblioteca local para evitar referências quebradas.

### 6.1 Modos de armazenamento

As letras e cifras do usuário devem ser gravadas no banco SQLite em disco, e não somente na memória ou no estado da interface. Salvar conteúdo, posições dos acordes, tom original, tom de apresentação, seções e sequências. Exibir confirmação de salvamento apenas após a gravação bem-sucedida. Ao fechar e reabrir o aplicativo, recuperar a biblioteca com as últimas alterações confirmadas. Atualizações do programa não podem sobrescrever esse banco.

Cada Bíblia cadastrada deve ser convertida para o modelo interno e persistida em banco local, separado dos dados musicais. Preservar nome, abreviação, idioma, edição, origem informada, notas de uso e integridade do arquivo importado. Incluir as Bíblias importadas no backup completo. Atualizações do aplicativo não podem apagá-las ou exigir nova importação. Sem Bíblia cadastrada, mostrar uma orientação com a ação “Importar Bíblia (.sql)”; os demais recursos continuam disponíveis.

- **Portátil, padrão:** dados em subpasta junto ao executável em ZIP/tar.gz, quando gravável. Em AppImage, dados ao lado do arquivo `.AppImage` original, nunca na montagem somente leitura ou extração temporária. Mover o aplicativo inclui mover sua pasta de dados.
- **Local, opcional:** dados na pasta de usuário do sistema, com escolha explícita e localização visível.
- Se a pasta portátil não permitir escrita, informar o problema e oferecer selecionar outra pasta; não mudar silenciosamente o destino.
- Não suportar o mesmo banco aberto por várias instâncias ou compartilhado em rede no MVP.
- Prevenir segunda instância concorrente sobre os mesmos dados.
- Avisar que fechar o app e ejetar corretamente o pendrive é necessário antes de removê-lo.

### 6.2 Backup e recuperação

Salvar edições automaticamente com indicação de estado. Criar backups consistentes por mecanismo próprio do SQLite, incluindo arquivos vinculados e manifesto com versão e integridade. Não copiar banco aberto de modo inseguro. Fazer backup antes de migrações e restaurações, manter retenção limitada e validar restauração em ambiente temporário antes de substituir os dados ativos.

Atualização manual deve preservar a pasta de dados. Instruir o usuário a fechar o aplicativo, fazer backup e substituir apenas os arquivos do programa. Detectar banco de versão futura e impedir abertura destrutiva por versão antiga.

## 7. Regras funcionais críticas

### 7.1 Letras e divisão de slides

Preservar quebras e seções definidas pelo usuário. Gerar slides de acordo com área útil, fonte e limite de linhas. Permitir divisão manual e prévia. Medir o texto com as mesmas fontes da saída; impedir corte silencioso, avisar sobre excesso e dividir conteúdo quando necessário. Refrões repetidos devem apontar para a mesma seção.

### 7.2 Bíblia

O MVP permite cadastrar uma ou mais traduções por importação de arquivo `.sql` e selecionar a tradução padrão. ARA pode ser cadastrada como qualquer outra tradução compatível. Na primeira abertura não haverá tradução real obrigatoriamente incluída. A importação de um arquivo já baixado deve funcionar com a rede desligada, assim como toda consulta posterior.

Reconhecer exemplos como “João 3:16”, “Jo 3:16-18” e “1 Coríntios 13”. Normalizar abreviações e acentos, validar limites e explicar referências inválidas. Consultas entre capítulos podem ficar para versão posterior, com limite explícito no MVP. Exibir referência e versão na projeção; incluir atribuições exigidas pela licença. Manter índice de busca totalmente local.

O fluxo completo de cadastro, formatos suportados, mensagens e subtarefas está em [Importação de Bíblia SQL](importacao-biblia-sql.md). Arquivo gratuito não significa automaticamente redistribuição livre; o aplicativo não terá catálogo ou cópias de traduções incluídas por essa funcionalidade.

### 7.3 Cifras

Adotar representação estruturada de acordes ancorados no texto, com entrada simplificada baseada no formato ChordPro, limitada ao subconjunto documentado. Garantir alinhamento após alteração de fonte ou largura.

Transpor acordes reconhecidos por semitons, incluindo baixo invertido, preservando qualificadores e escolhendo sustenidos ou bemóis de forma consistente. Não alterar o texto da letra. Tokens desconhecidos permanecem intactos com aviso. Separar tom original e tom de apresentação. No MVP, o operador escolhe projetar letra ou letra com cifras na saída pública; retorno simultâneo independente fica para a versão seguinte.

### 7.4 Monitores e estado ao vivo

Ao iniciar, entrar no modo apresentador mantendo controles, miniaturas, prévia e conteúdo atual visíveis no monitor do operador. Com uma única tela, usar ensaio local dentro da aplicação, sem abrir janela de saída nem ocupar a tela com preto. A projeção em tela cheia só pode usar um monitor/datashow separado em modo estendido. Remover qualquer opção de confirmar projeção sobre o próprio operador. Identificar saídas por nome, resolução e posição e excluir áreas espelhadas ou sobrepostas. Ver [correção do modo apresentador](ajuste-modo-apresentador.md).

Ao desconectar o datashow, sobrepor as telas por mudança de configuração ou mover os controles para a área da saída, suspender a saída e manter o operador funcional; não mover automaticamente a projeção para a tela de controle. Ao reconectar, solicitar seleção e retomada. Iniciar saída em preto. Oferecer teste de proporção 16:9 e 4:3, margens seguras e nenhuma exibição de menus, cursor ou notificações internas sobre o conteúdo.

Separar o slide ativo do estado visual: normal, texto oculto ou tela preta. Recuperar uma janela de saída que falhou inicialmente em preto, exigindo retomada explícita. Editar um conteúdo ao vivo só altera a saída após comando de reapresentação.

## 8. Metas verificáveis de qualidade

Metas iniciais a validar em Windows 11 x64 e na matriz Linux x64, com SSD, 8 GB de RAM e dois monitores Full HD. Registrar o processador e as condições reais do equipamento de referência antes de medir.

| Indicador | Meta inicial |
| --- | --- |
| Abertura até interface utilizável | Até 5 segundos no equipamento de referência |
| Busca em 10 mil músicas | Até 200 ms no percentil 95 após índice pronto |
| Comando até slide visível | Até 100 ms no percentil 95, sem transições animadas |
| Operação contínua | Ensaio de 2 horas sem falhas nem crescimento contínuo de memória |
| Primeiro uso | Pelo menos 4 de 5 voluntários projetam uma música em até 3 minutos sem ajuda verbal |
| Offline | Todos os fluxos do MVP funcionam com rede desabilitada desde a primeira abertura |
| Conteúdo | Nenhum corte de texto nos cenários homologados de letras, Bíblia e cifras |

Esses valores são critérios propostos, não garantias já demonstradas. Medir e registrar resultados antes de declarar a versão pronta.

## 9. Etapas de execução para uma LLM

Executar as tarefas na ordem das dependências. Cada tarefa deve produzir uma mudança pequena, verificável e documentada. Não avançar quando um critério essencial da tarefa estiver pendente.

### Etapa 0 — Consolidar decisões

**Dependência:** nenhuma.

**Execução:** consultar [especificação da etapa 0](etapa-0-especificacao.md), [inventário de licenças](inventario-de-licencas.md) e [registro de execução](registro-de-execucao.md). Tarefas 0.1, 0.2 e 0.3 concluídas. Por alteração de escopo do usuário, 0.3 trata do inventário e das condições dos ativos distribuídos; obtenção de autorização ARA deixa de ser requisito. O cadastro bíblico por `.sql` está especificado para execução na etapa 6.

- [x] **0.1** Registrar escopo do MVP, plataforma e significado de distribuição portátil. **Conclusão:** decisões e exclusões documentadas.
- [x] **0.2** Definir formatos mínimos de letras, cifras e pacote bíblico. **Conclusão:** exemplos de entrada, saída e erros aprovados no documento técnico.
- [x] **0.3** Inventariar licenças e avisos dos conteúdos, fontes e componentes distribuídos. **Conclusão:** origens, condições conhecidas e avisos documentados; nenhuma tradução bíblica de terceiros exigida no pacote. A importação local pelo usuário não exige obtenção de licença pelo projeto para concluir esta tarefa.

### Etapa 1 — Validar o maior risco técnico

**Dependência:** etapa 0.

**Estado:** etapa 0 concluída após revisão do escopo. A base técnica segue sem Bíblia pré-carregada. Ver [validação da etapa 1](etapa-1-validacao.md).

- [x] **1.1** Criar base Electron e TypeScript compartilhada entre Windows e Linux, com operador e saída independente. **Conclusão:** modo apresentador, ensaio local e saída independente implementados; verificação gráfica realizada no Linux, com homologação Windows coberta nas tarefas seguintes.
- [ ] **1.2** Gerar ZIP Windows e AppImage/tar.gz Linux com SQLite incluído. **Conclusão:** abrir, gravar, fechar e reabrir em ambos os sistemas; AppImage preserva dados fora da montagem e tar.gz oferece execução sem FUSE. Confirmar também reabertura por extração do AppImage.
- [ ] **1.3** Testar Windows e matriz Linux em máquinas limpas, offline, contas sem administrador e caminhos com espaços e acentos. **Conclusão:** nenhuma instalação secundária no ambiente homologado; registrar tamanho, memória, permissões de execução, sandbox e requisitos do sistema. Não desabilitar sandbox para declarar aprovação.
- [ ] **1.4** Testar dois monitores, escalas, desconexão e retomada em Windows, Linux X11 e sessão Wayland por XWayland. **Conclusão:** controles permanecem privados e posicionamento de saída é previsível. Wayland nativo não é alvo inicial por suas restrições de posicionamento.

**Marco:** se o pacote exigir runtime externo ou falhar no ambiente alvo, resolver o empacotamento ou revisar a arquitetura antes de construir funcionalidades.

### Etapa 2 — Definir a experiência

**Dependência:** etapa 1.

**Avanço autorizado pelo usuário:** executar a definição de experiência sem declarar concluída a homologação física e de sistemas da etapa 1. Ver [experiência da etapa 2](etapa-2-experiencia.md). 2.1 e 2.2 entregues; 2.3 depende de avaliação com voluntários reais.

- [x] **2.1** Desenhar biblioteca, busca, editor, programação e projeção. **Conclusão:** todos os fluxos essenciais representados.
- [x] **2.2** Definir tokens de cor, tipografia, espaçamento e componentes. **Conclusão:** contraste e foco de teclado especificados.
- [ ] **2.3** Validar protótipo com voluntários. **Conclusão:** registrar dificuldades e corrigir as que impedem projetar ou interromper a saída.

### Etapa 3 — Construir a fundação de dados

**Dependência:** etapas 1 e 2.

**Avanço autorizado pelo usuário:** implementar a fundação de dados, preservando as pendências de homologação da etapa 1 e avaliação da etapa 2. Entrega e evidências em [dados da etapa 3](etapa-3-dados.md). Tarefas 3.1 a 3.4 concluídas.

- [x] **3.1** Definir entidades, migração inicial e repositórios. **Conclusão:** banco criado e validado em diretório escolhido.
- [x] **3.2** Implementar armazenamento portátil, bloqueio de concorrência e mensagens de erro. **Conclusão:** pasta sem permissão e segunda instância tratadas sem perda de dados.
- [x] **3.3** Definir contratos de comunicação e estado de apresentação. **Conclusão:** mensagens inválidas rejeitadas e estado recuperável ao reabrir saída.
- [x] **3.4** Implementar backup e restauração básica. **Conclusão:** restaurar banco e anexos em instalação vazia com integridade verificada.

### Etapa 4 — Entregar o fluxo completo de letras

**Dependência:** etapa 3.

- [x] **4.1** Cadastrar, editar, pesquisar e arquivar músicas com gravação em disco. **Conclusão:** letras, seções e sequências criadas ou editadas reaparecem integralmente após fechar e reabrir o aplicativo.
- [x] **4.2** Editar seções e sequência, incluindo refrões repetidos. **Conclusão:** alterar refrão atualiza suas ocorrências previstas.
- [x] **4.3** Gerar slides com prévia e divisão manual. **Conclusão:** texto longo não é cortado silenciosamente.
- [x] **4.4** Apresentar, avançar, retroceder, ocultar texto e acionar tela preta. **Conclusão:** seleção na biblioteca não muda a saída ativa.

**Entrega técnica 0.4.0:** tarefas 4.1 a 4.4 implementadas e verificadas por testes de domínio e interface. Evidências e roteiro em [etapa 4 — letras](etapa-4-letras.md). Salvamento é manual explícito nesta versão; o salvamento automático permanece previsto para recuperação na etapa 8.4.

**Marco:** uma música completa pode ser preparada e apresentada offline em dois monitores. Fluxo externo verificado com monitor simulado; validação em hardware físico e execução Windows continuam pendentes nas etapas 1 e 9.

**Contagem histórica ao entregar a etapa 4:** 14 de 44 tarefas principais concluídas; 30 pendentes. Restam seis etapas de implementação (5 a 10) e as pendências anteriores de 1 e 2.

### Etapa 5 — Adicionar programação e temas

**Dependência:** etapa 4.

- [x] **5.1** Criar e salvar programação com reordenação por mouse e teclado. **Conclusão:** ordem preservada ao reiniciar.
- [x] **5.2** Implementar snapshots e atualização explícita. **Conclusão:** edição na biblioteca não modifica culto preparado sem comando.
- [x] **5.3** Criar temas com fundo sólido ou imagem e margens seguras. **Conclusão:** prévia corresponde à saída em 16:9 e 4:3.
- [x] **5.4** Adicionar textos livres. **Conclusão:** textos podem ser preparados e apresentados com as mesmas regras de segurança da letra.

**Entrega técnica 0.5.0:** tarefas 5.1 a 5.4 implementadas. Programações, textos e temas persistem; cópias independentes exigem atualização explícita; imagens locais entram no backup. Evidências e limites em [etapa 5](etapa-5-programacao-e-temas.md). Homologação física continua nas etapas 1 e 9.

**Contagem histórica ao entregar a etapa 5:** 18 de 44 tarefas principais concluídas; 26 pendentes. Restam cinco etapas de desenvolvimento (6 a 10), além das pendências anteriores de 1 e 2.

### Etapa 6 — Adicionar Bíblia offline

**Dependência:** etapa 5 e contrato do importador definido em [importação de Bíblia SQL](importacao-biblia-sql.md).

- [x] **6.1** Implementar cadastro e importação de Bíblia `.sql`: seleção de arquivo, leitura restrita, mapeamento, prévia, validação, confirmação e gravação transacional. **Conclusão:** arquivo de esquema suportado é importado offline; tradução cadastrada persiste após reinício; arquivo inválido ou operação cancelada não deixa dados parciais. Executar as subtarefas 6.1.a a 6.1.f do documento do importador.
- [x] **6.2** Implementar referências e abreviações. **Conclusão:** referências válidas e inválidas produzem respostas previsíveis.
- [x] **6.3** Implementar pesquisa textual e navegação. **Conclusão:** consultas não dependem de rede.
- [x] **6.4** Projetar trechos e adicioná-los à programação. **Conclusão:** referência, versão e atribuições aparecem corretamente, sem corte.

**Entrega técnica 0.6.0:** importador restrito em worker, prévia e mapeamento, persistência offline, referências, busca, navegação e snapshots de versículos. Cobertura não certificada exige confirmação; nenhum script é executado. Evidências e limites em [etapa 6](etapa-6-biblia-offline.md).

**Contagem histórica ao entregar a etapa 6:** 22 de 44 tarefas principais concluídas; 22 pendentes. Restam quatro etapas de desenvolvimento (7 a 10), além das pendências anteriores de 1 e 2.

### Etapa 7 — Adicionar cifras

**Dependência:** etapa 5.

- [x] **7.1** Documentar e implementar subconjunto de marcação aceito. **Conclusão:** acordes e letras podem ser editados e persistidos sem perder posições.
- [x] **7.2** Implementar transposição de acordes simples, compostos e baixos invertidos. **Conclusão:** casos conhecidos corretos; tokens desconhecidos preservados com aviso.
- [x] **7.3** Renderizar cifras e alternar modo de apresentação. **Conclusão:** acordes permanecem alinhados após mudança de tom, fonte e largura.
- [x] **7.4** Integrar cifras à programação e aos snapshots e verificar persistência completa. **Conclusão:** letra, acordes, posições e tons são recuperados após fechar e reabrir o app, inclusive no culto salvo.

**Entrega técnica 0.7.0:** marcação inline, acordes ancorados, transposição de raiz/baixo, sustenidos/bemóis, modos letra/cifras e cópias completas na programação. Evidências, formato e limites em [etapa 7](etapa-7-cifras.md).

**Contagem atual:** 26 de 44 tarefas principais concluídas; 18 pendentes. Restam três etapas (8 a 10), além das quatro tarefas anteriores pendentes de 1 e 2.

### Etapa 8 — Importação e recuperação

**Dependência:** etapas 6 e 7.

- [ ] **8.1** Importar texto e marcação de cifras do subconjunto aceito. **Conclusão:** prévia permite corrigir conteúdo antes de confirmar.
- [ ] **8.2** Detectar duplicatas e permitir ignorar, criar cópia ou atualizar. **Conclusão:** nenhuma substituição silenciosa.
- [ ] **8.3** Exportar e restaurar biblioteca completa. **Conclusão:** músicas, temas, programações e arquivos conferem após restauração.
- [ ] **8.4** Implementar salvamento automático seguro de conteúdo válido, com indicador de gravação e tratamento de erro, e simular fechamento inesperado e falha de disco. **Conclusão:** último estado confirmado preservado e recuperação explicada ao usuário.

### Etapa 9 — Homologar usabilidade e desempenho

**Dependência:** etapa 8.

- [ ] **9.1** Executar testes dos fluxos críticos e regras de domínio. **Conclusão:** regressões de projeção, Bíblia, cifras e backup cobertas.
- [ ] **9.2** Medir abertura, busca e troca de slides no equipamento definido. **Conclusão:** relatório compara resultados às metas.
- [ ] **9.3** Realizar ensaio contínuo com dois monitores e rede desligada. **Conclusão:** 2 horas sem falhas bloqueadoras.
- [ ] **9.4** Repetir avaliação com voluntários. **Conclusão:** meta de primeiro uso atingida ou ajustes priorizados e reavaliados.
- [ ] **9.5** Verificar teclado, escala de tela e legibilidade. **Conclusão:** ações principais acessíveis sem mouse e interface utilizável nos fatores de escala homologados.

### Etapa 10 — Preparar entrega portátil

**Dependência:** etapa 9.

- [ ] **10.1** Gerar pacote de produção e inventário de componentes e licenças. **Conclusão:** artefato reproduzível e identificado por versão.
- [ ] **10.2** Validar extração, primeira execução offline e abertura em outra pasta. **Conclusão:** caminhos relativos funcionam e dados são preservados.
- [ ] **10.3** Validar atualização manual, migração e restauração de backup. **Conclusão:** versão anterior recuperável por procedimento documentado.
- [ ] **10.4** Preparar guia curto com monitores, atalhos, backup e solução de problemas. **Conclusão:** voluntário consegue repetir o fluxo principal seguindo o guia.
- [ ] **10.5** Avaliar assinatura de código e alertas do Windows. **Conclusão:** comportamento de distribuição documentado sem prometer ausência de alertas.

**Marco final:** versão candidata utilizável offline em máquina limpa, sem instalação de runtimes e sem falhas críticas conhecidas.

## 10. Matriz mínima de validação

| Cenário | Resultado esperado |
| --- | --- |
| Windows e Linux homologados sem Java, Node.js e ferramentas de desenvolvimento | Aplicativo abre e executa todo o MVP |
| Linux sem FUSE | Pacote tar.gz abre após extração; validar também extração do AppImage |
| AppImage montado ou extraído temporariamente | Dados persistem junto ao arquivo original e sobrevivem ao encerramento |
| Linux X11 e sessão Wayland via XWayland | Posicionamento e projeção validados separadamente |
| Rede desativada desde a primeira abertura | Recursos principais disponíveis |
| Primeira abertura sem Bíblia | Orientação para importar `.sql`, sem bloquear letras e cifras |
| Importação de `.sql` com rede desligada | Cadastro concluído a partir do arquivo local, sem downloads |
| Bíblia importada, reabertura e restauração de backup | Tradução e versículos preservados e pesquisáveis offline |
| Arquivo SQL com instruções não permitidas | Rejeição sem executar comandos ou alterar o banco ativo |
| Cadastrar e editar letra e cifra, fechar e reabrir | Texto, acordes, posições, seções, sequências e tons preservados |
| Atualizar o programa com biblioteca existente | Letras, cifras e Bíblias importadas preservadas |
| Um monitor | Ensaio no modo apresentador; comandos e tela preta funcionam sem cobrir os controles ou criar outra janela |
| Datashow em modo estendido | Controles no computador; apenas conteúdo público na saída externa |
| Monitores espelhados/sobrepostos ou solicitação à tela do operador | Ensaio local; nenhum fullscreen sobre o operador |
| Dois monitores e escalas diferentes | Saída correta, controles privados e texto legível |
| Desconexão durante apresentação | Operador permanece utilizável; saída suspensa |
| Letra longa, caracteres acentuados e cifras extensas | Sem perda, desalinhamento ou corte silencioso |
| Referência bíblica inexistente | Mensagem clara sem interromper apresentação ativa |
| Arquivo importado inválido ou excessivamente grande | Rejeição controlada, sem alteração parcial |
| Pasta sem escrita ou disco cheio | Erro visível e preservação dos dados confirmados |
| Backup restaurado em outro computador | Biblioteca e anexos íntegros |
| Atualização e banco de versão futura | Migração segura ou bloqueio explicativo |
| Campo de edição com atalhos de apresentação | Digitação não dispara comandos ao vivo |

## 11. Orientações para execução posterior por LLM

1. Ler este plano, as instruções do repositório e o estado atual antes de escolher a próxima tarefa.
2. Selecionar a primeira tarefa pendente cujas dependências estejam concluídas.
3. Registrar objetivo, arquivos envolvidos, decisões necessárias e verificação esperada antes de alterar o projeto.
4. Implementar somente o necessário para atender ao critério de conclusão, preservando tarefas e alterações existentes.
5. Testar regras críticas e fluxos afetados; não declarar testes manuais ou em hardware que não foram executados.
6. Atualizar o checklist somente com evidência verificável. Registrar limitações e bloqueios concretos.
7. Manter registro de execução separado, por tarefa, com resultado, verificações realizadas e próximo passo.
8. Se uma decisão mudar, atualizar arquitetura, escopo e tarefas afetadas para evitar instruções contraditórias.
9. Não adicionar serviços de nuvem, login ou formatos proprietários sem nova decisão explícita de escopo.
10. Considerar concluída uma etapa apenas quando seus critérios e os do marco correspondente forem atendidos.

## 12. Riscos e decisões a acompanhar

| Risco | Tratamento previsto |
| --- | --- |
| Electron consumir mais recursos que o esperado | Medir no protótipo e limitar efeitos e processamento em segundo plano |
| Driver SQLite falhar no pacote portátil | Validar dependência nativa na etapa 1, antes dos recursos de domínio |
| Corrupção por remoção de pendrive | Escritas transacionais, backups e orientação de encerramento |
| Texto divergir entre prévia e saída | Compartilhar renderizador e medir no tamanho real de projeção |
| Cifras ambíguas | Subconjunto documentado, preservação de tokens desconhecidos e prévia |
| Arquivos bíblicos SQL heterogêneos ou malformados | Documentar o subconjunto aceito, oferecer mapeamento e rejeitar instruções não suportadas sem executá-las |
| Escopo crescer e prejudicar simplicidade | Manter lista de exclusões e validar fluxos com voluntários |
| Alertas de segurança ao distribuir executável | Avaliar assinatura e testar artefato real no sistema alvo |

## 13. Referências de arquitetura e produto

Fontes consultadas em 18/10/2026. Revalidar versões e compatibilidade na etapa 0; as escolhas de stack e os limites de escopo são recomendações deste plano.

- [Documentação do Electron](https://www.electronjs.org/docs/latest/): arquitetura com Chromium e Node.js incluídos.
- [Sandbox de processos do Electron](https://www.electronjs.org/docs/latest/tutorial/sandbox): base para isolamento das interfaces.
- [Distribuição Windows do Tauri](https://v2.tauri.app/distribute/windows-installer/): estratégias para WebView2 e empacotamento no Windows.
- [Funcionalidades do Holyrics](https://holyrics.com.br/tips/features.html): referência funcional de apresentação, temas e organização de conteúdos.
- [Tutoriais do Holyrics](https://www.holyrics.com.br/tutorial.html): referência dos fluxos de letras, Bíblia e cifras.
