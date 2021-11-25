"use strict";(self.webpackChunkopenkruise_io=self.webpackChunkopenkruise_io||[]).push([[9544],{3905:function(e,t,n){n.d(t,{Zo:function(){return u},kt:function(){return h}});var r=n(7294);function o(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function i(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,r)}return n}function a(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?i(Object(n),!0).forEach((function(t){o(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):i(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function l(e,t){if(null==e)return{};var n,r,o=function(e,t){if(null==e)return{};var n,r,o={},i=Object.keys(e);for(r=0;r<i.length;r++)n=i[r],t.indexOf(n)>=0||(o[n]=e[n]);return o}(e,t);if(Object.getOwnPropertySymbols){var i=Object.getOwnPropertySymbols(e);for(r=0;r<i.length;r++)n=i[r],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(o[n]=e[n])}return o}var c=r.createContext({}),s=function(e){var t=r.useContext(c),n=t;return e&&(n="function"==typeof e?e(t):a(a({},t),e)),n},u=function(e){var t=s(e.components);return r.createElement(c.Provider,{value:t},e.children)},p={inlineCode:"code",wrapper:function(e){var t=e.children;return r.createElement(r.Fragment,{},t)}},d=r.forwardRef((function(e,t){var n=e.components,o=e.mdxType,i=e.originalType,c=e.parentName,u=l(e,["components","mdxType","originalType","parentName"]),d=s(n),h=o,m=d["".concat(c,".").concat(h)]||d[h]||p[h]||i;return n?r.createElement(m,a(a({ref:t},u),{},{components:n})):r.createElement(m,a({ref:t},u))}));function h(e,t){var n=arguments,o=t&&t.mdxType;if("string"==typeof e||o){var i=n.length,a=new Array(i);a[0]=d;var l={};for(var c in t)hasOwnProperty.call(t,c)&&(l[c]=t[c]);l.originalType=e,l.mdxType="string"==typeof e?e:o,a[1]=l;for(var s=2;s<i;s++)a[s]=n[s];return r.createElement.apply(null,a)}return r.createElement.apply(null,n)}d.displayName="MDXCreateElement"},589:function(e,t,n){n.r(t),n.d(t,{frontMatter:function(){return l},contentTitle:function(){return c},metadata:function(){return s},assets:function(){return u},toc:function(){return p},default:function(){return h}});var r=n(7462),o=n(3366),i=(n(7294),n(3905)),a=["components"],l={slug:"learning-concurrent-reconciling",title:"Learning Concurrent Reconciling",authors:["Fei-Guo"],tags:["workload","reconcile","controller"]},c=void 0,s={permalink:"/zh/blog/learning-concurrent-reconciling",editUrl:"https://github.com/openkruise/openkruise.io/tree/master/blog/blog/2019-11-10-learning-concurrent-reconciling.md",source:"@site/blog/2019-11-10-learning-concurrent-reconciling.md",title:"Learning Concurrent Reconciling",description:"The concept of controller in Kubernete is one of the most important reasons that make it successful.",date:"2019-11-10T00:00:00.000Z",formattedDate:"2019\u5e7411\u670810\u65e5",tags:[{label:"workload",permalink:"/zh/blog/tags/workload"},{label:"reconcile",permalink:"/zh/blog/tags/reconcile"},{label:"controller",permalink:"/zh/blog/tags/controller"}],readingTime:3.915,truncated:!1,authors:[{name:"Fei Guo",title:"Maintainer of OpenKruise",url:"https://github.com/Fei-Guo",imageURL:"https://github.com/Fei-Guo.png",key:"Fei-Guo"}],prevItem:{title:"UnitedDeploymemt - Supporting Multi-domain Workload Management",permalink:"/zh/blog/uniteddeployment"},nextItem:{title:"Kruise Workload Classification Guidance",permalink:"/zh/blog/workload-classification-guidance"}},u={authorsImageUrls:[void 0]},p=[],d={toc:p};function h(e){var t=e.components,l=(0,o.Z)(e,a);return(0,i.kt)("wrapper",(0,r.Z)({},d,l,{components:t,mdxType:"MDXLayout"}),(0,i.kt)("p",null,"The concept of controller in Kubernete is one of the most important reasons that make it successful.\nController is the core mechanism that supports Kubernetes APIs to ensure the system reaches\nthe desired state. By leveraging CRDs/controllers and operators, it is fairly easy for\nother systems to integrate with Kubernetes. "),(0,i.kt)("p",null,"Controller runtime library and the corresponding controller tool ",(0,i.kt)("a",{parentName:"p",href:"https://book.kubebuilder.io/introduction.html"},"KubeBuilder"),'\nare widely used by many developers to build their customized Kubernetes controllers. In Kruise project,\nwe also use Kubebuilder to generate scaffolding codes that implement the "reconciling" logic.\nIn this blog post, I will share some learnings from\nKruise controller development, particularly, about concurrent reconciling. '),(0,i.kt)("p",null,"Some people may already notice that controller runtime supports concurrent reconciling.\nCheck for the options (",(0,i.kt)("a",{parentName:"p",href:"https://github.com/kubernetes-sigs/controller-runtime/blob/81842d0e78f7111f0566156189806e2801e3adf1/pkg/controller/controller.go#L32"},"source"),")\nused to create new controller:  "),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre"},"type Options struct {\n    // MaxConcurrentReconciles is the maximum number of concurrent Reconciles which can be run. Defaults to 1.\n    MaxConcurrentReconciles int\n\n    // Reconciler reconciles an object\n    Reconciler reconcile.Reconciler\n}\n")),(0,i.kt)("p",null,"Concurrent reconciling is quite useful when the states of the controller's watched objects change so\nfrequently that a large amount of reconcile requests are sent to and queued in the reconcile queue.\nMultiple reconcile loops do help drain the reconcile queue much more quickly compared to the default single\nreconcile loop case. Although this is a great feature for performance, without digging into the code,\nan immediate concern that a developer may raise is that will this introduce consistency issue?\ni.e., is it possible that two reconcile loops handle the same object at the same time?"),(0,i.kt)("p",null,'The answer is NO, as you may expect. The "magic" is enforced by the workqueue\nimplementation in Kubernetes ',(0,i.kt)("inlineCode",{parentName:"p"},"client-go"),", which is used by controller runtime reconcile queue.\nThe workqueue algorithm (",(0,i.kt)("a",{parentName:"p",href:"https://github.com/kubernetes/client-go/blob/a57d0056dbf1d48baaf3cee876c123bea745591f/util/workqueue/queue.go#L65"},"source"),")\nis demonstrated in Figure 1."),(0,i.kt)("p",null,(0,i.kt)("img",{alt:"workqueue",src:n(1420).Z})),(0,i.kt)("p",null,"Basically, the workqueue uses a ",(0,i.kt)("inlineCode",{parentName:"p"},"queue")," and two ",(0,i.kt)("inlineCode",{parentName:"p"},"sets")," to coordinate the process of handling multiple reconciling\nrequests against the same object. Figure 1(a) presents the initial state of handling four reconcile requests,\ntwo of which target the same object A. When a request arrives, the target object is first added to the ",(0,i.kt)("inlineCode",{parentName:"p"},"dirty set"),"\nor dropped if it presents in ",(0,i.kt)("inlineCode",{parentName:"p"},"dirty set"),",  and then pushed to the ",(0,i.kt)("inlineCode",{parentName:"p"},"queue")," only if it is not presented in\n",(0,i.kt)("inlineCode",{parentName:"p"},"processing set"),". Figure 1(b) shows the case of adding three requests consecutively.\nWhen a reconciling loop is ready to serve a request, it gets the target object from the ",(0,i.kt)("inlineCode",{parentName:"p"},"front")," of the queue. The\nobject is also added to the ",(0,i.kt)("inlineCode",{parentName:"p"},"processing set")," and removed from the ",(0,i.kt)("inlineCode",{parentName:"p"},"dirty set")," (Figure 1(c)).\nNow if a request of the processing object arrives, the object is only added to the ",(0,i.kt)("inlineCode",{parentName:"p"},"dirty set"),", not\nto the ",(0,i.kt)("inlineCode",{parentName:"p"},"queue")," (Figure 1(d)). This guarantees that an object is only handled by one reconciling\nloop. When reconciling is done, the object is removed from the ",(0,i.kt)("inlineCode",{parentName:"p"},"processing set"),". If the object is also\nshown in the ",(0,i.kt)("inlineCode",{parentName:"p"},"dirty set"),", it is added back to the ",(0,i.kt)("inlineCode",{parentName:"p"},"back")," of the ",(0,i.kt)("inlineCode",{parentName:"p"},"queue")," (Figure 1(e))."),(0,i.kt)("p",null,"The above algorithm has following implications:"),(0,i.kt)("ul",null,(0,i.kt)("li",{parentName:"ul"},"It avoids concurrent reconciling for the same object."),(0,i.kt)("li",{parentName:"ul"},"The object processing order can be different from arriving order even if there is only one reconciling thread.\nThis usually would not be a problem since the controller still reconciles to the final cluster state. However,\nthe out of order reconciling may cause a significant delay for a request.\n",(0,i.kt)("img",{alt:"workqueue-starve",src:n(7963).Z}),".... For example, as illustrated in\nFigure 2, assuming there is only one reconciling thread and two requests targeting the same object A arrive, one of\nthem will be processed and object A will be added to the ",(0,i.kt)("inlineCode",{parentName:"li"},"dirty set")," (Figure 2(b)).\nIf the reconciling takes a long time and during which a large number of new reconciling requests arrive,\nthe queue will be filled up by the new requests (Figure 2(c)). When reconciling is done, object A will be\nadded to the ",(0,i.kt)("inlineCode",{parentName:"li"},"back")," of the ",(0,i.kt)("inlineCode",{parentName:"li"},"queue")," (Figure 2(d)). It would not be handled until all the requests coming after had been\nhandled, which can cause a noticeable long delay. The workaround is actually simple - ",(0,i.kt)("strong",{parentName:"li"},"USE CONCURRENT RECONCILES"),".\nSince the cost of an idle go routine is fairly small, the overhead of having multiple reconcile threads is\nlow even if the controller is idle. It seems that the ",(0,i.kt)("inlineCode",{parentName:"li"},"MaxConcurrentReconciles")," value should\nbe overwritten to a value larger than the default 1 (CloneSet uses 10 for example)."),(0,i.kt)("li",{parentName:"ul"},"Last but not the least, reconcile requests can be dropped (if the target exists in ",(0,i.kt)("inlineCode",{parentName:"li"},"dirty set"),"). This means\nthat we cannot assume that the controller can track all the object state change events. Recalling a presentation\ngiven by ",(0,i.kt)("a",{parentName:"li",href:"https://speakerdeck.com/thockin/edge-vs-level-triggered-logic"},"Tim Hockin"),", Kubernetes controller\nis level triggered, not edge triggered. It reconciles for state, not for events. ")),(0,i.kt)("p",null,"Thanks for reading the post, hope it helps."))}h.isMDXComponent=!0},7963:function(e,t,n){t.Z=n.p+"assets/images/workqueue-starve-9821348cf485c42d23682a8a14fdbcb1.png"},1420:function(e,t,n){t.Z=n.p+"assets/images/workqueue-e607402bb269a71112baa4c9870fb109.png"}}]);