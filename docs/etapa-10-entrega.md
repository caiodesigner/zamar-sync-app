# Etapa 10 — Entrega portátil 1.0.0

Encerramento das tarefas 10.1 a 10.5. As pendências físicas/humanas anteriores foram encerradas conforme [aceite informado pelo usuário](homologacao/aceite-usuario.md), preservando a distinção entre confirmação externa e testes automatizados.

## 10.1 — Compilar, identificar e inventariar

1. Usar Node 24 e `npm ci` com o lockfile no computador de desenvolvimento.
2. Executar `npm run check` e `npm test`. O build gera avisos, compilação e metadados.
3. `scripts/release-manifest.cjs` gera `.release-metadata/COMPONENTS.json` e `BUILD-MANIFEST.json`: versão 1.0.0, versões fixadas, 351 componentes, hashes dos arquivos compilados/configurações/guias e identificação do Node da compilação.
4. Gerar os três pacotes com `ELECTRON_BUILDER_COMPRESSION_LEVEL=5 npx electron-builder --linux AppImage tar.gz --win zip --x64`.
5. Rodar `npm run verify:release`, conferir integridade dos arquivos compactados e gerar SHA-256 antes da limpeza.

O operador recebe o runtime Electron/Node/SQLite incluído, sem precisar instalar Java/Node/banco. A distribuição contém os avisos React/Scheduler e as licenças Electron/Chromium. O inventário distingue ferramentas de compilação do conteúdo da aplicação/runtime. Código próprio mantém o metadado UNLICENSED do projeto, sem atribuição automática de licença aberta.

Os inputs fixados e hashes permitem repetir e conferir a compilação; timestamps e ferramentas podem mudar os bytes dos contêineres. Não se promete recompilação bit a bit nem assinatura digital dos hashes.

## 10.2 — Extrair, abrir e mover

Os testes gráficos usam cópias temporárias dos pacotes, em caminhos com espaços e acentos, sem tocar `release/data`. Reabrem o SQLite e os anexos; AppImage é testado com extração automática sem FUSE e tar.gz por extração completa. Contexto offline após lançamento, requisições remotas bloqueadas no app e sandbox Chromium exigido pelo harness.

Isso é evidência automatizada local; a primeira abertura com adaptadores físicos desligados e execução Windows/matriz física são cobertas pelo aceite do usuário, sem uma nova execução desses cenários pelo agente. O teste adicional de atualização move os dados entre pastas portáteis distintas, conferindo os agregados e imagens/Bíblia sem arquivos de origem.

## 10.3 — Atualizar, migrar e retornar

O roteiro [atualização e recuperação](atualizacao-e-recuperacao.md), distribuído como `ATUALIZACAO.md`, preserva backup externo e cópia fechada da pasta anterior antes de abrir a nova versão. O retorno usa essa cópia inteira, sem entregar um banco migrado a executáveis antigos.

`tests/release-upgrade.cjs` usa o pacote 0.9.0 e o pacote atual em cópias descartáveis. Cadastra música com cifras/transposição/seções repetidas, texto, tema, PNG e Bíblia SQL sintética; exclui os arquivos de origem; exporta o backup anterior; move `data` para outra pasta com a versão nova. Confere os agregados, a imagem, os versículos e a saída fechada/preta. Verifica retorno à cópia antiga e restauração/reabertura do backup anterior na versão nova.

O script requer um pacote anterior sem `data`, por `ZAMAR_PREVIOUS_APP`. Nesta execução a cópia anterior foi preservada antes de empacotar 1.0.0. Nunca usa bibliotecas reais. Migração dos esquemas 0/1, cópia anterior, rejeição de banco futuro e rollback em falhas continuam cobertos pelos testes de domínio. A atualização 0.9.0→1.0.0 mantém o esquema 2.

## 10.4 — Guia de operação

[Guia rápido](guia-rapido.md), distribuído como `GUIA-RAPIDO.md`, cobre primeira abertura, ensaio/monitor externo, letras/cifras/Bíblia, programação, atalhos, autosave, backup e solução de problemas. Seus fluxos correspondem à suíte gráfica existente. A avaliação geral com cinco voluntários foi aceita pelo usuário; não se inventa uma sessão humana adicional específica da revisão final desse documento.

## 10.5 — Assinatura e alertas Windows

A decisão é distribuir ZIP sem Authenticode, mantendo a configuração explícita do projeto e sem obter certificados/credenciais. `scripts/verify-release.cjs` verifica o executável PE x64 e o diretório de certificados. O guia de atualização documenta os avisos possíveis, a verificação de integridade e a diferença entre hash, assinatura e reputação.

Referências oficiais consultadas em 18/10/2026: [Microsoft — reputação de aplicativos](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/smartscreen-reputation) e [electron-builder v26 — Windows](https://www.electron.build/v26/docs/win/). Avaliar e documentar a assinatura encerra a tarefa; assinar ou eliminar todos os alertas não era seu critério de conclusão.

## Arquivos ao lado do executável

| Arquivo | Finalidade |
| --- | --- |
| GUIA-RAPIDO.md | Operação e solução de problemas |
| ATUALIZACAO.md | Atualização, retorno e alertas |
| COMPONENTS.json | Inventário completo e papéis das dependências |
| BUILD-MANIFEST.json | Versão, inputs e hashes da compilação |
| THIRD_PARTY_NOTICES.txt | Avisos de componentes da aplicação |
| LICENSE.electron.txt / LICENSES.chromium.html | Avisos do runtime distribuído |

Os pacotes não incluem Bíblia real nem dados privados. A Bíblia do usuário permanece local após importação e integra os backups.


## Resultados finais — 18/10/2026

Tipos, build e 45 testes de domínio aprovados. O teste de atualização 0.9.0→1.0.0 passou nos quatro cenários registrados: exportação anterior, preservação em outra pasta, retorno à cópia antiga e restauração/reabertura. A imagem foi carregada pelo mecanismo permitido do app e seu arquivo conferido por hash; Bíblia e PNG originais foram removidos antes da atualização.

Evidências: [atualização e runtime](homologacao/resultados/entrega-1.0.0/atualizacao.json), [verificação dos pacotes e PE](homologacao/resultados/entrega-1.0.0/pacotes.json), [manifesto](homologacao/resultados/entrega-1.0.0/BUILD-MANIFEST.json) e [componentes](homologacao/resultados/entrega-1.0.0/COMPONENTS.json).

O verificador confirmou versão 1.0.0, 76 arquivos compilados por sistema, sete documentos/avisos extras e executável Windows x64 sem tabela de certificados Authenticode. Os contêineres ZIP/gzip/tar passaram em verificação integral e incluem os documentos; dados reais não foram incluídos.

| Pacote | Tamanho (MiB) | SHA-256 |
| --- | ---: | --- |
| `zamar-sync-1.0.0-linux-x64.tar.gz` | 118.89 | `1c5b20a03a7d9d7133329004b710a056003ab878aa826187cd0f14756aefec3b` |
| `zamar-sync-1.0.0-linux-x86_64.AppImage` | 124.03 | `7e2e3f1314e9e789c16e3d6b4a529a246ccf91c6aa19e89f8ae956f2ee84d177` |
| `zamar-sync-1.0.0-win-x64.zip` | 151.51 | `b5893961858b09aa3e2fa07925325e743e8e29878a9bbf97043ccf70d8a20d9b` |

A confirmação física/humana é do usuário; o agente não executou Windows, monitores reais ou cinco participantes nesta entrega. Registros quantitativos não fornecidos não foram criados artificialmente.


Suíte gráfica completa aprovada nos pacotes Linux finais em pasta, AppImage com extração automática e tar.gz, com sandbox habilitado, contexto offline, teclado e zoom. Uma verificação de foco do teste foi sincronizada ao frame de atualização de Ctrl+F; a repetição passou sem alterar o aplicativo.

Limpeza concluída: seis arquivos 0.9.0 removidos, mantendo somente os três pacotes 1.0.0 e seus hashes, além das pastas atuais e dados preservados. Plano encerrado em 44/44 tarefas conforme evidências técnicas e aceite externo documentado.
