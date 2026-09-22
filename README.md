[README.md](https://github.com/user-attachments/files/32527803/README.md)
# Fichas Cliente — Moskalenko Advogados

Site estático (HTML + CSS + JS puro) com as fichas digitais de atendimento
do escritório. A página inicial (`index.html`) mostra um cartão por área do
direito; cada ficha tem um único recurso, o botão **Gerar PDF**, que monta
um PDF com todos os dados preenchidos, no mesmo layout da tela, e baixa o
arquivo no computador de quem preencheu.

## Arquivos

```
index.html               → página inicial com os cartões de cada área
ficha-trabalhista.html   → ficha de atendimento trabalhista
ficha-consumidor.html    → ficha de atendimento (direito do consumidor)
style.css                → paleta, tipografia e layout (mesma identidade visual)
script.js                → coleta os campos e monta o PDF (usado pelas duas fichas)
assets/
  logo-white.png → logo usada nos cabeçalhos (fundo azul-marinho)
  logo-black.png → versão preta da logo, não usada atualmente mas mantida como reserva
```

A área **Previdenciário** aparece na página inicial como "Em breve" — ainda
não há um cartão clicável para ela. Quando o escritório enviar o modelo da
ficha impressa dessa área, basta pedir para criar `ficha-previdenciario.html`
seguindo o mesmo padrão e trocar o cartão desabilitado por um link, igual às
outras duas.

Não há build, backend ou dependências para instalar — é só abrir o
`index.html` num navegador ou publicar a pasta como está.

## Publicar no GitHub Pages

1. Crie um repositório no GitHub (pode ser privado) e envie estes arquivos
   para a raiz dele (ou para uma pasta, ajustando o passo 3).
2. No GitHub, vá em **Settings → Pages**.
3. Em **Build and deployment → Source**, selecione **Deploy from a branch**,
   escolha a branch (`main`) e a pasta (`/root`), depois **Save**.
4. Em alguns minutos o GitHub mostra o link do site, algo como
   `https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/`.
5. Compartilhe esse link com os advogados do escritório.

## Como funciona o botão "Gerar PDF"

- Os dados digitados nos campos ficam só no navegador de quem está
  preenchendo — nada é enviado para nenhum servidor.
- Ao clicar em "Gerar PDF", o JavaScript (`script.js`) tira uma "foto" da
  própria tela preenchida (com [html2canvas](https://html2canvas.hertzen.com/))
  e monta um PDF paginado com [jsPDF](https://github.com/parallax/jsPDF) —
  por isso o PDF sai sempre idêntico ao que está na tela, cores e logo
  incluídas.
- O nome do arquivo baixado usa o campo principal de cada ficha (ex.:
  `Ficha_Trabalhista_NomeDoReclamante.pdf` ou
  `Ficha_Consumidor_NomeDoAutor.pdf`).
- Se quiser trocar a logo, basta substituir `assets/logo-white.png` mantendo
  o mesmo nome de arquivo — ela é usada automaticamente no cabeçalho de
  todas as páginas e, por consequência, também aparece no PDF gerado.

## Editar uma ficha depois de gerar o PDF ("Carregar PDF")

O PDF baixado é uma "foto" fiel da tela — o texto dentro dele não pode ser
editado diretamente num programa como o Adobe Reader. Para poder continuar
uma ficha depois (informação que faltou, correção, ou repassar para outra
pessoa terminar), cada PDF gerado carrega uma **última página extra**,
identificada como "Página de dados internos — não faz parte da ficha", que
guarda os dados preenchidos de forma escondida (como texto, não como
imagem). Essa página pode ser removida sem problema ao entregar a ficha
oficialmente — ela só existe para o próprio site conseguir reler depois.

Fluxo:

1. Preenche o que der e clica em **Gerar PDF** — o arquivo baixado já leva
   os dados internos.
2. Mais tarde (mesmo dias depois, em outro computador), abre a ficha no
   site, clica em **Carregar PDF** e seleciona esse mesmo arquivo.
3. O formulário é preenchido automaticamente com tudo que já estava lá —
   inclusive campos de rádio como "Motivo do desligamento".
4. Completa ou corrige o que precisar e clica em **Gerar PDF** de novo.

Por trás dos panos isso usa a biblioteca [pdf.js](https://mozilla.github.io/pdf.js/)
para ler o texto da última página do PDF enviado. Se o PDF carregado não
tiver essa página (por exemplo, se foi gerado por uma versão antiga do site,
ou se a página de dados foi removida antes), aparece um aviso claro
explicando isso, sem travar o formulário.

## Rascunho automático no navegador

Além disso, enquanto a pessoa digita, o formulário salva sozinho um
rascunho no navegador do computador (não é enviado a lugar nenhum). Fechar a
aba e voltar depois — mesmo dias depois, no mesmo computador — recupera os
dados automaticamente ao abrir a ficha de novo, sem precisar de nenhum
botão. Isso é só uma conveniência local; para levar a ficha para outro
computador ou pessoa, use o "Carregar PDF" descrito acima.
