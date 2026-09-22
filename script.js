/**
 * Ficha Cliente — Moskalenko Advogados
 *
 * "Gerar PDF": captura a própria página (mesmo layout, cores e logo do
 * site) com html2canvas e monta um PDF paginado em A4 com jsPDF. No final
 * do PDF, adiciona uma página extra de TEXTO REAL (não imagem) com os
 * dados do formulário codificados — essa página é só para o próprio site
 * conseguir reler depois; não faz parte da ficha oficial.
 *
 * "Carregar PDF": lê um PDF gerado por este site (usando pdf.js para achar
 * essa página de dados escondida) e preenche o formulário de novo, pronto
 * para editar e gerar uma nova versão do PDF.
 *
 * O formulário também salva sozinho no navegador (localStorage) enquanto a
 * pessoa digita, então fechar a aba e voltar depois no mesmo computador
 * também recupera os dados automaticamente, sem precisar de nenhum botão.
 */
(function () {
  "use strict";

  var form = document.getElementById("fichaForm");
  var sheet = document.querySelector(".sheet");
  var statusText = document.getElementById("statusText");
  var btnGerarPdf = document.getElementById("btnGerarPdf");
  var btnCarregarPdf = document.getElementById("btnCarregarPdf");
  var inputCarregarPdf = document.getElementById("inputCarregarPdf");
  var toast = document.getElementById("pdfToast");

  var DATA_MARK_START = "===MOSKALENKO_DATA_START===";
  var DATA_MARK_END = "===MOSKALENKO_DATA_END===";
  var DRAFT_KEY = "moskalenko_ficha_" + (form.dataset.filePrefix || "form") + "_draft";
  var INITIAL_STATUS_TEXT = statusText.textContent;

  if (window.pdfjsLib) {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  }

  function markDirty() {
    statusText.textContent = "Preenchendo…";
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

  function fillFromData(data) {
    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name || !(el.name in data)) return;
      if (el.type === "radio") {
        el.checked = el.value === data[el.name];
      } else {
        el.value = data[el.name];
      }
    });
    markDirty();
    scheduleSaveDraft();
  }

  function sanitizeFilename(s) {
    return (
      (s || "cliente")
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^a-zA-Z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "")
        .slice(0, 60) || "cliente"
    );
  }

  // ---------- Rascunho automático no navegador (localStorage) ----------
  // Nunca deixamos falhas de armazenamento (modo privado, etc.) quebrarem
  // o resto do formulário.
  function safeLSGet(key) {
    try { return window.localStorage.getItem(key); } catch (e) { return null; }
  }
  function safeLSSet(key, value) {
    try { window.localStorage.setItem(key, value); return true; } catch (e) { return false; }
  }
  function safeLSRemove(key) {
    try { window.localStorage.removeItem(key); } catch (e) {}
  }
  function formatDraftTime(iso) {
    try {
      var d = new Date(iso);
      var pad = function (n) { return n < 10 ? "0" + n : "" + n; };
      return pad(d.getDate()) + "/" + pad(d.getMonth() + 1) + " " + pad(d.getHours()) + ":" + pad(d.getMinutes());
    } catch (e) {
      return "";
    }
  }

  var saveDraftTimer = null;
  function scheduleSaveDraft() {
    if (saveDraftTimer) clearTimeout(saveDraftTimer);
    saveDraftTimer = setTimeout(saveDraftNow, 500);
  }
  function saveDraftNow() {
    var data = collectData();
    var isEmpty = Object.keys(data).every(function (k) { return !data[k]; });
    if (isEmpty) {
      safeLSRemove(DRAFT_KEY);
      return;
    }
    var savedAt = new Date().toISOString();
    var ok = safeLSSet(DRAFT_KEY, JSON.stringify({ savedAt: savedAt, data: data }));
    if (ok) {
      statusText.textContent = "Rascunho salvo automaticamente às " + formatDraftTime(savedAt).split(" ")[1] + ".";
    }
  }
  form.addEventListener("input", scheduleSaveDraft);
  form.addEventListener("change", scheduleSaveDraft);

  (function loadDraftOnInit() {
    var raw = safeLSGet(DRAFT_KEY);
    if (!raw) return;
    try {
      var parsed = JSON.parse(raw);
      if (!parsed || !parsed.data) return;
      Array.prototype.forEach.call(form.elements, function (el) {
        if (!el.name || !(el.name in parsed.data)) return;
        if (el.type === "radio") {
          el.checked = el.value === parsed.data[el.name];
        } else {
          el.value = parsed.data[el.name];
        }
      });
      statusText.textContent = "Rascunho recuperado automaticamente (salvo em " + formatDraftTime(parsed.savedAt) + ").";
    } catch (e) {
      // rascunho corrompido — ignora
    }
  })();

  // Depois que o PDF de um cliente é baixado com sucesso, o atendimento
  // está encerrado — limpa tudo sozinho para o próximo cliente, em vez de
  // deixar quem preencheu apagar campo por campo manualmente.
  function clearFormForNextClient() {
    if (saveDraftTimer) clearTimeout(saveDraftTimer);
    form.reset();
    safeLSRemove(DRAFT_KEY);
    statusText.textContent = INITIAL_STATUS_TEXT;
  }

  // ---------- Codificação Unicode-segura para Base64 ----------
  function b64EncodeUnicode(str) {
    var bytes = new TextEncoder().encode(str);
    var binary = "";
    for (var i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  }
  function b64DecodeUnicode(b64) {
    var binary = atob(b64);
    var bytes = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }

  // html2canvas rasterizes native form controls using their live DOM state,
  // but an <input>/<textarea> paints its typed value from internal browser
  // layout, not from something html2canvas always reads correctly across
  // browsers. To guarantee the PDF shows exactly what is on screen, we swap
  // every filled input/textarea for a plain text node right before the
  // snapshot, then restore the real form immediately after.
  function withStaticValues(root, fn) {
    var swaps = [];
    var fields = root.querySelectorAll("input[type='text'], input[type='email'], input[type='tel'], input[type='date'], textarea");
    fields.forEach(function (el) {
      var span = document.createElement(el.tagName === "TEXTAREA" ? "div" : "span");
      var cs = window.getComputedStyle(el);
      span.textContent = el.value || "";
      span.style.cssText =
        "display:block;width:100%;min-height:" + cs.height + ";" +
        "font:" + cs.font + ";color:" + cs.color + ";" +
        "background:" + cs.backgroundColor + ";border:" + cs.border + ";" +
        "border-radius:" + cs.borderRadius + ";padding:" + cs.padding + ";" +
        "box-sizing:border-box;white-space:pre-wrap;word-break:break-word;";
      if (!el.value) {
        span.textContent = "";
      }
      el.parentNode.insertBefore(span, el);
      el.style.display = "none";
      swaps.push({ el: el, span: span });
    });
    try {
      return fn();
    } finally {
      swaps.forEach(function (s) {
        s.el.style.display = "";
        s.span.remove();
      });
    }
  }

  // Adds one extra page at the end of the PDF holding the form data as real
  // (selectable) PDF text, wrapped in markers, so this exact PDF file can
  // later be re-read by "Carregar PDF" to restore the form.
  function appendDataPage(doc, data) {
    var PAGE_W = 210, PAGE_H = 297, MARGIN = 18;
    var payload = JSON.stringify(data);
    var encoded = b64EncodeUnicode(payload);
    var marker = DATA_MARK_START + encoded + DATA_MARK_END;

    doc.addPage();

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(20, 20, 20);
    doc.text("Página de dados internos — não faz parte da ficha", MARGIN, 22);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    var intro = doc.splitTextToSize(
      "Esta página guarda os dados preenchidos nesta ficha, para que o próprio " +
        "site possa reler este PDF depois (botão \"Carregar PDF\") e permitir " +
        "editar e gerar uma nova versão. Pode ser removida sem problema ao " +
        "enviar a ficha oficialmente para terceiros.",
      PAGE_W - MARGIN * 2
    );
    doc.text(intro, MARGIN, 30);

    var y = 30 + intro.length * 4.2 + 10;

    doc.setFont("courier", "normal");
    doc.setFontSize(6);
    doc.setTextColor(160, 160, 160);

    var CHARS_PER_LINE = 100;
    var lineHeight = 2.6;
    for (var i = 0; i < marker.length; i += CHARS_PER_LINE) {
      if (y > PAGE_H - MARGIN) {
        doc.addPage();
        doc.setFont("courier", "normal");
        doc.setFontSize(6);
        doc.setTextColor(160, 160, 160);
        y = MARGIN;
      }
      doc.text(marker.slice(i, i + CHARS_PER_LINE), MARGIN, y);
      y += lineHeight;
    }
  }

  function buildPdfFromDom() {
    var jsPDFCtor = window.jspdf && window.jspdf.jsPDF;
    if (!jsPDFCtor) throw new Error("jsPDF indisponível");
    if (!window.html2canvas) throw new Error("html2canvas indisponível");

    // Elements that must never be sliced in half by a page break: the PDF
    // page break is only allowed to fall in the gap above/below one of these.
    var PROTECTED_SELECTOR = ".field, .radio-option, .reclamado-card, .obs-box, .letterhead, .block h2";

    function getProtectedRanges(scale) {
      var sheetTop = sheet.getBoundingClientRect().top;
      var els = sheet.querySelectorAll(PROTECTED_SELECTOR);
      var ranges = [];
      els.forEach(function (el) {
        var r = el.getBoundingClientRect();
        ranges.push({
          top: (r.top - sheetTop) * scale,
          bottom: (r.bottom - sheetTop) * scale,
        });
      });
      return ranges;
    }

    // Nudges an ideal page-break position upward just enough to land in a
    // gap between protected elements, so no field/card/section is split.
    // Only refuses to move the break when doing so would fail to make any
    // forward progress at all (an element taller than a full page) —
    // otherwise it always prefers a clean gap over a mid-element cut, no
    // matter how much blank space that leaves at the bottom of the page.
    function adjustBreak(idealY, renderedY, ranges) {
      var SAFETY_PX = 6; // guards against subpixel rounding between DOM layout and the rasterized canvas
      var best = idealY;
      for (var i = 0; i < ranges.length; i++) {
        var r = ranges[i];
        if (r.top < idealY && idealY < r.bottom) {
          var candidate = r.top - SAFETY_PX;
          if (candidate > renderedY) {
            best = Math.min(best, candidate);
          }
        }
      }
      return best;
    }

    return withStaticValues(sheet, function () {
      return window
        .html2canvas(sheet, {
          // Fixed, generous resolution — text sharpness depends on this,
          // not on the viewer's own screen density.
          scale: 3,
          useCORS: true,
          backgroundColor: "#ffffff",
          windowWidth: sheet.scrollWidth,
        })
        .then(function (canvas) {
          var doc = new jsPDFCtor({ unit: "mm", format: "a4" });
          var PAGE_W = 210,
            PAGE_H = 297;

          var pxPerMm = canvas.width / PAGE_W;
          var pageHeightPx = Math.floor(PAGE_H * pxPerMm);
          // Use the height ratio (not width) to convert DOM coordinates to
          // canvas pixels — html2canvas's output height doesn't always
          // scale by the exact same factor as its width, and vertical
          // accuracy is what matters for page-break placement.
          var scale = canvas.height / sheet.getBoundingClientRect().height;
          var protectedRanges = getProtectedRanges(scale);

          var renderedY = 0;
          var first = true;
          while (renderedY < canvas.height) {
            var idealEnd = Math.min(renderedY + pageHeightPx, canvas.height);
            var breakY =
              idealEnd >= canvas.height
                ? canvas.height
                : Math.floor(adjustBreak(idealEnd, renderedY, protectedRanges));
            var sliceHeightPx = breakY - renderedY;

            var sliceCanvas = document.createElement("canvas");
            sliceCanvas.width = canvas.width;
            sliceCanvas.height = sliceHeightPx;
            var ctx = sliceCanvas.getContext("2d");
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
            ctx.drawImage(
              canvas,
              0, renderedY, canvas.width, sliceHeightPx,
              0, 0, canvas.width, sliceHeightPx
            );

            // PNG (lossless) instead of JPEG — JPEG's compression is what
            // was softening the text; PNG keeps every edge crisp.
            var imgData = sliceCanvas.toDataURL("image/png");
            var sliceHeightMm = sliceHeightPx / pxPerMm;

            if (!first) doc.addPage();
            doc.addImage(imgData, "PNG", 0, 0, PAGE_W, sliceHeightMm, undefined, "FAST");
            first = false;

            renderedY += sliceHeightPx;
          }

          appendDataPage(doc, collectData());

          return doc;
        });
    });
  }

  btnGerarPdf.addEventListener("click", function () {
    toast.textContent = "";
    toast.className = "toast";
    btnGerarPdf.disabled = true;
    btnGerarPdf.textContent = "Gerando…";

    buildPdfFromDom()
      .then(function (doc) {
        var data = collectData();
        var primaryName = form.dataset.primaryName || "reclamante";
        var filePrefix = form.dataset.filePrefix || "Ficha";
        var filename = filePrefix + "_" + sanitizeFilename(data[primaryName]) + ".pdf";
        doc.save(filename);
        clearFormForNextClient();
        toast.textContent = "PDF gerado com sucesso. Formulário limpo para o próximo atendimento.";
        toast.className = "toast ok";
      })
      .catch(function (err) {
        console.error(err);
        toast.textContent = "Não foi possível gerar o PDF agora.";
        toast.className = "toast error";
      })
      .finally(function () {
        btnGerarPdf.disabled = false;
        btnGerarPdf.textContent = "Gerar PDF";
      });
  });

  // ---------- Carregar PDF ----------
  function extractDataFromPdf(file) {
    if (!window.pdfjsLib) return Promise.reject(new Error("Leitor de PDF indisponível"));
    return file.arrayBuffer().then(function (buffer) {
      return window.pdfjsLib.getDocument({ data: buffer }).promise.then(function (pdf) {
        var pageTexts = [];
        for (var p = 1; p <= pdf.numPages; p++) {
          pageTexts.push(
            pdf.getPage(p).then(function (page) {
              return page.getTextContent().then(function (content) {
                return content.items.map(function (it) { return it.str; }).join("");
              });
            })
          );
        }
        return Promise.all(pageTexts).then(function (texts) {
          var fullText = texts.join("");
          var startIdx = fullText.indexOf(DATA_MARK_START);
          var endIdx = fullText.indexOf(DATA_MARK_END);
          if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
            throw new Error(
              "Este PDF não tem os dados internos da ficha (pode ter sido gerado por uma versão antiga do site)."
            );
          }
          var encoded = fullText.slice(startIdx + DATA_MARK_START.length, endIdx);
          var json = b64DecodeUnicode(encoded);
          return JSON.parse(json);
        });
      });
    });
  }

  if (btnCarregarPdf && inputCarregarPdf) {
    btnCarregarPdf.addEventListener("click", function () {
      inputCarregarPdf.value = "";
      inputCarregarPdf.click();
    });

    inputCarregarPdf.addEventListener("change", function () {
      var file = inputCarregarPdf.files && inputCarregarPdf.files[0];
      if (!file) return;

      toast.textContent = "Lendo PDF…";
      toast.className = "toast";

      extractDataFromPdf(file)
        .then(function (data) {
          fillFromData(data);
          toast.textContent = "Dados carregados a partir do PDF. Edite o que precisar e gere o PDF de novo.";
          toast.className = "toast ok";
        })
        .catch(function (err) {
          console.error(err);
          toast.textContent = err.message || "Não foi possível ler os dados desse PDF.";
          toast.className = "toast error";
        });
    });
  }
})();
