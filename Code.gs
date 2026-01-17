function doGet() {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('Gulf Way | WPS Dashboard')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Inclusion helper for splitting HTML into multiple files if needed 
 * (Optional for GAS projects)
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}
