# Etapa 6 — Bíblia SQL e consulta offline

Versão 0.6.0. Implementa 6.1 a 6.4 e as subtarefas 6.1.a a 6.1.f. Nenhuma tradução real acompanha o pacote. O usuário fornece um `.sql` obtido anteriormente, inclusive ARA quando compatível, sem conta, cobrança ou exigência de documento de licença para cadastrar localmente.

## 6.1 — Importar com prévia e confirmação

1. Abrir a aba Bíblia e Cadastrar Bíblia.
2. Informar nome, abreviação, idioma e edição. Origem, notas e atribuição na projeção são opcionais; URLs não são abertas.
3. Selecionar `.sql` UTF-8, até 50 MiB. A leitura ocorre em worker com limite de 30 segundos e heap de 384 MiB. É possível cancelar e fechar sem alterar os dados.
4. Confirmar tabela e colunas de livro, capítulo, versículo e texto. No perfil de duas tabelas, mapear também identificador e nome do livro.
5. Se o arquivo usa livros numéricos na ordem 1 a 66, confirmar explicitamente essa convenção. IDs relacionais são resolvidos pela tabela de livros.
6. Gerar prévia com livros/capítulos/versículos, amostras de início/meio/fim e avisos. Resolver nomes desconhecidos pelo seletor e conferir novamente.
7. Corrigir erros e duplicatas. Aceitar explicitamente conteúdo parcial ou de cobertura não certificada.
8. Confirmar importação. O conteúdo normalizado, os metadados e a tradução padrão são gravados em uma transação.

Arquivos idênticos e abreviações existentes bloqueiam Novo cadastro. Criar cópia é uma escolha explícita, com identificação no nome quando necessário. Substituir conserva o ID e requer confirmação nativa e backup prévio. Remover também cria backup e informa quantas programações possuem referências; as cópias preparadas não são alteradas.

### Subconjunto SQL

- `CREATE TABLE` simples com identificadores ASCII, sem aspas ou entre aspas duplas/crases.
- Tipos INTEGER, INT, BIGINT, SMALLINT, TEXT, VARCHAR, NVARCHAR e CHAR; comprimentos simples, NOT NULL, PRIMARY KEY, UNIQUE e DEFAULT literal.
- `INSERT INTO ... VALUES`, com uma ou várias tuplas, com colunas explícitas ou ordem declarada. Colunas não fornecidas ficam vazias na extração; valores gerados/defaults não são executados. Colunas necessárias ao mapeamento devem conter dados.
- Inteiros e strings com aspas simples; apóstrofos escapados por duplicação. Comentários `--` e `/* */` são reconhecidos fora de strings. BEGIN/COMMIT/END e TRANSACTION são delimitadores aceitos.
- Não executa o script. Rejeita SELECT, ATTACH, PRAGMA, DROP, funções, expressões, subconsultas, triggers e sintaxes não suportadas, indicando linha e motivo.
- Não aceita escapes MySQL específicos, cláusulas ENGINE/CHARSET, identificadores entre colchetes ou múltiplas traduções misturadas. Exporte uma tradução em formato compatível.
- Até 20 tabelas, 32 colunas, 110 mil linhas totais, 100 mil versículos e 20 mil caracteres por literal/versículo. Capítulo e versículo devem ser positivos, limitados respectivamente a 200 e 300.

Não se promete compatibilidade universal com `.sql`. Os dois perfis previstos no contrato são suportados. Dumps com colunas reconhecidas de tradução contendo valores distintos são recusados; duplicatas também impedem importar traduções sobrepostas.

### Cobertura

A prévia detecta livros ausentes na ordem de 66 livros e lacunas na numeração de capítulos e versículos. Não há um catálogo certificado de contagens por versificação. Portanto todas as importações recebem indicação de cobertura não certificada e exigem confirmação explícita, mesmo que possuam 66 livros. Nenhum texto é preenchido ou corrigido automaticamente.

## 6.2 — Referências e abreviações

- Exemplos: `Jo 3:16`, `João 3:16-17`, `1 Jo 2:1-3`, `1Co 13:1`.
- Nomes e abreviações portuguesas e nomes ingleses comuns são normalizados para IDs estáveis.
- `Jó` identifica Jó; `Jo` identifica João. `Jn` é ambíguo entre idiomas e exige resolução no cadastro ou outra grafia na consulta.
- Intervalos devem pertencer ao mesmo capítulo, ser consecutivos e conter até 30 versículos/90 mil caracteres.
- Referência ausente, intervalo com lacuna ou valor inválido gera mensagem e preserva a preparação e a saída atuais.

## 6.3 — Pesquisa e navegação

Selecionar a tradução e, opcionalmente, Definir como padrão. A busca encontra trechos literais sem distinguir caixa ou acentos. A navegação lista livros e capítulos efetivamente cadastrados. Resultados são limitados a 200, com indicação para refinar a busca. Selecionar um resultado prepara o versículo; não o apresenta automaticamente.

A consulta usa SQLite local separado da biblioteca musical, com chave composta de livro/capítulo/versículo e coluna de pesquisa normalizada. O arquivo SQL original pode ser removido após importar.

## 6.4 — Apresentação e programação

Cada página apresenta o texto e sua referência, abreviação da versão e atribuição opcional. A paginação reserva espaço para essas informações e mantém a proteção contra cortes, inclusive em trechos longos.

Adicionar conteúdo preparado cria snapshot dos versículos, metadados de apresentação e ID da tradução. Substituir ou remover uma Bíblia não modifica as cópias. Atualizar pela origem é explícito e conserva o tema do item; se a referência não existir mais, a cópia é preservada e a atualização informa erro.

Apresentar, avançar, retroceder, ocultar texto e tela preta continuam separados da seleção. Ensaio com um monitor não abre fullscreen sobre os controles. Projeção externa exige monitor separado.

## Persistência e backups

- Esquema da biblioteca permanece 2: metadados em `bible-version`, corpus imutável normalizado como anexo comprimido por hash e padrão em configuração local.
- Corpus: até 100 MiB normalizados e 64 MiB comprimidos. Imagens e outros anexos continuam com limite de 10 MiB.
- Banco de consulta separado em `data/bibles/<hash>.sqlite`, derivado do corpus. É reconstruído no primeiro acesso de cada execução e quando ausente. O SQL de origem nunca é executado, nem para construir esse banco: a estrutura é interna e as inserções são parametrizadas.
- Backup inclui corpus comprimido, metadados, padrão e programações. O cache SQLite é descartável e não precisa ser copiado.
- Backups novos usam envelope 2; restauração aceita envelopes 1 e 2 e esquemas de biblioteca 1 e 2. Para restaurar os backups novos, use 0.6.0 ou superior. O limite total continua 128 MiB.
- Falha durante importação desfaz registros e remove corpus recém-criado sem registro. Cancelar leitura/prévia não grava dados. Anexos históricos de traduções substituídas/removidas são retidos para recuperação; não há limpeza destrutiva automática.

## Verificação para uma LLM continuar

| Parte | Arquivos |
| --- | --- |
| Lexer/parser e mapeamento | `src/main/bible-parser.ts` |
| Leitura isolada, UTF-8 e limites | `src/main/bible-worker.ts` |
| Importação, corpus, consulta e padrão | `src/main/bibles.ts` |
| Livros, referências e citações | `src/shared/bible.ts` |
| Wizard e consulta | `src/renderer/bible-import.tsx`, `bible-panel.tsx` |
| Regressões | `tests/bible.test.cjs`, `tests/bible-flow.cjs` |

O worker e seus módulos compartilhados são distribuídos em `app.asar.unpacked`, usando o Node incluído no Electron. Não requer instalação de Node, Java ou banco no computador do operador.

Os testes usam exclusivamente dados sintéticos, sem redistribuir texto de uma tradução. Incluem corpus artificial de 31.680 versículos para verificar volume, além de casos de comandos proibidos, UTF-8 inválido, arquivo acima de 50 MiB, cancelamento ativo, falha transacional, duplicatas, mapeamento, referências, backup e citações em cada slide.

Próxima etapa: 7, cifras estruturadas, transposição e alinhamento. Homologação Windows/datashow físico e avaliação com voluntários continuam pendentes nas etapas anteriores e na etapa 9.

## Resultados finais e pacotes

Tipos, compilação e 34 testes unitários aprovados. Corpus artificial de 31.680 versículos importado, indexado e consultado sem o arquivo original. Cópias têm identidade/data próprias; substituir outra tradução não muda a Bíblia padrão escolhida.

Testes gráficos completos aprovados em desenvolvimento e nos três formatos Linux finais: pasta, AppImage com extração automática sem FUSE e tar.gz. Incluem leitura SQL no worker distribuído, prévia/confirmação, pesquisa, referência, navegação, reinício, projeção com citação, programação, exclusão com cópias preservadas, backup/restauração e recusa de comando SQL proibido.

Conteúdo de `dist` comparado byte a byte aos pacotes Windows e Linux, incluindo arquivos externos ao ASAR. ZIP passou CRC; gzip foi lido integralmente e tar validado, incluindo presença do worker. Nenhum dado do operador acompanha os pacotes.

Geração: `ELECTRON_BUILDER_COMPRESSION_LEVEL=5 npx electron-builder --linux AppImage tar.gz --win zip --x64`, após compilação e verificações. Arquivos `.sha256` acompanham os três pacotes.

| Pacote | Tamanho (MiB) | SHA-256 |
| --- | ---: | --- |
| `zamar-sync-0.6.0-linux-x64.tar.gz` | 117.88 | `94bb0341cf68ce6ef81bf573063e1c947c998c34a0ee6434dca8933959d76520` |
| `zamar-sync-0.6.0-linux-x86_64.AppImage` | 122.98 | `553b4c9150ec0e8d9791f34b5a53c5debcf32cee609eb15c0c6b49f2a8a80474` |
| `zamar-sync-0.6.0-win-x64.zip` | 150.51 | `18df8234fb4350207e81dfbc7be59eab2931513f0db16092786607732f2b51a8` |

Limpeza concluída: seis arquivos 0.5.0 removidos, mantendo pacotes 0.6.0, hashes, pastas atuais e `release/data`. Captura real em [apresentação bíblica](etapa-6-preview.png).

Windows não foi executado. O roteamento externo foi verificado com monitor simulado, sem fullscreen/exibição nativos sobre o monitor real. Nenhuma avaliação com voluntários ou homologação de datashow físico foi inferida desses testes.

Nota de histórico: os pacotes 0.6.0 foram substituídos na pasta release pelos da etapa 7; os hashes acima registram a entrega anterior.
