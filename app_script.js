/**
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Create a Google Analytics Audience once in the UI & copy it to multiple
 * destinations.
 *
 * For more information about the API calls in this file, see the documentation:
 * https://developers.google.com/analytics/devguides/config/mgmt/v3/mgmtReference
 */
const URL_NAMED_RANGE = 'gaAudienceURL';
const DESTINATION_SHEET_NAME = 'Destinations';
const DESTINATION_LOG_RANGE = 'A2:Z';
const CONFIG_SHEET_NAME = 'Config';
const LOG_SHEET_NAME = 'Log';
const LOG_SHEET_RANGE = 'A2:Z';

// Google Analytics limits the number of destinations an audience can have to
// 10. Therefore our audience list needs to be chunked into groups of 10. See
// the docs for more information:
// https://support.google.com/analytics/answer/2611404?hl=en
const DESTINATION_BATCH_SIZE = 10;

/**
 * The entry point to the scripts. This provides the orchestration to create the
 * audiences.
 */
function runAudienceCreator() {
  Logger.log('Running audience creator...');

  clearGoogleSheet(LOG_SHEET_NAME, LOG_SHEET_RANGE);

  const gaUiUrl = getUrlFromSheet();
  const accountId = extractAccountIdFromUrl(gaUiUrl);
  const audienceId = extractAudienceIdFromUrl(gaUiUrl);
  const internalWebPropertyId = extractInternalWebPropertyIdFromUrl(gaUiUrl);
  const audience = getAudienceWithId(
    accountId, audienceId, internalWebPropertyId);
  const audienceName = audience['name'];

  Logger.log('-Using base audience: ' + audienceName);
  Logger.log(audience);

  const destinations = getDestinations();
  const chunks = chunkArray(destinations, DESTINATION_BATCH_SIZE);

  for (const [i, batch] of chunks.entries()) {
    // i is 0 based so bump by 1 to make more human readable when naming new
    //audiences
    modifyAudienceNameAndAccounts(audience, i+1, batch, audienceName);
    Logger.log('-Creating audience:');
    Logger.log(audience);
    const response = Analytics.Management.RemarketingAudience.insert(
        audience, audience['accountId'], audience['webPropertyId']);

    Logger.log('-Response:');
    Logger.log(response);
    logResponseToSheet(response, batch);
  }

  setActiveSheetByName(LOG_SHEET_NAME);
  Logger.log('Done.');
}

/**
 * Split an array into smaller chunks.
 * The process uses splice to create the chunks. This means that the arr
 * parameter will be completely emptied by this method.
 * @param {!Array<?>} arr: the array to chunk.
 * @param {number} chunk_size: the size of the chunks.
 * @return {!Array<?Array>}: an array containing each of the chunks.
 */
function chunkArray(arr, chunk_size) {
  const chunked = [];
  while(arr.length) {
    chunked.push(arr.splice(0, chunk_size));
  }
  return chunked;
}

/**
 * Set the active sheet by name.
 * @param {string} name: the name of the sheet
 */
function setActiveSheetByName(name) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  spreadsheet.setActiveSheet(spreadsheet.getSheetByName(name));
}

/**
 * Get the URL from the sheet
 * @return {!Object}: the url.
 */
function getUrlFromSheet() {
  return SpreadsheetApp.getActiveSpreadsheet().getRangeByName(
    URL_NAMED_RANGE).getValue();
}

/**
 * Extracts the audience ID from the Google Analytics UI url.
 * @param {string} url: the url to read the audience ID from.
 * @return {string}: the audience ID if found, else null;
 */
function extractAudienceIdFromUrl(url) {
  const pattern = /m-content\.key=([^&]+)/;
  return extractPatternFromUrl(url, pattern);
}

/**
 * Extracts the account ID from the Google Analytics UI url.
 * @param {string} url: the url to read the account ID from.
 * @return {string}: the account ID if found, else null;
 */
function extractAccountIdFromUrl(url) {
  const pattern = /a(\d*)w\d*p\d*/;
  return extractPatternFromUrl(url, pattern);
}

/**
 * Extracts the internal Web Property ID from the Google Analytics UI url.
 * @param {string} url: the url to read the account ID from.
 * @return {string}: the internal web property ID if found, else null;
 */
function extractInternalWebPropertyIdFromUrl(url) {
  const pattern = /a\d*w(\d*)p\d*/;
  return extractPatternFromUrl(url, pattern);
}

/**
 * Given the regex pattern, return the first match in the url.
 * @param {string} url: the url to use.
 * @param {!RegExp} pattern: the regex patten to use.
 * @return {string}: the first regex match if found, else null;
 */
function extractPatternFromUrl(url, pattern) {
  const match = pattern.exec(url);
  if (match) {
    return match[1];
  }
  return null;
}

/**
 * Build the audience URL based on the original url input.
 * Replace the m-content-key with the updated ID
 * @param {string} url: an example url.
 * @param {string} audienceId: the new audience ID.
 * @return {string}: the new url.
 */
function buildAudienceUrl(url, audienceId) {
  return url.replace(/(m-content\.key=)[^\&]+/, '$1' + audienceId);
}

/**
 * Returns the remakreting audience specified by the parameters.
 * @param {string} accountId: the account ID.
 * @param {string} audienceId: the audience ID.
 * @param {string} internalWebPropertyId: the internal web property ID.
 * @return {?audience}: the audience if found, else null.
 */
function getAudienceWithId(accountId, audienceId, internalWebPropertyId) {
  const webProperties = Analytics.Management.Webproperties.list(accountId);
  if (webProperties.items) {
    for (const webProperty of webProperties.items) {
      if (webProperty.internalWebPropertyId == internalWebPropertyId) {
        return Analytics.Management.RemarketingAudience.get(
          accountId, webProperty.getId(), audienceId);
      }
    }
  }
  return null;
}

/**
 * Get the destinations from the Google Sheet.
 * @return {!Array<!Array>}: An array containing each row of destinations.
 */
function getDestinations() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName(CONFIG_SHEET_NAME);
  return sheet.getRange('B2:C' + sheet.getLastRow()).getValues();
}

/**
 * Modify the name of the existing audience and update the linked accounts.
 * Updates the name of the audience & updates the destinations.
 * @param {!Object} audience: the audience to modify.
 * @param {!int} batch_number: the batch number of the audience.
 * @param {!Array<!Array>} destinations: the rows containing the destinations.
 * @param {string} name: the original name of the audience.
 */
function modifyAudienceNameAndAccounts(
    audience, batch_number, destinations, name) {
  audience['name'] = name + ': v' + batch_number;
  audience['linkedAdAccounts'] = toAPIDestinationsArray(destinations);
}

/**
 * Turns an array of destinations into the correct JSON format for the API.
 * @param {!rows} destinations: the rows containing the destinations.
 * @return {?Array<?Object>}: the JSON required for the API.
 */
function toAPIDestinationsArray(destinations) {
  return destinations.map(d => {
    return {
      'kind': 'analytics#linkedForeignAccount',
      'type': d[1],
      'linkedAccountId': d[0]
    };
  });
}

/**
 * Turns an array of destinations into the correct format to log to a sheet.
 * @param {!Array<!Array>} destinations: the rows containing the destinations.
 * @return {string}: a comma separated list of destinations.
 */
function formatDestinationsToLog(destinations){
  return destinations.map(d => d[0]).join(', ');
}

/**
 * Clears a range of a Google Sheet.
 * @param {string} sheet_name: the name of the sheet.
 * @param {string} sheet_range: the range to clear.
 */
function clearGoogleSheet(sheet_name, sheet_range) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName(sheet_name);
  sheet.getRange(sheet_range).clear();
}

/**
 * Logs the response from the audience creation to the log sheet.
 * @param {!Object} response: the audience to log out.
 * @param {!Array<!Array>} destinations: the rows containing the destinations.
 */
function logResponseToSheet(response, destinations) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet()
      .getSheetByName(LOG_SHEET_NAME);
  sheet.appendRow([
    response['id'],
    response['accountId'],
    response['webPropertyId'],
    response['name'],
    response['audienceDefinition']['includeConditions']['segment'],
    formatDestinationsToLog(destinations),
    `=HYPERLINK("${buildAudienceUrl(
        getUrlFromSheet(), response['id'])}", "Link")`
  ]);
}

/**
 * Deletes each of the audiences in the log.
 */
function deleteAudiencesInLog() {
  Logger.log('Deleting audiences...');

  const sheet = SpreadsheetApp.getActiveSpreadsheet()
      .getSheetByName(LOG_SHEET_NAME);
  const rows = sheet.getRange(LOG_SHEET_RANGE + sheet.getLastRow()).getValues();

  for (const row of rows) {
    const remarketingAudienceId = row[0];
    const accountId = row[1];
    const webPropertyId = row[2];
    Logger.log('-Deleting audience: ' + remarketingAudienceId);
    Analytics.Management.RemarketingAudience.remove(
        accountId, webPropertyId, remarketingAudienceId);
  }

  clearGoogleSheet(LOG_SHEET_NAME, LOG_SHEET_RANGE);
  setActiveSheetByName(CONFIG_SHEET_NAME);

  Logger.log('Done.');
}

/**
 * Fetch destinations from the Google Analytics account and log output.
 */
function fetchDestinations() {
  clearGoogleSheet(DESTINATION_SHEET_NAME, DESTINATION_LOG_RANGE);
  const accounts = Analytics.Management.Accounts.list();

  if (accounts.items) {
    for (const account of accounts.items) {
      const webProperties = Analytics.Management.Webproperties.list(
        account.getId());

      if (webProperties.items) {
        for (const webProperty of webProperties.items) {
          logDestinationToSheet(account.getId(), webProperty.getId());
        }
      }
    }
  }
}

/**
 * Log all Adwords Links Destinations to a sheet.
 * @param {string} accountId: the account ID
 * @param {string} webPropertyId: the web property ID
 */
function logDestinationToSheet(accountId, webPropertyId) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet()
      .getSheetByName(DESTINATION_SHEET_NAME);

  const adwords_links = Analytics.Management.WebPropertyAdWordsLinks.list(
    accountId,
    webPropertyId
  );

  Logger.log(adwords_links);

  const destinations = adwords_links['items'];

  for (const destination of destinations) {
    const accounts = destination['adWordsAccounts'];
    const webPropertyRef = destination['entity']['webPropertyRef'];
    for (const account of accounts) {
      sheet.appendRow([
        account['customerId'],
        account['kind'],
        webPropertyRef['name'],
        webPropertyRef['id']
      ]);
    }
  }
}
