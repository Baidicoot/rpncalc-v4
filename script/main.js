import {execRPN} from './shiny.mjs';
import {parseExprs} from './parse.mjs';
import {tokenize} from './token.mjs';
import {scope} from './builtin.mjs';
import './dom.mjs';

const tags = document.getElementsByTagName("script");
let scripts = []
for (let i = 0; i < tags.length; i++) {
    scripts.push(tags.item(i));
}

scripts = scripts.filter(script => script.type === "text/rpncalc");

const dispatch = (src) => {
    setTimeout(() => {
        let http = new XMLHttpRequest();
        http.onreadystatechange = async(e) => {
            if (http.readyState == 4 && http.status == 200) {
                execRPN(scope, parseExprs(tokenize(http.responseText)).parsed);
            }
        };
        http.open("get", src);
        http.responseType = "text";
        http.send();
    }, 0);
}

for (let i = 0; i < scripts.length; i++) {
    dispatch(scripts[i].src);
}