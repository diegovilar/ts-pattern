## Introdução

Analise a implementação de TaggedError no arquivo "/home/dev/workspace/ts-pattern/src/tagged-error/TaggedError.ts" e entenda seu propósito e funcionamento.

Analise também as implementações de `Matcher` e `match` no arquivo "/home/dev/workspace/ts-pattern/src/tagged-error/handle.ts". Observe que, embora as implementações de `Matcher` e `match` estejam prontas no sentido de que devem já estar funcionais em tempo de execução, a modelagem dos seus tipos não está pronta, tendo-se utilizado apenas placeholders. É exatamente nesta modelagem TypeScript que você trabalhará.

Seu trabalho estará restrito ao diretório "/home/dev/workspace/ts-pattern/src/tagged-error". Você modificará/criará arquivos apenas nele. Entretanto, há um projeto de uma biblioteca chamada "ts-pattern" cuja implementação você pode analisar em "/home/dev/workspace/ts-pattern/src". É uma biblioteca muito rica e poderosa que utiliza várias técnicas avançadas de TypeScript. Analisá-la pode ter ajudar muito a ter idéias para resolver o que lhe pedirei a seguir.

## Seu objetivo

Você deve alterar os tipos de `Matcher.when` e `match` em "/home/dev/workspace/ts-pattern/src/tagged-error/handle.ts" para que o TypeScript reflita tem tempo de desenvolvimento o comportamento da implementação JavaScript, que já produz o esperado em tempo de execução.

O uso desejado comeá com a criação de uma instância de `Matcher` usando a factory `match`, conforme os exemplos abaixo

```ts
// Criação de `Matcher` com valor já obtido:
const something = doSomething()
const matcher = match(something)
```

```ts
// Utilização de handler com valor deferido (resultado do callback):
const matcher: Matcher = match(() => doSomething())
```

O matcher infere os possíveis tipos do valor recebido ou do retorno do callback que
lhe foi passado. Seu método `when` utiliza esse conhecimento para determinar os
handlers possíveis e/ou obrigatórios que deve receber.

Há 3 tipos macro de handlers possíveis:
- `TagHandler`: tratam especificamente instâncias de `TaggedError` inferidos pelo matcher;
- `ErrorHandler`: trata qualquer instância de `Error`;
- `ValueHandler`: trata qualquer valor inferido, excluindo-se instâncias de `Error`.

O método `when` recebe um objeto cujas chaves podem ser:
- "error": opcional, esta chave pode conter apenas `ErrorHandler`;
- "value": opcional, esta chave pode conter apenas `ValueHandler`;
- "[tag]": um `TagHandler` associados à tag de cada instâncias de `TaggedError` inferida pelo matcher.

**IMPORTANTE**: Se o matcher inferir instâncias de `TaggedError`, o TypeScript **DEVE** obrigar que um handler para cada tag seja fornecido. A exceçào é se a chave `error` for fornecida, pois seu `ErrorHandler` funciona como um catch-all, tornando opcional fornecer handlers para cada tag (embora o auto-complete ainda deva estar disponível para as tags).

Os handlers podem ser callbacks ou constantes com comportamentos pré-definidos.

Se forem callbacks:
- Para `TagHandler`, seu callback sempre recebe como argumento a instância da tag que representa;
- Para `ErrorHandler`, seu callback sempre recebe como argumento um `Error`;
- Para `ValueHandler`, seu callback sempre recebe como argumento o valor com os tipos inferidos pelo matcher, excluindo-se `Error`.

Se forem constantes:
- Para `TagHandler` e `ErrorHandler`, a constante "null" significa que o valor `null` é produzido (equivalente a fornecer um callback do tipo `() => null`) e a constante "throw" significa que o erro é lançado (equivalente a fornecer um callback do tipo `() => never`);
- Para `ValueHandler`, a constante "null" significa que o valor `null` é produzido (equivalente a fornecer um callback do tipo `() => null`) enquanto que "pipe" indica que o callback é uma função identidade, retornando o argumento recebido (equivalente a fornecer um callback do tipo `(v) => v`).

**IMPORTANTE**: A implementação de `when` considera que a omissão da chave `value` tem o mesmo efeito de fornecê-la como "pipe", ou seja, o tipo resultante da invocação de `when` deve incluir os tipos inferidos pelo matcher (excluindo-se `Error`).

**IMPORTANTE**: `when` deve inferir os possíveis resultados de sua invocão observando o valor passado ao matcher e os handlers que recebeu. Ou seja, o tipo do seu retorno é uma união de todos os tipos inferidos dos retornos dos handlers forncedios (incluindo-se os implicados pelos uso das constantes citadas acima).

## Forma de trabalho

Após analiser os arquivos relacionados acima, assim como quaisquer outros que ache necessário, você deve traçar um plano de como prosseguir para tentar atender ao objetivo. Este é um problema complexo e você provavelmente precisará testar múltiplas abordagens até conseguir obter sucesso. Não se frustre, e não se preocupe que eu não me frustrarei com a demora e as falhas que com certeza ocorrerão durante suas tentativas. Concentre-se em trabalhar e não perca tempo me pedindo desculpas.

Para te ajudar a manter um contexto do que você tem que fazer, as abordagens tentou e as que falharam, bomo como os progressos ou regressos ocorridos, quero que você mantenha um diário da sua atividade. Crie o arquivo "/home/dev/workspace/ts-pattern/src/tagged-error/diario.md". Começe registrando nele, da forma que for melhor para você consumí-lo depois, o que é o seu objetivo, bem como suas anotações sobre a implementação atual que observou. Registre nesse diário também qualquer técnica ou utilitário encontrado no código de "ts-pattern" que ache que lhe será útil para atingir o objetivo. Cada vez que for tentar uma abordagem, resuma-a com mais uma entrada neste arquivo, dando-lhe um identificador único. Após testar cada abordagem, registro no diário o resultado, incluindo anotações sobre o que deu certo ou errado. Isto pode te ajudar relembrar o que já tentou, o que fez de certo ou errado, e então auxiliar a conceber abordagens melhores. Leia este diário quando achar conveniente para reordanizar seus pensamentos quando estiver frustrado com falhas.

## Verificação do resultado

Utilize o comando xxxxxxxxxx para capturar o output to TypeScript. Ele te apontará erros. A tarefa só estará concluída quando nenhum erro mais for apontado.

Existem 2 arquivos que criei que servem como exemplo e verificação do resultado esperado: "/home/dev/workspace/ts-pattern/src/tagged-error/examples.ts" e "/home/dev/workspace/ts-pattern/src/tagged-error/examples-verification.ts". Não altere estes arquivos, mas os consulte. Ele servem para validar sua implementação mas também te dão uma boa visão dos casos de uso de `match`.

Agora pode começar.