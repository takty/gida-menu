/**
 * Gida Menu - Global
 *
 * @author Takuto Yanagida
 * @version 2022-06-01
 */


(function () {

	window['GIDA'] = window['GIDA'] ?? {};

	window['GIDA'].menu_global = function (id = null, opts = {}) {
		new GlobalNav(id, opts);
	};


	// -------------------------------------------------------------------------


	// @include _common.js


	// -------------------------------------------------------------------------


	class GlobalNav {

		static SEL_NAV_BAR          = '.gida-menu-global-bar';
		static SEL_NAV_PANEL_PARENT = '.gida-menu-global-panels';

		static CLS_CURRENT       = 'current';
		static CLS_MENU_ANCESTOR = 'menu-ancestor';
		static CLS_PAGE_ANCESTOR = 'page-ancestor';

		static CLS_HOVER  = 'hover';
		static CLS_TOUCH  = 'touch';
		static CLS_ACTIVE = 'active';
		static CLS_OPENED = 'opened';

		static CLS_HOVER_ANCESTOR  = 'hover-ancestor';

		constructor(id, opts) {
			this._root = id ? document.getElementById(id) : document.querySelector('.gida-menu-global');
			if (!this._root) return;

			this._openItem  = null;
			this._openTime  = 0;
			this._scrollTop = 0;
			this._panels    = [];
			this._st        = null;

			this._canceled = false;
			this._startX   = 0;
			this._startY   = 0;

			this._isOpenedByHover = false;

			this._bar         = this._root.querySelector(GlobalNav.SEL_NAV_BAR);
			const menuItems   = this._root.querySelectorAll('.menu > li');
			const popupItems  = this._bar.querySelectorAll('button[data-panel]' + /**/', label[for]'/**/);
			this._panelParent = this._root.querySelector(GlobalNav.SEL_NAV_PANEL_PARENT);
			this._alignPanel  = this._root.classList.contains('pulldown');

			const autoClose                    = opts['autoClose']                    ?? true;
			const autoScroll                   = opts['autoScroll']                   ?? true;
			this._suppressClickCloseAfterHover = opts['suppressClickCloseAfterHover'] ?? false;
			this._scrollViewOffset             = opts['scrollViewOffset']             ?? 20;
			this._defMenuItem                  = opts['defaultMenuItem']              ?? null;
			this._child                        = opts['childNav']                     ?? null;
			this._onBeforeOpen                 = opts['onBeforeOpen']                 ?? null;

			if (this._panelParent) {
				this._panels = Array.prototype.slice.call(this._panelParent.children);
			}
			if (0 < navigator.maxTouchPoints) {
				this._bar.addEventListener('pointerenter', (e) => {
					const m = (e.pointerType === 'mouse') ? 'remove' : 'add';
					this._bar.classList[m](GlobalNav.CLS_TOUCH);
					this._panelParent.classList[m](GlobalNav.CLS_TOUCH);
				});
			}
			addHoverStateEventListener(menuItems, GlobalNav.CLS_CURRENT, GlobalNav.CLS_HOVER, this._root, GlobalNav.CLS_HOVER_ANCESTOR);
			this.addClickStateEventListener(popupItems);
			if (this._defMenuItem) this.open(this._defMenuItem);

			addScrollableDetectionTarget(this._bar);

			if (autoClose) {
				onScroll(() => { this.onScroll(); });
				if (this._panelParent) this._panelParent.addEventListener('click', e => e.stopPropagation());
				document.addEventListener('click', () => { this.closeAll(); });
			}
			if (autoScroll) {
				const mis = this._bar.querySelectorAll('a, button[data-panel]' + /**/', label[for]'/**/);
				this.initializeAutoScroll(mis);
			}
		}

		initializeAutoScroll(mis) {
			for (const mi of mis) {
				const li = mi.parentElement;
				if (li.classList.contains(GlobalNav.CLS_CURRENT) ||
					li.classList.contains(GlobalNav.CLS_MENU_ANCESTOR) ||
					li.classList.contains(GlobalNav.CLS_PAGE_ANCESTOR))
				{
					this.ensureInView(mi);
				}
			}
			const left  = document.createElement('div');
			const right = document.createElement('div');
			left.classList.add('scroll-left');
			right.classList.add('scroll-right');
			this._bar.insertBefore(left, this._bar.firstChild);
			this._bar.appendChild(right);

			this.addScrollerEventListener(left, -48);
			this.addScrollerEventListener(right, 48);
		}

		addClickStateEventListener(items) {
			for (const it of items) {
				it.addEventListener('click', (e) => { e.stopPropagation(); });  // For preventing auto-close

				it.addEventListener('pointerenter',  this.createEventListenerEnter(it));
				it.addEventListener('pointerdown',   this.createEventListenerDown());
				it.addEventListener('touchstart',    this.createEventListenerTouchStart());
				it.addEventListener('pointermove',   this.createEventListenerMove());
				it.addEventListener('pointercancel', this.createEventListenerCancel());
				it.addEventListener('pointerup',     this.createEventListenerUp(it));
				it.addEventListener('pointerleave',  this.createEventListenerLeave());

				// For disabling gray out when touching on iOS
				it.addEventListener('touchend', (e) => { if (e.cancelable) e.preventDefault(); });
			}
			for (const p of this._panels) {
				p.addEventListener('mouseenter', () => this.cancelTimeout());
			}
		}

		addScrollerEventListener(elm, offset) {
			let st = null;
			let doing = false;
			const scroll = throttle(() => {
				this._bar.scrollBy(offset, 0);
				if (!doing) return;
				st = setTimeout(scroll, 100);
			});
			elm.addEventListener('mouseenter', (e) => {
				e.preventDefault();
				doing = true;
				st = setTimeout(scroll, 100);
			});
			elm.addEventListener('mouseleave', (e) => {
				e.preventDefault();
				doing = false;
				if (st) clearTimeout(st);
				st = null;
			});
		}

		cancelTimeout() {
			if (this._st) clearTimeout(this._st);
			this._st = null;
		}


		// ---------------------------------------------------------------------


		onScroll() {
			if (this._child && this._child._openItem) return;
			if (this._openItem) {
				const openPanel = this._panelParent.querySelector('.gida-menu-global-panel.active.opened');
				if (!openPanel) return;
				const bcr = openPanel.getBoundingClientRect();
				if (
					bcr.bottom < 0 ||  // When not fixed
					(0 < bcr.top && bcr.bottom < Math.abs(window.pageYOffset - this._scrollTop))  // When fixed
				) {
					this.closeAll();
					this.cancelTimeout();
				}
			}
		}


		// ---------------------------------------------------------------------


		createEventListenerEnter(item) {
			return () => {
				if (item !== this._openItem) {
					this.cancelTimeout();
					this._st = setTimeout(() => { this.open(item, true); }, this._openItem !== null ? 400 : 200);
				}
			};
		}

		createEventListenerDown() {
			return (e) => {
				this._canceled = false;
				this._startX   = e.clientX;
				this._startY   = e.clientY;
			};
		}

		createEventListenerTouchStart() {
			return () => {
				this.cancelTimeout();  // For disabling timeout assigned in enter event
				this._touched = true;
			};
		}

		createEventListenerMove() {
			return (e) => {
				if (10 < Math.abs(e.clientX - this._startX) || 10 < Math.abs(e.clientY - this._startY)) {
					this._canceled = true;
				}
			};
		}

		createEventListenerCancel() {
			return () => { this._canceled = true; }
		}

		createEventListenerUp(item) {
			return () => {
				this.cancelTimeout();
				if (this._canceled) return;
				if (this._touched) {
					if (item === this._openItem) {
						this.closeAll();
					} else {
						this.open(item);
					}
					return;
				}
				const t = new Date().getTime();
				if (t - this._openTime < 200) return;
				if (item === this._openItem) {
					if (this._isOpenedByHover) {
						if (this._suppressClickCloseAfterHover) return;
						if (t - this._openTime < 400) return;
					}
					this.closeAll();
				} else {
					this.open(item);
				}
			};
		}

		createEventListenerLeave() {
			return () => {
				this.cancelTimeout();
				if (this._touched) {
					this._touched = false;
					return;
				}
				if (this._openItem !== null) {
					this._st = setTimeout(() => { this.closeAll(); }, 800);
				}
			};
		}


		// ---------------------------------------------------------------------


		closeAll() {
			if (this._suppressCloseAll) return;
			if (this._defMenuItem) {
				this.open(this._defMenuItem);
				return;
			}
			this.clearStateOpened();
			this.setStateActive(null);
		}

		open(item, isOpenedByHover = false) {
			this._suppressCloseAll = true;
			document.dispatchEvent(new MouseEvent('click'));
			this._suppressCloseAll = false;

			this.clearStateOpened();
			this.setStateActive(item);
			this.ensureInView(item);

			item.parentElement.classList.add(GlobalNav.CLS_OPENED);
			setTimeout(() => {
				const p = this.itemToPanel(item);
				if (p) {
					p.classList.add(GlobalNav.CLS_OPENED);
					p.focus();
				}
				if (this._alignPanel) this.alignPanel(item, p);
				if (this._onBeforeOpen) this._onBeforeOpen(item, p);
			}, 0);
			this._openItem        = item;
			this._openTime        = new Date().getTime();
			this._scrollTop       = window.pageYOffset;
			this._isOpenedByHover = isOpenedByHover;
		}

		setStateActive(item) {
			if (item === null) {
				for (const p of this._panels) {
					p.classList.remove(GlobalNav.CLS_ACTIVE);
				}
			} else {
				const tar = item.dataset['panel'] ?? /**/item.getAttribute('for') ??/**/ '';
				for (const p of this._panels) {
					if (p.id === tar) {
						p.classList.add(GlobalNav.CLS_ACTIVE);
					} else {
						p.classList.remove(GlobalNav.CLS_ACTIVE);
					}
				}
			}
		}

		clearStateOpened() {
			if (this._child) this._child.closeAll();
			if (!this._openItem) return;
			this._openItem.parentElement.classList.remove(GlobalNav.CLS_OPENED);
			const item = this._openItem;
			setTimeout(() => {
				if (item === this._openItem) return;
				const p = this.itemToPanel(item);
				if (p) p.classList.remove(GlobalNav.CLS_OPENED);
			}, 400);
			this._openItem = null;
		}

		itemToPanel(item) {
			const tar = item.dataset['panel'] ?? /**/item.getAttribute('for') ??/**/ '';
			if (tar) return document.getElementById(tar);
			return null;
		}


		// ---------------------------------------------------------------------


		ensureInView(mi) {
			const l = mi.parentElement.offsetLeft;
			const r = l + mi.parentElement.offsetWidth;
			if (this._bar.scrollLeft + this._bar.offsetWidth < r) {
				this._bar.scrollLeft = r - this._bar.offsetWidth + this._scrollViewOffset;
			}
			if (l < this._bar.scrollLeft) {
				this._bar.scrollLeft = l - this._scrollViewOffset;
			}
		}

		alignPanel(item, panel) {
			if (!panel) return;
			const w = window.innerWidth;
			if (w <= 600) {
				panel.style.left  = '';
				panel.style.right = '';
				return;
			}
			const bcrI  = item.getBoundingClientRect();
			const bcrP  = panel.getBoundingClientRect();
			const bcrPP = this._panelParent.getBoundingClientRect();
			const wP    = bcrP.right  - bcrP.left;
			const wPP   = bcrPP.right - bcrPP.left;
			const l     = bcrI.left   - bcrPP.left;

			if (wPP < l + wP + 16) {
				panel.style.left  = 'unset';
				panel.style.right = '0px';
			} else {
				panel.style.left  = l + 'px';
				panel.style.right = 'unset';
			}
		}

	}

})();
