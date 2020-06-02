export function tokenize(input) {
    let i;
    let inputWithAddedSpaces = "";
    const syntax = /['";()]/;
    for(i = 0; i<input.length; i++){
        if(syntax.test(input.charAt(i))){
            if(input.charAt(i-1) != " "){
                inputWithAddedSpaces += " ";
            }
            if(input.charAt(i+1) != " "){
                inputWithAddedSpaces += input.charAt(i) + " ";
            } else {
                inputWithAddedSpaces += input.charAt(i);
            }
        } else if(input.charAt(i) === "-" && input.charAt(i+1) === ">"){
            if(input.charAt(i-1) != " "){
                inputWithAddedSpaces += " ";
            }
            if(input.charAt(i+2) != " "){
                inputWithAddedSpaces += "->" + " ";
            } else {
                inputWithAddedSpaces += "->";
            }
        } else if(input.charAt(i) != ">") {
            inputWithAddedSpaces += input.charAt(i);
        }
    }
    let splitInput = inputWithAddedSpaces.split(" ").filter((s) => s !== "");
    let output = [];
    for(i = 0; i<splitInput.length; i++){
        if(!isNaN(splitInput[i])){
            output.push({type: "num", val:Number(splitInput[i])});
        } else if(syntax.test(splitInput[i]) || splitInput[i] === "->"){
            output.push({type: "syntax", val:splitInput[i]});
        } else if(splitInput[i] != '') {
            output.push({type: "ident", name:splitInput[i]});
        }
    }
    return(output)
}