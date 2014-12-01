/* Useful static utilties for searching and using the
 * data we have
 */
define({

  /* Searches the given list of landmarks for one with the given name.
   * This will return the first valid result found, or null if nothing has
   * been found.
   */
  findData: function (list, val) {
    var i,
        len = list.length;

    for (i = 0; i < len; i++) {
      if (list[i].properties && list[i].properties.name === val) {
        return list[i];
      }
    }

    return null;
  },

  /* Searches the given list of landmarks for ones with the given type.
   * This will return a list of results
   */
  findDataByType: function (list, type) {
    var results = [],
        i;

    for (i = 0; i < list.length; i++) {
      if (list[i].properties && list[i].properties.type === type) {
        results.push(list[i]);
      }
    }

    return results;
  },

  /* Returns a list of lists of landmarks, creates a list of names
   * to be used with as autocompletion names in the search bar
   */
  getAutoCompleteNames: function (datasets) {
    var names = [],
        numDatasets = datasets.length,
        datasetLen,
        i, j;

    for (i = 0; i < numDatasets; ++i) {

      datasetLen = datasets[i].length;

      for (j = 0; j < datasetLen; ++j) {
        if (datasets[i][j].properties && datasets[i][j].properties.name) {
          names.push(datasets[i][j].properties.name);
        }
      }
    }

    return names;
  },

  /* Converts the coordinates from the database
   * to a form that Leaflet understands 
   */
  geoJSONToLeaflet: function (points) {
    return points.map(function (e) {
      return [e[1], e[0]];
    });
  }
});