(function () {
  "use strict";
  var CATS = ["全部", "AI", "效率", "开发", "学习", "设计", "生活"];
  var cat = "全部";
  var seen = {};
  var current = null;
  var busy = false;

  function $(id) { return document.getElementById(id); }
  function mt() { return window.xhs && window.xhs.miniTool; }

  function fmtStar(n) {
    if (n >= 10000) return (Math.round(n / 1000) / 10) + " 万";
    return String(n);
  }

  function pool() {
    var list = [];
    for (var i = 0; i < REPOS.length; i++) {
      if (cat === "全部" || REPOS[i][1] === cat) list.push(i);
    }
    return list;
  }

  function pick() {
    var list = pool();
    var fresh = [];
    for (var i = 0; i < list.length; i++) if (!seen[list[i]]) fresh.push(list[i]);
    if (!fresh.length) {
      for (var j = 0; j < list.length; j++) delete seen[list[j]];
      fresh = list.slice();
      if (current !== null && fresh.length > 1) {
        fresh = fresh.filter(function (x) { return x !== current; });
      }
    }
    var idx = fresh[Math.floor(Math.random() * fresh.length)];
    seen[idx] = true;
    return idx;
  }

  function updateCount() {
    var list = pool();
    var n = 0;
    for (var i = 0; i < list.length; i++) if (seen[list[i]]) n++;
    $("count").textContent = "本类共 " + list.length + " 个宝藏，已抽到 " + n + " 个";
  }

  function render(idx) {
    var r = REPOS[idx];
    $("cTag").textContent = r[1];
    $("cLic").textContent = r[2] + " 开源";
    $("cName").textContent = r[0];
    $("cDesc").textContent = r[4];
    $("cWho").textContent = r[5];
    $("cStar").textContent = fmtStar(r[3]) + "（截至 " + REPOS_ASOF + "）";
    $("cUrl").textContent = "github.com/" + r[0];
  }

  function vibrate() {
    var m = mt();
    if (m && typeof m.vibrateShort === "function") {
      try { var p = m.vibrateShort({ type: "light" }); if (p && p.catch) p.catch(function () {}); } catch (e) {}
    }
  }

  function draw() {
    if (busy) return;
    busy = true;
    var box = $("box"), card = $("card");
    card.className = "card hidden";
    box.className = "box shake";
    vibrate();
    setTimeout(function () {
      box.className = "box open";
      current = pick();
      render(current);
      setTimeout(function () {
        box.className = "box gone";
        card.className = "card";
        setTimeout(function () { card.className = "card show"; busy = false; }, 20);
        $("draw").textContent = "再抽一个";
        $("save").parentNode.style.display = canSave() ? "block" : "none";
        updateCount();
      }, 300);
    }, 500);
  }

  function canSave() {
    var m = mt();
    return !!(m && typeof m.saveImageToPhotosAlbum === "function");
  }

  function wrap(ctx, text, x, y, maxW, lh, maxLines) {
    var line = "", lines = 0;
    for (var i = 0; i < text.length; i++) {
      var test = line + text[i];
      if (ctx.measureText(test).width > maxW && line) {
        ctx.fillText(line, x, y); y += lh; lines++; line = text[i];
        if (lines >= maxLines - 1) { break; }
      } else line = test;
    }
    if (lines < maxLines) { ctx.fillText(line, x, y); y += lh; }
    return y;
  }

  function cardImage() {
    var r = REPOS[current];
    var cv = $("cv"), ctx = cv.getContext("2d");
    var F = '-apple-system,"PingFang SC","Microsoft YaHei",sans-serif';
    ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, 1080, 1440);
    ctx.fillStyle = "#1E63D6"; ctx.fillRect(0, 0, 1080, 220);
    ctx.fillStyle = "#ffffff"; ctx.font = "bold 76px " + F; ctx.fillText("GitHub宝藏盲盒", 80, 140);
    ctx.fillStyle = "#1E63D6"; ctx.font = "bold 40px " + F; ctx.fillText("我抽到了 · " + r[1], 80, 330);
    ctx.fillStyle = "#111827"; ctx.font = "bold 66px " + F;
    var y = wrap(ctx, r[0], 80, 440, 920, 84, 3);
    ctx.fillStyle = "#374151"; ctx.font = "44px " + F;
    y = wrap(ctx, r[4], 80, y + 50, 920, 66, 4);
    ctx.fillStyle = "#9ca3af"; ctx.font = "38px " + F; ctx.fillText("适合谁", 80, y + 60);
    ctx.fillStyle = "#111827"; ctx.font = "40px " + F;
    y = wrap(ctx, r[5], 80, y + 120, 920, 58, 2);
    ctx.fillStyle = "#16A34A"; ctx.font = "38px " + F;
    ctx.fillText(r[2] + " 开源 · Star " + fmtStar(r[3]) + "（截至 " + REPOS_ASOF + "）", 80, y + 50);
    ctx.fillStyle = "#f3f4f6"; ctx.fillRect(80, 1180, 920, 120);
    ctx.fillStyle = "#1E63D6"; ctx.font = "40px " + F; ctx.fillText("github.com/" + r[0], 110, 1255);
    return cv.toDataURL("image/png");
  }

  function save() {
    if (current === null) { alert("先抽一个盲盒吧"); return; }
    var m = mt();
    if (!canSave()) return;
    var url = cardImage();
    var done = function () { alert("已保存到相册"); };
    var fail = function () { alert("保存失败，请检查相册权限"); };
    var go = function (path) {
      var p = m.saveImageToPhotosAlbum({ filePath: path });
      if (p && p.then) p.then(done, fail);
    };
    try {
      if (typeof m.writeTempFile === "function") {
        var t = m.writeTempFile({ data: url });
        if (t && t.then) { t.then(function (res) { go(res.filePath); }, function () { go(url); }); return; }
      }
      go(url);
    } catch (e) { fail(); }
  }

  function chips() {
    var box = $("chips");
    CATS.forEach(function (c) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "chip" + (c === cat ? " on" : "");
      b.textContent = c;
      b.addEventListener("click", function () {
        cat = c;
        var all = box.querySelectorAll(".chip");
        for (var i = 0; i < all.length; i++) all[i].className = "chip" + (all[i].textContent === cat ? " on" : "");
        updateCount();
      });
      box.appendChild(b);
    });
  }

  $("asof").textContent = REPOS_ASOF;
  chips();
  updateCount();
  $("save").parentNode.style.display = "none";
  $("draw").addEventListener("click", draw);
  $("save").addEventListener("click", save);
})();
