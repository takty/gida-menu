/**
 * Gida Menu - Priority
 *
 * @author Takuto Yanagida
 * @version 2022-10-04
 */

window['GIDA'] = window['GIDA'] ?? {};

window['GIDA'].menu_priority = function (id = null, opts = {}) {
	const NS         = 'gida-menu-priority';
	const CLS_PANELS = NS + '-panels';
	const CLS_PANEL  = NS + '-panel';
	const CLS_BUTTON = NS + '-button';

	const CLS_CURRENT = 'current';

	const CLS_READY  = 'ready';
	const CLS_HOVER  = 'hover';
	const CLS_ACTIVE = 'active';
	const CLS_OPENED = 'opened';

	const CP_MAX_WIDTH = '--max-width';
	const CP_FOLDABLE  = '--foldable';

	const root = id ? document.getElementById(id) : document.getElementsByClassName(NS)[0];
	if (!root) return;
	const menuBar = root.querySelector('.menu') ?? root.getElementsByTagName('ul')[0];
	if (!menuBar) return;
	const lis = Array.from(menuBar.querySelectorAll(':scope > li'));

	const menuBarStyle = getComputedStyle(menuBar);
	const autoClose    = opts['autoClose']      ?? true;
	const reversed     = opts['reversed']       ?? false;
	const btnPos       = opts['buttonPosition'] ?? 'end';  // 'start' or 'end';

	const order = initOrder(lis, reversed);

	let scrollTop = 0;
	let columnGap = 0;


	// -------------------------------------------------------------------------


	// @include _common.js


	// -------------------------------------------------------------------------


	const [panel, menuPanel] = initPanel(root);
	const [liBtn, btn]       = initButton(menuBar);

	if ('end' === btnPos) {
		menuBar.append(liBtn);
	} else if ('start' === btnPos) {
		menuBar.prepend(liBtn);
	}

	btn.addEventListener('click', (e) => {
		if (liBtn.classList.contains(CLS_OPENED)) {
			close(liBtn, panel);
		} else {
			open(liBtn, panel);
		}
		e.stopPropagation();
	});
	for (const li of lis) {
		li.addEventListener('click', () => { close(liBtn, panel); });
	}
	addHoverStateEventListener(lis, CLS_CURRENT, CLS_HOVER);

	let ws = [];
	setTimeout(() => {
		ws        = lis.map((e) => e.offsetWidth);
		columnGap = parseInt(menuBarStyle.columnGap, 10);
		columnGap = Number.isNaN(columnGap) ? 0 : columnGap;
		alignItems(ws, menuBar, menuPanel, lis, liBtn);
		onResize(() => {
			close(liBtn, panel);
			setMaxWidth(root);
			alignItems(ws, menuBar, menuPanel, lis, liBtn);
		});
	}, 10);
	setTimeout(() => { root.classList.add(CLS_READY); }, 100);

	if (autoClose) {
		onScroll(() => { doOnScroll(liBtn, panel); });
		document.addEventListener('click', () => { close(liBtn, panel); });
	}


	// -------------------------------------------------------------------------


	function initOrder(lis, reversed) {
		const ws = new Array(lis.length);
		for (let i = 0; i < lis.length; i += 1) {
			ws[i] = getWeightFromClass(lis[i], lis.length - i);
		}
		const order = new Array(lis.length);
		for (let i = 0; i < lis.length; i += 1) order[i] = i;
		order.sort((a, b) => ws[a] < ws[b] ? 1 : ws[a] > ws[b] ? -1 : 0);

		if (reversed) {
			order.reverse();
		}
		return order;
	}

	function getWeightFromClass(li, def) {
		const cs = li.className.split(' ');
		let w = null;
		for (const c of cs) {
			const n = parseInt(c, 10);
			if (isNaN(n)) continue;
			if (null === w || w < n) w = n;
		}
		return w ?? def;
	}

	function initPanel(root) {
		const panelParent = document.createElement('div');
		panelParent.classList.add(CLS_PANELS);

		const panel = document.createElement('div');
		panel.classList.add(CLS_PANEL);
		if ('end' === btnPos || 'start' === btnPos) {
			panel.classList.add('end' === btnPos ? 'end' : 'start');
		}

		const menu = document.createElement('ul');
		menu.classList.add('menu');

		panel.appendChild(menu);
		panelParent.appendChild(panel);
		root.appendChild(panelParent);
		return [panel, menu];
	}

	function initButton(menuBar) {
		const btn = document.createElement('button');
		btn.classList.add(CLS_BUTTON);
		const item = document.createElement('li');
		item.appendChild(btn);
		menuBar.appendChild(item);
		return [item, btn];
	}


	// -------------------------------------------------------------------------


	function close(liBtn, panel) {
		liBtn.classList.remove(CLS_OPENED);
		panel.classList.remove(CLS_ACTIVE);
		setTimeout(() => {
			panel.classList.remove(CLS_OPENED);
		}, 400);
	}

	function open(liBtn, panel) {
		liBtn.classList.add(CLS_OPENED);
		panel.classList.add(CLS_ACTIVE);
		setTimeout(() => {
			panel.classList.add(CLS_OPENED);
		}, 0);
		scrollTop = window.pageYOffset;
	}

	function doOnScroll(liBtn, panel) {
		const bcr = panel.getBoundingClientRect();
		if (
			bcr.bottom < 0 ||  // When not fixed
			(0 < bcr.top && bcr.bottom < Math.abs(window.pageYOffset - scrollTop))  // When fixed
		) {
			close(liBtn, panel);
		}
	}

	function setMaxWidth(root) {
		const p  = root.parentElement;
		const cs = getComputedStyle(p);
		const w  = p.clientWidth - (parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight));

		root.style.setProperty(CP_MAX_WIDTH, `${w}px`);
	}

	function alignItems(ws, menuBar, menuPanel, lis, liBtn) {
		menuBar.style.width = '0';
		let barW = menuBar.parentElement.getBoundingClientRect().width;
		menuBar.style.width = null;

		const [inBar, withPanel] = calcItemPlace(barW, ws, lis, liBtn, columnGap);
		liBtn.style.display = withPanel ? null : 'none';

		if ('false' === getComputedStyle(menuBar).getPropertyValue(CP_FOLDABLE).trim()) {
			inBar.fill(true);
			liBtn.style.display = 'none';
		}

		for (let i = 0; i < lis.length; i += 1) {
			if (!inBar[i]) continue;
			if (lis[i].parentElement === menuBar) {
				ws[i] = lis[i].offsetWidth;
			}
			if ('end' === btnPos) {
				menuBar.insertBefore(lis[i], liBtn);
			} else if ('start' === btnPos) {
				menuBar.appendChild(lis[i], liBtn);
			}
		}

		columnGap = parseInt(menuBarStyle.columnGap, 10);
		columnGap = Number.isNaN(columnGap) ? 0 : columnGap;

		for (let i = 0; i < lis.length; i += 1) {
			if (!inBar[i]) menuPanel.appendChild(lis[i]);
		}
	}

	function calcItemPlace(barW, ws, lis, liBtn, columnGap) {
		const inBar = new Array(lis.length);
		inBar.fill(true);

		const sumW = ws.reduce((s, v) => s + v) + (columnGap * (ws.length - 1));

		if (barW < sumW) {
			barW -= liBtn.clientWidth;

			let toPanel = lis.length;
			for (let i = 0; i < lis.length; i += 1) {
				if ((barW -= ws[order[i]] + columnGap) < 0) {
					toPanel = i;
					break;
				}
			}
			for (let i = toPanel; i < lis.length; i += 1) {
				inBar[order[i]] = false;
			}
		}
		return [inBar, barW < sumW];
	}

};
