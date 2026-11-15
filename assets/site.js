var LOGO="assets/vistas-acm-blue-logo.jpg",PORTRAIT="assets/member-01.webp",WORDS=["Build","Lead","Create","Connect","Explore","Design","Code","Share","Learn","Ship","Test","Inspire","Solve","Grow","Imagine"],HUES=[210,202,216,206,220,198,212,205,218,200,214,208,222,204,216];
var M=WORDS.map(function(w,i){return{word:w,hue:HUES[i],name:"Name to be added",role:i==0?"The Maker":i==3?"The Connector":"Designation to be added",team:"Team to be added",img:i==0?PORTRAIT:""}});
var EV=[["Workshop",210],["Talk",202],["Community",218],["Workshop",206],["Talk",220],["Community",198]];
var PR=[["Software",208],["Research",218],["Creative",198]];
var GL=[["Workshop",210],["Talk",200],["Community",218],["Workshop",205],["Community",220],["Talk",198],["Workshop",212]];
(function(){
var $=function(s,r){return(r||document).querySelector(s)},$$=function(s,r){return[].slice.call((r||document).querySelectorAll(s))};
var still=matchMedia("(prefers-reduced-motion: reduce)").matches,SPA=!!$("#v-home"),nv=$("#nv"),wipe=$("#wipe");
$$("[data-year]").forEach(function(e){e.textContent=new Date().getFullYear()});
var CARD={events:["Date to be announced","Event title to be confirmed","Event details and approved photography will appear here.",EV],projects:["Case study","Project title to be confirmed","Summary and contributors will appear after the team submission is approved.",PR],gallery:["Archive","","",GL]};
$$("[data-grid]").forEach(function(g){var k=CARD[g.dataset.grid],lim=+g.dataset.limit||99,list=k[3].slice(0,lim);
 g.innerHTML=list.map(function(c){
  if(g.dataset.grid=="gallery")return'<article class="ev rv" data-c="'+c[0]+'"><div class="art" style="--c:'+c[1]+'" data-w="'+c[0]+'"><img src="'+LOGO+'" alt=""></div><span class="mono lb">'+c[0]+'</span></article>';
  return'<article class="ev rv" data-c="'+c[0]+'"><div class="art" style="--c:'+c[1]+'" data-w="'+c[0]+'"><img src="'+LOGO+'" alt=""></div><div class="t"><span class="mono">'+c[0]+' · '+k[0]+'</span><h3>'+k[1]+'</h3><p>'+k[2]+'</p></div></article>'}).join("")});
$$("[data-chips]").forEach(function(bx){var grid=bx.nextElementSibling;$$(".chip",bx).forEach(function(b){b.addEventListener("click",function(){$$(".chip",bx).forEach(function(x){x.setAttribute("aria-pressed",x===b)});$$(".ev",grid).forEach(function(e){e.hidden=b.dataset.f!="All"&&e.dataset.c!=b.dataset.f})})})});
/* team */
var tk=$("#tk"),N=M.length,W=[],S=[],act=-1,tt=$("#team.tt"),hn=$("#hn");
function pad(n){return(n<10?"0":"")+n}
function swap(el,txt){if(!el||el.textContent==txt)return;el.textContent=txt;if(el.animate&&!still)el.animate([{opacity:0,transform:"translateY(18px)"},{opacity:1,transform:"none"}],{duration:520,easing:"cubic-bezier(.2,.8,.2,1)"})}
if(tk){
 var wd=$("#wds"),sl=$("#sls");
 M.forEach(function(m,i){wd.insertAdjacentHTML("beforeend",'<div class="wd" aria-hidden="true" style="font-size:min(24vw,'+(110/m.word.length).toFixed(1)+'vw)">'+m.word+'</div>');
  sl.insertAdjacentHTML("beforeend",'<div class="sl'+(m.img?"":" ph")+'"><img src="'+(m.img||LOGO)+'" alt="'+(m.img?"Portrait of member "+(i+1):"")+'"></div>')});
 W=$$(".wd",wd);S=$$(".sl",sl);
}
function set(i){if(!tk||i===act)return;act=i;var m=M[i];
 W.forEach(function(e,k){e.className="wd"+(k==i?" on":k<i?" up":"")});
 S.forEach(function(e,k){e.className="sl"+(M[k].img?"":" ph")+(k==i?" on":k<i?" up":"")});
 tt.style.setProperty("--h",m.hue);swap($("#nm"),m.name);swap($("#rl"),m.role);swap($("#tm"),m.team);swap($("#ct"),pad(i+1));$("#in").textContent=pad(i+1);hn.style.opacity=i>0?0:1}
function sizeTrack(){if(tk)tk.style.height=(N*.72*innerHeight+innerHeight)+"px"}
sizeTrack();addEventListener("resize",sizeTrack);set(0);
var pg=document.createElement("div");pg.id="pg";document.body.appendChild(pg);var tick=0;
function onS(){var m=document.documentElement.scrollHeight-innerHeight;pg.style.transform="scaleX("+(m>0?scrollY/m:0)+")";nv.classList.toggle("s",scrollY>40);
 if(tk&&tk.offsetParent){var r=tk.getBoundingClientRect(),span=r.height-innerHeight,p=Math.min(1,Math.max(0,-r.top/span));$(".bar").style.setProperty("--p",p.toFixed(3));set(Math.min(N-1,Math.floor(p*N*.999)))}}
addEventListener("scroll",function(){if(!tick){tick=1;requestAnimationFrame(function(){tick=0;onS()})}},{passive:true});onS();
/* reveal / counters */
var io=new IntersectionObserver(function(es){es.forEach(function(e){if(!e.isIntersecting)return;e.target.classList.add("in");io.unobserve(e.target);var n=$("[data-n]",e.target);if(n)count(n)})},{threshold:.15});
$$(".rv").forEach(function(el){el.style.transitionDelay=([].indexOf.call(el.parentNode.children,el)%4)*90+"ms";io.observe(el)});
function count(el){var to=+el.dataset.n,t0=performance.now();(function f(t){var k=Math.min(1,(t-t0)/1400);el.textContent=Math.round(to*(1-Math.pow(1-k,3)));if(k<1)requestAnimationFrame(f)})(t0)}
$$(".card").forEach(function(c){c.addEventListener("pointermove",function(e){var r=c.getBoundingClientRect();c.style.setProperty("--mx",e.clientX-r.left+"px");c.style.setProperty("--my",e.clientY-r.top+"px")})});
var cur=$("#cur");addEventListener("pointermove",function(e){if(e.pointerType!="mouse")return;cur.style.opacity=1;cur.style.transform="translate("+e.clientX+"px,"+e.clientY+"px)"});
var hero=$(".hero");
if(hero){hero.addEventListener("pointermove",function(e){var r=hero.getBoundingClientRect();hero.style.setProperty("--px",((e.clientX-r.left)/r.width-.5).toFixed(3));hero.style.setProperty("--py",((e.clientY-r.top)/r.height-.5).toFixed(3))});
 var c=$("#fx"),x=c.getContext("2d"),P=[],w,h,n=0,i;
 function rs(){w=c.width=hero.clientWidth;h=c.height=hero.clientHeight}rs();addEventListener("resize",rs);
 for(i=0;i<90;i++)P.push({x:Math.random(),y:Math.random(),s:Math.random()*2+.6,v:Math.random()*.0006+.0002,t:Math.random()*6});
 (function f(){if(hero.offsetParent){x.clearRect(0,0,w,h);n+=.02;P.forEach(function(p){p.y-=p.v;if(p.y<0){p.y=1;p.x=Math.random()}
  x.fillStyle="rgba(30,160,255,"+(.15+.6*Math.abs(Math.sin(n+p.t)))+")";x.shadowColor="#19a8ff";x.shadowBlur=10;x.beginPath();x.arc(p.x*w+Math.sin(n+p.t)*14,p.y*h,p.s,0,7);x.fill()})}
  if(!still)requestAnimationFrame(f)})()}
$("#mt").addEventListener("click",function(){var o=nv.classList.toggle("o");this.setAttribute("aria-expanded",o)});
var fm=$("#f");if(fm)fm.addEventListener("submit",function(e){e.preventDefault();var d=new FormData(e.target);var b="Name: "+d.get("name")+"\nEmail: "+d.get("email")+"\nBranch/Year: "+d.get("by")+"\nInterest: "+d.get("int")+"\n\n"+d.get("msg");location.href="mailto:?subject="+encodeURIComponent("VISTAS ACM membership request")+"&body="+encodeURIComponent(b);$("#ok").textContent="Opening your email app. Add the chapter email once confirmed."});
/* page redirections with wipe transition */
function wipeIn(cb){if(still){cb();return}wipe.style.animation="none";wipe.style.transition="none";wipe.style.transform="translateY(100%)";void wipe.offsetWidth;wipe.style.transition="transform .55s cubic-bezier(.7,0,.2,1)";wipe.style.transform="none";setTimeout(cb,560)}
function wipeOut(){if(still)return;wipe.style.transition="transform .7s cubic-bezier(.7,0,.2,1)";wipe.style.transform="translateY(-100%)"}
var TITLES=window.TITLES||{};
function route(first){var p=location.hash.slice(1);if(!TITLES[p])p="home";
 $$(".view").forEach(function(v){v.hidden=v.id!="v-"+p});document.title=TITLES[p];document.body.classList.toggle("home",p=="home");
 $$(".nav a.l").forEach(function(a){a.toggleAttribute("aria-current",a.dataset.p==p)});
 scrollTo({top:0,behavior:"instant"});sizeTrack();act=-1;set(0);onS();nv.classList.remove("o");if(!first)wipeOut()}
if(SPA){addEventListener("hashchange",function(){route(false)});route(true)}
else{var cp=document.body.dataset.page;$$(".nav a.l").forEach(function(a){a.toggleAttribute("aria-current",a.dataset.p==cp)})}
document.addEventListener("click",function(e){var a=e.target.closest("a[data-p]");if(!a||e.metaKey||e.ctrlKey||e.shiftKey)return;
 var p=a.dataset.p;if(SPA&&location.hash.slice(1)==p)return;e.preventDefault();
 wipeIn(function(){if(SPA)location.hash=p;else location.href=a.getAttribute("href")})});
})();
