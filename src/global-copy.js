/**
 *
 * Gida Menu - Global (JS)
 *
 * @author Takuto Yanagida
 * @version 2021-07-05
 *
 */


(function () {

	window.GIDA = window['GIDA'] ?? {};

	window.GIDA.menu_global = function (id, opts) {
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

		static CLS_TOUCHED = 'touched';
		static CLS_ACTIVE  = 'active';
		static CLS_OPENED  = 'opened';

		constructor(id, opts) {
			this._root = id ? document.getElementById(id) : document.querySelector('.gida-menu-global');
			if (!this._root) return;

			this._openItem  = null;
			this._openTime  = 0;
			this._scrollTop = 0;
			this._panels    = [];
			this._st        = null;

			this._isOpening = false;
			this._isOpenedByHover = false;

			this._bar         = this._root.querySelector(GlobalNav.SEL_NAV_BAR);
			const menuItems   = this._bar.querySelectorAll('label[data-panel]');
			this._panelParent = this._root.querySelector(GlobalNav.SEL_NAV_PANEL_PARENT);
			this._alignPanel  = this._root.classList.contains('pulldown');

			const autoClose                    = opts['autoClose']                    ?? true;
			this._suppressClickCloseAfterHover = opts['suppressClickCloseAfterHover'] ?? false;
			this._scrollViewOffset             = opts['scrollViewOffset']             ?? 20;
			this._defMenuItem                  = opts['defaultMenuItem']              ?? null;
			this._child                        = opts['childNav']                     ?? null;
			this._onBeforeOpen                 = opts['onBeforeOpen']                 ?? null;

			if (this._panelParent) {
				this._panels = Array.prototype.slice.call(this._panelParent.children);
			}
			// for avoiding hover style
			if (0 < navigator.maxTouchPoints) {
				this._bar.addEventListener('touchstart', () => {
					this._bar.classList.add(GlobalNav.CLS_TOUCHED);
					this._panelParent.classList.add(GlobalNav.CLS_TOUCHED);
					this._bar.style.border = '1px solid red';
				});
			}
			this.addClickStateEventListener(menuItems);
			if (this._defMenuItem) this.open(this._defMenuItem);

			addScrollableDetectionTarget(this._bar);

			if (autoClose) {
				onScroll(() => { this.onScroll(); });
				if (this._panelParent) this._panelParent.addEventListener('click', e => e.stopPropagation());
				document.addEventListener('click', () => { this.closeAll(); });
			}
		}

		addClickStateEventListener(items) {
			for (const it of items) {
				it.addEventListener('pointerdown', () => { console.log('pointerdown'); });
				it.addEventListener('pointerup', () => { console.log('pointerup'); });
				it.addEventListener('pointerenter', () => { console.log('pointerenter'); });
				it.addEventListener('pointerleave', () => { console.log('pointerleave'); });

				// it.addEventListener('touchstart', this.createEventListenerTouchStart(it));
				// it.addEventListener('touchend',   this.createEventListenerTouchEnd(it));
				// it.addEventListener('mousedown',  this.createEventListenerMouseDown(it));
				// it.addEventListener('mouseup',    this.createEventListenerMouseUp(it));

				// it.addEventListener('mouseenter', this.createEventListenerEnter(it));
				// it.addEventListener('mouseleave', this.createEventListenerLeave());
				// it.addEventListener('click',      this.createEventListenerClick(it));
				it.addEventListener('touchstart', () => { console.log('touchstart'); this._clicked = true; });
				it.addEventListener('mousedown', () => { console.log('mousedown'); this._clicked = true; });

				it.addEventListener('pointerenter', this.createEventListenerEnter(it));
				it.addEventListener('pointerleave', this.createEventListenerLeave());
				it.addEventListener('pointerup',      this.createEventListenerClick(it));
			}
			for (const p of this._panels) {
				p.addEventListener('mouseenter', () => {
					if (this._st) clearTimeout(this._st);
					this._st = null;
				});
			}
		}

		initializeAutoScroll(menuItems) {
			for (const mi of menuItems) {
				const li = mi.parentElement;
				if (li.classList.contains(GlobalNav.CLS_CURRENT) ||
					li.classList.contains(GlobalNav.CLS_MENU_ANCESTOR) ||
					li.classList.contains(GlobalNav.CLS_PAGE_ANCESTOR))
				{
					this.ensureInView(mi);
				}
			}
		}


		// ---------------------------------------------------------------------


		closeAll() {
			console.log('closeAll');
			if (this._defMenuItem) {
				this.open(this._defMenuItem);
				return;
			}
			this.clearStateOpened();
			this.setStateActive(null);
			if (this._st) clearTimeout(this._st);
			this._st = null;
		}

		open(item, isOpenedByHover = false) {
			console.log('open');
			this.clearStateOpened();
			this.setStateActive(item);
			this.ensureInView(item);

			item.parentElement.classList.add(GlobalNav.CLS_OPENED);
			setTimeout(() => {
				const p = this.itemToPanel(item);
				if (p) {
					p.classList.add(GlobalNav.CLS_OPENED);
					// p.focus();
				}
				if (this._alignPanel) this.alignPanel(item, p);
				if (this._onBeforeOpen) this._onBeforeOpen(item, p);
			}, 0);
			this._openItem = item;
			this._openTime = new Date().getTime();
			this._scrollTop = window.pageYOffset;
			this._st = null;
			this._isOpenedByHover = isOpenedByHover;
		}

		setStateActive(item) {
			if (item === null) {
				for (const p of this._panels) {
					p.classList.remove(GlobalNav.CLS_ACTIVE);
				}
			} else {
				const tar = item.dataset['panel'] ?? '';
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
			const tar = item.dataset['panel'] ?? '';
			if (tar) return document.getElementById(tar);
			return null;
		}

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
				}
			}
		}


		// ---------------------------------------------------------------------


		createEventListenerTouchStart(item) {
			return (e) => {
				e.stopPropagation();
				console.log('touchStart');
				this._isTouch = true;
				this._bar.style.borderColor = 'blue';
				if (item === this._openItem) {
					this.closeAll();
				} else {
					this.open(item);
				}
			};
		}

		createEventListenerTouchEnd(item) {
			return (e) => {
				// e.preventDefault();
				// e.stopPropagation();
				console.log('touchEnd');
				// this._isTouch = false;
			};
		}


		createEventListenerMouseDown(item) {
			return (e) => {
				if (this._isTouch) {
					e.preventDefault();
					e.stopPropagation();
					console.log('mouseDown: return');
					return;
				}
				console.log('mouseUp');
			};
		}
		createEventListenerMouseUp(item) {
			return (e) => {
				if (this._isTouch) {
					e.preventDefault();
					e.stopPropagation();
					console.log('mouseUp: return');
					return;
				}
				console.log('mouseUp');
			};
		}


		// ---------------------------------------------------------------------


		createEventListenerEnter(item) {
			return (e) => {
				if (this._isTouch) {  // for iOS
					// if (this._st) clearTimeout(this._st);
					// this._st = null;
					// e.preventDefault();
					console.log('enter: return');
					return;
				}
				console.log('enter');
				if (item === this._openItem) {
					e.preventDefault();
				} else {
					if (this._st) clearTimeout(this._st);
					this._st = setTimeout(() => {
						this.open(item, true);
					}, this._openItem !== null ? 400 : 200);
				}
			};
		}

		createEventListenerLeave() {
			return (e) => {
				if (this._clicked || this._isTouch) {  // for iOS
					// if (this._st) clearTimeout(this._st);
					// this._st = null;
					// e.preventDefault();
					console.log('leave: return');
					this._clicked = false;
					if (this._st) clearTimeout(this._st);
					return;
				}
				console.log('leave');
				if (this._st) clearTimeout(this._st);
				if (this._openItem !== null) {
					this._st = setTimeout(() => { this.closeAll() }, 800);
				}
			};
		}

		createEventListenerClick(item) {
			return (e) => {
				if (this._isTouch) {
					this._isTouch = false;
					this._bar.style.borderColor = 'red';
					e.preventDefault();
					e.stopPropagation();
					if (this._st) clearTimeout(this._st);
					this._st = null;
					console.log('click: return');
					return;
				}
				console.log('click');

				e.stopPropagation();
				if (this._st) clearTimeout(this._st);
				const t = new Date().getTime();
				if (t - this._openTime < 200) return;
				console.log('click1');
				if (item === this._openItem) {
					console.log('click2');
					if (this._isOpenedByHover) {
						if (this._suppressClickCloseAfterHover) return;
						if (t - this._openTime < 600) return;
					}
					e.preventDefault();
					this.closeAll();
				} else {
					this.open(item);
				}
			};
		}


		// ---------------------------------------------------------------------


		ensureInView(mi) {
			const parent = mi.parentElement;
			const right = parent.offsetLeft + parent.offsetWidth;
			if (this._bar.offsetWidth < right) {
				this._bar.scrollLeft = parent.offsetLeft - this._scrollViewOffset;
			}
			if (parent.offsetLeft < this._bar.scrollLeft) {
				this._bar.scrollLeft = parent.offsetLeft - this._scrollViewOffset;
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
