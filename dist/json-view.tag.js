console.log('json-view', import.meta.url);
function NODE(name, attributes = {}, ...children ) {
	let node = document.createElement(name);
	for (let key in attributes)
		node.setAttribute(key, attributes[key]);
	node.ADD(...children)
	return node;
}
Element.prototype.ADD = function addChildren(...children){
	for (let child of children)
		this.appendChild(typeof child == 'string' ? document.createTextNode(child) : child);
	return this;	
}
class XML {
	static parse(string, type = 'xml') {
		return new DOMParser().parseFromString(string.replace(/xmlns=".*?"/g, ''), 'text/' + type)
	}
	static stringify(DOM) {
		return new XMLSerializer().serializeToString(DOM).replace(/xmlns=".*?"/g, '')
	}
}
XMLDocument.prototype.stringify = XML.stringify
Element.prototype.stringify = XML.stringify
const HTML = document.createElement('template');
HTML.innerHTML = `<aside class='h-stack'>
		<div class='h-stack'>
			<a on-tap='copyAll'>copy</a>
			<a on-tap='saveAll'>save</a>
		</div>
		<div class='h-stack'>
			<a on-tap='pure'>pure</a>
			<a on-tap='long'>long</a>
		</div>
	</aside>
	<main></main>`;
let STYLE = document.createElement('style');
STYLE.appendChild(document.createTextNode(`:host {
		display: inline-block;
		background: #333;
		font-size: 14px;
		text-align: left;
		color: white;
		font-family: "Lucida Console", Monaco, monospace;
		/* padding: .3rem; */
	}
	:host(.scroll) {
		overflow: auto;
		width: 100%;
		height: 100%;
	}
	:host(:not(.copy)) aside [on-tap='copyAll'] {
		color: transparent;
		/* display: none */
	}
	:host(:not(.save)) aside [on-tap='saveAll'] {
		color: transparent;
		/* display: none */
	}
	:host::-webkit-scrollbar {
		width: .5rem;
	}
	:host::-webkit-scrollbar-track {
		box-shadow: inset 0 0 6px #333;
	}
	:host::-webkit-scrollbar-thumb {
		background-color: #444;
	}
	.h-stack {
		display: flex;
		justify-content: space-between;
	}
	aside div {
		width: 20%;
	}
	aside a {
		color: gray;
		padding-bottom: .5rem;
	}
	a:hover {
		cursor: pointer;
		color: cornflowerblue
	}
	:host(:not(.compact)) .short>item {
		display: block;
	}
	:host(.compact) .short>item {
		margin: 0 .5em;
		/* margin-left: 1em; */
	}
	.long>item {
		display: block;
	}
	*::before,
	*::after {
		color: silver;
	}
	item {
		margin-left: 1rem;
	}
	key {
		color: white;
		/* font-weight: bold; */
	}
	c {
		color: gray;
		display: inline-block;
	}
	.string {
		color: #ff7;
		/* color: hsla(60,80%,80%,90%) */
	}
	.null,
	.undefined {
		color: silver;
	}
	.boolean.false {
		color: #f77;
	}
	.boolean.true {
		color: #7f7;
	}
	.number {
		color: #7ff;
	}`));
function QQ(query, i) {
	let result = Array.from(this.querySelectorAll(query));
	return i ? result?.[i - 1] : result;
}
Element.prototype.Q = QQ
ShadowRoot.prototype.Q = QQ
DocumentFragment.prototype.Q = QQ
class WebTag extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: 'open', delegatesFocus: true });
		this.shadowRoot.appendChild(STYLE.cloneNode(true)); //: CSS
		this.$HTM = document.createElement('htm')
		this.shadowRoot.appendChild(this.$HTM)
	}
	async connectedCallback() {
		this.$applyHTML(); //: HTML
		this.$attachMutationObservers();
		this.$attachEventListeners();
		this.$onReady(); //: onReady
	}
	$attachMutationObservers() {
		this.modelObserver = new MutationObserver(events => {
			if ((events[0].type == 'attributes') && (events[0].target == this)) {
			} else {
				this.$onDataChange(events); //: $onDataChange
			}
		}).observe(this, { attributes: true, characterData: true, attributeOldValue: true, childList: true, subtree: true });
	}
	$attachEventListeners() {
		let action = (event, key) => {
			try {
				let target = event.composedPath()[0];
				let action = target.closest(`[${key}]`);
				this[action.getAttribute(key)](action, event, target)
			}
			catch { }
		}
		this.addEventListener('click', e => action(e, 'on-tap')); //: onTap
	}
	$applyHTML() {
		this.$view = HTML.content.cloneNode(true)
	}
	$clear(R) {
		while (R.lastChild)
			R.removeChild(R.lastChild);
	}
	get $view() {
		return this.$HTM;
	}
	set $view(HTML) {
		this.$clear(this.$view);
		if (typeof HTML == 'string')
			HTML = new DOMParser().parseFromString(HTML, 'text/html').firstChild
		this.$view.appendChild(HTML);
	}
};
	class json_view extends WebTag {
		$onReady() {
			this.show()
		}
		$onDataChange() {
			this.show()
		}
		show() {
			try {
				this.$view.Q('main', 1).innerHTML = this.html(JSON.parse(this.textContent));
			} catch { }
		}
		copy() {
			import('https://max.pub/lib/data.js').then(x => x.copy(this.textContent))
		}
		save() {
			import('https://max.pub/lib/data.js').then(x => x.save(this.textContent, 'data.json', 'application/json'))
		}
		html(data, level = 0) {
			let typ = typeof (data);
			if (Array.isArray(data)) typ = 'array';
			if (data === null) typ = 'null';
			let q = '<c>"</c>';
			let len = JSON.stringify(data).length;
			switch (typ) {
				case 'object':
				case 'array':
					let c1 = typ == 'object' ? q : '';
					let keys = Object.keys(data)
					return `<list class='${typ} ${len < 50 ? 'short' : 'long'}'>
						<c>${typ=='object'?'{':'['}</c>
						${keys.map((key, i) => `<item level='${level}'>${typ == 'object' ? `${c1}<key>${key}</key>${c1}<c>:</c>` : ''}${this.html(data[key], level + 1)}${i < keys.length-1 ? '<c>,</c>' : ''}</item>`).join('')}
						<c>${typ=='object'?'}':']'}</c>
						</list>`;
				default:
					let c = typ == 'string' ? q : '';
					return c + `<value class='${typ} ${data}'>${data}</value>` + c;
			}
		}
	}
window.customElements.define('json-view', json_view)