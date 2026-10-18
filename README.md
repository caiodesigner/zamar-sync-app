# Zamar Sync

Protótipo 0.3.1 de aplicativo desktop offline para projeção de letras, Bíblia e cifras. Etapa 3: fundação de dados, migrações e backup/restauração entregues, com biblioteca de exemplos, busca, editor, prévia por blocos e programação temporária. SQLite preserva somente o texto do rascunho; biblioteca persistente, cifras estruturadas e Bíblia serão implementadas nas etapas seguintes.

## Desenvolvimento

Requer Node.js 24 e npm no computador de desenvolvimento. O operador do pacote final não precisa instalar Node.js.

1. Instalar dependências com `npm ci` (requer rede para dependências e runtime Electron).
2. Executar `npm run check` e `npm test`.
3. Abrir com `npm start`. Caso o ambiente exporte `ELECTRON_RUN_AS_NODE`, remover essa variável antes de iniciar.
4. Gerar AppImage e tar.gz Linux com `npm run pack:linux`, pasta de teste com `npm run pack:linux:dir` ou ZIP Windows x64 com `npm run pack:win`.
5. Após gerar o pacote do sistema atual, executar `npm run test:electron` em sessão gráfica Windows ou Linux. O teste usa cópia temporária do pacote, sem modificar os dados do operador. Ele abre uma saída por alguns segundos e simula a remoção do monitor.

O processo de empacotamento pode precisar de rede para baixar o Electron da plataforma alvo. Isso não cria uma dependência de internet para o aplicativo empacotado.

## Uso do protótipo Windows

Extrair o ZIP de `release` por completo para uma pasta gravável e abrir `Zamar Sync.exe`. Não executar dentro do ZIP. A pasta `data` será criada junto do executável; mover a pasta completa preserva os dados. Fechar o app antes de copiar dados ou remover um pendrive.

Preparar um texto, escolher Ensaio neste monitor ou um datashow em modo estendido e clicar Iniciar apresentação. Usar Apresentar para enviar o bloco escolhido. “Salvar texto” confirma gravação local; fechar e reabrir recupera o texto salvo. O protótipo ainda não tem salvamento automático. Editar o rascunho não altera a projeção. Esc na projeção fecha a saída. Uma tela usa ensaio local, sem abrir saída em tela cheia sobre os controles.

A importação de Bíblia em `.sql` está planejada para a etapa 6. O usuário poderá cadastrar traduções obtidas gratuitamente e usar o conteúdo offline após a importação. O protótipo atual ainda não implementa esse fluxo e não inclui Bíblia pré-carregada.

## Estado e limites

Windows e Linux são plataformas do MVP. O ZIP Windows não tem assinatura de código. A homologação em máquinas limpas de ambos os sistemas e com monitores físicos ainda está pendente. Matriz Linux inicial: Ubuntu 24.04 LTS e Mint 22 x64, X11 ou XWayland; Wayland nativo não é alvo desta versão.

Ver [plano](docs/plano-de-desenvolvimento.md), [registro de execução](docs/registro-de-execucao.md) e [roteiro de homologação](docs/etapa-1-validacao.md).


## Uso do protótipo Linux

No AppImage, conceder permissão de execução pelo gerenciador de arquivos ou `chmod +x arquivo.AppImage`, e abrir. A pasta `data` fica ao lado do arquivo AppImage original; mover o aplicativo exige mover os dados juntos. Não são salvos dentro da montagem temporária.

Sem FUSE, usar o tar.gz: extrair por completo para pasta gravável e abrir `zamar-sync`. Alternativamente, testar o AppImage com `--appimage-extract-and-run`; manter o arquivo original no mesmo lugar para preservar a localização de dados. O pacote exige as bibliotecas normais de uma distribuição desktop homologada e permissões de execução no volume.

No Linux, o programa seleciona X11 para controlar o monitor de projeção. Em sessão Wayland, precisa de XWayland disponível; se ausente, usar uma sessão X11. Não adicionar `--no-sandbox`, instalar serviços ou alterar permissões do sistema como solução padrão. Ambientes que exijam isso devem constar como incompatíveis até correção e homologação.

Para testar os artefatos Linux: após `npm run pack:linux`, executar `ZAMAR_SMOKE_FORMAT=appimage npm run test:electron` para extração automática sem FUSE e `ZAMAR_SMOKE_FORMAT=tar npm run test:electron` para o tar.gz. Cada execução usa uma cópia temporária e remove somente seus próprios dados ao terminar.


## Testar a experiência atual

Use os pacotes com versão 0.3.1 em `release` ou `npm start`. Não copie dados reais para o teste; use uma pasta nova ou um backup.

Escolha um exemplo na biblioteca, prepare um bloco e use Apresentar na barra inferior. A busca filtra os exemplos. Adicionar conteúdo preparado cria uma programação desta sessão, com reordenação e remoção. Selecione um item para carregar uma cópia na preparação. Para persistir o corpo do rascunho, use Salvar texto; títulos e programação não são salvos nesta versão.

Confira o [roteiro de voluntários da etapa 2](docs/etapa-2-experiencia.md). A importação bíblica e a transposição de cifras ainda não estão disponíveis. O botão da Bíblia explica o fluxo planejado.


## Backup e restauração — 0.3.1

Abra Configurações, salve seu rascunho e use Criar backup para escolher um arquivo `.zamar-backup`. Para recuperar, use Restaurar backup e confirme a substituição. A aplicação cria uma cópia dos dados atuais antes da restauração e informa onde ela foi salva. A apresentação é encerrada e o conteúdo não volta automaticamente ao datashow.

A atualização reconhece o rascunho das versões anteriores e migra o banco com cópia prévia. Feche a versão antiga antes de abrir a nova e preserve sua pasta `data`. A limpeza de releases remove somente artefatos antigos; `release/data` é preservada. Biblioteca musical persistente será integrada à interface na etapa 4.

Detalhes e limites em [dados e recuperação](docs/etapa-3-dados.md).

A pasta release contém apenas os pacotes gerados 0.3.1 para distribuição e seus hashes, além das pastas de teste atuais e dos dados preservados. Para limpezas futuras após gerar e conferir os arquivos SHA-256, usar `node scripts/clean-release.cjs`.


## Modo apresentador e datashow

Com uma tela, selecione Ensaio neste monitor e Iniciar apresentação. Apresentar e Tela preta alteram somente a simulação, mantendo os controles visíveis. Para usar o datashow, conecte-o em modo estendido (Windows: Win+P → Estender; Linux: saídas independentes nas configurações de telas) e selecione a saída externa. O modo espelhado mostra a mesma imagem nas duas telas. “Editar conteúdo” abre o editor durante a apresentação, sem alterar o conteúdo ao vivo; Esc ou Encerrar apresentação encerra a sessão.

Ver [correção do modo apresentador](docs/ajuste-modo-apresentador.md).
