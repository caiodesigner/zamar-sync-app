# Biblioteca Encontro

Catálogo extraído do PowerPoint fornecido pelo usuário. Contém **232 registros**, preservando versões repetidas, **977 slides com texto** e quatro slides vazios registrados separadamente. A contagem representa registros extraídos, não 232 composições distintas certificadas.

## Arquivos

- `songs.json`: catálogo importável `zamar-song-library`, versão de formato 1. Cada música usa os campos do domínio `Song` do aplicativo: `id`, `title`, `author`, `archived`, `sections` e `sequence`, acrescidos de origem e revisão. Sem cifras presumidas e sem autores inventados.
- `source-slides.json`: texto normalizado de todos os slides na ordem real da apresentação, inclusive títulos originais e slides vazios, para auditoria.
- `REVISAO.md`: 36 registros sinalizados por divisão/título inferido, títulos repetidos ou possíveis sequências de músicas.
- `REFERENCIAS.md`: consultas externas pontuais para identificação; nenhum texto externo foi incorporado ao catálogo.

Os textos são extraídos do conteúdo textual dos slides, sem notas do apresentador, imagens, OCR, fundos ou formatação visual. Quebras explícitas de linha e repetições são preservadas. Espaços horizontais consecutivos e espaços nas extremidades são normalizados. Cada slide com letra vira uma seção, e a sequência mantém sua ordem. Títulos reconhecidos são separados da letra e preservados na origem. Na abertura do slide 113, o número 28 antecede uma frase da letra e somente esse prefixo foi removido.

Os IDs são determinísticos por posição na apresentação, usando o namespace deste catálogo. Não use esse gerador específico para outro PowerPoint: seus limites editoriais foram definidos para o arquivo Encontro. Ao reordenar/inserir slides, revise os IDs antes de importar; estabilidade de identidade entre decks editados não é garantida.

## Importar no aplicativo

1. Abrir a versão atual pelo código (`npm start`) ou por um pacote regenerado depois desta melhoria.
2. Clicar em **Importar texto ou cifra → Selecionar biblioteca JSON**.
3. Selecionar `library/encontro/songs.json` (também pode copiar esse arquivo para outro computador).
4. Expandir as músicas para conferir letras, slides e alertas. Selecionar individualmente ou usar **Selecionar todas disponíveis**.
5. Marcar a confirmação do lote e clicar em **Importar N músicas selecionadas**.

Todos os registros começam com revisão pendente. A seleção é explícita; nenhuma música é instalada ou cadastrada automaticamente. O catálogo pode ser editado em JSON antes da importação para revisar títulos, textos e agrupamentos; preserve IDs e referências da sequência quando alterar seções. Marcar `review.status` como `reviewed` exige revisão humana real.

Cadastros existentes com o mesmo ID são desabilitados e preservados, inclusive se receberam edições/cifras no aplicativo. Títulos iguais com IDs diferentes aparecem como possíveis versões; o usuário decide quais selecionar. Selecionar todas inclui essas versões distintas e revisões pendentes. Esta importação não atualiza músicas existentes. Uma nova importação do mesmo catálogo não duplica seus IDs.

Um backup é criado antes do lote e todas as músicas selecionadas são gravadas em uma transação. Falhas não deixam um lote parcial. A biblioteca fica no SQLite local; a projeção ativa e as cópias em programações são preservadas. Os metadados editoriais ficam no JSON versionado; as músicas importadas usam o domínio normal de músicas do app.

Limites: catálogo UTF-8 de até 10 MiB, formato 1, até 2 mil músicas por arquivo e os limites de validação de cada música. Não é um backup completo nem um arquivo genérico de letras. O JSON acompanha o repositório; não está pré-carregado nos executáveis.

## Reproduzir a extração

No ambiente de desenvolvimento, com Python 3 e apenas sua biblioteca padrão:

```bash
python3 scripts/extract-pptx-library.py '/caminho/LETRAS ENCONTRO-modificado.pptx'
```

O gerador reescreve `songs.json`, `source-slides.json` e `REVISAO.md`. Preserve revisões manuais antes de executá-lo novamente; os resultados são determinísticos para o mesmo arquivo. O PPTX original não precisa estar no Git: seu nome e SHA-256 ficam registrados no catálogo. O runtime do app não depende de Python.

## Validação

`npm test` verifica o esquema, a cobertura dos 981 slides, a conservação das linhas de letra após separação explícita dos títulos, a importação completa, a seleção parcial, a proteção de edições em reimportação e o rollback de falha no meio do lote. Validação textual automática não substitui revisão musical/editorial.

Teste gráfico isolado em Linux:

```bash
npm run build
ZAMAR_SMOKE_FORMAT=dev ZAMAR_SMOKE_FLOW=library npm run test:electron
```
