const UF_FLAGS = {
  AC:'02-acre-rounded.png',
  AL:'03-alagoas-rounded.png',
  AP:'04-amapa-rounded.png',
  AM:'05-amazonas-rounded.png',
  BA:'06-bahia-rounded.png',
  CE:'07-ceara-rounded.png',
  DF:'08-distrito-federal-rounded.png',
  ES:'09-espirito-santo-rounded.png',
  GO:'10-goias-rounded.png',
  MA:'11-maranhao-rounded.png',
  MT:'12-mato-grosso-rounded.png',
  MS:'13-mato-grosso-do-sul-rounded.png',
  MG:'14-minas-gerais-rounded.png',
  PA:'15-para-rounded.png',
  PB:'16-paraiba-rounded.png',
  PR:'17-parana-rounded.png',
  PE:'18-pernambuco-rounded.png',
  PI:'19-piaui-rounded.png',
  RJ:'20-rio-de-janeiro-rounded.png',
  RN:'21-rio-grande-do-norte-rounded.png',
  RS:'22-rio-grande-do-sul-rounded.png',
  RO:'23-rondonia-rounded.png',
  RR:'24-roraima-rounded.png',
  SC:'25-santa-catarina-rounded.png',
  SP:'26-sao-paulo-rounded.png',
  SE:'27-sergipe-rounded.png',
  TO:'28-tocantins-rounded.png',
};
const UF_FLAG_BASE='https://cdn.jsdelivr.net/gh/pierrelapalu/icones-bandeiras-br-uf@master/dist/rounded/png-200/';
function ufFlagImg(uf){
  const f=UF_FLAGS[uf];
  return f?`<img class="uf-flag" src="${UF_FLAG_BASE}${f}" alt="${uf}">`:'';
}

// Columns before/after the per-round columns. The round columns themselves
// are generated dynamically from the data (see fetch below), so adding a new
// round needs no code change — just new rows in rankings.csv.
const columnsHead = [
  {key:'pos',    label:'#',          cls:'center sticky-l', sortable:false},
  {key:'class',  label:'★',          cls:'center',          type:'bool'},
  {key:'nome',   label:'Nome',       cls:'left',            type:'str'},
  {key:'estado', label:'UF',         cls:'center',                          type:'str'},
  {key:'part',   label:'Part.',      cls:'center col-mobile-hide',          type:'num'},
];
const columnsTail = [
  {key:'descarte',label:'Padrão',     cls:'col-metric col-total',                type:'num'},
];
let columns = [...columnsHead, ...columnsTail];
let ROUND_COUNT = 0;   // set from data on load
let DISCARD_COUNT = 0; // set from data on load (single source: process.py)

let sortKey='descarte', sortDir=-1;
let displayCol='descarte'; // 'descarte' | 'total' | 'media'
let fClass='all', fEstado='', fSearch='';
let currentRows=[]; // last filtered+sorted rows (source for image export)

function discardedIdx(r, n){
  const sorted=r.map((v,i)=>[v==null?0:v,i]).sort((a,b)=>a[0]-b[0]);
  return new Set(sorted.slice(0,n).map(p=>p[1]));
}
function computeDescarte(r, n){
  const dropped=discardedIdx(r,n);
  return r.reduce((s,v,i)=>dropped.has(i)?s:s+(v==null?0:v),0);
}

fetch('data.json').then(r=>r.json()).then(payload=>{
const DATA=payload.participants;
// scoring config comes from data.json (written by process.py) — single source
ROUND_COUNT = payload.rounds ?? (DATA.length ? DATA[0].r.length : 0);
DISCARD_COUNT = payload.discards ?? 0;
const roundCols=[];
for(let i=0;i<ROUND_COUNT;i++){
  roundCols.push({key:'r'+i,label:'R'+(i+1),cls:'center col-mobile-hide',type:'round',idx:i});
}
columns=[...columnsHead,...roundCols,...columnsTail];

// build state dropdown
const estados=[...new Set(DATA.map(d=>d.estado))].sort();
const selEstado=document.getElementById('estado');
estados.forEach(e=>{const o=document.createElement('option');o.value=e;o.textContent=e;selEstado.appendChild(o);});

// build header
const head=document.getElementById('head');
columns.forEach(c=>{
  const th=document.createElement('th');
  th.className=c.cls||'';
  th.dataset.key=c.key;
  th.innerHTML=c.label+(c.sortable===false?'':'<span class="arrow"></span>');
  if(c.sortable!==false){
    th.addEventListener('click',()=>{
      if(c.type==='round'){
        const i=c.idx;
        if(sortKey==='round'+i){sortDir*=-1;}else{sortKey='round'+i;sortDir=-1;}
      }else{
        const sk=c.key==='descarte'?displayCol:c.key;
        if(sortKey===sk){sortDir*=-1;}else{sortKey=sk;sortDir=(c.type==='str')?1:-1;}
      }
      render();
    });
  }
  head.appendChild(th);
});

function getSortVal(d){
  if(sortKey.startsWith('round')){const i=+sortKey.slice(5);return d.r[i]??-1;}
  if(sortKey==='class')return d.class?1:0;
  if(sortKey==='descarte2')return computeDescarte(d.r,2);
  return d[sortKey];
}

function render(){
  let rows=DATA.filter(d=>{
    if(fClass==='yes'&&!d.class)return false;
    if(fClass==='no'&&d.class)return false;
    if(fEstado&&d.estado!==fEstado)return false;
    if(fSearch&&!d.nome.toLowerCase().includes(fSearch))return false;
    return true;
  });
  const str=(typeof getSortVal(rows[0]??{})==='string');
  rows.sort((a,b)=>{
    let va=getSortVal(a),vb=getSortVal(b);
    if(typeof va==='string'){return va.localeCompare(vb,'pt')*sortDir;}
    return (va-vb)*sortDir;
  });
  currentRows=rows;

  // header arrows
  document.querySelectorAll('#head th').forEach(th=>{
    const k=th.dataset.key;const arr=th.querySelector('.arrow');
    const ek=k==='descarte'?displayCol:k;
    let active=(ek===sortKey)||(sortKey.startsWith('round')&&k==='r'+sortKey.slice(5));
    th.classList.toggle('sorted',active);
    if(arr)arr.textContent=active?(sortDir===-1?'▼':'▲'):'';
  });

  const body=document.getElementById('body');
  body.innerHTML='';
  if(rows.length===0){
    body.innerHTML='<tr><td colspan="'+columns.length+'" class="empty-state">Nenhum participante encontrado com esses filtros.</td></tr>';
    return;
  }
  const frag=document.createDocumentFragment();
  const fmtMedia=v=>v.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
  rows.forEach((d,i)=>{
    const tr=document.createElement('tr');
    if(i%2)tr.className='row-alt';
    const pos=i+1;
    let posCls='pos';if(pos===1)posCls+=' top1';else if(pos===2)posCls+=' top2';else if(pos===3)posCls+=' top3';
    const cells=[
      `<td class="center sticky-l"><span class="${posCls}">${pos}</span></td>`,
      `<td class="center">${d.class?'<span class="star">★</span>':''}</td>`,
      `<td class="left name">${escapeHtml(d.nome)}</td>`,
      `<td class="center"><span class="uf">${ufFlagImg(d.estado)}${d.estado}</span></td>`,
      `<td class="center col-mobile-hide">${d.part}</td>`,
    ];
    const discards=(displayCol==='descarte'||displayCol==='descarte2')?discardedIdx(d.r,displayCol==='descarte2'?2:DISCARD_COUNT):null;
    for(let k=0;k<ROUND_COUNT;k++){
      const v=d.r[k];
      const dc=discards&&discards.has(k)?' discarded':'';
      cells.push(`<td class="col-mobile-hide${dc}">${v==null?'<span class="dash">–</span>':v}</td>`);
    }
    const displayVal=displayCol==='media'?fmtMedia(d.media):displayCol==='descarte2'?computeDescarte(d.r,2):d[displayCol];
    cells.push(`<td class="col-metric strong col-total">${displayVal}<span class="tap-caret">▾</span></td>`);
    tr.innerHTML=cells.join('');
    frag.appendChild(tr);

    // detail row — shown on mobile when the Total cell is tapped
    const dr=document.createElement('tr');
    dr.className='detail-row';
    const det=[];
    det.push(`<span class="detail-inline"><b>Participações</b> ${d.part}</span>`);
    const rds=[];for(let k=0;k<ROUND_COUNT;k++){const v=d.r[k];rds.push(`<span class="detail-round-item"><b>R${k+1}</b>${v==null?'–':v}</span>`);}
    det.push(`<span class="detail-rounds">${rds.join('')}</span>`);
    dr.innerHTML=`<td colspan="99"><div class="detail-content">${det.join('')}</div></td>`;
    frag.appendChild(dr);
  });
  body.appendChild(frag);
}

function escapeHtml(s){return s.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}

const DISPLAY_LABELS={descarte:'Padrão',descarte2:'2 Descartes',total:'Sem Descarte',media:'Média'};
function updateTotalHeader(){
  const th=document.querySelector('#head th[data-key="descarte"]');
  if(th)th.innerHTML=DISPLAY_LABELS[displayCol]+'<span class="arrow"></span>';
}

document.getElementById('search').addEventListener('input',e=>{fSearch=e.target.value.toLowerCase().trim();render();});
selEstado.addEventListener('change',e=>{fEstado=e.target.value;render();});
document.querySelectorAll('#classSeg button').forEach(b=>{
  b.addEventListener('click',()=>{
    document.querySelectorAll('#classSeg button').forEach(x=>x.classList.remove('active'));
    b.classList.add('active');fClass=b.dataset.c;render();
  });
});
document.getElementById('clear').addEventListener('click',()=>{
  fClass='all';fEstado='';fSearch='';displayCol='descarte';
  document.getElementById('search').value='';selEstado.value='';
  document.querySelectorAll('#classSeg button').forEach(x=>x.classList.toggle('active',x.dataset.c==='all'));
  document.querySelectorAll('#totalSeg button').forEach(x=>x.classList.toggle('active',x.dataset.d==='descarte'));
  sortKey='descarte';sortDir=-1;updateTotalHeader();render();
});

document.querySelectorAll('#totalSeg button').forEach(b=>{
  b.addEventListener('click',()=>{
    const prev=displayCol;
    displayCol=b.dataset.d;
    document.querySelectorAll('#totalSeg button').forEach(x=>x.classList.toggle('active',x===b));
    if(sortKey===prev)sortKey=displayCol;
    updateTotalHeader();render();
  });
});

// tap the Total cell to reveal hidden details (mobile)
document.getElementById('body').addEventListener('click',e=>{
  const cell=e.target.closest('.col-total');
  if(!cell)return;
  const detail=cell.parentElement.nextElementSibling;
  if(detail&&detail.classList.contains('detail-row')){
    detail.classList.toggle('open');
    cell.classList.toggle('expanded');
  }
});

// ---- image export ---------------------------------------------------------
const MEDAL=['#b8860b','#7d7d7d','#a06a2c']; // top1/top2/top3, matches the table
function pointsLabel(){return displayCol==='media'?'Média':displayCol==='total'?'Total':'Pontos';}
function pointsValue(d){
  if(displayCol==='media')return d.media.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
  if(displayCol==='descarte2')return String(computeDescarte(d.r,2));
  return String(d[displayCol]);
}
function ellipsize(ctx,text,maxW){
  if(ctx.measureText(text).width<=maxW)return text;
  let t=text;
  while(t.length>1&&ctx.measureText(t+'…').width>maxW)t=t.slice(0,-1);
  return t+'…';
}

async function exportImage(n){
  const rows=currentRows.slice(0,n);
  if(rows.length===0)return;
  if(document.fonts&&document.fonts.ready)await document.fonts.ready;

  const W=720, padX=28, headerH=96, rowH=40, footerH=46;
  const H=headerH+rows.length*rowH+footerH;
  const scale=2;
  const cv=document.createElement('canvas');
  cv.width=W*scale; cv.height=H*scale;
  const ctx=cv.getContext('2d');
  ctx.scale(scale,scale);
  ctx.textBaseline='middle';

  // paper
  ctx.fillStyle='#ffffff'; ctx.fillRect(0,0,W,H);

  // header band
  const g=ctx.createLinearGradient(0,0,0,headerH);
  g.addColorStop(0,'#33704f'); g.addColorStop(1,'#217346');
  ctx.fillStyle=g; ctx.fillRect(0,0,W,headerH);
  // X logo
  ctx.fillStyle='#ffffff';
  roundRect(ctx,padX,headerH/2-19,38,38,6); ctx.fill();
  ctx.fillStyle='#217346'; ctx.font='800 24px "Source Sans 3",sans-serif';
  ctx.textAlign='center'; ctx.fillText('X',padX+19,headerH/2+1);
  // titles
  ctx.textAlign='left';
  ctx.fillStyle='#ffffff'; ctx.font='700 22px "Source Sans 3",sans-serif';
  ctx.fillText('Excel eSports Brasil 2026',padX+54,headerH/2-12);
  const today=new Date().toLocaleDateString('pt-BR');
  ctx.fillStyle='#cfe3d7'; ctx.font='400 13px "Source Sans 3",sans-serif';
  ctx.fillText(`Ranking não-oficial · Top ${rows.length} · ${payload.rounds} rodadas · ${today}`,padX+54,headerH/2+10);

  // column x anchors
  const rankX=padX+14, starX=padX+44, nameX=padX+66;
  const ptsRight=W-padX, ufRight=ptsRight-86, nameMax=ufRight-44-nameX;

  rows.forEach((d,i)=>{
    const y=headerH+i*rowH;
    if(i%2)  {ctx.fillStyle='#f6faf7'; ctx.fillRect(0,y,W,rowH);}
    const cy=y+rowH/2;
    // rank
    ctx.textAlign='left';
    ctx.fillStyle=i<3?MEDAL[i]:'#1c2b22';
    ctx.font='700 15px "Source Sans 3",sans-serif';
    ctx.fillText(String(i+1),rankX,cy);
    // star
    if(d.class){ctx.fillStyle='#f4b400'; ctx.font='400 15px "Source Sans 3",sans-serif'; ctx.fillText('★',starX,cy);}
    // name
    ctx.fillStyle='#1c2b22'; ctx.font='600 15px "Source Sans 3",sans-serif';
    ctx.fillText(ellipsize(ctx,d.nome,nameMax),nameX,cy);
    // UF
    ctx.textAlign='right';
    ctx.fillStyle='#5e6b63'; ctx.font='400 14px "Source Sans 3",sans-serif';
    ctx.fillText(d.estado,ufRight,cy);
    // points
    ctx.fillStyle='#217346'; ctx.font='700 15px "Source Sans 3",sans-serif';
    ctx.fillText(pointsValue(d),ptsRight,cy);
    // row rule
    ctx.strokeStyle='#e6ece8'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(0,y+rowH-0.5); ctx.lineTo(W,y+rowH-0.5); ctx.stroke();
  });

  // column header label for points (small, above first row, right side)
  // footer
  const fy=headerH+rows.length*rowH;
  ctx.fillStyle='#eef2ee'; ctx.fillRect(0,fy,W,footerH);
  ctx.textAlign='left';
  ctx.fillStyle='#5e6b63'; ctx.font='400 12px "Source Sans 3",sans-serif';
  ctx.fillText(`Coluna: ${pointsLabel()} · não-oficial, não afiliado à FMWC`,padX,fy+footerH/2);

  const stamp=new Date().toISOString().slice(0,10);
  cv.toBlob(blob=>{
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url; a.download=`ranking-top${rows.length}-${stamp}.png`;
    a.click();
    URL.revokeObjectURL(url);
  },'image/png');
}

function roundRect(ctx,x,y,w,h,r){
  ctx.beginPath();
  ctx.moveTo(x+r,y);
  ctx.arcTo(x+w,y,x+w,y+h,r);
  ctx.arcTo(x+w,y+h,x,y+h,r);
  ctx.arcTo(x,y+h,x,y,r);
  ctx.arcTo(x,y,x+w,y,r);
  ctx.closePath();
}

const expInput=document.getElementById('exportN');
document.getElementById('exportBtn').addEventListener('click',()=>{
  const max=currentRows.length;
  let n=parseInt(expInput.value,10);
  if(isNaN(n)||n<1)n=Math.min(10,max);
  if(n>max)n=max;
  expInput.value=n;
  exportImage(n);
});

render();
});
