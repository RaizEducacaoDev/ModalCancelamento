(() => { 
  const ATRASO = 5000;
  if (!location.href.includes('audit?c')) return;

  // ======== Verificação dentro de #PanelStep ========
  function verificarPainel() {
    const painel = document.querySelector("#PanelStep");
    if (!painel) return false;

    const tabela = painel.querySelector("table");
    if (!tabela) return false;

    const linhas = [...tabela.querySelectorAll("tbody tr")].reverse();
    if (!linhas.length) return false;

    const trAlvo = linhas.find(tr =>
      [...tr.classList].some(c => c.includes("border-left"))
    );

    if (!trAlvo) {
      console.log("🔴 Nenhum <tr> com classe contendo 'border-left' foi encontrado.");
      return false;
    }

    const strongs = trAlvo.querySelectorAll("strong");
    for (const s of strongs) {
      const texto = s.textContent.trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      if (texto.includes("aprovacao")) {
        console.log("🟢 Verificação: linha com 'border-left' contém 'Aprovação' →", s.textContent.trim());
        return true;
      }
    }

    console.log("🔴 Linha com 'border-left' encontrada, mas não contém 'Aprovação'.");
    return false;
  }

  // ======== Criação do modal moderno ========
  function criarModal() {
    if (document.getElementById('md-cancel-overlay')) return;

    const css = `
      #md-cancel-overlay{position:fixed;inset:0;background:rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;z-index:999999}
      #md-cancel{font-family:Segoe UI,Roboto,Arial,sans-serif;background:#f8f9fb;color:#333;border-radius:14px;box-shadow:0 10px 30px rgba(0,0,0,.18);width:min(92vw,680px);padding:22px;box-sizing:border-box}
      .md-head{display:flex;align-items:center;gap:12px;margin:0 0 12px}
      .md-ico{width:36px;height:36px;border-radius:10px;background:#e8eefc;display:flex;align-items:center;justify-content:center;font-weight:700;color:#2b7cff}
      .md-title{font-size:20px;font-weight:700;margin:0}
      .md-sub{font-size:13px;color:#555;margin:2px 0 14px}
      .md-body{overflow:hidden;box-sizing:border-box}
      .md-body textarea{
        display:block;
        width:100%;
        box-sizing:border-box;
        height:120px;
        border:1px solid #d7dbe2;
        border-radius:10px;
        background:#fff;
        padding:12px;
        resize:none;
        outline:0;
      }
      .md-foot{display:flex;gap:10px;justify-content:flex-end;margin-top:16px}
      .btn{border:0;border-radius:10px;padding:10px 14px;cursor:pointer;font-weight:600;transition:all .2s ease}
      .btn-cancel{background:#e6e9ef;color:#333}
      .btn-ok{background:#2b7cff;color:#fff}
      .btn-ok:disabled{background:#a8b6d1;cursor:not-allowed;opacity:.7}
      .md-alert{background:#fff5f5;border:1px solid #f3c2c2;color:#b33a3a;padding:10px 14px;border-radius:8px;font-size:14px;margin-bottom:10px;display:none}
    `;
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    const overlay = document.createElement('div');
    overlay.id = 'md-cancel-overlay';
    overlay.style.display = 'none';
    overlay.innerHTML = `
      <div id="md-cancel" role="dialog" aria-modal="true">
        <div class="md-head">
          <div class="md-ico">i</div>
          <div>
            <h3 class="md-title">Cancelar solicitação</h3>
            <div class="md-sub">Informe uma justificativa para confirmar o cancelamento.</div>
          </div>
        </div>
        <div id="md-alert" class="md-alert">❌ Cancelamento desabilitado: nenhuma etapa de "Aprovação" encontrada.</div>
        <div class="md-body">
          <textarea id="md-just" placeholder="Digite sua justificativa..."></textarea>
        </div>
        <div class="md-foot">
          <button class="btn btn-cancel" id="md-fechar">Fechar</button>
          <button class="btn btn-ok" id="md-confirmar">Confirmar</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
  }

  const abrirModal = () => document.getElementById('md-cancel-overlay').style.display = 'flex';
  const fecharModal = () => document.getElementById('md-cancel-overlay').style.display = 'none';

  // ======== Interceptação do botão Cancelar ========
  function interceptarBotao(btn) {
    if (btn.__interceptado) return;
    btn.__interceptado = true;

    const originalOnClick = btn.onclick;
    const originalHref = btn.getAttribute('href');

    const handler = (e) => {
      e.preventDefault(); 
      e.stopPropagation();

      const encontrouAprovacao = verificarPainel();
      criarModal(); 
      abrirModal();

      const $fechar = document.getElementById('md-fechar');
      const $ok = document.getElementById('md-confirmar');
      const $txt = document.getElementById('md-just');
      const $alert = document.getElementById('md-alert');
      const $body = document.querySelector('.md-body');
      const $sub = document.querySelector('.md-sub');

      if (encontrouAprovacao) {
        $ok.disabled = false;
        $alert.style.display = 'none';
        if (!$sub) {
          const info = document.createElement('div');
          info.className = 'md-sub';
          info.textContent = 'Informe uma justificativa para confirmar o cancelamento.';
          document.querySelector('.md-head div:last-child').appendChild(info);
        }
        if (!$body.contains($txt)) {
          const novoTxt = document.createElement('textarea');
          novoTxt.id = 'md-just';
          novoTxt.placeholder = 'Digite sua justificativa...';
          $body.appendChild(novoTxt);
        }
      } else {
        $ok.disabled = true;
        $alert.style.display = 'block';
        if ($body.contains($txt)) $txt.remove();
        if ($sub) $sub.remove();
      }

      $fechar.onclick = fecharModal;

      $ok.onclick = () => {
        if ($ok.disabled) return;
        const $textoAtual = document.getElementById('md-just');
        if (!$textoAtual.value.trim()) { $textoAtual.focus(); return; }

        btn.removeEventListener('click', handler, true);
        if (typeof originalOnClick === 'function') originalOnClick.call(btn, new Event('click'));
        else if (originalHref?.startsWith('javascript:')) try { eval(originalHref.slice(11)); } catch (e) {}
        else btn.click();

        fecharModal();
        setTimeout(() => btn.addEventListener('click', handler, true), 0);
      };
    };

    btn.addEventListener('click', handler, true);
  }

  // ======== Procura o botão ========
  function procurarEBind(doc) {
    try {
      const el = doc.querySelector('#LkCancel');
      if (el) interceptarBotao(el);
    } catch {}
  }

  function varrerTudo() {
    procurarEBind(document);
    document.querySelectorAll('iframe').forEach(f => {
      try { procurarEBind(f.contentDocument || f.contentWindow.document); } catch {}
    });
  }

  // ======== Observa DOM ========
  const obs = new MutationObserver(() => varrerTudo());
  const iniciar = () => {
    criarModal();
    varrerTudo();
    obs.observe(document.documentElement, { childList: true, subtree: true });
  };

  if (document.readyState === 'complete' || document.readyState === 'interactive') 
    setTimeout(iniciar, ATRASO);
  else 
    window.addEventListener('DOMContentLoaded', () => setTimeout(iniciar, ATRASO));
})();