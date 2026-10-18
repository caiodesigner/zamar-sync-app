# Etapa 1 — Base técnica e validação

> Artefatos deste relatório são históricos. Os pacotes disponíveis em release foram atualizados para 0.3.1; versões anteriores foram removidas na limpeza solicitada.

Data: 18/10/2026. Protótipo 0.1.0, não homologado para uso em culto.

Revisão de escopo: etapa 0 concluída; obtenção de licença ARA removida como dependência. Cadastro de Bíblias `.sql` planejado para a etapa 6, ainda sem implementação no protótipo.

## Implementação

- Electron 44.9.0, TypeScript 7.0.2, React 19.3.1, Vite 8.3.4 e electron-builder 26.15.3, com lockfile.
- SQLite pelo módulo `node:sqlite` já incluído no Electron. Verificado no runtime real: Node 24.22.0 e SQLite 3.53.4. Não foi necessário instalar driver nativo separado.
- Janela do operador e janela de projeção independentes; abertura da saída em preto; ensaio local no monitor do operador, sem fullscreen sobre os controles.
- Edição privada até o comando de apresentação; tela preta sem perder conteúdo; fechamento da saída por Esc.
- Seleção de monitor, tratamento de remoção e alteração de geometria; reconexão exige ação do operador.
- Gravação explícita de texto de demonstração e recuperação após reinício em SQLite. Ainda não implementa entidades musicais ou salvamento automático.
- Pasta de dados junto ao executável em ZIP/tar.gz; no AppImage usa a localização original indicada por APPIMAGE, fora da montagem/extração temporária. Caches de sessão também locais; erro de abertura orienta usar pasta gravável.
- Linux usa backend X11 explicitamente; em sessão Wayland requer XWayland. Wayland nativo não está homologado nesta versão.
- Instância única, sandbox das interfaces, isolamento de contexto, Node desabilitado na interface, comandos de alteração exclusivos do operador e validação de texto.
- Requisições remotas e permissões bloqueadas; interface e recursos carregados do pacote local.
- Avisos React e componentes associados incluídos em THIRD_PARTY_NOTICES.txt; avisos Electron e Chromium acompanham o runtime.

## Verificações realizadas

| Verificação | Resultado |
| --- | --- |
| TypeScript das interfaces e processo principal | Passou com `npm run check` |
| Compilação para produção | Passou com `npm run build` |
| Persistência SQLite em caminho com acentos | Passou; fechamento e reabertura preservam texto, acordes literais, acentos e emoji |
| Validação de payload inválido e acima de 100 mil caracteres | Passou |
| Runtime SQLite incluído no Electron | Passou, sem driver adicional |
| Pacote Linux executado em cópia temporária com espaços e acentos | Passou em sessão gráfica local |
| Reabertura do pacote preservando texto salvo | Passou |
| Interface sem `window.require` | Passou |
| Projeção aberta em preto e apresentação explícita | Passou |
| Edição do rascunho sem alterar saída | Passou |
| Comando de alteração originado da saída | Rejeitado conforme esperado |
| Tela preta e remoção de monitor simulada | Passou; saída fecha e mantém estado em preto |
| Geração de ZIP Windows x64 | Artefato gerado para homologação; não equivale a execução validada no Windows |

Os testes gráficos automatizados usam Playwright e uma cópia temporária do pacote do sistema atual (Windows ou Linux). No Linux, o teste também aceita AppImage extraído automaticamente e tar.gz. Na versão atual, a tela do operador não aceita projeção fullscreen: o teste exercita ensaio real e simula a saída externa sem fullscreen nativo. A remoção de monitor é um evento sintético, portanto não comprova o comportamento do sistema operacional durante desconexão física.

O bloqueio de solicitações remotas é implementado, mas não foi feito ensaio com a conectividade do sistema fisicamente desabilitada. A máquina de desenvolvimento tem ferramentas instaladas; não representa máquina limpa.

## Checklist para homologação Windows

Usar Windows 11 x64 com conta padrão, sem Java, Node.js ou ferramentas de desenvolvimento. Registrar versão do Windows, processador, RAM, armazenamento, escala e resolução dos monitores. Não usar este ambiente Linux como substituto dessa verificação.

- [ ] Extrair o ZIP completo numa pasta gravável com espaços e acentos.
- [ ] Desativar a rede antes da primeira abertura.
- [ ] Abrir sem instalador, privilégios administrativos ou download de componentes.
- [ ] Salvar texto, fechar, reabrir e comparar exatamente o conteúdo.
- [ ] Mover a pasta completa e confirmar persistência e abertura.
- [ ] Confirmar mensagem clara em pasta sem escrita; sem gravar em outro destino silenciosamente.
- [ ] Confirmar que segunda instância não abre concorrência sobre os dados.
- [ ] Testar uma tela: Iniciar apresentação, Apresentar e Tela preta mantêm os controles visíveis, sem janela extra.
- [ ] Testar modo estendido e recusar tela do operador ou coordenadas sobrepostas como saída externa.
- [ ] Testar dois monitores estendidos, com projeção no secundário.
- [ ] Desconectar fisicamente o secundário: saída deve fechar sem ser mostrada na tela do operador; observar eventuais movimentos transitórios de janelas feitos pelo Windows.
- [ ] Reconectar e verificar que o conteúdo não reaparece sem ação explícita.
- [ ] Testar resoluções e escalas diferentes, tela preta e Esc.
- [ ] Registrar tamanho do pacote, memória por processo e tempo de abertura; ainda não medidos em Windows.

## Matriz Linux e pacotes

Plataformas Linux iniciais: Ubuntu 24.04 LTS e Linux Mint 22, x64. Homologar X11 e, onde disponível, sessão Wayland usando XWayland. Não presumir compatibilidade com todas as distribuições. A sessão usada pelo app é X11 por configuração explícita; isso mantém o posicionamento global necessário à seleção do datashow. A documentação do [Electron sobre janelas](https://www.electronjs.org/docs/latest/api/browser-window#platform-notices) descreve as restrições de Wayland e recomenda XWayland para esse uso.

Distribuir AppImage e tar.gz, além da pasta interna linux-unpacked para teste. AppImage depende do ambiente do sistema; quando FUSE não estiver disponível, validar `--appimage-extract-and-run` e oferecer tar.gz, sem exigir instalação de FUSE. Ver [orientação oficial sobre extração](https://docs.appimage.org/user-guide/troubleshooting/fuse.html).

### Checklist de homologação Linux

Executar para cada ambiente da matriz, em conta sem privilégios, rede desligada e sem Node.js, Java, npm ou SQLite instalados separadamente.

- [ ] Abrir AppImage com permissão de execução; registrar runtime, distribuição, sessão, kernel e bibliotecas exigidas.
- [ ] Abrir AppImage com extração automática em ambiente sem FUSE, sem perder dados ao encerrar a extração.
- [ ] Extrair tar.gz e abrir executável sem FUSE ou instalação de pacotes extras.
- [ ] Salvar, fechar e reabrir em caminhos com espaços e acentos; dados fora de `/tmp` e da montagem AppImage.
- [ ] Mover o pacote e sua pasta de dados juntos e repetir consulta.
- [ ] Verificar volume sem permissão de escrita e volume sem permissão de execução, com orientação apropriada.
- [ ] Validar sandbox sem `--no-sandbox`, sem sudo e sem alterar políticas do sistema. Falhas bloqueiam homologação daquele ambiente.
- [ ] Testar instância única e permissões dos arquivos.
- [ ] Testar dois monitores, escalas, posições relativas e tela cheia em X11.
- [ ] Repetir em sessão Wayland por XWayland; registrar compositor e versão.
- [ ] Desconectar e reconectar o monitor físico: saída suspensa, operador utilizável e retomada explícita.
- [ ] Medir abertura, memória e tamanho dos pacotes, sem tratar a máquina de desenvolvimento como ambiente limpo.

## Estado das tarefas

- **1.1 concluída:** base com duas janelas implementada e exercitada no pacote Linux.
- **1.2 parcial:** ZIP Windows e pacotes Linux configurados; testes locais não substituem homologação do ZIP Windows e da matriz Linux.
- **1.3 parcial:** caminhos e regras portáteis testados; máquinas limpas Windows/Linux, offline e permissões pendentes.
- **1.4 parcial:** handlers implementados e teste sintético aprovado; testes físicos Windows, Linux X11 e XWayland pendentes.

A etapa 1 não está integralmente concluída. O próximo passo é executar a homologação acima, corrigir falhas encontradas e só então iniciar a etapa 2 de experiência e protótipo visual completo.

## Referências técnicas

- [API screen do Electron](https://www.electronjs.org/docs/latest/api/screen/): enumeração e eventos de monitores.
- [Suporte SQLite no Electron](https://releases.electronjs.org/pr/47706): correção de suporte ao módulo incluído, complementada pelo teste da versão efetivamente instalada.
- [Alvos do electron-builder](https://www.electron.build/v26/docs/targets/): distribuição portátil e arquivos ZIP.

## Artefatos desta revisão

Os arquivos de release e respectivos resumos SHA-256 devem corresponder ao código atual. A revisão anterior do ZIP Windows foi substituída; não reutilizar seu hash para este build. Consultar o registro da revisão abaixo para as verificações efetivamente realizadas.


## Verificações da revisão Windows/Linux

- Checagem de tipos e compilação aprovadas.
- Cinco casos unitários aprovados: persistência, validação e três cenários de resolução de caminho portátil.
- Teste gráfico do pacote Linux em pasta aprovado após a alteração do backend X11.
- Teste gráfico do AppImage com extração automática sem FUSE aprovado: salvamento, reabertura, caminho externo de dados, saída independente, tela preta e desconexão simulada.
- Modo AppImage montado por FUSE, execução efetiva Windows, sessões XWayland e testes físicos seguem pendentes. O teste gráfico local não comprova toda a matriz de distribuições.

- Teste gráfico do tar.gz final aprovado após extração: os mesmos cenários de persistência e projeção passaram. A primeira tentativa ocorreu antes do fim da compactação e foi descartada; a repetição usou o artefato completo.
- ZIP Windows final teve as entradas verificadas por CRC; tar.gz foi lido integralmente; arquivos de resumo SHA-256 gerados para os três artefatos.

| Artefato | Tamanho em bytes | SHA-256 |
| --- | --- | --- |
| zamar-sync-0.1.0-win-x64.zip | 154923299 | `4e12b5fe2af93512439e7c4a672fdfa07e16250c1a715dd18a20e74c60dc2f1f` |
| zamar-sync-0.1.0-linux-x86_64.AppImage | 126934000 | `5c39bcce3b39300cc1bdc21b91991a15c0e93929d97e293d3e68ffda03d4d63e` |
| zamar-sync-0.1.0-linux-x64.tar.gz | 120697824 | `0c3d91095ca99dc45a9fc043894422a5914dc9038548843ffa33d9f07eff8ca4` |
