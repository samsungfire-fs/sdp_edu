/* 교육 자료실 관리자 — data/videos.json 을 편집해 GitHub에 바로 저장합니다. */
(function(){
  var esc = SC.esc, $ = function(id){ return document.getElementById(id); };
  var REDUCE = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var LS = {
    get: function(k){ try { return localStorage.getItem(k) || ""; } catch(e){ return ""; } },
    set: function(k, v){ try { v ? localStorage.setItem(k, v) : localStorage.removeItem(k); } catch(e){} }
  };
  var IC = {
    up:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 15 6-6 6 6"/></svg>',
    down:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>',
    del:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
    plus:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    grip:'<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="9" cy="6" r="1.7"/><circle cx="15" cy="6" r="1.7"/><circle cx="9" cy="12" r="1.7"/><circle cx="15" cy="12" r="1.7"/><circle cx="9" cy="18" r="1.7"/><circle cx="15" cy="18" r="1.7"/></svg>',
    cal:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>',
    eye:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/></svg>',
    lock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4.5" y="10.5" width="15" height="10" rx="3"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/></svg>',
    refresh:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/></svg>',
    pen:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/></svg>',
    img:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="4.5" width="17" height="15" rx="3"/><circle cx="9" cy="10" r="1.8"/><path d="m4 17 5-4.5 4 3.5 3-2.5 4 3.5"/></svg>',
    upload:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 15V4m0 0L7.5 8.5M12 4l4.5 4.5M5 19.5h14"/></svg>',
    tri:'<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 7 19 16H5z"/></svg>'
  };

  /* ---------- 상태 ---------- */
  var data = { site:{}, videos:[] }, sha = null, branch = "main";
  var SS = {
    get: function(k){ try { return sessionStorage.getItem(k) || ""; } catch(e){ return ""; } },
    set: function(k, v){ try { v ? sessionStorage.setItem(k, v) : sessionStorage.removeItem(k); } catch(e){} }
  };
  /* 로그인 정보: '로그인 유지'면 localStorage, 아니면 이 탭(sessionStorage)에만 */
  var token = LS.get("sc-gh-token") || SS.get("sc-gh-token"), apiKey = LS.get("sc-api-key") || SS.get("sc-api-key");
  function keepSession(tok, key, remember){
    token = tok; apiKey = key || "";
    LS.set("sc-gh-token", remember ? token : ""); LS.set("sc-api-key", remember ? apiKey : "");
    SS.set("sc-gh-token", token); SS.set("sc-api-key", apiKey);
  }
  function clearSession(){ keepSession("", "", false); SS.set("sc-gh-token", ""); SS.set("sc-api-key", ""); }
  /* 기획 P5: 관리자 사번 로그인 — 창구(Apps Script) 주소 · 로그인한 관리자 · 세션(그날 밤 12시까지) */
  var GATE_URL = "", gateInfo = null, adminSes = null, SID_KEY = "sdp-admin-sid";
  var canSave = false, dirty = false, openV = null, armedDel = null, saving = false;
  /* 상품연구 전략자료 (data/research.json): 월 → 연령 → 자료. 새로 올린 썸네일은 저장 때까지 pendingImgs에 */
  var rdata = { months:[] }, rsha = null, openM = null, openA = null, pendingImgs = {};
  /* 저장된 상태와 비교: 바꿨다가 원래대로 되돌리면 저장할 필요 없음 */
  var baseline = "";

  /* 저장소 자동 인식: 계정.github.io/저장소/admin.html */
  var owner = "", repo = "";
  (function(){
    var h = location.hostname, seg = location.pathname.split("/").filter(Boolean);
    if (/\.github\.io$/i.test(h)){
      owner = h.split(".")[0];
      repo = (seg.length && !/\.html?$/i.test(seg[0])) ? seg[0] : h;
    } else {
      $("repoFields").hidden = false;
      owner = LS.get("sc-owner") || $("ghOwner").value; repo = LS.get("sc-repo") || $("ghRepo").value;
      $("ghOwner").value = owner; $("ghRepo").value = repo;
    }
    $("repoName").textContent = repo;
    $("keyRef").textContent = "https://" + owner + ".github.io/*";
  })();

  var toastT;
  function toast(msg){ var t = $("toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(toastT); toastT = setTimeout(function(){ t.classList.remove("show"); }, 2600); }

  /* ---------- GitHub ---------- */
  function gh(path, opts){
    opts = opts || {};
    var headers = { "Accept":"application/vnd.github+json", "X-GitHub-Api-Version":"2022-11-28" };
    if (token) headers.Authorization = "Bearer " + token;
    if (opts.body) headers["Content-Type"] = "application/json";
    return fetch("https://api.github.com/repos/" + owner + "/" + repo + path, { method: opts.method || "GET", headers: headers, body: opts.body, cache:"no-store" })
      .then(function(r){
        return r.text().then(function(t){
          var j = null; try { j = t ? JSON.parse(t) : null; } catch(e){}
          if (!r.ok){ var err = new Error((j && j.message) || ("HTTP " + r.status)); err.status = r.status; throw err; }
          return j;
        });
      });
  }
  function b64enc(str){ var b = new TextEncoder().encode(str), s = ""; for (var i = 0; i < b.length; i++) s += String.fromCharCode(b[i]); return btoa(s); }
  function b64dec(b64){ var s = atob(String(b64).replace(/\s/g, "")), b = new Uint8Array(s.length); for (var i = 0; i < s.length; i++) b[i] = s.charCodeAt(i); return new TextDecoder().decode(b); }

  function setConn(cls, text, note){ var n = $("meNote"); n.textContent = cls === "ok" ? "" : text + (note ? " · " + note : ""); n.hidden = cls === "ok" || !note; if (typeof Auth !== "undefined") Auth.paintMe(); }

  function load(){
    canSave = false; updateSaveBar("불러오는 중…");
    if (!token){
      setConn("warn", "보기만", "토큰이 없어서 저장할 수 없어요.");
      Route.go("#/settings/me");
      return siteJson().then(function(r){ useData(r[0] || { site:{}, videos:[] }, r[1]); updateSaveBar(); });
    }
    return gh("")
      .then(function(info){
        branch = info.default_branch || "main";
        if (info.permissions && info.permissions.push === false) throw Object.assign(new Error("no push"), { status:403 });
        return Promise.all([repoJson("data/videos.json"), repoJson("data/research.json")]);
      })
      .then(function(r){
        var file = r[0], rf = r[1];
        sha = file ? file.sha : null; rsha = rf ? rf.sha : null;
        useData(file ? file.json : { site:{ title:"교육 자료실" }, videos:[] }, rf ? rf.json : null);
        canSave = true; setConn("ok", "연결됨", (adminSes ? "로그인 " + adminSes.name + (adminSes.master ? "(마스터)" : "") + " · 사번 " + adminSes.sabun + " · 오늘 밤 12시까지\n" : "") + "저장소 " + owner + "/" + repo);
        lastUpdate(); Deploy.start();
        if (apiKey){
          data.videos.forEach(function(v){ v.files.forEach(function(f){ if (f.link.trim()) fetchFile(f, true); }); });
          rdata.months.forEach(function(m){ m.ages.forEach(function(a){ a.files.forEach(function(f){ if (f.link.trim()) fetchFile(f, true); }); }); });
        }
        /* 강의별 공유 페이지·메뉴 주소가 빠져 있으면 조용히 만들어 둠 (저장 버튼은 건드리지 않음) */
        autoPages();
        Gate.load();
        Auth.afterLoad();
        Audit.load();
        updateSaveBar();
      })
      .catch(function(e){
        if (e.status !== 401) Route.go("#/settings/me");
        if (e.status === 401){ clearSession(); showGate(authInfo ? "change" : "first", "저장된 토큰이 만료됐거나 지워졌어요. 새 토큰을 넣어 주세요."); return; }
        else if (e.status === 403) setConn("bad", "권한 없음", "토큰에 쓰기 권한이 없어요.");
        else if (e.status === 404) setConn("bad", "저장소 없음", "저장소를 찾을 수 없어요. 토큰의 저장소 선택을 확인해 주세요.");
        else setConn("bad", "연결 안 됨", "연결하지 못했어요. 인터넷 연결을 확인해 주세요.");
        return siteJson().then(function(r){ useData(r[0] || { site:{}, videos:[] }, r[1]); updateSaveBar(); });
      });
  }
  /* 저장소에서 JSON 파일 읽기 (sha 포함) / 사이트에서 바로 읽기 */
  function repoJson(path){
    return gh("/contents/" + path + "?ref=" + encodeURIComponent(branch))
      .then(function(f){ return { sha: f.sha, json: JSON.parse(b64dec(f.content)) }; })
      .catch(function(e){ if (e.status === 404) return null; throw e; });
  }
  function siteJson(){
    function one(p){ return fetch(p + "?t=" + Date.now(), { cache:"no-store" }).then(function(r){ return r.ok ? r.json() : null; }).catch(function(){ return null; }); }
    return Promise.all([one("data/videos.json"), one("data/research.json")]);
  }

  function fileIn(f){ return { name: f.name || "", type: f.type || "", link: f.link || "", size: f.size || "", _st: "" }; }
  function useData(j, rj){
    data = { site: j.site || {}, videos: (j.videos || []).map(function(v){
      return {
        id: v.id || "", _url: v.id ? "https://youtu.be/" + v.id : "", title: v.title || "", channel: v.channel || "",
        description: v.description || "", duration: v.duration || "", date: v.date || "", _st: v.id ? "ok" : "",
        category: SC.catOf(v), visible: v.visible !== false, publishedAt: v.publishedAt || "", _oid: v.id || "",
        files: (v.files || []).map(fileIn)
      };
    }) };
    rdata = { months: ((rj && rj.months) || []).map(function(m){
      var mo = { ym: m.ym || "", _oym: m.ym || "", title: m.title || "", thumb: m.thumb || "", visible: m.visible !== false, ages: [] };
      mo.ages = (m.ages || []).map(function(a){ return { id: a.id || newAgeId(mo), title: a.title || "", thumb: a.thumb || "", visible: a.visible !== false, files: (a.files || []).map(fileIn) }; });
      return mo;
    }) };
    openM = openA = null; pendingImgs = {};
    /* 사이트 이름 변경: 시그니처클래스 → 영개파 (저장하면 사이트에 반영) */
    baseline = snap();
    var renamed = false;
    if (/^\s*시그니처클래스\s*교육\s*자료실\s*$/.test(data.site.title || "")){ data.site.title = "영개파 교육 자료"; renamed = true; }
    /* 고지 문구를 디자인팀 새 문구로 (예전 기본 문구였거나 비어 있으면) */
    var nt = SC.noticeText(data.site.notice);
    if (nt !== (data.site.notice || "")){ data.site.notice = nt; renamed = true; }
    document.querySelectorAll("[data-site]").forEach(function(el){ el.value = data.site[el.dataset.site] || ""; });
    openV = null; dirty = snap() !== baseline; render();
  }

  /* ---------- 유튜브 / 드라이브 정보 가져오기 ---------- */
  function fmtDur(iso){
    var m = String(iso || "").match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/); if (!m) return "";
    var h = +(m[1] || 0), mi = +(m[2] || 0), s = +(m[3] || 0);
    if (h) return h + "시간" + (mi ? " " + mi + "분" : "");
    if (mi) return mi + "분";
    return s + "초";
  }
  function ytMeta(id){
    var watch = "https://www.youtube.com/watch?v=" + id;
    function api(){
      if (!apiKey) return Promise.reject(new Error("no key"));
      return fetch("https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=" + id + "&key=" + encodeURIComponent(apiKey))
        .then(function(r){ if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(function(j){
          var it = j.items && j.items[0]; if (!it) throw new Error("not found");
          return { title: it.snippet.title, channel: it.snippet.channelTitle, description: (it.snippet.description || "").replace(/\r/g, "").trim(),
                   duration: fmtDur(it.contentDetails.duration), date: (it.snippet.publishedAt || "").slice(0, 10), publishedAt: it.snippet.publishedAt || "", full: true };
        });
    }
    function oembed(){
      return fetch("https://www.youtube.com/oembed?format=json&url=" + encodeURIComponent(watch))
        .then(function(r){ if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(function(d){ return { title: d.title, channel: d.author_name }; });
    }
    function noembed(){
      return new Promise(function(res, rej){
        var cb = "__ne" + Date.now() + Math.floor(Math.random() * 1e4), s = document.createElement("script"), done = false;
        var t = setTimeout(function(){ fin(); rej(new Error("timeout")); }, 8000);
        function fin(){ if (done) return; done = true; clearTimeout(t); try { delete window[cb]; } catch(e){ window[cb] = undefined; } s.remove(); }
        window[cb] = function(d){ var ok = d && d.title; fin(); ok ? res({ title: d.title, channel: d.author_name }) : rej(new Error("no title")); };
        s.onerror = function(){ fin(); rej(new Error("load")); };
        s.src = "https://noembed.com/embed?callback=" + cb + "&url=" + encodeURIComponent(watch);
        document.head.appendChild(s);
      });
    }
    return api().catch(oembed).catch(noembed);
  }
  function fetchVideo(v, force){
    var id = SC.ytId(v._url);
    if (!id){ v.id = ""; v._st = v._url.trim() ? "bad" : ""; render(); return; }
    if (v.id === id && !force && v._st === "ok") return;
    v.id = id; v._st = "loading"; render();
    ytMeta(id).then(function(m){
      if (SC.ytId(v._url) !== id) return;
      v.title = m.title || v.title; v.channel = m.channel || v.channel;
      if (m.full){ v.description = m.description; v.duration = m.duration; if (m.date) v.date = m.date; if (m.publishedAt) v.publishedAt = m.publishedAt; }
      if (!v.date) v.date = SC.today();
      v._st = m.full ? "ok" : "partial"; markDirty(); render();
    }).catch(function(){
      if (SC.ytId(v._url) !== id) return;
      if (!v.date) v.date = SC.today();
      v._st = "fail"; markDirty(); render();
    });
  }
  var MIME = { "application/pdf":"pdf", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":"xlsx", "application/vnd.ms-excel":"xlsx",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation":"pptx", "application/vnd.ms-powerpoint":"pptx",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document":"docx", "application/msword":"docx",
    "application/x-hwp":"hwp", "application/haansofthwp":"hwp", "application/zip":"zip", "video/mp4":"mp4",
    "application/vnd.google-apps.document":"pdf", "application/vnd.google-apps.spreadsheet":"xlsx", "application/vnd.google-apps.presentation":"pptx" };
  function fmtSize(b){ b = +b; if (!b) return ""; return b >= 1048576 ? (b / 1048576).toFixed(b >= 10485760 ? 0 : 1) + "MB" : Math.max(1, Math.round(b / 1024)) + "KB"; }
  /* 드라이브 파일 정보(이름·종류·용량)를 가져와 자료 이름을 채움. silent: 불러올 때 조용히 맞춤 */
  function fetchFile(f, silent){
    var id = SC.driveId(f.link);
    if (!id){ f._st = ""; render(); return; }
    if (!apiKey){ f._st = "nokey"; render(); return; }
    f._st = "loading"; if (!silent) render();
    fetch("https://www.googleapis.com/drive/v3/files/" + id + "?fields=name,size,mimeType&supportsAllDrives=true&key=" + encodeURIComponent(apiKey))
      .then(function(r){
        return r.json().catch(function(){ return {}; }).then(function(j){
          if (r.ok) return j;
          var er = (j && j.error) || {}, reasons = JSON.stringify(er);
          var kind = r.status === 404 ? "private"
            : /accessNotConfigured|SERVICE_DISABLED|has not been used|is disabled/i.test(reasons) ? "api"
            : /API_KEY_HTTP_REFERRER_BLOCKED|referer|API_KEY_SERVICE_BLOCKED|keyInvalid|API_KEY_INVALID|ipRefererBlocked/i.test(reasons) ? "key"
            : r.status === 403 ? "private" : "error";
          throw Object.assign(new Error(r.status), { kind: kind });
        });
      })
      .then(function(j){
        var before = f.name + "|" + f.type + "|" + f.size;
        if (j.name){ var sn = SC.splitName(j.name); f.name = sn.name; f.type = sn.type || MIME[j.mimeType] || f.type; }
        else if (MIME[j.mimeType]) f.type = MIME[j.mimeType];
        f.size = fmtSize(j.size);
        f._st = "ok";
        if (before !== f.name + "|" + f.type + "|" + f.size) markDirty();
        render();
      })
      .catch(function(e){ f._st = e.kind || "error"; render(); });
  }

  /* ---------- 화면 ---------- */
  function fileStatus(f){
    var sn = SC.splitName(f.name), d = SC.download(f.link, sn.type || f.type);
    if (!f.link.trim()) return '<span class="pill idle">드라이브 링크를 넣어 주세요</span>';
    if (d.kind === "folder") return '<span class="pill bad">폴더 링크예요. 파일 하나의 링크를 넣어 주세요</span>';
    if (d.kind === "bad") return '<span class="pill bad">링크 형식을 확인해 주세요</span>';
    var errs = {
      "private": "파일을 열 수 없어요 · 드라이브 공유를 ‘링크가 있는 모든 사용자’로 바꿔 주세요",
      "api": "구글 콘솔에서 Google Drive API를 ‘사용’으로 켜 주세요",
      "key": "API 키 제한에 막혔어요 · 키의 API 제한에 Google Drive API가 있는지, 웹사이트 제한 주소가 맞는지 확인해 주세요",
      "nokey": "계정 설정에 Google API 키를 넣어야 자료 이름을 가져올 수 있어요",
      "error": "파일 정보를 가져오지 못했어요 · 잠시 뒤 링크를 다시 붙여 넣어 주세요"
    };
    if (errs[f._st]) return '<span class="pill bad">' + errs[f._st] + '</span>';
    var s = d.kind === "other" ? '<span class="pill warn">드라이브 링크가 아니에요. 그대로 연결돼요</span>' : '<span class="pill ok">바로 받기 링크로 바뀌었어요</span>';
    if (f._st === "loading") s += '<span>파일 정보 확인 중…</span>';
    return s + '<a href="' + esc(d.url) + '" target="_blank" rel="noopener">받아보기 ↗</a>';
  }
  function videoStatus(v){
    if (!v._url.trim()) return '<span class="pill idle">유튜브 주소를 넣어 주세요</span>';
    return {
      bad: '<span class="pill bad">유튜브 주소를 인식하지 못했어요</span>',
      loading: '<span class="pill idle">영상 정보를 가져오는 중…</span>',
      ok: '<span class="pill ok">영상 정보를 가져왔어요</span>',
      partial: '<span class="pill warn">제목만 가져왔어요 · API 키를 넣으면 소개·길이도 채워져요</span>',
      fail: '<span class="pill bad">영상 정보를 못 가져왔어요 · 비공개 영상이면 ‘일부 공개’로 바꿔 주세요</span>'
    }[v._st] || "";
  }
  function badges(v){
    var p = ['<span class="bdg priv">비공개</span>'];
    if (!v.id){ p.push('<span class="bdg new dim">새 강의</span>'); return p.join(""); }
    var n = v.files.length, miss = v.files.filter(function(f){ return !SC.download(f.link, f.type).url; }).length;
    if (v.date) p.push('<span class="bdg date dim">' + IC.cal + SC.fmtDate(v.date) + '</span>');
    if (v.duration) p.push('<span class="bdg dim">' + esc(v.duration) + '</span>');
    p.push(n ? '<span class="bdg files dim">자료 ' + n + '개</span>' : '<span class="bdg dim">자료 없음</span>');
    if (miss) p.push('<span class="bdg miss dim">링크 없음 ' + miss + '</span>');
    p.push(Audit.rowWho("v:" + v.id));
    return p.join("");
  }
  function seg(act, i, val, on, label, icon){
    return '<button type="button" class="seg rp" role="radio" aria-checked="' + on + '" data-act="' + act + '" data-i="' + i + '" data-val="' + val + '">' + (icon || "") + esc(label) + '</button>';
  }
  /* 강의 줄: 오른쪽 [✎ 편집] → 오른쪽 편집 칸에서 고침 (#20) */
  function edBtn(on, attrs){
    return '<button type="button" class="ed-btn rp" ' + attrs + ' aria-pressed="' + on + '">' + IC.pen + '<span>' + (on ? "편집 중" : "편집") + '</span></button>';
  }
  /* #31 목록 줄 제목: 앞의 [메뉴명📖] 머리말은 빼고(메뉴 칸에 이미 보임), 전체 제목은 마우스를 올리면 */
  function listTitle(t){ var s = String(t || "").replace(/^\[[^\]]*\]\s*/, ""); return s || t || "제목 없음"; }
  function itemHtml(v, i){
    var ed = v === openV, pub = v.visible !== false;
    return '<li class="vitem' + (ed ? " editing" : "") + '" data-v="' + i + '" data-vis="' + pub + '">' +
      '<div class="vrow" data-act="toggle" data-i="' + i + '">' +
      (v.id ? '<div class="vthumb dim">' + SC.thumbImg(v.id) + '</div>' : '<div class="vthumb blank dim">영상 없음</div>') +
      '<div class="vtext"><h3 class="dim vtitle" title="' + esc(v.title || "") + '">' + esc(listTitle(v.title)) + '</h3><div class="badges">' + badges(v) + '</div></div>' +
      '<button type="button" class="vs" role="switch" aria-checked="' + pub + '" data-act="vis" data-i="' + i + '" aria-label="사이트에 공개">' +
        '<span class="vs-track"><span class="vs-knob"></span></span><span class="vs-t">' + (pub ? "공개" : "비공개") + '</span></button>' +
      edBtn(ed, 'data-act="toggle" data-i="' + i + '"') +
      '</div></li>';
  }
  /* 교육자료 줄 (강의·연령 공통). attrs: 어느 강의/연령인지, idp: 입력칸 id 앞부분 */
  /* 저장된 자료(파일 키) — 아직 저장 안 한 새 자료를 가려 '추가 · 방금'으로 */
  var baseCache = { s: null, o: null };
  function savedKeys(kind, id, ageId){
    if (baseCache.s !== baseline){ baseCache.s = baseline; try { baseCache.o = JSON.parse(baseline); } catch(e){ baseCache.o = null; } }
    var B = baseCache.o, out = {}, files = [];
    if (!B || !id) return out;
    if (kind === "v"){ var v = B.v.videos.filter(function(x){ return x.id === id; })[0]; files = v ? v.files : []; }
    else { var m = B.r.months.filter(function(x){ return x.ym === id; })[0], a = m && m.ages.filter(function(x){ return x.id === ageId; })[0]; files = a ? a.files : []; }
    files.forEach(function(f){ out[fileKey(f)] = 1; });
    return out;
  }
  function filesHtml(files, attrs, idp, delAct, ft, saved){
    return files.map(function(f, j){
      var t = f.type || SC.splitName(f.name).type || "pdf";
      return '<div class="frow">' +
        '<div class="fmain">' +
          '<div class="fhead">' +
            '<span class="ftype ' + ({ pdf:"pdf", xlsx:"xlsx", pptx:"pptx", docx:"docx", hwp:"hwp" }[t] || "etc") + '">' + SC.typeLabel(t) + '</span>' +
            '<div class="fname">' + (f.name ? '<strong>' + esc(f.name) + '</strong>' + (f.size ? '<span>' + esc(f.size) + '</span>' : '') : '<span class="ph">드라이브 링크를 넣으면 파일 이름이 자동으로 들어가요</span>') + '</div>' +
          '</div>' +
          '<input type="url" id="' + idp + 'f' + j + 'l" class="in mono" ' + attrs + ' data-f="' + j + '" data-fk="link" value="' + esc(f.link) + '" placeholder="구글드라이브 공유 링크" aria-label="자료 ' + (j+1) + ' 드라이브 링크" autocomplete="off">' +
          '<div class="fstat" id="' + idp + 'f' + j + 's">' + fileStatus(f) + '</div>' +
          (ft && f.link.trim() ? Audit.fileWho(ft + ":" + fileKey(f), !saved[fileKey({ link: f.link.trim() })]) : '') +
        '</div>' +
        '<button type="button" class="fdel rp" data-act="' + delAct + '" ' + attrs + ' data-f="' + j + '" aria-label="자료 ' + (j+1) + ' 빼기" title="자료 빼기">' + IC.del + '</button>' +
      '</div>';
    }).join("");
  }
  function delAsk(on, q, yes, no, del, label){
    return on
      ? '<span class="del-ask">' + q + '<button type="button" class="del-yes rp" ' + yes + '>정말 삭제</button><button type="button" class="del-no rp" ' + no + '>취소</button></span>'
      : '<button type="button" class="del-btn rp" ' + del + '>' + IC.del + label + '</button>';
  }
  /* 강의 편집 칸 내용 */
  function videoBody(v, i){
    var id = "v" + i, pub = v.visible !== false, cat = SC.catOf(v), n = v.files.length;
    return '<div class="ed-sum">' +
        (v.id ? '<div class="vthumb">' + SC.thumbImg(v.id) + '</div>' : '<div class="vthumb blank">영상 없음</div>') +
        '<div class="ed-sum-t"><span>' + IC.cal + (v.date ? '<span class="nowrap">유튜브 ' + longDate(v.publishedAt || v.date) + '</span>' + (v.duration ? ' · <span class="nowrap">' + esc(v.duration) + '</span>' : '') + ' · <span class="nowrap">자료 ' + n + '개</span>' : '유튜브 주소를 넣어 주세요') + '</span>' +
        (v._oid ? Audit.sumWho("v:" + v._oid) : '') + '</div></div>' +
      '<div class="f"><span class="lbl" id="' + id + 'visL">공개 설정</span>' +
        '<div class="segs" role="radiogroup" aria-labelledby="' + id + 'visL">' +
          seg("visSet", i, "1", pub, "공개", IC.eye) + seg("visSet", i, "0", !pub, "비공개", IC.lock) + '</div>' +
        '<span class="help">' + (pub ? "사이트 목록과 강의 주소에서 누구나 볼 수 있어요."
          : "사이트 목록·검색·다른 강의에서 빠지고, 강의 주소로 들어와도 보이지 않아요.<br>저장해야 반영돼요.") + '</span></div>' +
      '<div class="f"><label for="' + id + 'url">유튜브 영상 주소</label>' +
        '<input type="url" id="' + id + 'url" class="in mono" data-i="' + i + '" data-k="_url" value="' + esc(v._url) + '" placeholder="https://youtu.be/… 또는 https://www.youtube.com/watch?v=…" autocomplete="off">' +
        '<div class="url-row">' + videoStatus(v) + (v.id ? '<button type="button" class="btn-soft rp press" data-act="refetch" data-i="' + i + '">' + IC.refresh + '유튜브에서 다시 가져오기</button>' : '') + '</div></div>' +
      '<div class="f"><span class="lbl">유튜브에 올린 날짜</span>' +
        '<div class="ro">' + (v.date ? '<b>' + longDate(v.publishedAt || v.date) + '</b> · 유튜브에서 자동으로 가져와요' : '유튜브 주소를 넣으면 자동으로 들어가요') + '</div>' +
        '<span class="help">목록과 사이트 순서는 이 날짜로 정해져요(최신이 위).</span></div>' +
      '<div class="f"><label for="' + id + 'title">제목</label><input type="text" id="' + id + 'title" class="in" data-i="' + i + '" data-k="title" value="' + esc(v.title) + '"></div>' +
      '<div class="f"><label for="' + id + 'desc">강의 소개</label><textarea id="' + id + 'desc" class="in" rows="5" data-i="' + i + '" data-k="description">' + esc(v.description) + '</textarea>' +
        '<span class="help">유튜브 영상 설명이 자동으로 들어가요.<br>고쳐도 돼요.</span></div>' +
      '<div class="fileset"><div class="fileset-h"><span class="lbl">교육자료 <span class="num">' + n + '</span>개</span>' +
        '<span class="help">드라이브에서 파일 우클릭 → 공유 → ‘링크가 있는 모든 사용자’ → 링크 복사</span></div>' +
        '<div class="fsort">' + filesHtml(v.files, 'data-i="' + i + '"', id, "fdel", "f:" + (v._oid || v.id), savedKeys("v", v._oid)) + '</div>' +
        '<div><button type="button" class="btn-soft rp press" data-act="addFile" data-i="' + i + '">' + IC.plus + '자료 추가</button></div></div>' +
      (v._oid ? Audit.histHtml("v:" + v._oid) : '') +
      '<div class="vfoot">' + (v.id && pub ? '<a class="site-link rp" href="v/' + esc(v.id) + '/" target="_blank" rel="noopener">사이트에서 보기 ↗</a>' : '<span></span>') +
        '<div class="vfoot-r"><label class="amove"><span>메뉴 옮기기</span><select data-move="' + i + '" aria-label="메뉴 옮기기">' +
          SC.CATS.map(function(c){ return '<option value="' + c.id + '"' + (c.id === cat ? ' selected' : '') + '>' + esc(c.label) + '</option>'; }).join("") +
        '</select></label>' + delAsk(armedDel === v, "정말 삭제할까요?", 'data-act="delYes" data-i="' + i + '"', 'data-act="delNo"', 'data-act="del" data-i="' + i + '"', "강의 삭제") + '</div></div>';
  }
  /* ---------- 목록 보기: 메뉴 칸 · 검색 · 정렬 · 공개 필터 (보기만 바뀌고 저장되지 않음) ---------- */
  var RID = "research";
  var view = { cat: "signature", q: "", sort: "new", vf: "all" };
  try { var vc = LS.get("sc-admin-cat"); if (vc === RID || SC.CATS.some(function(c){ return c.id === vc; })) view.cat = vc; } catch(e){}
  function norm(t){ return String(t || "").toLowerCase().replace(/\s+/g, ""); }
  function ts(v){ var t = Date.parse(v.publishedAt || v.date); return isNaN(t) ? Infinity : t; }   /* 날짜 없는(새) 강의는 맨 위 */
  function bare(t){ return String(t || "").replace(/^\s*[\[【(][^\]】)]*[\]】)]\s*/, "").trim(); }
  function longDate(d){ var m = String(d || "").match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? m[1] + "년 " + (+m[2]) + "월 " + (+m[3]) + "일" : ""; }
  function shown(){
    var q = norm(view.q);
    var list = data.videos.map(function(v, i){ return { v:v, i:i }; }).filter(function(x){
      var v = x.v;
      if (SC.catOf(v) !== view.cat) return false;
      if (v === openV && !v.id) return true;
      if (view.vf === "pub" && v.visible === false) return false;
      if (view.vf === "priv" && v.visible !== false) return false;
      return !q || norm(v.title).indexOf(q) > -1;
    });
    var byNew = function(a, b){ var ta = ts(a.v), tb = ts(b.v); return ta === tb ? a.i - b.i : (tb > ta ? 1 : -1); };
    list.sort(view.sort === "old" ? function(a, b){ var ta = ts(a.v), tb = ts(b.v); if (ta === Infinity || tb === Infinity) return byNew(a, b); return ta === tb ? a.i - b.i : ta - tb; }
      : view.sort === "title" ? function(a, b){ return bare(a.v.title).localeCompare(bare(b.v.title), "ko") || byNew(a, b); }
      : view.sort === "files" ? function(a, b){ return (b.v.files.length - a.v.files.length) || byNew(a, b); }
      : byNew);
    return list;
  }
  var NORES = '<li class="nores"><span class="nores-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg></span><h2>찾는 강의가 없어요</h2><p>검색어나 공개 상태를 바꿔 보세요.</p><button type="button" class="btn-main sm rp press" id="clearCond">조건 지우기</button></li>';
  /* M9: 다시 그릴 때 등장 모션 (요소에 클래스를 다시 붙여 애니메이션을 처음부터) */
  function replay(el, cls, ms){
    if (!el) return;
    el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls);
    clearTimeout(el["_t" + cls]); el["_t" + cls] = setTimeout(function(){ el.classList.remove(cls); }, ms || 900);
  }
  function render(anim){
    var a = document.activeElement, fid = a && a.id, s0 = a && a.selectionStart, s1 = a && a.selectionEnd;
    /* #26 편집 칸이 새로 열리면: 바뀌기 전 자리를 재 두었다가 목록이 왼쪽 칸으로 스르륵 (FLIP) */
    var target = view.cat === RID ? openM : openV, first = ($("edWrap").hidden && target && motionOk()) ? flipFirst() : null;
    var V = data.videos, isR = view.cat === RID, label = isR ? SC.RESEARCH.label : SC.catLabel(view.cat);
    $("mtabs").innerHTML = SC.CATS.concat([SC.RESEARCH]).map(function(c){
      var n = c.id === RID ? rdata.months.length : V.filter(function(v){ return SC.catOf(v) === c.id; }).length;
      return '<button type="button" class="mtab rp" role="tab" aria-selected="' + (c.id === view.cat) + '" data-cat="' + c.id + '">' + esc(c.label) + '<span class="mtab-n">' + n + '</span></button>';
    }).join("");
    $("aqBox").hidden = isR; $("asortBox").hidden = isR; $("rnote").hidden = !isR;
    $("addLabel").textContent = isR ? "월 추가" : label + "에 강의 추가";
    $("catName").textContent = label;
    var all = isR ? rdata.months : V.filter(function(v){ return SC.catOf(v) === view.cat; }), on = all.filter(function(v){ return v.visible !== false; }).length;
    $("count").textContent = all.length;
    $("visCount").textContent = all.length ? "공개 " + on + " · 비공개 " + (all.length - on) : "";
    if (isR){
      $("aresult").hidden = true;
      var ms = rShown();
      $("videos").innerHTML = ms.length ? ms.map(function(x){ return rItemHtml(x.m, x.i); }).join("")
        : (view.vf !== "all" ? NORES.replace("찾는 강의가 없어요", "찾는 달이 없어요").replace("검색어나 공개 상태를", "공개 상태를")
          : '<li class="empty-list">아직 등록된 달이 없어요.<br>‘월 추가’를 눌러 첫 달을 만들어 주세요.</li>');
    } else {
      var list = shown(), cond = view.q || view.vf !== "all";
      $("aresult").hidden = !view.q;
      if (view.q) $("aresult").innerHTML = "‘<b>" + esc(view.q) + "</b>’ 검색 결과 <b class=\"num\">" + list.length + "</b>개";
      $("videos").innerHTML = list.length ? list.map(function(x){ return itemHtml(x.v, x.i); }).join("")
        : (cond ? NORES : '<li class="empty-list">아직 ' + esc(label) + ' 강의가 없어요.<br>‘' + esc(label) + '에 강의 추가’를 눌러 첫 강의를 넣어 주세요.</li>');
    }
    if (anim) SC.lineReveal($("listLr"));   /* 메뉴 칸·정렬·공개 필터 바꿀 때: M10 (#28 다른 등장 효과 없음) */
    renderEditor();
    if (first) flipPlay(first);
    if (fid && $(fid)){ var el = $(fid); el.focus({ preventScroll:true }); try { if (s0 != null) el.setSelectionRange(s0, s1); } catch(e){} }
  }

  /* ---------- 화면 3개 (#44 · 기획 P6): #/courses · #/analytics · #/settings/<메뉴> — 아래 Route 에서 ---------- */
  var Theme = SC.themeUI({ ic: $("tmIc"), bar: { light: "#003CDC", dark: "#0F1115" } });

  /* ---------- 편집 칸 (#20): 980px 넘으면 오른쪽, 이하는 화면 전체 시트 ---------- */
  var edKey = null;
  var wide = window.matchMedia ? matchMedia("(min-width:981px)") : { matches: true };
  /* 넓은 화면 + 동작 줄이기 꺼짐일 때만 FLIP · 거꾸로 닫기 */
  function motionOk(){ return wide.matches && !REDUCE; }
  function flipKey(el){ return el.dataset.flip || (el.dataset.v != null ? "v" + el.dataset.v : el.dataset.m != null ? "m" + el.dataset.m : ""); }
  function flipEls(){ return Array.prototype.slice.call(document.querySelectorAll(".amain [data-flip], .videos > li[data-v], .videos > li[data-m]")); }
  function flipFirst(){ var m = {}; flipEls().forEach(function(el){ var k = flipKey(el); if (k) m[k] = el.getBoundingClientRect(); }); return m; }
  function flipPlay(first){
    flipEls().forEach(function(el){
      var a = first[flipKey(el)]; if (!a || !el.animate) return;
      var r = el.getBoundingClientRect(), dx = a.left - r.left, dy = a.top - r.top;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
      el.animate([{ transform: "translate(" + dx + "px," + dy + "px)" }, { transform: "none" }], { duration: 520, easing: "cubic-bezier(0.23,1,0.32,1)" });
    });
  }
  var closing = null;
  function renderEditor(){
    var wrap = $("edWrap"), isR = view.cat === RID, obj = isR ? openM : openV, lay = document.querySelector(".admin");
    if (!obj){
      if (wrap.hidden || closing) return;
      edKey = null;
      var finish = function(){
        closing = null;
        var f = motionOk() ? flipFirst() : null;
        wrap.hidden = true; wrap.classList.remove("is-out", "go"); lay.classList.remove("is-edit"); document.body.classList.remove("sheet-open");
        if (f) flipPlay(f);
      };
      if (!motionOk()){ finish(); return; }
      /* #26 닫기: 라인 리빌 거꾸로(아래 줄이 위로) → 편집 칸 없애고 목록이 원래 자리로 */
      clearTimeout(wrap._lrT); wrap.classList.remove("go"); void wrap.offsetWidth; wrap.classList.add("is-out");
      closing = setTimeout(finish, 300 + 80 + 20);
      return;
    }
    if (closing){ clearTimeout(closing); closing = null; wrap.classList.remove("is-out"); edKey = null; }
    var opening = wrap.hidden, swap = !opening && edKey !== obj;
    wrap.hidden = false; lay.classList.add("is-edit"); document.body.classList.toggle("sheet-open", !wide.matches);
    if (isR){
      var mi = rdata.months.indexOf(openM);
      $("edPill").textContent = "월 편집 · " + SC.RESEARCH.label;
      $("edTitle").textContent = openM.title.trim() || "제목 없음";
    } else {
      var i = data.videos.indexOf(openV);
      $("edPill").textContent = "강의 편집 · " + SC.catLabel(SC.catOf(openV));
      $("edTitle").textContent = openV.title || "새 강의";
    }
    var body = $("edBody"), st = body.scrollTop;
    body.innerHTML = isR ? monthBody(openM, mi) : videoBody(openV, i);
    body.scrollTop = swap || opening ? 0 : st;
    /* 편집 칸 전체(테두리 포함)가 라인 리빌로: 처음 열 땐 목록이 자리 잡을 때까지 0.22초 기다림, 바꿀 땐 바로 */
    if ((opening || swap) && wide.matches){ wrap.style.setProperty("--lr-w", opening ? "145ms" : "0ms"); SC.lineReveal(wrap); }
    edKey = obj;
  }
  function closeEditor(){ openV = openM = openA = null; armedDel = null; render(); }
  $("edClose").addEventListener("click", closeEditor);
  document.addEventListener("keydown", function(e){
    if (e.key !== "Escape" || e.target.closest("select")) return;
    if (document.body.dataset.view === "courses" && !$("edWrap").hidden) closeEditor();
  });
  if (wide.addEventListener) wide.addEventListener("change", function(){ if (!$("edWrap").hidden) document.body.classList.toggle("sheet-open", !wide.matches); });

  $("mtabs").addEventListener("click", function(e){
    var b = e.target.closest("[data-cat]"); if (!b || b.dataset.cat === view.cat) return;
    view.cat = b.dataset.cat; view.q = ""; view.vf = "all"; $("aq").value = ""; syncVf(); armedDel = null;
    openV = openM = openA = null;
    LS.set("sc-admin-cat", view.cat); render("lr");
  });
  $("aq").addEventListener("input", function(){ view.q = this.value.trim(); render(); });
  $("asort").addEventListener("change", function(){ view.sort = this.value; render(true); });
  function syncVf(){ $("vfilter").querySelectorAll("[data-vf]").forEach(function(b){ b.setAttribute("aria-checked", b.dataset.vf === view.vf); }); }
  $("vfilter").addEventListener("click", function(e){ var b = e.target.closest("[data-vf]"); if (!b || b.dataset.vf === view.vf) return; view.vf = b.dataset.vf; syncVf(); render(true); });
  function onMove(e){
    var sel = e.target.closest("select[data-move]"); if (!sel) return;
    var v = data.videos[+sel.dataset.move]; if (!v) return;
    v.category = sel.value; markDirty(); render();
    toast(SC.catLabel(sel.value) + " 칸으로 옮겼어요. 저장하면 사이트에도 반영돼요");
  }
  $("videos").addEventListener("change", onMove);
  $("editor").addEventListener("change", onMove);
  document.addEventListener("click", function(e){
    if (!e.target.closest("#clearCond")) return;
    view.q = ""; view.vf = "all"; $("aq").value = ""; syncVf(); render(true);
  });

  /* ================= 상품연구 전략자료 (#17 · 기획 P1) ================= */
  function pad2(n){ return (n < 10 ? "0" : "") + n; }
  function ymCode(ym){ var x = String(ym || "").match(/^(\d{4})-(\d{2})$/); return x ? x[1].slice(2) + x[2] : ""; }
  function nextYm(ym){ var x = ym.split("-"), y = +x[0], m = +x[1] + 1; if (m > 12){ m = 1; y++; } return y + "-" + pad2(m); }
  function newAgeId(m){
    var id; do { id = "a" + Math.random().toString(36).slice(2, 7); } while ((m.ages || []).some(function(a){ return a.id === id; }));
    return id;
  }
  function rSorted(){
    return rdata.months.map(function(m, i){ return { m:m, i:i }; })
      .sort(function(a, b){ return String(b.m.ym).localeCompare(String(a.m.ym)) || a.i - b.i; });
  }
  function rShown(){
    return rSorted().filter(function(x){
      if (x.m === openM && x.m._new) return true;
      return view.vf === "all" || (view.vf === "pub") === (x.m.visible !== false);
    });
  }
  function isDupYm(m){ return rdata.months.some(function(o){ return o !== m && o.ym === m.ym; }); }
  function missCount(files){ return files.filter(function(f){ return !SC.download(f.link, f.type).url; }).length; }
  function rImg(path, cls){
    return '<img src="' + esc(pendingImgs[path] || path || "assets/research-default.png") + '" alt=""' + (path ? '' : ' class="dflt"') + (cls ? '' : ' loading="lazy"') + '>';
  }
  function rSwitch(on, attrs, label){
    return '<button type="button" class="vs" role="switch" aria-checked="' + on + '" ' + attrs + ' aria-label="' + label + '">' +
      '<span class="vs-track"><span class="vs-knob"></span></span><span class="vs-t">' + (on ? "공개" : "비공개") + '</span></button>';
  }
  function rSeg(act, attrs, val, on, label, icon){
    return '<button type="button" class="seg rp" role="radio" aria-checked="' + on + '" data-act="' + act + '" ' + attrs + ' data-val="' + val + '">' + icon + esc(label) + '</button>';
  }
  function rItemHtml(m, i){
    var ed = m === openM, pub = m.visible !== false, at = 'data-m="' + i + '"';
    var nf = 0, miss = 0; m.ages.forEach(function(a){ nf += a.files.length; miss += missCount(a.files); });
    var t = m.title.trim();
    return '<li class="vitem ritem' + (ed ? " editing" : "") + '" data-m="' + i + '" data-vis="' + pub + '">' +
      '<div class="vrow" data-act="redit" ' + at + '>' +
        '<div class="vthumb rthumb dim">' + rImg(m.thumb) + '</div>' +
        '<div class="vtext"><h3 class="dim' + (t ? "" : " untitled") + '">' + esc(t || "제목 없음") + '</h3><div class="badges">' +
          '<span class="bdg priv">비공개</span>' + (m._new ? '<span class="bdg new">새 달</span>' : '') +
          '<span class="bdg dim">연령 ' + m.ages.length + '개</span><span class="bdg files dim">자료 ' + nf + '개</span>' +
          (miss ? '<span class="bdg miss dim">링크 없음 ' + miss + '</span>' : '') + (m._oym ? Audit.rowWho("r:" + ymCode(m._oym), true) : '') + '</div></div>' +
        rSwitch(pub, 'data-act="rvis" ' + at, "사이트에 공개") +
        edBtn(ed, 'data-act="redit" ' + at) +
      '</div></li>';
  }
  function thumbField(o, attrs){
    var src = o.thumb ? (pendingImgs[o.thumb] || o.thumb) : "";
    return '<div class="f"><span class="lbl">썸네일</span>' +
      (src
        ? '<div class="th-has th-drop-zone" ' + attrs + '><img class="th-prev" src="' + esc(src) + '" alt="썸네일 미리보기">' +
            '<div class="th-btns"><button type="button" class="btn-soft rp press" data-act="rthPick" ' + attrs + '>' + IC.img + '다른 이미지로 바꾸기</button>' +
            '<button type="button" class="btn-line rp press" data-act="rthDel" ' + attrs + '>썸네일 지우기</button></div></div>'
        : '<div class="th-none"><button type="button" class="th-drop th-drop-zone rp" data-act="rthPick" ' + attrs + '>' + IC.upload + '<b>눌러서 올리기</b><span>또는 끌어다 놓기</span></button>' +
            '<div class="th-now"><span>지금 보이는 모습</span><img src="assets/research-default.png" alt="기본 썸네일 (삼프스 로고)"></div></div>') +
      '<span class="help">올리지 않으면 삼프스 로고가 보여요.<br>16:9(1280×720) 이미지가 가장 잘 맞아요.</span></div>';
  }
  function prevMonth(m){
    var best = null;
    rdata.months.forEach(function(o){ if (o !== m && o.ym < m.ym && o.ages.length && (!best || o.ym > best.ym)) best = o; });
    return best;
  }
  function monthBody(m, mi){
    var at = 'data-m="' + mi + '"', pub = m.visible !== false, dup = isDupYm(m), code = ymCode(m.ym);
    var y = +(m.ym.split("-")[0]) || new Date().getFullYear(), mo = +(m.ym.split("-")[1]) || 1, y0 = new Date().getFullYear();
    var years = []; for (var k = Math.min(y, 2024); k <= Math.max(y, y0 + 1); k++) years.push(k);
    var prev = m._new ? prevMonth(m) : null, saved = !m._new && !dirtyMonth(m), wt = m._oym ? "r:" + ymCode(m._oym) : "";
    var who = wt ? Audit.sumWho(wt, true, "만듦") : "";
    return (who ? '<div class="ed-who">' + who + '</div>' : '') + '<div class="f"><span class="lbl" id="rm' + mi + 'visL">공개 설정</span>' +
        '<div class="segs" role="radiogroup" aria-labelledby="rm' + mi + 'visL">' +
          rSeg("rvisSet", at, "1", pub, "공개", IC.eye) + rSeg("rvisSet", at, "0", !pub, "비공개", IC.lock) + '</div>' +
        '<span class="help">' + (pub ? "사이트 목록과 주소에서 누구나 볼 수 있어요." : "사이트 목록에서 빠지고, 주소로 들어와도 보이지 않아요.<br>저장해야 반영돼요.") + '</span></div>' +
      '<div class="f"><label for="rm' + mi + 'title">제목 <span class="req" aria-label="필수">*</span></label>' +
        '<input type="text" id="rm' + mi + 'title" class="in" ' + at + ' data-rk="title" value="' + esc(m.title) + '" placeholder="예) 26년 11월" autocomplete="off">' +
        '<span class="help">사이트의 카드와 페이지 제목에 그대로 나와요.</span></div>' +
      '<div class="f"><span class="lbl" id="rm' + mi + 'ymL">연월 <span class="req" aria-label="필수">*</span></span>' +
        '<div class="ym' + (dup ? " dup" : "") + '" role="group" aria-labelledby="rm' + mi + 'ymL">' +
          '<label class="asel"><select id="rm' + mi + 'y" ' + at + ' data-rym="y" aria-label="년">' + years.map(function(k){ return '<option value="' + k + '"' + (k === y ? " selected" : "") + '>' + k + '년</option>'; }).join("") + '</select>' + IC.down + '</label>' +
          '<label class="asel"><select id="rm' + mi + 'mo" ' + at + ' data-rym="m" aria-label="월">' + [1,2,3,4,5,6,7,8,9,10,11,12].map(function(k){ return '<option value="' + k + '"' + (k === mo ? " selected" : "") + '>' + k + '월</option>'; }).join("") + '</select>' + IC.down + '</label>' +
        '</div>' +
        (dup ? '<span class="pill bad ym-err" role="alert">이미 등록된 달이에요. 다른 달을 골라 주세요.</span>' : '') +
        '<span class="help">화면에는 안 나와요. 사이트에서는 이 달이 최신일수록 위에 보여요.</span></div>' +
      thumbField(m, at) +
      '<div class="fileset"><div class="fileset-h"><span class="lbl">연령 <span class="num">' + m.ages.length + '</span>개</span>' +
        '<span class="help">▲▼로 순서를 바꾸면 사이트 연령 목록 순서도 바뀌어요.</span></div>' +
        (prev ? '<div class="rcopy">' + rSwitch(!!m._copied, 'data-act="rcopy" ' + at, "지난달 연령 그대로 가져오기") +
          '<div><b>지난달 연령 그대로 가져오기</b><span>' + esc(prev.title || "지난달") + '의 연령 ' + prev.ages.length + '개(제목·썸네일·순서)를 복사해요. 자료는 비워 둬요.</span></div></div>' : '') +
        '<ul class="ages">' + m.ages.map(function(a, ai){ return ageHtml(m, mi, a, ai); }).join("") + '</ul>' +
        '<div><button type="button" class="btn-soft rp press" data-act="raddAge" ' + at + '>' + IC.plus + '연령 추가</button></div></div>' +
      (wt ? Audit.histHtml(wt, true) : '') +
      '<div class="vfoot">' + (pub && code && saved ? '<a class="site-link rp" href="research/' + code + '/" target="_blank" rel="noopener">사이트에서 보기 ↗</a>' : '<span></span>') +
        '<div class="vfoot-r">' + delAsk(armedDel === m, "이 달의 연령과 자료가 모두 지워져요. 정말 삭제할까요?", 'data-act="rdelYes" ' + at, 'data-act="delNo"', 'data-act="rdel" ' + at, "월 삭제") + '</div></div>';
  }
  /* 저장된 상태에도 있는 달인지(사이트에서 보기 링크용) */
  function dirtyMonth(m){
    try { var S = JSON.parse(baseline).r.months; return !S.some(function(o){ return o.ym === m.ym && o.visible !== false; }); } catch(e){ return true; }
  }
  function ageHtml(m, mi, a, ai){
    var open = a === openA, pub = a.visible !== false, at = 'data-m="' + mi + '" data-a="' + ai + '"', idp = "r" + mi + "a" + ai, miss = missCount(a.files), t = a.title.trim();
    var row = '<div class="arow" data-act="rage" ' + at + '>' +
      '<span class="ord"><button type="button" class="ordb" data-act="rup" ' + at + ' aria-label="위로"' + (ai === 0 ? " disabled" : "") + '>' + IC.tri + '</button>' +
        '<button type="button" class="ordb dn" data-act="rdown" ' + at + ' aria-label="아래로"' + (ai === m.ages.length - 1 ? " disabled" : "") + '>' + IC.tri + '</button></span>' +
      '<div class="vthumb rthumb athumb dim">' + rImg(a.thumb) + '</div>' +
      '<div class="vtext"><h3 class="dim' + (t ? "" : " untitled") + '">' + esc(t || "제목 없음") + '</h3><div class="badges">' +
        '<span class="bdg priv">비공개</span><span class="bdg files dim">자료 ' + a.files.length + '개</span>' +
        (miss ? '<span class="bdg miss dim">링크 없음 ' + miss + '</span>' : '') + (m._oym ? Audit.rowWho("r:" + ymCode(m._oym) + "/" + a.id) : '') + '</div></div>' +
      rSwitch(pub, 'data-act="ravis" ' + at, "사이트에 공개") +
      '<button type="button" class="vexp" data-act="rage" ' + at + ' aria-expanded="' + open + '" aria-label="' + (open ? "접기" : "펼쳐서 고치기") + '">' + IC.down + '</button></div>';
    if (!open) return '<li class="aitem" data-vis="' + pub + '">' + row + '</li>';
    var code = ymCode(m.ym), saved = !m._new && !dirtyMonth(m);
    var body = '<div class="abody">' +
      '<div class="f"><span class="lbl" id="' + idp + 'visL">공개 설정</span>' +
        '<div class="segs" role="radiogroup" aria-labelledby="' + idp + 'visL">' +
          rSeg("ravisSet", at, "1", pub, "공개", IC.eye) + rSeg("ravisSet", at, "0", !pub, "비공개", IC.lock) + '</div>' +
        '<span class="help">' + (pub ? "사이트 연령 목록과 주소에서 누구나 볼 수 있어요." : "사이트 연령 목록에서 빠지고, 주소로 들어와도 보이지 않아요.<br>저장해야 반영돼요.") + '</span></div>' +
      '<div class="f"><label for="' + idp + 'title">제목 <span class="req" aria-label="필수">*</span></label>' +
        '<input type="text" id="' + idp + 'title" class="in" ' + at + ' data-rk="title" value="' + esc(a.title) + '" placeholder="예) 50대" autocomplete="off"></div>' +
      thumbField(a, at) +
      '<div class="fileset"><div class="fileset-h"><span class="lbl">교육자료 <span class="num">' + a.files.length + '</span>개</span>' +
        '<span class="help">드라이브에서 파일 우클릭 → 공유 → ‘링크가 있는 모든 사용자’ → 링크 복사</span></div>' +
        '<div class="fsort">' + filesHtml(a.files, at, idp, "rfdel", m._oym ? "rf:" + ymCode(m._oym) + "/" + a.id : "", savedKeys("r", m._oym, a.id)) + '</div>' +
        '<div><button type="button" class="btn-soft rp press" data-act="raddFile" ' + at + '>' + IC.plus + '자료 추가</button></div></div>' +
      '<div class="vfoot">' + (pub && saved && m.visible !== false ? '<a class="site-link rp" href="research/' + code + '/' + esc(a.id) + '/" target="_blank" rel="noopener">사이트에서 보기 ↗</a>' : '<span></span>') +
        '<div class="vfoot-r">' + delAsk(armedDel === a, "이 연령과 자료가 지워져요. 정말 삭제할까요?", 'data-act="radelYes" ' + at, 'data-act="delNo"', 'data-act="radel" ' + at, "연령 삭제") + '</div></div>' +
    '</div>';
    return '<li class="aitem open" data-vis="' + pub + '">' + row + body + '</li>';
  }
  function rObj(el){
    var m = rdata.months[+el.dataset.m]; if (!m) return null;
    return el.dataset.a != null ? m.ages[+el.dataset.a] || null : m;
  }
  /* 썸네일: 가운데를 16:9로 자르고 1280px 이하 · 300KB 이하 JPG로 줄임 */
  function shrinkImg(file){
    return new Promise(function(res, rej){
      if (!file || !/^image\//.test(file.type)) return rej(new Error("type"));
      var url = URL.createObjectURL(file), img = new Image();
      img.onload = function(){
        URL.revokeObjectURL(url);
        var sw = img.naturalWidth, sh = img.naturalHeight, cw = sw, ch = Math.round(sw * 9 / 16);
        if (ch > sh){ ch = sh; cw = Math.round(sh * 16 / 9); }
        var sx = Math.round((sw - cw) / 2), sy = Math.round((sh - ch) / 2), W = Math.min(1280, cw), out = "", q = 0.86;
        for (var tries = 0; tries < 8; tries++){
          var H = Math.round(W * 9 / 16), c = document.createElement("canvas"); c.width = W; c.height = H;
          var g = c.getContext("2d"); g.fillStyle = "#FFFFFF"; g.fillRect(0, 0, W, H);
          g.imageSmoothingQuality = "high"; g.drawImage(img, sx, sy, cw, ch, 0, 0, W, H);
          out = c.toDataURL("image/jpeg", q);
          if ((out.length - 23) * 0.75 <= 300 * 1024) break;
          if (q > 0.62) q -= 0.08; else W = Math.round(W * 0.85);
        }
        res(out);
      };
      img.onerror = function(){ URL.revokeObjectURL(url); rej(new Error("load")); };
      img.src = url;
    });
  }
  var thTarget = null;
  function setThumb(o, file){
    if (!o) return;
    shrinkImg(file).then(function(du){
      var m = rdata.months.filter(function(x){ return x === o || x.ages.indexOf(o) > -1; })[0];
      var path = "assets/research/" + (ymCode(m && m.ym) || "r") + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5) + ".jpg";
      pendingImgs[path] = du; o.thumb = path; markDirty(); render();
      toast("썸네일을 넣었어요. 저장하면 사이트에 반영돼요");
    }).catch(function(){ toast("이미지를 읽지 못했어요. JPG나 PNG 파일로 올려 주세요"); });
  }
  $("thFile").addEventListener("change", function(){ var f = this.files && this.files[0]; this.value = ""; if (f) setThumb(thTarget, f); });
  $("editor").addEventListener("dragover", function(e){ var z = e.target.closest(".th-drop-zone"); if (!z) return; e.preventDefault(); z.classList.add("over"); });
  $("editor").addEventListener("dragleave", function(e){ var z = e.target.closest(".th-drop-zone"); if (z) z.classList.remove("over"); });
  $("editor").addEventListener("drop", function(e){
    var z = e.target.closest(".th-drop-zone"); if (!z) return; e.preventDefault(); z.classList.remove("over");
    var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]; if (f) setThumb(rObj(z), f);
  });
  function addMonth(){
    var now = new Date(), ym = now.getFullYear() + "-" + pad2(now.getMonth() + 1), used = {};
    rdata.months.forEach(function(m){ used[m.ym] = true; });
    var latest = rdata.months.map(function(m){ return m.ym; }).sort().pop();
    if (latest && latest >= ym) ym = nextYm(latest);
    while (used[ym]) ym = nextYm(ym);
    var m = { ym: ym, title: "", thumb: "", visible: true, ages: [], _new: true };
    rdata.months.push(m); openM = m; openA = null; armedDel = null; view.vf = "all"; syncVf(); render(true);
    var el = $("rm" + (rdata.months.length - 1) + "title"); if (el) el.focus();
  }
  function rClick(b, e){
    var act = b.dataset.act, m = rdata.months[+b.dataset.m], a = m && b.dataset.a != null ? m.ages[+b.dataset.a] : null;
    if (!m) return;
    if (act === "redit"){
      if (b.classList.contains("vrow") && (e.target.closest("button") || e.target.closest("a"))) return;
      openM = openM === m ? null : m; openA = null; armedDel = null; render(); return;
    }
    if (act === "rage"){
      if (b.classList.contains("arow") && (e.target.closest("button") || e.target.closest("a"))) return;
      openA = openA === a ? null : a; armedDel = null; render();
      if (openA && !REDUCE){ var ab = document.querySelector(".aitem.open .abody"); replay(ab, "unfold", 400); }
      return;
    }
    if (act === "rvis"){ m.visible = m.visible === false; markDirty(); render(); toast(m.visible ? "공개로 바꿨어요. 저장하면 사이트에 보여요" : "비공개로 바꿨어요. 저장하면 사이트에서 숨겨져요"); return; }
    if (act === "rvisSet"){ var nv = b.dataset.val === "1"; if (m.visible !== nv){ m.visible = nv; markDirty(); render(); } return; }
    if (act === "ravis"){ a.visible = a.visible === false; markDirty(); render(); return; }
    if (act === "ravisSet"){ var na = b.dataset.val === "1"; if (a.visible !== na){ a.visible = na; markDirty(); render(); } return; }
    if (act === "rup" || act === "rdown"){
      var k = m.ages.indexOf(a), to = act === "rup" ? k - 1 : k + 1;
      if (to < 0 || to >= m.ages.length) return;
      m.ages.splice(to, 0, m.ages.splice(k, 1)[0]); markDirty(); render();
      var nb = document.querySelector('.ordb[data-act="' + act + '"][data-m="' + b.dataset.m + '"][data-a="' + to + '"]');
      if (nb && !nb.disabled) nb.focus(); return;
    }
    if (act === "raddAge"){
      var na2 = { id: newAgeId(m), title: "", thumb: "", visible: true, files: [{ name:"", type:"", link:"", size:"", _st:"" }] };
      m.ages.push(na2); openA = na2; markDirty(); render();
      var el = $("r" + b.dataset.m + "a" + (m.ages.length - 1) + "title"); if (el){ el.focus(); el.scrollIntoView({ block:"center", behavior: REDUCE ? "auto" : "smooth" }); }
      return;
    }
    if (act === "raddFile"){ a.files.push({ name:"", type:"", link:"", size:"", _st:"" }); markDirty(); render(); var fl = $("r" + b.dataset.m + "a" + b.dataset.a + "f" + (a.files.length - 1) + "l"); if (fl) fl.focus(); return; }
    if (act === "rfdel"){ a.files.splice(+b.dataset.f, 1); markDirty(); render(); return; }
    if (act === "rthPick"){ thTarget = rObj(b); $("thFile").click(); return; }
    if (act === "rthDel"){ var o = rObj(b); if (o){ o.thumb = ""; markDirty(); render(); toast("썸네일을 지웠어요. 삼프스 로고가 보여요"); } return; }
    if (act === "rcopy"){
      var pv = prevMonth(m); if (!pv) return;
      if (m._copied){ m.ages = []; m._copied = false; }
      else { m.ages = pv.ages.map(function(x){ return { id: newAgeId(m), title: x.title, thumb: x.thumb, visible: x.visible !== false, files: [] }; }); m._copied = true; }
      openA = null; markDirty(); render(); return;
    }
    if (act === "rdel"){ armedDel = m; render(); return; }
    if (act === "radel"){ armedDel = a; render(); return; }
    if (act === "rdelYes"){ rdata.months.splice(rdata.months.indexOf(m), 1); openM = openA = null; armedDel = null; markDirty(); render(); toast("이 달을 뺐어요. 저장을 눌러야 사이트에서도 빠져요"); return; }
    if (act === "radelYes"){ m.ages.splice(m.ages.indexOf(a), 1); openA = null; armedDel = null; markDirty(); render(); toast("연령을 뺐어요. 저장을 눌러야 사이트에서도 빠져요"); return; }
  }
  function rInput(t){
    var o = rObj(t); if (!o) return;
    if (t.dataset.rk === "title"){
      o.title = t.value; markDirty();
      var h = t.dataset.a != null ? null : document.querySelector('.ritem[data-m="' + t.dataset.m + '"] h3');
      if (h){ h.textContent = t.value.trim() || "제목 없음"; h.classList.toggle("untitled", !t.value.trim()); }
      if (t.dataset.a == null) $("edTitle").textContent = t.value.trim() || "제목 없음";
      else { var ah = t.closest(".aitem"); ah = ah && ah.querySelector(".arow h3"); if (ah){ ah.textContent = t.value.trim() || "제목 없음"; ah.classList.toggle("untitled", !t.value.trim()); } }
      return;
    }
    if (t.dataset.fk === "link"){
      var f = o.files[+t.dataset.f]; if (!f) return;
      f.link = t.value; markDirty();
      f.size = ""; f._st = ""; if (!t.value.trim()){ f.name = ""; f.type = ""; }
      var st = $("r" + t.dataset.m + "a" + t.dataset.a + "f" + t.dataset.f + "s"); if (st) st.innerHTML = fileStatus(f);
      later(f, function(){ fetchFile(f); }, 450);
    }
  }
  $("editor").addEventListener("change", function(e){
    var s2 = e.target.closest("select[data-rym]"); if (!s2) return;
    var m = rdata.months[+s2.dataset.m]; if (!m) return;
    var y = $("rm" + s2.dataset.m + "y").value, mo = +$("rm" + s2.dataset.m + "mo").value;
    m.ym = y + "-" + pad2(mo); if (m._copied && !prevMonth(m)){ m.ages = []; m._copied = false; }
    markDirty(); render();
  });
  /* 저장 전에 막을 것: 제목 없음 · 같은 연월 */
  function rProblem(){
    for (var i = 0; i < rdata.months.length; i++){
      var m = rdata.months[i];
      if (!m.title.trim()) return { m:m, msg:"월 제목을 넣어 주세요 (예: 26년 11월)", focus:"rm" + i + "title" };
      if (!ymCode(m.ym)) return { m:m, msg:"연월을 골라 주세요" };
      if (isDupYm(m)) return { m:m, msg:"이미 등록된 달이에요. 다른 달을 골라 주세요." };
      for (var k = 0; k < m.ages.length; k++) if (!m.ages[k].title.trim()) return { m:m, a:m.ages[k], msg:"연령 제목을 넣어 주세요 (예: 50대)", focus:"r" + i + "a" + k + "title" };
    }
    return null;
  }

  /* ---------- 저장 바 ---------- */
  function snap(){ return JSON.stringify({ v: cleanData(), r: cleanResearch() }); }
  function markDirty(){ dirty = snap() !== baseline; updateSaveBar(); }
  function updateSaveBar(msg){
    var m = $("saveText"), b = $("saveBtn"), bar = document.querySelector(".savebar");
    bar.classList.toggle("dirty", !msg && canSave && !saving && dirty);
    bar.classList.toggle("saved", !msg && canSave && !saving && !dirty);
    if (msg){ m.textContent = msg; b.disabled = true; return; }
    if (!canSave){ m.textContent = "저장소에 연결되지 않았어요. 설정의 계정을 확인해 주세요"; b.disabled = true; return; }
    if (saving){ m.textContent = "저장하는 중…"; b.disabled = true; b.textContent = "저장 중"; return; }
    b.textContent = "저장";
    var ls = Audit.lastSave();
    m.innerHTML = esc(dirty ? "저장하지 않은 변경이 있어요" : "모든 변경이 저장됐어요") + (ls ? '<span class="who">· 마지막 저장 <b>' + esc(ls.n) + '</b> · ' + esc(fmtAt(ls.at)) + '</span>' : '');
    b.disabled = !dirty;
  }

  function cleanData(){
    return {
      site: {
        eyebrow: (data.site.eyebrow || "").trim(), title: (data.site.title || "").trim(),
        desc: (data.site.desc || "").trim(), notice: (data.site.notice || "").trim()
      },
      videos: data.videos.filter(function(v){ return v.id; }).map(function(v){
        return {
          id: v.id, title: v.title.trim(), channel: v.channel, description: v.description.trim(),
          duration: v.duration, date: v.date || SC.today(), publishedAt: v.publishedAt || undefined, category: SC.catOf(v), visible: v.visible !== false,
          files: cleanFiles(v.files)
        };
      })
    };
  }
  function cleanFiles(files){
    return files.filter(function(f){ return f.link.trim(); }).map(function(f){
      var sn = SC.splitName(f.name), d = SC.download(f.link, sn.type || f.type);
      var t = sn.type || f.type || ({ gdoc:"pdf", gsheet:"xlsx", gslide:"pptx" }[d.kind]) || "pdf";
      return { name: sn.name || "자료", type: t, link: f.link.trim(), size: f.size || "" };
    });
  }
  /* 상품연구: 월은 연월 최신순, 연령은 ▲▼로 정한 순서 그대로 */
  function cleanResearch(){
    return { months: rSorted().map(function(x){
      var m = x.m;
      return { ym: m.ym, title: m.title.trim(), thumb: m.thumb || "", visible: m.visible !== false,
        ages: m.ages.map(function(a){ return { id: a.id, title: a.title.trim(), thumb: a.thumb || "", visible: a.visible !== false, files: cleanFiles(a.files) }; }) };
    }) };
  }
  /* ---------- 강의별 공유 페이지(v/영상ID/) — 카톡·SNS 미리보기에 영상 썸네일·제목이 나오게 ---------- */
  function gitSha(str){
    var b = new TextEncoder().encode(str), h = new TextEncoder().encode("blob " + b.length + "\0"), all = new Uint8Array(h.length + b.length);
    all.set(h, 0); all.set(b, h.length);
    return crypto.subtle.digest("SHA-1", all).then(function(d){ return Array.prototype.map.call(new Uint8Array(d), function(x){ return (x < 16 ? "0" : "") + x.toString(16); }).join(""); });
  }
  var thumbCache = {};
  function bestThumb(id){
    if (thumbCache[id]) return Promise.resolve(thumbCache[id]);
    return new Promise(function(res){
      var img = new Image(), done = false;
      function fin(u){ if (done) return; done = true; thumbCache[id] = u; res(u); }
      img.onload = function(){ fin(img.naturalWidth > 200 ? SC.thumb(id, true) : SC.thumb(id, false)); };
      img.onerror = function(){ fin(SC.thumb(id, false)); };
      setTimeout(function(){ fin(SC.thumb(id, false)); }, 5000);
      img.src = SC.thumb(id, true);
    });
  }
  function siteRoot(){ return location.origin + location.pathname.replace(/[^/]*$/, ""); }
  function attr(s){ return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function sharePage(tpl, v, site, thumb){
    var url = siteRoot() + "v/" + v.id + "/";
    var first = (v.description || "").split("\n").map(function(x){ return x.trim(); }).filter(Boolean)[0] || "";
    var desc = (v.files.length ? "교육자료 " + v.files.length + "개 · " : "") + (first || site.desc || "강의 영상과 교육자료");
    if (desc.length > 110) desc = desc.slice(0, 108) + "…";
    return ogPage(tpl, { base:"../../", title: v.title || site.title || "교육 자료실", desc: desc, image: thumb, url: url, type:"video.other" });
  }
  function ogPage(tpl, o){
    var desc = o.desc;
    var meta =
      '<base href="' + o.base + '">\n' +
      '<meta property="og:title" content="' + attr(o.title) + '">\n' +
      '<meta property="og:description" content="' + attr(desc) + '">\n' +
      '<meta property="og:image" content="' + attr(o.image) + '">\n' +
      '<meta property="og:url" content="' + attr(o.url) + '">\n' +
      '<meta property="og:type" content="' + o.type + '">\n' +
      '<meta property="og:site_name" content="영업개발파트 교육 자료">\n' +
      '<meta name="twitter:card" content="summary_large_image">\n';
    return tpl
      .replace(/<meta property="og:[^>]*>\n?/g, "").replace(/<meta name="twitter:[^>]*>\n?/g, "").replace(/<base [^>]*>\n?/g, "")
      .replace(/<title>[\s\S]*?<\/title>/, function(){ return "<title>영개파 교육 자료</title>"; })
      .replace(/<meta name="description" content="[^"]*">/, function(){ return '<meta name="description" content="' + attr(desc) + '">'; })
      .replace(/<meta charset="utf-8">\n?/, function(){ return '<meta charset="utf-8">\n' + meta; });
  }

  /* 메뉴 주소(signature/ 등) 페이지 — 홈과 같은 화면, 주소만 다름 */
  function catPage(tpl, c){
    var meta = '<base href="../">\n<meta property="og:url" content="' + attr(siteRoot() + c.id + "/") + '">\n';
    return tpl.replace(/<base [^>]*>\n?/g, "").replace(/<meta property="og:url"[^>]*>\n?/g, "")
      .replace(/<meta charset="utf-8">\n?/, function(){ return '<meta charset="utf-8">\n' + meta; });
  }
  /* 저장·업데이트 때 함께 만드는 페이지들 (공개 강의 공유 페이지 + 메뉴 페이지) */
  function builtPages(tpl, out, thumbs, rout){
    var list = rout ? rPages(tpl, rout) : [];
    out.videos.forEach(function(v, k){
      if (v.visible === false) return;
      list.push({ path:"v/" + v.id + "/index.html", mode:"100644", type:"blob", content: sharePage(tpl, v, out.site, thumbs[k]) });
    });
    SC.MENUS.forEach(function(c){ list.push({ path: c.id + "/index.html", mode:"100644", type:"blob", content: catPage(tpl, c) }); });
    return list;
  }
  function staleShare(remote, list){
    var keep = {}; list.forEach(function(x){ keep[x.path] = true; });
    return Object.keys(remote).filter(function(p){ return /^(v\/[\w-]+|research\/\d{4}(\/[\w-]+)?)\/index\.html$/.test(p) && !keep[p]; })
      .map(function(p){ return { path:p, mode:"100644", type:"blob", sha:null }; });
  }
  /* 상품연구 공유 페이지: research/2611/ (월) · research/2611/{연령ID}/ (연령) — 공개된 것만 */
  function rPages(tpl, rout){
    var list = [], root = siteRoot();
    function img(p){ return root + (p || "assets/research-default.png"); }
    rout.months.forEach(function(m){
      var code = ymCode(m.ym); if (m.visible === false || !code) return;
      var ages = m.ages.filter(function(a){ return a.visible !== false; }), nf = ages.reduce(function(n, a){ return n + a.files.length; }, 0);
      list.push({ path:"research/" + code + "/index.html", mode:"100644", type:"blob", content: ogPage(tpl, { base:"../../",
        title: m.title + " " + SC.RESEARCH.label, desc: "연령 " + ages.length + "개 · 자료 " + nf + "개", image: img(m.thumb), url: root + "research/" + code + "/", type:"website" }) });
      ages.forEach(function(a){
        list.push({ path:"research/" + code + "/" + a.id + "/index.html", mode:"100644", type:"blob", content: ogPage(tpl, { base:"../../../",
          title: m.title + " " + a.title + " " + SC.RESEARCH.label, desc: "교육자료 " + a.files.length + "개", image: img(a.thumb || m.thumb), url: root + "research/" + code + "/" + a.id + "/", type:"website" }) });
      });
    });
    return list;
  }
  function rPagePaths(rout){ return rPages("<meta charset=\"utf-8\">", rout).map(function(x){ return x.path; }); }
  /* 썸네일 파일: 새로 올린 것은 blob으로 만들고, 더 안 쓰는 것은 지움 */
  function rThumbs(rout, remote){
    var used = {};
    rout.months.forEach(function(m){ if (m.thumb) used[m.thumb] = 1; m.ages.forEach(function(a){ if (a.thumb) used[a.thumb] = 1; }); });
    var stale = Object.keys(remote).filter(function(p){ return /^assets\/research\/[\w.\-]+$/.test(p) && !used[p]; })
      .map(function(p){ return { path:p, mode:"100644", type:"blob", sha:null }; });
    return Promise.all(Object.keys(used).filter(function(p){ return pendingImgs[p] && !remote[p]; }).map(function(p){
      return gh("/git/blobs", { method:"POST", body: JSON.stringify({ content: pendingImgs[p].split(",")[1], encoding:"base64" }) })
        .then(function(r){ return { path:p, mode:"100644", type:"blob", sha:r.sha }; });
    })).then(function(add){ return add.concat(stale); });
  }

  /* 저장된 강의 목록 기준으로, 저장소에 없는 공유 페이지(v/영상ID/)·메뉴 페이지를 만들고
     비공개·삭제된 강의의 공유 페이지는 지움. 저장소 파일 목록으로 확인하므로 사이트 반영 지연과 무관 */
  var autoBusy = false;
  function autoPages(){
    if (!canSave || autoBusy || !baseline) return;
    autoBusy = true;
    var S = JSON.parse(baseline), saved = S.v, rsaved = S.r, head, baseTree, remote = {};
    gh("/git/ref/heads/" + encodeURIComponent(branch)).then(function(ref){ head = ref.object.sha; return gh("/git/commits/" + head); })
      .then(function(c){ baseTree = c.tree.sha; return gh("/git/trees/" + baseTree + "?recursive=1"); })
      .then(function(t){
        (t.tree || []).forEach(function(e){ if (e.type === "blob") remote[e.path] = e.sha; });
        var want = saved.videos.filter(function(v){ return v.visible !== false; }).map(function(v){ return "v/" + v.id + "/index.html"; })
          .concat(SC.MENUS.map(function(c){ return c.id + "/index.html"; }), rPagePaths(rsaved));
        var missing = want.filter(function(p){ return !remote[p]; });
        var stale = staleShare(remote, want.map(function(p){ return { path:p }; }));
        if (!missing.length && !stale.length) return null;
        return Promise.all([
          fetch("index.html?tpl=" + Date.now(), { cache:"no-store" }).then(function(r){ if (!r.ok) throw new Error("tpl"); return r.text(); }),
          Promise.all(saved.videos.map(function(v){ return missing.indexOf("v/" + v.id + "/index.html") > -1 ? bestThumb(v.id) : ""; }))
        ]).then(function(r){
          var need = {}; missing.forEach(function(p){ need[p] = true; });
          var tree = builtPages(r[0], saved, r[1], rsaved).filter(function(x){ return need[x.path]; }).concat(stale);
          return gh("/git/trees", { method:"POST", body: JSON.stringify({ base_tree: baseTree, tree: tree }) });
        }).then(function(t){
          return gh("/git/commits", { method:"POST", body: JSON.stringify({ message: "공유·메뉴 페이지 자동 정리", tree: t.sha, parents:[head] }) });
        }).then(function(c){
          return gh("/git/refs/heads/" + encodeURIComponent(branch), { method:"PATCH", body: JSON.stringify({ sha: c.sha }) }).then(function(){ return c; });
        });
      })
      .then(function(c){ if (c){ showLast(c.committer && c.committer.date); Deploy.expect(c.sha); } })
      .catch(function(){ /* 실패해도 다음 저장 때 함께 만들어짐 */ })
      .then(function(){ autoBusy = false; });
  }

  function save(){
    if (!canSave || saving) return;
    var bad = rProblem();
    if (bad){
      toast(bad.msg); view.cat = RID; LS.set("sc-admin-cat", RID); openM = bad.m; openA = bad.a || null; render();
      var fe = bad.focus && $(bad.focus); if (fe) fe.focus();
      return;
    }
    var blank = data.videos.filter(function(v){ return !v.id; }).length;
    var out = cleanData(), json = JSON.stringify(out, null, 2) + "\n";
    var rout = cleanResearch(), rjson = JSON.stringify(rout, null, 2) + "\n", newRsha;
    var first = out.videos[0], before = JSON.parse(baseline || '{"v":{"site":{},"videos":[]},"r":{"months":[]}}');
    saving = true; updateSaveBar();
    var head, baseTree, remote = {}, newSha, newCommit = {};
    Promise.all([
      gh("/git/ref/heads/" + encodeURIComponent(branch)).then(function(ref){ head = ref.object.sha; return gh("/git/commits/" + head); })
        .then(function(c){ baseTree = c.tree.sha; return gh("/git/trees/" + baseTree + "?recursive=1"); })
        .then(function(t){ (t.tree || []).forEach(function(e){ if (e.type === "blob") remote[e.path] = e.sha; }); }),
      fetch("index.html?tpl=" + Date.now(), { cache:"no-store" }).then(function(r){ if (!r.ok) throw new Error("tpl"); return r.text(); }),
      Promise.all(out.videos.map(function(v){ return bestThumb(v.id); })),
      gitSha(json), gitSha(rjson)
    ]).then(function(r){
      var tpl = r[1], thumbs = r[2]; newSha = r[3]; newRsha = r[4];
      if (sha && remote["data/videos.json"] && remote["data/videos.json"] !== sha){ throw Object.assign(new Error("conflict"), { status:409 }); }
      if (rsha && remote["data/research.json"] && remote["data/research.json"] !== rsha){ throw Object.assign(new Error("conflict"), { status:409 }); }
      var pages = builtPages(tpl, out, thumbs, rout);
      var tree = [{ path:"data/videos.json", mode:"100644", type:"blob", content: json }];
      if (rout.months.length || remote["data/research.json"]) tree.push({ path:"data/research.json", mode:"100644", type:"blob", content: rjson });
      tree = tree.concat(pages, staleShare(remote, pages));
      return rThumbs(rout, remote).then(function(imgs){
        return gh("/git/trees", { method:"POST", body: JSON.stringify({ base_tree: baseTree, tree: tree.concat(imgs) }) });
      });
    }).then(function(t){
      return gh("/git/commits", { method:"POST", body: JSON.stringify({ message: "자료실 업데이트" + (first ? " · " + first.title.slice(0, 40) : ""), tree: t.sha, parents:[head] }) });
    }).then(function(c){
      newCommit = c;
      return gh("/git/refs/heads/" + encodeURIComponent(branch), { method:"PATCH", body: JSON.stringify({ sha: c.sha }) });
    }).then(function(){
      sha = newSha; if (rout.months.length || rsha) rsha = newRsha; saving = false; dirty = false;
      rdata.months.forEach(function(m){ delete m._new; delete m._copied; });
      pendingImgs = {};
      baseline = JSON.stringify({ v: out, r: rout });
      showLast(newCommit.committer && newCommit.committer.date); Deploy.expect(newCommit.sha);
      if (blank) data.videos = data.videos.filter(function(v){ return v.id; });
      var items = auditItems(before, out, rout);
      data.videos.forEach(function(v){ v._oid = v.id; }); rdata.months.forEach(function(m){ m._oym = m.ym; });
      render(); updateSaveBar(); Audit.add(items);
      toast(blank ? "저장했어요. 유튜브 주소가 없는 강의 " + blank + "개는 빼고 저장했어요" : "저장했어요. 위쪽 원이 초록색이 되면 사이트에 반영된 거예요");
    }).catch(function(e){
      saving = false; updateSaveBar();
      if (e.status === 409 || e.status === 422) toast("다른 곳에서 먼저 저장됐어요. 새로고침한 뒤 다시 저장해 주세요");
      else if (e.status === 401) toast("토큰이 만료됐거나 맞지 않아요. 설정의 계정을 확인해 주세요");
      else if (e.status === 403 || e.status === 404) toast("토큰에 이 저장소 쓰기 권한이 없어요");
      else toast("저장하지 못했어요. 인터넷 연결을 확인하고 다시 눌러 주세요");
    });
  }


  /* ---------- 이벤트 ---------- */
  var timers = new WeakMap();
  function later(obj, fn, ms){ clearTimeout(timers.get(obj)); timers.set(obj, setTimeout(fn, ms)); }

  function onInput(e){
    var t = e.target;
    if (t.dataset.m != null){ rInput(t); return; }
    var i = +t.dataset.i, v = data.videos[i]; if (!v || t.dataset.i == null) return;
    if (t.dataset.k){
      v[t.dataset.k] = t.value; markDirty();
      if (t.dataset.k === "_url") later(v, function(){ fetchVideo(v); }, 450);
      if (t.dataset.k === "title"){
        var h = document.querySelector('.vitem[data-v="' + i + '"] h3'); if (h){ h.textContent = listTitle(t.value); h.title = t.value; }
        $("edTitle").textContent = t.value || "새 강의";
      }
      return;
    }
    if (t.dataset.fk){
      var f = v.files[+t.dataset.f]; f[t.dataset.fk] = t.value; markDirty();
      if (t.dataset.fk === "name"){ var sn = SC.splitName(t.value); if (sn.type) f.type = sn.type; }
      if (t.dataset.fk === "link"){
        f.size = ""; f._st = ""; if (!t.value.trim()){ f.name = ""; f.type = ""; }
        var st = $("v" + i + "f" + t.dataset.f + "s"); if (st) st.innerHTML = fileStatus(f);
        later(f, function(){ fetchFile(f); }, 450);
      }
    }
  }
  function onClick(e){
    var b = e.target.closest("[data-act]"); if (!b) return;
    var act = b.dataset.act;
    if (act !== "toggle" && act !== "redit" && act !== "rage") e.stopPropagation();
    if (act === "delNo"){ armedDel = null; render(); return; }
    if (b.dataset.m != null){ rClick(b, e); return; }
    var i = +b.dataset.i, V = data.videos, v = V[i];
    if (!v) return;
    if (act === "toggle"){
      if (b.classList.contains("vrow") && (e.target.closest("button") || e.target.closest("a"))) return;
      openV = (openV === v) ? null : v; armedDel = null; render(); return;
    }
    if (act === "vis"){ v.visible = v.visible === false; markDirty(); render(); toast(v.visible ? "공개로 바꿨어요. 저장하면 사이트에 보여요" : "비공개로 바꿨어요. 저장하면 사이트에서 숨겨져요"); return; }
    if (act === "visSet"){ var nv = b.dataset.val === "1"; if (v.visible !== nv){ v.visible = nv; markDirty(); render(); } return; }
    if (act === "refetch"){ fetchVideo(v, true); v.files.forEach(function(f){ if (f.link.trim()) fetchFile(f); }); return; }
    if (act === "addFile"){ v.files.push({ name:"", type:"", link:"", size:"", _st:"" }); markDirty(); render(); var el = $("v" + i + "f" + (v.files.length - 1) + "l"); if (el) el.focus(); return; }
    if (act === "fdel"){ v.files.splice(+b.dataset.f, 1); markDirty(); render(); return; }
    if (act === "del"){ armedDel = v; render(); return; }
    if (act === "delYes"){ V.splice(i, 1); armedDel = null; openV = null; markDirty(); render(); toast("강의를 뺐어요. 저장을 눌러야 사이트에서도 빠져요"); return; }
  }
  function onKey(e){
    /* 공개 설정: 화살표 키로 고르기 */
    if (/^Arrow(Left|Right)$/.test(e.key) && e.target.getAttribute("role") === "radio" && e.target.classList.contains("seg")){
      var sib = e.key === "ArrowRight" ? e.target.nextElementSibling : e.target.previousElementSibling;
      if (sib){
        e.preventDefault(); var grp = sib.parentElement.getAttribute("aria-labelledby"), val = sib.dataset.val; sib.click();
        var again = document.querySelector('[aria-labelledby="' + grp + '"] .seg[data-val="' + val + '"]'); if (again) again.focus();
      }
    }
  }
  ["videos", "editor"].forEach(function(k){
    $(k).addEventListener("input", onInput);
    $(k).addEventListener("click", onClick);
    $(k).addEventListener("keydown", onKey);
  });
  $("addVideo").addEventListener("click", function(){
    if (view.cat === RID){ addMonth(); return; }
    var v = { id:"", _url:"", title:"", channel:"", description:"", duration:"", date:"", _st:"", category:view.cat, visible:true, files:[{ name:"", type:"", link:"", size:"", _st:"" }] };
    data.videos.unshift(v); openV = v; armedDel = null; render(true);
    var el = $("v0url"); if (el) el.focus();
  });
  document.querySelectorAll("[data-site]").forEach(function(el){
    el.addEventListener("input", function(){ data.site[el.dataset.site] = el.value; markDirty(); });
  });
  $("saveBtn").addEventListener("click", save);
  document.addEventListener("keydown", function(e){ if ((e.ctrlKey || e.metaKey) && e.key === "s"){ e.preventDefault(); save(); } });

  function confirmLeave(){ toast("저장하지 않은 변경이 있어요. 먼저 저장해 주세요"); return false; }
  window.addEventListener("beforeunload", function(e){ if (dirty){ e.preventDefault(); e.returnValue = ""; } });


  /* ================= 사이트 업데이트: 내 폴더를 읽어 바뀐 파일만 한 번에 올림 ================= */
  (function(){
    var CHK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
    function log(html){ var li = document.createElement("li"); li.innerHTML = html; $("updLog").appendChild(li); return li; }
    function b64bytes(buf){ var b = new Uint8Array(buf), s = "", CH = 0x8000; for (var i = 0; i < b.length; i += CH) s += String.fromCharCode.apply(null, b.subarray(i, i + CH)); return btoa(s); }
    function allowed(path){ return !/^data\//.test(path) && /^(index\.html|admin\.html|404\.html|README\.md|\.nojekyll|assets\/[\w.\-]+)$/.test(path); }
    /* git 방식 파일 지문(blob sha) — 바뀐 파일만 고르는 데 사용 */
    function blobSha(buf){
      var b = new Uint8Array(buf), head = new TextEncoder().encode("blob " + b.length + "\0"), all = new Uint8Array(head.length + b.length);
      all.set(head, 0); all.set(b, head.length);
      return crypto.subtle.digest("SHA-1", all).then(function(h){ return Array.prototype.map.call(new Uint8Array(h), function(x){ return (x < 16 ? "0" : "") + x.toString(16); }).join(""); });
    }

    /* ---- 폴더 기억 (크롬·엣지: 한 번 고르면 다음부터 버튼만) ---- */
    var canFS = typeof window.showDirectoryPicker === "function";
    function idb(){ return new Promise(function(res, rej){ var r = indexedDB.open("sc-admin", 1); r.onupgradeneeded = function(){ r.result.createObjectStore("kv"); }; r.onsuccess = function(){ res(r.result); }; r.onerror = function(){ rej(r.error); }; }); }
    function kvGet(k){ return idb().then(function(db){ return new Promise(function(res){ var q = db.transaction("kv").objectStore("kv").get(k); q.onsuccess = function(){ res(q.result || null); }; q.onerror = function(){ res(null); }; }); }).catch(function(){ return null; }); }
    function kvSet(k, v){ return idb().then(function(db){ return new Promise(function(res){ var t = db.transaction("kv", "readwrite"); t.objectStore("kv").put(v, k); t.oncomplete = res; t.onerror = res; }); }).catch(function(){}); }
    var dirHandle = null;
    function showFolder(){
      $("updFolder").innerHTML = dirHandle
        ? '<span>폴더 <b>' + esc(dirHandle.name) + '</b></span><button type="button" class="k-lnk" id="updChange">바꾸기</button>'
        : '<span class="k-note">' + (canFS ? '처음 한&nbsp;번 <b>sdp_edu</b> 폴더를 고르면 다음부터는 버튼만 누르면 돼요.' : '누를 때마다 <b>sdp_edu</b> 폴더를 골라 주세요.') + '</span>';
      var c = $("updChange"); if (c) c.onclick = function(){ pickDir().then(function(h){ if (h) run(); }); };
    }
    if (canFS) kvGet("dir").then(function(h){ dirHandle = h; showFolder(); }); else showFolder();

    function pickDir(){
      return window.showDirectoryPicker({ id:"sc-site", mode:"read" }).then(function(h){
        return h.getFileHandle("index.html").then(function(){ return h.getFileHandle("admin.html"); }).then(function(){
          dirHandle = h; kvSet("dir", h); showFolder(); return h;
        }).catch(function(){ toast("sdp_edu 폴더를 골라 주세요. 그 안에 index.html이 있어야 해요"); return null; });
      }).catch(function(){ return null; });
    }
    function ensurePerm(h){
      var o = { mode:"read" };
      return h.queryPermission(o).then(function(p){ return p === "granted" ? p : h.requestPermission(o); }).then(function(p){ return p === "granted"; });
    }
    function readDir(h){
      var out = [];
      function walk(dir, prefix, depth){
        var it = dir.values(), chain = Promise.resolve();
        function next(){
          return it.next().then(function(r){
            if (r.done) return;
            var e = r.value, path = prefix + e.name;
            var p = e.kind === "file"
              ? (allowed(path) ? e.getFile().then(function(f){ out.push({ path:path, file:f }); }) : Promise.resolve())
              : (depth < 1 && e.name === "assets" ? walk(e, path + "/", depth + 1) : Promise.resolve());
            return p.then(next);
          });
        }
        return next();
      }
      return walk(h, "", 0).then(function(){ return out; });
    }

    /* ---- 올리기: 바뀐 파일만 커밋 1개로 ---- */
    var busy = false;
    function setBusy(b, label){
      busy = b;
      var btn = $("updRun");
      btn.disabled = b; btn.classList.toggle("busy", b);
      btn.innerHTML = b ? '<span class="spin" aria-hidden="true"></span>' + esc(label || "업데이트 중") : K.upload + "지금 업데이트";
    }
    function upload(items){
      $("updLog").innerHTML = "";
      if (!items.length){ log('<span class="pill bad">올릴 파일이 없어요. sdp_edu 폴더가 맞는지 확인해 주세요</span>'); return Promise.resolve(); }
      setBusy(true, "확인 중");
      var head, baseTree, remote = {};
      return gh("/git/ref/heads/" + encodeURIComponent(branch)).then(function(ref){
        head = ref.object.sha; return gh("/git/commits/" + head);
      }).then(function(c){
        baseTree = c.tree.sha; return gh("/git/trees/" + baseTree + "?recursive=1");
      }).then(function(t){
        (t.tree || []).forEach(function(e){ if (e.type === "blob") remote[e.path] = e.sha; });
        return Promise.all(items.map(function(x){
          return x.file.arrayBuffer().then(function(buf){
            var head16 = new TextDecoder("latin1").decode(new Uint8Array(buf).subarray(0, 16));
            if (/DocuRay/i.test(head16)) return { path:x.path, drm:true };
            return blobSha(buf).then(function(sha){ return { path:x.path, buf:buf, sha:sha }; });
          });
        }));
      }).then(function(list){
        var drm = list.filter(function(x){ return x.drm; });
        if (drm.length) log('<span class="pill bad">' + drm.length + '개 건너뜀</span> 보안 프로그램으로 암호화된 파일이에요: ' + drm.map(function(x){ return esc(x.path); }).join(", "));
        var changed = list.filter(function(x){ return !x.drm && remote[x.path] !== x.sha; });
        if (!changed.length){ log('<span class="pill ok">이미 최신이에요</span> 바뀐 파일이 없어요.'); return null; }
        setBusy(true, "올리는 중");
        /* 홈(index.html)이 바뀌면 강의별 공유 페이지·메뉴 페이지도 같은 커밋에서 새로 만듦 */
        var idx = changed.filter(function(x){ return x.path === "index.html"; })[0], pages = Promise.resolve([]);
        if (idx && canSave){
          var out = cleanData(), tpl = new TextDecoder().decode(idx.buf);
          pages = Promise.all(out.videos.map(function(v){ return bestThumb(v.id); })).then(function(th){
            var built = builtPages(tpl, out, th, cleanResearch());
            return built.concat(staleShare(remote, built));
          });
        }
        return Promise.all([pages].concat(changed.map(function(x){
          return gh("/git/blobs", { method:"POST", body: JSON.stringify({ content: b64bytes(x.buf), encoding:"base64" }) })
            .then(function(r){ return { path:x.path, mode:"100644", type:"blob", sha:r.sha }; });
        }))).then(function(all){
          var tree = all.slice(1).concat(all[0]);
          return gh("/git/trees", { method:"POST", body: JSON.stringify({ base_tree: baseTree, tree: tree }) });
        }).then(function(t){
          return gh("/git/commits", { method:"POST", body: JSON.stringify({ message: "사이트 업데이트 (" + changed.length + "개 파일)", tree: t.sha, parents:[head] }) });
        }).then(function(c){
          showLast(c.committer && c.committer.date); Deploy.expect(c.sha);
          return gh("/git/refs/heads/" + encodeURIComponent(branch), { method:"PATCH", body: JSON.stringify({ sha: c.sha }) });
        }).then(function(){
          var names = changed.map(function(x){ return x.path.replace(/^assets\//, ""); });
          var all = names.join(", ");
          log('<span class="pill ok nodot">' + CHK + changed.length + '개&nbsp;올림</span><span class="names" title="' + esc(all) + '">' + esc(all) + '</span>').className = "one";
          Audit.add([{ t: "set:update", x: "사이트 업데이트 · 파일 " + changed.length + "개" }]);
          return changed;
        });
      }).then(function(changed){
        if (!changed) return;
        return waitLive(changed);
      }).catch(function(e){
        log('<span class="pill bad">올리지 못했어요</span> ' + (e.status === 409 || e.status === 422 ? "다른 저장과 겹쳤어요. 잠시 뒤 다시 눌러 주세요." : e.status === 403 || e.status === 404 ? "토큰 권한을 확인해 주세요." : "인터넷 연결을 확인하고 다시 눌러 주세요."));
      }).then(function(){ setBusy(false); });
    }
    /* 실제 사이트(홈 포함)에 반영될 때까지 확인 */
    function waitLive(changed){
      changed = changed.filter(function(x){ return x.path !== ".nojekyll"; });
      if (!changed.length) return Promise.resolve();
      setBusy(true, "사이트 반영 중");
      var li = log(""); li.className = "stat";
      function show(h){ li.innerHTML = h; }
      show('<span class="spin" aria-hidden="true"></span><span>사이트에 반영하는 중 <span class="nowrap">(보통 1~2분)</span></span>');
      var started = Date.now();
      return new Promise(function(res){
        function check(){
          Promise.all(changed.map(function(x){
            return fetch(x.path + "?live=" + Date.now(), { cache:"no-store" }).then(function(r){ return r.ok ? r.arrayBuffer().then(blobSha) : ""; }).catch(function(){ return ""; })
              .then(function(sha){ return sha === x.sha; });
          })).then(function(ok){
            var done = ok.filter(Boolean).length;
            if (done === changed.length){
              show('<span class="pill ok nodot">' + CHK + '반영&nbsp;완료</span><button type="button" class="linkbtn" id="updReload">새로고침</button>');
              $("updReload").onclick = function(){ location.reload(); };
              toast("업데이트가 홈과 관리자에 반영됐어요"); return res();
            }
            if (Date.now() - started > 6 * 60 * 1000){ show('<span class="pill warn">반영이 늦어지고 있어요</span> 몇 분 뒤 새로고침해 보세요'); return res(); }
            show('<span class="spin" aria-hidden="true"></span><span>사이트에 반영하는 중 <span class="nowrap">' + done + '/' + changed.length + '</span></span>');
            setTimeout(check, 6000);
          });
        }
        setTimeout(check, 8000);
      });
    }

    function run(){
      if (busy) return;
      $("updBox").open = true;
      if (!canSave){ $("updLog").innerHTML = ""; log('<span class="pill bad">먼저 로그인해서 저장소에 연결해 주세요</span>'); return; }
      if (!canFS){ $("updPick").click(); return; }
      var h = dirHandle;
      (h ? Promise.resolve(h) : pickDir()).then(function(h2){
        if (!h2) return;
        return ensurePerm(h2).then(function(ok){
          if (!ok){ toast("폴더 읽기를 허용해야 업데이트할 수 있어요"); return; }
          return readDir(h2).then(upload);
        });
      }).catch(function(){ toast("폴더를 읽지 못했어요. ‘바꾸기’로 폴더를 다시 골라 주세요"); });
    }
    $("updRun").addEventListener("click", run);
    $("updPick").addEventListener("change", function(){
      var picked = Array.prototype.slice.call(this.files || []); this.value = "";
      var items = picked.map(function(f){ var rel = (f.webkitRelativePath || f.name).split("/"); rel.shift(); return { file:f, path:rel.join("/") }; })
        .filter(function(x){ return allowed(x.path); });
      upload(items);
    });
  })();

  /* ================= 마지막 업데이트 시각 ================= */
  function showLast(iso){
    var d = iso ? new Date(iso) : null;
    if (!d || isNaN(d)) return;
    var z = function(n){ return (n < 10 ? "0" : "") + n; };
    $("updSum").innerHTML = "<span>" + (d.getMonth() + 1) + "월 " + d.getDate() + "일 " + z(d.getHours()) + ":" + z(d.getMinutes()) + "</span>";
  }
  function lastUpdate(){
    gh("/commits?sha=" + encodeURIComponent(branch) + "&per_page=1").then(function(list){
      var c = list && list[0]; if (c) showLast(c.commit.committer.date);
    }).catch(function(){});
  }

  /* ================= 사이트 반영 상태 원 (깃헙 액션의 주황/초록) =================
     주황: 반영 중 · 초록: 반영 완료 · 빨강: 실패. 누르면 깃헙 액션 화면. */
  var Deploy = (function(){
    var el = $("deploy"), timer = null, want = "", wantAt = 0, started = false, noAuth = false;
    function runs(){
      var url = "https://api.github.com/repos/" + owner + "/" + repo + "/actions/runs?per_page=1";
      var h = { "Accept":"application/vnd.github+json" };
      if (token && !noAuth) h.Authorization = "Bearer " + token;
      return fetch(url, { headers:h, cache:"no-store" }).then(function(r){
        /* 토큰에 액션 읽기 권한이 없으면 토큰 없이 다시 (공개 저장소라 가능) */
        if ((r.status === 401 || r.status === 403 || r.status === 404) && h.Authorization){ noAuth = true; return runs(); }
        if (!r.ok) throw new Error(r.status);
        return r.json();
      });
    }
    function hm(iso){ var d = new Date(iso), z = function(n){ return (n < 10 ? "0" : "") + n; }; return isNaN(d) ? "" : z(d.getHours()) + ":" + z(d.getMinutes()); }
    function set(st, text){ el.dataset.st = st; el.title = text; el.setAttribute("aria-label", text); }
    function tick(){
      clearTimeout(timer);
      if (document.hidden){ timer = setTimeout(tick, 15000); return; }
      runs().then(function(j){
        var r = (j.workflow_runs || [])[0], busy;
        if (want && Date.now() - wantAt > 10 * 60 * 1000) want = "";
        if (want && (!r || r.head_sha !== want)){ set("run", "사이트에 반영하는 중"); busy = true; }
        else if (!r){ set("none", ""); busy = false; }
        else if (r.status !== "completed"){ set("run", "사이트에 반영하는 중"); busy = true; }
        else {
          want = ""; busy = false;
          if (r.conclusion === "success") set("ok", "반영 완료 · " + hm(r.updated_at));
          else set("bad", "반영 실패 · 눌러서 깃헙 액션 확인");
        }
        timer = setTimeout(tick, busy ? 5000 : 90000);
      }).catch(function(){ timer = setTimeout(tick, 60000); });
    }
    return {
      start: function(){
        el.href = "https://github.com/" + owner + "/" + repo + "/actions";
        if (!started){ started = true; document.addEventListener("visibilitychange", function(){ if (!document.hidden) tick(); }); }
        tick();
      },
      expect: function(commitSha){ want = commitSha || ""; wantAt = Date.now(); set("run", "사이트에 반영하는 중"); clearTimeout(timer); timer = setTimeout(tick, 4000); }
    };
  })();

  /* ================= 로그인 (비밀번호로 토큰을 암호화해 data/auth.json 에 보관) ================= */
  var AUTH_PATH = "data/auth.json", ITER = 600000, authInfo = null;
  function u8(b64){ var s = atob(b64), a = new Uint8Array(s.length); for (var i = 0; i < s.length; i++) a[i] = s.charCodeAt(i); return a; }
  function b64(u){ var s = ""; for (var i = 0; i < u.length; i++) s += String.fromCharCode(u[i]); return btoa(s); }
  function deriveKey(pw, salt, iter){
    return crypto.subtle.importKey("raw", new TextEncoder().encode(pw), "PBKDF2", false, ["deriveKey"]).then(function(base){
      return crypto.subtle.deriveKey({ name:"PBKDF2", salt:salt, iterations:iter, hash:"SHA-256" }, base, { name:"AES-GCM", length:256 }, false, ["encrypt", "decrypt"]);
    });
  }
  function seal(pw, secret){
    var salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
    return deriveKey(pw, salt, ITER).then(function(k){
      return crypto.subtle.encrypt({ name:"AES-GCM", iv:iv }, k, new TextEncoder().encode(JSON.stringify(secret)));
    }).then(function(ct){
      return { v:1, kdf:"PBKDF2-SHA256", iter:ITER, salt:b64(salt), iv:b64(iv), data:b64(new Uint8Array(ct)) };
    });
  }
  function unseal(pw, a){
    return deriveKey(pw, u8(a.salt), a.iter || ITER).then(function(k){
      return crypto.subtle.decrypt({ name:"AES-GCM", iv:u8(a.iv) }, k, u8(a.data));
    }).then(function(pt){ return JSON.parse(new TextDecoder().decode(pt)); });
  }
  function fetchAuth(){
    var urls = ["data/auth.json?t=" + Date.now(), "https://raw.githubusercontent.com/" + owner + "/" + repo + "/HEAD/" + AUTH_PATH + "?t=" + Date.now()];
    function tryAt(n){
      if (n >= urls.length) return Promise.resolve(null);
      return fetch(urls[n], { cache:"no-store" }).then(function(r){ return r.ok ? r.json() : tryAt(n + 1); }).catch(function(){ return tryAt(n + 1); });
    }
    return tryAt(0).then(function(a){ return (a && a.data && a.salt) ? a : null; });
  }

  var setupMode = "first";
  function showGate(mode, msg, cls){
    document.body.classList.remove("authed");
    $("loginForm").hidden = mode !== "login"; $("setupForm").hidden = !(mode === "first" || mode === "change");
    $("sabunForm").hidden = mode !== "sabun"; $("pwForm").hidden = mode !== "pw";
    if (mode === "sabun" || mode === "pw"){ Auth.show(mode, msg, cls); return; }
    $("gateIc").hidden = false; $("pwOut").hidden = true; document.querySelector(".gwrap").classList.remove("wide");
    $("loginMsg").textContent = ""; $("setupMsg").textContent = msg || ""; $("loginForm").classList.remove("err"); $("pwSame").hidden = true;
    if (mode === "login"){
      $("gateTitle").textContent = "관리자 로그인";
      $("gateLead").textContent = "관리자 비밀번호를 넣어 주세요.";
      $("pw").value = ""; setTimeout(function(){ $("pw").focus(); }, 50);
    } else {
      setupMode = mode;
      $("gateTitle").textContent = mode === "first" ? "관리자 비밀번호 만들기" : "비밀번호·토큰 바꾸기";
      $("gateLead").textContent = mode === "first"
        ? "처음 한 번만 하면 돼요. 앞으로는 어느 기기에서든 비밀번호만으로 들어올 수 있어요."
        : "새 토큰이나 새 비밀번호를 넣고 저장하세요. 다른 기기에서도 새 비밀번호로 들어와야 해요.";
      $("ghToken").value = token || ""; $("apiKey").value = apiKey || "";
      $("newPw").value = ""; $("newPw2").value = "";
      $("setupBtn").textContent = mode === "first" ? "비밀번호 만들고 시작하기" : "저장하기";
      $("setupCancel").hidden = !(mode === "change" && token);
      setTimeout(function(){ (token ? $("newPw") : $("ghToken")).focus(); }, 50);
    }
  }
  function enterApp(){
    document.body.classList.add("authed");
    $("noAuth").hidden = !!authInfo || !!adminSes || !!GATE_URL;
    Route.master(); Route.apply();
    load();
  }

  $("loginForm").addEventListener("submit", function(e){
    e.preventDefault();
    var pw = $("pw").value, btn = $("loginBtn");
    if (!pw || !authInfo) return;
    btn.disabled = true; btn.textContent = "확인 중…"; $("loginMsg").textContent = "";
    unseal(pw, authInfo).then(function(sec){
      keepSession(sec.token, sec.apiKey, $("remember1").checked);
      enterApp();
    }).catch(function(){
      $("loginMsg").textContent = "비밀번호가 맞지 않아요. 다시 입력해 주세요.";
      $("loginForm").classList.add("err");
      $("pw").select();
    }).then(function(){ btn.disabled = false; btn.textContent = "로그인"; });
  });

  $("setupForm").addEventListener("submit", function(e){
    e.preventDefault();
    var tok = $("ghToken").value.trim(), key = $("apiKey").value.trim(), p1 = $("newPw").value, p2 = $("newPw2").value, msg = $("setupMsg"), btn = $("setupBtn");
    msg.textContent = "";
    if (!/^(github_pat_|ghp_)/.test(tok)){ msg.textContent = "GitHub 토큰을 확인해 주세요. github_pat_로 시작해요."; return; }
    if (p1.length < 4){ msg.textContent = "비밀번호는 4자 이상으로 정해 주세요."; return; }
    if (p1 !== p2){ msg.textContent = "두 비밀번호가 서로 달라요."; return; }
    if (!$("repoFields").hidden){ owner = $("ghOwner").value.trim(); repo = $("ghRepo").value.trim(); LS.set("sc-owner", owner); LS.set("sc-repo", repo); }
    var label = btn.textContent; btn.disabled = true; btn.textContent = "저장하는 중…";
    var prevTok = token; token = tok;
    gh("").then(function(info){
      branch = info.default_branch || "main";
      if (info.permissions && info.permissions.push === false) throw Object.assign(new Error("no push"), { status:403 });
      return Promise.all([ seal(p1, { token:tok, apiKey:key }), gh("/contents/" + AUTH_PATH + "?ref=" + encodeURIComponent(branch)).catch(function(er){ if (er.status === 404) return null; throw er; }) ]);
    }).then(function(r){
      var sealed = r[0], cur = r[1];
      return gh("/contents/" + AUTH_PATH, { method:"PUT", body: JSON.stringify({
        message: "관리자 로그인 정보 " + (cur ? "변경" : "설정"), branch: branch, sha: cur ? cur.sha : undefined,
        content: b64enc(JSON.stringify(sealed, null, 2) + "\n")
      }) }).then(function(){ return sealed; });
    }).then(function(sealed){
      authInfo = sealed;
      keepSession(tok, key, $("remember2").checked);
      enterApp();
      toast(setupMode === "first" ? "비밀번호를 만들었어요. 다음부터는 비밀번호로 로그인하세요" : "바꿨어요. 다른 기기에서도 새 비밀번호로 로그인하세요");
    }).catch(function(er){
      token = prevTok;
      msg.textContent = er.status === 401 ? "토큰이 맞지 않거나 만료됐어요."
        : (er.status === 403 || er.status === 404) ? "이 토큰으로는 저장소에 쓸 수 없어요. 토큰의 저장소 선택과 Contents 권한을 확인해 주세요."
        : "저장하지 못했어요. 잠시 뒤 다시 해 주세요.";
    }).then(function(){ btn.disabled = false; btn.textContent = label; });
  });
  $("setupCancel").addEventListener("click", function(){ enterApp(); });
  $("pw").addEventListener("input", function(){ $("loginForm").classList.remove("err"); $("loginMsg").textContent = ""; });
  ["newPw", "newPw2"].forEach(function(k){ $(k).addEventListener("input", function(){ var a = $("newPw").value, b = $("newPw2").value; $("pwSame").hidden = !(a.length >= 4 && a === b); }); });


  /* ================= 기획 P5 + 디자인 #41: 관리자 사번 + 비밀번호 로그인 =================
     세일즈온 사번 목록(Apps Script)이 관리자 탭·비밀번호를 확인하고, 비밀번호를 바꾼 관리자에게만 GitHub 토큰·API 키를 내줌.
     '자동 로그인'을 체크하면 마스터가 정한 기간 동안 이 기기에 로그인을 남기고(localStorage), 아니면 이 창에서만(sessionStorage).
     '사번 저장'은 사번만 기억(비밀번호는 저장 안 함). 비밀번호 틀린 횟수 제한 없음(사용자 확정 11-11). */
  var K = {
    person:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20c1.2-3.6 4-5.5 7.5-5.5s6.3 1.9 7.5 5.5"/></svg>',
    eye:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/></svg>',
    eyeOff:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3l18 18M10.6 5.6A10 10 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-3 3.8M6.6 6.6C3.9 8.3 2.5 12 2.5 12S6 18.5 12 18.5c1.6 0 3-.4 4.3-1.1"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>',
    caps:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4l7 7.5h-4V15H9v-3.5H5z"/><path d="M9 19h6"/></svg>',
    ck:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    alert:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5M12 16.5v.5"/></svg>',
    warn:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4 21 19.5H3z"/><path d="M12 10v4.5M12 17v.5"/></svg>',
    ok:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.8 2.8L16.5 9.5"/></svg>',
    upload:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 16V4M7 9l5-5 5 5M5 20h14"/></svg>'
  };
  var SPIN = '<span class="spin" aria-hidden="true"></span>';
  function z2(n){ return (n < 10 ? "0" : "") + n; }
  /* 창구 시각(한국 시간 'YYYY-MM-DDTHH:MM:SS') 보여 주기: ko = 11월 11일 14:50 · dot = 11.11 09:41 · full = 2026.10.30 14:02 · md = 11.11 */
  function fmtAt(s, style){
    var m = /^(\d{4})-(\d\d)-(\d\d)[T ](\d\d):(\d\d)/.exec(s || ""); if (!m) return "";
    if (style === "dot") return m[2] + "." + m[3] + " " + m[4] + ":" + m[5];
    if (style === "full") return m[1] + "." + m[2] + "." + m[3] + " " + m[4] + ":" + m[5];
    if (style === "md") return m[2] + "." + m[3];
    return (+m[2]) + "월 " + (+m[3]) + "일 " + m[4] + ":" + m[5];
  }
  function stampHtml(act, name, at, style){ return K.person + '<span>' + esc(act) + ' <b>' + esc(name) + '</b> · ' + esc(fmtAt(at, style || "ko")) + '</span>'; }
  function orgShort(org){ var p = String(org || "").split(">").map(function(x){ return x.trim(); }).filter(Boolean); return p.length ? p[p.length - 1] : ""; }
  function kmsg(id, cls, html){ var p = $(id); if (!p) return; p.className = "k-msg" + (cls ? " " + cls : ""); p.innerHTML = html || ""; p.hidden = !html; }
  function gateFetch(body){
    return fetch(GATE_URL, { method:"POST", body: JSON.stringify(body), cache:"no-store", redirect:"follow" })
      .then(function(r){ if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); });
  }

  /* ---- 비밀번호 칸 공통: 보기/숨기기 · Caps Lock 알림 · 조건 체크 3개 ---- */
  document.querySelectorAll("[data-eye]").forEach(function(b){
    b.innerHTML = K.eye;
    b.addEventListener("click", function(){
      var inp = $(b.dataset.eye), show = inp.type === "password";
      inp.type = show ? "text" : "password"; b.innerHTML = show ? K.eyeOff : K.eye;
      b.setAttribute("aria-label", show ? "비밀번호 숨기기" : "비밀번호 보기");
    });
  });
  document.querySelectorAll("[data-caps]").forEach(function(inp){
    var pill = $(inp.dataset.caps), wrap = inp.closest(".k-inwrap");
    pill.innerHTML = K.caps + "Caps Lock 켜짐";
    function set(on){ pill.hidden = !on; wrap.classList.toggle("has-caps", on); }
    function chk(e){ if (e.getModifierState) set(e.getModifierState("CapsLock")); }
    inp.addEventListener("keydown", chk); inp.addEventListener("keyup", chk);
    inp.addEventListener("blur", function(){ set(false); });
  });
  var CHK_T = ["8자 이상", "영문+숫자 조합", "비밀번호가 일치해요"];
  function pwChecks(listId){
    var ul = $(listId), ids = ul.dataset.for.split(" "), a = $(ids[0]).value, b = $(ids[1]).value;
    var ok = [a.length >= 8, /[A-Za-z]/.test(a) && /\d/.test(a), !!a && a === b];
    ul.innerHTML = ok.map(function(y, i){ return '<li' + (y ? ' class="y"' : '') + '><span class="k-ck">' + K.ck + '</span>' + CHK_T[i] + '</li>'; }).join("");
    return ok[0] && ok[1] && ok[2];
  }

  var Auth = (function(){
    var pending = null, armed = null, armT = null, lastList = [], showAll = false, keys = {};
    var PREF_KEEP = "sdp-admin-keep", PREF_REM = "sdp-admin-rem", SAB_KEY = "sdp-admin-sabun";
    function sidGet(){ try { return JSON.parse(LS.get(SID_KEY) || SS.get(SID_KEY) || "null"); } catch(e){ return null; } }
    function sidSet(o, keep){
      LS.set(SID_KEY, o && keep ? JSON.stringify(o) : ""); SS.set(SID_KEY, o && !keep ? JSON.stringify(o) : "");
    }
    function card(mode){
      $("sabunForm").hidden = mode !== "sabun"; $("pwForm").hidden = mode !== "pw";
      $("gateIc").hidden = mode === "pw"; $("pwOut").hidden = mode !== "pw";
      document.querySelector(".gwrap").classList.toggle("wide", mode === "pw");
    }
    function sabunMsg(cls, html){ kmsg("sabunMsg", cls, html ? (cls === "wa" ? K.warn : K.alert) + "<span>" + html + "</span>" : ""); }
    function show(mode, msg, cls){
      card(mode);
      if (mode === "sabun"){
        $("gateTitle").textContent = "관리자 로그인";
        $("gateLead").textContent = "사번과 비밀번호를 입력해 주세요.";
        sabunMsg(cls || "er", msg); $("aPw").removeAttribute("aria-invalid");
        $("aPw").value = ""; $("aKeep").checked = LS.get(PREF_KEEP) !== "0"; $("aRem").checked = LS.get(PREF_REM) !== "0";
        if (!$("aSabun").value) $("aSabun").value = LS.get(SAB_KEY);
        setTimeout(function(){ ($("aSabun").value ? $("aPw") : $("aSabun")).focus(); }, 50);
      } else {
        var who = pending || {};
        $("gateTitle").textContent = "새 비밀번호 만들기";
        $("gateLead").innerHTML = "앞으로 쓸 비밀번호를 만들어 주세요.<br>초기 비밀번호인 0000으로는 변경할 수 없어요.";
        $("pwWho").innerHTML = '<span class="k-av">' + esc((who.name || "?").charAt(0)) + '</span><span class="k-col"><b>' + esc(who.name || "") + '</b><span class="k-sub">사번 ' + esc(String(who.sabun || "").slice(0, 4)) + '****</span></span>' + (who.master ? '<span class="k-pill ac k-ml">마스터</span>' : '');
        $("pwUser").value = who.sabun || ""; $("aNew").value = ""; $("aNew2").value = "";
        $("pwMsg").hidden = true; $("pwBtn").disabled = !pwChecks("pwChk");
        setTimeout(function(){ $("aNew").focus(); }, 50);
      }
    }
    function enterWith(r, keep){
      adminSes = { sid: r.sid || (sidGet() || {}).sid, sabun: r.sabun, name: r.name, master: !!r.master, exp: r.exp, keep: !!keep, org: r.org || "", keepRule: r.keepRule };
      sidSet({ sid: adminSes.sid, exp: r.exp, keep: !!keep }, keep);
      keepSession(r.secrets.ghToken, r.secrets.apiKey, false);
      useTheme(r.theme);
      enterApp();
    }
    /* 계정마다 마지막에 고른 라이트/다크 기억 (사용자 요청 11-11): 로그인하면 그 계정 값으로, 바꾸면 사번 목록에 저장 */
    var themeSent = "";
    function useTheme(t){
      if (t === "dark" || t === "light"){ themeSent = t; if (Theme.cur() !== t) Theme.set(t, null, $("tmIc")); return; }
      var sid = adminSes ? adminSes.sid : pending ? pending.sid : "";      // 아직 저장된 값이 없으면 지금 모드를 그 계정 값으로
      themeSent = Theme.cur(); if (sid) gateFetch({ action:"adminTheme", sid: sid, theme: themeSent }).catch(function(){ themeSent = ""; });
    }
    if (window.MutationObserver) new MutationObserver(function(){
      var t = Theme.cur(), sid = adminSes ? adminSes.sid : pending ? pending.sid : "";
      if (!sid || !GATE_URL || t === themeSent) return;
      themeSent = t; gateFetch({ action:"adminTheme", sid: sid, theme: t }).catch(function(){ themeSent = ""; });
    }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    /* ① 로그인 */
    $("aSabun").addEventListener("input", function(){ this.value = this.value.replace(/\D/g, "").slice(0, 8); this.removeAttribute("aria-invalid"); $("aSabunErr").hidden = true; });
    $("aPw").addEventListener("input", function(){ this.removeAttribute("aria-invalid"); sabunMsg(); });
    $("sabunForm").addEventListener("submit", function(e){
      e.preventDefault();
      var sab = $("aSabun").value.trim(), pw = $("aPw").value, btn = $("sabunBtn"), keep = $("aKeep").checked;
      if (!/^\d{8}$/.test(sab)){ $("aSabun").setAttribute("aria-invalid", "true"); $("aSabunErr").hidden = false; $("aSabun").focus(); return; }
      if (!pw){ $("aPw").setAttribute("aria-invalid", "true"); sabunMsg("er", "비밀번호를 입력해 주세요."); $("aPw").focus(); return; }
      LS.set(PREF_KEEP, keep ? "1" : "0"); LS.set(PREF_REM, $("aRem").checked ? "1" : "0"); LS.set(SAB_KEY, $("aRem").checked ? sab : "");
      btn.disabled = true; btn.innerHTML = SPIN + "확인 중…"; sabunMsg();
      gateFetch({ action:"adminLogin", sabun: sab, pw: pw, keep: keep }).then(function(r){
        if (!r.ok){
          if (r.error === "badpw"){ $("aPw").setAttribute("aria-invalid", "true"); sabunMsg("er", "비밀번호가 맞지 않아요. 다시 입력해 주세요."); $("aPw").select(); }
          else if (r.error === "notadmin") sabunMsg("er", "관리자 권한이 없는 사번이에요.");
          else sabunMsg("wa", "<b>지금은 사번으로 로그인할 수 없어요.</b><br>잠시 뒤 다시 해 주세요.");
          return;
        }
        if (r.must){ pending = r; pending.keep = keep; sidSet({ sid: r.sid, exp: r.exp, keep: keep }, keep); useTheme(r.theme); showGate("pw"); return; }
        enterWith(r, keep);
      }).catch(function(){ sabunMsg("wa", "<b>지금은 사번으로 로그인할 수 없어요.</b><br>잠시 뒤 다시 해 주세요."); })
        .then(function(){ btn.disabled = false; btn.textContent = "로그인"; });
    });
    /* ② 새 비밀번호 만들기 (0000으로 들어왔을 때만) */
    ["aNew", "aNew2"].forEach(function(k){ $(k).addEventListener("input", function(){ $("pwBtn").disabled = !pwChecks("pwChk"); $("pwMsg").hidden = true; }); });
    $("pwForm").addEventListener("submit", function(e){
      e.preventDefault();
      var a = $("aNew").value, btn = $("pwBtn");
      if (a === "0000"){ $("pwMsg").textContent = "초기 비밀번호인 0000으로는 변경할 수 없어요."; $("pwMsg").hidden = false; return; }
      if (!pwChecks("pwChk")) return;
      var sid = (pending && pending.sid) || (sidGet() || {}).sid, keep = pending ? pending.keep : !!(sidGet() || {}).keep;
      btn.disabled = true; btn.innerHTML = SPIN + "바꾸는 중…";
      gateFetch({ action:"adminChangePw", sid: sid, pw: a }).then(function(r){
        if (!r.ok){
          if (r.error === "nosession" || r.error === "expired"){ sidSet(null); pending = null; showGate("sabun", "로그인 시간이 지났어요. 다시 로그인해 주세요."); return; }
          $("pwMsg").textContent = r.error === "init" ? "초기 비밀번호인 0000으로는 변경할 수 없어요." : r.error === "weak" ? "8자 이상, 영문과 숫자를 섞어 주세요." : "바꾸지 못했어요. 잠시 뒤 다시 해 주세요.";
          $("pwMsg").hidden = false; return;
        }
        r.sid = sid; pending = null;
        enterWith(r, keep); toast("비밀번호를 바꿨어요. 다음부터 새 비밀번호로 로그인하세요");
      }).catch(function(){ $("pwMsg").textContent = "바꾸지 못했어요. 잠시 뒤 다시 해 주세요."; $("pwMsg").hidden = false; })
        .then(function(){ btn.textContent = "변경하기"; btn.disabled = !pwChecks("pwChk"); });
    });
    $("pwOut").addEventListener("click", function(){ logout(); showGate("sabun"); });

    /* 처음 열 때: 사번 목록 주소(공개 data/config.json) → 상태 → 남아 있는 로그인이 있으면 바로 */
    function boot(fallback){
      fetch("data/config.json?t=" + Date.now(), { cache:"no-store" }).then(function(r){ return r.ok ? r.json() : null; }).catch(function(){ return null; })
        .then(function(cfg){
          GATE_URL = cfg && cfg.gate || "";
          if (!GATE_URL) return fallback();
          return gateFetch({ action:"gateInfo" }).then(function(info){
            gateInfo = info;
            if (!info.ok || !info.hasSecrets) return fallback();          // 아직 토큰을 사번 목록으로 옮기기 전 → 예전 방식(자동)
            LS.set("sc-gh-token", ""); LS.set("sc-api-key", "");          // 이 기기에 남아 있던 예전 로그인은 지움
            var saved = sidGet();
            if (!saved || !saved.sid){ clearSession(); showGate("sabun"); return; }
            return gateFetch({ action:"adminSession", sid: saved.sid }).then(function(r){
              if (!r.ok){ sidSet(null); clearSession(); showGate("sabun", r.error === "expired" && saved.keep ? "날짜가 바뀌어 다시 로그인해 주세요." : "", "in2"); return; }
              if (r.must){ pending = { sid: saved.sid, sabun: r.sabun, name: r.name, master: r.master, keep: !!saved.keep }; useTheme(r.theme); showGate("pw"); return; }
              r.sid = saved.sid; enterWith(r, !!saved.keep);
            });
          }).catch(function(){
            if (token) return fallback();                                 // 예전 방식 로그인이 이 기기에 남아 있으면 그대로
            showGate("sabun", "<b>지금은 사번으로 로그인할 수 없어요.</b><br>잠시 뒤 다시 해 주세요.", "wa");
          });
        });
    }
    function logout(){
      if (adminSes) gateFetch({ action:"adminLogout", sid: adminSes.sid }).catch(function(){});
      else if (pending) gateFetch({ action:"adminLogout", sid: pending.sid }).catch(function(){});
      sidSet(null); adminSes = null; pending = null;
    }

    /* ---- ⚙ 내 계정 ---- */
    function paintMe(){
      var s = adminSes;
      $("meKeepRow").hidden = !s; $("changeBtn").hidden = !s; $("meMaster").hidden = !(s && s.master);
      if (!s){
        $("meSum").textContent = canSave ? "토큰 로그인" : "";
        $("meAv").textContent = "?"; $("meName").textContent = "예전 방식으로 로그인"; $("meSub").textContent = "저장소 " + owner + "/" + repo;
        return;
      }
      $("meSum").innerHTML = '<span>' + esc(s.name) + '</span>' + (s.master ? '<span class="k-pill ac s">마스터</span>' : '');
      $("meAv").textContent = (s.name || "?").charAt(0); $("meName").textContent = s.name;
      $("meSub").textContent = "사번 " + s.sabun + (orgShort(s.org) ? " · " + orgShort(s.org) : "");
      $("meKeepT").textContent = s.keep ? fmtAt(s.exp) + "까지" : "창을 닫으면 끝나요";
      var kp = $("meKeep"); kp.className = "k-pill s " + (s.keep ? "ok" : "mu"); kp.textContent = s.keep ? "켜짐" : "꺼짐";
    }
    function meForm(open){
      $("meForm").hidden = !open; $("meBtns").hidden = open;
      if (open){ ["meOld", "meNew", "meNew2"].forEach(function(k){ $(k).value = ""; $(k).removeAttribute("aria-invalid"); }); $("meUser").value = adminSes ? adminSes.sabun : ""; $("meMsg").hidden = true; $("meSave").disabled = !pwChecks("meChk"); setTimeout(function(){ $("meOld").focus(); }, 30); }
    }
    $("changeBtn").addEventListener("click", function(){ if (adminSes) meForm(true); });
    $("meCancel").addEventListener("click", function(){ meForm(false); });
    ["meNew", "meNew2"].forEach(function(k){ $(k).addEventListener("input", function(){ $("meSave").disabled = !pwChecks("meChk"); $("meMsg").hidden = true; }); });
    $("meOld").addEventListener("input", function(){ this.removeAttribute("aria-invalid"); $("meMsg").hidden = true; });
    $("meForm").addEventListener("submit", function(e){
      e.preventDefault();
      var old = $("meOld").value, a = $("meNew").value, btn = $("meSave");
      function err(t){ $("meMsg").textContent = t; $("meMsg").hidden = false; }
      if (!old){ $("meOld").setAttribute("aria-invalid", "true"); err("지금 비밀번호를 입력해 주세요."); return; }
      if (a === "0000"){ err("초기 비밀번호인 0000으로는 변경할 수 없어요."); return; }
      if (!pwChecks("meChk")) return;
      btn.disabled = true; btn.innerHTML = SPIN + "바꾸는 중…";
      gateFetch({ action:"adminChangePw", sid: adminSes.sid, pw: a, oldPw: old }).then(function(r){
        if (!r.ok){
          if (r.error === "badold"){ $("meOld").setAttribute("aria-invalid", "true"); err("지금 비밀번호가 맞지 않아요."); return; }
          if (r.error === "nosession" || r.error === "expired"){ toast("로그인 시간이 지났어요. 다시 로그인해 주세요"); logout(); showGate("sabun"); return; }
          err(r.error === "init" ? "초기 비밀번호인 0000으로는 변경할 수 없어요." : r.error === "weak" ? "8자 이상, 영문과 숫자를 섞어 주세요." : "바꾸지 못했어요. 잠시 뒤 다시 해 주세요."); return;
        }
        meForm(false); toast("비밀번호를 바꿨어요. 다른 기기에서는 로그아웃됐어요"); Audit.load();
      }).catch(function(){ err("바꾸지 못했어요. 잠시 뒤 다시 해 주세요."); })
        .then(function(){ btn.textContent = "변경하기"; btn.disabled = !pwChecks("meChk"); });
    });

    /* 들어온 뒤: 토큰을 사번 목록으로 처음 옮기기 · 내 계정 · 마스터 칸 */
    function afterLoad(){
      if (GATE_URL && gateInfo && !gateInfo.hasSecrets && token){
        gateFetch({ action:"setSecrets", token: token, ghToken: token, apiKey: apiKey }).then(function(r){
          if (r.ok){ gateInfo.hasSecrets = true; toast("관리자 로그인이 사번 방식으로 바뀌었어요. 다음부터 사번으로 로그인하세요"); }
        }).catch(function(){});
      }
      paintMe(); meForm(false);
      Route.master();
      if (adminSes && adminSes.master) listAdmins();
      if (document.body.dataset.view === "analytics") Ana.show();
    }
    /* ---- 🔒 관리자 (#44 · 마스터만): 표 + 초기화(두 번 누르기) ---- */
    function relAt(at){ return Route.rel(at); }
    function drawAdmins(){
      var list = lastList || [], me = adminSes ? adminSes.sabun : "";
      Route.count("navAdm", list.length);
      var rows = list.slice().sort(function(a, b){ return (b.sabun === me) - (a.sabun === me) || (b.master - a.master) || String(b.lastAt || "").localeCompare(String(a.lastAt || "")); });
      var vis = showAll ? rows : rows.slice(0, 20);
      var head = '<div class="tr th g-adm" role="row"><span></span><span>이름</span><span>사번</span><span>소속</span><span>권한</span><span>추가</span><span>비밀번호</span><span>마지막 접속</span><span></span></div>';
      var body = vis.map(function(a){
        var btn = a.sabun === me || a.state === "init" ? "" :
          '<button type="button" class="k-btn ' + (armed === a.sabun ? "k-btn-er" : "k-btn3") + ' xs rp" data-reset="' + esc(a.sabun) + '">' + (armed === a.sabun ? "한 번 더 누르면 0000으로" : "초기화") + '</button>';
        return '<div class="tr c g-adm" role="row"><span class="k-av">' + esc((a.name || "?").charAt(0)) + '</span><span class="nm">' + esc(a.name || "(이름 없음)") + '</span><span class="t2">' + esc(a.sabun) + '</span>' +
          '<span class="el t2" title="' + esc(a.org || "") + '">' + esc(Route.org(a.org) || "—") + '</span>' +
          '<span>' + (a.master ? '<span class="k-pill ac s">마스터</span>' : '') + '</span><span class="t2" data-k="추가">' + (a.auto ? "자동" : "직접") + '</span>' +
          '<span>' + (a.state === "init" ? '<span class="k-pill wa s">처음 0000</span>' : '<span class="k-pill ok s">바꿈</span>') + '</span>' +
          (a.lastAt ? '<span class="t2" data-k="마지막 접속">' + esc(relAt(a.lastAt)) + '</span>' : '<span class="mu">접속 전</span>') + '<span>' + btn + '</span></div>';
      }).join("");
      var nM = list.filter(function(a){ return a.master; }).length, nA = list.filter(function(a){ return a.auto; }).length;
      var foot = '<div class="tf"><span>' + list.length + '명 · 마스터 ' + nM + '명 · 자동 ' + nA + '명 · 직접 ' + (list.length - nA) + '명</span>' +
        (!showAll && rows.length > 20 ? '<button type="button" class="lnk" id="admMore">나머지 ' + (rows.length - 20) + '명 더 보기</button>' : '') + '</div>';
      $("admList").innerHTML = list.length ? head + body + foot : '<div class="k-empty"><b>관리자 탭이 비어 있어요.</b></div>';
    }
    function listAdmins(){
      if (!adminSes) return;
      gateFetch({ action:"adminList", sid: adminSes.sid }).then(function(r){
        if (!r.ok){ kmsg("admMsg", "er", "목록을 불러오지 못했어요."); return; }
        lastList = r.admins; keys = r.keys || {}; drawAdmins();
        $("keepRule").value = r.keepRule || "today";
        $("ghMask").textContent = keys.gh || "없음"; $("apiMask").textContent = keys.api || "없음";
      }).catch(function(){ kmsg("admMsg", "er", "목록을 불러오지 못했어요."); });
    }
    $("admList").addEventListener("click", function(e){ if (e.target.closest("#admMore")){ showAll = true; drawAdmins(); } });
    $("admList").addEventListener("click", function(e){
      var b = e.target.closest("[data-reset]"); if (!b) return;
      var who = b.getAttribute("data-reset");
      clearTimeout(armT);
      if (armed !== who){ armed = who; drawAdmins(); armT = setTimeout(function(){ armed = null; drawAdmins(); }, 3000); return; }
      armed = null; b.disabled = true; b.innerHTML = SPIN + "초기화하는 중";
      gateFetch({ action:"adminReset", sid: adminSes.sid, target: who }).then(function(r){
        if (!r.ok) throw new Error(r.error);
        lastList = r.admins; drawAdmins(); kmsg("admMsg", "ok", "초기화했어요. 처음 비밀번호 0000을 그 사람에게 알려 주세요.");
      }).catch(function(){ drawAdmins(); kmsg("admMsg", "er", "초기화하지 못했어요."); });
    });
    $("keepRule").addEventListener("change", function(){
      var v = this.value;
      gateFetch({ action:"adminKeep", sid: adminSes.sid, rule: v }).then(function(r){
        if (!r.ok) throw new Error(r.error);
        kmsg("admMsg", "ok", "자동 로그인 유지 기간을 바꿨어요. 다음 로그인부터 적용돼요.");
      }).catch(function(){ kmsg("admMsg", "er", "바꾸지 못했어요. 잠시 뒤 다시 해 주세요."); });
    });
    document.querySelectorAll("[data-keyopen]").forEach(function(b){
      b.addEventListener("click", function(){ var box = $(b.dataset.keyopen + "In"); box.hidden = !box.hidden; if (!box.hidden) box.querySelector("input").focus(); });
    });
    function saveKey(kind){
      var g = kind === "gh" ? $("sGh").value.trim() : token, k = kind === "api" ? $("sKey").value.trim() : undefined;
      if (kind === "gh" && !/^(github_pat_|ghp_)/.test(g)){ kmsg("keyMsg", "er", "GitHub 토큰을 확인해 주세요. github_pat_로 시작해요."); return; }
      if (kind === "api" && !/^AIza/.test(k)){ kmsg("keyMsg", "er", "Google API 키를 확인해 주세요. AIza로 시작해요."); return; }
      var extra = { action:"setSecrets", sid: adminSes.sid, ghToken: g }; if (k !== undefined) extra.apiKey = k;
      gateFetch(extra).then(function(r){
        if (!r.ok) throw new Error(r.error);
        keepSession(g, k !== undefined ? k : apiKey, false); $("sGh").value = ""; $("sKey").value = ""; $("ghIn").hidden = true; $("apiIn").hidden = true;
        kmsg("keyMsg", "ok", "저장했어요. 모든 관리자가 새 키로 저장해요."); listAdmins();
      }).catch(function(){ kmsg("keyMsg", "er", "저장하지 못했어요. 이 저장소에 쓰기 권한이 있는 토큰인지 확인해 주세요."); });
    }
    $("sGhSave").addEventListener("click", function(){ saveKey("gh"); });
    $("sKeySave").addEventListener("click", function(){ saveKey("api"); });
    return { show: show, boot: boot, logout: logout, afterLoad: afterLoad, paintMe: paintMe, listAdmins: listAdmins };
  })();

  $("logoutBtn").addEventListener("click", function(){
    if (dirty){ toast("저장하지 않은 변경이 있어요. 먼저 저장해 주세요"); return; }
    clearSession(); canSave = false; data = { site:{}, videos:[] }; rdata = { months:[] }; openV = openM = openA = null; render();
    Audit.reset(); Members.reset(); Ana.reset(); location.hash = "#/courses";
    if (adminSes || (gateInfo && gateInfo.hasSecrets)){ Auth.logout(); showGate("sabun"); return; }
    if (authInfo) showGate("login"); else showGate("first");
  });
  $("makePwBtn").addEventListener("click", function(){ showGate("first"); });

  /* ================= 디자인 #42: 올린 사람 · 바꾼 사람 기록 =================
     저장·업데이트·연결이 끝난 뒤 바뀐 것을 사번 목록의 '변경 기록' 탭에 보내고(누가 = 로그인한 관리자, 언제 = 한국 시간),
     강의 줄 · 편집 칸 · 자료 · ⚙ 설정 칸에 보여 줌. 사번으로 로그인했을 때만(예전 방식 로그인은 기록 없음). */
  var Audit = (function(){
    var map = null, more = {};
    function on(){ return !!(GATE_URL && adminSes && adminSes.sid); }
    function load(){
      if (!on()) return Promise.resolve();
      return gateFetch({ action:"auditGet", sid: adminSes.sid }).then(function(r){ if (r.ok){ map = r.map || {}; more = {}; paint(); render(); } }).catch(function(){});
    }
    function add(items){
      items = (items || []).filter(Boolean);
      if (!on() || !items.length) return Promise.resolve();
      return gateFetch({ action:"auditAdd", sid: adminSes.sid, items: items }).then(load).catch(function(){});
    }
    function get(t){ return map && map[t] || null; }
    /* 대상과 그 아래(대상/…)를 합친 최근 기록 */
    function merged(t){
      if (!map) return null;
      var all = [], count = 0, first = null, last = null;
      Object.keys(map).forEach(function(k){
        if (k !== t && k.indexOf(t + "/") !== 0) return;
        var o = map[k]; count += o.count; all = all.concat(o.recent);
        if (!first || o.first.at < first.at) first = o.first;
        if (!last || o.last.at >= last.at) last = o.last;
      });
      if (!count) return null;
      all.sort(function(a, b){ return a.at < b.at ? 1 : a.at > b.at ? -1 : 0; });
      return { count: count, recent: all.slice(0, 5), first: first, last: last, own: map[t] || null };
    }
    function stamp(id, t, act, style){
      var el = $(id); if (!el) return;
      var o = get(t); el.hidden = !o;
      if (o) el.innerHTML = stampHtml(act || o.last.x, o.last.n, o.last.at, style);
    }
    function paint(){
      stamp("meStamp", "pw:" + (adminSes ? adminSes.sabun : ""));
      var acct = get("set:acct"); $("acctBy").textContent = acct ? acct.last.n + " · " + fmtAt(acct.last.at) : "";
      stamp("acctStamp", "set:test", "다시 확인");
      stamp("gateStamp", "set:gate", "주소 연결");
      stamp("noticeStamp", "set:notice", "마지막 변경");
      stamp("updStamp", "set:update", "마지막 업데이트");
      $("syncStamps").innerHTML = ["set:sync", "set:auto"].map(function(t){ var o = get(t); return o ? '<div class="k-stamp">' + stampHtml(o.last.x, o.last.n, o.last.at) + '</div>' : ""; }).join("");
      var sv = get("save");
      $("lastSave").innerHTML = sv ? "마지막 저장 <b>" + esc(sv.last.n) + "</b> · " + esc(fmtAt(sv.last.at)) : "";
      updateSaveBar();
    }
    /* 목록 줄 끝: '박유진 수정 11.11' / '소희수 업로드 10.28' */
    function rowWho(t, merge){
      var o = merge ? merged(t) : get(t); if (!o) return "";
      var up = o.count === 1 || /업로드했어요|만들었어요/.test(o.last.x);
      return '<span class="bdg am-who">' + esc(o.last.n) + " " + (up ? "업로드" : "수정") + " " + esc(fmtAt(o.last.at, "md")) + '</span>';
    }
    /* 편집 칸 요약 2줄: 업로드 · 마지막 수정 */
    function sumWho(t, merge, firstLabel){
      var o = merge ? merged(t) : get(t); if (!o) return "";
      var f = merge && o.own ? o.own.first : o.first;
      var s = '<span class="who">' + stampHtml(firstLabel || "업로드", f.n, f.at, "full") + '</span>';
      if (o.count > 1) s += '<span class="who">' + stampHtml("마지막 수정", o.last.n, o.last.at, "full") + '</span>';
      return s;
    }
    /* 자료마다: 저장된 것은 '업로드 이름 · 일시', 아직 저장 안 한 새 자료는 '추가 이름 · 방금' */
    function fileWho(t, isNew){
      if (isNew) return adminSes ? '<div class="who fstamp">' + K.person + '<span>추가 <b>' + esc(adminSes.name) + '</b> · 방금 (저장하면 기록돼요)</span></div>' : "";
      var o = get(t); return o ? '<div class="who fstamp">' + stampHtml(o.last.x === "업로드" ? "업로드" : o.last.x, o.last.n, o.last.at, "full") + '</div>' : "";
    }
    /* 편집 칸 '변경 기록' */
    function histHtml(t, merge){
      var o = merge ? merged(t) : get(t); if (!o) return "";
      var full = more[t], list = full || o.recent;
      return '<div class="hist-box"><div class="hist-h"><h3>변경 기록</h3><span class="who"><span>' + (full ? "전체 " + o.count + "개" : "최근 " + list.length + "개 · 전체 " + o.count + "개") + '</span></span></div>' +
        '<ol class="hist">' + list.map(function(e){ return '<li><span class="t">' + esc(fmtAt(e.at, "dot")) + '</span><span><span class="w">' + esc(e.n) + '</span><span class="d">' + esc(e.x) + '</span></span></li>'; }).join("") + '</ol>' +
        (!full && o.count > list.length ? '<button type="button" class="hist-more" data-hist="' + esc(t) + '">기록 ' + (o.count - list.length) + '개 더 보기</button>' : '') + '</div>';
    }
    document.addEventListener("click", function(e){
      var b = e.target.closest("[data-hist]"); if (!b || !on()) return;
      var t = b.dataset.hist; b.disabled = true; b.textContent = "불러오는 중…";
      gateFetch({ action:"auditList", sid: adminSes.sid, target: t }).then(function(r){ if (r.ok){ more[t] = r.list; render(); } }).catch(function(){ b.disabled = false; b.textContent = "다시 불러오기"; });
    });
    function lastSave(){ var sv = get("save"); return sv ? sv.last : null; }
    function reset(){ map = null; more = {}; }
    return { load: load, add: add, get: get, rowWho: rowWho, sumWho: sumWho, fileWho: fileWho, histHtml: histHtml, lastSave: lastSave, reset: reset, on: on, paint: paint };
  })();

  /* 저장 전·후를 비교해 '변경 기록'에 남길 줄 만들기 (여러 칸을 한 번에 바꾸면 한 줄로 묶음) */
  function fileKey(f){ var id = SC.driveId(f.link); if (id) return id; var h = 5381, s = String(f.link || ""); for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0; return "u" + h.toString(36); }
  function filesDiff(of, nf, ftarget, items, t){
    var ok = {}, nk = {}; of.forEach(function(f){ ok[fileKey(f)] = f; }); nf.forEach(function(f){ nk[fileKey(f)] = f; });
    var add = nf.filter(function(f){ return !ok[fileKey(f)]; }), del = of.filter(function(f){ return !nk[fileKey(f)]; }), lines = [];
    var swap = add.filter(function(f){ var j = nf.indexOf(f), o = of[j]; return o && del.indexOf(o) > -1; });
    swap.forEach(function(f){ var o = of[nf.indexOf(f)]; add.splice(add.indexOf(f), 1); del.splice(del.indexOf(o), 1); lines.push("자료 링크를 바꿨어요 · " + f.name); });
    if (add.length) lines.push("자료 " + add.length + "개를 추가했어요 · " + add.map(function(f){ return f.name; }).join(", "));
    if (del.length) lines.push("자료 " + del.length + "개를 삭제했어요 · " + del.map(function(f){ return f.name; }).join(", "));
    lines.forEach(function(x){ items.push({ t: t, x: x }); });
    swap.concat(add).forEach(function(f){ items.push({ t: ftarget + ":" + fileKey(f), x: "업로드" }); });
  }
  /* '제목·강의 소개를 바꿨어요' — 마지막 낱말 받침으로 을/를 */
  function changed(words){ var w = words[words.length - 1], c = w.charCodeAt(w.length - 1) - 0xAC00; return words.join("·") + (c >= 0 && c < 11172 && c % 28 ? "을" : "를") + " 바꿨어요"; }
  function auditItems(S, out, rout){
    var items = [], oldV = {}, newIds = {}, catL = function(c){ return SC.catLabel(c); };
    S.v.videos.forEach(function(v){ oldV[v.id] = v; });
    out.videos.forEach(function(v){ newIds[v.id] = 1; });
    var moved = {};
    data.videos.forEach(function(v){ if (v.id && v._oid && v._oid !== v.id && oldV[v._oid] && !newIds[v._oid]) moved[v.id] = v._oid; });
    out.videos.forEach(function(v){
      var t = "v:" + v.id, oid = moved[v.id], o = oldV[v.id] || (oid && oldV[oid]);
      if (oid){ items.push({ t: t, from: "v:" + oid, x: "유튜브 주소를 바꿨어요" }); items.push({ t: "f:" + v.id, from: "f:" + oid }); }
      if (!o){
        items.push({ t: t, x: "강의를 업로드했어요" });
        if (v.files.length) items.push({ t: t, x: "자료 " + v.files.length + "개를 업로드했어요" });
        v.files.forEach(function(f){ items.push({ t: "f:" + v.id + ":" + fileKey(f), x: "업로드" }); });
        return;
      }
      var ch = [];
      if (o.title !== v.title) ch.push("제목"); if (o.description !== v.description) ch.push("강의 소개");
      if (ch.length) items.push({ t: t, x: changed(ch) });
      if ((o.visible !== false) !== (v.visible !== false)) items.push({ t: t, x: v.visible !== false ? "비공개 → 공개로 바꿨어요" : "공개 → 비공개로 바꿨어요" });
      if (SC.catOf(o) !== SC.catOf(v)) items.push({ t: t, x: "메뉴를 옮겼어요 · " + catL(SC.catOf(o)) + " → " + catL(SC.catOf(v)) });
      filesDiff(o.files || [], v.files, "f:" + v.id, items, t);
    });
    S.v.videos.forEach(function(o){
      if (newIds[o.id]) return;
      var isMoved = Object.keys(moved).some(function(k){ return moved[k] === o.id; }); if (isMoved) return;
      items.push({ t: "menu:" + SC.catOf(o), x: "강의를 삭제했어요 · " + o.title });
    });
    /* 상품연구: 월 r:2611 · 연령 r:2611/연령ID · 자료 rf:2611/연령ID:파일키 */
    var oldM = {}; (S.r.months || []).forEach(function(m){ oldM[m.ym] = m; });
    var newYm = {}; rout.months.forEach(function(m){ newYm[m.ym] = 1; });
    var ymMoved = {};
    rdata.months.forEach(function(m){ if (m._oym && m._oym !== m.ym && oldM[m._oym] && !newYm[m._oym]) ymMoved[m.ym] = m._oym; });
    rout.months.forEach(function(m){
      var code = ymCode(m.ym), t = "r:" + code, oy = ymMoved[m.ym], o = oldM[m.ym] || (oy && oldM[oy]);
      if (oy){ items.push({ t: t, from: "r:" + ymCode(oy), x: "연월을 바꿨어요" }); items.push({ t: "rf:" + code, from: "rf:" + ymCode(oy) }); }
      if (!o){
        items.push({ t: t, x: "달을 만들었어요" + (m.ages.length ? " · 연령 " + m.ages.length + "개" : "") });
        m.ages.forEach(function(a){ items.push({ t: t + "/" + a.id, x: "연령을 만들었어요" }); a.files.forEach(function(f){ items.push({ t: "rf:" + code + "/" + a.id + ":" + fileKey(f), x: "업로드" }); }); if (a.files.length) items.push({ t: t + "/" + a.id, x: "자료 " + a.files.length + "개를 업로드했어요" }); });
        return;
      }
      var ch = [];
      if (o.title !== m.title) ch.push("제목"); if ((o.thumb || "") !== (m.thumb || "")) ch.push("썸네일");
      if (ch.length) items.push({ t: t, x: changed(ch) });
      if ((o.visible !== false) !== (m.visible !== false)) items.push({ t: t, x: m.visible !== false ? "비공개 → 공개로 바꿨어요" : "공개 → 비공개로 바꿨어요" });
      var oa = {}; o.ages.forEach(function(a){ oa[a.id] = a; });
      var na = {}; m.ages.forEach(function(a){ na[a.id] = a; });
      m.ages.forEach(function(a){
        var at = t + "/" + a.id, x = oa[a.id];
        if (!x){ items.push({ t: t, x: "연령을 추가했어요 · " + a.title }); items.push({ t: at, x: "연령을 만들었어요" }); a.files.forEach(function(f){ items.push({ t: "rf:" + code + "/" + a.id + ":" + fileKey(f), x: "업로드" }); }); return; }
        var c2 = [];
        if (x.title !== a.title) c2.push("제목"); if ((x.thumb || "") !== (a.thumb || "")) c2.push("썸네일");
        if (c2.length) items.push({ t: at, x: changed(c2) });
        if ((x.visible !== false) !== (a.visible !== false)) items.push({ t: at, x: a.visible !== false ? "비공개 → 공개로 바꿨어요" : "공개 → 비공개로 바꿨어요" });
        filesDiff(x.files || [], a.files, "rf:" + code + "/" + a.id, items, at);
      });
      o.ages.forEach(function(x){ if (!na[x.id]) items.push({ t: t, x: "연령을 삭제했어요 · " + x.title }); });
      var oOrder = o.ages.filter(function(x){ return na[x.id]; }).map(function(x){ return x.id; }).join(","), nOrder = m.ages.filter(function(a){ return oa[a.id]; }).map(function(a){ return a.id; }).join(",");
      if (oOrder !== nOrder) items.push({ t: t, x: "연령 순서를 바꿨어요" });
    });
    (S.r.months || []).forEach(function(o){
      if (newYm[o.ym] || Object.keys(ymMoved).some(function(k){ return ymMoved[k] === o.ym; })) return;
      items.push({ t: "menu:research", x: "달을 삭제했어요 · " + o.title });
    });
    if ((S.v.site.notice || "") !== (out.site.notice || "")) items.push({ t: "set:notice", x: "사이트 문구를 바꿨어요" });
    items.push({ t: "save", x: "저장했어요" });
    return items;
  }

  /* ================= 세일즈온 사번 목록(구글 시트 + Apps Script, 기획 P2~P5 공통) · 세일즈온 어드민 계정(P3) · 사번 명단(P3-4) =================
     - 사번 목록 = 회원 명단 구글 시트에 붙은 Apps Script 웹 앱. 주소는 data/config.json 의 gate 에 둠(비밀 아님)
     - 관리 기능은 GitHub 토큰(저장소 쓰기 권한)으로 확인 + 사번 로그인(sid)이면 누가 했는지 '변경 기록'에 남김
     - 세일즈온 어드민 아이디·비밀번호는 사번 목록의 비밀 칸(스크립트 속성)에만. 이 화면에는 가린 아이디만 다시 보임 */
  var Gate = (function(){
    var GATE_V = 17; /* 사번 목록 코드(Code.gs) 최신 버전 */
    var CFG = "data/config.json", RE = /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]{20,}\/exec$/;
    var url = "", cfg = {}, csha = null, st = null, lastRun = null, syncBusy = false, testBusy = false;
    function call(action, extra){
      var body = { action: action, token: token, sid: adminSes ? adminSes.sid : undefined };
      for (var k in (extra || {})) body[k] = extra[k];
      /* text/plain 으로 보내야 미리 확인 요청 없이 바로 감 (Apps Script 웹 앱 규칙) */
      return fetch(url, { method:"POST", body: JSON.stringify(body), cache:"no-store", redirect:"follow" })
        .then(function(r){ if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); });
    }
    function num(n){ return String(n || 0).replace(/\B(?=(\d{3})+(?!\d))/g, ","); }
    function nv(n, unit){ return n == null ? "–" : num(n) + "<small>" + (unit || "명") + "</small>"; }
    function sum(id, cls, text){ $(id).innerHTML = text ? (cls ? '<span class="k-dot ' + cls + '"></span>' : '') + '<span>' + esc(text) + '</span>' : ""; }
    function todayKst(){ var d = new Date(Date.now() + 9 * 3600 * 1000); return d.toISOString().slice(0, 10); }
    function hm(s){ var m = /T(\d\d:\d\d)/.exec(s || ""); return m ? m[1] : ""; }
    function addHour(s){ var t = Date.parse(String(s).slice(0, 19) + "+09:00"); if (isNaN(t)) return ""; var d = new Date(t + 3600 * 1000 + 9 * 3600 * 1000); return z2(d.getUTCHours()) + ":" + z2(d.getUTCMinutes()); }
    var TEST = {
      ok: ["ok", "접속 성공"],
      badcred: ["er", "아이디나 비밀번호가 맞지 않아요"],
      denied: ["er", "세일즈온 어드민이 접속을 막았어요"],
      blocked: ["er", "세일즈온 어드민에 연결할 수 없어요"],
      unknown: ["wa", "접속 결과를 확인하지 못했어요"],
      session: ["wa", "로그인은 됐는데 다음 화면에서 계속 로그인이 풀려요"]
    };
    function paint(){
      var on = !!(url && st), old = on && (st.v || 1) < GATE_V;
      /* 세일즈온 사번 목록 */
      sum("gateSum", on ? (old ? "wa" : "ok") : (url ? "wa" : ""), on ? (old ? "코드 바꾸기 필요" : "연결됨") : url ? "확인 안 됨" : "연결 안 됨");
      $("gateDot").className = "k-dot " + (on ? (old ? "wa" : "ok") : url ? "wa" : "");
      $("gateStateT").textContent = on ? "연결됨" : url ? "확인 안 됨" : "연결 안 됨";
      $("gateVer").textContent = on ? "· 코드 v" + (st.v || 1) : "";
      if (document.activeElement !== $("gateUrl")) $("gateUrl").value = url;
      $("gateConnect").textContent = on ? "다시 연결" : "연결";
      $("gateSheet").hidden = !(on && st.sheet && st.sheet.url); if (on && st.sheet) $("gateSheet").href = st.sheet.url;
      kmsg("gateOld", "wa", old ? K.warn + "<span><b>사번 목록 코드가 예전 버전(v" + (st.v || 1) + ")이에요.</b><br>개발팀 폴더의 새 Code.gs로 바꿔 주세요.</span>" : "");
      /* 세일즈온 어드민 계정 */
      var a = on && st.account || {}, t = on && st.lastTest, tt = t && (TEST[t.result] || TEST.unknown);
      $("acctNote").hidden = on; $("acctMain").hidden = !on;
      sum("acctSum", !on ? "" : !a.saved ? "wa" : tt ? (tt[0] === "ok" ? "ok" : tt[0] === "er" ? "er" : "wa") : "wa", !on ? "" : !a.saved ? "저장 안 됨" : tt ? (t.result === "ok" ? "접속 성공" : "접속 실패") : "확인 전");
      $("acctSaved").textContent = a.saved ? a.id : "없음";
      if (!$("acctBy").textContent && a.savedAt) $("acctBy").textContent = fmtAt(a.savedAt);
      $("acctId").placeholder = a.saved ? "바꿀 때만 입력" : "세일즈온 어드민 아이디";
      $("acctPw").placeholder = a.saved ? "바꿀 때만 입력" : "비밀번호";
      $("acctTest").disabled = !a.saved || testBusy;
      if (!testBusy) kmsg("acctRes", tt ? tt[0] : "", tt ? (tt[0] === "ok" ? K.ok : K.alert) + "<span><b>" + esc(tt[1]) + "</b> (" + (t.by === "pc" ? "PC" : "구글") + ") · " + esc(fmtAt(t.at)) + (t.msg && t.result !== "ok" ? "<br>세일즈온 어드민 안내: " + esc(t.msg) : "") + "</span>" : "");
      showTrace(t && t.result !== "ok" ? { result: t.result, msg: t.msg, at: t.at, by: t.by, trace: st.lastTrace || [] } : null);
      /* 사번 명단 */
      var sy = on && st.sync || {}, L = sy.last, OK = sy.lastOk || (L && L.ok ? L : null), running = !!sy.running || syncBusy;
      $("syncNote").hidden = on; $("syncMain").hidden = !on;
      if (!on){ $("syncNote").textContent = "먼저 세일즈온 사번 목록을 연결해 주세요."; sum("syncSum", "", ""); return; }
      sum("syncSum", running ? "wa" : !L ? "" : L.ok ? "ok" : "er",
        running ? "받는 중" : !L ? "아직 안 받음" : L.ok ? (L.at.slice(0, 10) === todayKst() ? "오늘 " + hm(L.at) : fmtAt(L.at)) + " 갱신" : (L.at.slice(0, 10) === todayKst() ? hm(L.at) : fmtAt(L.at)) + " 실패");
      $("stNormal").innerHTML = nv(OK && OK.normal);
      $("stAll").innerHTML = nv(OK && OK.people);
      $("stAllSub").textContent = OK ? "비정상 회원 " + num(OK.people - OK.normal) + "명" : "";
      $("stAdm").innerHTML = nv(st.adminCount);
      var ns = st.noSabun;
      $("stNo").innerHTML = nv(ns && ns.rows);
      $("stNoSub").innerHTML = ns ? "그중 정상 회원 " + num(ns.normal) + "명 · 직접 입력 " + num(ns.manual) + "명" +
        (ns.bad ? "<br>8자리가 아닌 값 " + ns.bad + "개는 무시" : "") + (ns.dup ? "<br>회원 탭에 이미 있는 사번 " + ns.dup + "개는 회원 탭 우선" : "") + "<br>시트 '사번 없음' 탭에 있어요" : "";
      $("syncLast").textContent = L ? fmtAt(L.at) : "아직 안 받음";
      var lp = $("syncLastPill"); lp.hidden = !L; if (L){ lp.className = "k-pill " + (L.ok ? "ok" : "er"); lp.innerHTML = L.ok ? K.ck + "성공" : "실패"; }
      kmsg("syncFail", "er", L && !L.ok ? K.alert + "<span><b>" + esc(fmtAt(L.at)) + " 갱신 실패</b><br>" + esc(L.msg || "명단을 받지 못했어요.") + " 어제 명단을 그대로 쓰고 있" + (sy.retry ? "고, " + addHour(L.at) + "에 한 번 더 해요." : "어요.") + "</span>" : "");
      var miss = L && L.admins && L.admins.missed || [];
      kmsg("syncMissed", "wa", miss.length ? K.warn + "<span><b>영업개발파트인데 못 넣은 사람 " + miss.length + "명</b><br>" + miss.map(function(x){ var m = /^(.*?)\((.*)\)$/.exec(x); return esc(m ? m[1] + " — " + m[2] : x); }).join("<br>") + "</span>" : "");
      var sw = $("syncAuto"); sw.setAttribute("aria-checked", !!sy.auto); sw.disabled = sy.auto === null || syncBusy;
      sw.title = sy.auto === null ? "Apps Script에서 setup ▶ 실행으로 권한을 승인해야 켤 수 있어요" : "";
      var acc = st.account && st.account.saved;
      $("syncGo").disabled = !acc || running; $("syncDry").disabled = !acc || running; $("syncRetry").disabled = !acc || running;
      $("syncSheet").hidden = !(st.sheet && st.sheet.url); if (st.sheet) $("syncSheet").href = st.sheet.url;
      if (!lastRun) showSyncDiag(L, L && !L.ok);
    }
    function load(){
      return repoJson(CFG).then(function(f){
        cfg = f ? f.json : {}; csha = f ? f.sha : null; url = cfg.gate || ""; st = null; paint();
        if (url) return refresh();
      }).catch(function(){ paint(); });
    }
    function refresh(){
      sum("gateSum", "", "확인 중");
      return call("status").then(function(j){
        if (!j.ok){ st = null; paint(); kmsg("gateMsg", "er", j.error === "notadmin" ? "이 토큰으로는 사번 목록을 쓸 수 없어요. 저장소 쓰기 권한이 있는 토큰인지 확인해 주세요." : "사번 목록이 대답하지 못했어요. 잠시 뒤 다시 해 주세요."); return; }
        st = j; kmsg("gateMsg"); paint();
      }).catch(function(){ st = null; paint(); kmsg("gateMsg", "er", "사번 목록에 연결하지 못했어요. 주소와 배포 설정(액세스: 모든 사용자)을 확인해 주세요."); });
    }
    function connect(){
      var u = $("gateUrl").value.trim(), btn = $("gateConnect");
      if (!canSave){ kmsg("gateMsg", "er", "저장소에 연결된 뒤에 할 수 있어요."); return; }
      if (!RE.test(u)){ kmsg("gateMsg", "er", "주소를 확인해 주세요. https://script.google.com/macros/s/로 시작하고 /exec로 끝나요."); return; }
      var prev = url; url = u; btn.disabled = true; btn.innerHTML = SPIN + "연결하는 중"; kmsg("gateMsg");
      call("status").then(function(j){
        if (!j.ok) throw Object.assign(new Error(j.error), { gate: j.error });
        st = j;
        if (cfg.gate === u) return null;
        cfg.gate = u;
        return gh("/contents/" + CFG, { method:"PUT", body: JSON.stringify({
          message: "세일즈온 사번 목록 연결", branch: branch, sha: csha || undefined,
          content: b64enc(JSON.stringify(cfg, null, 2) + "\n")
        }) }).then(function(res){ csha = res.content.sha; if (res.commit) Deploy.expect(res.commit.sha); });
      }).then(function(){
        paint(); kmsg("gateMsg", "ok", st.sheet && st.sheet.made && st.sheet.made.length ? "연결했어요. 시트에 탭 " + st.sheet.made.length + "개를 만들었어요." : "연결했어요.");
        Audit.add([{ t: "set:gate", x: "주소 연결" }]);
        if (!st.account.saved) Route.go("#/settings/siteacc");
      }).catch(function(er){
        url = prev; st = prev ? st : null; paint();
        kmsg("gateMsg", "er", er.gate === "notadmin" ? "이 토큰으로는 사번 목록을 쓸 수 없어요. 저장소 쓰기 권한이 있는 토큰인지 확인해 주세요."
          : er.gate ? "사번 목록이 대답하지 못했어요(" + esc(er.gate) + "). 코드를 다시 붙여 넣었는지 확인해 주세요."
          : er.status ? "주소를 저장하지 못했어요. 잠시 뒤 다시 해 주세요."
          : "사번 목록에 연결하지 못했어요. 주소와 배포 설정(실행: 나 · 액세스: 모든 사용자)을 확인해 주세요.");
      }).then(function(){ btn.disabled = false; btn.textContent = st ? "다시 연결" : "연결"; });
    }
    function save(e){
      e.preventDefault();
      var id = $("acctId").value.trim(), pw = $("acctPw").value, btn = $("acctSave");
      if (!id || !pw){ kmsg("acctMsg", "er", "아이디와 비밀번호를 모두 적어 주세요."); return; }
      btn.disabled = true; btn.innerHTML = SPIN + "저장하는 중"; kmsg("acctMsg");
      call("saveAccount", { id: id, pw: pw }).then(function(j){
        if (!j.ok) throw new Error(j.error);
        st = j; $("acctId").value = ""; $("acctPw").value = ""; paint();
        kmsg("acctMsg", "ok", "저장했어요. [다시 확인]으로 세일즈온 어드민에 들어가지는지 확인해 보세요.");
        Audit.load();
      }).catch(function(){ kmsg("acctMsg", "er", "저장하지 못했어요. 잠시 뒤 다시 해 주세요."); })
        .then(function(){ btn.disabled = false; btn.textContent = "저장"; });
    }
    /* ---------- 사번 명단 (P3 2단계) ---------- */
    function showSyncDiag(info, show){
      var btn = $("syncTraceBtn"), box = $("syncTrace"), d = info && info.diag || {};
      if (!info || !show){ btn.hidden = true; box.hidden = true; return; }
      var lines = ["결과 " + (info.ok ? "성공" : "실패") + (info.msg ? " · " + info.msg : "") + " · " + (info.at || "") + " · " + (info.sec || 0) + "초 · 코드 v" + (st && st.v || "?")];
      [["all", "전체 명단"], ["normal", "정상 회원 명단"]].forEach(function(t){
        var x = d[t[0]]; if (!x) return;
        lines.push(t[1] + ": " + ["tries","code","type","size","sig","lines","alert","snip"].filter(function(k){ return x[k] !== undefined && x[k] !== ""; }).map(function(k){ return k + " " + x[k]; }).join(" · "));
        if (x.header) lines.push("  머리 줄: " + x.header.join(" | "));
      });
      ["total","normalIds","noSabun","noSabunNormal"].forEach(function(k){ if (d[k] !== undefined) lines.push(k + ": " + d[k]); });
      if (d.states) lines.push("가입상태: " + Object.keys(d.states).map(function(k){ return k + " " + d.states[k]; }).join(", "));
      $("syncTraceText").textContent = lines.join("\n");
      btn.hidden = false; $("syncRetry").hidden = !!info.ok;
    }
    function noSabunLine(c){
      var t = "사번 없음 정상 회원 " + num(c.normal) + "명 (직접 입력 " + num(c.manual) + "명)";
      if (c.bad) t += " · 8자리가 아닌 값 " + c.bad + "개는 무시";
      if (c.dup) t += " · 회원 탭에 이미 있는 사번 " + c.dup + "개는 회원 탭 우선";
      return t;
    }
    function syncRun(dry){
      if (syncBusy) return;
      syncBusy = true; paint();
      var btn = $(dry ? "syncDry" : "syncGo"), label = btn.innerHTML;
      btn.innerHTML = SPIN + "받는 중… (1~2분)";
      kmsg("syncMsg", "wa", K.warn + "<span>세일즈온 어드민에서 명단을 받는 중이에요. 이 창을 닫지 마세요.</span>");
      call("syncNow", { dry: dry }).then(function(j){
        if (j.status) st = j.status;
        var info = j.info || {}; lastRun = info;
        if (j.ok){
          var A = j.admins, parts = ["정상 회원 " + num(j.normal) + "명 · 전체 " + num(j.people) + "명 (엑셀 " + num(j.total) + "줄, 같은 사번은 합침" + (info.diag && info.diag.noSabun ? " · 아이디에 사번이 없는 " + num(info.diag.noSabun) + "줄은 뺌" : "") + ")"];
          if (A) parts.push("관리자 " + num(A.total) + "명(영업개발파트 " + num(A.team) + "명" + (A.added ? " · 새로 " + A.added + "명" : "") + (A.removed ? " · 빠짐 " + A.removed + "명" : "") + (A.masters && A.masters.length ? " · 마스터 " + A.masters.join(", ") : "") + ")");
          if (j.noSabun) parts.push(noSabunLine(j.noSabun));
          if (A && A.missed && A.missed.length) parts.push("영업개발파트인데 못 넣은 사람: " + A.missed.join(", "));
          kmsg("syncMsg", "ok", K.ok + "<span><b>" + (dry ? "미리 확인" : "갱신했어요") + "</b><br>" + parts.map(esc).join("<br>") + (dry ? "<br>시트는 바꾸지 않았어요." : "") + "</span>");
        } else kmsg("syncMsg", "er", K.alert + "<span>" + esc(j.msg || "명단을 받지 못했어요.") + (dry ? "" : " 시트는 어제 명단 그대로예요.") + " — '자세히 보기'를 복사해 개발팀에 알려 주세요.</span>");
        showSyncDiag(info, !j.ok || dry);
        if (!dry) Audit.load();
      }).catch(function(){ kmsg("syncMsg", "er", K.alert + "<span>사번 목록 응답을 받지 못했어요. 잠시 뒤 [사번 명단]을 다시 열어 결과를 확인해 주세요.</span>"); })
        .then(function(){ syncBusy = false; btn.innerHTML = label; paint(); });
    }
    function syncAutoToggle(){
      var on = !(st && st.sync && st.sync.auto), sw = $("syncAuto"); sw.disabled = true; sw.setAttribute("aria-checked", on);
      call("syncAuto", { on: on }).then(function(j){
        if (!j.ok) throw new Error(j.error);
        st = j.status; paint(); kmsg("syncMsg", "ok", on ? "자동 갱신을 켰어요. 매일 새벽 5시에 명단을 받아요." : "자동 갱신을 껐어요.");
        Audit.load();
      }).catch(function(){ kmsg("syncMsg", "er", "바꾸지 못했어요. Apps Script에서 setup을 한 번 실행해 권한을 승인해 주세요."); paint(); });
    }
    /* 접속 확인이 실패하면 단계별 기록 (비밀번호·쿠키 값·개인정보 없음) */
    function showTrace(j){
      var btn = $("acctTraceBtn");
      if (!j || !j.trace || !j.trace.length){ btn.hidden = true; $("acctTrace").hidden = true; return; }
      var lines = ["결과 " + j.result + (j.msg ? " · " + j.msg : "") + " · " + (j.at || ""),
        "확인한 곳 " + (j.by === "pc" ? "PC" : "구글 서버") + " · 코드 v" + (st && st.v || "?")];
      j.trace.forEach(function(t, i){
        if (t.retry){ lines.push((i + 1) + ". 다시 열기 " + t.retry + "번째 → " + t.code + (t.toLogin ? " · 로그인으로 돌려보냄" : " · 열림") + (t.setCookie && t.setCookie.length ? " · 쿠키 " + t.setCookie.join(",") : "") + " · " + t.len + "자"); return; }
        if (t.form){ lines.push((i + 1) + ". 로그인 칸 " + (t.form.found ? "찾음" : "못 찾음") + " · 숨은 값 " + (t.form.hidden.join(",") || "없음")); return; }
        lines.push((i + 1) + ". " + t.m + " " + t.at + " → " + t.code + (t.loc ? " 이동 " + t.loc : "") + (t.js ? " 스크립트 이동 " + t.js : "") +
          (t.setCookie && t.setCookie.length ? " · 쿠키 " + t.setCookie.join(",") : "") + (t.title ? " · 제목 " + t.title : "") +
          " · " + t.len + "자" + (t.loginPage ? " · 로그인 화면" : "") + (t.alert ? " · 안내창 " + t.alert : "") + (t.snip ? " · 내용 " + t.snip : ""));
      });
      $("acctTraceText").textContent = lines.join("\n"); btn.hidden = false;
    }
    function test(){
      var btn = $("acctTest"); testBusy = true; btn.disabled = true; btn.innerHTML = SPIN + "확인하는 중"; kmsg("acctRes");
      call("testLogin").then(function(j){
        if (!j.ok){ kmsg("acctRes", "er", K.alert + "<span>" + (j.error === "noaccount" ? "먼저 아이디와 비밀번호를 저장해 주세요." : "확인하지 못했어요. 잠시 뒤 다시 해 주세요.") + "</span>"); return; }
        st = j.status; Audit.load();
      }).catch(function(){ kmsg("acctRes", "er", K.alert + "<span>사번 목록에 연결하지 못했어요. 잠시 뒤 다시 해 주세요.</span>"); })
        .then(function(){ testBusy = false; btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/></svg>다시 확인'; paint(); });
    }
    function tog(btnId, boxId){ $(btnId).addEventListener("click", function(){ var box = $(boxId), open = box.hidden; box.hidden = !open; this.setAttribute("aria-expanded", open); }); }
    function copyFrom(id){ var t = $(id).textContent; (SC.copy ? SC.copy(t) : navigator.clipboard.writeText(t)).then(function(){ toast("복사했어요. 개발팀 채팅에 붙여 넣으세요"); }, function(){ toast("복사하지 못했어요. 글자를 길게 눌러 복사해 주세요"); }); }
    $("gateConnect").addEventListener("click", connect);
    $("gateUrl").addEventListener("keydown", function(e){ if (e.key === "Enter"){ e.preventDefault(); connect(); } });
    $("acctForm").addEventListener("submit", save);
    $("acctTest").addEventListener("click", test);
    $("syncGo").addEventListener("click", function(){ syncRun(false); });
    $("syncRetry").addEventListener("click", function(){ syncRun(false); });
    $("syncDry").addEventListener("click", function(){ syncRun(true); });
    $("syncAuto").addEventListener("click", syncAutoToggle);
    tog("syncTraceBtn", "syncTrace"); tog("acctTraceBtn", "acctTrace");
    $("syncTraceCopy").addEventListener("click", function(){ copyFrom("syncTraceText"); });
    $("acctTraceCopy").addEventListener("click", function(){ copyFrom("acctTraceText"); });
    paint();
    return { load: load };
  })();

  /* ================= 디자인 #44 · #45 (기획 P6~P8): 화면 3개 · 설정 페이지 · 회원 관리 · 갱신 기록 · 분석 =================
     맨 위 바 [강의 관리] [분석] · ⚙ = 설정 페이지. 지금 화면은 주소에 남음: #/courses · #/analytics · #/settings/<메뉴>
     숫자(마지막 접속 · 조회 · 다운로드)는 사이트 사번 로그인(P2) 뒤부터 '접속 기록'·'조회 기록'·'받기 기록' 탭에 쌓임 */
  var PI = {"prev": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M15 6l-6 6 6 6\"></path></svg>", "next": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M9 6l6 6-6 6\"></path></svg>", "sort": "<svg width=\"14\" height=\"14\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M6 9l6 6 6-6\"></path></svg>", "x": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M6 6l12 12M18 6L6 18\"></path></svg>", "views": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M8 5.5v13l11-6.5z\"></path></svg>", "files": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M12 4v11M7 10.5l5 5 5-5M5 20h14\"></path></svg>", "refresh": "<svg width=\"14\" height=\"14\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M20 11a8 8 0 0 0-14.3-4.6L4 8\"></path><path d=\"M4 3.5V8h4.5\"></path><path d=\"M4 13a8 8 0 0 0 14.3 4.6L20 16\"></path><path d=\"M20 20.5V16h-4.5\"></path></svg>", "cal": "<svg width=\"14\" height=\"14\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"4\" y=\"5\" width=\"16\" height=\"15\" rx=\"2.5\"></rect><path d=\"M8 3v4M16 3v4M4 10h16\"></path></svg>", "search": "<svg width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"11\" cy=\"11\" r=\"6.5\"></circle><path d=\"M20 20l-4.2-4.2\"></path></svg>", "dl": "<svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M12 4v11M7 10.5l5 5 5-5M5 20h14\"></path></svg>", "ext": "<svg width=\"15\" height=\"15\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M7 17L17 7M9 7h8v8\"></path></svg>", "log": "<svg width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M4 12a8 8 0 1 0 2.4-5.7L4 8.5\"></path><path d=\"M4 4v4.5h4.5\"></path><path d=\"M12 8v4.5l3 2\"></path></svg>"}; PI.info = K.alert;
  function nf(n){ return String(n == null ? 0 : n).replace(/\B(?=(\d{3})+(?!\d))/g, ","); }
  function kstDay(off){ var d = new Date(Date.now() + 9 * 3600 * 1000 - (off || 0) * 86400000); return d.toISOString().slice(0, 10); }
  function relAt(at){
    var m = /^(\d{4}-\d\d-\d\d)[T ](\d\d:\d\d)/.exec(at || ""); if (!m) return "";
    return m[1] === kstDay(0) ? "오늘 " + m[2] : m[1] === kstDay(1) ? "어제 " + m[2] : fmtAt(at, "dot");
  }
  function org2(o){ var p = String(o || "").split(">").map(function(x){ return x.trim(); }).filter(Boolean); return p.slice(-2).join(" > "); }
  function noGate(){ return !(GATE_URL && adminSes && adminSes.sid); }
  function emptyHtml(ic, title, text, extra){ return '<div class="k-empty"><span class="ei">' + (PI[ic] || ic || "") + '</span><b>' + title + '</b>' + (text ? '<p>' + text + '</p>' : '') + (extra || '') + '</div>'; }
  var NOLOGIN = emptyHtml("log", "사번으로 로그인하면 볼 수 있어요.", "세일즈온 사번 목록이 연결되고 사번으로 로그인한 관리자에게만 보여요.");
  var LOADERR = emptyHtml("log", "불러오지 못했어요.", "잠시 뒤 다시 열어 주세요.");
  function skelRows(cls, n, cols){
    var s = ""; for (var i = 0; i < n; i++){ s += '<div class="tr ' + cls + '">'; for (var j = 0; j < cols; j++) s += '<span class="sk" style="width:' + (40 + ((i * 7 + j * 13) % 50)) + '%"></span>'; s += '</div>'; }
    return s;
  }
  function pager(page, total, size, attr){
    var n = Math.max(1, Math.ceil(total / size)); if (n <= 1) return "";
    var out = '<div class="pgn"><button type="button" ' + attr + '="' + (page - 1) + '" aria-label="이전 쪽"' + (page <= 1 ? " disabled" : "") + '>' + PI.prev + '</button>';
    var set = {}; [1, n, page - 2, page - 1, page, page + 1, page + 2].forEach(function(p){ if (p >= 1 && p <= n) set[p] = 1; });
    var list = Object.keys(set).map(Number).sort(function(a, b){ return a - b; }), prev = 0;
    list.forEach(function(p){ if (p - prev > 1) out += '<span>…</span>'; out += '<button type="button" ' + attr + '="' + p + '"' + (p === page ? ' aria-current="page"' : '') + '>' + p + '</button>'; prev = p; });
    return out + '<button type="button" ' + attr + '="' + (page + 1) + '" aria-label="다음 쪽"' + (page >= n ? " disabled" : "") + '>' + PI.next + '</button></div>';
  }
  function csvDownload(name, rows){
    var body = "\uFEFF" + rows.map(function(r){ return r.map(function(c){ c = String(c == null ? "" : c); return /[",\n]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c; }).join(","); }).join("\r\n");
    var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([body], { type:"text/csv;charset=utf-8" })); a.download = name;
    document.body.appendChild(a); a.click(); setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }
  /* 기록에 남은 키(v:ID · f:ID:파일키 · r:2611/연령ID · rf:2611/연령ID:파일키) → 제목 */
  var Look = {
    video: function(id){ return (data.videos || []).filter(function(v){ return v.id === id; })[0] || null; },
    age: function(path){
      var p = String(path).split("/"), out = null;
      (rdata.months || []).forEach(function(m){ if (ymCode(m.ym) === p[0]) m.ages.forEach(function(a){ if (a.id === p[1]) out = { m: m, a: a }; }); });
      return out;
    },
    ageTitle: function(x){ return x ? ((x.m.title || x.m.ym) + " " + (x.a.title || "")).trim() + " 상품연구 전략자료" : ""; },
    title: function(k){
      if (k.indexOf("v:") === 0){ var v = Look.video(k.slice(2)); return v ? (v.title || "(제목 없음)") : "지금은 없는 강의"; }
      if (k.indexOf("r:") === 0){ return Look.ageTitle(Look.age(k.slice(2))) || "지금은 없는 자료"; }
      return k;
    },
    file: function(k){
      var m = /^(f|rf):(.+):([^:]+)$/.exec(k); if (!m) return { name: k, type: "", tag: "" };
      var files = [], tag = m[1] === "f" ? "강의" : "상품연구";
      if (m[1] === "f"){ var v = Look.video(m[2]); files = v ? v.files : []; } else { var x = Look.age(m[2]); files = x ? x.a.files : []; }
      var f = files.filter(function(f){ return fileKey(f) === m[3]; })[0];
      return f ? { name: f.name || "(이름 없음)", type: f.type || "", tag: tag } : { name: "지금은 없는 자료", type: "", tag: tag };
    }
  };
  function ftHtml(type){
    var t = String(type || "").toLowerCase(), c = /pdf/.test(t) ? "pdf" : /ppt|key/.test(t) ? "ppt" : /xls|csv/.test(t) ? "xls" : "";
    return '<span class="ft ' + c + '">' + esc((t.replace(/x$/, "").slice(0, 3) || "파일").toUpperCase()) + '</span>';
  }

  var Route = (function(){
    var MENUS = ["members", "roster", "me", "notice", "update", "admins", "log", "siteacc", "sheet", "keys"], MASTER = { admins:1, log:1, siteacc:1, sheet:1, keys:1 };
    var cur = "", curView = "";
    function isMaster(){ return adminSes ? !!adminSes.master : !!token; }
    function parse(h){
      var p = String(h || "").replace(/^#\/?/, "").split("/");
      if (p[0] === "analytics") return { view:"analytics" };
      if (p[0] === "settings"){
        var m = p[1]; if (MENUS.indexOf(m) < 0){ m = LS.get("sc-admin-set") || "members"; if (MENUS.indexOf(m) < 0) m = "members"; }
        return { view:"settings", menu:m };
      }
      return { view:"courses" };
    }
    function hashOf(r){ return r.view === "settings" ? "#/settings/" + r.menu : "#/" + r.view; }
    function apply(){
      var r = parse(location.hash), h = hashOf(r);
      if (curView === "courses" && r.view !== "courses" && dirty && !confirm("저장하지 않은 변경이 있어요. 나갈까요?")){ history.replaceState(null, "", cur); return; }
      if (location.hash !== h) history.replaceState(null, "", h);
      var changed = r.view !== curView; cur = h; curView = r.view;
      document.body.dataset.view = r.view;
      $("app").hidden = r.view !== "courses"; $("setView").hidden = r.view !== "settings"; $("anaView").hidden = r.view !== "analytics";
      document.querySelectorAll("#barNav [data-view]").forEach(function(a){ if (a.dataset.view === r.view) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
      if (r.view === "settings") $("setBtn").setAttribute("aria-current", "page"); else $("setBtn").removeAttribute("aria-current");
      if (r.view !== "courses"){ if (!$("edWrap").hidden) closeEditor(); document.body.classList.remove("sheet-open"); }
      if (changed) window.scrollTo(0, 0);
      if (!document.body.classList.contains("authed")) return;
      if (r.view === "settings") menu(r.menu, changed);
      if (r.view === "analytics") Ana.show();
    }
    function menu(m, first){
      var lock = MASTER[m] && !isMaster();
      if (!lock) LS.set("sc-admin-set", m);
      document.querySelectorAll("#setNav [data-set]").forEach(function(a){ if (a.dataset.set === m) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
      document.querySelectorAll("#setMain [data-page]").forEach(function(el){ el.hidden = el.dataset.page !== (lock ? "nomaster" : m); });
      if (!lock){
        if (m === "members") Members.show();
        if (m === "admins" || m === "keys") Auth.listAdmins();
        if (m === "log") SyncLog.show();
      }
      var act = document.querySelector('#setNav [aria-current="page"]');
      if (act && window.innerWidth <= 980 && act.scrollIntoView) act.scrollIntoView({ block:"nearest", inline:"center", behavior: first ? "auto" : "smooth" });
      if (!first) window.scrollTo(0, 0);
    }
    var lastM = null;
    function master(){ var m = isMaster(); $("navMaster").hidden = !m; $("memXls").hidden = !m; if (curView && lastM !== null && m !== lastM){ lastM = m; apply(); } lastM = m; }
    function go(h){ if (location.hash === h) apply(); else location.hash = h; }
    function count(id, n){ var e = $(id); if (e) e.textContent = n == null ? "" : nf(n); }
    window.addEventListener("hashchange", apply);
    $("setBtn").addEventListener("click", function(){ go("#/settings/" + (LS.get("sc-admin-set") || "members")); });
    return { apply: apply, go: go, master: master, count: count, rel: relAt, org: org2, isMaster: isMaster };
  })();

  /* ---------- 회원 관리 (P7) ---------- */
  var Members = (function(){
    var q = { tab:"normal", q:"", sort:"last", filter:"all", page:1 }, seq = 0, res = null, sel = null, dseq = 0, typeT = null, nsState = {};
    function meta(r){
      $("memMeta").innerHTML = '<span>' + PI.refresh + '마지막 갱신 <b>' + (r && r.lastSync ? esc(fmtAt(r.lastSync)) : "—") + '</b></span>' +
        '<span>' + PI.cal + '기록 시작 <b>' + (r && r.logStart ? esc(fmtAt(r.logStart).replace(/ \d\d:\d\d$/, "")) : "아직 안 함") + '</b> <small>(마지막 접속 · 조회 · 다운로드를 세기 시작한 날)</small></span>';
    }
    function tabs(r){
      var c = r ? r.counts : null;
      $("mtN").textContent = c ? nf(c.normal) : ""; $("mtA").textContent = c ? nf(c.abnormal) : ""; $("mtS").textContent = c ? nf(c.nosabun) : "";
      document.querySelectorAll("#memTabs [data-tab]").forEach(function(b){ b.setAttribute("aria-selected", b.dataset.tab === q.tab ? "true" : "false"); });
      if (c) Route.count("navMem", c.normal + c.abnormal + c.nosabun);
    }
    function tools(){
      var ns = q.tab === "nosabun", ab = q.tab === "abnormal";
      $("memSort").hidden = ns || ab; $("memFilter").hidden = ns || ab;
      $("memSort").value = q.sort;
      document.querySelectorAll("#memFilter [data-f]").forEach(function(b){ b.setAttribute("aria-checked", b.dataset.f === q.filter ? "true" : "false"); });
      $("memQ").placeholder = ns ? "회원아이디 · 이름 · 소속 검색" : "사번 · 이름 · 소속 검색";
    }
    function cls(){ return q.tab === "nosabun" ? "g-ns" : q.tab === "abnormal" ? "g-mem2" : "g-mem"; }
    function head(){
      if (q.tab === "nosabun") return '<div class="tr th g-ns" role="row"><span>회원아이디</span><span>이름</span><span>소속</span><span>가입상태</span><span>사번(직접 입력)</span></div>';
      if (q.tab === "abnormal") return '<div class="tr th g-mem2" role="row"><span>사번</span><span>이름</span><span>소속</span><span>가입상태</span></div>';
      var lab = { last:"마지막 접속", views:"누적 조회", downs:"누적 다운로드" };
      function th(k, r){ return '<span class="' + (r ? "r" : "") + '">' + (q.sort === k ? '<span class="srt">' + lab[k] + PI.sort + '</span>' : lab[k]) + '</span>'; }
      return '<div class="tr th g-mem" role="row"><span>사번</span><span>' + (q.sort === "name" ? '<span class="srt">이름' + PI.sort + '</span>' : '이름') + '</span><span>소속</span>' + th("last") + th("views", 1) + th("downs", 1) + '</div>';
    }
    function rowHtml(x){
      if (q.tab === "nosabun"){
        var st = nsState[x.uid] || (x.manual ? (x.dup ? "dup" : x.manualOk ? "ok" : "bad") : ""), val = st && st.v != null ? st.v : x.manual;
        var stt = typeof st === "object" ? st.s : st;
        var msg = stt === "ok" ? '<span class="ns-st ok">✓ 저장됨</span>' : stt === "bad" ? '<span class="ns-st er">8자리 숫자로 적어 주세요</span>' : stt === "dup" ? '<span class="ns-st er">회원 탭에 이미 있는 사번이에요</span>' : stt === "busy" ? '<span class="ns-st">' + SPIN + '</span>' : stt === "err" ? '<span class="ns-st er">저장하지 못했어요</span>' : '';
        return '<div class="tr c g-ns" role="row"><span class="t2 el" title="' + esc(x.uid) + '">' + esc(x.uid) + '</span><span class="nm">' + esc(x.name) + '</span><span class="el t2" title="' + esc(x.org) + '">' + esc(org2(x.org) || "—") + '</span>' +
          '<span>' + (x.state === "정상 회원" ? '<span class="k-pill ok s">정상 회원</span>' : '<span class="k-pill s">비정상 회원</span>') + '</span>' +
          '<span class="ns-in"><input class="k-in k-num" inputmode="numeric" maxlength="8" data-ns="' + esc(x.uid) + '" value="' + esc(val || "") + '" placeholder="8자리" aria-label="' + esc(x.name) + ' 사번 직접 입력"' + (stt === "bad" || stt === "dup" ? ' aria-invalid="true"' : '') + '>' +
          '<button type="button" class="k-btn k-btn2 xs rp" data-nssave="' + esc(x.uid) + '">저장</button>' + msg + '</span></div>';
      }
      var on = sel === x.sabun ? " on" : "";
      if (q.tab === "abnormal") return '<div class="tr go g-mem2' + on + '" role="row" tabindex="0" data-sb="' + esc(x.sabun) + '"><span class="t2">' + esc(x.sabun) + '</span><span class="nm">' + esc(x.name) + '</span><span class="el t2" title="' + esc(x.org) + '">' + esc(org2(x.org) || "—") + '</span><span><span class="k-pill s">비정상 회원</span></span></div>';
      return '<div class="tr go g-mem' + on + '" role="row" tabindex="0" data-sb="' + esc(x.sabun) + '"><span class="t2">' + esc(x.sabun) + '</span><span class="nm">' + esc(x.name) + '</span><span class="el t2" title="' + esc(x.org) + '">' + esc(org2(x.org) || "—") + '</span>' +
        (x.last ? '<span data-k="마지막 접속">' + esc(relAt(x.last)) + '</span>' : '<span class="mu" data-k="마지막 접속">접속 전</span>') +
        '<span class="r' + (x.views ? '' : ' mu') + '" data-k="조회">' + nf(x.views) + '</span><span class="r' + (x.downs ? '' : ' mu') + '" data-k="다운로드">' + nf(x.downs) + '</span></div>';
    }
    function paint(){
      var r = res; tabs(r); meta(r); tools();
      $("memNoLog").hidden = !(r && !r.logStart && q.tab === "normal");
      if (r && !r.logStart) $("memNoLog").innerHTML = PI.info + '<span><b>아직 기록이 없어요.</b> 사이트에 사번 로그인이 붙으면 회원마다 마지막 접속 · 누적 조회 · 누적 다운로드가 여기에 쌓여요.</span>';
      $("memNsNote").hidden = q.tab !== "nosabun";
      if (q.tab === "nosabun") $("memNsNote").innerHTML = PI.info + '<span>세일즈온 어드민 아이디에 사번이 없는 회원이에요. 사번을 알면 직접 적어 주세요. 다음 갱신 때 회원 명단에 들어가고, 영업개발파트 정상 회원이면 관리자에도 들어가요.</span>';
      var tbl = $("memTbl"); tbl.className = "tbl cards";
      if (!r) return;
      var from = (r.page - 1) * r.size;
      var foot = '<div class="tf"><span>' + (r.total ? nf(from + 1) + "–" + nf(Math.min(from + r.size, r.total)) + " / " : "") + '<b>' + nf(r.total) + '</b>명' +
        (q.tab === "nosabun" ? ' · 그중 정상 회원 ' + nf(r.noSabunNormal) + '명 · 직접 입력 ' + nf(r.manualCount) + '명' : '') + '</span>' + pager(r.page, r.total, r.size, "data-mpg") + '</div>';
      tbl.innerHTML = r.rows.length ? head() + r.rows.map(rowHtml).join("") + foot
        : (q.q ? emptyHtml("search", "‘" + esc(q.q) + "’에 맞는 회원이 없어요.", "사번 · 이름 · 소속의 일부로 검색해 보세요.") :
           q.filter === "seen" ? emptyHtml("log", "접속한 적 있는 회원이 아직 없어요.", r.logStart ? "" : "사이트에 사번 로그인이 붙으면 쌓여요.") :
           emptyHtml("log", q.tab === "nosabun" ? "사번 없는 회원이 없어요." : "명단이 비어 있어요.", q.tab === "nosabun" ? "" : "사번 명단에서 [지금 갱신]을 눌러 주세요."));
    }
    function fetch1(keepSel){
      tabs(res); tools();
      if (noGate()){ $("memTbl").className = "tbl"; $("memTbl").innerHTML = NOLOGIN; meta(null); return; }
      var my = ++seq;
      if (!keepSel){ sel = null; $("memDet").hidden = true; $("memDet").parentNode.classList.remove("has-det"); }
      $("memTbl").className = "tbl"; $("memTbl").innerHTML = head() + skelRows(cls(), 8, q.tab === "nosabun" ? 5 : q.tab === "abnormal" ? 4 : 6);
      gateFetch({ action:"memberList", sid: adminSes.sid, q: { tab:q.tab, q:q.q, sort:q.sort, filter: q.filter === "all" ? "" : q.filter, page:q.page } }).then(function(r){
        if (my !== seq) return;
        if (!r.ok) throw new Error(r.error);
        res = r; q.page = r.page; paint();
      }).catch(function(e){ if (my !== seq) return; sessionGone(e); $("memTbl").className = "tbl"; $("memTbl").innerHTML = LOADERR; });
    }
    function sessionGone(e){ if (e && /nosession|expired/.test(e.message)){ toast("로그인 시간이 지났어요. 다시 로그인해 주세요"); } }
    function show(){ if (!res || res.tab !== q.tab) fetch1(true); else { paint(); fetch1(true); } }
    function detail(sb){
      sel = sb; var det = $("memDet"), my = ++dseq;
      document.querySelectorAll("#memTbl [data-sb]").forEach(function(el){ el.classList.toggle("on", el.dataset.sb === sb); });
      det.hidden = false; det.parentNode.classList.add("has-det");
      det.innerHTML = '<div class="det-h"><span class="k-av">·</span><span class="k-col"><span class="sk" style="width:120px;height:18px"></span><span class="sk" style="width:200px"></span></span><button type="button" class="x" data-detx aria-label="회원 상세 닫기">' + PI.x + '</button></div>' +
        '<div class="tiles"><div class="tile"><span class="sk"></span></div><div class="tile"><span class="sk"></span></div><div class="tile"><span class="sk"></span></div></div>';
      if (window.innerWidth <= 1279) det.scrollIntoView({ block:"start", behavior:"smooth" });
      gateFetch({ action:"memberDetail", sid: adminSes.sid, sabun: sb }).then(function(r){
        if (my !== dseq) return;
        if (!r.ok) throw new Error(r.error);
        var m = r.member, nv = r.views.length, nd = r.downs.length;
        function list(arr, isFile, ic, label){
          var more = arr.length > 5;
          return '<div class="sec"><div class="sec-h">' + ic + label + ' <b>' + nf(arr.length) + '개</b></div>' +
            (arr.length ? arr.map(function(x, i){
              var f = isFile ? Look.file(x.id) : null;
              return '<div class="li"' + (i >= 5 ? ' data-more hidden' : '') + '>' + (f ? ftHtml(f.type) : '') + '<span class="tt">' + esc(f ? f.name : Look.title(x.id)) + (f && f.tag ? '<span class="tag' + (f.tag === "상품연구" ? " rs" : "") + '">' + f.tag + '</span>' : '') + '</span><span class="sb"><b>' + nf(x.n) + '번</b><br>' + esc(relAt(x.last)) + '</span></div>';
            }).join("") + (more ? '<button type="button" class="lnk" data-detmore>' + (arr.length - 5) + '개 더 보기</button>' : '') :
            '<p class="k-note">' + (r.logStart ? "아직 없어요." : "기록을 세기 시작하면 여기에 보여요.") + '</p>') + '</div>';
        }
        det.innerHTML = '<div class="det-h"><span class="k-av">' + esc((m.name || "?").charAt(0)) + '</span><span class="k-col"><span class="k-row k-g8"><b>' + esc(m.name) + '</b>' +
          (m.state === "정상 회원" ? '<span class="k-pill ok s">정상 회원</span>' : '<span class="k-pill s">비정상 회원</span>') + '</span><span>사번 ' + esc(m.sabun) + (m.from === "manual" ? " · 직접 입력" : "") + '</span><span>' + esc(m.org || "") + '</span></span>' +
          '<button type="button" class="x" data-detx aria-label="회원 상세 닫기">' + PI.x + '</button></div>' +
          '<div class="tiles"><div class="tile"><span class="k">마지막 접속</span><span class="v s">' + (r.last ? esc(relAt(r.last)) : '<span class="mu">접속 전</span>') + '</span></div>' +
          '<div class="tile hi"><span class="k">누적 조회</span><span class="v">' + nf(r.viewCount) + '<small>번</small></span></div>' +
          '<div class="tile hi"><span class="k">누적 다운로드</span><span class="v">' + nf(r.downCount) + '<small>번</small></span></div></div>' +
          (r.logStart ? '' : '<div class="k-msg wa">' + PI.info + '<span><b>아직 기록이 없어요.</b> 사이트에 사번 로그인이 붙으면 쌓여요.</span></div>') +
          list(r.views, false, PI.views, "본 강의") + list(r.downs, true, PI.files, "받은 자료");
      }).catch(function(e){ if (my !== dseq) return; sessionGone(e); det.innerHTML = '<div class="det-h"><span class="k-col"><b>불러오지 못했어요.</b></span><button type="button" class="x" data-detx aria-label="회원 상세 닫기">' + PI.x + '</button></div>'; });
    }
    function open(sb){ q.tab = "normal"; q.q = sb; q.page = 1; $("memQ").value = sb; Route.go("#/settings/members"); fetch1(true); detail(sb); }
    function saveNs(uid){
      var inp = document.querySelector('#memTbl [data-ns="' + CSS.escape(uid) + '"]'), v = (inp ? inp.value : "").replace(/\s+/g, "");
      if (v && !/^\d{8}$/.test(v)){ nsState[uid] = { s:"bad", v:v }; paint(); return; }
      nsState[uid] = { s:"busy", v:v }; paint();
      gateFetch({ action:"noSabunSave", sid: adminSes.sid, uid: uid, sabun: v }).then(function(r){
        if (!r.ok){ nsState[uid] = { s: r.error === "dup" ? "dup" : r.error === "bad" ? "bad" : "err", v:v }; paint(); return; }
        nsState[uid] = { s: v ? "ok" : "", v:v };
        (res.rows || []).forEach(function(x){ if (x.uid === uid){ x.manual = v; x.manualOk = !!v; x.dup = false; } });
        paint(); if (v) toast("저장했어요. 다음 갱신 때 회원 명단에 들어가요");
      }).catch(function(){ nsState[uid] = { s:"err", v:v }; paint(); });
    }
    function exportAll(){
      if (noGate() || !Route.isMaster()) return;
      var b = $("memXls"), old = b.innerHTML; b.disabled = true; b.innerHTML = SPIN + "만드는 중…";
      gateFetch({ action:"memberList", sid: adminSes.sid, q: { tab:q.tab, q:q.q, sort:q.sort, filter: q.filter === "all" ? "" : q.filter, all:true } }).then(function(r){
        if (!r.ok) throw new Error(r.error);
        var name = { normal:"정상회원", abnormal:"비정상회원", nosabun:"사번없음" }[q.tab], rows;
        if (q.tab === "nosabun") rows = [["회원아이디", "이름", "소속", "가입상태", "사번(직접 입력)"]].concat(r.rows.map(function(x){ return [x.uid, x.name, x.org, x.state, x.manual]; }));
        else rows = [["사번", "이름", "소속", "가입상태", "마지막 접속", "누적 조회", "누적 다운로드"]].concat(r.rows.map(function(x){ return [x.sabun, x.name, x.org, x.state, fmtAt(x.last, "full"), x.views, x.downs]; }));
        csvDownload("회원명단_" + name + "_" + kstDay(0).replace(/-/g, "") + ".csv", rows);
        toast(nf(r.rows.length) + "명을 엑셀(CSV)로 받았어요");
      }).catch(function(){ toast("받지 못했어요. 잠시 뒤 다시 해 주세요"); }).then(function(){ b.disabled = false; b.innerHTML = old; });
    }
    $("memTabs").addEventListener("click", function(e){ var b = e.target.closest("[data-tab]"); if (!b || b.dataset.tab === q.tab) return; q.tab = b.dataset.tab; q.page = 1; if (q.tab !== "normal"){ q.filter = "all"; } fetch1(); });
    $("memQ").addEventListener("input", function(){ var v = this.value.trim(); clearTimeout(typeT); typeT = setTimeout(function(){ if (v === q.q) return; q.q = v; q.page = 1; fetch1(); }, 300); });
    $("memSort").addEventListener("change", function(){ q.sort = this.value; q.page = 1; fetch1(true); });
    $("memFilter").addEventListener("click", function(e){ var b = e.target.closest("[data-f]"); if (!b || b.dataset.f === q.filter) return; q.filter = b.dataset.f; q.page = 1; fetch1(); });
    $("memXls").addEventListener("click", exportAll);
    $("memTbl").addEventListener("click", function(e){
      var p = e.target.closest("[data-mpg]"); if (p && !p.disabled){ q.page = Number(p.getAttribute("data-mpg")); fetch1(true); $("memTabs").scrollIntoView({ block:"nearest" }); return; }
      var s = e.target.closest("[data-nssave]"); if (s){ saveNs(s.getAttribute("data-nssave")); return; }
      if (e.target.closest("input")) return;
      var r = e.target.closest("[data-sb]"); if (r) detail(r.dataset.sb);
    });
    $("memTbl").addEventListener("keydown", function(e){
      if (e.key === "Enter" && e.target.matches("[data-ns]")){ e.preventDefault(); saveNs(e.target.getAttribute("data-ns")); return; }
      var r = e.target.closest("[data-sb]"); if (r && (e.key === "Enter" || e.key === " ")){ e.preventDefault(); detail(r.dataset.sb); }
    });
    $("memTbl").addEventListener("input", function(e){ if (e.target.matches("[data-ns]")){ var u = e.target.getAttribute("data-ns"); nsState[u] = { s:"", v:e.target.value }; e.target.removeAttribute("aria-invalid"); var m = e.target.parentNode.querySelector(".ns-st"); if (m) m.remove(); } });
    $("memDet").addEventListener("click", function(e){
      if (e.target.closest("[data-detx]")){ sel = null; $("memDet").hidden = true; $("memDet").parentNode.classList.remove("has-det"); document.querySelectorAll("#memTbl .tr.on").forEach(function(el){ el.classList.remove("on"); }); return; }
      var m = e.target.closest("[data-detmore]"); if (m){ m.parentNode.querySelectorAll("[data-more]").forEach(function(el){ el.hidden = false; }); m.remove(); }
    });
    return { show: show, open: open, reset: function(){ res = null; sel = null; nsState = {}; } };
  })();

  /* ---------- 🔒 갱신 기록 ---------- */
  var SyncLog = (function(){
    var page = 1, seq = 0;
    var HEAD = '<div class="tr th g-log" role="row"><span>날짜시각</span><span>방식</span><span>결과</span><span class="r">정상 회원</span><span class="r">비정상 회원</span><span class="r">사번 없음</span><span class="r">새 사번</span><span>실패 이유</span></div>';
    function n(v, t2){ return '<span class="r' + (t2 ? " t2" : "") + '">' + (v == null ? "—" : nf(v)) + '</span>'; }
    function show(){
      var t = $("logTbl");
      if (noGate()){ t.innerHTML = NOLOGIN; return; }
      var my = ++seq; t.innerHTML = HEAD + skelRows("g-log", 6, 8);
      gateFetch({ action:"syncLogList", sid: adminSes.sid, page: page }).then(function(r){
        if (my !== seq) return; if (!r.ok) throw new Error(r.error);
        if (!r.rows.length){ t.innerHTML = emptyHtml("log", "아직 갱신 기록이 없어요.", "사번 명단에서 [지금 갱신]을 누르거나 자동 갱신을 켜면 여기에 쌓여요."); return; }
        t.innerHTML = HEAD + r.rows.map(function(x){
          return '<div class="tr g-log' + (x.ok ? '' : ' bad') + '" role="row"><span class="t2">' + esc(fmtAt(x.at, "dot")) + '</span><span class="t2" data-k="방식">' + esc(x.how) + '</span>' +
            '<span>' + (x.ok ? '<span class="k-pill ok s">성공</span>' : '<span class="k-pill er s">실패</span>') + '</span>' +
            (x.ok ? n(x.normal) + n(x.abnormal, 1) + n(x.nosabun, 1) + '<span class="r">' + (x.added == null ? "—" : x.added ? "+" + nf(x.added) : "0") + '</span>' : n(null) + n(null, 1) + n(null, 1) + n(null)) +
            '<span class="el" title="' + esc(x.why || "") + '">' + esc(x.why || "") + '</span></div>';
        }).join("") + '<div class="tf"><span>모두 <b>' + nf(r.total) + '</b>번</span>' + pager(r.page, r.total, r.size, "data-lpg") + '</div>';
      }).catch(function(){ if (my !== seq) return; t.innerHTML = LOADERR; });
    }
    $("logTbl").addEventListener("click", function(e){ var p = e.target.closest("[data-lpg]"); if (p && !p.disabled){ page = Number(p.getAttribute("data-lpg")); show(); } });
    return { show: show };
  })();

  /* ---------- 분석 (P8 · 디자인 #45) ---------- */
  var Ana = (function(){
    var kind = LS.get("sc-ana-kind") === "r" ? "r" : "v", qs = "", sort = "new", stats = null, logStart = "", sel = LS.get("sc-ana-key") || "";
    var period = "all", from = "", to = "", tab = "view", fOrg = "", fWho = "", det = null, seq = 0, sseq = 0, page = 1, openF = {}, statsAt = 0;
    function items(){
      var out = [];
      if (kind === "v"){
        var order = {}; SC.CATS.forEach(function(c, i){ order[c.id] = i; });
        (data.videos || []).forEach(function(v){ if (!v.id) return; var c = SC.catOf(v); out.push({ key:"v:" + v.id, title: v.title || "(제목 없음)", gid: c, group: SC.catLabel(c), go: order[c] == null ? 99 : order[c], date: v.date || "", thumb: SC.thumb(v.id, false), files: v.files || [], sub: [v.date ? v.date.replace(/-/g, ".") + " 업로드" : "", v.duration || "", "자료 " + (v.files || []).length + "개"].filter(Boolean).join(" · "), link: "v/" + v.id + "/" }); });
      } else {
        (rdata.months || []).forEach(function(m){
          var code = ymCode(m.ym); if (!code) return;
          m.ages.forEach(function(a, i){ out.push({ key:"r:" + code + "/" + a.id, title: ((m.title || m.ym) + " " + (a.title || "")).trim(), gid: m.ym, group: m.title || m.ym, go: -Number(m.ym.replace("-", "")), date: m.ym + "-" + (900 - i), thumb: a.thumb || m.thumb || "assets/research-default.png", rs: true, files: a.files || [], sub: "자료 " + (a.files || []).length + "개", link: "research/" + code + "/" + a.id + "/" }); });
        });
      }
      return out;
    }
    function st(k){ return (stats && stats[k]) || { views:0, viewers:0, downs:0, downers:0 }; }
    function sorted(){
      var t = qs.replace(/\s+/g, "").toLowerCase(), list = items().filter(function(x){ return !t || x.title.replace(/\s+/g, "").toLowerCase().indexOf(t) >= 0; });
      var key = sort === "views" ? (kind === "r" ? "downs" : "views") : sort === "viewers" ? (kind === "r" ? "downers" : "viewers") : "";
      list.sort(function(a, b){ return a.go - b.go || (key ? st(b.key)[key] - st(a.key)[key] : 0) || (b.date > a.date ? 1 : b.date < a.date ? -1 : 0); });
      return list;
    }
    function mm(x){ var s = st(x.key); return kind === "r" ? '다운로드 <b>' + nf(s.downs) + '</b> · 받은 사람 <b>' + nf(s.downers) + '</b>' : '조회 <b>' + nf(s.views) + '</b> · 본 사람 <b>' + nf(s.viewers) + '</b> · 받은 사람 <b>' + nf(s.downers) + '</b>'; }
    function thumbHtml(x, cl){ return x.thumb ? '<span class="' + cl + (x.rs ? " rs" : "") + '" style="background-image:url(\'' + esc(x.thumb) + '\')"></span>' : '<span class="' + cl + ' rs">상품연구</span>'; }
    function paintList(){
      var list = sorted(), g = null, html = "";
      if (!list.some(function(x){ return x.key === sel; })) sel = list.length ? list[0].key : "";
      list.forEach(function(x){
        if (x.gid !== g){ g = x.gid; html += '<div class="al-g">' + esc(x.group) + ' <span>' + list.filter(function(y){ return y.gid === g; }).length + '</span></div>'; }
        html += '<button type="button" class="al-i" data-ak="' + esc(x.key) + '"' + (x.key === sel ? ' aria-current="true"' : '') + '>' + thumbHtml(x, "al-th") + '<span class="k-col"><span class="tt">' + esc(x.title) + '</span><span class="mm">' + mm(x) + '</span></span></button>';
      });
      $("anaList").innerHTML = html || '<p class="k-note" style="padding:16px">' + (qs ? "‘" + esc(qs) + "’에 맞는 " + (kind === "r" ? "자료가" : "강의가") + " 없어요." : kind === "r" ? "아직 상품연구 자료가 없어요." : "아직 강의가 없어요.") + '</p>';
      $("anaPick").innerHTML = list.map(function(x){ return '<option value="' + esc(x.key) + '"' + (x.key === sel ? " selected" : "") + '>' + esc(x.group + " · " + x.title) + '</option>'; }).join("");
      document.querySelectorAll("#anaKind [data-kind]").forEach(function(b){ b.setAttribute("aria-selected", b.dataset.kind === kind ? "true" : "false"); });
      $("anaSort").options[1].textContent = kind === "r" ? "다운로드 많은순" : "조회 많은순";
      $("anaSort").options[2].textContent = kind === "r" ? "받은 사람 많은순" : "본 사람 많은순";
    }
    function range(){
      if (period === "today") return [kstDay(0), kstDay(0)];
      if (period === "7") return [kstDay(6), kstDay(0)];
      if (period === "month") return [kstDay(0).slice(0, 8) + "01", kstDay(0)];
      if (period === "pick") return [from, to];
      return ["", ""];
    }
    function cur(){ return items().filter(function(x){ return x.key === sel; })[0] || null; }
    function filt(rows){
      var o = fOrg.replace(/\s+/g, "").toLowerCase(), w = fWho.replace(/\s+/g, "").toLowerCase();
      return rows.filter(function(p){ return (!o || String(p.org).replace(/\s+/g, "").toLowerCase().indexOf(o) >= 0) && (!w || (p.name + p.sabun).replace(/\s+/g, "").toLowerCase().indexOf(w) >= 0); });
    }
    function head(x){
      return '<div class="ar-h">' + thumbHtml(x, "ar-th") + '<div class="k-col"><span class="k-row k-g8"><span class="k-pill ac s">' + esc(x.rs ? "상품연구 · " + x.group : x.group) + '</span><span>' + esc(x.sub) + '</span></span><h1 class="k-h1">' + esc(x.title) + '</h1>' +
        '<a class="lnk" href="' + esc(x.link) + '" target="_blank" rel="noopener">사이트에서 보기 ' + PI.ext + '</a></div></div>';
    }
    function tools(){
      var P = [["all", "전체"], ["today", "오늘"], ["7", "최근 7일"], ["month", "이번 달"], ["pick", PI.cal + "직접 고르기"]];
      return '<div class="tools2"><div class="chips" role="radiogroup" aria-label="기간">' + P.map(function(p){ return '<button type="button" class="chip" role="radio" data-per="' + p[0] + '" aria-checked="' + (period === p[0]) + '">' + p[1] + '</button>'; }).join("") + '</div>' +
        '<span class="dates"' + (period === "pick" ? "" : " hidden") + '><input type="date" class="k-in" id="anaFrom" value="' + esc(from) + '" aria-label="시작 날짜"><span class="t2">~</span><input type="date" class="k-in" id="anaTo" value="' + esc(to) + '" aria-label="끝 날짜"></span>' +
        '<label class="srch">' + PI.search + '<input class="k-in" id="anaOrg" type="search" placeholder="소속 검색" value="' + esc(fOrg) + '" aria-label="소속 검색"></label>' +
        '<label class="srch">' + PI.search + '<input class="k-in" id="anaWho" type="search" placeholder="이름 · 사번 검색" value="' + esc(fWho) + '" aria-label="이름 · 사번 검색"></label>' +
        '<button type="button" class="k-btn k-btn3 sm rp" id="anaXls">' + PI.dl + '엑셀로 받기</button></div>';
    }
    function sumHtml(x, d){
      if (x.rs) return '<div class="sum"><div class="tile"><span class="k">총 다운로드</span><span class="v">' + nf(d.downs) + '</span><span class="d">같은 사람이 여러 번 받아도 그때마다</span></div>' +
        '<div class="tile hi"><span class="k">받은 사람</span><span class="v">' + nf(d.downers) + '<small>명</small></span><span class="d">중복 없이</span></div>' +
        '<div class="tile"><span class="k">자료</span><span class="v">' + nf(x.files.length) + '<small>개</small></span></div>' +
        '<div class="tile"><span class="k">기록 시작</span><span class="v s">' + esc(fmtAt(logStart, "full").slice(0, 10)) + '</span></div></div>';
      return '<div class="sum"><div class="tile"><span class="k">총 조회</span><span class="v">' + nf(d.total) + '</span><span class="d">같은 사람이 여러 번 봐도 그때마다</span></div>' +
        '<div class="tile hi"><span class="k">본 사람</span><span class="v">' + nf(d.viewers.length) + '<small>명</small></span><span class="d">중복 없이</span></div>' +
        '<div class="tile hi"><span class="k">자료 받은 사람</span><span class="v">' + nf(d.downers) + '<small>명</small></span><span class="d">자료 ' + x.files.length + '개 중 하나라도</span></div>' +
        '<div class="tile"><span class="k">처음 · 마지막 조회</span><span class="v s">' + (d.first ? esc(relAt(d.first)) + '<br>' + esc(relAt(d.last)) : '—') + '</span></div></div>';
    }
    function nameBtn(p){ return '<button type="button" class="nm" data-who="' + esc(p.sabun) + '">' + esc(p.name || "(이름 없음)") + '</button>'; }
    function viewTbl(d){
      var rows = filt(d.viewers).sort(function(a, b){ return a.last < b.last ? 1 : -1; }), size = 50, pg = Math.min(page, Math.max(1, Math.ceil(rows.length / size)));
      if (!rows.length) return '<div class="tbl">' + emptyHtml("search", fOrg || fWho ? "조건에 맞는 사람이 없어요." : "이 기간에 본 사람이 없어요.", fOrg || fWho ? "소속이나 이름을 바꿔 보세요." : "기간을 바꿔 보세요.") + '</div>';
      return '<div class="tbl cards"><div class="tr th g-view"><span>이름</span><span>사번</span><span>소속</span><span class="r">본 횟수</span><span>처음 본 때</span><span><span class="srt">마지막으로 본 때' + PI.sort + '</span></span></div>' +
        rows.slice((pg - 1) * size, pg * size).map(function(p){ return '<div class="tr g-view">' + nameBtn(p) + '<span class="t2">' + esc(p.sabun) + '</span><span class="el t2" title="' + esc(p.org) + '">' + esc(org2(p.org) || "—") + '</span><span class="r" data-k="본 횟수">' + nf(p.n) + '</span><span class="t2" data-k="처음">' + esc(relAt(p.first)) + '</span><span data-k="마지막">' + esc(relAt(p.last)) + '</span></div>'; }).join("") +
        '<div class="tf"><span>' + nf((pg - 1) * size + 1) + '–' + nf(Math.min(pg * size, rows.length)) + ' / <b>' + nf(rows.length) + '</b>명 · 이름을 누르면 회원 상세</span>' + pager(pg, rows.length, size, "data-apg") + '</div></div>';
    }
    function downTbl(x, d){
      var keys = x.files.map(function(f){ return { k: fileKey(f), f: f }; }), seen = {};
      keys.forEach(function(o){ seen[o.k] = 1; });
      Object.keys(d.files || {}).forEach(function(k){ if (!seen[k]) keys.push({ k:k, f:{ name:"지금은 없는 자료", type:"" } }); });
      if (!keys.length) return '<div class="tbl">' + emptyHtml("files", "자료가 없어요.", "") + '</div>';
      return '<div class="fgs">' + keys.map(function(o){
        var ppl = filt((d.files || {})[o.k] || []).sort(function(a, b){ return a.first < b.first ? 1 : -1; }), op = !!openF[o.k];
        return '<div class="fg' + (op ? " open" : "") + '"><button type="button" class="fg-h" data-fg="' + esc(o.k) + '" aria-expanded="' + op + '">' + ftHtml(o.f.type) + '<span class="nm">' + esc(o.f.name || "(이름 없음)") + '</span><span class="cnt">받은 사람 <b>' + nf(ppl.length) + '</b>명</span><span class="chev">' + PI.sort + '</span></button>' +
          (op ? (ppl.length ? '<div class="tbl-x"><div class="tr th g-down"><span>이름</span><span>사번</span><span>소속</span><span class="r">받은 횟수</span><span>처음 받은 때</span></div>' +
            ppl.map(function(p){ return '<div class="tr g-down">' + nameBtn(p) + '<span class="t2">' + esc(p.sabun) + '</span><span class="el t2" title="' + esc(p.org) + '">' + esc(org2(p.org) || "—") + '</span><span class="r">' + nf(p.n) + '</span><span class="t2">' + esc(relAt(p.first)) + '</span></div>'; }).join("") + '</div>'
            : '<p class="k-note" style="padding:0 18px 16px 64px">' + (fOrg || fWho ? "조건에 맞는 사람이 없어요." : "이 기간에 받은 사람이 없어요.") + '</p>') : '') + '</div>';
      }).join("") + '</div>';
    }
    function paintMain(){
      var x = cur(), box = $("anaMain");
      if (!x){ box.innerHTML = emptyHtml("views", kind === "r" ? "아직 상품연구 자료가 없어요." : "아직 강의가 없어요.", ""); return; }
      if (noGate()){ box.innerHTML = head(x) + NOLOGIN; return; }
      if (!logStart && stats){ box.innerHTML = head(x) + '<div class="tbl">' + emptyHtml("log", "아직 기록이 없어요.", "사이트에 사번 로그인이 붙으면 누가 보고 받았는지 여기에 쌓여요.") + '</div>' + note(x); return; }
      if (x.rs) tab = "down";
      var d = det && det.key === x.key ? det : null;
      var top = head(x) + tools();
      if (!d){ box.innerHTML = top + '<div class="sum">' + [0, 1, 2, 3].map(function(){ return '<div class="tile"><span class="sk" style="width:60%"></span><span class="sk" style="height:26px;width:40%"></span></div>'; }).join("") + '</div><div class="tbl">' + skelRows("g-view", 6, 6) + '</div>'; return; }
      var none = !d.total && !d.downs && (period !== "all");
      box.innerHTML = top + sumHtml(x, d) +
        (x.rs ? '' : '<div class="ut" role="tablist"><button type="button" role="tab" data-ut="view" aria-selected="' + (tab === "view") + '">' + PI.views + '본 사람<b>' + nf(d.viewers.length) + '</b></button><button type="button" role="tab" data-ut="down" aria-selected="' + (tab === "down") + '">' + PI.files + '자료 다운로드<b>' + nf(d.downers) + '</b></button></div>') +
        (none ? '<div class="tbl">' + emptyHtml("cal", "이 기간에는 기록이 없어요.", "기간을 바꿔 보세요.") + '</div>' : tab === "view" ? viewTbl(d) : downTbl(x, d)) + note(x);
    }
    function note(x){ return '<p class="k-note">' + (x.rs ? "'받은 것'은 자료 받기 페이지에서 [받기]를 누른 것 기준이에요." : "'본 것'은 강의 페이지를 연 것 기준이에요(영상을 끝까지 봤는지는 알 수 없어요).") + ' 관리자가 보거나 받은 것은 숫자에서 빠져요.</p>'; }
    function loadDetail(){
      var x = cur(); if (!x || noGate() || !logStart) return paintMain();
      var my = ++seq, r = range(); det = null; paintMain();
      gateFetch({ action:"contentDetail", sid: adminSes.sid, key: x.key, from: r[0], to: r[1] }).then(function(d){
        if (my !== seq) return; if (!d.ok) throw new Error(d.error); det = d; page = 1; paintMain();
      }).catch(function(){ if (my !== seq) return; $("anaMain").innerHTML = head(x) + LOADERR; });
    }
    function show(){
      paintList(); paintMain();
      if (noGate()) return;
      if (stats && Date.now() - statsAt < 60000){ loadDetail(); return; }
      var my = ++sseq;
      gateFetch({ action:"contentStats", sid: adminSes.sid }).then(function(r){
        if (my !== sseq || !r.ok) return; stats = r.stats || {}; logStart = r.logStart || ""; statsAt = Date.now(); paintList(); loadDetail();
      }).catch(function(){ if (my !== sseq) return; $("anaMain").innerHTML = LOADERR; });
    }
    function pick(k){ if (k === sel) return; sel = k; LS.set("sc-ana-key", k); openF = {}; tab = "view"; paintList(); loadDetail(); if (window.innerWidth > 980) window.scrollTo(0, 0); }
    function exportCsv(){
      var x = cur(); if (!x || !det) return;
      var name = x.title.replace(/[\\/:*?"<>|]/g, "").slice(0, 40), rows;
      if (tab === "view") rows = [["이름", "사번", "소속", "본 횟수", "처음 본 때", "마지막으로 본 때"]].concat(filt(det.viewers).map(function(p){ return [p.name, p.sabun, p.org, p.n, fmtAt(p.first, "full"), fmtAt(p.last, "full")]; }));
      else {
        rows = [["자료", "이름", "사번", "소속", "받은 횟수", "처음 받은 때"]];
        Object.keys(det.files || {}).forEach(function(k){ var f = x.files.filter(function(f){ return fileKey(f) === k; })[0]; filt(det.files[k]).forEach(function(p){ rows.push([f ? f.name : "지금은 없는 자료", p.name, p.sabun, p.org, p.n, fmtAt(p.first, "full")]); }); });
      }
      csvDownload("분석_" + name + "_" + (tab === "view" ? "본사람" : "자료다운로드") + ".csv", rows);
    }
    var tT = null;
    $("anaKind").addEventListener("click", function(e){ var b = e.target.closest("[data-kind]"); if (!b || b.dataset.kind === kind) return; kind = b.dataset.kind; LS.set("sc-ana-kind", kind); sel = ""; openF = {}; tab = kind === "r" ? "down" : "view"; paintList(); LS.set("sc-ana-key", sel); loadDetail(); });
    $("anaQ").addEventListener("input", function(){ var v = this.value.trim(); clearTimeout(tT); tT = setTimeout(function(){ qs = v; paintList(); }, 150); });
    $("anaSort").addEventListener("change", function(){ sort = this.value; paintList(); });
    $("anaList").addEventListener("click", function(e){ var b = e.target.closest("[data-ak]"); if (b) pick(b.dataset.ak); });
    $("anaPick").addEventListener("change", function(){ pick(this.value); });
    var mT = null;
    $("anaMain").addEventListener("click", function(e){
      var c = e.target.closest("[data-per]"); if (c){ period = c.dataset.per; if (period === "pick" && !from){ from = kstDay(29); to = kstDay(0); } loadDetail(); return; }
      var u = e.target.closest("[data-ut]"); if (u){ tab = u.dataset.ut; page = 1; paintMain(); return; }
      var g = e.target.closest("[data-fg]"); if (g){ var k = g.getAttribute("data-fg"); openF[k] = !openF[k]; paintMain(); return; }
      var p = e.target.closest("[data-apg]"); if (p && !p.disabled){ page = Number(p.getAttribute("data-apg")); paintMain(); return; }
      var w = e.target.closest("[data-who]"); if (w){ Members.open(w.getAttribute("data-who")); return; }
      if (e.target.closest("#anaXls")) exportCsv();
    });
    $("anaMain").addEventListener("change", function(e){ if (e.target.id === "anaFrom" || e.target.id === "anaTo"){ from = $("anaFrom").value; to = $("anaTo").value; if (from && to && from > to){ var t = from; from = to; to = t; } loadDetail(); } });
    $("anaMain").addEventListener("input", function(e){
      if (e.target.id !== "anaOrg" && e.target.id !== "anaWho") return;
      var id = e.target.id, pos = e.target.selectionStart; clearTimeout(mT);
      mT = setTimeout(function(){ fOrg = $("anaOrg").value; fWho = $("anaWho").value; page = 1; paintMain(); var el = $(id); if (el){ el.focus(); try { el.setSelectionRange(pos, pos); } catch(er){} } }, 200);
    });
    return { show: show, reset: function(){ stats = null; det = null; logStart = ""; } };
  })();

  SC.ripple(); SC.fab();
  function boot(){
    fetchAuth().then(function(a){
      authInfo = a;
      Auth.boot(function(){                       /* 창구가 없거나 아직 토큰을 옮기기 전: 예전 방식 */
        if (token) enterApp();
        else if (a) showGate("login");
        else showGate("first");
      });
    });
  }
  Route.apply();
  boot();
})();
