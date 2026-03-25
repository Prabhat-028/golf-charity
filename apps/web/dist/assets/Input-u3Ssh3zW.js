import{r as m,j as o}from"./index-DnngfVpx.js";const x=m.forwardRef(function({className:a="",label:r,error:s,helperText:d,id:n,...c},u){const t=n||(r==null?void 0:r.toLowerCase().replace(/\s+/g,"-")),e=s?`${t}-error`:void 0,i=d&&!s?`${t}-helper`:void 0,l=[e,i].filter(Boolean).join(" ")||void 0;return o.jsxs("div",{className:"w-full",children:[r&&o.jsx("label",{htmlFor:t,className:"block text-sm font-medium text-gray-700 mb-1",children:r}),o.jsx("input",{ref:u,id:t,"aria-invalid":!!s,"aria-describedby":l,className:`
          block w-full px-3 py-2 rounded-lg border
          text-gray-900 placeholder-gray-400
          focus:outline-none focus:ring-2 focus:ring-offset-0
          transition-colors duration-150
          ${s?"border-red-300 focus:border-red-500 focus:ring-red-500":"border-gray-300 focus:border-primary-500 focus:ring-primary-500"}
          disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
          ${a}
        `,...c}),s&&o.jsx("p",{id:e,className:"mt-1 text-sm text-red-600",children:s}),d&&!s&&o.jsx("p",{id:i,className:"mt-1 text-sm text-gray-500",children:d})]})});export{x as I};
