# Etapa 3 — Fundação de dados e recuperação

Versão 0.3.0. Execução autorizada pelo usuário enquanto permanecem abertas a homologação de ambientes da etapa 1 e a avaliação com voluntários da etapa 2.

## 3.1 — Esquema e repositórios

O banco local usa SQLite embarcado, esquema 1 registrado em `PRAGMA user_version`, transações e sincronização FULL. A migração de esquema 0 das versões 0.1/0.2 mantém o rascunho existente e cria previamente uma cópia SQLite consistente em `data/backups`. Banco de versão superior é recusado antes de migrar ou alterar seu conteúdo.

| Estrutura | Responsabilidade |
| --- | --- |
| settings | Rascunho, preferências e checkpoint da apresentação |
| records | Agregados de música, programação, tema e metadados de tradução bíblica |
| records_title | Índice por tipo e título |
| assets | Identificação, nome, tipo, tamanho e SHA-256 dos anexos |
| assets/ | Arquivos imutáveis nomeados pelo hash, sem usar caminhos recebidos de importação |

Cada agregado tem tipo, identificador estável, título, dados JSON e datas de criação/alteração. A chave composta permite identificadores independentes entre tipos. Atualizar um registro mantém sua data original de criação. Os repositórios fornecem gravação e listagem por tipo, com consultas parametrizadas.

O formato JSON do agregado permite preservar seções, linhas, âncoras de acordes, sequência e tom sem duplicar o texto do refrão. O cabeçalho e a estrutura JSON são validados; as regras específicas de música, tema, culto e tradução serão adicionadas nas respectivas etapas. A interface ainda não cadastra esses agregados: biblioteca e programação continuam demonstrativas nesta versão.

## 3.2 — Localização e concorrência

- Pasta portátil ao lado do executável ou do AppImage original, conforme a implementação anterior.
- Diretório preparado antes de configurar o perfil do Electron; nenhum destino alternativo silencioso.
- Se não for possível preparar a pasta padrão, apresentar erro e permitir escolher explicitamente uma pasta gravável ou encerrar. Essa escolha de recuperação vale para a abertura atual; se a pasta padrão continuar indisponível na próxima abertura, a seleção será solicitada novamente.
- Se o banco existente for inválido, de versão futura ou não puder ser aberto, interromper com mensagem sem recriá-lo por cima.
- Instância única por perfil no Electron, bloqueio de propriedade em `.store.lock` e conexão SQLite em modo exclusivo.
- Bloqueio deixado por processo encerrado é recuperado pela identificação do processo. Bloqueio inválido não é apagado automaticamente: orientar verificar se há aplicativo aberto antes de remoção manual.
- Backup e restauração simultâneos pela interface são recusados enquanto outra operação de manutenção estiver aberta.

Não oferecer compartilhamento do banco em rede nem abertura concorrente intencional. Não modificar permissões do sistema ou desabilitar sandbox para contornar erros.

## 3.3 — Comunicação e estado público

Todas as chamadas do preload usam envelope de versão 1, com payload validado no processo principal. Somente a janela principal do operador pode modificar dados, apresentar conteúdo ou abrir diálogos de arquivos. A origem e o frame são verificados.

A projeção recebe o snapshot público; sua chamada inicial retorna rascunho, caminho dos dados e monitores vazios. Ela não pode acessar a biblioteca ou acionar backup/restauração.

O processo principal é a autoridade da apresentação, com revisão crescente durante a sessão. Cada novo conteúdo apresentado é registrado em checkpoint antes de confirmar a mudança pública. Ao reiniciar, manter o último texto disponível, mas iniciar com saída fechada e tela preta. Uma janela de saída reaberta solicita o snapshot completo e exige retomada explícita. A restauração também volta ao estado seguro, sem projetar automaticamente conteúdo do backup.

## 3.4 — Backup e restauração

Na interface: **Configurações → Criar backup / Restaurar backup**. Arquivos usam extensão `.zamar-backup`.

O formato básico é um envelope JSON versionado comprimido com gzip. Inclui snapshot SQLite consistente criado por `VACUUM INTO`, banco codificado em base64, metadados, anexos registrados e hashes SHA-256. Não copia diretamente um banco aberto. O arquivo de saída é escrito em temporário, sincronizado e renomeado no destino.

Limites desta primeira implementação: até 128 MiB de conteúdo bruto por backup, até 10 MiB por anexo e 10 mil entradas de anexos na restauração. A leitura comprimida e a descompressão também têm limites. O processamento básico é síncrono; operações grandes podem bloquear a janela por alguns instantes. Processamento em worker poderá ser adicionado se a medição justificar.

Restauração:

1. Escolher arquivo pelo diálogo nativo e confirmar a substituição, incluindo descarte de rascunho não salvo e da programação temporária.
2. Descomprimir com limite e conferir versão, base64 e hashes.
3. Abrir o snapshot em área temporária, somente leitura, sem extensões e com esquema confiável desabilitado.
4. Conferir integridade SQLite, estruturas conhecidas, registros, configurações e correspondência dos anexos.
5. Criar backup automático do estado atual antes de alterar os dados ativos.
6. Materializar os anexos por hash, sem executar SQL recebido ou usar nomes de arquivos externos como caminhos.
7. Substituir registros, configurações e metadados em uma única transação. Erros revertem todas as alterações no banco.
8. Encerrar a saída, atualizar o rascunho e informar a localização da cópia anterior.

Manter os cinco backups automáticos de pré-restauração mais recentes. Backups manuais e snapshots de migração não são apagados por essa retenção. Anexos antigos não são removidos na restauração: podem permanecer sem referência para que uma falha não destrua arquivos do estado anterior. Coleta de arquivos órfãos é trabalho futuro.

O backup cobre o conteúdo já persistido nesta etapa. Não inclui rascunho ainda não salvo, programação temporária, caches do Electron ou bancos bíblicos futuros ainda não implementados. Ao implementar importação de Bíblia na etapa 6, estender o formato e os testes para incluir seus versículos persistidos, conforme o contrato do importador.

A cópia SQLite anterior à primeira migração preserva o esquema antigo. Para recuperação manual dessa cópia, fechar o app e usar o snapshot como `zamar.sqlite` em uma pasta separada, preservando o arquivo anterior. Ela não usa o formato do botão Restaurar backup.

## Evidências de verificação

Oito testes novos de fundação, além dos cinco anteriores de armazenamento e portabilidade:

- Migração de dados legados com cópia prévia e preservação do rascunho.
- Recusa de banco de versão futura sem mudança dos bytes existentes.
- Persistência dos quatro tipos de agregado, caracteres especiais e estrutura de seções/cifras.
- Rejeição de cabeçalhos e dados não JSON, incluindo Date e números não finitos.
- Restauração em diretório vazio, com registros e anexos íntegros.
- Recuperação do estado anterior pelo backup automático.
- Rejeição de hash adulterado e caminho inválido em manifesto de anexos.
- Bloqueio concorrente, recuperação após saída de processo e pasta sem escrita.
- Envelope IPC inválido e recuperação do último slide sempre em preto.
- Falha simulada no meio da transação de restauração, mantendo o estado anterior.

O teste gráfico do Electron exercita backup e restauração pela tela de Configurações, incluindo escolha de arquivos e confirmação substituídas de forma controlada no teste. Depois de alterar e salvar o rascunho, restaurar recupera o valor anterior; reabrir preserva os dados e mantém a projeção fechada. O teste também verifica rejeição de payload inválido e de acesso privado pela saída.

As verificações locais não substituem a homologação Windows, a matriz completa de distribuições Linux, o teste físico de dois monitores ou avaliação com voluntários. Essas pendências continuam nas etapas 1 e 2, sem bloquear a entrega técnica autorizada da etapa 3.

## Conclusão e próximo passo

3.1 a 3.4 implementadas e verificadas. A próxima etapa técnica é a 4: cadastro, edição, pesquisa e arquivamento reais de músicas, seções e sequência reutilizável, integrando os repositórios à interface. Biblioteca musical e programação de demonstração não devem ser marcadas como funcionalidades persistentes entregues por esta etapa.


## Recuperação quando o app não consegue abrir o banco

Feche todas as instâncias, preserve a pasta `data` original com outro nome e abra o aplicativo com uma pasta nova. Use Configurações → Restaurar backup para recuperar um arquivo válido. Não apague a pasta anterior até conferir o resultado. Um banco corrompido nunca é recriado automaticamente sobre os arquivos existentes.

## Referências técnicas

- [SQLite — VACUUM INTO](https://www.sqlite.org/lang_vacuum.html): mecanismo de snapshot consistente usado no backup.
- [Node.js — SQLite](https://nodejs.org/api/sqlite.html): API embarcada; os testes também verificam a versão efetivamente incluída no Electron.


## Artefatos finais 0.3.0

Pacotes gerados para ambos os sistemas, com CRC do ZIP, fluxo gzip do tar.gz e hashes conferidos. Testes gráficos de desenvolvimento, pasta Linux e AppImage aprovados; execução Windows continua como pendência da etapa 1.

| Arquivo em release | Bytes | SHA-256 |
| --- | --- | --- |
| zamar-sync-0.3.0-win-x64.zip | 155286692 | `b72e5eabfd7b712b0899b2c9260dc178f8b6ca805578235ba5aef731591d3c07` |
| zamar-sync-0.3.0-linux-x86_64.AppImage | 127311145 | `6450e958614f6e06a90cee19884f85f699fbbb31bcd76c42d9ea0604a3eeb19e` |
| zamar-sync-0.3.0-linux-x64.tar.gz | 121059992 | `0d4db3d48af603a1e70c3c9fee8ccc42847ab72e70cfa4fde551580bf81e2388` |


Testes gráficos finais aprovados também no tar.gz 0.3.0, após extração. Foram exercitados os novos controles de backup/restauração, o isolamento de dados privados e a recuperação em preto nos três modos Linux.

## Limpeza de release

Removidos os seis pacotes antigos 0.1.0/0.2.0 e seus seis arquivos SHA-256, somente após conferir os três pacotes 0.3.0. Mantidos ZIP Windows, AppImage e tar.gz Linux, seus hashes e as pastas geradas atuais linux-unpacked/win-unpacked. A pasta release/data foi preservada integralmente. O script scripts/clean-release.cjs valida os hashes atuais antes de remover arquivos reconhecidos de outras versões e não percorre pastas de dados.


Atualização: os artefatos 0.3.0 deste relatório foram substituídos por 0.3.1, que corrige o modo apresentador sem alterar o esquema do banco. Consulte ajuste-modo-apresentador.md para os pacotes atuais.
