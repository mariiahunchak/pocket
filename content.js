
(() => {
  if (window.__TSO_GCLASS_V5__) return;
  window.__TSO_GCLASS_V5__ = true;

  const KEY="tso_gclass_v5_data", SET="tso_gclass_v5_settings", POS="tso_gclass_v5_pos";
  const seed={
    "EUR/GBP OTC":{win:33,loss:2,trades:[]},
    "AED/CNY OTC":{win:89,loss:3,trades:[]},
    "GBP/USD OTC":{win:24,loss:8,trades:[]},
    "EUR/USD":{win:0,loss:0,trades:[]}
  };
  let data=seed, settings={auto:true}, current="EUR/GBP OTC", lastDetected="—", manualUntil=0;

  const panel=document.createElement("div");
  panel.id="tso5";
  panel.innerHTML=`
    <div class="carGlow"></div>
    <div class="carSvg" aria-hidden="true">
      <svg viewBox="0 0 720 300" preserveAspectRatio="none">
        <defs>
          <linearGradient id="body" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#17191f"/>
            <stop offset=".52" stop-color="#090b10"/>
            <stop offset="1" stop-color="#1b1d23"/>
          </linearGradient>
          <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#27324a"/>
            <stop offset="1" stop-color="#080b12"/>
          </linearGradient>
        </defs>
        <!-- flat G-Class-like silhouette -->
        <path class="outline" d="M55 218 L72 155 L118 137 L165 80 L355 80 L408 111 L578 113 L635 145 L665 205 L645 228 L73 228 Z"/>
        <path class="body" d="M68 210 L85 158 L128 145 L176 91 L349 91 L399 119 L575 120 L622 148 L650 208 L632 220 L82 220 Z"/>
        <path class="window" d="M179 98 L343 98 L383 121 L158 121 Z"/>
        <path class="window" d="M395 127 L560 127 L601 151 L410 151 Z"/>
        <path class="trim" d="M90 158 L625 158"/>
        <path class="trim" d="M94 207 L632 207"/>
        <path class="handle" d="M280 166 h30 M420 166 h30"/>
        <circle class="wheel" cx="174" cy="219" r="42"/><circle class="hub" cx="174" cy="219" r="17"/>
        <circle class="wheel" cx="566" cy="219" r="42"/><circle class="hub" cx="566" cy="219" r="17"/>
        <circle class="hub2" cx="174" cy="219" r="6"/><circle class="hub2" cx="566" cy="219" r="6"/>
        <path class="lamp" d="M92 168 h32 l-8 24 H86 Z"/>
        <path class="tail" d="M615 164 h25 v27 h-25"/>
      </svg>
    </div>

    <div class="ui">
      <div class="head">
        <div>
          <b>TRADE JOURNAL</b>
          <small><i class="dot"></i><span class="mode">AUTO</span></small>
        </div>
        <div class="headBtns">
          <button class="icon gear">⚙</button>
          <button class="icon close">×</button>
        </div>
      </div>

      <div class="pairRow">
        <select class="pair"></select>
        <button class="sync">↻</button>
      </div>
      <div class="detected">SYNC: <b>—</b></div>

      <div class="stats">
        <div class="stat win">
          <label>WIN</label>
          <strong class="wins">0</strong>
          <div><button data-k="win" data-d="1">+</button><button data-k="win" data-d="-1">−</button></div>
        </div>
        <div class="stat loss">
          <label>LOSS</label>
          <strong class="losses">0</strong>
          <div><button data-k="loss" data-d="1">+</button><button data-k="loss" data-d="-1">−</button></div>
        </div>
      </div>

      <div class="rate">
        <label>WINRATE</label>
        <strong class="ratev">0%</strong>
        <small class="total">0 trades</small>
      </div>

      <div class="quick">
        <button class="qw">✓ WIN</button>
        <button class="ql">✕ LOSS</button>
      </div>

      <div class="bottom">
        <button class="add">＋ Pair</button>
        <button class="historyBtn">History</button>
        <button class="reset">Reset</button>
      </div>

      <div class="settings">
        <label><input class="auto" type="checkbox" checked> Auto-sync selected pair</label>
        <p>Reads only the visible asset name. No trade clicks, balance reading, private API or network interception.</p>
      </div>

      <div class="history">
        <div class="historyList"></div>
        <button class="clear">Clear history</button>
      </div>
    </div>
  `;
  document.documentElement.appendChild(panel);

  const launcher=document.createElement("button");
  launcher.id="tso5-launcher";
  launcher.textContent="G";
  document.documentElement.appendChild(launcher);

  const $=s=>panel.querySelector(s);

  function norm(s){
    if(!s)return "";
    s=s.replace(/\u00a0/g," ").replace(/\s+/g," ").trim();
    const m=s.match(/\b([A-Z]{3})\s*\/\s*([A-Z]{3})(?:\s+OTC)?\b/i);
    return m ? `${m[1].toUpperCase()}/${m[2].toUpperCase()}${/\bOTC\b/i.test(s)?" OTC":""}` : "";
  }
  function assets(text){
    const out=[], re=/\b[A-Z]{3}\s*\/\s*[A-Z]{3}(?:\s+OTC)?\b/gi;
    let m;
    while((m=re.exec(text||""))){
      const x=norm(m[0]); if(x&&!out.includes(x))out.push(x);
    }
    return out;
  }
  function detect(){
    const found=[];
    const nodes=document.querySelectorAll('[data-symbol],[data-asset],[data-pair],[aria-label],[title],button,[role="button"],[class*="asset"],[class*="symbol"],[class*="pair"],[class*="instrument"]');
    for(const el of nodes){
      if(el!==document.body && !el.offsetParent)continue;
      for(const k of ["data-symbol","data-asset","data-pair","aria-label","title"]){
        const x=norm(el.getAttribute?.(k)||""); if(x)found.push(x);
      }
      found.push(...assets(el.innerText||""));
    }
    found.push(...assets((document.body.innerText||"").slice(0,40000)));
    return found.find(x=>data[x]) || found[0] || "";
  }
  function ensure(p){
    if(!data[p])data[p]={win:0,loss:0,trades:[]};
    if(!Array.isArray(data[p].trades))data[p].trades=[];
  }
  function save(){chrome.storage.local.set({[KEY]:data,[SET]:settings})}
  function render(){
    ensure(current);
    const d=data[current], total=d.win+d.loss;
    const s=$(".pair");
    s.innerHTML="";
    Object.keys(data).sort().forEach(p=>{
      const o=document.createElement("option");
      o.value=p;o.textContent=p;s.appendChild(o)
    });
    s.value=current;
    $(".wins").textContent=d.win;
    $(".losses").textContent=d.loss;
    $(".ratev").textContent=(total?(d.win/total*100).toFixed(1):0)+"%";
    $(".total").textContent=total+" trades";
    $(".detected b").textContent=lastDetected;
    $(".mode").textContent=settings.auto?"AUTO":"MANUAL";
    $(".dot").classList.toggle("off",!settings.auto);
    $(".auto").checked=settings.auto;
    $(".historyList").innerHTML=(d.trades||[]).slice(0,10).map(t=>
      `<div><b class="${t.result==="WIN"?"w":"l"}">${t.result}</b><small>${t.time}</small></div>`
    ).join("") || `<em>No results yet</em>`;
  }
  function result(k,d){
    ensure(current);
    const x=data[current];
    x[k]=Math.max(0,x[k]+d);
    if(d>0){
      x.trades.unshift({
        result:k.toUpperCase(),
        time:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit",second:"2-digit"})
      });
      x.trades=x.trades.slice(0,50);
    } else if(x.trades.length)x.trades.shift();
    save();render();
  }

  panel.querySelectorAll("[data-k]").forEach(b=>b.onclick=()=>result(b.dataset.k,+b.dataset.d));
  $(".qw").onclick=()=>result("win",1);
  $(".ql").onclick=()=>result("loss",1);

  $(".pair").onchange=e=>{
    current=e.target.value;
    manualUntil=Date.now()+3000;
    render();
  };

  $(".sync").onclick=()=>{
    const x=detect();
    if(x){
      lastDetected=x;
      ensure(x);
      current=x;
      save();render();
    }
  };

  $(".add").onclick=()=>{
    const p=prompt("Pair name, e.g. EUR/GBP OTC");
    if(!p)return;
    const x=p.trim();
    if(!x)return;
    ensure(x);current=x;manualUntil=Date.now()+3000;
    save();render();
  };

  $(".reset").onclick=()=>{
    if(confirm("Reset this pair?")){
      data[current]={win:0,loss:0,trades:[]};
      save();render();
    }
  };

  $(".historyBtn").onclick=()=>$(".history").classList.toggle("open");
  $(".clear").onclick=()=>{data[current].trades=[];save();render()};
  $(".gear").onclick=()=>$(".settings").classList.toggle("open");
  $(".auto").onchange=e=>{
    settings.auto=e.target.checked;
    save();render();
    if(settings.auto) $(".sync").click();
  };

  $(".close").onclick=()=>{
    panel.style.display="none";
    launcher.style.display="block";
  };
  launcher.onclick=()=>{
    panel.style.display="block";
    launcher.style.display="none";
  };

  let drag=null;
  $(".head").onmousedown=e=>{
    if(e.target.closest("button"))return;
    const r=panel.getBoundingClientRect();
    drag={x:e.clientX-r.left,y:e.clientY-r.top};
    document.body.style.userSelect="none";
  };
  window.onmousemove=e=>{
    if(!drag)return;
    panel.style.left=Math.max(2,e.clientX-drag.x)+"px";
    panel.style.top=Math.max(2,e.clientY-drag.y)+"px";
    panel.style.right="auto";
  };
  window.onmouseup=()=>{
    if(!drag)return;
    chrome.storage.local.set({
      [POS]:{
        left:parseInt(panel.style.left)||20,
        top:parseInt(panel.style.top)||90
      }
    });
    drag=null;
    document.body.style.userSelect="";
  };

  let timer;
  function schedule(){
    if(!settings.auto||Date.now()<manualUntil)return;
    clearTimeout(timer);
    timer=setTimeout(()=>{
      const x=detect();
      if(x && x!==lastDetected){
        lastDetected=x;
        ensure(x);
        current=x;
        save();
        render();
      }
    },300);
  }

  new MutationObserver(schedule).observe(
    document.documentElement,
    {subtree:true,childList:true,characterData:true}
  );
  setInterval(schedule,1200);

  chrome.storage.local.get([KEY,SET,POS],r=>{
    data=r[KEY]||seed;
    settings={...settings,...(r[SET]||{})};
    const p=r[POS];
    if(p){
      panel.style.left=p.left+"px";
      panel.style.top=p.top+"px";
      panel.style.right="auto";
    }
    render();
    setTimeout(()=>$(".sync").click(),1000);
  });
})();
