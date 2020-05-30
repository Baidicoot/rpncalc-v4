export function tokenize(input) {
    let i;
    let inputWithAddedSpaces = "";
    const syntax = /['";()]/;                                            //  -> is a special syntax (because it uses 2 characters) so is coded separately
    for(i = 0; i<input.length; i++){
        if(syntax.test(input.charAt(i))){
            if(input.charAt(i-1) != " "){
                inputWithAddedSpaces += " ";                             //  adds a space
            }
            if(input.charAt(i+1) != " "){
                inputWithAddedSpaces += input.charAt(i) + " ";           //  adds a space after the character
            } else {
                inputWithAddedSpaces += input.charAt(i);                 //  adds the character
            }
        } else if(input.charAt(i) === "-" && input.charAt(i+1) === ">"){
            if(input.charAt(i-1) != " "){
                inputWithAddedSpaces += " ";                             //  adds a space
            }
            if(input.charAt(i+2) != " "){
                inputWithAddedSpaces += "->" + " ";                      //  adds a space after the two characters
            } else {
                inputWithAddedSpaces += "->";                            //  adds the two characters
            }
        } else if(input.charAt(i) != ">") {                              //  if it is syntax, it was already detected at "-"
            inputWithAddedSpaces += input.charAt(i);
        }
    }                                                                    //  i feel like this for loop is inefficient and could just add spaces around syntax all the time, so the following code has more writes to memory but may be more efficient. replace lines 5-27 with 29-37 by commenting out lines 5-27 and removing the /* and */ around lines 29-37. Note: i have not tested the code but it probably works.
    /*
    for(i = 0; i<input.length; i++){
        if(syntax.test(input.charAt(i))){
            inputWithAddedSpaces += " " + input.charAt(i) + " ";
        } else if(input.charAt(i) === "-" && input.charAt(i+1) === ">"){
            inputWithAddedSpaces += " -> ";
        } else {
            inputWithAddedSpaces += input.charAt(i);
        }
    }
    */
    let splitInput = inputWithAddedSpaces.split(" ");
    let output = [];
    for(i = 0; i<splitInput.length; i++){
        if(/^\d+$/.test(splitInput[i])){                                    //  didn't need /[0-9]/, but that would be helpful to stop numbers from being in identifiers, but the ability to call a function "function_add_1" is easier to type than "function_add_one"
            output.push({type: "int", val:parseInt(splitInput[i])});               //      also, /[a-zA-Z]/ wasn't necessary as my code uses anything that isn't `;() or ->
        } else if(syntax.test(splitInput[i]) || splitInput[i] === "->"){//  needs a || as -> wasn't included in the syntax regexp. it wasn't in because -> uses two characters so i wanted to have separate code for it. (also because regexps are confusing)
            output.push({type: "syntax", val:splitInput[i]});
        } else if(splitInput[i] != '') {                                //  if syntax is next to the end of the string or other bits of syntax the two spaces are in inputWithAddedSpaces so .split returns '' as one element. this makes sure that it is not read as an identifier
            output.push({type: "ident", name:splitInput[i]});
        }
    }
    return(output)
}