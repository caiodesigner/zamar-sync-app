# Etapa 4 — Biblioteca e apresentação de letras

Versão: 0.4.0. Depende da fundação SQLite da etapa 3. Não exige alteração destrutiva do esquema 1 nem conexão com a internet.

## 4.1 — Biblioteca persistente

- Músicas usam os registros `song`, com título e autor, indicador de arquivamento, seções e sequência.
- IPC exclusivo do operador valida os campos, limites, IDs únicos e referências antes de gravar. Datas são definidas no processo principal; criação original é preservada.
- Busca local por título, autor e letra, sem distinguir caixa ou acentos. Biblioteca ativa e arquivada têm visualizações separadas.
- Arquivar/desarquivar é reversível e exige Salvar música. Alterações não salvas recebem indicador e confirmação antes de substituir o conteúdo ou fechar o aplicativo.
- Salvamento manual explícito nesta versão. Backup inclui somente o estado confirmado em disco.
- Rascunho legado preservado. Registros de música de formato desconhecido não são apagados: interface informa a quantidade, e o backup continua incluindo-os.

## 4.2 — Seções e ordem

1. Criar música e informar título/autor.
2. Editar a primeira seção e adicionar as demais.
3. Nomear seções, por exemplo Verso 1, Refrão e Ponte.
4. Selecionar o refrão e usar Repetir seção selecionada.
5. Reordenar ocorrências por botões de subir/descer; remover uma ocorrência não apaga a seção.
6. Editar uma seção atualiza todas as suas ocorrências na preparação. O texto já apresentado permanece intacto.
7. Remover uma seção exige confirmação e retira suas referências. Uma seção e uma sequência válidas são obrigatórias para salvar.

Limites: 100 seções, 300 ocorrências, 100 mil caracteres de letra por cadastro, título/autor até 200 caracteres e nome de seção até 100.

## 4.3 — Slides sem corte

- Linha em branco ou linha contendo `---` inicia novo slide manualmente.
- Paginação automática preserva o conteúdo de linhas longas e palavras sem espaços. Segmentação por grafemas evita quebrar acentos combinados e emojis.
- Até oito linhas e 36 células por linha; caracteres largos recebem estimativa conservadora de duas células. Tabs são convertidos em espaços.
- Prévia, monitor ao vivo e projeção usam o mesmo componente com área canônica 1600×900 e margens de 96 pixels. Área proporcional centralizada conserva margens quando o monitor tem outra proporção.
- Fonte monoespaçada com tamanho máximo de 56 pixels e redução adicional conservadora para conteúdo legado ou enviado diretamente pelo IPC. O algoritmo reserva espaço suficiente antes da renderização.
- Miniaturas mostram todas as páginas e contador permite conferir a divisão antes de apresentar. Temas, imagens e configuração de proporção pertencem à etapa 5.

## 4.4 — Apresentação explícita

1. Escolher Ensaio neste monitor ou saída externa em modo estendido.
2. Iniciar apresentação e conferir a prévia.
3. Usar Apresentar para enviar o bloco selecionado.
4. No modo apresentador, botões/setas avançam e retrocedem a saída; no editor apenas preparam blocos.
5. Ocultar texto / Mostrar texto alterna a visibilidade sem apagar o conteúdo. Atalho O fora de campos de edição.
6. Tela preta continua independente. Atalho B fora de campos de edição. Apresentar torna o novo conteúdo visível.
7. Seleção de outra música, edição e alteração da ordem preservam a saída já enviada até um comando explícito.
8. Esc encerra. Reabertura da aplicação começa com saída fechada e tela preta.

Com uma tela, o ensaio não abre janela adicional nem cobre os controles. Topologia, desconexão e movimentos do operador mantêm as proteções da versão 0.3.1.

## Verificação reproduzível

- `npm run check`: tipos do renderer e processo principal.
- `npm test`: domínio musical, persistência/reabertura, backup/restauração, referências repetidas, validação, busca e paginação, além das regressões de armazenamento e destinos.
- `ZAMAR_SMOKE_FORMAT=dev npm run test:electron`: Electron real com dados temporários, edição pela interface, reinício, pesquisa por autor/letra, arquivamento reversível, navegação, ocultação e isolamento da saída.
- Após empacotar, repetir com `ZAMAR_SMOKE_FORMAT=dir`, `appimage` e `tar` em Linux.

A projeção externa automatizada usa monitor simulado e impede fullscreen/exibição nativos durante o teste. Não substitui homologação com datashow físico nem execução Windows. Essas pendências e avaliação com voluntários continuam nas etapas 1, 2 e 9.

## Arquivos para continuidade por uma LLM

| Responsabilidade | Arquivo |
| --- | --- |
| Modelo, validação e pesquisa musical | `src/shared/songs.ts` |
| Quebra e paginação | `src/shared/slides.ts` |
| Editor de seções e sequência | `src/renderer/song-editor.tsx` |
| Renderização comum dos slides | `src/renderer/slide.tsx` |
| Biblioteca e controles | `src/renderer/app.tsx` |
| Validação e gravação pelo IPC | `src/main/main.ts` |
| Regressões de domínio e interface | `tests/songs.test.cjs`, `tests/electron-smoke.cjs` |

Na etapa 5, preservar a independência da saída ativa, a confirmação de descarte, o backup e a proteção de monitores. Ao implementar temas, atualizar paginação e renderização em conjunto para manter equivalência entre prévia e datashow.

## Próxima etapa

Etapa 5: persistir programações, criar snapshots com atualização explícita, temas e cadastro de textos livres. A programação atual permanece temporária; cifras ainda são literais e importação de Bíblia SQL permanece na etapa 6.

## Resultados e pacotes

Tipos, compilação e 20 testes unitários aprovados. Testes gráficos completos aprovados nos três formatos Linux: pasta, AppImage extraído automaticamente sem FUSE e tar.gz. Conteúdo de `dist` comparado byte a byte ao `app.asar` dos dois sistemas, sem divergência. ZIP passou verificação CRC; gzip foi lido integralmente e o tar validado, sem dados do usuário.

Geração final: `ELECTRON_BUILDER_COMPRESSION_LEVEL=5 npx electron-builder --linux AppImage tar.gz --win zip --x64`, após `npm run check` e `npm test`. Compressão intermediária não altera o conteúdo do aplicativo.

| Pacote | Tamanho (MiB) | SHA-256 |
| --- | ---: | --- |
| `zamar-sync-0.4.0-linux-x64.tar.gz` | 117.11 | `f29d4def0de23dde475586b92a32e4ca913a3cd8e36c7afb5ab502e4e1ef419d` |
| `zamar-sync-0.4.0-linux-x86_64.AppImage` | 122.16 | `6f45e046c9581167ebc95dc30450784b4b306bec50f2767829552901521ec633` |
| `zamar-sync-0.4.0-win-x64.zip` | 149.73 | `bbce014a2a930eaa8e62553cf4d9b087b88a7636c56b17567947f424c91a2cfe` |

Arquivos `.sha256` acompanham os pacotes em `release`. Captura real: [modo apresentador](etapa-4-preview.png).

Limpeza concluída: seis arquivos 0.3.1 removidos (três pacotes e três hashes). Permanecem os três pacotes 0.4.0 e seus hashes, pastas atuais e dados locais preservados. Windows e datashow físico continuam pendentes de homologação.

**Histórico de distribuição:** os pacotes 0.4.0 foram substituídos pela entrega 0.5.0. Consulte [etapa 5](etapa-5-programacao-e-temas.md) para os arquivos atuais.
