/* Hyper Light Card v1.0.0 - Apache 2.0 Licensed */
var _a;const t$3=globalThis,e$3=t$3.ShadowRoot&&(void 0===t$3.ShadyCSS||t$3.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,s=Symbol(),o$3=new WeakMap;let n$4=class{constructor(t,e,r){if(this._$cssResult$=!0,r!==s)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o;const e=this.t;if(e$3&&void 0===t){const s=void 0!==e&&1===e.length;s&&(t=o$3.get(e)),void 0===t&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),s&&o$3.set(e,t))}return t}toString(){return this.cssText}};const r$5=t=>new n$4("string"==typeof t?t:t+"",void 0,s),i$3=(t,...e)=>{const r=1===t.length?t[0]:e.reduce(((e,s,r)=>e+(t=>{if(!0===t._$cssResult$)return t.cssText;if("number"==typeof t)return t;throw Error("Value passed to 'css' function must be a 'css' function result: "+t+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(s)+t[r+1]),t[0]);return new n$4(r,t,s)},S$1=(t,e)=>{if(e$3)t.adoptedStyleSheets=e.map((t=>t instanceof CSSStyleSheet?t:t.styleSheet));else for(const s of e){const e=document.createElement("style"),r=t$3.litNonce;void 0!==r&&e.setAttribute("nonce",r),e.textContent=s.cssText,t.appendChild(e)}},c$2=e$3?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let e="";for(const s of t.cssRules)e+=s.cssText;return r$5(e)})(t):t,{is:i$2,defineProperty:e$2,getOwnPropertyDescriptor:r$4,getOwnPropertyNames:h$2,getOwnPropertySymbols:o$2,getPrototypeOf:n$3}=Object,a=globalThis,c$1=a.trustedTypes,l=c$1?c$1.emptyScript:"",p=a.reactiveElementPolyfillSupport,d=(t,e)=>t,u$1={toAttribute(t,e){switch(e){case Boolean:t=t?l:null;break;case Object:case Array:t=null==t?t:JSON.stringify(t)}return t},fromAttribute(t,e){let s=t;switch(e){case Boolean:s=null!==t;break;case Number:s=null===t?null:Number(t);break;case Object:case Array:try{s=JSON.parse(t)}catch(t){s=null}}return s}},f$2=(t,e)=>!i$2(t,e),y={attribute:!0,type:String,converter:u$1,reflect:!1,hasChanged:f$2};Symbol.metadata??(Symbol.metadata=Symbol("metadata")),a.litPropertyMetadata??(a.litPropertyMetadata=new WeakMap);class b extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??(this.l=[])).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=y){if(e.state&&(e.attribute=!1),this._$Ei(),this.elementProperties.set(t,e),!e.noAccessor){const s=Symbol(),r=this.getPropertyDescriptor(t,s,e);void 0!==r&&e$2(this.prototype,t,r)}}static getPropertyDescriptor(t,e,s){const{get:r,set:o}=r$4(this.prototype,t)??{get(){return this[e]},set(t){this[e]=t}};return{get(){return null==r?void 0:r.call(this)},set(e){const i=null==r?void 0:r.call(this);o.call(this,e),this.requestUpdate(t,i,s)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??y}static _$Ei(){if(this.hasOwnProperty(d("elementProperties")))return;const t=n$3(this);t.finalize(),void 0!==t.l&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(d("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(d("properties"))){const t=this.properties,e=[...h$2(t),...o$2(t)];for(const s of e)this.createProperty(s,t[s])}const t=this[Symbol.metadata];if(null!==t){const e=litPropertyMetadata.get(t);if(void 0!==e)for(const[t,s]of e)this.elementProperties.set(t,s)}this._$Eh=new Map;for(const[t,e]of this.elementProperties){const s=this._$Eu(t,e);void 0!==s&&this._$Eh.set(s,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){const e=[];if(Array.isArray(t)){const s=new Set(t.flat(1/0).reverse());for(const t of s)e.unshift(c$2(t))}else void 0!==t&&e.push(c$2(t));return e}static _$Eu(t,e){const s=e.attribute;return!1===s?void 0:"string"==typeof s?s:"string"==typeof t?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){var t;this._$ES=new Promise((t=>this.enableUpdating=t)),this._$AL=new Map,this._$E_(),this.requestUpdate(),null==(t=this.constructor.l)||t.forEach((t=>t(this)))}addController(t){var e;(this._$EO??(this._$EO=new Set)).add(t),void 0!==this.renderRoot&&this.isConnected&&(null==(e=t.hostConnected)||e.call(t))}removeController(t){var e;null==(e=this._$EO)||e.delete(t)}_$E_(){const t=new Map,e=this.constructor.elementProperties;for(const s of e.keys())this.hasOwnProperty(s)&&(t.set(s,this[s]),delete this[s]);t.size>0&&(this._$Ep=t)}createRenderRoot(){const t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return S$1(t,this.constructor.elementStyles),t}connectedCallback(){var t;this.renderRoot??(this.renderRoot=this.createRenderRoot()),this.enableUpdating(!0),null==(t=this._$EO)||t.forEach((t=>{var e;return null==(e=t.hostConnected)?void 0:e.call(t)}))}enableUpdating(t){}disconnectedCallback(){var t;null==(t=this._$EO)||t.forEach((t=>{var e;return null==(e=t.hostDisconnected)?void 0:e.call(t)}))}attributeChangedCallback(t,e,s){this._$AK(t,s)}_$EC(t,e){var s;const r=this.constructor.elementProperties.get(t),o=this.constructor._$Eu(t,r);if(void 0!==o&&!0===r.reflect){const i=(void 0!==(null==(s=r.converter)?void 0:s.toAttribute)?r.converter:u$1).toAttribute(e,r.type);this._$Em=t,null==i?this.removeAttribute(o):this.setAttribute(o,i),this._$Em=null}}_$AK(t,e){var s;const r=this.constructor,o=r._$Eh.get(t);if(void 0!==o&&this._$Em!==o){const t=r.getPropertyOptions(o),i="function"==typeof t.converter?{fromAttribute:t.converter}:void 0!==(null==(s=t.converter)?void 0:s.fromAttribute)?t.converter:u$1;this._$Em=o,this[o]=i.fromAttribute(e,t.type),this._$Em=null}}requestUpdate(t,e,s){if(void 0!==t){if(s??(s=this.constructor.getPropertyOptions(t)),!(s.hasChanged??f$2)(this[t],e))return;this.P(t,e,s)}!1===this.isUpdatePending&&(this._$ES=this._$ET())}P(t,e,s){this._$AL.has(t)||this._$AL.set(t,e),!0===s.reflect&&this._$Em!==t&&(this._$Ej??(this._$Ej=new Set)).add(t)}async _$ET(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}const t=this.scheduleUpdate();return null!=t&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){var t;if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??(this.renderRoot=this.createRenderRoot()),this._$Ep){for(const[t,e]of this._$Ep)this[t]=e;this._$Ep=void 0}const t=this.constructor.elementProperties;if(t.size>0)for(const[e,s]of t)!0!==s.wrapped||this._$AL.has(e)||void 0===this[e]||this.P(e,this[e],s)}let e=!1;const s=this._$AL;try{e=this.shouldUpdate(s),e?(this.willUpdate(s),null==(t=this._$EO)||t.forEach((t=>{var e;return null==(e=t.hostUpdate)?void 0:e.call(t)})),this.update(s)):this._$EU()}catch(t){throw e=!1,this._$EU(),t}e&&this._$AE(s)}willUpdate(t){}_$AE(t){var e;null==(e=this._$EO)||e.forEach((t=>{var e;return null==(e=t.hostUpdated)?void 0:e.call(t)})),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EU(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Ej&&(this._$Ej=this._$Ej.forEach((t=>this._$EC(t,this[t])))),this._$EU()}updated(t){}firstUpdated(t){}}b.elementStyles=[],b.shadowRootOptions={mode:"open"},b[d("elementProperties")]=new Map,b[d("finalized")]=new Map,null==p||p({ReactiveElement:b}),(a.reactiveElementVersions??(a.reactiveElementVersions=[])).push("2.0.4");const n$2=globalThis,c=n$2.trustedTypes,h$1=c?c.createPolicy("lit-html",{createHTML:t=>t}):void 0,f$1="$lit$",v=`lit$${Math.random().toFixed(9).slice(2)}$`,m="?"+v,_=`<${m}>`,w=document,lt=()=>w.createComment(""),st=t=>null===t||"object"!=typeof t&&"function"!=typeof t,g=Array.isArray,$=t=>g(t)||"function"==typeof(null==t?void 0:t[Symbol.iterator]),x="[ \t\n\f\r]",T=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,E=/-->/g,k=/>/g,O=RegExp(`>|${x}(?:([^\\s"'>=/]+)(${x}*=${x}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),S=/'/g,j=/"/g,M=/^(?:script|style|textarea|title)$/i,P=t=>(e,...s)=>({_$litType$:t,strings:e,values:s}),ke=P(1),R=Symbol.for("lit-noChange"),D=Symbol.for("lit-nothing"),V=new WeakMap,I=w.createTreeWalker(w,129);function N(t,e){if(!g(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==h$1?h$1.createHTML(e):e}const U=(t,e)=>{const s=t.length-1,r=[];let o,i=2===e?"<svg>":3===e?"<math>":"",n=T;for(let e=0;e<s;e++){const s=t[e];let a,c,l=-1,h=0;for(;h<s.length&&(n.lastIndex=h,c=n.exec(s),null!==c);)h=n.lastIndex,n===T?"!--"===c[1]?n=E:void 0!==c[1]?n=k:void 0!==c[2]?(M.test(c[2])&&(o=RegExp("</"+c[2],"g")),n=O):void 0!==c[3]&&(n=O):n===O?">"===c[0]?(n=o??T,l=-1):void 0===c[1]?l=-2:(l=n.lastIndex-c[2].length,a=c[1],n=void 0===c[3]?O:'"'===c[3]?j:S):n===j||n===S?n=O:n===E||n===k?n=T:(n=O,o=void 0);const d=n===O&&t[e+1].startsWith("/>")?" ":"";i+=n===T?s+_:l>=0?(r.push(a),s.slice(0,l)+f$1+s.slice(l)+v+d):s+v+(-2===l?e:d)}return[N(t,i+(t[s]||"<?>")+(2===e?"</svg>":3===e?"</math>":"")),r]};class B{constructor({strings:t,_$litType$:e},s){let r;this.parts=[];let o=0,i=0;const n=t.length-1,a=this.parts,[l,h]=U(t,e);if(this.el=B.createElement(l,s),I.currentNode=this.el.content,2===e||3===e){const t=this.el.content.firstChild;t.replaceWith(...t.childNodes)}for(;null!==(r=I.nextNode())&&a.length<n;){if(1===r.nodeType){if(r.hasAttributes())for(const t of r.getAttributeNames())if(t.endsWith(f$1)){const e=h[i++],s=r.getAttribute(t).split(v),n=/([.?@])?(.*)/.exec(e);a.push({type:1,index:o,name:n[2],strings:s,ctor:"."===n[1]?Y:"?"===n[1]?Z:"@"===n[1]?q:G}),r.removeAttribute(t)}else t.startsWith(v)&&(a.push({type:6,index:o}),r.removeAttribute(t));if(M.test(r.tagName)){const t=r.textContent.split(v),e=t.length-1;if(e>0){r.textContent=c?c.emptyScript:"";for(let s=0;s<e;s++)r.append(t[s],lt()),I.nextNode(),a.push({type:2,index:++o});r.append(t[e],lt())}}}else if(8===r.nodeType)if(r.data===m)a.push({type:2,index:o});else{let t=-1;for(;-1!==(t=r.data.indexOf(v,t+1));)a.push({type:7,index:o}),t+=v.length-1}o++}}static createElement(t,e){const s=w.createElement("template");return s.innerHTML=t,s}}function z(t,e,s=t,r){var o,i;if(e===R)return e;let n=void 0!==r?null==(o=s.o)?void 0:o[r]:s.l;const a=st(e)?void 0:e._$litDirective$;return(null==n?void 0:n.constructor)!==a&&(null==(i=null==n?void 0:n._$AO)||i.call(n,!1),void 0===a?n=void 0:(n=new a(t),n._$AT(t,s,r)),void 0!==r?(s.o??(s.o=[]))[r]=n:s.l=n),void 0!==n&&(e=z(t,n._$AS(t,e.values),n,r)),e}class F{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:e},parts:s}=this._$AD,r=((null==t?void 0:t.creationScope)??w).importNode(e,!0);I.currentNode=r;let o=I.nextNode(),i=0,n=0,a=s[0];for(;void 0!==a;){if(i===a.index){let e;2===a.type?e=new et(o,o.nextSibling,this,t):1===a.type?e=new a.ctor(o,a.name,a.strings,this,t):6===a.type&&(e=new K(o,this,t)),this._$AV.push(e),a=s[++n]}i!==(null==a?void 0:a.index)&&(o=I.nextNode(),i++)}return I.currentNode=w,r}p(t){let e=0;for(const s of this._$AV)void 0!==s&&(void 0!==s.strings?(s._$AI(t,s,e),e+=s.strings.length-2):s._$AI(t[e])),e++}}class et{get _$AU(){var t;return(null==(t=this._$AM)?void 0:t._$AU)??this.v}constructor(t,e,s,r){this.type=2,this._$AH=D,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=s,this.options=r,this.v=(null==r?void 0:r.isConnected)??!0}get parentNode(){let t=this._$AA.parentNode;const e=this._$AM;return void 0!==e&&11===(null==t?void 0:t.nodeType)&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=z(this,t,e),st(t)?t===D||null==t||""===t?(this._$AH!==D&&this._$AR(),this._$AH=D):t!==this._$AH&&t!==R&&this._(t):void 0!==t._$litType$?this.$(t):void 0!==t.nodeType?this.T(t):$(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==D&&st(this._$AH)?this._$AA.nextSibling.data=t:this.T(w.createTextNode(t)),this._$AH=t}$(t){var e;const{values:s,_$litType$:r}=t,o="number"==typeof r?this._$AC(t):(void 0===r.el&&(r.el=B.createElement(N(r.h,r.h[0]),this.options)),r);if((null==(e=this._$AH)?void 0:e._$AD)===o)this._$AH.p(s);else{const t=new F(o,this),e=t.u(this.options);t.p(s),this.T(e),this._$AH=t}}_$AC(t){let e=V.get(t.strings);return void 0===e&&V.set(t.strings,e=new B(t)),e}k(t){g(this._$AH)||(this._$AH=[],this._$AR());const e=this._$AH;let s,r=0;for(const o of t)r===e.length?e.push(s=new et(this.O(lt()),this.O(lt()),this,this.options)):s=e[r],s._$AI(o),r++;r<e.length&&(this._$AR(s&&s._$AB.nextSibling,r),e.length=r)}_$AR(t=this._$AA.nextSibling,e){var s;for(null==(s=this._$AP)||s.call(this,!1,!0,e);t&&t!==this._$AB;){const e=t.nextSibling;t.remove(),t=e}}setConnected(t){var e;void 0===this._$AM&&(this.v=t,null==(e=this._$AP)||e.call(this,t))}}class G{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,s,r,o){this.type=1,this._$AH=D,this._$AN=void 0,this.element=t,this.name=e,this._$AM=r,this.options=o,s.length>2||""!==s[0]||""!==s[1]?(this._$AH=Array(s.length-1).fill(new String),this.strings=s):this._$AH=D}_$AI(t,e=this,s,r){const o=this.strings;let i=!1;if(void 0===o)t=z(this,t,e,0),i=!st(t)||t!==this._$AH&&t!==R,i&&(this._$AH=t);else{const r=t;let n,a;for(t=o[0],n=0;n<o.length-1;n++)a=z(this,r[s+n],e,n),a===R&&(a=this._$AH[n]),i||(i=!st(a)||a!==this._$AH[n]),a===D?t=D:t!==D&&(t+=(a??"")+o[n+1]),this._$AH[n]=a}i&&!r&&this.j(t)}j(t){t===D?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}}class Y extends G{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===D?void 0:t}}class Z extends G{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==D)}}class q extends G{constructor(t,e,s,r,o){super(t,e,s,r,o),this.type=5}_$AI(t,e=this){if((t=z(this,t,e,0)??D)===R)return;const s=this._$AH,r=t===D&&s!==D||t.capture!==s.capture||t.once!==s.once||t.passive!==s.passive,o=t!==D&&(s===D||r);r&&this.element.removeEventListener(this.name,this,s),o&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){var e;"function"==typeof this._$AH?this._$AH.call((null==(e=this.options)?void 0:e.host)??this.element,t):this._$AH.handleEvent(t)}}class K{constructor(t,e,s){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=s}get _$AU(){return this._$AM._$AU}_$AI(t){z(this,t)}}const Re=n$2.litHtmlPolyfillSupport;null==Re||Re(B,et),(n$2.litHtmlVersions??(n$2.litHtmlVersions=[])).push("3.2.0");const Q=(t,e,s)=>{const r=(null==s?void 0:s.renderBefore)??e;let o=r._$litPart$;if(void 0===o){const t=(null==s?void 0:s.renderBefore)??null;r._$litPart$=o=new et(e.insertBefore(lt(),t),t,void 0,s??{})}return o._$AI(t),o};class h extends b{constructor(){super(...arguments),this.renderOptions={host:this},this.o=void 0}createRenderRoot(){var t;const e=super.createRenderRoot();return(t=this.renderOptions).renderBefore??(t.renderBefore=e.firstChild),e}update(t){const e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this.o=Q(e,this.renderRoot,this.renderOptions)}connectedCallback(){var t;super.connectedCallback(),null==(t=this.o)||t.setConnected(!0)}disconnectedCallback(){var t;super.disconnectedCallback(),null==(t=this.o)||t.setConnected(!1)}render(){return R}}h._$litElement$=!0,h.finalized=!0,null==(_a=globalThis.litElementHydrateSupport)||_a.call(globalThis,{LitElement:h});const f=globalThis.litElementPolyfillSupport;null==f||f({LitElement:h}),(globalThis.litElementVersions??(globalThis.litElementVersions=[])).push("4.1.0");const o$1={attribute:!0,type:String,converter:u$1,reflect:!1,hasChanged:f$2},r$3=(t=o$1,e,s)=>{const{kind:r,metadata:o}=s;let i=globalThis.litPropertyMetadata.get(o);if(void 0===i&&globalThis.litPropertyMetadata.set(o,i=new Map),i.set(s.name,t),"accessor"===r){const{name:r}=s;return{set(s){const o=e.get.call(this);e.set.call(this,s),this.requestUpdate(r,o,t)},init(e){return void 0!==e&&this.P(r,void 0,t),e}}}if("setter"===r){const{name:r}=s;return function(s){const o=this[r];e.call(this,s),this.requestUpdate(r,o,t)}}throw Error("Unsupported decorator location: "+r)};function n$1(t){return(e,s)=>"object"==typeof s?r$3(t,e,s):((t,e,s)=>{const r=e.hasOwnProperty(s);return e.constructor.createProperty(s,r?{...t,wrapped:!0}:t),r?Object.getOwnPropertyDescriptor(e,s):void 0})(t,e,s)}function r$2(t){return n$1({...t,state:!0,attribute:!1})}const t$2={ATTRIBUTE:1},e$1=t=>(...e)=>({_$litDirective$:t,values:e});let i$1=class{constructor(t){}get _$AU(){return this._$AM._$AU}_$AT(t,e,s){this.t=t,this._$AM=e,this.i=s}_$AS(t,e){return this.update(t,e)}update(t,e){return this.render(...e)}};const ee="important",ie=" !"+ee,se=e$1(class extends i$1{constructor(t){var e;if(super(t),t.type!==t$2.ATTRIBUTE||"style"!==t.name||(null==(e=t.strings)?void 0:e.length)>2)throw Error("The `styleMap` directive must be used in the `style` attribute and must be the only part in the attribute.")}render(t){return Object.keys(t).reduce(((e,s)=>{const r=t[s];return null==r?e:e+`${s=s.includes("-")?s:s.replace(/(?:^(webkit|moz|ms|o)|)(?=[A-Z])/g,"-$&").toLowerCase()}:${r};`}),"")}update(t,[e]){const{style:s}=t.element;if(void 0===this.ft)return this.ft=new Set(Object.keys(e)),this.render(e);for(const t of this.ft)null==e[t]&&(this.ft.delete(t),t.includes("-")?s.removeProperty(t):s[t]=null);for(const t in e){const r=e[t];if(null!=r){this.ft.add(t);const e="string"==typeof r&&r.endsWith(ie);t.includes("-")||e?s.setProperty(t,e?r.slice(0,-11):r,e?ee:""):s[t]=r}}return R}});function getAccessibleTextColors(t){if(!Array.isArray(t))return console.error("Invalid RGB format (not an array):",t),[255,255,255];try{const e=Math.min(255,Math.max(0,Number(t[0])||0)),s=Math.min(255,Math.max(0,Number(t[1])||0)),r=Math.min(255,Math.max(0,Number(t[2])||0)),o=t=>{const e=t/255;return e<=.03928?e/12.92:Math.pow((e+.055)/1.055,2.4)};return.2126*o(e)+.7152*o(s)+.0722*o(r)>.179?[0,0,0]:[255,255,255]}catch(e){return console.error("Error in getAccessibleTextColors:",e),console.error("Failed RGB input was:",JSON.stringify(t)),[255,255,255]}}function formatAttributeKey(t){return t.split("_").map((t=>t.charAt(0).toUpperCase()+t.slice(1))).join(" ")}function formatAttributeValue(t,e){switch(e){case"color":return ke`<span style="color: ${t};">${t}</span>`;case"number":case"combobox":default:return t.toString();case"boolean":return t?"Yes":"No"}}function memoize(t){const e=new Map;return function(...s){const r=JSON.stringify(s);if(e.has(r))return e.get(r);const o=t(...s);return e.set(r,o),o}}function convertHABrightnessToCard(t){return Math.round((t-3)/252*100)}function convertCardBrightnessToHA(t){return Math.round(t/100*252)+3}const log={debug:(...t)=>{},log:(...t)=>{},warn:(...t)=>{},error:(...t)=>{console.error(...t)}},styleText=':root{--primary-color: #03a9f4;--secondary-color: #f0f0f0;--background-color: white;--text-color: black;--box-shadow: 0 2px 2px 0 rgba(0, 0, 0, .14), 0 1px 5px 0 rgba(0, 0, 0, .12), 0 3px 1px -2px rgba(0, 0, 0, .2)}*{transition:all .5s ease}ha-card{overflow:visible!important}.card{background-color:var( --background-color, var(--ha-card-background, var(--card-background-color, white)) );border-radius:8px;box-shadow:var( --ha-card-box-shadow, 0 2px 2px 0 rgba(0, 0, 0, .14), 0 1px 5px 0 rgba(0, 0, 0, .12), 0 3px 1px -2px rgba(0, 0, 0, .2) );color:var(--text-color, var(--primary-text-color, black));padding:16px;position:relative;overflow:visible;z-index:1;font-size:14px;transition:background-color .5s ease,color .5s ease}.card:after{content:"";position:absolute;top:0;left:0;right:0;bottom:0;border-radius:8px;pointer-events:none;box-shadow:inset 0 0 0 1px rgba(var(--rgb-primary-text-color, 0, 0, 0),.1);z-index:1}.card-background{position:absolute;top:0;left:0;right:0;bottom:0;background-size:cover;background-position:center;opacity:.7;transition:opacity .5s ease,background-image .5s ease;z-index:0;pointer-events:none;border-radius:8px}.header{display:flex;align-items:center;margin-bottom:16px;position:relative;z-index:2}.light-icon{width:40px;height:40px;margin-right:16px;border-radius:50%;background-color:var(--accent-color, var(--primary-color, #03a9f4));display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;box-shadow:0 0 rgba(var(--accent-color, var(--primary-color-rgb, 3, 169, 244)),0);transition:box-shadow .3s ease}.light-icon img{width:30px;height:30px;filter:brightness(.8);transition:filter .3s ease}.light-on .light-icon{box-shadow:0 0 15px var(--accent-color, var(--primary-color, #03a9f4));animation:pulse 1.5s infinite}.light-on .light-icon img{filter:brightness(1.2) drop-shadow(0 0 5px rgba(255,255,255,.7))}@keyframes pulse{0%{box-shadow:0 0 rgba(var(--rgb-accent-color),.7)}70%{box-shadow:0 0 0 10px rgba(var(--rgb-accent-color),0)}to{box-shadow:0 0 rgba(var(--rgb-accent-color),0)}}.light-name{flex-grow:1;font-weight:700;font-size:1.5em;color:var(--text-color, var(--primary-text-color, black));margin:0 6px;white-space:nowrap;text-overflow:ellipsis}.effect-select-wrapper,.layout-select-wrapper,.preset-select-wrapper{position:relative;margin-bottom:16px;z-index:5}.effect-row{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;position:relative;z-index:5}.effect-row .effect-select-wrapper{flex:0 0 65%;margin-bottom:0}.effect-row .effect-controls{flex:0 0 20%;margin:0 10px 0 0;justify-content:flex-end}.effect-row .effect-button{width:30px;height:30px}.effect-row .effect-button.random{width:34px;height:34px}.effect-row .effect-button ha-icon{--mdc-icon-size: 18px}.effect-row .effect-button.random ha-icon{--mdc-icon-size: 20px}.dropdown{position:relative}.dropdown-header{padding:8px 12px;border:2px solid var(--accent-color, var(--primary-color, #03a9f4));border-radius:4px;cursor:pointer;display:flex;justify-content:space-between;align-items:center;background-color:var(--background-color, var(--card-background-color, white));color:var(--text-color, var(--primary-text-color, black));font-size:1.1em;transition:background-color .3s ease,color .3s ease}.dropdown-header:hover{background-color:var(--accent-color, var(--secondary-background-color, #f0f0f0));color:var(--background-color, var(--primary-text-color, black))}.dropdown-header:after{content:"▼";font-size:.8em;transition:transform .3s ease}.dropdown.open .dropdown-header:after{transform:rotate(180deg)}.dropdown-content{position:absolute;top:100%;left:0;right:0;background-color:var(--background-color, var(--card-background-color, white));border:1px solid var(--accent-color, var(--primary-color, #03a9f4));border-radius:0 0 4px 4px;max-height:200px;overflow-y:auto;z-index:6;opacity:0;visibility:hidden;transform-origin:top;transform:scaleY(0);transition:opacity .3s,visibility .3s,transform .3s;box-shadow:0 2px 8px #0000001a}.dropdown.open .dropdown-content{opacity:1;visibility:visible;transform:scaleY(1)}.dropdown-item{padding:8px 12px;cursor:pointer;color:var(--text-color, var(--primary-text-color, black));font-size:1.1em;transition:background-color .3s ease,color .3s ease}.dropdown-item:hover{background-color:var(--accent-color, var(--primary-color, #03a9f4));color:var(--background-color, white)}.dropdown-item.selected{background-color:var(--accent-color, #03a9f4);color:var(--text-color, white)}.dropdown.disabled{opacity:.7;cursor:not-allowed}.dropdown.disabled .dropdown-header{border-color:rgba(var(--accent-color-rgb, 3, 169, 244),.4);cursor:not-allowed;background-color:rgba(var(--background-color-rgb, 255, 255, 255),.5)}.dropdown.disabled .dropdown-header:hover{background-color:rgba(var(--background-color-rgb, 255, 255, 255),.5);color:var(--text-color, var(--primary-text-color, black))}.dropdown-item.disabled{opacity:.7;cursor:not-allowed;background-color:rgba(var(--background-color-rgb, 255, 255, 255),.5)}.dropdown-item.disabled:hover{background-color:rgba(var(--background-color-rgb, 255, 255, 255),.5);color:var(--text-color, var(--primary-text-color, black))}.effect-info{background-color:rgba(var(--background-color-rgb, 128, 128, 128),.1);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);border-radius:8px;padding:12px;margin-top:12px;position:relative;z-index:4;opacity:0;transform:translateY(-10px);max-height:0;overflow:hidden;box-shadow:0 2px 4px #0000001a;border:1px solid rgba(var(--accent-color-rgb, 3, 169, 244),.3);display:flex;justify-content:space-between;transition:opacity .3s ease,transform .3s ease,max-height .3s ease}.effect-info.visible{opacity:1;transform:translateY(0);max-height:200px}.effect-info-text{flex:1}.effect-description{font-style:italic;color:var(--text-color, var(--primary-text-color, black));font-weight:500;margin-bottom:8px;line-height:1.4}.effect-publisher{font-size:.9em;color:var(--text-color, var(--secondary-text-color, #666));font-weight:500;line-height:1.4}.effect-features{display:flex;flex-direction:column;justify-content:center;margin-left:12px}.effect-features ha-icon{--mdc-icon-size: 20px;color:var(--text-color, var(--secondary-text-color, #666));margin-bottom:4px}.effect-features ha-icon:last-child{margin-bottom:0}.controls-row{display:flex;align-items:center;justify-content:space-between;margin-top:16px;padding:0 8px}.brightness-slider{display:flex;align-items:center;flex-grow:1;margin-right:16px}.brightness-slider ha-icon{margin-right:8px;color:var(--text-color)}.brightness-slider input[type=range]{-webkit-appearance:none;-moz-appearance:none;appearance:none;width:100%;height:8px;border-radius:4px;background:var(--primary-text-color);outline:none;opacity:.8;transition:all .3s ease;margin:0;padding:0}.brightness-slider input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;-moz-appearance:none;appearance:none;width:18px;height:18px;border-radius:50%;background:var(--slider-color, var(--accent-color));cursor:pointer;transition:all .3s ease;box-shadow:0 0 0 3px rgba(var(--rgb-primary-text-color),.8);margin-top:-5px}.brightness-slider input[type=range]::-moz-range-thumb{width:18px;height:18px;border:none;border-radius:50%;background:var(--slider-color, var(--accent-color));cursor:pointer;transition:all .3s ease;box-shadow:0 0 0 3px rgba(var(--rgb-primary-text-color),.8)}.brightness-slider input[type=range]::-webkit-slider-runnable-track{height:8px;border-radius:4px;background:linear-gradient(to right,var(--slider-color, var(--accent-color)) 0%,var(--slider-color, var(--accent-color)) var(--slider-percentage, 50%),var(--primary-text-color) var(--slider-percentage, 50%),var(--primary-text-color) 100%)}.brightness-slider input[type=range]::-moz-range-track{height:8px;border-radius:4px;background:linear-gradient(to right,var(--slider-color, var(--accent-color)) 0%,var(--slider-color, var(--accent-color)) var(--slider-percentage, 50%),var(--primary-text-color) var(--slider-percentage, 50%),var(--primary-text-color) 100%)}.brightness-slider input[type=range]:hover::-webkit-slider-thumb,.brightness-slider input[type=range]:active::-webkit-slider-thumb{box-shadow:0 0 0 4px rgba(var(--rgb-primary-text-color),.9);transform:scale(1.2)}.brightness-slider input[type=range]:hover::-moz-range-thumb,.brightness-slider input[type=range]:active::-moz-range-thumb{box-shadow:0 0 0 4px rgba(var(--rgb-primary-text-color),.9);transform:scale(1.2)}.attributes{margin-top:8px;position:relative;z-index:2}.attributes-toggle{cursor:pointer;padding:8px;border-radius:50%;background-color:rgba(var(--rgb-primary-text-color),.1);transition:background-color .3s ease}.attributes-toggle:hover{background-color:rgba(var(--rgb-primary-text-color),.2)}.attributes-toggle ha-icon{display:block;transition:transform .3s ease}.attributes.expanded .attributes-toggle ha-icon{transform:rotate(180deg)}.attributes-content{max-height:0;overflow:hidden;border-radius:8px;padding:0;margin-top:8px;background-color:rgba(var(--background-color-rgb, 128, 128, 128),.1);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);box-shadow:0 2px 4px #0000001a;transition:max-height .3s ease,padding .3s ease,opacity .3s ease;opacity:0}.attributes.expanded .attributes-content{max-height:300px;padding:8px 12px;overflow-y:auto;border:1px solid rgba(var(--accent-color-rgb, 3, 169, 244),.3);opacity:1}.attribute-list{list-style-type:none;padding:0;margin:0}.attribute-item{display:flex;justify-content:space-between;align-items:flex-start;padding:6px 0;border-bottom:1px solid rgba(var(--rgb-primary-text-color, 0, 0, 0),.12);font-size:.9em}.attribute-item:last-child{border-bottom:none}.attribute-key{font-weight:700;margin-right:8px;color:var(--text-color, var(--primary-text-color, black));flex:0 0 40%}.attribute-value{flex:0 0 58%;text-align:right;color:var(--text-color, var(--secondary-text-color, #666));overflow-wrap:break-word;word-break:break-word;font-size:.9em}.attributes-selectors{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px;border-bottom:1px solid rgba(var(--rgb-primary-text-color, 0, 0, 0),.1);padding-bottom:12px}.select-wrapper.compact .select-section-title{font-size:.8em;margin-bottom:2px}.select-wrapper.compact .dropdown-header{padding:4px 8px;font-size:.9em}.attributes-content{display:flex;flex-direction:column}@media (max-width: 600px){.attributes-selectors{grid-template-columns:1fr;gap:4px}}.select-section-title{font-weight:600;font-size:.9em;color:var(--text-color, var(--primary-text-color, black));margin:12px 0 4px;opacity:.9;display:flex;align-items:center}.select-section-title ha-icon{margin-right:6px;color:var(--accent-color, var(--primary-color, #03a9f4));--mdc-icon-size: 16px}.select-row{display:flex;justify-content:space-between;margin-bottom:16px}.layout-select-wrapper .dropdown-header,.preset-select-wrapper .dropdown-header{border-width:1px;padding:6px 10px;background-color:rgba(var(--background-color-rgb, 255, 255, 255),.5);-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px)}.effect-controls{display:flex;justify-content:center;align-items:center;margin:12px 0;gap:12px;position:relative;z-index:3}.effect-button{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;background-color:var(--accent-color, var(--primary-color, #03a9f4));color:var(--background-color, white);cursor:pointer;box-shadow:0 2px 4px #0003;transition:all .3s ease;border:none;outline:none;position:relative;overflow:hidden}.effect-button:before{content:"";position:absolute;top:0;left:0;right:0;bottom:0;background:radial-gradient(circle,#ffffff4d,#fff0 70%);opacity:0;transition:opacity .3s ease}.effect-button:hover:before{opacity:1}.effect-button:active{transform:scale(.95);box-shadow:0 1px 2px #0003}.effect-button.random{background:linear-gradient(45deg,var(--accent-color) 0%,#ff00ff 100%);box-shadow:0 2px 10px rgba(var(--rgb-accent-color),.4);width:42px;height:42px}.effect-button.large{--mdc-icon-size: 24px}.effect-button.small{width:28px;height:28px;--mdc-icon-size: 18px}.effect-button ha-icon{--mdc-icon-size: 20px;transition:transform .3s ease}.effect-button:hover ha-icon{transform:scale(1.1)}.dropdown-content::-webkit-scrollbar,.attributes.expanded .attributes-content::-webkit-scrollbar{width:8px}.dropdown-content::-webkit-scrollbar-track,.attributes.expanded .attributes-content::-webkit-scrollbar-track{background:rgba(var(--background-color-rgb, 128, 128, 128),.1)}.dropdown-content::-webkit-scrollbar-thumb,.attributes.expanded .attributes-content::-webkit-scrollbar-thumb{background-color:var(--accent-color, var(--primary-color, #03a9f4));border-radius:4px;border:2px solid rgba(var(--background-color-rgb, 128, 128, 128),.1)}ha-switch{--switch-checked-color: var(--accent-color, var(--primary-color));--switch-checked-button-color: var(--switch-checked-color, var(--primary-background-color));--switch-checked-track-color: var(--switch-checked-color, #000000)}.bg-white{background-color:var(--background-color)}.text-black{color:var(--text-color)}.rounded{border-radius:8px}.badge{background-color:var(--accent-color, var(--primary-color, #03a9f4));color:var(--background-color, white);border-radius:12px;padding:4px 8px;font-size:.7em;font-weight:700;margin-left:8px;text-transform:uppercase;letter-spacing:.5px}.selects-container{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px}.select-wrapper{z-index:5}@media (max-width: 600px){.card{padding:12px;font-size:14px}.light-icon{width:32px;height:32px}.light-icon img{width:24px;height:24px}.light-name{font-size:1.5em}.dropdown-header,.dropdown-item{padding:6px 10px}.controls-row{flex-direction:column;align-items:stretch}.brightness-slider{margin-right:0;margin-bottom:12px}.attributes-toggle{align-self:flex-end}.selects-container{grid-template-columns:1fr;gap:8px}.effect-button{width:40px;height:40px}.effect-button.large{width:48px;height:48px}.effect-button ha-icon{--mdc-icon-size: 24px}.effect-row{flex-direction:column;align-items:stretch}.effect-row .effect-select-wrapper{flex:1 0 auto;margin-bottom:8px}.effect-row .effect-controls{flex:1 0 auto;justify-content:center}.effect-row .effect-button{width:36px;height:36px}.effect-row .effect-button.random{width:40px;height:40px}.effect-row .effect-button ha-icon{--mdc-icon-size: 22px}.effect-row .effect-button.random ha-icon{--mdc-icon-size: 24px}}.header,.controls-row,.attributes,.effect-controls{position:relative;z-index:3}@keyframes fadeIn{0%{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}@keyframes glow{0%{box-shadow:0 0 5px var(--accent-color)}50%{box-shadow:0 0 15px var(--accent-color)}to{box-shadow:0 0 5px var(--accent-color)}}.fade-in{animation:fadeIn .3s ease forwards}.glow{animation:glow 2s infinite}';class State{constructor(t){this._backgroundColor="",this._textColor="",this._accentColor="",this._isOn=!1,this._currentEffect="No effect",this._isDropdownOpen=!1,this._isAttributesExpanded=!1,this._showEffectInfo=!0,this._showEffectParameters=!0,this._showBrightnessControl=!0,this._brightness=100,this._lastEffectImage=null,this._currentLayout="",this._availableLayouts=[],this._isLayoutDropdownOpen=!1,this._showLayoutSelect=!0,this._currentPreset="",this._availablePresets=[],this._isPresetDropdownOpen=!1,this._showPresetSelect=!0,this._showEffectControls=!0,(this._host=t).addController(this)}hostConnected(){this._host.requestUpdate()}get backgroundColor(){return this._backgroundColor}set backgroundColor(t){this._backgroundColor=t,this._host.requestUpdate()}get textColor(){return this._textColor}set textColor(t){this._textColor=t,this._host.requestUpdate()}get accentColor(){return this._accentColor}set accentColor(t){this._accentColor=t,this._host.requestUpdate()}get isOn(){return this._isOn}set isOn(t){this._isOn=t,this._host.requestUpdate()}get currentEffect(){return this._currentEffect}set currentEffect(t){this._currentEffect=t,this._host.requestUpdate()}get isDropdownOpen(){return this._isDropdownOpen}set isDropdownOpen(t){this._isDropdownOpen=t,this._host.requestUpdate()}get isAttributesExpanded(){return this._isAttributesExpanded}set isAttributesExpanded(t){this._isAttributesExpanded=t,this._host.requestUpdate()}get showEffectInfo(){return this._showEffectInfo}set showEffectInfo(t){this._showEffectInfo=t,this._host.requestUpdate()}get showEffectParameters(){return this._showEffectParameters}set showEffectParameters(t){this._showEffectParameters=t,this._host.requestUpdate()}get showBrightnessControl(){return this._showBrightnessControl}set showBrightnessControl(t){this._showBrightnessControl=t,this._host.requestUpdate()}get brightness(){return this._brightness}set brightness(t){this._brightness=t,this._host.requestUpdate()}get allowedEffects(){return this._allowedEffects}set allowedEffects(t){this._allowedEffects=t,this._host.requestUpdate()}get lastEffectImage(){return this._lastEffectImage}set lastEffectImage(t){this._lastEffectImage=t,this._host.requestUpdate()}get currentLayout(){return this._currentLayout}set currentLayout(t){this._currentLayout=t,this._host.requestUpdate()}get availableLayouts(){return this._availableLayouts}set availableLayouts(t){this._availableLayouts=t,this._host.requestUpdate()}get isLayoutDropdownOpen(){return this._isLayoutDropdownOpen}set isLayoutDropdownOpen(t){this._isLayoutDropdownOpen=t,this._host.requestUpdate()}get showLayoutSelect(){return this._showLayoutSelect}set showLayoutSelect(t){this._showLayoutSelect=t,this._host.requestUpdate()}get currentPreset(){return this._currentPreset}set currentPreset(t){this._currentPreset=t,this._host.requestUpdate()}get availablePresets(){return this._availablePresets}set availablePresets(t){this._availablePresets=t,this._host.requestUpdate()}get isPresetDropdownOpen(){return this._isPresetDropdownOpen}set isPresetDropdownOpen(t){this._isPresetDropdownOpen=t,this._host.requestUpdate()}get showPresetSelect(){return this._showPresetSelect}set showPresetSelect(t){this._showPresetSelect=t,this._host.requestUpdate()}get showEffectControls(){return this._showEffectControls}set showEffectControls(t){this._showEffectControls=t,this._host.requestUpdate()}}var t$1=function(t,e){return t<e?-1:t>e?1:0},r$1=function(t){return t.reduce((function(t,e){return t+e}),0)},n2=function(){function t(t){this.colors=t}var e=t.prototype;return e.palette=function(){return this.colors},e.map=function(t){return t},t}(),o=function(){function t(t,e,s){return(t<<10)+(e<<5)+s}function e(t){var e=[],s=!1;function r(){e.sort(t),s=!0}return{push:function(t){e.push(t),s=!1},peek:function(t){return s||r(),void 0===t&&(t=e.length-1),e[t]},pop:function(){return s||r(),e.pop()},size:function(){return e.length},map:function(t){return e.map(t)},debug:function(){return s||r(),e}}}function s(t,e,s,r,o,i,n){var a=this;a.r1=t,a.r2=e,a.g1=s,a.g2=r,a.b1=o,a.b2=i,a.histo=n}function r(){this.vboxes=new e((function(t,e){return t$1(t.vbox.count()*t.vbox.volume(),e.vbox.count()*e.vbox.volume())}))}function o(e,s){if(s.count()){var r=s.r2-s.r1+1,o=s.g2-s.g1+1,i=Math.max.apply(null,[r,o,s.b2-s.b1+1]);if(1==s.count())return[s.copy()];var n,a,c,l,h=0,d=[],f=[];if(i==r)for(n=s.r1;n<=s.r2;n++){for(l=0,a=s.g1;a<=s.g2;a++)for(c=s.b1;c<=s.b2;c++)l+=e[t(n,a,c)]||0;d[n]=h+=l}else if(i==o)for(n=s.g1;n<=s.g2;n++){for(l=0,a=s.r1;a<=s.r2;a++)for(c=s.b1;c<=s.b2;c++)l+=e[t(a,n,c)]||0;d[n]=h+=l}else for(n=s.b1;n<=s.b2;n++){for(l=0,a=s.r1;a<=s.r2;a++)for(c=s.g1;c<=s.g2;c++)l+=e[t(a,c,n)]||0;d[n]=h+=l}return d.forEach((function(t,e){f[e]=h-t})),function(t){var e,r,o,i,a,c=t+"1",l=t+"2",u=0;for(n=s[c];n<=s[l];n++)if(d[n]>h/2){for(o=s.copy(),i=s.copy(),a=(e=n-s[c])<=(r=s[l]-n)?Math.min(s[l]-1,~~(n+r/2)):Math.max(s[c],~~(n-1-e/2));!d[a];)a++;for(u=f[a];!u&&d[a-1];)u=f[--a];return o[l]=a,i[c]=o[l]+1,[o,i]}}(i==r?"r":i==o?"g":"b")}}return s.prototype={volume:function(t){var e=this;return e._volume&&!t||(e._volume=(e.r2-e.r1+1)*(e.g2-e.g1+1)*(e.b2-e.b1+1)),e._volume},count:function(e){var s=this,r=s.histo;if(!s._count_set||e){var o,i,n,a=0;for(o=s.r1;o<=s.r2;o++)for(i=s.g1;i<=s.g2;i++)for(n=s.b1;n<=s.b2;n++)a+=r[t(o,i,n)]||0;s._count=a,s._count_set=!0}return s._count},copy:function(){var t=this;return new s(t.r1,t.r2,t.g1,t.g2,t.b1,t.b2,t.histo)},avg:function(e){var s=this,r=s.histo;if(!s._avg||e){var o,i,n,a,c=0,l=0,h=0,d=0;if(s.r1===s.r2&&s.g1===s.g2&&s.b1===s.b2)s._avg=[s.r1<<3,s.g1<<3,s.b1<<3];else{for(i=s.r1;i<=s.r2;i++)for(n=s.g1;n<=s.g2;n++)for(a=s.b1;a<=s.b2;a++)c+=o=r[t(i,n,a)]||0,l+=o*(i+.5)*8,h+=o*(n+.5)*8,d+=o*(a+.5)*8;s._avg=c?[~~(l/c),~~(h/c),~~(d/c)]:[~~(8*(s.r1+s.r2+1)/2),~~(8*(s.g1+s.g2+1)/2),~~(8*(s.b1+s.b2+1)/2)]}}return s._avg},contains:function(t){var e=this,s=t[0]>>3;return gval=t[1]>>3,bval=t[2]>>3,s>=e.r1&&s<=e.r2&&gval>=e.g1&&gval<=e.g2&&bval>=e.b1&&bval<=e.b2}},r.prototype={push:function(t){this.vboxes.push({vbox:t,color:t.avg()})},palette:function(){return this.vboxes.map((function(t){return t.color}))},size:function(){return this.vboxes.size()},map:function(t){for(var e=this.vboxes,s=0;s<e.size();s++)if(e.peek(s).vbox.contains(t))return e.peek(s).color;return this.nearest(t)},nearest:function(t){for(var e,s,r,o=this.vboxes,i=0;i<o.size();i++)((s=Math.sqrt(Math.pow(t[0]-o.peek(i).color[0],2)+Math.pow(t[1]-o.peek(i).color[1],2)+Math.pow(t[2]-o.peek(i).color[2],2)))<e||void 0===e)&&(e=s,r=o.peek(i).color);return r},forcebw:function(){var t=this.vboxes;t.sort((function(t,e){return t$1(r$1(t.color),r$1(e.color))}));var e=t[0].color;e[0]<5&&e[1]<5&&e[2]<5&&(t[0].color=[0,0,0]);var s=t.length-1,r=t[s].color;r[0]>251&&r[1]>251&&r[2]>251&&(t[s].color=[255,255,255])}},{quantize:function(i,n){if(!Number.isInteger(n)||n<1||n>256)throw new Error("Invalid maximum color count. It must be an integer between 1 and 256.");if(!i.length||n<2||n>256)return!1;if(!i.length||n<2||n>256)return!1;for(var a=[],c=new Set,l=0;l<i.length;l++){var h=i[l],d=h.join(",");c.has(d)||(c.add(d),a.push(h))}if(a.length<=n)return new n2(a);var f,u,p,g=(f=i,p=new Array(32768),f.forEach((function(e){u=t(e[0]>>3,e[1]>>3,e[2]>>3),p[u]=(p[u]||0)+1})),p);g.forEach((function(){}));var _=function(t,e){var r,o,i,n=1e6,a=0,c=1e6,l=0,h=1e6,d=0;return t.forEach((function(t){(r=t[0]>>3)<n?n=r:r>a&&(a=r),(o=t[1]>>3)<c?c=o:o>l&&(l=o),(i=t[2]>>3)<h?h=i:i>d&&(d=i)})),new s(n,a,c,l,h,d,e)}(i,g),b=new e((function(t,e){return t$1(t.count(),e.count())}));function v(t,e){for(var s,r=t.size(),i=0;i<1e3;){if(r>=e)return;if(i++>1e3)return;if((s=t.pop()).count()){var n=o(g,s),a=n[0],c=n[1];if(!a)return;t.push(a),c&&(t.push(c),r++)}else t.push(s),i++}}b.push(_),v(b,.75*n);for(var m=new e((function(t,e){return t$1(t.count()*t.volume(),e.count()*e.volume())}));b.size();)m.push(b.pop());v(m,n);for(var y=new r;m.size();)y.push(m.pop());return y}}}().quantize,e=function(t){this.canvas=document.createElement("canvas"),this.context=this.canvas.getContext("2d"),this.width=this.canvas.width=t.naturalWidth,this.height=this.canvas.height=t.naturalHeight,this.context.drawImage(t,0,0,this.width,this.height)};e.prototype.getImageData=function(){return this.context.getImageData(0,0,this.width,this.height)};var t,r,u=function(){};u.prototype.getColor=function(t,e){return void 0===e&&(e=10),this.getPalette(t,5,e)[0]},u.prototype.getPalette=function(t,s,r){var i=function(t){var e=t.colorCount,s=t.quality;if(void 0!==e&&Number.isInteger(e)){if(1===e)throw new Error("colorCount should be between 2 and 20. To get one color, call getColor() instead of getPalette()");e=Math.max(e,2),e=Math.min(e,20)}else e=10;return(void 0===s||!Number.isInteger(s)||s<1)&&(s=10),{colorCount:e,quality:s}}({colorCount:s,quality:r}),n=new e(t),a=function(t,e,s){for(var r,o,i,n,a,c=t,l=[],h=0;h<e;h+=s)o=c[0+(r=4*h)],i=c[r+1],n=c[r+2],(void 0===(a=c[r+3])||a>=125)&&(o>250&&i>250&&n>250||l.push([o,i,n]));return l}(n.getImageData().data,n.width*n.height,i.quality),c=o(a,i.colorCount);return c?c.palette():null},u.prototype.getColorFromUrl=function(t,e,s){var r=this,o=document.createElement("img");o.addEventListener("load",(function(){var i=r.getPalette(o,5,s);e(i[0],t)})),o.src=t},u.prototype.getImageData=function(t,e){var s=new XMLHttpRequest;s.open("GET",t,!0),s.responseType="arraybuffer",s.onload=function(){if(200==this.status){var t=new Uint8Array(this.response);i=t.length;for(var s=new Array(i),r=0;r<t.length;r++)s[r]=String.fromCharCode(t[r]);var o=s.join(""),n=window.btoa(o);e("data:image/png;base64,"+n)}},s.send()},u.prototype.getColorAsync=function(t,e,s){var r=this;this.getImageData(t,(function(t){var o=document.createElement("img");o.addEventListener("load",(function(){var t=r.getPalette(o,5,s);e(t[0],this)})),o.src=t}))};class ColorManager{constructor(){this._colorThief=new u}async extractColors(t){if(!t)return{backgroundColor:"",textColor:"",accentColor:""};const e=new Image;return e.crossOrigin="Anonymous",e.src=t,e.alt="Effect image",new Promise((t=>{e.onload=()=>{const s=this._colorThief.getPalette(e,3);if(s&&s.length>=2){const e=Array.isArray(s[0])?s[0]:[0,0,0],r=Array.isArray(s[1])?s[1]:[0,0,0],o=`rgb(${e.join(",")})`,i=`rgb(${getAccessibleTextColors(e).join(",")})`,n=`rgb(${r.join(",")})`;t({backgroundColor:o,textColor:i,accentColor:n})}else t({backgroundColor:"",textColor:"",accentColor:""})}}))}}class StateManager{constructor(t,e){this._isDraggingBrightness=!1,this._config=t,this._state=e,this._colorManager=new ColorManager}get hass(){return this._hass}set hass(t){this._hass=t,this.updateState()}async updateState(){if(this._hass&&this._config){const t=this._hass.states[this._config.entity];if(t){const e=t.attributes.effect||"No effect",s="on"===t.state,r=convertHABrightnessToCard(t.attributes.brightness);if(t.attributes.effect_image!==this._state.lastEffectImage&&(this._state.lastEffectImage=t.attributes.effect_image,t.attributes.effect_image))try{const e=await this._colorManager.extractColors(t.attributes.effect_image);this._state.backgroundColor=e.backgroundColor,this._state.textColor=e.textColor,this._state.accentColor=e.accentColor}catch(t){log.error("StateManager: Error extracting colors",t)}const o=!this._isDraggingBrightness&&this._state.brightness!==r;if((this._state.currentEffect!==e||this._state.isOn!==s||o)&&(this._state.currentEffect=e,this._state.isOn=s,o&&(this._state.brightness=r)),this._config.layout_entity){const t=this._hass.states[this._config.layout_entity];if(t){const e=t.state,s=t.attributes.options||[];this._state.currentLayout===e&&this._arraysEqual(this._state.availableLayouts,s)||(this._state.currentLayout=e,this._state.availableLayouts=[...s])}}if(this._config.preset_entity){const t=this._hass.states[this._config.preset_entity];if(t){const e=t.state,s=t.attributes.options||[];this._state.currentPreset===e&&this._arraysEqual(this._state.availablePresets,s)||(this._state.currentPreset=e,this._state.availablePresets=[...s])}}(this._state.showLayoutSelect!==(!1!==this._config.show_layout_select)||this._state.showPresetSelect!==(!1!==this._config.show_preset_select)||this._state.showEffectControls!==(!1!==this._config.show_effect_controls))&&(this._state.showLayoutSelect=!1!==this._config.show_layout_select,this._state.showPresetSelect=!1!==this._config.show_preset_select,this._state.showEffectControls=!1!==this._config.show_effect_controls)}}}toggleDropdown(){this._state.isDropdownOpen=!this._state.isDropdownOpen,this._state.isDropdownOpen&&(this._state.isLayoutDropdownOpen=!1,this._state.isPresetDropdownOpen=!1)}toggleLayoutDropdown(){this._state.isLayoutDropdownOpen=!this._state.isLayoutDropdownOpen,this._state.isLayoutDropdownOpen&&(this._state.isDropdownOpen=!1,this._state.isPresetDropdownOpen=!1)}togglePresetDropdown(){this._state.isPresetDropdownOpen=!this._state.isPresetDropdownOpen,this._state.isPresetDropdownOpen&&(this._state.isDropdownOpen=!1,this._state.isLayoutDropdownOpen=!1)}toggleAttributes(){this._state.isAttributesExpanded=!this._state.isAttributesExpanded}async toggleLight(){this._state.isOn=!this._state.isOn,this._hass&&this._config&&await this._hass.callService("light",this._state.isOn?"turn_on":"turn_off",{entity_id:this._config.entity})}startBrightnessDrag(){this._isDraggingBrightness=!0}endBrightnessDrag(){this._isDraggingBrightness=!1}setBrightness(t){const e=Math.min(100,Math.max(1,Math.round(t)));this._state.brightness=e,this._brightnessDebounceTimer&&window.clearTimeout(this._brightnessDebounceTimer),this._brightnessDebounceTimer=window.setTimeout((()=>{if(this._hass&&this._config){const t=convertCardBrightnessToHA(e);this._hass.callService("light","turn_on",{entity_id:this._config.entity,brightness:t})}}),10)}async setCurrentEffect(t){this._state.currentEffect=t,this._hass&&this._config&&await this._hass.callService("light","turn_on",{entity_id:this._config.entity,effect:t}),this._state.isDropdownOpen=!1}async setCurrentLayout(t){this._config.layout_entity&&this._hass&&(await this._hass.callService("select","select_option",{entity_id:this._config.layout_entity,option:t}),this._state.isLayoutDropdownOpen=!1)}async setCurrentPreset(t){this._config.preset_entity&&this._hass&&(await this._hass.callService("select","select_option",{entity_id:this._config.preset_entity,option:t}),this._state.isPresetDropdownOpen=!1)}async nextEffect(){this._config.next_effect_entity&&this._hass&&(await this._hass.callService("button","press",{entity_id:this._config.next_effect_entity}),setTimeout((()=>this.updateState()),300))}async previousEffect(){this._config.previous_effect_entity&&this._hass&&(await this._hass.callService("button","press",{entity_id:this._config.previous_effect_entity}),setTimeout((()=>this.updateState()),300))}async randomEffect(){this._config.random_effect_entity&&this._hass&&(await this._hass.callService("button","press",{entity_id:this._config.random_effect_entity}),setTimeout((()=>this.updateState()),300))}cleanup(){this._brightnessDebounceTimer&&(window.clearTimeout(this._brightnessDebounceTimer),this._brightnessDebounceTimer=void 0)}_arraysEqual(t,e){if(t.length!==e.length)return!1;for(let s=0;s<t.length;s++)if(t[s]!==e[s])return!1;return!0}}!function(t){t.language="language",t.system="system",t.comma_decimal="comma_decimal",t.decimal_comma="decimal_comma",t.space_comma="space_comma",t.none="none"}(t||(t={})),function(t){t.language="language",t.system="system",t.am_pm="12",t.twenty_four="24"}(r||(r={}));var ne=function(t,e,s,r){r=r||{},s=null==s?{}:s;var o=new Event(e,{bubbles:void 0===r.bubbles||r.bubbles,cancelable:Boolean(r.cancelable),composed:void 0===r.composed||r.composed});return o.detail=s,t.dispatchEvent(o),o},__defProp$1=Object.defineProperty,__decorateClass$1=(t,e,s,r)=>{for(var o,i=void 0,n=t.length-1;n>=0;n--)(o=t[n])&&(i=o(e,s,i)||i);return i&&__defProp$1(e,s,i),i};const _HyperLightCardEditor=class extends h{constructor(){super(...arguments),this._config={entity:"",show_effect_info:!0,show_effect_parameters:!0,show_brightness_control:!0,background_opacity:.7,allowed_effects:[],show_layout_select:!0,show_preset_select:!0,show_effect_controls:!0},this._effects=[],this._isDropdownOpen=!1}setConfig(t){this._config={...this._config,...t,allowed_effects:t.allowed_effects||[]},this._fetchEffectList()}_toggleDropdown(){this._isDropdownOpen=!this._isDropdownOpen}_effectCheckboxChanged(t){const e=t.target,s=e.value,r=e.checked;let o=[...this._config.allowed_effects||[]];r&&!o.includes(s)?o.push(s):r||(o=o.filter((t=>t!==s))),o.sort(((t,e)=>t.localeCompare(e))),this._config={...this._config,allowed_effects:o.length>0?o:void 0},ne(this,"config-changed",{config:this._config})}firstUpdated(){this.hass&&this._fetchEffectList()}async _fetchEffectList(){var t,e;if(!this.hass||!(null==(t=this._config)?void 0:t.entity))return;const s=this.hass.states[this._config.entity];(null==(e=null==s?void 0:s.attributes)?void 0:e.effect_list)&&(this._effects=s.attributes.effect_list)}render(){var t,e;return this.hass&&this._config?ke`
      <div class="card-config">
        <h3>Main Light Entity</h3>
        <ha-entity-picker
          .label="${this.hass.localize("ui.panel.lovelace.editor.card.generic.entity")} (${this.hass.localize("ui.panel.lovelace.editor.card.config.required")})"
          .hass=${this.hass}
          .value=${this._config.entity}
          .configValue=${"entity"}
          .includeDomains=${["light"]}
          @change=${this._valueChanged}
          allow-custom-entity
        ></ha-entity-picker>

        <ha-textfield
          label="Name (optional)"
          .value=${this._config.name||""}
          .configValue=${"name"}
          @input=${this._valueChanged}
        ></ha-textfield>

        <ha-icon-picker
          label="Icon (optional)"
          .value=${this._config.icon||""}
          .configValue=${"icon"}
          @value-changed=${this._valueChanged}
        ></ha-icon-picker>

        <h3>Additional Control Entities</h3>
        <ha-entity-picker
          label="Layout Entity (optional)"
          .hass=${this.hass}
          .value=${this._config.layout_entity||""}
          .configValue=${"layout_entity"}
          .includeDomains=${["select"]}
          @change=${this._valueChanged}
          allow-custom-entity
        ></ha-entity-picker>

        <ha-entity-picker
          label="Preset Entity (optional)"
          .hass=${this.hass}
          .value=${this._config.preset_entity||""}
          .configValue=${"preset_entity"}
          .includeDomains=${["select"]}
          @change=${this._valueChanged}
          allow-custom-entity
        ></ha-entity-picker>

        <ha-entity-picker
          label="Next Effect Button (optional)"
          .hass=${this.hass}
          .value=${this._config.next_effect_entity||""}
          .configValue=${"next_effect_entity"}
          .includeDomains=${["button"]}
          @change=${this._valueChanged}
          allow-custom-entity
        ></ha-entity-picker>

        <ha-entity-picker
          label="Previous Effect Button (optional)"
          .hass=${this.hass}
          .value=${this._config.previous_effect_entity||""}
          .configValue=${"previous_effect_entity"}
          .includeDomains=${["button"]}
          @change=${this._valueChanged}
          allow-custom-entity
        ></ha-entity-picker>

        <ha-entity-picker
          label="Random Effect Button (optional)"
          .hass=${this.hass}
          .value=${this._config.random_effect_entity||""}
          .configValue=${"random_effect_entity"}
          .includeDomains=${["button"]}
          @change=${this._valueChanged}
          allow-custom-entity
        ></ha-entity-picker>

        <h3>Display Options</h3>
        <div class="switch-container">
          <ha-switch
            .checked=${!1!==this._config.show_effect_info}
            .configValue=${"show_effect_info"}
            @change=${this._valueChanged}
          ></ha-switch>
          <span>Show Effect Info</span>
        </div>

        <div class="switch-container">
          <ha-switch
            .checked=${!1!==this._config.show_effect_parameters}
            .configValue=${"show_effect_parameters"}
            @change=${this._valueChanged}
          ></ha-switch>
          <span>Show Effect Parameters</span>
        </div>

        <div class="switch-container">
          <ha-switch
            .checked=${!1!==this._config.show_brightness_control}
            .configValue=${"show_brightness_control"}
            @change=${this._valueChanged}
          ></ha-switch>
          <span>Show Brightness Control</span>
        </div>

        <div class="switch-container">
          <ha-switch
            .checked=${!1!==this._config.show_layout_select}
            .configValue=${"show_layout_select"}
            @change=${this._valueChanged}
          ></ha-switch>
          <span>Show Layout Select</span>
        </div>

        <div class="switch-container">
          <ha-switch
            .checked=${!1!==this._config.show_preset_select}
            .configValue=${"show_preset_select"}
            @change=${this._valueChanged}
          ></ha-switch>
          <span>Show Preset Select</span>
        </div>

        <div class="switch-container">
          <ha-switch
            .checked=${!1!==this._config.show_effect_controls}
            .configValue=${"show_effect_controls"}
            @change=${this._valueChanged}
          ></ha-switch>
          <span>Show Effect Navigation Controls</span>
        </div>

        <ha-textfield
          label="Background Opacity"
          type="number"
          min="0"
          max="1"
          step="0.1"
          .value=${(null==(t=this._config.background_opacity)?void 0:t.toString())||"0.7"}
          .configValue=${"background_opacity"}
          @input=${this._valueChanged}
        ></ha-textfield>

        <div class="allowed-effects">
          <label>Allowed Effects</label>
          <div class="dropdown">
            <div class="dropdown-header" @click=${this._toggleDropdown}>
              ${(null==(e=this._config.allowed_effects)?void 0:e.length)?[...this._config.allowed_effects].sort(((t,e)=>t.localeCompare(e))).join(", "):"Select effects"}
            </div>
            <div class="dropdown-content ${this._isDropdownOpen?"open":""}">
              ${[...this._effects].sort(((t,e)=>t.localeCompare(e))).map((t=>ke`
                    <label class="dropdown-item">
                      <input
                        type="checkbox"
                        .checked=${(this._config.allowed_effects||[]).includes(t)}
                        .value=${t}
                        @change=${this._effectCheckboxChanged}
                      />
                      ${t}
                    </label>
                  `))}
            </div>
          </div>
        </div>
      </div>
    `:ke``}_valueChanged(t){if(!this._config||!this.hass)return;const e=t.target;e.configValue&&(""===e.value&&"name"!==e.configValue?delete this._config[e.configValue]:this._config={...this._config,[e.configValue]:void 0!==e.checked?e.checked:e.value}),ne(this,"config-changed",{config:this._config})}};_HyperLightCardEditor.styles=i$3`
    .card-config {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .switch-container {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .allowed-effects {
      position: relative;
    }
    .dropdown {
      position: relative;
      z-index: 99;
    }
    .dropdown-header {
      padding: 8px;
      border: 1px solid var(--primary-text-color);
      border-radius: 4px;
      cursor: pointer;
    }
    .dropdown-content {
      display: none;
      position: absolute;
      background-color: var(--card-background-color);
      min-width: 160px;
      box-shadow: 0px 8px 16px 0px rgba(0, 0, 0, 0.2);
      z-index: 100;
      max-height: 200px;
      overflow-y: auto;
    }
    .dropdown-content.open {
      display: block;
    }
    .dropdown-item {
      padding: 8px;
      display: flex;
      align-items: center;
      cursor: pointer;
    }
    .dropdown-item:hover {
      background-color: var(--secondary-background-color);
    }
    .dropdown-item input {
      margin-right: 8px;
    }
    h3 {
      margin: 8px 0 4px;
      font-size: 18px;
      color: var(--primary-text-color);
      font-weight: 500;
    }
  `;let HyperLightCardEditor=_HyperLightCardEditor;__decorateClass$1([n$1({attribute:!1})],HyperLightCardEditor.prototype,"hass"),__decorateClass$1([n$1()],HyperLightCardEditor.prototype,"_config"),__decorateClass$1([n$1()],HyperLightCardEditor.prototype,"_helpers"),__decorateClass$1([r$2()],HyperLightCardEditor.prototype,"_effects"),__decorateClass$1([r$2()],HyperLightCardEditor.prototype,"_isDropdownOpen");var __defProp=Object.defineProperty,__decorateClass=(t,e,s,r)=>{for(var o,i=void 0,n=t.length-1;n>=0;n--)(o=t[n])&&(i=o(e,s,i)||i);return i&&__defProp(e,s,i),i};customElements.get("hyper-light-card-editor")||customElements.define("hyper-light-card-editor",HyperLightCardEditor);class HyperLightCard extends h{constructor(){super(),this._hasScrolledToEffect=!1,this._hasScrolledToLayout=!1,this._hasScrolledToPreset=!1,this._autoDiscovered=!1,this._memoizedEffectList=memoize((t=>t.map((t=>ke`
        <div
          class="dropdown-item ${t===this.state.currentEffect?"selected":""}"
          @click=${()=>this._selectEffect(t)}
          role="menuitem"
          tabindex="0"
        >
          ${t}
        </div>
      `)))),this.state=new State(this),this.stateManager=new StateManager(this.config,this.state),this._clickOutsideHandler=this._handleClickOutside.bind(this)}autoDiscoverEntities(){if(!this.hass||!this.config||this._autoDiscovered)return;const t=this.config.entity;if(!t||!t.startsWith("light.signalrgb_"))return;const e=Object.keys(this.hass.states),s=t.match(/^light\.signalrgb_(.+)$/),r=s?s[1]:"";if(!r)return;const o={layout:e.find((t=>t===`select.signalrgb_layout_${r}`)),preset:e.find((t=>t===`select.signalrgb_preset_${r}`)),nextEffect:e.find((t=>t===`button.signalrgb_next_effect_${r}`)),prevEffect:e.find((t=>t===`button.signalrgb_previous_effect_${r}`)),randomEffect:e.find((t=>t===`button.signalrgb_random_effect_${r}`))},i={layout:o.layout?null:e.find((t=>t.startsWith("select.signalrgb_layout_")&&t.includes(r))),preset:o.preset?null:e.find((t=>t.startsWith("select.signalrgb_preset_")&&t.includes(r))),nextEffect:o.nextEffect?null:e.find((t=>t.startsWith("button.signalrgb_next_effect_")&&t.includes(r))),prevEffect:o.prevEffect?null:e.find((t=>t.startsWith("button.signalrgb_previous_effect_")&&t.includes(r))),randomEffect:o.randomEffect?null:e.find((t=>t.startsWith("button.signalrgb_random_effect_")&&t.includes(r)))},n={layout:o.layout||i.layout,preset:o.preset||i.preset,nextEffect:o.nextEffect||i.nextEffect,prevEffect:o.prevEffect||i.prevEffect,randomEffect:o.randomEffect||i.randomEffect};n.layout||n.preset||n.nextEffect||n.prevEffect||n.randomEffect||(n.layout=e.find((t=>t.startsWith("select.signalrgb_layout_"))),n.preset=e.find((t=>t.startsWith("select.signalrgb_preset_"))),n.nextEffect=e.find((t=>t.startsWith("button.signalrgb_next_effect_"))),n.prevEffect=e.find((t=>t.startsWith("button.signalrgb_previous_effect_"))),n.randomEffect=e.find((t=>t.startsWith("button.signalrgb_random_effect_"))));let a=!1;!this.config.layout_entity&&n.layout&&(this.config.layout_entity=n.layout,a=!0),!this.config.preset_entity&&n.preset&&(this.config.preset_entity=n.preset,a=!0),!this.config.next_effect_entity&&n.nextEffect&&(this.config.next_effect_entity=n.nextEffect,a=!0),!this.config.previous_effect_entity&&n.prevEffect&&(this.config.previous_effect_entity=n.prevEffect,a=!0),!this.config.random_effect_entity&&n.randomEffect&&(this.config.random_effect_entity=n.randomEffect,a=!0),a&&(this.stateManager=new StateManager(this.config,this.state),this.stateManager.hass=this.hass,this.stateManager.updateState(),this.requestUpdate()),this._autoDiscovered=!0}static get styles(){return i$3`
      ${r$5(styleText)}
    `}setConfig(t){if(!t.entity)throw new Error("You need to define an entity");this._autoDiscovered=!1,this.config={name:t.name,icon:t.icon||"https://brands.home-assistant.io/_/signalrgb/icon.png",background_opacity:t.background_opacity||.7,show_effect_info:!1!==t.show_effect_info,show_effect_parameters:!1!==t.show_effect_parameters,show_brightness_control:t.show_brightness_control??!0,show_layout_select:!1!==t.show_layout_select,show_preset_select:!1!==t.show_preset_select,show_effect_controls:!1!==t.show_effect_controls,allowed_effects:t.allowed_effects,layout_entity:t.layout_entity,preset_entity:t.preset_entity,next_effect_entity:t.next_effect_entity,previous_effect_entity:t.previous_effect_entity,random_effect_entity:t.random_effect_entity,...t},this.stateManager=new StateManager(this.config,this.state)}getCardSize(){return 4}firstUpdated(){this.hass&&this.config&&(this.stateManager.hass=this.hass),this.stateManager.updateState(),this.autoDiscoverEntities()}updated(t){super.updated(t),t.has("hass")&&this.hass&&this.config&&(this.stateManager.hass=this.hass,this._autoDiscovered||this.autoDiscoverEntities()),this.state.isDropdownOpen&&!this._hasScrolledToEffect?(this._hasScrolledToEffect=!0,this._scrollToCurrentEffect()):this.state.isDropdownOpen||(this._hasScrolledToEffect=!1),this.state.isLayoutDropdownOpen&&!this._hasScrolledToLayout?(this._hasScrolledToLayout=!0,this._scrollToCurrentLayout()):this.state.isLayoutDropdownOpen||(this._hasScrolledToLayout=!1),this.state.isPresetDropdownOpen&&!this._hasScrolledToPreset?(this._hasScrolledToPreset=!0,this._scrollToCurrentPreset()):this.state.isPresetDropdownOpen||(this._hasScrolledToPreset=!1)}render(){if(!this.hass||!this.config||!this.hass.states)return ke``;const t=this.hass.states[this.config.entity];if(!t)return ke`
        <ha-card>
          <div class="card">Entity not found: ${this.config.entity}</div>
        </ha-card>
      `;const e={"--slider-color":this.state.accentColor};return ke`
      <ha-card>
        <div
          class="card"
          style="
            --background-color: ${this.state.backgroundColor};
            --text-color: ${this.state.textColor};
            --accent-color: ${this.state.accentColor};
          "
        >
          ${this._renderBackground(t)} ${this._renderHeader(t)}
          <div class="effect-row">
            ${this._renderEffectDropdown(t)}
            ${this.state.showEffectControls?this._renderEffectControls():""}
          </div>
          ${this.state.showEffectInfo?this._renderEffectInfo(t):""}
          <div class="controls-row">
            ${this.state.showBrightnessControl?this._renderBrightnessSlider(e):""}
            ${this.state.showEffectParameters?this._renderAttributesToggle():""}
          </div>
          ${this.state.showEffectParameters?this._renderAttributes(t):""}
        </div>
      </ha-card>
    `}_renderBackground(t){const e=t.attributes.effect_image?`url(${t.attributes.effect_image})`:"none";return ke`
      <div
        class="card-background"
        style="background-image: ${e}; opacity: ${this.config.background_opacity};"
        aria-hidden="true"
      ></div>
    `}_renderHeader(t){const e=this.config.name||t.attributes.friendly_name||t.entity_id;return ke`
      <div class="header" aria-label="${e}">
        <div class="light-icon ${this.state.isOn?"light-on":""}">
          ${this.config.icon&&this.config.icon.startsWith("mdi:")?ke`<ha-icon icon="${this.config.icon}" aria-hidden="true"></ha-icon>`:ke`<img src="${this.config.icon}" alt="${e}" />`}
        </div>
        <div class="light-name" title="${e}">${e}</div>
        <ha-switch
          .checked=${this.state.isOn}
          @change=${this._toggleLight}
          aria-label="Toggle light"
        ></ha-switch>
      </div>
    `}_renderEffectDropdown(t){let e=Array.isArray(t.attributes.effect_list)?t.attributes.effect_list:[];return this.state.allowedEffects&&(e=e.filter((t=>this.state.allowedEffects.includes(t)))),ke`
      <div class="effect-select-wrapper">
        <div class="dropdown ${this.state.isDropdownOpen?"open":""}">
          <div
            class="dropdown-header"
            @click=${this._toggleDropdown}
            aria-label="Current effect: ${this.state.currentEffect}"
            role="button"
          >
            ${this.state.currentEffect}
          </div>
          <div class="dropdown-content" role="menu">${this._memoizedEffectList(e)}</div>
        </div>
      </div>
    `}_renderEffectControls(){var t,e,s,r,o,i;if(!this.state.showEffectControls)return ke``;const n=Boolean((null==(t=this.config)?void 0:t.next_effect_entity)&&(null==(e=this.hass)?void 0:e.states[this.config.next_effect_entity])),a=Boolean((null==(s=this.config)?void 0:s.previous_effect_entity)&&(null==(r=this.hass)?void 0:r.states[this.config.previous_effect_entity])),c=Boolean((null==(o=this.config)?void 0:o.random_effect_entity)&&(null==(i=this.hass)?void 0:i.states[this.config.random_effect_entity]));return n||a||c?ke`
      <div class="effect-controls fade-in">
        ${a?ke`
              <button
                class="effect-button"
                @click=${this._previousEffect}
                aria-label="Previous effect"
              >
                <ha-icon icon="mdi:chevron-left"></ha-icon>
              </button>
            `:""}
        ${c?ke`
              <button
                class="effect-button random"
                @click=${this._randomEffect}
                aria-label="Random effect"
              >
                <ha-icon icon="mdi:shuffle-variant"></ha-icon>
              </button>
            `:""}
        ${n?ke`
              <button class="effect-button" @click=${this._nextEffect} aria-label="Next effect">
                <ha-icon icon="mdi:chevron-right"></ha-icon>
              </button>
            `:""}
      </div>
    `:ke``}_renderEffectInfo(t){if(!this.state.showEffectInfo)return ke``;const e=t.attributes.effect_description||"No effect description available",s=t.attributes.effect_publisher||"Unknown publisher",r=t.attributes.effect_uses_audio||!1,o=t.attributes.effect_uses_input||!1,i=t.attributes.effect_uses_video||!1;return ke`
      <div class="effect-info ${this.state.isOn?"visible":""}">
        <div class="effect-info-text">
          <div class="effect-description">${e}</div>
          <div class="effect-publisher">Published by: ${s}</div>
        </div>
        <div class="effect-features" aria-label="Effect features">
          ${r?ke`<ha-icon
                icon="mdi:volume-high"
                title="Uses Audio"
                aria-label="Uses Audio"
              ></ha-icon>`:""}
          ${o?ke`<ha-icon
                icon="mdi:gamepad-variant"
                title="Uses Input"
                aria-label="Uses Input"
              ></ha-icon>`:""}
          ${i?ke`<ha-icon icon="mdi:video" title="Uses Video" aria-label="Uses Video"></ha-icon>`:""}
        </div>
      </div>
    `}_renderBrightnessSlider(t){const e={...t,"--slider-percentage":`${this.state.brightness}%`,"--slider-color":this.state.accentColor};return ke`
      <div
        class="brightness-slider"
        style=${se(e)}
        role="slider"
        aria-valuemin="1"
        aria-valuemax="100"
        aria-valuenow="${this.state.brightness}"
      >
        <ha-icon icon="mdi:brightness-6" aria-hidden="true"></ha-icon>
        <input
          type="range"
          min="1"
          max="100"
          .value=${this.state.brightness.toString()}
          @change=${this._handleBrightnessChange}
          @input=${this._handleBrightnessInput}
          @mousedown=${this._handleBrightnessStart}
          @touchstart=${this._handleBrightnessStart}
          @mouseup=${this._handleBrightnessEnd}
          @touchend=${this._handleBrightnessEnd}
          aria-label="Adjust brightness"
        />
      </div>
    `}_renderAttributesToggle(){return ke`
      <div
        class="attributes-toggle"
        @click=${this._toggleAttributes}
        role="button"
        aria-expanded="${this.state.isAttributesExpanded}"
        aria-label="Toggle effect parameters"
      >
        <ha-icon icon="mdi:chevron-down"></ha-icon>
      </div>
    `}_renderAttributes(t){if(!this.state.showEffectParameters)return ke``;const e=t.attributes.effect_parameters;return e&&0!==Object.keys(e).length?ke`
      <div
        class="attributes ${this.state.isAttributesExpanded?"expanded":""}"
        aria-hidden="${!this.state.isAttributesExpanded}"
      >
        <div class="attributes-content">
          <!-- Layout and Preset Selectors inside expanded attributes -->
          <div class="attributes-selectors">
            ${this._renderLayoutSelect(!0)} ${this._renderPresetSelect(!0)}
          </div>

          <!-- Effect Parameters -->
          ${this._renderAttributesList(e)}
        </div>
      </div>
    `:ke``}_renderAttributesList(t){return t&&0!==Object.keys(t).length?ke`
      <ul class="attribute-list">
        ${Object.entries(t).map((([t,e])=>{let s,r;return"string"==typeof e?(s=formatAttributeKey(t),r=e):(s=e.label,r=formatAttributeValue(e.value,e.type)),ke`
            <li class="attribute-item">
              <span class="attribute-key">${s}:</span>
              <span class="attribute-value">${r}</span>
            </li>
          `}))}
      </ul>
    `:ke`<p>No effect parameters available.</p>`}_renderLayoutSelect(t=!1){var e,s;if(!(null==(e=this.config)?void 0:e.layout_entity)||!this.state.showLayoutSelect||!(null==(s=this.hass)?void 0:s.states[this.config.layout_entity]))return ke``;const r=this.hass.states[this.config.layout_entity],o=r.state||"",i=r.attributes.options||[];this.state.currentLayout!==o&&(this.state.currentLayout=o);const n=i.length>0;return this.state.availableLayouts=i,ke`
      <div class="layout-select-wrapper select-wrapper ${t?"compact":""}">
        <div class="select-section-title">
          <ha-icon icon="mdi:view-grid-outline"></ha-icon> Layout
        </div>
        <div
          class="dropdown ${this.state.isLayoutDropdownOpen?"open":""} ${n?"":"disabled"}"
          title="${n?"":"No layouts available for this effect"}"
        >
          <div
            class="dropdown-header"
            @click=${n?this._toggleLayoutDropdown:void 0}
            aria-label="Current layout: ${o}"
            role="button"
            aria-disabled="${!n}"
          >
            ${n?o:"No layouts available"}
          </div>
          <div class="dropdown-content" role="menu">
            ${n?i.map((t=>ke`
                    <div
                      class="dropdown-item ${t===o?"selected":""}"
                      @click=${()=>this._selectLayout(t)}
                      role="menuitem"
                      tabindex="0"
                    >
                      ${t}
                    </div>
                  `)):ke`<div class="dropdown-item disabled">No layouts available</div>`}
          </div>
        </div>
      </div>
    `}_renderPresetSelect(t=!1){var e,s;if(!(null==(e=this.config)?void 0:e.preset_entity)||!this.state.showPresetSelect||!(null==(s=this.hass)?void 0:s.states[this.config.preset_entity]))return ke``;const r=this.hass.states[this.config.preset_entity],o=r.state||"",i=r.attributes.options||[];this.state.currentPreset!==o&&(this.state.currentPreset=o);const n=i.length>0;return this.state.availablePresets=i,ke`
      <div class="preset-select-wrapper select-wrapper ${t?"compact":""}">
        <div class="select-section-title"><ha-icon icon="mdi:palette"></ha-icon> Preset</div>
        <div
          class="dropdown ${this.state.isPresetDropdownOpen?"open":""} ${n?"":"disabled"}"
          title="${n?"":"No presets available for this effect"}"
        >
          <div
            class="dropdown-header"
            @click=${n?this._togglePresetDropdown:void 0}
            aria-label="Current preset: ${o}"
            role="button"
            aria-disabled="${!n}"
          >
            ${n?o:"No presets available"}
          </div>
          <div class="dropdown-content" role="menu">
            ${n?i.map((t=>ke`
                    <div
                      class="dropdown-item ${t===o?"selected":""}"
                      @click=${()=>this._selectPreset(t)}
                      role="menuitem"
                      tabindex="0"
                    >
                      ${t}
                    </div>
                  `)):ke`<div class="dropdown-item disabled">No presets available</div>`}
          </div>
        </div>
      </div>
    `}async _toggleLight(){await this.stateManager.toggleLight();const t=this.shadowRoot.querySelector(".effect-info");t&&(this.state.isOn?setTimeout((()=>{t.classList.add("visible")}),50):t.classList.remove("visible"))}_getCurrentEffectIndex(){var t,e;const s=null==(e=this.hass)?void 0:e.states[(null==(t=this.config)?void 0:t.entity)??""];return(Array.isArray(null==s?void 0:s.attributes.effect_list)?null==s?void 0:s.attributes.effect_list:[]).indexOf(this.state.currentEffect)}_scrollToCurrentEffect(){requestAnimationFrame((()=>{var t,e;const s=null==(t=this.shadowRoot)?void 0:t.querySelector(".effect-select-wrapper .dropdown-content"),r=null==(e=this.shadowRoot)?void 0:e.querySelector(".effect-select-wrapper .dropdown-item.selected");s&&r&&(s.scrollTop=r.offsetTop-s.offsetTop)}))}_scrollToCurrentLayout(){requestAnimationFrame((()=>{var t,e;const s=null==(t=this.shadowRoot)?void 0:t.querySelector(".layout-select-wrapper .dropdown-content"),r=null==(e=this.shadowRoot)?void 0:e.querySelector(".layout-select-wrapper .dropdown-item.selected");s&&r&&(s.scrollTop=r.offsetTop-s.offsetTop)}))}_scrollToCurrentPreset(){requestAnimationFrame((()=>{var t,e;const s=null==(t=this.shadowRoot)?void 0:t.querySelector(".preset-select-wrapper .dropdown-content"),r=null==(e=this.shadowRoot)?void 0:e.querySelector(".preset-select-wrapper .dropdown-item.selected");s&&r&&(s.scrollTop=r.offsetTop-s.offsetTop)}))}_toggleDropdown(t){t.stopPropagation(),this.stateManager.toggleDropdown()}_toggleLayoutDropdown(t){t.stopPropagation(),this.stateManager.toggleLayoutDropdown()}_togglePresetDropdown(t){t.stopPropagation(),this.stateManager.togglePresetDropdown()}async _selectEffect(t){await this.stateManager.setCurrentEffect(t),this._refreshCardAfterEffectChange()}async _selectLayout(t){await this.stateManager.setCurrentLayout(t),this._refreshCardAfterEffectChange()}async _selectPreset(t){await this.stateManager.setCurrentPreset(t),this._refreshCardAfterEffectChange()}async _nextEffect(){await this.stateManager.nextEffect(),this._refreshCardAfterEffectChange()}async _previousEffect(){await this.stateManager.previousEffect(),this._refreshCardAfterEffectChange()}async _randomEffect(){await this.stateManager.randomEffect(),this._refreshCardAfterEffectChange()}_refreshCardAfterEffectChange(){setTimeout((()=>{if(this.requestUpdate(),this.state.isOn){const t=this.shadowRoot.querySelector(".effect-info");t&&t.classList.add("visible")}}),350)}_toggleAttributes(){this.stateManager.toggleAttributes(),this.requestUpdate()}_handleClickOutside(t){const e=t.composedPath(),s=this.shadowRoot.querySelector(".effect-select-wrapper .dropdown"),r=this.shadowRoot.querySelector(".layout-select-wrapper .dropdown"),o=this.shadowRoot.querySelector(".preset-select-wrapper .dropdown");this.state.isDropdownOpen&&s&&!e.includes(s)&&(this.stateManager.toggleDropdown(),this.requestUpdate()),this.state.isLayoutDropdownOpen&&r&&!e.includes(r)&&(this.stateManager.toggleLayoutDropdown(),this.requestUpdate()),this.state.isPresetDropdownOpen&&o&&!e.includes(o)&&(this.stateManager.togglePresetDropdown(),this.requestUpdate())}_handleBrightnessStart(){this.stateManager.startBrightnessDrag()}_handleBrightnessEnd(){this.stateManager.endBrightnessDrag()}async _handleBrightnessInput(t){const e=t.target,s=Number(e.value);await this.stateManager.setBrightness(s)}async _handleBrightnessChange(t){const e=t.target,s=Number(e.value);await this.stateManager.setBrightness(s),this.stateManager.endBrightnessDrag()}connectedCallback(){super.connectedCallback(),document.addEventListener("click",this._clickOutsideHandler)}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener("click",this._clickOutsideHandler),this.stateManager.cleanup()}static getConfigElement(){return document.createElement("hyper-light-card-editor")}static getStubConfig(t,e){const s=e.filter((t=>t.match(/^light\.signalrgb_/))),r=e.filter((t=>t.match(/^select\.signalrgb_layout_/))),o=e.filter((t=>t.match(/^select\.signalrgb_preset_/))),i=e.filter((t=>t.match(/^button\.signalrgb_next_effect_/))),n=e.filter((t=>t.match(/^button\.signalrgb_previous_effect_/))),a=e.filter((t=>t.match(/^button\.signalrgb_random_effect_/)));return{entity:s.length>0?s[0]:"",name:"",show_effect_info:!0,show_effect_parameters:!0,show_brightness_control:!0,show_layout_select:!0,show_preset_select:!0,show_effect_controls:!0,background_opacity:.7,allowed_effects:[],layout_entity:r.length>0?r[0]:"",preset_entity:o.length>0?o[0]:"",next_effect_entity:i.length>0?i[0]:"",previous_effect_entity:n.length>0?n[0]:"",random_effect_entity:a.length>0?a[0]:""}}}__decorateClass([n$1({type:Object})],HyperLightCard.prototype,"hass"),__decorateClass([n$1({type:Object})],HyperLightCard.prototype,"config"),__decorateClass([r$2()],HyperLightCard.prototype,"state"),customElements.define("hyper-light-card",HyperLightCard),window.customCards=window.customCards||[],window.customCards.push({type:"hyper-light-card",name:"Hyper Light Card",description:"A custom card for controlling SignalRGB.",preview:!0,documentationURL:"https://github.com/hyperb1iss/hyper-light-card"});const version="1.0.0";console.log("%c 🛸🔮 hyper-light-card v1.0.0 launched! 🔮🛸 ","background: linear-gradient(90deg, #00ffff, #ff00ff, #00ffff); color: #000; font-weight: bold; padding: 6px 12px; border-radius: 8px; text-shadow: 0 0 5px #00ffff, 0 0 10px #ff00ff, 0 0 20px #00ffff;");export{HyperLightCard};