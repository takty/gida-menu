/**
 * Common Functions
 *
 * @author Takuto Yanagida
 * @version 2022-01-21
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


function addHoverStateEventListener(items, clsCurrent, clsHover) {
	const enter = (e) => {
		if (e.pointerType === 'mouse' && !e.target.classList.contains(clsCurrent)) {
			e.target.classList.add(clsHover);
		}
	}
	const leave = (e) => {
		if (e.pointerType === 'mouse' && !e.target.classList.contains(clsCurrent)) {
			e.target.classList.remove(clsHover);
		}
	}
	for (const it of items) {
		it.addEventListener('pointerenter', enter);
		it.addEventListener('pointerleave', leave);
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
