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

  function setConn(cls, text, note){ var p = $("connState"); p.className = "pill " + cls; p.textContent = text; $("connRepo").textContent = note || ""; }

  function load(){
    canSave = false; updateSaveBar("불러오는 중…");
    if (!token){
      setConn("warn", "보기만", "토큰이 없어서 저장할 수 없어요.");
      $("conn").open = true; openSet();
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
        canSave = true; setConn("ok", "연결됨", "저장소 " + owner + "/" + repo);
        lastUpdate(); Deploy.start();
        if (apiKey){
          data.videos.forEach(function(v){ v.files.forEach(function(f){ if (f.link.trim()) fetchFile(f, true); }); });
          rdata.months.forEach(function(m){ m.ages.forEach(function(a){ a.files.forEach(function(f){ if (f.link.trim()) fetchFile(f, true); }); }); });
        }
        /* 강의별 공유 페이지·메뉴 주소가 빠져 있으면 조용히 만들어 둠 (저장 버튼은 건드리지 않음) */
        autoPages();
        Gate.load();
        $("conn").open = false; updateSaveBar();
      })
      .catch(function(e){
        $("conn").open = true; if (e.status !== 401) openSet();
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
        category: SC.catOf(v), visible: v.visible !== false, publishedAt: v.publishedAt || "",
        files: (v.files || []).map(fileIn)
      };
    }) };
    rdata = { months: ((rj && rj.months) || []).map(function(m){
      var mo = { ym: m.ym || "", title: m.title || "", thumb: m.thumb || "", visible: m.visible !== false, ages: [] };
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
  function filesHtml(files, attrs, idp, delAct){
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
        '<div class="ed-sum-t"><span>' + IC.cal + (v.date ? '<span class="nowrap">' + longDate(v.publishedAt || v.date) + ' 업로드</span>' + (v.duration ? ' · <span class="nowrap">' + esc(v.duration) + '</span>' : '') : '유튜브 주소를 넣어 주세요') + '</span>' +
        '<span class="bdg files">자료 ' + n + '개</span></div></div>' +
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
        '<div class="fsort">' + filesHtml(v.files, 'data-i="' + i + '"', id, "fdel") + '</div>' +
        '<div><button type="button" class="btn-soft rp press" data-act="addFile" data-i="' + i + '">' + IC.plus + '자료 추가</button></div></div>' +
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

  /* ---------- ⚙ 설정 창 (#21): 맨 위 바 톱니 버튼 아래에 펼쳐짐 ---------- */
  /* ⚙ 설정 창: 한 칸을 열면 열려 있던 다른 칸은 닫힘 (한 번에 하나만) */
  (function(){
    var sets = document.querySelectorAll("#setPop details.set");
    sets.forEach(function(d){
      d.addEventListener("toggle", function(){
        if (!d.open) return;
        sets.forEach(function(o){ if (o !== d && o.open) o.open = false; });
      });
    });
  })();
  function openSet(){
    if (!$("setPop").hidden) return;
    $("setPop").hidden = false; $("setBtn").setAttribute("aria-expanded", "true");
    SC.lineReveal($("setLr"));
  }
  function closeSet(focusBtn){
    if ($("setPop").hidden) return;
    $("setPop").hidden = true; $("setBtn").setAttribute("aria-expanded", "false");
    if (focusBtn) $("setBtn").focus();
  }
  $("setBtn").addEventListener("click", function(){ $("setPop").hidden ? openSet() : closeSet(); });
  $("setClose").addEventListener("click", function(){ closeSet(true); });
  document.addEventListener("pointerdown", function(e){
    if ($("setPop").hidden || e.target.closest("#setPop") || e.target.closest("#setBtn")) return;
    closeSet();
  });
  SC.themeUI({ ic: $("tmIc") });

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
      closing = setTimeout(finish, 450 + 120 + 20);
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
    if ((opening || swap) && wide.matches){ wrap.style.setProperty("--lr-w", opening ? "220ms" : "0ms"); SC.lineReveal(wrap); }
    edKey = obj;
  }
  function closeEditor(){ openV = openM = openA = null; armedDel = null; render(); }
  $("edClose").addEventListener("click", closeEditor);
  document.addEventListener("keydown", function(e){
    if (e.key !== "Escape" || e.target.closest("select")) return;
    if (!$("setPop").hidden){ closeSet(true); return; }
    if (!$("edWrap").hidden) closeEditor();
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
          (miss ? '<span class="bdg miss dim">링크 없음 ' + miss + '</span>' : '') + '</div></div>' +
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
    var prev = m._new ? prevMonth(m) : null, saved = !m._new && !dirtyMonth(m);
    return '<div class="f"><span class="lbl" id="rm' + mi + 'visL">공개 설정</span>' +
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
        (miss ? '<span class="bdg miss dim">링크 없음 ' + miss + '</span>' : '') + '</div></div>' +
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
        '<div class="fsort">' + filesHtml(a.files, at, idp, "rfdel") + '</div>' +
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
    m.textContent = dirty ? "저장하지 않은 변경이 있어요" : "모든 변경이 저장됐어요";
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
    var first = out.videos[0];
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
      render(); updateSaveBar();
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
        ? '<span class="nowrap">폴더 <b>' + esc(dirHandle.name) + '</b> <button type="button" class="linkbtn" id="updChange">바꾸기</button></span>'
        : (canFS ? '처음 한&nbsp;번 <b>sdp_edu</b> 폴더를 고르면<br>다음부터는 버튼만 누르면 돼요.' : '누를 때마다 <b>sdp_edu</b> 폴더를 골라 주세요.');
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
      btn.innerHTML = b ? '<span class="spin" aria-hidden="true"></span>' + esc(label || "업데이트 중") : "지금 업데이트";
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
    $("lastUpd").textContent = "마지막 업데이트 · " + (d.getMonth() + 1) + "월 " + d.getDate() + "일 " + z(d.getHours()) + ":" + z(d.getMinutes());
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
  function showGate(mode, msg){
    document.body.classList.remove("authed");
    $("loginForm").hidden = mode !== "login"; $("setupForm").hidden = mode === "login";
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
    $("noAuth").hidden = !!authInfo;
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

  $("logoutBtn").addEventListener("click", function(){
    if (dirty){ toast("저장하지 않은 변경이 있어요. 먼저 저장해 주세요"); return; }
    clearSession(); canSave = false; data = { site:{}, videos:[] }; rdata = { months:[] }; openV = openM = openA = null; closeSet(); render();
    if (authInfo) showGate("login"); else showGate("first");
  });
  $("changeBtn").addEventListener("click", function(){
    if (dirty){ toast("저장하지 않은 변경이 있어요. 먼저 저장해 주세요"); return; }
    closeSet(); showGate("change");
  });
  $("makePwBtn").addEventListener("click", function(){ showGate("first"); });

  /* ================= 구글 시트 창구 (기획 P2~P5 공통) · 사번 사이트 계정 (기획 P3 1단계) =================
     - 창구 = 회원 명단 구글 시트에 붙은 Apps Script 웹 앱. 주소는 data/config.json 의 gate 에 둠(비밀 아님)
     - 창구는 관리자가 보낸 GitHub 토큰으로 이 저장소 쓰기 권한을 확인한 뒤에만 대답함
     - 사번 사이트 아이디·비밀번호는 창구의 스크립트 속성에만 저장. 이 화면에는 가린 아이디만 다시 보임 */
  var Gate = (function(){
    var GATE_V = 5; /* 창구 코드(Code.gs) 최신 버전 */
    var CFG = "data/config.json", RE = /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]{20,}\/exec$/;
    var url = "", cfg = {}, csha = null, st = null;
    function call(action, extra){
      var body = { action: action, token: token };
      for (var k in (extra || {})) body[k] = extra[k];
      /* text/plain 으로 보내야 미리 확인 요청 없이 바로 감 (Apps Script 웹 앱 규칙) */
      return fetch(url, { method:"POST", body: JSON.stringify(body), cache:"no-store", redirect:"follow" })
        .then(function(r){ if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); });
    }
    function when(s){
      var m = /^(\d{4})-(\d\d)-(\d\d)T(\d\d):(\d\d)/.exec(s || ""); if (!m) return "";
      return (+m[2]) + "월 " + (+m[3]) + "일 " + m[4] + ":" + m[5];
    }
    function pill(id, cls, text){ var p = $(id); p.className = "pill " + cls; p.textContent = text; }
    function msg(id, cls, text){ var p = $(id); p.className = "set-msg" + (cls ? " " + cls : ""); p.textContent = text || ""; }
    var TEST = {
      ok: ["ok", "접속 성공"],
      badcred: ["bad", "아이디나 비밀번호가 맞지 않아요"],
      denied: ["bad", "사번 사이트가 접속을 막았어요"],
      blocked: ["bad", "PC에서 사번 사이트에 연결할 수 없어요"],
      unknown: ["warn", "접속 결과를 확인하지 못했어요"],
      session: ["warn", "로그인은 됐는데 다음 화면에서 로그인이 풀려요"]
    };
    var waitT = null, keyArmed = false;
    function online(ag){ var m = /^(\d{4})-(\d\d)-(\d\d)T(\d\d):(\d\d):(\d\d)/.exec(ag && ag.seen || ""); if (!m) return false;
      var t = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4] - 9, +m[5], +m[6]); return Date.now() - t < 12 * 60 * 1000; }
    function paint(){
      var on = !!(url && st);
      pill("gateState", on ? "ok" : url ? "warn" : "idle", on ? "연결됨" : url ? "확인 안 됨" : "연결 안 됨");
      $("gateUrl").value = url;
      $("gateConnect").textContent = on ? "다시 연결" : "연결";
      $("gateSheet").hidden = !(on && st.sheet && st.sheet.url);
      if (on && st.sheet) $("gateSheet").href = st.sheet.url;
      var old = on && (st.v || 1) < GATE_V;
      if (old) pill("gateState", "warn", "코드 바꾸기 필요");
      $("gateNote").textContent = old ? "창구 코드가 예전 것(v" + (st.v || 1) + ")이에요. 새 Code.gs로 바꾸고 배포 관리 → 편집 → 새 버전으로 배포해 주세요."
        : on ? "시트 '" + (st.sheet ? st.sheet.name : "") + "'에 연결돼 있어요." : "회원 명단 구글 시트에 붙인 창구(Apps Script)의 웹 앱 주소를 넣고 연결하세요.";
      var a = on && st.account || {};
      pill("acctState", a.saved ? "ok" : "idle", a.saved ? "저장됨" : "저장 안 됨");
      $("acctForm").hidden = !on;
      $("acctTest").disabled = !a.saved;
      if (!on) $("acctNote").textContent = "먼저 구글 시트 창구를 연결해 주세요.";
      else if (!a.saved) $("acctNote").textContent = "아직 저장하지 않았어요. 사번 사이트 아이디와 비밀번호를 적고 저장하세요.";
      else {
        var t = st.lastTest, tt = t && TEST[t.result];
        $("acctNote").textContent = "저장된 아이디 " + a.id + (a.savedAt ? " · " + when(a.savedAt) + " 저장" : "") +
          (tt ? "\n마지막 접속 확인 " + when(t.at) + (t.by === "pc" ? "(PC)" : "") + " · " + tt[1] : "");
      }
      /* PC 매크로 (v5: 사번 사이트는 PC에서만 들어가짐) */
      var ag = on && st.agent || {};
      $("pcBox").hidden = !on;
      var live = online(ag);
      pill("pcState", !ag.has ? "idle" : !ag.seen ? "warn" : live ? "ok" : "idle", !ag.has ? "설치 안 됨" : !ag.seen ? "설치 기다림" : live ? "켜져 있음" : "쉬는 중");
      $("pcNote").textContent = !ag.has ? "사번 사이트는 희수 님 PC에서만 들어가져서, 명단 받기는 PC 매크로가 해요.\n[PC 키 만들기] → 개발팀 폴더 '사번명단_매크로'의 설치.bat 더블클릭 → 키 붙여 넣기."
        : !ag.seen ? "PC 키를 만들었어요(" + when(ag.madeAt) + ").\n설치.bat으로 설치하면 연결돼요."
        : "PC " + (ag.host || "") + " · 마지막 신호 " + when(ag.seen) + (live ? "" : "\n평일 08:35~17:45에 5분마다 신호가 와요.");
      $("pcMake").textContent = keyArmed ? "정말 새로 만들기" : ag.has ? "PC 키 새로 만들기" : "PC 키 만들기";
      $("pcMake").className = (ag.has ? "btn-soft" : "btn-main sm") + " rp press";
    }
    function load(){
      return repoJson(CFG).then(function(f){
        cfg = f ? f.json : {}; csha = f ? f.sha : null; url = cfg.gate || ""; st = null; paint();
        if (url) return refresh();
      }).catch(function(){ paint(); });
    }
    function refresh(){
      pill("gateState", "idle", "확인 중");
      return call("status").then(function(j){
        if (!j.ok){ st = null; paint(); msg("gateMsg", "bad", j.error === "notadmin" ? "이 토큰으로는 창구를 쓸 수 없어요. 저장소 쓰기 권한이 있는 토큰인지 확인해 주세요." : "창구가 대답하지 못했어요. 잠시 뒤 다시 해 주세요."); return; }
        st = j; msg("gateMsg"); paint();
        if (j.testReq){ $("acctTest").disabled = true; $("acctTest").textContent = "PC 기다리는 중…"; msg("acctMsg", "warn", "PC에 접속 확인을 부탁해 둔 상태예요. PC가 켜져 있으면 5분 안에 결과가 나와요."); waitResult(j.testReq, 1); }
      }).catch(function(){ st = null; paint(); msg("gateMsg", "bad", "창구에 연결하지 못했어요. 주소와 배포 설정(액세스: 모든 사용자)을 확인해 주세요."); });
    }
    function connect(){
      var u = $("gateUrl").value.trim(), btn = $("gateConnect");
      if (!canSave){ msg("gateMsg", "bad", "저장소에 연결된 뒤에 할 수 있어요."); return; }
      if (!RE.test(u)){ msg("gateMsg", "bad", "주소를 확인해 주세요. https://script.google.com/macros/s/로 시작하고 /exec로 끝나요."); return; }
      var prev = url; url = u; btn.disabled = true; btn.textContent = "연결하는 중…"; msg("gateMsg");
      call("status").then(function(j){
        if (!j.ok) throw Object.assign(new Error(j.error), { gate: j.error });
        st = j;
        if (cfg.gate === u) return null;
        cfg.gate = u;
        return gh("/contents/" + CFG, { method:"PUT", body: JSON.stringify({
          message: "구글 시트 창구 연결", branch: branch, sha: csha || undefined,
          content: b64enc(JSON.stringify(cfg, null, 2) + "\n")
        }) }).then(function(res){ csha = res.content.sha; if (res.commit) Deploy.expect(res.commit.sha); });
      }).then(function(){
        paint(); msg("gateMsg", "ok", st.sheet && st.sheet.made && st.sheet.made.length ? "연결했어요. 시트에 탭 " + st.sheet.made.length + "개를 만들었어요." : "연결했어요.");
        if (!st.account.saved){ $("acctBox").open = true; }
      }).catch(function(er){
        url = prev; st = prev ? st : null; paint();
        msg("gateMsg", "bad", er.gate === "notadmin" ? "이 토큰으로는 창구를 쓸 수 없어요. 저장소 쓰기 권한이 있는 토큰인지 확인해 주세요."
          : er.gate ? "창구가 대답하지 못했어요(" + er.gate + "). 코드를 다시 붙여 넣었는지 확인해 주세요."
          : er.status ? "주소를 저장하지 못했어요. 잠시 뒤 다시 해 주세요."
          : "창구에 연결하지 못했어요. 주소와 배포 설정(실행: 나 · 액세스: 모든 사용자)을 확인해 주세요.");
      }).then(function(){ btn.disabled = false; if (btn.textContent === "연결하는 중…") btn.textContent = st ? "다시 연결" : "연결"; });
    }
    function save(e){
      e.preventDefault();
      var id = $("acctId").value.trim(), pw = $("acctPw").value, btn = $("acctSave");
      if (!id || !pw){ msg("acctMsg", "bad", "아이디와 비밀번호를 모두 적어 주세요."); return; }
      btn.disabled = true; btn.textContent = "저장하는 중…"; msg("acctMsg");
      call("saveAccount", { id: id, pw: pw }).then(function(j){
        if (!j.ok) throw new Error(j.error);
        st = j; $("acctId").value = ""; $("acctPw").value = ""; paint();
        msg("acctMsg", "ok", "저장했어요. [접속 확인]으로 사번 사이트에 들어가지는지 확인해 보세요.");
      }).catch(function(){ msg("acctMsg", "bad", "저장하지 못했어요. 잠시 뒤 다시 해 주세요."); })
        .then(function(){ btn.disabled = false; btn.textContent = "저장"; });
    }
    /* 접속 확인이 실패하면 단계별 기록을 보여 줌 (비밀번호·쿠키 값·개인정보 없음) */
    function showTrace(j){
      var box = $("acctTrace");
      if (!j || j.result === "ok" || !j.trace){ box.hidden = true; return; }
      var lines = ["결과 " + j.result + (j.msg ? " · " + j.msg : "") + " · " + (j.at || ""),
        "PC " + (st && st.agent && st.agent.host || "?") + " · 창구 v" + (st && st.v || "?")];
      j.trace.forEach(function(t, i){
        if (t.retry){ lines.push((i + 1) + ". 다시 열기 " + t.retry + "번째 → " + t.code + (t.toLogin ? " · 로그인으로 돌려보냄" : " · 열림") + (t.setCookie && t.setCookie.length ? " · 쿠키 " + t.setCookie.join(",") : "") + " · " + t.len + "자"); return; }
        if (t.form){ lines.push((i + 1) + ". 로그인 칸 " + (t.form.found ? "찾음" : "못 찾음") + " · 숨은 값 " + (t.form.hidden.join(",") || "없음")); return; }
        lines.push((i + 1) + ". " + t.m + " " + t.at + " → " + t.code + (t.loc ? " 이동 " + t.loc : "") + (t.js ? " 스크립트 이동 " + t.js : "") +
          (t.setCookie && t.setCookie.length ? " · 쿠키 " + t.setCookie.join(",") : "") + (t.title ? " · 제목 " + t.title : "") +
          " · " + t.len + "자" + (t.loginPage ? " · 로그인 화면" : "") + (t.alert ? " · 안내창 " + t.alert : "") + (t.snip ? " · 내용 " + t.snip : ""));
      });
      $("acctTraceText").textContent = lines.join("\n");
      box.hidden = false; box.open = false;
    }
    /* PC가 보낸 결과 보여 주기 */
    function showResult(){
      var t = st && st.lastTest; if (!t) return;
      var tt = TEST[t.result] || TEST.unknown;
      showTrace({ result: t.result, msg: t.msg, at: t.at, trace: st.lastTrace || [] });
      msg("acctMsg", tt[0], tt[1] + (t.msg ? " · 사번 사이트 안내: " + t.msg : "") + (t.result === "ok" ? "" : " — 아래 '자세히 보기'를 복사해 개발팀에 알려 주세요."));
    }
    /* [접속 확인] → 창구에 부탁 → PC 매크로가 5분 안에 가져가서 확인 → 결과를 기다림 */
    function waitResult(reqAt, n){
      clearTimeout(waitT);
      if (n > 48){ msg("acctMsg", "warn", "아직 PC에서 결과가 오지 않았어요. PC가 켜져 있는지, PC 매크로가 설치돼 있는지 확인해 주세요."); $("acctTest").disabled = false; $("acctTest").textContent = "접속 확인"; return; }
      waitT = setTimeout(function(){
        call("status").then(function(j){
          if (!j.ok) return waitResult(reqAt, n + 1);
          st = j; paint();
          if (!j.testReq && j.lastTest && j.lastTest.at >= reqAt){ showResult(); $("acctTest").disabled = false; $("acctTest").textContent = "접속 확인"; return; }
          waitResult(reqAt, n + 1);
        }).catch(function(){ waitResult(reqAt, n + 1); });
      }, n ? 15000 : 5000);
    }
    function test(){
      var btn = $("acctTest"); btn.disabled = true; btn.textContent = "PC 기다리는 중…"; msg("acctMsg"); $("acctTrace").hidden = true;
      call("testLogin").then(function(j){
        if (!j.ok){
          msg("acctMsg", "bad", j.error === "noaccount" ? "먼저 아이디와 비밀번호를 저장해 주세요." : j.error === "noagent" ? "먼저 아래 'PC 매크로'를 설치해 주세요." : "확인하지 못했어요. 잠시 뒤 다시 해 주세요.");
          btn.disabled = false; btn.textContent = "접속 확인"; if (j.error === "noagent") $("pcBox").open = true; return;
        }
        st = j.status; paint();
        msg("acctMsg", "warn", "PC에 접속 확인을 부탁했어요. PC가 켜져 있으면 5분 안에 결과가 여기에 나와요.");
        waitResult(j.status.testReq, 0);
      }).catch(function(){ msg("acctMsg", "bad", "창구에 연결하지 못했어요. 잠시 뒤 다시 해 주세요."); btn.disabled = false; btn.textContent = "접속 확인"; });
    }
    /* 설치를 기다리며 PC 신호가 오면 바로 '켜져 있음'으로 */
    var agentT = null;
    function watchAgent(n){
      clearTimeout(agentT); if (n > 60) return;
      agentT = setTimeout(function(){
        call("status").then(function(j){
          if (j.ok){ st = j; paint(); if (j.agent && j.agent.seen){ msg("pcMsg", "ok", "PC가 연결됐어요. 설치 창에 나온 접속 확인 결과도 위 '사번 사이트 계정'에 보여요."); if (j.lastTest) showResult(); return; } }
          watchAgent(n + 1);
        }).catch(function(){ watchAgent(n + 1); });
      }, 10000);
    }
    function makeKey(){
      var has = st && st.agent && st.agent.has;
      if (has && !keyArmed){ keyArmed = true; paint(); msg("pcMsg", "warn", "새 키를 만들면 지금 설치된 PC는 새 키로 다시 설치해야 해요. 한 번 더 누르면 만들어요."); return; }
      keyArmed = false;
      var btn = $("pcMake"); btn.disabled = true; msg("pcMsg");
      call("makeAgentKey").then(function(j){
        if (!j.ok) throw new Error(j.error);
        st = j.status; paint();
        $("pcKey").value = j.key; $("pcKeyBox").hidden = false; $("pcKey").select();
        msg("pcMsg", "ok", "PC 키를 만들었어요. [복사] → 설치.bat 실행 → 키 붙여 넣기.");
        watchAgent(0);
      }).catch(function(){ msg("pcMsg", "bad", "키를 만들지 못했어요. 창구 코드가 v5인지 확인해 주세요."); paint(); })
        .then(function(){ btn.disabled = false; });
    }
    $("gateConnect").addEventListener("click", connect);
    $("gateUrl").addEventListener("keydown", function(e){ if (e.key === "Enter"){ e.preventDefault(); connect(); } });
    $("acctForm").addEventListener("submit", save);
    $("acctTest").addEventListener("click", test);
    $("pcMake").addEventListener("click", makeKey);
    $("pcKeyCopy").addEventListener("click", function(){
      SC.copy($("pcKey").value).then(function(){ toast("PC 키를 복사했어요. 설치 창에 붙여 넣으세요"); }, function(){ $("pcKey").select(); toast("복사하지 못했어요. 글자를 길게 눌러 복사해 주세요"); });
    });
    $("acctTraceCopy").addEventListener("click", function(){
      var t = $("acctTraceText").textContent;
      (SC.copy ? SC.copy(t) : navigator.clipboard.writeText(t)).then(function(){ toast("복사했어요. 개발팀 채팅에 붙여 넣으세요"); }, function(){ toast("복사하지 못했어요. 글자를 길게 눌러 복사해 주세요"); });
    });
    paint();
    return { load: load };
  })();

  SC.ripple(); SC.fab();
  function boot(){
    fetchAuth().then(function(a){
      authInfo = a;
      if (token) enterApp();
      else if (a) showGate("login");
      else showGate("first");
    });
  }
  boot();
})();
