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
    refresh:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/></svg>'
  };

  /* ---------- 상태 ---------- */
  var data = { site:{}, videos:[] }, sha = null, branch = "main";
  var token = LS.get("sc-gh-token"), apiKey = LS.get("sc-api-key");
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
  $("ghToken").value = token; $("apiKey").value = apiKey;

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

  function setConn(cls, text){ var p = $("connState"); p.className = "pill " + cls; p.textContent = text; }

  function load(){
    canSave = false; updateSaveBar("불러오는 중…");
    if (!token){
      setConn("warn", "토큰 없음 · 보기만 가능");
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
        canSave = true; setConn("ok", "연결됨 · " + owner + "/" + repo);
        $("conn").open = false; updateSaveBar();
      })
      .catch(function(e){
        $("conn").open = true;
        if (e.status === 401) setConn("bad", "토큰이 맞지 않아요");
        else if (e.status === 403) setConn("bad", "토큰에 쓰기 권한이 없어요");
        else if (e.status === 404) setConn("bad", "저장소를 찾을 수 없어요 · 토큰의 저장소 선택을 확인해 주세요");
        else setConn("bad", "연결하지 못했어요");
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
        files: (v.files || []).map(function(f){ return { name: f.name || "", type: f.type || "", link: f.link || "", size: f.size || "", _st: "" }; })
      };
    }) };
    document.querySelectorAll("[data-site]").forEach(function(el){ el.value = data.site[el.dataset.site] || ""; });
    openV = null; dirty = false; render();
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
  function fetchFile(f){
    var id = SC.driveId(f.link);
    if (!apiKey || !id){ render(); return; }
    f._st = "loading"; render();
    fetch("https://www.googleapis.com/drive/v3/files/" + id + "?fields=name,size,mimeType&supportsAllDrives=true&key=" + encodeURIComponent(apiKey))
      .then(function(r){ if (!r.ok) throw Object.assign(new Error(r.status), { status:r.status }); return r.json(); })
      .then(function(j){
        f.size = fmtSize(j.size);
        if (!f.type && MIME[j.mimeType]) f.type = MIME[j.mimeType];
        if (!f.name.trim() && j.name){ var sn = SC.splitName(j.name); f.name = sn.name; if (sn.type) f.type = sn.type; }
        f._st = "ok"; markDirty(); render();
      })
      .catch(function(e){ f._st = (e.status === 404 || e.status === 403) ? "private" : ""; render(); });
  }

  /* ---------- 화면 ---------- */
  function fileStatus(f){
    var sn = SC.splitName(f.name), d = SC.download(f.link, sn.type || f.type);
    if (!f.link.trim()) return '<span class="pill idle">드라이브 링크를 넣어 주세요</span>';
    if (d.kind === "folder") return '<span class="pill bad">폴더 링크예요. 파일 하나의 링크를 넣어 주세요</span>';
    if (d.kind === "bad") return '<span class="pill bad">링크 형식을 확인해 주세요</span>';
    if (f._st === "private") return '<span class="pill bad">공유 설정을 ‘링크가 있는 모든 사용자’로 바꿔 주세요</span>';
    var s = d.kind === "other" ? '<span class="pill warn">드라이브 링크가 아니에요. 그대로 연결돼요</span>' : '<span class="pill ok">바로 다운로드 링크로 바뀌었어요</span>';
    if (f._st === "loading") s += '<span>용량 확인 중…</span>';
    else if (f.size) s += '<span>용량 <b>' + esc(f.size) + '</b></span>';
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
  function headPills(v){
    if (!v.id) return '<span class="pill idle">새 강의</span>';
    var n = v.files.length, miss = v.files.filter(function(f){ return !SC.download(f.link, f.type).url; }).length;
    var p = [];
    if (v.duration) p.push('<span class="pill idle">' + esc(v.duration) + '</span>');
    p.push(n ? (miss ? '<span class="pill warn">자료 ' + n + '개 · 링크 없음 ' + miss + '</span>' : '<span class="pill ok">자료 ' + n + '개</span>') : '<span class="pill warn">자료 없음</span>');
    return p.join("");
  }
  function itemHtml(v, i, n){
    var open = v === openV, id = "v" + i;
    var head = '<div class="vhead" data-act="toggle" data-i="' + i + '" role="button" tabindex="0" aria-expanded="' + open + '">' +
      (v.id ? '<div class="thumb">' + SC.thumbImg(v.id) + '</div>' : '<div class="thumb blank">영상 없음</div>') +
      '<div style="min-width:0"><h3>' + esc(v.title || "제목 없음") + '</h3><div class="sub">' + headPills(v) + '</div></div>' +
      '<div class="vtools">' +
        '<button type="button" class="icon-btn" data-act="up" data-i="' + i + '" aria-label="위로"' + (i === 0 ? " disabled" : "") + '>' + IC.up + '</button>' +
        '<button type="button" class="icon-btn" data-act="down" data-i="' + i + '" aria-label="아래로"' + (i === n - 1 ? " disabled" : "") + '>' + IC.down + '</button>' +
      '</div></div>';
    if (!open) return '<div class="vitem" data-v="' + i + '">' + head + '</div>';

    var files = v.files.map(function(f, j){
      return '<div class="frow">' +
        '<div class="inputs">' +
          '<input type="text" id="' + id + 'f' + j + 'n" data-i="' + i + '" data-f="' + j + '" data-fk="name" value="' + esc(f.name) + '" placeholder="자료 이름 (예: 실전 활용 화법집)" aria-label="자료 ' + (j+1) + ' 이름">' +
          '<input type="url" id="' + id + 'f' + j + 'l" class="mono" data-i="' + i + '" data-f="' + j + '" data-fk="link" value="' + esc(f.link) + '" placeholder="구글드라이브 공유 링크" aria-label="자료 ' + (j+1) + ' 드라이브 링크" autocomplete="off">' +
          '<div class="stat" id="' + id + 'f' + j + 's">' + fileStatus(f) + '</div>' +
        '</div>' +
        '<div class="tools">' +
          '<button type="button" class="icon-btn" data-act="fup" data-i="' + i + '" data-f="' + j + '" aria-label="위로"' + (j === 0 ? " disabled" : "") + '>' + IC.up + '</button>' +
          '<button type="button" class="icon-btn" data-act="fdown" data-i="' + i + '" data-f="' + j + '" aria-label="아래로"' + (j === v.files.length - 1 ? " disabled" : "") + '>' + IC.down + '</button>' +
          '<button type="button" class="icon-btn" data-act="fdel" data-i="' + i + '" data-f="' + j + '" aria-label="자료 ' + (j+1) + ' 빼기">' + IC.del + '</button>' +
        '</div></div>';
    }).join("");

    var delBtn = armedDel === v
      ? '<button type="button" class="btn sm danger" data-act="delYes" data-i="' + i + '">정말 삭제</button><button type="button" class="btn sm ghost" data-act="delNo">취소</button>'
      : '<button type="button" class="btn sm ghost" data-act="del" data-i="' + i + '">' + IC.del + '강의 삭제</button>';

    var body = '<div class="vbody">' +
      '<div class="f"><label for="' + id + 'url">유튜브 영상 주소</label>' +
        '<input type="url" id="' + id + 'url" class="mono" data-i="' + i + '" data-k="_url" value="' + esc(v._url) + '" placeholder="https://youtu.be/… 또는 https://www.youtube.com/watch?v=…" autocomplete="off">' +
        '<div class="row">' + videoStatus(v) + (v.id ? '<button type="button" class="btn sm ghost" data-act="refetch" data-i="' + i + '">' + IC.refresh + '유튜브에서 다시 가져오기</button>' : '') + '</div></div>' +
      '<div class="f"><label for="' + id + 'title">제목</label><input type="text" id="' + id + 'title" data-i="' + i + '" data-k="title" value="' + esc(v.title) + '"></div>' +
      '<div class="f"><label for="' + id + 'desc">강의 소개</label><textarea id="' + id + 'desc" rows="5" data-i="' + i + '" data-k="description">' + esc(v.description) + '</textarea>' +
        '<span class="help">유튜브 영상 설명이 자동으로 들어가요. 고쳐도 돼요.</span></div>' +
      '<div class="fileset"><span class="lbl">교육자료</span>' +
        '<span class="help" style="font-size:12.5px;color:var(--ink-3)">드라이브에서 파일 우클릭 → 공유 → ‘링크가 있는 모든 사용자’로 바꾸고 → 링크 복사</span>' +
        files +
        '<div class="row"><button type="button" class="btn sm ghost" data-act="addFile" data-i="' + i + '">' + IC.plus + '자료 추가</button></div></div>' +
      '<div class="vfoot">' + (v.id ? '<a class="site-link" href="./?v=' + esc(v.id) + '" target="_blank" rel="noopener">사이트에서 보기 ↗</a>' : '<span></span>') +
        '<div class="row">' + delBtn + '</div></div>' +
    '</div>';
    return '<div class="vitem open" data-v="' + i + '">' + head + body + '</div>';
  }
  function render(){
    var a = document.activeElement, fid = a && a.id, s0 = a && a.selectionStart, s1 = a && a.selectionEnd;
    var V = data.videos;
    $("count").textContent = V.length ? V.length : "";
    $("videos").innerHTML = V.length ? V.map(function(v, i){ return itemHtml(v, i, V.length); }).join("") :
      '<p class="empty-list">아직 강의가 없어요. ‘강의 추가’를 눌러 첫 강의를 넣어 주세요.</p>';
    if (fid && $(fid)){ var el = $(fid); el.focus(); try { if (s0 != null) el.setSelectionRange(s0, s1); } catch(e){} }
  }

  /* ---------- 저장 바 ---------- */
  function markDirty(){ dirty = true; updateSaveBar(); }
  function updateSaveBar(msg){
    var m = $("saveMsg"), b = $("saveBtn");
    if (msg){ m.textContent = msg; b.disabled = true; return; }
    if (!canSave){ m.innerHTML = token ? "저장소에 연결되지 않았어요" : "<b>GitHub 토큰</b>을 넣어야 저장할 수 있어요"; b.disabled = true; return; }
    if (saving){ m.textContent = "저장하는 중…"; b.disabled = true; return; }
    m.innerHTML = dirty ? "<b>저장하지 않은 변경</b>이 있어요" : "모든 변경이 저장됐어요";
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
          duration: v.duration, date: v.date || SC.today(),
          files: v.files.filter(function(f){ return f.name.trim() || f.link.trim(); }).map(function(f){
            var sn = SC.splitName(f.name), d = SC.download(f.link, sn.type || f.type);
            var t = sn.type || f.type || ({ gdoc:"pdf", gsheet:"xlsx", gslide:"pptx" }[d.kind]) || "pdf";
            return { name: sn.name || "자료", type: t, link: f.link.trim(), size: f.size || "" };
          })
        };
      })
    };
  }
  function save(){
    if (!canSave || saving) return;
    var blank = data.videos.filter(function(v){ return !v.id; }).length;
    var out = cleanData(), json = JSON.stringify(out, null, 2) + "\n";
    var first = out.videos[0];
    saving = true; updateSaveBar();
    gh("/contents/data/videos.json", { method:"PUT", body: JSON.stringify({
      message: "자료실 업데이트" + (first ? " · " + first.title.slice(0, 40) : ""),
      content: b64enc(json), branch: branch, sha: sha || undefined
    }) }).then(function(r){
      sha = r.content.sha; saving = false; dirty = false;
      if (blank) data.videos = data.videos.filter(function(v){ return v.id; });
      render(); updateSaveBar();
      toast(blank ? "저장했어요. 유튜브 주소가 없는 강의 " + blank + "개는 빼고 저장했어요" : "저장했어요. 1분쯤 뒤 사이트에 반영돼요");
    }).catch(function(e){
      saving = false; updateSaveBar();
      if (e.status === 409 || e.status === 422) toast("다른 곳에서 먼저 저장됐어요. 새로고침한 뒤 다시 저장해 주세요");
      else if (e.status === 401) toast("토큰이 만료됐거나 맞지 않아요. 연결 설정을 확인해 주세요");
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
        f.size = ""; f._st = "";
        var st = $("v" + i + "f" + t.dataset.f + "s"); if (st) st.innerHTML = fileStatus(f);
        later(f, function(){ fetchFile(f); }, 450);
      }
    }
  });
  $("videos").addEventListener("click", function(e){
    var b = e.target.closest("[data-act]"); if (!b) return;
    var act = b.dataset.act, i = +b.dataset.i, V = data.videos, v = V[i];
    if (act !== "toggle") e.stopPropagation();
    if (act === "toggle"){ if (e.target.closest("button")) return; openV = (openV === v) ? null : v; armedDel = null; render(); return; }
    if (act === "up" && i > 0){ V.splice(i - 1, 0, V.splice(i, 1)[0]); markDirty(); }
    else if (act === "down" && i < V.length - 1){ V.splice(i + 1, 0, V.splice(i, 1)[0]); markDirty(); }
    else if (act === "refetch"){ fetchVideo(v, true); return; }
    else if (act === "addFile"){ v.files.push({ name:"", type:"", link:"", size:"", _st:"" }); markDirty(); render(); var el = $("v" + i + "f" + (v.files.length - 1) + "n"); if (el) el.focus(); return; }
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
    if ((e.key === "Enter" || e.key === " ") && e.target.classList.contains("vhead")){ e.preventDefault(); e.target.click(); }
  });
  $("addVideo").addEventListener("click", function(){
    var v = { id:"", _url:"", title:"", channel:"", description:"", duration:"", date:"", _st:"", files:[{ name:"", type:"", link:"", size:"", _st:"" }] };
    data.videos.unshift(v); openV = v; armedDel = null; render();
    var el = $("v0url"); if (el){ el.focus(); el.scrollIntoView({ block:"center", behavior:"smooth" }); }
  });
  document.querySelectorAll("[data-site]").forEach(function(el){
    el.addEventListener("input", function(){ data.site[el.dataset.site] = el.value; markDirty(); });
  });
  $("saveBtn").addEventListener("click", save);
  document.addEventListener("keydown", function(e){ if ((e.ctrlKey || e.metaKey) && e.key === "s"){ e.preventDefault(); save(); } });

  $("connBtn").addEventListener("click", function(){
    if (dirty && !confirmLeave()) return;
    token = $("ghToken").value.trim(); apiKey = $("apiKey").value.trim();
    LS.set("sc-gh-token", token); LS.set("sc-api-key", apiKey);
    if (!$("repoFields").hidden){ owner = $("ghOwner").value.trim(); repo = $("ghRepo").value.trim(); LS.set("sc-owner", owner); LS.set("sc-repo", repo); }
    load();
  });
  var forgetArmed = false;
  $("forgetBtn").addEventListener("click", function(){
    if (!forgetArmed){ forgetArmed = true; this.textContent = "한 번 더 누르면 지워져요"; return; }
    forgetArmed = false; this.textContent = "이 브라우저에서 지우기";
    LS.set("sc-gh-token", ""); LS.set("sc-api-key", ""); token = ""; apiKey = "";
    $("ghToken").value = ""; $("apiKey").value = ""; toast("이 브라우저에서 토큰과 키를 지웠어요"); load();
  });
  function confirmLeave(){ toast("저장하지 않은 변경이 있어요. 먼저 저장해 주세요"); return false; }
  window.addEventListener("beforeunload", function(e){ if (dirty){ e.preventDefault(); e.returnValue = ""; } });
  window.addEventListener("scroll", function(){ $("topbar").classList.toggle("scrolled", window.scrollY > 4); }, { passive:true });

  load();
})();
