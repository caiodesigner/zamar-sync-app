# Correção do modo apresentador — 0.3.1

## Problema e comportamento esperado

A versão anterior permitia abrir uma projeção em tela cheia sobre o próprio monitor do operador, mediante confirmação. Isso encobria os controles em computadores com uma única tela. Esse comportamento foi removido.

Ao iniciar uma apresentação, o aplicativo muda para uma área de controle com prévia, miniaturas, programação, monitor do conteúdo atual e comandos fixos. A biblioteca e o editor ficam recolhidos. “Editar conteúdo” retorna à edição sem alterar a apresentação; “Modo apresentador” volta à área de controle. “Encerrar apresentação” ou Esc encerra a sessão.

A referência é a separação entre a tela do apresentador e a tela do público, descrita pela [Microsoft para o PowerPoint](https://support.microsoft.com/en-us/powerpoint/present-on-multiple-monitors-and-view-speaker-notes-privately). Para exibir imagens diferentes, o computador e o datashow devem ser saídas lógicas separadas em modo estendido. No modo Duplicar, a imagem é a mesma nas duas telas, conforme a [documentação de múltiplos monitores do Windows](https://support.microsoft.com/en-us/windows/hardware/display-graphics/how-to-use-multiple-monitors-in-windows).

## Regras implementadas

| Situação | Comportamento |
| --- | --- |
| Uma tela, sem datashow | Ensaio local dentro da aplicação; nenhuma janela extra ou tela cheia |
| Datashow separado em modo estendido | Controles no monitor do operador e janela pública no datashow |
| Seleção do monitor que contém os controles | Converter a solicitação em ensaio local, inclusive pela API interna |
| Monitores com coordenadas espelhadas ou sobrepostas | Não oferecer como saída separada; solicitação direta vira ensaio |
| Janela do operador atravessa a área da saída externa | Suspender a saída para manter os controles acessíveis |
| Datashow removido ou topologia passa a conflitar com controles | Ocultar e fechar a saída, manter os controles e exigir retomada explícita |
| Novo monitor conectado durante ensaio | Atualizar a lista; operador encerra o ensaio e seleciona a saída externa para iniciar |
| Tela preta no ensaio | Alterar apenas o painel de simulação; manter comandos visíveis |
| Tela preta na projeção externa | Alterar só a janela do público; manter controles no computador |

A elegibilidade da saída usa o monitor atual do operador e as áreas efetivas da janela, independentemente de qual tela é marcada como principal no sistema. A janela externa é mostrada sem tomar o foco dos controles. Há nova validação antes de exibi-la e durante mudanças de monitor, geometria e posição do operador.

O estado público distingue `closed`, `rehearsal` e `external`. `outputOpen` indica uma sessão de apresentação ativa, inclusive ensaio; não implica necessariamente uma segunda janela. Ao reiniciar ou restaurar backup, o modo volta a encerrado, sem exibição automática.

Configurações espelhadas podem aparecer como uma única tela ou com áreas coincidentes. O programa usa a geometria fornecida pelo sistema; adaptações físicas que duplicam um sinal sem criar uma saída lógica independente exigem configuração adequada do equipamento. A separação de conteúdo depende de modo estendido, não apenas da presença de um cabo HDMI.

## Como testar com um monitor

1. Abrir a versão 0.3.1 e escolher “Ensaio neste monitor”.
2. Preparar uma letra ou exemplo e clicar “Iniciar apresentação”.
3. Confirmar que os controles e a prévia continuam visíveis.
4. Clicar “Apresentar” e conferir o painel “Tela do ensaio”.
5. Clicar “Tela preta”: somente esse painel muda.
6. Usar “Editar conteúdo”, alterar o rascunho e conferir que o conteúdo apresentado permanece até novo comando.
7. Voltar a “Modo apresentador” e usar “Encerrar apresentação” ou Esc.

## Como usar com datashow

1. Conectar o datashow e configurar telas estendidas. No Windows, usar Win+P → Estender. No Linux, configurar saídas independentes nas preferências de telas.
2. Manter o aplicativo no monitor do operador e selecionar o datashow na lista de destino.
3. Iniciar a apresentação: a saída externa começa em preto e o computador mantém a área de controle.
4. Usar Apresentar, miniaturas e Tela preta pelos controles no computador.

## Verificação

- Quatro testes novos: tela única, ensaio explícito, separação de telas sem depender de monitor principal, áreas negativas, espelhamento/sobreposição e solicitações inválidas. Com os testes anteriores, são 17 casos unitários.
- Teste gráfico real de ensaio: confirma que há somente uma janela, sem fullscreen no operador, e que tela preta mantém os controles visíveis.
- Solicitação direta ao monitor do operador validada como ensaio, sem diálogo que permita cobrir os controles.
- Saída externa exercitada com monitor simulado, com fullscreen/exibição nativa desabilitados apenas no teste para não cobrir o monitor físico do ambiente. Esse teste verifica roteamento, isolamento, estado e desconexão, não homologação de hardware.
- Testes anteriores de rascunho, backup/restauração e recuperação em preto preservados.

A homologação física Windows/Linux com datashow e a avaliação de voluntários seguem pendentes nas etapas correspondentes. A correção não inicia nem conclui a etapa 4: permanecem 10/44 tarefas principais concluídas e 34 pendentes.


## Pacotes 0.3.1

ZIP Windows, AppImage e tar.gz Linux gerados, com integridade e hashes conferidos.

| Arquivo em release | Bytes | SHA-256 |
| --- | --- | --- |
| zamar-sync-0.3.1-win-x64.zip | 155435152 | `3980bb4fa86b6265562250b4bcd698a34089876c2ade8dc47c805294c32cb063` |
| zamar-sync-0.3.1-linux-x86_64.AppImage | 127466912 | `f17156254cc6e64e67a99b2816808fa6ef75eb09a77d6d1a24e9e7321d9b7bc5` |
| zamar-sync-0.3.1-linux-x64.tar.gz | 121208267 | `695fce4ae073c457d6ae2dd897809bdf52283796b3b828f7dbf18f6b6b4897f7` |


Verificação final: ensaio local, solicitação ao monitor do operador, tela preta, gravação/reabertura e backup/restauração aprovados no pacote em pasta, AppImage extraído e tar.gz. Um teste de reabertura executado durante o empacotamento teve timeout; a repetição no pacote finalizado e os testes dos outros formatos passaram, sem reprodução do problema. Execução Windows e datashow físico ainda dependem de homologação.

Release limpa: mantida apenas a versão 0.3.1 e hashes, além das pastas atuais e dados existentes.
