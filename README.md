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

## Continuar uma ficha depois ("Salvar dados" / "Carregar dados")

O PDF gerado é só uma "foto" da tela — não dá para editar o texto dentro
dele depois de baixado. Para quem esquece de preencher algum campo e precisa
completar a ficha mais tarde (ou passar para outra pessoa terminar), use os
botões ao lado de "Gerar PDF":

- **Salvar dados**: baixa um arquivo `.json` (não é o PDF) com tudo que foi
  digitado até aquele momento.
- **Carregar dados**: abre esse arquivo `.json` de volta e preenche o
  formulário automaticamente — inclusive campos de rádio como "Motivo do
  desligamento" — pronto para completar o que faltava.

Depois de carregar e completar os dados, é só clicar em "Gerar PDF"
normalmente. O arquivo `.json` não tem nenhuma formatação, só serve como
"rascunho" para o próprio site reabrir depois.
