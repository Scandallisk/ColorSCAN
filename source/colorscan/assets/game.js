
(()=>{'use strict';const root=document.getElementById('colorscan');if(!root||root.dataset.ready)return;root.dataset.ready='true';if(window.self!==window.top)root.classList.add('cs-embedded');
const $=s=>root.querySelector(s),$$=s=>[...root.querySelectorAll(s)];const colors=[['Red','#ef3340','#fff'],['Orange','#ff8c24','#151515'],['Yellow','#f5d629','#151515'],['Lime','#a2d82d','#151515'],['Green','#00a66c','#fff'],['Cyan','#00bddb','#151515'],['Blue','#2454ed','#fff'],['Purple','#8245d5','#fff'],['Magenta','#e43cad','#fff']];
// Audio preferences are independent of ranked progress.
const audioKey='kilobytes-colorscan-audio-v1';let audioPrefs={music:true,volume:0.30,sfx:true};try{const p=JSON.parse(localStorage.getItem(audioKey));if(p&&typeof p==='object'){if(typeof p.music==='boolean')audioPrefs.music=p.music;if(typeof p.sfx==='boolean')audioPrefs.sfx=p.sfx;if(Number.isFinite(p.volume))audioPrefs.volume=Math.max(0,Math.min(1,p.volume));}}catch(e){}
const audioConfig=window.ColorSCANConfig||{},musicAvailable=audioConfig.musicAvailable??(root.dataset.musicAvailable!=='false'),music=new Audio(),effectUrl=audioConfig.sfxUrl||root.dataset.sfxUrl||'colorscan/assets/audio/marble-place.mp3';music.src=audioConfig.musicUrl||root.dataset.musicUrl||'colorscan/assets/audio/background.mp3';music.loop=true;music.preload='none';music.volume=audioPrefs.volume;let audioContext=null,effectBuffer=null,effectLoading=null,musicPending=false;
function audioMessage(t){$('.cs-audio-status').textContent=t;}
function audioSave(){try{localStorage.setItem(audioKey,JSON.stringify(audioPrefs));}catch(e){}}
function audioControls(){$('.cs-music-toggle').checked=musicAvailable&&audioPrefs.music;$('.cs-music-toggle').disabled=!musicAvailable;$('.cs-music-volume').disabled=!musicAvailable;if(!musicAvailable)audioMessage('Music is optional. No background track is installed.');$('.cs-sfx-toggle').checked=audioPrefs.sfx;$('.cs-music-volume').value=Math.round(audioPrefs.volume*100);$('.cs-volume-value').textContent=Math.round(audioPrefs.volume*100)+'%';}
async function startMusic(){if(!musicAvailable||!audioPrefs.music||document.hidden||!state.run||musicPending||!music.paused)return;musicPending=true;try{await music.play();if(!audioPrefs.music||document.hidden)music.pause();else audioMessage('');}catch(e){audioMessage(e.name==='NotAllowedError'?'Tap the game to start music.':'Music unavailable. Turn Music off and on to retry.');}finally{musicPending=false;}}
function unlockEffect(){if(!audioPrefs.sfx)return;const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;if(!audioContext)audioContext=new AC();if(audioContext.state==='suspended')audioContext.resume().catch(()=>{});if(!effectLoading&&!effectBuffer){effectLoading=fetch(effectUrl).then(r=>{if(!r.ok)throw new Error('Sound unavailable');return r.arrayBuffer();}).then(b=>audioContext.decodeAudioData(b)).then(b=>{effectBuffer=b;}).catch(()=>audioMessage('Marble sound unavailable.')).finally(()=>{effectLoading=null;});}}
function marbleSound(){if(!audioPrefs.sfx||document.hidden||!effectBuffer||!audioContext||audioContext.state!=='running')return;const source=audioContext.createBufferSource(),gain=audioContext.createGain();source.buffer=effectBuffer;gain.gain.value=0.32;source.connect(gain);gain.connect(audioContext.destination);source.onended=()=>{source.disconnect();gain.disconnect();};source.start();}
root.addEventListener('pointerdown',e=>{if(e.target.closest('.cs-audio-controls'))return;startMusic();unlockEffect();},{capture:true});root.addEventListener('keydown',e=>{if(e.target.closest('.cs-audio-controls'))return;startMusic();unlockEffect();},{capture:true});
$('.cs-music-toggle').addEventListener('change',e=>{audioPrefs.music=e.target.checked;audioSave();if(audioPrefs.music)startMusic();else{music.pause();audioMessage('');}});
$('.cs-sfx-toggle').addEventListener('change',e=>{audioPrefs.sfx=e.target.checked;audioSave();if(audioPrefs.sfx)unlockEffect();});
$('.cs-music-volume').addEventListener('input',e=>{audioPrefs.volume=Number(e.target.value)/100;music.volume=audioPrefs.volume;$('.cs-volume-value').textContent=Math.round(audioPrefs.volume*100)+'%';audioSave();});
music.addEventListener('error',()=>{if(audioPrefs.music)audioMessage('Music unavailable. Please check the audio installation.');});document.addEventListener('visibilitychange',()=>{if(document.hidden)music.pause();else startMusic();});window.addEventListener('pagehide',()=>music.pause());audioControls();

const KEY='kilobytes-colorscan-v1';let lockedColor=0,lastPalette=null,paletteTimer=null,busy=false,scoreBusy=false;let apiBase=window.ColorSCANConfig?.apiBase||null;let state,selected=-1,noteMode=false,history=[],checked=new Set(),showLabels=false,showConflicts=true;const peers=(a,b)=>Math.floor(a/9)===Math.floor(b/9)||a%9===b%9||(Math.floor(a/27)===Math.floor(b/27)&&Math.floor(a%9/3)===Math.floor(b%9/3));
const shuffle=a=>{for(let i=a.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
function countSolutions(b,limit=2){let best=-1,opts=[];for(let i=0;i<81;i++)if(!b[i]){let o=[];for(let n=1;n<=9;n++)if(!b.some((v,j)=>v===n&&peers(i,j)))o.push(n);if(!o.length)return 0;if(best<0||o.length<opts.length){best=i;opts=o;if(o.length===1)break}}if(best<0)return 1;let count=0;for(const n of opts){b[best]=n;count+=countSolutions(b,limit-count);if(count>=limit)break}b[best]=0;return count}
function generate(level){let groups=()=>shuffle([0,1,2]).flatMap(g=>shuffle([0,1,2]).map(n=>g*3+n));const rows=groups(),cols=groups(),nums=shuffle([1,2,3,4,5,6,7,8,9]);let solution=rows.flatMap(r=>cols.map(c=>nums[(r*3+Math.floor(r/3)+c)%9]));let givens=[...solution],target={easy:42,medium:34,hard:28}[level];for(const i of shuffle([...Array(81).keys()])){if(givens.filter(Boolean).length<=target)break;let n=givens[i];givens[i]=0;if(countSolutions([...givens])!==1)givens[i]=n}return {v:1,level,solution,givens,board:[...givens],notes:Array.from({length:81},()=>[]),seconds:0,hints:0,complete:false}}
function validSaved(s){return s&&s.v===1&&['easy','medium','hard'].includes(s.level)&&['solution','givens','board','notes'].every(k=>Array.isArray(s[k])&&s[k].length===81)&&s.solution.every(v=>Number.isInteger(v)&&v>=1&&v<=9)&&s.solution.every((v,i)=>!s.solution.some((w,j)=>j!==i&&w===v&&peers(i,j)))&&s.board.every((v,i)=>Number.isInteger(v)&&v>=0&&v<=9&&(!s.givens[i]||v===s.givens[i]))&&s.givens.every((v,i)=>v===0||v===s.solution[i])&&s.notes.every(a=>Array.isArray(a)&&a.every(v=>Number.isInteger(v)&&v>=1&&v<=9))&&(!s.run||(typeof s.run.token==='string'&&/^[a-f0-9]{64}$/.test(s.run.token)&&Number.isInteger(s.run.startedAt)&&s.run.startedAt>0))&&Number.isInteger(s.hints)&&s.hints>=0&&Number.isFinite(s.seconds)&&s.seconds>=0}
function save(){if(!state.run)return;state.lockedColor=lockedColor;try{localStorage.setItem(KEY,JSON.stringify({...state,showLabels,showConflicts}))}catch(e){}}
function say(t){$('.cs-status').textContent=t}function snapshot(){history.push({board:[...state.board],notes:state.notes.map(a=>[...a]),complete:state.complete});if(history.length>150)history.shift()}
function dot(n,small=false){let [name,c,t]=colors[n-1];return `<span class="${small?'cs-note':'cs-dot'}" style="--c:${c};--t:${t}" aria-hidden="true">${showLabels&&!small?n:''}</span>`}
// Keep event timestamps across render() rebuilding the board, so rapid input
// neither restarts an animation nor animates every unchanged starting marble.
let paintedBoard = null, paintedNotes = null, paintedRun = null;
let feedbackKind = 'place';
const motionEvents = new Map();
function animateFeedback() {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const now = performance.now();
  const nextRun = state.run?.token || null;
  if (paintedRun !== nextRun) {
    motionEvents.clear();
    if (nextRun) motionEvents.set('.cs-board', { at: now, kind: 'start' });
  } else if (paintedBoard) {
    state.board.forEach((value, i) => {
      if (value !== paintedBoard[i] || state.notes[i].join() !== paintedNotes[i]) {
        motionEvents.set(`[data-cell="${i}"]`, { at: now, kind: !value && paintedBoard[i] ? 'erase' : feedbackKind });
      }
    });
  }
  paintedRun = nextRun;
  paintedBoard = [...state.board];
  paintedNotes = state.notes.map(notes => notes.join());
  feedbackKind = 'place';
  for (const [selector, event] of motionEvents) {
    const elapsed = now - event.at;
    const duration = event.kind === 'start' ? 420 : event.kind === 'hint' ? 320 : event.kind === 'erase' ? 120 : 180;
    if (elapsed >= duration || reduced) { motionEvents.delete(selector); continue; }
    const cell = $(selector);
    const target = cell?.querySelector('.cs-dot,.cs-notes-grid') || cell;
    if (!target?.animate) continue;
    const frames = event.kind === 'start'
      ? [{ opacity: .35, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }]
      : event.kind === 'hint'
        ? [{ transform: 'scale(.7)', filter: 'brightness(1.4)' }, { transform: 'scale(1.12)' }, { transform: 'scale(1)', filter: 'none' }]
        : event.kind === 'erase' || event.kind === 'undo'
          ? [{ opacity: .35 }, { opacity: 1 }]
          : [{ transform: 'scale(.65)' }, { transform: 'scale(1.12)', offset: .65 }, { transform: 'scale(1)' }];
    const animation = target.animate(frames, { duration, easing: 'ease-out' });
    animation.currentTime = elapsed;
  }
  const mode = $('.cs-mode');
  mode.textContent = noteMode ? 'Notes on · add possible colors.'
    : lockedColor ? `${colors[lockedColor - 1][0]} locked · tap empty spaces.`
    : selected < 0 ? 'Select a space to begin.'
    : state.givens[selected] ? 'Starting piece · choose an editable space.'
    : `Row ${Math.floor(selected / 9) + 1}, column ${selected % 9 + 1} · choose a color.`;
  mode.dataset.active = String(noteMode || !!lockedColor);
  $('.cs-meter-fill').style.setProperty('--progress', `${state.board.filter(Boolean).length / 81 * 100}%`);
  root.setAttribute('aria-busy', String(busy));
}

function animateCheck() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const cells = checked.size ? [...checked].map(i => $(`[data-cell="${i}"]`)) : [$('.cs-board')];
  for (const cell of cells) cell?.animate?.(
    checked.size
      ? [{ transform: 'translateX(0)' }, { transform: 'translateX(-2px)' }, { transform: 'translateX(2px)' }, { transform: 'translateX(0)' }]
      : [{ boxShadow: '0 0 0 0 #00a66c00' }, { boxShadow: '0 0 0 5px #00a66c44' }, { boxShadow: '0 0 0 0 #00a66c00' }],
    { duration: 300, easing: 'ease-out' });
}

function render(){const b=state.board;$('.cs-board').innerHTML=b.map((v,i)=>{let conflict=v&&b.some((w,j)=>j!==i&&w===v&&peers(i,j));let cl=['cs-cell',v&&!state.givens[i]&&!state.complete?'cs-movable':'',state.givens[i]?'cs-fixed':'',selected===i?'cs-selected':selected>=0&&peers(selected,i)?'cs-peer':'',selected>=0&&v&&b[selected]===v?'cs-same':'',(showConflicts&&conflict)||checked.has(i)?'cs-conflict':''].join(' ');return `<button class="${cl}" data-cell="${i}" tabindex="${i===(selected<0?0:selected)?0:-1}" aria-label="Row ${Math.floor(i/9)+1}, column ${i%9+1}, ${v?colors[v-1][0]+(state.givens[i]?', starting piece':''):'empty'+(state.notes[i].length?', notes '+state.notes[i].map(n=>colors[n-1][0]).join(', '):'')}" aria-pressed="${selected===i}">${v?dot(v):state.notes[i].length?'<span class="cs-notes-grid">'+Array.from({length:9},(_,k)=>state.notes[i].includes(k+1)?dot(k+1,true):'<span></span>').join('')+'</span>':''}</button>`}).join('');$('.cs-palette').innerHTML=colors.map(([name,c,t],i)=>`<button class="cs-color" aria-pressed="${lockedColor===i+1}" data-color="${i+1}" aria-label="Place ${name}, ${b.filter(v=>v===i+1).length} of 9 used">${dot(i+1)}<span class="cs-count">${b.filter(v=>v===i+1).length}/9</span></button>`).join('');$('.cs-progress').textContent=b.filter(Boolean).length+'/81';$('.cs-level').textContent=state.level.toUpperCase()+' / '+(state.complete?'NICELY DONE':'TAKE YOUR TIME');$('[data-action=undo]').disabled=!history.length||state.complete;$('[data-action=notes]').setAttribute('aria-pressed',noteMode);$('.cs-difficulty').value=state.level;$('.cs-labels').checked=showLabels;$('.cs-conflicts').checked=showConflicts;renderTime();animateFeedback()}
function renderTime(){$('.cs-time').textContent=String(Math.floor(state.seconds/60)).padStart(2,'0')+':'+String(state.seconds%60).padStart(2,'0')}
function place(n){if(busy||!state.run)return;if(selected<0){say('Choose a space on the board first.');return}if(state.givens[selected]){say('Starting pieces are locked. Choose an empty space.');return}if(state.complete)return;snapshot();checked.clear();if(noteMode&&n){if(state.board[selected]){history.pop();say('Erase this piece before adding notes.');return}let a=state.notes[selected];state.notes[selected]=a.includes(n)?a.filter(v=>v!==n):[...a,n].sort()}else{const changed=state.board[selected]!==n;state.board[selected]=n;state.notes[selected]=[];if(n&&changed)marbleSound();if(n)state.notes.forEach((a,j)=>{if(peers(selected,j))state.notes[j]=a.filter(v=>v!==n)})}say(noteMode?'Notes help you track possible colors.':'Keep going. One space at a time.');finish();save();render()}
const formatTime=s=>String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');
function endpoint(path){const url=new URL(apiBase,window.location.href);if(!url.searchParams.has('rest_route'))return new URL(path,url).href;const [route,query='']=path.split('?');url.searchParams.set('rest_route',url.searchParams.get('rest_route')+route);for(const [key,value] of new URLSearchParams(query))url.searchParams.set(key,value);return url.href}
async function api(path,data){if(!apiBase)throw new Error('Shared scores need the ColorSCAN WordPress plugin.');const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),12000);try{const response=await fetch(endpoint(path),{method:data?'POST':'GET',headers:data?{'Content-Type':'application/json'}:{},body:data?JSON.stringify(data):undefined,cache:'no-store',signal:controller.signal});let result;try{result=await response.json()}catch(e){throw new Error('The leaderboard returned an unreadable response.')}if(!response.ok)throw new Error(result.message||'The leaderboard is unavailable.');return result}finally{clearTimeout(timeout)}}
function runData(){return {token:state.run.token}}
function confetti(){if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;const layer=document.createElement('div');layer.className='cs-confetti';layer.setAttribute('aria-hidden','true');for(let i=0;i<45;i++){const bit=document.createElement('i');bit.style.cssText='left:'+Math.random()*100+'%;--c:'+colors[i%9][1]+';--d:'+Math.random()*.5+'s';layer.appendChild(bit)}root.appendChild(layer);setTimeout(()=>layer.remove(),3200)}
async function finish(){if(!state.run||state.complete||!state.board.every((v,i)=>v===state.solution[i]))return;state.complete=true;save();say('Beautifully solved! You did a good job!');showWin(true)}
async function showWin(animate=false){const current=state;$('.cs-win-time').textContent=formatTime(state.seconds);$('.cs-score-form').hidden=true;$('.cs-win-detail').textContent=state.hints?'Lovely work! Hints were used, so this puzzle is not eligible for the leaderboard.':state.submitted?'Your score has been saved.':!state.run?'Practice puzzle complete. Shared scores require a new puzzle with the WordPress plugin connected.':'Verifying your finish…';if(!$('.cs-win').open)$('.cs-win').showModal();if(animate)confetti();if(!state.hints&&state.run&&!state.submitted){try{const r=await api('finish',{...runData(),board:state.board});if(state!==current)return;state.seconds=r.seconds;state.finished=true;save();$('.cs-win-time').textContent=formatTime(r.seconds);$('.cs-win-detail').textContent='No hints. Your run qualifies!';$('.cs-score-form').hidden=false}catch(e){if(state===current){$('.cs-win-detail').textContent=e.message+' Use “View win” to retry.';say('Your puzzle is saved. Open View win to retry score verification.')}}}}
function solveBoard(board){const b=[...board];function solve(){let best=-1,opts=[];for(let i=0;i<81;i++)if(!b[i]){let o=[];for(let n=1;n<=9;n++)if(!b.some((v,j)=>v===n&&peers(i,j)))o.push(n);if(!o.length)return false;if(best<0||o.length<opts.length){best=i;opts=o}}if(best<0)return true;for(const n of opts){b[best]=n;if(solve())return true}b[best]=0;return false}if(!solve())throw new Error('The puzzle could not be loaded.');return b}
async function newGame(){if(busy)return;apiBase=window.ColorSCANConfig?.apiBase||apiBase;busy=true;clearTimeout(paletteTimer);lastPalette=null;const level=$('.cs-difficulty').value,previous=state;say('Creating your puzzle…');try{let next;if(apiBase){const r=await api('start',{level});next={v:1,level:r.level,solution:solveBoard(r.givens),givens:r.givens,board:[...r.givens],notes:Array.from({length:81},()=>[]),seconds:0,hints:0,complete:false,run:{token:r.token,startedAt:r.started_at}}}else throw new Error('The ranked game connection is unavailable.');state=next;startMusic();history=[];selected=-1;lockedColor=0;checked.clear();noteMode=false;save();render();$('.cs-rank-level').value=state.level;loadScores();say(apiBase?'Ranked puzzle ready. The clock includes time away from the page. Any hint makes this puzzle ineligible.':'Practice puzzle ready. Color lock and celebrations work here; shared rankings connect through the WordPress plugin.')}catch(e){state=previous;say(e.message+(state.run?' Your previous puzzle is preserved.':' Select New puzzle to retry.'))}finally{busy=false;render()}}
let scoreRequest=0;
async function loadScores(){const request=++scoreRequest,select=$('.cs-rank-level'),level=select.value,button=$('[data-action="refresh-scores"]');button.disabled=true;button.textContent='Updating…';$('.cs-rank-status').textContent='Loading high scores…';try{if(!apiBase)throw new Error('Connect the ColorSCAN WordPress plugin to load shared scores.');const r=await api('scores?level='+encodeURIComponent(level)+'&_cs='+Date.now()+'-'+request);if(request!==scoreRequest||select.value!==level)return;if(!Array.isArray(r.scores))throw new Error('Unexpected leaderboard response. Please retry.');const body=$('.cs-leaderboard tbody');body.replaceChildren();for(const [i,score] of r.scores.entries()){const row=document.createElement('tr');if(state.lastScore&&state.lastScore.level===level&&score.initials===state.lastScore.initials&&Number(score.seconds)===state.lastScore.seconds){row.className='cs-your-score';row.setAttribute('aria-label','Your saved score');}for(const value of [i+1,score.initials,formatTime(score.seconds),level.charAt(0).toUpperCase()+level.slice(1)]){const cell=document.createElement('td');cell.textContent=value;row.appendChild(cell)}body.appendChild(row)}$('.cs-leaderboard table').hidden=!r.scores.length;const found=!!body.querySelector('.cs-your-score');$('.cs-rank-status').textContent='Scores updated · '+new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',second:'2-digit'})+'. '+(state.lastScore&&state.lastScore.level===level?(found?'Your saved score is highlighted.':'Your score is saved; it is not in the returned top 10.'):r.scores.length?'Fastest 10 no-hint wins.':'No scores yet. Set the first one!');return true;}catch(e){if(request===scoreRequest){$('.cs-rank-status').textContent='Could not update scores. '+e.message+' Tap Refresh to retry.';}return false;}finally{if(request===scoreRequest){button.disabled=false;button.textContent='Refresh';}}}

function palette(n){if(busy||!state.run||state.complete)return;const now=Date.now();if(lockedColor===n){lockedColor=0;lastPalette=null;clearTimeout(paletteTimer);save();render();return}if(lastPalette&&lastPalette.n===n&&now-lastPalette.at<350){clearTimeout(paletteTimer);lastPalette=null;lockedColor=n;noteMode=false;save();render();say(colors[n-1][0]+' locked. Tap spaces to place it.');return}clearTimeout(paletteTimer);if(lastPalette)place(lastPalette.n);lastPalette={n,at:now};paletteTimer=setTimeout(()=>{lastPalette=null;lockedColor=0;place(n);save();render()},350)}
async function useHint(){if(busy||!state.run||state.complete)return;let i=selected>=0&&!state.givens[selected]&&state.board[selected]!==state.solution[selected]?selected:state.board.findIndex((v,i)=>v!==state.solution[i]);if(i<0)return;const current=state;busy=true;try{if(state.run)await api('hint',runData());if(state!==current)return;snapshot();feedbackKind='hint';selected=i;state.hints++;state.board[i]=state.solution[i];state.notes[i]=[];marbleSound();state.notes.forEach((a,j)=>{if(peers(i,j))state.notes[j]=a.filter(v=>v!==state.solution[i])});checked.clear();say('Hint placed. This puzzle is no longer eligible for the leaderboard, even after undo.');finish();save();render()}catch(e){say(e.message+' No hint was revealed.')}finally{busy=false;render()}}
// Marble movement is one atomic, undoable edit. Dragging never changes the
// saved board until a valid drop is accepted.
function moveMarble(from, to) {
  if (busy || !state.run || state.complete || !Number.isInteger(from) || !Number.isInteger(to) ||
      from < 0 || from > 80 || to < 0 || to > 80 || from === to ||
      state.givens[from] || state.givens[to] || !state.board[from] || state.board[to]) return false;
  snapshot();
  const value = state.board[from];
  state.board[from] = 0;
  state.board[to] = value;
  state.notes[from] = [];
  state.notes[to] = [];
  state.notes.forEach((notes, i) => {
    if (peers(to, i)) state.notes[i] = notes.filter(n => n !== value);
  });
  selected = to;
  checked.clear();
  marbleSound();
  say('Marble moved. Undo brings it back.');
  finish();
  save();
  render();
  if (!state.complete) $(`[data-cell="${to}"]`)?.focus({preventScroll:true});
  return true;
}

// Pointer gestures: normal taps remain immediate; hold a placed marble to lift.
const dragBoard = $('.cs-board');
let marbleDrag = null, suppressBoardClickUntil = 0;
function clearMarbleDrag(message = '') {
  const drag = marbleDrag;
  if (!drag) return;
  marbleDrag = null;
  clearTimeout(drag.timer);
  drag.ghost?.remove();
  drag.source.classList.remove('cs-drag-source');
  drag.target?.classList.remove('cs-drop-target');
  root.classList.remove('cs-dragging');
  if (drag.active) {
    suppressBoardClickUntil = performance.now() + 500;
    try { if (dragBoard.hasPointerCapture(drag.pointer)) dragBoard.releasePointerCapture(drag.pointer); } catch (_) {}
    if (message) say(message);
  }
}
function dragTargetAt(x, y) {
  const cell = document.elementFromPoint(x, y)?.closest('[data-cell]');
  return cell && dragBoard.contains(cell) ? cell : null;
}
function updateMarbleDrag(x, y) {
  const drag = marbleDrag;
  if (!drag?.active) return;
  drag.ghost.style.transform = `translate3d(${x - drag.size / 2}px,${y - drag.size / 2}px,0)`;
  const cell = dragTargetAt(x, y), index = cell ? Number(cell.dataset.cell) : -1;
  const valid = index >= 0 && index !== drag.from && !state.givens[index] && !state.board[index];
  drag.target?.classList.remove('cs-drop-target');
  drag.target = valid ? cell : null;
  drag.target?.classList.add('cs-drop-target');
}
dragBoard.addEventListener('pointerdown', event => {
  if (marbleDrag) { clearMarbleDrag('Move canceled. Marble kept in place.'); return; }
  const cell = event.target.closest('[data-cell]');
  if (!cell || event.button !== 0 || event.isPrimary === false || busy || !state.run || state.complete) return;
  const from = Number(cell.dataset.cell);
  if (state.givens[from] || !state.board[from]) return;
  clearTimeout(paletteTimer);
  lastPalette = null;
  const drag = {from, value:state.board[from], game:state, source:cell, pointer:event.pointerId,
    x:event.clientX, y:event.clientY, active:false, target:null, ghost:null};
  marbleDrag = drag;
  drag.timer = setTimeout(() => {
    if (marbleDrag !== drag || state !== drag.game || busy || state.complete || state.board[from] !== drag.value) {
      clearMarbleDrag(); return;
    }
    drag.active = true;
    drag.size = Math.max(22, Math.min(52, cell.getBoundingClientRect().width * .7));
    drag.ghost = document.createElement('div');
    drag.ghost.className = 'cs-drag-ghost';
    drag.ghost.setAttribute('aria-hidden', 'true');
    drag.ghost.innerHTML = dot(drag.value);
    drag.ghost.style.width = drag.ghost.style.height = drag.size + 'px';
    root.appendChild(drag.ghost);
    cell.classList.add('cs-drag-source');
    root.classList.add('cs-dragging');
    try { dragBoard.setPointerCapture(drag.pointer); } catch (_) {}
    say('Marble picked up. Drop it on an empty space, or release elsewhere to cancel.');
    updateMarbleDrag(drag.x, drag.y);
  }, 380);
});
dragBoard.addEventListener('pointermove', event => {
  const drag = marbleDrag;
  if (!drag || event.pointerId !== drag.pointer) return;
  if (!drag.active) {
    if (Math.hypot(event.clientX - drag.x, event.clientY - drag.y) > 10) clearMarbleDrag();
    return;
  }
  event.preventDefault();
  updateMarbleDrag(event.clientX, event.clientY);
}, {passive:false});
dragBoard.addEventListener('pointerup', event => {
  const drag = marbleDrag;
  if (!drag || event.pointerId !== drag.pointer) return;
  if (!drag.active) { clearMarbleDrag(); return; }
  event.preventDefault();
  const target = dragTargetAt(event.clientX, event.clientY);
  const to = target ? Number(target.dataset.cell) : -1;
  const sameGame = state === drag.game && state.board[drag.from] === drag.value;
  clearMarbleDrag();
  if (!sameGame || !moveMarble(drag.from, to)) say('Move canceled. Marble kept in place.');
});
dragBoard.addEventListener('pointercancel', () => clearMarbleDrag('Move canceled. Marble kept in place.'));
dragBoard.addEventListener('lostpointercapture', () => clearMarbleDrag('Move canceled. Marble kept in place.'));
dragBoard.addEventListener('pointerleave', () => { if (marbleDrag && !marbleDrag.active) clearMarbleDrag(); });
document.addEventListener('pointerup', event => {
  if (marbleDrag && event.pointerId === marbleDrag.pointer) clearMarbleDrag('Move canceled. Marble kept in place.');
});
document.addEventListener('pointerdown', event => {
  if (marbleDrag && event.pointerId !== marbleDrag.pointer) clearMarbleDrag('Move canceled. Marble kept in place.');
});
root.addEventListener('pointerdown', () => { suppressBoardClickUntil = 0; }, true);
root.addEventListener('click', event => {
  if (performance.now() < suppressBoardClickUntil && event.detail) {
    event.preventDefault(); event.stopImmediatePropagation(); suppressBoardClickUntil = 0;
  }
}, true);
dragBoard.addEventListener('contextmenu', event => {
  if (marbleDrag || event.target.closest('.cs-movable')) event.preventDefault();
});
root.addEventListener('keydown', event => {
  if (!marbleDrag) return;
  clearMarbleDrag('Move canceled. Marble kept in place.');
  if (event.key === 'Escape') { event.preventDefault(); event.stopImmediatePropagation(); }
}, true);
window.addEventListener('blur', () => clearMarbleDrag());
window.addEventListener('resize', () => clearMarbleDrag());
window.addEventListener('pagehide', () => clearMarbleDrag());
document.addEventListener('visibilitychange', () => { if (document.hidden) clearMarbleDrag(); });

// Move the original controls, rather than duplicate action buttons/state.
const mobileLayout = window.matchMedia('(max-width:800px), (pointer:coarse)');
function positionMoveControls() {
  clearMarbleDrag();
  const undo = $('[data-action="undo"]'), erase = $('[data-action="erase"]');
  const focused = document.activeElement;
  if (mobileLayout.matches) {
    $('.cs-quick-actions').append(undo, erase);
    $('.cs-feedback').append($('.cs-status'));
  } else {
    $('.cs-tools').prepend(undo, erase);
    $('.cs-play').append($('.cs-status'));
  }
  if (focused === undo || focused === erase) focused.focus({preventScroll:true});
}
mobileLayout.addEventListener('change', positionMoveControls);
positionMoveControls();

root.addEventListener('click',e=>{let c=e.target.closest('[data-cell]');if(c){clearTimeout(paletteTimer);lastPalette=null;selected=+c.dataset.cell;if(lockedColor&&!state.givens[selected]&&!state.board[selected])place(lockedColor);render();$(`[data-cell="${selected}"]`).focus({preventScroll:true});return}let p=e.target.closest('[data-color]');if(p){palette(+p.dataset.color);return}const action=e.target.closest('[data-action]')?.dataset.action;if(action==='erase')place(0);if(action==='notes'){noteMode=!noteMode;render();say(noteMode?'Notes on. Choose a space and add possible colors.':'Notes off. Place colors normally.')}if(action==='undo'&&history.length&&!state.complete&&!busy){feedbackKind='undo';Object.assign(state,history.pop());checked.clear();save();render();say('Last move undone.')}if(action==='check'){checked=new Set(state.board.flatMap((v,i)=>v&&v!==state.solution[i]?[i]:[]));render();animateCheck();say(checked.size?checked.size+' placed piece'+(checked.size===1?' needs':'s need')+' another look.':'All placed colors match the solution so far.')}if(action==='hint')useHint();if(action==='refresh-scores')loadScores();if(action==='close-win')$('.cs-win').close();if(action==='view-win'&&state.complete)showWin();if(action==='rules'){let b=e.target.closest('button'),expanded=b.getAttribute('aria-expanded')==='true';b.setAttribute('aria-expanded',!expanded);$('.cs-help').hidden=expanded;say(expanded?'Select a space, then choose a color.':'Use each color once per row, column, and 3 × 3 box. Starting pieces (marked with a small dot) are locked. Notes track possibilities. Palette counts show how many of each color are on the board.')}});
$('.cs-new').onclick=()=>{if(state.board.some((v,i)=>v!==state.givens[i])&&!state.complete)$('.cs-dialog').showModal();else newGame()};$('[data-dialog=cancel]').onclick=()=>{$('.cs-dialog').close();$('.cs-difficulty').value=state.level};$('[data-dialog=confirm]').onclick=()=>{$('.cs-dialog').close();newGame()};$('.cs-dialog').addEventListener('cancel',()=>{$('.cs-difficulty').value=state.level});$('.cs-labels').onchange=e=>{showLabels=e.target.checked;save();render()};$('.cs-conflicts').onchange=e=>{showConflicts=e.target.checked;save();render()};
root.addEventListener('keydown',e=>{if(!e.target.closest('.cs-board'))return;let i=selected<0?0:selected;const step={ArrowLeft:-1,ArrowRight:1,ArrowUp:-9,ArrowDown:9}[e.key];if(step){e.preventDefault();selected=(i+step+81)%81;render();$(`[data-cell="${selected}"]`).focus({preventScroll:true})}else if(/^[1-9]$/.test(e.key)){e.preventDefault();place(+e.key);$(`[data-cell="${selected}"]`)?.focus({preventScroll:true})}else if(['Delete','Backspace','0'].includes(e.key)){e.preventDefault();place(0);$(`[data-cell="${selected}"]`)?.focus({preventScroll:true})}});
try{let saved=JSON.parse(localStorage.getItem(KEY));if(validSaved(saved)&&saved.run){state=saved;showLabels=!!saved.showLabels;showConflicts=saved.showConflicts!==false;state.complete=state.board.every((v,i)=>v===state.solution[i])}}catch(e){}if(!state)state={v:1,level:'easy',solution:Array(81).fill(0),givens:Array(81).fill(0),board:Array(81).fill(0),notes:Array.from({length:81},()=>[]),seconds:0,hints:0,complete:false};lockedColor=Number.isInteger(state.lockedColor)&&state.lockedColor>=1&&state.lockedColor<=9?state.lockedColor:0;$('.cs-spectrum').innerHTML=colors.map(c=>`<i style="--c:${c[1]}"></i>`).join('');render();say(state.complete?'Welcome back. Your completed puzzle is saved.':'Select a space, then choose a color. Your progress saves on this browser.');setInterval(()=>{if(!state.complete&&!busy&&state.run){state.seconds=state.run?Math.max(0,Math.floor(Date.now()/1000)-state.run.startedAt):state.seconds+1;renderTime();if(state.seconds%5===0)save()}},1000);window.addEventListener('pagehide',save);
$('.cs-rank-level').onchange=loadScores;loadScores();
const viewWin=document.createElement('button');viewWin.className='cs-tool';viewWin.dataset.action='view-win';viewWin.textContent='View win ♡';$('.cs-leaderboard').before(viewWin);const oldRender=render;render=function(){oldRender();viewWin.hidden=!state.complete;$('.cs-board').hidden=!state.run;$('.cs-palette').hidden=!state.run;for(const button of root.querySelectorAll('.cs-tools button'))button.disabled=!state.run||busy||(button.dataset.action==='undo'&&(!history.length||state.complete));};render();
$('.cs-score-form').onsubmit=async e=>{e.preventDefault();if(scoreBusy||state.hints||!state.complete||!state.run||state.submitted)return;const initials=$('#cs-initials').value.trim().toUpperCase();if(!/^[A-Z]{3}$/.test(initials))return;scoreBusy=true;const current=state;const button=$('.cs-score-form button');button.disabled=true;try{const r=await api('score',{...runData(),initials});if(state!==current)return;state.submitted=true;state.lastScore={initials:r.initials||initials,seconds:Number(r.seconds),level:state.level};save();$('.cs-score-form').hidden=true;$('.cs-win-detail').textContent='Saved! '+(r.initials||initials)+' · '+formatTime(r.seconds)+'. Beautifully done!';$('.cs-rank-level').value=state.level;const updated=await loadScores();if(state===current)$('.cs-win-detail').textContent+=' '+(updated?'Leaderboard updated. Close this window to see the scores.':'Your score is saved, but the leaderboard could not refresh. Use Refresh to retry.');}catch(e){if(state===current)$('.cs-win-detail').textContent=e.message+' Please try again.'}finally{scoreBusy=false;button.disabled=false}};


const fullButton=$('[data-action="fullscreen"]');let fullPlaceholder=null,oldOverflow='',returnFocus=null;
function expanded(){return root.classList.contains('cs-expanded');}
function leaveExpanded(){if(!expanded())return;root.classList.remove('cs-expanded');document.body.style.overflow=oldOverflow;if(fullPlaceholder){fullPlaceholder.replaceWith(root);fullPlaceholder=null;}fullButton.textContent='Full screen';fullButton.setAttribute('aria-pressed','false');if(returnFocus&&returnFocus.isConnected)returnFocus.focus({preventScroll:true});}
async function toggleFull(){if(expanded()){if(document.fullscreenElement===root){try{await document.exitFullscreen();}catch(e){} }leaveExpanded();return;}returnFocus=document.activeElement;fullPlaceholder=document.createElement('span');root.before(fullPlaceholder);oldOverflow=document.body.style.overflow;document.body.appendChild(root);root.classList.add('cs-expanded');document.body.style.overflow='hidden';fullButton.textContent='Exit full screen';fullButton.setAttribute('aria-pressed','true');fullButton.focus({preventScroll:true});if(root.requestFullscreen){try{await root.requestFullscreen();}catch(e){/* Expanded view remains available. */}}}
fullButton.addEventListener('click',toggleFull);document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement&&expanded())leaveExpanded();});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&expanded()&&!document.fullscreenElement){e.preventDefault();leaveExpanded();}});

if(!state.run)newGame();else startMusic();
})();
