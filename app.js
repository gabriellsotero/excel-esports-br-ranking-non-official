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

const columns = [
  {key:'pos',    label:'#',          cls:'center sticky-l', sortable:false},
  {key:'class',  label:'★',          cls:'center',          type:'bool'},
  {key:'nome',   label:'Nome',       cls:'left',            type:'str'},
  {key:'estado', label:'UF',         cls:'center col-mobile-hide',          type:'str'},
  {key:'part',   label:'Part.',      cls:'center col-mobile-hide',          type:'num'},
  {key:'r0',     label:'R1',         cls:'center col-mobile-hide',         type:'round', idx:0},
  {key:'r1',     label:'R2',         cls:'center col-mobile-hide',         type:'round', idx:1},
  {key:'r2',     label:'R3',         cls:'center col-mobile-hide',         type:'round', idx:2},
  {key:'r3',     label:'R4',         cls:'center col-mobile-hide',         type:'round', idx:3},
  {key:'r4',     label:'R5',         cls:'center col-mobile-hide',         type:'round', idx:4},
  {key:'descarte',label:'Total',      cls:'col-metric col-total',                type:'num'},
  {key:'total',  label:'Sem Descarte',cls:'col-metric opt-total col-mobile-hide',      type:'num'},
  {key:'media',  label:'Média',       cls:'col-metric opt-media col-mobile-hide',      type:'num'},
];

let sortKey='descarte', sortDir=-1;
let fClass='all', fEstado='', fSearch='';

fetch('data.json').then(r=>r.json()).then(DATA=>{
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
        if(sortKey===c.key){sortDir*=-1;}else{sortKey=c.key;sortDir=(c.type==='str')?1:-1;}
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
    let active=(k===sortKey)|| (sortKey.startsWith('round')&&k==='r'+sortKey.slice(5));
    th.classList.toggle('sorted',active);
    if(arr)arr.textContent=active?(sortDir===-1?'▼':'▲'):'';
  });

  const body=document.getElementById('body');
  body.innerHTML='';
  if(rows.length===0){
    body.innerHTML='<tr><td colspan="'+columns.length+'" class="empty-state">Nenhum participante encontrado com esses filtros.</td></tr>';
    document.getElementById('count').textContent=0;return;
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
      `<td class="center col-mobile-hide"><span class="uf">${ufFlagImg(d.estado)}${d.estado}</span></td>`,
      `<td class="center col-mobile-hide">${d.part}</td>`,
    ];
    for(let k=0;k<5;k++){
      const v=d.r[k];
      cells.push(`<td class="col-mobile-hide">${v==null?'<span class="dash">–</span>':v}</td>`);
    }
    cells.push(`<td class="col-metric strong col-total">${d.descarte}<span class="tap-caret">▾</span></td>`);
    cells.push(`<td class="col-metric opt-total col-mobile-hide">${d.total}</td>`);
    cells.push(`<td class="col-metric opt-media col-mobile-hide">${fmtMedia(d.media)}</td>`);
    tr.innerHTML=cells.join('');
    frag.appendChild(tr);

    // detail row — shown on mobile when the Total cell is tapped
    const dr=document.createElement('tr');
    dr.className='detail-row';
    const det=[];
    det.push(`<span><b>UF</b> ${ufFlagImg(d.estado)}${d.estado}</span>`);
    det.push(`<span><b>Participações</b> ${d.part}</span>`);
    for(let k=0;k<5;k++){const v=d.r[k];det.push(`<span><b>R${k+1}</b> ${v==null?'–':v}</span>`);}
    det.push(`<span><b>Sem descarte</b> ${d.total}</span>`);
    det.push(`<span><b>Média</b> ${fmtMedia(d.media)}</span>`);
    dr.innerHTML=`<td colspan="99"><div class="detail-content">${det.join('')}</div></td>`;
    frag.appendChild(dr);
  });
  body.appendChild(frag);
  document.getElementById('count').textContent=rows.length;
}

function escapeHtml(s){return s.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}

document.getElementById('search').addEventListener('input',e=>{fSearch=e.target.value.toLowerCase().trim();render();});
selEstado.addEventListener('change',e=>{fEstado=e.target.value;render();});
document.querySelectorAll('#classSeg button').forEach(b=>{
  b.addEventListener('click',()=>{
    document.querySelectorAll('#classSeg button').forEach(x=>x.classList.remove('active'));
    b.classList.add('active');fClass=b.dataset.c;render();
  });
});
document.getElementById('clear').addEventListener('click',()=>{
  fClass='all';fEstado='';fSearch='';
  document.getElementById('search').value='';selEstado.value='';
  document.querySelectorAll('#classSeg button').forEach(x=>x.classList.toggle('active',x.dataset.c==='all'));
  sortKey='descarte';sortDir=-1;render();
});

const tbl=document.getElementById('ranking-table');
document.getElementById('chkTotal').addEventListener('change',e=>{tbl.classList.toggle('show-total',e.target.checked);});
document.getElementById('chkMedia').addEventListener('change',e=>{tbl.classList.toggle('show-media',e.target.checked);});

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
