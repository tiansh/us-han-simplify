// ==UserScript==
// @name Han Simplify
// @name:zh 汉字转换为简体字
// @description 将页面上的汉字转换为简体字
// @namespace https://github.com/tiansh
// @version 1.8
// @resource t2s https://tiansh.github.io/reader/data/han/t2s.json
// @include *
// @grant GM_getResourceURL
// @grant GM.getResourceUrl
// @run-at document-start
// @license MIT
// @downloadURL https://tiansh.github.io/us-han-simplify/HanSimplify.user.js
// @supportURL https://github.com/tiansh/us-han-simplify/issues
// ==/UserScript==

/** @type {'t2s'|'s2t'} */
const RULE = 't2s';

