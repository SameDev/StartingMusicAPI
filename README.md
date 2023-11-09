# Starting Music
**PLATAFORMA DE STREAMING DE MÚSICA (PSM)**

Este é um servidor de uma API REST do sistema Starting Music, ele é um sistema que contém todas as funcionalidades de uma aplicação real de um sistema de streaming de músicas.

## Como executar?

Primeiramente dê um fork, após isso, faça o clone desse repositório no seu pc, para isso use o seguinte comando:

    git clone [link do repositório]

Após isso instale as dependências necessárias usando:

    npm install

Agora, você precisa criar um ambiente .env em node com as seguintes variáveis de ambiente:

    DATABASE_URL= url do seu banco de dados
    DIRECT_URL= url da sua conexão do banco
    # SHADOW_DATABASE_URL=...

    JWT_PASS = coloque aqui o a chave do jwt para gerar documentos seguros (RECOMENDÁVEL: gere um hash usando base64 ou criptografias de sua preferência!)

Agora basta você executar esses seguintes comandos:

    prisma db push

Esse comando acima cria e adiciona os campos e tabelas ao seu banco de dados.

    prisma generate

Esse comando acima ira gerar o banco de dados no seu ambiente, assim ficando fácil de gerenciar usando node.js!

---

Agora se tudo der certo ao rodar o comando abaixo no seu terminal o servidor irá ser iniciado na porta 3333.

    npm run dev

Se divirta alterando e criando novas funcionalidades, caso ache necessário, efetue um pull request e estaremos analisando se seu código pode ser utilizado, se sim efetuaremos um merge.
