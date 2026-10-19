# Etapa 2 — Experiência e protótipo navegável

> Estado atual em 18/10/2026: pendências físicas/humanas encerradas conforme [aceite informado pelo usuário](homologacao/aceite-usuario.md). O texto abaixo preserva o roteiro e as evidências históricas; resultados finais na [etapa 10](etapa-10-entrega.md). Não houve nova execução física ou humana pelo agente.


> Artefatos deste relatório são históricos. Os pacotes disponíveis em release foram atualizados para 0.3.1; versões anteriores foram removidas na limpeza solicitada.

Versão 0.2.0. A solicitação para avançar autoriza o trabalho de experiência enquanto a homologação Windows/Linux da etapa 1 permanece pendente. Não declarar essa homologação concluída por causa da interface nova.

## 2.1 — Fluxos representados

A tela usa três áreas: biblioteca à esquerda; editor e prévia ao centro; programação e monitor ao vivo à direita. Uma barra fixa inferior mantém apresentação e tela preta acessíveis sem rolar. Em telas menores, as áreas se reorganizam sem ocultar funcionalidades.

| Fluxo | Interação do protótipo | Limite atual |
| --- | --- | --- |
| Primeiro uso | Guia rápido, selecionar monitor, saída em preto, preparar e apresentar | Guia é aberto pelo operador; teste com voluntários pendente |
| Biblioteca e busca | Exemplos originais de músicas/texto, filtros, busca e estado vazio | Exemplos fixos, sem cadastro de biblioteca persistente |
| Editor | Novo rascunho, texto editável, indicador de alterações e salvamento manual | Somente o corpo do rascunho é persistido; títulos são de sessão |
| Letras | Linha vazia separa blocos; miniaturas e setas escolhem a prévia | Divisão avançada e medição de texto ficam na etapa 4 |
| Apresentação | Apresentar envia somente o bloco escolhido; edição e seleção não alteram saída | Texto muito longo ainda precisa ser revisado manualmente para caber |
| Emergência | Tela preta/retomada sempre disponíveis na barra inferior; Esc fecha projeção | Teste de hardware multimonitor continua pendente |
| Programação | Adicionar snapshot da preparação, carregar, reordenar e remover | Lista dura a sessão; persistência será feita na etapa 5 |
| Bíblia | Estado vazio e explicação navegável do cadastro por .sql | Sem arquivo, parser, busca ou texto bíblico real ainda; implementação na etapa 6 |
| Cifras | Exemplo com acordes literais e explicação da limitação no guia | Sem alinhamento estruturado ou transposição até a etapa 7 |
| Configurações | Local dos dados e aparência atual | Sem mudança de diretório ou editor de temas nesta fase |

Ao substituir rascunho alterado, confirmar descarte. Ao fechar com texto não salvo, oferecer continuar editando ou descartar e fechar. Biblioteca de exemplos e programação não devem ser descritas como salvas. A interface mostra explicitamente a duração por sessão.

### Estados e mensagens

- Inicialização: campos dependentes de dados desabilitados até a leitura concluir.
- Sem monitor disponível: não permitir abrir saída; manter edição e salvamento acessíveis.
- Cancelamento da seleção nativa: informar abertura cancelada, sem mensagem de sucesso indevida.
- Busca sem resultado: explicar e permitir limpar a pesquisa.
- Saída fechada, tela preta e conteúdo ativo: rótulos textuais distintos, sem depender somente de cor.
- Falha ao salvar ou apresentar: mostrar o erro na região de status e não confirmar sucesso.
- Importação futura: mostrar explicação e indisponibilidade, sem simular seleção ou processamento de arquivo.

## 2.2 — Sistema visual

Tokens definidos em src/renderer/style.css. Tipografia local de sistema para manter operação offline. Nenhuma fonte ou imagem externa foi adicionada.

| Token | Valor | Uso |
| --- | --- | --- |
| Fundo | #10151e | Área de trabalho |
| Painel | #192230 | Biblioteca, editor e monitor |
| Texto | #edf2fa | Conteúdo principal |
| Secundário | #b9c6d9 | Instruções e metadados |
| Ação | #225fc4 | Apresentar |
| Foco | #8cb8ff | Contorno visível de teclado |
| Borda | #36475f | Separação de painéis |
| Raio de painel | 12 px | Superfícies principais |
| Unidade de espaço | 8 px | Ritmo geral, com ajustes de 4 px |

Contraste calculado pela luminância relativa sRGB: texto/painel 14,23:1; secundário/painel 9,25:1; branco/ação 6,00:1; foco/painel 7,93:1. Esses pares superam 4,5:1 para texto e 3:1 para foco; a conferência não equivale a uma auditoria completa de acessibilidade.

Componentes: botão primário, secundário e discreto; campos com rótulo; abas; cartões de conteúdo; miniaturas; estados vazios; indicador de saída; diálogos modais; lista ordenável; barra persistente de apresentação e região de status.

### Teclado e acessibilidade

- Foco de 3 px, com deslocamento de 3 px; botões principais com pelo menos 40 px de altura.
- Ctrl+F foca a busca; Ctrl+Enter apresenta o bloco preparado.
- B alterna tela preta somente fora de campos de edição.
- Setas preparam blocos sem alterar a projeção; nas abas, setas/Home/End navegam entre filtros.
- Diálogos nativos de HTML mantêm o foco dentro do conteúdo; Esc fecha ajuda/configurações.
- Campos têm rótulos; miniaturas e reordenação têm nomes acessíveis; seleção usa estado explícito.
- Região de status anuncia salvamento e ações; controles indisponíveis ficam desabilitados.
- Layout de três colunas em telas largas, duas áreas abaixo de 1100 px e sequência vertical abaixo de 700 px.

## Captura do protótipo

[Interface 0.2.0 em execução no Electron](etapa-2-preview.png). A imagem é uma captura real com conteúdo original de demonstração.

## Verificação técnica

Checagem de tipos, compilação e testes existentes devem passar. O teste gráfico verifica persistência, busca, prévia de bloco, programação da sessão, guia, explicação da Bíblia e separação entre preparação e saída. A revisão visual é feita em captura real do Electron. Esses testes não substituem avaliação por operadores.

## 2.3 — Roteiro de avaliação com voluntários

**Estado: pendente de participantes reais.** Nenhuma sessão com voluntários foi realizada pelo agente. Usar cópia de teste com textos de demonstração, sem alterar bibliotecas reais.

Recrutar cinco voluntários, incluindo pessoas sem experiência com ferramentas de projeção. Oferecer apenas o aplicativo e a tarefa, sem demonstrar os controles antes da primeira tentativa. Registrar sistema, resolução, escala, experiência anterior e necessidades de acessibilidade sem coletar dados pessoais desnecessários.

1. Abrir o aplicativo, localizar um exemplo e projetar um bloco: medir tempo até a primeira apresentação; meta de até 3 minutos para pelo menos quatro de cinco participantes.
2. Preparar outro bloco sem alterar o conteúdo ao vivo: verificar se o participante distingue prévia e projeção.
3. Interromper com tela preta e retomar: observar se encontra a ação sem ajuda.
4. Editar, salvar, fechar e reabrir o rascunho: conferir entendimento de salvamento manual.
5. Adicionar dois conteúdos à programação, reordenar e preparar um item: conferir entendimento da duração por sessão.
6. Encontrar a área da Bíblia e explicar o cadastro por SQL: avaliar compreensão do fluxo planejado sem pedir importação real ainda.
7. Repetir preparação e apresentação usando teclado, conforme experiência do participante.

Registrar em cada tarefa: sucesso sem ajuda, tempo, erros, ajuda solicitada, dificuldade observada e proposta de ajuste. Não preencher resultados com simulações de LLM.

| Participante | Ambiente | Primeira projeção | Confunde prévia/ao vivo? | Encontra tela preta? | Entende o salvamento? | Observações |
| --- | --- | --- | --- | --- | --- | --- |
| P1 | A preencher | A medir | A observar | A observar | A observar | — |
| P2 | A preencher | A medir | A observar | A observar | A observar | — |
| P3 | A preencher | A medir | A observar | A observar | A observar | — |
| P4 | A preencher | A medir | A observar | A observar | A observar | — |
| P5 | A preencher | A medir | A observar | A observar | A observar | — |

Bloqueadores: não conseguir projetar, não conseguir interromper a saída ou expor conteúdo privado por confusão entre seleção e apresentação. Corrigir esses problemas e repetir as tarefas afetadas antes de concluir 2.3.

## Critério de conclusão

2.1 e 2.2 são entregas de interface e especificação. A etapa 2 só fica integralmente concluída após a avaliação real de 2.3 e correção de bloqueadores. Depois, a etapa 3 implementará a fundação de dados da biblioteca, migrações e backups.


## Artefatos 0.2.0

Pacotes gerados para Windows e Linux, com avisos de terceiros. ZIP conferido por CRC; tar.gz lido integralmente; hashes gerados. Testes gráficos de pasta Linux e AppImage aprovados, incluindo cancelamento de fechamento de rascunho não salvo. Execução Windows e homologação com voluntários permanecem pendentes.

| Arquivo em release | Bytes | SHA-256 |
| --- | --- | --- |
| zamar-sync-0.2.0-win-x64.zip | 155209696 | `2c3b56ada7a300db542295c6e20b46d1e9a91738679c6552f500ba505fc30396` |
| zamar-sync-0.2.0-linux-x86_64.AppImage | 127233179 | `a42156e6d53912770e533857e417e83f23904bb5c3b8cee0163557f332c345d3` |
| zamar-sync-0.2.0-linux-x64.tar.gz | 120983520 | `39b1c7585eac30b1f93dd0c0e95dbad115789ce2fc6fa1fb556f82987f0bccb2` |

Teste gráfico do tar.gz 0.2.0 também aprovado após extração, incluindo os novos fluxos e proteção de rascunho.


## Atualização 0.3.1

O fluxo de apresentação foi corrigido: uma tela usa ensaio local; saída fullscreen somente em tela separada. Entrar em apresentação recolhe editor e biblioteca, mantendo miniaturas, programação, prévia e comandos. “Editar conteúdo” alterna para edição sem modificar a saída. O roteiro de voluntários deve testar ensaio local e configuração estendida, sem confirmação para cobrir o monitor do operador. Ver [detalhes da correção](ajuste-modo-apresentador.md).
