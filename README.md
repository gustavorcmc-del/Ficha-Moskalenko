# Ficha Cliente — Moskalenko Advogados

Site estático (HTML + CSS + JS puro) com o formulário digital de atendimento
(trabalhista/previdenciário). O único recurso da página é o botão **Gerar
PDF**, que monta um PDF com todos os dados preenchidos, no mesmo layout da
ficha impressa do escritório, e baixa o arquivo no computador de quem
preencheu.

## Arquivos

```
index.html   → estrutura da página e todos os campos do formulário
style.css    → paleta, tipografia e layout (mesma identidade visual)
script.js    → coleta os campos e monta o PDF (usa a biblioteca jsPDF via CDN)
assets/
  logo-white.png → logo usada no cabeçalho da página (fundo azul-marinho)
  logo-black.png → versão da logo usada dentro do PDF (fundo branco)
```

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
- Ao clicar em "Gerar PDF", o JavaScript (`script.js`) monta o documento com
  a biblioteca [jsPDF](https://github.com/parallax/jsPDF) e aciona o
  download do arquivo (`Ficha_NomeDoReclamante.pdf`).
- Se quiser trocar a logo, basta substituir `assets/logo-white.png` (usada
  na tela) e `assets/logo-black.png` (usada no PDF) mantendo os mesmos
  nomes de arquivo — e atualizar a constante `LOGO_B64` em `script.js`
  (ela embute a logo preta diretamente no código para o PDF não depender de
  carregar a imagem por fora).
