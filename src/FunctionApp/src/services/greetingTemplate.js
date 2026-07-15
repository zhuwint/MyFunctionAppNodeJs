function renderGreetingPage(username, message, badge, homeUrl) {
  const escapedUser = username.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const escapedMsg = message.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const escapedBadge = (badge || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const escapedHome = (homeUrl || '/').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Hello ${escapedUser} — MyFunctionApp</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;600&family=Orbitron:wght@600;900&display=swap');
  *,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
  :root{--neon:#00f5ff;--neon2:#ff00e5;--neon3:#7000ff;--bg:#0a0a0f;--text:#e0e0f0;--dim:#606080}
  body{font-family:'JetBrains Mono',monospace;background:var(--bg);color:var(--text);min-height:100vh;display:flex;align-items:center;justify-content:center;overflow:hidden}
  #bg{position:fixed;top:0;left:0;width:100%;height:100%;z-index:0}
  .container{position:relative;z-index:1;text-align:center;padding:20px}
  .card{background:rgba(15,15,30,0.78);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid rgba(120,120,200,0.18);border-radius:28px;padding:56px 40px;position:relative;overflow:hidden;box-shadow:0 8px 60px rgba(0,0,0,0.5),0 0 100px rgba(100,0,255,0.15),inset 0 1px 0 rgba(255,255,255,0.04)}
  .card::before{content:'';position:absolute;top:-1px;left:-1px;right:-1px;bottom:-1px;border-radius:28px;background:linear-gradient(135deg,var(--neon),var(--neon2),var(--neon3),var(--neon2),var(--neon));background-size:400% 400%;z-index:-1;animation:glow 4s ease infinite;opacity:.25}
  @keyframes glow{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
  .badge{display:inline-block;font-size:10px;font-weight:600;letter-spacing:.1em;padding:5px 14px;border-radius:20px;border:1px solid rgba(0,245,255,.3);color:var(--neon);background:rgba(0,245,255,.06);text-transform:uppercase;margin-bottom:28px}
  .wave{font-size:60px;margin-bottom:20px;animation:wave 2s ease-in-out infinite}
  @keyframes wave{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
  .label{font-family:'Orbitron',sans-serif;font-size:14px;font-weight:600;letter-spacing:.15em;color:var(--dim);text-transform:uppercase;margin-bottom:12px}
  .greeting{font-family:'Orbitron',sans-serif;font-size:clamp(28px,6vw,52px);font-weight:900;line-height:1.3;margin-bottom:36px}
  .greeting .name{animation:shimmer 2.2s ease-in-out infinite;background:linear-gradient(90deg,var(--neon),var(--neon2),#ffa500,var(--neon2),var(--neon));background-size:300% 100%;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
  @keyframes shimmer{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
  .info{display:flex;gap:16px;justify-content:center;flex-wrap:wrap;padding-top:28px;border-top:1px solid rgba(120,120,200,.12)}
  .info-item{text-align:center}
  .info-item .l{font-size:9px;text-transform:uppercase;letter-spacing:.12em;color:var(--dim);margin-bottom:4px}
  .info-item .v{font-size:12px;color:var(--neon);font-weight:600}
  .btn{display:inline-block;margin-top:32px;padding:12px 28px;border-radius:14px;font-family:'Orbitron',sans-serif;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;text-decoration:none;background:linear-gradient(135deg,var(--neon3),#5b00ff);color:#fff;box-shadow:0 4px 30px rgba(112,0,255,.35);transition:all .35s ease}
  .btn:hover{transform:translateY(-2px);box-shadow:0 6px 40px rgba(0,245,255,.45)}
  .confetti{position:fixed;pointer-events:none;z-index:999;animation:fall 1.8s ease-out forwards}
  @keyframes fall{0%{opacity:1;transform:translateY(0)rotate(0deg)scale(1)}100%{opacity:0;transform:translateY(700px)rotate(720deg)scale(0)}}
  @media(max-width:500px){.card{padding:40px 24px;border-radius:22px}.greeting{font-size:24px}.wave{font-size:44px}}
</style>
</head>
<body>
<canvas id="bg"></canvas>
<div class="container">
  <div class="card">
    <div class="badge">${escapedBadge}</div>
    <div class="label">API Response</div>
    <div class="wave">&#x1F44B;</div>
    <div class="greeting"><span class="name">${escapedMsg}</span></div>
    <div class="info">
      <div class="info-item"><div class="l">Endpoint</div><div class="v">GET|POST /api/satdemofunc/{username}</div></div>
      <div class="info-item"><div class="l">Status</div><div class="v">200 OK</div></div>
      <div class="info-item"><div class="l">Content</div><div class="v">text/html</div></div>
    </div>
    <a href="${escapedHome}" class="btn">&larr; Back to Home</a>
  </div>
</div>
<script>
(function(){
  var c=document.getElementById('bg'),x=c.getContext('2d'),w,h,p=[],M={x:-9999,y:-9999};
  function R(){w=c.width=window.innerWidth;h=c.height=window.innerHeight}
  R();window.addEventListener('resize',R);
  function P(){this.reset(true)}
  P.prototype.reset=function(i){this.x=i?Math.random()*w:(Math.random()>.5?0:w);this.y=i?Math.random()*h:(Math.random()>.5?0:h);this.vx=(Math.random()-.5)*.6;this.vy=(Math.random()-.5)*.6;this.r=Math.random()*2+.8;this.o=Math.random()*.5+.15};
  P.prototype.update=function(){this.x+=this.vx;this.y+=this.vy;if(this.x<-30||this.x>w+30||this.y<-30||this.y>h+30)this.reset(false);var dx=M.x-this.x,dy=M.y-this.y,d=Math.sqrt(dx*dx+dy*dy);if(d<180){var f=(1-d/180)*.6;this.vx-=(dx/d)*f*.3;this.vy-=(dy/d)*f*.3}var s=Math.sqrt(this.vx*this.vx+this.vy*this.vy);if(s>1.2){this.vx=(this.vx/s)*1.2;this.vy=(this.vy/s)*1.2}};
  P.prototype.draw=function(){x.beginPath();x.arc(this.x,this.y,this.r,0,Math.PI*2);x.fillStyle='rgba('+(this.r>1.4?'120,100':'255,200')+',255,'+this.o+')';x.fill()};
  for(var i=0;i<70;i++)p.push(new P());
  window.addEventListener('mousemove',function(e){M.x=e.clientX;M.y=e.clientY});
  window.addEventListener('mouseleave',function(){M.x=-9999;M.y=-9999});
  function C(){for(var i=0;i<p.length;i++)for(var j=i+1;j<p.length;j++){var a=p[i],b=p[j],dx=a.x-b.x,dy=a.y-b.y,d=Math.sqrt(dx*dx+dy*dy);if(d<140){var al=(1-d/140)*.15;x.beginPath();x.moveTo(a.x,a.y);x.lineTo(b.x,b.y);x.strokeStyle='rgba(120,140,220,'+al+')';x.lineWidth=.5;x.stroke()}}}
  function A(){x.clearRect(0,0,w,h);p.forEach(function(p){p.update();p.draw()});C();requestAnimationFrame(A)}
  A();
  var Z=['#00f5ff','#ff00e5','#7000ff','#ffa500','#7ddc3f','#ff4488'];
  for(var i=0;i<40;i++){var e=document.createElement('div');e.className='confetti';e.style.left=Math.random()*100+'%';e.style.top=-(Math.random()*60+20)+'px';e.style.width=(Math.random()*8+4)+'px';e.style.height=(Math.random()*14+6)+'px';e.style.background=Z[Math.floor(Math.random()*Z.length)];e.style.borderRadius=Math.random()>.5?'50%':'2px';e.style.animationDuration=(Math.random()*1.2+1)+'s';e.style.animationDelay=Math.random()*.5+'s';document.body.appendChild(e);setTimeout(function(){e.remove()},2000)}
})();
</script>
</body>
</html>`;
}

module.exports = { renderGreetingPage };
