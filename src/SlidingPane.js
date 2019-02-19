import { LitElement, html } from 'lit-element';

export class SlidingPane extends LitElement {
    render() {
        return html`<slot></slot>`;
    }
}

