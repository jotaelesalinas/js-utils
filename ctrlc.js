function CtrlC (text) {
    return navigator.clipboard.writeText(text);

    var ID_NEW_TEXTAREA = 'ctrlc-clipboard-textarea-hidden-id';
    var elTextarea = document.getElementById(text);
    
    if (elTextarea) {
        console.error("CtrlC: The textarea already exists, and it shouldn't.")
        return false;
    }
    
    // create fake textarea
    // console.log("Creating textarea...");
    var textarea = document.createElement("textarea");
    textarea.id = ID_NEW_TEXTAREA;
    //textarea.style.display = 'none';
    document.body.appendChild(textarea);
    
    elTextarea = document.getElementById(ID_NEW_TEXTAREA);
    if (!elTextarea) {
        console.error("CtrlC: For some reason the textarea couldn't be created.")
        return false;
    }
    
    elTextarea.value = text;
    elTextarea.select();
    
    try {
        // for size limit, try this:
        // https://stackoverflow.com/questions/43641182/does-document-execcommandcopy-have-a-size-limitation
        if(!document.execCommand('copy')) {
            elTextarea.parentNode.removeChild(elTextarea);
            console.error("CtrlC: Cannot copy text to clipboard.");
            return false;
        }
    } catch (err) {
        elTextarea.parentNode.removeChild(elTextarea);
        console.error("CtrlC: Unable to copy text to clipboard.");
        return false;
    }
    
    elTextarea.parentNode.removeChild(elTextarea);
    return true;
}
