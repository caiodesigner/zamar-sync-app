# Zamar Sync

Versão 1.0.0 de aplicativo desktop offline para projeção de letras, Bíblia e cifras. A etapa 6 adiciona importação restrita de Bíblia SQL com prévia, consulta por referência, pesquisa, navegação e projeção de versículos com versão e atribuição. Músicas, textos, programações e temas continuam disponíveis. A etapa 7 acrescenta cifras estruturadas, transposição e apresentação alinhada, com cópias independentes na programação. A etapa 8 adiciona importação com prévia, tratamento de duplicatas, exportação completa e salvamento automático seguro.

## Desenvolvimento

Requer Node.js 24 e npm no computador de desenvolvimento. O operador do pacote final não precisa instalar Node.js.

1. Instalar dependências com `npm ci` (requer rede para dependências e runtime Electron).
2. Executar `npm run check` e `npm test`.
3. Abrir com `npm start`. Caso o ambiente exporte `ELECTRON_RUN_AS_NODE`, remover essa variável antes de iniciar.
4. Gerar AppImage e tar.gz Linux com `npm run pack:linux`, pasta de teste com `npm run pack:linux:dir` ou ZIP Windows x64 com `npm run pack:win`.
5. Após gerar o pacote do sistema atual, executar `npm run test:electron` em sessão gráfica Windows ou Linux. O teste usa cópia temporária do pacote, sem modificar os dados do operador. A saída externa é simulada sem exibição nativa sobre o monitor do operador; o teste também verifica cadastro, reinício, backup e restauração.

O processo de empacotamento pode precisar de rede para baixar o Electron da plataforma alvo. Isso não cria uma dependência de internet para o aplicativo empacotado.

## Uso no Windows

Extrair o ZIP de `release` por completo para uma pasta gravável e abrir `Zamar Sync.exe`. Não executar dentro do ZIP. A pasta `data` será criada junto do executável; mover a pasta completa preserva os dados. Fechar o app antes de copiar dados ou remover um pendrive.

Preparar um texto, escolher Ensaio neste monitor ou um datashow em modo estendido e clicar Iniciar apresentação. Usar Apresentar para enviar o bloco escolhido. “Salvar texto” confirma gravação local; fechar e reabrir recupera o texto salvo. Edições válidas são salvas automaticamente após uma pausa de 1,2 segundo, com indicador de gravação e recuperação da última edição confirmada. Editar o rascunho não altera a projeção. Esc na projeção fecha a saída. Uma tela usa ensaio local, sem abrir saída em tela cheia sobre os controles.

Na aba Bíblia, use Cadastrar Bíblia para selecionar um `.sql` UTF-8 ou banco `.sqlite`, `.sqlite3` ou `.db` já baixado, informar metadados, conferir o mapeamento e aceitar a cobertura antes de confirmar. Os dois perfis suportados são tabela única e tabela de livros relacionada aos versículos. Dumps incompatíveis são recusados sem execução. Bancos SQLite são identificados pelo conteúdo e lidos em uma cópia temporária somente para leitura, sem alterar a origem. Use uma cópia completa e fechada do banco (sem transações pendentes em arquivos WAL). Views, tabelas virtuais, colunas geradas e valores binários não são importados; os limites de 50 MiB, 20 tabelas e 110 mil linhas continuam válidos. Não há Bíblia pré-carregada; ARA pode ser cadastrada quando o arquivo for compatível, sem exigência de documento de licença no fluxo local.

## Estado e limites

Windows e Linux são plataformas do MVP. O ZIP Windows não tem assinatura de código. As validações físicas de sistemas/monitores e o ensaio com cinco voluntários foram encerrados conforme confirmação do usuário; veja o registro de aceite. O agente executou os testes automatizados Linux e inspecionou o pacote Windows, sem nova execução Windows nesta entrega. Matriz Linux inicial: Ubuntu 24.04 LTS e Mint 22 x64, X11 ou XWayland; Wayland nativo não é alvo desta versão.

Ver [plano](docs/plano-de-desenvolvimento.md), [registro de execução](docs/registro-de-execucao.md) e [roteiro de homologação](docs/etapa-1-validacao.md).


## Uso no Linux

No AppImage, conceder permissão de execução pelo gerenciador de arquivos ou `chmod +x arquivo.AppImage`, e abrir. A pasta `data` fica ao lado do arquivo AppImage original; mover o aplicativo exige mover os dados juntos. Não são salvos dentro da montagem temporária.

Sem FUSE, usar o tar.gz: extrair por completo para pasta gravável e abrir `zamar-sync`. Alternativamente, testar o AppImage com `--appimage-extract-and-run`; manter o arquivo original no mesmo lugar para preservar a localização de dados. O pacote exige as bibliotecas normais de uma distribuição desktop homologada e permissões de execução no volume.

No Linux, o programa seleciona X11 para controlar o monitor de projeção. Em sessão Wayland, precisa de XWayland disponível; se ausente, usar uma sessão X11. Não adicionar `--no-sandbox`, instalar serviços ou alterar permissões do sistema como solução padrão. Ambientes que exijam isso devem constar como incompatíveis até correção e homologação.

Para testar os artefatos Linux: após `npm run pack:linux`, executar `ZAMAR_SMOKE_FORMAT=appimage npm run test:electron` para extração automática sem FUSE e `ZAMAR_SMOKE_FORMAT=tar npm run test:electron` para o tar.gz. Cada execução usa uma cópia temporária e remove somente seus próprios dados ao terminar.


## Testar a experiência atual

Use os pacotes com versão 1.0.0 em `release` ou `npm start`. Não copie dados reais para o teste; use uma pasta nova ou um backup.

Em Músicas, use Nova música, informe título e autor, edite a letra de cada seção e organize a ordem. Repetir seção selecionada reutiliza o mesmo refrão. Clique em Salvar música antes de trocar de conteúdo. A busca encontra título, autor e letra sem distinguir acentos. Arquivar música e Salvar música move o cadastro para Ver arquivadas; é possível desarquivar.

Linha em branco ou uma linha contendo `---` divide slides manualmente; linhas extensas são quebradas e paginadas automaticamente. No modo apresentador, setas avançam/retrocedem a saída. Fora dele, preparam a prévia. Ocultar texto (O), Tela preta (B) e Apresentar são comandos explícitos. Escolher outra música ou editar não muda a saída.

Na aba Textos, use + para cadastrar título e conteúdo e clique em Salvar texto. Abrir rascunho recupera o rascunho legado separadamente.

Em Programação, informe um nome, adicione conteúdos e use Salvar programação. É possível guardar vários cultos e escolher em Abrir programação. A última programação salva ou aberta reaparece ao reiniciar. Arraste itens ou use os botões de subir/descer; Alt+↑/↓ no item também reordena.

Cada item guarda uma cópia do conteúdo e do tema. Editar a biblioteca preserva o culto preparado e a saída ativa. Atualizar busca a versão salva na origem, mediante confirmação; depois salve a programação. Para alterar o tema de uma cópia, selecione o item, escolha outro tema e clique em Aplicar tema ao item. Apresentar continua sendo um comando separado.

Na prévia, use Novo tema ou Editar tema. Escolha proporção, cores, fonte, tamanho, alinhamento e margens. Imagens PNG/JPEG são copiadas para a pasta de dados e entram nos backups. Salvar um tema apenas modifica a preparação; não muda a saída ativa. Ocultar texto preserva o fundo do tema, enquanto Tela preta apaga toda a imagem.

Confira o [roteiro de voluntários da etapa 2](docs/etapa-2-experiencia.md). Para cifras, use `[C]Minha [G/B]canção`, selecione os tons e o modo de exibição e salve a música. Veja o [roteiro da etapa 7](docs/etapa-7-cifras.md). Para Bíblia, consulte [formatos e roteiro da etapa 6](docs/etapa-6-biblia-offline.md). Use referências como Jo 3:16 ou 1 Jo 2:1-3; pesquise ou navegue por livro/capítulo. Preparar passagem não altera a saída até Apresentar. O arquivo original pode ser removido após importar.


## Exportação, backup e restauração — 0.8.0

Aguarde a gravação automática ou use Salvar, abra Configurações e use Exportar letras de músicas ou Exportar cifras de músicas para escolher um catálogo `.json`. Para recuperar, use Restaurar backup e confirme a substituição. A aplicação cria uma cópia dos dados atuais antes da restauração e informa onde ela foi salva. A apresentação é encerrada e o conteúdo não volta automaticamente ao datashow.

A atualização reconhece o rascunho das versões anteriores e migra o banco com cópia prévia. Feche a versão antiga antes de abrir a nova e preserve sua pasta `data`. A limpeza de releases remove somente artefatos antigos; `release/data` é preservada. Músicas, textos, temas, imagens, programações e Bíblias importadas entram no backup; registros antigos de formato desconhecido são preservados e sinalizados, sem conversão destrutiva.

O esquema 2 amplia o banco para textos livres, com cópia anterior e migração transacional. Backups do esquema 1 continuam restauráveis na versão atual. Versões antigas recusam o banco atualizado; preserve seu backup antes de atualizar.

Backups 0.6.0 usam envelope 2, necessário para os corpus bíblicos. A versão atual também restaura envelopes antigos. O cache de consulta bíblica é reconstruído dos dados normalizados incluídos no backup; não requer o SQL original.

Detalhes e limites em [dados e recuperação](docs/etapa-3-dados.md).

A pasta release contém apenas os pacotes gerados 1.0.0 para distribuição e seus hashes, além das pastas de teste atuais e dos dados preservados. Para limpezas futuras após gerar e conferir os arquivos SHA-256, usar `node scripts/clean-release.cjs`.


## Modo apresentador e datashow

Com uma tela, selecione Ensaio neste monitor e Iniciar apresentação. Apresentar e Tela preta alteram somente a simulação, mantendo os controles visíveis. Para usar o datashow, conecte-o em modo estendido (Windows: Win+P → Estender; Linux: saídas independentes nas configurações de telas) e selecione a saída externa. O modo espelhado mostra a mesma imagem nas duas telas. “Editar conteúdo” abre o editor durante a apresentação, sem alterar o conteúdo ao vivo; Esc ou Encerrar apresentação encerra a sessão.

Ver [correção do modo apresentador](docs/ajuste-modo-apresentador.md).

Detalhes da entrega final em [etapa 10](docs/etapa-10-entrega.md). Bíblia offline em [etapa 6](docs/etapa-6-biblia-offline.md). Histórico de programação e temas em [etapa 5](docs/etapa-5-programacao-e-temas.md). Histórico de letras em [etapa 4](docs/etapa-4-letras.md).

## Importação e recuperação — etapa 8

Use Importar texto ou cifra para abrir `.txt`, `.pro` ou `.chordpro` UTF-8, corrigir a prévia e confirmar. Duplicatas exigem ignorar, copiar ou atualizar explicitamente. Atualizar cria backup anterior. O botão Recuperar última edição prepara o último lote automático confirmado, sem iniciar projeção. Campos inválidos, conflitos e falhas de gravação preservam a última versão confirmada; confira o indicador antes de fechar. Veja [formatos, limites e roteiro da etapa 8](docs/etapa-8-importacao-e-recuperacao.md).


## Homologação e entrega final

A versão 1.0.0 melhora a busca em bibliotecas grandes e o apresentador em zoom alto. Resultados são carregados em lotes de 100; a busca consulta todas as músicas. Ctrl+F durante apresentação revela a biblioteca sem alterar a saída.

`npm run test:performance` mede a compilação atual com 10 mil músicas sintéticas. `npm run test:qualification` verifica teclado/zoom do pacote em pasta, com sandbox habilitado e contexto offline. Execute `npm run build` antes de medir alterações de código. Veja o [relatório da etapa 9](docs/etapa-9-homologacao.md) e o [aceite do usuário](docs/homologacao/aceite-usuario.md). A confirmação inclui duas horas com dois monitores e rede desligada, sem falhas bloqueadoras; tempos individuais dos voluntários não foram fornecidos.


## Entrega 1.0.0

[Guia rápido](docs/guia-rapido.md) e [atualização/retorno](docs/atualizacao-e-recuperacao.md) acompanham os pacotes como GUIA-RAPIDO.md e ATUALIZACAO.md. COMPONENTS.json e BUILD-MANIFEST.json identificam dependências e hashes da compilação. Windows permanece sem assinatura digital; a avaliação e os alertas possíveis estão no guia de atualização.

Para gerar e verificar uma entrega: `npm run check`, `npm test`, gerar os pacotes e `npm run verify:release`. Os arquivos SHA-256 identificam os três pacotes. O teste `npm run test:upgrade` usa uma cópia anterior sem dados reais indicada por ZAMAR_PREVIOUS_APP. O plano registra 44/44 tarefas encerradas, distinguindo evidência automatizada e aceite externo.


## Biblioteca Encontro — importação em lote

O catálogo [library/encontro/songs.json](library/encontro/songs.json) contém 232 registros extraídos do PowerPoint fornecido, com seções por slide, origem e revisão pendente. Há 36 registros com alertas específicos e versões repetidas preservadas. Consulte [instruções e revisão](library/encontro/README.md).

Na versão atual do código, abra **Importar texto ou cifra → Selecionar biblioteca JSON**, escolha o catálogo, confira/selecione as músicas e confirme o lote. Um backup é criado antes da gravação transacional; músicas com IDs já existentes são preservadas. O catálogo fica versionado no repositório, separado dos dados locais, e pode ser importado posteriormente em produção. Regere os pacotes de release para usar esse recurso pelos executáveis.


## Exportação JSON de letras e cifras

Em **Configurações**, use **Exportar letras de músicas** (todas as músicas, sem acordes) ou **Exportar cifras de músicas** (somente músicas com acordes, preservando letra/cifras e tons). São catálogos `zamar-song-library` importáveis por **Importar texto ou cifra → Selecionar biblioteca JSON**. Nenhuma Bíblia, imagem, tema ou programação é incluída. Os cadastros e dados locais permanecem em `data`, sem modificação pela exportação.

As exportações preservam IDs e seções; uma música com cifras também aparece na exportação de letras, com os acordes removidos somente no arquivo. A exportação de cifras considera a presença de acordes, inclusive quando o modo de apresentação está definido como letra. Músicas arquivadas também são preservadas. Sem cifras cadastradas, o app informa isso e não gera um arquivo vazio.

O importador mantém sua regra de preservar IDs já cadastrados: importar letras e depois cifras do mesmo ID não sobrescreve automaticamente a versão existente. Para acrescentar cifras a uma música já cadastrada, edite a música no app. Títulos iguais com IDs distintos continuam sujeitos à revisão do usuário. Limites do catálogo: 2 mil músicas e 10 MiB por arquivo.

Bíblias são gerenciadas na aba Bíblia: importar SQL/SQLite, consultar, substituir pelo cadastro de importação, definir versão padrão e remover. Não há exportação de Bíblia na interface. Backups internos de proteção continuam completos para permitir recuperação de operações; **Restaurar backup** permanece disponível para arquivos completos anteriores. Os dois botões de exportação completa foram substituídos pelos de letras e cifras.

O JSON exportado não atualiza automaticamente `library/encontro/songs.json` ou o GitHub. Para preservar todo o estado ao mover/atualizar, feche o app e copie a pasta `data` completa junto com ele.


## Uma ou duas colunas por música

Selecione a música na biblioteca e, no editor, use **Colunas desta música → 1 coluna / 2 colunas**. Salve a música e confira a prévia. A escolha vale somente para essa música, em letra ou cifra, e não modifica o tema nem as demais músicas. Músicas sem escolha explícita usam uma coluna. Para mudar a saída ativa, apresente novamente.

Em uma cópia da programação, use **Colunas desta cópia** e salve a programação; a música da biblioteca permanece intacta. Temas compartilhados cuidam apenas da aparência: não há mais seletor de colunas no editor de temas.
