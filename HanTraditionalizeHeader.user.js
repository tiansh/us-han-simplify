// ==UserScript==
// @name Han Traditionalize
// @name:zh 漢字轉換為繁體字
// @description 將頁面上的漢字轉換為繁體字
// @namespace https://github.com/tiansh
// @version 1.8
// @resource s2t https://tiansh.github.io/reader/data/han/s2t.json
// @include *
// @grant GM_getResourceURL
// @grant GM.getResourceUrl
// @run-at document-start
// @license MIT
// @downloadURL https://tiansh.github.io/us-han-simplify/HanTraditionalize.user.js
// @supportURL https://github.com/tiansh/us-han-simplify/issues
// ==/UserScript==

/** @type {'t2s'|'s2t'} */
const RULE = 's2t';

