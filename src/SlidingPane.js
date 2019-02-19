import { LitElement, html, css } from 'lit-element';
import { repeat } from 'lit-html/directives/repeat';
import { classMap } from 'lit-html/directives/class-map';
import { styleMap } from 'lit-html/directives/style-map';

class SlidingPane extends LitElement {
    render() {
        return html`<slot></slot>`;
    }
}

customElements.define('sliding-pane', SlidingPane);

export default class SlidingPanes extends LitElement {
    static get styles() {
        return [
            css`slot { display: block; position: relative; overflow-x: hidden; }`,
            css`::slotted(sliding-pane) { display: block; position: absolute; top:0; left: 0; bottom: 0; right: 0; transition: transform 0.5s ease-out; }`,
            css`::slotted(sliding-pane.activating) { display: block; position: relative; z-index: 1; box-shadow: -2px 0px 2px -1px rgba(0,0,0,0.65); }`,
            css`::slotted(sliding-pane.active) { display: block; position: relative; }`,
            css`::slotted(sliding-pane.deactivating) { display: block; position: absolute; transition: transform 0.5s ease-in; z-index: 2; box-shadow: -2px 0px 2px -1px rgba(0,0,0,0.65); }`,
            css`::slotted(sliding-pane.inactive) { display: none; }`
        ];
    }
    constructor() {
        super();
        this.__activePanes = [];
        this.push(this.children[0].getAttribute('name'));
    }
    get activePane() {
        return this.activePanes[this.activePanes.length - 1];
    }
    get activePanes() {
        return this.__activePanes;
    }
    get activePaneNames() {
        return this.activePanes.map((pane) => {
            return pane.getAttribute('name')
        });
    }
    connectedCallback() {
        super.connectedCallback && super.connectedCallback();
        Array.from(this.children).forEach(child => child.addEventListener("transitionend", this.__transitionFinished.bind(this, child), false));
    }
    disconnectedCallback() {
        Array.from(this.children).forEach(child => child.removeEventListener("transitionend", this.__transitionFinished.bind(this, child), false));
        super.disconnectedCallback && super.disconnectedCallback();
    }
    __transitionFinished(el, ev) {
        if (el.classList.contains('activating') || el.classList.contains('deactivating')) {
            Array.from(this.children).forEach(pane => {
                if (pane === el) {
                    pane.classList.replace('activating', 'active');
                    pane.classList.replace('deactivating', 'inactive');
                } else {
                    pane.classList.toggle('inactive', pane !== this.activePane);
                }
            });
        }
    }
    push(name) {
        debugger
        if (this.activePaneNames.pop() !== name) {
            if (this.activePaneNames.includes(name)) {
                //  Pane already active; popping until it
                this.__activePanes.length = this.activePaneNames.indexOf(name) + 1;
            } else {
                debugger
                this.activePane && this.activePane.classList.remove('active')
                for (var i = 0; i < this.children.length; i++) {
                    if (this.children[i].getAttribute('name') === name) {
                        this.__activePanes.push(this.children[i]);
                        break;
                    }
                }
                this.activePane.classList.replace('inactive', 'activating');
                window.requestAnimationFrame(() => {
                    setTimeout(() => {
                        this.activePane.style.transform = 'translate3d(0px,0px,0px)';
                    });
                });
                if (this.__activePanes.length === 1) {
                    this.__activePanes[0].classList.add('active');
                    this.__activePanes[0].classList.remove('activating');
                    window.requestAnimationFrame(() => Array.from(this.children).forEach(child => {
                        if (!this.__activePanes.includes(child)) {
                            debugger
                            child.classList.add('inactive');
                            child.style.transform = `translate3d(${this.getBoundingClientRect().width}px,0px,0px)`
                        }
                    }));
                }
            }
        }
    }
    pop() {
        if (this.__activePanes.length > 1) {
            const deactivating = this.__activePanes.pop();
            deactivating.classList.replace('active', 'deactivating');

            this.activePane.classList.remove('inactive');
            this.activePane.classList.add('active');
            window.requestAnimationFrame(() => {
                deactivating.style.transform = `translate3d(${this.getBoundingClientRect().width}px,0px,0px)`;
            });
        }
    }
    render() {
        return html`<slot></slot>`;
    }
    firstUpdated() {
        this.__rendered = true;
    }
    shouldUpdate() {
        return !this.__rendered;
    }
}
