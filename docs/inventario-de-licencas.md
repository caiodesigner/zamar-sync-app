# Inventário inicial de conteúdos e licenças

Atualização: 18/10/2026. Este inventário distingue escolha técnica de permissão de redistribuição comprovada. Na etapa 0 nenhum ativo externo foi incorporado. A execução seguinte instalou dependências de software e gerou seu inventário, sem incorporar texto ARA, imagens ou arquivos de fonte externos.

| Item | Origem e escolha | Situação | Condição para empacotar |
| --- | --- | --- | --- |
| Bíblias cadastradas pelo usuário | Arquivos `.sql` obtidos pelo usuário; tradução e origem registradas no cadastro | Nenhum texto bíblico real distribuído pelo projeto | Sem exigência de obtenção de licença ARA na etapa 0.3; fluxo local não inclui publicação automática |
| Fonte da interface e projeção | Inter, projeto oficial rsms/inter; SIL OFL 1.1 | Fonte candidata verificada na origem; binário ainda não selecionado | Fixar versão, preservar copyright e licença do arquivo efetivamente distribuído, sem modificar a fonte inicialmente |
| Músicas de demonstração | Texto original descrito na especificação da etapa 0 | Sem repertório de terceiros incluído | Manter demonstrações originais; não acrescentar letras comerciais sem autorização |
| Letras e cifras do usuário | Cadastro ou importação local pelo operador | Não compõem a biblioteca distribuída pelo projeto | Preservar autoria informada; não publicar ou sincronizar automaticamente |
| Fundos | Cor sólida gerada pela interface | Nenhuma imagem externa selecionada | Imagens futuras precisam de origem e licença registradas |
| Ícones | Ainda não selecionados | Pendente de escolha na etapa de interface | Selecionar conjunto com licença compatível e registrar versão e atribuição |
| Dependências de software | Versões instaladas e fixadas pelo lockfile | Inventário gerado em dependencias-e-licencas.md; avisos incluídos no pacote técnico | Manter o inventário e os avisos atualizados a cada alteração do pacote |
| Código próprio | Projeto do usuário | Licença de distribuição do projeto ainda não definida | Decidir antes de publicar código ou distribuir o produto a terceiros |

## Evidências consultadas

- A [página institucional da ARA](https://www.sbb.org.br/a-biblia-sagrada/a-biblia-em-portugues/joao-ferreira-de-almeida/almeida-revista-e-atualizada) identifica a segunda edição de 1993. Isso comprova a identificação da edição; não fornece, por si só, autorização ao Zamar Sync para redistribuir o texto.
- O [anúncio institucional do aplicativo SBB](https://www.sbb.org.br/artigos/sbb-lanca-novo-aplicativo-biblia-sbb) distingue ARA 1993 de NAA 2017. A disponibilidade em outro aplicativo não comprova permissão de inclusão neste projeto.
- O [repositório oficial da Inter](https://github.com/rsms/inter) informa a licença SIL OFL. A licença do arquivo de fonte efetivamente escolhido deve acompanhar a distribuição.
- O [texto oficial da SIL OFL](https://openfontlicense.org/) é referência para conferir as condições de inclusão da fonte.

## Encerramento de LIC-ARA-001 por alteração de escopo

**Estado:** encerrada como requisito removido, sem obtenção ou alegação de autorização. O usuário retirou a necessidade de licenciamento ARA para concluir 0.3 e solicitou cadastro local de Bíblias em `.sql`.

A tarefa 0.3 está concluída como inventário de conteúdos e componentes distribuídos. O aplicativo não terá ARA obrigatoriamente pré-carregada; o usuário poderá importar um arquivo compatível sem apresentar documento de autorização. Origem e notas de uso são metadados opcionais. Gratuidade de obtenção não é declaração de redistribuição livre, e nenhum texto de terceiros foi incorporado por esta mudança.

## Componentes da etapa 1

O inventário de software instalado está em [dependencias-e-licencas.md](dependencias-e-licencas.md), gerado a partir do lockfile. Os avisos de React, React DOM e Scheduler acompanham o pacote; Electron e Chromium incluem seus avisos. A interface usa fontes do sistema neste protótipo, sem redistribuir Inter.

A [minuta anterior](solicitacao-autorizacao-ara.md) é mantida apenas como histórico, sem envio e sem constituir próximo passo obrigatório. Ver [contrato de importação SQL](importacao-biblia-sql.md).


## Inventário efetivo da entrega 1.0.0

- React 19.3.1, React DOM 19.3.1 e Scheduler 0.28.0: avisos MIT preservados em THIRD_PARTY_NOTICES.txt.
- Electron 44.9.0 e componentes do runtime: LICENSE.electron.txt e LICENSES.chromium.html acompanham os pacotes. Node/SQLite são os incluídos no runtime, sem instalação separada pelo operador.
- COMPONENTS.json registra 351 componentes fixados pelo lockfile, distinguindo aplicação, runtime Electron e ferramentas de compilação. O inventário completo do desenvolvimento continua em dependencias-e-licencas.md.
- Não foram incluídas a fonte Inter, uma Bíblia ARA ou imagens/letras de terceiros. Fontes de apresentação usam as famílias disponíveis no sistema com fallback; símbolos e estilos do app são código da interface. O ícone de empacotamento padrão do Electron foi mantido.
- O metadado do código próprio continua UNLICENSED, conforme o projeto. Nenhuma licença aberta foi atribuída automaticamente por esta entrega.
- BUILD-MANIFEST.json vincula os arquivos compilados, guias e inventário a seus hashes e à versão 1.0.0. Arquivos de usuários não integram os pacotes distribuídos.
