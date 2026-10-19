# Ensaio físico de duas horas — tarefas 1.4 e 9.3

Estado: encerrado por confirmação explícita do usuário em 18/10/2026; ver [aceite](aceite-usuario.md). O agente não executou esse ensaio físico. As tabelas abaixo são o protocolo preservado, sem medições preenchidas artificialmente.

## Preparar o cenário

1. Usar cópia dos pacotes atuais e biblioteca sintética, sem alterar dados reais.
2. Registrar sistema, distribuição/sessão Linux, CPU, RAM, SSD, versão do app, formato do pacote, resoluções e escalas nativas de cada tela. Repetir nos sistemas previstos pelo plano.
3. Conectar monitor/datashow real em modo Estender. Confirmar que os controles ficam somente na tela do operador.
4. Desligar Wi-Fi e desconectar Ethernet antes da primeira abertura. Registrar a condição real; um contexto de teste offline ou monitor simulado não substitui esse passo.
5. Abrir o app sem Java/Node instalado no computador do operador e sem flags que desabilitem sandbox. Validar também o caminho portátil com espaços e acentos.
6. Importar Bíblia sintética local, imagem e música com cifras. Preparar programação com letra, cifra e passagem bíblica. Registrar versão/data de cada pacote.

## Executar sem reiniciar por 120 minutos

| Intervalo | Ação | Registrar |
| --- | --- | --- |
| 0–15 min | Apresentar letras, avançar/voltar e buscar conteúdos | Erros, latência perceptível, leitura no datashow |
| 15–30 min | Transpor cifras, trocar temas e proporções | Alinhamento, cortes, diferença prévia/saída |
| 30–45 min | Buscar e apresentar Bíblia | Referência, atribuição e legibilidade |
| 45–60 min | Editar durante apresentação e aguardar autosave | Saída preservada, estado da gravação |
| 60–75 min | Ocultar texto, tela preta, teclado e reordenar programação | Controles acessíveis e privacidade |
| 75–90 min | Desconectar e reconectar a saída, retomando explicitamente | Saída suspensa, controles preservados, retorno em preto |
| 90–105 min | Repetir fluxo com escalas nativas diferentes | Posicionamento, foco e legibilidade |
| 105–120 min | Exportar backup e continuar apresentando | Integração, falhas e memória final |

Registrar memória pelo gerenciador de tarefas do sistema a cada 15 minutos, usando a mesma métrica e os mesmos processos. Uma oscilação isolada não demonstra vazamento; analisar tendência e estabilidade após repetições do mesmo fluxo. Registrar também erros, travamentos e desvios de protocolo.

| Minuto | Memória/métrica/processos | Fluxo | Falha/observação |
| ---: | --- | --- | --- |
| 0 | | | |
| 15 | | | |
| 30 | | | |
| 45 | | | |
| 60 | | | |
| 75 | | | |
| 90 | | | |
| 105 | | | |
| 120 | | | |

## Encerrar e decidir

1. Exportar a biblioteca, fechar e reabrir, conferindo os conteúdos confirmados.
2. Registrar duração real, falhas bloqueadoras, evolução da memória e evidências dos dois monitores.
3. Se houver falha, registrar passos para reprodução e corrigir antes de repetir. Não declarar aprovação com duração menor, monitor simulado ou somente rede bloqueada no navegador.
4. Marcar 9.3 apenas após 120 minutos válidos sem falhas bloqueadoras e sem crescimento contínuo de memória. Usar os resultados também nas pendências de 1.3, 1.4 e 9.5, sem presumir aprovação em sistemas não executados.
