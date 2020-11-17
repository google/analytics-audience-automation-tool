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
 * Run all tests in the project.
 */
function runAllTests() {
  Logger.log('Running all tests...');
  test_extractAudienceIdFromUrl();
  test_extractAccountIdFromUrl();
  test_extractInternalWebPropertyIdFromUrl();
  test_buildAudienceUrl();
  test_chunkArray();
  Logger.log('Done');
}

/**
 * Build a test URL with a particular key.
 * @param {string} key: the key to use in the URL.
 * @return {string}: the url.
 */
function buildUrlWithKey(key) {
  return buildUrl(key, '111111111', '222222222');
}

/**
 * Build a test URL with a particular account ID.
 * @param {string} accountId: the account ID to use in the URL.
 * @return {string}: the url.
 */
function buildUrlWithAccountId(accountId) {
  return buildUrl('12345', accountId, '222222222');
}

/**
 * Build a test URL with a particular internal web property ID.
 * @param {string} webPropertyId: the web property ID to use in the URL.
 * @return {string}: the url.
 */
function buildUrlWithInternalWebPropertyId(webPropertyId) {
  return buildUrl('12345', '111111111', webPropertyId);
}

/**
 * Build a test URL with a particular key & account ID.
 * @param {string} key: the key to use in the URL.
 * @param {string} accountId: the account ID to use in the URL.
 * @return {string}: the url.
 */
function buildUrl(key, accountId, webPropertyId) {
  return `https://analytics.google.com/analytics/web/#/` +
            `a${accountId}w${webPropertyId}p333333333/admin/audience-lists/` +
            `m-content.mode=EDIT&m-content.key=${key}` +
            `&m-content-audienceListsTabContainer.rowShow=10` +
            `&m-content-audienceListsTabContainer.rowStart=0` +
            `&m-content-audienceListsTabContainer.sortColumnId=name` +
            `&m-content-audienceListsTabContainer.sortDescending=false`;
}

/**
 * Checks the arguments are equal and if not, logs an error message.
 * @param {*} actual: the actual value.
 * @param {*} expected: the expected value.
 * @param {string} errorMsg: the message to show if they don't match.
 */
function assertEqual(actual, expected, errorMsg) {
  const equal = actual === expected;
  if (!equal) {
    const logOutput = `[ERROR] Actual: ${actual}
Expected: ${expected}
Msg: ${errorMsg}`;
    Logger.log(logOutput);
  }
}

/**
 * Test the extractAudienceIdFromUrl() method.
 */
function test_extractAudienceIdFromUrl() {
  const key = 'aBcDe12345';
  const url = buildUrlWithKey(key);
  let audienceId = extractAudienceIdFromUrl(url);
  assertEqual(audienceId, key, 'Audience ID is not correct.');
  const badUrl = 'https://analytics.google.com/analytics/web/#/' +
            'a111111111w11111111p111111111/admin/audience-lists/' +
            '&m-content-audienceListsTabContainer.rowShow=10';
  audienceId = extractAudienceIdFromUrl(badUrl);
  assertEqual(audienceId, null, 'Function not handling missing query param.');
}

/**
 * Test the extractAccountIdFromUrl() method.
 */
function test_extractAccountIdFromUrl() {
  const realAccountId = '111222333';
  const url = buildUrlWithAccountId(realAccountId);
  const accountId = extractAccountIdFromUrl(url);
  assertEqual(accountId, realAccountId, 'Account ID is not correct.');
}

/**
 * Test the extractInternalWebPropertyIdFromUrl() method.
 */
function test_extractInternalWebPropertyIdFromUrl() {
  const realWebPropertyId = '444555666';
  const url = buildUrlWithInternalWebPropertyId(realWebPropertyId);
  const webPropertyId = extractInternalWebPropertyIdFromUrl(url);
  assertEqual(
    webPropertyId, realWebPropertyId, 'Web Property ID is not correct.');
}

/**
 * Test the buildAudienceUrl() method.
 */
function test_buildAudienceUrl() {
  const oldKey = 'aBcDe12345';
  const newKey = 'ZzZzZzYyXx111';
  const originalUrl = buildUrlWithKey(oldKey);
  const expectedURL = buildUrlWithKey(newKey);
  const url = buildAudienceUrl(originalUrl, newKey);
  assertEqual(url, expectedURL, 'New URL is incorrect.');
  assertEqual(url.indexOf(oldKey), -1, 'Old key is present.');
  assertEqual(url.indexOf(newKey) >= 0, true, 'New key is not present.');
}

/**
 * Test the chunkArray() method.
 */
function test_chunkArray() {
  const arr = [1,2,3,4,5,6,7,8,9,10,11];
  const chunked = chunkArray(arr, 5);
  assertEqual(chunked.length, 3, 'Incorrect number of chunks.');
  assertEqual(chunked[0][0], 1, 'Chunk [0][0] incorrect.');
  assertEqual(chunked[0][1], 2, 'Chunk [0][1] incorrect.');
  assertEqual(chunked[0][4], 5, 'Chunk [0][4] incorrect.');
  assertEqual(chunked[2][0], 11, 'Chunk [2][0] incorrect.');
}
