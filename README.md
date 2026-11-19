# Afternine

Um jogo de Sudoku para o navegador, minimalista, com um player do Spotify ao lado do tabuleiro.

> *Clear your mind. Fill the void.*

A ideia é a experiência de um sudoku de livro, mas online: sem cronômetro, sem pontuação e sem o jogo apontando seus erros. Enquanto você joga, o player mostra a música que estiver tocando na sua conta do Spotify e deixa você pausar e trocar de faixa.

## Sumário

- [O que tem no projeto](#o-que-tem-no-projeto)
- [Como jogar](#como-jogar)
- [Rodar na sua máquina](#rodar-na-sua-máquina)
- [Conectar ao Spotify, passo a passo](#conectar-ao-spotify-passo-a-passo)
- [Publicar no GitHub Pages](#publicar-no-github-pages)
- [Problemas comuns](#problemas-comuns)
- [Estrutura de arquivos](#estrutura-de-arquivos)
- [Perguntas frequentes](#perguntas-frequentes)

---

## O que tem no projeto

- **Três níveis de dificuldade:** fácil, médio e difícil.
- **Sem cronômetro e sem aviso de erro**, como no papel. O botão **Conferir** só diz se o tabuleiro inteiro está certo ou não, sem mostrar onde.
- **Rascunho:** anote possibilidades a lápis dentro das casas.
- **Números em chinês:** o botão **中文** troca 1 a 9 por 一 a 九, no tabuleiro, no teclado e nas anotações.
- **Modo claro e escuro**, com o botão de tema no canto do cabeçalho. A escolha fica salva no navegador.
- **Player do Spotify:** capa, título, artista, barra de progresso, pausar, anterior e próxima. Também dá para tocar a música dentro da própria página.
- **Seu jogo fica salvo** no navegador. Se você fechar a aba, ele continua de onde parou.
- Tudo é HTML, CSS e JavaScript puros. Não há instalação, build ou dependências.

## Como jogar

1. Escolha um nível na tela inicial.
2. Toque numa casa e depois num número do teclado abaixo do tabuleiro. Tocar de novo no mesmo número apaga.
3. Ligue **Rascunho** para anotar possibilidades em vez de colocar o número.
4. **Apagar** limpa a casa selecionada.
5. **Conferir** avisa se o tabuleiro completo está correto.
6. **Respostas** mostra a solução e encerra o jogo. Ele pede um segundo toque para confirmar.

**Atalhos de teclado**

| Tecla | O que faz |
| --- | --- |
| `1` a `9` | coloca o número na casa selecionada |
| `0`, `Backspace` ou `Delete` | apaga a casa |
| `N` | liga ou desliga o rascunho |
| Setas | movem a seleção |

---

## Rodar na sua máquina

O jogo de Sudoku abre direto, mas **o login do Spotify só funciona se a página for aberta por um endereço `http://127.0.0.1:...`**. Abrir o `index.html` com duplo clique (endereço `file://`) não serve. Por isso, rode um servidor local simples. Escolha uma das opções abaixo.

### Opção A: VS Code com Live Server (a mais fácil)

1. Baixe ou clone o projeto (veja o passo abaixo).
2. Abra a pasta no VS Code.
3. Instale a extensão **Live Server** (de Ritwick Dey).
4. Clique com o botão direito em `index.html` e escolha **Open with Live Server**.
5. O navegador abre em algo como `http://127.0.0.1:5500/index.html`.

### Opção B: Python

Precisa do Python 3 instalado. Dentro da pasta do projeto:

```bash
python3 -m http.server 5500 --bind 127.0.0.1
```

No Windows, o comando costuma ser `python` em vez de `python3`. Depois abra `http://127.0.0.1:5500` no navegador.

### Opção C: Node.js

```bash
npx serve -l 5500
```

Depois abra o endereço que aparecer. Se ele mostrar `localhost`, troque por `127.0.0.1` na barra do navegador.

### Baixar o projeto

```bash
git clone https://github.com/SEU-USUARIO/NOME-DO-REPOSITORIO.git
cd NOME-DO-REPOSITORIO
```

Sem o Git, use **Code > Download ZIP** na página do repositório e descompacte.

> **Importante:** use sempre `127.0.0.1`, e não `localhost`. O Spotify recusa `localhost` como endereço de retorno.

---

## Conectar ao Spotify, passo a passo

O Spotify exige que todo site que faz login com a conta de alguém tenha um **app registrado**, com um identificador chamado **Client ID**. Ele é gratuito e leva uns cinco minutos. **Você precisa fazer isso uma vez.** Quem usa o seu site depois não precisa fazer nada.

### 1. Criar um app no Spotify

1. Entre em <https://developer.spotify.com/dashboard> com a sua conta do Spotify e aceite os termos de desenvolvedor.
2. Clique em **Create app**.
3. Preencha:
   - **App name:** o que quiser, por exemplo `Afternine`.
   - **App description:** qualquer texto curto.
   - **Redirect URI:** o endereço da sua página, **exatamente como aparece no navegador**, terminando em `/`. Exemplos:
     - Live Server: `http://127.0.0.1:5500/`
     - Python ou Node na porta 5500: `http://127.0.0.1:5500/`
     - Se usar outra porta, troque o número.
   - **Which API/SDKs are you planning to use?** Marque **Web API** e **Web Playback SDK**.
4. Aceite os termos e clique em **Save**.

Dica: com o site aberto, expanda **Configuração** no painel de música. Ele mostra o Redirect URI exato para você copiar e colar no Spotify.

### 2. Copiar o Client ID

1. Abra o app que você criou e entre em **Settings**.
2. Copie o **Client ID**. Você **não** precisa do Client Secret, e não deve colocá-lo em lugar nenhum deste projeto.

### 3. Colocar o Client ID no site

Há dois jeitos. Use o primeiro se vai compartilhar ou publicar o site.

**Jeito 1, no código (recomendado):** abra `js/sudoku.js` e preencha a primeira linha de código:

```js
const CLIENT_ID = 'cole-seu-client-id-aqui';
```

Com isso, a área de configuração some e qualquer pessoa só clica em **Conectar ao Spotify**.

**Jeito 2, pela página:** deixe `CLIENT_ID` vazio, abra o site, expanda **Configuração** no painel de música e cole o Client ID no campo. Ele fica salvo só no seu navegador.

### 4. Conectar

1. Recarregue a página.
2. Clique em **Conectar ao Spotify** e autorize o acesso.
3. Você volta para o site já conectado.

### 5. Ouvir música

O player mostra o que estiver tocando na sua conta, então há duas formas de usar:

- **Pelo app do Spotify** (celular, computador ou outro aparelho): comece a tocar uma música lá. A página passa a mostrar e controlar essa música.
- **Dentro da própria página:** clique em **Tocar neste navegador**. A página vira um aparelho do Spotify chamado "Afternine". Se a música não começar sozinha, abra o Spotify, escolha uma faixa e selecione "Afternine" na lista de aparelhos.

### O que você precisa saber sobre contas

- **Controlar a reprodução** (pausar, próxima, anterior) e **tocar dentro do navegador** exigem **Spotify Premium**. Sem Premium, o player pode exibir o que está tocando, mas os botões podem ser recusados.
- Um app novo fica em **modo de desenvolvimento**. Nesse modo, só entram as contas que você cadastrou em **User Management** no painel do app (nome e e-mail da conta do Spotify). Para qualquer pessoa poder entrar, é preciso pedir uma ampliação de acesso ao Spotify. As regras e os limites mudam com o tempo, então confira o painel e a documentação do Spotify.

### O Client ID é um segredo?

Não. Este projeto usa o fluxo de login **PKCE**, feito para páginas sem servidor, e **não usa Client Secret**. O Client ID é público por natureza e pode ficar no código no GitHub. O que **nunca** deve ir para o repositório é um Client Secret.

---

## Problemas comuns

**"Abra o site por um endereço http..."**
Você abriu o arquivo direto, com `file://`. Rode um servidor local (veja [Rodar na sua máquina](#rodar-na-sua-máquina)).

**"O Spotify não aceita localhost"**
Troque `localhost` por `127.0.0.1` na barra do navegador e cadastre esse endereço como Redirect URI.

**Erro `INVALID_CLIENT: Invalid redirect URI`**
O endereço cadastrado no Spotify não é idêntico ao da página. Confira o protocolo (`http` ou `https`), o número da porta e a barra final. O painel **Configuração** do site mostra o endereço exato. Aperte **Save** no painel do Spotify depois de editar.

**Depois de autorizar, volta para o site e aparece "Não foi possível conectar"**
Confira o Client ID e abra o site sempre pelo mesmo endereço do início ao fim. O navegador guarda o login por endereço, então começar em `127.0.0.1:5500` e voltar em outra porta quebra o processo.

**Autorizei, mas o Spotify mostra erro de usuário não cadastrado**
Seu app está em modo de desenvolvimento. Adicione a conta em **User Management** no painel do app.

**O player diz "Nada tocando agora"**
Dê play em alguma música no Spotify, em qualquer aparelho, e espere alguns segundos. A página atualiza sozinha. Anúncios e sessões privadas podem não aparecer.

**Os botões do player não funcionam**
Pausar e trocar de faixa pedem Spotify Premium. Também precisa existir um aparelho ativo: toque algo no Spotify ou use **Tocar neste navegador**.

**"Tocar neste navegador" não toca**
Use um navegador atual (Chrome, Edge, Firefox ou Safari), permita som no site e tenha Premium. Se o aparelho "Afternine" não aparecer, recarregue a página.

**Quero sair da conta do Spotify**
Clique em **Desconectar** no painel de música. Para o site esquecer o Client ID digitado pela página, limpe os dados do site no navegador.

---

## Estrutura de arquivos

```
.
├── index.html        página única: menu, tabuleiro, teclado e player
├── css/
│   └── style.css     visual, temas claro e escuro, layout
├── js/
│   ├── theme.js      alternância claro/escuro (carrega antes de tudo para não piscar)
│   ├── sudoku.js     Client ID, gerador de tabuleiros e lógica do jogo
│   ├── spotify.js    login (PKCE), leitura do que toca e controles do player
│   └── main.js       inicialização
└── assets/
    └── logo.jpeg     ícone do site
```

## Perguntas frequentes

**Como os tabuleiros são gerados?**
Um gerador cria uma grade completa e válida e depois retira números ao acaso, conferindo a cada retirada que o tabuleiro continua com **uma única solução**. Os níveis mudam a quantidade de números que sobram: cerca de 42 no fácil, 34 no médio e 26 no difícil. O nível difícil é definido só por essa quantidade, então ele não garante o uso de técnicas avançadas.

**Os dados vão para algum servidor?**
Não. Não existe back-end. O jogo salvo, o tema e o idioma ficam no `localStorage` do seu navegador. O login do Spotify acontece entre o seu navegador e o Spotify.

**Posso mudar as cores e a fonte?**
Sim. As cores ficam no começo do `css/style.css`, em variáveis (`--bg`, `--fg`, `--line` e outras), uma vez para o tema claro e outra para o escuro.

**Posso mudar o nome do aparelho que aparece no Spotify?**
Sim. Procure `name: 'Afternine'` em `js/spotify.js`.
