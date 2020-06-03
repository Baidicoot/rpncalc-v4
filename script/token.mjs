const tokens = (stream) => {
    let toks = [];
    let currTok = {val:"", type:"str"};
    let stringmode = false;
    for (let i = 0; i < stream.length; i++) {
        if (stringmode) {
            if (stream[i] === '`') {
                toks.push(currTok);
                stringmode = false;
                currTok = {val:"", type:"str"};
            } else {
                currTok.val += stream[i];
            }
        } else if (stream[i] === '`') {
            if (currTok.val !== "") {
                toks.push(currTok);
            }
            stringmode = true;
            currTok = {val:"", type:"string"};
        } else if ("()';\"".includes(stream[i])) {
            if (currTok.val !== "") {
                toks.push(currTok);
            }
            toks.push({val:stream[i], type:"syntax"});
            currTok = {val:"", type:"str"};
        } else if (stream[i] === "-") {
            if (stream[i+1] === ">") {
                if (currTok.val !== "") {
                    toks.push(currTok);
                }
                toks.push({val:"->", type:"syntax"});
                i++;
                currTok = {val:"", type:"str"};
            } else {
                currTok.val += "-";
            }
        } else if (/\s/.test(stream[i])) {
            if (currTok.val !== "") {
                toks.push(currTok);
            }
            currTok = {val:"", type:"str"};
        } else {
            currTok.val += stream[i];
        }
    }
    if (currTok.val !== "") {
        toks.push(currTok);
    }
    return toks;
}

const classify = (tokens) => {
    return tokens.map(tok => {
        if (tok.type === "str") {
            if (!isNaN(tok.val)) {
                return {val:Number(tok.val), type:"num"};
            } else {
                return {name:tok.val, type:"ident"};
            }
        } else {
            return tok;
        }
    });
}

export const tokenize = (stream) => {
    return classify(tokens(stream));
}