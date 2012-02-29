// Please don't remove line below - it is used for code-completion for Visual Studio
/// <reference path="preview\vsdoc.js" />

// Reference to the WRTKit user interface manager and main view.
var version = '1.40'

var uiManager;
var mainView;
var filtersView;
var detailView = null;

// global service object
var so;
var issuesfieldsToGet = "";

// Allow filter selections to be global
var selectedParty = "All";
var j = 0; //the MP counter needs to be global
var xmlhttp = null; //needs to be global
var MPid = null; //needs to be global
var latitude = null; //needs to be global
var longitude = null; //needs to be global
var method = null; //shouldn't need to be global but it makes it easier to make the more button work

var skipped = 0;
//about view label control
var aboutLabel;

// Called from the onload event handler to initialize the widget.
function init() {
    
    window.onresize = windowResize;
	//create about menu item
	var aboutMenuItem = new MenuItem("About", 1);
	aboutMenuItem.onSelect = menuItemSelected;
	menu.append(aboutMenuItem);
	//create reset menu item
    var resetMenuItem = new MenuItem("Reset", 2);
    resetMenuItem.onSelect = menuItemSelected;
    menu.append(resetMenuItem);
    //create checkforupdate menu item
    var updateMenuitem = new MenuItem("Check for Update", 3);
    updateMenuitem.onSelect = menuItemSelected;
    menu.append(updateMenuitem);

	if (window.widget) {
        widget.setNavigationEnabled(true);
        menu.showSoftkeys();
    }
    
    // create UI manager
    uiManager = new UIManager();
	// Create about view
    aboutView = new ListView(null, null);   
	// About lable control
	aboutLabel = new Label();
	aboutView.addControl(aboutLabel);
	windowResize();
}

var lastsize = null;

function windowResize() {
    if (window.innerHeight < 150) { //miniView size
        //alert('miniview');
        document.styleSheets[0].disabled = false;
        document.styleSheets[1].disabled = true;
        document.styleSheets[2].disabled = true;
        homescreenProgram();
        lastsize = window.innerHeight;
    }
    else if (!lastsize && window.innerHeight < window.innerWidth && window.innerWidth < 321) { //E series size
    //alert('nontouch windowheight = ' + window.innerHeight + 'windowWidth = ' + window.innerWidth);
        document.styleSheets[0].disabled = true;
        document.styleSheets[1].disabled = false;
        document.styleSheets[2].disabled = true;
        firstRun();
        window.onresize = null; //E series don't change window size
    }
    else if (lastsize < 150 && lastsize) { //touch-screen opened from homescreen
    //alert('opened from homescreen');
        document.styleSheets[0].disabled = true;
        document.styleSheets[1].disabled = true;
        document.styleSheets[2].disabled = false;
        //alert('touch screen');
        lastsize = window.innerHeight;
        if (!widget.preferenceForKey("myMP") || widget.preferenceForKey("myMP") == 'null') { //No MP has been chosen
            //alert('filters');
            filtersProgram();
            resetfiltersView();
        }
    }
    else if (lastsize > 150 && lastsize) { //simple rotation
    //alert('rotated');
    }
    else { //touch-screen opened from scratch
        //alert('opened from scratch');
        document.styleSheets[0].disabled = true;
        document.styleSheets[1].disabled = true;
        document.styleSheets[2].disabled = false;
        firstRun();
        lastsize = window.innerHeight;
    }
}

function firstRun() {
    if (!widget.preferenceForKey("myMP") || widget.preferenceForKey("myMP") == 'null') { //No MP has been chosen
        //alert('filters');
        filtersProgram();
        resetfiltersView();
    }
    else {
        myMPid = widget.preferenceForKey("myMP");
        if (detailView == null) { //only draw a new detailView if it doesn't already exist
            //alert('creating detailView for ' + myMPid);
            createDetailView(myMPid);
        }
        menu.setRightSoftkeyLabel("", null);
    } 
}

function homescreenProgram() {
    //alert('running homescreen');
    if (widget.preferenceForKey("myMP") == "null" || widget.preferenceForKey("myMP") == null || !widget.preferenceForKey("myMP")) {
        firstrunhomescreenButton = new NavigationButton(null, 'img/twfylogo2.png', 'Select an MP and a link will appear here');
        homescreenView = new ListView(null, null);
        uiManager.setView(homescreenView);
        homescreenView.addControl(firstrunhomescreenButton);
    }
    else {
        createDetailView(widget.preferenceForKey("myMP"));               
    }
}

function filtersProgram() {
    filtersView = new ListView(null, "Find your MP");
    // create party filters
    var selectionoptions = [{ value: "all", text: "All" }, { value: "con", text: "Conservative" }, { value: "lab", text: "Labour" },
	                        { value: "lib", text: "Liberal Democrat" }, { value: "snp", text: "Scottish National Party" },
	                        { value: "dup", text: "DUP" }, { value: "sf", text: "Sinn Fein" }, { value: "sdlp", text: "Social Democratic and Labour Party" },
	                        { value: "pc", text: "Plaid Cymru" },   
	                        { value: "other", text: "Smaller Parties"}];
	                        partyFilter = new SelectionMenu(null, "Browse by Party", selectionoptions, false, selectionoptions[0]);
    
    selectedItemBrowse = new FormButton(null, "     Browse MPs     ");
    selectedItemBrowse.addEventListener("ActionPerformed", selectedItemBrowseClicked);
    orLabel = new Label(null, null, "<h5 align=\"center\">-OR-</h5>");
    orLabel2 = new Label(null, null, "<h5 align=\"center\">-OR-</h5>");
    orLabel3 = new Label(null, null, "<h5 align=\"center\">-OR-</h5>");
    locationWarning = new Label(null, null, "<br/>*On some devices the application will not respond during location lookup.</h5>");

    if (window.innerHeight > 500 || window.innerWidth > 500) {
        NameEntry = new TextField(null, "Search by Name"); //if touchscreen use TextField
    }
    else { //else use TextField (stops the bug where you get stuck in the box
        NameEntry = new TextArea(null, "Search by Name", null, 1);
    }
    selectedItemName = new FormButton(null, "        Find MP        ");
    selectedItemName.addEventListener("ActionPerformed", nameSearchClicked);
    if (window.innerHeight > 500 || window.innerWidth > 500) {
        PostCodeEntry = new TextField(null, "Search by Postcode");
    }
    else {
        PostCodeEntry = new TextArea(null, "Search by Postcode", null, 1);
    }
    
    selectedItemPostcode = new FormButton(null, "        Find MP        ");
    selectedItemPostcode.addEventListener("ActionPerformed", selectedItemPostcodeClicked);

    AutomaticLookupLabel = new Label(null, "Search using GPS*");
    locationButton = new FormButton(null, "Find the MP at this location");
    locationButton.addEventListener("ActionPerformed", returnLocation);
    filterpageSep = new Separator(null);
    //locationButton.enabled = 0;

    filtersView.addControl(AutomaticLookupLabel);
    filtersView.addControl(locationButton);
    filtersView.addControl(orLabel2);
    filtersView.addControl(NameEntry);
    filtersView.addControl(selectedItemName);
    filtersView.addControl(orLabel);
    filtersView.addControl(PostCodeEntry);
    filtersView.addControl(selectedItemPostcode);
    filtersView.addControl(orLabel3);
    filtersView.addControl(partyFilter);
    filtersView.addControl(selectedItemBrowse);
    //filtersView.addControl(filterpageSep);
    filtersView.addControl(locationWarning);

    //window.onresize = checkViewMode;
}

function nameSearchClicked() {
    SearchName = NameEntry.getText();
    mainView = new ListView(null, "MP Browser");
    uiManager.setView(mainView);
    menu.setRightSoftkeyLabel("Back", resetfiltersView);
    uiManager.showNotification(-1, "wait", "Searching for MPs...", -1);
    mainprogram("search", SearchName);
    uiManager.showNotification(500, "info", "Done!", null);
}

function selectedItemBrowseClicked() {
    selectedParty = partyFilter.getSelected().text;
    mainView = new ListView(null, "MP Browser");
    uiManager.setView(mainView);
    menu.setRightSoftkeyLabel("Back", resetfiltersView);
    uiManager.showNotification(-1, "wait", "Loading MPs...", -1);
    mainprogram("browse");
    uiManager.showNotification(500, "info", "Done!", null);
}

//Synchronous call function
function callSync(URL,cacheoption) {
    xmlhttp = new Ajax();
//    xmlhttp.setRequestHeader("If-Modified-Since", "Sat, 1 Jan 2005 00:00:00 GMT");
    var attemptNumber = 0;
    var connectionsuccess = 0;
    while (connectionsuccess < 1 && attemptNumber < 5) {
        try {
            xmlhttp.open("GET", URL, false);
            xmlhttp.send(null)
            attemptNumber = 5;
            connectionsuccess = 1;
        }
        catch (err) { //there's a strange thing in the wrt. If you don't allow a network connection very quickly, it doesn't work. This tries again and fixes that problem
            if (window.innerHeight < 150) {
            //don't throw a warning for connections in miniview
            }
            else {
                uiManager.showNotification(500, "wait", "Establishing Connection (" + attemptNumber + ")", -1);
            }
            attemptNumber++;
            connectionsuccess = 0;
        }
    }
    if (connectionsuccess == 0) {
        uiManager.showNotification(500, "wait", "Sorry, I can't connect. Please check that you are connected to the internet and try again", null);
    }
} 

function mainprogram(method, searchterm) {   
    var MPsURL = "http://www.theyworkforyou.com/api/getMPs?date=19.05.10&key=AwSS35C4p8x6FwDUqKDnAwPs";
    var knownURL = "http://www.bioinformatics.leeds.ac.uk/~pytf/newdoc.txt";
    widget.setPreferenceForKey(null, "test");
    //alert("newsearchterm=" + newsearchterm);
    callSync("getMPs"); //to be clear, this is using the URL call on a local file. It should be changed to the web file really but this saves 76kb each time
    rawMPsList = xmlhttp.responseText;
    MPsList = eval('(' + rawMPsList + ')'); //parses the text response to JSON

    n = 9;
    displayMPs(n,method,searchterm);
    //var moreButton;

    function displayMPs(number,method,searchterm) {
        while (j < number + skipped && j < MPsList.length) {
            var name = MPsList[j].name;
            var party = MPsList[j].party;
            var constituency = MPsList[j].constituency;
            var personid = MPsList[j].person_id;

            if (method == "search") {
                var re = new RegExp(searchterm, "i");
                if (name.search(re) != -1) {
                    createMpTile(personid, name, party, constituency);
                    getMPtileImage(personid, party);
                    j++;
                }
                j++;
                skipped++;
            }
            if (method == "browse") {
                if (party == selectedParty || selectedParty == "All") {
                    createMpTile(personid, name, party, constituency);
                    getMPtileImage(personid, party);
                    j++;
                }
                if (selectedParty == "Smaller Parties" && party != "Labour" && party != "Conservative" && party != "Liberal Democrat") {
                    createMpTile(personid, name, party, constituency);
                    getMPtileImage(personid, party);
                    j++;
                }
                j++;
                skipped++;
            }
        }          
        
        var moreButton = new NavigationButton("morebutton", "img/moreplus.png", "More MPs...");
        moreButton.addEventListener("ActionPerformed", moreButtonClicked);
        //moreButton.imageElement.style.width = "50px";
        mainView.addControl(moreButton);
        uiManager.showNotification(500, "info", "Done!", null);
    }

    function moreButtonClicked() {
        n = n + 10;
        uiManager.showNotification(-1, "wait", "Loading More MPs...", -1);
        var curControls = mainView.getControls(); //Get a list of controls
        var length = curControls.length - 1;       //Point to the last one added, (this will be the More MPs button)
        mainView.removeControl(curControls[length]); //Delete it
        displayMPs(n, method, searchterm);
        uiManager.showNotification(500, "info", "Done!", null);
    }
}

function createMpTile(personid, name, party, constituency) {
    var output = '<p class="mpname">' + name + '</p><p class="party">' + party + '</p><p class="constituency">' + constituency + '</p>';
    navLoader = new NavigationButton(personid, 'img/loading.gif', output);
    navLoader.addEventListener("ActionPerformed", MPsListButtonClicked);
    mainView.addControl(navLoader);
}

function getMPtileImage(personid, party) {
    var getMPURL = "http://www.theyworkforyou.com/api/getMP?id=" + personid + "&key=AwSS35C4p8x6FwDUqKDnAwPs";
    try {
        rawpersonid = personid;
        personid = new Ajax();
        personid.onreadystatechange = function() { imageTileCallback(personid, rawpersonid, party); };
        personid.open('GET', getMPURL, true);
        personid.send(null);
    }
    catch (e) {
        uiManager.showNotification(500, "wait", "Sorry, I can't connect. Please check that you are connected to the internet and try again", null);
    }
}

function imageTileCallback(personid, rawpersonid, party) {

    if (personid.readyState != 4) {    
    }
    if (personid.readyState == 4) {
        //alert('successfull callback personid = ' + rawpersonid);
        var MPList = eval('(' + personid.responseText + ')');
        var imgurl = "http://theyworkforyou.com" + (MPList[0].image);
        if (MPList[0].image == undefined) {
            switch (MPList[0].party) {
                case "Labour":
                    imgurl = "img/labour.jpg";
                    break;
                case "Liberal Democrat":
                    imgurl = "img/ld.jpg";
                    break;
                case "Conservative":
                    imgurl = "img/conservative.jpg";
                    break;
                default:
                    imgurl = "img/unknown.jpg";
            }
        }
        controlArray = mainView.getControls();

        for (var i = 0; i < controlArray.length; i++) {     //now we have the imgurl, loop through all controls and assign the img to the correct navigation button
            if (imgurl.search(controlArray[i].id) != -1) { //this only works because the img url contains the personid
                controlArray[i].setImage(imgurl);
                controlArray[i].updateStyleFromState();
            }
        }        
    }     
}

function MPsListButtonClicked(MP) {
    MPid = MP.source.id;
    menu.setRightSoftkeyLabel("Back", resetmainView);
    createDetailView(MPid);
}

function createDetailView(memberId) {
    //alert('creating detailview');
    if (window.innerHeight > 150) {
        uiManager.showNotification(-1, "wait", "Loading MP info...", -1);
    }
    getbasicInfo();

    function getbasicInfo() {
        //alert('getting basic info');
        //Gets basic info on member
        var getMPURL = "http://www.theyworkforyou.com/api/getMP?id=" + memberId + "&key=AwSS35C4p8x6FwDUqKDnAwPs";
        try {
            basicinfoAjax = new Ajax();
            basicinfoAjax.onreadystatechange = basicinfoCallback;
            basicinfoAjax.open('GET', getMPURL, true);
            basicinfoAjax.send(null);
        }
        catch (e) {
            uiManager.showNotification(500, "wait", "Sorry, I can't connect. Please check that you are connected to the internet and try again", null);
        }
    }

    function basicinfoCallback() {
        if (basicinfoAjax.readyState != 4) {
        }
        if (basicinfoAjax.readyState == 4) {
            MPList = eval('(' + basicinfoAjax.responseText + ')');
            drawBasicDetail();
            createIssuesTable();
        }
    }

    function createIssuesTable() {
        //alert('creating issues table');
        issuesURL = "http://www.tomforth.co.uk/mymp/issuesTable.txt";
        try {
            issuesAjax = new Ajax();
            issuesAjax.onreadystatechange = issuesCallback;
            issuesAjax.open('GET', issuesURL, true);
            issuesAjax.send(null);
        }
        catch (e) {
            uiManager.showNotification(500, "wait", "Sorry, I can't connect. Please check that you are connected to the internet and try again", null);
        }
    }

    function issuesCallback() {
        if (issuesAjax.readyState != 4) {
        }
        if (issuesAjax.readyState == 4) {
            issuesfieldsToGet = null;
            issuesTable = eval('(' + issuesAjax.responseText + ')');
            for (var i in issuesTable) {
                //alert(i);
                issuesfieldsToGet = issuesfieldsToGet += ",public_whip_dreammp" + i + "_distance";
                issuesfieldsToGet = issuesfieldsToGet += ",public_whip_dreammp" + i + "_both_voted";
            }
            //now that I have the issues, let's get the MP extra info
            var fieldsToGet = "mp_website,wikipedia_url,guardian_mp_summary,expenses_url,twitter_username";
            var MPidURL = "http://www.theyworkforyou.com/api/getMPInfo?id=" + memberId + "&fields=" + fieldsToGet + issuesfieldsToGet + "&key=AwSS35C4p8x6FwDUqKDnAwPs";
            getMoreMPInfo(MPidURL);
        }
    }

    function getMoreMPInfo(MPidURL) {
        //alert('getting more mp info MPidURL = ' + MPidURL);
        try {
            moreinfoAjax = null; //just in case it's still defined
            moreinfoAjax = new Ajax();
            moreinfoAjax.onreadystatechange = moreinfoCallback;
            moreinfoAjax.open('GET', MPidURL, true);
            moreinfoAjax.send(null);
        }
        catch (e) {
            uiManager.showNotification(500, "wait", "Sorry, I can't connect. Please check that you are connected to the internet and try again", null);
        }
    }

    function moreinfoCallback() {
        if (moreinfoAjax.readyState != 4) {
        }
        if (moreinfoAjax.readyState == 4) {
            //alert('gotMPresponse moreinfoAjax = ' + moreinfoAjax.responseText);
            try {
                MPmoreinfo = eval('([' + moreinfoAjax.responseText + '])');
            }
            catch (e) {
                window.close;
            }
            drawDetailView();
        }
    }
    
    function drawBasicDetail() {
        //detailView = new ListView(null, "MP Details (" + memberId + ")");
        detailView = null; //reset any old lingering detailView from homescreen efforts (I hope this fixed things)
        detailView = new ListView(null, null);
        //This gets more info but sometimes the extra info isn't great
        var imgurl = "http://theyworkforyou.com" + (MPList[0].image);
        if (MPList[0].image == undefined) {
            switch (MPList[0].party) {
                case "Labour":
                    imgurl = "img/labour.jpg";
                    break;
                case "Liberal Democrat":
                    imgurl = "img/ld.jpg";
                    break;
                case "Conservative":
                    imgurl = "img/conservative.jpg";
                    break;
                default:
                    imgurl = "img/unknown.jpg";
            }
        }
        if (MPList[2] == undefined) {
            MPname = MPList[0].first_name + " " + MPList[0].last_name + " MP";
        }
        else {
            MPname = MPList[2].full_name;
        }
        var output = '<p class="mpname">' + MPname + '</p><p class="party">' + MPList[0].party + '</p><p class="constituency">' + MPList[0].constituency + '</p>'
        MPinfo = new NavigationButton(memberId, imgurl, output);
        MPinfo.imageElement.style.width = "60px"; //BANG! (it took me about 3 hours to figure out how to do this)

        seperator1 = new Separator(null);
        //linksLabel = new Label(null, '<h3 align="center">-Links-</h3>', null);
        linksLabel = new Separator(null);
        uiManager.setView(detailView);
    }

    function drawDetailView() {
        //alert('drawing detail view');
        GuardianButton = new NavigationButton(MPmoreinfo[0].guardian_mp_summary, "img/guardian_logo4.png", MPname + "'s page at theguardian.co.uk");
        GuardianButton.imageElement.style.height = "auto";
        GuardianButton.addEventListener("ActionPerformed", openGuardianPage);
        if (MPmoreinfo[0].guardian_mp_summary == undefined) {
            GuardianButton.enabled = 0; //The Button is greyed out if there is no link
            GuardianButton.setText(MPname + " has no guardian.co.uk website");
            GuardianButton.updateStyleFromState();
        }

        WebsiteButton = new NavigationButton(MPmoreinfo[0].mp_website, "img/wwwlogo2.png", MPname + "'s personal webpage");
        WebsiteButton.imageElement.style.height = "auto";
        WebsiteButton.addEventListener("ActionPerformed", openMPWebsite);
        if (MPmoreinfo[0].mp_website == undefined) {
            WebsiteButton.enabled = 0;
            WebsiteButton.setText(MPname + " has no registered personal website");
            WebsiteButton.updateStyleFromState();
        }

        twfyButton = new NavigationButton(MPList[0].url, "img/twfylogo2.png", MPname + "'s page at theyworkforyou.com");
        twfyButton.imageElement.style.height = "auto";
        twfyButton.addEventListener("ActionPerformed", opentwfyWebsite);

        wikipediaButton = new NavigationButton(MPmoreinfo[0].wikipedia_url, "img/wikipedia-logo2.png", MPname + "'s page on wikipedia");
        wikipediaButton.imageElement.style.height = "auto";
        wikipediaButton.addEventListener("ActionPerformed", openWikipediaWebsite);
        if (MPmoreinfo[0].expenses_url == undefined) {
            wikipediaButton.enabled = 0;
            wikipediaButton.setText(MPname + " has no registered wikipedia site");
            wikipediaButton.updateStyleFromState();
        }

        expensesButton = new NavigationButton(MPmoreinfo[0].expenses_url, "img/coin.png", MPname + "'s expenses webpage");
        expensesButton.imageElement.style.height = "auto";
        expensesButton.addEventListener("ActionPerformed", openExpenses);
        if (MPmoreinfo[0].expenses_url == undefined) {
            expensesButton.enabled = 0;
            expensesButton.setText(MPname + " has no registered expenses site");
            expensesButton.updateStyleFromState();
        }
        //change
        twitterButton = new NavigationButton(MPmoreinfo[0].twitter_username, "img/twitter-logo.png", MPname + "'s twitter page");
        twitterButton.imageElement.style.height = "auto";
        twitterButton.addEventListener("ActionPerformed", openTwitter);
        if (MPmoreinfo[0].twitter_username == undefined) {
            twitterButton.enabled = 0;
            twitterButton.setText(MPname + " has no registered twitter account");
            twitterButton.updateStyleFromState();
        }

        makeSelectedMP = new FormButton(memberId, "Follow this MP");
        makeSelectedMP.addEventListener("ActionPerformed", saveSelectedMP);

        deSelectMPbutton = new FormButton(memberId, "Browse other MPs");
        deSelectMPbutton.addEventListener("ActionPerformed", deSelectMP);

        spacer = new ContentPanel(null, null, '<br/>', false, false);

        votingTable = "";

        for (issueID in issuesTable) {
            issueName = issuesTable[issueID];
            dreammpDistancelookupString = 'MPmoreinfo[0].public_whip_dreammp' + issueID + '_distance';
            issueDistance = 100 * eval(dreammpDistancelookupString);
            BothVotedlookupString = 'MPmoreinfo[0].public_whip_dreammp' + issueID + '_both_voted';
            issueBothVoted = eval(BothVotedlookupString);
            tableElement = voteTableElement(issueName, issueDistance, issueBothVoted);
            votingTable = votingTable += tableElement;
        }

        if (!lastsize && window.innerHeight < window.innerWidth && window.innerWidth < 321) { //E series size, problems with clicking on the toggle
            votingRecord = new ContentPanel("links", 'Expand Voting Record <em style="font-size:xx-small">(press Enter to open)</em>', null, true, false);
        }
        else {
            votingRecord = new ContentPanel("links", 'Expand Voting Record', null, true, false);
        }
        votingRecord.setContent(votingTable);

        detailView.addControl(MPinfo);
        detailView.addControl(seperator1);
        detailView.addControl(votingRecord);
        detailView.addControl(linksLabel);
        detailView.addControl(twfyButton);
        detailView.addControl(GuardianButton);
        detailView.addControl(WebsiteButton);
        detailView.addControl(wikipediaButton);
        detailView.addControl(expensesButton);
        detailView.addControl(twitterButton);

        if (widget.preferenceForKey("myMP") == memberId) { //I really don't know why the null needs putting in quotes
            detailView.addControl(deSelectMPbutton);
        }
        else {
            detailView.addControl(makeSelectedMP);
        }
        detailView.addControl(spacer);
        if (window.innerHeight > 150) {
            uiManager.showNotification(500, "wait", "MP Loaded!", null);
        }

    }
}

function voteTableElement(name, distance, votecount) {
    inverseDistance = 100 - distance;
    
    if (votecount == undefined) {
        noRecordsString = '<p class="issuetablehead">' + name + '</p><table class="issuetablecontent" style="width: 100%"><tr><td style = "text-align: center;" width="100%" bgcolor="gray"><em>No records on publicwhip.org.uk</em></td></tr></table>';
        return noRecordsString;
    }
    
    if (votecount == 0) {
        neverVotedString = '<p class="issuetablehead">' + name + '</p><table class="issuetablecontent" style="width: 100%"><tr><td style = "text-align: center;" width="100%" bgcolor="blue">Never voted on the issue</td></tr></table>';
        return neverVotedString;      
    }
    
    if (distance > 84) {
        opinionAgainst = "Very Strongly Against";
        opinionFor = "";
    }
    else if (distance > 66) {
        opinionAgainst = "Strongly Against";
        opinionFor = "";
    }
    else if (distance > 50) {
        opinionAgainst = "Against";
        opinionFor = "";
    }
    else if (distance > 32) {
        opinionAgainst = "";
        opinionFor = "For";
    }
    else if (distance > 16) {
        opinionAgainst = "";
        opinionFor = "Strongly For";
    }
    else {
        opinionAgainst = "";
        opinionFor = "Very Strongly For";
    }
    tableElement = '<table class="issuetablecontent" style="width: 100%"><tr><td width="' + inverseDistance + '%" bgcolor="green" class="tablebody">' + opinionFor + '</td><td style = "text-align: right;" width="' + distance + '%" bgcolor="red" class="tablebody">' + opinionAgainst + '</td></tr></table>';
    wholeElement = '<p class="issuetablehead">' + name + '</p>' + tableElement;
    return wholeElement;
}

function openGuardianPage(MP) {
    var guardianurl = MP.source.id;
    widget.openURL(guardianurl);
}

function openMPWebsite(MP) {
    var MPWebsite = MP.source.id;
    widget.openURL(MPWebsite);
}

function opentwfyWebsite(MP) {
    var twfyWebsite = "http://www.theyworkforyou.com" + MP.source.id;
    widget.openURL(twfyWebsite);
}

function openWikipediaWebsite(MP) {
    var WikipediaWebsite = MP.source.id;
    widget.openURL(WikipediaWebsite);
}

function openExpenses(MP) {
    var expensesWebsite = MP.source.id;
    widget.openURL(expensesWebsite);
}

function openTwitter(MP) {
    var twitterWebsite = 'mobile.twitter.com/' + MP.source.id;
    widget.openURL(twitterWebsite);
}

function resetmainView() {
    detailView = null;
    uiManager.setView(mainView);
    menu.setRightSoftkeyLabel("Back", resetfiltersView);
}

function resetfiltersView() {
    if (mainView != undefined) { mainView = null };
    skipped = 0;
    j = 0;
    uiManager.setView(filtersView);
    menu.setRightSoftkeyLabel("", null);
}

function saveSelectedMP(MP)  {
    myMPid = MP.source.id;
    widget.setPreferenceForKey(myMPid, "myMP");
    uiManager.showNotification(500, "wait", "Now following this MP", null);
    menu.setRightSoftkeyLabel("", null);
}

function deSelectMP(MP) {
    myMPid = MP.source.id;
    //widget.setPreferenceForKey(null, "myMP"); Deactivated, I can reset if I need to have a null selection
    uiManager.showNotification(1000, "wait", "Use the 'Reset' option if you no longer want to follow any MP", null);
    if (filtersView == null) {
        filtersProgram();
    }
    resetfiltersView();
    //uiManager.setView(filtersView);
}
// Show main view.
function showMainView() {
    
    // set right softkey to "exit"
    if (window.widget) {
        menu.setRightSoftkeyLabel("", null);
    }
    
    // show the main view
    uiManager.setView(mainView);
}
// Callback for when menu items are selected.
function menuItemSelected(id) {
    switch (id) {
        case 1:
            showAboutView();
            break;
        case 2:
            widget.setPreferenceForKey(null, "myMP");
            //filtersView = null;
            uiManager.showNotification(500, "wait", "MP Choice Reset", null);
            filtersProgram();
            resetfiltersView();
            break;
        case 3:
            checkforUpdate();
            break;
    }
}

var updateAjax;

function checkforUpdate() {
    try {
        
        dateObject = new Date();
        updateAjax = new Ajax();
        updateAjax.onreadystatechange = updateCallback;
        updateAjax.open("GET", 'http://www.tomforth.co.uk/mymp/updatehandler.php?' + dateObject.getMilliseconds(), true); //the milliseconds bit is useless but stops the browser caching the request
        updateAjax.send(null);
    }
    catch (err) { //there's a strange thing in the wrt. If you don't allow a network connection very quickly, it doesn't work. This tries again and fixes that problem
        uiManager.showNotification(500, "wait", "Sorry, I can't connect. Please check that you are connected to the internet and try again", null);
    }
}

function updateCallback() {
    if (updateAjax.readyState != 4) {        
    }
    if (updateAjax.readyState == 4) {        
        webversion = updateAjax.responseText;
        if (version == webversion) {
            alert('Your version is ' + version + '\nThe most up-to-date version is ' + webversion + '\nNo update is available.');
        }
        else {
            alert('Your version is ' + version + '\nThe most up-to-date version is ' + webversion + '\nAn update is available at www.tomforth.co.uk/mymp.');
        }
    }
} 

//Displays the About view
function showAboutView(){
    aboutLabel.setText('<p>I wrote this program in my spare time and it is provided free of charge and without guarantee. Details on MPs update automatically but the list of MPs requires an application update, if information appears outdated make sure to check for an update.</p><p>If you have any feedback or suggestions, or if you just want to say hi, please email me at thomas.forth@gmail.com. If you really like the software, you could even leave me a tip at www.tomforth.co.uk so I can keep improving it.</p><p>This app relies on, but is not a product of, the volunteer-run site, www.theyworkforyou.com and the people at mysociety.org.</p><p align="center"><a OnClick="javascript:openmysociety();"><img width ="60%" src="img/mysocietylogo.png"></a><br/><br/><a OnClick="javascript:opentheyworkforyou();"><img width ="60%" src="img/twfylogobig.png"><p>If you value the work that mysociety do please think about making a donation (press the image above).</p><p>This Widget includes software licensed from Nokia &copy 2008</p>');
    menu.setRightSoftkeyLabel("Ok", firstRun);
	uiManager.setView(aboutView);
}

function openmysociety() {
    widget.openURL("http://www.mysociety.org/donate");
}

function opentheyworkforyou() {
    widget.openURL("http://theyworkforyou.com/");
}