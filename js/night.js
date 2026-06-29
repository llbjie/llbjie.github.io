/**
 * Icarus 夜间模式 (被动握手严谨版)
 * 文件路径: icarus/source/js/night.js
 */
(function () {

  var isNight = localStorage.getItem('night') === 'true';
  // 维护一个全局唯一的目标主题状态
  var targetTheme = isNight ? 'github-dark' : 'github-light';

  // ── 1. 核心状态切换 ───────────────────────────────────────
  function applyNight(value) {
    if (value) {
      document.body.classList.add('night');
      document.body.classList.remove('light');
    } else {
      document.body.classList.remove('night');
      document.body.classList.add('light');
    }
    
    targetTheme = value ? 'github-dark' : 'github-light';
    
    // 尝试直接发送。如果此时 iframe 已经完全加载处于稳定态，消息会立刻生效。
    // 如果由于 Pjax 正在加载中，消息会丢失，但无所谓，后续的“握手”机制会兜底。
    var iframe = document.querySelector('iframe.utterances-frame');
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage(
        { type: 'set-theme', theme: targetTheme },
        'https://utteranc.es'
      );
    }
  }

  // ── 2. 最严谨的就绪检测：监听 Utterances 的主动汇报 ────────────
  // 无论页面是初次加载，还是 Pjax 刷新，只要 Utterances 内部渲染完毕，
  // 它必定会向 parent 发送 origin 为 'https://utteranc.es' 的消息。
  window.addEventListener('message', function (event) {
    if (event.origin === 'https://utteranc.es') {
      // 收到这条消息，意味着 iframe 内部的 DOM、CSS 和 JS 已经绝对安全
      var iframe = document.querySelector('iframe.utterances-frame');
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage(
          { type: 'set-theme', theme: targetTheme },
          'https://utteranc.es'
        );
      }
    }
  });

  // ── 3. 绑定切换按钮逻辑 ─────────────────────────────────────
  function bindBtn() {
    var btn = document.getElementById('night-nav');
    if (!btn) {
      setTimeout(bindBtn, 100);
      return;
    }
    // 替换节点清除旧事件，防止 Pjax 重复绑定导致一次点击触发多次切换
    var newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    newBtn.addEventListener('click', function () {
      isNight = !isNight;
      localStorage.setItem('night', isNight);
      applyNight(isNight);
    });
  }

  // ── 4. 初始化与 Pjax 支持 ───────────────────────────────────
  applyNight(isNight);
  bindBtn();

  document.addEventListener('pjax:complete', function () {
    // Pjax 切换页面后，重新读取状态并绑定按钮，等待新的 iframe 进行“握手”
    isNight = localStorage.getItem('night') === 'true';
    applyNight(isNight);
    bindBtn();
  });

}());