import external from '../../externalModules.js';
import { getOptions } from './options.js';

function downloadImage(url, options, imageId, headers, params, resolve, reject) {
  var xhr = new XMLHttpRequest();
  xhr.open('get', url, true);
  xhr.responseType = 'arraybuffer';
  options.beforeSend(xhr, imageId);
  Object.keys(headers).forEach(function (key) {
    xhr.setRequestHeader(key, headers[key]);
  });

  params.deferred = {
    resolve: resolve,
    reject: reject
  };
  params.url = url;
  params.imageId = imageId;

  // Event triggered when downloading an image starts
  xhr.onloadstart = function (event) {
    // already hit console.log(event);
    // Action
    if (options.onloadstart) {
      options.onloadstart(event, params);
    }

    // Event
    var eventData = {
      url: url,
      imageId: imageId
    };

    cornerstone.triggerEvent(cornerstone.events, 'cornerstoneimageloadstart', eventData);
  };

  // Event triggered when downloading an image ends
  xhr.onloadend = function (event) {
    // Action
    if (options.onloadend) {
      options.onloadend(event, params);
    }

    var eventData = {
      url: url,
      imageId: imageId
    };

    // Event
    cornerstone.triggerEvent(cornerstone.events, 'cornerstoneimageloadend', eventData);
  };
  // handle response data
  xhr.onreadystatechange = function (event) {
    // Action
    if (options.onreadystatechange) {
      options.onreadystatechange(event, params);

      return;
    }

    // Default action
    // TODO: consider sending out progress messages here as we receive the pixel data
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        resolve(xhr.response, xhr);
      } else {
        // request failed, reject the Promise
        reject(xhr);
      }
    }
  };

  // Event triggered when downloading an image progresses
  xhr.onprogress = function (oProgress) {
    // console.log('progress:',oProgress)
    var loaded = oProgress.loaded; // evt.loaded the bytes browser receive
    var total = void 0;
    var percentComplete = void 0;

    if (oProgress.lengthComputable) {
      total = oProgress.total; // evt.total the total bytes seted by the header
      percentComplete = Math.round(loaded / total * 100);
    }

    // Action
    if (options.onprogress) {
      options.onprogress(oProgress, params);
    }

    // Event
    var eventData = {
      url: url,
      imageId: imageId,
      loaded: loaded,
      total: total,
      percentComplete: percentComplete
    };

    cornerstone.triggerEvent(cornerstone.events, 'cornerstoneimageloadprogress', eventData);
  };

  xhr.send();
}

function xhrRequest (url, imageId, headers = {}, params = {}) {
  const { cornerstone } = external;
  const options = getOptions();

  // @todo move these options to user based flags for localcache and preventRedirect for IE only
  var useLocalCache = false;
  if (typeof window.AppConfig !== 'undefined' && typeof window.AppConfig.userEnableLocalCache !== 'undefined' && userEnableLocalCache) {
    useLocalCache = true;
  }
  var preventRedirectCORS = false;

  // Make the request for the DICOM P10 SOP Instance
  return new Promise((resolve, reject) => {
    // don't use local cache or prevent redirect in cors
    // this is the old behavior in cornerstone
    if (!useLocalCache && !preventRedirectCORS) {
      downloadImage(url, options, imageId, headers, params, resolve, reject);
      return;
    }
    // get the target url after redirects, and process the url to strip query string etc
    var xhrTargetUrl = new XMLHttpRequest();
    xhrTargetUrl.open('HEAD', url);
    try {
      xhrTargetUrl.onload = function () {
        var responseUrl = xhrTargetUrl.responseURL;
        responseUrl = responseUrl.split(/[?#]/)[0];
        var responseUrlArray = responseUrl.split(/[/]/);
        var localUrl = responseUrlArray[4] + '/' + responseUrlArray[5] + '/' + responseUrlArray[6];
        //////////////////////////////////////////////////////////////////////
        if (!useLocalCache) {
          downloadImage(url, options, imageId, headers, params, resolve, reject);
          return;
        }
        var xhrLocal = new XMLHttpRequest();
        var localCacheUrl = 'https://cache.zulucare.com:8778/local-cache/' + localUrl;
        xhrLocal.open('HEAD', localCacheUrl);
        xhrLocal.onerror = function (e) {
          window.console && console.log('localcache: server not found or image not cached yet: ' + localCacheUrl);
          downloadImage(url, options, imageId, headers, params, resolve, reject);
        }
        xhrLocal.onload = function (e) {
          // console.log('local cache hit for ' + localCacheUrl);
          if (e.target.status === 200) {
            downloadImage(localCacheUrl, options, imageId, headers, params, resolve, reject);
          } else {
            downloadImage(url, options, imageId, headers, params, resolve, reject);
          }
        };
        try {
          xhrLocal.send(null);
        } catch (exception) {
          // check for a network error here and disable cache check for some time
        }
        //////////////////////////////////////////////////////////////////////
      };
      xhrTargetUrl.send(null);
      ///////////////////////////////////////////////////////////
    } catch (e) {
      // issues checking for the local cache hit, ignore for now
    }

    var xhr = new XMLHttpRequest();
    xhr.open('get', url, true);
    xhr.responseType = 'arraybuffer';
    options.beforeSend(xhr, imageId, headers, params);
    Object.keys(headers).forEach(function (key) {
      xhr.setRequestHeader(key, headers[key]);
    });

    params.deferred = {
      resolve,
      reject
    };
    params.url = url;
    params.imageId = imageId;

    // Event triggered when downloading an image starts
    xhr.onloadstart = function (event) {
      // Action
      if (options.onloadstart) {
        options.onloadstart(event, params);
      }

      // Event
      const eventData = {
        url,
        imageId
      };

      cornerstone.triggerEvent(cornerstone.events, 'cornerstoneimageloadstart', eventData);
    };

    // Event triggered when downloading an image ends
    xhr.onloadend = function (event) {
      // Action
      if (options.onloadend) {
        options.onloadend(event, params);
      }

      const eventData = {
        url,
        imageId
      };

      // Event
      cornerstone.triggerEvent(cornerstone.events, 'cornerstoneimageloadend', eventData);
    };

    // handle response data
    xhr.onreadystatechange = function (event) {
      // Action
      if (options.onreadystatechange) {
        options.onreadystatechange(event, params);

        return;
      }

      // Default action
      // TODO: consider sending out progress messages here as we receive the pixel data
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          resolve(xhr.response, xhr);
        } else {
          // request failed, reject the Promise
          reject(xhr);
        }
      }
    };

    // Event triggered when downloading an image progresses
    xhr.onprogress = function (oProgress) {
      // console.log('progress:',oProgress)
      const loaded = oProgress.loaded; // evt.loaded the bytes browser receive

      let total;

      let percentComplete;

      if (oProgress.lengthComputable) {
        total = oProgress.total; // evt.total the total bytes seted by the header
        percentComplete = Math.round((loaded / total) * 100);
      }

      // Action
      if (options.onprogress) {
        options.onprogress(oProgress, params);
      }

      // Event
      const eventData = {
        url,
        imageId,
        loaded,
        total,
        percentComplete
      };

      cornerstone.triggerEvent(cornerstone.events, 'cornerstoneimageloadprogress', eventData);
    };

    xhr.send();
  });
}

export default xhrRequest;
