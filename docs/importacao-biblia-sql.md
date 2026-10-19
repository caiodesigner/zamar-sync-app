# Cadastro e importação de Bíblia em arquivo SQL

## Objetivo e escopo

Permitir ao usuário cadastrar gratuitamente no aplicativo uma Bíblia obtida em arquivo `.sql`, inclusive ARA quando compatível. A obtenção do arquivo acontece fora do app, pela fonte escolhida pelo usuário. Não haverá serviço pago, conta, API remota ou download obrigatório para realizar a importação.

Este requisito substitui a inclusão obrigatória de uma ARA no pacote. Nenhuma Bíblia real precisa acompanhar a distribuição. A obtenção de licença ARA deixa de bloquear a etapa 0.3. A documentação de origem e condições de uso, quando disponível, pode ser registrada sem exigir documento de autorização para importar.

A gratuidade do download não define por si só as condições de redistribuição. O fluxo é de cadastro local do arquivo fornecido pelo usuário, sem publicação ou compartilhamento automático.

## Fluxo do operador

1. Abrir “Bíblias” e selecionar “Cadastrar Bíblia” → “Importar arquivo .sql”.
2. Selecionar o arquivo local. Informar nome, abreviação, idioma e edição; permitir origem/URL e notas de uso opcionais. Não abrir a URL automaticamente.
3. Detectar o esquema e mostrar a tabela e colunas identificadas. Se necessário, oferecer mapeamento de livro, capítulo, versículo e texto.
4. Conferir a prévia com amostras do início, meio e fim, quantidade de livros, capítulos e versículos, além dos avisos de numeração.
5. Corrigir o mapeamento ou cancelar. A prévia não altera dados existentes.
6. Confirmar a importação. Mostrar progresso e permitir cancelamento até a confirmação final da transação.
7. Concluir o cadastro, oferecer “Definir como padrão” e abrir uma referência para conferência.

Sem Bíblia cadastrada, mostrar a ação de importação e permitir continuar usando letras, cifras e programação. Arquivos já baixados devem ser importáveis com a rede desligada.

## Contrato mínimo de compatibilidade

A extensão `.sql` não define um esquema universal. O MVP aceita dumps textuais UTF-8, com BOM opcional e finais de linha LF ou CRLF, contendo definições simples de tabelas e inserções de valores literais.

- Reconhecer declarações simples de criação de tabela apenas para obter nomes e ordem de colunas; não executar essas declarações.
- Extrair inserções com lista explícita de colunas ou com ordem determinada pela tabela declarada, incluindo múltiplas linhas de valores.
- Aceitar números inteiros e strings entre aspas simples, com escape de aspa duplicada. Nomes de tabela e coluna simples podem estar sem aspas, entre aspas duplas ou crases.
- Ignorar apenas comentários e delimitadores de transação reconhecidos. Comentários não devem ser confundidos com texto dentro de strings.
- Rejeitar comandos, expressões, funções, referências externas, subconsultas ou sintaxe fora do subconjunto documentado. Não tentar executar para descobrir se funciona.
- Não prometer compatibilidade com qualquer dump MySQL, PostgreSQL ou SQLite. Dialetos e escapes adicionais exigem adaptador documentado e testes antes de serem aceitos.
- Limite inicial de arquivo: 50 MiB; até 100 mil registros de versículos e até 20 mil caracteres por versículo. Aplicar limites também durante a leitura e o processamento, com tempo máximo e cancelamento.

### Esquemas inicialmente suportados

| Perfil | Dados de entrada | Mapeamento |
| --- | --- | --- |
| Tabela única | Uma linha por versículo, com livro, capítulo, número do versículo e texto | Associar as quatro colunas na prévia |
| Livros e versículos | Tabela de livros com identificador/nome e tabela de versículos referenciando o identificador do livro | Associar identificador, nome, relacionamento e colunas de conteúdo |

A detecção sugere nomes comuns, mas o usuário confirma o mapeamento. Livro numérico só pode ser convertido por ordem canônica após confirmação explícita. Nomes ou abreviações ambíguos exigem correção. Múltiplas traduções no mesmo dump não são aceitas no MVP: orientar exportar uma tradução por arquivo.

Exemplo sintético de dados reconhecidos: livro “João”, capítulo 3, versículo 16, texto “Conteúdo de demonstração”. Saída: um registro interno vinculado à tradução cadastrada e recuperável por “Jo 3:16”. Uma amostra isolada pode ser usada em testes, mas a importação de produção deve apresentar a cobertura real e exigir confirmação explícita quando o conteúdo estiver incompleto.

## Validação e tratamento de erros

- Metadados obrigatórios: nome, abreviação e idioma. Edição pode ser “Não informada”.
- Livros normalizados para identificadores estáveis; preservar os nomes informados como metadados.
- Capítulo e versículo devem ser inteiros positivos, e o texto não pode estar vazio.
- Duplicata de livro/capítulo/versículo dentro da mesma tradução bloqueia a confirmação, com exemplos dos registros afetados.
- Lacunas e contagens divergentes devem aparecer na prévia. Não preencher ou reescrever texto automaticamente; conteúdo parcial só é confirmado com indicação explícita, armazenada no cadastro.
- Hash idêntico a arquivo já importado gera aviso e evita duplicação acidental.
- Uma tradução já existente oferece cancelar, cadastrar cópia identificada ou substituir após confirmação e backup. Não usar apenas o título como identidade.
- Instrução SQL não suportada indica tipo, linha e motivo da rejeição; fornecer orientação de exportação compatível.
- Erro de codificação ou arquivo acima do limite é informado antes da gravação.
- Falta de espaço, cancelamento ou falha de validação elimina os dados temporários e preserva o banco ativo.

## Processamento e persistência

Tratar o arquivo como dados não confiáveis. Usar um analisador léxico/sintático do subconjunto aceito, em processo ou worker com limites de recursos. Expressões regulares isoladas não são suficientes para separar comandos, comentários e strings corretamente.

Nunca enviar o script importado para `exec`, linha de comando, shell ou conexão SQLite ativa. Não permitir anexar bancos, carregar extensões, criar gatilhos ou acessar caminhos indicados no arquivo. Inserir apenas os registros normalizados pelo aplicativo, com consultas parametrizadas.

Preparar os dados em área temporária, validar, construir índices e confirmar a importação de forma transacional. Separar banco bíblico e biblioteca musical para que a importação não possa modificar letras ou cifras.

Salvar tradução, metadados, cobertura, hash do arquivo e versículos localmente. Depois de importar, o arquivo `.sql` original pode ser removido sem afetar a consulta. Backup completo deve incluir Bíblias cadastradas e a tradução padrão; restauração e atualização não podem exigir novo download.

Programações usam identificador estável da tradução e snapshot dos trechos. Ao substituir ou excluir uma tradução, preservar apresentações preparadas e informar referências afetadas.

## Subtarefas da tarefa 6.1

As subtarefas detalham 6.1; não são novas etapas principais.

- [x] **6.1.a — Cadastro e estados vazios:** criar fluxo, campos, seletor `.sql` e mensagens. Conclusão: operador consegue selecionar arquivo sem alterar a biblioteca.
- [x] **6.1.b — Leitor restrito:** implementar parser e limites, com arquivos sintéticos. Conclusão: ler perfis documentados e rejeitar comandos e sintaxes fora do contrato sem executá-los.
- [x] **6.1.c — Detecção e mapeamento:** identificar tabelas e colunas e normalizar livros. Conclusão: ambos os perfis produzem registros equivalentes e ambiguidades são apresentadas.
- [x] **6.1.d — Prévia e validação:** mostrar cobertura, amostras, duplicatas e erros. Conclusão: cancelamento não modifica dados; conteúdo parcial exige confirmação.
- [x] **6.1.e — Persistência transacional:** importar, indexar, selecionar padrão e tratar substituição. Conclusão: reabrir mantém tradução e falhas não deixam importação parcial.
- [x] **6.1.f — Verificação integrada:** testar offline, arquivo removido após importação, restauração, caracteres especiais, comandos proibidos e limites. Conclusão: busca e projeção funcionam com os dados cadastrados, sem rede ou execução do script original.

## Critérios de aceite finais

O usuário importa gratuitamente um `.sql` compatível, confere a prévia e pesquisa/projeta os versículos depois de fechar e reabrir o aplicativo, com rede desligada e sem o arquivo original. Arquivos incompatíveis ou malformados geram explicação e preservam os dados. Implementado na versão 0.6.0. Consulte [entrega da etapa 6](etapa-6-biblia-offline.md) para limites efetivos, cobertura não certificada, testes e pacotes.
