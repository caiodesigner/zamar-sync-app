# Zamar Sync 1.0.0 — guia rápido

## Abrir sem instalar

- Windows: extraia o ZIP inteiro para uma pasta gravável e abra `Zamar Sync.exe`.
- Linux: autorize a execução do AppImage e abra-o. Sem FUSE, extraia o tar.gz inteiro e abra `zamar-sync`. Também é possível executar o AppImage com `--appimage-extract-and-run`.
- Guarde e mova a pasta `data` junto com o aplicativo. Feche o app antes de copiar dados ou retirar um pendrive. Não precisa instalar Java, Node.js ou banco.

## Apresentar em poucos passos

1. Com uma tela, escolha **Ensaio neste monitor**. Com datashow, configure as telas em **Estender** e escolha o destino externo. Windows: Win+P → Estender; Linux: configurações de telas. Duplicar/espelhar mostra a mesma imagem nas duas telas.
2. Na biblioteca, escolha uma música, texto ou passagem bíblica. Para começar, use Carregar exemplo de música ou cadastre uma música.
3. Confira o bloco na prévia. Clique em **Iniciar apresentação** e depois em **Apresentar**. Os controles permanecem na tela do operador.
4. Use setas para avançar/voltar no apresentador, **Tela preta** para interromper e **Encerrar apresentação** para finalizar.
5. **Editar conteúdo** permite corrigir a preparação sem mudar a saída ativa. A edição só chega ao datashow ao apresentar novamente.

## Letras, cifras e Bíblia

- Música: informe título, autor, seções e ordem. Uma linha em branco ou uma linha `---` separa slides. Repita um refrão pela sequência, sem copiar a letra.
- Cifras: escreva `[C]Minha [G/B]canção`. Escolha tom original, tom de apresentação e letra ou letra com cifras. Acordes desconhecidos são preservados com aviso.
- Texto/cifra em arquivo: **Importar texto ou cifra**, escolher `.txt`, `.pro` ou `.chordpro` UTF-8, corrigir a prévia e conferir. Duplicatas exigem ignorar, copiar ou atualizar explicitamente.
- Bíblia: **Bíblia → Cadastrar Bíblia**, selecionar `.sql` UTF-8 já baixado, conferir colunas e amostras e confirmar. Não há tradução pré-carregada. Consultar `Jo 3:16` ou `1 Jo 2:1-3`, pesquisar palavras ou navegar por livro/capítulo; depois apresentar.
- Programação: dê um nome e adicione os conteúdos. Cada item guarda sua própria cópia e tema. **Atualizar** busca explicitamente a versão salva na biblioteca.

## Salvar, recuperar e fazer backup

Edições válidas são salvas automaticamente após pausa de 1,2 segundo. Confira o indicador; os botões **Salvar** confirmam imediatamente. Campos inválidos e falhas preservam a última versão confirmada. O autosave não apresenta conteúdo automaticamente.

Após uma falha, use **Recuperar última edição** para preparar a última gravação automática confirmada. Conteúdos anteriores continuam na biblioteca. A saída reabre fechada/preta.

Em **Configurações → Exportar biblioteca completa** ou **Criar backup**, guarde um `.zamar-backup` fora da pasta do app. Inclui músicas, cifras, Bíblias, temas, imagens e programações confirmados. **Restaurar backup** substitui os dados após confirmação e cria cópia anterior. Para atualizar o aplicativo, siga `ATUALIZACAO.md`.

## Teclado

| Atalho | Ação |
| --- | --- |
| Ctrl+F | Revela a biblioteca e foca a busca, preservando a saída |
| Ctrl+Enter | Apresenta o bloco preparado |
| B | Alterna tela preta, fora dos campos de edição |
| O | Oculta/mostra texto, preservando o fundo, fora dos campos |
| ← / → | No apresentador, apresenta anterior/próximo; no editor, apenas prepara |
| Esc | Fecha diálogo aberto; fora dele, encerra apresentação |
| Tab / Shift+Tab / Enter | Percorre controles e ativa o selecionado |
| Alt+↑ / Alt+↓ no item da programação | Reordena o item |

## Resolver problemas

| Situação | Ação |
| --- | --- |
| Minha tela ficou com a mesma imagem do datashow | Troque Duplicar/Espelhar por Estender no sistema |
| Não aparece um destino externo | Conecte/configure uma tela separada; com uma tela use Ensaio |
| Tela preta ou texto oculto | Confira os botões Retomar conteúdo/Mostrar texto e o monitor ao vivo |
| Datashow desconectou | Reconecte, selecione o destino e retome explicitamente; a saída não volta sozinha |
| Não grava | Use pasta com escrita, confira espaço livre e o erro exibido; tente novamente após corrigir |
| Conflito de edição | Reabra a versão atual da biblioteca ou use Salvar para confirmar a substituição desejada |
| SQL recusado | Use UTF-8 e o subconjunto suportado; confira a mensagem e as colunas na prévia |
| AppImage não abre | Use tar.gz ou extração automática; confira permissão de execução e sessão X11/XWayland |
| Windows mostra alerta | O pacote não tem assinatura digital. Confira origem/hash e a política do computador; consulte ATUALIZACAO.md. Não desative a proteção como solução padrão |
| Outra instância usa os dados | Feche a outra instância antes de abrir a mesma pasta |

A versão é x64 para Windows 11 e Linux desktop Ubuntu 24.04/Mint 22. Em Wayland, a projeção depende de XWayland. Use as bibliotecas normais do sistema; não desabilite sandbox para contornar incompatibilidades.
