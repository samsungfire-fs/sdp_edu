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

  /* 썸네일 이미지 태그 — 칸 크기에 맞는 화질만 받음(11-11 속도: 늘 1280px 고화질을 받던 것 → 휴대폰·PC 칸에 맞게 640/480px).
     고화질이 없는 영상이면 일반 화질로 */
  var THUMB_SIZES = "(max-width:560px) 52vw, (max-width:980px) 34vw, 420px";
  SC.thumbImg = function (id, eager, sizes) {
    var b = "https://i.ytimg.com/vi/" + id + "/";
    return '<img src="' + b + 'hqdefault.jpg" srcset="' + b + 'hqdefault.jpg 480w, ' + b + 'sddefault.jpg 640w, ' + b + 'maxresdefault.jpg 1280w" sizes="' + (sizes || THUMB_SIZES) + '" alt="" ' +
      (eager ? 'fetchpriority="high" ' : 'loading="lazy" decoding="async" ') +
      'onerror="this.onerror=null;this.removeAttribute(\'srcset\');this.src=\'' + b + 'hqdefault.jpg\'">';
  };

  /* 구글드라이브 공유 링크 → 바로 다운로드 주소 */
  /* 자료 하나를 가리키는 짧은 키 (기록 · 받은 사람 수): 드라이브 파일 ID, 없으면 링크의 해시 — 관리자 기록과 같은 규칙 */
  SC.fileKey = function (f) {
    var id = SC.driveId(f.link); if (id) return id;
    var h = 5381, s = String(f.link || ""); for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
    return "u" + h.toString(36);
  };
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
      if (opts.sw) opts.sw.setAttribute("aria-checked", t === "dark" ? "true" : "false");
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
    /* 관리자 #49: 라이트 (스위치) 다크 — 스위치를 누르거나 양옆 글자를 눌러도 바뀜 */
    if (opts.sw) {
      opts.sw.addEventListener("click", function (e) { set(cur() === "dark" ? "light" : "dark", e, this); });
      if (opts.sw.parentElement) opts.sw.parentElement.addEventListener("click", function (e) { var l = e.target.closest("[data-theme-set]"); if (l) set(l.dataset.themeSet, e, opts.sw); });
    }
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

  /* 강의 · 자료 목록 잠금 (기획 P2 · 11-11): 저장소에는 암호로 잠근 data/*.enc.json 만 두고,
     열쇠는 세일즈온 사번 목록이 로그인한 회원 · 관리자에게만 줌. AES-GCM 256 (브라우저 내장 암호) */
  function b64e(buf){ var b = new Uint8Array(buf), s = "", i; for (i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000)); return btoa(s); }
  function b64d(str){ var s = atob(String(str || "")), b = new Uint8Array(s.length); for (var i = 0; i < s.length; i++) b[i] = s.charCodeAt(i); return b; }
  function aesKey(k){ return crypto.subtle.importKey("raw", b64d(k), "AES-GCM", false, ["encrypt", "decrypt"]); }
  SC.box = {
    ok: !!(w.crypto && crypto.subtle),
    lock: function (obj, key, gate) {
      var iv = crypto.getRandomValues(new Uint8Array(12));
      return aesKey(key).then(function (k) { return crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, k, new TextEncoder().encode(JSON.stringify(obj))); })
        .then(function (ct) { return JSON.stringify({ v: 1, gate: gate || "", iv: b64e(iv), ct: b64e(ct) }) + "\n"; });
    },
    open: function (wrap, key) {
      return aesKey(key).then(function (k) { return crypto.subtle.decrypt({ name: "AES-GCM", iv: b64d(wrap.iv) }, k, b64d(wrap.ct)); })
        .then(function (pt) { return JSON.parse(new TextDecoder().decode(pt)); });
    }
  };

  /* #59 숫자만 넣는 칸: 숫자 키패드(inputmode=numeric · pattern) + 붙여 넣은 숫자 아닌 글자 지움
     + 키패드가 올라오면 칸과 [로그인](폼 묶음)이 키패드 위 16px 이상에 보이게, 아래 붙는 탭 바 · 토스트도 키패드 위로(--kb) */
  (function () {
    var d = document, de = d.documentElement, vv = w.visualViewport;
    function isNum(el) { return el && el.tagName === "INPUT" && el.getAttribute("inputmode") === "numeric"; }
    d.addEventListener("input", function (e) {
      var t = e.target; if (!isNum(t)) return;
      var v = t.value.replace(/\D/g, ""), max = +t.getAttribute("maxlength") || 0;
      if (max) v = v.slice(0, max);
      if (v !== t.value) { var p = t.selectionStart, cut = t.value.length - v.length; t.value = v; try { t.setSelectionRange(Math.max(0, p - cut), Math.max(0, p - cut)); } catch (er) {} }
    }, true);
    /* 키패드 높이: 화면 높이 − 보이는 높이 (iOS는 화면이 줄지 않고 키패드가 덮음) */
    function kb() { return vv ? Math.max(0, Math.round(w.innerHeight - vv.height)) : 0; }
    function setKb() { var k = kb(); de.style.setProperty("--kb", k + "px"); de.classList.toggle("kb-up", k > 80); }
    if (vv) { vv.addEventListener("resize", setKb); }
    /* 칸이 든 묶음의 [로그인] · [저장] 같은 버튼까지 키패드 위 16px 안으로 */
    function goal(el) {
      var f = el.closest("form, .ns-in, .k-row");
      var b = f && f.querySelector('button[type="submit"], .ubtn, .k-btn:not([hidden])');
      if (!b && f && f.tagName === "FORM") b = f.querySelector("button");
      return b && b.offsetParent ? b : el;
    }
    /* iOS(카톡 인앱 포함): 키패드 위에 ▲▼✓ 줄이 화면 위로 떠서 덮음 → 그만큼 더 띄움.
       화면 높이가 안 줄어드는 웹뷰면 키패드 높이를 어림(약 400px)으로 잡음 */
    var IOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    function viewBottom() {
      var vb = vv ? vv.offsetTop + vv.height : w.innerHeight;
      if (IOS && kb() < 80 && w.innerHeight > (w.screen ? screen.height : 800) * 0.6) vb = w.innerHeight - Math.min(420, w.innerHeight * 0.5);
      return vb - 16 - (IOS ? 60 : 0);
    }
    function covered(t) {
      var r = t.getBoundingClientRect(), top = vv ? vv.offsetTop : 0, bottom = viewBottom();
      return r.bottom > bottom ? r.bottom - bottom : (r.top < top + 8 ? r.top - top - 8 : 0);
    }
    function fit(el) {
      if (!d.contains(el) || d.activeElement !== el) return;
      setKb();
      var t = goal(el), dy;
      if (t !== el) {                                                /* 칸 ~ 버튼이 한 화면에 다 못 들어오면 칸을 먼저 */
        var h = viewBottom() - (vv ? vv.offsetTop : 0);
        if (t.getBoundingClientRect().bottom - el.getBoundingClientRect().top > h - 8) t = el;
      }
      dy = covered(t);
      if (!dy) return;
      var y0 = w.scrollY; w.scrollBy(0, dy);
      setTimeout(function () {                                       /* 화면이 안 움직였거나(편집 시트 안 등) 아직 가리면 */
        if (d.activeElement !== el) return;
        if (w.scrollY === y0 && covered(t) > 2) t.scrollIntoView({ block: "center" });   /* 창이 아니라 안쪽 칸이 스크롤되는 곳 */
      }, 80);
    }
    /* 사파리가 키패드를 올리면서 스크롤을 되돌리는 때가 있어 조금 뒤 두 번 더 맞춤 */
    function fitLater(el) { [350, 900].forEach(function (ms) { setTimeout(function () { if (cur === el) fit(el); }, ms); }); }
    var cur = null, again = null, touchAt = 0;
    function isField(t) { return t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) && !/^(checkbox|radio|button|submit|file|range|color)$/.test(t.type); }
    function coarse() { return w.matchMedia && matchMedia("(pointer:coarse)").matches; }
    /* 키패드가 올라올 때 맞추기 시작: 아래 여백 · 브랜드 칸 접기(kb-in) → 키패드가 다 올라오면 맞춤, 조금 뒤 두 번 더 */
    function activate(t) {
      cur = t; de.classList.add("kb-in");
      var done = false, go = function () { if (done) return; done = true; if (vv) vv.removeEventListener("resize", go); setTimeout(function () { fit(t); fitLater(t); }, 60); };
      if (vv) vv.addEventListener("resize", go);
      setTimeout(go, 450);
    }
    /* 사용자가 직접 누른 때만(1.5초 안) — 화면이 열릴 때 코드가 칸에 커서를 두는 것(키패드 안 뜸)으로는 화면을 옮기지 않음 */
    function onTouch(e) {
      if (e.type === "pointerdown" && e.pointerType === "mouse") return;
      touchAt = Date.now();
      /* 이미 커서가 있는 칸을 누르면 focusin이 다시 안 생김(사이트 로그인은 사번 칸에 커서를 먼저 둠) → 여기서 시작 */
      var t = e.target && e.target.closest ? e.target.closest("input, textarea, select") : null;
      /* 누르는 도중에 화면이 바뀌면 손가락 밑 칸이 달라져 커서가 빠짐 → 손을 뗀 뒤(0.4초) 아직 그 칸이면 시작 */
      if (isField(t) && d.activeElement === t && coarse() && !de.classList.contains("kb-in"))
        setTimeout(function () { if (d.activeElement === t && !de.classList.contains("kb-in")) activate(t); }, 400);
    }
    d.addEventListener("touchstart", onTouch, { passive: true, capture: true });
    d.addEventListener("pointerdown", onTouch, { passive: true, capture: true });
    d.addEventListener("focusin", function (e) {
      var t = e.target; if (!isField(t) || !coarse()) return;
      cur = t;
      if (Date.now() - touchAt > 1500 && kb() < 80) return;           /* 코드가 둔 커서: 키패드가 실제로 올라오면(아래 resize) 그때 맞춤 */
      activate(t);
    });
    d.addEventListener("focusout", function () {
      setTimeout(function () { var a = d.activeElement; if (!isField(a)) { cur = null; de.classList.remove("kb-in"); } setKb(); }, 300);
    });
    /* 키패드 위 줄(자동 완성 · ▲▼✓)이 늦게 붙어 높이가 또 바뀌거나, 커서만 있던 칸에서 키패드가 올라오면 다시 맞춤 */
    if (vv) vv.addEventListener("resize", function () {
      if (!cur || d.activeElement !== cur) return;
      if (kb() > 80 && !de.classList.contains("kb-in")) { activate(cur); return; }
      clearTimeout(again); again = setTimeout(function () { if (cur) fit(cur); }, 120);
    });
  })();

  w.SC = SC;
})(window);
