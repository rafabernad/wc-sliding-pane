import { LitElement, html, css } from 'lit-element';
import { repeat } from 'lit-html/directives/repeat';
import { classMap } from 'lit-html/directives/class-map';
import { styleMap } from 'lit-html/directives/style-map';

export default class SlidingPane extends LitElement {
    static get styles() {
        return [
            css`:host { display: block; position: relative; background: red; overflow-x: hidden;}`,
            css`slot { position: absolute; top:0; left: 0; bottom: 0; right: 0; display: block; box-shadow: -2px 0px 2px -1px rgba(0,0,0,0.65); transition: transform 0.5s ease-in; }`,
            css`slot.active { position:relative; transform: translate3d(0px,0px,0px); transition: transform 0.5s ease-out; }`,
            css`slot.transition { position: absolute; }`,
            css`slot.activating { position: relative; z-index: 1 }`,
            css`slot.deactivating { z-index: 2 }`,
            css`slot.hidden { display: none; }`
        ];
    }
    constructor() {
        super();
        this.__activePanes = [];
        this.__initPanesContent();
        console.log(this.__panes)
        this.__activePanes.push(this.__panes[0]);

    }
    connectedCallback() {
        super.connectedCallback && super.connectedCallback();
        this.__DOMObserver = new MutationObserver(this.__mutationObserverCallback.bind(this));

        const config = { attributes: true, childList: true, subtree: false };
        this.__DOMObserver.observe(this, config);

        this.shadowRoot.addEventListener("transitionend", this.__transitionFinished.bind(this), false);
    }
    disconnectedCallback() {
        this.__DOMObserver.disconnect();
        this.shadowRoot.removeEventListener("transitionend", this.__transitionFinished.bind(this), false);
        super.disconnectedCallback && super.disconnectedCallback();
    }
    __transitionFinished(ev) {
        if (ev && ev.propertyName === 'transform') {
            this.__transitioning = false;
            this.requestUpdate();
        }
    }
    __mutationObserverCallback(mutationsList) {
        for (var mutation of mutationsList) {
            if (mutation.type == 'childList') {
                //  If consumer changes root slot, reset navigation status
                if (this.__activePanes[0] !== this.children[0]) {
                    this.__activePanes = [];
                    this.__activePanes.push(this.children[0]);
                }
                this.requestUpdate();
            }
        }
    }
    __initPanesContent() {
        this.__panes = [];
        for(let i = 0; i < this.children.length; i++) {
            console.log(this.children[i])
            if(this.children[i].nodeName === 'TEMPLATE') {
                const fragment = this.children[i].content.cloneNode(true); 
                this.appendChild(fragment); 
                this.__panes.push(fragment);
            }
        }
    }
    __computeSlots() {
        const slots = [];
        for (let i = 0; i < this.children.length; i++) {
            if(this.children[i].nodeName !== 'TEMPLATE') {
                slots.push(this.children[i].getAttribute('slot'));
            }
        }
        return slots;
    }
    get activePanes() {
        return this.__activePanes;
    }
    get activePaneNames() {
        return this.activePanes.map((pane) => {
            return pane.getAttribute('slot')
        });
    }
    push(name, animate = true) {
        if (this.activePaneNames.pop() !== name) {
            if (this.activePaneNames.includes(name)) {
                //  Pane already active; popping until it
                this.__activePanes.length = this.activePaneNames.indexOf(name) + 1;
            } else {
                for (var i = 0; i < this.children.length; i++) {
                    if (this.children[i].getAttribute('slot') === name) {
                        this.__activePanes.push(this.children[i]);
                        break;
                    }
                }
            }
            this.__transitioning = animate;
            this.requestUpdate();
        }
    }
    pop(animate = true) {
        if (this.__activePanes.length > 1) {
            this.__activePanes.pop();
            this.__transitioning = animate;
            this.requestUpdate();
        }
    }
    render() {
        const slots = this.__computeSlots();
        const activePaneNames = this.activePaneNames;
        return html`${
            repeat(slots, (name) => name, (name) => html`<slot name=${name} class="${classMap({
                transition: activePaneNames.includes(name) && this.__transitioning,
                activating: this.__transitioning && activePaneNames.includes(name) && (activePaneNames.indexOf(name) === activePaneNames.length - 1),
                deactivating: this.__transitioning && !activePaneNames.includes(name),
                active: activePaneNames.includes(name),
                hidden: !this.hasUpdated || (!this.__transitioning && activePaneNames.includes(name) && (activePaneNames.indexOf(name) !== activePaneNames.length - 1))
            })}" style="${
            styleMap({
                transform: `translate3d(${activePaneNames.includes(name) ? 0 : this.getBoundingClientRect().width + 5}px,0px,0px)` 
            })}"></slot>`)}`;
    }
    firstUpdated() {
        this.requestUpdate();
    }
}
