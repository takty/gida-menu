/**
 * Gida Menu - Priority
 *
 * @author Takuto Yanagida
 * @version 2022-07-09
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

	const root = id ? document.getElementById(id) : document.getElementsByClassName(NS)[0];
	if (!root) return;
	const menuBar = root.querySelector('.menu') ?? root.getElementsByTagName('ul')[0];
	if (!menuBar) return;
	const lis = Array.from(menuBar.querySelectorAll('li'));

	const menuBarStyle = getComputedStyle(menuBar);
	const autoClose    = opts['autoClose'] ?? true;

	let scrollTop = 0;
	let columnGap = 0;


	// -------------------------------------------------------------------------


	// @include _common.js


	// -------------------------------------------------------------------------


	const [panel, menuPanel] = initPanel(root);
	const [liBtn, btn]       = initButton(menuBar);

	menuBar.appendChild(liBtn);

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


	function initPanel(root) {
		const panelParent = document.createElement('div');
		panelParent.classList.add(CLS_PANELS);

		const panel = document.createElement('div');
		panel.classList.add(CLS_PANEL);

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

		root.style.maxWidth = w + 'px';
	}

	function alignItems(ws, menuBar, menuPanel, lis, liBtn) {
		let remW = menuBar.parentElement.getBoundingClientRect().width;
		let sep  = lis.length;

		const btnW = liBtn.clientWidth;
		const sum  = ws.reduce((s, v) => s + v) + (columnGap * (ws.length - 1));

		if (remW < sum) {
			remW -= btnW;
			for (let i = 0; i < ws.length; i += 1) {
				if ((remW -= ws[i] + columnGap) < 0) {
					sep = i;
					break;
				}
			}
		}
		for (let i = 0; i < sep; i += 1) {
			if (lis[i].parentElement === menuBar) {
				ws[i] = lis[i].offsetWidth;
			} else {
				menuBar.insertBefore(lis[i], liBtn);
			}
		}
		columnGap = parseInt(menuBarStyle.columnGap, 10);
		columnGap = Number.isNaN(columnGap) ? 0 : columnGap;
		for (let i = sep; i < lis.length; i += 1) menuPanel.appendChild(lis[i]);
		liBtn.style.display = (sep === lis.length) ? 'none' : '';
	}

};
