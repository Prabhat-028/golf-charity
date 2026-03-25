import{i as l}from"./index-DnngfVpx.js";/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const d=l("Download",[["path",{d:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",key:"ih7n3h"}],["polyline",{points:"7 10 12 15 17 10",key:"2ggqvy"}],["line",{x1:"12",x2:"12",y1:"15",y2:"3",key:"1vk2je"}]]);function r(e){if(e==null)return"";const n=String(e);return/[",\n]/.test(n)?`"${n.replace(/"/g,'""')}"`:n}function u(e){if(!(e!=null&&e.length))return"";const n=Object.keys(e[0]),o=[n.join(",")];for(const i of e)o.push(n.map(c=>r(i[c])).join(","));return o.join(`
`)}function s(e,n){if(!(n!=null&&n.length))return!1;const o=u(n),i=new Blob([o],{type:"text/csv;charset=utf-8;"}),c=URL.createObjectURL(i),t=document.createElement("a");return t.href=c,t.setAttribute("download",e),document.body.appendChild(t),t.click(),document.body.removeChild(t),URL.revokeObjectURL(c),!0}export{d as D,s as d};
