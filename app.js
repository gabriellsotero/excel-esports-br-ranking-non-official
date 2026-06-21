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

// indices of the rounds dropped under the discard rule (blank counts as 0)
function discardedIdx(r){
  const sorted=r.map((v,i)=>[v==null?0:v,i]).sort((a,b)=>a[0]-b[0]);
  return new Set(sorted.slice(0,DISCARD_COUNT).map(p=>p[1]));
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
    const discards=displayCol==='descarte'?discardedIdx(d.r):null;
    for(let k=0;k<ROUND_COUNT;k++){
      const v=d.r[k];
      const dc=discards&&discards.has(k)?' discarded':'';
      cells.push(`<td class="col-mobile-hide${dc}">${v==null?'<span class="dash">–</span>':v}</td>`);
    }
    const displayVal=displayCol==='media'?fmtMedia(d.media):d[displayCol];
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

const DISPLAY_LABELS={descarte:'Padrão',total:'Sem Descarte',media:'Média'};
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

render();
});
