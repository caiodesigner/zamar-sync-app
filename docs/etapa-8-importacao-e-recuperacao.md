# Etapa 8 — Importação e recuperação

Versão 0.8.0. Abrange 8.1 a 8.4. Mantém funcionamento offline e distribuição portátil Windows/Linux, sem novas dependências.

## 8.1 — Importar e revisar

1. No editor, selecionar Importar texto ou cifra.
2. Escolher `.txt`, `.pro` ou `.chordpro` em UTF-8, com BOM opcional. Limites: 1 MiB de arquivo e 100 mil unidades UTF-16 de texto. Arquivos com codificação inválida são recusados com orientação para conversão.
3. Confirmar o tipo: texto livre ou música. `.txt` sugere texto; os outros sugerem música. É possível alterar a escolha.
4. Editar título e conteúdo; para música, autor, tons, acidentes e modo de exibição. O título inicial deriva do nome do arquivo.
5. Conferir a prévia do primeiro slide, os avisos de cifras e as duplicatas. Toda alteração invalida a conferência anterior.
6. Confirmar a importação. Só então o conteúdo entra na biblioteca e é preparado. A saída ativa não é publicada nem alterada.

Cada arquivo importa um conteúdo. Músicas recebem uma seção inicial, editável depois, preservando marcação inline, quebras de linha e separadores de slides. O subconjunto de cifras é o da [etapa 7](etapa-7-cifras.md); não há interpretação de diretivas completas ChordPro, diagramas ou arquivos Holyrics. A Bíblia `.sql` continua usando seu próprio importador restrito da etapa 6. O arquivo original não é alterado e pode ser removido após a confirmação.

## 8.2 — Tratar duplicatas explicitamente

1. Conferir identifica candidatos do mesmo tipo por título normalizado ou conteúdo normalizado. A normalização ignora caixa, acentos e diferenças de espaços; músicas também comparam a letra sem os acordes reconhecidos pela marcação. A pesquisa inclui músicas arquivadas.
2. Duplicatas mostram título, autor/tipo, parte do identificador e motivo. São sugestões para revisão, sem substituição automática ou análise semântica.
3. Escolher Ignorar, Criar cópia identificada ou Atualizar conteúdo existente. Sem candidato, Cadastrar novo também fica disponível.
4. Ignorar não grava. Cópia recebe ID novo e sufixo `(cópia)`. Atualizar exige selecionar o candidato e preserva ID, data de criação e arquivamento, substituindo os demais dados importáveis da música/texto.
5. Antes de atualizar, o app cria backup em `data/backups/import-...zamar-backup`. Falha no backup impede a substituição.
6. A confirmação verifica novamente as duplicatas e compara data e digest do registro com a prévia. Mudança concorrente exige nova conferência, inclusive quando ocorre no mesmo milissegundo.

Atualizar uma música substitui suas seções e sequência pelo conteúdo importado, conforme o aviso da interface. Programações existentes e a saída ativa conservam seus snapshots. Buscar a nova versão pela origem continua sendo uma ação explícita.

## 8.3 — Exportar e restaurar tudo

1. Aguardar o indicador de gravação ou usar Salvar para confirmar imediatamente.
2. Abrir Configurações e Exportar biblioteca completa, ou Criar backup. As duas ações produzem o mesmo formato portátil `.zamar-backup`.
3. Guardar o arquivo fora da pasta do aplicativo.
4. Para recuperar neste ou em outro computador, abrir Restaurar backup e confirmar a substituição. Um backup anterior é criado antes de gravar.
5. Conferir músicas, cifras, tons, textos, programações, temas, imagens e Bíblias. O SQL e as imagens originais não são necessários.

Reutiliza o envelope 2 com SQLite e anexos por hash, verificação de integridade, gravação atômica, limite total de 128 MiB e restauração de envelopes anteriores. Exporta conteúdos já confirmados, incluindo o recibo de recuperação; edições pendentes ou inválidas não entram. Restaurar encerra a projeção e invalida pedidos automáticos da sessão anterior. A saída reabre fechada/preta, exigindo retomada explícita.

## 8.4 — Salvar automaticamente e recuperar

1. Editar uma música, texto, rascunho, programação ou tema.
2. Após pausa de 1,2 segundo, os conteúdos válidos alterados são enviados para gravação local. O indicador mostra pendência, gravação, confirmação ou erro.
3. A biblioteca é atualizada automaticamente; os botões Salvar continuam disponíveis para confirmação imediata. O tema em edição é salvo na biblioteca, mas só entra na preparação ao escolher/Salvar tema. A saída ao vivo não muda.
4. Campos inválidos não substituem a última versão confirmada. Outros conteúdos válidos do mesmo editor podem ser gravados. O aviso orienta corrigir os campos restantes.
5. Cada lote válido é confirmado numa transação com seu recibo de recuperação. Falha em qualquer gravação desfaz o lote inteiro. Em falha de disco/permissão, o indicador mantém o erro e oferece nova tentativa. A falha também aparece no rodapé, inclusive no apresentador.
6. A gravação compara a versão de origem com o registro atual. Conflitos não sobrescrevem silenciosamente: reabrir a versão atualizada na biblioteca ou usar Salvar explicitamente para confirmar a substituição.
7. Após reabrir o app, usar Recuperar última edição para preparar os conteúdos do último lote automático confirmado. O app consulta suas versões atuais na biblioteca, evitando oferecer uma cópia automática antiga sobre um salvamento manual posterior.
8. A recuperação nunca inicia a projeção. Alterações durante a janela de debounce, campos inválidos e gravações sem confirmação podem não ser recuperadas. Antes de fechar, conferir o indicador; edições pendentes mantêm a confirmação de fechamento existente.

O recibo corresponde ao último lote automático, não a um histórico de todas as versões ou abas. Todos os demais conteúdos confirmados continuam na biblioteca. Não há recuperação prometida para hardware fisicamente danificado. O lote e o recibo respeitam o limite de 1 milhão de caracteres JSON das configurações; se excedido, a interface orienta salvar conteúdos individualmente. Os limites existentes de registros e anexos continuam vigentes.

## Continuidade para uma LLM

| Responsabilidade | Arquivos |
| --- | --- |
| Contrato de importação e duplicatas | `src/shared/transfer.ts` |
| Tipos/validação do lote automático | `src/shared/autosave.ts` |
| Importação, conflitos, backup prévio e transação | `src/main/library-transfer.ts` |
| Permissões e IPC | `src/main/main.ts`, `preload.ts`, `src/shared/contracts.ts` |
| Wizard com prévia | `src/renderer/import-content.tsx` |
| Debounce, indicadores e recuperação | `src/renderer/use-autosave.ts`, `app.tsx` |
| Testes | `tests/transfer.test.cjs`, `transfer-flow.cjs` |

Testes de domínio incluem UTF-8 inválido, limites, prévia sem gravação, duplicatas por título/conteúdo, ignorar/copiar/atualizar, backup anterior, alteração no mesmo milissegundo, conflitos, sessão invalidada, lote de texto/tema/programação e exportação para outra pasta com anexos. Falha `SQLITE_FULL` é injetada durante o segundo item do lote, verificando rollback do primeiro e preservação do recibo. Um processo filho é encerrado com SIGKILL durante uma transação, verificando rollback e recuperação do último autosave confirmado após reabertura.

O fluxo gráfico verifica textos/cifras, correção na prévia, as três escolhas de duplicatas, autosave sem pressionar Salvar, título inválido preservando a versão anterior, saída ativa preservada, crash forçado do renderer, recuperação, exportação/restauração e autosave de texto, tema e programação. Não usa dados reais do operador.

Próxima etapa: **9 — Homologação de usabilidade e desempenho**. As verificações físicas Windows/Linux, dois monitores reais, ensaio de 2 horas e voluntários permanecem pendentes; não são inferidas dos testes automatizados.


## Resultados e distribuição 0.8.0

Tipos, build e 45 casos de domínio aprovados. A interface foi verificada em desenvolvimento, incluindo conflito de edição, nova tentativa e substituição por salvamento manual explícito. Captura real em [prévia e confirmação de importação](etapa-8-preview.png).

Os pacotes Windows ZIP e Linux AppImage/tar.gz foram gerados com SHA-256. Os 72 arquivos compilados foram comparados byte a byte ao conteúdo embarcado dos dois sistemas, incluindo os módulos externos ao ASAR. ZIP passou CRC; gzip foi lido integralmente e tar inspecionado, sem dados do operador nos pacotes.

| Pacote | Tamanho (MiB) | SHA-256 |
| --- | ---: | --- |
| `zamar-sync-0.8.0-linux-x64.tar.gz` | 118.62 | `0b4ba34308cae5fbbf98002eda73dcd90ddb57bf68807ecd069c36ef37539e74` |
| `zamar-sync-0.8.0-linux-x86_64.AppImage` | 123.76 | `34844d53132995d2a8300bfdd03b5e3015db2b483ade87c8ea69cb0e97c64241` |
| `zamar-sync-0.8.0-win-x64.zip` | 151.25 | `8b97865180d4e039504963e1be2b5484026724b8bf8aa00841d4b504ba5960b2` |

Windows foi gerado e inspecionado, sem execução neste ambiente. A saída externa dos testes é simulada, com fullscreen e exibição nativos desativados para preservar o monitor real.

Suíte gráfica completa aprovada nos três formatos Linux finais: pasta, AppImage com extração automática sem FUSE e tar.gz. Inclui regressões de biblioteca, temas, Bíblia, cifras, projeção e backup, além dos novos fluxos da etapa 8. Limpeza concluída: seis arquivos 0.7.0 removidos; somente os pacotes atuais 0.8.0 e hashes foram mantidos, preservando as pastas atuais e `release/data`.

Nota de histórico: a pasta release passa a distribuir a entrega intermediária [0.9.0 da etapa 9](etapa-9-homologacao.md); os hashes acima registram 0.8.0.
