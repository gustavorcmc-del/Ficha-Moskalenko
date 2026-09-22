/**
 * Ficha Cliente — Moskalenko Advogados
 * Coleta os dados preenchidos no formulário e gera um PDF (via jsPDF)
 * reproduzindo o layout da ficha impressa do escritório.
 */
(function () {
  "use strict";

  var form = document.getElementById("fichaForm");
  var statusText = document.getElementById("statusText");
  var btnGerarPdf = document.getElementById("btnGerarPdf");
  var toast = document.getElementById("pdfToast");

  // Logo em preto, sem fundo, usada apenas dentro do PDF (fundo branco).
  var LOGO_B64 = "data:image/png;base64,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";

  function markDirty() {
    statusText.textContent = "Preenchendo\u2026";
  }
  form.addEventListener("input", markDirty);
  form.addEventListener("change", markDirty);

  function collectData() {
    var data = {};
    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name) return;
      if (el.type === "radio") {
        if (el.checked) data[el.name] = el.value;
      } else if (!(el.name in data)) {
        data[el.name] = el.value;
      }
    });
    return data;
  }

  function formatDate(v) {
    if (!v) return "";
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
    if (!m) return v;
    return m[3] + "/" + m[2] + "/" + m[1];
  }

  function sanitizeFilename(s) {
    return (
      (s || "cliente")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "")
        .slice(0, 60) || "cliente"
    );
  }

  function buildPdf(data) {
    var jsPDFCtor = window.jspdf && window.jspdf.jsPDF;
    if (!jsPDFCtor) throw new Error("jsPDF indispon\u00edvel");
    var doc = new jsPDFCtor({ unit: "mm", format: "a4" });

    var PAGE_W = 210,
      MARGIN = 15;
    var CONTENT_W = PAGE_W - MARGIN * 2;
    var BOTTOM = 282;
    var y = 15,
      page = 1;

    function ensureSpace(h) {
      if (y + h > BOTTOM) {
        doc.addPage();
        page++;
        y = 15;
        drawContinued();
      }
    }
    function reserve(h) {
      ensureSpace(h);
    }

    function drawContinued() {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(40);
      doc.text("FICHA CLIENTE (continua\u00e7\u00e3o)", MARGIN, y);
      doc.setDrawColor(190);
      doc.setLineWidth(0.2);
      doc.line(MARGIN, y + 2.5, PAGE_W - MARGIN, y + 2.5);
      y += 12;
    }

    function drawFooter() {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(130);
      doc.text("Ficha digital de atendimento \u2014 uso interno do escrit\u00f3rio", MARGIN, 290);
      doc.text("P\u00e1gina " + page, PAGE_W - MARGIN, 290, { align: "right" });
    }

    function header() {
      var logoW = 42,
        logoH = logoW / (780 / 162);
      try {
        doc.addImage(LOGO_B64, "PNG", MARGIN, 13, logoW, logoH);
      } catch (e) {}
      doc.setFont("helvetica", "bold");
      doc.setFontSize(15);
      doc.setTextColor(0);
      var title = "FICHA CLIENTE";
      var tw = doc.getTextWidth(title);
      var tx = (PAGE_W - tw) / 2;
      doc.text(title, tx, 21);
      doc.setDrawColor(0);
      doc.setLineWidth(0.45);
      doc.line(tx, 22.3, tx + tw, 22.3);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(95);
      var sub = "Direito Trabalhista  \u2022  Direito Previdenci\u00e1rio";
      var sw = doc.getTextWidth(sub);
      doc.text(sub, (PAGE_W - sw) / 2, 28);
      doc.setDrawColor(190);
      doc.setLineWidth(0.2);
      doc.line(MARGIN, 34, PAGE_W - MARGIN, 34);
      y = 44;
    }

    function section(title, note) {
      ensureSpace(note ? 20 : 14);
      y += 2;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(0);
      doc.text(title.toUpperCase(), MARGIN, y);
      doc.setDrawColor(0);
      doc.setLineWidth(0.35);
      doc.line(MARGIN, y + 1.6, PAGE_W - MARGIN, y + 1.6);
      y += 6.5;
      if (note) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(7.6);
        doc.setTextColor(120);
        doc.text(note, MARGIN, y);
        y += 5.5;
      }
    }

    function row(fields) {
      ensureSpace(11);
      var gap = 4;
      var totalFrac = fields.reduce(function (s, f) {
        return s + f[2];
      }, 0);
      var avail = CONTENT_W - gap * (fields.length - 1);
      var x = MARGIN;
      fields.forEach(function (f) {
        var label = f[0],
          value = f[1],
          frac = f[2];
        var w = avail * (frac / totalFrac);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(6.6);
        doc.setTextColor(90);
        doc.text(label.toUpperCase(), x, y);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9.5);
        doc.setTextColor(20);
        var val = value && String(value).trim() ? String(value) : "";
        doc.text(val, x, y + 5, { maxWidth: w });
        doc.setDrawColor(0);
        doc.setLineWidth(0.2);
        doc.line(x, y + 6.4, x + w, y + 6.4);
        x += w + gap;
      });
      y += 11;
    }

    function textBlock(label, value, heightMm, note) {
      ensureSpace(heightMm + 12);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.6);
      doc.setTextColor(90);
      if (label) doc.text(label.toUpperCase(), MARGIN, y);
      if (note) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(7.2);
        doc.setTextColor(120);
        doc.text(note, MARGIN, y + 4.5);
        y += 5;
      }
      var boxY = y + (label ? 3 : 0);
      doc.setDrawColor(0);
      doc.setLineWidth(0.25);
      doc.rect(MARGIN, boxY, CONTENT_W, heightMm);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.3);
      doc.setTextColor(20);
      var text = value && String(value).trim() ? String(value) : "";
      var lines = doc.splitTextToSize(text, CONTENT_W - 6);
      doc.text(lines, MARGIN + 3, boxY + 5.5);
      y = boxY + heightMm + 8;
    }

    function radioGroup(title, selected, options) {
      ensureSpace(20);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.6);
      doc.setTextColor(90);
      doc.text(title.toUpperCase(), MARGIN, y);
      y += 5.5;
      var colW = CONTENT_W / 2;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.3);
      doc.setTextColor(20);
      options.forEach(function (opt, i) {
        var col = i % 2,
          rowI = Math.floor(i / 2);
        var x = MARGIN + col * colW;
        var oy = y + rowI * 6.5;
        var mark = opt === selected ? "X" : " ";
        doc.setDrawColor(0);
        doc.setLineWidth(0.25);
        doc.rect(x, oy - 3.2, 4, 4);
        doc.setFont("helvetica", "bold");
        doc.text(mark, x + 0.9, oy - 0.2);
        doc.setFont("helvetica", "normal");
        doc.text(opt, x + 6.5, oy);
      });
      var rowsUsed = Math.ceil(options.length / 2);
      y += rowsUsed * 6.5 + 3;
    }

    function noteBox(text) {
      ensureSpace(20);
      var boxH = 16;
      doc.setDrawColor(0);
      doc.setLineWidth(0.3);
      doc.rect(MARGIN, y, CONTENT_W, boxH);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(0);
      doc.text("OBS:", MARGIN + 3, y + 6);
      doc.setFont("helvetica", "normal");
      var lines = doc.splitTextToSize(text, CONTENT_W - 18);
      doc.text(lines, MARGIN + 15, y + 6);
      y += boxH + 6;
    }

    header();

    reserve(25);
    section("Entrevista");
    row([
      ["Entrevista (respons\u00e1vel)", data.entrevista, 1.4],
      ["Telefone", data.telefone, 1],
    ]);

    reserve(80);
    section("Dados do reclamante");
    row([["Reclamante", data.reclamante, 1]]);
    row([["Endere\u00e7o", data.endereco, 1]]);
    row([
      ["CTPS", data.ctps, 1],
      ["S\u00e9rie", data.serie, 1],
      ["PIS", data.pis, 1],
    ]);
    row([
      ["CPF n\u00ba", data.cpf, 1],
      ["RG", data.rg, 1],
    ]);
    row([
      ["Data de nascimento", formatDate(data.nascimento), 1],
      ["E-mail", data.email, 1],
    ]);
    row([["Nome da genitora", data.genitora, 1]]);

    reserve(91);
    section("V\u00ednculo empregat\u00edcio");
    row([
      ["Admiss\u00e3o", formatDate(data.admissao), 1],
      ["Desligamento", formatDate(data.desligamento), 1],
    ]);
    row([
      ["Sal\u00e1rio", data.salario, 1],
      ["Comiss\u00e3o", data.comissao, 1],
    ]);
    row([["Fun\u00e7\u00e3o", data.funcao, 1]]);
    row([["Hor\u00e1rio efetivo de trabalho", data.horario, 1]]);
    row([["Dias da semana", data.diasSemana, 1]]);
    row([["Intervalo para refei\u00e7\u00e3o", data.intervalo, 1]]);
    row([
      ["Cidade onde foi contratado", data.cidadeContratado, 1],
      ["Cidade onde trabalhou", data.cidadeTrabalhou, 1],
    ]);

    reserve(34);
    radioGroup("Motivo do desligamento", data.motivoDesligamento, [
      "Sem justa causa",
      "Rescis\u00e3o indireta",
      "Com justa causa",
      "Pedido de demiss\u00e3o",
    ]);
    row([["Retificar CTPS?", data.retificarCtps, 1]]);

    reserve(47);
    section("Reclamado 1");
    row([["Nome / Raz\u00e3o social", data.reclamado1Nome, 1]]);
    row([["Endere\u00e7o", data.reclamado1Endereco, 1]]);
    row([["CNPJ n\u00ba", data.reclamado1Cnpj, 1]]);

    reserve(47);
    section("Reclamado 2");
    row([["Nome / Raz\u00e3o social", data.reclamado2Nome, 1]]);
    row([["Endere\u00e7o", data.reclamado2Endereco, 1]]);
    row([["CNPJ n\u00ba", data.reclamado2Cnpj, 1]]);

    reserve(26);
    textBlock("Outros", data.outros, 14);

    reserve(97);
    section("Descri\u00e7\u00e3o f\u00e1tica", "Relato do cliente sobre os fatos que fundamentam a a\u00e7\u00e3o.");
    textBlock("", data.descricaoFatica, 65);

    noteBox(
      "Fica advertido que o cliente tem como obriga\u00e7\u00e3o levar 03 (tr\u00eas) testemunhas para a audi\u00eancia inicial, restando desde logo o seu conhecimento."
    );

    drawFooter();

    return doc;
  }

  btnGerarPdf.addEventListener("click", function () {
    toast.textContent = "";
    toast.className = "toast";
    btnGerarPdf.disabled = true;
    btnGerarPdf.textContent = "Gerando\u2026";

    try {
      var data = collectData();
      var doc = buildPdf(data);
      var filename = "Ficha_" + sanitizeFilename(data.reclamante) + ".pdf";
      doc.save(filename);
      toast.textContent = "PDF gerado com sucesso.";
      toast.className = "toast ok";
    } catch (err) {
      console.error(err);
      toast.textContent = "N\u00e3o foi poss\u00edvel gerar o PDF agora.";
      toast.className = "toast error";
    } finally {
      btnGerarPdf.disabled = false;
      btnGerarPdf.textContent = "Gerar PDF";
    }
  });
})();
