import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import vm from 'node:vm';
const js=await readFile(new URL('../source/colorscan/assets/game.js',import.meta.url),'utf8');
const code=js.slice(js.indexOf('// Marble movement is'),js.indexOf("root.addEventListener('click',e=>{let c="));
let assertions=0;
function equal(actual,expected,message){assert.deepEqual(actual,expected,message);assertions++;}
function node(name=''){
 const classes=new Set();
 return {name,dataset:{},children:[],parent:null,style:{},listeners:{},classList:{add:c=>classes.add(c),remove:c=>classes.delete(c),contains:c=>classes.has(c)},
  addEventListener(type,fn,options){(this.listeners[type]??=[]).push({fn,options});},
  append(...items){for(const n of items){n.remove();n.parent=this;this.children.push(n);}},
  appendChild(n){this.append(n);return n;},
  prepend(...items){for(const n of [...items].reverse()){n.remove();n.parent=this;this.children.unshift(n);}},
  remove(){if(this.parent){this.parent.children=this.parent.children.filter(n=>n!==this);this.parent=null;}},
  setAttribute(){},focus(){this.focused=true;},getBoundingClientRect:()=>({width:40}),closest(){return this;}};
}
function fixture(){
 let clock=0,nextId=0,hit=null;
 const timers=new Map(),root=node('root'),board=node('board');
 const cells=Array.from({length:81},(_,i)=>{const n=node('cell');n.dataset.cell=String(i);n.closest=s=>s==='[data-cell]'||s==='.cs-board'?n:null;return n;});
 board.contains=n=>cells.includes(n);
 let capture=null;board.setPointerCapture=p=>capture=p;board.hasPointerCapture=p=>capture===p;board.releasePointerCapture=()=>{capture=null;};
 const names=['.cs-quick-actions','.cs-feedback','.cs-status','.cs-tools','.cs-play','[data-action="undo"]','[data-action="erase"]'];
 const nodes=Object.fromEntries(names.map(n=>[n,node(n)]));
 nodes['.cs-tools'].append(nodes['[data-action="undo"]'],nodes['[data-action="erase"]']);
 nodes['.cs-play'].append(nodes['.cs-status']);
 const media={matches:true,addEventListener(type,fn){this.change=fn;}};
 const window=node('window'),document=node('document');document.activeElement=null;
 document.elementFromPoint=()=>hit;document.createElement=()=>node('ghost');window.matchMedia=()=>media;
 const state={run:{token:'fixture'},board:Array(81).fill(0),givens:Array(81).fill(0),notes:Array.from({length:81},()=>[]),hints:2,complete:false};
 state.board[0]=state.givens[0]=1;state.board[10]=2;state.notes[11]=[2,3];state.notes[20]=[2,4];
 const history=[],effects={save:0,render:0,sound:0,message:''};
 const context=vm.createContext({root,window,document,state,selected:-1,busy:false,paletteTimer:null,lastPalette:null,checked:new Set([5]),
  performance:{now:()=>clock},setTimeout(fn,ms){const id=++nextId;timers.set(id,{fn,at:clock+ms});return id;},clearTimeout:id=>timers.delete(id),
  $:s=>s==='.cs-board'?board:s.startsWith('[data-cell=')?cells[Number(s.match(/"(\d+)"/)[1])]:nodes[s],
  peers:(a,b)=>(a/9|0)===(b/9|0)||a%9===b%9||((a/27|0)===(b/27|0)&&(a%9/3|0)===(b%9/3|0)),
  snapshot(){history.push({board:[...state.board],notes:state.notes.map(n=>[...n]),complete:state.complete});},
  marbleSound:()=>effects.sound++,say:t=>effects.message=t,finish(){},save:()=>effects.save++,render:()=>effects.render++,dot:()=>'<span></span>'});
 vm.runInContext(code,context);
 const emit=(target,type,extra={})=>{const e={target:cells[10],pointerId:1,isPrimary:true,button:0,clientX:10,clientY:10,preventDefault(){this.prevented=true;},stopImmediatePropagation(){this.stopped=true;},...extra};for(const l of target.listeners[type]||[])l.fn(e);return e;};
 return {context,state,history,effects,cells,root,board,document,window,nodes,media,emit,hit:n=>hit=n,
  advance(ms){clock+=ms;for(const [id,t]of timers)if(t.at<=clock){timers.delete(id);t.fn();}},
  move:(from,to)=>vm.runInContext(`moveMarble(${from},${to})`,context)};
}
{
 const f=fixture(),before=JSON.stringify({board:f.state.board,notes:f.state.notes});
 f.emit(f.board,'pointerdown');f.advance(380);
 equal(f.state.board[10],2,'lifting must not edit source');equal(f.history.length,0,'lifting must not create undo');
 equal(f.root.classList.contains('cs-dragging'),true);
 f.hit(f.cells[11]);f.emit(f.board,'pointermove',{clientX:50});
 equal(f.cells[11].classList.contains('cs-drop-target'),true);
 f.emit(f.board,'pointerup',{clientX:50});
 equal(f.state.board[10],0);equal(f.state.board[11],2);equal([...f.state.notes[11]],[]);equal([...f.state.notes[20]],[4]);
 equal(f.state.hints,2,'moving must not restore eligibility');equal(f.history.length,1);equal(f.effects.save,1);equal(f.effects.sound,1);
 equal(f.root.classList.contains('cs-dragging'),false);
 const click=f.emit(f.root,'click',{target:f.cells[11],detail:1});equal(click.stopped,true,'drop must suppress duplicate board click');
 Object.assign(f.state,f.history.pop());equal(JSON.stringify({board:f.state.board,notes:f.state.notes}),before,'one undo restores both cells and all notes');
}
for(const target of [-1,0,10,12]){
 const f=fixture();if(target===12)f.state.board[12]=3;
 const before=JSON.stringify(f.state);
 f.emit(f.board,'pointerdown');f.advance(380);f.hit(target<0?null:f.cells[target]);f.emit(f.board,'pointerup');
 equal(JSON.stringify(f.state),before,'invalid drop must preserve game');equal(f.history.length,0);equal(f.effects.save,0);
}
for(const type of ['pointercancel','lostpointercapture']){
 const f=fixture();f.emit(f.board,'pointerdown');f.advance(380);f.emit(f.board,type);
 equal(f.state.board[10],2);equal(f.root.classList.contains('cs-dragging'),false);equal(f.history.length,0);
}
{
 const f=fixture();f.emit(f.board,'pointerdown');f.advance(200);f.emit(f.board,'pointerup');f.advance(500);
 equal(f.root.classList.contains('cs-dragging'),false,'ordinary tap must not lift');equal(f.state.board[10],2);
 f.emit(f.board,'pointerdown');f.emit(f.board,'pointermove',{clientY:30});f.advance(400);
 equal(f.root.classList.contains('cs-dragging'),false,'movement before hold cancels');
 f.emit(f.board,'pointerdown');f.emit(f.document,'pointerup');f.advance(400);
 equal(f.root.classList.contains('cs-dragging'),false,'release outside board cancels timer');
 f.emit(f.board,'pointerdown',{target:f.cells[0]});f.advance(400);
 equal(f.root.classList.contains('cs-dragging'),false,'givens cannot lift');
 f.emit(f.board,'pointerdown');f.advance(400);f.emit(f.window,'resize');equal(f.root.classList.contains('cs-dragging'),false);
 f.emit(f.board,'pointerdown');f.advance(400);f.emit(f.root,'keydown',{key:'Escape'});equal(f.root.classList.contains('cs-dragging'),false);
 f.emit(f.board,'pointerdown');f.advance(400);f.emit(f.document,'pointerdown',{pointerId:2});equal(f.root.classList.contains('cs-dragging'),false);
  const staleClick=f.emit(f.root,'click',{target:f.nodes['[data-action="erase"]'],detail:1});
  equal(staleClick.stopped,true,'cancel-generated control click must not erase/place');
  f.emit(f.board,'pointerdown');f.advance(400);f.emit(f.board,'pointercancel');
  f.emit(f.root,'pointerdown',{target:f.nodes['[data-action="undo"]']});
  const freshClick=f.emit(f.root,'click',{target:f.nodes['[data-action="undo"]'],detail:1});
  equal(!!freshClick.stopped,false,'a fresh immediate undo tap must work');
}
{
 const f=fixture();equal(f.nodes['.cs-quick-actions'].children.map(n=>n.name),['[data-action="undo"]','[data-action="erase"]']);
 equal(f.nodes['.cs-status'].parent.name,'.cs-feedback');
 f.media.matches=false;f.media.change();equal(f.nodes['.cs-tools'].children.map(n=>n.name),['[data-action="undo"]','[data-action="erase"]']);
 equal(f.nodes['.cs-quick-actions'].children.length,0);equal(f.nodes['.cs-status'].parent.name,'.cs-play');
 for(const [from,to]of [[0,11],[10,0],[10,10],[-1,11],[10,81],[10,1.5]])equal(f.move(from,to),false);
 f.context.busy=true;equal(f.move(10,11),false);f.context.busy=false;f.state.complete=true;equal(f.move(10,11),false);
 f.state.complete=false;f.state.run=null;equal(f.move(10,11),false);
}
console.log(`PASS: ${assertions} move/gesture/responsive-control assertions against actual game code`);
console.log('LIMIT: simulated pointer events; physical touch/device/browser cancellation still requires device QA.');
