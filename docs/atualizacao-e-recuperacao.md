# Atualizar, mover e retornar à versão anterior

## Atualização portátil segura

1. Na versão atual, aguarde a gravação e exporte um `.zamar-backup`. Guarde o arquivo fora da pasta do app.
2. Feche completamente o aplicativo. Copie a pasta inteira da versão anterior, incluindo `data`, para um local separado. Essa cópia fechada é o ponto de retorno; não a abra com a versão nova.
3. Extraia o pacote novo em outra pasta vazia e gravável. Não sobreponha arquivos de versões diferentes nem execute dentro do ZIP/tar.gz.
4. Com os aplicativos fechados, copie `data` da pasta atual para a pasta nova. No AppImage, `data` fica ao lado do arquivo AppImage original, fora da montagem/extração temporária.
5. Abra a versão nova e confira músicas, cifras, tons, temas, imagens, programação e Bíblia. O SQL e as imagens de origem não são necessários depois de importados.
6. A saída começa fechada/preta. Faça um ensaio e apresente explicitamente quando desejar.
7. Só depois de conferir tudo passe a usar a pasta nova. Mantenha o pacote antigo e o backup durante a validação da atualização.

Não abra simultaneamente duas versões usando a mesma pasta de dados. Para mover de computador, com o app fechado mova a pasta completa; ou restaure o backup em uma instalação portátil vazia do sistema de destino.

## Migração e retorno

O banco atual é esquema 2. Migrações dos esquemas 0/1 preservam cópia SQLite anterior em `data/backups` e ocorrem em transação. Um banco de versão futura é recusado sem conversão destrutiva. A versão atual lê envelopes de backup 1 e 2; os backups recentes usam envelope 2, com limite de 128 MiB.

Para retornar, feche a nova versão e abra a cópia completa preservada no passo 2. Não entregue um banco migrado a um executável antigo nem presuma que ele compreende formatos futuros. Se precisar de recuperação adicional, use uma versão compatível e Restaurar backup; é criada uma cópia do estado anterior à restauração. Alterações feitas somente na versão nova não aparecem automaticamente na cópia antiga.

## Conferir a distribuição

Os pacotes acompanham arquivos `.sha256`. Windows: `Get-FileHash caminho-do-pacote.zip -Algorithm SHA256` no PowerShell. Linux: `sha256sum -c caminho-do-pacote.sha256`. Compare com o manifesto entregue por uma origem confiável; hash comprova consistência com o valor fornecido, sem identificar sozinho o editor.

`BUILD-MANIFEST.json` identifica versão, lockfile, configuração, código compilado e arquivos de documentação. `COMPONENTS.json`, `THIRD_PARTY_NOTICES.txt`, `LICENSE.electron.txt` e `LICENSES.chromium.html` acompanham o pacote. A compilação é repetível com as versões fixadas; timestamps de arquivos e ferramentas podem mudar o hash do contêiner, portanto não se promete identidade binária entre recompilações.

## Assinatura e alertas do Windows

Decisão desta entrega: ZIP portátil sem assinatura Authenticode; não foram fornecidos certificados nem credenciais de assinatura. A configuração mantém `signAndEditExecutable: false`, sem assinatura automática. Foi inspecionado o diretório de certificados do PE entregue, sem assinatura no executável principal.

Arquivos novos ou sem reputação podem gerar avisos do SmartScreen. Assinar identifica o editor, mas não garante ausência imediata de avisos; políticas como Smart App Control podem bloquear arquivos sem assinatura. Confira a origem e a política do computador, sem desabilitar proteções como procedimento padrão. Fontes: [Microsoft — reputação de aplicativos](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/smartscreen-reputation), [electron-builder v26 — Windows](https://www.electron.build/v26/docs/win/).

Assinatura futura exige uma decisão de distribuição e credenciais próprias; não é necessária para usar os fluxos offline onde a política do sistema permitir o executável. Esta avaliação encerra 10.5 sem prometer aprovação de todas as políticas de Windows. Não houve nova execução Windows pelo agente nesta entrega; as validações físicas foram encerradas conforme confirmação do usuário.
