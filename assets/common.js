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
  /* 사이트 메뉴: 맨 앞 '전체' + 강의 분류 + 상품연구 전략자료(영상 없는 자료실, 강의 분류 아님) */
  SC.RESEARCH = { id: "research", label: "상품연구 전략자료" };
  SC.MENUS = [{ id: "all", label: "전체" }].concat(SC.CATS, [SC.RESEARCH]);
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
        /* 가로: 본문(카드 목록) 오른쪽 끝에서 16px 바깥. 자리가 없으면 화면 오른쪽 20px(휴대폰 12px) */
        var main = opts.main && document.querySelector(opts.main);
        if (main) {
          var mr = main.getBoundingClientRect(), cs = getComputedStyle(main);
          var contentRight = mr.right - (parseFloat(cs.paddingRight) || 0);
          var edge = small.matches ? 12 : 20;
          box.style.right = Math.max(edge, Math.round(document.documentElement.clientWidth - contentRight - 16 - box.offsetWidth)) + "px";
        }
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

  /* 라이트 / 다크 (사이트·관리자 공통, 저장값 localStorage 'sdp-theme')
     opts.tm: 두 칸 버튼 묶음(radiogroup, [data-theme-set]) · opts.ic: 해/달 아이콘 버튼
     바뀔 때 누른 자리에서 원이 퍼지며 바뀜(startViewTransition, 지원 안 하면 바로) */
  SC.THEME_KEY = "sdp-theme";
  SC.themeUI = function (opts) {
    opts = opts || {};
    var root = document.documentElement, KEY = SC.THEME_KEY;
    var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    var SUN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/></svg>';
    var MOON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>';
    function cur() { return root.getAttribute("data-theme") === "dark" ? "dark" : "light"; }
    function paint() {
      var t = cur(), mc = document.querySelector('meta[name="theme-color"]');
      var bar = opts.bar || { light: "#003CDC", dark: "#0B1442" };
      if (mc) mc.setAttribute("content", bar[t]);
      if (opts.tm) opts.tm.querySelectorAll("[data-theme-set]").forEach(function (b) { b.setAttribute("aria-checked", b.dataset.themeSet === t); });
      if (opts.ic) {
        opts.ic.innerHTML = t === "dark" ? SUN : MOON;
        opts.ic.setAttribute("aria-label", t === "dark" ? "라이트 모드로 바꾸기" : "다크 모드로 바꾸기");
        opts.ic.title = t === "dark" ? "라이트 모드" : "다크 모드";
      }
    }
    function apply(t, x, y) {
      var go = function () { root.setAttribute("data-theme", t); paint(); };
      if (!document.startViewTransition || reduce) { go(); return; }
      var r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
      try {
        var vt = document.startViewTransition(go);
        vt.ready.then(function () {
          root.animate({ clipPath: ["circle(0px at " + x + "px " + y + "px)", "circle(" + r + "px at " + x + "px " + y + "px)"] },
            { duration: 560, easing: "cubic-bezier(0.23,1,0.32,1)", pseudoElement: "::view-transition-new(root)" });
        }).catch(function () {});
      } catch (er) { go(); }
    }
    function set(t, e, el) {
      if (t === cur()) return;
      try { localStorage.setItem(KEY, t); } catch (er) {}
      var x = e && e.clientX, y = e && e.clientY;
      if (!x && !y && el) { var b = el.getBoundingClientRect(); x = b.left + b.width / 2; y = b.top + b.height / 2; }
      apply(t, x || innerWidth - 40, y || 40);
    }
    if (opts.tm) {
      opts.tm.addEventListener("click", function (e) { var b = e.target.closest("[data-theme-set]"); if (b) set(b.dataset.themeSet, e, b); });
      opts.tm.addEventListener("keydown", function (e) {
        if (!/^Arrow(Left|Right|Up|Down)$/.test(e.key)) return;
        e.preventDefault();
        var t = cur() === "dark" ? "light" : "dark", b = opts.tm.querySelector('[data-theme-set="' + t + '"]');
        set(t, null, b); b.focus();
      });
    }
    if (opts.ic) opts.ic.addEventListener("click", function (e) { set(cur() === "dark" ? "light" : "dark", e, this); });
    /* 직접 고른 적이 없으면 기기 설정이 바뀔 때 따라감 */
    if (window.matchMedia) {
      var mq = matchMedia("(prefers-color-scheme: dark)"), follow = function () {
        var saved = ""; try { saved = localStorage.getItem(KEY) || ""; } catch (er) {}
        if (!saved) { root.setAttribute("data-theme", mq.matches ? "dark" : "light"); paint(); }
      };
      if (mq.addEventListener) mq.addEventListener("change", follow); else if (mq.addListener) mq.addListener(follow);
    }
    paint();
    return { set: set, cur: cur };
  };

  /* M10 빛 라인 리빌: .lr 상자에 go 를 다시 붙여 처음부터 재생 (동작 줄이기면 아무것도 안 함) */
  SC.lineReveal = function (box) {
    if (!box || (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches)) return;
    var cs = getComputedStyle(box), d = parseFloat(cs.getPropertyValue("--lr-d")) || 300, w = parseFloat(cs.getPropertyValue("--lr-w")) || 0;
    box.classList.remove("go"); void box.offsetWidth; box.classList.add("go");
    box.classList.remove("is-out");
    clearTimeout(box._lrT); box._lrT = setTimeout(function () { box.classList.remove("go"); }, w + 80 + d + 160);
  };

  w.SC = SC;
})(window);
