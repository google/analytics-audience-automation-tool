# Google Analytics Audience Automation Tool

In Google Analytics 360 when creating an audience you can only link this to
[10 destinations](https://support.google.com/analytics/answer/2611404?hl=en).
This makes the process very manual and repetitive when a client has many
destinations, as a different audience needs to be created for each batch of 10
destinations.

This is an app script solution designed to solve this challenge.

## Steps

1.  User creates an audience in the UI.
2.  User copies the URL to a trix.
3.  User list the destination IDs to copy the audience to.
4.  User runs `runAudienceCreator()`, which:
    1.  Extracts the audience ID from the URL.
    2.  Fetches that audience from the API.
    3.  Fetches the destinations from the trix.
    4.  Creates a copy of the original audience for each batch of 10
        destinations.
    5.  Stores outputs in trix.

_(Optionally)_ the `deleteAudiencesInLog()` method can be used to delete all
audiences logged in the output.
## Initial Set Up

1.  Create a copy of the
    [template trix](https://docs.google.com/spreadsheets/d/1d-THaFWEmPxtipQFUu9Xiyf9yFosw0RXpc6PS8nqB7o/edit#gid=0).
2.  Go to Tools -> Script Editor to open the App Script Editor.
3.  Create a new script file and copy the content of app_script.js to this.
4.  Go to Resources -> Cloud Platform Project and add your Google Cloud Project.
5.  In your Google Cloud Project enable the
    [Google Analytics API](https://console.cloud.google.com/apis/api/analytics.googleapis.com).
6.  Go to Resources -> Advanced Google Services -> Enable the "Google Analytics
    API".

## Usage

1.  Create an audience in the Google Analytics UI.
2.  Copy the URL to that audience to cell A2 in the Config sheet.
3.  List the destination IDs in column B.
4.  Select the type of destination in column C.
5.  Press the "Create Audiences" button.
