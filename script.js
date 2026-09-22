/**
 * Ficha Cliente — Moskalenko Advogados
 * O botão "Gerar PDF" captura a própria página (mesmo layout, cores e logo
 * do site) com html2canvas e monta um PDF paginado em A4 com jsPDF,
 * baixando o arquivo no computador de quem preencheu.
 */
(function () {
  "use strict";

  var form = document.getElementById("fichaForm");
  var sheet = document.querySelector(".sheet");
  var statusText = document.getElementById("statusText");
  var btnGerarPdf = document.getElementById("btnGerarPdf");
  var toast = document.getElementById("pdfToast");

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
        toast.textContent = "PDF gerado com sucesso.";
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
})();
