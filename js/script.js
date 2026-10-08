'use strict';

// Frègètal — fiche publique. Le cauchemar et l'écran final sont irréversibles
// jusqu'au rechargement de la page. Aucun secret privé n'est révélé ici.
const body = document.body;
const jobsValue = document.getElementById('jobsValue');
// Le lecteur reste hors de la barre animée pour ne pas être déplacé par le parasite.
const floatingPlayer = document.querySelector('.top-right');
if (floatingPlayer) document.body.appendChild(floatingPlayer);
const flower = document.getElementById('flowerTrigger');
const tooltip = document.getElementById('flowerTooltip');
const overlay = document.getElementById('returnOverlay');
const choices = document.getElementById('choices');
const terminal = document.getElementById('terminalScreen');
const soundToggle = document.getElementById('soundToggle');
const soundButtonText = document.getElementById('soundButtonText');
const soundConsole = document.getElementById('soundConsole');
const soundVolume = document.getElementById('soundVolume');
const soundVolumeValue = document.getElementById('soundVolumeValue');
const dreamAudio = document.getElementById('dreamAudio');
const nightmareAudio = document.getElementById('nightmareAudio');
const flash = document.querySelector('.crash-flash');

let phase = 'dream'; // dream -> nightmare -> terminal
let soundEnabled = false;
let transitioning = false;
let lastFocused = null;
const buttons = [];

// Le curseur règle la musique des deux mondes et le grésillement du parasite.
// Niveau de départ volontairement doux (35 %) pour préserver les oreilles.
let masterVolume = Number(soundVolume.value) / 100;
function applySoundVolume() {
  dreamAudio.volume = masterVolume;
  nightmareAudio.volume = masterVolume;
  soundVolumeValue.textContent = `${Math.round(masterVolume * 100)} %`;
  soundVolume.style.setProperty('--volume-fill', `${Math.round(masterVolume * 100)}%`);
  // Le grésillement est plafonné séparément pour ne pas dominer la musique.
  if (parasiteGain && parasiteAudioContext && phase === 'nightmare') {
    const now = parasiteAudioContext.currentTime;
    if (body.classList.contains('parasite-active') && soundEnabled) {
      parasiteGain.gain.setTargetAtTime(masterVolume * .20, now, .12);
    }
  }
}
function updateSoundLabel() {
  soundButtonText.textContent = soundEnabled ? 'COUPER L’AMBIANCE' : 'ACTIVER L’AMBIANCE';
  soundConsole.classList.toggle('is-playing', soundEnabled);
  soundToggle.setAttribute('aria-pressed', String(soundEnabled));
  soundToggle.setAttribute('aria-label', soundEnabled ? 'Couper la musique' : 'Activer la musique');
}
soundVolume.addEventListener('input', () => {
  masterVolume = Number(soundVolume.value) / 100;
  applySoundVolume();
});
function currentAudio() { return phase === 'dream' ? dreamAudio : nightmareAudio; }
function playIfEnabled() {
  if (!soundEnabled || phase === 'terminal') return;
  currentAudio().play().catch(() => {
    // Si le navigateur refuse la lecture ou si le fichier manque, la page reste utilisable.
  });
}
function stopAudio(audio) { audio.pause(); }

soundToggle.addEventListener('click', () => {
  if (phase === 'terminal') return;
  soundEnabled = !soundEnabled;
  if (soundEnabled) ensureParasiteAudio();
  updateSoundLabel();
  if (soundEnabled) playIfEnabled();
  else { stopAudio(dreamAudio); stopAudio(nightmareAudio); fadeParasiteNoise(false); }
});

function beginNightmare() {
  if (phase !== 'dream' || transitioning) return;
  transitioning = true;
  if (soundEnabled) ensureParasiteAudio();
  phase = 'nightmare';
  // Révéler la réputation propre au Cauchemar, sans modifier les textes d'origine.
  document.getElementById('dreamReputation').hidden = true;
  document.getElementById('nightmareReputation').hidden = false;
  // Identité révélée lorsque le Cauchemar commence.
  document.getElementById('ageValue').textContent = '147 ans';
  document.getElementById('raceValue').textContent = 'Vampire';
  stopAudio(dreamAudio);
  dreamAudio.currentTime = 0;
  flash.classList.remove('flash');
  void flash.offsetWidth;
  flash.classList.add('flash');
  body.classList.remove('dream');
  body.classList.add('nightmare');
  if (jobsValue) jobsValue.textContent = 'Botaniste / Chimiste des plantes & Dealeur';
  scheduleCentipede(3800);
  tooltip.textContent = 'Tu veux vraiment revenir ?';
  flower.setAttribute('aria-label', 'Essayer de revenir en arrière');
  window.setTimeout(() => {
    playIfEnabled();
    transitioning = false;
  }, 1050);
}

function openReturnTrap() {
  if (phase !== 'nightmare' || transitioning || overlay.classList.contains('open')) return;
  lastFocused = document.activeElement;
  overlay.classList.add('open');
  overlay.setAttribute('aria-hidden', 'false');
  // Aucun clic hors fenêtre, Échap ou autre raccourci ne ferme le piège.
  buttons[0]?.focus();
}

function endEverything() {
  if (phase === 'terminal') return;
  phase = 'terminal';
  stopCentipede();
  soundEnabled = false;
  stopAudio(dreamAudio);
  stopAudio(nightmareAudio);
  overlay.classList.remove('open');
  overlay.setAttribute('aria-hidden', 'true');
  terminal.classList.add('show');
  terminal.setAttribute('aria-hidden', 'false');
  body.style.overflow = 'hidden';
  soundToggle.disabled = true;
  soundVolume.disabled = true;
  soundConsole.classList.remove('is-playing');
  flower.disabled = true;
  // Pas de timer de sortie : rechargement obligatoire.
}

for (let i = 0; i < 12; i++) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'choice';
  button.textContent = 'OUI';
  button.setAttribute('aria-label', `Réponse ${i + 1} : oui`);
  button.addEventListener('click', () => {
    if (phase !== 'nightmare') return;
    if (button.classList.contains('no')) { endEverything(); return; }
    button.classList.add('no');
    button.textContent = 'NON';
    button.setAttribute('aria-label', `Réponse ${i + 1} : non`);
  });
  choices.appendChild(button);
  buttons.push(button);
}

flower.addEventListener('click', () => {
  if (phase === 'dream') beginNightmare();
  else if (phase === 'nightmare') openReturnTrap();
});

// Garde le focus dans la fenêtre modale, pour la navigation au clavier.
document.addEventListener('keydown', event => {
  if (!overlay.classList.contains('open') || phase !== 'nightmare') return;
  if (event.key === 'Escape') { event.preventDefault(); return; }
  if (event.key !== 'Tab') return;
  const first = buttons[0];
  const last = buttons[buttons.length - 1];
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
});

// Révélation douce du contenu au défilement.
const revealItems = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    }
  }, { threshold: 0.08 });
  revealItems.forEach(item => observer.observe(item));
} else revealItems.forEach(item => item.classList.add('visible'));

// Son facultatif : il démarre seulement après une action explicite sur SON.
updateSoundLabel();


// =========================================================
// MILLE-PATTES D'OMBRE — uniquement dans le cauchemar.
// Silhouette SVG dessinée par le navigateur : aucune image requise.
// Le parasite traverse l'écran devant le texte à intervalles irréguliers.
// =========================================================
const centipedeLayer = document.getElementById('centipedeLayer');
const SVG_NS = 'http://www.w3.org/2000/svg';
const SEGMENTS = 36;
const centipedeParts = [];
let centipedeTimer = null;
let centipedeFrame = null;
let centipedeRunning = false;

const centipedeSvg = document.createElementNS(SVG_NS, 'svg');
centipedeSvg.setAttribute('aria-hidden', 'true');
centipedeSvg.setAttribute('preserveAspectRatio', 'none');
centipedeLayer.appendChild(centipedeSvg);

function svgElement(tag, className, attributes = {}) {
  const el = document.createElementNS(SVG_NS, tag);
  if (className) el.setAttribute('class', className);
  Object.entries(attributes).forEach(([name, value]) => el.setAttribute(name, String(value)));
  return el;
}

// Chaque anneau possède une paire de pattes articulées et effilées.
for (let i = 0; i < SEGMENTS; i++) {
  const part = svgElement('g', 'centipede-part');
  const taper = Math.min(1, (SEGMENTS - i) / 9);
  const radius = (i === 0 ? 21 : 23) * (0.5 + 0.5 * taper);
  const legSize = (25 + 24 * taper);
  const legLeft = svgElement('path', 'centipede-leg', {
    d: `M -5 -${radius * .65} Q -${legSize * .8} -${radius + 10} -${legSize} -${radius + 24} L -${legSize + 12} -${radius + 31}`
  });
  const legRight = svgElement('path', 'centipede-leg', {
    d: `M -5 ${radius * .65} Q -${legSize * .8} ${radius + 10} -${legSize} ${radius + 24} L -${legSize + 12} ${radius + 31}`
  });
  const shell = svgElement('ellipse', 'centipede-segment', { cx: 0, cy: 0, rx: radius * 1.12, ry: radius * .91 });
  const spine = svgElement('path', 'centipede-spine', { d: `M ${radius * .6} -${radius * .4} Q ${radius * .1} 0 ${radius * .6} ${radius * .4}` });
  part.append(legLeft, legRight, shell, spine);
  centipedeSvg.appendChild(part);
  centipedeParts.push({ part, legLeft, legRight });
}

// Bruit synthétisé localement (aucun MP3 à fournir).
// Le volume du parasite ne dépasse jamais un niveau discret et est lissé.
let parasiteAudioContext = null;
let parasiteGain = null;
let parasiteSource = null;
let parasiteNoiseTimer = null;
function ensureParasiteAudio() {
  if (parasiteAudioContext) return;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  try {
    parasiteAudioContext = new AudioContextClass();
    const seconds = 3;
    const buffer = parasiteAudioContext.createBuffer(1, parasiteAudioContext.sampleRate * seconds, parasiteAudioContext.sampleRate);
    const data = buffer.getChannelData(0);
    let previous = 0;
    for (let i = 0; i < data.length; i++) {
      const white = Math.random() * 2 - 1;
      previous = (previous + white * .045) / 1.045;
      data[i] = previous * 1.9;
    }
    parasiteSource = parasiteAudioContext.createBufferSource();
    parasiteSource.buffer = buffer;
    parasiteSource.loop = true;
    const filter = parasiteAudioContext.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 980;
    filter.Q.value = .35;
    parasiteGain = parasiteAudioContext.createGain();
    parasiteGain.gain.value = 0;
    parasiteSource.connect(filter);
    filter.connect(parasiteGain);
    parasiteGain.connect(parasiteAudioContext.destination);
    parasiteSource.start();
  } catch (error) {
    // Le navigateur peut bloquer Web Audio ; les effets visuels restent actifs.
    parasiteAudioContext = null;
    parasiteGain = null;
  }
}
function fadeParasiteNoise(shouldPlay) {
  if (shouldPlay && (!soundEnabled || phase !== 'nightmare')) return;
  if (shouldPlay) ensureParasiteAudio();
  if (!parasiteGain || !parasiteAudioContext) return;
  if (shouldPlay) parasiteAudioContext.resume().catch(() => {});
  const now = parasiteAudioContext.currentTime;
  const gain = parasiteGain.gain;
  gain.cancelScheduledValues(now);
  gain.setValueAtTime(gain.value, now);
  gain.linearRampToValueAtTime(shouldPlay ? masterVolume * .20 : 0, now + (shouldPlay ? 1.5 : 1.9));
}

function stopCentipede() {
  centipedeRunning = false;
  window.clearTimeout(centipedeTimer);
  window.clearTimeout(parasiteNoiseTimer);
  if (centipedeFrame !== null) window.cancelAnimationFrame(centipedeFrame);
  centipedeFrame = null;
  centipedeSvg.style.opacity = '0';
  body.classList.remove('parasite-active');
  body.style.removeProperty('--parasite-strength');
  fadeParasiteNoise(false);
}

function scheduleCentipede(delay) {
  window.clearTimeout(centipedeTimer);
  if (phase !== 'nightmare' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  centipedeTimer = window.setTimeout(runCentipede, delay);
}

// Une trajectoire de Bézier à quatre points crée de vraies courbes et
// des virages, plutôt qu'une traversée droite agrémentée d'une onde.
function cubic(a, b, c, d, t) {
  const u = 1 - t;
  return u*u*u*a + 3*u*u*t*b + 3*u*t*t*c + t*t*t*d;
}
function runCentipede() {
  if (phase !== 'nightmare' || centipedeRunning) return;
  centipedeRunning = true;
  const width = window.innerWidth;
  const height = window.innerHeight;
  centipedeSvg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  centipedeSvg.style.opacity = '1';
  const fromLeft = Math.random() > .5;
  const vertical = Math.random() > .72;
  const side = fromLeft ? -1 : 1;
  const startY = height * (.14 + Math.random() * .72);
  const endY = height * (.14 + Math.random() * .72);
  const startX = fromLeft ? -150 : width + 150;
  const endX = fromLeft ? width + 150 : -150;
  const p0 = vertical ? [width * (.15 + Math.random() * .7), -150] : [startX, startY];
  const p3 = vertical ? [width * (.15 + Math.random() * .7), height + 150] : [endX, endY];
  const p1 = vertical ? [width * (Math.random() * .95), height * .25] : [width * (.12 + Math.random() * .38), height * Math.random()];
  const p2 = vertical ? [width * (Math.random() * .95), height * .75] : [width * (.52 + Math.random() * .38), height * Math.random()];
  const duration = 10500 + Math.random() * 6000;
  const trail = .72; // La queue suit les virages avec un décalage temporel.
  const start = performance.now();
  const wave = 10 + Math.random() * 15;
  body.classList.add('parasite-active');
  fadeParasiteNoise(true);

  function pointAt(t, now) {
    const safe = Math.max(0, Math.min(1, t));
    const x = cubic(p0[0],p1[0],p2[0],p3[0],safe);
    const y = cubic(p0[1],p1[1],p2[1],p3[1],safe);
    const dx = 3*(1-safe)**2*(p1[0]-p0[0]) + 6*(1-safe)*safe*(p2[0]-p1[0]) + 3*safe**2*(p3[0]-p2[0]);
    const dy = 3*(1-safe)**2*(p1[1]-p0[1]) + 6*(1-safe)*safe*(p2[1]-p1[1]) + 3*safe**2*(p3[1]-p2[1]);
    const len = Math.hypot(dx,dy) || 1;
    const sway = Math.sin(safe * 19 + now * .0018) * wave;
    return [x - dy / len * sway, y + dx / len * sway];
  }

  function animate(now) {
    if (phase !== 'nightmare') { stopCentipede(); return; }
    const progress = Math.min(1, (now - start) / duration);
    const leadT = progress * (1 + trail);
    // Les effets se manifestent à l'approche, puis s'éteignent progressivement.
    const envelope = Math.min(1, progress * 7, (1 - progress) * 7);
    body.style.setProperty('--parasite-strength', String((Math.max(0,envelope) * .62).toFixed(2)));
    if (progress > .78 && !parasiteNoiseTimer) {
      fadeParasiteNoise(false);
      parasiteNoiseTimer = window.setTimeout(() => {}, 1);
    }
    for (let i = 0; i < centipedeParts.length; i++) {
      const t = leadT - (i / (SEGMENTS - 1)) * trail;
      const [x,y] = pointAt(t, now);
      const [nextX,nextY] = pointAt(t + .003, now);
      const angle = Math.atan2(nextY-y,nextX-x) * 180 / Math.PI;
      const {part,legLeft,legRight} = centipedeParts[i];
      const outside = t < 0 || t > 1;
      part.style.opacity = outside ? '0' : '1';
      part.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${angle.toFixed(1)})`);
      const kick = Math.sin(now * .017 - i * .95) * 19;
      legLeft.setAttribute('transform', `rotate(${kick.toFixed(1)})`);
      legRight.setAttribute('transform', `rotate(${(-kick).toFixed(1)})`);
    }
    if (progress < 1) centipedeFrame = window.requestAnimationFrame(animate);
    else {
      stopCentipede();
      scheduleCentipede(8000 + Math.random() * 14000);
    }
  }
  centipedeFrame = window.requestAnimationFrame(animate);
}

// Initialiser le curseur une fois le module audio parasite déclaré.
applySoundVolume();

// =========================================================
// LES CINQ PÉTALES : 2 dans le rêve, 3 dans le cauchemar.
// Les découvertes sont conservées pendant la session.
// =========================================================
const petalDrawer = document.getElementById('petalDrawer');
const petalHandle = document.getElementById('petalHandle');
const petalCount = document.getElementById('petalCount');
const petalStatus = document.getElementById('petalStatus');
const petalIntro = document.getElementById('petalIntro');
const petalSecretLink = document.getElementById('petalSecretLink');
const petalNote = document.getElementById('petalNote');
const petalStorageKey = 'fregetal-five-petals-v1';
let foundPetals = [];
try {
  const saved = JSON.parse(sessionStorage.getItem(petalStorageKey) || '[]');
  if (Array.isArray(saved)) foundPetals = [...new Set(saved.filter(n => Number.isInteger(n) && n >= 0 && n < 5))];
} catch (_) { /* stockage facultatif */ }

function refreshPetalDisplay() {
  document.querySelectorAll('[data-flower-petal]').forEach(el => {
    el.classList.toggle('collected', foundPetals.includes(Number(el.dataset.flowerPetal)));
  });
  document.querySelectorAll('[data-slot]').forEach(el => {
    const collected = foundPetals.includes(Number(el.dataset.slot));
    el.classList.toggle('collected', collected);
    el.querySelector('b').textContent = collected ? '✿' : '◇';
  });
  document.querySelectorAll('.hidden-petal').forEach(el => {
    el.classList.toggle('found', foundPetals.includes(Number(el.dataset.petal)));
    el.disabled = foundPetals.includes(Number(el.dataset.petal));
  });
  petalCount.textContent = `${foundPetals.length} / 5 PÉTALES`;
  const complete = foundPetals.length === 5;
  petalDrawer.classList.toggle('complete', complete);
  petalStatus.textContent = complete ? 'COMPLÈTE' : 'INCOMPLÈTE';
  petalSecretLink.classList.toggle('unlocked', complete);
  petalSecretLink.setAttribute('aria-disabled', String(!complete));
  petalSecretLink.tabIndex = complete ? 0 : -1;
  const dreamRemaining = [0,1].filter(n => !foundPetals.includes(n)).length;
  const nightmareRemaining = [2,3,4].filter(n => !foundPetals.includes(n)).length;
  petalIntro.textContent = complete ? 'Elle est entière. Quelque chose t’attend derrière cette porte.'
    : phase === 'dream' ? `${dreamRemaining} pétale${dreamRemaining > 1 ? 's' : ''} à découvrir dans le rêve. Les trois autres attendent ailleurs.`
    : `${nightmareRemaining} pétale${nightmareRemaining > 1 ? 's' : ''} à découvrir dans le cauchemar.`;
}
petalHandle.addEventListener('click', () => {
  const open = petalDrawer.classList.toggle('open');
  petalHandle.setAttribute('aria-expanded', String(open));
});
// Les cinq énigmes évoquent chacune un morceau de la vie de Vincent.
const petalRiddles = [
  {
    question: 'Une fleur qui ne sera jamais regardée a-t-elle moins de raisons de fleurir ?',
    answers: ['Oui, puisque sa beauté n’existera pour personne.', 'Non, puisqu’elle n’a besoin d’aucun regard pour exister.', 'Une fleur ne cherche aucune raison de fleurir.'],
    correct: 2,
    success: 'Elle aurait fleuri même si personne n’était venu.',
    failure: 'Vous lui cherchez une raison. Elle n’en avait pas besoin.'
  },
  {
    question: 'Si un homme se croit heureux dans un monde qui n’existe pas, son bonheur est-il un mensonge ?',
    answers: ['Oui, car il repose sur une illusion.', 'Non, car ce qu’il ressent demeure réel.', 'Le bonheur n’existe que lorsqu’on sait le reconnaître.'],
    correct: 1,
    success: 'Un songe n’a pas besoin d’être vrai pour être vécu.',
    failure: 'Vous distinguez encore le vrai du faux. Essayez autrement.'
  },
  {
    question: 'Que reste-t-il d’un homme lorsqu’il ne se souvient plus de celui qu’il était ?',
    answers: ['Son corps.', 'Ses habitudes.', 'Un homme qu’il ne connaît plus.'],
    correct: 2,
    success: 'Il est toujours là. Il ne saurait simplement plus se reconnaître.',
    failure: 'Vous cherchez ce qui est resté. Regardez ce qui s’est perdu.'
  },
  {
    question: 'Un prisonnier qui ne désire plus sortir de sa cellule est-il devenu libre ?',
    answers: ['Oui, puisqu’il ne souffre plus de son enfermement.', 'Non, puisque les barreaux demeurent.', 'Il a seulement oublié qu’il était enfermé.'],
    correct: 2,
    success: 'Les barreaux n’ont pas disparu. Le désir de les franchir, si.',
    failure: 'Quelque chose vous échappe encore. Rien ne presse.'
  },
  {
    question: 'Si demain devait être identique à hier, et hier identique à tous les jours précédents, que faudrait-il attendre de demain ?',
    answers: ['Qu’il soit différent.', 'Qu’il arrive.', 'Rien.'],
    correct: 2,
    success: 'Demain viendra. Cela ne signifie pas qu’il faille l’attendre.',
    failure: 'Vous attendez encore quelque chose. Réessayez.'
  }
];
const riddleOverlay = document.getElementById('riddleOverlay');
const riddleKicker = document.getElementById('riddleKicker');
const riddleQuestion = document.getElementById('riddleQuestion');
const riddleOptions = document.getElementById('riddleOptions');
const riddleCancel = document.getElementById('riddleCancel');
const riddleFeedback = document.getElementById('riddleFeedback');
const riddleFeedbackLabel = document.getElementById('riddleFeedbackLabel');
const riddleFeedbackText = document.getElementById('riddleFeedbackText');
const riddleRetry = document.getElementById('riddleRetry');
const riddleContinue = document.getElementById('riddleContinue');
let activePetal = null;
let riddlePreviousFocus = null;

function closePetalRiddle() {
  riddleOverlay.classList.remove('open');
  riddleOverlay.setAttribute('aria-hidden', 'true');
  activePetal = null;
  riddleFeedback.hidden = true;
  riddlePreviousFocus?.focus();
}
riddleCancel.addEventListener('click', closePetalRiddle);
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && riddleOverlay.classList.contains('open')) {
    closePetalRiddle();
  }
  if (event.key === 'Tab' && riddleOverlay.classList.contains('open')) {
    const focusables = riddleFeedback.hidden
      ? [...riddleOptions.querySelectorAll('button'), riddleCancel]
      : [riddleRetry, riddleContinue].filter(el => !el.hidden);
    const current = focusables.indexOf(document.activeElement);
    if (event.shiftKey && current <= 0) {
      event.preventDefault(); focusables.at(-1).focus();
    } else if (!event.shiftKey && current === focusables.length - 1) {
      event.preventDefault(); focusables[0].focus();
    }
  }
});
function awardPetal(n) {
  if (foundPetals.includes(n)) return;
  foundPetals.push(n);
  try { sessionStorage.setItem(petalStorageKey, JSON.stringify(foundPetals)); } catch (_) {}
  refreshPetalDisplay();
  petalDrawer.classList.add('open', 'petal-celebrate');
  petalHandle.setAttribute('aria-expanded', 'true');
  petalNote.textContent = foundPetals.length === 5 ? 'La porte est ouverte.' : 'Une réponse juste. Un pétale retrouvé.';
  window.setTimeout(() => petalDrawer.classList.remove('petal-celebrate'), 900);
}
function answerPetal(n, answerIndex) {
  if (activePetal !== n || phase === 'terminal' || !riddleFeedback.hidden) return;
  const riddle = petalRiddles[n];
  const success = answerIndex === riddle.correct;
  if (success) awardPetal(n);
  riddleOptions.hidden = true;
  riddleFeedback.hidden = false;
  riddleFeedback.classList.toggle('is-success', success);
  riddleFeedback.classList.toggle('is-failure', !success);
  riddleFeedbackLabel.textContent = success ? 'PÉTALE RETROUVÉ' : 'LE PÉTALE DEMEURE';
  riddleFeedbackText.textContent = success ? riddle.success : riddle.failure;
  riddleRetry.hidden = success;
  riddleContinue.hidden = !success;
  riddleCancel.hidden = true;
  (success ? riddleContinue : riddleRetry).focus();
}
riddleRetry.addEventListener('click', () => {
  if (activePetal === null) return;
  riddleFeedback.hidden = true;
  riddleOptions.hidden = false;
  riddleCancel.hidden = false;
  riddleOptions.querySelector('button')?.focus();
});
riddleContinue.addEventListener('click', closePetalRiddle);
document.querySelectorAll('.hidden-petal').forEach(el => el.addEventListener('click', () => {
  const n = Number(el.dataset.petal);
  if (phase === 'terminal' || (n < 2 && phase !== 'dream') || (n >= 2 && phase !== 'nightmare') || foundPetals.includes(n)) return;
  activePetal = n;
  riddlePreviousFocus = document.activeElement;
  riddleKicker.textContent = `FRÈGÈTAL / PÉTALE 0${n + 1}`;
  riddleQuestion.textContent = petalRiddles[n].question;
  riddleOptions.replaceChildren();
  riddleOptions.hidden = false;
  riddleFeedback.hidden = true;
  riddleCancel.hidden = false;
  petalRiddles[n].answers.forEach((answer, i) => {
    const option = document.createElement('button');
    option.type = 'button';
    option.className = 'riddle-option';
    option.textContent = answer;
    option.addEventListener('click', () => answerPetal(n, i));
    riddleOptions.appendChild(option);
  });
  riddleOverlay.classList.add('open');
  riddleOverlay.setAttribute('aria-hidden', 'false');
  riddleOptions.querySelector('button')?.focus();
}));
petalSecretLink.addEventListener('click', e => {
  if (foundPetals.length !== 5) {
    e.preventDefault();
  } else {
    foundPetals = [];
    try { sessionStorage.removeItem(petalStorageKey); } catch (_) {}
  }
});
// Rafraîchir la couleur et les indices après le changement de monde.
flower.addEventListener('click', () => window.setTimeout(refreshPetalDisplay, 30));
refreshPetalDisplay();
