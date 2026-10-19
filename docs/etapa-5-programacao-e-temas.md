# Etapa 5 — Programação, cópias, temas e textos livres

Versão 0.5.0. Entrega as tarefas 5.1 a 5.4. Não depende de serviços, fontes remotas nem conexão com a internet. Mantém o ensaio seguro com um monitor e a projeção exclusiva para uma saída separada.

## 5.1 — Criar, ordenar e salvar programações

1. Informar Nome da programação ou usar Nova programação.
2. Preparar uma música, texto livre ou rascunho e clicar em Adicionar conteúdo preparado.
3. Reordenar por arraste, pelos botões de subir/descer ou Alt+↑/↓ com foco no item.
4. Salvar programação e aguardar a confirmação em disco.
5. Escolher outro culto em Abrir programação; mudanças não salvas exigem confirmação antes de substituir a programação.
6. Fechar e reabrir: a última programação salva ou aberta é recuperada, com a ordem confirmada.

Cada programação possui ID estável e nome próprio. Limites: 100 itens, até 100 mil caracteres por conteúdo e 500 mil caracteres na programação, sujeitos também ao limite de 1 milhão de caracteres JSON por registro. O salvamento continua manual, com proteção contra fechamento e descarte acidental. Salvamento automático permanece em 8.4.

## 5.2 — Conteúdos independentes e atualização explícita

- Cada item possui seu próprio ID, título, texto, tema completo e referência opcional à origem na biblioteca.
- Adicionar captura o estado preparado, inclusive alterações que ainda estejam no editor. Somente fontes já salvas recebem referência para atualização futura.
- Alterar uma música, texto ou tema da biblioteca não modifica automaticamente os itens já adicionados.
- Selecionar um item prepara sua cópia e não altera o conteúdo ao vivo. A cópia aparece como tal no editor.
- Atualizar exige confirmação e busca o conteúdo salvo na origem. Mantém o tema daquela cópia. Origem ausente gera erro e preserva o conteúdo existente.
- Temas antigos guardados nos itens são identificados como cópia preservada, mesmo quando há uma versão nova com o mesmo ID na biblioteca.
- Escolher outro tema modifica a prévia. Aplicar tema ao item confirma a mudança na cópia; Salvar programação confirma em disco.
- Apresentar é sempre um comando separado. A atualização do item não modifica o slide já apresentado.
- Criar texto a partir desta cópia permite transformar conteúdo preparado em um novo cadastro independente.

As letras são capturadas com sua sequência resolvida. A estrutura musical da origem continua salva na biblioteca. A etapa 7 deverá acrescentar metadados estruturados de cifras aos snapshots, preservando essa independência.

## 5.3 — Temas e imagens locais

1. Em Tema da preparação, selecionar Padrão ou um tema salvo.
2. Novo tema cria uma cópia editável; Editar tema atualiza um tema próprio. Editar Padrão cria um tema independente.
3. Configurar nome, proporção 16:9/4:3, fundo, cor do texto, fonte monoespaçada/sem serifa, tamanho de 32 a 96, margem de 5% a 15% e alinhamento.
4. Opcionalmente importar PNG ou JPEG local e ajustar escurecimento de 0 a 80%.
5. Conferir a prévia e Salvar tema. A saída ativa é preservada até reapresentar.

As imagens são limitadas a 10 MiB, 8192 pixels por lado e 32 megapixels antes da decodificação. São normalizadas em PNG de até 1920×1080, copiadas para `data/assets` por hash e servidas por protocolo local restrito. Não há referências ao caminho original, URLs remotas, SVG ou execução de conteúdo importado. O original pode ser movido após a importação.

Prévia, monitor ao vivo e saída usam a mesma geometria canônica, fonte e paginação. A área é 1600×900 ou 1600×1200 conforme a proporção; monitores de outra proporção recebem barras pretas. Fonte maior e margens maiores reduzem a capacidade por slide. O limite conservador e a redução de fonte de segurança evitam corte silencioso.

No modo apresentador, os formulários de configuração ficam recolhidos e as prévias são ajustadas à altura disponível, mantendo o conteúdo e os primeiros itens acessíveis acima dos controles. Editar conteúdo reabre os ajustes.

Ocultar texto mantém o fundo do tema. Tela preta mantém a saída inteiramente preta. Retomar não altera o tema já apresentado. Alterar o seletor ou salvar um tema não modifica o estado público.

## 5.4 — Textos livres

1. Abrir Textos e usar + / Novo texto.
2. Informar título e conteúdo; linha em branco ou `---` divide slides manualmente.
3. Salvar texto e conferir sua presença na biblioteca.
4. Pesquisar por título/conteúdo sem distinguir caixa ou acentos.
5. Preparar, adicionar à programação e apresentar com os mesmos controles das letras.
6. Abrir rascunho recupera o texto legado, sem misturá-lo aos novos cadastros.

Textos são registros próprios, editáveis após reinício. O conteúdo é texto literal: HTML e scripts não são executados.

## Dados, migração e recuperação

- SQLite esquema 2 acrescenta `text` aos tipos aceitos pelo repositório existente.
- Migração do esquema 1 valida a estrutura, cria cópia SQLite anterior e recria a tabela de registros em uma transação, preservando dados e datas.
- Bancos de versão futura são recusados. Versões anteriores do aplicativo também recusam o banco 2, evitando abertura destrutiva.
- Backups antigos de esquema 1 e atuais de esquema 2 são aceitos; a versão declarada deve corresponder ao banco do arquivo.
- Backup inclui cadastros, programações, cópias de temas e imagens normalizadas. Restauração valida integridade e preserva cópia anterior antes de substituir dados.
- O limite básico de backup permanece 128 MiB de conteúdo, incluindo imagens. Imagens removidas de um tema não são apagadas automaticamente: podem estar em cópias de programação ou checkpoints antigos. Anexos importados e depois cancelados também permanecem até futura limpeza explícita.
- Registros antigos de formato desconhecido são sinalizados, preservados e incluídos no backup, sem conversão destrutiva.

## Verificação e continuidade

| Item | Verificação |
| --- | --- |
| 5.1 | Criar itens, reordenar por mouse/teclado, salvar e reabrir na ordem confirmada |
| 5.2 | Editar origem e tema, conferir cópia intacta, atualizar explicitamente e conferir saída preservada |
| 5.3 | Importar imagem, remover original, carregar offline; comparar estilos de prévia e saída externa simulada em 4:3 e verificar saída 16:9 |
| 5.4 | Cadastrar texto pela interface, salvar, editar e recuperar após reinício/backup |
| Migração | Esquemas 0 e 1, cópia prévia, restauração de backup antigo e recusa de versão futura |

Os testes usam pastas temporárias, nunca `release/data` do operador. A simulação externa desabilita fullscreen e exibição nativos para não cobrir o monitor real. Windows, datashow físico e avaliação com voluntários continuam pendentes nas etapas 1, 2 e 9.

Arquivos principais para uma LLM continuar:

- `src/shared/content.ts`: entidades, validação e geometria.
- `src/shared/slides.ts` e `src/renderer/slide.tsx`: paginação e renderização correspondentes.
- `src/renderer/program-panel.tsx` e `theme-editor.tsx`: controles da etapa 5.
- `src/main/images.ts`: validação de dimensões antes de decodificar.
- `src/main/main.ts`: IPC exclusivo do operador e protocolo local de imagens.
- `src/main/storage.ts`: migração 2, anexos e compatibilidade de backup.
- `tests/content.test.cjs` e `tests/program-flow.cjs`: regressões da etapa.

Próxima etapa: 6, cadastro/importação de Bíblia SQL e consulta offline, seguindo `importacao-biblia-sql.md`. A versão atual não inclui Bíblia nem importador funcional; cifras ainda são literais.

## Resultados finais e pacotes

Tipos, compilação e 25 testes unitários aprovados. Testes gráficos completos passaram em desenvolvimento e nos três formatos Linux finais: pasta, AppImage extraído automaticamente sem FUSE e tar.gz.

Foram verificados cadastro/reabertura de textos e programação, reordenação, cópias independentes, aplicação explícita de temas, imagem sem arquivo original, backup/restauração, equivalência da prévia/saída em 4:3 e projeção 16:9. O modo apresentador mantém a prévia 4:3 e o primeiro item acima da barra de controles. A verificação de ocultação aguarda a atualização do DOM após o evento IPC, evitando uma asserção antes da renderização.

Conteúdo de `dist` comparado byte a byte aos `app.asar` Windows e Linux, sem divergências. ZIP passou CRC; fluxo gzip foi lido integralmente e tar validado. Pacotes não contêm dados do operador. Windows não foi executado; saída externa foi simulada, sem fullscreen/exibição nativos sobre o monitor real.

Geração: `ELECTRON_BUILDER_COMPRESSION_LEVEL=5 npx electron-builder --linux AppImage tar.gz --win zip --x64`, após compilação e verificações. Cada pacote possui arquivo `.sha256`.

| Pacote | Tamanho (MiB) | SHA-256 |
| --- | ---: | --- |
| `zamar-sync-0.5.0-linux-x64.tar.gz` | 117.56 | `fee33d1fb11dd957ec822f55f68246183a4806cfd420daf46214cbff437d0997` |
| `zamar-sync-0.5.0-linux-x86_64.AppImage` | 122.64 | `76d8247c274e6c959be248ac694f8bcef84da4295ebe8eaa8cec9df34890d688` |
| `zamar-sync-0.5.0-win-x64.zip` | 150.18 | `e9adb218fd9f5c005638d6f0721d3a82024574e0dcaf89cb3ef81d22240e1973` |

Limpeza concluída: removidos seis arquivos 0.4.0 (três pacotes e três hashes). Permanecem apenas os pacotes 0.5.0, hashes, pastas atuais e dados locais preservados. Captura real em [modo apresentador](etapa-5-preview.png).

**Histórico de distribuição:** pacotes 0.5.0 substituídos por 0.6.0. A entrega atual é a [etapa 7](etapa-7-cifras.md).
