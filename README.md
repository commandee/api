# Commandee REST API

Interface de aplicação central para todas as funcionalidades do Commandee

## Estrutura

Gerada a partir de (Fastify API template)[https://github.com/pdistas/fastify-api]

Todo o programa deve existir dentro da pasta `src/`.
Arquivos na pasta `src/routes/` são automaticamente considerados como rotas, e devem exportar uma função assíncrona para tal.

Uma simplificação do modelo MVC é utilizada para organização do código.

### Rotas

Cada recurso disponibilizado possui sua rota HTTP correspondente, com os métodos `GET`, `POST`, `DELETE` e `PATCH`.

São documentadas automaticamente através dos schemas JSON que disponibilizam.

> Toda a lógica de negócio, tal como autorização e validação de dados, deve acontecer durante o tempo de vida da execução.

### Controllers

Cada recurso disponibilizado pela API possui um controller próprio, com funções básicas de requisição, filtragem, inserção e atualização, além de funções específicas como login.

> Controllers **não** devem implementar lógica de negócio, nem devem receber o atual estado da requisição. Um método do controller deve falhar se, e somente, o recurso recebido for inválido ou inexistente.

## Instalação

### Dependências:
- `Node >= 17`

### Plataforma
Testado somente com as versões mais recentes do Node. Erros de TypeScript em versões antigas do Node, especialmente no Windows, podem ser ignoradas.

### Execução
- Clonar o repositório
- Acessar a pasta criada
- `npm install`
- `npm run dev`

## Conceitos

### Duplo ID

Todas as tabelas do banco de dados possuem dois IDs, uma chave primária em binário no formato `BINARY(16) id PRIMARY KEY DEFAULT (uuid_to_bin(uuid))`, e uma chave pública única no formato `VARCHAR(16) public_id UNIQUE NOT NULL`.

Relacionamentos SQL, assim como JOINs, devem ser feitos somente com a real chave primária, em binário.

Em momento algum, deve existir uma rota que exponha a real chave primária em produção.
Não deve haver SELECT a envolvendo.

Chaves públicas são geradas pelo programa antes de criar um recurso, usando a biblioteca `NanoID`.
Possuem 16 caracteres alfanuméricos, maiúsculos ou minúsculos, case-sensitive.
Recursos HTTP podem ser acessados através do ID público.

### Autenticação

É feita através de `JSON Web Tokens`, criptograficamemte assinados com o valor da variável de ambiente `JWT_SECRET`.

> Essa variável deve, obrigatoriamente, ser definida.

O token armazena um id de usuário e opcionalmente restaurante e papel do usuário no restaurante.
Devido a assinatura, é confiável, e um token válido deve ser considerado como autenticação suficiente para uma requisição.

É definido automaticamente no header `Authorization` e como cookie em `Set-Cookie` das responses relacionadas.

Um token deve ser devolvido como cookie ou pelo campo `Authorization`, no formato `Bearer <token>`.

### Login

O login é feito através de email e senha, cujo hash é feito através da biblioteca `bcrypt`.

> Senhas devem ser enviadas em plain-text, portanto, a aplicação jamais deve ser utilizada sem certificação SSL.

### Validação

Todas as rotas possuem validação através de Json Schema, disponibilizados publicamente para referência no repositório e na rota web `/openapi` da API.

Um documento OpenAPI válido é gerado automaticamente após o início da aplicação.

### Banco de dados

Utiliza MySQL como banco de dados, através do query builder Kysely.

Esquemas de banco de dados, migrações e definições de tipo para o Kysely são geradas através da biblioteca `prisma`.

> Essa aplicação utiliza somente a biblioteca `prisma`, e não depende de `@prisma/client`. Não há uso do Prisma em ambiente de produção.

`npx prisma studio` permite acesso a uma interface de acesso e modificação do banco de daods.

Para uso dessa ferramenta, a variável de ambiente `PRISMA_URL` deve estar definida e ser válida como banco de dados SQL com direitos de administrador.