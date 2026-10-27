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
  SC.catLabel = function (id) {
    for (var i = 0; i < SC.CATS.length; i++) if (SC.CATS[i].id === id) return SC.CATS[i].label;
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

  w.SC = SC;
})(window);
