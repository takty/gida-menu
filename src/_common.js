/**
 *
 * Common Functions (JS)
 *
 * @author Takuto Yanagida
 * @version 2021-06-30
 *
 */


const resizeListeners = [];
const scrollListeners = [];

function onResize(fn, doFirst = false) {
	if (doFirst) fn();
	resizeListeners.push(throttle(fn));
}

function onScroll(fn, doFirst = false) {
	if (doFirst) fn();
	scrollListeners.push(throttle(fn));
}


// -----------------------------------------------------------------------------


const scrollableDetectionTargets = [];

function addScrollableDetectionTarget(tar) {
	scrollableDetectionTargets.push(tar);
}

function initializeScrollableDetection() {
	const rob = new ResizeObserver(oes => {
		for (const oe of oes) detectScrollable(oe.target);
	});
	for (const tar of scrollableDetectionTargets) {
		rob.observe(tar);
		tar.addEventListener('scroll', throttle(() => { detectScrollable(tar); }));
	}
}

function detectScrollable(elm) {
	if (elm.scrollWidth - elm.clientWidth > 2) {  // for avoiding needless scrolling
		const r = elm.scrollLeft / (elm.scrollWidth - elm.clientWidth);
		elm.classList[r < 0.95 ? 'add' : 'remove']('scrollable-right');
		elm.classList[0.05 < r ? 'add' : 'remove']('scrollable-left');
	} else {
		elm.classList.remove('scrollable-right');
		elm.classList.remove('scrollable-left');
	}
}


// -----------------------------------------------------------------------------


document.addEventListener('DOMContentLoaded', () => {
	window.addEventListener('resize', () => { for (const l of resizeListeners) l(); }, { passive: true });
	window.addEventListener('scroll', () => { for (const l of scrollListeners) l(); }, { passive: true });
	initializeScrollableDetection();
});

function throttle(fn) {
	let isRunning;
	function run() {
		isRunning = false;
		fn();
	}
	return () => {
		if (isRunning) return;
		isRunning = true;
		requestAnimationFrame(run);
	};
}
