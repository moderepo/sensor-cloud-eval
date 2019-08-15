const DEFAULT_BRAND_ID = 'MODE';
process.env.RELEASE = 1.0;

module.exports = function() {
    // Local app config setting is overridden by npm config
    const path = process.env.npm_package_config_appConfigPath;
    if (path) {
      console.log('Local appConfigPath is specified, so environment values(BRAND_ID and RELEASE) are ignored.');
      return require(path);
    }
  
    let brandId = process.env.BRAND_ID;
    if ((brandId === undefined)) {
      brandId = DEFAULT_BRAND_ID;
    }
    console.log('Using brandId "%s" for app_config', brandId);
    const release = process.env.RELEASE;
    if ((release === undefined)) {
      // eslint-disable-next-line no-throw-literal
      throw 'No valid RELEASE is specified.';
    }
    console.log('Using release "%s" for app_config', release);
  
    return release;
  }();