/* 교육 자료실 공통 함수 (홈·영상 페이지·어드민에서 같이 사용) */
(function (w) {
  var SC = {};

  SC.esc = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };

  /* 유튜브 주소 → 영상 ID */
  SC.ytId = function (u) {
    if (!u) return "";
    u = String(u).trim();
    if (/^[\w-]{11}$/.test(u)) return u;
    var m = u.match(/(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/|\/live\/)([\w-]{11})/);
    return m ? m[1] : "";
  };

  SC.thumb = function (id, hi) {
    return "https://i.ytimg.com/vi/" + id + "/" + (hi ? "maxresdefault" : "hqdefault") + ".jpg";
  };

  /* 썸네일 이미지 태그 (고화질 없으면 일반 화질로) */
  SC.thumbImg = function (id, eager) {
    return '<img src="' + SC.thumb(id, true) + '" alt="" ' + (eager ? "" : 'loading="lazy" ') +
      'onerror="this.onerror=null;this.src=\'' + SC.thumb(id, false) + '\'">';
  };

  /* 구글드라이브 공유 링크 → 바로 다운로드 주소 */
  SC.driveId = function (link) {
    link = String(link || "").trim();
    var m = link.match(/\/d\/([\w-]{20,})/) || link.match(/[?&]id=([\w-]{20,})/);
    if (m) return m[1];
    return /^[\w-]{25,}$/.test(link) ? link : "";
  };
  SC.download = function (link, type) {
    link = String(link || "").trim();
    if (!link) return { url: "", kind: "" };
    var id = SC.driveId(link);
    if (/drive\.google\.com\/drive\/(u\/\d+\/)?folders\//.test(link)) return { url: "", kind: "folder" };
    if (id && /docs\.google\.com\/document/.test(link))
      return { url: "https://docs.google.com/document/d/" + id + "/export?format=" + (type === "docx" ? "docx" : "pdf"), kind: "gdoc" };
    if (id && /docs\.google\.com\/spreadsheets/.test(link))
      return { url: "https://docs.google.com/spreadsheets/d/" + id + "/export?format=" + (type === "pdf" ? "pdf" : "xlsx"), kind: "gsheet" };
    if (id && /docs\.google\.com\/presentation/.test(link))
      return { url: "https://docs.google.com/presentation/d/" + id + "/export/" + (type === "pdf" ? "pdf" : "pptx"), kind: "gslide" };
    if (id) return { url: "https://drive.usercontent.google.com/download?id=" + id + "&export=download&confirm=t", kind: "drive" };
    if (/^https?:\/\//.test(link)) return { url: link, kind: "other" };
    return { url: "", kind: "bad" };
  };

  /* 파일 이름 끝 확장자로 종류 판단 */
  SC.splitName = function (raw) {
    raw = String(raw || "").trim();
    var m = raw.match(/^(.*?)\.(pdf|xlsx|xls|pptx|ppt|docx|doc|hwp|hwpx|zip|mp4)$/i);
    if (!m) return { name: raw, type: "" };
    var e = m[2].toLowerCase(), map = { xls: "xlsx", ppt: "pptx", doc: "docx", hwpx: "hwp" };
    return { name: m[1].trim(), type: map[e] || e };
  };
  SC.typeLabel = function (t) {
    return { pdf: "PDF", xlsx: "XLS", pptx: "PPT", docx: "DOC", hwp: "HWP", zip: "ZIP", mp4: "MP4" }[t] || "FILE";
  };

  SC.fmtDate = function (d) {
    var m = String(d || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
    return m ? m[1] + "." + m[2] + "." + m[3] : "";
  };
  SC.isNew = function (d) {
    var t = Date.parse(d);
    return !isNaN(t) && Date.now() - t < 14 * 864e5;
  };
  SC.today = function () {
    var d = new Date(), z = function (n) { return (n < 10 ? "0" : "") + n; };
    return d.getFullYear() + "-" + z(d.getMonth() + 1) + "-" + z(d.getDate());
  };

  /* 설명 글: 줄바꿈 유지 + 주소는 링크로 */
  SC.richText = function (s) {
    return SC.esc(s).replace(/(https?:\/\/[^\s<]+)/g, function (u) {
      return '<a href="' + u + '" target="_blank" rel="noopener">' + u + "</a>";
    });
  };

  SC.inApp = function () {
    var ua = navigator.userAgent || "";
    if (/KAKAOTALK/i.test(ua)) return "kakao";
    if (/NAVER\(inapp|BAND\/|Instagram|FBAN|FBAV|Line\//i.test(ua)) return "other";
    return "";
  };

  SC.copy = function (text) {
    return new Promise(function (res, rej) {
      function legacy() {
        try {
          var ta = document.createElement("textarea");
          ta.value = text; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
          document.body.appendChild(ta); ta.select(); ta.setSelectionRange(0, text.length);
          var ok = document.execCommand("copy"); ta.remove(); ok ? res() : rej();
        } catch (e) { rej(e); }
      }
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(res, legacy);
      else legacy();
    });
  };

  /* 메뉴(강의 분류). 주소: signature/ newbie/ partner/ */
  SC.CATS = [
    { id: "signature", label: "시그니처클래스" },
    { id: "newbie", label: "신입 교육" },
    { id: "partner", label: "제휴사 상품 전략" }
  ];
  SC.catOf = function (v) {
    var c = v && v.category;
    for (var i = 0; i < SC.CATS.length; i++) if (SC.CATS[i].id === c) return c;
    return "signature";
  };
  /* 사이트 메뉴: 맨 앞 '전체' + 강의 분류 */
  SC.MENUS = [{ id: "all", label: "전체" }].concat(SC.CATS);
  SC.catLabel = function (id) {
    for (var i = 0; i < SC.MENUS.length; i++) if (SC.MENUS[i].id === id) return SC.MENUS[i].label;
    return SC.CATS[0].label;
  };
  SC.isPublic = function (v) { return !!v && v.visible !== false; };

  /* 사이트 아래 고지 문구 (첫 줄은 강조) */
  SC.NOTICE = "※ 본 자료는 교육용 자료입니다.\n온라인(SNS 포함) 게시, 고객 대상 설명, 광고 용도로 사용할 수 없습니다.";
  SC.noticeText = function (s) {
    s = String(s || "").trim();
    if (!s || /^본 자료는 판매자 교육용으로/.test(s)) return SC.NOTICE;
    return s;
  };

  /* 버튼 물결 효과: class="rp" 붙은 요소를 누르면 누른 자리에서 퍼짐 */
  SC.ripple = function () {
    document.addEventListener("pointerdown", function (e) {
      var el = e.target.closest && e.target.closest(".rp");
      if (!el || el.disabled) return;
      var r = el.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      var dx = Math.max(x, r.width - x), dy = Math.max(y, r.height - y);
      el.style.setProperty("--rx", x + "px");
      el.style.setProperty("--ry", y + "px");
      el.style.setProperty("--rs", Math.ceil(Math.sqrt(dx * dx + dy * dy) * 2) + "px");
      el.classList.remove("rp-on"); void el.offsetWidth; el.classList.add("rp-on");
      clearTimeout(el._rpT); el._rpT = setTimeout(function () { el.classList.remove("rp-on"); }, 900);
    }, { passive: true });
  };

  /* 오른쪽 아래 '맨 위로 · 맨 아래로' 버튼.
     - 페이지가 화면보다 길 때만 보임. 맨 위에선 ↓만, 맨 아래에선 ↑만, 중간에선 둘 다
     - opts.foot: 이 요소(맨 아래 검은 바)가 화면에 올라오면 그 위에 멈춤 */
  SC.fab = function (opts) {
    opts = opts || {};
    var box = document.createElement("div");
    box.className = "fab"; box.hidden = true;
    box.innerHTML =
      '<button type="button" class="rp" data-to="top" aria-label="맨 위로" title="맨 위로"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M6 11l6-6 6 6"/></svg></button>' +
      '<span class="fab-line" aria-hidden="true"></span>' +
      '<button type="button" class="rp" data-to="bottom" aria-label="맨 아래로" title="맨 아래로"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v14M6 13l6 6 6-6"/></svg></button>';
    document.body.appendChild(box);
    var up = box.children[0], line = box.children[1], down = box.children[2];
    var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    var small = window.matchMedia ? matchMedia("(max-width:560px)") : { matches: false };
    box.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      var top = b.dataset.to === "top" ? 0 : document.documentElement.scrollHeight;
      window.scrollTo({ top: top, behavior: reduce ? "auto" : "smooth" });
    });
    var raf = 0;
    function check() {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(function () {
        var de = document.documentElement, y = window.scrollY || de.scrollTop;
        var long = !document.body.classList.contains("no-fab") && de.scrollHeight > window.innerHeight + 40;
        box.hidden = !long;
        if (!long) return;
        var atTop = y < 8, atEnd = y + window.innerHeight >= de.scrollHeight - 8;
        up.hidden = atTop; down.hidden = atEnd; line.hidden = atTop || atEnd;
        var foot = opts.foot && document.querySelector(opts.foot);
        if (foot) {
          var base = small.matches ? 16 : 20, gap = small.matches ? 12 : 16;
          var over = window.innerHeight - foot.getBoundingClientRect().top;
          box.style.bottom = "calc(" + Math.max(base, over + gap) + "px + " + (over + gap > base ? "0px" : "env(safe-area-inset-bottom, 0px)") + ")";
        }
      });
    }
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    if (window.ResizeObserver) new ResizeObserver(check).observe(document.body);
    new MutationObserver(check).observe(document.body, { attributes: true, attributeFilter: ["class"] });
    check();
    return { check: check };
  };

  w.SC = SC;
})(window);
