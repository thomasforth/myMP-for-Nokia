function selectedItemPostcodeClicked() {
    PostCode = PostCodeEntry.getText();
    PostCodeURL = "http://www.theyworkforyou.com/api/getMP?postcode=" + PostCode + "&key=AwSS35C4p8x6FwDUqKDnAwPs";
    uiManager.showNotification(-1, "wait", "searching for MP...", -1);
    postcodeCall(PostCodeURL);    
}

function postcodeCall(URL) {
    try {
        postcodeAjax = new Ajax();
        postcodeAjax.onreadystatechange = postcodeCallback;
        postcodeAjax.open('GET', URL, true);
        postcodeAjax.send(null);
    }
    catch (e) {
        uiManager.showNotification(500, "wait", "Sorry, I can't connect. Please check that you are connected to the internet and try again", null);
    }
}

function postcodeCallback() {
    if (postcodeAjax.readyState == 4) {
        PostCodeReturn = eval('([' + postcodeAjax.responseText + '])');
        MPid = PostCodeReturn[0].person_id;
        if (MPid == undefined) {
            uiManager.showNotification(500, "wait", "No MP found for that Postcode", null);
        }
        else {
            menu.setRightSoftkeyLabel("Back", resetfiltersView);
            uiManager.showNotification(500, "wait", "MP Found!", -1);
            createDetailView(MPid, "long");
        }    
    }
}