// shared site behaviour
(function(){
  var burger=document.getElementById('burger'),mm=document.getElementById('mobileMenu'),mb=document.getElementById('mmBackdrop');
  function toggleMenu(open){if(!burger)return;burger.classList.toggle('open',open);mm.classList.toggle('open',open);mb.classList.toggle('open',open);}
  if(burger){burger.addEventListener('click',function(){toggleMenu(!mm.classList.contains('open'));});
    mb.addEventListener('click',function(){toggleMenu(false);});
    mm.querySelectorAll('a').forEach(function(a){a.addEventListener('click',function(){toggleMenu(false);});});}
  var counted=false;
  function countUp(){if(counted)return;counted=true;
    document.querySelectorAll('.n[data-to]').forEach(function(n){
      var to=parseFloat(n.dataset.to),el=n.querySelector('.cnum'),dur=800,t0=performance.now();
      function step(t){var p=Math.min((t-t0)/dur,1),v=to*(1-Math.pow(1-p,3));el.textContent=Math.round(v);if(p<1)requestAnimationFrame(step);}
      requestAnimationFrame(step);});
  }
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');if(e.target.classList.contains('trust-grid'))countUp();io.unobserve(e.target);}});},{threshold:.16});
  document.querySelectorAll('.reveal').forEach(function(el){io.observe(el);});
})();
