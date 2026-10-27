/* 교육 자료실 관리자 — data/videos.json 을 편집해 GitHub에 바로 저장합니다. */
(function(){
  var esc = SC.esc, $ = function(id){ return document.getElementById(id); };
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
    eye:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/></svg>',
    lock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4.5" y="10.5" width="15" height="10" rx="3"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/></svg>',
    refresh:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/></svg>'
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
      $("conn").open = true;
      return fetch("data/videos.json?t=" + Date.now(), { cache:"no-store" })
        .then(function(r){ if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(function(j){ useData(j); updateSaveBar(); })
        .catch(function(){ useData({ site:{}, videos:[] }); updateSaveBar(); });
    }
    return gh("")
      .then(function(info){
        branch = info.default_branch || "main";
        if (info.permissions && info.permissions.push === false) throw Object.assign(new Error("no push"), { status:403 });
        return gh("/contents/data/videos.json?ref=" + encodeURIComponent(branch)).catch(function(e){ if (e.status === 404) return null; throw e; });
      })
      .then(function(file){
        if (file){ sha = file.sha; useData(JSON.parse(b64dec(file.content))); }
        else { sha = null; useData({ site:{ title:"교육 자료실" }, videos:[] }); }
        canSave = true; setConn("ok", "연결됨", "저장소 " + owner + "/" + repo);
        lastUpdate(); Deploy.start();
        if (apiKey) data.videos.forEach(function(v){ v.files.forEach(function(f){ if (f.link.trim()) fetchFile(f, true); }); });
        /* 강의별 공유 페이지·메뉴 주소가 아직 없으면 저장 한 번으로 만들 수 있게 안내 */
        var pages = data.videos.filter(function(v){ return v.id && v.visible !== false; }).map(function(v){ return "v/" + v.id + "/index.html"; })
          .concat(SC.CATS.map(function(c){ return c.id + "/index.html"; }));
        Promise.all(pages.map(function(u){
          return fetch(u + "?chk=" + Date.now(), { method:"HEAD", cache:"no-store" }).then(function(r){ return r.ok; }).catch(function(){ return true; });
        })).then(function(ok){
          if (ok.some(function(x){ return !x; })){
            dirty = true; updateSaveBar();
            $("saveText").textContent = "메뉴 주소와 카톡 공유 미리보기를 만들려면 저장을 한 번 눌러 주세요";
          }
        });
        $("conn").open = false; updateSaveBar();
      })
      .catch(function(e){
        $("conn").open = true;
        if (e.status === 401){ clearSession(); showGate(authInfo ? "change" : "first", "저장된 토큰이 만료됐거나 지워졌어요. 새 토큰을 넣어 주세요."); return; }
        else if (e.status === 403) setConn("bad", "권한 없음", "토큰에 쓰기 권한이 없어요.");
        else if (e.status === 404) setConn("bad", "저장소 없음", "저장소를 찾을 수 없어요. 토큰의 저장소 선택을 확인해 주세요.");
        else setConn("bad", "연결 안 됨", "연결하지 못했어요. 인터넷 연결을 확인해 주세요.");
        return fetch("data/videos.json?t=" + Date.now()).then(function(r){ return r.ok ? r.json() : { site:{}, videos:[] }; })
          .catch(function(){ return { site:{}, videos:[] }; })
          .then(function(j){ useData(j); updateSaveBar(); });
      });
  }

  function useData(j){
    data = { site: j.site || {}, videos: (j.videos || []).map(function(v){
      return {
        id: v.id || "", _url: v.id ? "https://youtu.be/" + v.id : "", title: v.title || "", channel: v.channel || "",
        description: v.description || "", duration: v.duration || "", date: v.date || "", _st: v.id ? "ok" : "",
        category: SC.catOf(v), visible: v.visible !== false,
        files: (v.files || []).map(function(f){ return { name: f.name || "", type: f.type || "", link: f.link || "", size: f.size || "", _st: "" }; })
      };
    }) };
    /* 사이트 이름 변경: 시그니처클래스 → 영개파 (저장하면 사이트에 반영) */
    var renamed = false;
    if (/^\s*시그니처클래스\s*교육\s*자료실\s*$/.test(data.site.title || "")){ data.site.title = "영개파 교육 자료"; renamed = true; }
    /* 고지 문구를 디자인팀 새 문구로 (예전 기본 문구였거나 비어 있으면) */
    var nt = SC.noticeText(data.site.notice);
    if (nt !== (data.site.notice || "")){ data.site.notice = nt; renamed = true; }
    document.querySelectorAll("[data-site]").forEach(function(el){ el.value = data.site[el.dataset.site] || ""; });
    openV = null; dirty = renamed; render();
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
                   duration: fmtDur(it.contentDetails.duration), date: (it.snippet.publishedAt || "").slice(0, 10), full: true };
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
      if (m.full){ v.description = m.description; v.duration = m.duration; if (m.date) v.date = m.date; }
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
    p.push('<span class="bdg cat dim">' + esc(SC.catLabel(SC.catOf(v))) + '</span>');
    if (!v.id){ p.push('<span class="bdg new dim">새 강의</span>'); return p.join(""); }
    var n = v.files.length, miss = v.files.filter(function(f){ return !SC.download(f.link, f.type).url; }).length;
    if (v.duration) p.push('<span class="bdg dim">' + esc(v.duration) + '</span>');
    p.push(n ? '<span class="bdg files dim">자료 ' + n + '개</span>' : '<span class="bdg dim">자료 없음</span>');
    if (miss) p.push('<span class="bdg miss dim">링크 없음 ' + miss + '</span>');
    return p.join("");
  }
  function seg(act, i, val, on, label, icon){
    return '<button type="button" class="seg rp" role="radio" aria-checked="' + on + '" data-act="' + act + '" data-i="' + i + '" data-val="' + val + '">' + (icon || "") + esc(label) + '</button>';
  }
  function itemHtml(v, i){
    var open = v === openV, id = "v" + i, pub = v.visible !== false, cat = SC.catOf(v);
    var row = '<div class="vrow" data-act="toggle" data-i="' + i + '">' +
      '<button type="button" class="grip" aria-label="끌어서 순서 바꾸기" title="끌어서 순서 바꾸기">' + IC.grip + '</button>' +
      (v.id ? '<div class="vthumb dim">' + SC.thumbImg(v.id) + '</div>' : '<div class="vthumb blank dim">영상 없음</div>') +
      '<div class="vtext"><h3 class="dim">' + esc(v.title || "제목 없음") + '</h3><div class="badges">' + badges(v) + '</div></div>' +
      '<button type="button" class="vs" role="switch" aria-checked="' + pub + '" data-act="vis" data-i="' + i + '" aria-label="사이트에 공개">' +
        '<span class="vs-track"><span class="vs-knob"></span></span><span class="vs-t">' + (pub ? "공개" : "비공개") + '</span></button>' +
      '<button type="button" class="vexp" data-act="toggle" data-i="' + i + '" aria-expanded="' + open + '" aria-label="' + (open ? "접기" : "펼쳐서 고치기") + '">' + IC.down + '</button>' +
      '</div>';
    var attrs = ' data-v="' + i + '" data-vis="' + pub + '"';
    if (!open) return '<li class="vitem"' + attrs + '>' + row + '</li>';

    var files = v.files.map(function(f, j){
      var t = f.type || SC.splitName(f.name).type || "pdf";
      return '<div class="frow">' +
        '<button type="button" class="grip" aria-label="끌어서 순서 바꾸기" title="끌어서 순서 바꾸기">' + IC.grip + '</button>' +
        '<div class="fmain">' +
          '<div class="fhead" id="' + id + 'f' + j + 'n">' +
            '<span class="ftype ' + ({ pdf:"pdf", xlsx:"xlsx", pptx:"pptx", docx:"docx", hwp:"hwp" }[t] || "etc") + '">' + SC.typeLabel(t) + '</span>' +
            '<div class="fname">' + (f.name ? '<strong>' + esc(f.name) + '</strong>' + (f.size ? '<span>' + esc(f.size) + '</span>' : '') : '<span class="ph">드라이브 링크를 넣으면 파일 이름이 자동으로 들어가요</span>') + '</div>' +
          '</div>' +
          '<input type="url" id="' + id + 'f' + j + 'l" class="in mono" data-i="' + i + '" data-f="' + j + '" data-fk="link" value="' + esc(f.link) + '" placeholder="구글드라이브 공유 링크" aria-label="자료 ' + (j+1) + ' 드라이브 링크" autocomplete="off">' +
          '<div class="fstat" id="' + id + 'f' + j + 's">' + fileStatus(f) + '</div>' +
        '</div>' +
        '<button type="button" class="fdel rp" data-act="fdel" data-i="' + i + '" data-f="' + j + '" aria-label="자료 ' + (j+1) + ' 빼기" title="자료 빼기">' + IC.del + '</button>' +
      '</div>';
    }).join("");

    var delBtn = armedDel === v
      ? '<span class="del-ask">정말 삭제할까요?<button type="button" class="del-yes rp" data-act="delYes" data-i="' + i + '">정말 삭제</button><button type="button" class="del-no rp" data-act="delNo">취소</button></span>'
      : '<button type="button" class="del-btn rp" data-act="del" data-i="' + i + '">' + IC.del + '강의 삭제</button>';

    var body = '<div class="vbody">' +
      '<div class="f"><span class="lbl" id="' + id + 'visL">공개 설정</span>' +
        '<div class="segs" role="radiogroup" aria-labelledby="' + id + 'visL">' +
          seg("visSet", i, "1", pub, "공개", IC.eye) + seg("visSet", i, "0", !pub, "비공개", IC.lock) + '</div>' +
        '<span class="help">비공개로 하면 사이트 목록과 강의 주소에서 숨겨져요. 영상과 자료는 그대로 남아 있어서 언제든 다시 공개할 수 있어요.</span></div>' +
      '<div class="f"><span class="lbl" id="' + id + 'catL">메뉴</span>' +
        '<div class="segs" role="radiogroup" aria-labelledby="' + id + 'catL">' +
          SC.CATS.map(function(c){ return seg("cat", i, c.id, c.id === cat, c.label); }).join("") + '</div></div>' +
      '<div class="f"><label for="' + id + 'url">유튜브 영상 주소</label>' +
        '<input type="url" id="' + id + 'url" class="in mono" data-i="' + i + '" data-k="_url" value="' + esc(v._url) + '" placeholder="https://youtu.be/… 또는 https://www.youtube.com/watch?v=…" autocomplete="off">' +
        '<div class="url-row">' + videoStatus(v) + (v.id ? '<button type="button" class="btn-soft rp press" data-act="refetch" data-i="' + i + '">' + IC.refresh + '유튜브에서 다시 가져오기</button>' : '') + '</div></div>' +
      '<div class="f"><label for="' + id + 'title">제목</label><input type="text" id="' + id + 'title" class="in" data-i="' + i + '" data-k="title" value="' + esc(v.title) + '"></div>' +
      '<div class="f"><label for="' + id + 'desc">강의 소개</label><textarea id="' + id + 'desc" class="in" rows="5" data-i="' + i + '" data-k="description">' + esc(v.description) + '</textarea>' +
        '<span class="help">유튜브 영상 설명이 자동으로 들어가요. 고쳐도 돼요.</span></div>' +
      '<div class="fileset"><div class="fileset-h"><span class="lbl">교육자료 <span class="num">' + v.files.length + '</span>개</span>' +
        '<span class="help">드라이브에서 파일 우클릭 → 공유 → ‘링크가 있는 모든 사용자’ → 링크 복사</span></div>' +
        '<div class="fsort" data-i="' + i + '">' + files + '</div>' +
        '<div><button type="button" class="btn-soft rp press" data-act="addFile" data-i="' + i + '">' + IC.plus + '자료 추가</button></div></div>' +
      '<div class="vfoot">' + (v.id && pub ? '<a class="site-link rp" href="v/' + esc(v.id) + '/" target="_blank" rel="noopener">사이트에서 보기 ↗</a>' : '<span></span>') +
        delBtn + '</div>' +
    '</div>';
    return '<li class="vitem open"' + attrs + '>' + row + body + '</li>';
  }
  function render(){
    var a = document.activeElement, fid = a && a.id, s0 = a && a.selectionStart, s1 = a && a.selectionEnd;
    var V = data.videos, on = V.filter(function(v){ return v.visible !== false; }).length;
    $("count").textContent = V.length ? V.length : "";
    $("visCount").textContent = V.length ? "공개 " + on + " · 비공개 " + (V.length - on) : "";
    $("videos").innerHTML = V.length ? V.map(function(v, i){ return itemHtml(v, i); }).join("") :
      '<li class="empty-list">아직 강의가 없어요. ‘강의 추가’를 눌러 첫 강의를 넣어 주세요.</li>';
    if (fid && $(fid)){ var el = $(fid); el.focus(); try { if (s0 != null) el.setSelectionRange(s0, s1); } catch(e){} }
    initSort();
  }

  /* ---------- 끌어서 순서 바꾸기 (마우스·터치 모두) ---------- */
  function move(arr, from, to){ arr.splice(to, 0, arr.splice(from, 1)[0]); }
  function makeSortable(container, itemSel, onMove){
    if (container._sortable) return; container._sortable = true;
    container.addEventListener("pointerdown", function(e){
      var grip = e.target.closest(".grip"); if (!grip || e.button > 0) return;
      var item = grip.closest(itemSel); if (!item || item.parentElement !== container) return;
      var items = Array.prototype.filter.call(container.children, function(el){ return el.matches(itemSel); });
      if (items.length < 2) return;
      e.preventDefault();
      var sy = window.scrollY, from = items.indexOf(item), to = from;
      var R = items.map(function(el){ var r = el.getBoundingClientRect(); return { top: r.top + sy, h: r.height }; });
      var gap = R[1].top - (R[0].top + R[0].h), step = R[from].h + gap;
      var startY = e.clientY + sy, lastY = e.clientY, raf = null;
      item.classList.add("dragging");
      try { grip.setPointerCapture(e.pointerId); } catch(er){}
      items.forEach(function(el){ if (el !== item) el.style.transition = "transform .18s ease"; });
      function update(){
        var py = lastY + window.scrollY, dy = py - startY;
        item.style.transform = "translateY(" + dy + "px)";
        var center = R[from].top + R[from].h / 2 + dy;
        to = from;
        for (var k = 0; k < items.length; k++){
          if (k === from) continue;
          var mid = R[k].top + R[k].h / 2;
          if (k > from && center > mid) to = Math.max(to, k);
          if (k < from && center < mid) to = Math.min(to, k);
        }
        items.forEach(function(el, k){
          if (el === item) return;
          var sh = (k > from && k <= to) ? -step : (k < from && k >= to) ? step : 0;
          el.style.transform = sh ? "translateY(" + sh + "px)" : "";
        });
      }
      function autoscroll(){
        var edge = 70, v = lastY < edge ? -(edge - lastY) / 4 : lastY > innerHeight - 110 ? (lastY - (innerHeight - 110)) / 4 : 0;
        if (v){ window.scrollBy(0, v); update(); }
        raf = requestAnimationFrame(autoscroll);
      }
      raf = requestAnimationFrame(autoscroll);
      function onMoveEv(ev){ lastY = ev.clientY; update(); }
      function onUp(){
        cancelAnimationFrame(raf);
        grip.removeEventListener("pointermove", onMoveEv); grip.removeEventListener("pointerup", onUp); grip.removeEventListener("pointercancel", onUp);
        items.forEach(function(el){ el.style.transform = ""; el.style.transition = ""; });
        item.classList.remove("dragging");
        if (to !== from) onMove(from, to);
      }
      grip.addEventListener("pointermove", onMoveEv); grip.addEventListener("pointerup", onUp); grip.addEventListener("pointercancel", onUp);
    });
  }
  function initSort(){
    makeSortable($("videos"), ".vitem", function(a, b){ move(data.videos, a, b); markDirty(); render(); });
    document.querySelectorAll(".fsort").forEach(function(box){
      makeSortable(box, ".frow", function(a, b){ var v = data.videos[+box.dataset.i]; if (!v) return; move(v.files, a, b); markDirty(); render(); });
    });
  }

  /* ---------- 저장 바 ---------- */
  function markDirty(){ dirty = true; updateSaveBar(); }
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
          duration: v.duration, date: v.date || SC.today(), category: SC.catOf(v), visible: v.visible !== false,
          files: v.files.filter(function(f){ return f.link.trim(); }).map(function(f){
            var sn = SC.splitName(f.name), d = SC.download(f.link, sn.type || f.type);
            var t = sn.type || f.type || ({ gdoc:"pdf", gsheet:"xlsx", gslide:"pptx" }[d.kind]) || "pdf";
            return { name: sn.name || "자료", type: t, link: f.link.trim(), size: f.size || "" };
          })
        };
      })
    };
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
    var title = v.title || site.title || "교육 자료실";
    var meta =
      '<base href="../../">\n' +
      '<meta property="og:title" content="' + attr(title) + '">\n' +
      '<meta property="og:description" content="' + attr(desc) + '">\n' +
      '<meta property="og:image" content="' + attr(thumb) + '">\n' +
      '<meta property="og:url" content="' + attr(url) + '">\n' +
      '<meta property="og:type" content="video.other">\n' +
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
  function builtPages(tpl, out, thumbs){
    var list = [];
    out.videos.forEach(function(v, k){
      if (v.visible === false) return;
      list.push({ path:"v/" + v.id + "/index.html", mode:"100644", type:"blob", content: sharePage(tpl, v, out.site, thumbs[k]) });
    });
    SC.CATS.forEach(function(c){ list.push({ path: c.id + "/index.html", mode:"100644", type:"blob", content: catPage(tpl, c) }); });
    return list;
  }
  function staleShare(remote, list){
    var keep = {}; list.forEach(function(x){ keep[x.path] = true; });
    return Object.keys(remote).filter(function(p){ return /^v\/[\w-]+\/index\.html$/.test(p) && !keep[p]; })
      .map(function(p){ return { path:p, mode:"100644", type:"blob", sha:null }; });
  }

  function save(){
    if (!canSave || saving) return;
    var blank = data.videos.filter(function(v){ return !v.id; }).length;
    var out = cleanData(), json = JSON.stringify(out, null, 2) + "\n";
    var first = out.videos[0];
    saving = true; updateSaveBar();
    var head, baseTree, remote = {}, newSha, newCommit = {};
    Promise.all([
      gh("/git/ref/heads/" + encodeURIComponent(branch)).then(function(ref){ head = ref.object.sha; return gh("/git/commits/" + head); })
        .then(function(c){ baseTree = c.tree.sha; return gh("/git/trees/" + baseTree + "?recursive=1"); })
        .then(function(t){ (t.tree || []).forEach(function(e){ if (e.type === "blob") remote[e.path] = e.sha; }); }),
      fetch("index.html?tpl=" + Date.now(), { cache:"no-store" }).then(function(r){ if (!r.ok) throw new Error("tpl"); return r.text(); }),
      Promise.all(out.videos.map(function(v){ return bestThumb(v.id); })),
      gitSha(json)
    ]).then(function(r){
      var tpl = r[1], thumbs = r[2]; newSha = r[3];
      if (sha && remote["data/videos.json"] && remote["data/videos.json"] !== sha){ throw Object.assign(new Error("conflict"), { status:409 }); }
      var pages = builtPages(tpl, out, thumbs);
      var tree = [{ path:"data/videos.json", mode:"100644", type:"blob", content: json }].concat(pages, staleShare(remote, pages));
      return gh("/git/trees", { method:"POST", body: JSON.stringify({ base_tree: baseTree, tree: tree }) });
    }).then(function(t){
      return gh("/git/commits", { method:"POST", body: JSON.stringify({ message: "자료실 업데이트" + (first ? " · " + first.title.slice(0, 40) : ""), tree: t.sha, parents:[head] }) });
    }).then(function(c){
      newCommit = c;
      return gh("/git/refs/heads/" + encodeURIComponent(branch), { method:"PATCH", body: JSON.stringify({ sha: c.sha }) });
    }).then(function(){
      sha = newSha; saving = false; dirty = false;
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

  $("videos").addEventListener("input", function(e){
    var t = e.target, i = +t.dataset.i, v = data.videos[i]; if (!v) return;
    if (t.dataset.k){
      v[t.dataset.k] = t.value; markDirty();
      if (t.dataset.k === "_url") later(v, function(){ fetchVideo(v); }, 450);
      if (t.dataset.k === "title"){ var h = t.closest(".vitem").querySelector("h3"); if (h) h.textContent = t.value || "제목 없음"; }
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
  });
  $("videos").addEventListener("click", function(e){
    var b = e.target.closest("[data-act]"); if (!b) return;
    var act = b.dataset.act, i = +b.dataset.i, V = data.videos, v = V[i];
    if (act !== "toggle") e.stopPropagation();
    if (act === "toggle"){
      if (b.classList.contains("vrow") && (e.target.closest("button") || e.target.closest("a"))) return;
      openV = (openV === v) ? null : v; armedDel = null; render(); return;
    }
    if (act === "vis"){ v.visible = v.visible === false; markDirty(); render(); toast(v.visible ? "공개로 바꿨어요. 저장하면 사이트에 보여요" : "비공개로 바꿨어요. 저장하면 사이트에서 숨겨져요"); return; }
    if (act === "visSet"){ var nv = b.dataset.val === "1"; if (v.visible !== nv){ v.visible = nv; markDirty(); render(); } return; }
    if (act === "cat"){ if (v.category !== b.dataset.val){ v.category = b.dataset.val; markDirty(); render(); } return; }
    if (act === "up" && i > 0){ V.splice(i - 1, 0, V.splice(i, 1)[0]); markDirty(); }
    else if (act === "down" && i < V.length - 1){ V.splice(i + 1, 0, V.splice(i, 1)[0]); markDirty(); }
    else if (act === "refetch"){ fetchVideo(v, true); v.files.forEach(function(f){ if (f.link.trim()) fetchFile(f); }); return; }
    else if (act === "addFile"){ v.files.push({ name:"", type:"", link:"", size:"", _st:"" }); markDirty(); render(); var el = $("v" + i + "f" + (v.files.length - 1) + "l"); if (el) el.focus(); return; }
    else if (/^f(up|down|del)$/.test(act)){
      var j = +b.dataset.f, F = v.files;
      if (act === "fup" && j > 0) F.splice(j - 1, 0, F.splice(j, 1)[0]);
      else if (act === "fdown" && j < F.length - 1) F.splice(j + 1, 0, F.splice(j, 1)[0]);
      else if (act === "fdel") F.splice(j, 1);
      markDirty();
    }
    else if (act === "del"){ armedDel = v; }
    else if (act === "delNo"){ armedDel = null; }
    else if (act === "delYes"){ V.splice(i, 1); armedDel = null; openV = null; markDirty(); toast("강의를 뺐어요. 저장을 눌러야 사이트에서도 빠져요"); }
    render();
  });
  $("videos").addEventListener("keydown", function(e){
    /* 공개 설정·메뉴: 화살표 키로 고르기 */
    if (/^Arrow(Left|Right)$/.test(e.key) && e.target.getAttribute("role") === "radio"){
      var sib = e.key === "ArrowRight" ? e.target.nextElementSibling : e.target.previousElementSibling;
      if (sib){ e.preventDefault(); var keep = sib.dataset; sib.click(); var again = document.querySelector('.seg[data-act="' + keep.act + '"][data-i="' + keep.i + '"][data-val="' + keep.val + '"]'); if (again) again.focus(); }
    }
  });
  $("addVideo").addEventListener("click", function(){
    var v = { id:"", _url:"", title:"", channel:"", description:"", duration:"", date:"", _st:"", category:"signature", visible:true, files:[{ name:"", type:"", link:"", size:"", _st:"" }] };
    data.videos.unshift(v); openV = v; armedDel = null; render();
    var el = $("v0url"); if (el){ el.focus(); el.scrollIntoView({ block:"center", behavior:"smooth" }); }
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
        ? '폴더: <b>' + esc(dirHandle.name) + '</b> <button type="button" class="linkbtn" id="updChange">바꾸기</button>'
        : (canFS ? '처음 한 번 <b>sdp_edu</b> 폴더를 고르면 다음부터는 버튼만 누르면 돼요.' : '누를 때마다 <b>sdp_edu</b> 폴더를 골라 주세요.');
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
      btn.disabled = b;
      btn.innerHTML = b ? '<span class="spin" aria-hidden="true"></span> ' + esc(label || "업데이트 중") : "지금 업데이트";
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
            var built = builtPages(tpl, out, th);
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
          log('<span class="pill ok">' + changed.length + '개 올림</span> ' + esc(names.slice(0, 3).join(", ")) + (names.length > 3 ? " 외 " + (names.length - 3) + "개" : ""));
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
      var li = $("updLog").lastElementChild || log(""), base = li.innerHTML;
      function show(h){ li.innerHTML = base + ' <span aria-hidden="true">·</span> ' + h; }
      show('<span class="spin" aria-hidden="true"></span> 사이트에 반영하는 중 (보통 1~2분)');
      var started = Date.now();
      return new Promise(function(res){
        function check(){
          Promise.all(changed.map(function(x){
            return fetch(x.path + "?live=" + Date.now(), { cache:"no-store" }).then(function(r){ return r.ok ? r.arrayBuffer().then(blobSha) : ""; }).catch(function(){ return ""; })
              .then(function(sha){ return sha === x.sha; });
          })).then(function(ok){
            var done = ok.filter(Boolean).length;
            if (done === changed.length){
              show('<span class="pill ok">반영 완료</span> <button type="button" class="linkbtn" id="updReload">새로고침</button>');
              $("updReload").onclick = function(){ location.reload(); };
              toast("업데이트가 홈과 관리자에 반영됐어요"); return res();
            }
            if (Date.now() - started > 6 * 60 * 1000){ show('<span class="pill warn">반영이 늦어지고 있어요</span> 몇 분 뒤 새로고침해 보세요'); return res(); }
            show('<span class="spin" aria-hidden="true"></span> 사이트에 반영하는 중 ' + done + '/' + changed.length);
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
    clearSession(); canSave = false; data = { site:{}, videos:[] }; render();
    if (authInfo) showGate("login"); else showGate("first");
  });
  $("changeBtn").addEventListener("click", function(){
    if (dirty){ toast("저장하지 않은 변경이 있어요. 먼저 저장해 주세요"); return; }
    showGate("change");
  });
  $("makePwBtn").addEventListener("click", function(){ showGate("first"); });

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
