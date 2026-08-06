// Robust print helper: prefer writing into a real window, fallback to blob URL
(function(){
  function _openViaDocument(html, opts){
    const features = opts?.features || 'width=800,height=700';
    let w = window.open('','_blank',features);
    try{
      if(!w) return null;
      w.document.open();
      w.document.write(html);
      w.document.close();
      w.focus();
      setTimeout(()=>{ try{ w.print(); }catch(e){} }, 250);
      return w;
    }catch(e){
      try{ if(w) w.close(); }catch(_){}
      return null;
    }
  }

  function _openViaBlob(html, opts){
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const features = opts?.features || 'width=800,height=700';
    const w = window.open(url, '_blank', features);
    setTimeout(() => { try{ if (w) { w.focus(); w.print(); } }catch(e){} URL.revokeObjectURL(url); }, 600);
    return w;
  }

  window.openPrintWindow = function(html, opts){
    // Try document.write (works cross-origin) first, fallback to blob when blocked
    const w = _openViaDocument(html, opts);
    if (w) return w;
    return _openViaBlob(html, opts);
  };

  // Safely open a print window using a DOM element (cloned). This avoids string
  // interpolation issues where template tokens like `${doc.innerHTML}` might
  // accidentally appear literally in the produced HTML.
  window.openPrintWindowFromElement = function(el, opts){
    if (!el) return null;
    const styles = [...document.querySelectorAll('style,link[rel="stylesheet"]')].map(s=>s.outerHTML).join('');
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">${styles}
      <style>body{margin:0;padding:20px;background:#f8f8f4;}@media print{body{background:white;}@page{margin:20mm}}</style>
      </head><body><div class="print-root">${el.cloneNode(true).outerHTML}</div><script src="/assets/js/theme-switcher.js"></script></body></html>`;
    return window.openPrintWindow(html, opts);
  };
})();
