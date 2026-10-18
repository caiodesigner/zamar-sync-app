# Etapa 0 — Especificação técnica inicial

Data: 18/10/2026. Decisões adotadas a partir do plano e da arquitetura confirmada pelo usuário. Este documento especifica contratos; não contém implementação.

## 1. Decisões consolidadas — tarefa 0.1

| Tema | Decisão |
| --- | --- |
| Produto | Zamar Sync, apresentação local de letras, Bíblia e cifras |
| Plataformas iniciais | Windows 11 x64 e Linux x64 (Ubuntu 24.04 LTS e Mint 22); X11/XWayland no Linux |
| Stack | Electron, TypeScript, React, Vite, CSS e SQLite embarcado |
| Distribuição | Windows ZIP; Linux AppImage e tar.gz como alternativa sem FUSE; sem instalador |
| Dependências do operador | Nenhuma instalação adicional de runtime, banco ou navegador |
| Internet | Desnecessária desde a primeira execução |
| Dados do usuário | SQLite em pasta gravável ao lado do executável ou do arquivo AppImage original, fora da montagem temporária |
| Bíblia | Cadastro de traduções via `.sql` fornecido pelo usuário; dados importados persistidos localmente |
| Saída | Uma janela pública independente, além do operador e da prévia |
| Cifras | Letra ou letra com cifras na mesma saída; terceiro monitor em versão posterior |
| Atualizações | Manuais, com preservação dos dados e backup antes de migração |

O usuário informa tradução e edição no cadastro. ARA pode ser importada de arquivo compatível; o pacote do app não exige tradução bíblica pré-carregada. Não é necessário obter autorização ARA para concluir a etapa 0.3.

O MVP inclui cadastro e importação de músicas, edição por seções, sequência musical, transposição, consulta bíblica, programação, textos livres, temas básicos, atalhos, salvamento e backup. Não inclui nuvem, contas, controle remoto, vídeo, áudio ou escalas de equipes.

O modo portátil significa que toda a pasta deve ser movida em conjunto. Não significa um único arquivo executável nem compatibilidade universal. Não gravar dados do usuário dentro de arquivos empacotados do programa. Uma pasta sem permissão de escrita deve gerar orientação e escolha explícita de outra pasta.

## 2. Convenções comuns — tarefa 0.2

- Textos de importação em UTF-8; aceitar BOM e normalizar CRLF para LF.
- Identificadores internos estáveis e opacos, gerados no cadastro; títulos não são identificadores.
- Preservar acentos e caixa do conteúdo. Normalização para pesquisa não modifica o texto salvo.
- Contratos de pacote e esquema de banco têm versões independentes, começando em 1.
- Datas técnicas em UTC; datas de culto sem horário devem ser armazenadas como datas locais, sem conversão implícita.
- Operações de importação: ler → validar → mostrar prévia e avisos → confirmar → gravar em transação.
- Erro impede confirmação; aviso exige revisão, mas não deve apagar conteúdo desconhecido.
- Nenhuma falha de importação ou edição modifica o conteúdo ao vivo.
- Limites iniciais: arquivo musical até 2 MiB, título até 200 caracteres, letra até 100 mil caracteres e 500 seções por música. Pacote bíblico até 50 MiB. Limites devem ser explicados e centralizados na implementação.

## 3. Letras: formato mínimo

O editor armazena título obrigatório, autoria opcional, categorias, seções e sequência. Cada seção tem identificador, rótulo, tipo e linhas. Uma linha vazia separa blocos na importação; uma quebra simples permanece dentro do bloco.

Na importação de texto simples, o título é informado em campo separado, inicialmente sugerido pelo nome do arquivo. Conteúdo de exemplo original, criado para este projeto:

> Título: Canção de demonstração<br>
> Primeiro bloco: “Vamos juntos cantar” / “Uma nova canção”<br>
> Linha vazia<br>
> Segundo bloco: “Nossa voz vai ecoar” / “Neste lugar”

Saída esperada: duas seções, rotuladas “Parte 1” e “Parte 2”, com duas linhas cada; sequência inicial com as duas seções em ordem. O editor permite renomear a segunda para “Refrão” e repetir sua referência na sequência sem duplicar seu conteúdo.

| Entrada ou ação | Resultado esperado |
| --- | --- |
| Título ou corpo vazio | Erro de validação, sem gravação |
| Arquivo não UTF-8 | Erro com orientação para conversão, sem substituição silenciosa de caracteres |
| Espaços nas linhas | Preservados no conteúdo; não usados para alinhamento de acordes |
| Conteúdo semelhante a HTML | Texto literal, nunca interpretado como marcação executável |
| Seção removida ainda usada na sequência | Solicitar atualização das referências antes de confirmar |
| Título e autoria semelhantes aos existentes | Aviso de possível duplicata, com escolha de ignorar, copiar ou atualizar |

## 4. Cifras: subconjunto de entrada

Aceitar acordes entre colchetes, posicionados antes da sílaba correspondente. Aceitar somente as diretivas de metadados `title`, `artist` e `key`, e delimitadores `start_of_verse`, `end_of_verse`, `start_of_chorus` e `end_of_chorus`, entre chaves. Esse é um subconjunto próprio compatível com parte da sintaxe ChordPro, sem promessa de importação completa de outros aplicativos.

Exemplo de entrada de uma linha: `[C]Vamos juntos [G/B]cantar`.

Resultado estruturado esperado: texto “Vamos juntos cantar”; C ancorado antes do primeiro caractere e G/B antes do “c” de “cantar”. Transposição de +2 semitons: D e A/C#, mantendo o texto e as âncoras. Renderização sem cifras mostra apenas a letra.

- Fundamental e baixo: A a G, com sustenido ou bemol opcional.
- Qualificadores iniciais reconhecidos: vazio, m, 5, 6, 7, maj7, m7, m7b5, dim, dim7, aug, sus2, sus4, add9, 9, m9, 11 e 13.
- Acorde invertido usa uma única barra seguida de nota válida.
- Tonalidade usa nota e modo maior ou menor; alteração de tom não reescreve permanentemente o original.
- Preferência de acidentes: sustenidos ou bemóis, escolhida no editor e persistida; não inferir grafia teórica complexa no MVP.
- Âncoras internas usam índice de grafema na linha, começando em zero; acorde ao final usa o comprimento da linha. Não dividir caracteres combinados ou emojis.
- Cifras consecutivas no mesmo ponto preservam a ordem; a renderização deve reservar espaço sem alterar a letra.
- Transposição soma um deslocamento ao original; voltar ao tom original não pode acumular alterações.

| Entrada | Resultado esperado |
| --- | --- |
| `[Am7]Uma [F]canção` | Dois acordes reconhecidos, letra preservada |
| `[G/B]cantar`, +2 | A/C# antes de “cantar” |
| `[H7]texto` | Token preservado, aviso de acorde desconhecido e sem transposição dele |
| Colchete sem fechamento | Erro com linha e coluna; não importar parcialmente |
| Diretiva desconhecida | Aviso e preservação no documento de origem, sem executar ou projetar a diretiva como letra |
| Delimitadores de seção incompatíveis | Erro explicativo, com possibilidade de correção na prévia |

O formato interno preserva a entrada original e os avisos para evitar perda em futura edição. Conteúdo desconhecido deve permanecer visível ao operador na revisão.

## 5. Cadastro bíblico local por SQL

O formato de entrada do MVP será `.sql` UTF-8, conforme [contrato do importador](importacao-biblia-sql.md). O usuário obtém o arquivo previamente e o seleciona localmente; o app não exige internet para importar. Os dados são lidos como conteúdo e convertidos para o modelo interno, sem executar o script recebido.

Cada tradução armazena nome, abreviação, edição, idioma, origem informada, notas de uso opcionais, hash do arquivo e versículos por livro/capítulo/número. A validação verifica estrutura, duplicatas, numeração e consistência, sem pressupor uma contagem total universal. O cadastro final é transacional e inclui índice de busca local.

Referências como “Jo 3:16-18” selecionam o intervalo inclusivo; “1 Coríntios 13” seleciona um capítulo. Referências inexistentes e intervalos entre capítulos geram explicações sem alterar a apresentação ativa. Esquemas não suportados são rejeitados com orientação para mapeamento ou conversão.

Não há exigência de comprovação documental de autorização como campo obrigatório do importador. Não será incluído texto bíblico real para distribuir com o aplicativo por este fluxo.

## 6. Verificação desta especificação

- 0.1: escopo, exclusões, plataforma, arquitetura, persistência e portabilidade definidos.
- 0.2: formatos mínimos, exemplos de entrada e saída e erros definidos para letras, cifras e Bíblia. A especificação é a referência técnica adotada para a implementação; sua validação por software ocorrerá nas etapas correspondentes.
- 0.3: inventário e avisos dos componentes preparados. Conforme revisão de escopo, obtenção de licença ARA removida como condição. Etapa 0 concluída; a implementação do importador fica na etapa 6.

Não há código, banco ou texto bíblico integral adicionado nesta etapa.
